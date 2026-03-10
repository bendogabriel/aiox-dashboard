/**
 * ListingDetail — Full agent listing page
 * Story 3.1 — Two-column layout: main content + sticky pricing sidebar
 */
import { useState, lazy, Suspense } from 'react';
import {
  ArrowLeft, Download, Clock, Star, Zap, Shield,
  ChevronRight, ExternalLink, Check, X,
} from 'lucide-react';
import { useMarketplaceStore } from '../../../stores/marketplaceStore';
import { useUIStore } from '../../../stores/uiStore';
import { useListingBySlug, useListingById, useListingReviews, useRatingBreakdown, useRelatedListings } from '../../../hooks/useMarketplaceListing';
import { RatingStars, RatingBreakdown, PriceBadge, SellerBadge, CategoryBadge, AgentCard } from '../shared';
import { formatPrice } from '../shared/PriceBadge';
import { getIconComponent } from '../../../lib/icons';
import type { MarketplaceListing, MarketplaceReview } from '../../../types/marketplace';

// Lazy load markdown renderer
const ReactMarkdown = lazy(() => import('react-markdown'));

// --- Breadcrumb ---
function Breadcrumb({ category, name }: { category: string; name: string }) {
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const setCategory = useMarketplaceStore((s) => s.setCategory);

  return (
    <nav className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted,#666)]">
      <button
        type="button"
        onClick={() => setCurrentView('marketplace' as never)}
        className="hover:text-[var(--color-text-primary,#fff)] transition-colors"
      >
        Marketplace
      </button>
      <ChevronRight size={10} />
      <button
        type="button"
        onClick={() => {
          setCategory(category as never);
          setCurrentView('marketplace' as never);
        }}
        className="hover:text-[var(--color-text-primary,#fff)] transition-colors capitalize"
      >
        {category}
      </button>
      <ChevronRight size={10} />
      <span className="text-[var(--color-text-secondary,#999)] truncate max-w-[200px]">{name}</span>
    </nav>
  );
}

// --- Listing Header ---
function ListingHeader({ listing }: { listing: MarketplaceListing }) {
  const IconComponent = listing.icon ? getIconComponent(listing.icon) : null;

  return (
    <div className="flex items-start gap-4">
      <div className="
        w-16 h-16 flex items-center justify-center shrink-0
        bg-[var(--color-bg-elevated,#1a1a1a)]
        border border-[var(--color-border-default,#333)]
        text-[var(--aiox-lime,#D1FF00)]
      ">
        {IconComponent ? <IconComponent size={28} /> : <span className="text-2xl">🤖</span>}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-mono text-lg font-semibold text-[var(--color-text-primary,#fff)]">
          {listing.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary,#999)] mt-0.5">
          {listing.tagline}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {listing.seller && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-text-secondary,#999)]">
                {listing.seller.display_name}
              </span>
              <SellerBadge verification={listing.seller.verification} showLabel={false} />
            </div>
          )}
          <CategoryBadge category={listing.category} />
          <span className="text-xs font-mono text-[var(--color-text-muted,#666)]">
            v{listing.version}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <RatingStars value={listing.rating_avg} count={listing.rating_count} size="sm" />
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted,#666)]">
            <Download size={10} />
            <span className="font-mono">{listing.downloads}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted,#666)]">
            <Zap size={10} />
            <span className="font-mono">{listing.active_hires} ativos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Capabilities ---
function ListingCapabilities({ capabilities }: { capabilities: string[] }) {
  if (capabilities.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        Capabilities
      </h2>
      <div className="flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <span
            key={cap}
            className="
              inline-flex items-center gap-1.5 px-2.5 py-1
              bg-[var(--color-bg-elevated,#1a1a1a)]
              border border-[var(--color-border-default,#333)]
              text-xs font-mono text-[var(--color-text-secondary,#999)]
            "
          >
            <Check size={10} className="text-[var(--aiox-lime,#D1FF00)]" />
            {cap}
          </span>
        ))}
      </div>
    </section>
  );
}

// --- Screenshots Gallery ---
function ListingScreenshots({ screenshots }: { screenshots: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (screenshots.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        Screenshots
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {screenshots.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(url)}
            className="
              shrink-0 w-48 h-32 overflow-hidden
              border border-[var(--color-border-default,#333)]
              hover:border-[var(--aiox-lime,#D1FF00)]/40
              transition-colors
            "
          >
            <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img src={selected} alt="Screenshot" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </section>
  );
}

// --- Description (Markdown) ---
function ListingDescription({ content }: { content: string }) {
  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        Descricao
      </h2>
      <div className="prose prose-invert prose-sm max-w-none text-[var(--color-text-secondary,#999)] [&_a]:text-[var(--aiox-lime,#D1FF00)] [&_h1]:text-[var(--color-text-primary,#fff)] [&_h2]:text-[var(--color-text-primary,#fff)] [&_h3]:text-[var(--color-text-primary,#fff)] [&_strong]:text-[var(--color-text-primary,#fff)] [&_code]:bg-[var(--color-bg-elevated,#1a1a1a)] [&_code]:px-1 [&_code]:font-mono">
        <Suspense fallback={<div className="animate-pulse h-20 bg-[var(--color-bg-elevated,#1a1a1a)]" />}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Suspense>
      </div>
    </section>
  );
}

// --- SLA Info ---
function ListingSLA({ listing }: { listing: MarketplaceListing }) {
  const hasSLA = listing.sla_response_ms || listing.sla_uptime_pct || listing.sla_max_tokens;
  if (!hasSLA) return null;

  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        SLA
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {listing.sla_response_ms && (
          <div className="p-3 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
            <Clock size={14} className="text-[var(--aiox-lime,#D1FF00)] mb-1" />
            <p className="text-xs font-mono text-[var(--color-text-muted,#666)]">Resposta</p>
            <p className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">
              {listing.sla_response_ms < 1000 ? `${listing.sla_response_ms}ms` : `${(listing.sla_response_ms / 1000).toFixed(1)}s`}
            </p>
          </div>
        )}
        {listing.sla_uptime_pct && (
          <div className="p-3 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
            <Shield size={14} className="text-[var(--aiox-lime,#D1FF00)] mb-1" />
            <p className="text-xs font-mono text-[var(--color-text-muted,#666)]">Uptime</p>
            <p className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">
              {listing.sla_uptime_pct}%
            </p>
          </div>
        )}
        {listing.sla_max_tokens && (
          <div className="p-3 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
            <Zap size={14} className="text-[var(--aiox-lime,#D1FF00)] mb-1" />
            <p className="text-xs font-mono text-[var(--color-text-muted,#666)]">Max Tokens</p>
            <p className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">
              {(listing.sla_max_tokens / 1000).toFixed(0)}K
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// --- Reviews Section ---
function ListingReviews({ listingId }: { listingId: string }) {
  const { data: reviews, isLoading: loadingReviews } = useListingReviews(listingId);
  const { data: breakdown } = useRatingBreakdown(listingId);

  if (loadingReviews) {
    return (
      <section className="space-y-3">
        <div className="h-4 w-24 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
        <div className="h-32 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
      </section>
    );
  }

  const reviewList = reviews?.data ?? [];

  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        Avaliacoes ({reviews?.total ?? 0})
      </h2>

      {/* Rating Breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="mb-4">
          <RatingBreakdown
            breakdown={breakdown}
            total={Object.values(breakdown).reduce((a, b) => a + b, 0)}
          />
        </div>
      )}

      {/* Review List */}
      {reviewList.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted,#666)] font-mono">
          Nenhuma avaliacao ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {reviewList.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: MarketplaceReview }) {
  return (
    <div className="p-3 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RatingStars value={review.rating_overall} size="sm" />
          {review.is_verified_purchase && (
            <span className="text-[10px] font-mono text-[var(--aiox-lime,#D1FF00)] uppercase tracking-wider">
              Compra verificada
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
          {new Date(review.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      {review.title && (
        <p className="text-sm font-semibold text-[var(--color-text-primary,#fff)] mb-1">{review.title}</p>
      )}
      {review.body && (
        <p className="text-xs text-[var(--color-text-secondary,#999)] leading-relaxed">{review.body}</p>
      )}
      {review.seller_response && (
        <div className="mt-2 pl-3 border-l-2 border-[var(--color-border-default,#333)]">
          <p className="text-[10px] font-mono text-[var(--color-text-muted,#666)] uppercase tracking-wider mb-1">
            Resposta do Seller
          </p>
          <p className="text-xs text-[var(--color-text-secondary,#999)]">{review.seller_response}</p>
        </div>
      )}
    </div>
  );
}

// --- Related Agents ---
function RelatedAgents({ category, excludeId }: { category: string; excludeId: string }) {
  const { data } = useRelatedListings(category, excludeId);
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const selectListing = useMarketplaceStore((s) => s.selectListing);

  const listings = data?.data ?? [];
  if (listings.length === 0) return null;

  const handleSelect = (listing: MarketplaceListing) => {
    selectListing(listing.id, listing.slug);
    setCurrentView('marketplace-listing' as never);
  };

  return (
    <section>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
        Agentes Similares
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {listings.map((l) => (
          <AgentCard key={l.id} listing={l} onClick={handleSelect} />
        ))}
      </div>
    </section>
  );
}

// --- Pricing Sidebar ---
function ListingPricing({
  listing,
  onHire,
}: {
  listing: MarketplaceListing;
  onHire: () => void;
}) {
  const price = formatPrice(listing.pricing_model, listing.price_amount, listing.price_currency, listing.credits_per_use);
  const isFree = listing.pricing_model === 'free';

  return (
    <div className="
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      p-4 space-y-4
    ">
      {/* Price */}
      <div>
        <p className="text-2xl font-mono font-bold text-[var(--color-text-primary,#fff)]">
          {price.label}
        </p>
        {price.suffix && (
          <p className="text-xs font-mono text-[var(--color-text-muted,#666)]">{price.suffix}</p>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onHire}
        className="
          w-full py-3 font-mono text-sm uppercase tracking-wider font-semibold
          bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
          hover:bg-[var(--aiox-lime,#D1FF00)]/90
          transition-colors
        "
      >
        {isFree ? 'Instalar Agente' : 'Contratar'}
      </button>

      {/* Quick info */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-border-default,#333)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted,#666)] font-mono">Modelo</span>
          <span className="text-[var(--color-text-secondary,#999)] font-mono">
            {listing.supported_models[0] || 'GPT-4'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted,#666)] font-mono">Tier</span>
          <span className="text-[var(--color-text-secondary,#999)] font-mono">
            {listing.agent_tier === 0 ? 'Orchestrator' : listing.agent_tier === 1 ? 'Master' : 'Specialist'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted,#666)] font-mono">Downloads</span>
          <span className="text-[var(--color-text-secondary,#999)] font-mono">{listing.downloads}</span>
        </div>
        {listing.required_tools.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted,#666)] font-mono">Tools</span>
            <span className="text-[var(--color-text-secondary,#999)] font-mono">{listing.required_tools.length}</span>
          </div>
        )}
      </div>

      {/* Seller card */}
      {listing.seller && (
        <div className="pt-2 border-t border-[var(--color-border-default,#333)]">
          <div className="flex items-center gap-2">
            {listing.seller.avatar_url ? (
              <img src={listing.seller.avatar_url} alt="" className="w-8 h-8 object-cover border border-[var(--color-border-default,#333)]" />
            ) : (
              <div className="w-8 h-8 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] flex items-center justify-center text-xs font-mono text-[var(--color-text-muted,#666)]">
                {listing.seller.display_name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)] truncate">
                {listing.seller.display_name}
              </p>
              <div className="flex items-center gap-1">
                <SellerBadge verification={listing.seller.verification} showLabel />
                <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
                  {listing.seller.total_sales} vendas
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Hire Modal ---
function HireAgentModal({
  listing,
  open,
  onClose,
}: {
  listing: MarketplaceListing;
  open: boolean;
  onClose: () => void;
}) {
  const [taskDesc, setTaskDesc] = useState('');
  const [hours, setHours] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!open) return null;

  const isFree = listing.pricing_model === 'free';
  const price = formatPrice(listing.pricing_model, listing.price_amount, listing.price_currency, listing.credits_per_use);

  const getTotal = () => {
    if (isFree) return 0;
    if (listing.pricing_model === 'hourly') return listing.price_amount * hours;
    return listing.price_amount;
  };

  const total = getTotal();
  const fee = total * 0.15;

  const handleConfirm = async () => {
    setIsProcessing(true);
    // In production: call Stripe Checkout via Edge Function
    // For now: simulate order creation
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose} />
      <div className="
        fixed inset-0 z-50 flex items-center justify-center p-4
      ">
        <div className="
          w-full max-w-md
          bg-[var(--color-bg-base,#050505)]
          border border-[var(--color-border-default,#333)]
          max-h-[80vh] overflow-y-auto
        " onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default,#333)]">
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
              {isFree ? 'Instalar Agente' : 'Contratar Agente'}
            </h2>
            <button type="button" onClick={onClose} className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)]">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Agent summary */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-[var(--aiox-lime,#D1FF00)]">
                {listing.icon ? (() => { const I = getIconComponent(listing.icon); return I ? <I size={18} /> : <span>🤖</span>; })() : <span>🤖</span>}
              </div>
              <div>
                <p className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)]">{listing.name}</p>
                <p className="text-xs text-[var(--color-text-muted,#666)]">{price.formatted}</p>
              </div>
            </div>

            {/* Per Task: task description */}
            {listing.pricing_model === 'per_task' && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
                  Descreva a Task
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="
                    w-full px-3 py-2 text-sm font-mono
                    bg-[var(--color-bg-surface,#0a0a0a)]
                    border border-[var(--color-border-default,#333)]
                    text-[var(--color-text-primary,#fff)]
                    placeholder:text-[var(--color-text-muted,#666)]
                    focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
                    resize-none
                  "
                  placeholder="Descreva o que voce precisa que o agente faca..."
                />
              </div>
            )}

            {/* Hourly: hours selector */}
            {listing.pricing_model === 'hourly' && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1">
                  Horas
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="flex-1 accent-[var(--aiox-lime,#D1FF00)]"
                  />
                  <span className="text-sm font-mono font-semibold text-[var(--color-text-primary,#fff)] w-12 text-right">
                    {hours}h
                  </span>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="space-y-2 pt-3 border-t border-[var(--color-border-default,#333)]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-text-muted,#666)]">Subtotal</span>
                <span className="text-[var(--color-text-secondary,#999)]">
                  {isFree ? 'Gratis' : `R$ ${total.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              {!isFree && (
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-muted,#666)]">Taxa plataforma (15%)</span>
                  <span className="text-[var(--color-text-secondary,#999)]">
                    R$ {fee.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-mono font-semibold pt-2 border-t border-[var(--color-border-default,#333)]">
                <span className="text-[var(--color-text-primary,#fff)]">Total</span>
                <span className="text-[var(--aiox-lime,#D1FF00)]">
                  {isFree ? 'Gratis' : `R$ ${(total + fee).toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || (listing.pricing_model === 'per_task' && !taskDesc.trim())}
              className="
                w-full py-3 font-mono text-sm uppercase tracking-wider font-semibold
                bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
                hover:bg-[var(--aiox-lime,#D1FF00)]/90
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isProcessing ? 'Processando...' : isFree ? 'Instalar' : 'Pagar e Contratar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================
export default function ListingDetail() {
  const { view } = useMarketplaceStore();
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const [hireModalOpen, setHireModalOpen] = useState(false);

  // Load by slug or ID
  const { data: listingBySlug, isLoading: loadingSlug } = useListingBySlug(view.selectedListingSlug);
  const { data: listingById, isLoading: loadingId } = useListingById(
    !view.selectedListingSlug ? view.selectedListingId : null,
  );

  const listing = listingBySlug ?? listingById;
  const isLoading = loadingSlug || loadingId;

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <div className="h-4 w-48 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
            <div className="h-3 w-64 bg-[var(--color-bg-elevated,#1a1a1a)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!listing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <p className="font-mono text-sm text-[var(--color-text-muted,#666)] uppercase tracking-wider">
          Agente nao encontrado
        </p>
        <button
          type="button"
          onClick={() => setCurrentView('marketplace' as never)}
          className="
            px-4 py-2 font-mono text-xs uppercase tracking-wider
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-secondary,#999)]
            hover:border-[var(--aiox-lime,#D1FF00)]/40
            hover:text-[var(--color-text-primary,#fff)]
            transition-colors
          "
        >
          Voltar ao Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Back button + Breadcrumb */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg-base,#050505)] border-b border-[var(--color-border-default,#333)] px-4 py-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentView('marketplace' as never)}
          className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Breadcrumb category={listing.category} name={listing.name} />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          <ListingHeader listing={listing} />
          <ListingDescription content={listing.description} />
          <ListingCapabilities capabilities={listing.capabilities} />
          <ListingScreenshots screenshots={listing.screenshots} />
          <ListingSLA listing={listing} />
          <ListingReviews listingId={listing.id} />
          <RelatedAgents category={listing.category} excludeId={listing.id} />
        </div>

        {/* Pricing Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-14">
            <ListingPricing listing={listing} onHire={() => setHireModalOpen(true)} />
          </div>
        </div>
      </div>

      {/* Hire Modal */}
      <HireAgentModal
        listing={listing}
        open={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
      />
    </div>
  );
}
