import { describe, expect, it } from 'vitest';
import type { P2PAd } from '../model/p2p-types';
import { selectBestP2PAd } from './select-best-ad';

function makeAd(overrides: Partial<P2PAd> = {}): P2PAd {
  return {
    id: 'offer',
    type: 'sell',
    asset: 'USDT',
    merchant: 'Merchant',
    merchantId: 'merchant-1',
    merchantLevel: 1,
    merchantVerified: true,
    merchantJoinDate: '2024-01-01',
    completionRate: 98,
    completedOrders: 100,
    totalVolume30d: 20_000,
    price: 25_000,
    currency: 'VND',
    priceType: 'fixed',
    minLimit: 100_000,
    maxLimit: 1_000_000,
    available: 100,
    paymentMethods: ['Bank Transfer'],
    avgResponseTime: '2m',
    isOnline: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    ...overrides,
  };
}

describe('selectBestP2PAd', () => {
  it('selects the lowest eligible sell offer when the user buys', () => {
    const ads = [
      makeAd({ id: 'high', price: 25_200 }),
      makeAd({ id: 'low', price: 24_800 }),
      makeAd({ id: 'wrong-side', type: 'buy', price: 20_000 }),
      makeAd({ id: 'wrong-asset', asset: 'BTC', price: 20_000 }),
      makeAd({ id: 'paused', status: 'paused', price: 20_000 }),
      makeAd({ id: 'below-min', minLimit: 200_000 }),
      makeAd({ id: 'above-max', maxLimit: 400_000 }),
    ];

    expect(selectBestP2PAd(ads, 'buy', 'USDT', 500_000)?.id).toBe('low');
  });

  it('selects the highest eligible buy offer when the user sells and includes limit edges', () => {
    const ads = [
      makeAd({ id: 'buy-low', type: 'buy', price: 24_900, minLimit: 100_000 }),
      makeAd({ id: 'buy-high', type: 'buy', price: 25_100, maxLimit: 500_000 }),
      makeAd({ id: 'sell', type: 'sell', price: 99_000 }),
    ];

    expect(selectBestP2PAd(ads, 'sell', 'USDT', 100_000)?.id).toBe('buy-high');
    expect(selectBestP2PAd(ads, 'sell', 'USDT', 500_000)?.id).toBe('buy-high');
  });

  it('returns no offer when the requested amount has no active matching ad', () => {
    expect(selectBestP2PAd([], 'buy', 'USDT', 100_000)).toBeUndefined();
    expect(
      selectBestP2PAd([makeAd({ maxLimit: 200_000 })], 'buy', 'USDT', 200_001),
    ).toBeUndefined();
  });
});
