import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PBlacklistEntry } from '../model/p2p-types';
import { P2PBlacklistAddPage } from './P2PBlacklistAddPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createdEntry: P2PBlacklistEntry = {
  id: 'blacklist-new',
  userId: 'user-new',
  username: 'unsafe-user',
  reason: 'fake_payment',
  blockedAt: '2026-09-22T10:00:00.000Z',
  tradesBefore: 2,
  completionRate: 50,
  isVerified: false,
};

describe('P2P blacklist add contract page', () => {
  it('creates a blacklist entry with reason, note, and idempotency key', async () => {
    server.use(
      http.post('*/p2p/blacklist', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-blacklist-create-/);
        expect(await request.json()).toEqual({
          username: 'unsafe-user',
          reason: 'fake_payment',
          note: 'Fraudulent transfer receipt',
        });
        return HttpResponse.json(createdEntry, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistAddPage />);
    await user.type(screen.getByRole('textbox', { name: 'P2P username' }), 'unsafe-user');
    await user.click(screen.getByRole('button', { name: 'Blacklist reason: fake_payment' }));
    await user.type(
      screen.getByRole('textbox', { name: /Ghi chú/i }),
      'Fraudulent transfer receipt',
    );
    await user.click(screen.getByRole('button', { name: 'Block P2P user' }));
  });

  it('shows a retryable error and keeps the form data', async () => {
    server.use(
      http.post('*/p2p/blacklist', () =>
        HttpResponse.json({ code: 'P2P_BLACKLIST_CREATE_FAILED' }, { status: 422 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PBlacklistAddPage />);
    const input = screen.getByRole('textbox', { name: 'P2P username' });
    await user.type(input, 'unsafe-user');
    await user.click(screen.getByRole('button', { name: 'Block P2P user' }));
    expect(await screen.findByText('Không thể chặn người dùng')).toBeInTheDocument();
    expect(input).toHaveValue('unsafe-user');
  });
});
