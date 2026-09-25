import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-002' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-003' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dispute VT-P2P-004' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Filter disputes: under_review' }));
    expect(
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-002' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open dispute VT-P2P-001' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open dispute VT-P2P-002' }));

    await userEvent.click(screen.getByRole('button', { name: 'Filter disputes: rejected' }));
    expect(
      await screen.findByRole('button', { name: 'Open dispute VT-P2P-004' }),
    ).toBeInTheDocument();
  });

  it('renders the empty state for a filter without disputes', async () => {
    server.use(http.get('*/p2p/disputes', () => HttpResponse.json({ items: [], total: 0 })));

    renderWithProviders(<P2PDisputesPage />);

    expect(await screen.findByRole('button', { name: 'Filter disputes: all' })).toBeInTheDocument();
    expect(await screen.findByRole('status', { name: 'No P2P disputes' })).toBeInTheDocument();
  });

  it('renders and retries the shared error state', async () => {
    server.use(
      http.get('*/p2p/disputes', () =>
        HttpResponse.json({ code: 'P2P_DISPUTES_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<P2PDisputesPage />);

    expect(await screen.findByText('Unable to load P2P disputes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P disputes')).toBeInTheDocument();
  });
});
