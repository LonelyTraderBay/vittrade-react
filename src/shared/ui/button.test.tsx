import { fireEvent, screen } from '@testing-library/react';
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
    expect(screen.getByRole('link', { name: 'Browse markets' })).not.toHaveAttribute('type');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('defaults native actions to button and preserves explicit submit behavior', () => {
    let submitCount = 0;
    renderWithTheme(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitCount += 1;
        }}
      >
        <Button>Action</Button>
        <Button type="submit">Save</Button>
      </form>,
    );

    const action = screen.getByRole('button', { name: 'Action' });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(action).toHaveAttribute('type', 'button');
    expect(save).toHaveAttribute('type', 'submit');

    fireEvent.click(action);
    expect(submitCount).toBe(0);
    fireEvent.click(save);
    expect(submitCount).toBe(1);
  });
});
