import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { invokeStaleReactHandler } from '@/test/invoke-stale-react-handler';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { p2pApi } from '../api/p2p-api';
import type { P2PBlacklistEntry, P2PBlacklistResponse } from '../model/p2p-types';
import { P2PBlacklistPage } from './P2PBlacklistPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const firstEntry: P2PBlacklistEntry = {
  id: 'blacklist-1',
  userId: 'user-1',
  username: 'scam-merchant',
  reason: 'scam',
  reasonText: 'Unresolved payment dispute',
  blockedAt: '2026-09-20T10:00:00.000Z',
  tradesBefore: 42,
  completionRate: 98,
  isVerified: true,
};

const secondEntry: P2PBlacklistEntry = {
  id: 'blacklist-2',
  userId: 'user-2',
  username: 'slow-merchant',
  reason: 'unresponsive',
  blockedAt: '2026-09-19T10:00:00.000Z',
  tradesBefore: 12,
  completionRate: 80,
  isVerified: false,
};

describe('P2P blacklist contract page', () => {
  it('allows reading entries but disables blacklist management without write permission', async () => {
    let removeCalls = 0;
    server.use(
      http.get('*/p2p/blacklist', () => HttpResponse.json({ items: [firstEntry], total: 1 })),
      http.delete('*/p2p/blacklist/:entryId', () => {
        removeCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    };

    renderWithProviders(<P2PBlacklistPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'P2P blacklist write permission is required to manage blocked users.',
    );
    expect(screen.getByText('scam-merchant')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm người dùng vào danh sách chặn' }),
    ).toBeDisabled();
    const remove = screen.getByRole('button', {
      name: 'Remove scam-merchant from P2P blacklist',
    });
    expect(remove).toBeDisabled();
    invokeStaleReactHandler(remove, 'onClick');
    await userEvent.click(await screen.findByRole('button', { name: 'Bỏ chặn' }));
    expect(removeCalls).toBe(0);
  });

  it('uses the number of returned entries when the response omits its total', async () => {
    vi.spyOn(p2pApi, 'listBlacklist').mockResolvedValueOnce({
      items: [firstEntry],
    } as unknown as P2PBlacklistResponse);

    renderWithProviders(<P2PBlacklistPage />);

    expect(await screen.findByText('scam-merchant')).toBeInTheDocument();
    expect(screen.getByText('1 người dùng')).toBeInTheDocument();
  });

  it('queries the trimmed search and opens the add-user route', async () => {
    const searches: Array<string | null> = [];
    let releaseSearch = () => {};
    const pendingSearch = new Promise<void>((resolve) => {
      releaseSearch = resolve;
    });
    server.use(
      http.get('*/p2p/blacklist', async ({ request }) => {
        const search = new URL(request.url).searchParams.get('search');
        searches.push(search);
        if (search) await pendingSearch;
        return HttpResponse.json({
          items: search ? [secondEntry] : [firstEntry, secondEntry],
          total: search ? 1 : 2,
        });
      }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/p2p/blacklist" element={<P2PBlacklistPage />} />
        <Route path="/p2p/blacklist/add" element={<p>Add-user destination</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/blacklist'] } },
    );
    expect(await screen.findByText('scam-merchant')).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Tìm người dùng đã chặn' }),
      '  slow  ',
    );
    await waitFor(() => expect(searches).toContain('slow'));
    const searchInput = screen.getByRole('textbox', { name: 'Tìm người dùng đã chặn' });
    expect(searchInput).toHaveFocus();
    expect(searchInput).toHaveValue('  slow  ');
    expect(screen.getByText('scam-merchant')).toBeInTheDocument();
    releaseSearch();
    await waitFor(() => expect(screen.queryByText('scam-merchant')).not.toBeInTheDocument());
    await userEvent.click(
      screen.getByRole('button', { name: 'Thêm người dùng vào danh sách chặn' }),
    );
    expect(await screen.findByText('Add-user destination')).toBeInTheDocument();
  });
  it('renders entries, filters by reason, and removes an entry idempotently', async () => {
    let response: P2PBlacklistResponse = { items: [firstEntry, secondEntry], total: 2 };
    server.use(
      http.get('*/p2p/blacklist', ({ request }) => {
        const reason = new URL(request.url).searchParams.get('reason');
        const items = reason
          ? response.items.filter((entry) => entry.reason === reason)
          : response.items;
        return HttpResponse.json({ items, total: items.length });
      }),
      http.delete('*/p2p/blacklist/blacklist-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(
          /^p2p-blacklist-remove-blacklist-1-/,
        );
        response = { items: [secondEntry], total: 1 };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);

    expect(await screen.findByText('scam-merchant')).toBeInTheDocument();
    expect(screen.getByText('slow-merchant')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc lý do chặn' }), 'scam');
    expect(await screen.findByText('scam-merchant')).toBeInTheDocument();
    expect(screen.queryByText('slow-merchant')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Remove scam-merchant from P2P blacklist' }),
    );
    expect(await screen.findByRole('heading', { name: 'Bỏ chặn người dùng?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    await waitFor(() => expect(screen.queryByText('scam-merchant')).not.toBeInTheDocument());
  });

  it('renders empty and retries the shared error state', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/p2p/blacklist', () => {
        if (shouldFail) {
          return HttpResponse.json({ code: 'P2P_BLACKLIST_UNAVAILABLE' }, { status: 503 });
        }
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderWithProviders(<P2PBlacklistPage />);
    expect(await screen.findByText('Không thể tải danh sách chặn')).toBeInTheDocument();
    shouldFail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(
      await screen.findByRole('status', { name: 'No P2P blacklist entries' }),
    ).toBeInTheDocument();
  });

  it('keeps the search focused through a terminal read error and recovers by editing it', async () => {
    server.use(
      http.get('*/p2p/blacklist', ({ request }) =>
        new URL(request.url).searchParams.get('search') === 'bad'
          ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
          : HttpResponse.json({ items: [firstEntry], total: 1 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    await screen.findByText('scam-merchant');
    const input = screen.getByRole('textbox', { name: 'Tìm người dùng đã chặn' });
    await user.type(input, 'bad');
    await screen.findByText('Không thể tải danh sách chặn');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('bad');
    await user.clear(input);
    await screen.findByText('scam-merchant');
    expect(input).toHaveFocus();
  });

  it('keeps the pending confirmation locked and rejects repeated captured activations', async () => {
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    server.use(
      http.get('*/p2p/blacklist', () => HttpResponse.json({ items: [firstEntry], total: 1 })),
      http.delete('*/p2p/blacklist/:id', async () => {
        calls++;
        await pending;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    await user.click(
      await screen.findByRole('button', { name: 'Remove scam-merchant from P2P blacklist' }),
    );
    const confirm = screen.getByRole('button', { name: 'Bỏ chặn' });
    try {
      await user.click(confirm);
      invokeStaleReactHandler(confirm, 'onClick');
      invokeStaleReactHandler(confirm, 'onClick');
      await waitFor(() => expect(calls).toBe(1));
      expect(screen.getByRole('dialog', { name: 'Bỏ chặn người dùng?' })).toBeInTheDocument();
      expect(confirm).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Huỷ' })).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog', { name: 'Bỏ chặn người dùng?' })).toBeInTheDocument();
    } finally {
      await act(async () => release());
    }
  });

  it('keeps failure feedback and the target, then retries manually with the same key', async () => {
    const keys: string[] = [];
    let items = [firstEntry];
    server.use(
      http.get('*/p2p/blacklist', () => HttpResponse.json({ items, total: items.length })),
      http.delete('*/p2p/blacklist/:id', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        if (keys.length === 1) return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
        items = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    await user.click(
      await screen.findByRole('button', { name: 'Remove scam-merchant from P2P blacklist' }),
    );
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể bỏ chặn người dùng');
    expect(screen.getByRole('dialog', { name: 'Bỏ chặn người dùng?' })).toHaveTextContent(
      'scam-merchant',
    );
    expect(keys).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^p2p-blacklist-remove-blacklist-1-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('marks previous-query rows as updating and blocks their remove actions', async () => {
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/p2p/blacklist', async ({ request }) => {
        if (new URL(request.url).searchParams.get('search')) await pending;
        return HttpResponse.json({ items: [firstEntry], total: 1 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    const remove = await screen.findByRole('button', {
      name: 'Remove scam-merchant from P2P blacklist',
    });
    try {
      await user.type(screen.getByRole('textbox', { name: 'Tìm người dùng đã chặn' }), 'new');
      expect(screen.getByText('scam-merchant')).toBeInTheDocument();
      expect(remove).toBeDisabled();
      expect(
        screen.getByRole('status', { name: 'Đang cập nhật danh sách chặn' }),
      ).toBeInTheDocument();
    } finally {
      await act(async () => release());
    }
  });

  it('returns focus to the workspace after a successful removal whose list refresh fails', async () => {
    let removed = false;
    server.use(
      http.get('*/p2p/blacklist', () =>
        removed
          ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
          : HttpResponse.json({ items: [firstEntry], total: 1 }),
      ),
      http.delete('*/p2p/blacklist/:id', () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    await user.click(
      await screen.findByRole('button', { name: 'Remove scam-merchant from P2P blacklist' }),
    );
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    await screen.findByText('Không thể tải danh sách chặn');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Danh sách người dùng đã chặn' })).toHaveFocus(),
    );
  });

  it('cancels without a request and returns focus to the row', async () => {
    let calls = 0;
    server.use(
      http.get('*/p2p/blacklist', () => HttpResponse.json({ items: [firstEntry], total: 1 })),
      http.delete('*/p2p/blacklist/:id', () => {
        calls++;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    const opener = await screen.findByRole('button', {
      name: 'Remove scam-merchant from P2P blacklist',
    });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(calls).toBe(0);
  });

  it('clears old feedback on reopen while retaining the key of an unsuccessful intent', async () => {
    const keys: string[] = [];
    let items = [firstEntry];
    server.use(
      http.get('*/p2p/blacklist', () => HttpResponse.json({ items, total: items.length })),
      http.delete('*/p2p/blacklist/:id', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        if (keys.length === 1) return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
        items = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    const name = 'Remove scam-merchant from P2P blacklist';
    await user.click(await screen.findByRole('button', { name }));
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bỏ chặn' }));
    await screen.findByRole('status', { name: 'No P2P blacklist entries' });
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });

  it('cancels the previous search and keeps the latest rows after its late handler completes', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false;
    let aborted = false;
    let finished = false;
    server.use(
      http.get('*/p2p/blacklist', async ({ request }) => {
        const search = new URL(request.url).searchParams.get('search');
        if (search === 'old') {
          started = true;
          request.signal.addEventListener(
            'abort',
            () => {
              aborted = true;
            },
            { once: true },
          );
          await gate;
          finished = true;
        }
        const items = search === 'new' ? [secondEntry] : [firstEntry];
        return HttpResponse.json({ items, total: 1 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistPage />);
    await screen.findByText('scam-merchant');
    const input = screen.getByRole('textbox', { name: 'Tìm người dùng đã chặn' });
    try {
      await user.type(input, 'old');
      await waitFor(() => expect(started).toBe(true));
      await user.clear(input);
      await user.type(input, 'new');
      await screen.findByText('slow-merchant');
      expect(aborted).toBe(true);
      await act(async () => release());
      await waitFor(() => expect(finished).toBe(true));
      expect(screen.getByText('slow-merchant')).toBeInTheDocument();
      expect(screen.queryByText('scam-merchant')).not.toBeInTheDocument();
      expect(input).toHaveValue('new');
      expect(input).toHaveFocus();
    } finally {
      await act(async () => release());
    }
  });
});
