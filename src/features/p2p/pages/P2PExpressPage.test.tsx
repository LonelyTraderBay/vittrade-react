import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAd, P2PPaymentMethod } from '../model/p2p-types';
import { P2PExpressPage } from './P2PExpressPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const baseAd: P2PAd = {
  id: 'ad-default',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Merchant',
  merchantId: 'merchant-id',
  merchantLevel: 2,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 120,
  totalVolume30d: 50_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 20_000_000,
  available: 2_000,
  paymentMethods: ['VCB'],
  avgResponseTime: '2m',
  isOnline: true,
  createdAt: '2026-09-23T00:00:00.000Z',
  status: 'active',
};

const verifiedPayment: P2PPaymentMethod = {
  id: 'payment-1',
  type: 'bank',
  bankName: 'VCB',
  accountNumber: '123456789',
  accountName: 'Test User',
  isDefault: true,
  isVerified: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

function ad(overrides: Partial<P2PAd>): P2PAd {
  return { ...baseAd, ...overrides };
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

function installPayments() {
  server.use(
    http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: [verifiedPayment] })),
  );
}

describe('P2P Express contract page', () => {
  it('selects the cheapest eligible sell offer and navigates with the selected order details', async () => {
    server.use(
      http.get('*/p2p/ads', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('asset')).toBe('USDT');
        expect(url.searchParams.get('currency')).toBe('VND');
        return HttpResponse.json({
          items: [
            ad({
              id: 'outside-limit',
              merchant: 'Outside limit',
              price: 20_000,
              minLimit: 5_000_000,
            }),
            ad({
              id: 'best-match',
              merchant: 'Best match',
              price: 25_000,
              paymentMethods: ['Momo'],
            }),
            ad({ id: 'higher-price', merchant: 'Higher price', price: 26_000 }),
            ad({ id: 'paused', merchant: 'Paused', price: 19_000, status: 'paused' }),
            ad({ id: 'buy-ad', merchant: 'Buy ad', price: 30_000, type: 'buy' }),
          ],
        });
      }),
      http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: [verifiedPayment] })),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <P2PExpressPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p/express'] } },
    );

    expect(await screen.findByText('Outside limit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mua nhanh USDT' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '1.000.000' }));
    expect(await screen.findByText('Best match')).toBeInTheDocument();
    expect(screen.queryByText('Outside limit')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'VCB' }));
    expect(await screen.findByText('Higher price')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tự chọn tốt nhất' }));
    expect(await screen.findByText('Best match')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mua nhanh USDT' }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/w/p2p/express/confirm?type=buy&asset=USDT&fiat=1000000&adId=best-match&payment=Momo',
    );

    await user.click(screen.getByRole('button', { name: 'VCB' }));
    expect(await screen.findByText('Higher price')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mua nhanh USDT' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/w/p2p/express/confirm?type=buy&asset=USDT&fiat=1000000&adId=higher-price&payment=VCB',
    );
  });

  it('uses the highest-priced buy offer when selling and applies the selected asset', async () => {
    installPayments();
    server.use(
      http.get('*/p2p/ads', ({ request }) => {
        const asset = new URL(request.url).searchParams.get('asset');
        return HttpResponse.json({
          items:
            asset === 'BTC'
              ? [
                  ad({
                    id: 'btc-low',
                    asset: 'BTC',
                    type: 'buy',
                    merchant: 'BTC buyer low',
                    price: 1_600_000_000,
                  }),
                  ad({
                    id: 'btc-best',
                    asset: 'BTC',
                    type: 'buy',
                    merchant: 'BTC buyer best',
                    price: 1_650_000_000,
                  }),
                  ad({
                    id: 'btc-sell',
                    asset: 'BTC',
                    type: 'sell',
                    merchant: 'BTC seller',
                    price: 1_700_000_000,
                  }),
                ]
              : [],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <P2PExpressPage />
        <LocationProbe />
      </>,
    );
    await user.selectOptions(await screen.findByRole('combobox'), 'BTC');
    expect(await screen.findByText('BTC seller')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'BÁN NHANH' }));

    expect(await screen.findByText('BTC buyer best')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '1.000.000' }));
    await user.click(screen.getByRole('button', { name: 'VCB' }));
    await user.click(screen.getByRole('button', { name: 'Bán nhanh BTC' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/p2p/express/confirm?type=sell&asset=BTC&fiat=1000000&adId=btc-best&payment=VCB',
    );
  });

  it('shows a shared error state and retries failed offer loading', async () => {
    installPayments();
    let retryAllowed = false;
    let requests = 0;
    server.use(
      http.get('*/p2p/ads', () => {
        requests += 1;
        return retryAllowed
          ? HttpResponse.json({ items: [ad({ merchant: 'Recovered offer' })] })
          : HttpResponse.json({ code: 'ADS_UNAVAILABLE' }, { status: 500 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PExpressPage />);
    expect(await screen.findByText('Không thể tải dữ liệu Express P2P')).toBeInTheDocument();

    retryAllowed = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Recovered offer')).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('keeps confirmation disabled when the API has no compatible offer', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json({ items: [] })),
      http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: [] })),
    );

    renderWithProviders(
      <>
        <P2PExpressPage />
        <LocationProbe />
      </>,
    );

    expect(
      await screen.findByText('Chưa tìm thấy offer phù hợp với số tiền và bộ lọc hiện tại.'),
    ).toBeInTheDocument();
    const amountInput = screen.getByPlaceholderText('0');
    await userEvent.type(amountInput, '1a2b3');
    expect(amountInput).toHaveValue('123');
    expect(screen.getByRole('button', { name: 'Mua nhanh USDT' })).toBeDisabled();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
