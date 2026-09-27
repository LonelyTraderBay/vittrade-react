import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { DCAMainPageProps } from './DCAMainPage';
import { DCAMainPage } from './DCAMainPage';

const server = setupServer();
const analytics: DCAMainPageProps['analytics'] = {
  trackEvent: () => undefined,
  trackDeepLink: () => undefined,
  trackPlanCreation: () => undefined,
  trackPlanStatusChange: () => undefined,
  trackPlanDeletion: () => undefined,
};
const funnels: DCAMainPageProps['funnels'] = {
  trackWalletPageView: () => undefined,
  trackWalletCreateSheetOpened: () => undefined,
  trackAssetCreateSheetOpened: () => undefined,
  trackPreselectedCoinUsed: () => undefined,
};
const originalPathLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getTotalLength');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalPathLength) {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', originalPathLength);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength');
  }
});
afterAll(() => server.close());

describe('DCA portfolio chart', () => {
  it('filters the chart timeframe and suppresses P&L when fewer than two points remain', async () => {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      value: vi.fn(() => 120),
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const day = 24 * 60 * 60 * 1_000;
    const now = Date.now();
    server.use(
      http.get('*/dca/snapshot', () =>
        HttpResponse.json({
          overview: {
            currentValue: 1_500,
            totalInvested: 1_300,
            profitLoss: 200,
            profitLossPercent: 15.38,
            activePlans: 0,
            pausedPlans: 0,
            errorPlans: 0,
            nextExecution: null,
          },
          plans: [],
          purchaseHistory: [],
          portfolioHistory: [
            {
              date: new Date(now - 100 * day).toISOString(),
              portfolioValue: 1_000,
              totalInvested: 900,
              hasPurchase: true,
            },
            {
              date: new Date(now - 20 * day).toISOString(),
              portfolioValue: 1_200,
              totalInvested: 1_000,
              hasPurchase: true,
            },
            {
              date: new Date(now - 5 * day).toISOString(),
              portfolioValue: 1_500,
              totalInvested: 1_300,
              hasPurchase: true,
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <DCAMainPage isEnabled isDevelopment={false} analytics={analytics} funnels={funnels} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Xem biểu đồ chi tiết' }));
    expect(await screen.findByText('Biến động 90 ngày qua')).toBeVisible();
    expect(screen.getByText('+25,00%')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '7D' }));
    expect(screen.queryByText('Biến động 7 ngày qua')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(await screen.findByText('Biến động Toàn bộ')).toBeVisible();
    expect(screen.getByText('+50,00%')).toBeVisible();
  });
});
