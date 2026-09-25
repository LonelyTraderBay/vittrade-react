import { describe, expect, it } from 'vitest';
import { createWalletRoutes, createWalletWebRoutes } from './routes';

describe('Wallet feature routes', () => {
  it('owns the contract-backed wallet flows', () => {
    expect(createWalletRoutes().map((route) => route.path)).toEqual([
      'wallet/transaction/:txId',
      'wallet/asset/:assetId',
      'wallet/dust-converter',
      'wallet/transfer',
      'wallet/deposit',
      'wallet/deposit/:asset',
      'wallet/withdraw',
      'wallet/withdraw/:asset',
      'wallet/portfolio-analytics',
      'wallet/address-book/add',
      'wallet/address-book',
    ]);
  });

  it('uses an app-provided asset detail adapter when supplied', () => {
    const assetDetail = () => null;
    const assetDetailRoute = createWalletRoutes({ assetDetail }).find(
      (route) => route.path === 'wallet/asset/:assetId',
    );

    expect(assetDetailRoute?.Component).toBe(assetDetail);
  });

  it('keeps the web wallet aliases stable', () => {
    expect(createWalletWebRoutes().map((route) => route.path)).toEqual([
      'portfolio/analytics',
      'profile/security/withdrawal-whitelist',
    ]);
  });
});
