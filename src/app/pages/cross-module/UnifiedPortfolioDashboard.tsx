/**
 * ══════════════════════════════════════════════════════════════
 *  UnifiedPortfolioDashboard — Cross-Module Feature 1/4
 * ══════════════════════════════════════════════════════════════
 *  Unified portfolio dashboard: All positions across modules,
 *  Aggregated view, Module breakdown, Total P&L tracking
 *  Pattern B — Page with Tabs (Overview/Breakdown/History)
 *  Compliance: §6 Module boundaries, §11 Safe Bridges
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
  TrendingUp, TrendingDown, Wallet, BarChart3, Target,
  DollarSign, Activity, Clock, ArrowRight, RefreshCw,
  ShoppingCart, Zap, Info,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line,
} from 'recharts';

const TABS = ['Tong quan', 'Phan tich', 'Lich su'] as const;
type Tab = typeof TABS[number];

interface ModulePosition {
  module: 'wallet' | 'trading' | 'p2p' | 'predictions' | 'arena' | 'dca';
  moduleName: string;
  value: number;
  change24h: number;
  activePositions: number;
  icon: any;
  color: string;
  pnl: number;
}

const MODULE_DATA: ModulePosition[] = [
  {
    module: 'wallet',
    moduleName: 'Wallet Holdings',
    value: 45280,
    change24h: 3.2,
    activePositions: 8,
    icon: Wallet,
    color: '#3B82F6',
    pnl: 1350,
  },
  {
    module: 'trading',
    moduleName: 'Trading Positions',
    value: 28900,
    change24h: -1.5,
    activePositions: 12,
    icon: BarChart3,
    color: '#10B981',
    pnl: -420,
  },
  {
    module: 'p2p',
    moduleName: 'P2P Orders',
    value: 8500,
    change24h: 0.8,
    activePositions: 3,
    icon: ShoppingCart,
    color: '#F59E0B',
    pnl: 85,
  },
  {
    module: 'predictions',
    moduleName: 'Prediction Markets',
    value: 5200,
    change24h: 5.6,
    activePositions: 7,
    icon: Target,
    color: '#8B5CF6',
    pnl: 780,
  },
  {
    module: 'arena',
    moduleName: 'Arena (Points Only)',
    value: 0, // Points-only, no USD value
    change24h: 0,
    activePositions: 4,
    icon: Zap,
    color: '#F97316',
    pnl: 0,
  },
  {
    module: 'dca',
    moduleName: 'DCA Plans',
    value: 14500,
    change24h: 2.1,
    activePositions: 2,
    icon: Activity,
    color: '#6366F1',
    pnl: 1200,
  },
];

const PERFORMANCE_HISTORY = [
  { date: 'Jan', wallet: 42000, trading: 30000, p2p: 8000, predictions: 4500, dca: 12000 },
  { date: 'Feb', wallet: 43000, trading: 29500, p2p: 8200, predictions: 4800, dca: 13000 },
  { date: 'Mar', wallet: 44000, trading: 28800, p2p: 8400, predictions: 5000, dca: 13800 },
  { date: 'Apr', wallet: 44500, trading: 28500, p2p: 8300, predictions: 5100, dca: 14200 },
  { date: 'May', wallet: 45000, trading: 29200, p2p: 8600, predictions: 5300, dca: 14600 },
  { date: 'Now', wallet: 45280, trading: 28900, p2p: 8500, predictions: 5200, dca: 14500 },
];

const MODULE_COLORS = {
  wallet: '#3B82F6',
  trading: '#10B981',
  p2p: '#F59E0B',
  predictions: '#8B5CF6',
  dca: '#6366F1',
};

export function UnifiedPortfolioDashboard() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tong quan');

  // Calculate totals (exclude Arena points-only)
  const totalValue = MODULE_DATA.filter((m) => m.module !== 'arena').reduce(
    (sum, m) => sum + m.value,
    0
  );
  const totalPnL = MODULE_DATA.filter((m) => m.module !== 'arena').reduce(
    (sum, m) => sum + m.pnl,
    0
  );
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100;
  const totalPositions = MODULE_DATA.reduce((sum, m) => sum + m.activePositions, 0);

  const pieData = MODULE_DATA.filter((m) => m.module !== 'arena' && m.value > 0).map((m) => ({
    name: m.moduleName,
    value: m.value,
    color: m.color,
  }));

  return (
    <PageLayout>
      <Header title="Unified Portfolio" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tong quan' && (
          <>
            {/* Total Portfolio Value */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Portfolio Value</p>
              <div className="flex items-baseline gap-2 mb-3">
                <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
                  ${totalValue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {totalPnL >= 0 ? (
                    <TrendingUp size={16} color="#10B981" />
                  ) : (
                    <TrendingDown size={16} color="#EF4444" />
                  )}
                  <p
                    style={{
                      color: totalPnL >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()} ({totalPnLPercent >= 0 ? '+' : ''}
                    {totalPnLPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total Positions</p>
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{totalPositions}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Active Modules</p>
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                    {MODULE_DATA.filter((m) => m.activePositions > 0).length}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total P&L</p>
                  <p
                    style={{
                      color: totalPnL >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution Pie Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Distribution
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    key="pie-alloc"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${((entry.value / totalValue) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    key="tooltip-pie"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
                    <p style={{ color: c.text2, fontSize: 11 }}>{item.name.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Cards */}
            <PageSection label="Module Breakdown">
              <div className="space-y-3">
                {MODULE_DATA.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.module}
                      onClick={() => {
                        if (mod.module === 'wallet') navigate('/wallet');
                        else if (mod.module === 'trading') navigate('/trade');
                        else if (mod.module === 'p2p') navigate('/p2p');
                        else if (mod.module === 'predictions') navigate('/markets/predictions');
                        else if (mod.module === 'arena') navigate('/arena');
                        else if (mod.module === 'dca') navigate('/dca');
                      }}
                      className="w-full rounded-2xl p-4 text-left hover:opacity-90 transition-opacity"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: `${mod.color}20`,
                            }}
                          >
                            <Icon size={18} color={mod.color} />
                          </div>
                          <div>
                            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                              {mod.moduleName}
                            </p>
                            <p style={{ color: c.text3, fontSize: 11 }}>
                              {mod.activePositions} active position{mod.activePositions !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={16} color={c.text3} />
                      </div>

                      {mod.module === 'arena' ? (
                        <div
                          className="rounded-xl p-2"
                          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                        >
                          <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>
                            Arena Points Only - Not included in portfolio value
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            <div>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Value</p>
                              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                                ${mod.value.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>24h Change</p>
                              <p
                                style={{
                                  color: mod.change24h >= 0 ? '#10B981' : '#EF4444',
                                  fontSize: 15,
                                  fontWeight: 700,
                                }}
                              >
                                {mod.change24h >= 0 ? '+' : ''}
                                {mod.change24h.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>P&L</p>
                              <p
                                style={{
                                  color: mod.pnl >= 0 ? '#10B981' : '#EF4444',
                                  fontSize: 15,
                                  fontWeight: 700,
                                }}
                              >
                                {mod.pnl >= 0 ? '+' : ''}${mod.pnl.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Allocation Bar */}
                          <div
                            className="w-full rounded-full overflow-hidden"
                            style={{ height: 4, background: c.bg }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${(mod.value / totalValue) * 100}%`,
                                background: mod.color,
                              }}
                            />
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </PageSection>

            {/* Refresh Button */}
            <button
              onClick={() => alert('Refreshing portfolio data...')}
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
              Refresh Data
            </button>

            {/* Module Boundary Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Arena Points are not included in portfolio value as they are points-only and not financial assets.
                Each module maintains separate accounting.
              </p>
            </div>
          </>
        )}

        {tab === 'Phan tich' && (
          <>
            {/* Performance Comparison */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                P&L by Module
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MODULE_DATA.filter((m) => m.module !== 'arena')}>
                  <XAxis
                    key="x-pnl"
                    dataKey="moduleName"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    key="y-pnl"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-pnl"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Bar key="bar-pnl" dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {MODULE_DATA.filter((m) => m.module !== 'arena').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Ranking */}
            <PageSection label="Performance Ranking">
              <div className="space-y-2">
                {[...MODULE_DATA]
                  .filter((m) => m.module !== 'arena')
                  .sort((a, b) => {
                    const aReturn = (a.pnl / (a.value - a.pnl)) * 100;
                    const bReturn = (b.pnl / (b.value - b.pnl)) * 100;
                    return bReturn - aReturn;
                  })
                  .map((mod, idx) => {
                    const Icon = mod.icon;
                    const returnPercent = (mod.pnl / (mod.value - mod.pnl)) * 100;
                    return (
                      <div
                        key={mod.module}
                        className="rounded-xl p-3 flex items-center justify-between"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center" style={{ width: 24 }}>
                            {idx === 0 && <TrendingUp size={18} color="#10B981" />}
                            {idx > 0 && (
                              <p style={{ color: c.text2, fontSize: 13, fontWeight: 700 }}>
                                #{idx + 1}
                              </p>
                            )}
                          </div>
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${mod.color}20`,
                            }}
                          >
                            <Icon size={16} color={mod.color} />
                          </div>
                          <div>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                              {mod.moduleName.replace(' Holdings', '').replace(' Positions', '').replace(' Orders', '').replace(' Markets', '').replace(' Plans', '')}
                            </p>
                            <p style={{ color: c.text3, fontSize: 10 }}>
                              ${mod.value.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            style={{
                              color: returnPercent >= 0 ? '#10B981' : '#EF4444',
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {returnPercent >= 0 ? '+' : ''}
                            {returnPercent.toFixed(2)}%
                          </p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {mod.pnl >= 0 ? '+' : ''}${mod.pnl.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </PageSection>

            {/* Allocation vs Performance */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Allocation Analysis
              </p>
              <div className="space-y-3">
                {MODULE_DATA.filter((m) => m.module !== 'arena' && m.value > 0).map((mod) => {
                  const allocation = (mod.value / totalValue) * 100;
                  const returnPercent = (mod.pnl / (mod.value - mod.pnl)) * 100;
                  return (
                    <div key={mod.module}>
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text2, fontSize: 11 }}>
                          {mod.moduleName.replace(' Holdings', '').replace(' Positions', '').replace(' Orders', '').replace(' Markets', '').replace(' Plans', '')}
                        </p>
                        <div className="flex items-center gap-2">
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                            {allocation.toFixed(1)}%
                          </p>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: returnPercent >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: returnPercent >= 0 ? '#10B981' : '#EF4444',
                            }}
                          >
                            {returnPercent >= 0 ? '+' : ''}
                            {returnPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: c.bg }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${allocation}%`,
                            background: mod.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'Lich su' && (
          <>
            {/* Portfolio Growth Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Growth History
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={PERFORMANCE_HISTORY}>
                  <XAxis
                    key="x-trend"
                    dataKey="date"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-trend"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-trend"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Legend key="legend" />
                  <Line key="line-wallet" type="monotone" dataKey="wallet" stroke={MODULE_COLORS.wallet} strokeWidth={2} />
                  <Line key="line-trading" type="monotone" dataKey="trading" stroke={MODULE_COLORS.trading} strokeWidth={2} />
                  <Line key="line-p2p" type="monotone" dataKey="p2p" stroke={MODULE_COLORS.p2p} strokeWidth={2} />
                  <Line key="line-predictions" type="monotone" dataKey="predictions" stroke={MODULE_COLORS.predictions} strokeWidth={2} />
                  <Line key="line-dca" type="monotone" dataKey="dca" stroke={MODULE_COLORS.dca} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Module Growth Stats */}
            <PageSection label="Module Growth (6 months)">
              <div className="space-y-2">
                {MODULE_DATA.filter((m) => m.module !== 'arena').map((mod) => {
                  const oldValue = PERFORMANCE_HISTORY[0][mod.module as keyof typeof PERFORMANCE_HISTORY[0]] as number;
                  const newValue = mod.value;
                  const growth = ((newValue - oldValue) / oldValue) * 100;
                  return (
                    <div
                      key={mod.module}
                      className="rounded-xl p-3"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-center justify-between">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {mod.moduleName}
                        </p>
                        <div className="text-right">
                          <p
                            style={{
                              color: growth >= 0 ? '#10B981' : '#EF4444',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {growth >= 0 ? '+' : ''}
                            {growth.toFixed(1)}%
                          </p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            ${oldValue.toLocaleString()} → ${newValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}