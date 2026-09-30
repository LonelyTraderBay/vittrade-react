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
        'markets/news',
        'markets/calendar',
        'markets/correlations',
        'markets/unlocks',
        'markets/derivatives',
        'markets/social-sentiment',
        'markets/signals',
        'markets/advanced-charts',
        'pair/:pairId',
        'pair/:pairId/info',
      ]),
    );
    expect(paths).not.toContain('markets/watchlist');
    expect(paths).not.toContain('markets/alerts');
  });

  it('keeps secured watchlist, alerts, and advanced chart routes behind the protected tree', () => {
    expect(createMarketProtectedRoutes().map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'markets/watchlist',
        'markets/alerts',
        'trade/advanced-chart/:pairId',
      ]),
    );
  });

  it('owns the web shell market aliases', () => {
    expect(createMarketWebRoutes().map((route) => route.path)).toEqual([
      'scanner',
      'markets/overview',
      'markets/movers',
      'markets/heatmap',
    ]);
  });
});
