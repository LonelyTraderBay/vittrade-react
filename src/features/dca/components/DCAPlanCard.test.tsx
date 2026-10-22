import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DCAPlan } from '../model/dca-types';
import { DCAPlanCard } from './DCAPlanCard';

const plan: DCAPlan = {
  id: 'plan-1',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  coinIcon: '/btc.svg',
  frequency: 'weekly',
  amountPerPurchase: 250_000,
  nextExecution: new Date('2026-01-01T00:30:00.000Z'),
  status: 'active',
  totalInvested: 1_000_000,
  currentHoldings: 10,
  averageCost: 50_000,
  createdAt: new Date('2025-12-01T00:00:00.000Z'),
};

function expectPurchaseAmount(value: string) {
  expect(screen.getByText('Mỗi lần mua').parentElement).toHaveTextContent(`${value} VND`);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('DCAPlanCard', () => {
  it('renders all frequency, status and amount-format variants', () => {
    const { rerender } = render(<DCAPlanCard plan={plan} />);
    expect(screen.getByText('Hàng tuần')).toBeInTheDocument();
    expect(screen.getByText('Đang chạy')).toBeInTheDocument();
    expectPurchaseAmount('250.0K');

    rerender(<DCAPlanCard plan={{ ...plan, frequency: 'daily', amountPerPurchase: 999 }} />);
    expect(screen.getByText('Hàng ngày')).toBeInTheDocument();
    expectPurchaseAmount('999');

    rerender(
      <DCAPlanCard plan={{ ...plan, frequency: 'monthly', amountPerPurchase: 1_000_000 }} />,
    );
    expect(screen.getByText('Hàng tháng')).toBeInTheDocument();
    expectPurchaseAmount('1.00M');

    rerender(<DCAPlanCard plan={{ ...plan, amountPerPurchase: 1_000_000_000 }} />);
    expectPurchaseAmount('1.00B');

    rerender(<DCAPlanCard plan={{ ...plan, status: 'paused' }} />);
    expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
    expect(screen.queryByText('Lần mua tiếp theo')).not.toBeInTheDocument();

    rerender(<DCAPlanCard plan={{ ...plan, status: 'error' }} />);
    expect(screen.getByText('Lỗi')).toBeInTheDocument();
    expect(screen.getByText('Không thể thực hiện lệnh mua. Kiểm tra số dư.')).toBeInTheDocument();
  });

  it('formats each relative execution-time boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { rerender } = render(
      <DCAPlanCard plan={{ ...plan, nextExecution: new Date('2026-01-01T00:30:00.000Z') }} />,
    );
    expect(screen.getByText('30 phút')).toBeInTheDocument();

    rerender(
      <DCAPlanCard plan={{ ...plan, nextExecution: new Date('2026-01-01T02:00:00.000Z') }} />,
    );
    expect(screen.getByText('2 giờ')).toBeInTheDocument();

    rerender(
      <DCAPlanCard plan={{ ...plan, nextExecution: new Date('2026-01-02T00:00:00.000Z') }} />,
    );
    expect(screen.getByText('1 ngày')).toBeInTheDocument();

    rerender(
      <DCAPlanCard plan={{ ...plan, nextExecution: new Date('2026-01-03T00:00:00.000Z') }} />,
    );
    expect(screen.getByText('2 ngày')).toBeInTheDocument();

    rerender(
      <DCAPlanCard plan={{ ...plan, nextExecution: new Date('2025-12-31T23:59:59.000Z') }} />,
    );
    expect(screen.getByText('Đã quá hạn')).toBeInTheDocument();
  });

  it('shows gain, loss and no-investment values without confusing their signs', () => {
    const { rerender } = render(<DCAPlanCard plan={plan} />);
    expect(screen.getByText('+100.00%')).toBeInTheDocument();
    expect(document.querySelector('.lucide-trending-up')).toBeInTheDocument();

    rerender(<DCAPlanCard plan={{ ...plan, currentHoldings: 40 }} />);
    expect(screen.getByText('-50.00%')).toBeInTheDocument();
    expect(document.querySelector('.lucide-trending-down')).toBeInTheDocument();

    rerender(<DCAPlanCard plan={{ ...plan, totalInvested: 0 }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls enabled actions and disables state changes while loading', () => {
    const onToggleStatus = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onViewDetail = vi.fn();
    const { rerender } = render(
      <DCAPlanCard
        plan={plan}
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
      />,
    );

    fireEvent.click(screen.getAllByText('BTC')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa kế hoạch' }));
    expect(onViewDetail).toHaveBeenCalledWith(plan.id);
    expect(onToggleStatus).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(plan.id);
    expect(onDelete).toHaveBeenCalledWith(plan.id);

    rerender(
      <DCAPlanCard
        plan={plan}
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading
      />,
    );
    expect(screen.getByRole('button', { name: 'Tạm dừng' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Chỉnh sửa' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Xóa kế hoạch' })).toBeDisabled();
  });

  it('keeps a named local fallback after the configured image fails', () => {
    render(<DCAPlanCard plan={plan} />);
    const image = screen.getByRole('img', { name: 'Bitcoin' });

    fireEvent.error(image);

    expect(image).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bitcoin' })).toHaveTextContent('BTC');
    expect(screen.getByRole('img', { name: 'Bitcoin' })).not.toHaveAttribute('src');
  });
});
