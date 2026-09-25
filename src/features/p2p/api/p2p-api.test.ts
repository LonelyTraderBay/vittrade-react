import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError } from '@/shared/api/api-error';
import type { ApiRequest } from '@/shared/api/http-client';
import { createP2PApi, p2pApi } from './p2p-api';

const server = setupServer();

const ad = {
  id: 'ad-1',
  type: 'sell' as const,
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2024-01-01',
  completionRate: 98.5,
  completedOrders: 1243,
  totalVolume30d: 850000,
  price: 25350,
  currency: 'VND',
  priceType: 'fixed' as const,
  minLimit: 500000,
  maxLimit: 50000000,
  available: 10000,
  paymentMethods: ['Vietcombank', 'Momo'],
  avgResponseTime: '2 phút',
  isOnline: true,
  createdAt: '2024-02-10T08:00:00Z',
  status: 'active' as const,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('P2P marketplace API contract', () => {
  it('loads ads with the documented filters', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/ads', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('asset')).toBe('USDT');
        expect(url.searchParams.get('currency')).toBe('VND');
        return HttpResponse.json({ items: [ad] });
      }),
    );

    await expect(p2pApi.listAds({ asset: 'USDT', currency: 'VND' })).resolves.toEqual({
      items: [ad],
    });
  });

  it('creates an ad with an idempotency key', async () => {
    server.use(
      http.post('http://localhost:3000/api/p2p/ads', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-ad-key-001');
        return HttpResponse.json({ ...ad, id: 'ad-created' }, { status: 201 });
      }),
    );

    await expect(
      p2pApi.createAd(
        {
          type: 'sell',
          asset: 'USDT',
          currency: 'VND',
          priceType: 'fixed',
          price: 25_350,
          available: 1_000,
          minLimit: 500_000,
          maxLimit: 50_000_000,
          paymentMethods: ['Vietcombank'],
        },
        'p2p-ad-key-001',
      ),
    ).resolves.toMatchObject({ id: 'ad-created', asset: 'USDT' });
  });

  it('updates and deletes an ad with idempotency protection', async () => {
    server.use(
      http.patch('http://localhost:3000/api/p2p/ads/ad-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-ad-status-001');
        return HttpResponse.json({ ...ad, status: 'paused' });
      }),
      http.delete('http://localhost:3000/api/p2p/ads/ad-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-ad-delete-001');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(
      p2pApi.updateAdStatus('ad-1', { status: 'paused' }, 'p2p-ad-status-001'),
    ).resolves.toMatchObject({ id: 'ad-1', status: 'paused' });
    await expect(p2pApi.deleteAd('ad-1', 'p2p-ad-delete-001')).resolves.toBeUndefined();
  });

  it('maps backend errors to ApiError', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/ads', () =>
        HttpResponse.json(
          { code: 'P2P_UNAVAILABLE', message: 'P2P is temporarily unavailable' },
          { status: 503, headers: { 'X-Request-ID': 'p2p-request-1' } },
        ),
      ),
    );

    const error = await p2pApi.listAds().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: 'P2P_UNAVAILABLE',
      requestId: 'p2p-request-1',
    });
  });

  it('validates the overview boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/overview', () =>
        HttpResponse.json({
          userLevel: {
            currentLevel: 2,
            completedOrders: 10,
            accumulatedVolume: 1000000,
            dailyUsed: 100000,
            dailyLimit: 5000000,
            fee: 0.2,
            nextLevelProgress: 0.5,
          },
          tradingLevels: [
            {
              id: 1,
              name: 'Basic',
              nameVi: 'Cơ bản',
              fee: 0.3,
              dailyLimit: 10000000,
              perOrderLimit: 5000000,
              requirements: ['Email xác minh'],
              color: '#6B7280',
              gradient: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
            },
          ],
          platformStats: {
            volume24h: 1000000,
            volume24hChange: 1.2,
            totalTrades24h: 10,
            activeMerchants: 4,
            onlineTraders: 12,
            avgCompletionRate: 98,
            avgCompletionTime: '5 phút',
            totalUsers: 100,
            supportedFiats: 2,
            escrowProtected: 500000,
          },
        }),
      ),
    );

    await expect(p2pApi.getOverview()).resolves.toMatchObject({
      userLevel: { currentLevel: 2 },
      platformStats: { onlineTraders: 12 },
    });
  });

  it('rejects malformed ad responses', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/ads', () =>
        HttpResponse.json({ items: [{ ...ad, price: '25350' }] }),
      ),
    );

    await expect(p2pApi.listAds()).rejects.toThrow();
  });

  it('loads a single ad detail', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/ads/ad-1', () =>
        HttpResponse.json({ ...ad, referencePrice: 25300, paymentWindow: 15 }),
      ),
    );

    await expect(p2pApi.getAd('ad-1')).resolves.toMatchObject({
      id: 'ad-1',
      referencePrice: 25300,
      paymentWindow: 15,
    });
  });

  it('creates an escrow order with an idempotency key', async () => {
    server.use(
      http.post('http://localhost:3000/api/p2p/orders', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-order-key-001');
        return HttpResponse.json({
          orderId: 'order-1',
          status: 'created',
          expiresAt: '2026-09-21T10:15:00.000Z',
        });
      }),
    );

    await expect(
      p2pApi.createOrder(
        {
          adId: 'ad-1',
          asset: 'USDT',
          currency: 'VND',
          amount: 100,
          fiatAmount: 2_535_000,
          paymentMethod: 'Vietcombank',
        },
        'p2p-order-key-001',
      ),
    ).resolves.toMatchObject({ orderId: 'order-1', status: 'created' });
  });

  it('loads an escrow order detail', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/orders/order-1', () =>
        HttpResponse.json({
          id: 'order-1',
          orderNumber: 'VT-P2P-001',
          adId: 'ad-1',
          type: 'buy',
          asset: 'USDT',
          amount: 100,
          price: 25350,
          total: 2_535_000,
          currency: 'VND',
          status: 'pending_payment',
          merchant: 'Merchant One',
          merchantId: 'merchant-1',
          counterparty: 'VitTrade User',
          paymentMethod: 'Vietcombank',
          createdAt: '2026-09-21T10:00:00.000Z',
          expiresAt: '2026-09-21T10:15:00.000Z',
          escrowAmount: 100,
          fee: 0,
          paymentInfo: {
            bankName: 'Vietcombank',
            accountNumber: '1234567890',
            accountName: 'MERCHANT ONE',
          },
        }),
      ),
    );

    await expect(p2pApi.getOrder('order-1')).resolves.toMatchObject({
      id: 'order-1',
      status: 'pending_payment',
      paymentInfo: { bankName: 'Vietcombank' },
    });
  });

  it('transitions an escrow order through mark-paid and release actions', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'VT-P2P-001',
      adId: 'ad-1',
      type: 'buy' as const,
      asset: 'USDT',
      amount: 100,
      price: 25350,
      total: 2_535_000,
      currency: 'VND',
      status: 'paid' as const,
      merchant: 'Merchant One',
      merchantId: 'merchant-1',
      counterparty: 'VitTrade User',
      paymentMethod: 'Vietcombank',
      createdAt: '2026-09-21T10:00:00.000Z',
      expiresAt: '2026-09-21T10:15:00.000Z',
      paidAt: '2026-09-21T10:05:00.000Z',
      escrowAmount: 100,
      fee: 0,
    };
    server.use(
      http.post('http://localhost:3000/api/p2p/orders/order-1/mark-paid', () =>
        HttpResponse.json(order),
      ),
      http.post('http://localhost:3000/api/p2p/orders/order-1/release', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-release-key-001');
        return HttpResponse.json({
          ...order,
          status: 'released',
          releasedAt: '2026-09-21T10:10:00.000Z',
        });
      }),
    );

    await expect(p2pApi.markOrderPaid('order-1')).resolves.toMatchObject({ status: 'paid' });
    await expect(
      p2pApi.releaseOrder('order-1', 'release-verification-1', 'p2p-release-key-001'),
    ).resolves.toMatchObject({ status: 'released' });
  });

  it('creates and verifies an escrow release challenge', async () => {
    server.use(
      http.post('http://localhost:3000/api/p2p/orders/order-1/release/challenge', () =>
        HttpResponse.json(
          {
            id: 'release-challenge-1',
            method: 'totp',
            maskedDestination: 'Authenticator',
            expiresAt: '2026-09-21T10:05:00.000Z',
          },
          { status: 201 },
        ),
      ),
      http.post(
        'http://localhost:3000/api/p2p/orders/order-1/release/challenge/release-challenge-1/verify',
        async ({ request }) => {
          expect(await request.json()).toEqual({ code: '123456' });
          return HttpResponse.json({
            verificationToken: 'release-verification-1',
            expiresAt: '2026-09-21T10:07:00.000Z',
          });
        },
      ),
    );

    await expect(p2pApi.createReleaseChallenge('order-1')).resolves.toMatchObject({
      id: 'release-challenge-1',
      method: 'totp',
    });
    await expect(
      p2pApi.verifyReleaseChallenge('order-1', 'release-challenge-1', '123456'),
    ).resolves.toEqual({
      verificationToken: 'release-verification-1',
      expiresAt: '2026-09-21T10:07:00.000Z',
    });
  });

  it('rejects escrow release challenges with malformed expiry timestamps', async () => {
    server.use(
      http.post('http://localhost:3000/api/p2p/orders/order-1/release/challenge', () =>
        HttpResponse.json({ id: 'challenge-1', method: 'totp', expiresAt: 'soon' }),
      ),
    );

    await expect(p2pApi.createReleaseChallenge('order-1')).rejects.toThrow();
  });

  it('loads and updates P2P 2FA settings through the security contract', async () => {
    const settings = {
      methods: [
        {
          id: '2fa_sms',
          label: 'SMS OTP',
          description: '+84 *** *** **89',
          enabled: true,
          isPrimary: true,
          setupRequired: false,
          color: '#10B981',
        },
        {
          id: '2fa_authenticator',
          label: 'Authenticator App',
          description: 'Google Authenticator',
          enabled: false,
          isPrimary: false,
          setupRequired: true,
          color: '#3B82F6',
        },
        {
          id: '2fa_email',
          label: 'Email OTP',
          description: 'ngu***@gmail.com',
          enabled: true,
          isPrimary: false,
          setupRequired: false,
          color: '#F59E0B',
        },
      ],
      thresholds: [
        {
          id: 'release',
          label: 'Release Escrow',
          description: 'Release threshold',
          value: 100,
          unit: 'VND',
          enabled: true,
        },
        {
          id: 'create_order',
          label: 'Create Order',
          description: 'Create threshold',
          value: 200,
          unit: 'VND',
          enabled: false,
        },
        {
          id: 'cancel_order',
          label: 'Cancel Order',
          description: 'Cancel policy',
          value: 0,
          unit: 'VND',
          enabled: true,
        },
      ],
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/security/2fa/settings', () =>
        HttpResponse.json(settings),
      ),
      http.patch(
        'http://localhost:3000/api/p2p/security/2fa/methods/2fa_authenticator',
        ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-2fa-method-001');
          return HttpResponse.json({
            ...settings,
            methods: settings.methods.map((method) =>
              method.id === '2fa_authenticator'
                ? { ...method, enabled: true, setupRequired: false }
                : method,
            ),
          });
        },
      ),
      http.post('http://localhost:3000/api/p2p/security/2fa/authenticator/setup', () =>
        HttpResponse.json({
          secret: 'secret-1',
          qrCodeUrl: 'https://example.invalid/qr.svg',
          expiresAt: '2026-09-21T10:10:00.000Z',
        }),
      ),
      http.post(
        'http://localhost:3000/api/p2p/security/2fa/authenticator/confirm',
        ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-2fa-confirm-001');
          return HttpResponse.json(settings);
        },
      ),
    );

    await expect(p2pApi.get2FASettings()).resolves.toEqual(settings);
    await expect(
      p2pApi.toggle2FAMethod('2fa_authenticator', true, 'p2p-2fa-method-001'),
    ).resolves.toMatchObject({
      methods: expect.arrayContaining([
        expect.objectContaining({ id: '2fa_authenticator', enabled: true }),
      ]),
    });
    await expect(p2pApi.beginAuthenticatorSetup()).resolves.toMatchObject({ secret: 'secret-1' });
    await expect(
      p2pApi.confirmAuthenticatorSetup('123456', 'p2p-2fa-confirm-001'),
    ).resolves.toEqual(settings);
  });

  it('sets the primary 2FA method and updates a threshold with idempotency keys', async () => {
    const settings = {
      methods: [
        {
          id: '2fa_authenticator' as const,
          label: 'Authenticator App',
          description: 'Authenticator',
          enabled: true,
          isPrimary: true,
          setupRequired: false,
          color: '#3B82F6',
        },
      ],
      thresholds: [
        {
          id: 'create_order' as const,
          label: 'Create Order',
          description: 'Order threshold',
          value: 250,
          unit: 'USDT' as const,
          enabled: true,
        },
      ],
    };
    server.use(
      http.post('http://localhost:3000/api/p2p/security/2fa/primary', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-2fa-primary-001');
        expect(await request.json()).toEqual({ methodId: '2fa_authenticator' });
        return HttpResponse.json(settings);
      }),
      http.patch(
        'http://localhost:3000/api/p2p/security/2fa/thresholds/create_order',
        async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-2fa-threshold-001');
          expect(await request.json()).toEqual({ value: 250, enabled: true });
          return HttpResponse.json(settings);
        },
      ),
    );

    await expect(
      p2pApi.setPrimary2FAMethod('2fa_authenticator', 'p2p-2fa-primary-001'),
    ).resolves.toEqual(settings);
    await expect(
      p2pApi.update2FAThreshold(
        'create_order',
        { value: 250, enabled: true },
        'p2p-2fa-threshold-001',
      ),
    ).resolves.toEqual(settings);
  });

  it('cancels an order through the idempotent lifecycle endpoint', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'VT-P2P-001',
      adId: 'ad-1',
      type: 'buy' as const,
      asset: 'USDT',
      amount: 100,
      price: 25350,
      total: 2_535_000,
      currency: 'VND',
      status: 'cancelled' as const,
      merchant: 'Merchant One',
      merchantId: 'merchant-1',
      counterparty: 'VitTrade User',
      paymentMethod: 'Vietcombank',
      createdAt: '2026-09-21T10:00:00.000Z',
      expiresAt: '2026-09-21T10:15:00.000Z',
      cancelledAt: '2026-09-21T10:05:00.000Z',
      cancelReason: 'Price changed',
      escrowAmount: 100,
      fee: 0,
    };
    server.use(
      http.post('http://localhost:3000/api/p2p/orders/order-1/cancel', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-cancel-key-1234');
        expect(await request.json()).toEqual({ reason: 'Price changed' });
        return HttpResponse.json(order);
      }),
    );

    await expect(
      p2pApi.cancelOrder('order-1', { reason: 'Price changed' }, 'p2p-cancel-key-1234'),
    ).resolves.toMatchObject({ status: 'cancelled', cancelReason: 'Price changed' });
  });

  it('records an order rating through the idempotent lifecycle endpoint', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'VT-P2P-001',
      adId: 'ad-1',
      type: 'buy' as const,
      asset: 'USDT',
      amount: 100,
      price: 25350,
      total: 2_535_000,
      currency: 'VND',
      status: 'released' as const,
      merchant: 'Merchant One',
      merchantId: 'merchant-1',
      counterparty: 'VitTrade User',
      paymentMethod: 'Vietcombank',
      createdAt: '2026-09-21T10:00:00.000Z',
      expiresAt: '2026-09-21T10:15:00.000Z',
      releasedAt: '2026-09-21T10:10:00.000Z',
      rating: 5,
      review: 'Fast and reliable',
      escrowAmount: 100,
      fee: 0,
    };
    server.use(
      http.post('http://localhost:3000/api/p2p/orders/order-1/rate', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-rate-key-1234');
        expect(await request.json()).toEqual({
          rating: 5,
          review: 'Fast and reliable',
          tags: ['Giao dịch nhanh'],
        });
        return HttpResponse.json(order);
      }),
    );

    await expect(
      p2pApi.rateOrder(
        'order-1',
        { rating: 5, review: 'Fast and reliable', tags: ['Giao dịch nhanh'] },
        'p2p-rate-key-1234',
      ),
    ).resolves.toMatchObject({ rating: 5, review: 'Fast and reliable' });
  });

  it('uploads payment proof as multipart form data', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'VT-P2P-001',
      adId: 'ad-1',
      type: 'buy' as const,
      asset: 'USDT',
      amount: 100,
      price: 25350,
      total: 2_535_000,
      currency: 'VND',
      status: 'paid' as const,
      merchant: 'Merchant One',
      merchantId: 'merchant-1',
      counterparty: 'VitTrade User',
      paymentMethod: 'Vietcombank',
      createdAt: '2026-09-21T10:00:00.000Z',
      expiresAt: '2026-09-21T10:15:00.000Z',
      paymentProof: ['bank-transfer.png'],
      escrowAmount: 100,
      fee: 0,
    };
    const multipartApi = createP2PApi({
      request: async <TResponse>(config: ApiRequest) => {
        expect(config.idempotencyKey).toBe('p2p-proof-key-1234');
        const formData = config.body as FormData;
        expect(formData.get('files')).toMatchObject({ name: 'bank-transfer.png' });
        return order as TResponse;
      },
    });

    await expect(
      multipartApi.submitPaymentProof(
        'order-1',
        { files: [new File(['proof'], 'bank-transfer.png', { type: 'image/png' })] },
        'p2p-proof-key-1234',
      ),
    ).resolves.toMatchObject({ paymentProof: ['bank-transfer.png'] });
  });

  it('loads the current user order history', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/orders', ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('paid');
        return HttpResponse.json({
          items: [
            {
              id: 'order-1',
              orderNumber: 'VT-P2P-001',
              adId: 'ad-1',
              type: 'buy',
              asset: 'USDT',
              amount: 100,
              price: 25350,
              total: 2_535_000,
              currency: 'VND',
              status: 'paid',
              merchant: 'Merchant One',
              merchantId: 'merchant-1',
              counterparty: 'VitTrade User',
              paymentMethod: 'Vietcombank',
              createdAt: '2026-09-21T10:00:00.000Z',
              expiresAt: '2026-09-21T10:15:00.000Z',
              escrowAmount: 100,
              fee: 0,
            },
          ],
          total: 1,
        });
      }),
    );

    await expect(p2pApi.listOrders({ status: 'paid' })).resolves.toMatchObject({ total: 1 });
  });

  it('manages payment methods through the idempotent contract', async () => {
    const method = {
      id: 'pm-1',
      type: 'bank' as const,
      bankName: 'Vietcombank',
      accountNumber: '0071000123456',
      accountName: 'NGUYEN VAN A',
      isDefault: true,
      isVerified: true,
      createdAt: '2026-09-21T10:00:00.000Z',
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/payment-methods', () =>
        HttpResponse.json({ items: [method] }),
      ),
      http.post('http://localhost:3000/api/p2p/payment-methods', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-payment-create-001');
        expect(await request.json()).toEqual({
          type: 'ewallet',
          bankName: 'Momo',
          accountNumber: '0901234567',
          accountName: 'NGUYEN VAN A',
        });
        return HttpResponse.json(
          { ...method, id: 'pm-2', type: 'ewallet', bankName: 'Momo' },
          { status: 201 },
        );
      }),
      http.patch('http://localhost:3000/api/p2p/payment-methods/pm-1', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-payment-default-001');
        expect(await request.json()).toEqual({ isDefault: false });
        return HttpResponse.json({ ...method, isDefault: false });
      }),
      http.delete('http://localhost:3000/api/p2p/payment-methods/pm-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-payment-delete-001');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(p2pApi.listPaymentMethods()).resolves.toEqual({ items: [method] });
    await expect(
      p2pApi.createPaymentMethod(
        {
          type: 'ewallet',
          bankName: 'Momo',
          accountNumber: '0901234567',
          accountName: 'NGUYEN VAN A',
        },
        'p2p-payment-create-001',
      ),
    ).resolves.toMatchObject({ id: 'pm-2', type: 'ewallet' });
    await expect(
      p2pApi.updatePaymentMethod('pm-1', { isDefault: false }, 'p2p-payment-default-001'),
    ).resolves.toMatchObject({ id: 'pm-1', isDefault: false });
    await expect(
      p2pApi.deletePaymentMethod('pm-1', 'p2p-payment-delete-001'),
    ).resolves.toBeUndefined();
  });

  it('loads and updates a dispute through message and escalation boundaries', async () => {
    const dispute = {
      id: 'dispute-1',
      orderId: 'order-1',
      orderNumber: 'VT-P2P-001',
      reason: 'Payment not confirmed',
      description: 'The transfer was completed but the counterparty has not confirmed it.',
      evidence: ['transfer.png'],
      status: 'under_review' as const,
      createdAt: '2026-09-21T10:00:00.000Z',
      timeline: [{ time: '2026-09-21T10:00:00.000Z', event: 'Dispute submitted' }],
      supportMessages: [],
      escalationLevel: 2,
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/disputes', ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('under_review');
        return HttpResponse.json({ items: [dispute], total: 1 });
      }),
      http.get('http://localhost:3000/api/p2p/disputes/dispute-1', () =>
        HttpResponse.json(dispute),
      ),
      http.post(
        'http://localhost:3000/api/p2p/disputes/dispute-1/messages',
        async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-dispute-message-001');
          expect(await request.json()).toEqual({ text: 'Additional context' });
          return HttpResponse.json({
            ...dispute,
            supportMessages: [{ sender: 'user', text: 'Additional context', time: '10:05' }],
          });
        },
      ),
      http.post(
        'http://localhost:3000/api/p2p/disputes/dispute-1/escalate',
        async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-dispute-escalate-001');
          expect(await request.json()).toEqual({ level: 3 });
          return HttpResponse.json({ ...dispute, escalationLevel: 3 });
        },
      ),
    );

    await expect(p2pApi.listDisputes({ status: 'under_review' })).resolves.toMatchObject({
      total: 1,
    });
    await expect(p2pApi.getDispute('dispute-1')).resolves.toMatchObject({ id: 'dispute-1' });
    await expect(
      p2pApi.sendDisputeMessage(
        'dispute-1',
        { text: 'Additional context' },
        'p2p-dispute-message-001',
      ),
    ).resolves.toMatchObject({ supportMessages: [{ text: 'Additional context' }] });
    await expect(
      p2pApi.escalateDispute('dispute-1', { level: 3 }, 'p2p-dispute-escalate-001'),
    ).resolves.toMatchObject({ escalationLevel: 3 });
  });

  it('validates the P2P dashboard analytics boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/dashboard', () =>
        HttpResponse.json({
          stats: {
            totalOrders: 78,
            completedOrders: 64,
            cancelledOrders: 8,
            disputedOrders: 2,
            completionRate: 82.1,
            avgCompletionTime: '8 min',
            totalVolume7d: 89_500_000,
            totalVolume30d: 385_000_000,
            totalVolumeAll: 1_250_000_000,
            buyVolume30d: 245_000_000,
            sellVolume30d: 140_000_000,
            spreadRevenue30d: 1_850_000,
            avgOrderSize: 16_200_000,
            uniqueCounterparties: 23,
            repeatCustomerRate: 34.8,
            avgRatingGiven: 4.6,
            avgRatingReceived: 4.8,
            positiveReviewRate: 95.3,
            responseTimeAvg: '4 min',
            platformAvgCompletionRate: 94.5,
            platformAvgResponseTime: '6 min',
          },
          ordersByMonth: [{ month: 'T1', buy: 12, sell: 6 }],
          volumeByWeek: [{ week: 'T1', volume: 45_000_000 }],
          assetDistribution: [{ asset: 'USDT', percentage: 72, volume: 277_200_000 }],
          topMerchants: [
            { name: 'CryptoKing', id: 'merchant-1', trades: 15, volume: 127_000_000, rating: 4.8 },
          ],
          recentActivity: [
            {
              date: '23/02',
              type: 'buy',
              asset: 'USDT',
              amount: 200,
              total: 5_070_000,
              merchant: 'CryptoKing',
              status: 'released',
            },
          ],
        }),
      ),
    );

    await expect(p2pApi.getDashboard()).resolves.toMatchObject({
      stats: { completedOrders: 64 },
      volumeByWeek: [{ volume: 45_000_000 }],
    });
  });

  it('manages blacklist entries with search and idempotent mutations', async () => {
    const entry = {
      id: 'blacklist-1',
      userId: 'user-2',
      username: 'RiskyTrader',
      reason: 'scam' as const,
      blockedAt: '2026-09-21T10:00:00.000Z',
      tradesBefore: 2,
      completionRate: 20,
      isVerified: false,
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/blacklist', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('search')).toBe('Risky');
        expect(url.searchParams.get('reason')).toBe('scam');
        return HttpResponse.json({ items: [entry], total: 1 });
      }),
      http.post('http://localhost:3000/api/p2p/blacklist', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-blacklist-create-001');
        return HttpResponse.json({ ...entry, id: 'blacklist-2' }, { status: 201 });
      }),
      http.delete('http://localhost:3000/api/p2p/blacklist/blacklist-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-blacklist-delete-001');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(p2pApi.listBlacklist({ search: 'Risky', reason: 'scam' })).resolves.toEqual({
      items: [entry],
      total: 1,
    });
    await expect(
      p2pApi.createBlacklistEntry(
        { username: 'RiskyTrader', reason: 'scam' },
        'p2p-blacklist-create-001',
      ),
    ).resolves.toMatchObject({ id: 'blacklist-2' });
    await expect(
      p2pApi.removeBlacklistEntry('blacklist-1', 'p2p-blacklist-delete-001'),
    ).resolves.toBeUndefined();
  });

  it('loads received and given review summaries', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/reviews', ({ request }) => {
        expect(new URL(request.url).searchParams.get('scope')).toBe('given');
        return HttpResponse.json({
          items: [
            {
              id: 'review-1',
              orderId: 'order-1',
              fromUser: 'Me',
              fromUserId: 'user-1',
              toUser: 'Merchant',
              toUserId: 'merchant-1',
              rating: 5,
              comment: 'Fast',
              createdAt: '2026-09-21T10:00:00.000Z',
              type: 'positive',
            },
          ],
          total: 1,
          averageRating: 5,
          positiveCount: 1,
          negativeCount: 0,
        });
      }),
    );

    await expect(p2pApi.listReviews('given')).resolves.toMatchObject({
      total: 1,
      averageRating: 5,
      positiveCount: 1,
    });
  });

  it('loads and sends order chat messages through the protected contract', async () => {
    const chat = {
      orderId: 'order-1',
      counterparty: 'Merchant One',
      e2eEncrypted: true,
      messages: [
        {
          id: 'message-1',
          sender: 'system' as const,
          text: 'Order created',
          sentAt: '2026-09-21T10:00:00.000Z',
          type: 'system' as const,
        },
      ],
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/orders/order-1/chat', () => HttpResponse.json(chat)),
      http.post(
        'http://localhost:3000/api/p2p/orders/order-1/chat/messages',
        async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('p2p-chat-001');
          expect(await request.json()).toEqual({ text: 'I have paid', type: 'text' });
          return HttpResponse.json({
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: 'message-2',
                sender: 'user',
                text: 'I have paid',
                sentAt: '2026-09-21T10:01:00.000Z',
                type: 'text',
              },
            ],
          });
        },
      ),
    );

    await expect(p2pApi.getChat('order-1')).resolves.toMatchObject({
      orderId: 'order-1',
      e2eEncrypted: true,
    });
    await expect(
      p2pApi.sendChatMessage('order-1', { text: 'I have paid', type: 'text' }, 'p2p-chat-001'),
    ).resolves.toMatchObject({ messages: [{ id: 'message-1' }, { text: 'I have paid' }] });
  });

  it('validates the P2P achievements response boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/p2p/achievements', () =>
        HttpResponse.json({
          items: [
            {
              id: 'achievement-1',
              title: 'First trade',
              description: 'Complete a trade',
              progress: 100,
              currentValue: 1,
              targetValue: 1,
              unit: 'trade',
              unlocked: true,
              category: 'trades',
            },
          ],
          totalUnlocked: 1,
          totalPoints: 5,
          badgeCount: 0,
          currentLevel: 2,
        }),
      ),
    );

    await expect(p2pApi.getAchievements()).resolves.toMatchObject({
      totalUnlocked: 1,
      currentLevel: 2,
      items: [{ category: 'trades' }],
    });
  });

  it('loads ad analytics and merchant profile contracts', async () => {
    const analytics = {
      adId: 'ad-1',
      impressions: 100,
      clicks: 20,
      ordersCreated: 10,
      ordersCompleted: 9,
      ordersDisputed: 1,
      ordersCancelled: 0,
      totalVolume: 1_000_000,
      totalRevenue: 10_000,
      avgOrderValue: 100_000,
      avgResponseTime: 45,
      avgCompletionTime: 8,
      conversionRate: 10,
      completionRate: 90,
      rating: 4.8,
      reviewsCount: 12,
      ranking: 3,
      totalActiveAds: 20,
      dailyPerformance: [{ date: '2026-09-21', impressions: 100, orders: 10, volume: 1_000_000 }],
      hourlyHeatmap: [{ hour: 12, orders: 3 }],
      paymentBreakdown: [{ method: 'Bank', count: 10, volume: 1_000_000 }],
      competitorComparison: [{ metric: 'Rating', yours: 4.8, avg: 4.2, top: 4.9 }],
    };
    const merchant = {
      id: 'merchant-1',
      name: 'Merchant One',
      level: 3,
      kycVerified: true,
      joinDate: '2024-01-01',
      totalTrades: 100,
      totalTrades30d: 10,
      completionRate: 98,
      avgReleaseTime: '2 min',
      avgPayTime: '5 min',
      totalVolume30d: 1_000_000,
      isOnline: true,
      lastActive: 'now',
      positiveRate: 99,
      negativeCount: 1,
      activeAds: 1,
    };
    const review = {
      id: 'review-1',
      orderId: 'order-1',
      fromUser: 'Buyer',
      fromUserId: 'user-1',
      toUser: 'Merchant One',
      toUserId: 'merchant-1',
      rating: 5,
      comment: 'Fast',
      createdAt: '2026-09-21T10:00:00.000Z',
      type: 'positive' as const,
    };
    server.use(
      http.get('http://localhost:3000/api/p2p/ads/ad-1/analytics', () =>
        HttpResponse.json(analytics),
      ),
      http.get('http://localhost:3000/api/p2p/merchants/merchant-1', () =>
        HttpResponse.json({ merchant, ads: [ad], reviews: [review] }),
      ),
    );

    await expect(p2pApi.getAdAnalytics('ad-1')).resolves.toMatchObject({
      adId: 'ad-1',
      ranking: 3,
    });
    await expect(p2pApi.getMerchantProfile('merchant-1')).resolves.toMatchObject({
      merchant: { name: 'Merchant One' },
      ads: [{ id: 'ad-1' }],
      reviews: [{ rating: 5 }],
    });
  });

  it('submits a merchant report with idempotency protection', async () => {
    server.use(
      http.post('http://localhost:3000/api/p2p/reports/merchants', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('p2p-report-001');
        expect(await request.json()).toEqual({
          merchantId: 'merchant-1',
          reason: 'scam',
          detail: 'Suspicious payment request',
        });
        return HttpResponse.json(
          { reportId: 'report-1', status: 'submitted', createdAt: '2026-09-21T10:00:00.000Z' },
          { status: 201 },
        );
      }),
    );

    await expect(
      p2pApi.reportMerchant(
        { merchantId: 'merchant-1', reason: 'scam', detail: 'Suspicious payment request' },
        'p2p-report-001',
      ),
    ).resolves.toMatchObject({ reportId: 'report-1', status: 'submitted' });
  });
});
