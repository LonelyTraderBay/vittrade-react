import { describe, expect, it } from 'vitest';
import {
  authRoutes,
  createProtectedRoutes,
  createPublicRoutes,
  type ShellOverrides,
} from '../routeConfig';

const Placeholder = () => null;
const shellOverrides: ShellOverrides = {
  TradePage: Placeholder,
  WalletPage: Placeholder,
  TxHistoryPage: Placeholder,
  ProfilePage: Placeholder,
  P2PHomePage: Placeholder,
  HomePage: Placeholder,
  MarketListPage: Placeholder,
  PairDetailPage: Placeholder,
};

describe('route configuration', () => {
  it('keeps the public authentication route contract stable', () => {
    expect(authRoutes.map((route) => route.path)).toEqual([
      'login',
      'register',
      'otp',
      '2fa-setup',
      'forgot-password',
      'reset-password',
    ]);
  });

  it('builds public and protected route trees with shell overrides', () => {
    const publicRoutes = createPublicRoutes(shellOverrides);
    const protectedRoutes = createProtectedRoutes(shellOverrides);

    expect(publicRoutes.map((route) => route.path)).toContain('home');
    expect(protectedRoutes.map((route) => route.path)).toContain('trade');
    expect(protectedRoutes.length).toBeGreaterThan(100);
  });

  it('puts admin routes behind an explicit role and permission boundary', () => {
    const protectedRoutes = createProtectedRoutes(shellOverrides);
    const adminBoundary = protectedRoutes.find((route) =>
      route.children?.some((child) => child.path === 'admin'),
    );
    const guardProps = (adminBoundary?.element as { props?: Record<string, unknown> } | undefined)
      ?.props;

    expect(guardProps?.requiredRoles).toEqual(['admin']);
    expect(guardProps?.requiredPermissions).toEqual(['admin:read']);
  });
});
