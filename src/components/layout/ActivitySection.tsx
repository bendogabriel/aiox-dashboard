import { Badge } from '../ui';
import { ChevronDownIcon } from './activity-panel-icons';

// Section Component
interface SectionProps {
  title: string;
  badge?: string;
  expanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export function Section({ title, badge, expanded = true, onToggle, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
            {title}
          </h3>
          {badge && (
            <Badge variant="count" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {onToggle && (
          <div
            className="text-tertiary group-hover:text-secondary"
          >
            <ChevronDownIcon />
          </div>
        )}
      </button>

      {expanded && (
          <div
          >
            {children}
          </div>
        )}
</div>
  );
}

// Empty State
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-none glass-subtle flex items-center justify-center mb-4 text-tertiary">
        {icon}
      </div>
      <p className="text-primary text-sm font-medium">{title}</p>
      <p className="text-tertiary text-xs mt-1 max-w-[200px] leading-relaxed">{description}</p>
    </div>
  );
}
