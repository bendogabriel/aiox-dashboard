// ============================================================
// Marketplace Types — PRD-MARKETPLACE | Story 1.2
// ============================================================

import type { AgentPersona, AgentCommand, AgentTier, SquadType } from './index';

// --- Enums / Union Types ---

export type SellerVerification = 'unverified' | 'verified' | 'pro' | 'enterprise';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'archived';

export type PricingModel = 'free' | 'per_task' | 'hourly' | 'monthly' | 'credits';

export type OrderType = 'task' | 'hourly' | 'subscription' | 'credits';

export type OrderStatus =
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type EscrowStatus = 'none' | 'held' | 'released' | 'frozen' | 'refunded';

export type SubscriptionPeriod = 'monthly' | 'quarterly' | 'yearly';

export type TransactionType =
  | 'payment'
  | 'refund'
  | 'payout'
  | 'platform_fee'
  | 'escrow_hold'
  | 'escrow_release';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type DisputeReason =
  | 'non_delivery'
  | 'poor_quality'
  | 'not_as_described'
  | 'billing_error'
  | 'other';

export type DisputeStatus = 'open' | 'seller_response' | 'mediation' | 'resolved' | 'escalated';

export type SubmissionReviewStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export type AutoTestStatus = 'pending' | 'running' | 'passed' | 'failed';

/** Maps to SquadType for marketplace categories */
export type MarketplaceCategory = SquadType;

export type MarketplaceSortBy =
  | 'popular'       // downloads DESC
  | 'top_rated'     // rating_avg DESC
  | 'newest'        // published_at DESC
  | 'price_low'     // price_amount ASC
  | 'price_high';   // price_amount DESC

// --- Agent Config (the product being sold) ---

export interface MarketplaceAgentConfig {
  persona?: AgentPersona;
  corePrinciples?: string[];
  commands?: AgentCommand[];
  capabilities?: string[];
  voiceDna?: {
    sentenceStarters?: string[];
    vocabulary?: {
      alwaysUse?: string[];
      neverUse?: string[];
    };
  };
  antiPatterns?: {
    neverDo?: string[];
  };
  integration?: {
    receivesFrom?: string[];
    handoffTo?: string[];
  };
}

// --- Core Entities ---

export interface SellerProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  website: string | null;
  github_url: string | null;
  verification: SellerVerification;
  rating_avg: number;
  review_count: number;
  total_sales: number;
  total_revenue: number;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  commission_rate: number;
  level_grace_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  slug: string;
  // Identity
  name: string;
  tagline: string;
  description: string;
  category: MarketplaceCategory;
  tags: string[];
  icon: string | null;
  cover_image_url: string | null;
  screenshots: string[];
  // Agent Config
  agent_config: MarketplaceAgentConfig;
  agent_tier: AgentTier;
  squad_type: SquadType;
  capabilities: string[];
  supported_models: string[];
  required_tools: string[];
  required_mcps: string[];
  // Pricing
  pricing_model: PricingModel;
  price_amount: number;
  price_currency: string;
  credits_per_use: number | null;
  // SLA
  sla_response_ms: number | null;
  sla_uptime_pct: number | null;
  sla_max_tokens: number | null;
  // Stats
  downloads: number;
  active_hires: number;
  rating_avg: number;
  rating_count: number;
  // Status
  status: ListingStatus;
  rejection_reason: string | null;
  featured: boolean;
  featured_at: string | null;
  // Versioning
  version: string;
  changelog: string | null;
  // Timestamps
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (optional, populated by queries)
  seller?: SellerProfile;
}

export interface ReviewChecklist {
  schema_valid: boolean | null;
  metadata_complete: boolean | null;
  persona_defined: boolean | null;
  commands_documented: boolean | null;
  capabilities_realistic: boolean | null;
  pricing_coherent: boolean | null;
  sandbox_passed: boolean | null;
  security_clean: boolean | null;
  output_quality: boolean | null;
  documentation_adequate: boolean | null;
}

export interface MarketplaceSubmission {
  id: string;
  listing_id: string;
  seller_id: string;
  version: string;
  changelog: string | null;
  agent_bundle: MarketplaceAgentConfig;
  // Auto review
  auto_test_status: AutoTestStatus;
  auto_test_results: Record<string, unknown> | null;
  auto_test_score: number | null;
  // Manual review
  reviewer_id: string | null;
  review_status: SubmissionReviewStatus;
  review_notes: string | null;
  review_checklist: ReviewChecklist;
  review_score: number | null;
  // Timestamps
  submitted_at: string;
  reviewed_at: string | null;
  // Joined
  listing?: MarketplaceListing;
  seller?: SellerProfile;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  listing_id: string;
  seller_id: string;
  // Order type
  order_type: OrderType;
  status: OrderStatus;
  // Task
  task_description: string | null;
  task_deliverables: Record<string, unknown> | null;
  // Hourly
  hours_contracted: number | null;
  hours_used: number;
  hourly_rate: number | null;
  // Subscription
  subscription_period: SubscriptionPeriod | null;
  subscription_start: string | null;
  subscription_end: string | null;
  auto_renew: boolean;
  // Credits
  credits_purchased: number | null;
  credits_remaining: number | null;
  // Financials
  subtotal: number;
  platform_fee: number;
  seller_payout: number;
  currency: string;
  // Escrow
  escrow_status: EscrowStatus;
  escrow_release_at: string | null;
  // Stripe
  stripe_payment_id: string | null;
  stripe_subscription_id: string | null;
  // Agent instance
  agent_instance_id: string | null;
  agent_config_snapshot: MarketplaceAgentConfig | null;
  // Timestamps
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
  // Joined
  listing?: MarketplaceListing;
  seller?: SellerProfile;
}

export interface MarketplaceReview {
  id: string;
  order_id: string;
  listing_id: string;
  reviewer_id: string;
  // Ratings
  rating_overall: number;
  rating_quality: number | null;
  rating_speed: number | null;
  rating_value: number | null;
  rating_accuracy: number | null;
  // Content
  title: string | null;
  body: string | null;
  // Seller response
  seller_response: string | null;
  seller_responded_at: string | null;
  // Moderation
  is_verified_purchase: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MarketplaceTransaction {
  id: string;
  order_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  stripe_id: string | null;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface MarketplaceDispute {
  id: string;
  order_id: string;
  opened_by: string;
  reason: DisputeReason;
  description: string;
  evidence: Array<{ url: string; type: string; description?: string }>;
  status: DisputeStatus;
  resolution: string | null;
  resolved_amount: number | null;
  resolved_by: string | null;
  created_at: string;
  seller_responded_at: string | null;
  resolved_at: string | null;
  // Joined
  order?: MarketplaceOrder;
}

// --- Filter & Query Types ---

export interface MarketplaceFilters {
  query?: string;
  category?: MarketplaceCategory;
  pricing_model?: PricingModel[];
  min_rating?: number;
  tags?: string[];
  seller_verification?: SellerVerification[];
  featured_only?: boolean;
  sort_by?: MarketplaceSortBy;
  offset?: number;
  limit?: number;
}

export interface MarketplaceListResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

// --- UI State Types ---

export type SubmitWizardStep = 1 | 2 | 3 | 4 | 5;

export interface SubmitWizardState {
  currentStep: SubmitWizardStep;
  listingId: string | null; // draft listing ID
  // Step 1: Basic Info
  basicInfo: {
    name: string;
    tagline: string;
    description: string;
    category: MarketplaceCategory;
    tags: string[];
    icon: string;
    cover_image_url: string;
    screenshots: string[];
  };
  // Step 2: Agent Config
  agentConfig: MarketplaceAgentConfig;
  // Step 3: Pricing
  pricing: {
    model: PricingModel;
    amount: number;
    currency: string;
    credits_per_use: number | null;
    sla_response_ms: number | null;
    sla_uptime_pct: number | null;
    sla_max_tokens: number | null;
  };
  // Step 4: Testing (no persisted state — ephemeral sandbox results)
  // Step 5: Review checklist
  preSubmitChecklist: Record<string, boolean>;
  // Validation
  stepValid: Record<SubmitWizardStep, boolean>;
}

export type SellerDashboardTab = 'overview' | 'listings' | 'analytics' | 'payouts';

export interface MarketplaceViewState {
  selectedListingId: string | null;
  selectedListingSlug: string | null;
  selectedOrderId: string | null;
}

// --- Pricing Display Helpers ---

export interface PriceDisplay {
  label: string;       // "R$ 15" or "Gratis"
  suffix: string;      // "/task", "/hora", "/mes", ""
  formatted: string;   // "R$ 15/task" or "Gratis"
}
