import { memo } from 'react';
import { Download } from 'lucide-react';
import type { MarketplaceListing } from '../../../types/marketplace';
import { RatingStars } from './RatingStars';
import { PriceBadge } from './PriceBadge';
import { CategoryBadge } from './CategoryBadge';
import { SellerBadge } from './SellerBadge';
import { getIconComponent } from '../../../lib/icons';

interface AgentCardProps {
  listing: MarketplaceListing;
  onClick?: (listing: MarketplaceListing) => void;
}

export const AgentCard = memo(function AgentCard({ listing, onClick }: AgentCardProps) {
  const IconComponent = listing.icon ? getIconComponent(listing.icon) : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(listing)}
      className="
        w-full text-left
        bg-[var(--color-bg-surface,#0a0a0a)]
        border border-[var(--color-border-default,#333)]
        hover:border-[var(--aiox-lime,#D1FF00)]/40
        transition-colors duration-200
        p-4 flex flex-col gap-3
        focus:outline-none focus:ring-1 focus:ring-[var(--aiox-lime,#D1FF00)]/50
      "
    >
      {/* Header: Icon + Name + Category */}
      <div className="flex items-start gap-3">
        <div className="
          w-10 h-10 flex items-center justify-center shrink-0
          bg-[var(--color-bg-elevated,#1a1a1a)]
          border border-[var(--color-border-default,#333)]
          text-[var(--aiox-lime,#D1FF00)]
        ">
          {IconComponent ? <IconComponent size={20} /> : <span className="text-lg">🤖</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm font-semibold text-[var(--color-text-primary,#fff)] truncate">
            {listing.name}
          </h3>
          <p className="text-xs text-[var(--color-text-muted,#666)] truncate mt-0.5">
            {listing.tagline}
          </p>
        </div>
      </div>

      {/* Seller + Category */}
      <div className="flex items-center gap-2 flex-wrap">
        {listing.seller && (
          <span className="text-xs text-[var(--color-text-secondary,#999)]">
            {listing.seller.display_name}
          </span>
        )}
        {listing.seller && (
          <SellerBadge verification={listing.seller.verification} showLabel={false} />
        )}
        <CategoryBadge category={listing.category} />
      </div>

      {/* Rating + Downloads */}
      <div className="flex items-center justify-between">
        <RatingStars
          value={listing.rating_avg}
          count={listing.rating_count}
          size="sm"
        />
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted,#666)]">
          <Download size={10} />
          <span className="font-mono">{listing.downloads}</span>
        </div>
      </div>

      {/* Price */}
      <div className="pt-2 border-t border-[var(--color-border-default,#333)]">
        <PriceBadge
          model={listing.pricing_model}
          amount={listing.price_amount}
          currency={listing.price_currency}
          creditsPerUse={listing.credits_per_use}
        />
      </div>
    </button>
  );
});
