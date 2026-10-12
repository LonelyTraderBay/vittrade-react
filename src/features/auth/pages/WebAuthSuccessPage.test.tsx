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

function renderSuccess(purpose?: string) {
  return renderWithProviders(
    <>
      <WebAuthSuccessPage />
      <LocationProbe />
    </>,
    {
      routerProps: {
        initialEntries: [
          purpose === undefined
            ? { pathname: '/w/auth/success' }
            : { pathname: '/w/auth/success', state: { purpose, from: '/w/profile' } },
        ],
      },
    },
  );
}

function renderSuccessWithRoutes(purpose?: string) {
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
        initialEntries: [
          purpose === undefined
            ? { pathname: '/w/auth/success' }
            : { pathname: '/w/auth/success', state: { purpose, from: '/w/profile' } },
        ],
      },
    },
  );
}

describe('Web auth success page', () => {
  it('moves focus to the confirmed outcome when the route opens', () => {
    renderSuccessWithRoutes('2fa-setup');

    expect(screen.getByRole('heading', { name: 'Bảo mật đã được nâng cấp!' })).toHaveFocus();
  });

  it('shows registration next steps and routes the deposit action', async () => {
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
  });

  it('routes identity verification to the existing profile KYC page', async () => {
    const user = userEvent.setup();
    renderSuccess('register');

    await user.click(screen.getByRole('button', { name: /Xác minh danh tính/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile/kyc');
  });

  it('routes the registration prediction suggestion to Web markets', async () => {
    const user = userEvent.setup();
    renderSuccess('register');

    await user.click(screen.getByRole('button', { name: /Khám phá Prediction Markets/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets/predictions');
  });

  it('routes the registration trading suggestion to Web trading', async () => {
    const user = userEvent.setup();
    renderSuccess('register');

    await user.click(screen.getByRole('button', { name: /Giao dịch đầu tiên/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/trade');
  });

  it('shows the two-factor completion state and keeps its suggested routes', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    expect(screen.getByRole('heading', { name: 'Bảo mật đã được nâng cấp!' })).toBeInTheDocument();
    expect(screen.getByText('2FA đã kích hoạt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Bắt đầu giao dịch/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/trade');
  });

  it('routes the security shortcut to the existing profile security page', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    await user.click(screen.getByRole('button', { name: /Trung tâm bảo mật/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile/security');
  });

  it('routes contact support to the existing Web support page', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    await user.click(screen.getByRole('button', { name: 'Liên hệ hỗ trợ' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/support');
  });

  it('routes the help center action to the existing Web help page', async () => {
    const user = userEvent.setup();
    renderSuccess('2fa-setup');

    await user.click(screen.getByRole('button', { name: 'Trung tâm trợ giúp' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/support/help');
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

  it.each([
    ['missing route state', undefined],
    ['unknown purpose', 'unknown-purpose'],
  ])('shows neutral recovery for %s', (_caseName, purpose) => {
    renderSuccess(purpose);

    expect(
      screen.getByRole('heading', { name: 'Không có thông tin xác nhận' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Không tìm thấy trạng thái xác nhận cho yêu cầu này. Hãy đăng nhập để tiếp tục.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về trang đăng nhập' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dừng' })).not.toBeInTheDocument();
    expect(screen.queryByText('Thao tác thành công!')).not.toBeInTheDocument();
    expect(screen.queryByText('Bước tiếp theo')).not.toBeInTheDocument();
  });

  it('keeps the generic success presentation for an explicit generic purpose', async () => {
    const user = userEvent.setup();
    renderSuccessWithRoutes('generic');

    expect(screen.getByRole('heading', { name: 'Thao tác thành công!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về trang chủ' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Về trang chủ' }));
    expect(screen.getByText('Home destination')).toBeInTheDocument();
  });
});
