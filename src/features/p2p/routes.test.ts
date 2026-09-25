import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { p2pOrderActionRoutes, p2pWebRoutes } from './routes';

function paths(routes: RouteObject[]): string[] {
  return routes.map((route) => route.path).filter((path): path is string => Boolean(path));
}

describe('P2P route ownership', () => {
  it('keeps order action URLs inside the P2P feature boundary', () => {
    expect(paths(p2pOrderActionRoutes)).toEqual([
      'p2p/order/timeline/:orderId',
      'p2p/order/rate/:orderId',
      'p2p/order/cancel/:orderId',
      'p2p/order/proof/:orderId',
    ]);
  });

  it('owns contract-backed P2P web aliases inside the feature boundary', () => {
    expect(paths(p2pWebRoutes)).toEqual([
      'p2p/create-offer',
      'p2p/order-room',
      'p2p/order/:orderId',
    ]);
  });
});
