/**
 * Edge Function: marketplace-checkout
 * Story 6.1 — Creates Stripe Checkout Session for marketplace orders
 *
 * Supports:
 * - per_task / hourly: one-time payment via Checkout
 * - monthly: Stripe Subscription with automatic billing
 * - credits: one-time payment for credit packs
 * - free: creates order directly without payment
 *
 * Application fee (platform commission) is included in the Checkout Session.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';
import { corsHeaders } from '../_shared/cors.ts';

const COMMISSION_RATES: Record<string, number> = {
  unverified: 0.15,
  verified: 0.15,
  pro: 0.12,
  enterprise: 0.10,
};

interface CheckoutRequest {
  listing_id: string;
  buyer_id: string;
  order_type: 'task' | 'hourly' | 'subscription' | 'credits';
  // Optional fields per order type
  task_description?: string;
  hours_contracted?: number;
  subscription_period?: 'monthly' | 'quarterly' | 'yearly';
  credits_purchased?: number;
  // Return URLs
  success_url: string;
  cancel_url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    const { listing_id, buyer_id, order_type, success_url, cancel_url } = body;

    if (!listing_id || !buyer_id || !order_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch listing with seller
    const { data: listing, error: listingErr } = await supabase
      .from('marketplace_listings')
      .select('*, seller:seller_profiles(*)')
      .eq('id', listing_id)
      .single();

    if (listingErr || !listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const seller = listing.seller;
    if (!seller?.stripe_account_id) {
      return new Response(JSON.stringify({ error: 'Seller has no Stripe account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate amounts
    const { subtotal, platformFee } = calculateAmounts(listing, body, seller.verification);

    // Handle free orders directly
    if (listing.pricing_model === 'free' || subtotal === 0) {
      const order = await createFreeOrder(supabase, listing, buyer_id, body);
      return new Response(JSON.stringify({ ok: true, order_id: order?.id, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: order_type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      line_items: [{
        price_data: {
          currency: listing.price_currency?.toLowerCase() || 'brl',
          product_data: {
            name: listing.name,
            description: listing.tagline || undefined,
            images: listing.cover_image_url ? [listing.cover_image_url] : undefined,
          },
          unit_amount: subtotal,
          ...(order_type === 'subscription' ? {
            recurring: {
              interval: body.subscription_period === 'yearly' ? 'year' as const
                : body.subscription_period === 'quarterly' ? 'month' as const
                : 'month' as const,
              interval_count: body.subscription_period === 'quarterly' ? 3 : 1,
            },
          } : {}),
        },
        quantity: 1,
      }],
      payment_intent_data: order_type !== 'subscription' ? {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
      } : undefined,
      subscription_data: order_type === 'subscription' ? {
        application_fee_percent: COMMISSION_RATES[seller.verification || 'unverified'] * 100,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
      } : undefined,
      metadata: {
        listing_id,
        buyer_id,
        seller_id: seller.id,
        order_type,
        task_description: body.task_description || '',
        hours_contracted: String(body.hours_contracted || 0),
        credits_purchased: String(body.credits_purchased || 0),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create pending order
    const order = {
      buyer_id,
      listing_id,
      seller_id: seller.id,
      order_type,
      status: 'pending',
      task_description: body.task_description || null,
      hours_contracted: body.hours_contracted || null,
      hours_used: 0,
      hourly_rate: order_type === 'hourly' ? listing.price_amount : null,
      subscription_period: body.subscription_period || null,
      auto_renew: order_type === 'subscription',
      credits_purchased: body.credits_purchased || null,
      credits_remaining: body.credits_purchased || null,
      subtotal,
      platform_fee: platformFee,
      seller_payout: subtotal - platformFee,
      currency: listing.price_currency || 'BRL',
      escrow_status: 'none',
      stripe_payment_id: session.id,
      stripe_subscription_id: null,
      agent_config_snapshot: listing.agent_config,
    };

    await supabase.from('marketplace_orders').insert(order);

    return new Response(JSON.stringify({
      ok: true,
      checkout_url: session.url,
      session_id: session.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Checkout error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// Helpers
// ============================================================

function calculateAmounts(
  listing: Record<string, unknown>,
  body: CheckoutRequest,
  sellerVerification: string,
): { subtotal: number; platformFee: number } {
  let subtotal = 0;
  const priceAmount = (listing.price_amount as number) || 0;

  switch (body.order_type) {
    case 'task':
      subtotal = priceAmount;
      break;
    case 'hourly':
      subtotal = priceAmount * (body.hours_contracted || 1);
      break;
    case 'subscription':
      subtotal = priceAmount; // monthly amount
      break;
    case 'credits':
      subtotal = priceAmount * (body.credits_purchased || 1);
      break;
  }

  const commissionRate = COMMISSION_RATES[sellerVerification] || 0.15;
  const platformFee = Math.round(subtotal * commissionRate);

  return { subtotal, platformFee };
}

async function createFreeOrder(
  supabase: ReturnType<typeof createClient>,
  listing: Record<string, unknown>,
  buyerId: string,
  body: CheckoutRequest,
) {
  const order = {
    buyer_id: buyerId,
    listing_id: listing.id,
    seller_id: listing.seller_id,
    order_type: body.order_type || 'task',
    status: 'active',
    subtotal: 0,
    platform_fee: 0,
    seller_payout: 0,
    currency: (listing.price_currency as string) || 'BRL',
    escrow_status: 'none',
    hours_used: 0,
    auto_renew: false,
    agent_config_snapshot: listing.agent_config,
  };

  const { data, error } = await supabase
    .from('marketplace_orders')
    .insert(order)
    .select()
    .single();

  if (error) {
    console.error('Failed to create free order:', error.message);
    return null;
  }
  return data;
}
