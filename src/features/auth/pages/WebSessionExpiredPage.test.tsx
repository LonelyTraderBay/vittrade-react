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
  it('masks the account email and preserves login return state', async () => {
    renderExpiredPage({ email: 'alice@example.com', reason: 'timeout', returnTo: '/w/trade' });

    expect(screen.getByRole('heading', { name: 'Phiên đã hết hạn' })).toBeInTheDocument();
    expect(screen.getByText('al•••@example.com')).toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(
      screen.getByText('Bạn sẽ được chuyển về trang trước đó sau khi đăng nhập thành công.'),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Đăng nhập lại/ }));

    expect(readLocation()).toEqual({
      pathname: '/w/auth/login',
      state: { email: 'alice@example.com', returnTo: '/w/trade' },
    });
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
