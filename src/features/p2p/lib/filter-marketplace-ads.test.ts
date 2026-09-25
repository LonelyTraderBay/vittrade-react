import { describe, expect, it } from 'vitest';
import type { P2PAd } from '../model/p2p-types';
import { filterMarketplaceAds } from './filter-marketplace-ads';

const makeAd = (overrides: Partial<P2PAd> = {}): P2PAd => ({
  id: 'ad-default',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Alpha merchant',
  merchantId: 'merchant-default',
  merchantLevel: 1,
  merchantVerified: true,
  merchantJoinDate: '2024-01-01',
  completionRate: 95,
  completedOrders: 100,
  totalVolume30d: 10_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Bank Transfer'],
  avgResponseTime: '2m',
  isOnline: true,
  createdAt: '2026-09-23T00:00:00.000Z',
  status: 'active',
  merchantBadge: 'pro',
  ...overrides,
});

const ads = [
  makeAd({ id: 'price-high', merchant: 'Beta', price: 25_200 }),
  makeAd({ id: 'price-low', merchant: 'Alpha', price: 24_800, merchantBadge: 'elite' }),
  makeAd({
    id: 'inactive',
    merchant: 'Inactive',
    price: 24_000,
    status: 'paused',
    merchantVerified: false,
  }),
  makeAd({ id: 'buy-offer', merchant: 'Buyer', type: 'buy', price: 25_100 }),
];

const defaults = {
  ads,
  tab: 'buy' as const,
  asset: 'USDT',
  searchText: '',
  filterPayment: '',
  merchantType: 'all' as const,
  amountInput: '',
  sortBy: 'price' as const,
};

describe('filterMarketplaceAds', () => {
  it('keeps active opposite-side offers and sorts price without mutating source ads', () => {
    const result = filterMarketplaceAds(defaults);

    expect(result.map((ad) => ad.id)).toEqual(['price-low', 'price-high']);
    expect(ads.map((ad) => ad.id)).toEqual(['price-high', 'price-low', 'inactive', 'buy-offer']);
  });

  it('applies case-insensitive merchant, verified, payment and amount filters together', () => {
    const result = filterMarketplaceAds({
      ...defaults,
      searchText: 'ALPHA',
      filterPayment: 'Bank Transfer',
      merchantType: 'verified',
      amountInput: '500000',
    });

    expect(result.map((ad) => ad.id)).toEqual(['price-low']);
  });

  it('uses descending prices for sell, completion and completed-order sorting', () => {
    expect(filterMarketplaceAds({ ...defaults, tab: 'sell' }).map((ad) => ad.id)).toEqual([
      'buy-offer',
    ]);
    expect(
      filterMarketplaceAds({
        ...defaults,
        sortBy: 'completion',
        ads: [ads[0], makeAd({ id: 'best-rate', completionRate: 99 })],
      }).map((ad) => ad.id),
    ).toEqual(['best-rate', 'price-high']);
    expect(
      filterMarketplaceAds({
        ...defaults,
        sortBy: 'orders',
        ads: [ads[0], makeAd({ id: 'most-orders', completedOrders: 200 })],
      }).map((ad) => ad.id),
    ).toEqual(['most-orders', 'price-high']);
  });

  it('ignores invalid or non-positive amount filters and constrains asset and merchant badge', () => {
    expect(filterMarketplaceAds({ ...defaults, amountInput: 'not-a-number' })).toHaveLength(2);
    expect(filterMarketplaceAds({ ...defaults, amountInput: '0' })).toHaveLength(2);
    expect(filterMarketplaceAds({ ...defaults, asset: 'BTC' })).toEqual([]);
    expect(filterMarketplaceAds({ ...defaults, merchantType: 'elite' }).map((ad) => ad.id)).toEqual(
      ['price-low'],
    );
  });
});
