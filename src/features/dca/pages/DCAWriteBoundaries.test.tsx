import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { ComponentProps } from 'react';
import { toast } from 'sonner';
import { SavingsDCAContractPage } from './SavingsDCAContractPage';
import { DCAMainPage, type DCAMainPageProps } from './DCAMainPage';
import type { DCACreatePlanSheet } from '../components/DCACreatePlanSheet';
import type { DCAPlanCard } from '../components/DCAPlanCard';
import { dcaApi } from '../api/dca-api';

vi.mock('../components/DCACreatePlanSheet', () => ({
  DCACreatePlanSheet: ({ onCreate }: ComponentProps<typeof DCACreatePlanSheet>) => (
    <>
      <button
        onClick={() =>
          void onCreate({ coinSymbol: 'BTC', frequency: 'weekly', amountPerPurchase: 100 })
        }
      >
        Submit 100
      </button>
      <button
        onClick={() =>
          void onCreate({ coinSymbol: 'BTC', frequency: 'weekly', amountPerPurchase: 50 })
        }
      >
        Submit 50
      </button>
    </>
  ),
}));
vi.mock('../components/DCAPlanCard', () => ({
  DCAPlanCard: ({ plan, onToggleStatus, onDelete }: ComponentProps<typeof DCAPlanCard>) => (
    <>
      <button onClick={() => void onToggleStatus?.()}>Toggle plan</button>
      <button onClick={() => onDelete?.(plan.id)}>Select delete</button>
    </>
  ),
}));
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());
const plan = {
  id: 'plan-1',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  coinIcon: '₿',
  frequency: 'weekly',
  amountPerPurchase: 100_000,
  nextExecution: '2026-09-24T10:00:00.000Z',
  status: 'active',
  totalInvested: 1_000_000,
  currentHoldings: 0.01,
  averageCost: 100_000_000,
  createdAt: '2026-09-01T10:00:00.000Z',
};
const snapshot = {
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
  plans: [plan],
  purchaseHistory: [],
  portfolioHistory: [],
};
const analytics: DCAMainPageProps['analytics'] = {
  trackEvent: vi.fn(),
  trackDeepLink: vi.fn(),
  trackPlanCreation: vi.fn(),
  trackPlanStatusChange: vi.fn(),
  trackPlanDeletion: vi.fn(),
};
const funnels: DCAMainPageProps['funnels'] = {
  trackWalletPageView: vi.fn(),
  trackWalletCreateSheetOpened: vi.fn(),
  trackAssetCreateSheetOpened: vi.fn(),
  trackPreselectedCoinUsed: vi.fn(),
};
function renderPage(main: boolean) {
  return renderWithProviders(
    main ? (
      <DCAMainPage isEnabled isDevelopment={false} analytics={analytics} funnels={funnels} />
    ) : (
      <SavingsDCAContractPage />
    ),
  );
}
async function actionButton(main: boolean, action: string) {
  if (action === 'create') {
    if (main) {
      await screen.findByRole('button', { name: 'Toggle plan' });
      return screen.getByRole('button', { name: 'Submit 100' });
    }
    await userEvent.type(await screen.findByRole('spinbutton', { name: 'DCA amount' }), '100');
    return screen.getByRole('button', { name: 'Create DCA plan' });
  }
  if (action === 'update')
    return screen.findByRole('button', { name: main ? 'Toggle plan' : 'Pause' });
  await userEvent.click(
    await screen.findByRole('button', { name: main ? 'Select delete' : 'Cancel' }),
  );
  return screen.findByRole('button', { name: main ? 'Xóa' : 'Xác nhận hủy' });
}
describe('DCA write owner boundaries', () => {
  it.each(
    [false, true].flatMap((main) =>
      ['create', 'update', 'delete'].map((action) => ({ main, action })),
    ),
  )('serializes $action owner callbacks (main=$main)', async ({ main, action }) => {
    vi.spyOn(toast, 'error');
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let posts = 0;
    const response = async () => {
      posts += 1;
      await gate;
      return HttpResponse.json({ message: 'Temporary failure' }, { status: 503 });
    };
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/dca/plans', response),
      http.patch('*/dca/plans/plan-1', response),
      http.delete('*/dca/plans/plan-1', response),
    );
    renderPage(main);
    const button = await actionButton(main, action);
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    try {
      await waitFor(() => expect(posts).toBeGreaterThan(0));
    } finally {
      release();
    }
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(posts).toBe(1);
  });
  it.each([false, true])(
    'keeps the original create key after editing and returning to a failed intent (main=%s)',
    async (main) => {
      const keys: string[] = [];
      server.use(
        http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
        http.post('*/dca/plans', ({ request }) => {
          keys.push(request.headers.get('Idempotency-Key')!);
          return HttpResponse.error();
        }),
      );
      vi.spyOn(toast, 'error');
      renderPage(main);
      const button = await actionButton(main, 'create');
      await userEvent.click(button);
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      if (main) {
        await userEvent.click(screen.getByRole('button', { name: 'Submit 50' }));
        await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
      } else {
        const amount = screen.getByRole('spinbutton', { name: 'DCA amount' });
        await userEvent.clear(amount);
        await userEvent.type(amount, '50');
        await userEvent.clear(amount);
        await userEvent.type(amount, '100');
      }
      await userEvent.click(button);
      await waitFor(() => expect(keys).toHaveLength(main ? 3 : 2));
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(main ? 3 : 2));
      expect(keys.at(-1)).toBe(keys[0]);
    },
  );
  it('freezes the contract create form while the request is pending', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/dca/plans', async () => {
        await gate;
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 503 });
      }),
    );
    renderPage(false);
    const button = await actionButton(false, 'create');
    await userEvent.click(button);
    try {
      expect(screen.getByRole('textbox', { name: 'DCA coin' })).toBeDisabled();
      expect(screen.getByRole('spinbutton', { name: 'DCA amount' })).toBeDisabled();
      expect(screen.getByRole('combobox', { name: 'DCA frequency' })).toBeDisabled();
    } finally {
      release();
    }
    await screen.findByRole('alert');
  });
  it('rejects an update receipt belonging to another plan', async () => {
    server.use(
      http.patch('*/dca/plans/plan-1', () =>
        HttpResponse.json({ ...plan, id: 'plan-2', status: 'paused' }),
      ),
    );
    await expect(
      dcaApi.updatePlan('plan-1', { status: 'paused' }, 'dca-update-key'),
    ).rejects.toThrow();
  });
  it.each([false, true])(
    'does not report a pause when the receipt is still active (main=%s)',
    async (main) => {
      vi.spyOn(toast, 'success');
      vi.spyOn(toast, 'error');
      server.use(
        http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
        http.patch('*/dca/plans/plan-1', () => HttpResponse.json(plan)),
      );
      renderPage(main);
      await userEvent.click(await actionButton(main, 'update'));
      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(toast.success).not.toHaveBeenCalled();
    },
  );
});
