/**
 * ════════════════════════════════════════════════════════════
 *  GOLDEN RATIO DESIGN SYSTEM  (φ = 1.618033988749895)
 * ════════════════════════════════════════════════════════════
 *
 *  Typography  — √φ (1.272) modular scale from base 10px
 *  Spacing     — Fibonacci sequence: 3, 5, 8, 13, 21, 34, 55
 *  Sizing      — Fibonacci for icons, avatars, buttons, radii
 *  Layout      — Golden split 61.8% / 38.2%
 *
 *  Import: import { φ, φIcon, φAvatar, φBtn, φRadius, φSpace, φLayout } from '../../utils/golden';
 */

/* ─── Typography Scale (√φ modular) ─── */
export const φ = {
  xs:   10,   // micro labels, timestamps, badges
  sm:   13,   // captions, secondary text, descriptions
  body: 14,   // standard body text, list items (bridge 13→16)
  base: 16,   // labels, primary readable text, inputs
  md:   21,   // section titles, sub-headings
  lg:   26,   // page titles, important headings
  xl:   34,   // hero numbers, prices, balances
  '2xl': 43,  // display, splash headings
  '3xl': 55,  // jumbo, onboarding hero
} as const;

/* ─── Icon Sizes (Fibonacci) ─���─ */
export const φIcon = {
  sm: 13,
  md: 21,
  lg: 34,
} as const;

/* ─── Avatar / Container Sizes (Fibonacci) ─── */
export const φAvatar = {
  sm: 34,
  md: 55,
  lg: 89,
} as const;

/* ─── Button Heights (Fibonacci) ─── */
export const φBtn = {
  compact:  34,
  standard: 55,
  hero:     89,
} as const;

/* ─── Border Radius (Fibonacci) ─── */
export const φRadius = {
  xs:  5,
  sm:  8,
  md: 13,
  lg: 21,
  xl: 34,
} as const;

/* ─── Spacing Scale (Fibonacci) ─── */
export const φSpace = {
  1:  3,
  2:  5,
  3:  8,
  4: 13,
  5: 21,
  6: 34,
  7: 55,
} as const;

/* ─── Layout Proportions ─── */
export const φLayout = {
  major: 0.618,  // 61.8%
  minor: 0.382,  // 38.2%
} as const;

/* ─── Line Heights ─── */
export const φLineHeight = {
  tight:   1.272,  // √φ — headings
  normal:  1.5,    // body text
  relaxed: 1.618,  // φ — display headings
} as const;

/* ─── iPhone 16 Pro Max Device Constants ─── */
export const φDevice = {
  /** Logical viewport width */
  width:  440,
  /** Logical viewport height */
  height: 956,
  /** Dynamic Island + status bar safe area */
  safeTop: 59,
  /** Home indicator safe area (Figma Make optimized) */
  safeBottom: 20,
  /** Device corner radius */
  cornerRadius: 55,
  /** Tab bar content height (excl. safe area) */
  tabBarHeight: 52,
  /** Total bottom chrome = tab bar + home indicator */
  bottomChrome: 72,
  /** Usable content height = total - safeTop - bottomChrome */
  contentHeight: 956 - 59 - 72,  // = 825pt
  /** Content width with standard 20px side padding */
  contentWidth: 440 - 40,  // = 400pt
  /** Standard horizontal content padding */
  contentPad: 20,
} as const;

/* ─── Elevation System (Enterprise Depth) ─── */
export const φElevation = {
  /** Cards resting on background */
  card: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  /** Raised interactive elements */
  raised: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
  /** Floating elements (FABs, popovers) */
  float: '0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
  /** Overlay sheets/modals */
  overlay: '0 16px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
} as const;

/* ─── Transition Presets ─── */
export const φMotion = {
  /** Standard UI transitions */
  fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  /** Card/surface transitions */
  normal: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  /** Page/sheet transitions */
  smooth: '0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  /** Spring-like bounce */
  spring: '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;