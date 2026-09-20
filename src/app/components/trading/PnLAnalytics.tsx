/**
 * ══════════════════════════════════════════════════════════════════
 *  PNL ANALYTICS — P1 Features
 * ══════════════════════════════════════════════════════════════════
 *  Professional PnL tracking and analytics:
 *  - Realized vs Unrealized PnL separation
 *  - Daily/Weekly/Monthly performance
 *  - Win rate & Profit factor
 *  - Position-level attribution
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart, Calendar, Info, ChevronRight } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. REALIZED VS UNREALIZED PNL DISPLAY
   ═══════════════════════════════════════════════════════════════ */

interface PnLSummaryProps {
  realizedPnL: number;
  unrealizedPnL: number;
  totalEquity: number;
  className?: string;
}

export function PnLSummary({ realizedPnL, unrealizedPnL, totalEquity, className = '' }: PnLSummaryProps) {
  const c = useThemeColors();

  const totalPnL = realizedPnL + unrealizedPnL;
  const realizedPct = totalEquity > 0 ? (realizedPnL / totalEquity) * 100 : 0;
  const unrealizedPct = totalEquity > 0 ? (unrealizedPnL / totalEquity) * 100 : 0;
  const totalPct = totalEquity > 0 ? (totalPnL / totalEquity) * 100 : 0;

  return (
    <TrCard className={`p-5 ${className}`} variant="hero">
      {/* Total PnL Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SCALE.xs, marginBottom: 4 }}>
            Total PnL
          </p>
          <p
            style={{
              color: totalPnL >= 0 ? '#10B981' : '#EF4444',
              fontSize: 32,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </p>
          <p
            style={{
              color: totalPnL >= 0 ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              marginTop: 4,
            }}
          >
            {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%
          </p>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: withAlpha(totalPnL >= 0 ? '#10B981' : '#EF4444', ALPHA.muted) }}
        >
          {totalPnL >= 0 ? (
            <TrendingUp size={ICON_SIZE.xl} color="#10B981" strokeWidth={ICON_STROKE.bold} />
          ) : (
            <TrendingDown size={ICON_SIZE.xl} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
          )}
        </div>
      </div>

      {/* Realized vs Unrealized Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* Realized */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${withAlpha('#10B981', ALPHA.soft)}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} color="#10B981" strokeWidth={ICON_STROKE.standard} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 }}>
              REALIZED
            </span>
          </div>
          <p
            style={{
              color: realizedPnL >= 0 ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: FONT_SCALE.micro, marginTop: 2 }}>
            {realizedPct >= 0 ? '+' : ''}{realizedPct.toFixed(2)}% ROI
          </p>
        </div>

        {/* Unrealized */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${withAlpha('#F59E0B', ALPHA.soft)}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 }}>
              UNREALIZED
            </span>
          </div>
          <p
            style={{
              color: unrealizedPnL >= 0 ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: FONT_SCALE.micro, marginTop: 2 }}>
            {unrealizedPct >= 0 ? '+' : ''}{unrealizedPct.toFixed(2)}% ROI
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2 mt-4 p-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <Info size={12} color="rgba(255,255,255,0.4)" className="shrink-0 mt-0.5" />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.5 }}>
          <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Realized:</strong> Lợi nhuận/lỗ đã chốt từ vị thế đóng.{' '}
          <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Unrealized:</strong> PnL chưa chốt từ vị thế đang mở.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. PERFORMANCE METRICS (WIN RATE, PROFIT FACTOR, ETC.)
   ═══════════════════════════════════════════════════════════════ */

interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

interface PerformanceStatsProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export function PerformanceStats({ metrics, className = '' }: PerformanceStatsProps) {
  const c = useThemeColors();

  const winRate = metrics.totalTrades > 0 ? (metrics.winningTrades / metrics.totalTrades) * 100 : 0;
  const profitFactor = metrics.totalLoss !== 0 ? Math.abs(metrics.totalProfit / metrics.totalLoss) : 0;
  const avgWinLossRatio = metrics.avgLoss !== 0 ? Math.abs(metrics.avgWin / metrics.avgLoss) : 0;

  const stats = [
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      subValue: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      color: winRate >= 50 ? '#10B981' : '#EF4444',
      icon: Target,
    },
    {
      label: 'Profit Factor',
      value: profitFactor.toFixed(2),
      subValue: profitFactor > 1 ? 'Profitable' : 'Losing',
      color: profitFactor >= 1.5 ? '#10B981' : profitFactor >= 1 ? '#F59E0B' : '#EF4444',
      icon: BarChart3,
    },
    {
      label: 'Avg Win/Loss',
      value: avgWinLossRatio.toFixed(2),
      subValue: `${metrics.avgWin.toFixed(0)} / ${Math.abs(metrics.avgLoss).toFixed(0)}`,
      color: avgWinLossRatio >= 1.5 ? '#10B981' : '#F59E0B',
      icon: PieChart,
    },
  ];

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Performance Metrics
        </p>
        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
          {metrics.totalTrades} trades
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-3 text-center"
              style={{ background: c.surface2 }}
            >
              <div className="flex items-center justify-center mb-2">
                <Icon size={16} color={stat.color} strokeWidth={ICON_STROKE.standard} />
              </div>
              <p
                style={{
                  color: stat.color,
                  fontSize: FONT_SCALE.lg,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                {stat.value}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                {stat.label}
              </p>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                {stat.subValue}
              </p>
            </div>
          );
        })}
      </div>

      {/* Best/Worst trades */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#10B981', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Win
          </p>
          <p
            style={{
              color: '#10B981',
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            +${metrics.largestWin.toFixed(2)}
          </p>
        </div>
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Loss
          </p>
          <p
            style={{
              color: '#EF4444',
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${metrics.largestLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Interpretation */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <div className="flex-1">
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            <strong style={{ color: c.text2 }}>Profit Factor {'>'}1.5:</strong> Excellent.{' '}
            <strong style={{ color: c.text2 }}>Win Rate {'>'}50%:</strong> Good.{' '}
            <strong style={{ color: c.text2 }}>Avg W/L {'>'}1.5:</strong> Strong risk/reward.
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. PERIOD PERFORMANCE (DAILY/WEEKLY/MONTHLY)
   ═══════════════════════════════════════════════════════════════ */

interface PeriodData {
  period: string;
  pnl: number;
  trades: number;
  winRate: number;
}

interface PeriodPerformanceProps {
  periods: PeriodData[];
  className?: string;
}

export function PeriodPerformance({ periods, className = '' }: PeriodPerformanceProps) {
  const c = useThemeColors();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Mock data - in real app, filter based on selectedPeriod
  const displayData = periods.slice(0, 7);

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.standard} />
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Period Performance
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        {(['daily', 'weekly', 'monthly'] as const).map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className="flex-1 py-2 rounded-xl transition-all"
            style={{
              background: selectedPeriod === period ? c.primary : 'transparent',
              color: selectedPeriod === period ? '#fff' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: selectedPeriod === period ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* Period list */}
      <div className="flex flex-col gap-2">
        {displayData.map((data, index) => (
          <div
            key={index}
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: c.surface2 }}
          >
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                {data.period}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {data.trades} trades · {data.winRate.toFixed(0)}% win rate
              </p>
            </div>
            <div className="text-right">
              <p
                style={{
                  color: data.pnl >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View all */}
      <button
        className="w-full mt-2 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
        style={{
          background: c.surface2,
          color: c.primary,
          fontSize: FONT_SCALE.xs,
          fontWeight: FONT_WEIGHT.semibold,
        }}
      >
        View All History
        <ChevronRight size={ICON_SIZE.sm} />
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. POSITION-LEVEL PNL ATTRIBUTION
   ═══════════════════════════════════════════════════════════════ */

interface PositionAttribution {
  id: string;
  pair: string;
  side: 'long' | 'short';
  pnl: number;
  pnlPct: number;
  contribution: number; // % of total PnL
  entryDate: string;
  closeDate?: string;
  duration: string;
}

interface PnLAttributionProps {
  positions: PositionAttribution[];
  totalPnL: number;
  className?: string;
}

export function PnLAttribution({ positions, totalPnL, className = '' }: PnLAttributionProps) {
  const c = useThemeColors();

  // Sort by absolute contribution
  const sortedPositions = [...positions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topPositions = sortedPositions.slice(0, 5);

  return (
    <TrCard className={`p-4 ${className}`}>
      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
        Top PnL Contributors
      </p>
      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 12 }}>
        Top 5 positions by PnL impact
      </p>

      <div className="flex flex-col gap-2">
        {topPositions.map((pos, index) => (
          <div
            key={pos.id}
            className="rounded-xl p-3"
            style={{
              background: c.surface2,
              border: `1px solid ${pos.pnl >= 0 ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft)}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: pos.pnl >= 0 ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted),
                    color: pos.pnl >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {index + 1}
                </span>
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                    {pos.pair}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {pos.side === 'long' ? 'Long' : 'Short'} · {pos.duration}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  style={{
                    color: pos.pnl >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.base,
                    fontWeight: FONT_WEIGHT.bold,
                    fontFamily: 'monospace',
                  }}
                >
                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>
                  {pos.contribution >= 0 ? '+' : ''}{pos.contribution.toFixed(1)}% of total
                </p>
              </div>
            </div>

            {/* Contribution bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.abs(pos.contribution))}%`,
                  background: pos.pnl >= 0 ? '#10B981' : '#EF4444',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </TrCard>
  );
}
