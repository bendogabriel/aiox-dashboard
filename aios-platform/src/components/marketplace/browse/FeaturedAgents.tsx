/**
 * FeaturedAgents — Featured agents hero section (up to 6 cards)
 * Story 2.4
 */
import { memo } from 'react';
import { Star, Download, Bot } from 'lucide-react';
import { useFeaturedListings } from '../../../hooks/useMarketplace';
import { RatingStars, PriceBadge, SellerBadge } from '../shared';
import { getIconComponent } from '../../../lib/icons';
import type { MarketplaceListing } from '../../../types/marketplace';

interface FeaturedAgentsProps {
  onSelect: (listing: MarketplaceListing) => void;
}

export const FeaturedAgents = memo(function FeaturedAgents({ onSelect }: FeaturedAgentsProps) {
  const { data, isLoading } = useFeaturedListings();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[180px] bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const listings = data?.data ?? [];
  if (listings.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-[var(--aiox-lime,#D1FF00)]" />
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
          Destaques
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <FeaturedCard key={listing.id} listing={listing} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
});

const FeaturedCard = memo(function FeaturedCard({
  listing,
  onClick,
}: {
  listing: MarketplaceListing;
  onClick: (listing: MarketplaceListing) => void;
}) {
  const IconComponent = listing.icon ? getIconComponent(listing.icon) : null;

  return (
    <button
      type="button"
      onClick={() => onClick(listing)}
      className="
        relative w-full text-left h-[180px] overflow-hidden
        bg-[var(--color-bg-elevated,#1a1a1a)]
        border border-[var(--color-border-default,#333)]
        hover:border-[var(--aiox-lime,#D1FF00)]/40
        transition-colors group
        focus:outline-none focus:ring-1 focus:ring-[var(--aiox-lime,#D1FF00)]/50
      "
    >
      {/* Cover image or gradient */}
      {listing.cover_image_url ? (
        <img
          src={listing.cover_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-elevated,#1a1a1a)] to-[var(--color-bg-surface,#0a0a0a)]" />
      )}

      {/* Content overlay */}
      <div className="relative h-full p-4 flex flex-col justify-between">
        {/* Top: Icon + Name */}
        <div className="flex items-start gap-3">
          <div className="
            w-10 h-10 flex items-center justify-center shrink-0
            bg-[var(--aiox-dark,#050505)]/80
            border border-[var(--color-border-default,#333)]
            text-[var(--aiox-lime,#D1FF00)]
          ">
            {IconComponent ? <IconComponent size={20} /> : <Bot size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-sm font-semibold text-[var(--color-text-primary,#fff)] truncate">
              {listing.name}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary,#999)] line-clamp-2 mt-0.5">
              {listing.tagline}
            </p>
          </div>
        </div>

        {/* Bottom: Seller + Rating + Price */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            {listing.seller && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-secondary,#999)]">
                  {listing.seller.display_name}
                </span>
                <SellerBadge verification={listing.seller.verification} showLabel={false} />
              </div>
            )}
            <RatingStars value={listing.rating_avg} count={listing.rating_count} size="sm" />
          </div>
          <PriceBadge
            model={listing.pricing_model}
            amount={listing.price_amount}
            currency={listing.price_currency}
            creditsPerUse={listing.credits_per_use}
          />
        </div>
      </div>
    </button>
  );
});
