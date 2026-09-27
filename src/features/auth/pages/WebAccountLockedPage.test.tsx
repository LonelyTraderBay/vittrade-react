import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { WebAccountLockedPage } from './WebAccountLockedPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

function renderLockedPage(state?: unknown) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w/auth/account-locked" element={<WebAccountLockedPage />} />
        <Route path="/w/auth/login" element={<p>Đăng nhập</p>} />
        <Route path="/w/auth/forgot-password" element={<p>Đặt lại mật khẩu</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: {
        initialEntries: [{ pathname: '/w/auth/account-locked', state }],
      },
    },
  );
}

describe('WebAccountLockedPage', () => {
  it('keeps the account locked regardless of client-supplied expiry and does not claim email was sent', () => {
    renderLockedPage({ attempts: 5, unlockTime: Date.now() - 60_000 });

    expect(screen.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    expect(
      screen.getByText(/Hãy quay lại đăng nhập để kiểm tra trạng thái mới nhất/),
    ).toBeVisible();
    expect(screen.queryByText('Tài khoản đã mở khóa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gửi email mở khóa' })).not.toBeInTheDocument();
    expect(screen.queryByText('Email mở khóa đã gửi!')).not.toBeInTheDocument();
  });

  it('returns to login so the authentication service can check the current lock state', async () => {
    const user = userEvent.setup();
    renderLockedPage();

    await user.click(screen.getByRole('button', { name: 'Quay lại đăng nhập' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
    expect(screen.getByText('Đăng nhập')).toBeVisible();
  });

  it('offers the contract-backed password reset route', async () => {
    const user = userEvent.setup();
    renderLockedPage();

    await user.click(screen.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/forgot-password');
    expect(screen.getByText('Đặt lại mật khẩu')).toBeVisible();
  });
});
