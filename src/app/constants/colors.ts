/**
 * Enterprise Color Alpha System
 * 
 * Standardized opacity values for consistent transparency effects
 * Works with any color from theme (c.success, c.warning, c.primary, etc.)
 * 
 * ⚠️ NEVER concatenate ALPHA directly with CSS variables!
 *   ❌ `${c.success}${ALPHA.ghost}` → produces INVALID CSS
 *   ✅ `withAlpha(c.success, ALPHA.ghost)` → uses color-mix(), works correctly
 * 
 * ALPHA hex suffixes ONLY work with literal HEX concatenation:
 *   ✅ `#10B981${ALPHA.ghost}` — literal hex + hex suffix, OK → `#10B98108`
 *   ❌ `${c.success}${ALPHA.ghost}` — CSS variable, BROKEN
 *   ❌ `rgba(255,255,255,${ALPHA.ghost})` — BROKEN! alpha='08' → parsed as 8 → clamped to 1 = OPAQUE
 *   ✅ `rgba(255,255,255,${OPACITY.ghost})` — use OPACITY for rgba() → 0.03
 * 
 * Usage:
 * ```tsx
 * import { ALPHA } from '@/constants/colors';
 * import { useThemeColors } from '@/hooks/useThemeColors';
 * 
 * const c = useThemeColors();
 * 
 * // Background with subtle tint
 * background: `${c.success}${ALPHA.ghost}`  // #10B98108
 * 
 * // Border with more visibility
 * border: `1px solid ${c.success}${ALPHA.border}`  // #10B98130
 * ```
 */

export const ALPHA = {
  /**
   * GHOST (08 = 3% opacity)
   * Usage: Very subtle backgrounds, hover effects
   * Example: Card hover state, subtle tints
   */
  ghost: '08',

  /**
   * HOVER (10 = 6% opacity)
   * Usage: Interactive hover states, gentle emphasis
   * Example: Button hover background, active states
   */
  hover: '10',

  /**
   * MUTED (15 = 8% opacity)
   * Usage: Muted backgrounds, secondary surfaces
   * Example: Info boxes, helper text backgrounds
   */
  muted: '15',

  /**
   * SOFT (20 = 13% opacity)
   * Usage: Soft emphasis, badges, pills
   * Example: Status badges, category tags
   */
  soft: '20',

  /**
   * BORDER (30 = 19% opacity)
   * Usage: Borders, dividers, outlines
   * Example: Card borders, input outlines
   */
  border: '30',

  /**
   * MEDIUM (40 = 25% opacity)
   * Usage: Medium emphasis, overlays
   * Example: Disabled states, shadows
   */
  medium: '40',

  /**
   * DIM (50 = 31% opacity)
   * Usage: Dimmed text, secondary content
   * Example: Helper text, timestamps
   */
  dim: '50',

  /**
   * VISIBLE (60 = 38% opacity)
   * Usage: More visible overlays, modals
   * Example: Modal backgrounds, tooltips
   */
  visible: '60',

  /**
   * STRONG (80 = 50% opacity)
   * Usage: Strong overlays, loading states
   * Example: Full-screen loaders, heavy dim
   */
  strong: '80',
} as const;

/**
 * OPACITY — Decimal opacity values for rgba() usage
 *
 * ⚠️ ALPHA hex suffixes ('08','10') are for HEX colors or withAlpha() ONLY.
 *   ❌ `rgba(255,255,255,${ALPHA.ghost})` → `rgba(255,255,255,08)` → alpha=8 clamped to 1 = OPAQUE WHITE!
 *   ✅ `rgba(255,255,255,${OPACITY.ghost})` → `rgba(255,255,255,0.03)` → correct 3% opacity
 *
 * Each OPACITY value matches the same semantic level as the corresponding ALPHA value.
 */
export const OPACITY = {
  ghost: 0.03,    // matches ALPHA.ghost  (08 hex ≈ 3%)
  hover: 0.06,    // matches ALPHA.hover  (10 hex ≈ 6%)
  muted: 0.08,    // matches ALPHA.muted  (15 hex ≈ 8%)
  soft: 0.13,     // matches ALPHA.soft   (20 hex ≈ 13%)
  border: 0.19,   // matches ALPHA.border (30 hex ≈ 19%)
  medium: 0.25,   // matches ALPHA.medium (40 hex ≈ 25%)
  dim: 0.31,      // matches ALPHA.dim    (50 hex ≈ 31%)
  visible: 0.38,  // matches ALPHA.visible(60 hex ≈ 38%)
  strong: 0.50,   // matches ALPHA.strong (80 hex ≈ 50%)
} as const;

/* ─── Hex alpha → percentage lookup (for color-mix) ─── */
const HEX_TO_PCT: Record<string, number> = {
  '08': 3, '10': 6, '15': 8, '20': 13,
  '30': 19, '40': 25, '50': 31, '60': 38, '80': 50,
};

/**
 * withAlpha — Safe color + alpha for CSS variables
 *
 * ⚠️ NEVER concatenate CSS variables with hex alpha suffixes!
 *   ❌ `${c.success}${ALPHA.ghost}` → `var(--tr-buy)08` → INVALID CSS
 *   ✅ `withAlpha(c.success, ALPHA.ghost)` → `color-mix(in srgb, var(--tr-buy) 3%, transparent)`
 *
 * Uses CSS `color-mix()` which correctly works with CSS custom properties.
 *
 * @param color  Any CSS color value (including CSS variables like `var(--tr-buy)`)
 * @param alpha  Hex alpha string from ALPHA constants ('08', '15', '20', etc.)
 * @returns      Valid CSS color string using color-mix()
 *
 * @example
 * ```tsx
 * import { withAlpha, ALPHA } from '@/constants/colors';
 * const c = useThemeColors();
 *
 * // Background with subtle success tint
 * background: withAlpha(c.success, ALPHA.ghost)
 *
 * // Border with primary color
 * border: `1px solid ${withAlpha(c.primary, ALPHA.border)}`
 * ```
 */
export function withAlpha(color: string, alpha: string): string {
  const pct = HEX_TO_PCT[alpha] ?? Math.round((parseInt(alpha, 16) / 255) * 100);
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

/**
 * Semantic Color Mapping
 * 
 * Maps business logic to theme colors
 * Use these instead of hard-coding color names
 */
export const SEMANTIC_COLORS = {
  // Financial states
  profit: 'success',     // Green for positive changes
  loss: 'error',         // Red for negative changes
  neutral: 'text2',      // Gray for neutral/zero
  
  // Status indicators
  active: 'success',     // Green for active/running
  pending: 'warning',    // Amber for pending/waiting
  failed: 'error',       // Red for failed/error
  completed: 'primary',  // Blue for completed/done
  
  // Risk levels
  lowRisk: 'success',    // Green for low risk
  mediumRisk: 'warning', // Amber for medium risk
  highRisk: 'error',     // Red for high risk
  
  // Urgency tiers
  critical: 'error',     // Red for critical/urgent
  urgent: 'warning',     // Amber for soon
  soon: 'primary',       // Blue for approaching
  safe: 'success',       // Green for safe/good
} as const;

/**
 * Crypto Asset Colors
 * 
 * Standard colors for major cryptocurrencies
 * Use for asset icons, charts, badges
 */
export const CRYPTO_COLORS = {
  BTC: '#F7931A',  // Bitcoin orange
  ETH: '#627EEA',  // Ethereum blue
  USDT: '#26A17B', // Tether teal
  SOL: '#9945FF',  // Solana purple
  BNB: '#F3BA2F',  // Binance gold
  USDC: '#2775CA', // USDC blue
  XRP: '#23292F',  // Ripple black
  ADA: '#0033AD',  // Cardano blue
  DOGE: '#C2A633', // Dogecoin gold
  MATIC: '#8247E5', // Polygon purple
} as const;

/**
 * Helper Types
 */
export type AlphaValue = typeof ALPHA[keyof typeof ALPHA];
export type SemanticColor = typeof SEMANTIC_COLORS[keyof typeof SEMANTIC_COLORS];
export type CryptoAsset = keyof typeof CRYPTO_COLORS;