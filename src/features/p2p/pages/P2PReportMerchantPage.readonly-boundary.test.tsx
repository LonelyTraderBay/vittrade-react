import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { P2PMerchantProfileResponse } from '../model/p2p-types';
import { P2PReportMerchantPage } from './P2PReportMerchantPage';

vi.mock('@/shared/ui/CTAButton', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/ui/CTAButton')>();
  const ReactModule = await import('react');

  return {
    ...original,
    CTAButton: ({
      children,
      onClick,
      'aria-label': ariaLabel,
    }: {
      children: ReactNode;
      onClick: () => void;
      'aria-label'?: string;
    }) =>
      ReactModule.createElement(
        'button',
        { type: 'button', onClick, 'aria-label': ariaLabel },
        children,
      ),
  };
});

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

const readOnlyAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
  },
};

describe('P2P merchant report permission handler boundary', () => {
  it('rechecks write permission when the submit callback fires from a stale control', async () => {
    let reportWrites = 0;
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/reports/merchants', () => {
        reportWrites += 1;
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
        authAdapter: readOnlyAdapter,
      },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Report reason: scam' }));
    await user.click(screen.getByRole('button', { name: 'Submit P2P merchant report' }));

    expect(reportWrites).toBe(0);
  });
});
