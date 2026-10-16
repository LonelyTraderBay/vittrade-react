import type { CSSProperties } from 'react';

/** Shared CSS contract between a padded app shell and page-level layout primitives. */
export const PAGE_INLINE_GUTTER_CSS_VAR = '--tr-page-inline-gutter' as const;

export type PageGutterOwnerStyle = CSSProperties & {
  [PAGE_INLINE_GUTTER_CSS_VAR]?: string;
};

/** The shell owns the horizontal gutter when it already applies max-width + side padding. */
export const SHELL_PAGE_GUTTER_OWNER_STYLE: PageGutterOwnerStyle = {
  [PAGE_INLINE_GUTTER_CSS_VAR]: '0px',
};

/** Keep the existing 20px page gutter where no padded shell is present. */
export function pageInlineGutterStyle(fullBleed = false): Pick<CSSProperties, 'paddingInline'> {
  return {
    paddingInline: fullBleed ? 0 : `var(${PAGE_INLINE_GUTTER_CSS_VAR}, 20px)`,
  };
}
