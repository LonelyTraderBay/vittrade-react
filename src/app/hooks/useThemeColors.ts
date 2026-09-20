/**
 * ══════════════════════════════════════════════════════════
 *  useThemeColors — Semantic color tokens for inline styles
 * ══════════════════════════════════════════════════════════
 *
 *  UNIFIED: All values now reference CSS custom properties
 *  from theme.css (single source of truth). The `.dark` / `.light`
 *  class on <html> handles theme switching automatically.
 *
 *  Components use: `const c = useThemeColors()` then
 *  `style={{ color: c.text1 }}` — works because React inline
 *  styles accept CSS var() references as string values.
 */

const TOKENS = {
  bg: 'var(--tr-bg)',
  surface: 'var(--tr-surface)',
  surface2: 'var(--tr-surface-2)',
  surface3: 'var(--tr-surface-3)',
  border: 'var(--tr-border)',
  borderSolid: 'var(--tr-border-solid)',
  primary: 'var(--tr-primary)',
  primaryDark: 'var(--tr-primary-dark)',
  primarySoft: 'var(--tr-primary-soft)',
  buy: 'var(--tr-buy)',
  buyDark: 'var(--tr-buy-dark)',
  sell: 'var(--tr-sell)',
  sellDark: 'var(--tr-sell-dark)',
  warn: 'var(--tr-warn)',
  caution: 'var(--tr-caution)',
  info: 'var(--tr-info)',
  accent: 'var(--tr-accent)',
  riskWarning: 'var(--tr-warn)',

  // Semantic aliases (map to existing CSS variables)
  success: 'var(--tr-buy)', // #10B981 — green
  error: 'var(--tr-sell)', // #EF4444 — red
  warning: 'var(--tr-warn)', // #F0A63A — amber warning

  text1: 'var(--tr-text-1)',
  text2: 'var(--tr-text-2)',
  text3: 'var(--tr-text-3)',

  // Chips/Tabs
  chipActiveBg: 'var(--tr-chip-active-bg)',
  chipActiveText: 'var(--tr-chip-active-text)',
  chipActiveBorder: 'var(--tr-chip-active-border)',
  chipBg: 'var(--tr-chip-bg)',
  chipText: 'var(--tr-chip-text)',
  chipBorder: 'var(--tr-chip-border)',

  // StatusBar
  statusBarText: 'var(--tr-status-bar-text)',
  statusBarIcon: 'var(--tr-status-bar-icon)',
  statusBarIconDim: 'var(--tr-status-bar-icon-dim)',
  statusBarBattery: 'var(--tr-status-bar-battery)',

  // BottomNav
  navBg: 'var(--tr-nav-bg)',
  navBorder: 'var(--tr-nav-border)',
  navInactive: 'var(--tr-nav-inactive)',
  navActive: 'var(--tr-nav-active)',
  navCenterBg: 'var(--tr-nav-center-bg)',
  navCenterIcon: 'var(--tr-nav-center-icon)',
  navGradientFrom: 'var(--tr-nav-gradient-from)',
  navGradientMid: 'var(--tr-nav-gradient-mid)',
  navGradientTo: 'var(--tr-nav-gradient-to)',

  // MobileFrame
  frameBg: 'var(--tr-frame-bg)',
  frameOuter: 'var(--tr-frame-outer)',

  // Dynamic Island
  diBackground: 'var(--tr-di-bg)',

  // Home indicator
  homeBar: 'var(--tr-home-bar)',

  // Cards
  cardBg: 'var(--tr-card-bg)',
  cardBorder: 'var(--tr-card-border)',
  cardShadow: 'var(--tr-card-shadow)',

  // Hover
  hoverBg: 'var(--tr-hover-bg)',

  // Search bar
  searchBg: 'var(--tr-search-bg)',
  searchBorder: 'var(--tr-search-border)',
  searchPlaceholder: 'var(--tr-search-placeholder)',

  // Divider
  divider: 'var(--tr-divider)',

  // Portfolio card
  portfolioBg: 'var(--tr-portfolio-bg)',
  portfolioBorder: 'var(--tr-portfolio-border)',
  portfolioShadow: 'var(--tr-portfolio-shadow)',
  portfolioTextDim: 'var(--tr-portfolio-text-dim)',
  portfolioTextMuted: 'var(--tr-portfolio-text-muted)',
  portfolioBtnGhost: 'var(--tr-portfolio-btn-ghost)',
  portfolioBtnGhostBorder: 'var(--tr-portfolio-btn-ghost-border)',
  portfolioBtnGhostText: 'var(--tr-portfolio-btn-ghost-text)',

  // Section
  sectionLabelColor: 'var(--tr-section-label-color)',

  // Toggle
  toggleTrackOff: 'var(--tr-toggle-track-off)',

  // Warning/Alert
  warningBg: 'var(--tr-warning-bg)',
  warningBorder: 'var(--tr-warning-border)',
  warningText: 'var(--tr-warning-text)',

  // ─── Alpha variants (backed by CSS custom properties) ───
  // Primary alpha (#E58A00)
  primaryAlpha08: 'var(--tr-primary-alpha-08)',
  primaryAlpha12: 'var(--tr-primary-alpha-12)',
  primaryAlpha15: 'var(--tr-primary-alpha-15)',
  primaryAlpha20: 'var(--tr-primary-alpha-20)',
  primaryAlpha30: 'var(--tr-primary-alpha-30)',
  primaryAlpha40: 'var(--tr-primary-alpha-40)',
  primaryAlpha60: 'var(--tr-primary-alpha-60)',
  // Buy (green) alpha (#10B981)
  buyAlpha10: 'var(--tr-buy-alpha-10)',
  buyAlpha12: 'var(--tr-buy-alpha-12)',
  buyAlpha15: 'var(--tr-buy-alpha-15)',
  buyAlpha20: 'var(--tr-buy-alpha-20)',
  // Sell (red) alpha (#EF4444)
  sellAlpha10: 'var(--tr-sell-alpha-10)',
  sellAlpha15: 'var(--tr-sell-alpha-15)',
  sellAlpha20: 'var(--tr-sell-alpha-20)',
  // Warn alpha (#F0A63A)
  warnAlpha10: 'var(--tr-warn-alpha-10)',
  warnAlpha15: 'var(--tr-warn-alpha-15)',
  // Accent (purple) alpha (#8B5CF6)
  accentAlpha06: 'var(--tr-accent-alpha-06)',
  accentAlpha08: 'var(--tr-accent-alpha-08)',
  accentAlpha10: 'var(--tr-accent-alpha-10)',
  accentAlpha12: 'var(--tr-accent-alpha-12)',
  accentAlpha15: 'var(--tr-accent-alpha-15)',
  accentAlpha20: 'var(--tr-accent-alpha-20)',
  accentAlpha30: 'var(--tr-accent-alpha-30)',

  // ─── Deprecated aliases (backward compat for Gen 2.5 pages) ───
  // These map phantom token names to real CSS vars.
  // New code should use the canonical names above.

  /** @deprecated Use `text1` */
  text: 'var(--tr-text-1)',
  /** @deprecated Use `text1` */
  textPrimary: 'var(--tr-text-1)',
  /** @deprecated Use `text3` */
  textSecondary: 'var(--tr-text-3)',
  /** @deprecated Use `text3` */
  textTertiary: 'var(--tr-text-3)',
  /** @deprecated Use `bg` */
  background: 'var(--tr-bg)',
  /** @deprecated Use `hoverBg` */
  surfaceHover: 'var(--tr-hover-bg)',
  /** @deprecated Use `primary` */
  primaryHover: 'var(--tr-primary)',
  /** @deprecated Use `error` */
  danger: 'var(--tr-sell)',
  /** @deprecated Use `text2` */
  textSec: 'var(--tr-text-2)',
  /** @deprecated Use `text3` */
  textTer: 'var(--tr-text-3)',
  /** @deprecated Use `primary` */
  ring: 'var(--tr-primary)',
} as const;

export type ThemeColors = typeof TOKENS;

/**
 * Returns semantic color tokens backed by CSS custom properties.
 * No theme dependency needed — CSS handles dark/light switching
 * via `.dark` / `.light` class on <html>.
 */
export function useThemeColors(): ThemeColors {
  return TOKENS;
}
