import { cn } from '../../lib/utils';
import type { SquadType } from '../../types';
import { getSquadTheme, getStatusTheme } from '../../lib/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'squad' | 'status' | 'count' | 'subtle' | 'primary';
  squadType?: SquadType;
  status?: 'online' | 'busy' | 'offline' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

function getStatusBadgeClasses(status: string): string {
  const theme = getStatusTheme(status);
  return cn(theme.bg, theme.text);
}

export function Badge({
  children,
  variant = 'default',
  squadType = 'default',
  status,
  size = 'md',
  className,
  style,
  onClick,
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md whitespace-nowrap';

  const variantClasses = {
    default: 'glass-badge',
    squad: cn('glass-badge border', getSquadTheme(squadType).badge),
    status: cn('glass-badge', status ? getStatusBadgeClasses(status) : ''),
    count: 'bg-[var(--badge-count-bg)] text-[var(--badge-count-text)] min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px]',
    subtle: 'bg-white/5 text-white/60 border border-white/10',
    primary: 'bg-[rgba(209,255,0,0.1)] text-[var(--aiox-lime)] border border-[rgba(209,255,0,0.2)]',
  };

  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
