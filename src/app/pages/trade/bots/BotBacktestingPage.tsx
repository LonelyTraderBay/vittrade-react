import React, { useState } from 'react';
import { Play, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Calendar } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const STRATEGIES = [
  { id: 'dca', name: 'DCA Bot', color: '#3B82F6' },
  { id: 'grid', name: 'Grid Bot', color: '#F59E0B' },
  { id: 'momentum', name: 'Momentum Bot', color: '#10B981' },
  { id: 'martingale', name: 'Martingale Bot', color: '#8B5CF6' },
];

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'];

const BACKTEST_RESULTS = {
  equityCurve: [
    { date: '2025-09-01', equity: 1000 },
    { date: '2025-09-15', equity: 1045 },
    { date: '2025-10-01', equity: 1120 },
    { date: '2025-10-15', equity: 1098 },
    { date: '2025-11-01', equity: 1187 },
    { date: '2025-11-15', equity: 1234 },
    { date: '2025-12-01', equity: 1298 },
    { date: '2025-12-15', equity: 1356 },
    { date: '2026-01-01', equity: 1402 },
    { date: '2026-01-15', equity: 1478 },
    { date: '2026-02-01', equity: 1523 },
    { date: '2026-02-15', equity: 1612 },
    { date: '2026-03-01', equity: 1689 },
    { date: '2026-03-08', equity: 1745 },
  ],
  drawdownData: [
    { date: '2025-09-01', drawdown: 0 },
    { date: '2025-09-15', drawdown: -2.1 },
    { date: '2025-10-01', drawdown: 0 },
    { date: '2025-10-15', drawdown: -4.5 },
    { date: '2025-11-01', drawdown: 0 },
    { date: '2025-11-15', drawdown: -1.8 },
    { date: '2025-12-01', drawdown: 0 },
    { date: '2025-12-15', drawdown: -3.2 },
    { date: '2026-01-01', drawdown: 0 },
    { date: '2026-01-15', drawdown: -2.7 },
    { date: '2026-02-01', drawdown: 0 },
    { date: '2026-02-15', drawdown: -1.4 },
    { date: '2026-03-01', drawdown: 0 },
    { date: '2026-03-08', drawdown: -0.8 },
  ],
  monthlyReturns: [
    { month: 'Sep', returns: 4.5 },
    { month: 'Oct', returns: 7.2 },
    { month: 'Nov', returns: 8.9 },
    { month: 'Dec', returns: 6.4 },
    { month: 'Jan', returns: 9.1 },
    { month: 'Feb', returns: 11.3 },
    { month: 'Mar', returns: 7.8 },
  ],
};

export function BotBacktestingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [step, setStep] = useState<'config' | 'running' | 'results'>('config');
  const [selectedStrategy, setSelectedStrategy] = useState('grid');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [dateRange, setDateRange] = useState('6m');
  const [capital, setCapital] = useState('1000');
  const [progress, setProgress] = useState(0);

  const handleRunBacktest = () => {
    setStep('running');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('results'), 500);
          return 100;
        }
        return p + 10;
      });
    }, 300);
  };

  const handleDeploy = () => {
    toast.success('Redirecting to create bot with these parameters...');
    navigate('/trade/bots');
  };

  const metrics = {
    finalEquity: 1745,
    totalReturn: 74.5,
    returnPercent: 74.5,
    sharpeRatio: 2.14,
    maxDrawdown: -4.5,
    winRate: 72.3,
    totalTrades: 234,
    avgWin: 15.8,
    avgLoss: -8.2,
    profitFactor: 2.87,
    bestTrade: 48.3,
    worstTrade: -22.1,
  };

  if (step === 'running') {
    return (
      <PageLayout>
        <Header title="Running Backtest..." back={false} />
        <PageContent>
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(${c.primary} ${progress * 3.6}deg, ${c.surface2} 0deg)` }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: c.surface }}>
                <BarChart3 size={40} color={c.primary} />
              </div>
            </div>
            <div className="text-center">
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                {progress}%
              </p>
              <p style={{ color: c.text2, fontSize: 13 }}>
                {progress < 30 && 'Loading historical data...'}
                {progress >= 30 && progress < 60 && 'Simulating trades...'}
                {progress >= 60 && progress < 90 && 'Calculating metrics...'}
                {progress >= 90 && 'Generating report...'}
              </p>
            </div>
            <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div 
                className="h-full transition-all duration-300"
                style={{ background: c.primary, width: `${progress}%` }}
              />
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (step === 'results') {
    const recommendation = metrics.sharpeRatio >= 1.5 && metrics.maxDrawdown > -10;
    
    return (
      <PageLayout variant="flush">
        <Header title="Backtest Results" back action={{ icon: CheckCircle2, onClick: handleDeploy }} />
        <PageContent grow>
          {/* Recommendation Banner */}
          <div className="rounded-2xl p-4 mb-4" 
            style={{ 
              background: recommendation ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', 
              border: `2px solid ${recommendation ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
            <div className="flex gap-3">
              {recommendation ? (
                <CheckCircle2 size={24} color="#10B981" className="shrink-0" />
              ) : (
                <AlertTriangle size={24} color="#F59E0B" className="shrink-0" />
              )}
              <div>
                <p style={{ color: recommendation ? '#10B981' : '#F59E0B', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {recommendation ? '✅ Recommended to Deploy' : '⚠️ Optimize Before Deploy'}
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  {recommendation 
                    ? 'Strong risk-adjusted returns (Sharpe > 1.5) and low drawdown. This strategy performed well historically.'
                    : 'Consider adjusting parameters or testing a different date range to improve Sharpe ratio and reduce drawdown.'}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <TrCard className="p-3 text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Total Return</p>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                +${metrics.totalReturn}
              </p>
              <p style={{ color: '#10B981', fontSize: 11 }}>+{metrics.returnPercent}%</p>
            </TrCard>
            <TrCard className="p-3 text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Sharpe Ratio</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                {metrics.sharpeRatio}
              </p>
              <p style={{ color: '#10B981', fontSize: 11 }}>Excellent</p>
            </TrCard>
            <TrCard className="p-3 text-center">
              <p style={{ color: c.text3, fontSize: 10 }}>Max Drawdown</p>
              <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                {metrics.maxDrawdown}%
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Low risk</p>
            </TrCard>
          </div>

          {/* Equity Curve */}
          <PageSection label="Equity Curve">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={BACKTEST_RESULTS.equityCurve}>
                  <defs key="equity-gradient-defs">
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    key="y-axis-eq"
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                    formatter={(value: any) => [`$${value}`, 'Equity']}
                  />
                  <Area 
                    key="area-equity"
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fill="url(#equityGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TrCard>
          </PageSection>

          {/* Drawdown Chart */}
          <PageSection label="Drawdown Over Time">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={BACKTEST_RESULTS.drawdownData}>
                  <defs key="dd-gradient-defs">
                    <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    key="x-axis-dd"
                    dataKey="date" 
                    stroke={c.text3} 
                    style={{ fontSize: 9 }}
                    tickLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    key="y-axis-dd"
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(value: any) => [`${value}%`, 'Drawdown']}
                  />
                  <Area 
                    key="area-dd"
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    fill="url(#ddGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TrCard>
          </PageSection>

          {/* Monthly Returns */}
          <PageSection label="Monthly Returns">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={BACKTEST_RESULTS.monthlyReturns}>
                  <XAxis 
                    key="x-axis-mr"
                    dataKey="month" 
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis 
                    key="y-axis-mr"
                    stroke={c.text3} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(value: any) => [`${value}%`, 'Return']}
                  />
                  <Bar key="bar-returns" dataKey="returns" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TrCard>
          </PageSection>

          {/* Detailed Metrics */}
          <PageSection label="Performance Metrics">
            <TrCard className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Win Rate', value: `${metrics.winRate}%`, color: '#10B981' },
                  { label: 'Total Trades', value: metrics.totalTrades, color: c.text1 },
                  { label: 'Profit Factor', value: metrics.profitFactor, color: '#10B981' },
                  { label: 'Avg Win', value: `+$${metrics.avgWin}`, color: '#10B981' },
                  { label: 'Avg Loss', value: `$${metrics.avgLoss}`, color: '#EF4444' },
                  { label: 'Best Trade', value: `+$${metrics.bestTrade}`, color: '#10B981' },
                  { label: 'Worst Trade', value: `$${metrics.worstTrade}`, color: '#EF4444' },
                  { label: 'Final Equity', value: `$${metrics.finalEquity}`, color: c.text1 },
                ].map((metric, idx) => (
                  <div key={idx} className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 10 }}>{metric.label}</p>
                    <p style={{ color: metric.color, fontSize: 14, fontWeight: 700 }}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>

          {/* Disclaimer */}
          <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              ⚠️ Backtest Disclaimer
            </p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
              Past performance does not guarantee future results. Actual trading will incur slippage, fees, and execution delays 
              not reflected in this backtest. Use these results as a guideline, not a guarantee.
            </p>
          </div>
        </PageContent>

        <StickyFooter>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('config')}
              className="flex-1 py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Back to Config
            </button>
            <button
              onClick={handleDeploy}
              className="flex-1 py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: recommendation ? '#10B981' : c.primary, color: '#FFF' }}>
              <CheckCircle2 size={16} />
              {recommendation ? 'Deploy Bot' : 'Deploy Anyway'}
            </button>
          </div>
        </StickyFooter>
      </PageLayout>
    );
  }

  // Configuration step
  return (
    <PageLayout variant="flush">
      <Header title="Backtest Strategy" back />
      
      <PageContent grow>
        <PageSection label="Strategy Selection">
          <div className="grid grid-cols-2 gap-2">
            {STRATEGIES.map(strategy => (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy.id)}
                className="p-3 rounded-xl text-left"
                style={{
                  background: selectedStrategy === strategy.id ? `${strategy.color}15` : c.surface,
                  border: `2px solid ${selectedStrategy === strategy.id ? strategy.color : c.borderSolid}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: strategy.color }} />
                  <p style={{ color: selectedStrategy === strategy.id ? strategy.color : c.text1, fontSize: 13, fontWeight: 700 }}>
                    {strategy.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </PageSection>

        <PageSection label="Trading Pair">
          <div className="grid grid-cols-3 gap-2">
            {PAIRS.map(pair => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: selectedPair === pair ? c.primary : c.surface,
                  color: selectedPair === pair ? '#FFF' : c.text1,
                  border: `1px solid ${selectedPair === pair ? c.primary : c.borderSolid}`,
                }}>
                {pair}
              </button>
            ))}
          </div>
        </PageSection>

        <PageSection label="Date Range">
          <div className="grid grid-cols-4 gap-2">
            {['1m', '3m', '6m', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: dateRange === range ? c.primary : c.surface,
                  color: dateRange === range ? '#FFF' : c.text1,
                  border: `1px solid ${dateRange === range ? c.primary : c.borderSolid}`,
                }}>
                {range === '1m' && '1 Month'}
                {range === '3m' && '3 Months'}
                {range === '6m' && '6 Months'}
                {range === '1y' && '1 Year'}
              </button>
            ))}
          </div>
        </PageSection>

        <PageSection label="Initial Capital">
          <div className="flex items-center gap-3 rounded-2xl px-4"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, height: 52 }}>
            <input
              type="number"
              inputMode="decimal"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 16, flex: 1, fontFamily: 'monospace' }}
            />
            <span style={{ color: c.text3, fontSize: 13 }}>USDT</span>
          </div>
        </PageSection>

        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Calendar size={18} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Backtest Period
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                Testing {selectedStrategy.toUpperCase()} strategy on {selectedPair} from{' '}
                {dateRange === '1m' && 'Feb 8 - Mar 8, 2026'}
                {dateRange === '3m' && 'Dec 8, 2025 - Mar 8, 2026'}
                {dateRange === '6m' && 'Sep 8, 2025 - Mar 8, 2026'}
                {dateRange === '1y' && 'Mar 8, 2025 - Mar 8, 2026'}
                {' '}with ${capital} initial capital.
              </p>
            </div>
          </div>
        </div>
      </PageContent>

      <StickyFooter>
        <button
          onClick={handleRunBacktest}
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: c.primary, color: '#FFF' }}>
          <Play size={16} />
          Run Backtest
        </button>
      </StickyFooter>
    </PageLayout>
  );
}