/* ─── Enterprise desktop font scale ─── */
export const WEB_COMMAND_BAR_HEIGHT = 64;

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
