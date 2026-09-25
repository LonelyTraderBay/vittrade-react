/**
 * ═══════════════════════════════════════════════════════════
 *  Button Theme Tokens — VitTrade Flutter canonical actions
 * ═══════════════════════════════════════════════════════════
 *
 *  Single source of truth for CTA / Button / IconButton colors,
 *  gradients, shadows, sizing, and radius.
 */

import type { VitDensity } from './density';

export const ButtonGradients = {
  primary: 'linear-gradient(135deg, #E58A00 0%, #B96000 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  ghost: 'transparent',
} as const;

export type ButtonGradientKey = keyof typeof ButtonGradients;

export const ButtonShadows = {
  primary: '0 4px 16px rgba(229,138,0,0.3)',
  success: '0 4px 16px rgba(16,185,129,0.3)',
  danger: '0 4px 16px rgba(239,68,68,0.3)',
  warning: '0 4px 16px rgba(245,158,11,0.3)',
  ghost: 'none',
} as const;

export type ButtonShadowKey = keyof typeof ButtonShadows;

export const ButtonHeights = {
  compact: 36,
  standard: 52,
  relaxed: 58,
  hero: 56,
  tool: 44,
} as const satisfies Record<VitDensity, number>;

export const ButtonPadding = {
  compact: { x: 16, gap: 6 },
  standard: { x: 24, gap: 8 },
  relaxed: { x: 24, gap: 8 },
  hero: { x: 28, gap: 10 },
  tool: { x: 12, gap: 4 },
} as const satisfies Record<VitDensity, { x: number; gap: number }>;

export const ButtonRadius = {
  compact: 10,
  standard: 14,
  relaxed: 16,
  hero: 16,
  tool: 10,
} as const satisfies Record<VitDensity, number>;

export const ButtonFontSize = {
  compact: 14,
  standard: 16,
  relaxed: 16,
  hero: 16,
  tool: 14,
} as const satisfies Record<VitDensity, number>;

export const IconButtonColors = {
  primary: {
    background: 'rgba(229, 138, 0, 0.12)',
    color: '#E58A00',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#10B981',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#EF4444',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#F59E0B',
  },
} as const;

export type IconButtonColorKey = keyof typeof IconButtonColors;
