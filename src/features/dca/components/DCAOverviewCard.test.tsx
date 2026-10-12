import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { DCAOverviewCard, type DCAOverviewData } from './DCAOverviewCard';
import { Sparkline, TooltipPopover } from './DCAOverviewCardVisuals';

const data: DCAOverviewData = {
  currentValue: 2_500_000,
  totalInvested: 1_500_000,
  profitLoss: 1_000_000,
  profitLossPercent: 66.6,
  activePlans: 2,
  pausedPlans: 1,
  errorPlans: 1,
  nextExecution: { relativeTime: 'ngày mai', amount: 500_000 },
};

const originalPathLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getTotalLength');

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalPathLength) {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', originalPathLength);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength');
  }
});

describe('DCAOverviewCard', () => {
  it('renders account metrics, sparkline and all action callbacks', () => {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      value: vi.fn(() => 120),
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const onClick = vi.fn();
    const onSparklineTap = vi.fn();
    const actions = {
      onCreatePlan: vi.fn(),
      onPauseAll: vi.fn(),
      onViewChart: vi.fn(),
      onViewHistory: vi.fn(),
    };

    renderWithProviders(
      <DCAOverviewCard
        data={data}
        sparklineData={[100, 110, 108, 125]}
        onSparklineTap={onSparklineTap}
        onClick={onClick}
        actions={actions}
      />,
    );

    expect(screen.getByText('Tổng danh mục DCA (VND)')).toBeInTheDocument();
    expect(screen.getByText('₫2.500.000')).toBeInTheDocument();
    expect(screen.getByText('0.38M')).toBeInTheDocument();
    expect(screen.getByText('ngày mai')).toBeInTheDocument();
    expect(screen.getByTitle('1 tạm dừng')).toBeInTheDocument();
    expect(screen.getByTitle('1 lỗi')).toBeInTheDocument();
    expect(screen.getByText('90 ngày')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xem biểu đồ chi tiết' }));
    expect(onSparklineTap).toHaveBeenCalledTimes(1);
    for (const [label, callback] of [
      ['Tạo mới', actions.onCreatePlan],
      ['Tạm dừng', actions.onPauseAll],
      ['Biểu đồ', actions.onViewChart],
      ['Lịch sử', actions.onViewHistory],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(callback).toHaveBeenCalledTimes(1);
    }
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Tổng danh mục DCA (VND)'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('formats compact VND totals at the billion scale', () => {
    renderWithProviders(
      <DCAOverviewCard
        data={{
          ...data,
          totalInvested: 1_500_000_000,
          activePlans: 1,
          pausedPlans: 0,
          errorPlans: 0,
        }}
      />,
    );

    expect(screen.getAllByText('1.50B')).toHaveLength(2);
  });

  it('hides balances and opens each explanatory tooltip with outside and close dismissal', () => {
    renderWithProviders(<DCAOverviewCard data={data} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn số dư' }));
    expect(screen.getByText('••••••')).toBeInTheDocument();
    expect(screen.queryByText('₫2.500.000')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hiện số dư' }));
    expect(screen.getByText('₫2.500.000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Kế hoạch' }));
    expect(screen.getByText(/là tổng số kế hoạch DCA/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Kế hoạch' }));
    expect(screen.queryByText(/là tổng số kế hoạch DCA/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Kế hoạch' }));
    expect(screen.getByText(/là tổng số kế hoạch DCA/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByText(/là tổng số kế hoạch DCA/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Đã đầu tư' }));
    expect(screen.getByText(/số tiền thực \(VND\)/)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/số tiền thực \(VND\)/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Trung bình' }));
    expect(screen.getByText(/chia đều cho số kế hoạch/)).toBeInTheDocument();
  });

  it('shows the loading skeleton and safely renders loss with no scheduled execution', () => {
    const { rerender } = renderWithProviders(<DCAOverviewCard data={data} isLoading />);
    expect(screen.queryByText('Tổng danh mục DCA (VND)')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5);

    rerender(
      <DCAOverviewCard
        data={{
          ...data,
          currentValue: 400_000,
          totalInvested: 500_000,
          profitLoss: -100_000,
          profitLossPercent: -20,
          activePlans: 0,
          pausedPlans: 0,
          errorPlans: 0,
          nextExecution: null,
        }}
      />,
    );
    expect(screen.getByText('₫400.000')).toBeInTheDocument();
    expect(screen.getByText('-100.000')).toBeInTheDocument();
    expect(screen.getByText('Không có lịch mua')).toBeInTheDocument();
    expect(screen.getByTitle('0 đang chạy')).toBeInTheDocument();
  });

  it.each([{ points: [] }, { points: [42] }])(
    'renders no sparkline geometry for fewer than two points: $points',
    ({ points }) => {
      const { container } = renderWithProviders(<Sparkline data={points} isProfit={false} />);

      expect(container.querySelector('path[stroke]')).not.toBeInTheDocument();
      expect(container.querySelector('path[fill]')).not.toBeInTheDocument();
      expect(container.querySelector('g')).not.toBeInTheDocument();
    },
  );

  it('renders a flat sparkline and keeps the optional tap action disabled', () => {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      value: vi.fn(() => 120),
    });
    const onParentClick = vi.fn();
    const { container } = renderWithProviders(
      <div onClick={onParentClick}>
        <Sparkline data={[42, 42]} isProfit={false} />
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Xem biểu đồ chi tiết' });
    const line = container.querySelector('path[stroke]');
    const dot = container.querySelector('g');

    expect(line?.getAttribute('d')).toContain('M0,42');
    expect(line).toHaveAttribute('stroke', '#EF4444');
    expect(dot).toHaveStyle({ opacity: '0' });
    expect(button).toHaveClass('cursor-default');
    fireEvent.click(button);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('ignores stale animation frame and timeout callbacks after the data changes', () => {
    vi.useFakeTimers();
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      value: vi.fn(() => 120),
    });
    const animationFrames: FrameRequestCallback[] = [];
    const timeoutCallbacks: Array<() => void> = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    const onTap = vi.fn();
    const scheduleTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, 'setTimeout').mockImplementation((callback, delay, ...args) => {
      const timer = scheduleTimeout(callback, delay, ...args);
      if (delay === 400 && typeof callback === 'function') {
        timeoutCallbacks.push(() => callback(...args));
      }
      return timer as unknown as ReturnType<typeof setTimeout>;
    });

    const { container, rerender } = renderWithProviders(
      <Sparkline data={[1, 2]} isProfit onTap={onTap} />,
    );
    const firstLine = container.querySelector('path[stroke]');
    rerender(<Sparkline data={[2, 4]} isProfit onTap={onTap} />);
    const currentLine = container.querySelector('path[stroke]');

    expect(animationFrames).toHaveLength(2);
    expect(timeoutCallbacks).toHaveLength(2);
    act(() => animationFrames[0](0));
    expect(firstLine).toHaveStyle({ transition: 'none' });
    act(() => animationFrames[1](0));
    expect(currentLine).toHaveStyle({
      transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
    });

    const area = container.querySelector('path[fill]');
    act(() => timeoutCallbacks[0]());
    expect(area).toHaveStyle({ opacity: '0' });
    act(() => timeoutCallbacks[1]());
    expect(area).toHaveStyle({ opacity: '1' });
    expect(container.querySelector('.absolute')).toHaveStyle({ opacity: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Xem biểu đồ chi tiết' }));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('does not close an open tooltip for pointer events inside its content', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <TooltipPopover open onClose={onClose}>
        <span>Tooltip details</span>
      </TooltipPopover>,
    );

    fireEvent.mouseDown(screen.getByText('Tooltip details'));
    fireEvent.touchStart(screen.getByText('Tooltip details'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not add a duplicate shimmer stylesheet when the module is evaluated again', async () => {
    document.getElementById('dca-shimmer-keyframes')?.remove();
    const existingStyle = document.createElement('style');
    existingStyle.id = 'dca-shimmer-keyframes';
    document.head.appendChild(existingStyle);

    vi.resetModules();
    await import('./DCAOverviewCardVisuals');

    expect(document.querySelectorAll('#dca-shimmer-keyframes')).toHaveLength(1);
  });
});
