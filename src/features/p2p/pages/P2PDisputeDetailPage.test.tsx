import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2PDispute } from '../model/p2p-types';
import { P2PDisputeDetailPage } from './P2PDisputeDetailPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const dispute: P2PDispute = {
  id: 'dispute-1',
  orderId: 'order-1',
  orderNumber: 'VT-P2P-001',
  reason: 'Payment not confirmed',
  description: 'The transfer was completed but the counterparty has not confirmed it.',
  evidence: ['transfer.png', 'receipt.pdf'],
  status: 'under_review',
  createdAt: '2026-09-21T10:00:00.000Z',
  timeline: [
    { time: '2026-09-21T10:00:00.000Z', event: 'Dispute submitted', detail: 'Initial report' },
  ],
  supportMessages: [],
  escalationLevel: 2,
};

function renderDetail(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/dispute/detail/:id" element={<P2PDisputeDetailPage />} />
    </Routes>,
    {
      routerProps: { initialEntries: ['/p2p/dispute/detail/dispute-1'] },
      authAdapter,
    },
  );
}

describe('P2P dispute detail contract page', () => {
  it('renders detail, sends a message and escalates with idempotency keys', async () => {
    const message = {
      sender: 'user' as const,
      text: 'Additional context',
      time: '10:05',
    };
    const afterMessage = { ...dispute, supportMessages: [message] };
    const afterEscalation = { ...afterMessage, escalationLevel: 3 };

    server.use(
      http.get('*/p2p/disputes/dispute-1', () => HttpResponse.json(dispute)),
      http.post('*/p2p/disputes/dispute-1/messages', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-dispute-message-/);
        expect(await request.json()).toEqual({ text: 'Additional context' });
        return HttpResponse.json(afterMessage);
      }),
      http.post('*/p2p/disputes/dispute-1/escalate', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-dispute-escalate-/);
        expect(await request.json()).toEqual({ level: 3 });
        return HttpResponse.json(afterEscalation);
      }),
    );

    const user = userEvent.setup();
    renderDetail();

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(screen.getByText('transfer.png')).toBeInTheDocument();
    expect(screen.getByText(/Initial report/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escalate dispute' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Escalate dispute' }));
    await waitFor(() => expect(screen.getByText(/3\/4/)).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: 'Dispute support message' }), message.text);
    await user.click(screen.getByRole('button', { name: 'Send dispute message' }));

    expect(await screen.findByText('Additional context')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dispute support message' })).toHaveValue('');
  });

  it('does not expose escalation for a resolved dispute at the terminal level', async () => {
    server.use(
      http.get('*/p2p/disputes/dispute-1', () =>
        HttpResponse.json({ ...dispute, status: 'resolved', escalationLevel: 4 }),
      ),
    );

    renderDetail();

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Escalate dispute' })).not.toBeInTheDocument();
  });

  it('renders and retries the shared error state', async () => {
    server.use(
      http.get('*/p2p/disputes/dispute-1', () =>
        HttpResponse.json({ code: 'P2P_DISPUTE_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderDetail();

    expect(await screen.findByText('Unable to load P2P dispute')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P dispute')).toBeInTheDocument();
  });

  it('keeps dispute details readable but blocks support actions without permission', async () => {
    server.use(http.get('*/p2p/disputes/dispute-1', () => HttpResponse.json(dispute)));

    renderDetail({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read', 'p2p:read'],
        },
      },
    });

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P dispute write permission is required for support actions.',
    );
    expect(screen.queryByRole('button', { name: 'Escalate dispute' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dispute support message' })).toBeDisabled();
  });
});
