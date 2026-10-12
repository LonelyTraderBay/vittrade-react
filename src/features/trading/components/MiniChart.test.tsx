import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
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

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

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

  it('uses responsive height and falling-price series before navigating to the advanced chart', async () => {
    const widthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const fallingCandles = {
      items: [
        { time: 1_758_672_000, open: 120, high: 125, low: 95, close: 100, volume: 1_200 },
        { time: 1_758_675_600, open: 100, high: 110, low: 85, close: 90, volume: 1_600 },
      ],
      updatedAt: '2026-09-24T00:00:00.000Z',
    };
    server.use(
      http.get('*/market/pairs/btc-usdt/candles', () => HttpResponse.json(fallingCandles)),
    );

    try {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        enumerable: widthDescriptor?.enumerable ?? true,
        writable: true,
        value: 320,
      });
      const { container } = renderWithProviders(
        <>
          <MiniChart pairId="btc-usdt" />
          <LocationProbe />
        </>,
        { routerProps: { initialEntries: ['/w/markets'] } },
      );

      expect((container.firstElementChild as HTMLElement).style.height).toBe('100px');
      expect(await screen.findByText('Tap for details')).toBeInTheDocument();
      expect(volumeSetData).toHaveBeenCalledWith(
        fallingCandles.items.map(({ time, volume }) => ({
          time,
          value: volume,
          color: 'rgba(239, 68, 68, 0.4)',
        })),
      );
      expect(chart.addSeries).toHaveBeenNthCalledWith(
        3,
        lineSeries,
        expect.objectContaining({ color: '#EF4444' }),
      );
      expect(priceSetData).toHaveBeenCalledWith([
        { time: fallingCandles.items[0].time, value: 90 },
        { time: fallingCandles.items[1].time, value: 90 },
      ]);

      fireEvent.click(container.querySelector('.rounded-xl.overflow-hidden')!);
      expect(screen.getByTestId('location')).toHaveTextContent('/w/trade/advanced-chart/btc-usdt');
    } finally {
      if (widthDescriptor) Object.defineProperty(window, 'innerWidth', widthDescriptor);
    }
  });

  it('applies resize changes only after candle data creates a chart instance', async () => {
    let releaseResponse!: () => void;
    let signalRequestStarted!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const requestStarted = new Promise<void>((resolve) => {
      signalRequestStarted = resolve;
    });
    server.use(
      http.get('*/market/pairs/btc-usdt/candles', async () => {
        signalRequestStarted();
        await responseGate;
        return HttpResponse.json(candleData);
      }),
    );
    const { container } = renderWithProviders(<MiniChart pairId="btc-usdt" height={120} />);

    await requestStarted;
    fireEvent(window, new Event('resize'));
    expect(chart.applyOptions).not.toHaveBeenCalled();

    releaseResponse();
    expect(await screen.findByText('Tap for details')).toBeInTheDocument();
    const chartContainer = container.querySelector<HTMLElement>('.rounded-xl.overflow-hidden')!;
    Object.defineProperty(chartContainer, 'clientWidth', { configurable: true, value: 356 });
    fireEvent(window, new Event('resize'));

    expect(chart.applyOptions).toHaveBeenCalledTimes(1);
    expect(chart.applyOptions).toHaveBeenCalledWith({ width: 356 });
  });
});
