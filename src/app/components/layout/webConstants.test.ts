import { describe, expect, it } from 'vitest';
import { isFullBleedRoute } from './webConstants';

describe('web page layout classification', () => {
  it.each(['/w/scanner', '/w/scanner/detail', '/w/trade/analytics', '/w/trade/btcusdt'])(
    'uses viewport panels for %s',
    (route) => {
      expect(isFullBleedRoute(route)).toBe(true);
    },
  );

  it.each([
    '/w/markets',
    '/w/trade/',
    '/w/trade/orders',
    '/w/trade/copy/provider/provider-1',
    '/w/scanner-tools',
    '/w/scannery',
  ])('keeps standard content layout for %s', (route) => {
    expect(isFullBleedRoute(route)).toBe(false);
  });
});
