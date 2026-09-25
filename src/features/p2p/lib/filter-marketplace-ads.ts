import type { P2PAd } from '../model/p2p-types';

interface FilterMarketplaceAdsOptions {
  ads: P2PAd[];
  tab: 'buy' | 'sell';
  asset: string;
  searchText: string;
  filterPayment: string;
  merchantType: 'all' | 'elite' | 'pro' | 'verified';
  amountInput: string;
  sortBy: 'price' | 'completion' | 'orders';
}

export function filterMarketplaceAds({
  ads,
  tab,
  asset,
  searchText,
  filterPayment,
  merchantType,
  amountInput,
  sortBy,
}: FilterMarketplaceAdsOptions): P2PAd[] {
  let filtered = ads
    .filter((ad) => ad.type === (tab === 'buy' ? 'sell' : 'buy'))
    .filter((ad) => ad.asset === asset)
    .filter((ad) => ad.status === 'active');

  if (searchText) {
    const query = searchText.toLowerCase();
    filtered = filtered.filter((ad) => ad.merchant.toLowerCase().includes(query));
  }
  if (filterPayment) {
    filtered = filtered.filter((ad) => ad.paymentMethods.includes(filterPayment));
  }
  if (merchantType === 'elite' || merchantType === 'pro') {
    filtered = filtered.filter((ad) => ad.merchantBadge === merchantType);
  } else if (merchantType === 'verified') {
    filtered = filtered.filter((ad) => ad.merchantVerified);
  }
  if (amountInput) {
    const amount = Number.parseFloat(amountInput);
    if (amount > 0) {
      filtered = filtered.filter((ad) => amount >= ad.minLimit && amount <= ad.maxLimit);
    }
  }

  return filtered.sort((a, b) => {
    if (sortBy === 'price') return tab === 'buy' ? a.price - b.price : b.price - a.price;
    if (sortBy === 'completion') return b.completionRate - a.completionRate;
    return b.completedOrders - a.completedOrders;
  });
}
