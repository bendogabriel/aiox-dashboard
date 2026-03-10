/**
 * Edge Function: marketplace-webhook
 * Story 6.1 — Processes Stripe webhook events
 *
 * Events handled:
 * - checkout.session.completed — activate order, create escrow transaction
 * - invoice.paid — renew subscription
 * - charge.refunded — process refund, update escrow
 * - customer.subscription.deleted — cancel subscription order
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify webhook signature
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[Webhook] Event: ${event.type}, ID: ${event.id}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// Event Handlers
// ============================================================

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata || {};
  const { listing_id, buyer_id, seller_id, order_type } = metadata;

  if (!listing_id) {
    console.error('[Webhook] Missing listing_id in session metadata');
    return;
  }

  // Find the pending order by stripe_payment_id
  const { data: order, error } = await supabase
    .from('marketplace_orders')
    .select('*')
    .eq('stripe_payment_id', session.id)
    .single();

  if (error || !order) {
    console.error('[Webhook] Order not found for session:', session.id);
    return;
  }

  // Activate the order
  const now = new Date().toISOString();
  const escrowReleaseAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days

  await supabase
    .from('marketplace_orders')
    .update({
      status: 'active',
      started_at: now,
      escrow_status: 'held',
      escrow_release_at: escrowReleaseAt,
      stripe_subscription_id: session.subscription || null,
    })
    .eq('id', order.id);

  // Create escrow_hold transaction
  await supabase.from('marketplace_transactions').insert({
    order_id: order.id,
    type: 'escrow_hold',
    amount: order.subtotal,
    currency: order.currency,
    stripe_id: session.payment_intent || session.id,
    status: 'completed',
    description: `Escrow hold for order ${order.id}`,
    metadata: { listing_id, buyer_id, seller_id },
  });

  // Create platform_fee transaction
  if (order.platform_fee > 0) {
    await supabase.from('marketplace_transactions').insert({
      order_id: order.id,
      type: 'platform_fee',
      amount: order.platform_fee,
      currency: order.currency,
      stripe_id: null,
      status: 'completed',
      description: `Platform commission for order ${order.id}`,
      metadata: {},
    });
  }

  // Increment listing downloads
  await supabase.rpc('increment_listing_downloads', { p_listing_id: listing_id }).catch(() => {
    // Fallback: direct update
    supabase
      .from('marketplace_listings')
      .update({ downloads: (order.listing?.downloads || 0) + 1 })
      .eq('id', listing_id);
  });

  console.log(`[Webhook] Order ${order.id} activated`);
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Find order by subscription ID
  const { data: order } = await supabase
    .from('marketplace_orders')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!order) return;

  // Extend subscription dates
  const periodEnd = invoice.lines?.data[0]?.period?.end;
  if (periodEnd) {
    await supabase
      .from('marketplace_orders')
      .update({
        subscription_end: new Date(periodEnd * 1000).toISOString(),
        status: 'active',
      })
      .eq('id', order.id);
  }

  // Record payment transaction
  await supabase.from('marketplace_transactions').insert({
    order_id: order.id,
    type: 'payment',
    amount: invoice.amount_paid || 0,
    currency: (invoice.currency || 'brl').toUpperCase(),
    stripe_id: invoice.id,
    status: 'completed',
    description: `Subscription renewal for order ${order.id}`,
    metadata: {},
  });

  console.log(`[Webhook] Subscription ${subscriptionId} renewed`);
}

async function handleChargeRefunded(
  supabase: ReturnType<typeof createClient>,
  charge: Stripe.Charge,
) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  // Find order by payment intent
  const { data: orders } = await supabase
    .from('marketplace_orders')
    .select('*')
    .eq('stripe_payment_id', paymentIntentId);

  if (!orders?.length) {
    // Try checkout session ID
    return;
  }

  const order = orders[0];
  const refundAmount = charge.amount_refunded || 0;

  await supabase
    .from('marketplace_orders')
    .update({
      status: 'refunded',
      escrow_status: 'refunded',
    })
    .eq('id', order.id);

  // Record refund transaction
  await supabase.from('marketplace_transactions').insert({
    order_id: order.id,
    type: 'refund',
    amount: refundAmount,
    currency: (charge.currency || 'brl').toUpperCase(),
    stripe_id: charge.id,
    status: 'completed',
    description: `Refund for order ${order.id}`,
    metadata: {},
  });

  console.log(`[Webhook] Order ${order.id} refunded (${refundAmount})`);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  const { data: order } = await supabase
    .from('marketplace_orders')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!order) return;

  await supabase
    .from('marketplace_orders')
    .update({
      status: 'cancelled',
      auto_renew: false,
    })
    .eq('id', order.id);

  console.log(`[Webhook] Subscription ${subscription.id} cancelled`);
}
