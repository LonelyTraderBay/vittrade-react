import React from 'react';
import { P2PMarketplacePage } from '@/features/p2p/pages/P2PMarketplacePage';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';

/** App composition adapter for the P2P marketplace analytics hooks. */
export function P2PHomePage() {
  const { onAfterOpen: onQuickActionsOpen } = useSheetAnalytics('p2p-home-quick-actions');
  const { onAfterOpen: onContextMenuOpen } = useSheetAnalytics('p2p-home-context-menu');

  return (
    <P2PMarketplacePage
      onQuickActionsOpen={onQuickActionsOpen}
      onContextMenuOpen={onContextMenuOpen}
    />
  );
}
