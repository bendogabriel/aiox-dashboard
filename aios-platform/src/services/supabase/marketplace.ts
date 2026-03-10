/**
 * Supabase Marketplace Service
 * Persistent storage layer for marketplace listings, orders, reviews, etc.
 * Falls back gracefully when Supabase is not configured.
 *
 * PRD: PRD-MARKETPLACE | Story: 1.3
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  SellerProfile,
  MarketplaceListing,
  MarketplaceSubmission,
  MarketplaceOrder,
  MarketplaceReview,
  MarketplaceTransaction,
  MarketplaceDispute,
  MarketplaceFilters,
  MarketplaceListResponse,
  SubmissionReviewStatus,
  OrderStatus,
  DisputeStatus,
  ReviewChecklist,
} from '../../types/marketplace';

const TABLE = {
  sellers: 'seller_profiles',
  listings: 'marketplace_listings',
  submissions: 'marketplace_submissions',
  orders: 'marketplace_orders',
  reviews: 'marketplace_reviews',
  transactions: 'marketplace_transactions',
  disputes: 'marketplace_disputes',
} as const;

// ============================================================
// Helpers
// ============================================================

function isAvailable(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

function emptyList<T>(): MarketplaceListResponse<T> {
  return { data: [], total: 0, offset: 0, limit: 0 };
}

// ============================================================
// Listings
// ============================================================

export async function getListings(
  filters: MarketplaceFilters = {},
): Promise<MarketplaceListResponse<MarketplaceListing>> {
  if (!supabase) return emptyList();

  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from(TABLE.listings)
    .select('*, seller:seller_profiles(*)', { count: 'exact' })
    .eq('status', 'approved');

  // Category filter
  if (filters.category && filters.category !== 'default') {
    query = query.eq('category', filters.category);
  }

  // Pricing model filter
  if (filters.pricing_model?.length) {
    query = query.in('pricing_model', filters.pricing_model);
  }

  // Min rating filter
  if (filters.min_rating) {
    query = query.gte('rating_avg', filters.min_rating);
  }

  // Tags filter (contains any)
  if (filters.tags?.length) {
    query = query.overlaps('tags', filters.tags);
  }

  // Seller verification filter (two-step: fetch seller IDs first)
  if (filters.seller_verification?.length) {
    const { data: sellers } = await supabase
      .from(TABLE.sellers)
      .select('id')
      .in('verification', filters.seller_verification);
    const sellerIds = sellers?.map((s) => s.id) ?? [];
    if (sellerIds.length === 0) {
      return emptyList();
    }
    query = query.in('seller_id', sellerIds);
  }

  // Featured only
  if (filters.featured_only) {
    query = query.eq('featured', true);
  }

  // Full-text search
  if (filters.query?.trim()) {
    query = query.textSearch(
      'name',
      filters.query.trim(),
      { type: 'websearch', config: 'portuguese' },
    );
  }

  // Sorting
  switch (filters.sort_by) {
    case 'top_rated':
      query = query.order('rating_avg', { ascending: false });
      break;
    case 'newest':
      query = query.order('published_at', { ascending: false, nullsFirst: false });
      break;
    case 'price_low':
      query = query.order('price_amount', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price_amount', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('downloads', { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Marketplace] Failed to fetch listings:', error.message);
    return emptyList();
  }

  return {
    data: (data ?? []) as MarketplaceListing[],
    total: count ?? 0,
    offset,
    limit,
  };
}

export async function getListingBySlug(slug: string): Promise<MarketplaceListing | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.listings)
    .select('*, seller:seller_profiles(*)')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as MarketplaceListing;
}

export async function getListingById(id: string): Promise<MarketplaceListing | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.listings)
    .select('*, seller:seller_profiles(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as MarketplaceListing;
}

export async function createListing(
  listing: Partial<MarketplaceListing>,
): Promise<MarketplaceListing | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.listings)
    .insert(listing)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create listing:', error.message);
    return null;
  }
  return data as MarketplaceListing;
}

export async function updateListing(
  id: string,
  updates: Partial<MarketplaceListing>,
): Promise<MarketplaceListing | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.listings)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to update listing:', error.message);
    return null;
  }
  return data as MarketplaceListing;
}

export async function submitForReview(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(TABLE.listings)
    .update({ status: 'pending_review' })
    .eq('id', id);

  if (error) {
    console.error('[Marketplace] Failed to submit for review:', error.message);
    return false;
  }
  return true;
}

export async function getFeaturedListings(limit = 6): Promise<MarketplaceListing[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE.listings)
    .select('*, seller:seller_profiles(*)')
    .eq('status', 'approved')
    .eq('featured', true)
    .order('featured_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as MarketplaceListing[];
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from(TABLE.listings)
    .select('category')
    .eq('status', 'approved');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const cat = (row as { category: string }).category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

// ============================================================
// Seller Profiles
// ============================================================

export async function getSellerProfile(userId: string): Promise<SellerProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.sellers)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as SellerProfile;
}

export async function getSellerBySlug(slug: string): Promise<SellerProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.sellers)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as SellerProfile;
}

export async function createSellerProfile(
  profile: Partial<SellerProfile>,
): Promise<SellerProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.sellers)
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create seller profile:', error.message);
    return null;
  }
  return data as SellerProfile;
}

export async function updateSellerProfile(
  id: string,
  updates: Partial<SellerProfile>,
): Promise<SellerProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.sellers)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to update seller profile:', error.message);
    return null;
  }
  return data as SellerProfile;
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  if (!supabase) return true;

  const { count, error } = await supabase
    .from(TABLE.sellers)
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (error) return false;
  return (count ?? 0) === 0;
}

// ============================================================
// Orders
// ============================================================

export async function createOrder(
  order: Partial<MarketplaceOrder>,
): Promise<MarketplaceOrder | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.orders)
    .insert(order)
    .select('*, listing:marketplace_listings(*), seller:seller_profiles(*)')
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create order:', error.message);
    return null;
  }
  return data as MarketplaceOrder;
}

export async function getMyPurchases(
  buyerId: string,
  params?: { status?: OrderStatus; limit?: number; offset?: number },
): Promise<MarketplaceListResponse<MarketplaceOrder>> {
  if (!supabase) return emptyList();

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  let query = supabase
    .from(TABLE.orders)
    .select('*, listing:marketplace_listings(*), seller:seller_profiles(*)', { count: 'exact' })
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Marketplace] Failed to fetch purchases:', error.message);
    return emptyList();
  }

  return { data: (data ?? []) as MarketplaceOrder[], total: count ?? 0, offset, limit };
}

export async function getMySales(
  sellerId: string,
  params?: { status?: OrderStatus; limit?: number; offset?: number },
): Promise<MarketplaceListResponse<MarketplaceOrder>> {
  if (!supabase) return emptyList();

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  let query = supabase
    .from(TABLE.orders)
    .select('*, listing:marketplace_listings(*)', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Marketplace] Failed to fetch sales:', error.message);
    return emptyList();
  }

  return { data: (data ?? []) as MarketplaceOrder[], total: count ?? 0, offset, limit };
}

export async function getOrderById(id: string): Promise<MarketplaceOrder | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.orders)
    .select('*, listing:marketplace_listings(*), seller:seller_profiles(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as MarketplaceOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: Partial<MarketplaceOrder>,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(TABLE.orders)
    .update({ status, ...extra })
    .eq('id', id);

  if (error) {
    console.error('[Marketplace] Failed to update order status:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Reviews
// ============================================================

export async function getReviewsForListing(
  listingId: string,
  params?: { limit?: number; offset?: number },
): Promise<MarketplaceListResponse<MarketplaceReview>> {
  if (!supabase) return emptyList();

  const limit = params?.limit ?? 10;
  const offset = params?.offset ?? 0;

  const { data, error, count } = await supabase
    .from(TABLE.reviews)
    .select('*', { count: 'exact' })
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Marketplace] Failed to fetch reviews:', error.message);
    return emptyList();
  }

  return { data: (data ?? []) as MarketplaceReview[], total: count ?? 0, offset, limit };
}

export async function createReview(
  review: Partial<MarketplaceReview>,
): Promise<MarketplaceReview | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.reviews)
    .insert(review)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create review:', error.message);
    return null;
  }
  return data as MarketplaceReview;
}

export async function respondToReview(
  reviewId: string,
  response: string,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(TABLE.reviews)
    .update({
      seller_response: response,
      seller_responded_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    console.error('[Marketplace] Failed to respond to review:', error.message);
    return false;
  }
  return true;
}

export async function getRatingBreakdown(
  listingId: string,
): Promise<Record<number, number>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from(TABLE.reviews)
    .select('rating_overall')
    .eq('listing_id', listingId);

  if (error || !data) return {};

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of data) {
    const r = (row as { rating_overall: number }).rating_overall;
    breakdown[r] = (breakdown[r] || 0) + 1;
  }
  return breakdown;
}

// ============================================================
// Submissions
// ============================================================

export async function createSubmission(
  submission: Partial<MarketplaceSubmission>,
): Promise<MarketplaceSubmission | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.submissions)
    .insert(submission)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create submission:', error.message);
    return null;
  }
  return data as MarketplaceSubmission;
}

export async function getSubmissionQueue(
  params?: { limit?: number; offset?: number },
): Promise<MarketplaceListResponse<MarketplaceSubmission>> {
  if (!supabase) return emptyList();

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  const { data, error, count } = await supabase
    .from(TABLE.submissions)
    .select('*, listing:marketplace_listings(*), seller:seller_profiles(*)', { count: 'exact' })
    .in('review_status', ['pending', 'in_review'])
    .order('submitted_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Marketplace] Failed to fetch submission queue:', error.message);
    return emptyList();
  }

  return { data: (data ?? []) as MarketplaceSubmission[], total: count ?? 0, offset, limit };
}

export async function updateSubmissionReview(
  id: string,
  updates: {
    review_status: SubmissionReviewStatus;
    review_notes?: string;
    review_checklist?: ReviewChecklist;
    review_score?: number;
    reviewer_id?: string;
  },
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(TABLE.submissions)
    .update({
      ...updates,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[Marketplace] Failed to update submission review:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Disputes
// ============================================================

export async function createDispute(
  dispute: Partial<MarketplaceDispute>,
): Promise<MarketplaceDispute | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.disputes)
    .insert(dispute)
    .select()
    .single();

  if (error) {
    console.error('[Marketplace] Failed to create dispute:', error.message);
    return null;
  }

  // Freeze escrow on the order
  if (dispute.order_id) {
    await supabase
      .from(TABLE.orders)
      .update({ escrow_status: 'frozen', status: 'disputed' })
      .eq('id', dispute.order_id);
  }

  return data as MarketplaceDispute;
}

export async function getDisputeByOrder(orderId: string): Promise<MarketplaceDispute | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE.disputes)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as MarketplaceDispute;
}

export async function updateDisputeStatus(
  id: string,
  updates: {
    status: DisputeStatus;
    resolution?: string;
    resolved_amount?: number;
    resolved_by?: string;
    seller_responded_at?: string;
  },
): Promise<boolean> {
  if (!supabase) return false;

  const payload: Record<string, unknown> = { ...updates };
  if (updates.status === 'resolved') {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from(TABLE.disputes)
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('[Marketplace] Failed to update dispute:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Transactions
// ============================================================

export async function getTransactionsForOrder(
  orderId: string,
): Promise<MarketplaceTransaction[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE.transactions)
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as MarketplaceTransaction[];
}

export async function getSellerTransactions(
  sellerId: string,
  params?: { limit?: number; offset?: number },
): Promise<MarketplaceListResponse<MarketplaceTransaction>> {
  if (!supabase) return emptyList();

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  const { data, error, count } = await supabase
    .from(TABLE.transactions)
    .select('*, order:marketplace_orders!inner(*)', { count: 'exact' })
    .eq('order.seller_id', sellerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Marketplace] Failed to fetch seller transactions:', error.message);
    return emptyList();
  }

  return { data: (data ?? []) as MarketplaceTransaction[], total: count ?? 0, offset, limit };
}

// ============================================================
// Review Moderation
// ============================================================

export async function flagReview(
  reviewId: string,
  reason: string,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(TABLE.reviews)
    .update({ is_flagged: true, flag_reason: reason })
    .eq('id', reviewId);

  if (error) {
    console.error('[Marketplace] Failed to flag review:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Admin Analytics
// ============================================================

export async function getAdminAnalytics(
  _period: string,
): Promise<{
  gmv: number;
  commissions: number;
  activeListings: number;
  activeSellers: number;
  activeBuyers: number;
  conversionRate: number;
  disputeRate: number;
  avgReviewTime: number;
  pendingReviews: number;
  topListings: { name: string; revenue: number }[];
  topSellers: { name: string; revenue: number }[];
  ratingBreakdown: Record<number, number>;
}> {
  if (!supabase) {
    return {
      gmv: 0, commissions: 0, activeListings: 0, activeSellers: 0,
      activeBuyers: 0, conversionRate: 0, disputeRate: 0,
      avgReviewTime: 0, pendingReviews: 0,
      topListings: [], topSellers: [],
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Active listings count
  const { count: listingCount } = await supabase
    .from(TABLE.listings)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Active sellers count
  const { count: sellerCount } = await supabase
    .from(TABLE.sellers)
    .select('id', { count: 'exact', head: true });

  // Pending reviews count
  const { count: pendingCount } = await supabase
    .from(TABLE.submissions)
    .select('id', { count: 'exact', head: true })
    .in('review_status', ['pending', 'in_review']);

  // Orders for GMV
  const { data: orders } = await supabase
    .from(TABLE.orders)
    .select('subtotal, platform_fee, buyer_id, status')
    .in('status', ['completed', 'active']);

  const gmv = (orders ?? []).reduce((sum, o) => sum + (o.subtotal ?? 0), 0);
  const commissions = (orders ?? []).reduce((sum, o) => sum + (o.platform_fee ?? 0), 0);
  const buyers = new Set((orders ?? []).map((o) => o.buyer_id));

  // Disputes rate
  const { count: disputeCount } = await supabase
    .from(TABLE.disputes)
    .select('id', { count: 'exact', head: true });

  const totalOrders = (orders ?? []).length || 1;
  const disputeRate = (disputeCount ?? 0) / totalOrders;

  // Rating breakdown
  const ratingBreakdown = await getRatingBreakdownGlobal();

  return {
    gmv,
    commissions,
    activeListings: listingCount ?? 0,
    activeSellers: sellerCount ?? 0,
    activeBuyers: buyers.size,
    conversionRate: 0, // Requires view tracking (not yet implemented)
    disputeRate,
    avgReviewTime: 0,
    pendingReviews: pendingCount ?? 0,
    topListings: [], // TODO: aggregate query
    topSellers: [], // TODO: aggregate query
    ratingBreakdown,
  };
}

async function getRatingBreakdownGlobal(): Promise<Record<number, number>> {
  if (!supabase) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const { data, error } = await supabase
    .from(TABLE.reviews)
    .select('rating_overall');

  if (error || !data) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of data) {
    const r = (row as { rating_overall: number }).rating_overall;
    breakdown[r] = (breakdown[r] || 0) + 1;
  }
  return breakdown;
}

// ============================================================
// Aggregated service export
// ============================================================

export const marketplaceService = {
  isAvailable: isAvailable,
  // Listings
  getListings,
  getListingBySlug,
  getListingById,
  createListing,
  updateListing,
  submitForReview,
  getFeaturedListings,
  getCategoryCounts,
  // Sellers
  getSellerProfile,
  getSellerBySlug,
  createSellerProfile,
  updateSellerProfile,
  checkSlugAvailable,
  // Orders
  createOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
  updateOrderStatus,
  // Reviews
  getReviewsForListing,
  createReview,
  respondToReview,
  getRatingBreakdown,
  flagReview,
  // Submissions
  createSubmission,
  getSubmissionQueue,
  updateSubmissionReview,
  // Disputes
  createDispute,
  getDisputeByOrder,
  updateDisputeStatus,
  // Transactions
  getTransactionsForOrder,
  getSellerTransactions,
  // Admin
  getAdminAnalytics,
};
