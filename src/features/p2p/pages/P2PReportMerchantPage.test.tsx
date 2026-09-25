import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { P2PMerchantProfileResponse } from '../model/p2p-types';
import { P2PReportMerchantPage } from './P2PReportMerchantPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const profile: P2PMerchantProfileResponse = {
  merchant: {
    id: 'merchant-1',
    name: 'Merchant One',
    level: 3,
    kycVerified: true,
    joinDate: '2025-01-01',
    totalTrades: 100,
    totalTrades30d: 20,
    completionRate: 98,
    avgReleaseTime: '2m',
    avgPayTime: '1m',
    totalVolume30d: 10_000,
    isOnline: true,
    lastActive: 'now',
    positiveRate: 99,
    negativeCount: 1,
    activeAds: 2,
  },
  ads: [],
  reviews: [],
};

describe('P2P merchant report contract page', () => {
  it('submits a selected reason and detail with an idempotency key', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/reports/merchants', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-report-merchant-1-/);
        expect(await request.json()).toEqual({
          merchantId: 'merchant-1',
          reason: 'fake_payment',
          detail: 'Receipt is not valid',
        });
        return HttpResponse.json(
          { reportId: 'report-1', status: 'submitted', createdAt: '2026-09-22' },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/report/:merchantId" element={<P2PReportMerchantPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/report/merchant-1'] },
      },
    );
    await screen.findByText('Merchant One');
    await user.click(screen.getByRole('button', { name: 'Report reason: fake_payment' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Report details' }),
      'Receipt is not valid',
    );
    await user.click(screen.getByRole('button', { name: 'Submit P2P merchant report' }));
  });

  it('keeps merchant report submission disabled for read-only users', async () => {
    server.use(http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)));

    renderReport({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    });

    await screen.findByText('Merchant One');
    expect(
      screen.getByText('P2P report permission is required to submit a merchant report.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit P2P merchant report' })).toBeDisabled();
  });

  it('contains report failures without losing the selected reason', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/reports/merchants', () =>
        HttpResponse.json({ code: 'P2P_REPORT_FAILED' }, { status: 422 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/report/:merchantId" element={<P2PReportMerchantPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/report/merchant-1'] },
      },
    );
    await screen.findByText('Merchant One');
    await user.click(screen.getByRole('button', { name: 'Report reason: scam' }));
    await user.click(screen.getByRole('button', { name: 'Submit P2P merchant report' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể gửi báo cáo');
    expect(screen.getByRole('button', { name: 'Report reason: scam' })).toBeInTheDocument();
  });
});

function renderReport(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/report/:merchantId" element={<P2PReportMerchantPage />} />
    </Routes>,
    {
      authAdapter,
      routerProps: { initialEntries: ['/p2p/report/merchant-1'] },
    },
  );
}
