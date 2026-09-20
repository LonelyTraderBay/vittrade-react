import React, { useState } from 'react';
import { BarChart3, TrendingUp, Target, Award, Activity } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const PNL_DATA = [
  { date: 'Mar 1', pnl: 12.5 },
  { date: 'Mar 2', pnl: 28.3 },
  { date: 'Mar 3', pnl: 45.7 },
  { date: 'Mar 4', pnl: 32.1 },
  { date: 'Mar 5', pnl: 58.9 },
  { date: 'Mar 6', pnl: 91.2 },
  { date: 'Mar 7', pnl: 127.4 },
  { date: 'Mar 8', pnl: 199.3 },
];

const WIN_LOSS_DATA = [
  { week: 'W1', wins: 18, losses: 7 },
  { week: 'W2', wins: 22, losses: 5 },
  { week: 'W3', wins: 15, losses: 12 },
  { week: 'W4', wins: 25, losses: 8 },
];

const STRATEGY_PERFORMANCE = [
  { strategy: 'DCA', pnl: 84.2, color: '#3B82F6' },
  { strategy: 'Grid', pnl: 127.4, color: '#F59E0B' },
  { strategy: 'Momentum', pnl: -12.3, color: '#10B981' },
];

const TRADE_DURATION_DATA = [
  { duration: '<1h', count: 45 },
  { duration: '1-6h', count: 28 },
  { duration: '6-24h', count: 15 },
  { duration: '>24h', count: 8 },
];

export function BotPerformanceAnalyticsPage() {
  const c = useThemeColors();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  const metrics = {
    totalPnL: 199.30,
    winRate: 68.2,
    sharpeRatio: 1.87,
    avgWin: 12.30,
    avgLoss: -8.50,
    profitFactor: 2.14,
    totalTrades: 96,
    bestTrade: 42.80,
    worstTrade: -24.50,
  };

  return (
    <PageLayout>
      <Header title="Performance Analytics" back />

      <PageContent>
        {/* Key Metrics */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Total PnL</p>
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                +${metrics.totalPnL.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Win Rate</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {metrics.winRate}%
              </p>
            </div>
            <div className="text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Sharpe Ratio</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {metrics.sharpeRatio}
              </p>
            </div>
          </div>
          <div className="rounded-xl p-2" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <p style={{ color: '#10B981', fontSize: 12, textAlign: 'center' }}>
              ✅ Excellent performance - Sharpe &gt; 1.5 indicates strong risk-adjusted returns
            </p>
          </div>
        </TrCard>

        {/* Timeframe Selector */}
        <TabBar
          variant="pill"
          tabs={[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ]}
          active={timeframe}
          onChange={setTimeframe as any}
        />

        {/* Cumulative PnL Chart */}
        <PageSection label="Cumulative PnL">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PNL_DATA}>
                <XAxis 
                  key="x-axis"
                  dataKey="date" 
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  key="y-axis"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: c.text1, fontWeight: 700 }}
                  formatter={(value: any) => [`$${value}`, 'PnL']}
                />
                <Line 
                  key="line-pnl"
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Win/Loss Distribution */}
        <PageSection label="Win/Loss Distribution">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WIN_LOSS_DATA}>
                <XAxis 
                  key="x-axis"
                  dataKey="week" 
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  key="y-axis"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                />
                <Legend 
                  key="legend"
                  wrapperStyle={{ fontSize: 12, color: c.text2 }}
                />
                <Bar key="bar-wins" dataKey="wins" fill="#10B981" radius={[4, 4, 0, 0]} name="Wins" />
                <Bar key="bar-losses" dataKey="losses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Strategy Breakdown */}
        <PageSection label="Performance by Strategy">
          <TrCard className="p-4">
            <div className="space-y-3">
              {STRATEGY_PERFORMANCE.map(strat => {
                const isProfitable = strat.pnl >= 0;
                return (
                  <div key={strat.strategy}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: strat.color }} />
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{strat.strategy} Bot</p>
                      </div>
                      <p style={{ color: isProfitable ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                        {isProfitable ? '+' : ''}{strat.pnl.toFixed(2)} USDT
                      </p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div 
                        className="h-full"
                        style={{ 
                          background: strat.color,
                          width: `${Math.abs(strat.pnl) / 127.4 * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
        </PageSection>

        {/* Advanced Metrics */}
        <PageSection label="Advanced Metrics">
          <div className="grid grid-cols-2 gap-3">
            <TrCard className="p-4">
              <Target size={20} color="#3B82F6" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 12 }}>Profit Factor</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{metrics.profitFactor}</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Gross profit / Gross loss
              </p>
            </TrCard>
            <TrCard className="p-4">
              <Award size={20} color="#F59E0B" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 12 }}>Avg Win</p>
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>+${metrics.avgWin}</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Per winning trade
              </p>
            </TrCard>
            <TrCard className="p-4">
              <TrendingUp size={20} color="#10B981" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 12 }}>Best Trade</p>
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>+${metrics.bestTrade}</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Largest single win
              </p>
            </TrCard>
            <TrCard className="p-4">
              <Activity size={20} color="#EF4444" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 12 }}>Avg Loss</p>
              <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>{metrics.avgLoss}</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                Per losing trade
              </p>
            </TrCard>
          </div>
        </PageSection>

        {/* Trade Duration Analysis */}
        <PageSection label="Trade Duration Distribution">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  key="pie-duration"
                  data={TRADE_DURATION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="count"
                  label={(entry) => `${entry.duration}: ${entry.count}`}
                  labelLine={false}
                  style={{ fontSize: 10, fill: c.text1 }}>
                  {TRADE_DURATION_DATA.map((entry, index) => (
                    <Cell key={`cell-duration-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index]} />
                  ))}
                </Pie>
                <Tooltip
                  key="tooltip-pie"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Performance Summary */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Performance Summary
          </p>
          <div className="space-y-2">
            {[
              { label: 'Total Trades', value: metrics.totalTrades, suffix: 'trades' },
              { label: 'Win Rate', value: `${metrics.winRate}%`, suffix: '(45W / 21L)' },
              { label: 'Sharpe Ratio', value: metrics.sharpeRatio, suffix: '(Excellent)' },
              { label: 'Profit Factor', value: metrics.profitFactor, suffix: '(Good)' },
              { label: 'Best Trade', value: `+$${metrics.bestTrade}`, suffix: '' },
              { label: 'Worst Trade', value: `$${metrics.worstTrade}`, suffix: '' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text2, fontSize: 12 }}>{item.label}</p>
                <div className="text-right">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{item.value}</p>
                  {item.suffix && (
                    <p style={{ color: c.text3, fontSize: 10 }}>{item.suffix}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Performance Rating */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Award size={20} color="#10B981" className="shrink-0 mt-1" />
            <div>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Excellent Performance (A+)
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Your bots are performing above average. Sharpe ratio &gt; 1.5, win rate &gt; 65%, and profit factor &gt; 2 
                indicate strong risk-adjusted returns. Keep monitoring and adjusting as market conditions change.
              </p>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}