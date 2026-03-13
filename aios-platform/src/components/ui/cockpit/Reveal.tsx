import { Children, useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '../../../lib/utils'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale'

export interface RevealProps {
  children: React.ReactNode
  direction?: RevealDirection
  delay?: number
  duration?: number
  stagger?: number
  className?: string
  once?: boolean
}

/** Brandbook scroll-spy animation uses 0.7s with spring easing */
const EASING: [number, number, number, number] = [0.16, 1, 0.3, 1]

function getVariants(direction: RevealDirection): Variants {
  const hidden: Record<string, number> = { opacity: 0 }
  const visible: Record<string, number> = { opacity: 1 }

  switch (direction) {
    case 'up':
      hidden.y = 30
      visible.y = 0
      break
    case 'down':
      hidden.y = -30
      visible.y = 0
      break
    case 'left':
      hidden.x = -30
      visible.x = 0
      break
    case 'right':
      hidden.x = 30
      visible.x = 0
      break
    case 'scale':
      hidden.scale = 0.92
      visible.scale = 1
      break
  }

  return { hidden, visible }
}

/**
 * Reveal wrapper — animates children into view on scroll using framer-motion.
 * Respects `prefers-reduced-motion` (skips animation entirely).
 *
 * When `stagger` is provided, each direct child receives an incremental delay.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  stagger,
  className,
  once = true,
}: RevealProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const variants = getVariants(direction)

  // Stagger mode: each direct child gets an incremental delay
  if (stagger != null) {
    const items = Children.toArray(children)
    return (
      <div className={className}>
        {items.map((child, index) => (
          <motion.div
            key={index}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once }}
            transition={{
              duration,
              ease: EASING,
              delay: delay + index * stagger,
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    )
  }

  // Single element mode
  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      transition={{ duration, ease: EASING, delay }}
    >
      {children}
    </motion.div>
  )
}
