/**
 * ══════════════════════════════════════════════════════════════
 *  DCAPerformanceComparePage — DCA Advanced Feature 3/4
 * ══════════════════════════════════════════════════════════════
 *  Performance comparison: DCA vs Lump Sum, Side-by-side metrics,
 *  Volatility impact, Optimal scenarios for each strategy
 *  Pattern B — Page with Tabs (Compare/Scenarios/Analysis)
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
  TrendingUp, TrendingDown, Activity, Target, Zap,
  BarChart3, Info, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  LineChart, Line, ComposedChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const TABS = ['So sanh', 'Kich ban', 'Phan tich'] as const;
type Tab = typeof TABS[number];

const COMPARISON_DATA = [
  { month: 'Jan', dca: 1000, lumpSum: 1000, price: 42000 },
  { month: 'Feb', dca: 2053, lumpSum: 905, price: 38000 },
  { month: 'Mar', dca: 3089, lumpSum: 1071, price: 45000 },
  { month: 'Apr', dca: 4067, lumpSum: 976, price: 41000 },
  { month: 'May', dca: 5208, lumpSum: 1190, price: 50000 },
  { month: 'Jun', dca: 6188, lumpSum: 1143, price: 48000 },
  { month: 'Jul', dca: 7344, lumpSum: 1310, price: 55000 },
  { month: 'Aug', dca: 8375, lumpSum: 1238, price: 52000 },
  { month: 'Sep', dca: 9750, lumpSum: 1429, price: 60000 },
  { month: 'Oct', dca: 11042, lumpSum: 1381, price: 58000 },
  { month: 'Nov', dca: 13156, lumpSum: 1619, price: 68000 },
  { month: 'Dec', dca: 14500, lumpSum: 1548, price: 65000 },
];

const VOLATILITY_SCENARIOS = [
  {
    name: 'Low Volatility',
    dcaAdvantage: 2,
    lumpAdvantage: 8,
    scenario: 'Steady uptrend',
    description: 'Lump sum typically wins in low-volatility bull markets',
  },
  {
    name: 'Medium Volatility',
    dcaAdvantage: 5,
    lumpAdvantage: 5,
    scenario: 'Sideways market',
    description: 'Both strategies perform similarly',
  },
  {
    name: 'High Volatility',
    dcaAdvantage: 8,
    lumpAdvantage: 3,
    scenario: 'Sharp dips',
    description: 'DCA shines by buying dips consistently',
  },
  {
    name: 'Bear Market',
    dcaAdvantage: 9,
    lumpAdvantage: 2,
    scenario: 'Prolonged decline',
    description: 'DCA reduces average cost significantly',
  },
];

const RADAR_DATA = [
  {
    metric: 'Returns',
    DCA: 120,
    'Lump Sum': 155,
    fullMark: 200,
  },
  {
    metric: 'Risk Management',
    DCA: 180,
    'Lump Sum': 80,
    fullMark: 200,
  },
  {
    metric: 'Emotional Ease',
    DCA: 170,
    'Lump Sum': 90,
    fullMark: 200,
  },
  {
    metric: 'Timing Risk',
    DCA: 160,
    'Lump Sum': 60,
    fullMark: 200,
  },
  {
    metric: 'Flexibility',
    DCA: 150,
    'Lump Sum': 100,
    fullMark: 200,
  },
];

export function DCAPerformanceComparePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('So sanh');

  const dcaFinal = COMPARISON_DATA[COMPARISON_DATA.length - 1].dca;
  const lumpFinal = COMPARISON_DATA[COMPARISON_DATA.length - 1].lumpSum;
  const dcaInvested = 12000;
  const lumpInvested = 12000;
  const dcaReturn = ((dcaFinal - dcaInvested) / dcaInvested) * 100;
  const lumpReturn = ((lumpFinal - lumpInvested) / lumpInvested) * 100;
  const advantage = dcaReturn - lumpReturn;

  return (
    <PageLayout>
      <Header title="DCA vs Lump Sum" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'So sanh' && (
          <>
            {/* Strategy Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* DCA Card */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>DCA Strategy</p>
                <p style={{ color: '#10B981', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  ${dcaFinal.toLocaleString()}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 10 }}>Invested</p>
                    <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                      ${dcaInvested.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 10 }}>Return</p>
                    <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                      +{dcaReturn.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Lump Sum Card */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Lump Sum</p>
                <p style={{ color: '#3B82F6', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  ${lumpFinal.toLocaleString()}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 10 }}>Invested</p>
                    <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                      ${lumpInvested.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 10 }}>Return</p>
                    <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                      +{lumpReturn.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Banner */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: advantage > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${advantage > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} color={advantage > 0 ? '#10B981' : '#3B82F6'} />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {advantage > 0 ? 'DCA Strategy Wins' : 'Lump Sum Wins'}
                </p>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Outperformed by{' '}
                <span style={{ color: advantage > 0 ? '#10B981' : '#3B82F6', fontWeight: 700 }}>
                  {Math.abs(advantage).toFixed(2)}%
                </span>{' '}
                in this period
              </p>
            </div>

            {/* Performance Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Value Over Time
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={COMPARISON_DATA}>
                  <defs key="gradient-defs">
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
                    dataKey="month"
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
                    dataKey="dca"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDCA)"
                    name="DCA"
                  />
                  <Area
                    key="area-lump"
                    type="monotone"
                    dataKey="lumpSum"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLump)"
                    name="Lump Sum"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Side-by-Side Metrics */}
            <PageSection label="Key Metrics">
              <div className="space-y-2">
                {[
                  {
                    label: 'Average Entry Price',
                    dca: '$50,000',
                    lump: '$42,000',
                    winner: 'lump',
                  },
                  {
                    label: 'Max Drawdown',
                    dca: '-8.5%',
                    lump: '-15.2%',
                    winner: 'dca',
                  },
                  {
                    label: 'Volatility Exposure',
                    dca: 'Low',
                    lump: 'High',
                    winner: 'dca',
                  },
                  {
                    label: 'Timing Risk',
                    dca: 'Minimal',
                    lump: 'High',
                    winner: 'dca',
                  },
                  {
                    label: 'Upfront Capital',
                    dca: '$1,000/mo',
                    lump: '$12,000',
                    winner: 'dca',
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl p-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <p style={{ color: c.text2, fontSize: 11, marginBottom: 6 }}>{metric.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          background: metric.winner === 'dca' ? 'rgba(16,185,129,0.08)' : c.bg,
                        }}
                      >
                        <p
                          style={{
                            color: metric.winner === 'dca' ? '#10B981' : c.text1,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {metric.dca}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>DCA</p>
                      </div>
                      <div
                        className="rounded-lg p-2"
                        style={{
                          background: metric.winner === 'lump' ? 'rgba(59,130,246,0.08)' : c.bg,
                        }}
                      >
                        <p
                          style={{
                            color: metric.winner === 'lump' ? '#3B82F6' : c.text1,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {metric.lump}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>Lump Sum</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Kich ban' && (
          <>
            {/* Volatility Scenarios */}
            <PageSection label="Scenarios Analysis">
              {VOLATILITY_SCENARIOS.map((scenario) => (
                <div
                  key={scenario.name}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        {scenario.name}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{scenario.scenario}</p>
                    </div>
                  </div>

                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 12 }}>
                    {scenario.description}
                  </p>

                  {/* Advantage Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text3, fontSize: 10 }}>DCA Advantage</p>
                        <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                          {scenario.dcaAdvantage}/10
                        </p>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: c.bg }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${scenario.dcaAdvantage * 10}%`,
                            background: '#10B981',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text3, fontSize: 10 }}>Lump Sum Advantage</p>
                        <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                          {scenario.lumpAdvantage}/10
                        </p>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: c.bg }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${scenario.lumpAdvantage * 10}%`,
                            background: '#3B82F6',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Recommendations */}
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-start gap-2">
                <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Recommendation
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    DCA is optimal for volatile markets and when you want to reduce timing risk.
                    Lump sum can win in steady bull markets with low volatility.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Phan tich' && (
          <>
            {/* Radar Comparison */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Multi-Dimensional Comparison
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
                    key="radar-dca"
                    name="DCA"
                    dataKey="DCA"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Radar
                    key="radar-lump"
                    name="Lump Sum"
                    dataKey="Lump Sum"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Legend key="legend-radar" />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3">
              {/* DCA Pros/Cons */}
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  DCA Strategy
                </p>
                <div className="space-y-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Pros
                    </p>
                    <ul className="space-y-1">
                      {['Lower timing risk', 'Easier emotionally', 'Flexible budget'].map((pro) => (
                        <li key={pro} className="flex items-start gap-1.5">
                          <CheckCircle size={10} color="#10B981" style={{ marginTop: 2 }} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Cons
                    </p>
                    <ul className="space-y-1">
                      {['May miss rallies', 'Lower upside'].map((con) => (
                        <li key={con} className="flex items-start gap-1.5">
                          <AlertTriangle size={10} color="#F59E0B" style={{ marginTop: 2 }} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Lump Sum Pros/Cons */}
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Lump Sum
                </p>
                <div className="space-y-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Pros
                    </p>
                    <ul className="space-y-1">
                      {['Max time in market', 'Higher upside'].map((pro) => (
                        <li key={pro} className="flex items-start gap-1.5">
                          <CheckCircle size={10} color="#10B981" style={{ marginTop: 2 }} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Cons
                    </p>
                    <ul className="space-y-1">
                      {['High timing risk', 'Emotional stress', 'Large capital'].map((con) => (
                        <li key={con} className="flex items-start gap-1.5">
                          <AlertTriangle size={10} color="#F59E0B" style={{ marginTop: 2 }} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <Info size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                So sanh dua tren du lieu lich su cu the. Ket qua co the khac trong dieu kien thi truong khac.
                Khong dam bao hieu suat tuong lai.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}