import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { ForgotPasswordContractPage, ResetPasswordContractPage } from './PasswordResetPages';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('password reset contract flow', () => {
  it('completes request, verification and reset through API adapters', async () => {
    const calls = { request: 0, verify: 0, confirm: 0 };
    server.use(
      http.post('http://localhost:3000/api/auth/password-reset/request', async ({ request }) => {
        expect(await request.json()).toEqual({ email: 'user@example.com' });
        calls.request += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('http://localhost:3000/api/auth/password-reset/verify', async ({ request }) => {
        expect(await request.json()).toEqual({ email: 'user@example.com', code: '123456' });
        calls.verify += 1;
        return HttpResponse.json({ resetToken: 'reset-token-1' });
      }),
      http.post('http://localhost:3000/api/auth/password-reset/confirm', async ({ request }) => {
        expect(await request.json()).toEqual({
          email: 'user@example.com',
          resetToken: 'reset-token-1',
          newPassword: 'strong-password-123',
        });
        calls.confirm += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ForgotPasswordContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/auth/forgot-password'] } },
    );

    await user.type(screen.getByLabelText('Email đăng ký'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));
    expect(await screen.findByText('Nhập mã OTP')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mã OTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const forgotPassword = await screen.findByLabelText('Mật khẩu mới');
    expect(screen.getByRole('heading', { name: 'Mật khẩu mới' })).toBeInTheDocument();
    const forgotPasswordToggle = screen.getByRole('button', { name: 'Hiện hoặc ẩn mật khẩu' });
    await user.click(forgotPasswordToggle);
    expect(forgotPassword).toHaveAttribute('type', 'text');
    await user.click(forgotPasswordToggle);
    expect(forgotPassword).toHaveAttribute('type', 'password');

    await user.type(forgotPassword, 'strong-password-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), 'strong-password-123');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => expect(calls).toEqual({ request: 1, verify: 1, confirm: 1 }));
    expect(await screen.findByText('Thành công!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đến trang đăng nhập' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login');
  });

  it('clears a request-code error after a successful retry', async () => {
    let requests = 0;
    server.use(
      http.post('*/auth/password-reset/request', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ message: 'Invalid request' }, { status: 400 })
          : new HttpResponse(null, { status: 204 });
      }),
      http.post('*/auth/password-reset/verify', () =>
        HttpResponse.json({ resetToken: 'reset-token-1' }),
      ),
      http.post('*/auth/password-reset/confirm', () => new HttpResponse(null, { status: 204 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordContractPage />, {
      routerProps: { initialEntries: ['/auth/forgot-password'] },
    });

    const email = screen.getByLabelText('Email đăng ký');
    await user.type(email, 'user@example.com');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể gửi mã xác minh.');
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));
    expect(await screen.findByRole('heading', { name: 'Nhập mã OTP' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const otp = screen.getByLabelText('Mã OTP');
    await user.type(otp, '123456');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Mật khẩu mới' })).toBeInTheDocument();

    const password = screen.getByLabelText('Mật khẩu mới');
    await user.type(password, 'strong-password-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), 'strong-password-123');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Thành công!')).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('reports a request-code failure without advancing the flow', async () => {
    let requests = 0;
    server.use(
      http.post('*/auth/password-reset/request', () => {
        requests += 1;
        return requests === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordContractPage />);

    await user.type(screen.getByLabelText('Email đăng ký'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể gửi mã xác minh. Vui lòng thử lại.',
    );
    expect(screen.getByRole('button', { name: 'Gửi mã xác minh' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));
    expect(await screen.findByRole('heading', { name: 'Nhập mã OTP' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('blocks malformed email before sending a reset request', async () => {
    let requestCount = 0;
    server.use(
      http.post('*/auth/password-reset/request', () => {
        requestCount += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordContractPage />);

    const email = screen.getByLabelText('Email đăng ký');
    await user.type(email, 'not-an-email');
    expect(email).toBeInvalid();
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));

    expect(requestCount).toBe(0);
    expect(screen.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeInTheDocument();
  });

  it('filters OTP input to six digits and reports a rejected code', async () => {
    server.use(
      http.post('*/auth/password-reset/request', () => new HttpResponse(null, { status: 204 })),
      http.post('*/auth/password-reset/verify', () =>
        HttpResponse.json({ message: 'Invalid code' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordContractPage />);

    await user.type(screen.getByLabelText('Email đăng ký'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));
    const otp = await screen.findByLabelText('Mã OTP');
    await user.type(otp, '12a345678');

    expect(otp).toHaveValue('123456');
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Mã xác minh không đúng hoặc đã hết hạn.',
    );
    expect(screen.getByRole('heading', { name: 'Nhập mã OTP' })).toBeInTheDocument();
  });

  it('reports a password confirmation failure and preserves the entered password', async () => {
    server.use(
      http.post('*/auth/password-reset/request', () => new HttpResponse(null, { status: 204 })),
      http.post('*/auth/password-reset/verify', () => HttpResponse.json({ resetToken: 'token-1' })),
      http.post('*/auth/password-reset/confirm', () =>
        HttpResponse.json({ message: 'Invalid request' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordContractPage />);

    await user.type(screen.getByLabelText('Email đăng ký'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi mã xác minh' }));
    await user.type(await screen.findByLabelText('Mã OTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const password = await screen.findByLabelText('Mật khẩu mới');
    await user.type(password, 'strong-password-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), 'strong-password-123');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
    );
    expect(password).toHaveValue('strong-password-123');
  });

  it('keeps direct reset links without server-issued tokens disabled', async () => {
    renderWithProviders(<ResetPasswordContractPage />, {
      routerProps: { initialEntries: ['/auth/reset-password?email=user%40example.com'] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
    );
    expect(screen.getByRole('button', { name: 'Đặt lại mật khẩu' })).toBeDisabled();
  });

  it('enforces direct-reset password rules and completes only with a matching strong password', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/password-reset/confirm', async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ResetPasswordContractPage />
        <LocationProbe />
      </>,
      {
        routerProps: {
          initialEntries: ['/auth/reset-password?email=user%40example.com&resetToken=server-token'],
        },
      },
    );

    const password = await screen.findByLabelText('Mật khẩu mới');
    const confirm = screen.getByLabelText('Nhập lại mật khẩu');
    const submit = screen.getByRole('button', { name: 'Đặt lại mật khẩu' });
    const togglePassword = screen.getByRole('button', { name: 'Hiện hoặc ẩn mật khẩu' });
    expect(password).toHaveAttribute('type', 'password');
    await user.click(togglePassword);
    expect(password).toHaveAttribute('type', 'text');
    await user.click(togglePassword);
    expect(password).toHaveAttribute('type', 'password');
    await user.type(password, 'short1');
    await user.type(confirm, 'short1');
    expect(submit).toBeDisabled();

    await user.clear(password);
    await user.type(password, 'strong-password-123');
    expect(submit).toBeDisabled();
    await user.clear(confirm);
    await user.type(confirm, 'different-password-123');
    expect(submit).toBeDisabled();
    await user.clear(confirm);
    await user.type(confirm, 'strong-password-123');
    await user.click(submit);

    expect(await screen.findByText('Thành công!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đến trang đăng nhập' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login');
    expect(body).toEqual({
      email: 'user@example.com',
      resetToken: 'server-token',
      newPassword: 'strong-password-123',
    });
  });

  it('retains a strong password and reports a rejected direct-reset request', async () => {
    server.use(
      http.post('*/auth/password-reset/confirm', () =>
        HttpResponse.json({ message: 'Invalid request' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordContractPage />, {
      routerProps: {
        initialEntries: ['/auth/reset-password?email=user%40example.com&resetToken=server-token'],
      },
    });

    const password = await screen.findByLabelText('Mật khẩu mới');
    await user.type(password, 'strong-password-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), 'strong-password-123');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể đặt lại mật khẩu. Vui lòng yêu cầu mã mới.',
    );
    expect(password).toHaveValue('strong-password-123');
  });
});
