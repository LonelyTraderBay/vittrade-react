import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
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
      lastUsed: '2026-10-08T00:00:00.000Z',
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

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
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
    expect(
      (screen.getByText('Tổng địa chỉ').previousElementSibling as HTMLElement).style.color,
    ).toBe('var(--tr-info)');
    const favoriteMetricLabel = screen
      .getAllByText('Yêu thích')
      .find((element) => element.tagName === 'P');
    expect(favoriteMetricLabel).toBeDefined();
    expect((favoriteMetricLabel!.previousElementSibling as HTMLElement).style.color).toBe(
      'var(--tr-warning-text)',
    );
    expect((screen.getByText('Whitelist').previousElementSibling as HTMLElement).style.color).toBe(
      'var(--tr-success-text)',
    );
    const search = screen.getByRole('textbox', { name: 'Tìm địa chỉ hoặc tên' });
    await user.type(search, 'btc chính');
    expect(screen.getByText('BTC chính')).toBeInTheDocument();
    expect(screen.queryByText('ETH lạnh')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xóa tìm kiếm' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(search).toHaveValue('');
    expect(document.activeElement).toBe(search);
    await user.type(search, '0x1234');
    expect(screen.queryByText('BTC chính')).not.toBeInTheDocument();
    expect(screen.getByText('ETH lạnh')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    await user.click(screen.getByRole('button', { name: 'BTC' }));
    expect(screen.getByText('BTC chính')).toBeInTheDocument();
    expect(screen.queryByText('ETH lạnh')).not.toBeInTheDocument();
    expect(addressBook.items).toHaveLength(2);
  });

  it('renders last-used metadata and an empty state for unmatched searches', async () => {
    const user = userEvent.setup();
    server.use(http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)));

    renderWithProviders(
      <>
        <AddressBookPage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/wallet/address-book'] } },
    );

    expect(await screen.findByText('BTC chính')).toBeInTheDocument();
    expect(screen.getByText(/Dùng gần nhất:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thêm địa chỉ' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/wallet/address-book/add');

    await user.type(screen.getByRole('textbox', { name: 'Tìm địa chỉ hoặc tên' }), '  no-match  ');

    expect(screen.getByText('Không tìm thấy địa chỉ')).toBeInTheDocument();
    expect(screen.queryByText('BTC chính')).not.toBeInTheDocument();
    expect(screen.queryByText('ETH lạnh')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thêm địa chỉ mới' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/wallet/address-book/add');
  });

  it('shows the query error state and recovers after an explicit retry', async () => {
    const user = userEvent.setup();
    let requests = 0;
    let allowRecovery = false;
    server.use(
      http.get('*/wallet/address-book', () => {
        requests += 1;
        return allowRecovery
          ? HttpResponse.json(addressBook)
          : HttpResponse.json({ message: 'Unavailable' }, { status: 503 });
      }),
    );

    renderWithProviders(<AddressBookPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    const requestsBeforeRetry = requests;
    allowRecovery = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('BTC chính')).toBeInTheDocument();
    expect(requests).toBeGreaterThan(requestsBeforeRetry);
  });

  it('keeps server state visible when whitelist, favorite, and delete mutations fail', async () => {
    const user = userEvent.setup();
    let failedMutations = 0;
    server.use(
      http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)),
      http.patch('*/wallet/address-book/settings', () => {
        failedMutations += 1;
        return HttpResponse.json({ message: 'Unavailable' }, { status: 503 });
      }),
      http.patch('*/wallet/address-book/:id', () => {
        failedMutations += 1;
        return HttpResponse.json({ message: 'Unavailable' }, { status: 503 });
      }),
      http.delete('*/wallet/address-book/:id', () => {
        failedMutations += 1;
        return HttpResponse.json({ message: 'Unavailable' }, { status: 503 });
      }),
    );

    renderWithProviders(<AddressBookPage />);
    await screen.findByText('BTC chính');

    await user.click(screen.getByRole('button', { name: 'Bật chế độ whitelist' }));
    await waitFor(() => expect(failedMutations).toBe(1));
    expect(screen.getByRole('button', { name: 'Bật chế độ whitelist' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Thêm vào yêu thích BTC chính' }));
    await waitFor(() => expect(failedMutations).toBe(2));
    expect(screen.getByRole('button', { name: 'Thêm vào yêu thích BTC chính' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Xóa địa chỉ BTC chính' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xóa địa chỉ' });
    await user.click(within(dialog).getByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(failedMutations).toBe(3));

    expect(screen.getByText('BTC chính')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Xóa địa chỉ' })).not.toBeInTheDocument();
  });

  it('copies an address and reports clipboard rejection without marking it copied', async () => {
    const user = userEvent.setup();
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('Denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)));

    try {
      renderWithProviders(<AddressBookPage />);
      await screen.findByText('BTC chính');

      await user.click(screen.getAllByRole('button', { name: 'Sao chép' })[1]);

      await waitFor(() => expect(writeText).toHaveBeenCalledWith('bc1qvittradeaddress001'));
      expect(screen.getAllByRole('button', { name: 'Sao chép' })).toHaveLength(2);
      expect(screen.queryByText('Đã copy')).not.toBeInTheDocument();
    } finally {
      if (clipboardDescriptor) {
        Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
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
    await user.click(screen.getByRole('button', { name: 'Tắt chế độ whitelist' }));
    await waitFor(() => expect(currentBook.whitelistEnabled).toBe(false));
    expect(screen.getByRole('button', { name: 'Bật chế độ whitelist' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Thêm vào yêu thích BTC chính' }));
    await waitFor(() =>
      expect(currentBook.items.find((item) => item.id === 'btc-1')?.isFavorite).toBe(true),
    );
    expect(screen.getByRole('button', { name: 'Bỏ yêu thích BTC chính' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bỏ yêu thích BTC chính' }));
    await waitFor(() =>
      expect(currentBook.items.find((item) => item.id === 'btc-1')?.isFavorite).toBe(false),
    );

    await user.click(screen.getByRole('button', { name: 'Xóa địa chỉ BTC chính' }));
    const deleteDialog = await screen.findByRole('dialog', { name: 'Xóa địa chỉ' });
    expect(within(deleteDialog).getByText('BTC chính')).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(currentBook.items.some((item) => item.id === 'btc-1')).toBe(false));
    await waitFor(() => expect(screen.queryByText('BTC chính')).not.toBeInTheDocument());
    expect(mutationRequests.map(({ method, id }) => [method, id])).toEqual([
      ['settings', null],
      ['settings', null],
      ['update', 'btc-1'],
      ['update', 'btc-1'],
      ['delete', 'btc-1'],
    ]);
    expect(mutationRequests.every(({ key }) => key?.startsWith('address-book-'))).toBe(true);
  });

  it('marks a copied address temporarily and clears the copied state', async () => {
    const user = userEvent.setup();
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(http.get('*/wallet/address-book', () => HttpResponse.json(addressBook)));

    try {
      renderWithProviders(<AddressBookPage />);
      await screen.findByText('BTC chính');
      await user.click(screen.getAllByRole('button', { name: 'Sao chép' })[1]);

      expect(await screen.findByText('Đã copy')).toBeInTheDocument();
      expect(writeText).toHaveBeenCalledWith('bc1qvittradeaddress001');
      await waitFor(() => expect(screen.queryByText('Đã copy')).not.toBeInTheDocument(), {
        timeout: 3000,
      });
    } finally {
      if (clipboardDescriptor) {
        Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });
});
