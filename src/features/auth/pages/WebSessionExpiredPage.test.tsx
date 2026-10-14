import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { WebSessionExpiredPage } from './WebSessionExpiredPage';

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {JSON.stringify({ pathname: location.pathname, state: location.state ?? null })}
    </output>
  );
}

function renderExpiredPage(state?: unknown) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/w/auth/session-expired"
        element={
          <>
            <WebSessionExpiredPage />
            <LocationProbe />
          </>
        }
      />
      <Route path="/w/auth/login" element={<LocationProbe />} />
      <Route path="/w/auth/forgot-password" element={<LocationProbe />} />
    </Routes>,
    {
      routerProps: {
        initialEntries: [{ pathname: '/w/auth/session-expired', state }],
      },
    },
  );
}

function readLocation() {
  return JSON.parse(screen.getByTestId('location').textContent ?? '{}') as {
    pathname: string;
    state: unknown;
  };
}

describe('WebSessionExpiredPage', () => {
  it('does not display a malformed email passed in recovery route state', () => {
    renderExpiredPage({ email: 'private-invalid-identifier', reason: 'timeout' });

    expect(screen.getByRole('heading', { name: 'Phiên đã hết hạn' })).toBeInTheDocument();
    expect(screen.queryByText('private-invalid-identifier')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng nhập lại/ })).toBeEnabled();
  });

  it('opens password recovery from the expired-session screen', async () => {
    renderExpiredPage({ reason: 'security' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(readLocation().pathname).toBe('/w/auth/forgot-password');
  });
  it('does not expose unavailable help destinations as inert controls', () => {
    renderExpiredPage();

    expect(screen.getByText('Liên hệ hỗ trợ', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Trung tâm trợ giúp', { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Liên hệ hỗ trợ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trung tâm trợ giúp' })).not.toBeInTheDocument();
  });

  it('moves focus to the recovery heading when the route opens', () => {
    renderExpiredPage();

    expect(
      screen.getByRole('heading', { name: 'Phiên đăng nhập cần được xác thực lại' }),
    ).toHaveFocus();
  });

  it('masks the account email and preserves login return state', async () => {
    renderExpiredPage({ email: 'alice@example.com', reason: 'timeout', returnTo: '/w/trade' });

    expect(screen.getByRole('heading', { name: 'Phiên đã hết hạn' })).toBeInTheDocument();
    expect(screen.getByText('al•••@example.com')).toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(
      screen.getByText('Vui lòng đăng nhập lại để tiếp tục sử dụng VitTrade.'),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Đăng nhập lại/ }));

    expect(readLocation()).toEqual({
      pathname: '/w/auth/login',
      state: { email: 'alice@example.com', returnTo: '/w/trade' },
    });
  });

  it('does not promise a session timeout setting that the product does not provide', async () => {
    const user = userEvent.setup();
    renderExpiredPage({ reason: 'timeout' });

    const guidanceToggle = screen.getByRole('button', { name: /Vì sao phiên hết hạn/ });
    expect(guidanceToggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(guidanceToggle);
    expect(guidanceToggle).toHaveAttribute('aria-expanded', 'true');

    expect(
      screen.getByText(
        'Nếu bạn cho rằng phiên kết thúc ngoài dự kiến, hãy liên hệ bộ phận hỗ trợ.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/điều chỉnh thời gian phiên/i)).not.toBeInTheDocument();
  });

  it('uses neutral recovery copy when the route has no recognized expiration reason', async () => {
    const user = userEvent.setup();
    renderExpiredPage({ reason: 'unrecognized-server-reason' });

    expect(
      screen.getByRole('heading', { name: 'Phiên đăng nhập cần được xác thực lại' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/không hoạt động trong thời gian dài/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cần trợ giúp/ }));
    expect(
      screen.getByText('Nếu bạn gặp sự cố khi đăng nhập lại, hãy liên hệ bộ phận hỗ trợ.'),
    ).toBeInTheDocument();
  });

  it('shows recovery guidance for security and concurrent-session reasons', async () => {
    const user = userEvent.setup();
    const security = renderExpiredPage({ reason: 'security' });

    expect(
      screen.getByRole('heading', { name: 'Đã đăng xuất vì lý do bảo mật' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đổi mật khẩu' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Các thay đổi có thể gây đăng xuất/ }));
    expect(screen.getByText('Khuyến nghị')).toBeInTheDocument();
    security.unmount();

    renderExpiredPage({ reason: 'concurrent' });
    expect(
      screen.getByRole('heading', { name: 'Đã đăng nhập từ thiết bị khác' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Không phải tôi — Bảo vệ tài khoản' }));
    expect(readLocation().pathname).toBe('/w/auth/forgot-password');
  });
});
