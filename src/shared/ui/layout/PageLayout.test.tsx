import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { StickyFooter } from './PageLayout';

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
