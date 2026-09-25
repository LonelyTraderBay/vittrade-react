import React, { useCallback } from 'react';
import { WalletAssetDetailPage } from '@/features/wallet/pages/AssetDetailPage';
import { useAssetToCreationFunnel, useDCAAnalytics } from '@/features/dca';
import { useDCAAssetDetailButton } from '../../hooks/useFeatureFlag';

/** App composition adapter for the Wallet page's DCA feature-flag and analytics integration. */
export function AssetDetailPage() {
  const showDCAButton = useDCAAssetDetailButton();
  const { trackAssetDetailButton } = useDCAAnalytics();
  const { trackButtonImpression, trackButtonClick } = useAssetToCreationFunnel();

  const onDCAImpression = useCallback(
    (symbol: string) => {
      trackButtonImpression();
      trackAssetDetailButton('impression', symbol);
    },
    [trackButtonImpression, trackAssetDetailButton],
  );
  const onDCAButtonClick = useCallback(
    (symbol: string) => {
      trackButtonClick();
      trackAssetDetailButton('click', symbol);
    },
    [trackButtonClick, trackAssetDetailButton],
  );

  return (
    <WalletAssetDetailPage
      showDCAButton={showDCAButton}
      onDCAImpression={onDCAImpression}
      onDCAButtonClick={onDCAButtonClick}
    />
  );
}
