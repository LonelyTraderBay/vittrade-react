/**
 * ══════════════════════════════════════════════════════════════
 *  TrCard — Enterprise Trading Card Component
 * ══════════════════════════════════════════════════════════════
 *
 *  Enforces the 4 ONLY card patterns allowed in the design system:
 *
 *  | Variant    | Bg               | Border             | Shadow             |
 *  |------------|------------------|--------------------|--------------------|
 *  | standard   | c.surface        | c.cardBorder       | c.cardShadow       |
 *  | hero       | c.portfolioBg    | c.portfolioBorder  | c.portfolioShadow  |
 *  | inner      | c.surface2       | none               | none               |
 *  | ghost      | transparent      | none               | none               |
 *
 *  Usage:
 *    <TrCard>Content</TrCard>                          // standard
 *    <TrCard variant="hero">Balance</TrCard>           // hero/portfolio
 *    <TrCard variant="inner">Sub-section</TrCard>      // nested element
 *    <TrCard hover>Clickable card</TrCard>              // standard + hover effect
 *    <TrCard rounded="lg">Featured</TrCard>             // rounded-3xl
 *    <TrCard accentBorder="rgba(16,185,129,0.2)">...</TrCard>  // custom border
 *    <TrCard as="button" onClick={...}>Tap me</TrCard>  // renders <button>
 */

import React from 'react';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { type VitDensity, resolveCardPadding } from '../../theme/density';
import { type VitRadius, VitRadii } from '../../theme/radii';

/* ─── Variant Config ────────────────────────────── */

type CardVariant = 'standard' | 'hero' | 'inner' | 'ghost';
type CardContentAlign = 'start' | 'center';

const VARIANT_STYLES = (c: ThemeColors) =>
  ({
    standard: {
      background: c.surface,
      border: `1px solid ${c.cardBorder}`,
      boxShadow: c.cardShadow,
    },
    hero: {
      background: c.portfolioBg,
      border: `1px solid ${c.portfolioBorder}`,
      boxShadow: c.portfolioShadow,
    },
    inner: {
      background: c.surface2,
      border: 'none',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
  }) as const;

/* ─── Props ─────────────────────────────────────── */

type BaseElement = 'div' | 'button' | 'section' | 'article';

interface TrCardProps {
  /** Card pattern variant (default: 'standard') */
  variant?: CardVariant;
  /** Border radius: 'md' = rounded-2xl (16px), 'lg' = rounded-3xl (24px), 'sm' = rounded-xl (12px) */
  rounded?: 'sm' | 'md' | 'lg';
  /** VitTrade radius token (wins over rounded if both provided) */
  radius?: VitRadius;
  /** Add hover-card interaction class */
  hover?: boolean;
  /** Clip overflow (e.g. for cards with header images) */
  overflow?: boolean;
  /** Override border color (e.g. contextual green/red for position cards) */
  accentBorder?: string;
  /** Override background color/gradient (e.g. custom hero surface) */
  background?: string;
  /** Density-driven padding (compact/standard/relaxed/hero/tool) */
  density?: VitDensity;
  /** Explicit padding override (number = all sides, string = CSS value) */
  padding?: number | string;
  /** Vertical alignment when card has fixed/min height */
  contentAlign?: CardContentAlign;
  /** HTML element to render */
  as?: BaseElement;
  /** Additional inline styles (merged after variant tokens) */
  style?: React.CSSProperties;
  /** Additional CSS classes */
  className?: string;
  /** Content */
  children?: React.ReactNode;
  /** Pass-through props */
  onClick?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/* ─── Radius Map ────────────────────────────────── */

const RADIUS_MAP = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
} as const;

const RADIUS_TOKEN_MAP: Record<VitRadius, string> = {
  none: 'rounded-none',
  xs: 'rounded-[2px]',
  sm: 'rounded-sm',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-[21px]',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

/* ─── Component ─────────────────────────────────── */

export function TrCard({
  variant = 'standard',
  rounded = 'md',
  radius,
  hover = false,
  overflow = false,
  accentBorder,
  background,
  density,
  padding,
  contentAlign = 'start',
  as: Component = 'div',
  style,
  className = '',
  children,
  ...rest
}: TrCardProps) {
  const c = useThemeColors();
  const variantStyle = VARIANT_STYLES(c)[variant];

  const resolvedPadding =
    padding !== undefined
      ? typeof padding === 'number'
        ? `${padding}px`
        : padding
      : resolveCardPadding(density, undefined);

  const mergedStyle: React.CSSProperties = {
    ...variantStyle,
    ...(accentBorder ? { border: `1px solid ${accentBorder}` } : {}),
    ...(background ? { background } : {}),
    ...(resolvedPadding ? { padding: resolvedPadding } : {}),
    ...style,
  };

  const radiusClass = radius ? RADIUS_TOKEN_MAP[radius] : RADIUS_MAP[rounded];

  const classes = [
    radiusClass,
    overflow ? 'overflow-hidden' : '',
    hover ? 'hover-card' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content =
    contentAlign === 'center' ? (
      <div className="flex flex-col items-center justify-center w-full h-full">{children}</div>
    ) : (
      children
    );

  return (
    <Component className={classes} style={mergedStyle} {...rest}>
      {content}
    </Component>
  );
}

/* ─── Sub-component: Inner stat box (for hero cards) ─── */

interface TrCardStatProps {
  children?: React.ReactNode;
  density?: VitDensity;
  className?: string;
  style?: React.CSSProperties;
}

export function TrCardStat({ children, density, className = '', style }: TrCardStatProps) {
  const c = useThemeColors();
  const padding =
    density === 'compact' || density === 'tool'
      ? '8px'
      : density === 'relaxed' || density === 'hero'
        ? '16px'
        : density === 'standard'
          ? '12px'
          : undefined;
  return (
    <div
      className={`rounded-xl ${density ? '' : 'p-2.5'} ${className}`}
      style={{ background: c.portfolioBtnGhost, ...(padding ? { padding } : {}), ...style }}
    >
      {children}
    </div>
  );
}
