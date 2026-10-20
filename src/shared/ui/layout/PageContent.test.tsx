import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageContent } from './PageContent';

describe('PageContent spacing contract', () => {
  it.each([
    ['compact', 'pt-2', '8px'],
    ['standard', 'pt-3', '16px'],
    ['relaxed', 'pt-4', '24px'],
    ['hero', 'pt-4', '24px'],
    ['tool', 'pt-2', '8px'],
  ] as const)('maps %s density to its page spacing roles', (density, topPadding, gap) => {
    const { container } = render(
      <PageContent density={density}>
        <span>Content</span>
      </PageContent>,
    );

    const pageContent = container.firstElementChild as HTMLElement;
    expect(pageContent).toHaveClass('flex', 'flex-col', 'px-5', topPadding);
    expect(pageContent).toHaveStyle({ gap });
  });

  it('lets named spacing presets override density and fullBleed remove only the gutter', () => {
    const { container } = render(
      <PageContent density="compact" padding="relaxed" gap="loose" fullBleed>
        <span>Content</span>
      </PageContent>,
    );

    const pageContent = container.firstElementChild as HTMLElement;
    expect(pageContent).toHaveClass('pt-4');
    expect(pageContent).not.toHaveClass('px-5');
    expect(pageContent).toHaveStyle({ gap: '32px' });
  });

  it('preserves explicit numeric gaps for data-driven geometry', () => {
    const { container } = render(
      <PageContent density="standard" gap={12}>
        <span>Content</span>
      </PageContent>,
    );

    expect(container.firstElementChild).toHaveStyle({ gap: '12px' });
  });
});
