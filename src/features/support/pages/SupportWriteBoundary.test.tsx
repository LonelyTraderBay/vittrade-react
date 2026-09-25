import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { NotificationsContractPage } from './NotificationsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function readOnlyAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions: ['notifications:read'] },
    },
  };
}

describe('Support write permission boundary', () => {
  it('keeps notification acknowledgement disabled for read-only sessions', async () => {
    server.use(
      http.get('*/notifications', () =>
        HttpResponse.json({
          items: [
            {
              id: 'notification-1',
              type: 'system',
              title: 'System update',
              message: 'A new update is available.',
              time: '2026-09-23T00:00:00.000Z',
              isRead: false,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<NotificationsContractPage />, { authAdapter: readOnlyAdapter() });

    expect(
      await screen.findByText(
        'Notification write permission is required to mark notifications as read.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đã đọc' })).toBeDisabled();
  });
});
