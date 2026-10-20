import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PageLayout, StickyFooter } from './PageLayout';

describe('PageLayout spacing contract', () => {
  it('uses the default page inset and exposes the main landmark', () => {
    renderWithProviders(
      <PageLayout id="page-layout-contract" aria-label="Page content">
        <span>Content</span>
      </PageLayout>,
    );

    const page = screen.getByRole('main', { name: 'Page content' });
    expect(page).toHaveAttribute('id', 'page-layout-contract');
    expect(page).toHaveClass('flex', 'flex-col');
    expect(page).toHaveStyle({ minHeight: '100%', paddingBottom: '32px' });
  });

  it('keeps the flush layout free of an extra bottom inset for sticky actions', () => {
    renderWithProviders(
      <PageLayout variant="flush">
        <span>Content</span>
      </PageLayout>,
    );

    expect(screen.getByRole('main')).toHaveStyle({ paddingBottom: '0px' });
  });
});

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
    expect(footer?.getAttribute('style')).toContain('background');
  });
});
