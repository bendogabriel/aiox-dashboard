/**
 * EscrowBadge — Displays escrow status on order cards
 * Story 5.4
 */
import { Lock, Unlock, Snowflake, RotateCcw, Minus } from 'lucide-react';
import type { EscrowStatus } from '../../../types/marketplace';

const ESCROW_CONFIG: Record<EscrowStatus, {
  label: string;
  icon: typeof Lock;
  className: string;
}> = {
  none: {
    label: 'Sem Escrow',
    icon: Minus,
    className: 'text-[var(--color-text-muted,#666)]',
  },
  held: {
    label: 'Em Escrow',
    icon: Lock,
    className: 'text-[var(--bb-blue,#0099FF)] border-[var(--bb-blue,#0099FF)]/30 bg-[var(--bb-blue,#0099FF)]/10',
  },
  released: {
    label: 'Liberado',
    icon: Unlock,
    className: 'text-[var(--status-success,#4ADE80)] border-[var(--status-success,#4ADE80)]/30 bg-[var(--status-success,#4ADE80)]/10',
  },
  frozen: {
    label: 'Congelado',
    icon: Snowflake,
    className: 'text-[var(--bb-warning,#f59e0b)] border-[var(--bb-warning,#f59e0b)]/30 bg-[var(--bb-warning,#f59e0b)]/10',
  },
  refunded: {
    label: 'Reembolsado',
    icon: RotateCcw,
    className: 'text-[var(--color-text-muted,#666)] border-[var(--color-border-default,#333)]',
  },
};

interface EscrowBadgeProps {
  status: EscrowStatus;
  releaseAt?: string | null;
  size?: 'sm' | 'md';
}

export function EscrowBadge({ status, releaseAt, size = 'sm' }: EscrowBadgeProps) {
  if (status === 'none') return null;

  const config = ESCROW_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1 border font-mono uppercase tracking-wider
      ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}
      ${config.className}
    `}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {config.label}
      {status === 'held' && releaseAt && (
        <span className="text-[8px] normal-case">
          ({daysUntil(releaseAt)}d)
        </span>
      )}
    </span>
  );
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
