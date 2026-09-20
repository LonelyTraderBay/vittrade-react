import React, { useState } from 'react';
import { TrendingUp, Activity, Target, BarChart3 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { LineChart, Line, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const EQUITY_DATA = [
  { date: '2025-09-01', equity: 1000, buyHold: 1000, rolling: null },
  { date: '2025-09-15', equity: 1042, buyHold: 1035, rolling: null },
  { date: '2025-10-01', equity: 1087, buyHold: 1098, rolling: 1.52 },
  { date: '2025-10-15', equity: 1134, buyHold: 1076, rolling: 1.67 },
  { date: '2025-11-01', equity: 1189, buyHold: 1142, rolling: 1.89 },
  { date: '2025-11-15', equity: 1245, buyHold: 1198, rolling: 2.01 },
  { date: '2025-12-01', equity: 1298, buyHold: 1256, rolling: 2.14 },
  { date: '2025-12-15', equity: 1356, buyHold: 1289, rolling: 2.07 },
  { date: '2026-01-01', equity: 1423, buyHold: 1334, rolling: 1.94 },
  { date: '2026-01-15', equity: 1489, buyHold: 1412, rolling: 1.89 },
  { date: '2026-02-01', equity: 1556, buyHold: 1478, rolling: 1.92 },
  { date: '2026-02-15', equity: 1623, buyHold: 1534, rolling: 1.97 },
  { date: '2026-03-01', equity: 1689, buyHold: 1589, rolling: 2.02 },
  { date: '2026-03-08', equity: 1745, buyHold: 1621, rolling: 2.08 },
];

const MONTHLY_RETURNS = [
  { month: 'Sep 2025', botReturn: 4.2, marketReturn: 3.5, alpha: 0.7 },
  { month: 'Oct 2025', botReturn: 4.3, marketReturn: 6.1, alpha: -1.8 },
  { month: 'Nov 2025', botReturn: 4.9, marketReturn: 4.0, alpha: 0.9 },
  { month: 'Dec 2025', botReturn: 4.4, marketReturn: 3.7, alpha: 0.7 },
  { month: 'Jan 2026', botReturn: 4.8, marketReturn: 5.1, alpha: -0.3 },
  { month: 'Feb 2026', botReturn: 4.7, marketReturn: 4.5, alpha: 0.2 },
  { month: 'Mar 2026', botReturn: 4.2, marketReturn: 3.8, alpha: 0.4 },
];

export function BotEquityCurvePage() {
  const c = useThemeColors();
  const [view, setView] = useState<'equity' | 'sharpe' | 'alpha'>('equity');

  const finalEquity = EQUITY_DATA[EQUITY_DATA.length - 1].equity;
  const initialEquity = EQUITY_DATA[0].equity;
  const totalReturn = ((finalEquity - initialEquity) / initialEquity) * 100;
  const buyHoldReturn = ((EQUITY_DATA[EQUITY_DATA.length - 1].buyHold - 1000) / 1000) * 100;
  const outperformance = totalReturn - buyHoldReturn;

  return (
    <PageLayout>
      <Header title="Equity Curve" back />

      <PageContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3 text-center">
            <p style={{ color: c.text3, fontSize: 10 }}>Bot Return</p>
            <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>+{totalReturn.toFixed(1)}%</p>
          </TrCard>
          <TrCard className="p-3 text-center">
            <p style={{ color: c.text3, fontSize: 10 }}>Buy & Hold</p>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>+{buyHoldReturn.toFixed(1)}%</p>
          </TrCard>
          <TrCard className="p-3 text-center">
            <p style={{ color: c.text3, fontSize: 10 }}>Alpha</p>
            <p style={{ color: outperformance >= 0 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 700 }}>
              {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(1)}%
            </p>
          </TrCard>
        </div>

        {/* View Tabs */}
        <TabBar
          variant="pill"
          tabs={[
            { id: 'equity', label: 'Equity Curve' },
            { id: 'sharpe', label: 'Rolling Sharpe' },
            { id: 'alpha', label: 'Monthly Alpha' },
          ]}
          active={view}
          onChange={setView as any}
        />

        {/* Charts */}
        {view === 'equity' && (
          <PageSection label="Equity Curve vs Buy & Hold">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={EQUITY_DATA}>
                  <defs key="gradient-defs">
                    <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    key="x-axis-eq"
                    dataKey="date" 
                    stroke={c.text3} 
                    style={{ fontSize: 9 }}
                    tickLine={false}
                    tickFormatter={val => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    key="y-axis-eq"
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={val => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    labelFormatter={val => new Date(val).toLocaleDateString()}
                  />
                  <Legend key="legend-eq" wrapperStyle={{ fontSize: 11 }} />
                  <Area 
                    key="area-eq"
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fill="url(#botGrad)" 
                    name="Bot"
                  />
                  <Line 
                    key="line-bm"
                    type="monotone" 
                    dataKey="buyHold" 
                    stroke={c.text3} 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Buy & Hold"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TrCard>
          </PageSection>
        )}

        {view === 'sharpe' && (
          <PageSection label="Rolling 30-Day Sharpe Ratio">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={EQUITY_DATA.filter(d => d.rolling !== null)}>
                  <XAxis 
                    key="x-axis-roll"
                    dataKey="date" 
                    stroke={c.text3} 
                    style={{ fontSize: 9 }}
                    tickLine={false}
                    tickFormatter={val => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    key="y-axis-roll"
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    domain={[0, 2.5]}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(value: any) => [value, 'Sharpe Ratio']}
                  />
                  <Line 
                    key="line-rolling"
                    type="monotone" 
                    dataKey="rolling" 
                    stroke={c.primary} 
                    strokeWidth={2}
                    dot={{ fill: c.primary, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Current', value: '2.08', status: 'Excellent' },
                  { label: 'Average', value: '1.94', status: 'Good' },
                  { label: 'Min', value: '1.52', status: 'Fair' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>{stat.label}</p>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{stat.value}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>{stat.status}</p>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>
        )}

        {view === 'alpha' && (
          <PageSection label="Monthly Alpha (Bot vs Market)">
            <TrCard className="p-4">
              <div className="space-y-3">
                {MONTHLY_RETURNS.map(month => (
                  <div key={month.month}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text2, fontSize: 11 }}>{month.month}</p>
                      <div className="flex items-center gap-3">
                        <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                          Bot: +{month.botReturn}%
                        </span>
                        <span style={{ color: c.text3, fontSize: 11 }}>
                          Mkt: +{month.marketReturn}%
                        </span>
                        <span style={{ 
                          color: month.alpha >= 0 ? '#10B981' : '#EF4444', 
                          fontSize: 11, 
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}>
                          {month.alpha >= 0 ? '+' : ''}{month.alpha}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div 
                        className="h-full"
                        style={{ 
                          background: month.alpha >= 0 ? '#10B981' : '#EF4444',
                          width: `${Math.min(Math.abs(month.alpha) * 20, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>
        )}

        {/* Performance Stats */}
        <PageSection label="Performance Statistics">
          <TrCard className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, label: 'Total Return', value: `+${totalReturn.toFixed(1)}%`, color: '#10B981' },
                { icon: Activity, label: 'Annualized Return', value: '+52.3%', color: '#10B981' },
                { icon: Target, label: 'Outperformance', value: `+${outperformance.toFixed(1)}%`, color: outperformance >= 0 ? '#10B981' : '#EF4444' },
                { icon: BarChart3, label: 'Avg Monthly', value: '+4.5%', color: c.text1 },
              ].map(stat => (
                <div key={stat.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <stat.icon size={20} color={stat.color} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p style={{ color: c.text3, fontSize: 10 }}>{stat.label}</p>
                    <p style={{ color: stat.color, fontSize: 16, fontWeight: 700 }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Analysis */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            ✅ Strong Outperformance
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>
                Bot returned +{totalReturn.toFixed(1)}% vs buy & hold +{buyHoldReturn.toFixed(1)}% (alpha: +{outperformance.toFixed(1)}%)
              </p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>
                Consistent positive alpha in 5 out of 7 months
              </p>
            </li>
            <li className="flex gap-2">
              <span style={{ color: c.text3 }}>•</span>
              <p style={{ color: c.text2, fontSize: 11 }}>
                Rolling Sharpe ratio stayed above 1.5 (excellent risk-adjusted returns)
              </p>
            </li>
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}