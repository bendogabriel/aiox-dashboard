import { forwardRef, useState, HTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'strong';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  motionProps?: MotionProps;
  /** Accessible label for the card content */
  'aria-label'?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const radiusMap = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  xl: 'rounded-[2rem]',
};

const variantClasses = {
  default: 'glass glass-border glass-shadow',
  subtle: 'glass-subtle glass-border',
  strong: 'glass-strong glass-border glass-shadow',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      padding = 'md',
      radius = 'lg',
      animate = true,
      motionProps,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(animate);

    const classes = cn(
      variantClasses[variant],
      paddingMap[padding],
      radiusMap[radius],
      interactive && 'cursor-pointer transition-shadow hover:glass-shadow-hover',
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={classes}
          aria-busy={isAnimating}
          aria-label={ariaLabel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setIsAnimating(false)}
          {...motionProps}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={classes} aria-label={ariaLabel} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
