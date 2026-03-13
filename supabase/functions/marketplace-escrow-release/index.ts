/**
 * Edge Function: marketplace-escrow-release
 * Story 5.4 — Auto-releases escrow after 5-day hold
 *
 * Designed to run via pg_cron daily:
 *   SELECT cron.schedule('escrow-release', '0 3 * * *',
 *     $$SELECT net.http_post(
 *       'https://{project}.supabase.co/functions/v1/marketplace-escrow-release',
 *       '{}', 'application/json',
 *       ARRAY[net.http_header('Authorization', 'Bearer {service_role_key}')]
 *     )$$
 *   );
 *
 * Query: releases all orders WHERE escrow_status='held' AND escrow_release_at <= now()
 * Creates 'escrow_release' and 'payout' transactions.
 * Triggers Stripe Transfer to seller's Connect account.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all orders with escrow ready to release
    const { data: orders, error } = await supabase
      .from('marketplace_orders')
      .select('*, seller:seller_profiles(*)')
      .eq('escrow_status', 'held')
      .lte('escrow_release_at', new Date().toISOString());

    if (error) {
      console.error('[Escrow] Failed to query orders:', error.message);
      return new Response(JSON.stringify({ error: 'Query failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!orders?.length) {
      return new Response(JSON.stringify({ ok: true, released: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripe: Stripe | null = null;
    if (stripeKey) {
      stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    }

    let released = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Release escrow
        await supabase
          .from('marketplace_orders')
          .update({
            escrow_status: 'released',
            status: order.status === 'active' ? 'completed' : order.status,
            completed_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Create escrow_release transaction
        await supabase.from('marketplace_transactions').insert({
          order_id: order.id,
          type: 'escrow_release',
          amount: order.seller_payout,
          currency: order.currency,
          status: 'completed',
          description: `Escrow released for order ${order.id}`,
          metadata: {},
        });

        // Transfer to seller via Stripe
        const seller = order.seller;
        if (stripe && seller?.stripe_account_id && order.seller_payout > 0) {
          try {
            const transfer = await stripe.transfers.create({
              amount: order.seller_payout,
              currency: order.currency.toLowerCase(),
              destination: seller.stripe_account_id,
              description: `Payout for order ${order.id}`,
              metadata: { order_id: order.id },
            });

            // Record payout transaction
            await supabase.from('marketplace_transactions').insert({
              order_id: order.id,
              type: 'payout',
              amount: order.seller_payout,
              currency: order.currency,
              stripe_id: transfer.id,
              status: 'completed',
              description: `Seller payout for order ${order.id}`,
              metadata: { stripe_transfer_id: transfer.id },
            });
          } catch (stripeErr) {
            console.error(`[Escrow] Stripe transfer failed for order ${order.id}:`, stripeErr);
            // Record pending payout
            await supabase.from('marketplace_transactions').insert({
              order_id: order.id,
              type: 'payout',
              amount: order.seller_payout,
              currency: order.currency,
              status: 'pending',
              description: `Seller payout pending (Stripe transfer failed)`,
              metadata: { error: String(stripeErr) },
            });
          }
        }

        // Update seller total_revenue
        if (seller) {
          await supabase
            .from('seller_profiles')
            .update({
              total_revenue: (seller.total_revenue || 0) + order.seller_payout,
              total_sales: (seller.total_sales || 0) + 1,
            })
            .eq('id', seller.id);
        }

        released++;
        console.log(`[Escrow] Released order ${order.id}, payout: ${order.seller_payout} ${order.currency}`);

      } catch (orderErr) {
        const msg = `Order ${order.id}: ${String(orderErr)}`;
        errors.push(msg);
        console.error(`[Escrow] Error:`, msg);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      total_found: orders.length,
      released,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Escrow] Fatal error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
