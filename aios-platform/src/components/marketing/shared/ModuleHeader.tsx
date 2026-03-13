import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode; // right-side actions/controls
  className?: string;
}

export function ModuleHeader({ title, subtitle, icon: Icon, children, className }: ModuleHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 flex-wrap', className)}
      style={{ marginBottom: '1.5rem' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(209, 255, 0, 0.06)',
              border: '1px solid rgba(209, 255, 0, 0.12)',
            }}
          >
            <Icon size={18} style={{ color: 'var(--aiox-lime)' }} />
          </span>
        )}
        <div className="min-w-0">
          <h2
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.65rem',
                color: 'var(--aiox-gray-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '0.15rem',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}
