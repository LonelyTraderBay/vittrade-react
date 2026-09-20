import React, { useState } from 'react';
import { GitCompare, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const STRATEGIES = [
  { 
    id: 'dca', 
    name: 'DCA Bot', 
    color: '#3B82F6',
    metrics: {
      totalReturn: 42.3,
      sharpeRatio: 1.52,
      maxDrawdown: -8.4,
      winRate: 65.2,
      profitFactor: 1.87,
      totalTrades: 89,
      avgTradeDuration: '24h',
      volatility: 12.4,
    },
  },
  { 
    id: 'grid', 
    name: 'Grid Bot', 
    color: '#F59E0B',
    metrics: {
      totalReturn: 68.7,
      sharpeRatio: 2.14,
      maxDrawdown: -12.1,
      winRate: 72.3,
      profitFactor: 2.45,
      totalTrades: 234,
      avgTradeDuration: '6h',
      volatility: 18.7,
    },
  },
  { 
    id: 'momentum', 
    name: 'Momentum Bot', 
    color: '#10B981',
    metrics: {
      totalReturn: 55.9,
      sharpeRatio: 1.89,
      maxDrawdown: -15.3,
      winRate: 68.4,
      profitFactor: 2.12,
      totalTrades: 156,
      avgTradeDuration: '12h',
      volatility: 22.3,
    },
  },
  { 
    id: 'martingale', 
    name: 'Martingale Bot', 
    color: '#8B5CF6',
    metrics: {
      totalReturn: 89.4,
      sharpeRatio: 1.34,
      maxDrawdown: -28.7,
      winRate: 78.9,
      profitFactor: 2.87,
      totalTrades: 312,
      avgTradeDuration: '4h',
      volatility: 34.2,
    },
  },
];

const EQUITY_DATA = [
  { date: 'Sep', dca: 1042, grid: 1068, momentum: 1055, martingale: 1089 },
  { date: 'Oct', dca: 1087, grid: 1142, momentum: 1128, martingale: 1178 },
  { date: 'Nov', dca: 1134, grid: 1223, momentum: 1198, martingale: 1267 },
  { date: 'Dec', dca: 1189, grid: 1298, momentum: 1256, martingale: 1345 },
  { date: 'Jan', dca: 1245, grid: 1387, momentum: 1334, martingale: 1456 },
  { date: 'Feb', dca: 1298, grid: 1478, momentum: 1412, martingale: 1589 },
  { date: 'Mar', dca: 1423, grid: 1687, momentum: 1559, martingale: 1894 },
];

export function BotStrategyComparePage() {
  const c = useThemeColors();
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['grid', 'momentum']);

  const toggleStrategy = (id: string) => {
    if (selectedStrategies.includes(id)) {
      if (selectedStrategies.length > 1) {
        setSelectedStrategies(selectedStrategies.filter(s => s !== id));
      }
    } else {
      if (selectedStrategies.length < 4) {
        setSelectedStrategies([...selectedStrategies, id]);
      }
    }
  };

  const compareData = selectedStrategies.map(id => STRATEGIES.find(s => s.id === id)!);
  const bestStrategy = compareData.reduce((best, current) => 
    current.metrics.sharpeRatio > best.metrics.sharpeRatio ? current : best
  );

  // Radar chart data
  const radarData = [
    { metric: 'Return', ...Object.fromEntries(selectedStrategies.map(id => {
      const strat = STRATEGIES.find(s => s.id === id)!;
      return [strat.name, (strat.metrics.totalReturn / 100) * 100];
    })) },
    { metric: 'Sharpe', ...Object.fromEntries(selectedStrategies.map(id => {
      const strat = STRATEGIES.find(s => s.id === id)!;
      return [strat.name, (strat.metrics.sharpeRatio / 3) * 100];
    })) },
    { metric: 'Win Rate', ...Object.fromEntries(selectedStrategies.map(id => {
      const strat = STRATEGIES.find(s => s.id === id)!;
      return [strat.name, strat.metrics.winRate];
    })) },
    { metric: 'Profit Factor', ...Object.fromEntries(selectedStrategies.map(id => {
      const strat = STRATEGIES.find(s => s.id === id)!;
      return [strat.name, (strat.metrics.profitFactor / 3) * 100];
    })) },
    { metric: 'Low Risk', ...Object.fromEntries(selectedStrategies.map(id => {
      const strat = STRATEGIES.find(s => s.id === id)!;
      return [strat.name, Math.max(0, 100 + strat.metrics.maxDrawdown)];
    })) },
  ];

  return (
    <PageLayout>
      <Header title="Strategy Compare" back />

      <PageContent>
        {/* Strategy Selection */}
        <PageSection label="Select Strategies (2-4)">
          <div className="grid grid-cols-2 gap-2">
            {STRATEGIES.map(strategy => {
              const isSelected = selectedStrategies.includes(strategy.id);
              return (
                <button
                  key={strategy.id}
                  onClick={() => toggleStrategy(strategy.id)}
                  className="p-3 rounded-xl text-left"
                  style={{
                    background: isSelected ? `${strategy.color}15` : c.surface,
                    border: `2px solid ${isSelected ? strategy.color : c.borderSolid}`,
                    opacity: isSelected || selectedStrategies.length < 4 ? 1 : 0.5,
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center"
                      style={{ borderColor: isSelected ? strategy.color : c.borderSolid }}>
                      {isSelected && <CheckCircle2 size={14} color={strategy.color} />}
                    </div>
                    <p style={{ color: isSelected ? strategy.color : c.text1, fontSize: 13, fontWeight: 700 }}>
                      {strategy.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>Return</p>
                      <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                        +{strategy.metrics.totalReturn}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>Sharpe</p>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                        {strategy.metrics.sharpeRatio}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </PageSection>

        {/* Best Strategy */}
        <div className="rounded-2xl p-4" 
          style={{ background: `${bestStrategy.color}08`, border: `2px solid ${bestStrategy.color}30` }}>
          <div className="flex gap-3">
            <Award size={24} color={bestStrategy.color} className="shrink-0" />
            <div>
              <p style={{ color: bestStrategy.color, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Best Risk-Adjusted Returns
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                <strong>{bestStrategy.name}</strong> has the highest Sharpe ratio ({bestStrategy.metrics.sharpeRatio}) 
                among selected strategies, indicating superior risk-adjusted performance.
              </p>
            </div>
          </div>
        </div>

        {/* Equity Curves Comparison */}
        <PageSection label="Equity Curves Comparison">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={EQUITY_DATA}>
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
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: c.text1, fontWeight: 700 }}
                />
                <Legend 
                  key="legend"
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="line"
                />
                {selectedStrategies.map(id => {
                  const strat = STRATEGIES.find(s => s.id === id)!;
                  return (
                    <Line 
                      key={id}
                      type="monotone" 
                      dataKey={id} 
                      stroke={strat.color} 
                      strokeWidth={2}
                      dot={false}
                      name={strat.name}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Radar Comparison */}
        <PageSection label="Performance Radar">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid key="polar-grid" stroke={c.borderSolid} />
                <PolarAngleAxis 
                  key="polar-angle"
                  dataKey="metric" 
                  stroke={c.text2}
                  style={{ fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  key="polar-radius"
                  angle={90} 
                  domain={[0, 100]}
                  stroke={c.text3}
                  style={{ fontSize: 9 }}
                />
                {selectedStrategies.map(id => {
                  const strat = STRATEGIES.find(s => s.id === id)!;
                  return (
                    <Radar
                      key={id}
                      name={strat.name}
                      dataKey={strat.name}
                      stroke={strat.color}
                      fill={strat.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  );
                })}
                <Legend key="legend-radar" wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Metrics Comparison Table */}
        <PageSection label="Detailed Metrics">
          <TrCard className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.borderSolid}` }}>
                    <th style={{ color: c.text3, fontSize: 10, fontWeight: 600, textAlign: 'left', paddingBottom: 8 }}>
                      Metric
                    </th>
                    {compareData.map(strat => (
                      <th key={strat.id} style={{ color: strat.color, fontSize: 10, fontWeight: 700, textAlign: 'center', paddingBottom: 8 }}>
                        {strat.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'totalReturn', label: 'Total Return', suffix: '%', best: 'highest' },
                    { key: 'sharpeRatio', label: 'Sharpe Ratio', suffix: '', best: 'highest' },
                    { key: 'maxDrawdown', label: 'Max Drawdown', suffix: '%', best: 'lowest' },
                    { key: 'winRate', label: 'Win Rate', suffix: '%', best: 'highest' },
                    { key: 'profitFactor', label: 'Profit Factor', suffix: '', best: 'highest' },
                    { key: 'totalTrades', label: 'Total Trades', suffix: '', best: 'neutral' },
                    { key: 'avgTradeDuration', label: 'Avg Duration', suffix: '', best: 'neutral' },
                    { key: 'volatility', label: 'Volatility', suffix: '%', best: 'lowest' },
                  ].map((row, idx) => {
                    const values = compareData.map(s => s.metrics[row.key as keyof typeof s.metrics]);
                    const bestValue = row.best === 'highest' 
                      ? Math.max(...values.filter(v => typeof v === 'number') as number[])
                      : row.best === 'lowest'
                      ? Math.min(...values.filter(v => typeof v === 'number') as number[])
                      : null;

                    return (
                      <tr key={row.key} style={{ borderBottom: idx < 7 ? `1px solid ${c.borderSolid}` : 'none' }}>
                        <td style={{ color: c.text2, fontSize: 11, paddingTop: 8, paddingBottom: 8 }}>
                          {row.label}
                        </td>
                        {compareData.map(strat => {
                          const value = strat.metrics[row.key as keyof typeof strat.metrics];
                          const isBest = bestValue !== null && value === bestValue;
                          return (
                            <td key={strat.id} style={{ 
                              color: isBest ? strat.color : c.text1, 
                              fontSize: 11, 
                              fontWeight: isBest ? 700 : 600,
                              textAlign: 'center',
                              paddingTop: 8, 
                              paddingBottom: 8,
                            }}>
                              {typeof value === 'number' ? value : value}{row.suffix}
                              {isBest && ' ★'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TrCard>
        </PageSection>

        {/* Recommendations */}
        <PageSection label="Which Strategy to Choose?">
          <div className="flex flex-col gap-3">
            {[
              {
                title: 'For Beginners',
                strategy: 'DCA Bot',
                color: '#3B82F6',
                reason: 'Lowest risk (drawdown -8.4%), simplest to understand, steady returns over time.',
              },
              {
                title: 'For Sideways Markets',
                strategy: 'Grid Bot',
                color: '#F59E0B',
                reason: 'Best Sharpe ratio (2.14), high win rate (72.3%), optimized for range-bound trading.',
              },
              {
                title: 'For Trending Markets',
                strategy: 'Momentum Bot',
                color: '#10B981',
                reason: 'Captures trends effectively, balanced risk-reward, good for bull/bear markets.',
              },
              {
                title: 'For Experienced Traders',
                strategy: 'Martingale Bot',
                color: '#8B5CF6',
                reason: 'Highest returns (+89.4%) but high risk (drawdown -28.7%). Requires large capital.',
              },
            ].map(rec => (
              <TrCard key={rec.title} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${rec.color}15` }}>
                    <TrendingUp size={20} color={rec.color} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>{rec.title}</p>
                    <p style={{ color: rec.color, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      {rec.strategy}
                    </p>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      {rec.reason}
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Analysis Note */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Analysis Period
          </p>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
            All strategies backtested on BTC/USDT from Sep 2025 - Mar 2026 with $1,000 initial capital. 
            Results assume same market conditions - actual performance will vary.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}