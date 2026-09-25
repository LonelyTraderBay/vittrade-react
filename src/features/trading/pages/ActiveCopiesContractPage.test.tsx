import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { ActiveCopiesContractPage } from './ActiveCopiesContractPage';

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
  riskLevel: 'medium' as const,
  verified: true,
};

const relationship = {
  id: 'copy-relationship-1',
  provider,
  status: 'active' as const,
  copyMode: 'mirror' as const,
  positionSizing: 'percentage' as const,
  copyRatio: 50,
  capital: 1_000,
  currentValue: 1_050,
  pnl: 50,
  pnlPct: 5,
  trades: 12,
  winRate: 62,
  hasCustomStopLoss: false,
  performanceHistory: [{ date: '2026-09-22T10:00:00.000Z', value: 1_050 }],
};

describe('Active copies contract page', () => {
  it('navigates to the provider details route', async () => {
    server.use(
      http.get('*/trading/copy/relationships', () => HttpResponse.json({ items: [relationship] })),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/trade/copy-trading/active" element={<ActiveCopiesContractPage />} />
        <Route path="/trade/copy-provider/:providerId" element={<p>Provider details reached</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/copy-trading/active'] } },
    );

    await user.click(await screen.findByRole('button', { name: 'Chi tiết' }));

    expect(await screen.findByText('Provider details reached')).toBeInTheDocument();
  });

  it('uses the loss color for negative relationship performance', async () => {
    server.use(
      http.get('*/trading/copy/relationships', () =>
        HttpResponse.json({
          items: [{ ...relationship, pnl: -50, pnlPct: -5 }],
        }),
      ),
    );

    renderWithProviders(<ActiveCopiesContractPage />, {
      routerProps: { initialEntries: ['/trade/copy-trading/active'] },
    });

    expect(await screen.findByText('-5.00%')).toBeInTheDocument();
  });

  it('loads server-owned relationships and requires a reason before idempotent stop', async () => {
    let stopBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | null | undefined;
    server.use(
      http.get('*/trading/copy/relationships', () => HttpResponse.json({ items: [relationship] })),
      http.post('*/trading/copy/relationships/copy-relationship-1/stop', async ({ request }) => {
        stopBody = (await request.json()) as Record<string, unknown>;
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ ...relationship, status: 'stopped' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActiveCopiesContractPage />, {
      routerProps: { initialEntries: ['/trade/copy-trading/active'] },
    });

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    const reason = screen.getByRole('textbox', { name: 'Lý do dừng Provider One' });
    const stop = screen.getByRole('button', { name: 'Dừng' });
    expect(stop).toBeDisabled();

    await user.type(reason, 'Reduce exposure');
    expect(stop).toBeEnabled();
    await user.click(stop);

    await waitFor(() =>
      expect(stopBody).toEqual({ reason: 'Reduce exposure', closeOpenPositions: true }),
    );
    expect(idempotencyKey).toBeTruthy();
  });

  it('reuses the stop idempotency key after a transient failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('*/trading/copy/relationships', () => HttpResponse.json({ items: [relationship] })),
      http.post('*/trading/copy/relationships/copy-relationship-1/stop', ({ request }) => {
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        attempts += 1;
        if (attempts === 1)
          return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
        return HttpResponse.json({ ...relationship, status: 'stopped' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActiveCopiesContractPage />, {
      routerProps: { initialEntries: ['/trade/copy-trading/active'] },
    });

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Lý do dừng Provider One' }),
      'Reduce exposure',
    );
    const stop = screen.getByRole('button', { name: 'Dừng' });
    await user.click(stop);
    await waitFor(() => expect(idempotencyKeys).toHaveLength(1));
    await user.click(stop);

    await waitFor(() => expect(idempotencyKeys).toHaveLength(2));
    expect(idempotencyKeys[0]).toMatch(/^stop-copy-relationship-1-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('keeps relationships readable but blocks stopping without trading write permission', async () => {
    let stopRequestCount = 0;
    server.use(
      http.get('*/trading/copy/relationships', () => HttpResponse.json({ items: [relationship] })),
      http.post('*/trading/copy/relationships/copy-relationship-1/stop', () => {
        stopRequestCount += 1;
        return HttpResponse.json({ ...relationship, status: 'stopped' });
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

    renderWithProviders(<ActiveCopiesContractPage />, {
      routerProps: { initialEntries: ['/trade/copy-trading/active'] },
      authAdapter: readOnlyAdapter,
    });

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Lý do dừng Provider One' }),
      'Reduce exposure',
    );

    expect(screen.getByRole('button', { name: 'Dừng' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Cần quyền giao dịch');
    expect(stopRequestCount).toBe(0);
  });
});
