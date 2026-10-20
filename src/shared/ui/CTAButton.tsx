import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  ButtonGradients,
  ButtonShadows,
  ButtonHeights,
  ButtonRadius,
  ButtonFontSize,
  ButtonTextColors,
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
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'secondary';
  loading?: boolean;
  fullWidth?: boolean;
  density?: CTADensity;
  /** Optional text label (alternative to children) */
  label?: string;
  /** Optional leading icon (lucide-react icon component) */
  icon?: LucideIcon;
  /** Content — optional when `label` is used instead */
  children?: React.ReactNode;
}

export function CTAButton({
  variant = 'primary',
  loading = false,
  fullWidth = true,
  density = 'standard',
  label,
  icon: Icon,
  disabled,
  className = '',
  style,
  children,
  ...rest
}: CTAButtonProps) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;
  const content = children ?? label;
  const buttonTextColor =
    variant === 'secondary' || variant === 'ghost' ? c.text1 : ButtonTextColors[variant];
  const buttonShadow =
    variant === 'secondary' || variant === 'ghost' ? undefined : ButtonShadows[variant];

  return (
    <button
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`${fullWidth ? 'w-full' : ''} rounded-2xl flex items-center justify-center gap-2 font-semibold ripple ${className}`}
      style={{
        height: ButtonHeights[density],
        borderRadius: ButtonRadius[density],
        fontSize: ButtonFontSize[density],
        background: isDisabled
          ? c.surface2
          : variant === 'secondary'
            ? c.surface2
            : variant === 'ghost'
              ? 'transparent'
              : ButtonGradients[variant],
        color: isDisabled ? c.text3 : buttonTextColor,
        boxShadow: isDisabled ? 'none' : buttonShadow,
        transition: 'all var(--tr-duration-normal) ease',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin"
        />
      ) : (
        Icon && <Icon size={18} aria-hidden="true" />
      )}
      {content}
    </button>
  );
}
