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
  'orders',
  'orders-history',
  'bots',
  'copy',
  'settings',
  'convert',
]);

/**
 * Explicit full-bleed routes (non-trade).
 */
const EXPLICIT_FULL_BLEED = ['/w/scanner', '/w/trade/analytics'];

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
  if (EXPLICIT_FULL_BLEED.some((route) => pathname.startsWith(route))) {
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

export { WEB_BUTTON, WEB_FONT, WEB_ICON, WEB_SPACING } from '@/shared/theme/webTokens';
