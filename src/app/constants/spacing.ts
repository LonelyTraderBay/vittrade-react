/**
 * Enterprise Spacing System
 * 
 * Based on golden ratio and 4pt grid system
 * Ensures consistent rhythm and visual hierarchy
 * 
 * Usage:
 * ```tsx
 * import { SPACING } from '@/constants/spacing';
 * 
 * <div style={{ marginBottom: SPACING.base, gap: SPACING.sm }}>
 *   ...
 * </div>
 * ```
 * 
 * Or with Tailwind:
 * mb-2  (8px)  = SPACING.xs
 * mb-3  (12px) = SPACING.sm
 * mb-4  (16px) = SPACING.base
 * mb-6  (24px) = SPACING.md
 * mb-8  (32px) = SPACING.lg
 */

export const SPACING = {
  /**
   * XXS (4px)
   * Usage: Tight gaps, icon-to-text spacing
   * Tailwind: gap-1, space-x-1
   */
  xxs: 4,

  /**
   * XS (8px)
   * Usage: Compact spacing, inline elements
   * Tailwind: mb-2, gap-2, px-2
   */
  xs: 8,

  /**
   * SM (12px)
   * Usage: Default gap between related elements
   * Tailwind: mb-3, gap-3, px-3
   */
  sm: 12,

  /**
   * BASE (16px)
   * Usage: Standard padding, section spacing
   * Tailwind: mb-4, gap-4, p-4
   */
  base: 16,

  /**
   * MD (24px)
   * Usage: Large gaps, section breaks
   * Tailwind: mb-6, gap-6, px-6
   */
  md: 24,

  /**
   * LG (32px)
   * Usage: Major section separation
   * Tailwind: mb-8, gap-8, px-8
   */
  lg: 32,

  /**
   * XL (48px)
   * Usage: Page-level spacing (rarely used)
   * Tailwind: mb-12, gap-12
   */
  xl: 48,
} as const;

/**
 * Touch Target Sizes
 * Based on WCAG 2.2 AAA guidelines
 */
export const TOUCH_TARGET = {
  /**
   * MINIMUM (44px)
   * WCAG AAA minimum for interactive elements
   * Usage: All buttons, links, interactive icons
   */
  minimum: 44,

  /**
   * COMFORTABLE (48px)
   * Recommended for primary actions
   * Usage: Main CTAs, important buttons
   */
  comfortable: 48,

  /**
   * LARGE (56px)
   * For extra emphasis or accessibility
   * Usage: Hero CTAs, critical actions
   */
  large: 56,
} as const;

/**
 * Border Radius Scale
 * Matches golden ratio constants from utils/golden.ts
 * 
 * Note: φRadius already exists in /src/app/utils/golden.ts
 * Use that for actual values. This is documentation only.
 */
export const RADIUS_SCALE = {
  xs: 8,    // Small elements, badges
  sm: 10,   // Inputs, small cards
  md: 12,   // Default cards, buttons
  lg: 16,   // Large cards, modals
  xl: 20,   // Hero cards, special surfaces
  xxl: 24,  // Extra large containers
} as const;

/**
 * Helper Types
 */
export type SpacingValue = typeof SPACING[keyof typeof SPACING];
export type TouchTargetSize = typeof TOUCH_TARGET[keyof typeof TOUCH_TARGET];
export type RadiusValue = typeof RADIUS_SCALE[keyof typeof RADIUS_SCALE];

/**
 * Usage Guidelines
 * 
 * ✅ DO:
 * - Use SPACING.base (16px) for most padding/margins
 * - Use SPACING.sm (12px) for gaps between related items
 * - Use SPACING.md (24px) for section breaks
 * - Stick to the scale — avoid arbitrary values
 * 
 * ❌ DON'T:
 * - Don't use gap-2.5 (10px) — use gap-2 (8px) or gap-3 (12px)
 * - Don't mix px values — use Tailwind classes
 * - Don't create spacing variants outside this scale
 */
