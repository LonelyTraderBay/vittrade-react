/**
 * ══════════════════════════════════════════════════════════════
 *  CrossModuleAnalytics — Cross-Module Feature 2/4
 * ══════════════════════════════════════════════════════════════
 *  Cross-module analytics: Performance across Trading/P2P/Predictions/Arena,
 *  ROI comparison, Module-wise metrics, Time-based analysis
 *  Pattern B — Page with Tabs (Performance/Metrics/Comparison)
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
  TrendingUp, TrendingDown, Activity, Target, DollarSign,
  BarChart3, Clock, Percent, Info, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, ComposedChart, Area,
} from 'recharts';

const TABS = ['Hieu suat', 'Chi so', 'So sanh'] as const;
type Tab = typeof TABS[number];

interface ModuleMetrics {
  module: string;
  moduleName: string;
  roi: number;
  totalTrades: number;
  winRate: number;
  avgTradeSize: number;
  totalVolume: number;
  activeTime: number; // hours
  riskScore: number; // 0-100
}

const MODULE_METRICS: ModuleMetrics[] = [
  {
    module: 'trading',
    moduleName: 'Spot Trading',
    roi: 12.5,
    totalTrades: 245,
    winRate: 62,
    avgTradeSize: 850,
    totalVolume: 208250,
    activeTime: 48,
    riskScore: 65,
  },
  {
    module: 'p2p',
    moduleName: 'P2P Trading',
    roi: 1.2,
    totalTrades: 28,
    winRate: 96,
    avgTradeSize: 1200,
    totalVolume: 33600,
    activeTime: 12,
    riskScore: 35,
  },
  {
    module: 'predictions',
    moduleName: 'Prediction Markets',
    roi: 18.3,
    totalTrades: 87,
    winRate: 58,
    avgTradeSize: 320,
    totalVolume: 27840,
    activeTime: 24,
    riskScore: 72,
  },
  {
    module: 'dca',
    moduleName: 'DCA Strategy',
    roi: 9.8,
    totalTrades: 12,
    winRate: 100, // All executed
    avgTradeSize: 1000,
    totalVolume: 12000,
    activeTime: 6,
    riskScore: 25,
  },
];

const RADAR_DATA = MODULE_METRICS.map((m) => ({
  metric: m.moduleName.replace(' Trading', '').replace(' Markets', '').replace(' Strategy', ''),
  roi: m.roi * 5, // Scale for visibility
  winRate: m.winRate,
  volume: (m.totalVolume / 2500), // Scale down
  fullMark: 100,
}));

const MONTHLY_PERFORMANCE = [
  { month: 'Jan', trading: 8, p2p: 1, predictions: 15, dca: 9 },
  { month: 'Feb', trading: 10, p2p: 1.5, predictions: 12, dca: 9.5 },
  { month: 'Mar', trading: 9, p2p: 0.8, predictions: 20, dca: 10 },
  { month: 'Apr', trading: 11, p2p: 1.2, predictions: 16, dca: 9.8 },
  { month: 'May', trading: 13, p2p: 1.4, predictions: 19, dca: 10.2 },
  { month: 'Jun', trading: 12.5, p2p: 1.2, predictions: 18.3, dca: 9.8 },
];

const RISK_RETURN_DATA = MODULE_METRICS.map((m) => ({
  name: m.moduleName.replace(' Trading', '').replace(' Markets', '').replace(' Strategy', ''),
  risk: m.riskScore,
  return: m.roi,
}));

export function CrossModuleAnalytics() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Hieu suat');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const totalROI = MODULE_METRICS.reduce((sum, m) => sum + m.roi, 0) / MODULE_METRICS.length;
  const totalTrades = MODULE_METRICS.reduce((sum, m) => sum + m.totalTrades, 0);
  const totalVolume = MODULE_METRICS.reduce((sum, m) => sum + m.totalVolume, 0);
  const avgWinRate =
    MODULE_METRICS.reduce((sum, m) => sum + m.winRate, 0) / MODULE_METRICS.length;

  const bestModule = [...MODULE_METRICS].sort((a, b) => b.roi - a.roi)[0];
  const mostActiveModule = [...MODULE_METRICS].sort((a, b) => b.totalTrades - a.totalTrades)[0];

  return (
    <PageLayout>
      <Header title="Cross-Module Analytics" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Hieu suat' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg ROI</p>
                <p style={{ color: '#10B981', fontSize: 22, fontWeight: 700 }}>
                  +{totalROI.toFixed(1)}%
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Trades</p>
                <p style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>
                  {totalTrades.toLocaleString()}
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Volume</p>
                <p style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>
                  ${(totalVolume / 1000).toFixed(0)}K
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg Win Rate</p>
                <p style={{ color: '#10B981', fontSize: 22, fontWeight: 700 }}>
                  {avgWinRate.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Best Performers */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} color="#10B981" />
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Best ROI</p>
                </div>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  {bestModule.moduleName}
                </p>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                  +{bestModule.roi.toFixed(1)}%
                </p>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} color="#3B82F6" />
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Most Active</p>
                </div>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  {mostActiveModule.moduleName}
                </p>
                <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700 }}>
                  {mostActiveModule.totalTrades} trades
                </p>
              </div>
            </div>

            {/* ROI Comparison Bar Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                ROI by Module
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MODULE_METRICS}>
                  <XAxis
                    key="x-roi"
                    dataKey="moduleName"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    key="y-roi"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    label={{ value: 'ROI %', angle: -90, position: 'insideLeft', fill: c.text3, fontSize: 10 }}
                  />
                  <Tooltip
                    key="tooltip-roi"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Bar key="bar-roi" dataKey="roi" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Performance Trend */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Monthly ROI Trends
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MONTHLY_PERFORMANCE}>
                  <XAxis
                    key="x-trend"
                    dataKey="month"
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
                  <Legend key="legend-trend" />
                  <Line key="line-trading" type="monotone" dataKey="trading" stroke="#10B981" strokeWidth={2} name="Trading" />
                  <Line key="line-p2p" type="monotone" dataKey="p2p" stroke="#F59E0B" strokeWidth={2} name="P2P" />
                  <Line key="line-predictions" type="monotone" dataKey="predictions" stroke="#8B5CF6" strokeWidth={2} name="Predictions" />
                  <Line key="line-dca" type="monotone" dataKey="dca" stroke="#6366F1" strokeWidth={2} name="DCA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'Chi so' && (
          <>
            {/* Radar Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Multi-Metric Comparison
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid key="polar-grid" stroke={c.border} />
                  <PolarAngleAxis
                    key="polar-angle"
                    dataKey="metric"
                    tick={{ fill: c.text2, fontSize: 10 }}
                  />
                  <PolarRadiusAxis key="polar-radius" tick={{ fill: c.text3, fontSize: 9 }} />
                  <Radar
                    key="radar-roi"
                    name="ROI"
                    dataKey="roi"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Radar
                    key="radar-winrate"
                    name="Win Rate"
                    dataKey="winRate"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    key="radar-volume"
                    name="Volume"
                    dataKey="volume"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.3}
                  />
                  <Legend key="legend-radar" />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Metrics Table */}
            <PageSection label="Chi tiet chi so">
              {MODULE_METRICS.map((mod) => (
                <div
                  key={mod.module}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    {mod.moduleName}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>ROI</p>
                      <p style={{ color: '#10B981', fontSize: 15, fontWeight: 700 }}>
                        +{mod.roi.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Win Rate</p>
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                        {mod.winRate.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total Trades</p>
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                        {mod.totalTrades}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Avg Size</p>
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                        ${mod.avgTradeSize.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total Volume</p>
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                        ${(mod.totalVolume / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Active Time</p>
                      <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                        {mod.activeTime}h
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p style={{ color: c.text3, fontSize: 10 }}>Risk Score</p>
                      <p
                        style={{
                          color:
                            mod.riskScore > 70
                              ? '#EF4444'
                              : mod.riskScore > 50
                              ? '#F59E0B'
                              : '#10B981',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {mod.riskScore}/100
                      </p>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 6, background: c.bg }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${mod.riskScore}%`,
                          background:
                            mod.riskScore > 70
                              ? '#EF4444'
                              : mod.riskScore > 50
                              ? '#F59E0B'
                              : '#10B981',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>
          </>
        )}

        {tab === 'So sanh' && (
          <>
            {/* Risk vs Return Scatter */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Risk vs Return Analysis
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={RISK_RETURN_DATA}>
                  <XAxis
                    key="x-rr"
                    dataKey="risk"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    label={{ value: 'Risk Score', position: 'insideBottom', offset: -5, fill: c.text3, fontSize: 10 }}
                  />
                  <YAxis
                    key="y-rr"
                    dataKey="return"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                    label={{ value: 'ROI %', angle: -90, position: 'insideLeft', fill: c.text3, fontSize: 10 }}
                  />
                  <Tooltip
                    key="tooltip-rr"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Bar key="bar-return" dataKey="return" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Line key="line-risk" type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Efficiency Metrics */}
            <PageSection label="Efficiency Comparison">
              <div className="space-y-2">
                {[...MODULE_METRICS]
                  .sort((a, b) => b.roi / b.riskScore - a.roi / a.riskScore)
                  .map((mod, idx) => {
                    const efficiency = (mod.roi / mod.riskScore) * 100;
                    return (
                      <div
                        key={mod.module}
                        className="rounded-xl p-3"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-center" style={{ width: 24 }}>
                              {idx === 0 ? (
                                <Target size={16} color="#10B981" />
                              ) : (
                                <p style={{ color: c.text2, fontSize: 12, fontWeight: 700 }}>
                                  #{idx + 1}
                                </p>
                              )}
                            </div>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                              {mod.moduleName}
                            </p>
                          </div>
                          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
                            {efficiency.toFixed(1)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p style={{ color: c.text3, fontSize: 9 }}>ROI</p>
                            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                              {mod.roi.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 9 }}>Risk</p>
                            <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                              {mod.riskScore}/100
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 9 }}>Efficiency</p>
                            <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                              {efficiency.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </PageSection>

            {/* Arena Disclosure */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <Zap size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Open Arena metrics are not included in financial analytics as Arena uses points-only system.
                See Arena leaderboard for trust and performance metrics.
              </p>
            </div>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Metrics calculated independently per module. Cross-module comparison helps identify best strategies.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}