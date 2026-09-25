import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { createTradingRoutes, createTradingWebRoutes } from './routes';

function paths(routes: RouteObject[]): string[] {
  return routes.map((route) => route.path).filter((path): path is string => Boolean(path));
}

describe('trading route ownership', () => {
  it('keeps the contract-backed copy-trading routes inside the feature boundary', () => {
    expect(paths(createTradingRoutes())).toEqual([
      'trade/copy-trading',
      'trade/copy-trading/active',
      'trade/copy-provider/:providerId',
      'trade/copy-provider/:providerId/assessment',
      'trade/copy-provider/:providerId/configuration',
      'trade/copy-provider/:providerId/confirmation',
      'trade/copy-trading/comparison',
      'trade/copy-trading/education',
    ]);
  });

  it('preserves the web shell URLs while using feature-owned implementations', () => {
    expect(paths(createTradingWebRoutes())).toEqual([
      'trade/copy',
      'trade/copy/provider/:providerId',
      'trade/copy/provider/:providerId/assessment',
      'trade/copy/provider/:providerId/configuration',
      'trade/copy/provider/:providerId/confirmation',
      'trade/copy/active',
      'trade/copy/performance/:copyId',
      'trade/copy/education',
      'trade/copy-trading/education',
      'trade/analytics',
    ]);
  });
});
