import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const glassButtonVariants = cva(
  [
    'inline-flex items-center justify-center font-medium rounded-xl',
    'transition-all duration-150 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  ],
  {
    variants: {
      variant: {
        default: 'glass glass-border hover:glass-shadow-hover',
        primary: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
        ghost: 'bg-transparent hover:bg-white/10 dark:hover:bg-white/5',
        danger: 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30',
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface GlassButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(glassButtonVariants({ variant, size }), className)}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span className="sr-only">Carregando</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { glassButtonVariants };
