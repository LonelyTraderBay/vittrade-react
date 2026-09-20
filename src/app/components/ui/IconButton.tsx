/**
 * ══════════════════════════════════════════════════════════
 *  IconButton Component
 * ══════════════════════════════════════════════════════════
 *
 *  Reusable button with icon + optional label.
 *  Extracted from repeated patterns across components.
 *
 *  Usage:
 *  ```tsx
 *  <IconButton icon={Search} label="Tìm kiếm" onClick={...} />
 *  <IconButton icon={ChevronLeft} onClick={...} />
 *  <IconButton icon={Copy} label="Sao chép" variant="primary" />
 *  ```
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

/* ─── Types ─── */

export type IconButtonVariant =
  | 'default' // Transparent with text color
  | 'ghost' // Surface2 background
  | 'primary' // Primary color
  | 'success' // Success color
  | 'danger' // Danger color
  | 'transparent'; // No background, no border

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;

  /** Optional label text */
  label?: string;

  /** Click handler */
  onClick?: () => void;

  /** Visual variant */
  variant?: IconButtonVariant;

  /** Size variant */
  size?: IconButtonSize;

  /** Disabled state */
  disabled?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Custom className */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;

  /** ARIA label for accessibility */
  'aria-label'?: string;
}

/* ─── Size Configuration ─── */

const SIZE_CONFIG = {
  sm: {
    height: 28,
    iconSize: 14,
    fontSize: 11,
    gap: 4,
    paddingX: 8,
  },
  md: {
    height: 36,
    iconSize: 18,
    fontSize: 13,
    gap: 6,
    paddingX: 12,
  },
  lg: {
    height: 44,
    iconSize: 20,
    fontSize: 14,
    gap: 8,
    paddingX: 16,
  },
} as const;

/* ─── Component ─── */

export function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  style,
  'aria-label': ariaLabel,
}: IconButtonProps) {
  const c = useThemeColors();
  const config = SIZE_CONFIG[size];

  // Variant styling
  const getVariantStyles = (): React.CSSProperties => {
    const base = {
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    };

    switch (variant) {
      case 'ghost':
        return {
          ...base,
          background: c.surface2,
          color: c.text1,
        };
      case 'primary':
        return {
          ...base,
          background: 'rgba(229, 138, 0, 0.12)',
          color: '#E58A00',
        };
      case 'success':
        return {
          ...base,
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10B981',
        };
      case 'danger':
        return {
          ...base,
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#EF4444',
        };
      case 'transparent':
        return {
          ...base,
          background: 'transparent',
          color: c.text2,
        };
      default: // 'default'
        return {
          ...base,
          background: 'transparent',
          color: c.text1,
        };
    }
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || label}
      className={`
        inline-flex items-center justify-center
        rounded-xl
        active:opacity-70
        transition-opacity
        ${className}
      `.trim()}
      style={{
        ...getVariantStyles(),
        minHeight: config.height,
        paddingLeft: label ? config.paddingX : config.height / 2,
        paddingRight: label ? config.paddingX : config.height / 2,
        gap: label ? config.gap : 0,
        fontSize: config.fontSize,
        fontWeight: 600,
        ...style,
      }}
    >
      {loading ? (
        <div
          className="animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{
            width: config.iconSize,
            height: config.iconSize,
          }}
        />
      ) : (
        <Icon size={config.iconSize} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ─── Icon-Only Variant ─── */

export interface IconOnlyButtonProps extends Omit<IconButtonProps, 'label'> {
  /** Icon component */
  icon: LucideIcon;

  /** Required ARIA label for accessibility */
  'aria-label': string;
}

/**
 * Icon-only button variant (requires aria-label)
 */
export function IconOnlyButton(props: IconOnlyButtonProps) {
  return <IconButton {...props} />;
}

/* ─── Back Button Variant ─── */

import { ArrowLeft, ChevronLeft } from 'lucide-react';

export interface BackButtonProps {
  /** Click handler */
  onClick: () => void;

  /** Use ChevronLeft instead of ArrowLeft */
  useChevron?: boolean;

  /** Custom label */
  label?: string;

  /** Size variant */
  size?: IconButtonSize;

  /** Custom className */
  className?: string;
}

/**
 * Specialized back button (common pattern)
 */
export function BackButton({
  onClick,
  useChevron = false,
  label = 'Quay lại',
  size = 'md',
  className,
}: BackButtonProps) {
  return (
    <IconButton
      icon={useChevron ? ChevronLeft : ArrowLeft}
      label={label}
      onClick={onClick}
      variant="transparent"
      size={size}
      className={className}
      aria-label={label}
    />
  );
}

/* ─── Close Button Variant ─── */

import { X } from 'lucide-react';

export interface CloseButtonProps {
  /** Click handler */
  onClick: () => void;

  /** Size variant */
  size?: IconButtonSize;

  /** Custom className */
  className?: string;

  /** Custom label */
  label?: string;
}

/**
 * Specialized close button (common pattern)
 */
export function CloseButton({ onClick, size = 'md', className, label }: CloseButtonProps) {
  return (
    <IconButton
      icon={X}
      label={label}
      onClick={onClick}
      variant="ghost"
      size={size}
      className={className}
      aria-label={label || 'Đóng'}
    />
  );
}
