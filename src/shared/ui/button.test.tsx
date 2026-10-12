import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '@/test/test-utils';
import { Button } from './button';

describe('Button', () => {
  it('renders a density-styled anchor through the Radix slot', () => {
    renderWithTheme(
      <Button asChild density="compact">
        <a href="/markets">Browse markets</a>
      </Button>,
    );

    expect(screen.getByRole('link', { name: 'Browse markets' })).toHaveClass('h-[36px]');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
