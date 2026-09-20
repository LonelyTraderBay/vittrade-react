/**
 * ══════════════════════════════════════════════════════════════
 *  WalletGasOptimizerPage — Wallet Advanced Feature 2/4
 * ══════════════════════════════════════════════════════════════
 *  Gas fee optimizer advisor: Optimal gas strategies, Fee trends,
 *  Best time to transact, Gas saving tips, Fee comparison
 *  Pattern B — Page with Tabs (Current/Trends/Tips)
 *  Compliance: Clear fee disclosure
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
  Zap, TrendingUp, TrendingDown, Clock, DollarSign,
  CheckCircle, AlertCircle, Info, Lightbulb, Activity,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const TABS = ['Hien tai', 'Xu huong', 'Meo tiet kiem'] as const;
type Tab = typeof TABS[number];

interface GasLevel {
  speed: 'slow' | 'standard' | 'fast';
  label: string;
  gwei: number;
  usd: number;
  timeEstimate: string;
  recommended: boolean;
}

const CURRENT_GAS: GasLevel[] = [
  { speed: 'slow', label: 'Slow', gwei: 15, usd: 2.1, timeEstimate: '~3 min', recommended: false },
  { speed: 'standard', label: 'Standard', gwei: 25, usd: 3.5, timeEstimate: '~1 min', recommended: true },
  { speed: 'fast', label: 'Fast', gwei: 35, usd: 4.9, timeEstimate: '~15 sec', recommended: false },
];

const GAS_HISTORY = [
  { time: '00:00', slow: 12, standard: 20, fast: 28 },
  { time: '04:00', slow: 10, standard: 18, fast: 25 },
  { time: '08:00', slow: 18, standard: 28, fast: 38 },
  { time: '12:00', slow: 22, standard: 35, fast: 48 },
  { time: '16:00', slow: 20, standard: 32, fast: 42 },
  { time: '20:00', slow: 15, standard: 25, fast: 35 },
  { time: 'Now', slow: 15, standard: 25, fast: 35 },
];

const NETWORK_ACTIVITY = [
  { hour: '0h', txCount: 1200 },
  { hour: '4h', txCount: 800 },
  { hour: '8h', txCount: 2400 },
  { hour: '12h', txCount: 3200 },
  { hour: '16h', txCount: 2800 },
  { hour: '20h', txCount: 1800 },
  { hour: 'Now', txCount: 1500 },
];

interface GasTip {
  id: string;
  title: string;
  description: string;
  potentialSaving: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: 'timing' | 'optimization' | 'strategy';
}

const GAS_TIPS: GasTip[] = [
  {
    id: 't1',
    title: 'Transact During Low Activity',
    description: 'Gas fees are lowest between 2 AM - 6 AM UTC when network activity is minimal',
    potentialSaving: 'Up to 60%',
    difficulty: 'easy',
    category: 'timing',
  },
  {
    id: 't2',
    title: 'Batch Transactions',
    description: 'Combine multiple operations into one transaction to save on base gas fees',
    potentialSaving: '30-40%',
    difficulty: 'medium',
    category: 'optimization',
  },
  {
    id: 't3',
    title: 'Use Layer 2 Solutions',
    description: 'Move assets to L2 networks like Arbitrum or Optimism for 90% lower fees',
    potentialSaving: 'Up to 90%',
    difficulty: 'easy',
    category: 'strategy',
  },
  {
    id: 't4',
    title: 'Set Custom Gas Limit',
    description: 'Reduce gas limit for simple transfers (21,000 for ETH) to avoid overpaying',
    potentialSaving: '10-20%',
    difficulty: 'medium',
    category: 'optimization',
  },
  {
    id: 't5',
    title: 'Wait for Weekends',
    description: 'Transaction volume drops on weekends, leading to lower gas prices',
    potentialSaving: '20-30%',
    difficulty: 'easy',
    category: 'timing',
  },
  {
    id: 't6',
    title: 'Use Gas Tokens',
    description: 'Store gas in gas tokens during low prices, use when prices spike',
    potentialSaving: '40-50%',
    difficulty: 'advanced',
    category: 'strategy',
  },
];

export function WalletGasOptimizerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Hien tai');
  const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'standard' | 'fast'>('standard');

  const currentGasAvg = CURRENT_GAS[1].gwei;
  const historicalAvg = 28;
  const vsAverage = ((currentGasAvg - historicalAvg) / historicalAvg) * 100;
  const isLow = vsAverage < -10;
  const isHigh = vsAverage > 10;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Gas Optimizer" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Hien tai' && (
          <>
            {/* Current Status */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: isLow
                  ? 'rgba(16,185,129,0.06)'
                  : isHigh
                  ? 'rgba(239,68,68,0.06)'
                  : 'rgba(245,158,11,0.06)',
                border: `1px solid ${
                  isLow
                    ? 'rgba(16,185,129,0.15)'
                    : isHigh
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(245,158,11,0.15)'
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} color={isLow ? '#10B981' : isHigh ? '#EF4444' : '#F59E0B'} />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {isLow ? 'Low Gas Prices - Good Time!' : isHigh ? 'High Gas Prices' : 'Normal Gas Prices'}
                </p>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Current gas {vsAverage < 0 ? '' : 'is '}
                <span
                  style={{
                    color: isLow ? '#10B981' : isHigh ? '#EF4444' : '#F59E0B',
                    fontWeight: 700,
                  }}
                >
                  {Math.abs(vsAverage).toFixed(0)}% {vsAverage < 0 ? 'below' : 'above'}
                </span>{' '}
                24h average
              </p>
            </div>

            {/* Gas Price Options */}
            <PageSection label="Chon toc do giao dich">
              <div className="space-y-2">
                {CURRENT_GAS.map((level) => (
                  <button
                    key={level.speed}
                    onClick={() => setSelectedSpeed(level.speed)}
                    className="w-full rounded-2xl p-4 text-left transition-all hover:opacity-90"
                    style={{
                      background: selectedSpeed === level.speed ? `${c.primary}15` : c.surface,
                      border: `1px solid ${selectedSpeed === level.speed ? c.primary : c.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                            {level.label}
                          </p>
                          {level.recommended && (
                            <span
                              className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                            >
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>{level.timeEstimate}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                          {level.gwei} Gwei
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>~${level.usd.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Gas bar visualization */}
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 4, background: c.bg }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${(level.gwei / 50) * 100}%`,
                          background:
                            level.speed === 'slow'
                              ? '#10B981'
                              : level.speed === 'standard'
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </PageSection>

            {/* Fee Comparison */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Transaction Type Comparison
              </p>
              <div className="space-y-3">
                {[
                  { type: 'Simple Transfer', gas: 21000, usd: 3.5 },
                  { type: 'Token Transfer', gas: 65000, usd: 10.8 },
                  { type: 'Swap (DEX)', gas: 180000, usd: 29.7 },
                  { type: 'NFT Mint', gas: 120000, usd: 19.8 },
                ].map((tx) => (
                  <div key={tx.type} className="flex items-center justify-between">
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{tx.type}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{tx.gas.toLocaleString()} gas</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      ~${tx.usd.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => alert('Refreshing gas prices...')}
              className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} />
              Refresh Prices
            </button>
          </>
        )}

        {tab === 'Xu huong' && (
          <>
            {/* Gas Price Trends */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                24h Gas Price Trends
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={GAS_HISTORY}>
                  <defs key="gradient-defs">
                    <linearGradient id="colorSlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    label={{ value: 'Gwei', angle: -90, position: 'insideLeft', fill: c.text3, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="slow"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSlow)"
                    name="Slow"
                  />
                  <Area
                    type="monotone"
                    dataKey="standard"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStandard)"
                    name="Standard"
                  />
                  <Area
                    type="monotone"
                    dataKey="fast"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFast)"
                    name="Fast"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Network Activity */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Network Activity
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={NETWORK_ACTIVITY}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Bar dataKey="txCount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Best Time to Transact */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <Clock size={16} color="#10B981" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Best Time to Transact
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Gas fees are typically lowest between <span style={{ color: '#10B981', fontWeight: 700 }}>2 AM - 6 AM UTC</span> (Saturday - Sunday)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Avg Low Price</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>12 Gwei</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Potential Saving</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>~52%</p>
                </div>
              </div>
            </div>

            {/* Historical Insights */}
            <PageSection label="Historical Insights">
              <div className="space-y-2">
                {[
                  { label: '7-day Average', value: '28 Gwei', trend: 'down', change: '-8%' },
                  { label: '30-day Average', value: '32 Gwei', trend: 'down', change: '-12%' },
                  { label: 'All-time High', value: '450 Gwei', date: 'May 2021' },
                  { label: 'All-time Low', value: '1 Gwei', date: 'Dec 2020' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <p style={{ color: c.text2, fontSize: 12 }}>{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{stat.value}</p>
                      {stat.trend && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: stat.trend === 'down' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: stat.trend === 'down' ? '#10B981' : '#EF4444',
                          }}
                        >
                          {stat.change}
                        </span>
                      )}
                      {stat.date && (
                        <p style={{ color: c.text3, fontSize: 10 }}>{stat.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Meo tiet kiem' && (
          <>
            {/* Gas Saving Tips */}
            <PageSection label="Gas Optimization Tips">
              {GAS_TIPS.map((tip) => (
                <div
                  key={tip.id}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(245,158,11,0.08)',
                        flexShrink: 0,
                      }}
                    >
                      <Lightbulb size={16} color="#F59E0B" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{tip.title}</p>
                        <span
                          className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                          style={{
                            background: `${getDifficultyColor(tip.difficulty)}20`,
                            color: getDifficultyColor(tip.difficulty),
                          }}
                        >
                          {tip.difficulty}
                        </span>
                      </div>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                        {tip.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded text-[10px]"
                          style={{ background: c.chipBg, color: c.chipText }}
                        >
                          {tip.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} color="#10B981" />
                          <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                            {tip.potentialSaving}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Quick Actions */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Quick Actions
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Set Gas Price Alert', icon: Zap },
                  { label: 'Schedule Transaction', icon: Clock },
                  { label: 'View L2 Options', icon: ArrowRight },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => alert(action.label)}
                    className="w-full rounded-xl p-3 flex items-center justify-between hover:opacity-90 transition-opacity"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon size={16} color={c.text3} />
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{action.label}</p>
                    </div>
                    <ArrowRight size={14} color={c.text3} />
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Gas prices vary based on network congestion. Monitor trends and use optimization strategies to save on fees.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}