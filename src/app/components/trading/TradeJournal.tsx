/**
 * ══════════════════════════════════════════════════════════════════
 *  TRADE JOURNAL & PERFORMANCE ATTRIBUTION
 * ══════════════════════════════════════════════════════════════════
 *  P3 Feature: Detailed trade tracking, win/loss analysis, patterns
 */

import React, { useState, useMemo } from 'react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface TradeEntry {
  id: string;
  timestamp: number;
  pair: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPct: number;
  fees: number;
  duration: number; // milliseconds
  strategy?: string;
  notes?: string;
  tags?: string[];
  setup: 'breakout' | 'pullback' | 'reversal' | 'trend_following' | 'scalp' | 'other';
  outcome: 'win' | 'loss' | 'breakeven';
  exitReason: 'take_profit' | 'stop_loss' | 'manual' | 'liquidation' | 'other';
  mistakes?: string[];
  lessons?: string[];
}

export interface JournalStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
  avgHoldTime: number;
  bestPair: string;
  worstPair: string;
  bestSetup: string;
  totalPnl: number;
  totalFees: number;
}

interface TradeJournalProps {
  trades: TradeEntry[];
  onTradeClick?: (trade: TradeEntry) => void;
}

/* ═══════════════════════════════════════════════════════════════
   JOURNAL STATS CALCULATOR
   ═══════════════════════════════════════════════════════════════ */

function calculateStats(trades: TradeEntry[]): JournalStats {
  const wins = trades.filter(t => t.outcome === 'win');
  const losses = trades.filter(t => t.outcome === 'loss');
  const breakeven = trades.filter(t => t.outcome === 'breakeven');

  const totalWinPnl = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  const pairPnl = trades.reduce((acc, t) => {
    acc[t.pair] = (acc[t.pair] || 0) + t.pnl;
    return acc;
  }, {} as Record<string, number>);

  const setupPnl = trades.reduce((acc, t) => {
    acc[t.setup] = (acc[t.setup] || 0) + t.pnl;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    avgWin: wins.length > 0 ? totalWinPnl / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLossPnl / losses.length : 0,
    profitFactor: totalLossPnl > 0 ? totalWinPnl / totalLossPnl : 0,
    expectancy: trades.length > 0 ? trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length : 0,
    largestWin: Math.max(...trades.map(t => t.pnl), 0),
    largestLoss: Math.min(...trades.map(t => t.pnl), 0),
    avgHoldTime: trades.length > 0 ? trades.reduce((sum, t) => sum + t.duration, 0) / trades.length : 0,
    bestPair: Object.entries(pairPnl).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
    worstPair: Object.entries(pairPnl).sort(([, a], [, b]) => a - b)[0]?.[0] || 'N/A',
    bestSetup: Object.entries(setupPnl).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
    totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
    totalFees: trades.reduce((sum, t) => sum + t.fees, 0),
  };
}

/* ═══════════════════════════════════════════════════════════════
   STATS OVERVIEW
   ═══════════════════════════════════════════════════════════════ */

function StatsOverview({ stats }: { stats: JournalStats }) {
  const c = useThemeColors();

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Win Rate */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Win Rate</p>
        <p
          style={{
            color: stats.winRate >= 50 ? '#10B981' : '#F59E0B',
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {stats.winRate.toFixed(1)}%
        </p>
        <p style={{ color: c.text3, fontSize: 10 }}>
          {stats.wins}W / {stats.losses}L
        </p>
      </div>

      {/* Profit Factor */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Profit Factor</p>
        <p
          style={{
            color: stats.profitFactor >= 2 ? '#10B981' : stats.profitFactor >= 1 ? '#3B82F6' : '#EF4444',
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {stats.profitFactor.toFixed(2)}
        </p>
        <p style={{ color: c.text3, fontSize: 10 }}>
          Wins / Losses
        </p>
      </div>

      {/* Avg Win */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Avg Win</p>
        <p
          style={{
            color: '#10B981',
            fontSize: FONT_SCALE.base,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          +${stats.avgWin.toFixed(0)}
        </p>
      </div>

      {/* Avg Loss */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Avg Loss</p>
        <p
          style={{
            color: '#EF4444',
            fontSize: FONT_SCALE.base,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          -${stats.avgLoss.toFixed(0)}
        </p>
      </div>

      {/* Expectancy */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Expectancy</p>
        <p
          style={{
            color: stats.expectancy > 0 ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.base,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          ${stats.expectancy.toFixed(0)}
        </p>
        <p style={{ color: c.text3, fontSize: 10 }}>
          Per trade
        </p>
      </div>

      {/* Avg Hold Time */}
      <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Avg Hold</p>
        <p
          style={{
            color: c.text1,
            fontSize: FONT_SCALE.base,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {(stats.avgHoldTime / 3600000).toFixed(1)}h
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRADE ROW
   ═══════════════════════════════════════════════════════════════ */

function TradeRow({ trade, onClick }: { trade: TradeEntry; onClick?: () => void }) {
  const c = useThemeColors();

  const outcomeConfig = {
    win: { color: '#10B981', icon: CheckCircle },
    loss: { color: '#EF4444', icon: AlertCircle },
    breakeven: { color: '#F59E0B', icon: AlertCircle },
  };

  const config = outcomeConfig[trade.outcome];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-3 text-left transition-all"
      style={{
        background: c.surface2,
        border: `1px solid ${withAlpha(config.color, ALPHA.soft)}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} color={config.color} />
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            {trade.pair}
          </p>
          <span
            className="px-2 py-0.5 rounded-md"
            style={{
              background: withAlpha(trade.side === 'long' ? '#10B981' : '#EF4444', ALPHA.soft),
              color: trade.side === 'long' ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.micro,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {trade.side.toUpperCase()}
          </span>
        </div>

        <div className="text-right">
          <p
            style={{
              color: config.color,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </p>
          <p style={{ color: c.text3, fontSize: 10 }}>
            {trade.pnlPct > 0 ? '+' : ''}{trade.pnlPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Entry</p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>
            ${trade.entryPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Exit</p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>
            ${trade.exitPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Duration</p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
            {(trade.duration / 3600000).toFixed(1)}h
          </p>
        </div>
      </div>

      {trade.tags && trade.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {trade.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md"
              style={{
                background: withAlpha('#3B82F6', ALPHA.soft),
                color: '#3B82F6',
                fontSize: 9,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETUP BREAKDOWN
   ═══════════════════════════════════════════════════════════════ */

function SetupBreakdown({ trades }: { trades: TradeEntry[] }) {
  const c = useThemeColors();

  const setupStats = useMemo(() => {
    const stats: Record<string, { count: number; wins: number; pnl: number }> = {};

    trades.forEach(trade => {
      if (!stats[trade.setup]) {
        stats[trade.setup] = { count: 0, wins: 0, pnl: 0 };
      }
      stats[trade.setup].count++;
      if (trade.outcome === 'win') stats[trade.setup].wins++;
      stats[trade.setup].pnl += trade.pnl;
    });

    return Object.entries(stats)
      .map(([setup, data]) => ({
        setup,
        count: data.count,
        winRate: (data.wins / data.count) * 100,
        pnl: data.pnl,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={ICON_SIZE.sm} color="#3B82F6" strokeWidth={ICON_STROKE.bold} />
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Setup Performance
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {setupStats.map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{ background: c.surface2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {item.setup.replace('_', ' ').toUpperCase()}
              </p>
              <p
                style={{
                  color: item.pnl > 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                {item.pnl > 0 ? '+' : ''}${item.pnl.toFixed(0)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: c.text3, fontSize: 10 }}>
                {item.count} trades • {item.winRate.toFixed(0)}% win rate
              </p>
            </div>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function TradeJournal({ trades, onTradeClick }: TradeJournalProps) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  const stats = useMemo(() => calculateStats(trades), [trades]);

  const filteredTrades = useMemo(() => {
    if (filter === 'all') return trades;
    if (filter === 'wins') return trades.filter(t => t.outcome === 'win');
    return trades.filter(t => t.outcome === 'loss');
  }, [trades, filter]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <TrCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
          >
            <BookOpen size={ICON_SIZE.md} color="#3B82F6" strokeWidth={ICON_STROKE.bold} />
          </div>
          <div className="flex-1">
            <h2 style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
              Trade Journal
            </h2>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
              {stats.totalTrades} trades • ${stats.totalPnl.toFixed(0)} total P&L
            </p>
          </div>
          <div className="text-right">
            <p
              style={{
                color: stats.totalPnl > 0 ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.xl,
                fontWeight: FONT_WEIGHT.bold,
                fontFamily: 'monospace',
              }}
            >
              {stats.totalPnl > 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}
            </p>
          </div>
        </div>

        <StatsOverview stats={stats} />
      </TrCard>

      {/* Setup Breakdown */}
      <SetupBreakdown trades={trades} />

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'wins', 'losses'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 rounded-xl px-3 py-2 transition-all"
            style={{
              background: filter === f ? withAlpha('#3B82F6', ALPHA.soft) : c.surface2,
              border: `1px solid ${filter === f ? '#3B82F6' : c.borderSolid}`,
              color: filter === f ? '#3B82F6' : c.text2,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Trades List */}
      <div className="flex flex-col gap-2">
        {filteredTrades.map(trade => (
          <TradeRow
            key={trade.id}
            trade={trade}
            onClick={() => onTradeClick?.(trade)}
          />
        ))}
      </div>
    </div>
  );
}
