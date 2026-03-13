import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { CockpitCard } from './cockpit/CockpitCard';
import type { CockpitCardProps } from './cockpit/CockpitCard';

let _warnedGlassCard = false;

/** @deprecated Use CockpitCard from 'components/ui/cockpit' instead. */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'strong';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** @deprecated Ignored — Cockpit cards are brutalist (no border-radius). */
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  /** @deprecated Ignored — Cockpit cards do not use animation toggles. */
  animate?: boolean;
  /** @deprecated No longer used — kept for API compatibility. */
  motionProps?: Record<string, unknown>;
  'aria-label'?: string;
}

const variantMap: Record<
  NonNullable<GlassCardProps['variant']>,
  CockpitCardProps['variant']
> = {
  default: 'default',
  subtle: 'subtle',
  strong: 'elevated',
};

/**
 * @deprecated Use `CockpitCard` from `components/ui/cockpit` instead.
 * This component now delegates to CockpitCard with variant mapping.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      // Destructure ignored props so they don't pass through to CockpitCard
      radius: _radius,
      animate: _animate,
      motionProps: _motionProps,
      ...rest
    },
    ref
  ) => {
    if (process.env.NODE_ENV !== 'production' && !_warnedGlassCard) {
      _warnedGlassCard = true;
      console.warn(
        'GlassCard is deprecated. Use CockpitCard instead. ' +
          'See src/components/ui/cockpit/CockpitCard.tsx'
      );
    }

    return (
      <CockpitCard
        ref={ref}
        variant={variantMap[variant]}
        {...rest}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';
