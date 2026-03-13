import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════════
//                              REVEAL ANIMATION
//  Brandbook scroll-reveal: fade-in + directional translate (20px).
//  Easing: ease-out-cubic [0.25, 0.1, 0.25, 1]
// ═══════════════════════════════════════════════════════════════════════════════════

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  once?: boolean;
}

const directionOffsets: Record<NonNullable<RevealProps['direction']>, { x: number; y: number }> = {
  up: { x: 0, y: 20 },
  down: { x: 0, y: -20 },
  left: { x: 20, y: 0 },
  right: { x: -20, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.4,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-40px' });

  const offset = directionOffsets[direction];

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              REVEAL GROUP (stagger)
//  Wraps children in a motion container that staggers their entrance.
//  Children should be <Reveal> elements (or any motion component with variants).
// ═══════════════════════════════════════════════════════════════════════════════════

export interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number; // Default 0.04s between children
}

export function RevealGroup({
  children,
  className,
  stagger = 0.04,
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              REVEAL ITEM
//  Pre-configured child for use inside <RevealGroup>.
//  Inherits stagger timing from parent; applies its own direction + duration.
// ═══════════════════════════════════════════════════════════════════════════════════

export interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export function RevealItem({
  children,
  className,
  direction = 'up',
  duration = 0.4,
}: RevealItemProps) {
  const offset = directionOffsets[direction];

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
