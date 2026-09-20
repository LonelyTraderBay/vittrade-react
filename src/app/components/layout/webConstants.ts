/**
 * ══════════════════════════════════════════════════════════
 *  WEB SHELL CONSTANTS — Single Source of Truth
 * ══════════════════════════════════════════════════════════
 *
 *  All Web shell dimension constants live here to avoid
 *  circular imports between WebShell <-> WebSidebar <-> WebCommandBar.
 *
 *  Usage:
 *    import { WEB_SIDEBAR_WIDTH } from './webConstants';
 *
 *  Layout math at common viewports (content = viewport - sidebar - 2*padding, capped by maxWidth):
 *
 *  | Viewport | After sidebar | After padding | Usable content  |
 *  | 1920px   | 1660px        | 1596px        | 1536px (capped) |
 *  | 1600px   | 1340px        | 1276px        | 1276px          |
 *  | 1440px   | 1180px        | 1116px        | 1116px          |
 *  | 1280px   | 1020px        |  956px        |  956px          |
 */

/* ─── Structural dimensions ─── */

/** Sidebar width (always expanded on web) */
export const WEB_SIDEBAR_WIDTH = 260;

/** Command bar / top bar height */
export const WEB_COMMAND_BAR_HEIGHT = 64;

/** Full-bleed viewport height (viewport minus command bar) */
export const WEB_FULL_BLEED_HEIGHT = `calc(100vh - ${WEB_COMMAND_BAR_HEIGHT}px)`;

/**
 * Full-bleed page height patterns:
 *
 *   VIEWPORT-LOCKED (no page scroll — TradePage, Scanner):
 *     style={{ height: WEB_FULL_BLEED_HEIGHT }}
 *     Page panels manage their own internal scroll.
 *
 *   SCROLLABLE (page scrolls as a whole — Analytics):
 *     style={{ minHeight: WEB_FULL_BLEED_HEIGHT }}
 *     Shell's outer scroll container handles page scroll.
 */

/** Max width for standard (non-full-bleed) content area */
export const WEB_CONTENT_MAX_WIDTH = 1600;

/** Horizontal padding inside the content wrapper */
export const WEB_CONTENT_PADDING = 32;

/* ─── Full-bleed route detection ─── */

/**
 * Trade sub-routes that are NOT full-bleed (standard layout pages).
 * Everything under /w/trade/ that isn't in this list AND doesn't match
 * a known non-pair segment is considered a trading terminal (full-bleed).
 */
const TRADE_STANDARD_SEGMENTS = new Set([
  'orders', 'orders-history', 'bots', 'copy', 'settings', 'convert',
]);

/**
 * Explicit full-bleed routes (non-trade).
 */
const EXPLICIT_FULL_BLEED = [
  '/w/scanner',
  '/w/trade/analytics',
];

/**
 * Check if a pathname should render full-bleed (no maxWidth, no side padding).
 *
 * Full-bleed pages:
 * - /w/trade/:pairId (e.g. /w/trade/btcusdt) — trading terminal
 * - /w/trade/analytics — analytics dashboard
 * - /w/scanner — market scanner
 *
 * NOT full-bleed:
 * - /w/trade/bots, /w/trade/orders, /w/trade/copy, etc.
 */
export function isFullBleedRoute(pathname: string): boolean {
  // Check explicit full-bleed routes first
  if (EXPLICIT_FULL_BLEED.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Check if it's a trade pair page: /w/trade/:pairId
  if (pathname.startsWith('/w/trade/')) {
    const segment = pathname.replace('/w/trade/', '').split('/')[0];
    // If the segment is a known non-pair route, it's NOT full-bleed
    if (TRADE_STANDARD_SEGMENTS.has(segment)) {
      return false;
    }
    // Otherwise it's a trading pair page (full-bleed)
    if (segment && segment.length > 0) {
      return true;
    }
  }

  return false;
}

/* ─── Enterprise desktop font scale ─── */
export const WEB_FONT = {
  /** Micro labels, keyboard hints */
  xs: 11,
  /** Captions, helper text, badges */
  sm: 12,
  /** Body text, nav items, table cells */
  base: 13,
  /** Emphasized body, search input */
  md: 14,
  /** Sub-headings, widget titles */
  lg: 16,
  /** Section headings */
  xl: 18,
  /** Page titles */
  '2xl': 22,
  /** Display / hero numbers */
  '3xl': 28,

  /**
   * @deprecated Legacy nested aliases — use flat keys instead (e.g. WEB_FONT.xs, WEB_FONT.base)
   * Kept for backward compatibility with Gen 2.5 pages. Will be removed after migration.
   */
  SIZE: {
    CAPTION: 11,
    SMALL: 12,
    BODY: 13,
    H4: 14,
    H3: 16,
    HEADING_3: 16,
    H2: 18,
    HEADING_2: 18,
    HEADING_1: 22,
  },
  /** @deprecated Use literal font-weight numbers (400/500/600/700) instead */
  WEIGHT: {
    REGULAR: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
} as const;

/* ─── Enterprise desktop spacing ─── */
export const WEB_SPACING = {
  /** Row height -- compact (data tables, lists) */
  rowCompact: 44,
  /** Row height -- default (standard tables) */
  rowDefault: 52,
  /** Row height -- relaxed (settings, forms) */
  rowRelaxed: 60,
  /** Card padding -- compact */
  cardCompact: 16,
  /** Card padding -- default */
  cardDefault: 20,
  /** Card padding -- relaxed */
  cardRelaxed: 24,

  /**
   * @deprecated Legacy aliases — use named keys (cardDefault, rowDefault) or literal values instead.
   * Kept for backward compatibility with Gen 2.5 pages.
   */
  SM: 8,
  MD: 16,
  LG: 24,
  XXL: 32,
  CARD_PADDING: 20,
  CARD_GAP: 16,
  SECTION_VERTICAL: 24,
  PAGE_HORIZONTAL: 32,
  BUTTON_HORIZONTAL: 16,

  /** @deprecated lowercase aliases for pages using WEB_SPACING.sm/lg/xxl */
  sm: 8,
  md: 16,
  lg: 24,
  xxl: 32,
} as const;

/* ─── Enterprise desktop icon scale ─── */
export const WEB_ICON = {
  /** Tiny inline icons */
  xs: 14,
  /** Secondary icons (badges, status) */
  sm: 16,
  /** Standard icons (nav, buttons) */
  md: 18,
  /** Primary feature icons */
  lg: 20,
  /** Hero / stat icons */
  xl: 24,

  /**
   * @deprecated Legacy nested aliases — use flat keys (WEB_ICON.sm, WEB_ICON.md) instead.
   */
  SIZE: {
    SM: 16,
    SMALL: 16,
    MD: 18,
    MEDIUM: 18,
    LARGE: 20,
    XLARGE: 24,
  },
  /** @deprecated Use literal pixel values instead */
  CONTAINER: {
    MD: 36,
    LARGE: 40,
    XLARGE: 48,
  },
} as const;

/* ─── Enterprise desktop button heights ─── */
export const WEB_BUTTON = {
  /** Inline micro buttons */
  xs: 28,
  /** Small action buttons (icon-only) */
  sm: 32,
  /** Default buttons */
  md: 40,
  /** Primary CTA buttons */
  lg: 48,

  /** @deprecated Use flat keys (WEB_BUTTON.md) and literal borderRadius instead */
  HEIGHT: {
    SMALL: 32,
    MEDIUM: 40,
    LARGE: 48,
  },
  /** @deprecated Use literal `8` instead */
  RADIUS: 8,
} as const;