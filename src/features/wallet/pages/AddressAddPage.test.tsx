import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import type { WalletAddressBookCreateRequest } from '../model/wallet-types';
import { AddressAddPage } from './AddressAddPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function renderAddressAddPage(permissions = ['wallet:read', 'wallet:write']) {
  return renderWithProviders(
    <>
      <AddressAddPage />
      <LocationProbe />
    </>,
    {
      authAdapter: adapterWithPermissions(permissions),
      routerProps: { initialEntries: ['/w/wallet/address-book/add'] },
    },
  );
}

describe('AddressAddPage', () => {
  it('requires write permission before enabling address controls', () => {
    renderAddressAddPage(['wallet:read']);

    expect(screen.getByRole('alert')).toHaveTextContent('permission is required');
    expect(screen.getByLabelText(/Tên địa chỉ/)).toBeDisabled();
    screen.getAllByRole('button', { name: 'BTC' }).forEach((button) => {
      expect(button).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Dán địa chỉ từ clipboard' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lưu địa chỉ' })).toBeDisabled();
  });

  it('requires a label, a 20-character address and explicit confirmation', async () => {
    const user = userEvent.setup();
    renderAddressAddPage();

    const saveButton = screen.getByRole('button', { name: 'Lưu địa chỉ' });
    const labelInput = screen.getByLabelText(/Tên địa chỉ/);
    const addressInput = screen.getByLabelText('Địa chỉ ví');
    expect(saveButton).toBeDisabled();

    await user.type(labelInput, 'Ví lạnh');
    await user.type(addressInput, '1234567890123456789');
    await user.click(screen.getByRole('button', { name: /Tôi xác nhận địa chỉ ví/ }));
    expect(saveButton).toBeDisabled();

    await user.type(addressInput, '0');
    expect(saveButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /Tôi xác nhận địa chỉ ví/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('submits normalized values with an idempotency key and returns to the address book', async () => {
    const user = userEvent.setup();
    let submitted: WalletAddressBookCreateRequest | undefined;
    let idempotencyKey: string | null = null;

    server.use(
      http.post('*/wallet/address-book', async ({ request }) => {
        submitted = (await request.json()) as WalletAddressBookCreateRequest;
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(
          {
            id: 'address-1',
            ...submitted,
            isFavorite: false,
            createdAt: '2026-09-27T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );
    renderAddressAddPage();

    await user.type(screen.getByLabelText(/Tên địa chỉ/), '  Ví lạnh  ');
    await user.click(screen.getByRole('button', { name: 'BSC (BEP20)' }));
    await user.click(screen.getByRole('button', { name: 'USDT' }));
    await user.type(
      screen.getByLabelText('Địa chỉ ví'),
      '  0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f  ',
    );
    await user.type(screen.getByLabelText(/Memo \/ Tag/), '  memo-123  ');
    await user.click(screen.getByRole('button', { name: /Thêm vào Whitelist/ }));
    await user.click(screen.getByRole('button', { name: /Tôi xác nhận địa chỉ ví/ }));
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/wallet/address-book'),
    );
    expect(submitted).toEqual({
      label: 'Ví lạnh',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f',
      network: 'BSC (BEP20)',
      asset: 'USDT',
      memo: 'memo-123',
      isWhitelisted: true,
    });
    expect(idempotencyKey).toMatch(/^address-book-create-/);
    expect(toast.success).toHaveBeenCalledWith('Đã lưu địa chỉ “Ví lạnh”.', { duration: 1500 });
  });

  it('keeps the draft and stays on the page when the API rejects the address', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/wallet/address-book', () =>
        HttpResponse.json({ message: 'Address is not accepted' }, { status: 422 }),
      ),
    );
    renderAddressAddPage();

    await user.type(screen.getByLabelText(/Tên địa chỉ/), 'Ví thử');
    await user.type(screen.getByLabelText('Địa chỉ ví'), '12345678901234567890');
    await user.click(screen.getByRole('button', { name: /Tôi xác nhận địa chỉ ví/ }));
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể lưu địa chỉ. Vui lòng kiểm tra thông tin.',
        { duration: 2000 },
      ),
    );
    expect(screen.getByLabelText(/Tên địa chỉ/)).toHaveValue('Ví thử');
    expect(screen.getByLabelText('Địa chỉ ví')).toHaveValue('12345678901234567890');
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/wallet/address-book/add');
  });

  it('pastes a wallet address from the clipboard and reports clipboard failures', async () => {
    const user = userEvent.setup();
    const readText = vi.fn().mockResolvedValue('bc1qexampleaddress0123456789');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText },
    });
    renderAddressAddPage();

    await user.click(screen.getByRole('button', { name: 'Dán địa chỉ từ clipboard' }));
    expect(await screen.findByLabelText('Địa chỉ ví')).toHaveValue('bc1qexampleaddress0123456789');

    readText.mockRejectedValueOnce(new Error('Clipboard permission denied'));
    await user.click(screen.getByRole('button', { name: 'Dán địa chỉ từ clipboard' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể đọc clipboard.', { duration: 2000 }),
    );
  });
});
