/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionPortfolioAnalyzerPage — Prediction Markets Feature 3/4
 * ══════════════════════════════════════════════════════════════
 *  Advanced portfolio analysis: P/L breakdown, diversification,
 *  risk exposure, win rate, performance attribution
 *  Pattern B — Page with Tabs (Overview/Performance/Risk)
 *  Compliance: §9.7 Prediction leaderboard metrics (P/L, Volume)
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  TrendingUp, TrendingDown, Target, Award, BarChart3,
  PieChart as PieIcon, Activity, Percent, Info, Shield,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const TABS = ['Tong quan', 'Hieu suat', 'Rui ro'] as const;
type Tab = typeof TABS[number];

interface Position {
  id: string;
  eventName: string;
  category: string;
  outcome: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  status: 'open' | 'closed';
  resolvedAt?: Date;
  pnl?: number;
}

const MOCK_POSITIONS: Position[] = [
  {
    id: 'p1',
    eventName: 'BTC > $100K by Dec 2026?',
    category: 'Crypto',
    outcome: 'yes',
    shares: 100,
    avgPrice: 0.65,
    currentPrice: 0.68,
    status: 'open',
  },
  {
    id: 'p2',
    eventName: 'ETH merge to PoS in 2025?',
    category: 'Crypto',
    outcome: 'yes',
    shares: 80,
    avgPrice: 0.72,
    currentPrice: 0.75,
    status: 'open',
  },
  {
    id: 'p3',
    eventName: 'US Election 2024 - Candidate A wins?',
    category: 'Politics',
    outcome: 'no',
    shares: 120,
    avgPrice: 0.45,
    currentPrice: 0.42,
    status: 'open',
  },
  {
    id: 'p4',
    eventName: 'AI beats human in chess 2025?',
    category: 'Tech',
    outcome: 'yes',
    shares: 50,
    avgPrice: 0.88,
    currentPrice: 0.0,
    status: 'closed',
    resolvedAt: new Date(Date.now() - 7 * 86400000),
    pnl: -44,
  },
  {
    id: 'p5',
    eventName: 'Global GDP growth > 3% in 2025?',
    category: 'Macro',
    outcome: 'yes',
    shares: 200,
    avgPrice: 0.52,
    currentPrice: 1.0,
    status: 'closed',
    resolvedAt: new Date(Date.now() - 14 * 86400000),
    pnl: 96,
  },
];

const PNL_HISTORY = [
  { date: '01/03', value: 0 },
  { date: '08/03', value: 12 },
  { date: '15/03', value: -8 },
  { date: '22/03', value: 24 },
  { date: '29/03', value: 35 },
  { date: '05/04', value: 52 },
];

export function PredictionPortfolioAnalyzerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tong quan');

  // Calculate metrics
  const openPositions = MOCK_POSITIONS.filter(p => p.status === 'open');
  const closedPositions = MOCK_POSITIONS.filter(p => p.status === 'closed');

  const totalInvested = MOCK_POSITIONS.reduce((sum, p) => sum + p.shares * p.avgPrice, 0);
  const currentValue = openPositions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const realizedPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const unrealizedPnL = openPositions.reduce((sum, p) => {
    const cost = p.shares * p.avgPrice;
    const value = p.shares * p.currentPrice;
    return sum + (value - cost);
  }, 0);
  const totalPnL = realizedPnL + unrealizedPnL;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const winningTrades = closedPositions.filter(p => (p.pnl || 0) > 0).length;
  const losingTrades = closedPositions.filter(p => (p.pnl || 0) < 0).length;
  const totalTrades = closedPositions.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Category breakdown
  const categoryMap = new Map<string, { invested: number; pnl: number }>();
  MOCK_POSITIONS.forEach(p => {
    const existing = categoryMap.get(p.category) || { invested: 0, pnl: 0 };
    const cost = p.shares * p.avgPrice;
    const value = p.status === 'open'
      ? p.shares * p.currentPrice
      : p.shares * p.avgPrice + (p.pnl || 0);
    categoryMap.set(p.category, {
      invested: existing.invested + cost,
      pnl: existing.pnl + (value - cost),
    });
  });

  const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
    name: category,
    value: data.invested,
    pnl: data.pnl,
  }));

  const COLORS = [c.primary, c.buy, c.warn, '#8B5CF6', c.sell];

  return (
    <PageLayout>
      <Header title="Portfolio Analyzer" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tong quan' && (
          <>
            {/* Summary Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text3, fontSize: 12, marginBottom: 8 }}>Total Portfolio Value</p>
              <div className="flex items-baseline gap-2 mb-4">
                <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
                  ${(totalInvested + totalPnL).toFixed(2)}
                </p>
                <div className="flex items-center gap-1">
                  {totalPnL >= 0 ? (
                    <TrendingUp size={16} color={c.buy} />
                  ) : (
                    <TrendingDown size={16} color={c.sell} />
                  )}
                  <p
                    style={{
                      color: totalPnL >= 0 ? c.buy : c.sell,
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Invested</p>
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                    ${totalInvested.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Return %</p>
                  <p
                    style={{
                      color: totalPnLPercent >= 0 ? c.buy : c.sell,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Realized P/L</p>
                  <p
                    style={{
                      color: realizedPnL >= 0 ? c.buy : c.sell,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Unrealized P/L</p>
                  <p
                    style={{
                      color: unrealizedPnL >= 0 ? c.buy : c.sell,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Activity,
                  label: 'Open Positions',
                  value: openPositions.length.toString(),
                  color: c.primary,
                },
                {
                  icon: Target,
                  label: 'Win Rate',
                  value: `${winRate.toFixed(1)}%`,
                  color: c.buy,
                },
                {
                  icon: Award,
                  label: 'Total Trades',
                  value: totalTrades.toString(),
                  color: '#8B5CF6',
                },
                {
                  icon: BarChart3,
                  label: 'Avg Trade',
                  value: `$${(totalInvested / MOCK_POSITIONS.length).toFixed(0)}`,
                  color: c.warn,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon size={16} color={stat.color} />
                    <p style={{ color: c.text3, fontSize: 11 }}>{stat.label}</p>
                  </div>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Category Breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Portfolio by Category
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    key="pie-category"
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.name} ${((entry.value / totalInvested) * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    key="tooltip-pie"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: c.text1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: COLORS[idx % COLORS.length],
                      }}
                    />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{cat.name}</p>
                      <p
                        style={{
                          color: cat.pnl >= 0 ? c.buy : c.sell,
                          fontSize: 10,
                        }}
                      >
                        {cat.pnl >= 0 ? '+' : ''}${cat.pnl.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'Hieu suat' && (
          <>
            {/* P/L Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                P/L Over Time
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={PNL_HISTORY}>
                  <XAxis
                    key="x-axis-pnl"
                    dataKey="date"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis-pnl"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-pnl"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: c.text1,
                    }}
                  />
                  <Line
                    key="line-pnl"
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: c.buy, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Win Rate Breakdown */}
            <PageSection label="Trade Statistics">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Win Rate</p>
                  <p style={{ color: c.buy, fontSize: 18, fontWeight: 700 }}>
                    {winRate.toFixed(1)}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Winning</p>
                    <p style={{ color: c.buy, fontSize: 15, fontWeight: 700 }}>
                      {winningTrades}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Losing</p>
                    <p style={{ color: c.sell, fontSize: 15, fontWeight: 700 }}>
                      {losingTrades}
                    </p>
                  </div>
                </div>

                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 8, background: c.bg }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${winRate}%`,
                      background: 'linear-gradient(90deg, #10B981, #059669)',
                    }}
                  />
                </div>
              </div>
            </PageSection>

            {/* Best/Worst Trades */}
            <PageSection label="Performance Attribution">
              <div className="space-y-2">
                {closedPositions
                  .sort((a, b) => (b.pnl || 0) - (a.pnl || 0))
                  .slice(0, 5)
                  .map((pos) => (
                    <div
                      key={pos.id}
                      className="rounded-xl p-3"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {pos.eventName}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>{pos.category}</p>
                        </div>
                        <div className="text-right">
                          <p
                            style={{
                              color: (pos.pnl || 0) >= 0 ? c.buy : c.sell,
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {(pos.pnl || 0) >= 0 ? '+' : ''}${(pos.pnl || 0).toFixed(2)}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {pos.resolvedAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Rui ro' && (
          <>
            {/* Risk Metrics */}
            <PageSection label="Risk Exposure">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} color="#3B82F6" />
                      <p style={{ color: c.text2, fontSize: 13 }}>Max Drawdown</p>
                    </div>
                    <p style={{ color: c.sell, fontSize: 15, fontWeight: 700 }}>
                      -12.4%
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Portfolio Volatility</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      18.2%
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieIcon size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Concentration (Top 3)</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      62.3%
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Sharpe Ratio</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      1.42
                    </p>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Category Risk */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Risk by Category
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData}>
                  <XAxis
                    key="x-axis"
                    dataKey="name"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: c.text1,
                    }}
                  />
                  <Bar key="bar-value" dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Diversification Score */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <Shield size={16} color="#10B981" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Diversification Score
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Portfolio da phan tan hop ly qua {categoryData.length} categories
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>7.2</p>
                <p style={{ color: c.text3, fontSize: 12 }}>/ 10</p>
              </div>
            </div>

            {/* Risk Warning - §9.6 compliance */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <Info size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Phan tich rui ro dua tren du lieu lich su. Hieu suat qua khu khong dam bao ket qua tuong lai.
                Luon quan ly rui ro va phan tan dau tu.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}