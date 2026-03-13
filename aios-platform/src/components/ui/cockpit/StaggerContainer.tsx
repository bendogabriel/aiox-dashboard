import { Children, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils'

export interface StaggerContainerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

const EASING: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/**
 * Container that staggers the entrance animation of its direct children.
 * Each child fades up with an incremental delay.
 * Respects `prefers-reduced-motion` (renders children without animation).
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.04,
  className,
}: StaggerContainerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const items = Children.toArray(children)

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn(className)}>
      <AnimatePresence>
        {items.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              ease: EASING,
              delay: index * staggerDelay,
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
