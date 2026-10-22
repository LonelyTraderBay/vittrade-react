import { useEffect } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '@/test/test-utils';
import { walletQueryKeys } from '../model/wallet-queries';
import { DustConverterPage } from './DustConverterPage';

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

function ClientProbe({ capture }: { capture: (client: QueryClient) => void }) {
  const client = useQueryClient();
  useEffect(() => capture(client), [capture, client]);
  return null;
}

function renderDust() {
  let client!: QueryClient;
  renderWithProviders(
    <>
      <ClientProbe
        capture={(value) => {
          client = value;
        }}
      />
      <DustConverterPage />
    </>,
  );
  return () => client;
}

describe('Dust quote and receipt rendering boundaries', () => {
  it('keeps asset selection focused on quote error and allows changing the target to recover', async () => {
    let posts = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
      ),
      http.post('*/wallet/dust-conversions', () => {
        posts++;
        return HttpResponse.json({});
      }),
    );
    renderDust();
    const user = userEvent.setup();
    await screen.findByText('DUST');
    const control = screen.getByRole('button', { name: 'Chọn tất cả' });
    control.focus();
    await user.keyboard('{Enter}');
    await screen.findByText(
      /Không thể tải (dữ liệu chuyển đổi|báo giá chuyển đổi)/,
      {},
      { timeout: 10000 },
    );
    expect(control).toHaveFocus();
    expect(screen.getByText('DUST')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chuyển đổi 1 tài sản/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /BNB/ }));
    expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
    expect(posts).toBe(0);
  });

  it('keeps the known pending receipt visible after balance refresh fails', async () => {
    let accepted = false;
    let posts = 0;
    server.use(
      http.get('*/wallet/assets', () =>
        accepted
          ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
          : HttpResponse.json(assets),
      ),
      http.get('*/wallet/dust-conversions/quote', () => HttpResponse.json(quote)),
      http.post('*/wallet/dust-conversions', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        accepted = true;
        posts++;
        return HttpResponse.json(
          {
            ...quote,
            id: 'pending-dust',
            status: 'pending',
            createdAt: '2026-10-21T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );
    const getClient = renderDust();
    const user = userEvent.setup();
    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    const open = await screen.findByRole('button', { name: /Chuyển đổi 1 tài sản/ });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    const submit = await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await waitFor(() => expect(getClient().isMutating()).toBe(0), { timeout: 10000 });
    expect(getClient().getMutationCache().getAll()[0].state.status).toBe('success');
    expect(
      screen.getByRole('dialog', { name: 'Yêu cầu chuyển đổi đang xử lý' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Yêu cầu đang chờ backend xác nhận.')).toBeInTheDocument();
    expect(screen.queryByText('Chuyển đổi thành công!')).not.toBeInTheDocument();
    expect(posts).toBe(1);
  });

  it('blocks conversion when a formerly valid quote fails while confirmation is open', async () => {
    let available = true;
    let posts = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', () =>
        available
          ? HttpResponse.json(quote)
          : HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
      ),
      http.post('*/wallet/dust-conversions', () => {
        posts++;
        return HttpResponse.json({});
      }),
    );
    const getClient = renderDust();
    const user = userEvent.setup();
    await screen.findByText('DUST');
    await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    const open = await screen.findByRole('button', { name: /Chuyển đổi 1 tài sản/ });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    const submit = await screen.findByRole('button', { name: 'Chuyển đổi sang USDT' });
    await waitFor(() => expect(submit).toBeEnabled());
    available = false;
    await act(async () => {
      await getClient().invalidateQueries({
        queryKey: walletQueryKeys.dustConversionQuote({
          sourceAssetIds: ['dust'],
          targetAsset: 'USDT',
        }),
      });
    });
    await screen.findByText(
      /Không thể tải (dữ liệu chuyển đổi|báo giá chuyển đổi)/,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByRole('dialog', { name: 'Xác nhận chuyển đổi' })).toBeInTheDocument();
    expect(submit).toBeDisabled();
    expect(screen.queryByText('Tổng giá trị')).not.toBeInTheDocument();
    await user.click(submit);
    expect(posts).toBe(0);
  });

  it('cancels a pending quote when the target changes and clears its selection', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let signal: AbortSignal | undefined;
    let posts = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/dust-conversions/quote', async ({ request }) => {
        signal = request.signal;
        await pending;
        return HttpResponse.json(quote);
      }),
      http.post('*/wallet/dust-conversions', () => {
        posts++;
        return HttpResponse.json({});
      }),
    );
    renderDust();
    const user = userEvent.setup();
    await screen.findByText('DUST');
    try {
      await user.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
      await waitFor(() => expect(signal).toBeDefined());
      await user.click(screen.getByRole('button', { name: /BNB/ }));
      await waitFor(() => expect(signal?.aborted).toBe(true));
      await act(async () => {
        release();
      });
      expect(screen.getByRole('button', { name: 'Chọn tài sản để chuyển đổi' })).toBeDisabled();
      expect(screen.queryByText('Ước tính chuyển đổi')).not.toBeInTheDocument();
      expect(posts).toBe(0);
    } finally {
      release();
    }
  });
});
