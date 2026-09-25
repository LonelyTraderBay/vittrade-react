import { lazy, type ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from '../config/env';
import { IntegrationPendingPage } from '../pages/system/IntegrationPendingPage';
import { createWalletRoutes } from '@/features/wallet/routes';
import { createProfileRoutes } from '@/features/profile/routes';

const BuyCryptoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/BuyCryptoPage').then((module) => ({
        default: module.BuyCryptoPage,
      })),
    )
  : IntegrationPendingPage;
const AssetDetailPage = lazy(() =>
  import('../pages/wallet/AssetDetailPage').then((module) => ({ default: module.AssetDetailPage })),
);
const WalletMultiManagerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/WalletMultiManagerPage').then((module) => ({
        default: module.WalletMultiManagerPage,
      })),
    )
  : IntegrationPendingPage;
const WalletGasOptimizerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/WalletGasOptimizerPage').then((module) => ({
        default: module.WalletGasOptimizerPage,
      })),
    )
  : IntegrationPendingPage;
const WalletTokenApprovalPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/WalletTokenApprovalPage').then((module) => ({
        default: module.WalletTokenApprovalPage,
      })),
    )
  : IntegrationPendingPage;
const WalletHealthScorePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/WalletHealthScorePage').then((module) => ({
        default: module.WalletHealthScorePage,
      })),
    )
  : IntegrationPendingPage;
const PendingDepositsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/PendingDepositsPage').then((module) => ({
        default: module.PendingDepositsPage,
      })),
    )
  : IntegrationPendingPage;
const WithdrawLimitsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/WithdrawLimitsPage').then((module) => ({
        default: module.WithdrawLimitsPage,
      })),
    )
  : IntegrationPendingPage;
const NetworkStatusPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/wallet/NetworkStatusPage').then((module) => ({
        default: module.NetworkStatusPage,
      })),
    )
  : IntegrationPendingPage;

const KYCPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/profile/KYCPage').then((module) => ({ default: module.KYCPage })),
    )
  : IntegrationPendingPage;
const SettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/profile/SettingsPage').then((module) => ({
        default: module.SettingsPage,
      })),
    )
  : IntegrationPendingPage;
const ApiManagementPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/profile/ApiManagementPage').then((module) => ({
        default: module.ApiManagementPage,
      })),
    )
  : IntegrationPendingPage;
const ApiKeyCreatePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/profile/ApiKeyCreatePage').then((module) => ({
        default: module.ApiKeyCreatePage,
      })),
    )
  : IntegrationPendingPage;
const VIPPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/profile/VIPPage').then((module) => ({ default: module.VIPPage })),
    )
  : IntegrationPendingPage;

export interface WalletProfileRouteOverrides {
  WalletPage: ComponentType;
  TxHistoryPage: ComponentType;
  ProfilePage: ComponentType;
}

export function createWalletProfileProtectedRoutes(
  overrides: WalletProfileRouteOverrides,
): RouteObject[] {
  return [
    { path: 'wallet', Component: overrides.WalletPage },
    { path: 'wallet/history', Component: overrides.TxHistoryPage },
    { path: 'wallet/buy-crypto', Component: BuyCryptoPage },
    { path: 'wallet/multi-manager', Component: WalletMultiManagerPage },
    { path: 'wallet/gas-optimizer', Component: WalletGasOptimizerPage },
    { path: 'wallet/token-approval', Component: WalletTokenApprovalPage },
    { path: 'wallet/health-score', Component: WalletHealthScorePage },
    { path: 'wallet/pending-deposits', Component: PendingDepositsPage },
    { path: 'wallet/limits', Component: WithdrawLimitsPage },
    { path: 'wallet/network-status', Component: NetworkStatusPage },
    ...createWalletRoutes({ assetDetail: AssetDetailPage }),
    { path: 'profile', Component: overrides.ProfilePage },
    { path: 'profile/kyc', Component: KYCPage },
    { path: 'profile/settings', Component: SettingsPage },
    { path: 'profile/api/create', Component: ApiKeyCreatePage },
    { path: 'profile/api', Component: ApiManagementPage },
    { path: 'profile/vip', Component: VIPPage },
    ...createProfileRoutes(),
  ];
}
