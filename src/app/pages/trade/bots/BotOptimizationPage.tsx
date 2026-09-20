import React, { useState } from 'react';
import { Zap, TrendingUp, Settings, Play, CheckCircle2 } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, ZAxis, Cell } from 'recharts';
import { toast } from 'sonner';

const OPTIMIZATION_RESULTS = [
  { id: 1, param1: 10, param2: 50, sharpe: 1.23, returns: 35.2, drawdown: -12.4 },
  { id: 2, param1: 15, param2: 45, sharpe: 1.67, returns: 48.7, drawdown: -10.2 },
  { id: 3, param1: 20, param2: 40, sharpe: 2.14, returns: 68.7, drawdown: -8.9 },
  { id: 4, param1: 25, param2: 35, sharpe: 1.89, returns: 55.3, drawdown: -11.7 },
  { id: 5, param1: 30, param2: 30, sharpe: 1.45, returns: 42.1, drawdown: -14.3 },
  { id: 6, param1: 35, param2: 25, sharpe: 1.12, returns: 31.8, drawdown: -16.8 },
  { id: 7, param1: 40, param2: 20, sharpe: 0.94, returns: 24.5, drawdown: -19.2 },
];

export function BotOptimizationPage() {
  const c = useThemeColors();
  const [step, setStep] = useState<'config' | 'running' | 'results'>('config');
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState(3);

  const handleOptimize = () => {
    setStep('running');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('results'), 500);
          return 100;
        }
        return p + 5;
      });
    }, 200);
  };

  const bestResult = OPTIMIZATION_RESULTS.reduce((best, current) => 
    current.sharpe > best.sharpe ? current : best
  );

  if (step === 'running') {
    return (
      <PageLayout>
        <Header title="Optimizing..." back={false} />
        <PageContent>
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(${c.primary} ${progress * 3.6}deg, ${c.surface2} 0deg)` }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: c.surface }}>
                <Zap size={40} color={c.primary} />
              </div>
            </div>
            <div className="text-center">
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                {progress}%
              </p>
              <p style={{ color: c.text2, fontSize: 13 }}>
                Testing {Math.floor(progress / 100 * 7)} / 7 parameter combinations...
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: c.surface2 }}>
                <div 
                  className="h-full transition-all duration-300"
                  style={{ background: c.primary, width: `${progress}%` }}
                />
              </div>
              <p style={{ color: c.text3, fontSize: 10, textAlign: 'center' }}>
                Using genetic algorithm for optimal parameter search
              </p>
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (step === 'results') {
    const selected = OPTIMIZATION_RESULTS.find(r => r.id === selectedResult) || bestResult;

    return (
      <PageLayout variant="flush">
        <Header title="Optimization Results" back />
        <PageContent grow>
          {/* Best Result Banner */}
          <div className="rounded-2xl p-4 mb-4" 
            style={{ background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <div className="flex gap-3">
              <CheckCircle2 size={24} color="#10B981" className="shrink-0" />
              <div>
                <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  ✅ Optimal Parameters Found
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  Grid Count: <strong>{bestResult.param1}</strong>, Grid Range: <strong>{bestResult.param2}%</strong> 
                  {' '}→ Sharpe Ratio: <strong>{bestResult.sharpe}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Performance Scatter Plot */}
          <PageSection label="Sharpe Ratio vs Returns">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <XAxis 
                    key="x-axis"
                    type="number" 
                    dataKey="returns" 
                    name="Returns"
                    stroke={c.text3}
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'Returns (%)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: c.text3 } }}
                  />
                  <YAxis 
                    key="y-axis"
                    type="number" 
                    dataKey="sharpe" 
                    name="Sharpe"
                    stroke={c.text3}
                    style={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'Sharpe Ratio', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: c.text3 } }}
                  />
                  <ZAxis key="z-axis" type="number" dataKey="id" range={[100, 400]} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Returns') return [`${value}%`, 'Returns'];
                      if (name === 'Sharpe') return [value, 'Sharpe Ratio'];
                      return [value, name];
                    }}
                  />
                  <Scatter key="scatter" name="Parameter Sets" data={OPTIMIZATION_RESULTS}>
                    {OPTIMIZATION_RESULTS.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.id === bestResult.id ? '#10B981' : entry.id === selectedResult ? c.primary : c.text3}
                        opacity={entry.id === bestResult.id || entry.id === selectedResult ? 1 : 0.3}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Best (Sharpe)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.primary }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.text3, opacity: 0.3 }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Other</span>
                </div>
              </div>
            </TrCard>
          </PageSection>

          {/* Results Table */}
          <PageSection label="All Tested Parameters">
            <TrCard className="p-4">
              <div className="space-y-2">
                {OPTIMIZATION_RESULTS.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResult(result.id)}
                    className="w-full p-3 rounded-xl text-left"
                    style={{
                      background: result.id === selectedResult ? `${c.primary}08` : c.surface2,
                      border: `1px solid ${result.id === selectedResult ? c.primary : result.id === bestResult.id ? '#10B981' : c.borderSolid}`,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text3, fontSize: 11 }}>#{idx + 1}</span>
                        {result.id === bestResult.id && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                            Best
                          </span>
                        )}
                      </div>
                      <p style={{ color: result.sharpe >= 2 ? '#10B981' : result.sharpe >= 1.5 ? c.primary : c.text3, fontSize: 14, fontWeight: 700 }}>
                        Sharpe: {result.sharpe}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2" style={{ background: c.surface }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Grid Count</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{result.param1}</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: c.surface }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Grid Range</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{result.param2}%</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: c.surface }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Returns</p>
                        <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>+{result.returns}%</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </TrCard>
          </PageSection>

          {/* Selected Parameters Detail */}
          <PageSection label="Selected Parameters">
            <TrCard className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Grid Count</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{selected.param1}</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Grid Range</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{selected.param2}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Sharpe</p>
                  <p style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>{selected.sharpe}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Returns</p>
                  <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>+{selected.returns}%</p>
                </div>
                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Drawdown</p>
                  <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>{selected.drawdown}%</p>
                </div>
              </div>
            </TrCard>
          </PageSection>

          {/* Warning */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex gap-3">
              <Settings size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Overfitting Warning
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                  Parameters optimized on historical data may not perform as well in future markets. 
                  Consider walk-forward testing or out-of-sample validation before deploying.
                </p>
              </div>
            </div>
          </div>
        </PageContent>

        <StickyFooter>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('config')}
              className="flex-1 py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Re-optimize
            </button>
            <button
              onClick={() => toast.success('Parameters applied to bot config')}
              className="flex-1 py-3 rounded-[14px] text-sm font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Use These Parameters
            </button>
          </div>
        </StickyFooter>
      </PageLayout>
    );
  }

  // Configuration step
  return (
    <PageLayout variant="flush">
      <Header title="Parameter Optimization" back />
      
      <PageContent grow>
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Zap size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Automated Parameter Tuning
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                Use genetic algorithms to find optimal bot parameters that maximize Sharpe ratio 
                while minimizing drawdown. This typically takes 2-5 minutes.
              </p>
            </div>
          </div>
        </div>

        <PageSection label="Optimization Target">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { id: 'sharpe', label: 'Maximize Sharpe Ratio', desc: 'Best risk-adjusted returns', selected: true },
                { id: 'returns', label: 'Maximize Total Returns', desc: 'Highest absolute profit', selected: false },
                { id: 'drawdown', label: 'Minimize Drawdown', desc: 'Lowest risk', selected: false },
              ].map(opt => (
                <div key={opt.id} className="p-3 rounded-xl" 
                  style={{ 
                    background: opt.selected ? `${c.primary}08` : c.surface2,
                    border: `1px solid ${opt.selected ? c.primary : c.borderSolid}`,
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: opt.selected ? c.primary : c.borderSolid }}>
                      {opt.selected && <div className="w-2 h-2 rounded-full m-0.5" style={{ background: c.primary }} />}
                    </div>
                    <p style={{ color: opt.selected ? c.primary : c.text1, fontSize: 13, fontWeight: 600 }}>
                      {opt.label}
                    </p>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, paddingLeft: 24 }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        <PageSection label="Parameter Ranges">
          <TrCard className="p-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: c.text2, fontSize: 12 }}>Grid Count</label>
                  <span style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>10 - 40</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="5"
                  defaultValue="25"
                  className="w-full"
                  style={{ accentColor: c.primary }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: c.text2, fontSize: 12 }}>Grid Range (%)</label>
                  <span style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>20 - 50%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="5"
                  defaultValue="35"
                  className="w-full"
                  style={{ accentColor: c.primary }}
                />
              </div>
            </div>
          </TrCard>
        </PageSection>

        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            How It Works
          </p>
          <ul className="space-y-2">
            {[
              'Tests multiple parameter combinations',
              'Backtests each combination on historical data',
              'Ranks results by target metric (Sharpe Ratio)',
              'Recommends optimal parameters',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span style={{ color: c.text3 }}>•</span>
                <p style={{ color: c.text3, fontSize: 11 }}>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContent>

      <StickyFooter>
        <button
          onClick={handleOptimize}
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: c.primary, color: '#FFF' }}>
          <Play size={16} />
          Start Optimization
        </button>
      </StickyFooter>
    </PageLayout>
  );
}