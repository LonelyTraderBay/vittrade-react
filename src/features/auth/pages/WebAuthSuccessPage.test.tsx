import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { WebAuthSuccessPage } from './WebAuthSuccessPage';

afterEach(() => vi.useRealTimers());

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderSuccess(purpose: string) {
  return renderWithProviders(
    <>
      <WebAuthSuccessPage />
      <LocationProbe />
    </>,
    {
      routerProps: {
        initialEntries: [{ pathname: '/w/auth/success', state: { purpose, from: '/w/profile' } }],
      },
    },
  );
}

function renderSuccessWithRoutes(purpose: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w/auth/success" element={<WebAuthSuccessPage />} />
        <Route path="/w/auth/login" element={<p>Login destination</p>} />
        <Route path="/w/home" element={<p>Home destination</p>} />
      </Routes>
      <LocationProbe />
    </>,
    {
      routerProps: {
        initialEntries: [{ pathname: '/w/auth/success', state: { purpose, from: '/w/profile' } }],
      },
    },
  );
}

describe('Web auth success page', () => {
  it('shows registration next steps and pauses the redirect after choosing an action', async () => {
    const user = userEvent.setup();
    renderSuccess('register');

    expect(
      screen.getByRole('heading', { name: 'Chào mừng bạn đến VitTrade!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác minh danh tính/ })).toBeInTheDocument();
    const depositAction = screen.getByRole('button', { name: /Nạp tiền/ });
    const originalBackground = depositAction.style.background;
    await user.hover(depositAction);
    expect(depositAction.style.background).not.toBe(originalBackground);
    await user.unhover(depositAction);
    expect(depositAction.style.background).toBe(originalBackground);
    await user.click(depositAction);

    expect(screen.getByTestId('location')).toHaveTextContent('/w/wallet/deposit');
    expect(screen.getByText('Đã tạm dừng chuyển hướng tự động')).toBeInTheDocument();
  });

  it('routes identity verification to the existing profile KYC page', async () => {
    const user = userEvent.setup();
    renderSuccess('register');

    await user.click(screen.getByRole('button', { name: /Xác minh danh tính/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile/kyc');
  });

  it('shows the two-factor completion state and keeps its suggested routes', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    expect(screen.getByRole('heading', { name: 'Bảo mật đã được nâng cấp!' })).toBeInTheDocument();
    expect(screen.getByText('2FA đã kích hoạt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Bắt đầu giao dịch/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/trade');
    expect(screen.getByText('Đã tạm dừng chuyển hướng tự động')).toBeInTheDocument();
  });

  it('routes the security shortcut to the existing profile security page', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    await user.click(screen.getByRole('button', { name: /Trung tâm bảo mật/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile/security');
  });

  it('routes a completed password reset to login', async () => {
    const user = userEvent.setup();
    renderSuccess('reset');

    expect(screen.getByRole('heading', { name: 'Mật khẩu đã được đổi!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đăng nhập ngay' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/auth/login');
  });

  it('redirects to login when the password-reset countdown expires', async () => {
    vi.useFakeTimers();
    renderSuccessWithRoutes('reset');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByTestId('location')).toHaveTextContent('/w/auth/login');
    expect(screen.getByText('Login destination')).toBeInTheDocument();
  });

  it('lets the user pause the automatic redirect', async () => {
    const user = userEvent.setup();
    renderSuccess('reset');

    await user.click(screen.getByRole('button', { name: 'Dừng' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/auth/success');
    expect(screen.getByText('Đã tạm dừng chuyển hướng tự động')).toBeInTheDocument();
  });

  it('uses the generic success state for an unknown purpose', () => {
    renderSuccess('unknown-purpose');

    expect(screen.getByRole('heading', { name: 'Thao tác thành công!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về trang chủ' })).toBeInTheDocument();
    expect(screen.queryByText('Bước tiếp theo')).not.toBeInTheDocument();
  });
});
