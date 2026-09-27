import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { NetworkStatusBanner } from './NetworkStatusBanner';

const mockUseOnlineStatus = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: mockUseOnlineStatus,
}));

afterEach(() => {
  vi.useRealTimers();
});

describe('NetworkStatusBanner', () => {
  it('stays hidden while online and shows offline and reconnecting states', () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, isReconnecting: false });
    const view = render(<NetworkStatusBanner />);

    expect(screen.queryByText('Không có kết nối mạng')).not.toBeInTheDocument();

    mockUseOnlineStatus.mockReturnValue({ isOnline: false, isReconnecting: false });
    view.rerender(<NetworkStatusBanner />);
    expect(screen.getByText('Không có kết nối mạng')).toBeInTheDocument();
    expect(screen.getByText('• Dữ liệu có thể không cập nhật')).toBeInTheDocument();

    mockUseOnlineStatus.mockReturnValue({ isOnline: false, isReconnecting: true });
    view.rerender(<NetworkStatusBanner />);
    expect(screen.getByText('Đang kết nối lại...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows recovery briefly and cancels that timer if the connection drops again', () => {
    vi.useFakeTimers();
    mockUseOnlineStatus.mockReturnValue({ isOnline: false, isReconnecting: false });
    const view = render(<NetworkStatusBanner />);

    mockUseOnlineStatus.mockReturnValue({ isOnline: true, isReconnecting: false });
    view.rerender(<NetworkStatusBanner />);
    expect(screen.getByText('Đã kết nối lại')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));
    mockUseOnlineStatus.mockReturnValue({ isOnline: false, isReconnecting: false });
    view.rerender(<NetworkStatusBanner />);
    expect(screen.getByText('Không có kết nối mạng')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText('Không có kết nối mạng')).toBeInTheDocument();
  });

  it('hides the recovery state after three seconds online', () => {
    vi.useFakeTimers();
    mockUseOnlineStatus.mockReturnValue({ isOnline: false, isReconnecting: false });
    const view = render(<NetworkStatusBanner />);

    mockUseOnlineStatus.mockReturnValue({ isOnline: true, isReconnecting: false });
    view.rerender(<NetworkStatusBanner />);
    expect(screen.getByText('Đã kết nối lại')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.queryByText('Đã kết nối lại')).not.toBeInTheDocument();
  });
});
