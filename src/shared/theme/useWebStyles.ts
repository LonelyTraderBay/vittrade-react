/**
 * ══════════════════════════════════════════════════════════
 *  useWebStyles — Enterprise Desktop Style Factories
 * ══════════════════════════════════════════════════════════
 *
 *  Combines useThemeColors() semantic tokens with the enterprise
 *  sizing constants from webConstants.ts into ready-to-use style
 *  objects for Web pages.
 *
 *  Usage:
 *    const ws = useWebStyles();
 *
 *    <h1 style={ws.pageTitle}>Markets</h1>
 *    <span style={ws.label}>Volume 24h</span>
 *    <span style={ws.value}>$1,234,567</span>
 *    <div style={ws.tableRow}>...</div>
 *    <div style={ws.card}>...</div>
 *
 *  All numeric values follow the enterprise desktop scale defined
 *  in webConstants.ts (WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON).
 */

import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import {
  WEB_FONT,
  WEB_SPACING,
  WEB_ICON,
  WEB_BUTTON,
  WEB_COMMAND_BAR_HEIGHT,
} from '@/shared/theme/webTokens';

export interface WebStyles {
  /* ─── Typography ─── */

  /** Page title: 22px bold — "Thị trường", "Ví tài sản" */
  pageTitle: React.CSSProperties;
  /** Section heading: 16px semibold — "Tài sản", "Hoạt động gần đây" */
  sectionTitle: React.CSSProperties;
  /** Widget/card title: 14px bold */
  widgetTitle: React.CSSProperties;
  /** Body text: 13px regular */
  body: React.CSSProperties;
  /** Emphasized body: 14px medium */
  bodyEm: React.CSSProperties;
  /** Label/caption: 11px semibold uppercase — table headers, stat labels */
  label: React.CSSProperties;
  /** Helper/description text: 12px regular */
  helper: React.CSSProperties;
  /** Numeric value: 14px semibold tabular-nums */
  value: React.CSSProperties;
  /** Large numeric value: 18px bold tabular-nums — prices, totals */
  valueLg: React.CSSProperties;
  /** Display numeric: 22px bold tabular-nums — portfolio total */
  valueXl: React.CSSProperties;
  /** Hero display numeric: 28px bold tabular-nums — dashboard hero */
  valueHero: React.CSSProperties;
  /** Subtitle/description: 13px regular text3 */
  subtitle: React.CSSProperties;
  /** Badge text: 11px semibold */
  badge: React.CSSProperties;

  /* ─── Containers ─── */

  /** Standard card: surface bg, border, rounded-xl */
  card: React.CSSProperties;
  /** Card header bar: bottom border, standard padding */
  cardHeader: React.CSSProperties;
  /** Card body with default padding */
  cardBody: React.CSSProperties;
  /** Card body with compact padding */
  cardBodyCompact: React.CSSProperties;

  /* ─── Table ─── */

  /** Table header row: compact height, label styling */
  tableHeaderRow: React.CSSProperties;
  /** Table header cell text: label style */
  tableHeaderCell: React.CSSProperties;
  /** Table body row: default height, hover-ready */
  tableRow: React.CSSProperties;
  /** Table body row: compact height */
  tableRowCompact: React.CSSProperties;
  /** Table cell text */
  tableCell: React.CSSProperties;
  /** Table cell numeric */
  tableCellNum: React.CSSProperties;

  /* ─── Interactive ─── */

  /** Search bar container */
  searchBar: React.CSSProperties;
  /** Search input text */
  searchInput: React.CSSProperties;
  /** Filter chip (inactive) */
  chip: React.CSSProperties;
  /** Filter chip (active) */
  chipActive: React.CSSProperties;

  /* ─── Layout helpers ─── */

  /** Divider line */
  divider: React.CSSProperties;
  /** Row with bottom border */
  rowBorder: React.CSSProperties;

  /* ─── Sizing references (not styles, just numbers) ─── */
  font: typeof WEB_FONT;
  spacing: typeof WEB_SPACING;
  icon: typeof WEB_ICON;
  button: typeof WEB_BUTTON;
  commandBarHeight: number;

  /** Theme colors (passthrough for convenience) */
  c: ThemeColors;
}

export function useWebStyles(): WebStyles {
  const c = useThemeColors();

  return {
    /* ─── Typography ─── */
    pageTitle: {
      color: c.text1,
      fontSize: WEB_FONT['2xl'],
      fontWeight: 700,
      margin: 0,
      lineHeight: 1.3,
    },
    sectionTitle: {
      color: c.text1,
      fontSize: WEB_FONT.lg,
      fontWeight: 600,
      margin: 0,
    },
    widgetTitle: {
      color: c.text1,
      fontSize: WEB_FONT.md,
      fontWeight: 700,
    },
    body: {
      color: c.text1,
      fontSize: WEB_FONT.base,
    },
    bodyEm: {
      color: c.text1,
      fontSize: WEB_FONT.md,
      fontWeight: 500,
    },
    label: {
      color: c.text3,
      fontSize: WEB_FONT.xs,
      fontWeight: 600,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
    },
    helper: {
      color: c.text3,
      fontSize: WEB_FONT.sm,
    },
    value: {
      color: c.text1,
      fontSize: WEB_FONT.md,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    },
    valueLg: {
      color: c.text1,
      fontSize: WEB_FONT.xl,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    },
    valueXl: {
      color: c.text1,
      fontSize: WEB_FONT['2xl'],
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    },
    valueHero: {
      color: c.text1,
      fontSize: WEB_FONT['3xl'],
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    },
    subtitle: {
      color: c.text3,
      fontSize: WEB_FONT.base,
    },
    badge: {
      fontSize: WEB_FONT.xs,
      fontWeight: 600,
    },

    /* ─── Containers ─── */
    card: {
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${WEB_SPACING.cardCompact}px ${WEB_SPACING.cardDefault}px`,
      borderBottom: `1px solid ${c.divider}`,
    },
    cardBody: {
      padding: WEB_SPACING.cardDefault,
    },
    cardBodyCompact: {
      padding: WEB_SPACING.cardCompact,
    },

    /* ─── Table ─── */
    tableHeaderRow: {
      display: 'grid',
      alignItems: 'center',
      padding: `10px ${WEB_SPACING.cardDefault}px`,
      borderBottom: `1px solid ${c.divider}`,
    },
    tableHeaderCell: {
      color: c.text3,
      fontSize: WEB_FONT.xs,
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    tableRow: {
      display: 'grid',
      alignItems: 'center',
      padding: `0 ${WEB_SPACING.cardDefault}px`,
      minHeight: WEB_SPACING.rowDefault,
      transition: 'background 0.1s ease',
    },
    tableRowCompact: {
      display: 'grid',
      alignItems: 'center',
      padding: `0 ${WEB_SPACING.cardDefault}px`,
      minHeight: WEB_SPACING.rowCompact,
      transition: 'background 0.1s ease',
    },
    tableCell: {
      color: c.text1,
      fontSize: WEB_FONT.base,
      fontWeight: 500,
    },
    tableCellNum: {
      color: c.text1,
      fontSize: WEB_FONT.base,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    },

    /* ─── Interactive ─── */
    searchBar: {
      background: c.searchBg,
      border: `1px solid ${c.searchBorder}`,
      height: 42,
      borderRadius: 12,
    },
    searchInput: {
      color: c.text1,
      fontSize: WEB_FONT.md,
      fontWeight: 400,
    },
    chip: {
      fontSize: WEB_FONT.sm,
      fontWeight: 500,
      padding: '6px 14px',
      borderRadius: 8,
      border: '1px solid transparent',
      background: 'transparent',
      color: c.text3,
      transition: 'all 0.15s ease',
    },
    chipActive: {
      fontSize: WEB_FONT.sm,
      fontWeight: 600,
      padding: '6px 14px',
      borderRadius: 8,
      background: c.chipActiveBg,
      color: c.chipActiveText,
      border: `1px solid ${c.chipActiveBorder}`,
    },

    /* ─── Layout helpers ─── */
    divider: {
      height: 1,
      background: c.divider,
      width: '100%',
    },
    rowBorder: {
      borderBottom: `1px solid ${c.divider}`,
    },

    /* ─── Sizing references ─── */
    font: WEB_FONT,
    spacing: WEB_SPACING,
    icon: WEB_ICON,
    button: WEB_BUTTON,
    commandBarHeight: WEB_COMMAND_BAR_HEIGHT,

    /* ─── Theme colors passthrough ─── */
    c,
  };
}
