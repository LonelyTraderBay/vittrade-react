/**
 * ══════════════════════════════════════════════════════════════════
 *  DERIVATIVES OVERVIEW PAGE — P1 Futures/Perp Market Intel
 * ══════════════════════════════════════════════════════════════════
 *  Open interest, funding rates, long/short ratios, liquidation
 *  data, top perpetual pairs. Route: /markets/derivatives
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowUpRight, ArrowDownRight,
  BarChart3, Activity, AlertTriangle,
  Zap, Scale,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  DERIVATIVE_PAIRS, DERIVATIVES_GLOBAL_STATS, LIQUIDATION_HISTORY,
  type DerivativePair,
} from '../../data/marketP1Data';

const TABS = ['Tổng quan', 'Perpetual', 'Thanh lý'];
const SORT_OPTIONS = ['OI', 'Volume', 'Funding', 'Thay đổi'];

export function DerivativesOverviewPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState('Tổng quan');
  const [sortBy, setSortBy] = useState('OI');

  const stats = DERIVATIVES_GLOBAL_STATS;

  const sortedPairs = useMemo(() => {
    const items = [...DERIVATIVE_PAIRS];
    switch (sortBy) {
      case 'OI': return items.sort((a, b) => b.openInterest - a.openInterest);
      case 'Volume': return items.sort((a, b) => b.volume24h - a.volume24h);
      case 'Funding': return items.sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
      case 'Thay đổi': return items.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      default: return items;
    }
  }, [sortBy]);

  const totalLong = DERIVATIVE_PAIRS.reduce((s, p) => s + p.liquidations24h.long, 0);
  const totalShort = DERIVATIVE_PAIRS.reduce((s, p) => s + p.liquidations24h.short, 0);

  return (
    <PageLayout>
      <Header title="Phái sinh" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* ═══ Overview tab ═══ */}
        {tab === 'Tổng quan' && (
          <>
            {/* Global stats hero */}
            <TrCard variant="hero" className="p-4">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, marginBottom: 4 }}>
                Tổng Open Interest
              </p>
              <div className="flex items-end gap-2">
                <span style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>
                  {fmtCompact(stats.totalOpenInterest, { prefix: '$' })}
                </span>
                <span style={{
                  color: stats.oiChange24h >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.semibold,
                  paddingBottom: 2,
                }}>
                  {fmtPct(stats.oiChange24h)}
                </span>
              </div>
            </TrCard>

            {/* 2x2 stat grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="KL giao dịch 24h"
                value={fmtCompact(stats.totalVolume24h, { prefix: '$' })}
                change={stats.volumeChange24h}
                icon={<BarChart3 size={14} color="#3B82F6" />}
                c={c}
              />
              <StatCard
                label="Thanh lý 24h"
                value={fmtCompact(stats.totalLiquidations24h, { prefix: '$' })}
                subtitle={`L: ${fmtCompact(stats.longLiquidations24h, { prefix: '$' })} / S: ${fmtCompact(stats.shortLiquidations24h, { prefix: '$' })}`}
                icon={<Zap size={14} color="#EF4444" />}
                c={c}
              />
              <StatCard
                label="Funding TB"
                value={`${(stats.avgFundingRate * 100).toFixed(4)}%`}
                subtitle="8h rate"
                icon={<Activity size={14} color="#8B5CF6" />}
                c={c}
                valueColor={stats.avgFundingRate >= 0 ? '#10B981' : '#EF4444'}
              />
              <StatCard
                label="BTC Long/Short"
                value={`${stats.btcLongShortRatio.toFixed(2)}`}
                subtitle={stats.btcLongShortRatio >= 1 ? 'Long thiên hướng' : 'Short thiên hướng'}
                icon={<Scale size={14} color="#F59E0B" />}
                c={c}
                valueColor={stats.btcLongShortRatio >= 1 ? '#10B981' : '#EF4444'}
              />
            </div>

            {/* Liquidation bar chart */}
            <PageSection label="Thanh lý theo thời gian (24h)" accentColor="#EF4444">
              <TrCard className="p-4">
                <div className="flex flex-col gap-2">
                  {LIQUIDATION_HISTORY.map((point, idx) => {
                    const maxVal = Math.max(
                      ...LIQUIDATION_HISTORY.map(p => Math.max(p.long, p.short))
                    );
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span style={{
                          color: c.text3, fontSize: FONT_SCALE.micro, width: 48, textAlign: 'right', flexShrink: 0,
                        }}>
                          {point.time}
                        </span>
                        <div className="flex-1 flex gap-0.5">
                          <div
                            className="h-3 rounded-l"
                            style={{
                              width: `${(point.long / maxVal) * 100}%`,
                              background: '#10B981',
                              opacity: 0.7,
                            }}
                          />
                          <div
                            className="h-3 rounded-r"
                            style={{
                              width: `${(point.short / maxVal) * 100}%`,
                              background: '#EF4444',
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 pt-2" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#10B981' }} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                      Long ({fmtCompact(totalLong, { prefix: '$' })})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#EF4444' }} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                      Short ({fmtCompact(totalShort, { prefix: '$' })})
                    </span>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            {/* Top OI pairs */}
            <PageSection label="Top Open Interest" accentColor="#3B82F6">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {DERIVATIVE_PAIRS.slice(0, 5).map(pair => (
                  <OIPairRow key={pair.id} pair={pair} c={c} />
                ))}
              </div>
            </PageSection>
          </>
        )}

        {/* ═══ Perpetual tab ═══ */}
        {tab === 'Perpetual' && (
          <>
            {/* Sort chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); hapticSelection(); }}
                  className="shrink-0 px-3 py-1.5 rounded-xl"
                  style={{
                    background: sortBy === opt ? c.chipActiveBg : c.surface2,
                    color: sortBy === opt ? c.chipActiveText : c.text3,
                    border: `1px solid ${sortBy === opt ? c.chipActiveBorder : 'transparent'}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Perpetual pairs list */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              {sortedPairs.map(pair => (
                <PerpPairCard key={pair.id} pair={pair} c={c} />
              ))}
            </div>
          </>
        )}

        {/* ═══ Liquidation tab ═══ */}
        {tab === 'Thanh lý' && (
          <>
            {/* Liquidation summary */}
            <TrCard variant="hero" className="p-4">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, marginBottom: 8 }}>
                Tổng thanh lý 24h
              </p>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>
                {fmtCompact(stats.totalLiquidations24h, { prefix: '$' })}
              </span>

              {/* Long vs Short split bar */}
              <div className="mt-4">
                <div className="flex rounded-lg overflow-hidden" style={{ height: 20 }}>
                  <div
                    style={{
                      width: `${(stats.longLiquidations24h / stats.totalLiquidations24h) * 100}%`,
                      background: '#10B981',
                    }}
                  />
                  <div
                    style={{
                      width: `${(stats.shortLiquidations24h / stats.totalLiquidations24h) * 100}%`,
                      background: '#EF4444',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    Long {fmtCompact(stats.longLiquidations24h, { prefix: '$' })}
                    ({((stats.longLiquidations24h / stats.totalLiquidations24h) * 100).toFixed(1)}%)
                  </span>
                  <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    Short {fmtCompact(stats.shortLiquidations24h, { prefix: '$' })}
                    ({((stats.shortLiquidations24h / stats.totalLiquidations24h) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </TrCard>

            {/* Per-pair liquidation cards */}
            <PageSection label="Thanh lý theo cặp" accentColor="#EF4444">
              <div className="flex flex-col" style={{ gap: 4 }}>
                {DERIVATIVE_PAIRS.sort(
                  (a, b) => (b.liquidations24h.long + b.liquidations24h.short) - (a.liquidations24h.long + a.liquidations24h.short)
                ).map(pair => (
                  <LiquidationCard key={pair.id} pair={pair} c={c} />
                ))}
              </div>
            </PageSection>

            {/* Warning banner */}
            <TrCard className="p-4" accentBorder="rgba(239,68,68,0.15)">
              <div className="flex gap-3">
                <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>
                    Cảnh báo rủi ro
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Giao dịch phái sinh có rủi ro cao. Bạn có thể mất toàn bộ vốn. 
                    Đòn bẩy khuếch đại cả lãi lẫn lỗ. Chỉ giao dịch với số tiền bạn có thể chấp nhận mất.
                  </p>
                </div>
              </div>
            </TrCard>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, change, subtitle, icon, c, valueColor }: {
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  c: ReturnType<typeof useThemeColors>;
  valueColor?: string;
}) {
  return (
    <TrCard className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: c.surface2 }}>
          {icon}
        </div>
        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
          {label}
        </span>
      </div>
      <p style={{ color: valueColor ?? c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
        {value}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {change >= 0
            ? <ArrowUpRight size={12} color="#10B981" />
            : <ArrowDownRight size={12} color="#EF4444" />
          }
          <span style={{
            color: change >= 0 ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.micro,
            fontWeight: FONT_WEIGHT.medium,
          }}>
            {fmtPct(change)}
          </span>
        </div>
      )}
      {subtitle && !change && (
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>
          {subtitle}
        </p>
      )}
    </TrCard>
  );
}

function OIPairRow({ pair, c }: {
  pair: DerivativePair;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: c.surface }}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${pair.color}18` }}
      >
        <span style={{ color: pair.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {pair.symbol.split('/')[0].slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          {pair.symbol}
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
          OI: {fmtCompact(pair.openInterest, { prefix: '$' })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p style={{
          color: pair.openInterestChange24h >= 0 ? '#10B981' : '#EF4444',
          fontSize: FONT_SCALE.xs,
          fontWeight: FONT_WEIGHT.semibold,
        }}>
          {fmtPct(pair.openInterestChange24h)}
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>24h</p>
      </div>
    </div>
  );
}

function PerpPairCard({ pair, c }: {
  pair: DerivativePair;
  c: ReturnType<typeof useThemeColors>;
}) {
  const isUp = pair.change24h >= 0;
  const longPct = pair.longRatio;
  const shortPct = pair.shortRatio;

  return (
    <TrCard className="p-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${pair.color}18` }}
        >
          <span style={{ color: pair.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
            {pair.symbol.split('/')[0].slice(0, 2)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {pair.symbol}
            </span>
            <span
              className="px-2 py-1 rounded"
              style={{ background: c.surface2, color: c.text3, fontSize: 10 }}
            >
              {pair.maxLeverage}x
            </span>
          </div>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Perpetual</span>
        </div>
        <div className="text-right">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            ${fmtPrice(pair.price)}
          </p>
          <span style={{
            color: isUp ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.medium,
          }}>
            {fmtPct(pair.change24h)}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>OI</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtCompact(pair.openInterest, { prefix: '$' })}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Volume 24h</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtCompact(pair.volume24h, { prefix: '$' })}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Funding</p>
          <p style={{
            color: pair.fundingRate >= 0 ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.semibold,
          }}>
            {(pair.fundingRate * 100).toFixed(4)}%
          </p>
        </div>
      </div>

      {/* Long/Short ratio bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
            Long {longPct.toFixed(1)}%
          </span>
          <span style={{ color: '#EF4444', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
            Short {shortPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex rounded overflow-hidden" style={{ height: 5 }}>
          <div style={{ width: `${longPct}%`, background: '#10B981' }} />
          <div style={{ width: `${shortPct}%`, background: '#EF4444' }} />
        </div>
      </div>
    </TrCard>
  );
}

function LiquidationCard({ pair, c }: {
  pair: DerivativePair;
  c: ReturnType<typeof useThemeColors>;
}) {
  const total = pair.liquidations24h.long + pair.liquidations24h.short;
  const longPct = (pair.liquidations24h.long / total) * 100;

  return (
    <TrCard className="p-3">
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${pair.color}18` }}
        >
          <span style={{ color: pair.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
            {pair.symbol.split('/')[0].slice(0, 2)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              {pair.symbol}
            </span>
            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
              {fmtCompact(total, { prefix: '$' })}
            </span>
          </div>

          <div className="flex rounded overflow-hidden" style={{ height: 4 }}>
            <div style={{ width: `${longPct}%`, background: '#10B981' }} />
            <div style={{ width: `${100 - longPct}%`, background: '#EF4444' }} />
          </div>

          <div className="flex justify-between mt-1">
            <span style={{ color: '#10B981', fontSize: 10 }}>
              L: {fmtCompact(pair.liquidations24h.long, { prefix: '$' })}
            </span>
            <span style={{ color: '#EF4444', fontSize: 10 }}>
              S: {fmtCompact(pair.liquidations24h.short, { prefix: '$' })}
            </span>
          </div>
        </div>
      </div>
    </TrCard>
  );
}