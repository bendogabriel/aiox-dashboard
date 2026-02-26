import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <GlassCard
      variant="subtle"
      padding="lg"
      className={cn('flex flex-col items-center justify-center text-center', className)}
      animate={false}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </GlassCard>
  );
}
