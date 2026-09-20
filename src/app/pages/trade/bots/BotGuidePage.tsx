import React, { useState } from 'react';
import { BookOpen, Play, TrendingUp, Grid3x3, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { TabBar } from '../../../components/layout/TabBar';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';

const STRATEGIES = [
  {
    id: 'dca',
    name: 'DCA Bot (Dollar Cost Averaging)',
    icon: TrendingUp,
    color: '#3B82F6',
    difficulty: 'Beginner',
    description: 'Automatically buy crypto at regular intervals regardless of price.',
    howItWorks: [
      'Set investment amount (e.g., $100)',
      'Choose frequency (daily, weekly, monthly)',
      'Bot buys automatically on schedule',
      'Averages out market volatility',
      'Best for long-term accumulation',
    ],
    pros: [
      'Simplest strategy to understand',
      'Removes emotion from buying decisions',
      'Reduces timing risk',
      'Good for volatile markets',
    ],
    cons: [
      'No profit taking mechanism',
      'Continues buying in downtrends',
      'Requires consistent capital',
    ],
    bestFor: 'Long-term investors, beginners, volatile markets',
    example: {
      setup: 'Buy $100 BTC every Monday',
      duration: '6 months',
      result: 'Average buy price: $67,500 vs spot price: $68,450',
      profit: '+$127 (1.8%)',
    },
  },
  {
    id: 'grid',
    name: 'Grid Bot',
    icon: Grid3x3,
    color: '#F59E0B',
    difficulty: 'Intermediate',
    description: 'Place buy and sell orders at multiple price levels to profit from price fluctuations.',
    howItWorks: [
      'Define price range (e.g., $65,000 - $70,000)',
      'Set number of grids (e.g., 20 grids)',
      'Bot places buy/sell orders at each grid level',
      'Profits from each price swing',
      'Works best in sideways markets',
    ],
    pros: [
      'Profits from volatility',
      'No need to predict direction',
      'Automated 24/7 trading',
      'High win rate (70-80%)',
    ],
    cons: [
      'Loses money in strong trends',
      'Requires sufficient capital for all grids',
      'Can miss big moves outside range',
    ],
    bestFor: 'Sideways/ranging markets, active traders, volatility lovers',
    example: {
      setup: '20 grids, $65K-$70K range, $1,000 capital',
      duration: '1 month',
      result: '156 trades executed, 72.3% win rate',
      profit: '+$127.40 (12.7%)',
    },
  },
  {
    id: 'momentum',
    name: 'Momentum Bot',
    icon: Zap,
    color: '#10B981',
    difficulty: 'Advanced',
    description: 'Follow trends by buying when price rises and selling when it falls.',
    howItWorks: [
      'Monitor price movement and indicators',
      'Buy when uptrend detected (e.g., price > MA)',
      'Sell when downtrend detected',
      'Trail stop-loss to protect profits',
      'Best for trending markets',
    ],
    pros: [
      'Captures large trend movements',
      'Built-in stop-loss protection',
      'Can make big profits in trends',
      'Adapts to market conditions',
    ],
    cons: [
      'Frequent false signals in choppy markets',
      'Requires parameter tuning',
      'Can whipsaw in sideways markets',
    ],
    bestFor: 'Trending markets (bull/bear), experienced traders',
    example: {
      setup: 'MA crossover strategy, 3% stop-loss',
      duration: '2 months',
      result: '23 trades, 68.4% win rate',
      profit: '+$559 (55.9%)',
    },
  },
  {
    id: 'martingale',
    name: 'Martingale Bot',
    icon: AlertTriangle,
    color: '#EF4444',
    difficulty: 'Expert',
    description: 'Double position size after each loss to recover all losses with one win.',
    howItWorks: [
      'Start with base position (e.g., $100)',
      'If loss, double next position ($200)',
      'If loss again, double again ($400)',
      'One win recovers all previous losses',
      '⚠️ HIGH RISK - can blow up account',
    ],
    pros: [
      'High win rate (78%+)',
      'Recovers losses quickly',
      'Simple logic',
    ],
    cons: [
      'Catastrophic risk if many losses',
      'Requires large capital',
      'Can hit max drawdown (-30%+)',
      'Not suitable for beginners',
    ],
    bestFor: 'Experienced traders with large capital, high risk tolerance',
    example: {
      setup: 'Base $100, 2x multiplier, max 5 doublings',
      duration: '1 month',
      result: '312 trades, 78.9% win rate, max DD -28.7%',
      profit: '+$894 (89.4%) ⚠️ High risk',
    },
  },
];

const BEST_PRACTICES = [
  {
    title: 'Start Small',
    description: 'Begin with $50-200 to test strategies before scaling up.',
    icon: '💡',
  },
  {
    title: 'Backtest First',
    description: 'Always backtest your strategy on historical data before deploying.',
    icon: '📊',
  },
  {
    title: 'Set Stop-Loss',
    description: 'Use drawdown limits and emergency stops to protect capital.',
    icon: '🛡️',
  },
  {
    title: 'Monitor Daily',
    description: 'Check bot performance at least once a day for anomalies.',
    icon: '👁️',
  },
  {
    title: 'Diversify',
    description: 'Don\'t put all capital in one bot - spread across multiple strategies.',
    icon: '🎯',
  },
  {
    title: 'Avoid FOMO',
    description: 'Don\'t create bots during extreme market conditions.',
    icon: '⚠️',
  },
];

const COMMON_MISTAKES = [
  {
    mistake: 'Over-optimizing parameters',
    why: 'Parameters optimized on past data may not work in future.',
    fix: 'Use simple, robust parameters. Test walk-forward validation.',
  },
  {
    mistake: 'Ignoring fees',
    why: 'High-frequency bots can lose money purely from trading fees.',
    fix: 'Calculate fee impact. Aim for profit > 2x fees per trade.',
  },
  {
    mistake: 'No risk management',
    why: 'Bots can compound losses without stop-loss limits.',
    fix: 'Set max drawdown (-20%), daily loss limits, use emergency stop.',
  },
  {
    mistake: 'Changing strategy mid-run',
    why: 'Interrupts strategy logic, can cause losses.',
    fix: 'Let bot run for full cycle (7-30 days) before adjusting.',
  },
  {
    mistake: 'Using demo results as guarantee',
    why: 'Demo has no slippage, instant fills, no network issues.',
    fix: 'Expect real results to be 10-20% worse than demo.',
  },
];

export function BotGuidePage() {
  const c = useThemeColors();
  const [view, setView] = useState<'strategies' | 'best-practices' | 'mistakes'>('strategies');
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  return (
    <PageLayout>
      <Header title="Trading Bots Guide" back />

      <PageContent>
        {/* Intro Banner */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <BookOpen size={24} color="#3B82F6" className="shrink-0" />
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Complete Guide to Trading Bots
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Learn how each bot strategy works, when to use it, and how to avoid common mistakes. 
                Perfect for beginners and experienced traders.
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <TabBar
          variant="pill"
          tabs={['strategies', 'best-practices', 'mistakes']}
          active={view}
          onChange={setView as any}
        />

        {/* Strategies View */}
        {view === 'strategies' && (
          <PageSection label="Bot Strategies Explained">
            <div className="flex flex-col gap-3">
              {STRATEGIES.map(strategy => {
                const isExpanded = expandedStrategy === strategy.id;
                const StratIcon = strategy.icon;

                return (
                  <TrCard key={strategy.id} className="overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
                      className="w-full p-4 text-left">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${strategy.color}15` }}>
                          <StratIcon size={24} color={strategy.color} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p style={{ color: strategy.color, fontSize: 15, fontWeight: 700 }}>
                              {strategy.name}
                            </p>
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                              style={{
                                background: strategy.difficulty === 'Beginner' ? 'rgba(16,185,129,0.12)' 
                                  : strategy.difficulty === 'Intermediate' ? 'rgba(245,158,11,0.12)'
                                  : strategy.difficulty === 'Advanced' ? 'rgba(139,92,246,0.12)'
                                  : 'rgba(239,68,68,0.12)',
                                color: strategy.difficulty === 'Beginner' ? '#10B981' 
                                  : strategy.difficulty === 'Intermediate' ? '#F59E0B'
                                  : strategy.difficulty === 'Advanced' ? '#8B5CF6'
                                  : '#EF4444',
                              }}>
                              {strategy.difficulty}
                            </span>
                          </div>
                          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                            {strategy.description}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={20} color={c.text3} className="shrink-0" />
                        ) : (
                          <ChevronDown size={20} color={c.text3} className="shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4">
                        {/* How It Works */}
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                            How It Works:
                          </p>
                          <ol className="space-y-2 pl-4">
                            {strategy.howItWorks.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span style={{ color: strategy.color, fontWeight: 700, fontSize: 12 }}>{idx + 1}.</span>
                                <p style={{ color: c.text2, fontSize: 12 }}>{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Pros/Cons */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                            <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                              ✅ Pros
                            </p>
                            <ul className="space-y-1.5">
                              {strategy.pros.map((pro, idx) => (
                                <li key={idx} className="flex gap-1.5">
                                  <span style={{ color: '#10B981', fontSize: 10 }}>•</span>
                                  <p style={{ color: c.text2, fontSize: 10 }}>{pro}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)' }}>
                            <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                              ❌ Cons
                            </p>
                            <ul className="space-y-1.5">
                              {strategy.cons.map((con, idx) => (
                                <li key={idx} className="flex gap-1.5">
                                  <span style={{ color: '#EF4444', fontSize: 10 }}>•</span>
                                  <p style={{ color: c.text2, fontSize: 10 }}>{con}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Best For */}
                        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>BEST FOR:</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{strategy.bestFor}</p>
                        </div>

                        {/* Example */}
                        <div className="rounded-xl p-3" style={{ background: `${strategy.color}08`, border: `1px solid ${strategy.color}30` }}>
                          <p style={{ color: strategy.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                            📈 Example
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span style={{ color: c.text3, fontSize: 11 }}>Setup:</span>
                              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{strategy.example.setup}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: c.text3, fontSize: 11 }}>Duration:</span>
                              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{strategy.example.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: c.text3, fontSize: 11 }}>Result:</span>
                              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{strategy.example.result}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t" style={{ borderColor: c.borderSolid }}>
                              <span style={{ color: c.text3, fontSize: 11 }}>Profit:</span>
                              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>{strategy.example.profit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {/* Best Practices View */}
        {view === 'best-practices' && (
          <PageSection label="Best Practices">
            <div className="flex flex-col gap-3">
              {BEST_PRACTICES.map((practice, idx) => (
                <TrCard key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 32 }}>{practice.icon}</span>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {practice.title}
                      </p>
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        {practice.description}
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {/* Common Mistakes View */}
        {view === 'mistakes' && (
          <PageSection label="Common Mistakes to Avoid">
            <div className="flex flex-col gap-3">
              {COMMON_MISTAKES.map((item, idx) => (
                <TrCard key={idx} className="p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span style={{ color: '#EF4444', fontSize: 18, lineHeight: 1 }}>❌</span>
                    <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
                      {item.mistake}
                    </p>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>WHY IT'S BAD:</p>
                      <p style={{ color: c.text2, fontSize: 12 }}>{item.why}</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.08)' }}>
                      <p style={{ color: '#10B981', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>
                        ✅ HOW TO FIX:
                      </p>
                      <p style={{ color: c.text2, fontSize: 11 }}>{item.fix}</p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {/* Video Tutorials */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3 mb-3">
            <Play size={20} color={c.primary} />
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
              Video Tutorials
            </p>
          </div>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
            Watch our step-by-step video guides to master each bot strategy.
          </p>
          <button className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: c.primary, color: '#FFF' }}>
            View All Tutorials
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}