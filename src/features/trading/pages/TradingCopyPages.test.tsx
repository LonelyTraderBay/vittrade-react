import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { CopyTradingPage } from './CopyTradingPage';
import { CopyProviderDetailContractPage } from './CopyProviderDetailContractPage';
import { PreCopyAssessmentContractPage } from './PreCopyAssessmentContractPage';
import { CopyConfigurationContractPage } from './CopyConfigurationContractPage';
import { CopyConfirmationContractPage } from './CopyConfirmationContractPage';
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

const profile = {
  provider,
  pnlHistory: [{ day: '2026-09-01', pnl: 100, cumPnl: 100 }],
  recentTrades: [
    {
      id: 'trade-1',
      pair: 'BTC/USDT',
      side: 'long' as const,
      entry: 65_000,
      pnl: 100,
      pnlPct: 1.5,
      time: '2026-09-22T10:00:00.000Z',
      status: 'closed' as const,
    },
  ],
};

function mockProviderProfile() {
  server.use(http.get('*/trading/copy/providers/:providerId', () => HttpResponse.json(profile)));
}

function renderRoute(path: string, element: React.ReactNode, additionalRoutes = <></>) {
  return renderWithProviders(
    <Routes>
      <Route path={path} element={element} />
      {additionalRoutes}
    </Routes>,
    { routerProps: { initialEntries: [path.replace(':providerId', provider.id)] } },
  );
}

describe('contract-backed copy trading pages', () => {
  it('loads providers from the API and applies server-side sorting', async () => {
    const receivedSorts: string[] = [];
    server.use(
      http.get('*/trading/copy/providers', ({ request }) => {
        receivedSorts.push(new URL(request.url).searchParams.get('sort') ?? '');
        return HttpResponse.json({ items: [provider] });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CopyTradingPage />);

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ổn định nhất' }));
    await waitFor(() => expect(receivedSorts).toContain('sharpe'));
    expect(screen.getByText('Rủi ro: Trung bình')).toBeInTheDocument();
  });

  it('shows the shared retry state when provider data is unavailable', async () => {
    server.use(
      http.get('*/trading/copy/providers', () =>
        HttpResponse.json({ code: 'PROVIDERS_UNAVAILABLE' }, { status: 503 }),
      ),
    );
    renderWithProviders(<CopyTradingPage />);

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    expect(screen.queryByText('Provider One')).not.toBeInTheDocument();
  });

  it('shows the provider profile and links to the required risk assessment', async () => {
    mockProviderProfile();
    renderRoute(
      '/trade/copy-provider/:providerId',
      <CopyProviderDetailContractPage />,
      <Route path="/trade/copy-provider/provider-1/assessment" element={<p>assessment-route</p>} />,
    );

    expect(await screen.findByRole('heading', { name: 'Provider One' })).toBeInTheDocument();
    expect(screen.getByText('1 điểm hiệu suất · 1 giao dịch gần đây · swing')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Đánh giá trước khi copy/ }));
    expect(await screen.findByText('assessment-route')).toBeInTheDocument();
  });

  it.each([
    ['provider detail', '/trade/copy-provider/:providerId', <CopyProviderDetailContractPage />],
    [
      'risk assessment',
      '/trade/copy-provider/:providerId/assessment',
      <PreCopyAssessmentContractPage />,
    ],
    [
      'configuration',
      '/trade/copy-provider/:providerId/configuration',
      <CopyConfigurationContractPage />,
    ],
    [
      'confirmation',
      '/trade/copy-provider/:providerId/confirmation',
      <CopyConfirmationContractPage />,
    ],
  ])('shows retry when the %s contract cannot load', async (_name, path, element) => {
    server.use(
      http.get('*/trading/copy/providers/:providerId', () =>
        HttpResponse.json({ code: 'COPY_PROVIDER_UNAVAILABLE' }, { status: 503 }),
      ),
    );
    renderRoute(path, element);

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('requires all assessment acknowledgements before continuing', async () => {
    mockProviderProfile();
    renderRoute('/trade/copy-provider/:providerId/assessment', <PreCopyAssessmentContractPage />);

    expect(await screen.findByText('Xác nhận hiểu rủi ro')).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Tiếp tục cấu hình' });
    expect(next).toBeDisabled();
    for (const checkbox of await screen.findAllByRole('checkbox')) await userEvent.click(checkbox);
    expect(next).toBeEnabled();
  });

  it('validates capital and previews the configured copy amount', async () => {
    mockProviderProfile();
    renderRoute(
      '/trade/copy-provider/:providerId/configuration',
      <CopyConfigurationContractPage />,
      <Route
        path="/trade/copy-provider/provider-1/confirmation"
        element={<p>confirmation-route</p>}
      />,
    );

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    const capital = screen.getByRole('spinbutton', { name: 'Số vốn copy (USD)' });
    const next = screen.getByRole('button', { name: 'Xem xác nhận' });
    await userEvent.clear(capital);
    await userEvent.type(capital, '0');
    expect(next).toBeDisabled();
    await userEvent.clear(capital);
    await userEvent.type(capital, '2500');
    expect(screen.getByText('Ước tính lệnh của bạn: $1,250')).toBeInTheDocument();
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(await screen.findByText('confirmation-route')).toBeInTheDocument();
  });

  it('carries an optional stop-loss into the confirmation summary', async () => {
    mockProviderProfile();
    renderWithProviders(
      <Routes>
        <Route
          path="/trade/copy-provider/:providerId/configuration"
          element={<CopyConfigurationContractPage />}
        />
        <Route
          path="/trade/copy-provider/:providerId/confirmation"
          element={<CopyConfirmationContractPage />}
        />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/copy-provider/provider-1/configuration'] } },
    );

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Stop-loss riêng (%)' }), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Xem xác nhận' }));

    expect(await screen.findByText('-5%')).toBeInTheDocument();
  });

  it('submits confirmation only after all consents and sends an idempotency key', async () => {
    mockProviderProfile();
    let activationBody: Record<string, unknown> | undefined;
    let activationKey: string | null | undefined;
    server.use(
      http.post('*/trading/copy/relationships', async ({ request }) => {
        activationBody = (await request.json()) as Record<string, unknown>;
        activationKey = request.headers.get('Idempotency-Key');
        await new Promise((resolve) => setTimeout(resolve, 40));
        return HttpResponse.json({ copyId: 'relationship-1', status: 'active' }, { status: 201 });
      }),
    );

    renderRoute(
      '/trade/copy-provider/:providerId/confirmation',
      <CopyConfirmationContractPage />,
      <Route path="/trade/copy-trading/active" element={<p>active-copy-route</p>} />,
    );

    expect(await screen.findByRole('heading', { name: 'Xác nhận bắt buộc' })).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' });
    expect(confirm).toBeDisabled();
    for (const checkbox of await screen.findAllByRole('checkbox')) await userEvent.click(checkbox);
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    expect(await screen.findByText('active-copy-route')).toBeInTheDocument();
    expect(activationBody).toEqual({
      providerId: 'provider-1',
      capital: 5_000,
      copyMode: 'mirror',
      positionSizing: 'percentage',
      copyRatio: 50,
    });
    expect(activationKey).toBeTruthy();
  });

  it('keeps the confirmation available after a rejected activation so the user can retry', async () => {
    mockProviderProfile();
    let attempts = 0;
    server.use(
      http.post('*/trading/copy/relationships', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ code: 'POLICY_REVIEW_REQUIRED' }, { status: 409 })
          : HttpResponse.json({ copyId: 'relationship-1', status: 'active' }, { status: 201 });
      }),
    );

    renderRoute(
      '/trade/copy-provider/:providerId/confirmation',
      <CopyConfirmationContractPage />,
      <Route path="/trade/copy-trading/active" element={<p>active-copy-route</p>} />,
    );

    expect(await screen.findByRole('heading', { name: 'Xác nhận bắt buộc' })).toBeInTheDocument();
    for (const checkbox of await screen.findAllByRole('checkbox')) await userEvent.click(checkbox);
    const confirm = screen.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' });
    await userEvent.click(confirm);
    expect(
      await screen.findByText('Không thể kích hoạt copy. Vui lòng thử lại.'),
    ).toBeInTheDocument();

    await userEvent.click(confirm);
    expect(await screen.findByText('active-copy-route')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('renders an empty active-copy state when the API has no relationships', async () => {
    server.use(http.get('*/trading/copy/relationships', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<ActiveCopiesContractPage />);

    expect(await screen.findByText('Chưa có copy relationship nào.')).toBeInTheDocument();
  });

  it('shows retry when the active-copy contract cannot load', async () => {
    server.use(
      http.get('*/trading/copy/relationships', () =>
        HttpResponse.json({ code: 'COPY_RELATIONSHIPS_UNAVAILABLE' }, { status: 503 }),
      ),
    );
    renderWithProviders(<ActiveCopiesContractPage />);

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
