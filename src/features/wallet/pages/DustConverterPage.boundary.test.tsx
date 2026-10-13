import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { DustConverterPage } from './DustConverterPage';
import { walletApi } from '../api/wallet-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
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
const quote = {
  targetAsset: 'USDT',
  grossUsd: 0.25,
  feePct: 1,
  feeUsd: 0.0025,
  receivedUsd: 0.2475,
  targetAmount: 0.2475,
};
function useReadHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/dust-conversions/quote', () => HttpResponse.json(quote)),
  );
}
async function prepare() {
  renderWithProviders(<DustConverterPage />);
  await screen.findByText('DUST');
  await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
  await userEvent.click(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ }));
  return screen.findByRole('button', { name: 'Chuyển đổi sang USDT' });
}
describe('Dust conversion financial boundaries', () => {
  it('serializes same-turn confirmation callbacks', async () => {
    useReadHandlers();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let posts = 0;
    server.use(
      http.post('*/wallet/dust-conversions', async () => {
        posts += 1;
        await gate;
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 503 });
      }),
    );
    const button = await prepare();
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    try {
      await waitFor(() => expect(posts).toBeGreaterThan(0));
    } finally {
      release();
    }
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(posts).toBe(1);
  });
  it('keeps pending receipts distinct from completed conversions', async () => {
    useReadHandlers();
    server.use(
      http.post('*/wallet/dust-conversions', () =>
        HttpResponse.json({
          ...quote,
          id: 'conversion-1',
          status: 'pending',
          createdAt: '2026-09-25T00:00:00.000Z',
        }),
      ),
    );
    await userEvent.click(await prepare());
    const dialog = await screen.findByRole('dialog', { name: 'Yêu cầu chuyển đổi đang xử lý' });
    expect(within(dialog).getByText(/chờ backend xác nhận/)).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Chuyển đổi thành công!' }),
    ).not.toBeInTheDocument();
  });
  it('shows the confirmed receipt amount instead of the earlier quote', async () => {
    useReadHandlers();
    server.use(
      http.post('*/wallet/dust-conversions', () =>
        HttpResponse.json({
          ...quote,
          id: 'conversion-1',
          status: 'completed',
          targetAmount: 0.2,
          receivedUsd: 0.2,
          createdAt: '2026-09-25T00:00:00.000Z',
        }),
      ),
    );
    await userEvent.click(await prepare());
    const dialog = await screen.findByRole('dialog', { name: 'Chuyển đổi thành công!' });
    expect(within(dialog).getByText('+0.200000 USDT')).toBeInTheDocument();
    expect(within(dialog).queryByText('+0.247500 USDT')).not.toBeInTheDocument();
  });
  it('rejects a receipt for another target asset', async () => {
    server.use(
      http.post('*/wallet/dust-conversions', () =>
        HttpResponse.json({
          ...quote,
          targetAsset: 'BNB',
          id: 'conversion-1',
          status: 'completed',
          createdAt: '2026-09-25T00:00:00.000Z',
        }),
      ),
    );
    await expect(
      walletApi.createDustConversion({ sourceAssetIds: ['dust'], targetAsset: 'USDT' }, 'dust-key'),
    ).rejects.toThrow();
  });
});
