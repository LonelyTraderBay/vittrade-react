import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('hides simulated device chrome from the accessibility tree', () => {
    const { container } = renderWithProviders(<StatusBar />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
