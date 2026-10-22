import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PageContent, PageSection } from './PageContent';
import { PAGE_INLINE_GUTTER_CSS_VAR, SHELL_PAGE_GUTTER_OWNER_STYLE } from './pageGutter';

describe('PageContent gutter contract', () => {
  it.each([
    ['compact', 'pt-2', 8],
    ['standard', 'pt-3', 16],
    ['relaxed', 'pt-4', 24],
    ['hero', 'pt-4', 24],
    ['tool', 'pt-2', 8],
  ] as const)('maps %s density through the existing presets', (density, padding, gap) => {
    const { container } = renderWithProviders(<PageContent density={density}>Content</PageContent>);
    expect(container.firstChild).toHaveClass(padding);
    expect(container.firstChild).toHaveStyle({ gap: `${gap}px` });
  });

  it('lets explicit presets and measured gaps win over density', () => {
    const { container } = renderWithProviders(
      <PageContent density="hero" padding="none" gap={12} fullBleed grow>
        Content
      </PageContent>,
    );
    expect(container.firstChild).toHaveClass('flex-1');
    expect(container.firstChild).not.toHaveClass('pt-4');
    expect(container.firstChild).toHaveStyle({ gap: '12px', paddingInline: '0px', minHeight: '0' });
  });

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

describe('PageSection semantic heading contract', () => {
  it.each([2, 3, 4] as const)(
    'forwards heading level %i without changing title styling',
    (level) => {
      const { getByRole } = renderWithProviders(
        <PageSection label="Thanh khoản" headingLevel={level}>
          Body
        </PageSection>,
      );
      expect(getByRole('heading', { level, name: 'Thanh khoản' })).toHaveStyle({
        fontSize: '14px',
        fontWeight: 700,
      });
    },
  );
  it('preserves the existing h3 default for unchanged consumers', () => {
    const { getByRole } = renderWithProviders(<PageSection label="Mặc định">Body</PageSection>);
    expect(getByRole('heading', { level: 3, name: 'Mặc định' })).toBeVisible();
  });
});
