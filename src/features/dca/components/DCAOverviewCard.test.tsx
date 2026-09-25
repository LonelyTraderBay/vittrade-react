import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { DCAOverviewCard, type DCAOverviewData } from './DCAOverviewCard';

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

  it('hides balances and opens each explanatory tooltip with outside and close dismissal', () => {
    renderWithProviders(<DCAOverviewCard data={data} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn số dư' }));
    expect(screen.getByText('••••••')).toBeInTheDocument();
    expect(screen.queryByText('₫2.500.000')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hiện số dư' }));
    expect(screen.getByText('₫2.500.000')).toBeInTheDocument();

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
});
