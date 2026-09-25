import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { EditProfileContractPage } from './EditProfileContractPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();

const profile = {
  id: 'user-1',
  email: 'user@example.com',
  phone: '+84 900 000 000',
  fullName: 'Nguyễn Văn A',
  username: 'vana',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified',
  referralCode: 'VITTA',
  vipLevel: 1,
  joinDate: '2026-01-01',
  has2FA: true,
  totalBalance: 1000,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function profileWriteAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions: ['profile:write'] },
    },
  };
}

describe('EditProfileContractPage', () => {
  it('saves normalized profile changes with an idempotency key and confirms success', async () => {
    let body: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/profile', () => HttpResponse.json(profile)),
      http.patch('*/profile', async ({ request }) => {
        body = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ ...profile, ...(body as object) });
      }),
    );
    renderWithProviders(<EditProfileContractPage />, { authAdapter: profileWriteAdapter() });

    const user = userEvent.setup();
    const name = await screen.findByLabelText('Họ và tên');
    await user.clear(name);
    await user.type(name, '  Nguyễn Thị B  ');
    const phone = screen.getByLabelText('Số điện thoại');
    await user.clear(phone);
    await user.type(phone, '  +84 911 222 333  ');
    expect(screen.getByLabelText('Email')).toHaveValue('user@example.com');
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã cập nhật hồ sơ.', { duration: 1500 }),
    );
    expect(body).toEqual({ fullName: 'Nguyễn Thị B', phone: '+84 911 222 333' });
    expect(idempotencyKey).toMatch(/^profile-/);
  });

  it('keeps the idempotency key on retry after an ambiguous save failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('*/profile', () => HttpResponse.json(profile)),
      http.patch('*/profile', ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Profile service unavailable' }, { status: 503 })
          : HttpResponse.json(profile);
      }),
    );
    renderWithProviders(<EditProfileContractPage />, { authAdapter: profileWriteAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Profile service unavailable');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(attempts).toBe(2);
    expect(idempotencyKeys[0]).toMatch(/^profile-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    expect(toast.error).toHaveBeenCalledWith('Profile service unavailable', { duration: 2000 });
  });

  it('requires a non-empty name before enabling save', async () => {
    server.use(http.get('*/profile', () => HttpResponse.json(profile)));
    renderWithProviders(<EditProfileContractPage />, { authAdapter: profileWriteAdapter() });

    const user = userEvent.setup();
    const name = await screen.findByLabelText('Họ và tên');
    await user.clear(name);

    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });
});
