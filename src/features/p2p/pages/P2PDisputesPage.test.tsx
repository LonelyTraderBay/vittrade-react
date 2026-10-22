import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PDispute, P2PDisputeStatus, P2PDisputesResponse } from '../model/p2p-types';
import { P2PDisputesPage } from './P2PDisputesPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeDispute(id: string, orderNumber: string, status: P2PDisputeStatus): P2PDispute {
  return {
    id,
    orderId: `order-${id}`,
    orderNumber,
    reason: `${status} payment review`,
    description: 'Contract-backed dispute description.',
    evidence: ['transfer.png'],
    status,
    createdAt: '2026-09-21T10:00:00.000Z',
    timeline: [{ time: '2026-09-21T10:00:00.000Z', event: 'Dispute submitted' }],
    supportMessages: [],
    escalationLevel: 2,
  };
}

const response: P2PDisputesResponse = {
  items: [
    makeDispute('dispute-1', 'VT-P2P-001', 'submitted'),
    makeDispute('dispute-2', 'VT-P2P-002', 'under_review'),
    makeDispute('dispute-3', 'VT-P2P-003', 'resolved'),
    makeDispute('dispute-4', 'VT-P2P-004', 'rejected'),
  ],
  total: 4,
};

describe('P2P disputes contract page', () => {
  it('cancels an older filter and ignores its late handler after another filter succeeds', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false,
      aborted = false,
      finished = false;
    server.use(
      http.get('*/p2p/disputes', async ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        if (status === 'resolved') {
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
        const items = status
          ? response.items.filter((row) => row.status === status)
          : response.items;
        return HttpResponse.json({ items, total: items.length });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PDisputesPage />);
    await screen.findByRole('button', { name: 'Open dispute VT-P2P-001' });
    try {
      await user.click(screen.getByRole('button', { name: 'Đã giải quyết' }));
      await waitFor(() => expect(started).toBe(true));
      const latest = screen.getByRole('button', { name: 'Bị từ chối' });
      await user.click(latest);
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-004' });
      expect(aborted).toBe(true);
      await act(async () => release());
      await waitFor(() => expect(finished).toBe(true));
      expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-004' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Open dispute VT-P2P-003' }),
      ).not.toBeInTheDocument();
      expect(latest).toHaveFocus();
    } finally {
      release();
    }
  });

  it('retains the selected filter and focus during a delayed request', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false;
    server.use(
      http.get('*/p2p/disputes', async ({ request }) => {
        if (new URL(request.url).searchParams.get('status') === 'resolved') {
          started = true;
          await gate;
          return HttpResponse.json({ items: [response.items[2]], total: 1 });
        }
        return HttpResponse.json(response);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PDisputesPage />);
    await screen.findByRole('button', { name: 'Open dispute VT-P2P-001' });
    const selected = screen.getByRole('button', { name: 'Đã giải quyết' });
    try {
      await user.click(selected);
      await waitFor(() => expect(started).toBe(true));
      expect(selected).toBeInTheDocument();
      expect(selected).toHaveFocus();
      expect(selected).toHaveAttribute('aria-pressed', 'true');
    } finally {
      release();
    }
    await screen.findByRole('button', { name: 'Open dispute VT-P2P-003' });
    expect(selected).toHaveFocus();
  });

  it('retains filters after a read error and recovers by selecting all', async () => {
    server.use(
      http.get('*/p2p/disputes', ({ request }) =>
        new URL(request.url).searchParams.has('status')
          ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
          : HttpResponse.json(response),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PDisputesPage />);
    await screen.findByRole('button', { name: 'Open dispute VT-P2P-001' });
    const selected = screen.getByRole('button', { name: 'Đã giải quyết' });
    await user.click(selected);
    await screen.findByText('Không thể tải tranh chấp P2P');
    expect(selected).toBeInTheDocument();
    expect(selected).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: 'Open dispute VT-P2P-001' }),
    ).not.toBeInTheDocument();
    const all = screen.getByRole('button', { name: 'Tất cả' });
    await user.click(all);
    await screen.findByRole('button', { name: 'Open dispute VT-P2P-001' });
    expect(all).toHaveFocus();
  });

  it('renders contract-backed disputes and switches status filters', async () => {
    server.use(
      http.get('*/p2p/disputes', ({ request }) => {
        const status = new URL(request.url).searchParams.get('status') as P2PDisputeStatus | null;
        const items = status
          ? response.items.filter((item) => item.status === status)
          : response.items;
        return HttpResponse.json({ items, total: items.length });
      }),
    );

    renderWithProviders(<P2PDisputesPage />);

    expect(
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-001' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng').previousElementSibling).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-002' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-003' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-004' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Đang xem xét' }));
    expect(
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-002' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open dispute VT-P2P-001' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open dispute VT-P2P-002' }));

    await userEvent.click(screen.getByRole('button', { name: 'Bị từ chối' }));
    expect(
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-004' }),
    ).toBeInTheDocument();
  });

  it('renders the empty state for a filter without disputes', async () => {
    server.use(http.get('*/p2p/disputes', () => HttpResponse.json({ items: [], total: 0 })));

    renderWithProviders(<P2PDisputesPage />);

    expect(await screen.findByRole('button', { name: 'Tất cả' })).toBeInTheDocument();
    expect(await screen.findByRole('status', { name: 'No P2P disputes' })).toBeInTheDocument();
  });

  it('renders and retries the shared error state', async () => {
    server.use(
      http.get('*/p2p/disputes', () =>
        HttpResponse.json({ code: 'P2P_DISPUTES_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<P2PDisputesPage />);

    expect(await screen.findByText('Không thể tải tranh chấp P2P')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không thể tải tranh chấp P2P')).toBeInTheDocument();
  });
});
