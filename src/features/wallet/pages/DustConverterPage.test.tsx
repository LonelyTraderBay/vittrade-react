import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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
    expect(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeDisabled();
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
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
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
});
