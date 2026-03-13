import { Shield, ShieldCheck, Crown, Building2 } from 'lucide-react';
import type { SellerVerification } from '../../../types/marketplace';

interface SellerBadgeProps {
  verification: SellerVerification;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const config: Record<SellerVerification, {
  label: string;
  icon: typeof Shield;
  className: string;
}> = {
  unverified: {
    label: 'Novo',
    icon: Shield,
    className: 'text-[var(--color-text-muted,#666)] border-[var(--color-border-default,#333)]',
  },
  verified: {
    label: 'Verificado',
    icon: ShieldCheck,
    className: 'text-[var(--bb-blue,#0099FF)] border-[var(--bb-blue,#0099FF)]/30 bg-[var(--bb-blue,#0099FF)]/10',
  },
  pro: {
    label: 'Pro',
    icon: Crown,
    className: 'text-[var(--aiox-lime,#D1FF00)] border-[var(--aiox-lime,#D1FF00)]/30 bg-[var(--aiox-lime,#D1FF00)]/10',
  },
  enterprise: {
    label: 'Enterprise',
    icon: Building2,
    className: 'text-[var(--bb-warning)] border-[var(--bb-warning)]/30 bg-[var(--bb-warning)]/10',
  },
};

export function SellerBadge({ verification, size = 'sm', showLabel = true }: SellerBadgeProps) {
  const { label, icon: Icon, className } = config[verification];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`
        inline-flex items-center gap-1 border font-mono uppercase tracking-wider
        ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}
        ${className}
      `}
    >
      <Icon size={iconSize} />
      {showLabel && label}
    </span>
  );
}
