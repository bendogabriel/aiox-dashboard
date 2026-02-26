import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const progressBarVariants = cva(
  'h-full rounded-full transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const containerSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export interface ProgressBarProps extends VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant,
  size = 'md',
  showLabel = false,
  label,
  animate = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeValue = size ?? 'md';

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full glass glass-border overflow-hidden',
          containerSizes[sizeValue]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={cn(
            progressBarVariants({ variant, size }),
            animate && 'transition-[width] duration-500 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { progressBarVariants };
