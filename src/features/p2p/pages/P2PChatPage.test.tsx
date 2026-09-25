import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2PChatResponse, P2POrder } from '../model/p2p-types';
import { P2PChatPage } from './P2PChatPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const order: P2POrder = {
  id: 'order-1',
  orderNumber: 'P2P-001',
  adId: 'ad-1',
  type: 'buy',
  asset: 'USDT',
  amount: 100,
  price: 25_000,
  total: 2_500_000,
  currency: 'VND',
  status: 'paid',
  merchant: 'Alpha Merchant',
  merchantId: 'merchant-1',
  counterparty: 'user-1',
  paymentMethod: 'Bank transfer',
  createdAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:30:00.000Z',
  escrowAmount: 100,
  fee: 0,
};

const chat: P2PChatResponse = {
  orderId: 'order-1',
  counterparty: 'Alpha Merchant',
  e2eEncrypted: true,
  messages: [
    { id: 'system-1', sender: 'system', text: 'Trade started', sentAt: '10:00', type: 'system' },
    {
      id: 'counterparty-1',
      sender: 'counterparty',
      text: 'Please confirm the transfer.',
      sentAt: '10:01',
      type: 'text',
    },
    {
      id: 'user-1',
      sender: 'user',
      text: 'I am checking it now.',
      sentAt: '10:02',
      type: 'text',
      readAt: '10:03',
    },
  ],
};

function renderChat(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/chat/:orderId" element={<P2PChatPage />} />
    </Routes>,
    {
      routerProps: { initialEntries: ['/p2p/chat/order-1'] },
      authAdapter,
    },
  );
}

describe('P2P chat contract page', () => {
  it('renders messages and updates the chat cache after a successful send', async () => {
    const updatedChat: P2PChatResponse = {
      ...chat,
      messages: [
        ...chat.messages,
        { id: 'user-2', sender: 'user', text: 'Hello', sentAt: '10:04', type: 'text' },
      ],
    };

    server.use(
      http.get('*/p2p/orders/order-1/chat', () => HttpResponse.json(chat)),
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/chat/messages', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-chat-order-1-/);
        expect(await request.json()).toEqual({ text: 'Hello', type: 'text' });
        return HttpResponse.json(updatedChat);
      }),
    );

    const user = userEvent.setup();
    renderChat();

    expect(await screen.findByText('Please confirm the transfer.')).toBeInTheDocument();
    expect(screen.getByText('Trade started')).toBeInTheDocument();
    expect(screen.getByText('I am checking it now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open P2P order' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'P2P chat message' }), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send chat message' }));

    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'P2P chat message' })).toHaveValue('');
  });

  it('shows a recoverable message error without losing the conversation', async () => {
    server.use(
      http.get('*/p2p/orders/order-1/chat', () => HttpResponse.json(chat)),
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/chat/messages', () =>
        HttpResponse.json({ code: 'CHAT_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    const user = userEvent.setup();
    renderChat();
    await screen.findByText('Please confirm the transfer.');

    await user.type(screen.getByRole('textbox', { name: 'P2P chat message' }), 'Retry me');
    await user.click(screen.getByRole('button', { name: 'Send chat message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/tin nh/);
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'P2P chat message' })).toHaveValue('Retry me'),
    );
  });

  it('renders the shared error state when either contract is unavailable', async () => {
    server.use(
      http.get('*/p2p/orders/order-1/chat', () =>
        HttpResponse.json({ code: 'CHAT_UNAVAILABLE' }, { status: 503 }),
      ),
      http.get('*/p2p/orders/order-1', () =>
        HttpResponse.json({ code: 'ORDER_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderChat();

    expect(await screen.findByText('Unable to load P2P chat')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P chat')).toBeInTheDocument();
  });

  it('keeps the conversation readable but blocks sending without permission', async () => {
    server.use(
      http.get('*/p2p/orders/order-1/chat', () => HttpResponse.json(chat)),
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
    );

    renderChat({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read', 'p2p:read'],
        },
      },
    });

    expect(await screen.findByText('Please confirm the transfer.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P chat write permission is required to send messages.',
    );
    expect(screen.getByRole('textbox', { name: 'P2P chat message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send chat message' })).toBeDisabled();
  });
});
