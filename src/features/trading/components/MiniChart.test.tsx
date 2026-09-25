import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { MiniChart } from './MiniChart';

const { createChartMock, candlestickSeries, histogramSeries, lineSeries } = vi.hoisted(() => ({
  createChartMock: vi.fn(),
  candlestickSeries: 'candlestick-series',
  histogramSeries: 'histogram-series',
  lineSeries: 'line-series',
}));

vi.mock('lightweight-charts', () => ({
  createChart: createChartMock,
  ColorType: { Solid: 'solid' },
  CandlestickSeries: candlestickSeries,
  HistogramSeries: histogramSeries,
  LineSeries: lineSeries,
}));

const server = setupServer();
const candleData = {
  items: [
    { time: 1_758_672_000, open: 100, high: 110, low: 95, close: 105, volume: 1_000 },
    { time: 1_758_675_600, open: 105, high: 120, low: 100, close: 115, volume: 1_500 },
  ],
  updatedAt: '2026-09-24T00:00:00.000Z',
};

const candleSetData = vi.fn();
const volumeSetData = vi.fn();
const volumePriceScale = { applyOptions: vi.fn() };
const volumePriceScaleGetter = vi.fn(() => volumePriceScale);
const priceSetData = vi.fn();
const timeScale = { fitContent: vi.fn() };
const timeScaleGetter = vi.fn(() => timeScale);
const chart = {
  addSeries: vi.fn((series: string) => {
    if (series === candlestickSeries) return { setData: candleSetData };
    if (series === histogramSeries)
      return { setData: volumeSetData, priceScale: volumePriceScaleGetter };
    return { setData: priceSetData };
  }),
  timeScale: timeScaleGetter,
  remove: vi.fn(),
  applyOptions: vi.fn(),
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
beforeEach(() => {
  createChartMock.mockReturnValue(chart);
});

describe('MiniChart', () => {
  it('creates and cleans up candle, volume and price series, then opens details on tap', async () => {
    server.use(http.get('*/market/pairs/btc-usdt/candles', () => HttpResponse.json(candleData)));
    const onTap = vi.fn();
    const { container, unmount } = renderWithProviders(
      <MiniChart pairId="btc-usdt" height={120} showTimeframeSelector onTap={onTap} />,
    );

    expect(await screen.findByText('Tap for details')).toBeInTheDocument();
    expect(screen.getByText('24H')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(createChartMock).toHaveBeenCalledTimes(1);
    expect(chart.addSeries).toHaveBeenCalledTimes(3);
    expect(candleSetData).toHaveBeenCalledWith(
      candleData.items.map(({ volume: _volume, ...candle }) => candle),
    );
    expect(volumeSetData).toHaveBeenCalledTimes(1);
    expect(priceSetData).toHaveBeenCalledTimes(1);
    expect(timeScale.fitContent).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.cursor-pointer')!);
    expect(onTap).toHaveBeenCalledTimes(1);

    unmount();
    expect(chart.remove).toHaveBeenCalledTimes(1);
  });

  it('omits optional series and ignores taps when the chart is read-only', async () => {
    server.use(http.get('*/market/pairs/btc-usdt/candles', () => HttpResponse.json(candleData)));
    const onTap = vi.fn();
    const { container } = renderWithProviders(
      <MiniChart
        pairId="btc-usdt"
        height={120}
        showVolume={false}
        showCurrentPrice={false}
        interactive={false}
        onTap={onTap}
      />,
    );

    expect(await screen.findByText('24H')).toBeInTheDocument();
    expect(chart.addSeries).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('.rounded-xl.overflow-hidden')!);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('shows a retry action for a failed candle query and recovers', async () => {
    let attempts = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt/candles', () => {
        attempts += 1;
        return attempts <= 3
          ? HttpResponse.json({ message: 'temporary failure' }, { status: 503 })
          : HttpResponse.json(candleData);
      }),
    );
    renderWithProviders(<MiniChart pairId="btc-usdt" height={120} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('24H')).toBeInTheDocument();
    expect(attempts).toBe(4);
  });
});
