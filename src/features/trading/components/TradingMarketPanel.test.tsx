import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { TradingMarketPanel } from './TradingMarketPanel';

vi.mock('./MiniChart', () => ({ MiniChart: () => <div data-testid="mini-chart" /> }));
vi.mock('./OrderBook', () => ({ OrderBook: () => <div data-testid="order-book" /> }));
vi.mock('./RecentTrades', () => ({ RecentTrades: () => <div data-testid="recent-trades" /> }));

afterEach(cleanup);

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  change24h: 1.5,
  logoColor: '#F7931A',
};

function CurrentRoute() {
  const location = useLocation();
  return (
    <output data-testid="current-route">
      {location.pathname}:{JSON.stringify(location.state ?? null)}
    </output>
  );
}

function renderPanel(overrides: Partial<ComponentProps<typeof TradingMarketPanel>> = {}) {
  const onDataTabChange = vi.fn();
  const onOpenPairSwitcher = vi.fn();
  const props: ComponentProps<typeof TradingMarketPanel> = {
    pair,
    livePrice: 65_000,
    flash: null,
    isPositive: true,
    dataTab: 'chart',
    onDataTabChange,
    onOpenPairSwitcher,
    ...overrides,
  };
  const view = renderWithProviders(
    <>
      <TradingMarketPanel {...props} />
      <CurrentRoute />
    </>,
    { routerProps: { initialEntries: ['/w/trade/btc-usdt'] } },
  );
  return { ...view, onDataTabChange, onOpenPairSwitcher };
}

describe('TradingMarketPanel', () => {
  it('shows pair pricing and opens the pair switcher', () => {
    const { onOpenPairSwitcher } = renderPanel();

    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('65,000.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /BTC\/USDT/ }));

    expect(onOpenPairSwitcher).toHaveBeenCalledOnce();
    expect(screen.getByTestId('mini-chart')).toBeInTheDocument();
  });

  it('reports data tab changes and renders the selected panel', () => {
    const { onDataTabChange, rerender } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Sổ lệnh' }));
    expect(onDataTabChange).toHaveBeenCalledWith('orderbook');

    rerender(
      <>
        <TradingMarketPanel
          pair={pair}
          livePrice={65_000}
          flash="down"
          isPositive={false}
          dataTab="orderbook"
          onDataTabChange={onDataTabChange}
          onOpenPairSwitcher={vi.fn()}
        />
        <CurrentRoute />
      </>,
    );
    expect(screen.getByTestId('order-book')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Giao dịch' }));
    expect(onDataTabChange).toHaveBeenCalledWith('trades');
  });

  it.each([
    ['Convert', '/w/trade/convert'],
    ['Futures', '/w/trade/btc-usdt/futures'],
    ['Vị thế', '/w/trade/positions'],
    ['Cài đặt', '/w/trade/settings'],
  ])('navigates to %s using the active web shell prefix', (label, route) => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(screen.getByTestId('current-route')).toHaveTextContent(route);
  });

  it('passes the selected coin to the recurring purchase route', () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Mua định kỳ' }));

    expect(screen.getByTestId('current-route')).toHaveTextContent(
      '/w/dca:{"preselectedCoin":"BTC"}',
    );
  });
});
