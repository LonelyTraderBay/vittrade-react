import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { WalletAddressBookResponse } from '../model/wallet-types';
import { AddressBookPage } from './AddressBookPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const addressBook: WalletAddressBookResponse = {
  items: [
    {
      id: 'btc-1',
      label: 'BTC chính',
      address: 'bc1qvittradeaddress001',
      network: 'BTC',
      asset: 'BTC',
      isFavorite: false,
      isWhitelisted: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'eth-1',
      label: 'ETH lạnh',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'ETH (ERC20)',
      asset: 'ETH',
      isFavorite: true,
      isWhitelisted: false,
      createdAt: '2026-09-02T00:00:00.000Z',
    },
  ],
  total: 2,
  whitelistEnabled: false,
};

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

describe('AddressBookPage', () => {
  it('does not request withdrawal addresses without wallet read permission', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/address-book', () => {
        requests += 1;
        return HttpResponse.json(addressBook);
      }),
    );

    renderWithProviders(<AddressBookPage />, {
      authAdapter: adapterWithPermissions(['wallet:write']),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

  it('shows read-only entries while disabling address and whitelist mutations', async () => {
    server.use(http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)));

    renderWithProviders(<AddressBookPage />, {
      authAdapter: adapterWithPermissions(['wallet:read']),
    });

    expect(await screen.findByText('BTC chính')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Wallet address-book permission is required to manage withdrawal addresses.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm địa chỉ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Thêm vào yêu thích BTC chính' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Xóa địa chỉ BTC chính' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bật chế độ whitelist' })).toBeDisabled();
  });

  it('filters by address and network without changing the server list', async () => {
    const user = userEvent.setup();
    server.use(http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)));

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByText('BTC chính')).toBeInTheDocument();
    expect(screen.getByText('ETH lạnh')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Tìm địa chỉ hoặc tên' }), '0x1234');
    expect(screen.queryByText('BTC chính')).not.toBeInTheDocument();
    expect(screen.getByText('ETH lạnh')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Tìm địa chỉ hoặc tên' }));
    await user.click(screen.getByRole('button', { name: 'BTC' }));
    expect(screen.getByText('BTC chính')).toBeInTheDocument();
    expect(screen.queryByText('ETH lạnh')).not.toBeInTheDocument();
    expect(addressBook.items).toHaveLength(2);
  });

  it('uses server-confirmed whitelist, favorite and delete mutations', async () => {
    const user = userEvent.setup();
    let currentBook: WalletAddressBookResponse = structuredClone(addressBook);
    const mutationRequests: Array<{ method: string; id: string | null; key: string | null }> = [];

    server.use(
      http.get('*/wallet/address-book', () => HttpResponse.json(currentBook)),
      http.patch('*/wallet/address-book/settings', async ({ request }) => {
        mutationRequests.push({
          method: 'settings',
          id: null,
          key: request.headers.get('Idempotency-Key'),
        });
        const body = (await request.json()) as { whitelistEnabled: boolean };
        currentBook = { ...currentBook, whitelistEnabled: body.whitelistEnabled };
        return HttpResponse.json(currentBook);
      }),
      http.patch('*/wallet/address-book/:id', async ({ params, request }) => {
        const id = String(params.id);
        mutationRequests.push({
          method: 'update',
          id,
          key: request.headers.get('Idempotency-Key'),
        });
        const body = (await request.json()) as { isFavorite?: boolean };
        currentBook = {
          ...currentBook,
          items: currentBook.items.map((item) => (item.id === id ? { ...item, ...body } : item)),
        };
        return HttpResponse.json(currentBook.items.find((item) => item.id === id));
      }),
      http.delete('*/wallet/address-book/:id', ({ params, request }) => {
        const id = String(params.id);
        mutationRequests.push({
          method: 'delete',
          id,
          key: request.headers.get('Idempotency-Key'),
        });
        currentBook = {
          ...currentBook,
          total: currentBook.total - 1,
          items: currentBook.items.filter((item) => item.id !== id),
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<AddressBookPage />);

    await screen.findByText('BTC chính');
    await user.click(screen.getByRole('button', { name: 'Bật chế độ whitelist' }));
    await waitFor(() => expect(currentBook.whitelistEnabled).toBe(true));
    expect(screen.getByRole('button', { name: 'Tắt chế độ whitelist' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Thêm vào yêu thích BTC chính' }));
    await waitFor(() =>
      expect(currentBook.items.find((item) => item.id === 'btc-1')?.isFavorite).toBe(true),
    );
    expect(screen.getByRole('button', { name: 'Bỏ yêu thích BTC chính' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa địa chỉ BTC chính' }));
    const deleteDialog = await screen.findByRole('dialog', { name: 'Xóa địa chỉ' });
    expect(within(deleteDialog).getByText('BTC chính')).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(currentBook.items.some((item) => item.id === 'btc-1')).toBe(false));
    await waitFor(() => expect(screen.queryByText('BTC chính')).not.toBeInTheDocument());
    expect(mutationRequests.map(({ method, id }) => [method, id])).toEqual([
      ['settings', null],
      ['update', 'btc-1'],
      ['delete', 'btc-1'],
    ]);
    expect(mutationRequests.every(({ key }) => key?.startsWith('address-book-'))).toBe(true);
  });
});
