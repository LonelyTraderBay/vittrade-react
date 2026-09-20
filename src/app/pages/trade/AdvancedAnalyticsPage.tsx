/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED ANALYTICS PAGE — P3 Features Showcase
 * ══════════════════════════════════════════════════════════════════
 *  AI Signals, Risk Analysis, Trade Journal, Position Sizing
 */

import React, { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { AITradingSignals, type AISignal } from '../../components/trading/AITradingSignals';
import { PortfolioRiskAnalyzer, type RiskMetrics } from '../../components/trading/PortfolioRiskAnalyzer';
import { TradeJournal, type TradeEntry, type JournalStats } from '../../components/trading/TradeJournal';
import { PositionSizingCalculator } from '../../components/trading/PositionSizingCalculator';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';
import { Brain, Shield, BookOpen, Calculator, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */

const MOCK_AI_SIGNALS: AISignal[] = [
  {
    id: 'sig-1',
    timestamp: Date.now() - 3600000,
    pair: 'BTC/USDT',
    direction: 'long',
    confidence: 85,
    timeframe: '4h',
    entryPrice: 67500,
    targetPrice: 70200,
    stopLoss: 66800,
    riskRewardRatio: 3.9,
    modelVersion: 'GPT-4 + TradingView v2.1',
    features: {
      technicalScore: 82,
      sentimentScore: 88,
      volumeScore: 76,
      momentumScore: 91,
    },
    reasoning: [
      'RSI oversold bounce from 32 → 45, bullish divergence confirmed',
      'Volume spike +320% on 4h candle, strong accumulation detected',
      'Breaking above 20-day EMA with increasing volume',
      'Whale wallets accumulated +$1.2B in last 24h (Glassnode)',
      'Funding rate dropped to -0.02%, shorts overleveraged',
    ],
    status: 'active',
    accuracy: 73,
  },
  {
    id: 'sig-2',
    timestamp: Date.now() - 7200000,
    pair: 'ETH/USDT',
    direction: 'short',
    confidence: 72,
    timeframe: '1h',
    entryPrice: 3245,
    targetPrice: 3180,
    stopLoss: 3270,
    riskRewardRatio: 2.6,
    modelVersion: 'GPT-4 + TradingView v2.1',
    features: {
      technicalScore: 68,
      sentimentScore: 65,
      volumeScore: 78,
      momentumScore: 72,
    },
    reasoning: [
      'Double top pattern forming at $3,250 resistance',
      'Bearish divergence: price higher but RSI lower',
      'Volume declining on each rally attempt',
      'ETH/BTC ratio weakening (underperformance vs BTC)',
    ],
    status: 'active',
    accuracy: 68,
  },
  {
    id: 'sig-3',
    timestamp: Date.now() - 1800000,
    pair: 'SOL/USDT',
    direction: 'long',
    confidence: 91,
    timeframe: '15m',
    entryPrice: 145,
    targetPrice: 151,
    stopLoss: 143.5,
    riskRewardRatio: 4.0,
    modelVersion: 'GPT-4 + TradingView v2.1',
    features: {
      technicalScore: 94,
      sentimentScore: 85,
      volumeScore: 92,
      momentumScore: 95,
    },
    reasoning: [
      'Breakout from ascending triangle (3-day consolidation)',
      'Volume explosion +580%, institutional flow detected',
      'All moving averages aligned bullish (5/10/20/50/200)',
      'Solana ecosystem TVL +12% this week (DeFiLlama)',
      'Major airdrop announcement driving FOMO',
    ],
    status: 'active',
    accuracy: 78,
  },
];

const MOCK_RISK_METRICS: RiskMetrics = {
  var95: 5.2,
  var99: 8.1,
  varWeekly: 12.3,
  sharpeRatio: 1.82,
  sortinoRatio: 2.34,
  calmarRatio: 3.15,
  maxDrawdown: 18.5,
  currentDrawdown: 4.2,
  drawdownDuration: 3,
  volatility: 42.8,
  downsideVolatility: 28.3,
  beta: 1.15,
  correlation: 0.78,
  overallRiskScore: 58,
  riskLevel: 'medium',
};

const MOCK_TRADES: TradeEntry[] = [
  {
    id: 'trade-1',
    timestamp: Date.now() - 86400000,
    pair: 'BTC/USDT',
    side: 'long',
    entryPrice: 66800,
    exitPrice: 68200,
    size: 0.5,
    leverage: 3,
    pnl: 2100,
    pnlPct: 6.3,
    fees: 45,
    duration: 14400000, // 4 hours
    setup: 'breakout',
    tags: ['trend_following', 'high_volume'],
    outcome: 'win',
    exitReason: 'take_profit',
  },
  {
    id: 'trade-2',
    timestamp: Date.now() - 172800000,
    pair: 'ETH/USDT',
    side: 'short',
    entryPrice: 3280,
    exitPrice: 3310,
    size: 5,
    leverage: 2,
    pnl: -750,
    pnlPct: -4.6,
    fees: 32,
    duration: 7200000, // 2 hours
    setup: 'reversal',
    tags: ['failed_breakdown'],
    outcome: 'loss',
    exitReason: 'stop_loss',
  },
  {
    id: 'trade-3',
    timestamp: Date.now() - 259200000,
    pair: 'SOL/USDT',
    side: 'long',
    entryPrice: 142,
    exitPrice: 149,
    size: 50,
    leverage: 5,
    pnl: 1750,
    pnlPct: 24.6,
    fees: 28,
    duration: 21600000, // 6 hours
    setup: 'pullback',
    tags: ['perfect_entry', 'low_risk'],
    outcome: 'win',
    exitReason: 'take_profit',
  },
  {
    id: 'trade-4',
    timestamp: Date.now() - 345600000,
    pair: 'BTC/USDT',
    side: 'long',
    entryPrice: 65500,
    exitPrice: 67000,
    size: 0.8,
    leverage: 3,
    pnl: 3600,
    pnlPct: 6.9,
    fees: 52,
    duration: 28800000, // 8 hours
    setup: 'trend_following',
    tags: ['slow_grind', 'patience'],
    outcome: 'win',
    exitReason: 'take_profit',
  },
  {
    id: 'trade-5',
    timestamp: Date.now() - 432000000,
    pair: 'ETH/USDT',
    side: 'long',
    entryPrice: 3150,
    exitPrice: 3145,
    size: 4,
    leverage: 2,
    pnl: -80,
    pnlPct: -1.3,
    fees: 24,
    duration: 3600000, // 1 hour
    setup: 'scalp',
    tags: ['quick_exit'],
    outcome: 'loss',
    exitReason: 'manual',
  },
  {
    id: 'trade-6',
    timestamp: Date.now() - 518400000,
    pair: 'BNB/USDT',
    side: 'long',
    entryPrice: 425,
    exitPrice: 438,
    size: 20,
    leverage: 3,
    pnl: 780,
    pnlPct: 9.2,
    fees: 18,
    duration: 18000000, // 5 hours
    setup: 'breakout',
    tags: ['clean_setup'],
    outcome: 'win',
    exitReason: 'take_profit',
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function AdvancedAnalyticsPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'ai' | 'risk' | 'journal' | 'sizing'>('ai');

  return (
    <PageLayout>
      <Header title="Advanced Analytics" subtitle="AI & Professional Tools" back />

      <PageContent gap="default">
        {/* Hero Banner */}
        <TrCard
          variant="hero"
          className="p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <Sparkles size={32} color="#fff" strokeWidth={ICON_STROKE.bold} />
            </div>
            <div className="flex-1">
              <h1
                style={{
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: FONT_WEIGHT.bold,
                  marginBottom: 4,
                }}
              >
                P3: Advanced Analytics
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SCALE.sm }}>
                AI-powered insights và professional trading tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'AI Signals', value: '3', color: '#8B5CF6' },
              { label: 'Risk Score', value: '58', color: '#F59E0B' },
              { label: 'Win Rate', value: '66.7%', color: '#10B981' },
              { label: 'Sharpe', value: '1.82', color: '#3B82F6' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <p
                  style={{
                    color: stat.color,
                    fontSize: FONT_SCALE.lg,
                    fontWeight: FONT_WEIGHT.bold,
                    fontFamily: 'monospace',
                    marginBottom: 2,
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'ai', label: 'AI Signals', icon: Brain },
            { id: 'risk', label: 'Risk Analysis', icon: Shield },
            { id: 'journal', label: 'Trade Journal', icon: BookOpen },
            { id: 'sizing', label: 'Position Sizing', icon: Calculator },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* AI SIGNALS TAB */}
        {tab === 'ai' && (
          <div className="flex flex-col gap-3">
            <AITradingSignals
              pair="BTC/USDT"
              signals={MOCK_AI_SIGNALS}
              onSignalClick={(signal) => {
                console.log('Signal clicked:', signal);
              }}
            />

            <TrCard className="p-4" style={{ background: withAlpha('#8B5CF6', ALPHA.hover) }}>
              <div className="flex items-center gap-2">
                <Brain size={ICON_SIZE.md} color="#8B5CF6" strokeWidth={ICON_STROKE.bold} />
                <div className="flex-1">
                  <p
                    style={{
                      color: '#8B5CF6',
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      marginBottom: 2,
                    }}
                  >
                    AI Model: GPT-4 + TradingView Integration
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Signals generated using multi-factor analysis: technical indicators (RSI, MACD, EMA), on-chain data (whale movements, funding rates), sentiment analysis (social media, news), and volume profiling.
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* RISK ANALYSIS TAB */}
        {tab === 'risk' && (
          <div className="flex flex-col gap-3">
            <PortfolioRiskAnalyzer
              metrics={MOCK_RISK_METRICS}
              portfolioValue={50000}
              leverage={2.5}
            />

            <TrCard className="p-4" style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}>
              <div className="flex items-center gap-2">
                <Shield size={ICON_SIZE.md} color="#3B82F6" strokeWidth={ICON_STROKE.bold} />
                <div className="flex-1">
                  <p
                    style={{
                      color: '#3B82F6',
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      marginBottom: 2,
                    }}
                  >
                    Enterprise Risk Management
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    VaR calculated using Monte Carlo simulation (10,000 iterations). Sharpe/Sortino ratios updated daily. Beta computed against BTC with 30-day rolling window.
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* TRADE JOURNAL TAB */}
        {tab === 'journal' && (
          <div className="flex flex-col gap-3">
            <TradeJournal
              trades={MOCK_TRADES}
              onTradeClick={(trade) => {
                console.log('Trade clicked:', trade);
              }}
            />

            <TrCard className="p-4" style={{ background: withAlpha('#10B981', ALPHA.hover) }}>
              <div className="flex items-center gap-2">
                <BookOpen size={ICON_SIZE.md} color="#10B981" strokeWidth={ICON_STROKE.bold} />
                <div className="flex-1">
                  <p
                    style={{
                      color: '#10B981',
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      marginBottom: 2,
                    }}
                  >
                    Performance Attribution
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Automatic trade tagging, setup classification, and pattern recognition. Export to CSV for tax reporting. Connects to TradingView for chart annotations.
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* POSITION SIZING TAB */}
        {tab === 'sizing' && (
          <div className="flex flex-col gap-3">
            <PositionSizingCalculator
              accountBalance={50000}
              entryPrice={67500}
              stopLossPrice={66800}
              takeProfitPrice={70200}
              winRate={66.7}
              avgWin={2210}
              avgLoss={415}
            />

            <TrCard className="p-4" style={{ background: withAlpha('#F59E0B', ALPHA.hover) }}>
              <div className="flex items-center gap-2">
                <Calculator size={ICON_SIZE.md} color="#F59E0B" strokeWidth={ICON_STROKE.bold} />
                <div className="flex-1">
                  <p
                    style={{
                      color: '#F59E0B',
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      marginBottom: 2,
                    }}
                  >
                    Kelly Criterion Optimization
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Kelly % capped at 25% (half Kelly) for safety. Adjusts automatically based on your actual win rate and R:R ratio from Trade Journal. Supports fractional Kelly for conservative sizing.
                  </p>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* Feature List */}
        <TrCard className="p-5">
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.bold,
              marginBottom: 12,
            }}
          >
            P3 Features Included
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              'AI Trading Signals',
              'Risk Score Dashboard',
              'VaR Calculator',
              'Sharpe/Sortino Ratios',
              'Trade Journal',
              'Win/Loss Analytics',
              'Kelly Criterion',
              'Position Sizing',
              'Performance Attribution',
              'Setup Classification',
              'Drawdown Analysis',
              'Beta Calculation',
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-xl p-2 flex items-center gap-2"
                style={{ background: c.surface2 }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#10B981' }}
                />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
