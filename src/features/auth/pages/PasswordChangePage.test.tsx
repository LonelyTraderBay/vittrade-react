import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { PasswordChangePage } from './PasswordChangePage';

const server = setupServer();
function LocationProbe() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('password change contract flow', () => {
  it('keeps keyboard focus on the active password-change step', async () => {
    server.use(
      http.post(
        'http://localhost:3000/api/auth/password/verify-current',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.post(
        'http://localhost:3000/api/auth/password/change',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<PasswordChangePage />, {
      routerProps: { initialEntries: ['/w/profile/security/change-password'] },
    });

    const currentPassword = screen.getByLabelText('Mật khẩu hiện tại');
    await user.type(currentPassword, 'current-password{Enter}');
    const newPassword = await screen.findByLabelText('Mật khẩu mới');
    const focusAfterVerify = document.activeElement === newPassword;

    await user.click(screen.getByRole('button', { name: 'Quay lại xác minh' }));
    const currentPasswordAgain = await screen.findByLabelText('Mật khẩu hiện tại');
    const focusAfterBack = document.activeElement === currentPasswordAgain;

    await user.click(screen.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' }));
    await screen.findByLabelText('Mật khẩu mới');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'SecurePassword123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'SecurePassword123');
    const totpCode = screen.getByLabelText('Mã xác thực TOTP');
    await user.type(totpCode, '654321{Enter}');

    const successHeading = await screen.findByRole('heading', {
      name: 'Mật khẩu đã được đổi thành công.',
    });
    const focusAfterSuccess = document.activeElement === successHeading;

    expect({ focusAfterVerify, focusAfterBack, focusAfterSuccess }).toEqual({
      focusAfterVerify: true,
      focusAfterBack: true,
      focusAfterSuccess: true,
    });
  });

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

  it('keeps verification gated when empty and retries after the API rejects the current password', async () => {
    let attempts = 0;
    server.use(
      http.post('http://localhost:3000/api/auth/password/verify-current', () => {
        attempts += 1;
        return new HttpResponse(null, { status: attempts === 1 ? 400 : 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PasswordChangePage />, {
      routerProps: { initialEntries: ['/w/profile/security/change-password'] },
    });

    const verifyButton = screen.getByRole('button', { name: /Xác minh mật khẩu hiện tại/ });
    const verifyForm = verifyButton.closest('form');
    expect(verifyButton).toBeDisabled();
    expect(verifyForm).not.toBeNull();
    fireEvent.submit(verifyForm!);
    expect(attempts).toBe(0);

    const currentPassword = screen.getByLabelText(/Mật khẩu hiện tại/);
    await user.type(currentPassword, 'current-password');
    await user.click(verifyButton);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(currentPassword).toBeInTheDocument();
    await user.click(verifyButton);
    expect(await screen.findByText(/Mật khẩu hiện tại đã được xác minh/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('guards invalid change submits, recovers from an API rejection, and navigates after success', async () => {
    let changeAttempts = 0;
    let acceptedRequest: unknown;
    server.use(
      http.post(
        'http://localhost:3000/api/auth/password/verify-current',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.post('http://localhost:3000/api/auth/password/change', async ({ request }) => {
        changeAttempts += 1;
        if (changeAttempts === 1) return new HttpResponse(null, { status: 400 });
        acceptedRequest = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <PasswordChangePage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/profile/security/change-password'] } },
    );

    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/), 'current-password');
    await user.click(screen.getByRole('button', { name: /Xác minh mật khẩu hiện tại/ }));
    expect(await screen.findByText(/Mật khẩu hiện tại đã được xác minh/)).toBeInTheDocument();

    const changeButton = screen.getByRole('button', { name: /^Đổi mật khẩu$/ });
    const changeForm = changeButton.closest('form');
    expect(changeForm).not.toBeNull();
    fireEvent.submit(changeForm!);
    expect(changeAttempts).toBe(0);

    await user.type(screen.getByLabelText(/Mật khẩu mới/), 'SecurePassword123');
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/), 'SecurePassword123');
    const totpInput = screen.getByRole('textbox', { name: /TOTP/ });
    fireEvent.change(totpInput, { target: { value: '12ab3456789' } });
    expect(totpInput).toHaveValue('123456');
    expect(changeButton).toBeEnabled();

    await user.click(changeButton);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(changeAttempts).toBe(1);
    await user.click(screen.getByRole('button', { name: /Quay lại xác minh/ }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu hiện tại/)).toHaveValue('current-password');

    await user.click(screen.getByRole('button', { name: /Xác minh mật khẩu hiện tại/ }));
    expect(await screen.findByText(/Mật khẩu hiện tại đã được xác minh/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Đổi mật khẩu$/ }));

    expect(await screen.findByText(/Mật khẩu đã được đổi thành công\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Về cài đặt bảo mật/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile/security');
    expect(acceptedRequest).toEqual({
      currentPassword: 'current-password',
      newPassword: 'SecurePassword123',
      mfaCode: '123456',
      mfaMethod: 'totp',
    });
    expect(changeAttempts).toBe(2);
  });
});
