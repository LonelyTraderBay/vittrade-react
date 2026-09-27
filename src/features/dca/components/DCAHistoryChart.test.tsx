import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import html2canvas from 'html2canvas';
import type { DCAPortfolioHistoryPoint } from '../model/dca-types';
import { renderWithProviders } from '@/test/test-utils';
import type { ChartAnnotationHandle, ChartAnnotationOverlayProps } from './ChartAnnotationOverlay';
import { DCAHistoryChart } from './DCAHistoryChart';

vi.mock('html2canvas', () => ({ default: vi.fn() }));

const annotationOverlayState = vi.hoisted(() => ({ hasAnnotations: false }));

vi.mock('./ChartAnnotationOverlay', async () => {
  const React = await import('react');

  const MockChartAnnotationOverlay = React.forwardRef<
    ChartAnnotationHandle,
    ChartAnnotationOverlayProps
  >(({ width, height, snapPoints = [] }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    React.useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        hasAnnotations: () => annotationOverlayState.hasAnnotations,
        clearAll: () => {
          annotationOverlayState.hasAnnotations = false;
        },
      }),
      [],
    );
    return (
      <canvas
        ref={canvasRef}
        data-width={width}
        data-height={height}
        data-snap-point-count={snapPoints.length}
      />
    );
  });

  return { ChartAnnotationOverlay: MockChartAnnotationOverlay };
});

const history: DCAPortfolioHistoryPoint[] = [
  {
    date: new Date('2026-09-01T00:00:00.000Z'),
    portfolioValue: 1_100_000,
    totalInvested: 1_000_000,
    hasPurchase: true,
  },
  {
    date: new Date('2026-09-05T00:00:00.000Z'),
    portfolioValue: 1_250_000,
    totalInvested: 1_100_000,
    hasPurchase: false,
  },
];

const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalCanShare = Object.getOwnPropertyDescriptor(navigator, 'canShare');
const originalResizeObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');

afterEach(() => {
  vi.restoreAllMocks();
  annotationOverlayState.hasAnnotations = false;
  for (const [property, descriptor] of [
    ['share', originalShare],
    ['canShare', originalCanShare],
  ] as const) {
    if (descriptor) Object.defineProperty(navigator, property, descriptor);
    else Reflect.deleteProperty(navigator, property);
  }
  if (originalResizeObserver) {
    Object.defineProperty(globalThis, 'ResizeObserver', originalResizeObserver);
  } else {
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  }
});

describe('DCAHistoryChart', () => {
  it('renders the supplied period and exposes interactive zoom and annotation controls', () => {
    renderWithProviders(<DCAHistoryChart data={history} interactive subtitle="Bốn ngày qua" />);

    expect(screen.getByRole('heading', { name: 'Lịch Sử Danh Mục' })).toBeInTheDocument();
    expect(screen.getByText('Bốn ngày qua')).toBeInTheDocument();
    expect(screen.getByText(/Chụm để zoom/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Phóng to' }));
    expect(screen.getByRole('button', { name: 'Đặt lại zoom' })).toBeInTheDocument();
    expect(screen.getByText(/%$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thu nhỏ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại zoom' }));
    expect(screen.queryByRole('button', { name: 'Đặt lại zoom' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bật ghi chú' }));
    expect(screen.getByText(/Chế độ ghi chú/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Phóng to' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tắt ghi chú' }));
    expect(screen.getByRole('button', { name: 'Phóng to' })).toBeInTheDocument();
  });

  it('derives the displayed period for short, monthly, quarterly, and longer histories', () => {
    const start = history[0].date.getTime();
    const periods = [
      { days: 1, label: '7 ngày qua' },
      { days: 30, label: '30 ngày qua' },
      { days: 90, label: '90 ngày qua' },
      { days: 120, label: '120 ngày qua' },
    ];

    for (const { days, label } of periods) {
      const data = [history[0], { ...history[1], date: new Date(start + days * 86_400_000) }];
      const { unmount } = renderWithProviders(<DCAHistoryChart data={data} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }

    const { unmount } = renderWithProviders(<DCAHistoryChart data={history.slice(0, 1)} />);
    expect(screen.queryByText(/ngày qua/)).not.toBeInTheDocument();
    unmount();
  });

  it('measures the chart for annotation snapping and formats billion-scale values', () => {
    const resizeObservers: Array<{
      target: Element;
      callback: ResizeObserverCallback;
      observer: ResizeObserver;
    }> = [];
    class TestResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(target: Element) {
        resizeObservers.push({ target, callback: this.callback, observer: this as ResizeObserver });
      }

      unobserve() {}

      disconnect() {}
    }
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: TestResizeObserver,
    });

    const highValueHistory = history.map((point, index) => ({
      ...point,
      date: index === 0 ? history[0].date : history[1].date,
      portfolioValue: 1_100_000_000 + index * 100_000_000,
      totalInvested: 1_000_000_000 + index * 100_000_000,
    }));
    const { container } = renderWithProviders(
      <DCAHistoryChart data={highValueHistory} interactive />,
    );
    const chartArea = container.querySelector('.touch-none')!.parentElement!;

    act(() => {
      for (const observation of resizeObservers) {
        observation.callback(
          [
            {
              target: observation.target,
              contentRect: {
                bottom: 300,
                height: 300,
                left: 0,
                right: 400,
                top: 0,
                width: 400,
                x: 0,
                y: 0,
                toJSON: () => ({}),
              },
            } as ResizeObserverEntry,
          ],
          observation.observer,
        );
      }
    });

    const annotationCanvas = container.querySelector('canvas')!;
    expect(resizeObservers.some((observation) => observation.target === chartArea)).toBe(true);
    expect(annotationCanvas).toHaveAttribute('data-width', '400');
    expect(annotationCanvas).toHaveAttribute('data-height', '300');
    expect(annotationCanvas).toHaveAttribute('data-snap-point-count', '2');
    expect(container.textContent).toMatch(/\d+\.\d+B/);
  });

  it('derives a standard period label and supports pinch zoom and double-tap reset', () => {
    const { container } = renderWithProviders(<DCAHistoryChart data={history} interactive />);
    const chartContainer = container.querySelector('.touch-none')!;
    vi.spyOn(chartContainer, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    expect(screen.getByText('7 ngày qua')).toBeInTheDocument();
    fireEvent.touchStart(chartContainer, {
      touches: [
        { clientX: 100, clientY: 50 },
        { clientX: 200, clientY: 50 },
      ],
    });
    fireEvent.touchMove(chartContainer, {
      touches: [
        { clientX: 50, clientY: 50 },
        { clientX: 250, clientY: 50 },
      ],
    });
    fireEvent.touchEnd(chartContainer, { touches: [] });
    expect(screen.getByRole('button', { name: 'Đặt lại zoom' })).toBeInTheDocument();

    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(1_000).mockReturnValueOnce(1_100);
    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 160, clientY: 50 }] });
    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 160, clientY: 50 }] });
    expect(screen.queryByRole('button', { name: 'Đặt lại zoom' })).not.toBeInTheDocument();
  });

  it('keeps the zoomed time window active while panning against both chart bounds', () => {
    const { container } = renderWithProviders(<DCAHistoryChart data={history} interactive />);
    const chartContainer = container.querySelector('.touch-none')!;
    vi.spyOn(chartContainer, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 1_000;
      return now;
    });

    fireEvent.click(screen.getByRole('button', { name: 'Phóng to' }));
    expect(screen.getByText('60%')).toBeInTheDocument();

    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 200, clientY: 50 }] });
    fireEvent.touchMove(chartContainer, { touches: [{ clientX: 600, clientY: 50 }] });
    expect(screen.getByText('60%')).toBeInTheDocument();
    fireEvent.touchEnd(chartContainer, { touches: [] });

    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 200, clientY: 50 }] });
    fireEvent.touchMove(chartContainer, { touches: [{ clientX: -200, clientY: 50 }] });
    expect(screen.getByText(/\d+%$/)).toBeInTheDocument();
  });

  it('exports a chart image through the download fallback', async () => {
    const exportCanvas = document.createElement('canvas');
    vi.mocked(html2canvas).mockResolvedValue(exportCanvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,test',
    );
    const clickLink = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(clickLink).toHaveBeenCalledTimes(1));
    expect(html2canvas).toHaveBeenCalledTimes(1);
  });

  it('restores annotation mode when image capture fails', async () => {
    vi.mocked(html2canvas).mockClear();
    vi.mocked(html2canvas).mockRejectedValue(new Error('capture failed'));
    renderWithProviders(<DCAHistoryChart data={history} interactive />);
    fireEvent.click(screen.getByRole('button', { name: 'Bật ghi chú' }));
    const exportButton = screen.getByRole('button', { name: 'Chia sẻ biểu đồ' });

    fireEvent.click(exportButton);

    await waitFor(() => expect(exportButton).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Tắt ghi chú' })).toBeInTheDocument();
    expect(html2canvas).toHaveBeenCalledTimes(1);
  });

  it('downloads the image when the browser cannot share files', async () => {
    const exportCanvas = document.createElement('canvas');
    Object.defineProperty(exportCanvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(new Blob(['chart']))),
    });
    const canShare = vi.fn().mockReturnValue(false);
    const share = vi.fn();
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    vi.mocked(html2canvas).mockClear().mockResolvedValue(exportCanvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,test',
    );
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(canShare).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
    expect(share).not.toHaveBeenCalled();
  });

  it('composites annotations into the image before sharing it', async () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 600;
    Object.defineProperty(exportCanvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(new Blob(['chart']))),
    });
    const context = exportCanvas.getContext('2d')!;
    const drawImage = vi.spyOn(context, 'drawImage');
    const getContext = vi.spyOn(exportCanvas, 'getContext').mockReturnValue(context);
    const canShare = vi.fn().mockReturnValue(true);
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    vi.mocked(html2canvas).mockClear().mockResolvedValue(exportCanvas);

    annotationOverlayState.hasAnnotations = true;
    const { container } = renderWithProviders(<DCAHistoryChart data={history} interactive />);
    const annotationCanvas = container.querySelector('canvas')!;

    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(getContext).toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalledWith(
      annotationCanvas,
      0,
      0,
      annotationCanvas.width,
      annotationCanvas.height,
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );
    expect(canShare).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
  });

  it('falls back to download when image encoding returns no blob', async () => {
    const exportCanvas = document.createElement('canvas');
    Object.defineProperty(exportCanvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(null)),
    });
    const canShare = vi.fn();
    const share = vi.fn();
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    vi.mocked(html2canvas).mockClear().mockResolvedValue(exportCanvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,test',
    );
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(canShare).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
  });

  it('falls back to download when the share API fails for a non-cancel reason', async () => {
    const exportCanvas = document.createElement('canvas');
    Object.defineProperty(exportCanvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(new Blob(['chart']))),
    });
    const canShare = vi.fn().mockReturnValue(true);
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'));
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    vi.mocked(html2canvas).mockClear().mockResolvedValue(exportCanvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,test',
    );
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledTimes(1);
  });

  it('does not download when the user cancels file sharing', async () => {
    const exportCanvas = document.createElement('canvas');
    Object.defineProperty(exportCanvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(new Blob(['chart']))),
    });
    const canShare = vi.fn().mockReturnValue(true);
    const share = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    vi.mocked(html2canvas).mockClear().mockResolvedValue(exportCanvas);
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(download).not.toHaveBeenCalled();
  });
});
