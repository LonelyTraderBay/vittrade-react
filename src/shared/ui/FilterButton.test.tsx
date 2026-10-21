import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterButton } from './FilterButton';

describe('FilterButton', () => {
  it('keeps selection controlled and its accessible label stable', async () => {
    const click = vi.fn();
    const { rerender, container } = render(
      <FilterButton label="Completed" selected={false} onClick={click} />,
    );
    const button = screen.getByRole('button', { name: 'Completed', pressed: false });
    await userEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveStyle({ visibility: 'hidden' });
    rerender(<FilterButton label="Completed" selected onClick={click} />);
    expect(screen.getByRole('button', { name: 'Completed', pressed: true })).toBe(button);
    expect(button).toHaveFocus();
    expect(container.querySelector('svg')).toHaveStyle({ visibility: 'visible' });
    await userEvent.click(button);
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('uses native Enter and Space without submitting the surrounding form', async () => {
    const click = vi.fn(),
      submit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={submit}>
        <FilterButton label="Withdrawal" selected onClick={click} />
      </form>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter} ');
    expect(click).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Withdrawal' })).toHaveFocus();
  });

  it('keeps every choice in native Tab order and leaves query behavior to its parent', async () => {
    const select = vi.fn();
    render(
      <div role="group" aria-label="Order status">
        <FilterButton label="Processing" selected onClick={() => select('processing')} />
        <FilterButton label="Completed" selected={false} onClick={() => select('completed')} />
      </div>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Processing' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(select).toHaveBeenCalledExactlyOnceWith('completed');
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
