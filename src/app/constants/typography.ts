/**
 * Enterprise Typography Scale System
 * 
 * Based on industry fintech standards (Coinbase, Robinhood, Revolut)
 * Uses 6-tier scale for clear visual hierarchy
 * 
 * Usage:
 * ```tsx
 * import { FONT_SCALE } from '@/constants/typography';
 * 
 * <span style={{ fontSize: FONT_SCALE.xs }}>Label</span>
 * <span style={{ fontSize: FONT_SCALE.base }}>Value</span>
 * ```
 */

export const FONT_SCALE = {
  /**
   * MICRO (10px)
   * Usage: Legal text, fine print, timestamps
   * Example: "Updated 2 mins ago", "T&C apply"
   */
  micro: 10,

  /**
   * XS (12px)
   * Usage: Labels, helper text, captions
   * Example: "Total Value", "Available Balance"
   */
  xs: 12,

  /**
   * SM (14px)
   * Usage: Body text, card content, secondary info
   * Example: Product descriptions, list items
   */
  sm: 14,

  /**
   * BASE (16px)
   * Usage: Primary text, CTAs, headings
   * Example: Button labels, section titles
   */
  base: 16,

  /**
   * LG (20px)
   * Usage: Page titles, emphasized values
   * Example: Section headings, large stats
   */
  lg: 20,

  /**
   * XL (28px)
   * Usage: Hero numbers, portfolio totals
   * Example: Total balance in portfolio card
   * Note: Reduced from 34px for better balance
   */
  xl: 28,

  /**
   * XXL (40px)
   * Usage: Reserved for special marketing/landing pages
   * Example: Promotional headers (rarely used in app)
   */
  xxl: 40,
} as const;

/**
 * Font Weight Scale
 * Standardized weights for consistent typography
 */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Line Height Scale
 * Optimized for readability
 */
export const LINE_HEIGHT = {
  tight: 1.1,    // Hero numbers, large display text
  normal: 1.4,   // Body text, paragraphs
  relaxed: 1.6,  // Long-form content
} as const;

/**
 * Letter Spacing
 * For better legibility in specific contexts
 */
export const LETTER_SPACING = {
  tight: -0.5,   // Large numbers, headings
  normal: 0,     // Default
  wide: 0.5,     // Uppercase labels, tags
} as const;

/**
 * Typography Helper Types
 */
export type FontSize = typeof FONT_SCALE[keyof typeof FONT_SCALE];
export type FontWeight = typeof FONT_WEIGHT[keyof typeof FONT_WEIGHT];
export type LineHeight = typeof LINE_HEIGHT[keyof typeof LINE_HEIGHT];
export type LetterSpacing = typeof LETTER_SPACING[keyof typeof LETTER_SPACING];
