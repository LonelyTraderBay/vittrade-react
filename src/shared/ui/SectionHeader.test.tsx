import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('preserves the default heading level for existing consumers', () => {
    renderWithProviders(<SectionHeader title="Default section" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Default section' })).toBeInTheDocument();
  });

  it('uses the requested semantic heading level', () => {
    renderWithProviders(<SectionHeader title="Top-level section" headingLevel={2} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Top-level section' }),
    ).toBeInTheDocument();
  });
});
