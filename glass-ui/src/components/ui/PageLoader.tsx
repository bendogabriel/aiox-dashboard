import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={cn('h-full flex flex-col items-center justify-center', className)}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative h-16 w-16">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner spinning arc */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
          </motion.div>
        </div>

        <motion.p
          className="mt-4 text-sm text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

export interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoader({ size = 'md', className }: InlineLoaderProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      className={cn(
        sizes[size],
        'rounded-full border-2 border-transparent border-t-blue-500',
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}
