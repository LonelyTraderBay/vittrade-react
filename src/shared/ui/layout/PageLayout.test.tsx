import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PageLayout, StickyFooter } from './PageLayout';

describe('StickyFooter', () => {
  it('supports the page background without a top border', () => {
    renderWithProviders(
      <StickyFooter bg="bg" border={false} className="coverage-footer">
        <button type="button">Save changes</button>
      </StickyFooter>,
    );

    const footer = screen.getByRole('button', { name: 'Save changes' }).parentElement;
    expect(footer).toHaveClass('coverage-footer');
    expect((footer as HTMLDivElement).style.borderTopStyle).toBe('none');
    expect((footer as HTMLDivElement).style.paddingInline).toBe(
      'var(--tr-page-inline-gutter, 20px)',
    );
    expect(footer?.getAttribute('style')).toContain('background');
  });
});

describe('PageLayout owner contract', () => {
  it('provides a labeled main region with stable minimum height and bottom clearance', () => {
    renderWithProviders(
      <PageLayout id="region" aria-label="Overview">
        Content
      </PageLayout>,
    );
    const main = screen.getByRole('main', { name: 'Overview' });
    expect(main).toHaveAttribute('id', 'region');
    expect(main).toHaveStyle({ minHeight: '100%', paddingBottom: '32px' });
  });

  it('delegates bottom clearance explicitly for a flush layout', () => {
    renderWithProviders(<PageLayout variant="flush">Content</PageLayout>);
    expect(screen.getByRole('main')).toHaveStyle({ paddingBottom: '0px', minHeight: '100%' });
  });
});
