import { describe, expect, it } from 'vitest';
import { normalizeCoinSymbol, readDcaPreselectedCoin } from './route-state';

describe('route state helpers', () => {
  it('normalizes a valid coin symbol and rejects unsafe values', () => {
    expect(normalizeCoinSymbol(' btc-usdt ')).toBe('BTC-USDT');
    expect(normalizeCoinSymbol('')).toBeNull();
    expect(normalizeCoinSymbol('<script>')).toBeNull();
    expect(normalizeCoinSymbol('a'.repeat(21))).toBeNull();
  });

  it('reads only the validated DCA navigation state', () => {
    expect(readDcaPreselectedCoin({ preselectedCoin: 'eth' })).toBe('ETH');
    expect(readDcaPreselectedCoin({ preselectedCoin: 42 })).toBeNull();
    expect(readDcaPreselectedCoin(null)).toBeNull();
    expect(readDcaPreselectedCoin({ other: 'BTC' })).toBeNull();
  });
});
