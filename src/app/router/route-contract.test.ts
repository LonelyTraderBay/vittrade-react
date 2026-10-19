import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { createProtectedRoutes, createPublicRoutes, type ShellOverrides } from '../routeConfig';
import { collectRoutePaths } from './index';
import { isAppRouteEquivalent } from '../routes';

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
  it('preserves root indexes and empty child segments without inventing an additional slash', () => {
    expect(
      collectRoutePaths([
        { index: true },
        { path: '', children: [] },
        { children: [{ index: true }] },
        { path: '/w/', children: [{ path: '/' }, { index: true }, { path: 'trade' }] },
      ]),
    ).toEqual(['/', '/w', '/w/', '/w/trade']);
  });

  it('collects pathless layouts without treating them as paths and removes duplicate templates', () => {
    expect(
      collectRoutePaths([
        { children: [] },
        { children: [{ path: '/nested', children: [{ path: 'child' }] }] },
        { path: 'duplicate' },
        { path: 'duplicate' },
      ]),
    ).toEqual(['/duplicate', '/nested', '/nested/child']);
  });

  it('keeps the market landing page public while gating contract-secured predictions', () => {
    const paths = collectPaths(createPublicRoutes(overrides));
    expect(paths).toEqual(expect.arrayContaining(['home', 'markets']));
    expect(paths).not.toContain('markets/predictions');
    expect(paths).not.toContain('markets/predictions/search');
    expect(paths).not.toContain('markets/predictions/event/:eventId');
  });
});

describe('protected route contract', () => {
  it('uses the Web Arena home override instead of the shared integration placeholder', () => {
    const arenaHome = () => null;
    const routes = createProtectedRoutes({ ...overrides, ArenaHomePage: arenaHome });

    expect(routes.find((route) => route.path === 'arena')?.Component).toBe(arenaHome);
    expect(
      createProtectedRoutes(overrides).find((route) => route.path === 'arena')?.Component,
    ).not.toBe(arenaHome);
  });

  it('keeps account, trading, wallet and p2p route families composed', () => {
    const paths = collectPaths(createProtectedRoutes(overrides));
    expect(paths).toEqual(
      expect.arrayContaining([
        'trade',
        'trade/positions',
        'trade/orders-history',
        'wallet',
        'wallet/network-status',
        'markets/portfolio-tracker',
        'markets/predictions',
        'markets/predictions/search',
        'markets/predictions/event/:eventId',
        'markets/predictions/portfolio',
        'markets/predictions/receipt/:orderId',
        'markets/watchlist',
        'markets/alerts',
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
    expect(collectPaths(createPublicRoutes(overrides))).not.toContain('markets/watchlist');
    expect(collectPaths(createPublicRoutes(overrides))).not.toContain('markets/alerts');
    expect(collectPaths(createPublicRoutes(overrides))).not.toContain('markets/portfolio-tracker');

    const launchpadDetailRoutes = createProtectedRoutes(overrides).filter(
      (route) => route.path === 'launchpad/:id' || route.path === 'launchpad/contract/:id',
    );
    expect(launchpadDetailRoutes).toHaveLength(2);
    expect(launchpadDetailRoutes[0]?.Component).toBe(launchpadDetailRoutes[1]?.Component);
  });
});

describe('platform router topology', () => {
  it('composes core routes for each shell and keeps diagnostics in development', () => {
    const paths = collectRoutePaths();

    expect(paths).toEqual(
      expect.arrayContaining([
        '/home',
        '/t/home',
        '/w/home',
        '/r',
        '/auth/login',
        '/w/auth/login',
        '/profile/security/change-password',
        '/t/profile/security/change-password',
        '/w/profile/security/change-password',
        '/r/profile/security/change-password',
        '/wallet/transfer',
        '/w/wallet/transfer',
        '/dev/route-checker',
        '/dev/performance-monitor',
      ]),
    );
  });

  it('switches shells only when both paths resolve to the same page component', () => {
    expect(isAppRouteEquivalent('/w/markets', '/markets')).toBe(true);
    expect(isAppRouteEquivalent('/w/trade/copy', '/trade/copy')).toBe(false);
    expect(isAppRouteEquivalent('/w/trade/orders', '/trade/orders')).toBe(false);
    expect(isAppRouteEquivalent('/w/trade/analytics', '/trade/analytics')).toBe(false);
    expect(isAppRouteEquivalent('/w/address-book', '/address-book')).toBe(false);
  });
});
