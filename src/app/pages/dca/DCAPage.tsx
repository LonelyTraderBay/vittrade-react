import { DCAMainPage } from '@/features/dca/pages/DCAMainPage';
import { env } from '@/shared/config/env';
import {
  useAssetToCreationFunnel,
  useDCAAnalytics,
  usePageViewTracking,
  useWalletToCreationFunnel,
} from '@/features/dca';
import { useDCAEnabled } from '../../hooks/useFeatureFlag';

/** App composition adapter for DCA feature flags, analytics and funnel tracking. */
export function DCAPage() {
  const isEnabled = useDCAEnabled();
  const analytics = useDCAAnalytics();
  const walletFunnel = useWalletToCreationFunnel();
  const assetFunnel = useAssetToCreationFunnel();
  usePageViewTracking('dca_page');

  return (
    <DCAMainPage
      isEnabled={isEnabled}
      isDevelopment={env.isDev}
      analytics={{
        trackEvent: analytics.trackEvent,
        trackDeepLink: analytics.trackDeepLink,
        trackPlanCreation: analytics.trackPlanCreation,
        trackPlanStatusChange: analytics.trackPlanStatusChange,
        trackPlanDeletion: analytics.trackPlanDeletion,
      }}
      funnels={{
        trackWalletPageView: walletFunnel.trackDCAPageView,
        trackWalletCreateSheetOpened: walletFunnel.trackCreateSheetOpened,
        trackAssetCreateSheetOpened: assetFunnel.trackCreateSheetOpened,
        trackPreselectedCoinUsed: assetFunnel.trackPreselectedCoinUsed,
      }}
    />
  );
}

export default DCAPage;
