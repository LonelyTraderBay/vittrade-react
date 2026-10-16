import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { DustConverterPage } from './DustConverterPage';

const server = setupServer();

const assets = {
  items: [
    {
      id: 'dust',
      symbol: 'DUST',
      name: 'Dust Asset',
      balance: 0.1,
      available: 0.1,
      frozen: 0,
      inOrder: 0,
      usdValue: 0.25,
      change24h: -1,
      logoColor: '#64748B',
    },
  ],
  summary: { totalUsd: 0.25, totalBtc: 0, availableUsd: 0.25, inOrderUsd: 0, frozenUsd: 0 },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DustConverterPage', () => {
  it('lets read-only users view balances but blocks conversion writes', async () => {
    let conversionWrites = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
      http.post('*/wallet/dust-conversions', () => {
        conversionWrites += 1;
        return HttpResponse.json({});
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['wallet:read'] },
      },
    };

    renderWithProviders(<DustConverterPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByText('DUST')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    const openConfirmButton = screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ });
    expect(openConfirmButton).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('chỉ có quyền xem');
    expect(conversionWrites).toBe(0);
  });

  it('confirms an authorized conversion with the selected assets and resets after completion', async () => {
    let conversionRequest: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
      http.post('*/wallet/dust-conversions', async ({ request }) => {
        conversionRequest = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({
          id: 'conversion-1',
          status: 'completed',
          createdAt: '2026-09-25T00:00:00.000Z',
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        });
      }),
    );

    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST');
    await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    await userEvent.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' }));

    expect(await screen.findByText('Chuyển đổi thành công!')).toBeInTheDocument();
    expect(conversionRequest).toEqual({ sourceAssetIds: ['dust'], targetAsset: 'USDT' });
    expect(idempotencyKey).toEqual(expect.any(String));

    await userEvent.click(screen.getByRole('button', { name: 'Hoàn tất' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Chuyển đổi thành công!' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    await userEvent.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' }));
    await screen.findByText('Chuyển đổi thành công!');
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Chuyển đổi thành công!' })).getByRole('button', {
        name: 'Đóng',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Chuyển đổi thành công!' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
  });

  it('clears selected dust assets when the conversion target changes', async () => {
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    expect(await screen.findByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /BNB/ }));

    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
  });

  it('retries the failed quote request when the user retries conversion data', async () => {
    let quoteRequests = 0;
    let quoteAvailable = false;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () => {
        quoteRequests += 1;
        return quoteAvailable
          ? HttpResponse.json({
              targetAsset: 'USDT',
              grossUsd: 0.25,
              feePct: 1,
              feeUsd: 0.0025,
              receivedUsd: 0.2475,
              targetAmount: 0.2475,
            })
          : HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    const retry = await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 10_000 });
    expect(quoteRequests).toBe(3);
    quoteAvailable = true;
    await user.click(retry);

    expect(await screen.findByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeEnabled();
    expect(quoteRequests).toBe(4);
  });

  it('reuses the idempotency key when retrying the same conversion after a transient failure', async () => {
    const idempotencyKeys: string[] = [];
    let requests = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
      http.post('*/wallet/dust-conversions', ({ request }) => {
        requests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (requests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({
          id: 'conversion-retry-1',
          status: 'completed',
          createdAt: '2026-09-25T00:00:00.000Z',
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        });
      }),
    );

    renderWithProviders(<DustConverterPage />);
    const user = userEvent.setup();
    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    await user.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
    const submitButton = await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' });
    await user.click(submitButton);
    await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' });
    await user.click(submitButton);

    expect(await screen.findByText('Chuyển đổi thành công!')).toBeInTheDocument();
    expect(requests).toBe(2);
    expect(idempotencyKeys[0]).toEqual(expect.any(String));
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('blocks all wallet requests when read permission is missing', async () => {
    let assetRequests = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        assetRequests += 1;
        return HttpResponse.json(assets);
      }),
    );
    const noReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<DustConverterPage />, { authAdapter: noReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet read permission is required',
    );
    expect(assetRequests).toBe(0);
  });

  it('shows the loading state while wallet balances are still being fetched', async () => {
    let resolveAssets!: (response: Response) => void;
    const pendingAssets = new Promise<Response>((resolve) => {
      resolveAssets = resolve;
    });
    server.use(
      http.get('*/wallet/assets', () => pendingAssets),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0,
          feePct: 1,
          feeUsd: 0,
          receivedUsd: 0,
          targetAmount: 0,
        }),
      ),
    );

    renderWithProviders(<DustConverterPage />);
    expect(screen.getByText('Đang tải số dư ví…')).toBeInTheDocument();
    await act(async () => resolveAssets(HttpResponse.json(assets)));
    expect(await screen.findByText('DUST')).toBeInTheDocument();
  });

  it('filters balances at the threshold, zero value, unavailable amount, and current target', async () => {
    const boundaryAssets = {
      ...assets,
      items: [
        assets.items[0],
        { ...assets.items[0], id: 'at-threshold', symbol: 'TEN', usdValue: 10 },
        { ...assets.items[0], id: 'zero-value', symbol: 'ZERO', usdValue: 0 },
        { ...assets.items[0], id: 'current-target', symbol: 'USDT', usdValue: 0.5 },
        { ...assets.items[0], id: 'unavailable', symbol: 'LOCKED', available: 0, usdValue: 0.5 },
      ],
    };
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(boundaryAssets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    expect(await screen.findByText('DUST')).toBeInTheDocument();
    expect(screen.queryByText('TEN')).not.toBeInTheDocument();
    expect(screen.queryByText('ZERO')).not.toBeInTheDocument();
    expect(screen.getAllByText('USDT', { selector: 'p' })).toHaveLength(1);
    expect(screen.queryByText('LOCKED')).not.toBeInTheDocument();
    expect(screen.getByText('Dust tìm thấy').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Dust tìm thấy').previousElementSibling).toHaveStyle({
      color: 'var(--tr-text-1)',
    });

    await user.click(screen.getByRole('button', { name: /BNB/ }));
    expect(screen.getAllByText('USDT', { selector: 'p' })).toHaveLength(2);
    expect(screen.getByText('Dust tìm thấy').previousElementSibling).toHaveTextContent('2');
  });

  it('toggles individual and all-asset selection and summarizes more than four selected assets', async () => {
    const multipleDust = {
      ...assets,
      items: Array.from({ length: 5 }, (_, index) => ({
        ...assets.items[0],
        id: `dust-${index + 1}`,
        symbol: `DUST${index + 1}`,
        name: `Dust Asset ${index + 1}`,
        usdValue: 0.25,
      })),
    };
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(multipleDust)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 1.25,
          feePct: 1,
          feeUsd: 0.0125,
          receivedUsd: 1.2375,
          targetAmount: 1.2375,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST1');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    expect(screen.getByText('5 tài sản')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bỏ chọn tất cả' }));
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /DUST1/ }));
    expect(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /DUST1/ }));
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
  });

  it('retries a failed asset request without requiring the quote request to fail', async () => {
    let assetsAvailable = false;
    server.use(
      http.get('*/wallet/assets', () =>
        assetsAvailable
          ? HttpResponse.json(assets)
          : HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 }),
      ),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0,
          feePct: 1,
          feeUsd: 0,
          receivedUsd: 0,
          targetAmount: 0,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    expect(await screen.findByText('Không thể tải dữ liệu chuyển đổi')).toBeInTheDocument();
    assetsAvailable = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('DUST')).toBeInTheDocument();
  });

  it('shows the clean-wallet state when no asset meets the dust criteria', async () => {
    const noDustAssets = {
      ...assets,
      items: [
        { ...assets.items[0], id: 'above-limit', symbol: 'TEN', usdValue: 10 },
        { ...assets.items[0], id: 'target', symbol: 'USDT', usdValue: 0.5 },
      ],
    };
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(noDustAssets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0,
          feePct: 1,
          feeUsd: 0,
          receivedUsd: 0,
          targetAmount: 0,
        }),
      ),
    );

    renderWithProviders(<DustConverterPage />);

    expect(await screen.findByText('Không có số dư nhỏ nào')).toBeInTheDocument();
    expect(screen.getByText('Ví sạch! Không có dust cần dọn dẹp.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
  });

  it('closes the confirmation sheet without submitting a conversion', async () => {
    let conversionWrites = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
      http.post('*/wallet/dust-conversions', () => {
        conversionWrites += 1;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    await user.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
    expect(await screen.findByText('Xác nhận chuyển đổi')).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('dialog', { name: 'Xác nhận chuyển đổi' })).getByRole('button', {
        name: 'Đóng',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Xác nhận chuyển đổi' })).not.toBeInTheDocument(),
    );
    expect(conversionWrites).toBe(0);
  });

  it('ignores a second conversion request while the first request is pending', async () => {
    let resolveConversion!: (response: Response) => void;
    let writes = 0;
    const pendingConversion = new Promise<Response>((resolve) => {
      resolveConversion = resolve;
    });
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
      http.post('*/wallet/dust-conversions', () => {
        writes += 1;
        return pendingConversion;
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DustConverterPage />);

    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    await user.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
    await user.click(await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' }));
    const pendingButton = await screen.findByRole('button', { name: 'Đang chuyển đổi...' });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(writes).toBe(1);

    await act(async () =>
      resolveConversion(
        HttpResponse.json({
          id: 'conversion-pending-1',
          status: 'completed',
          createdAt: '2026-10-09T00:00:00.000Z',
          targetAsset: 'USDT',
          grossUsd: 0.25,
          feePct: 1,
          feeUsd: 0.0025,
          receivedUsd: 0.2475,
          targetAmount: 0.2475,
        }),
      ),
    );
    expect(await screen.findByText('Chuyển đổi thành công!')).toBeInTheDocument();
  });
});
