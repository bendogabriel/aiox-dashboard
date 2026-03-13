import { useRef, useEffect, useState } from 'react'

interface UseRevealOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Intersection Observer hook for scroll-triggered reveal animations.
 * Respects `prefers-reduced-motion` — if reduced motion is preferred,
 * `isVisible` always returns `true` (no animation delay).
 */
export function useReveal(options?: UseRevealOptions): {
  ref: React.RefObject<HTMLDivElement | null>
  isVisible: boolean
} {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options ?? {}
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setIsVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}
