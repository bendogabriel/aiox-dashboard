import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-muted',
    animate && 'animate-pulse',
    variant === 'circular' && 'rounded-full',
    variant === 'text' && 'rounded h-4',
    variant === 'default' && 'rounded-lg',
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={cn(baseClasses, className)} style={style} />;
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return <Skeleton variant="circular" className={sizeClasses[size]} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass glass-border rounded-2xl p-4 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
