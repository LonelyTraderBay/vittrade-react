/**
 * ══════════════════════════════════════════════════════════════
 *  DCABacktesterPage — DCA Advanced Feature 1/4
 * ══════════════════════════════════════════════════════════════
 *  Strategy backtester: Test DCA strategy against historical data,
 *  Performance metrics, Drawdown analysis, Risk-adjusted returns
 *  Pattern B — Page with Tabs (Setup/Results/Analysis)
 *  Compliance: §15 No hype, clear disclaimers
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
  TrendingUp, TrendingDown, Activity, BarChart3, Target,
  Calendar, DollarSign, Percent, AlertTriangle, Info,
  Play, RefreshCw, Download,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';

const TABS = ['Cai dat', 'Ket qua', 'Phan tich'] as const;
type Tab = typeof TABS[number];

interface BacktestConfig {
  asset: string;
  startDate: string;
  endDate: string;
  investmentAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  strategy: 'fixed' | 'value_average' | 'buy_dips';
  dipThreshold?: number;
}

interface BacktestResult {
  totalInvested: number;
  finalValue: number;
  totalReturn: number;
  returnPercent: number;
  avgBuyPrice: number;
  totalShares: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  winRate: number;
  numberOfBuys: number;
}

const MOCK_HISTORICAL_DATA = [
  { date: '2024-01', price: 42000, dcaValue: 10000, lumpValue: 10000, dcaShares: 0.238 },
  { date: '2024-02', price: 38000, dcaValue: 20526, lumpValue: 9048, dcaShares: 0.501 },
  { date: '2024-03', price: 45000, dcaValue: 30889, lumpValue: 10714, dcaShares: 0.723 },
  { date: '2024-04', price: 41000, dcaValue: 40667, lumpValue: 9762, dcaShares: 0.967 },
  { date: '2024-05', price: 50000, dcaValue: 52083, lumpValue: 11905, dcaShares: 1.167 },
  { date: '2024-06', price: 48000, dcaValue: 61875, lumpValue: 11429, dcaShares: 1.375 },
  { date: '2024-07', price: 55000, dcaValue: 73438, lumpValue: 13095, dcaShares: 1.557 },
  { date: '2024-08', price: 52000, dcaValue: 83750, lumpValue: 12381, dcaShares: 1.750 },
  { date: '2024-09', price: 60000, dcaValue: 97500, lumpValue: 14286, dcaShares: 1.917 },
  { date: '2024-10', price: 58000, dcaValue: 110417, lumpValue: 13810, dcaShares: 2.084 },
  { date: '2024-11', price: 68000, dcaValue: 131563, lumpValue: 16190, dcaShares: 2.231 },
  { date: '2024-12', price: 65000, dcaValue: 145000, lumpValue: 15476, dcaShares: 2.400 },
];

const DRAWDOWN_DATA = [
  { date: '2024-01', drawdown: 0 },
  { date: '2024-02', drawdown: -9.5 },
  { date: '2024-03', drawdown: -2.1 },
  { date: '2024-04', drawdown: -8.9 },
  { date: '2024-05', drawdown: 0 },
  { date: '2024-06', drawdown: -4.0 },
  { date: '2024-07', drawdown: 0 },
  { date: '2024-08', drawdown: -5.5 },
  { date: '2024-09', drawdown: 0 },
  { date: '2024-10', drawdown: -3.3 },
  { date: '2024-11', drawdown: 0 },
  { date: '2024-12', drawdown: -4.4 },
];

export function DCABacktesterPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Cai dat');
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // Backtest config
  const [config, setConfig] = useState<BacktestConfig>({
    asset: 'BTC',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    investmentAmount: 1000,
    frequency: 'monthly',
    strategy: 'fixed',
    dipThreshold: 5,
  });

  // Mock results
  const results: BacktestResult = {
    totalInvested: 12000,
    finalValue: 145000,
    totalReturn: 133000,
    returnPercent: 1108.33,
    avgBuyPrice: 50000,
    totalShares: 2.4,
    maxDrawdown: -9.5,
    sharpeRatio: 2.34,
    volatility: 18.2,
    winRate: 75,
    numberOfBuys: 12,
  };

  const lumpSumReturn = ((15476 - 10000) / 10000) * 100;

  const runBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasResults(true);
      setTab('Ket qua');
    }, 2000);
  };

  return (
    <PageLayout>
      <Header title="DCA Backtester" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Cai dat' && (
          <>
            {/* Asset Selection */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Chon tai san
              </p>
              <div className="grid grid-cols-4 gap-2">
                {['BTC', 'ETH', 'BNB', 'SOL'].map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setConfig({ ...config, asset })}
                    className="py-2 rounded-xl transition-all"
                    style={{
                      background: config.asset === asset ? c.primary : c.bg,
                      color: config.asset === asset ? '#fff' : c.text1,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid ${config.asset === asset ? 'transparent' : c.border}`,
                    }}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Khung thoi gian
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Investment Amount & Frequency */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="mb-4">
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                  Investment Amount per Period (USD)
                </label>
                <input
                  type="number"
                  value={config.investmentAmount}
                  onChange={(e) => setConfig({ ...config, investmentAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Bi-weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'daily', label: 'Daily' },
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      onClick={() => setConfig({ ...config, frequency: freq.value as any })}
                      className="py-2 rounded-xl transition-all"
                      style={{
                        background: config.frequency === freq.value ? c.primary : c.bg,
                        color: config.frequency === freq.value ? '#fff' : c.text1,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${config.frequency === freq.value ? 'transparent' : c.border}`,
                      }}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategy Type */}
            <PageSection label="Chien luoc">
              <div className="space-y-2">
                {[
                  { value: 'fixed', label: 'Fixed Amount', desc: 'Invest same amount each period' },
                  { value: 'value_average', label: 'Value Averaging', desc: 'Adjust amount to reach target value' },
                  { value: 'buy_dips', label: 'Buy the Dips', desc: 'Invest more when price drops' },
                ].map((strategy) => (
                  <button
                    key={strategy.value}
                    onClick={() => setConfig({ ...config, strategy: strategy.value as any })}
                    className="w-full rounded-xl p-3 text-left transition-all hover:opacity-90"
                    style={{
                      background: config.strategy === strategy.value ? `${c.primary}15` : c.bg,
                      border: `1px solid ${config.strategy === strategy.value ? c.primary : c.border}`,
                    }}
                  >
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {strategy.label}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>{strategy.desc}</p>
                  </button>
                ))}
              </div>
            </PageSection>

            {/* Dip Threshold (if buy_dips) */}
            {config.strategy === 'buy_dips' && (
              <div
                className="rounded-xl p-3"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                  Dip Threshold (%)
                </label>
                <input
                  type="number"
                  value={config.dipThreshold}
                  onChange={(e) => setConfig({ ...config, dipThreshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text1, fontSize: 13 }}
                />
                <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                  Double investment when price drops by this %
                </p>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={runBacktest}
              disabled={isRunning}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {isRunning ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Backtest
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <Info size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Backtest dua tren du lieu lich su. Hieu suat qua khu khong dam bao ket qua tuong lai.
                Chi mang tinh tham khao.
              </p>
            </div>
          </>
        )}

        {tab === 'Ket qua' && hasResults && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Invested</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                  ${results.totalInvested.toLocaleString()}
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Final Value</p>
                <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                  ${results.finalValue.toLocaleString()}
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Return</p>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                  +${results.totalReturn.toLocaleString()}
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Return %</p>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                  +{results.returnPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Portfolio Growth Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Growth (DCA vs Lump Sum)
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={MOCK_HISTORICAL_DATA}>
                  <defs key="dca-gradient-defs">
                    <linearGradient id="colorDCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLump" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    key="x-axis"
                    dataKey="date"
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
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Legend key="legend" />
                  <Area
                    key="area-dca"
                    type="monotone"
                    dataKey="dcaValue"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDCA)"
                    name="DCA Strategy"
                  />
                  <Area
                    key="area-lump"
                    type="monotone"
                    dataKey="lumpValue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLump)"
                    name="Lump Sum"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Metrics */}
            <PageSection label="Performance Metrics">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="space-y-3">
                  {[
                    { label: 'Avg Buy Price', value: `$${results.avgBuyPrice.toLocaleString()}`, icon: DollarSign },
                    { label: 'Total Shares', value: results.totalShares.toFixed(4), icon: BarChart3 },
                    { label: 'Number of Buys', value: results.numberOfBuys.toString(), icon: Calendar },
                    { label: 'Max Drawdown', value: `${results.maxDrawdown}%`, icon: TrendingDown, negative: true },
                    { label: 'Sharpe Ratio', value: results.sharpeRatio.toFixed(2), icon: Target },
                    { label: 'Volatility', value: `${results.volatility}%`, icon: Activity },
                    { label: 'Win Rate', value: `${results.winRate}%`, icon: Percent },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <metric.icon size={14} color={c.text3} />
                        <p style={{ color: c.text2, fontSize: 12 }}>{metric.label}</p>
                      </div>
                      <p
                        style={{
                          color: metric.negative ? '#EF4444' : c.text1,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>

            {/* DCA Advantage */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp size={16} color="#10B981" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    DCA Advantage
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    DCA strategy outperformed lump sum by{' '}
                    <span style={{ color: '#10B981', fontWeight: 700 }}>
                      +{(results.returnPercent - lumpSumReturn).toFixed(2)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Phan tich' && hasResults && (
          <>
            {/* Drawdown Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Drawdown Analysis
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={DRAWDOWN_DATA}>
                  <defs key="dd-gradient-defs">
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    key="x-dd"
                    dataKey="date"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-dd"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-dd"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Area
                    key="area-dd"
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDrawdown)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Metrics */}
            <PageSection label="Risk Analysis">
              <div className="space-y-2">
                {[
                  {
                    label: 'Max Drawdown',
                    value: results.maxDrawdown,
                    status: results.maxDrawdown > -15 ? 'good' : results.maxDrawdown > -30 ? 'moderate' : 'high',
                    desc: 'Largest peak-to-trough decline',
                  },
                  {
                    label: 'Volatility',
                    value: results.volatility,
                    status: results.volatility < 20 ? 'good' : results.volatility < 40 ? 'moderate' : 'high',
                    desc: 'Standard deviation of returns',
                  },
                  {
                    label: 'Sharpe Ratio',
                    value: results.sharpeRatio,
                    status: results.sharpeRatio > 2 ? 'good' : results.sharpeRatio > 1 ? 'moderate' : 'high',
                    desc: 'Risk-adjusted return',
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl p-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{metric.label}</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{metric.desc}</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          background:
                            metric.status === 'good'
                              ? 'rgba(16,185,129,0.1)'
                              : metric.status === 'moderate'
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(239,68,68,0.1)',
                          color:
                            metric.status === 'good'
                              ? '#10B981'
                              : metric.status === 'moderate'
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      >
                        {metric.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      {metric.label === 'Max Drawdown' ? `${metric.value}%` : metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Download Report */}
            <button
              onClick={() => alert('Download report')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.bg,
                color: c.text1,
                fontSize: 14,
                fontWeight: 600,
                border: `1px solid ${c.border}`,
              }}
            >
              <Download size={18} />
              Download Report
            </button>
          </>
        )}

        {!hasResults && tab !== 'Cai dat' && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            <BarChart3 size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 4 }}>
              Chua co ket qua backtest
            </p>
            <p style={{ color: c.text3, fontSize: 11 }}>
              Vao tab "Cai dat" de chay backtest
            </p>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}