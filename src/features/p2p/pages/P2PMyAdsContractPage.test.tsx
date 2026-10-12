import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { P2PMyAdsContractPage } from './P2PMyAdsContractPage';
import { runOwnedAdDelete, runOwnedAdStatusUpdate } from '../model/p2p-my-ads-actions';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function LocationProbe() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

const activeAd = {
  id: 'ad-active',
  type: 'sell' as const,
  asset: 'USDT',
  merchant: 'My merchant',
  merchantId: 'me',
  merchantLevel: 2,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 20,
  totalVolume30d: 100_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed' as const,
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Vietcombank'],
  avgResponseTime: '1m',
  isOnline: true,
  createdAt: '2026-09-22',
  status: 'active' as const,
};

const pausedAd = { ...activeAd, id: 'ad-paused', status: 'paused' as const };

describe('P2P my ads contract page', () => {
  it('loads owned ads, filters them and pauses an active ad with idempotency', async () => {
    let statusBody: unknown;
    server.use(
      http.get('*/p2p/ads', ({ request }) => {
        expect(new URL(request.url).searchParams.get('mine')).toBe('true');
        return HttpResponse.json({ items: [activeAd, pausedAd] });
      }),
      http.patch('*/p2p/ads/ad-active', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-status-ad-active-/);
        statusBody = await request.json();
        return HttpResponse.json({ ...activeAd, status: 'paused' }, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PMyAdsContractPage />);
    expect(await screen.findAllByText('BÁN USDT/VND')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /Hoạt động \(1\)/ }));
    expect(await screen.findAllByText('BÁN USDT/VND')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Pause ad-active' }));

    await vi.waitFor(() => {
      expect(statusBody).toEqual({ status: 'paused' });
    });
  });

  it('shows API errors and supports retry', async () => {
    const user = userEvent.setup();
    let requests = 0;
    let shouldFail = true;
    server.use(
      http.get('*/p2p/ads', () => {
        requests += 1;
        return shouldFail ? HttpResponse.error() : HttpResponse.json({ items: [activeAd] });
      }),
    );
    renderWithProviders(<P2PMyAdsContractPage />);
    expect(await screen.findByText('Không thể tải quảng cáo')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /retry|thử lại/i });
    expect(retry).toBeInTheDocument();
    shouldFail = false;
    await user.click(retry);
    expect(await screen.findAllByText('BÁN USDT/VND')).toHaveLength(1);
    expect(requests).toBeGreaterThan(3);
  });

  it('refreshes owned ads after a successful delete', async () => {
    let deleted = false;
    let deleteIdempotencyKey: string | null = null;
    let listRequests = 0;
    server.use(
      http.get('*/p2p/ads', () => {
        listRequests += 1;
        return HttpResponse.json({ items: deleted ? [] : [activeAd] });
      }),
      http.delete('*/p2p/ads/ad-active', ({ request }) => {
        deleteIdempotencyKey = request.headers.get('Idempotency-Key');
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PMyAdsContractPage />);
    await screen.findByRole('button', { name: 'Delete ad-active' });
    const requestsBeforeDelete = listRequests;

    await user.click(screen.getByRole('button', { name: 'Delete ad-active' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));

    expect(await screen.findByText('Không có quảng cáo trong bộ lọc này.')).toBeInTheDocument();
    expect(listRequests).toBeGreaterThan(requestsBeforeDelete);
    expect(deleteIdempotencyKey).toMatch(/^p2p-ad-delete-ad-active-/);
  });

  it('routes both create entry points to the P2P create page', async () => {
    server.use(http.get('*/p2p/ads', () => HttpResponse.json({ items: [] })));
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <P2PMyAdsContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p/ads/mine'] } },
    );

    await user.click(await screen.findByRole('button', { name: 'Create P2P ad' }));
    expect(await screen.findByTestId('current-path')).toHaveTextContent('/w/p2p/create');
    await user.click(screen.getByRole('button', { name: /qu/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/p2p/create');
  });

  it('resumes a paused buy ad and opens its detail page', async () => {
    const pausedBuyAd = {
      ...activeAd,
      id: 'ad-buy-paused',
      type: 'buy' as const,
      asset: 'BTC',
      status: 'paused' as const,
    };
    let currentStatus: 'paused' | 'active' = 'paused';
    let statusBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/p2p/ads', () =>
        HttpResponse.json({ items: [{ ...pausedBuyAd, status: currentStatus }] }),
      ),
      http.patch('*/p2p/ads/ad-buy-paused', async ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key');
        statusBody = await request.json();
        currentStatus = 'active';
        return HttpResponse.json({ ...pausedBuyAd, status: currentStatus });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <P2PMyAdsContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p/ads/mine'] } },
    );

    await user.click(await screen.findByRole('button', { name: /MUA BTC\/VND/ }));
    await user.click(screen.getByRole('button', { name: 'Resume ad-buy-paused' }));
    await vi.waitFor(() => expect(statusBody).toEqual({ status: 'active' }));
    expect(idempotencyKey).toMatch(/^p2p-ad-status-ad-buy-paused-/);
    await screen.findByRole('button', { name: 'Pause ad-buy-paused' });
    await user.click(screen.getByRole('button', { name: /MUA BTC\/VND/ }));
    expect(await screen.findByTestId('current-path')).toHaveTextContent('/w/p2p/ad/ad-buy-paused');
  });

  it('keeps mutation handler permission guards effective when called directly', async () => {
    const statusMutation = {
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as Parameters<typeof runOwnedAdStatusUpdate>[2];
    const deleteMutation = {
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as Parameters<typeof runOwnedAdDelete>[2];
    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    await runOwnedAdStatusUpdate(false, activeAd, statusMutation, onStart, onFailure);
    await runOwnedAdDelete(false, 'ad-active', deleteMutation, onStart, onSuccess, onFailure);

    expect(statusMutation.mutateAsync).not.toHaveBeenCalled();
    expect(deleteMutation.mutateAsync).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('keeps ad actions disabled for a read-only user', async () => {
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    };
    let patchRequests = 0;
    let deleteRequests = 0;
    server.use(
      http.get('*/p2p/ads', () =>
        HttpResponse.json({
          items: [activeAd, { ...activeAd, id: 'ad-expired', status: 'expired' }],
        }),
      ),
      http.patch('*/p2p/ads/ad-active', () => {
        patchRequests += 1;
        return HttpResponse.json(activeAd);
      }),
      http.delete('*/p2p/ads/ad-active', () => {
        deleteRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<P2PMyAdsContractPage />, { authAdapter: readOnlyAdapter });

    expect(
      await screen.findByText('P2P ad write permission is required to manage advertisements.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create P2P ad' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pause ad-active' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Pause ad-expired' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause ad-active' }));
    await user.click(screen.getByRole('button', { name: 'Delete ad-active' }));
    expect(patchRequests).toBe(0);
    expect(deleteRequests).toBe(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a useful empty state when the account has no ads', async () => {
    server.use(http.get('*/p2p/ads', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<P2PMyAdsContractPage />);

    expect(await screen.findByText('Không có quảng cáo trong bộ lọc này.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng quảng cáo đầu tiên' })).toBeEnabled();
    expect(screen.getByText('Tất cả (0)')).toBeInTheDocument();
  });

  it('surfaces toggle and delete failures and allows cancelling the delete dialog', async () => {
    let deleteRequests = 0;
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json({ items: [activeAd] })),
      http.patch('*/p2p/ads/ad-active', () => HttpResponse.error()),
      http.delete('*/p2p/ads/ad-active', () => {
        deleteRequests += 1;
        return HttpResponse.error();
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PMyAdsContractPage />);
    await screen.findByRole('button', { name: 'Pause ad-active' });

    await user.click(screen.getByRole('button', { name: 'Pause ad-active' }));
    expect(await screen.findByText('Không thể cập nhật trạng thái quảng cáo.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete ad-active' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Xóa quảng cáo?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteRequests).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Delete ad-active' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));
    expect(await screen.findByText('Không thể xóa quảng cáo.')).toBeInTheDocument();
    expect(deleteRequests).toBe(1);
  });
});
