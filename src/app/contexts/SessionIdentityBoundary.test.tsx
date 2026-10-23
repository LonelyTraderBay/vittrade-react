import { useLayoutEffect, useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AppProvider } from './AppContext';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { AuthSession } from '@/shared/session/session-types';
import { useAuth } from '@/shared/session/useAuth';
import { queryClient } from '@/shared/api/query-client';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { SupportContractPage } from '@/features/support/pages/SupportContractPage';
import { ProtectedRoute } from '@/app/components/layout/ProtectedRoute';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => queryClient.clear());
afterEach(() => {
  queryClient.clear();
  server.resetHandlers();
});
afterAll(() => server.close());

function session(id: string): AuthSession {
  return {
    ...testAuthSession,
    accessToken: undefined,
    user: {
      ...testAuthSession.user,
      id,
      permissions: ['support:read', 'support:write'],
    },
  };
}

function setup(nextId: string) {
  let activeId = 'alpha';
  const snapshots: Array<{ userId: string | undefined; text: string }> = [];
  server.use(
    http.get('*/support/tickets', () =>
      HttpResponse.json({
        items: [
          {
            id: `ticket-${activeId}`,
            subject: `Private ticket ${activeId}`,
            description: 'Synthetic account-scoped support fixture',
            category: 'other',
            status: 'open',
            priority: 'normal',
            createdAt: '2026-10-22T00:00:00.000Z',
            updatedAt: '2026-10-22T00:00:00.000Z',
            messages: [],
          },
        ],
      }),
    ),
  );
  const adapter: AuthAdapter = {
    ...testAuthAdapter,
    initialSession: session(activeId),
    async refresh() {
      activeId = nextId;
      return session(nextId);
    },
  };
  function Probe() {
    const auth = useAuth();
    const root = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      snapshots.push({ userId: auth.user?.id, text: root.current?.textContent ?? '' });
    });
    return (
      <div ref={root}>
        <span data-testid="current-session-user">{auth.user?.id}</span>
        <button type="button" onClick={() => void auth.refreshSession()}>
          Refresh test session
        </button>
        <SupportContractPage />
      </div>
    );
  }
  // Use the production singleton: AppProvider clears this exact client on identity changes.
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/w/support']}>
        <AppProvider authAdapter={adapter}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/w/support" element={<Probe />} />
            </Route>
          </Routes>
        </AppProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, snapshots };
}

describe('Session identity and protected UI boundary', () => {
  it('preserves public authentication progress when a session is created', async () => {
    function PublicAuthenticationProbe() {
      const auth = useAuth();
      const [progress, setProgress] = useState('waiting');
      return (
        <button
          type="button"
          onClick={async () => {
            await auth.signIn({ email: 'synthetic@vittrade.local', password: 'test-password' });
            setProgress('verified');
          }}
        >
          {progress}
        </button>
      );
    }
    const adapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: null,
      login: async () => ({ status: 'authenticated', session: session('alpha') }),
    };
    const view = render(
      <QueryClientProvider client={queryClient}>
        <AppProvider authAdapter={adapter}>
          <PublicAuthenticationProbe />
        </AppProvider>
      </QueryClientProvider>,
    );
    try {
      const button = screen.getByRole('button', { name: 'waiting' });
      await userEvent.click(button);
      expect(await screen.findByRole('button', { name: 'verified' })).toBe(button);
    } finally {
      view.unmount();
    }
  });
  it('keeps a draft and its DOM when the same user refreshes', async () => {
    const view = setup('alpha');
    try {
      await screen.findByText('Private ticket alpha');
      const field = screen.getByRole('textbox', { name: 'Tiêu đề ticket' });
      await userEvent.type(field, 'Draft alpha');
      await userEvent.click(screen.getByRole('button', { name: 'Refresh test session' }));
      await waitFor(() =>
        expect(screen.getByTestId('current-session-user')).toHaveTextContent('alpha'),
      );
      expect(screen.getByRole('textbox', { name: 'Tiêu đề ticket' })).toBe(field);
      expect(field).toHaveValue('Draft alpha');
    } finally {
      view.unmount();
    }
  });

  it('clears a draft when the authenticated user changes', async () => {
    const view = setup('beta');
    try {
      await screen.findByText('Private ticket alpha');
      await userEvent.type(screen.getByRole('textbox', { name: 'Tiêu đề ticket' }), 'Draft alpha');
      await userEvent.click(screen.getByRole('button', { name: 'Refresh test session' }));
      await waitFor(() =>
        expect(screen.getByTestId('current-session-user')).toHaveTextContent('beta'),
      );
      expect(await screen.findByRole('textbox', { name: 'Tiêu đề ticket' })).toHaveValue('');
    } finally {
      view.unmount();
    }
  });

  it('does not commit the previous user ticket under a new authenticated identity', async () => {
    const view = setup('beta');
    try {
      await screen.findByText('Private ticket alpha');
      await userEvent.click(screen.getByRole('button', { name: 'Refresh test session' }));
      await waitFor(() =>
        expect(screen.getByTestId('current-session-user')).toHaveTextContent('beta'),
      );
      const mismatched = view.snapshots.filter(
        (snapshot) => snapshot.userId === 'beta' && snapshot.text.includes('Private ticket alpha'),
      );
      console.info('C06_SESSION_SCOPE_LAYOUT', JSON.stringify({ mismatched }));
      expect(mismatched).toEqual([]);
      expect(await screen.findByText('Private ticket beta')).toBeVisible();
      expect(screen.queryByText('Private ticket alpha')).not.toBeInTheDocument();
    } finally {
      view.unmount();
    }
  });
});
