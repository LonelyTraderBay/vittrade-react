import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TabBar } from './TabBar';

describe('TabBar', () => {
  it('exposes the selected tab and wraps keyboard navigation in both directions', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TabBar
        id="market-tabs"
        tabs={['all', 'spot', 'futures']}
        active="all"
        onChange={onChange}
      />,
    );

    const tabs = screen.getAllByRole('tab');
    expect(screen.getByRole('tablist', { name: '' })).toHaveAttribute('id', 'market-tabs');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('futures');
    rerender(
      <TabBar
        id="market-tabs"
        tabs={['all', 'spot', 'futures']}
        active="futures"
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(screen.getAllByRole('tab')[2], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('all');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('renders object tabs and only emits changes when a different pill is selected', () => {
    const onChange = vi.fn();
    render(
      <TabBar
        variant="pill"
        active="buy"
        activeColor="#10B981"
        colors={{ buy: '#10B981', sell: '#EF4444' }}
        tabs={[
          { id: 'buy', label: 'Mua' },
          { id: 'sell', label: 'Bán' },
        ]}
        onChange={onChange}
      />,
    );

    const buy = screen.getByRole('tab', { name: 'Mua' });
    const sell = screen.getByRole('tab', { name: 'Bán' });
    expect(buy).toHaveAttribute('aria-selected', 'true');
    expect(buy).toHaveStyle({ color: 'rgb(16, 185, 129)' });

    fireEvent.click(buy);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(sell);
    expect(onChange).toHaveBeenCalledWith('sell');
  });

  it('renders the segmented variant and uses the active color fallback', () => {
    const onChange = vi.fn();
    render(
      <TabBar
        variant="segment"
        active="open"
        activeColor="#2563EB"
        tabs={[{ id: 'open', label: 'Đang mở' }, 'history']}
        onChange={onChange}
      />,
    );

    const activeTab = screen.getByRole('tab', { name: 'Đang mở' });
    const historyTab = screen.getByRole('tab', { name: 'history' });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveStyle({ background: 'rgb(37, 99, 235)' });
    expect(historyTab).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(historyTab);
    expect(onChange).toHaveBeenCalledWith('history');
  });
});
