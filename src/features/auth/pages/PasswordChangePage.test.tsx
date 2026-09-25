import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { PasswordChangePage } from './PasswordChangePage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('password change contract flow', () => {
  it('verifies the current password and changes it with a TOTP code and idempotency key', async () => {
    let verifyRequest: unknown;
    let changeRequest: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.post('http://localhost:3000/api/auth/password/verify-current', async ({ request }) => {
        verifyRequest = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('http://localhost:3000/api/auth/password/change', async ({ request }) => {
        changeRequest = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PasswordChangePage />, {
      routerProps: { initialEntries: ['/w/profile/security/change-password'] },
    });

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'current-password');
    await user.click(screen.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' }));
    expect(await screen.findByText('Mật khẩu hiện tại đã được xác minh')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mật khẩu mới'), 'SecurePassword123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'SecurePassword123');
    await user.type(screen.getByLabelText('Mã xác thực TOTP'), '654321');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(verifyRequest).toEqual({ currentPassword: 'current-password' });
      expect(changeRequest).toEqual({
        currentPassword: 'current-password',
        newPassword: 'SecurePassword123',
        mfaCode: '654321',
        mfaMethod: 'totp',
      });
      expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    });
    expect(await screen.findByText('Mật khẩu đã được đổi thành công.')).toBeInTheDocument();
  });
});
