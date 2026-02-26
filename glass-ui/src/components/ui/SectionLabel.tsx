import { cn } from '../../lib/utils';

export interface SectionLabelProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionLabel({
  children,
  icon,
  action,
  className,
}: SectionLabelProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {children}
        </h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
