import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { CopyConfirmationContractPage } from './CopyConfirmationContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const provider = {
  id: 'provider-1',
  name: 'Provider One',
  avatar: 'P1',
  winRate: 62,
  totalPnl: 1_250,
  totalPnlPct: 12.5,
  aum: 250_000,
  copiers: 48,
  maxCopiers: 100,
  sharpeRatio: 1.8,
  maxDrawdown: 8.5,
  totalTrades: 120,
  avgHoldingTime: '4h',
  weeklyPnl: [1, 2, -1, 3],
  tags: ['swing'],
  isFollowing: true,
  riskLevel: 'medium',
  verified: true,
};

describe('CopyConfirmationContractPage', () => {
  it('reuses the copy activation idempotency key after a transient failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('*/trading/copy/providers/provider-1', () =>
        HttpResponse.json({ provider, pnlHistory: [], recentTrades: [] }),
      ),
      http.post('*/trading/copy/relationships', ({ request }) => {
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        attempts += 1;
        if (attempts === 1)
          return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
        return HttpResponse.json({ id: 'relationship-1' });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route
          path="/trade/copy/provider/:providerId/confirmation"
          element={<CopyConfirmationContractPage />}
        />
      </Routes>,
      {
        routerProps: {
          initialEntries: [{ pathname: '/trade/copy/provider/provider-1/confirmation', state: {} }],
        },
      },
    );

    expect(await screen.findAllByText('Provider One')).not.toHaveLength(0);
    for (const consent of screen.getAllByRole('checkbox')) await user.click(consent);
    const submit = screen.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' });
    await user.click(submit);
    await screen.findByText('Không thể kích hoạt copy. Vui lòng thử lại.');
    await user.click(submit);

    await waitFor(() => expect(idempotencyKeys).toHaveLength(2));
    expect(idempotencyKeys[0]).toMatch(/^copy-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('requires trading write permission even after all risk consents are accepted', async () => {
    let createRequestCount = 0;
    server.use(
      http.get('*/trading/copy/providers/provider-1', () =>
        HttpResponse.json({ provider, pnlHistory: [], recentTrades: [] }),
      ),
      http.post('*/trading/copy/relationships', () => {
        createRequestCount += 1;
        return HttpResponse.json({ id: 'relationship-1' });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['trade:read'],
        },
      },
    };
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route
          path="/trade/copy/provider/:providerId/confirmation"
          element={<CopyConfirmationContractPage />}
        />
      </Routes>,
      {
        routerProps: { initialEntries: ['/trade/copy/provider/provider-1/confirmation'] },
        authAdapter: readOnlyAdapter,
      },
    );

    expect(await screen.findAllByText('Provider One')).not.toHaveLength(0);
    for (const consent of screen.getAllByRole('checkbox')) await user.click(consent);

    expect(screen.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Cần quyền giao dịch');
    expect(createRequestCount).toBe(0);
  });
});
