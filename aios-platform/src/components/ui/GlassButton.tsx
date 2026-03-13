import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { CockpitButton } from './cockpit/CockpitButton';
import type { CockpitButtonProps } from './cockpit/CockpitButton';

let _warnedGlassButton = false;

/** @deprecated Use CockpitButton from 'components/ui/cockpit' instead. */
export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantMap: Record<
  NonNullable<GlassButtonProps['variant']>,
  CockpitButtonProps['variant']
> = {
  default: 'secondary',
  primary: 'primary',
  ghost: 'ghost',
  danger: 'destructive',
};

/**
 * @deprecated Use `CockpitButton` from `components/ui/cockpit` instead.
 * This component now delegates to CockpitButton with variant mapping.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'default', ...rest }, ref) => {
    if (process.env.NODE_ENV !== 'production' && !_warnedGlassButton) {
      _warnedGlassButton = true;
      console.warn(
        'GlassButton is deprecated. Use CockpitButton instead. ' +
          'See src/components/ui/cockpit/CockpitButton.tsx'
      );
    }

    return (
      <CockpitButton
        ref={ref}
        variant={variantMap[variant]}
        {...rest}
      />
    );
  }
);

GlassButton.displayName = 'GlassButton';
