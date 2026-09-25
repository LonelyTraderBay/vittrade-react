import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { createProtectedRoutes, createPublicRoutes, type ShellOverrides } from '../routeConfig';

const Stub = () => null;
const overrides: ShellOverrides = {
  TradePage: Stub,
  WalletPage: Stub,
  TxHistoryPage: Stub,
  ProfilePage: Stub,
  P2PHomePage: Stub,
  HomePage: Stub,
  MarketListPage: Stub,
  PairDetailPage: Stub,
};

function collectPaths(routes: RouteObject[], parent = ''): string[] {
  return routes.flatMap((route) => {
    const current = route.path ? [parent, route.path].filter(Boolean).join('/') : parent;
    const self = route.index ? [current] : route.path ? [current] : [];
    const children = route.children ? collectPaths(route.children, current) : [];
    return [...self, ...children];
  });
}

describe('public route contract', () => {
  it('preserves the core discovery and prediction URLs', () => {
    const paths = collectPaths(createPublicRoutes(overrides));
    expect(paths).toEqual(
      expect.arrayContaining([
        'home',
        'markets',
        'markets/predictions',
        'markets/predictions/search',
        'markets/predictions/event/:eventId',
        'markets/predictions/portfolio',
        'markets/predictions/receipt/:orderId',
      ]),
    );
  });
});

describe('protected route contract', () => {
  it('keeps account, trading, wallet and p2p route families composed', () => {
    const paths = collectPaths(createProtectedRoutes(overrides));
    expect(paths).toEqual(
      expect.arrayContaining([
        'trade',
        'trade/orders-history',
        'wallet',
        'profile',
        'p2p',
        'referral',
        'search',
        'topics',
        'topic/:topicId',
        'arena/mode/:modeId',
        'arena/challenge/:challengeId',
        'trade/copy-trading',
        'trade/copy-trading/active',
        'trade/copy-provider/:providerId',
        'trade/copy-provider/:providerId/assessment',
        'trade/copy-provider/:providerId/configuration',
        'trade/copy-provider/:providerId/confirmation',
        'trade/copy-trading/comparison',
        'earn/savings/comparison',
        'earn/savings/dca',
        'launchpad',
        'launchpad/:id',
        'launchpad/contract/:id',
      ]),
    );

    const launchpadDetailRoutes = createProtectedRoutes(overrides).filter(
      (route) => route.path === 'launchpad/:id' || route.path === 'launchpad/contract/:id',
    );
    expect(launchpadDetailRoutes).toHaveLength(2);
    expect(launchpadDetailRoutes[0]?.Component).toBe(launchpadDetailRoutes[1]?.Component);
  });
});
