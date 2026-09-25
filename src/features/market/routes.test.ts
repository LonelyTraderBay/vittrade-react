import { describe, expect, it } from 'vitest';
import {
  createMarketProtectedRoutes,
  createMarketPublicRoutes,
  createMarketWebRoutes,
} from './routes';

const Stub = () => null;

describe('Market feature routes', () => {
  it('owns the contract-backed market URLs', () => {
    const paths = createMarketPublicRoutes({ pairDetail: Stub }).map((route) => route.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'markets/overview',
        'markets/watchlist',
        'markets/advanced-charts',
        'pair/:pairId',
        'pair/:pairId/info',
      ]),
    );
  });

  it('keeps the advanced trade chart protected route explicit', () => {
    expect(createMarketProtectedRoutes().map((route) => route.path)).toContain(
      'trade/advanced-chart/:pairId',
    );
  });

  it('owns the web shell market aliases', () => {
    expect(createMarketWebRoutes().map((route) => route.path)).toEqual([
      'scanner',
      'markets/overview',
      'markets/movers',
      'markets/watchlist',
      'markets/heatmap',
    ]);
  });
});
