import type { ListingStatus } from '../../../types/marketplace';

interface ListingStatusBadgeProps {
  status: ListingStatus;
}

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
  draft: {
    label: 'Rascunho',
    className: 'text-[var(--color-text-muted,#666)] border-[var(--color-border-default,#333)]',
  },
  pending_review: {
    label: 'Aguardando Review',
    className: 'text-[var(--bb-warning,#f59e0b)] border-[var(--bb-warning,#f59e0b)]/30 bg-[var(--bb-warning,#f59e0b)]/10',
  },
  in_review: {
    label: 'Em Review',
    className: 'text-[var(--bb-blue,#0099FF)] border-[var(--bb-blue,#0099FF)]/30 bg-[var(--bb-blue,#0099FF)]/10',
  },
  approved: {
    label: 'Aprovado',
    className: 'text-[#4ADE80] border-[#4ADE80]/30 bg-[#4ADE80]/10',
  },
  rejected: {
    label: 'Rejeitado',
    className: 'text-[var(--bb-error,#EF4444)] border-[var(--bb-error,#EF4444)]/30 bg-[var(--bb-error,#EF4444)]/10',
  },
  suspended: {
    label: 'Suspenso',
    className: 'text-[var(--bb-flare,#ED4609)] border-[var(--bb-flare,#ED4609)]/30 bg-[var(--bb-flare,#ED4609)]/10',
  },
  archived: {
    label: 'Arquivado',
    className: 'text-[var(--color-text-muted,#666)] border-[var(--color-border-default,#333)] bg-[var(--color-bg-subtle,#111)]/50',
  },
};

export function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
  const { label, className } = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center border font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5
        ${className}
      `}
    >
      {label}
    </span>
  );
}
