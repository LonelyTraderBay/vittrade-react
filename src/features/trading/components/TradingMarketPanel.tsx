import { useNavigate } from 'react-router';
import { ArrowLeftRight, BarChart3, Briefcase, ChevronDown, Repeat, Settings } from 'lucide-react';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { φ, φIcon } from '@/shared/lib/golden';
import { MiniChart } from './MiniChart';
import { OrderBook } from './OrderBook';
import { RecentTrades } from './RecentTrades';
import type { MarketPair } from '@/features/market';

const DATA_TABS = [
  { id: 'chart', label: 'Chart' },
  { id: 'orderbook', label: 'Sổ lệnh' },
  { id: 'trades', label: 'Giao dịch' },
] as const;

type MarketDataTab = (typeof DATA_TABS)[number]['id'];

interface TradingMarketPanelProps {
  pair: Pick<MarketPair, 'id' | 'symbol' | 'baseAsset' | 'change24h' | 'logoColor'>;
  livePrice: number;
  flash: 'up' | 'down' | null;
  isPositive: boolean;
  dataTab: MarketDataTab;
  onDataTabChange: (tab: MarketDataTab) => void;
  onOpenPairSwitcher: () => void;
}

export function TradingMarketPanel({
  pair,
  livePrice,
  flash,
  isPositive,
  dataTab,
  onDataTabChange,
  onOpenPairSwitcher,
}: TradingMarketPanelProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  return (
    <>
      {/* ═══ Row 1: Pair Selector + Live Price ═══ */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <button
          onClick={() => onOpenPairSwitcher()}
          className="flex items-center gap-3 hover-ghost"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: pair.logoColor + '22' }}
          >
            <span style={{ color: pair.logoColor, fontSize: φ.xs, fontWeight: 700 }}>
              {pair.baseAsset.slice(0, 3)}
            </span>
          </div>
          <span style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, letterSpacing: -0.3 }}>
            {pair.symbol}
          </span>
          <ChevronDown size={φIcon.sm} color={c.text2} />
        </button>

        <div className="text-right">
          <p
            style={{
              color:
                flash === 'up'
                  ? '#10B981'
                  : flash === 'down'
                    ? '#EF4444'
                    : isPositive
                      ? '#10B981'
                      : '#EF4444',
              fontSize: φ.md,
              fontWeight: 700,
              fontFamily: 'monospace',
              lineHeight: 1.2,
              transition: 'color 0.3s',
            }}
          >
            {fmtPrice(livePrice)}
          </p>
          <p
            style={{
              color: isPositive ? '#10B981' : '#EF4444',
              fontSize: φ.xs,
              fontFamily: 'monospace',
            }}
          >
            {fmtPct(pair.change24h)}
          </p>
        </div>
      </div>

      {/* ═══ Row 2: Quick Nav Chips ═══ */}
      <div
        className="flex items-center gap-2 px-5 py-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <button
          onClick={() => navigate(`${routePrefix}/trade/convert`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <ArrowLeftRight size={φIcon.sm} color="#10B981" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Convert</span>
        </button>
        <button
          onClick={() => {
            navigate(`${routePrefix}/dca`, { state: { preselectedCoin: pair.baseAsset } });
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}
        >
          <Repeat size={φIcon.sm} color="#8B5CF6" />
          <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Mua định kỳ</span>
        </button>
        <button
          onClick={() => navigate(`${routePrefix}/trade/${pair.id}/futures`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <BarChart3 size={φIcon.sm} color="#EF4444" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Futures</span>
        </button>
        <button
          onClick={() => navigate(`${routePrefix}/trade/positions`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <Briefcase size={φIcon.sm} color="#3B82F6" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Vị thế</span>
        </button>
        <button
          onClick={() => navigate(`${routePrefix}/trade/settings`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <Settings size={φIcon.sm} color={c.text3} />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Cài đặt</span>
        </button>
      </div>

      {/* ═══ Data View Tabs: Chart / OrderBook / Trades (Sprint 2A) ═══ */}
      <div className="px-5 pt-1 pb-2">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: c.surface2 }}>
          {DATA_TABS.map((dt) => (
            <button
              key={dt.id}
              onClick={() => {
                onDataTabChange(dt.id);
                hapticSelection();
              }}
              className="flex-1 py-1.5 rounded-md text-center transition-all"
              style={{
                background: dataTab === dt.id ? c.bg : 'transparent',
                color: dataTab === dt.id ? c.text1 : c.text3,
                fontSize: 12,
                fontWeight: dataTab === dt.id ? 700 : 500,
                boxShadow: dataTab === dt.id ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data view content */}
      <div className="px-5 pb-3" style={{ minHeight: dataTab === 'chart' ? 'auto' : 280 }}>
        {dataTab === 'chart' && (
          <MiniChart
            pairId={pair.id}
            height={120}
            showVolume={true}
            showCurrentPrice={true}
            interactive={true}
          />
        )}
        {dataTab === 'orderbook' && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: c.surface2, maxHeight: 320 }}
          >
            <OrderBook pairId={pair.id} price={livePrice} change24h={pair.change24h} />
          </div>
        )}
        {dataTab === 'trades' && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: c.surface2, maxHeight: 320 }}
          >
            <RecentTrades pairId={pair.id} maxRows={15} />
          </div>
        )}
      </div>
    </>
  );
}
