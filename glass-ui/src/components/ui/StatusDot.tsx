import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const statusDotVariants = cva('rounded-full', {
  variants: {
    status: {
      idle: 'bg-gray-400',
      working: 'bg-blue-500',
      waiting: 'bg-yellow-500',
      error: 'bg-red-500',
      success: 'bg-green-500',
      offline: 'bg-gray-500',
    },
    size: {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    },
  },
  defaultVariants: {
    status: 'idle',
    size: 'md',
  },
});

const glowVariants: Record<string, string> = {
  idle: '',
  working: 'shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  waiting: 'shadow-[0_0_8px_rgba(234,179,8,0.6)]',
  error: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  success: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]',
  offline: '',
};

export type StatusType = 'idle' | 'working' | 'waiting' | 'error' | 'success' | 'offline';

export interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  glow?: boolean;
  pulse?: boolean;
  label?: string;
  className?: string;
}

export function StatusDot({
  status = 'idle',
  size,
  glow = false,
  pulse = false,
  label,
  className,
}: StatusDotProps) {
  const statusValue = status ?? 'idle';

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex">
        <span
          className={cn(
            statusDotVariants({ status, size }),
            glow && glowVariants[statusValue],
          )}
        />
        {pulse && (statusValue === 'working' || statusValue === 'waiting') && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              statusDotVariants({ status, size }),
            )}
          />
        )}
      </span>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  );
}

export { statusDotVariants };
