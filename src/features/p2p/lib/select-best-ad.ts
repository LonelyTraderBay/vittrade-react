import type { P2PAd, P2PAdType } from '../model/p2p-types';

export function selectBestP2PAd(
  ads: P2PAd[],
  tradeType: P2PAdType,
  asset: string,
  fiatAmount: number,
) {
  const requiredType = tradeType === 'buy' ? 'sell' : 'buy';
  return ads
    .filter((ad) => ad.type === requiredType && ad.asset === asset && ad.status === 'active')
    .filter((ad) => fiatAmount >= ad.minLimit && fiatAmount <= ad.maxLimit)
    .sort((left, right) =>
      tradeType === 'buy' ? left.price - right.price : right.price - left.price,
    )[0];
}
