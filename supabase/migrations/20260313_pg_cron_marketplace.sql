-- ============================================================
-- pg_cron Jobs for Marketplace Automation
-- PRD-MARKETPLACE | Story 5.4 (Escrow Release) + Story 4.3 (Seller Levels)
-- ============================================================

-- Enable pg_cron extension (already enabled on Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. Escrow Auto-Release (Daily at 3 AM UTC)
-- ============================================================
-- Releases escrow for orders where hold period has expired.
-- Calls the marketplace-escrow-release Edge Function.

SELECT cron.schedule(
  'marketplace-escrow-release',
  '0 3 * * *',  -- Daily at 3:00 AM UTC
  $$
  -- Auto-release held escrow after release_at date
  UPDATE marketplace_orders
  SET
    escrow_status = 'released',
    updated_at = NOW()
  WHERE
    escrow_status = 'held'
    AND escrow_release_at IS NOT NULL
    AND escrow_release_at <= NOW();
  $$
);

-- ============================================================
-- 2. Seller Level Recalculation (Weekly on Mondays at 4 AM UTC)
-- ============================================================
-- Recalculates seller verification levels based on:
-- - unverified: default
-- - verified: >= 10 sales AND rating >= 4.0
-- - pro: >= 50 sales AND rating >= 4.3 AND revenue >= 100000 (centavos)
-- - enterprise: manual only (not auto-promoted)

SELECT cron.schedule(
  'marketplace-seller-level-recalc',
  '0 4 * * 1',  -- Every Monday at 4:00 AM UTC
  $$
  -- Promote unverified → verified
  UPDATE seller_profiles
  SET
    verification = 'verified',
    updated_at = NOW()
  WHERE
    verification = 'unverified'
    AND total_sales >= 10
    AND rating_avg >= 4.0
    AND review_count >= 5;

  -- Promote verified → pro
  UPDATE seller_profiles
  SET
    verification = 'pro',
    commission_rate = 12,
    updated_at = NOW()
  WHERE
    verification = 'verified'
    AND total_sales >= 50
    AND rating_avg >= 4.3
    AND total_revenue >= 100000
    AND (level_grace_until IS NULL OR level_grace_until < NOW());

  -- Demote pro → verified (if fallen below thresholds, with grace period)
  UPDATE seller_profiles
  SET
    verification = 'verified',
    commission_rate = 15,
    level_grace_until = NOW() + interval '30 days',
    updated_at = NOW()
  WHERE
    verification = 'pro'
    AND (total_sales < 30 OR rating_avg < 3.8)
    AND (level_grace_until IS NOT NULL AND level_grace_until < NOW());
  $$
);

-- ============================================================
-- 3. Auto-Resolve Disputes (Daily at 5 AM UTC)
-- ============================================================
-- If seller hasn't responded within 3 days, auto-resolve in buyer's favor.

SELECT cron.schedule(
  'marketplace-dispute-auto-resolve',
  '0 5 * * *',  -- Daily at 5:00 AM UTC
  $$
  -- Auto-resolve open disputes where seller hasn't responded in 3 days
  UPDATE marketplace_disputes
  SET
    status = 'resolved',
    resolution = 'Auto-resolvida: seller nao respondeu no prazo de 3 dias.',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE
    status = 'open'
    AND seller_responded_at IS NULL
    AND created_at < NOW() - interval '3 days';

  -- Refund orders for auto-resolved disputes
  UPDATE marketplace_orders o
  SET
    status = 'refunded',
    escrow_status = 'refunded',
    updated_at = NOW()
  FROM marketplace_disputes d
  WHERE
    d.order_id = o.id
    AND d.status = 'resolved'
    AND d.resolution LIKE 'Auto-resolvida:%'
    AND o.status = 'disputed';
  $$
);

-- ============================================================
-- 4. Cleanup Old Pending Orders (Weekly on Sundays at 2 AM UTC)
-- ============================================================
-- Cancel orders stuck in 'pending' for more than 24 hours (failed checkout).

SELECT cron.schedule(
  'marketplace-cleanup-pending-orders',
  '0 2 * * 0',  -- Every Sunday at 2:00 AM UTC
  $$
  UPDATE marketplace_orders
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND created_at < NOW() - interval '24 hours';
  $$
);
