import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PageContent } from './PageContent';
import { PAGE_INLINE_GUTTER_CSS_VAR, SHELL_PAGE_GUTTER_OWNER_STYLE } from './pageGutter';

describe('PageContent gutter contract', () => {
  it('uses the shell gutter when provided and preserves the 20px standalone fallback', () => {
    const { container } = renderWithProviders(
      <>
        <div style={SHELL_PAGE_GUTTER_OWNER_STYLE}>
          <PageContent className="shell-gutter">Shell content</PageContent>
        </div>
        <PageContent className="standalone-gutter">Standalone content</PageContent>
      </>,
    );

    const shell = container.querySelector('.shell-gutter')?.parentElement;
    expect(shell?.style.getPropertyValue(PAGE_INLINE_GUTTER_CSS_VAR)).toBe('0px');
    expect(container.querySelector('.shell-gutter')?.getAttribute('style')).toContain(
      'padding-inline: var(--tr-page-inline-gutter, 20px)',
    );
    expect(container.querySelector('.standalone-gutter')?.getAttribute('style')).toContain(
      'padding-inline: var(--tr-page-inline-gutter, 20px)',
    );
  });

  it('removes the page gutter for full-bleed content', () => {
    const { container } = renderWithProviders(
      <PageContent className="full-bleed-gutter" fullBleed>
        Full-bleed content
      </PageContent>,
    );

    expect(container.querySelector('.full-bleed-gutter')?.getAttribute('style')).toContain(
      'padding-inline: 0px',
    );
  });
});
