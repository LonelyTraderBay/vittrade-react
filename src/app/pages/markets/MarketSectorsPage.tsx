/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET SECTORS PAGE — P0 Enterprise Market Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Sector performance overview, sector detail with coin list,
 *  sector comparison, historical performance.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  TrendingUp, TrendingDown, ChevronRight, ChevronLeft,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Layers,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { MARKET_SECTORS, getSectorCoins, type MarketSector } from '../../data/marketOverviewData';
import { HEATMAP_COINS } from '../../data/mockData';

const SORT_OPTIONS = ['Hiệu suất 24h', 'Vốn hóa', 'Số coin'];
const TIMEFRAMES = ['24h', '7d', '30d'] as const;

/* ─── Sector Performance Card ─── */
function SectorCard({
  sector, timeframe, onClick,
}: {
  sector: MarketSector;
  timeframe: '24h' | '7d' | '30d';
  onClick: () => void;
}) {
  const c = useThemeColors();
  const change = timeframe === '24h' ? sector.change24h : timeframe === '7d' ? sector.change7d : sector.change30d;
  const isPos = change >= 0;

  return (
    <TrCard as="button" hover className="p-4" onClick={onClick}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${sector.color}15` }}
        >
          <span style={{ fontSize: 18 }}>{sector.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            {sector.nameVi}
          </p>
          <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
            {sector.coinCount} coins
          </p>
        </div>
        <div className="text-right">
          <span
            className="rounded-lg px-2 py-1 inline-flex items-center gap-1"
            style={{
              fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold,
              color: isPos ? '#10B981' : '#EF4444',
              background: isPos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            }}
          >
            {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {fmtPct(Math.abs(change))}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Vốn hóa</span>
        <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
          {fmtCompact(sector.totalMarketCap, { prefix: '$' })}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>KL 24h</span>
        <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
          {fmtCompact(sector.volume24h, { prefix: '$' })}
        </span>
      </div>

      {/* Mini dominance bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: c.surface2 }}>
          <div
            className="rounded-full"
            style={{ width: `${Math.min(sector.dominance * 3, 100)}%`, height: '100%', background: sector.color }}
          />
        </div>
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
          {sector.dominance}% dominance
        </span>
      </div>

      {/* Top coins */}
      <div className="flex gap-1 mt-3">
        {sector.topCoins.slice(0, 4).map(coin => (
          <span
            key={coin}
            className="px-2 py-0.5 rounded-md"
            style={{ fontSize: 10, fontWeight: FONT_WEIGHT.semibold, color: c.text2, background: c.surface2 }}
          >
            {coin}
          </span>
        ))}
        {sector.topCoins.length > 4 && (
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ fontSize: 10, color: c.text3, background: c.surface2 }}
          >
            +{sector.topCoins.length - 4}
          </span>
        )}
      </div>
    </TrCard>
  );
}

/* ─── Sector Detail View ─── */
function SectorDetailView({
  sector, onBack,
}: {
  sector: MarketSector;
  onBack: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const coins = getSectorCoins(sector.id);

  const sortedCoins = useMemo(() => {
    return [...coins].sort((a, b) => b.marketCap - a.marketCap);
  }, [coins]);

  return (
    <PageLayout>
      <Header title={sector.nameVi} back />
      <PageContent gap="default">

        {/* Sector Hero */}
        <TrCard variant="hero" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${sector.color}20` }}
            >
              <span style={{ fontSize: 24 }}>{sector.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                {sector.nameVi}
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                {sector.coinCount} coin · {sector.dominance}% thị trường
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '24h', value: sector.change24h },
              { label: '7 ngày', value: sector.change7d },
              { label: '30 ngày', value: sector.change30d },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2 text-center" style={{ background: c.portfolioBtnGhost }}>
                <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>{item.label}</p>
                <p style={{
                  fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold,
                  color: item.value >= 0 ? '#10B981' : '#EF4444',
                  fontFamily: 'monospace',
                }}>
                  {item.value >= 0 ? '+' : ''}{fmtPct(item.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Tổng vốn hóa</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtCompact(sector.totalMarketCap, { prefix: '$' })}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>KL 24h</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtCompact(sector.volume24h, { prefix: '$' })}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Sector Coins */}
        <PageSection label={`Coin trong ngành ${sector.nameVi}`} accentColor={sector.color}>
          <TrCard className="px-3">
            {/* Column header */}
            <div className="flex items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, flex: 1 }}>#  Tên</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 72, textAlign: 'right' }}>Giá</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 56, textAlign: 'right' }}>24h</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 56, textAlign: 'right' }}>7d</span>
            </div>

            {sortedCoins.length === 0 ? (
              <div className="py-6 text-center">
                <span style={{ fontSize: FONT_SCALE.sm, color: c.text3 }}>Chưa có dữ liệu</span>
              </div>
            ) : (
              sortedCoins.map((coin, i) => {
                const isPos24 = coin.change24h >= 0;
                const isPos7d = coin.change7d >= 0;

                return (
                  <button
                    key={coin.id}
                    onClick={() => navigate(`${prefix}/pair/${coin.id}usdt`)}
                    className="flex items-center py-3 w-full"
                    style={{ borderBottom: `1px solid ${c.divider}` }}
                  >
                    <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 16 }}>{i + 1}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 ml-1">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${coin.color}18` }}
                      >
                        <span style={{ fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: coin.color }}>
                          {coin.symbol.slice(0, 3)}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                          {coin.symbol}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace', width: 72, textAlign: 'right' }}>
                      {fmtPrice(coin.price)}
                    </span>
                    <span style={{
                      fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                      color: isPos24 ? '#10B981' : '#EF4444', width: 56, textAlign: 'right',
                    }}>
                      {isPos24 ? '+' : ''}{fmtPct(coin.change24h)}
                    </span>
                    <span style={{
                      fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                      color: isPos7d ? '#10B981' : '#EF4444', width: 56, textAlign: 'right',
                    }}>
                      {isPos7d ? '+' : ''}{fmtPct(coin.change7d)}
                    </span>
                  </button>
                );
              })
            )}
          </TrCard>
        </PageSection>

        {/* Top coins */}
        <PageSection label="Top coin theo vốn hóa" accentColor={sector.color}>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
            {sector.topCoins.map(coin => {
              const data = HEATMAP_COINS.find(c => c.symbol === coin);
              if (!data) return null;
              const isPos = data.change24h >= 0;

              return (
                <TrCard
                  key={coin}
                  as="button"
                  hover
                  className="p-3 shrink-0"
                  style={{ minWidth: 120 }}
                  onClick={() => navigate(`${prefix}/pair/${data.id}usdt`)}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `${data.color}18` }}
                    >
                      <span style={{ fontSize: 8, fontWeight: FONT_WEIGHT.bold, color: data.color }}>
                        {data.symbol.slice(0, 3)}
                      </span>
                    </div>
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                      {data.symbol}
                    </span>
                  </div>
                  <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtPrice(data.price)}
                  </p>
                  <p style={{
                    fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
                    color: isPos ? '#10B981' : '#EF4444',
                  }}>
                    {isPos ? '+' : ''}{fmtPct(data.change24h)}
                  </p>
                </TrCard>
              );
            })}
          </div>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}

/* ════════════════════════════════════════��══════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function MarketSectorsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSectorId = searchParams.get('id');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);

  const selectedSector = selectedSectorId ? MARKET_SECTORS.find(s => s.id === selectedSectorId) : null;

  const sortedSectors = useMemo(() => {
    const changeKey = timeframe === '24h' ? 'change24h' : timeframe === '7d' ? 'change7d' : 'change30d';
    let sectors = [...MARKET_SECTORS];

    switch (sortBy) {
      case 'Hiệu suất 24h':
        sectors.sort((a, b) => b[changeKey] - a[changeKey]);
        break;
      case 'Vốn hóa':
        sectors.sort((a, b) => b.totalMarketCap - a.totalMarketCap);
        break;
      case 'Số coin':
        sectors.sort((a, b) => b.coinCount - a.coinCount);
        break;
    }

    return sectors;
  }, [timeframe, sortBy]);

  // If a sector is selected, show detail view
  if (selectedSector) {
    return (
      <SectorDetailView
        sector={selectedSector}
        onBack={() => setSearchParams({})}
      />
    );
  }

  // Sector heatmap summary
  const totalMarketCap = MARKET_SECTORS.reduce((sum, s) => sum + s.totalMarketCap, 0);

  return (
    <PageLayout>
      <Header title="Ngành thị trường" back />
      <PageContent gap="default">

        {/* Sector Heatmap Mini */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={14} color="#8B5CF6" />
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
              Phân bổ vốn hóa theo ngành
            </span>
          </div>

          {/* Horizontal stacked bar */}
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ height: 20 }}>
            {MARKET_SECTORS.map(sector => {
              const pct = (sector.totalMarketCap / totalMarketCap) * 100;
              if (pct < 1) return null;
              return (
                <div
                  key={sector.id}
                  style={{
                    width: `${pct}%`,
                    background: sector.color,
                    opacity: 0.75,
                    minWidth: 2,
                  }}
                  title={`${sector.nameVi}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {MARKET_SECTORS.filter(s => (s.totalMarketCap / totalMarketCap) * 100 >= 1).map(sector => (
              <div key={sector.id} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: sector.color }} />
                <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
                  {sector.name} {((sector.totalMarketCap / totalMarketCap) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Timeframe + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => { setTimeframe(tf); hapticSelection(); }}
                className="px-3 py-2 rounded-xl min-h-9"
                style={{
                  fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
                  background: timeframe === tf ? c.chipActiveBg : c.chipBg,
                  color: timeframe === tf ? c.chipActiveText : c.chipText,
                  border: `1px solid ${timeframe === tf ? c.chipActiveBorder : c.chipBorder}`,
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { setSortBy(opt); hapticSelection(); }}
                className="px-2 py-1 rounded-lg"
                style={{
                  fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium,
                  color: sortBy === opt ? '#3B82F6' : c.text3,
                  background: sortBy === opt ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Cards Grid */}
        <div className="flex flex-col gap-3">
          {sortedSectors.map(sector => (
            <SectorCard
              key={sector.id}
              sector={sector}
              timeframe={timeframe}
              onClick={() => {
                hapticSelection();
                setSearchParams({ id: sector.id });
              }}
            />
          ))}
        </div>

        {/* Sector Comparison Summary */}
        <PageSection label="So sánh nhanh" accentColor="#3B82F6">
          <TrCard className="px-3">
            {/* Column header */}
            <div className="flex items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, flex: 1 }}>Ngành</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 52, textAlign: 'right' }}>24h</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 52, textAlign: 'right' }}>7d</span>
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, width: 52, textAlign: 'right' }}>30d</span>
            </div>

            {sortedSectors.map(sector => (
              <button
                key={sector.id}
                onClick={() => { setSearchParams({ id: sector.id }); hapticSelection(); }}
                className="flex items-center py-2.5 w-full"
                style={{ borderBottom: `1px solid ${c.divider}` }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span style={{ fontSize: 14 }}>{sector.icon}</span>
                  <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                    {sector.name}
                  </span>
                </div>
                {[sector.change24h, sector.change7d, sector.change30d].map((val, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
                      color: val >= 0 ? '#10B981' : '#EF4444',
                      width: 52, textAlign: 'right',
                    }}
                  >
                    {val >= 0 ? '+' : ''}{fmtPct(val)}
                  </span>
                ))}
              </button>
            ))}
          </TrCard>
        </PageSection>

        {/* Footer */}
        <div className="flex items-center justify-center py-2 gap-2">
          <div className="w-8 h-px" style={{ background: c.borderSolid }} />
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
            {MARKET_SECTORS.length} ngành · Dữ liệu cập nhật liên tục
          </span>
          <div className="w-8 h-px" style={{ background: c.borderSolid }} />
        </div>
      </PageContent>
    </PageLayout>
  );
}