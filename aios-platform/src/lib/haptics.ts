/**
 * Haptic feedback utilities for native-like mobile experience
 * Uses the Vibration API when available
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50],
  selection: 5,
};

/**
 * Check if vibration API is available
 */
export function supportsHaptics(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 */
export function haptic(type: HapticType = 'light'): void {
  if (!supportsHaptics()) return;

  try {
    navigator.vibrate(hapticPatterns[type]);
  } catch {
    // Silently fail if vibration is not supported
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (!supportsHaptics()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  return {
    trigger: haptic,
    cancel: cancelHaptic,
    supported: supportsHaptics(),
  };
}
