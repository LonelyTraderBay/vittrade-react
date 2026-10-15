import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  ButtonGradients,
  ButtonShadows,
  ButtonTextColors,
  ButtonHeights,
  ButtonRadius,
  ButtonFontSize,
} from '@/shared/theme/button';

/**
 * CTAButton — Enterprise CTA Button Component
 * Centralized design tokens: height 52px, borderRadius 14px
 * Supports gradient backgrounds, disabled states, loading states
 */

/**
 * Density subset backed by the button theme tokens in theme/button.ts
 * (ButtonHeights/ButtonRadius/ButtonFontSize define compact/standard/hero).
 */
export type CTADensity = 'compact' | 'standard' | 'hero';

export interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'secondary';
  loading?: boolean;
  fullWidth?: boolean;
  density?: CTADensity;
  bg?: string;
  textColor?: string;
  /** Optional text label (alternative to children) */
  label?: string;
  /** Optional leading icon (lucide-react icon component) */
  icon?: LucideIcon;
  /** Content — optional when `label` is used instead */
  children?: React.ReactNode;
}

export function CTAButton({
  type = 'button',
  variant = 'primary',
  loading = false,
  fullWidth = true,
  density = 'standard',
  bg,
  textColor,
  disabled,
  className = '',
  style,
  children,
  ...rest
}: CTAButtonProps) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;
  const showDisabledStyles = Boolean(disabled);
  const variantBackground =
    variant === 'secondary'
      ? c.surface2
      : variant === 'ghost'
        ? 'transparent'
        : ButtonGradients[variant];
  const variantTextColor =
    variant === 'secondary' || variant === 'ghost' ? c.text1 : ButtonTextColors[variant];

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`${fullWidth ? 'w-full' : ''} rounded-2xl flex items-center justify-center gap-2 font-semibold ripple ${className}`}
      style={{
        height: ButtonHeights[density],
        borderRadius: ButtonRadius[density],
        fontSize: ButtonFontSize[density],
        background: showDisabledStyles ? c.surface2 : (bg ?? variantBackground),
        color: showDisabledStyles ? c.text3 : (textColor ?? variantTextColor),
        boxShadow: showDisabledStyles
          ? 'none'
          : variant === 'secondary'
            ? undefined
            : ButtonShadows[variant],
        transition: 'all var(--tr-duration-normal) ease',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <div className="contents">
          <span
            aria-hidden="true"
            className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
