import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { CockpitInput, CockpitTextarea } from './cockpit/CockpitInput';

let _warnedGlassInput = false;
let _warnedGlassTextarea = false;

/** @deprecated Use CockpitInput from 'components/ui/cockpit' instead. */
export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** @deprecated Ignored — CockpitInput does not have a success state. */
  success?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
  /** @deprecated Ignored — CockpitInput does not support rightIcon. */
  rightIcon?: React.ReactNode;
  /** @deprecated Ignored — CockpitInput does not support character count. */
  showCharacterCount?: boolean;
}

/**
 * @deprecated Use `CockpitInput` from `components/ui/cockpit` instead.
 * This component now delegates to CockpitInput, ignoring unsupported props.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      // Destructure ignored props so they don't pass through
      success: _success,
      rightIcon: _rightIcon,
      showCharacterCount: _showCharacterCount,
      ...rest
    },
    ref
  ) => {
    if (process.env.NODE_ENV !== 'production' && !_warnedGlassInput) {
      _warnedGlassInput = true;
      console.warn(
        'GlassInput is deprecated. Use CockpitInput instead. ' +
          'See src/components/ui/cockpit/CockpitInput.tsx'
      );
    }

    return <CockpitInput ref={ref} {...rest} />;
  }
);

GlassInput.displayName = 'GlassInput';

/** @deprecated Use CockpitTextarea from 'components/ui/cockpit' instead. */
export interface GlassTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** @deprecated Ignored — CockpitTextarea does not have a success state. */
  success?: boolean;
  hint?: string;
  /** @deprecated Ignored — CockpitTextarea does not support character count. */
  showCharacterCount?: boolean;
}

/**
 * @deprecated Use `CockpitTextarea` from `components/ui/cockpit` instead.
 * This component now delegates to CockpitTextarea, ignoring unsupported props.
 */
export const GlassTextarea = forwardRef<
  HTMLTextAreaElement,
  GlassTextareaProps
>(
  (
    {
      // Destructure ignored props so they don't pass through
      success: _success,
      showCharacterCount: _showCharacterCount,
      ...rest
    },
    ref
  ) => {
    if (process.env.NODE_ENV !== 'production' && !_warnedGlassTextarea) {
      _warnedGlassTextarea = true;
      console.warn(
        'GlassTextarea is deprecated. Use CockpitTextarea instead. ' +
          'See src/components/ui/cockpit/CockpitInput.tsx'
      );
    }

    return <CockpitTextarea ref={ref} {...rest} />;
  }
);

GlassTextarea.displayName = 'GlassTextarea';
