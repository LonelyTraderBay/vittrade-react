import type { ReactNode } from 'react';
import { Search, Shield } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { P2PAd } from '../model/p2p-types';
import { SwipeableAdCard } from './P2PHomeCards';

/** Results-only boundary; query state and controls remain owned by the page/sections. */
export function P2PMarketplaceResults({
  ads,
  tab,
  sortLabel,
  resultsFeedback,
  resultsBusy,
  prefix,
  onContextMenu,
  onQuickAction,
}: {
  ads: P2PAd[];
  tab: 'buy' | 'sell';
  sortLabel?: string;
  resultsFeedback?: ReactNode;
  resultsBusy: boolean;
  prefix: string;
  onContextMenu: (ad: P2PAd) => void;
  onQuickAction: (ad: P2PAd, type: 'buy' | 'sell') => void;
}) {
  const c = useThemeColors();
  return (
    <div
      role="region"
      aria-label="Kết quả offer P2P"
      aria-busy={resultsBusy}
      className="flex flex-col gap-4"
    >
      {resultsFeedback ?? (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: 11 }}>
              {`${ads.length} offer`}
              {sortLabel && (
                <span style={{ color: c.text3 }}>
                  {' · '}
                  {sortLabel}
                </span>
              )}
            </span>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md"
              style={{ background: c.surface2 }}
            >
              <Shield size={9} color={c.success} />
              <span style={{ color: c.successText, fontSize: 9, fontWeight: 600 }}>Escrow</span>
            </div>
          </div>

          {/* Ads List */}
          <div className="flex flex-col gap-2.5">
            {ads.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Không tìm thấy offer"
                subtitle="Thử thay đổi bộ lọc hoặc tài sản"
              />
            ) : (
              ads.map((ad, i) => (
                <SwipeableAdCard
                  key={ad.id}
                  ad={ad}
                  tradeType={tab}
                  prefix={prefix}
                  index={i}
                  onContextMenu={onContextMenu}
                  onQuickAction={onQuickAction}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
