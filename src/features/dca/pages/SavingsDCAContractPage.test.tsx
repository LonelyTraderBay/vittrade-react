import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { DCASnapshot } from '../model/dca-types';
import { SavingsDCAContractPage } from './SavingsDCAContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const snapshot: DCASnapshot = {
  overview: {
    currentValue: 1_050_000,
    totalInvested: 1_000_000,
    profitLoss: 50_000,
    profitLossPercent: 5,
    activePlans: 1,
    pausedPlans: 0,
    errorPlans: 0,
    nextExecution: { relativeTime: 'tomorrow', amount: 100_000 },
  },
  plans: [
    {
      id: 'plan-1',
      coinSymbol: 'BTC',
      coinName: 'Bitcoin',
      coinIcon: '₿',
      frequency: 'weekly',
      amountPerPurchase: 100_000,
      nextExecution: new Date('2026-09-24T10:00:00.000Z'),
      status: 'active',
      totalInvested: 1_000_000,
      currentHoldings: 0.01,
      averageCost: 100_000_000,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
    },
  ],
  purchaseHistory: [],
  portfolioHistory: [],
};

function renderDCA(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(<SavingsDCAContractPage />, { authAdapter });
}

describe('Savings DCA contract page', () => {
  it('creates a plan through the typed API with an idempotency key', async () => {
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.post('*/dca/plans', async ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key');
        expect(await request.json()).toEqual({
          coinSymbol: 'BTC',
          frequency: 'weekly',
          amountPerPurchase: 250_000,
        });
        return HttpResponse.json(serializeSnapshot(snapshot).plans[0], { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderDCA();
    await screen.findByText(/Bitcoin/);
    await user.type(screen.getByRole('spinbutton', { name: 'DCA amount' }), '250000');
    await user.click(screen.getByRole('button', { name: 'Create DCA plan' }));
    expect(idempotencyKey).toMatch(/^dca-create-/);
  });

  it('updates a plan through the typed API with an idempotency key', async () => {
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.patch('*/dca/plans/plan-1', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ status: 'paused' });
        return HttpResponse.json(serializeSnapshot(snapshot).plans[0]);
      }),
    );

    const user = userEvent.setup();
    renderDCA();
    expect(await screen.findByText(/Bitcoin/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
  });

  it('keeps the same create idempotency key when the user retries after a server error', async () => {
    let attempts = 0;
    const keys: string[] = [];
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.post('*/dca/plans', ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'DCA service unavailable' }, { status: 503 })
          : HttpResponse.json(serializeSnapshot(snapshot).plans[0], { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderDCA();
    await user.type(await screen.findByRole('spinbutton', { name: 'DCA amount' }), '250000');
    await user.click(screen.getByRole('button', { name: 'Create DCA plan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create the DCA plan.');
    await user.click(screen.getByRole('button', { name: 'Create DCA plan' }));

    await waitFor(() => expect(attempts).toBe(2));
    expect(keys[0]).toMatch(/^dca-create-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('asks for confirmation before cancelling a recurring plan', async () => {
    let cancelRequests = 0;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.delete('*/dca/plans/plan-1', () => {
        cancelRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { name: 'Hủy kế hoạch DCA?' })).toBeVisible();
    expect(cancelRequests).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Xác nhận hủy' }));
    await waitFor(() => expect(cancelRequests).toBe(1));
  });

  it('reuses the cancel idempotency key when retrying an unsuccessful cancellation', async () => {
    let attempts = 0;
    const keys: string[] = [];
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.delete('*/dca/plans/plan-1', ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Cancellation unavailable' }, { status: 503 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Xác nhận hủy' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to cancel the DCA plan.');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Xác nhận hủy' }));
    await waitFor(() => expect(attempts).toBe(2));
    expect(keys[0]).toMatch(/^dca-cancel-plan-1-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('reuses the pause idempotency key after a failed status update', async () => {
    let attempts = 0;
    const keys: string[] = [];
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.patch('*/dca/plans/plan-1', ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Plan update unavailable' }, { status: 503 })
          : HttpResponse.json(serializeSnapshot(snapshot).plans[0]);
      }),
    );
    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to update the DCA plan.');
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    await waitFor(() => expect(attempts).toBe(2));
    expect(keys[0]).toMatch(/^dca-update-plan-1-paused-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('keeps plan mutations disabled for read-only users', async () => {
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))));

    renderDCA({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['dca:read'] },
      },
    });

    expect(await screen.findByText(/Bitcoin/)).toBeInTheDocument();
    expect(
      screen.getByText('DCA write permission is required to change scheduled investment plans.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});

function serializeSnapshot(value: DCASnapshot) {
  return {
    ...value,
    plans: value.plans.map((plan) => ({
      ...plan,
      nextExecution: plan.nextExecution.toISOString(),
      createdAt: plan.createdAt.toISOString(),
    })),
    purchaseHistory: value.purchaseHistory.map((item) => ({
      ...item,
      date: item.date.toISOString(),
    })),
    portfolioHistory: value.portfolioHistory.map((item) => ({
      ...item,
      date: item.date.toISOString(),
    })),
  };
}
