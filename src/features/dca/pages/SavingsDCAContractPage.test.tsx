import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { toast } from 'sonner';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { DCASnapshot } from '../model/dca-types';
import { dcaApi } from '../api/dca-api';
import { SavingsDCAContractPage } from './SavingsDCAContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
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
    const idempotencyKeys: string[] = [];
    const toastSuccess = vi.spyOn(toast, 'success');
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.post('*/dca/plans', async ({ request }) => {
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        expect(await request.json()).toEqual({
          coinSymbol: 'ETH',
          frequency: 'daily',
          amountPerPurchase: 250_000,
        });
        return HttpResponse.json(serializeSnapshot(snapshot).plans[0], { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderDCA();
    await screen.findByText(/Bitcoin/);
    const amount = screen.getByRole('spinbutton', { name: 'DCA amount' });
    const createButton = screen.getByRole('button', { name: 'Create DCA plan' });
    expect(createButton).toBeDisabled();
    await user.type(amount, '0');
    expect(createButton).toBeDisabled();
    await user.clear(amount);
    const coin = screen.getByRole('textbox', { name: 'DCA coin' });
    await user.clear(coin);
    await user.type(coin, 'eth');
    await user.type(amount, '250000');
    await user.selectOptions(screen.getByRole('combobox', { name: 'DCA frequency' }), 'daily');
    await user.click(createButton);

    await waitFor(() => expect(idempotencyKeys).toHaveLength(1));
    expect(idempotencyKeys[0]).toMatch(/^dca-create-/);
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Đã tạo kế hoạch DCA.', { duration: 1500 }),
    );
  });

  it('updates a plan through the typed API with an idempotency key', async () => {
    const toastSuccess = vi.spyOn(toast, 'success');
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
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Đã tạm dừng kế hoạch DCA.', { duration: 1500 }),
    );
  });

  it('resumes a paused plan and reports the completed status change', async () => {
    const toastSuccess = vi.spyOn(toast, 'success');
    const pausedSnapshot: DCASnapshot = {
      ...snapshot,
      plans: snapshot.plans.map((plan) => ({ ...plan, status: 'paused' })),
    };
    let updatedStatus: unknown;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(pausedSnapshot))),
      http.patch('*/dca/plans/plan-1', async ({ request }) => {
        updatedStatus = ((await request.json()) as { status?: unknown }).status;
        return HttpResponse.json(serializeSnapshot(snapshot).plans[0]);
      }),
    );

    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Resume' }));

    await waitFor(() => expect(updatedStatus).toBe('active'));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Đã tiếp tục kế hoạch DCA.', { duration: 1500 }),
    );
  });

  it('retries loading the DCA snapshot after a contract session error', async () => {
    let requests = 0;
    server.use(
      http.get('*/dca/snapshot', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json(
              { code: 'UNAUTHENTICATED', message: 'Session expired' },
              { status: 401 },
            )
          : HttpResponse.json(serializeSnapshot(snapshot));
      }),
    );

    const user = userEvent.setup();
    renderDCA();
    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText(/Bitcoin/)).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('renders the empty state when the snapshot has no plans', async () => {
    server.use(
      http.get('*/dca/snapshot', () =>
        HttpResponse.json(serializeSnapshot({ ...snapshot, plans: [] })),
      ),
    );

    renderDCA();

    expect(await screen.findByRole('status')).toHaveTextContent('Bạn chưa có kế hoạch DCA nào.');
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
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
          ? HttpResponse.json(
              { code: 'UNAUTHENTICATED', message: 'Session expired' },
              { status: 401 },
            )
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

  it('shows the pending create state and disables duplicate submissions', async () => {
    let resolveCreate: (() => void) | undefined;
    const toastSuccess = vi.spyOn(toast, 'success');
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))),
      http.post(
        '*/dca/plans',
        () =>
          new Promise((resolve) => {
            resolveCreate = () =>
              resolve(HttpResponse.json(serializeSnapshot(snapshot).plans[0], { status: 201 }));
          }),
      ),
    );
    const user = userEvent.setup();
    renderDCA();
    await user.type(await screen.findByRole('spinbutton', { name: 'DCA amount' }), '100');
    const createButton = screen.getByRole('button', { name: 'Create DCA plan' });
    await user.click(createButton);

    expect(await screen.findByText('Creating…')).toBeInTheDocument();
    expect(createButton).toBeDisabled();
    resolveCreate?.();
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Đã tạo kế hoạch DCA.', { duration: 1500 }),
    );
  });

  it('uses the generic create error message for a non-Error rejection', async () => {
    const toastError = vi.spyOn(toast, 'error');
    vi.spyOn(dcaApi, 'createPlan').mockRejectedValue('create failure');
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))));
    const user = userEvent.setup();
    renderDCA();
    await user.type(await screen.findByRole('spinbutton', { name: 'DCA amount' }), '100');
    await user.click(screen.getByRole('button', { name: 'Create DCA plan' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Không thể tạo kế hoạch DCA.', { duration: 2000 }),
    );
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

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Hủy kế hoạch DCA?' })).toBeVisible(),
    );
    expect(cancelRequests).toBe(0);
    const confirmation = screen.getByRole('heading', { name: 'Hủy kế hoạch DCA?' });
    await user.click(screen.getByRole('button', { name: 'Giữ kế hoạch' }));
    await waitForElementToBeRemoved(confirmation);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Hủy kế hoạch DCA?' })).toBeVisible(),
    );
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
          ? HttpResponse.json({ message: 'Plan not found' }, { status: 404 })
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
          ? HttpResponse.json({ message: 'Plan not found' }, { status: 404 })
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

  it('uses the generic update error message for a non-Error rejection', async () => {
    const toastError = vi.spyOn(toast, 'error');
    vi.spyOn(dcaApi, 'updatePlan').mockRejectedValue('update failure');
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))));
    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Pause' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Không thể cập nhật kế hoạch DCA.', {
        duration: 2000,
      }),
    );
  });

  it('uses the generic cancellation error message for a non-Error rejection', async () => {
    const toastError = vi.spyOn(toast, 'error');
    vi.spyOn(dcaApi, 'deletePlan').mockRejectedValue('delete failure');
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(serializeSnapshot(snapshot))));
    const user = userEvent.setup();
    renderDCA();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Xác nhận hủy' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Không thể hủy kế hoạch DCA.', { duration: 2000 }),
    );
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
    expect(screen.getByRole('textbox', { name: 'DCA coin' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'DCA amount' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'DCA frequency' })).toBeDisabled();
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
