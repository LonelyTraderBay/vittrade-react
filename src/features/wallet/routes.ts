import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const WithdrawPage = lazyRoute(() =>
  import('./pages/WithdrawPage').then((module) => ({ default: module.WithdrawPage })),
);
const WalletTransferPage = lazyRoute(() =>
  import('./pages/WalletTransferContractPage').then((module) => ({
    default: module.WalletTransferContractPage,
  })),
);
const WalletDepositPage = lazyRoute(() =>
  import('./pages/WalletDepositContractPage').then((module) => ({
    default: module.WalletDepositContractPage,
  })),
);
const PortfolioAnalyticsPage = lazyRoute(() =>
  import('./pages/PortfolioAnalyticsContractPage').then((module) => ({
    default: module.PortfolioAnalyticsContractPage,
  })),
);
const WithdrawalWhitelistPage = lazyRoute(() =>
  import('./pages/WebWithdrawalWhitelistPage').then((module) => ({
    default: module.WebWithdrawalWhitelistPage,
  })),
);
const AddressBookPage = lazyRoute(() =>
  import('./pages/AddressBookPage').then((module) => ({ default: module.AddressBookPage })),
);
const AddressAddPage = lazyRoute(() =>
  import('./pages/AddressAddPage').then((module) => ({ default: module.AddressAddPage })),
);
const TransactionDetailPage = lazyRoute(() =>
  import('./pages/TransactionDetailPage').then((module) => ({
    default: module.TransactionDetailPage,
  })),
);
const WalletAssetDetailPage = lazyRoute(() =>
  import('./pages/AssetDetailPage').then((module) => ({
    default: module.WalletAssetDetailPage,
  })),
);
const DustConverterPage = lazyRoute(() =>
  import('./pages/DustConverterPage').then((module) => ({ default: module.DustConverterPage })),
);

/**
 * Route Wallet. The app can inject an adapter for cross-feature shell integrations such as DCA.
 */
export function createWalletRoutes(
  overrides: { assetDetail?: NonNullable<RouteObject['Component']> } = {},
): RouteObject[] {
  return [
    { path: 'wallet/transaction/:txId', Component: TransactionDetailPage },
    { path: 'wallet/asset/:assetId', Component: overrides.assetDetail ?? WalletAssetDetailPage },
    { path: 'wallet/dust-converter', Component: DustConverterPage },
    { path: 'wallet/transfer', Component: WalletTransferPage },
    { path: 'wallet/deposit', Component: WalletDepositPage },
    { path: 'wallet/deposit/:asset', Component: WalletDepositPage },
    { path: 'wallet/withdraw', Component: WithdrawPage },
    { path: 'wallet/withdraw/:asset', Component: WithdrawPage },
    { path: 'wallet/portfolio-analytics', Component: PortfolioAnalyticsPage },
    { path: 'wallet/address-book/add', Component: AddressAddPage },
    { path: 'wallet/address-book', Component: AddressBookPage },
  ];
}

/** Contract-backed pages in the web shell owned by the wallet feature. */
export function createWalletWebRoutes(): RouteObject[] {
  return [
    { path: 'portfolio/analytics', Component: PortfolioAnalyticsPage },
    { path: 'profile/security/withdrawal-whitelist', Component: WithdrawalWhitelistPage },
  ];
}
