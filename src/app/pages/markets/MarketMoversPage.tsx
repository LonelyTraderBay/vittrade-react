/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET MOVERS PAGE — P0 Enterprise Market Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Top Gainers / Top Losers / Most Active / Unusual Volume / New Listings
 *  with timeframe toggle and category filters.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, BarChart3, Zap, Sparkles,
  ChevronRight, ArrowUpRight, ArrowDownRight, Hash, ChevronDown, Check,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../components/ui/sheet';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  getTopGainers, getTopLosers, getMostActive, getUnusualVolume, getNewListings,
  type MarketMover, MARKET_MOVERS,
} from '../../data/marketOverviewData';

const TABS = ['Tăng mạnh', 'Giảm mạnh', 'Hoạt động', 'KL bất thường', 'Mới niêm yết'];
const TIMEFRAMES = ['1h', '24h', '7d'] as const;
const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'AI', 'Payment'];

/* ─── Helper: Calculate Market Cap Rank ─── */
function getMarketCapRank(mover: MarketMover): number {
  const sorted = [...MARKET_MOVERS].sort((a, b) => b.marketCap - a.marketCap);
  return sorted.findIndex(m => m.id === mover.id) + 1;
}

/* ─── Mover Row Component ─── */
const MoverRow = React.memo(function MoverRow({
  mover, rank, timeframe, showVolume, showVolumeChange,
  onClick,
}: {
  mover: MarketMover;
  rank: number;
  timeframe: '1h' | '24h' | '7d';
  showVolume?: boolean;
  showVolumeChange?: boolean;
  onClick: () => void;
}) {
  const c = useThemeColors();
  const changeKey = timeframe === '1h' ? 'change1h' : timeframe === '24h' ? 'change24h' : 'change7d';
  const change = mover[changeKey];
  const isPos = change >= 0;
  const mcapRank = getMarketCapRank(mover);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 min-h-11 w-full"
      style={{ borderBottom: `1px solid ${c.divider}` }}
    >
      {/* Rank - P0 FIX: w-6 → w-8, enhanced top 3 */}
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          fontSize: rank <= 3 ? FONT_SCALE.xs : FONT_SCALE.micro,
          fontWeight: FONT_WEIGHT.bold,
          color: rank <= 3 ? '#F59E0B' : c.text3,
          background: rank <= 3 ? 'rgba(245,158,11,0.12)' : c.surface2,
        }}
      >
        {rank}
      </span>

      {/* Logo + Name - P0 FIX: w-8 → w-9 for better proportion */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${mover.color}1F` }}
        >
          <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, color: mover.color }}>
            {mover.symbol.slice(0, 3)}
          </span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              {mover.symbol}
            </span>
            {/* P1 FIX: Market Cap Rank Badge for top 50 */}
            {mcapRank <= 50 && (
              <span
                className="px-1.5 py-0.5 rounded flex items-center gap-0.5"
                style={{
                  fontSize: 9,
                  fontWeight: FONT_WEIGHT.bold,
                  color: mcapRank <= 10 ? '#F59E0B' : '#3B82F6',
                  background: mcapRank <= 10 ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                  lineHeight: 1,
                }}
              >
                <Hash size={8} />
                {mcapRank}
              </span>
            )}
            {mover.isNew && (
              <span
                className="px-2 py-1 rounded"
                style={{
                  fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
                  color: '#8B5CF6', background: 'rgba(139,92,246,0.12)',
                }}
              >
                MỚI
              </span>
            )}
          </div>
          <span
            className="block truncate"
            style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}
          >
            {mover.name}
          </span>
        </div>
      </div>

      {/* Sparkline - P0 FIX: 48px → 64px for better readability */}
      <div style={{ width: 64, height: 28 }} className="shrink-0">
        <SparklineChart data={mover.sparkline} isPositive={isPos} />
      </div>

      {/* Price + Change - P0 FIX: minWidth 80 → 90 for better spacing */}
      <div className="text-right shrink-0" style={{ minWidth: 90 }}>
        <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
          {fmtPrice(mover.price)}
        </p>
        {showVolumeChange ? (
          <div className="flex items-center justify-end gap-1">
            <ArrowUpRight size={12} color="#F59E0B" />
            <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, color: '#F59E0B', fontFamily: 'monospace' }}>
              {fmtPct(mover.volumeChange24h)} KL
            </span>
          </div>
        ) : showVolume ? (
          <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, fontFamily: 'monospace' }}>
            {fmtCompact(mover.volume24h, { prefix: '$' })}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
              color: isPos ? '#10B981' : '#EF4444',
            }}
          >
            {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {fmtPct(Math.abs(change))}
          </span>
        )}
      </div>
    </button>
  );
});

/* ─── New Listing Card ─── */
function NewListingCard({ mover, onClick }: { mover: MarketMover; onClick: () => void }) {
  const c = useThemeColors();
  const isPos = mover.change24h >= 0;

  return (
    <TrCard
      as="button"
      hover
      className="p-4 min-h-11"
      accentBorder="rgba(139,92,246,0.2)"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${mover.color}1F` }}
        >
          <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, color: mover.color }}>
            {mover.symbol.slice(0, 3)}
          </span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              {mover.symbol}
            </span>
            <Sparkles size={12} color="#8B5CF6" />
          </div>
          <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>{mover.name}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
          {fmtPrice(mover.price)}
        </span>
        <span
          className="rounded-lg px-2 py-1 min-h-9"
          style={{
            fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
            color: isPos ? '#10B981' : '#EF4444',
            background: isPos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          }}
        >
          {isPos ? '+' : ''}{fmtPct(mover.change24h)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
          KL: {fmtCompact(mover.volume24h, { prefix: '$' })}
        </span>
        <span style={{ fontSize: FONT_SCALE.micro, color: '#8B5CF6' }}>
          Niêm yết: {mover.listingDate}
        </span>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function MarketMoversPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [tab, setTab] = useState(TABS[0]);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [category, setCategory] = useState('Tất cả');
  
  // P1 FIX: Live update indicator (simulated 30s refresh)
  const [lastUpdate, setLastUpdate] = useState(0);
  
  // P2 FIX: Enhanced UI states
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showLiveSheet, setShowLiveSheet] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'volume' | 'marketcap'>('default');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(prev => prev + 1);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const movers = useMemo(() => {
    let list: MarketMover[];
    switch (tab) {
      case 'Tăng mạnh': list = getTopGainers(timeframe, 20); break;
      case 'Giảm mạnh': list = getTopLosers(timeframe, 20); break;
      case 'Hoạt động': list = getMostActive(20); break;
      case 'KL bất thường': list = getUnusualVolume(20); break;
      case 'Mới niêm yết': list = getNewListings(); break;
      default: list = getTopGainers(timeframe, 20);
    }

    if (category !== 'Tất cả') {
      list = list.filter(m => m.category === category);
    }

    // P2 FIX: Apply manual sorting
    if (sortBy === 'volume') {
      list = [...list].sort((a, b) => b.volume24h - a.volume24h);
    } else if (sortBy === 'marketcap') {
      list = [...list].sort((a, b) => b.marketCap - a.marketCap);
    }

    return list;
  }, [tab, timeframe, category, sortBy]);

  const tabIcon = (t: string) => {
    switch (t) {
      case 'Tăng mạnh': return <TrendingUp size={12} />;
      case 'Giảm mạnh': return <TrendingDown size={12} />;
      case 'Hoạt động': return <BarChart3 size={12} />;
      case 'KL bất thường': return <Zap size={12} />;
      case 'Mới niêm yết': return <Sparkles size={12} />;
      default: return null;
    }
  };

  const handlePairClick = (mover: MarketMover) => {
    const pairId = `${mover.id.toLowerCase()}usdt`;
    navigate(`${prefix}/pair/${pairId}`);
  };

  return (
    <PageLayout>
      <Header title="Biến động thị trường" back />

      {/* Tab Bar */}
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => { setTab(t); hapticSelection(); }}
        variant="pill"
      />

      <PageContent padding="compact" gap="default">

        {/* Timeframe (hide for new listings) */}
        {tab !== 'Mới niêm yết' && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3, fontWeight: FONT_WEIGHT.medium }}>
              Khung thời gian:
            </span>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => { setTimeframe(tf); hapticSelection(); }}
                className="px-3 py-2 rounded-xl min-h-9"
                style={{
                  fontSize: FONT_SCALE.xs,
                  fontWeight: timeframe === tf ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                  background: timeframe === tf ? c.chipActiveBg : c.surface2,
                  color: timeframe === tf ? c.chipActiveText : c.text2,
                  border: timeframe === tf 
                    ? `2px solid ${c.chipActiveBorder}` 
                    : `1.5px solid ${c.borderSolid}`,
                  boxShadow: timeframe === tf 
                    ? '0 1px 3px rgba(59,130,246,0.15)' 
                    : 'none',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        )}

        {/* Category filter - P2 FIX: Replace horizontal scroll with dropdown */}
        <button
          onClick={() => { setShowCategorySheet(true); hapticSelection(); }}
          className="flex items-center justify-between px-4 py-3 rounded-xl min-h-11"
          style={{
            background: c.surface2,
            border: `1px solid ${c.borderSolid}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, color: c.text3 }}>
              Danh mục:
            </span>
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              {category}
            </span>
          </div>
          <ChevronDown size={16} color={c.text3} />
        </button>

        {/* P2 FIX: Sorting controls */}
        {tab !== 'Mới niêm yết' && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3, fontWeight: FONT_WEIGHT.medium }}>
              Sắp xếp:
            </span>
            {[
              { id: 'default', label: tab === 'Hoạt động' ? 'Khối lượng' : '% Thay đổi' },
              { id: 'volume', label: 'Khối lượng' },
              { id: 'marketcap', label: 'Market Cap' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => { setSortBy(s.id as any); hapticSelection(); }}
                className="px-3 py-2 rounded-xl min-h-9"
                style={{
                  fontSize: FONT_SCALE.xs,
                  fontWeight: sortBy === s.id ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                  background: sortBy === s.id ? c.chipActiveBg : c.surface2,
                  color: sortBy === s.id ? c.chipActiveText : c.text2,
                  border: sortBy === s.id 
                    ? `2px solid ${c.chipActiveBorder}` 
                    : `1.5px solid ${c.borderSolid}`,
                  boxShadow: sortBy === s.id 
                    ? '0 1px 3px rgba(59,130,246,0.15)' 
                    : 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              {movers.length} kết quả
            </span>
            {/* P1 FIX: Live indicator with pulse animation */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <div 
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#10B981',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
              <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, color: '#10B981' }}>
                LIVE
              </span>
            </div>
          </div>
          {tab !== 'Mới niêm yết' && tab !== 'KL bất thường' && (
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
              Sắp xếp theo {tab === 'Hoạt động' ? 'khối lượng' : `% thay đổi ${timeframe}`}
            </span>
          )}
        </div>

        {/* Movers List */}
        {tab === 'Mới niêm yết' ? (
          <div className="flex flex-col gap-3">
            {movers.length === 0 ? (
              <TrCard className="p-6 flex flex-col items-center gap-2">
                <Sparkles size={24} color={c.text3} />
                <span style={{ fontSize: FONT_SCALE.sm, color: c.text2 }}>
                  Không có coin mới trong danh mục này
                </span>
              </TrCard>
            ) : (
              movers.map(m => (
                <NewListingCard key={m.id} mover={m} onClick={() => handlePairClick(m)} />
              ))
            )}
          </div>
        ) : (
          <TrCard className="px-3">
            {movers.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2">
                <BarChart3 size={24} color={c.text3} />
                <span style={{ fontSize: FONT_SCALE.sm, color: c.text2 }}>
                  Không có kết quả phù hợp
                </span>
              </div>
            ) : (
              movers.map((m, i) => (
                <MoverRow
                  key={m.id}
                  mover={m}
                  rank={i + 1}
                  timeframe={timeframe}
                  showVolume={tab === 'Hoạt động'}
                  showVolumeChange={tab === 'KL bất thường'}
                  onClick={() => handlePairClick(m)}
                />
              ))
            )}
          </TrCard>
        )}

        {/* Summary footer */}
        {movers.length > 0 && (
          <div className="flex items-center justify-center py-2 gap-2">
            <div className="w-8 h-px" style={{ background: c.borderSolid }} />
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
              Dữ liệu cập nhật mỗi 30 giây
            </span>
            <div className="w-8 h-px" style={{ background: c.borderSolid }} />
          </div>
        )}
      </PageContent>

      {/* P2 FIX: Category Selection Sheet */}
      <Sheet open={showCategorySheet} onOpenChange={setShowCategorySheet}>
        <SheetContent side="bottom" className="p-0">
          <SheetHeader className="p-5 pb-3">
            <SheetTitle style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              Chọn danh mục
            </SheetTitle>
            <SheetDescription style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Lọc coin theo danh mục blockchain
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6 flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setShowCategorySheet(false);
                  hapticSelection();
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl min-h-11"
                style={{
                  background: category === cat ? c.chipActiveBg : c.surface2,
                  border: `1px solid ${category === cat ? c.chipActiveBorder : c.borderSolid}`,
                }}
              >
                <span style={{
                  fontSize: FONT_SCALE.sm,
                  fontWeight: category === cat ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                  color: category === cat ? c.chipActiveText : c.text1,
                }}>
                  {cat}
                </span>
                {category === cat && <Check size={16} color={c.chipActiveText} />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* P2 FIX: Live Info Sheet (future: show timestamp) */}
      <Sheet open={showLiveSheet} onOpenChange={setShowLiveSheet}>
        <SheetContent side="bottom" className="p-0">
          <SheetHeader className="p-5 pb-3">
            <SheetTitle style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              Thông tin cập nhật
            </SheetTitle>
            <SheetDescription style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Dữ liệu giá và khối lượng thời gian thực
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6">
            <TrCard className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: '#10B981',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 4 }}>
                    Dữ liệu thời gian thực
                  </p>
                  <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                    Giá và khối lượng được cập nhật mỗi 30 giây từ các sàn giao dịch hàng đầu.
                  </p>
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Cập nhật lần cuối:</span>
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                        Vài giây trước
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Cập nhật tiếp theo:</span>
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: '#10B981' }}>
                        {30 - (lastUpdate % 30)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TrCard>
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}