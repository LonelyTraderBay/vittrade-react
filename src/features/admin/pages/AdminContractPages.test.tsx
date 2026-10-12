import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { AdminAbTestsContractPage } from './AdminAbTestsContractPage';
import { AdminFunnelContractPage } from './AdminFunnelContractPage';
import { AdminOverviewContractPage } from './AdminOverviewContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('admin read contract pages', () => {
  it('shows pending and then the server-owned overview snapshot', async () => {
    server.use(
      http.get('*/admin/overview', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({
          activeUsers: 12_345,
          verifiedUsers: 9_876,
          grossVolume: '1,234,567.89 USDT',
          generatedAt: '2026-09-27T08:00:00.000Z',
        });
      }),
    );
    renderWithProviders(<AdminOverviewContractPage />);

    expect(screen.getByText('Đang tải dữ liệu quản trị…')).toBeVisible();
    expect(await screen.findByText('12.345')).toBeVisible();
    expect(screen.getByText('9.876')).toBeVisible();
    expect(screen.getByText('1,234,567.89 USDT')).toBeVisible();
  });

  it('keeps the overview retry action available after an API failure', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/admin/overview', () => {
        return shouldFail
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json({
              activeUsers: 10,
              verifiedUsers: 8,
              grossVolume: '100 USDT',
              generatedAt: '2026-09-27T08:00:00.000Z',
            });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminOverviewContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('100 USDT')).toBeVisible();
  });

  it.each([
    ['overview', '*/admin/overview', AdminOverviewContractPage],
    ['funnel', '*/admin/analytics/funnel', AdminFunnelContractPage],
    ['A/B tests', '*/admin/analytics/ab-tests', AdminAbTestsContractPage],
  ])('%s shows permission denial without a retry action on HTTP 403', async (_, route, Page) => {
    let requestCount = 0;
    server.use(
      http.get(route, () => {
        requestCount += 1;
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      }),
    );
    renderWithProviders(<Page />);

    expect(await screen.findByText('Không có quyền truy cập')).toBeVisible();
    expect(
      screen.getByText('Tài khoản của bạn không có quyền xem dữ liệu quản trị.'),
    ).toBeVisible();
    expect(screen.queryByText('Có lỗi xảy ra')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
    expect(requestCount).toBe(1);
  });

  it('renders funnel steps with server conversion rates', async () => {
    server.use(
      http.get('*/admin/analytics/funnel', () =>
        HttpResponse.json({
          steps: [
            { key: 'signup', count: 1_000, conversionRate: 1 },
            { key: 'verified', count: 800, conversionRate: 0.8 },
          ],
        }),
      ),
    );
    renderWithProviders(<AdminFunnelContractPage />);

    expect(await screen.findByText('Funnel analytics')).toBeVisible();
    expect(screen.getByText('1.000 users')).toBeVisible();
    expect(screen.getByText('80.0%')).toBeVisible();
  });

  it('shows the funnel loading state before the response arrives', async () => {
    server.use(
      http.get('*/admin/analytics/funnel', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ steps: [{ key: 'landing', count: 5, conversionRate: 1 }] });
      }),
    );
    renderWithProviders(<AdminFunnelContractPage />);

    expect(screen.getByText('Đang tải funnel…')).toBeVisible();
    expect(await screen.findByText('landing')).toBeVisible();
  });

  it('shows a distinct empty state when the funnel has no steps', async () => {
    server.use(http.get('*/admin/analytics/funnel', () => HttpResponse.json({ steps: [] })));
    renderWithProviders(<AdminFunnelContractPage />);

    expect(await screen.findByText('Chưa có dữ liệu funnel.')).toBeVisible();
  });

  it('keeps the funnel retry action after a server error', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/admin/analytics/funnel', () =>
        shouldFail
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json({
              steps: [{ key: 'signup', count: 10, conversionRate: 1 }],
            }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminFunnelContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('signup')).toBeVisible();
  });

  it('renders A/B test ownership, status and rollout variants', async () => {
    server.use(
      http.get('*/admin/analytics/ab-tests', () =>
        HttpResponse.json({
          tests: [
            {
              id: 'test-1',
              key: 'trade-terminal',
              status: 'running',
              owner: 'growth',
              expiresAt: '2026-10-01T00:00:00.000Z',
              variants: [
                { key: 'control', rolloutPercentage: 60 },
                { key: 'compact', rolloutPercentage: 40 },
              ],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<AdminAbTestsContractPage />);

    expect(await screen.findByText('trade-terminal')).toBeVisible();
    expect(screen.getByText('Owner: growth')).toBeVisible();
    expect(screen.getByText('running')).toBeVisible();
    expect(screen.getByText('control: 60%')).toBeVisible();
    expect(screen.getByText('compact: 40%')).toBeVisible();
  });

  it('shows the A/B tests loading state before the response arrives', async () => {
    server.use(
      http.get('*/admin/analytics/ab-tests', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ tests: [] });
      }),
    );
    renderWithProviders(<AdminAbTestsContractPage />);

    expect(screen.getByText('Đang tải A/B tests…')).toBeVisible();
    expect(await screen.findByText('Chưa có A/B test nào.')).toBeVisible();
  });

  it('shows a distinct empty state when no A/B tests exist', async () => {
    server.use(http.get('*/admin/analytics/ab-tests', () => HttpResponse.json({ tests: [] })));
    renderWithProviders(<AdminAbTestsContractPage />);

    expect(await screen.findByText('Chưa có A/B test nào.')).toBeVisible();
  });

  it('keeps the A/B tests retry action after a transport failure', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/admin/analytics/ab-tests', () =>
        shouldFail
          ? HttpResponse.error()
          : HttpResponse.json({
              tests: [
                {
                  id: 'test-1',
                  key: 'trade-terminal',
                  status: 'running',
                  owner: 'growth',
                  expiresAt: '2026-10-01T00:00:00.000Z',
                  variants: [{ key: 'control', rolloutPercentage: 100 }],
                },
              ],
            }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminAbTestsContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('trade-terminal')).toBeVisible();
  });
});
