import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PBlacklistEntry, P2PBlacklistResponse } from '../model/p2p-types';
import { P2PBlacklistPage } from './P2PBlacklistPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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
});
