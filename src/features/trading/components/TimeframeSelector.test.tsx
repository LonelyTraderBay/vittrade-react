import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeframePills, TimeframeSelector } from './TimeframeSelector';

afterEach(cleanup);

describe('TimeframeSelector', () => {
  it('renders each candle interval and reports the selected interval', () => {
    const onChange = vi.fn();
    render(<TimeframeSelector active="1h" onChange={onChange} />);

    expect(screen.getByRole('button', { name: '1H' })).toHaveStyle({ fontWeight: 700 });
    fireEvent.click(screen.getByRole('button', { name: '15m' }));

    expect(onChange).toHaveBeenCalledWith('15m');
  });

  it('uses compact sizing when requested', () => {
    render(<TimeframeSelector active="1d" onChange={vi.fn()} compact />);

    expect(screen.getByRole('button', { name: '1D' })).toHaveStyle({
      padding: '4px 8px',
      minWidth: '32px',
    });
  });

  it('renders only the mini chart intervals and reports pill selection', () => {
    const onChange = vi.fn();
    render(<TimeframePills active="1d" onChange={onChange} />);

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '1H',
      '1D',
      '1W',
    ]);
    fireEvent.click(screen.getByRole('button', { name: '1W' }));

    expect(onChange).toHaveBeenCalledWith('1w');
  });
});
