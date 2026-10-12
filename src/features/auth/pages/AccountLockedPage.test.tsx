import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { AccountLockedPage } from './AccountLockedPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

function renderLockedPage(prefix: string) {
  const lockedPath = `${prefix}/auth/account-locked`;
  return renderWithProviders(
    <>
      <Routes>
        <Route path={lockedPath} element={<AccountLockedPage />} />
        <Route path={`${prefix}/auth/login`} element={<p>Đăng nhập</p>} />
        <Route path={`${prefix}/auth/forgot-password`} element={<p>Đặt lại mật khẩu</p>} />
      </Routes>
      <CurrentPath />
    </>,
    { routerProps: { initialEntries: [lockedPath] } },
  );
}

describe.each([
  { shell: 'Auth', prefix: '' },
  { shell: 'Tablet', prefix: '/t' },
  { shell: 'Responsive', prefix: '/r' },
])('$shell account-locked page', ({ prefix }) => {
  it('shows the server-owned lock state without inventing an expiry or email action', () => {
    renderLockedPage(prefix);

    const heading = screen.getByRole('heading', { name: 'Tài khoản tạm khóa' });
    expect(heading).toBeVisible();
    expect(heading).toHaveFocus();
    expect(
      screen.getByText(/Hệ thống xác thực hiện chưa cho phép đăng nhập tài khoản này/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Quay lại đăng nhập' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' })).toBeVisible();
    expect(screen.queryByText(/Tài khoản đã mở khóa|Email mở khóa đã gửi/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gửi email mở khóa' })).not.toBeInTheDocument();
  });

  it('returns to the matching shell login and password-reset routes', async () => {
    const user = userEvent.setup();
    const firstRender = renderLockedPage(prefix);

    await user.click(screen.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent(`${prefix}/auth/forgot-password`);
    expect(screen.getByText('Đặt lại mật khẩu')).toBeVisible();

    firstRender.unmount();
    renderLockedPage(prefix);
    await user.click(screen.getByRole('button', { name: 'Quay lại đăng nhập' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent(`${prefix}/auth/login`);
    expect(screen.getByText('Đăng nhập')).toBeVisible();
  });
});
