-- AIOS Marketplace Schema
-- PRD: PRD-MARKETPLACE | Epic: EPIC-MARKETPLACE | Story: 1.1
-- Date: 2026-03-10

-- ============================================================
-- 1. seller_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  avatar_url        TEXT,
  bio               TEXT,
  company           TEXT,
  website           TEXT,
  github_url        TEXT,
  verification      TEXT NOT NULL DEFAULT 'unverified'
                    CHECK (verification IN ('unverified','verified','pro','enterprise')),
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  total_sales       INTEGER DEFAULT 0,
  total_revenue     DECIMAL(12,2) DEFAULT 0,
  stripe_account_id TEXT,
  stripe_onboarded  BOOLEAN DEFAULT false,
  commission_rate   DECIMAL(4,2) DEFAULT 15.00,
  level_grace_until TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_slug ON seller_profiles(slug);
CREATE INDEX idx_seller_profiles_verification ON seller_profiles(verification);

-- ============================================================
-- 2. marketplace_listings
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  slug              TEXT UNIQUE NOT NULL,
  -- Identity
  name              TEXT NOT NULL,
  tagline           TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL,
  tags              TEXT[] DEFAULT '{}',
  icon              TEXT,
  cover_image_url   TEXT,
  screenshots       TEXT[] DEFAULT '{}',
  -- Agent Configuration
  agent_config      JSONB NOT NULL,
  agent_tier        SMALLINT NOT NULL DEFAULT 2
                    CHECK (agent_tier IN (0, 1, 2)),
  squad_type        TEXT NOT NULL DEFAULT 'default',
  capabilities      TEXT[] DEFAULT '{}',
  supported_models  TEXT[] DEFAULT '{"claude-sonnet-4-6"}',
  required_tools    TEXT[] DEFAULT '{}',
  required_mcps     TEXT[] DEFAULT '{}',
  -- Pricing
  pricing_model     TEXT NOT NULL DEFAULT 'per_task'
                    CHECK (pricing_model IN ('free','per_task','hourly','monthly','credits')),
  price_amount      DECIMAL(10,2) DEFAULT 0,
  price_currency    TEXT DEFAULT 'BRL',
  credits_per_use   INTEGER,
  -- SLA
  sla_response_ms   INTEGER,
  sla_uptime_pct    DECIMAL(5,2),
  sla_max_tokens    INTEGER,
  -- Stats (denormalized)
  downloads         INTEGER DEFAULT 0,
  active_hires      INTEGER DEFAULT 0,
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  -- Status
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending_review','in_review','approved','rejected','suspended','archived')),
  rejection_reason  TEXT,
  featured          BOOLEAN DEFAULT false,
  featured_at       TIMESTAMPTZ,
  -- Versioning
  version           TEXT NOT NULL DEFAULT '1.0.0',
  changelog         TEXT,
  -- Timestamps
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_category ON marketplace_listings(category);
CREATE INDEX idx_listings_pricing ON marketplace_listings(pricing_model);
CREATE INDEX idx_listings_featured ON marketplace_listings(featured) WHERE featured = true;
CREATE INDEX idx_listings_rating ON marketplace_listings(rating_avg DESC);
CREATE INDEX idx_listings_slug ON marketplace_listings(slug);
CREATE INDEX idx_listings_fts ON marketplace_listings
  USING GIN (to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, '')));

-- ============================================================
-- 3. marketplace_submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES seller_profiles(id),
  -- Submission
  version           TEXT NOT NULL,
  changelog         TEXT,
  agent_bundle      JSONB NOT NULL,
  -- Automated Review (Tier 1)
  auto_test_status  TEXT DEFAULT 'pending'
                    CHECK (auto_test_status IN ('pending','running','passed','failed')),
  auto_test_results JSONB,
  auto_test_score   DECIMAL(4,2),
  -- Manual Review (Tier 2)
  reviewer_id       UUID REFERENCES auth.users(id),
  review_status     TEXT NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending','in_review','approved','rejected','needs_changes')),
  review_notes      TEXT,
  review_checklist  JSONB DEFAULT '{
    "schema_valid": null,
    "metadata_complete": null,
    "persona_defined": null,
    "commands_documented": null,
    "capabilities_realistic": null,
    "pricing_coherent": null,
    "sandbox_passed": null,
    "security_clean": null,
    "output_quality": null,
    "documentation_adequate": null
  }'::jsonb,
  review_score      DECIMAL(4,2),
  -- Timestamps
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ
);

CREATE INDEX idx_submissions_listing ON marketplace_submissions(listing_id);
CREATE INDEX idx_submissions_status ON marketplace_submissions(review_status);
CREATE INDEX idx_submissions_seller ON marketplace_submissions(seller_id);

-- ============================================================
-- 4. marketplace_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              UUID NOT NULL REFERENCES auth.users(id),
  listing_id            UUID NOT NULL REFERENCES marketplace_listings(id),
  seller_id             UUID NOT NULL REFERENCES seller_profiles(id),
  -- Order Type
  order_type            TEXT NOT NULL
                        CHECK (order_type IN ('task','hourly','subscription','credits')),
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','in_progress','completed','cancelled','disputed','refunded')),
  -- Task-based
  task_description      TEXT,
  task_deliverables     JSONB,
  -- Hourly-based
  hours_contracted      DECIMAL(6,2),
  hours_used            DECIMAL(6,2) DEFAULT 0,
  hourly_rate           DECIMAL(10,2),
  -- Subscription
  subscription_period   TEXT CHECK (subscription_period IS NULL OR subscription_period IN ('monthly','quarterly','yearly')),
  subscription_start    TIMESTAMPTZ,
  subscription_end      TIMESTAMPTZ,
  auto_renew            BOOLEAN DEFAULT true,
  -- Credits
  credits_purchased     INTEGER,
  credits_remaining     INTEGER,
  -- Financials
  subtotal              DECIMAL(12,2) NOT NULL,
  platform_fee          DECIMAL(12,2) NOT NULL,
  seller_payout         DECIMAL(12,2) NOT NULL,
  currency              TEXT DEFAULT 'BRL',
  -- Escrow
  escrow_status         TEXT DEFAULT 'none'
                        CHECK (escrow_status IN ('none','held','released','frozen','refunded')),
  escrow_release_at     TIMESTAMPTZ,
  -- Stripe
  stripe_payment_id     TEXT,
  stripe_subscription_id TEXT,
  -- Agent Instance
  agent_instance_id     TEXT,
  agent_config_snapshot JSONB,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX idx_orders_status ON marketplace_orders(status);
CREATE INDEX idx_orders_escrow ON marketplace_orders(escrow_status) WHERE escrow_status = 'held';

-- ============================================================
-- 5. marketplace_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES marketplace_orders(id),
  listing_id            UUID NOT NULL REFERENCES marketplace_listings(id),
  reviewer_id           UUID NOT NULL REFERENCES auth.users(id),
  -- Ratings (1-5)
  rating_overall        SMALLINT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_quality        SMALLINT CHECK (rating_quality BETWEEN 1 AND 5),
  rating_speed          SMALLINT CHECK (rating_speed BETWEEN 1 AND 5),
  rating_value          SMALLINT CHECK (rating_value BETWEEN 1 AND 5),
  rating_accuracy       SMALLINT CHECK (rating_accuracy BETWEEN 1 AND 5),
  -- Content
  title                 TEXT,
  body                  TEXT,
  -- Seller Response
  seller_response       TEXT,
  seller_responded_at   TIMESTAMPTZ,
  -- Moderation
  is_verified_purchase  BOOLEAN DEFAULT true,
  is_flagged            BOOLEAN DEFAULT false,
  flag_reason           TEXT,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

CREATE INDEX idx_reviews_listing ON marketplace_reviews(listing_id);
CREATE INDEX idx_reviews_reviewer ON marketplace_reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON marketplace_reviews(rating_overall);

-- ============================================================
-- 6. marketplace_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES marketplace_orders(id),
  type              TEXT NOT NULL
                    CHECK (type IN ('payment','refund','payout','platform_fee','escrow_hold','escrow_release')),
  amount            DECIMAL(12,2) NOT NULL,
  currency          TEXT DEFAULT 'BRL',
  stripe_id         TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  description       TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_transactions_order ON marketplace_transactions(order_id);
CREATE INDEX idx_transactions_type ON marketplace_transactions(type);
CREATE INDEX idx_transactions_status ON marketplace_transactions(status);

-- ============================================================
-- 7. marketplace_disputes
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES marketplace_orders(id),
  opened_by         UUID NOT NULL REFERENCES auth.users(id),
  -- Dispute
  reason            TEXT NOT NULL
                    CHECK (reason IN ('non_delivery','poor_quality','not_as_described','billing_error','other')),
  description       TEXT NOT NULL,
  evidence          JSONB DEFAULT '[]',
  -- Resolution
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','seller_response','mediation','resolved','escalated')),
  resolution        TEXT,
  resolved_amount   DECIMAL(12,2),
  resolved_by       UUID REFERENCES auth.users(id),
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  seller_responded_at TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX idx_disputes_order ON marketplace_disputes(order_id);
CREATE INDEX idx_disputes_status ON marketplace_disputes(status);

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- seller_profiles
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seller profiles"
  ON seller_profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON seller_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON seller_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- marketplace_listings
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved listings"
  ON marketplace_listings FOR SELECT
  USING (
    status = 'approved'
    OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Sellers can insert own listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can update own listings"
  ON marketplace_listings FOR UPDATE
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- marketplace_submissions
ALTER TABLE marketplace_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own submissions"
  ON marketplace_submissions FOR SELECT
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can insert submissions"
  ON marketplace_submissions FOR INSERT
  WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- marketplace_orders
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON marketplace_orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Buyers can create orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Order parties can update"
  ON marketplace_orders FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
  );

-- marketplace_reviews
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON marketplace_reviews FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update own reviews"
  ON marketplace_reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- marketplace_transactions
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON marketplace_transactions FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM marketplace_orders
      WHERE buyer_id = auth.uid()
        OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
    )
  );

-- marketplace_disputes
ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispute parties can view"
  ON marketplace_disputes FOR SELECT
  USING (
    opened_by = auth.uid()
    OR order_id IN (
      SELECT id FROM marketplace_orders
      WHERE seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can open disputes"
  ON marketplace_disputes FOR INSERT
  WITH CHECK (opened_by = auth.uid());

CREATE POLICY "Dispute parties can update"
  ON marketplace_disputes FOR UPDATE
  USING (
    opened_by = auth.uid()
    OR order_id IN (
      SELECT id FROM marketplace_orders
      WHERE seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- 9. Helper Functions
-- ============================================================

-- Function to update listing rating stats when a review is added/updated
CREATE OR REPLACE FUNCTION update_listing_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_listings
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating_overall), 0)
      FROM marketplace_reviews
      WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM marketplace_reviews
      WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_listing_rating
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_rating_stats();

-- Function to update seller stats when an order completes
CREATE OR REPLACE FUNCTION update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE seller_profiles
    SET
      total_sales = total_sales + 1,
      total_revenue = total_revenue + NEW.seller_payout,
      updated_at = now()
    WHERE id = NEW.seller_id;

    UPDATE marketplace_listings
    SET
      downloads = downloads + 1,
      updated_at = now()
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_seller_stats
  AFTER UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats();

-- Function to auto-set updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seller_profiles_updated
  BEFORE UPDATE ON seller_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON marketplace_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
