/**
 * Enterprise Icon System
 * 
 * Standardized icon sizes for visual consistency
 * Based on fintech industry standards (Coinbase, Robinhood)
 * 
 * Usage:
 * ```tsx
 * import { ICON_SIZE } from '@/constants/icons';
 * import { TrendingUp } from 'lucide-react';
 * 
 * <TrendingUp size={ICON_SIZE.base} strokeWidth={ICON_STROKE.standard} />
 * ```
 */

export const ICON_SIZE = {
  /**
   * SM (16px)
   * Usage: Inline icons, small badges, utility buttons
   * Example: Icons in pills, compact controls
   */
  sm: 16,

  /**
   * BASE (18px)
   * Usage: Default icon size, card headers, navigation
   * Example: Section icons, list item icons
   */
  base: 18,

  /**
   * MD (20px)
   * Usage: Emphasized icons, warnings, primary actions
   * Example: Alert icons, important status indicators
   */
  md: 20,

  /**
   * LG (24px)
   * Usage: Page headers, prominent CTAs, empty states
   * Example: Large action buttons, feature highlights
   */
  lg: 24,

  /**
   * XL (32px)
   * Usage: Hero sections, onboarding, illustrations
   * Example: Empty state graphics, tutorial icons
   */
  xl: 32,

  /**
   * XXL (40px)
   * Usage: Error states, success confirmations, large empty states
   * Example: 404 pages, success modals
   */
  xxl: 40,
} as const;

/**
 * Icon Stroke Width
 * Consistent stroke weights for visual harmony
 */
export const ICON_STROKE = {
  thin: 1.5,      // Decorative, subtle
  standard: 2,    // Default for most icons
  emphasis: 2.2,  // Important icons, warnings
  bold: 2.5,      // Heavy emphasis (use sparingly)
} as const;

/**
 * Icon Container Sizes
 * Standard container sizes for icons with backgrounds
 * 
 * Usage:
 * ```tsx
 * <div style={{ 
 *   width: ICON_CONTAINER.sm, 
 *   height: ICON_CONTAINER.sm 
 * }}>
 *   <Icon size={ICON_SIZE.sm} />
 * </div>
 * ```
 */
export const ICON_CONTAINER = {
  sm: 32,   // For 16px icons
  base: 36, // For 18px icons
  md: 40,   // For 20px icons
  lg: 48,   // For 24px icons
} as const;

/**
 * Helper Types
 */
export type IconSize = typeof ICON_SIZE[keyof typeof ICON_SIZE];
export type IconStroke = typeof ICON_STROKE[keyof typeof ICON_STROKE];
export type IconContainerSize = typeof ICON_CONTAINER[keyof typeof ICON_CONTAINER];
