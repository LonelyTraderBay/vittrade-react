import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse, type DefaultBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { invokeStaleReactHandler } from '@/test/invoke-stale-react-handler';
import type { P2PDispute } from '../model/p2p-types';
import { P2PDisputeDetailPage } from './P2PDisputeDetailPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

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
  it('announces that dispute escalation is still processing before the server responds', async () => {
    let resolveEscalation!: (response: HttpResponse<DefaultBodyType>) => void;
    server.use(
      http.get('*/p2p/disputes/dispute-1', () => HttpResponse.json(dispute)),
      http.post(
        '*/p2p/disputes/dispute-1/escalate',
        () =>
          new Promise<HttpResponse<DefaultBodyType>>((resolve) => {
            resolveEscalation = resolve;
          }),
      ),
    );
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Escalate dispute' }));
    expect(screen.getByText('Đang xử lý…')).toBeInTheDocument();

    resolveEscalation(HttpResponse.json({ ...dispute, escalationLevel: 3 }));
    expect(await screen.findByText(/3\/4/)).toBeInTheDocument();
  });

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

  it('renders earlier timeline events and both support-message senders', async () => {
    server.use(
      http.get('*/p2p/disputes/dispute-1', () =>
        HttpResponse.json({
          ...dispute,
          timeline: [
            { time: '10:00', event: 'Dispute submitted' },
            { time: '10:15', event: 'Evidence reviewed', detail: 'Receipt verified' },
          ],
          supportMessages: [
            { sender: 'support', text: 'We are reviewing the transfer.', time: '10:10' },
            { sender: 'user', text: 'I attached the bank receipt.', time: '10:12' },
          ],
        }),
      ),
    );

    renderDetail();

    expect(await screen.findByText('Evidence reviewed')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText(/Receipt verified/)).toBeInTheDocument();
    expect(screen.getByText('We are reviewing the transfer.')).toBeInTheDocument();
    expect(screen.getByText('I attached the bank receipt.')).toBeInTheDocument();
    expect(screen.getByText('Hỗ trợ · 10:10')).toBeInTheDocument();
    expect(screen.getByText('Bạn · 10:12')).toBeInTheDocument();
  });

  it('keeps dispute details available and reports failed support actions', async () => {
    server.use(
      http.get('*/p2p/disputes/dispute-1', () => HttpResponse.json(dispute)),
      http.post('*/p2p/disputes/dispute-1/messages', () =>
        HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
      ),
      http.post('*/p2p/disputes/dispute-1/escalate', () =>
        HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();

    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Escalate dispute' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể escalation tranh chấp.'),
    );

    await user.type(screen.getByRole('textbox', { name: 'Dispute support message' }), 'Need help');
    await user.click(screen.getByRole('button', { name: 'Send dispute message' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Không thể gửi tin nhắn.'));
    expect(screen.getByRole('textbox', { name: 'Dispute support message' })).toHaveValue(
      'Need help',
    );
  });

  it('ignores a stale send callback when the trimmed message is empty', async () => {
    let messageWrites = 0;
    server.use(
      http.get('*/p2p/disputes/dispute-1', () => HttpResponse.json(dispute)),
      http.post('*/p2p/disputes/dispute-1/messages', () => {
        messageWrites += 1;
        return HttpResponse.json(dispute);
      }),
    );

    const user = userEvent.setup();
    renderDetail();
    const message = await screen.findByRole('textbox', { name: 'Dispute support message' });
    await user.type(message, '   ');
    const send = screen.getByRole('button', { name: 'Send dispute message' });

    expect(send).toBeDisabled();
    invokeStaleReactHandler(send, 'onClick');

    expect(messageWrites).toBe(0);
    expect(message).toHaveValue('   ');
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
