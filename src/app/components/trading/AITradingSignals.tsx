/**
 * ══════════════════════════════════════════════════════════════════
 *  AI TRADING SIGNALS — Machine Learning Predictions
 * ══════════════════════════════════════════════════════════════════
 *  P3 Feature: AI-powered entry/exit signals với confidence scores
 */

import React, { useState, useMemo } from 'react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Target,
  AlertCircle,
  ChevronRight,
  Zap,
  Eye,
  BarChart3,
  CheckCircle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface AISignal {
  id: string;
  timestamp: number;
  pair: string;
  direction: 'long' | 'short' | 'neutral';
  confidence: number; // 0-100
  timeframe: '5m' | '15m' | '1h' | '4h' | '1d';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  modelVersion: string;
  features: {
    technicalScore: number;
    sentimentScore: number;
    volumeScore: number;
    momentumScore: number;
  };
  reasoning: string[];
  status: 'active' | 'triggered' | 'expired' | 'invalidated';
  accuracy?: number; // Historical accuracy for this model
}

interface AITradingSignalsProps {
  pair: string;
  signals: AISignal[];
  onSignalClick?: (signal: AISignal) => void;
}

/* ═══════════════════════════════════════════════════════════════
   SIGNAL CARD
   ═══════════════════════════════════════════════════════════════ */

function SignalCard({ signal, onClick }: { signal: AISignal; onClick?: () => void }) {
  const c = useThemeColors();

  const directionConfig = {
    long: { color: '#10B981', icon: TrendingUp, label: 'LONG' },
    short: { color: '#EF4444', icon: TrendingDown, label: 'SHORT' },
    neutral: { color: '#F59E0B', icon: Activity, label: 'NEUTRAL' },
  };

  const config = directionConfig[signal.direction];
  const Icon = config.icon;

  const confidenceColor =
    signal.confidence >= 80
      ? '#10B981'
      : signal.confidence >= 60
      ? '#3B82F6'
      : signal.confidence >= 40
      ? '#F59E0B'
      : '#EF4444';

  const rrColor = signal.riskRewardRatio >= 3 ? '#10B981' : signal.riskRewardRatio >= 2 ? '#3B82F6' : '#F59E0B';

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left transition-all"
      style={{
        background: c.surface,
        border: `1.5px solid ${withAlpha(config.color, ALPHA.soft)}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: withAlpha(config.color, ALPHA.hover) }}
          >
            <Icon size={ICON_SIZE.md} color={config.color} strokeWidth={ICON_STROKE.bold} />
          </div>
          <div>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {signal.pair}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: withAlpha(config.color, ALPHA.soft),
                  color: config.color,
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                {config.label}
              </span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {signal.timeframe}
              </span>
            </div>
          </div>
        </div>

        <ChevronRight size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
      </div>

      {/* Confidence + Risk/Reward */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Confidence
          </p>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: c.borderSolid }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${signal.confidence}%`, background: confidenceColor }}
              />
            </div>
            <span
              style={{
                color: confidenceColor,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {signal.confidence}%
            </span>
          </div>
        </div>

        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Risk/Reward
          </p>
          <p
            style={{
              color: rrColor,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            1:{signal.riskRewardRatio.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Entry</p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              fontFamily: 'monospace',
            }}
          >
            ${signal.entryPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Target</p>
          <p
            style={{
              color: '#10B981',
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              fontFamily: 'monospace',
            }}
          >
            ${signal.targetPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Stop Loss</p>
          <p
            style={{
              color: '#EF4444',
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              fontFamily: 'monospace',
            }}
          >
            ${signal.stopLoss.toLocaleString()}
          </p>
        </div>
      </div>

      {/* AI Reasoning (top 2) */}
      <div className="flex flex-col gap-1.5">
        {signal.reasoning.slice(0, 2).map((reason, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle size={12} color={config.color} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
              {reason}
            </p>
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
        <div className="flex items-center gap-1.5">
          <Brain size={12} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 10 }}>
            {signal.modelVersion}
          </span>
        </div>
        {signal.accuracy && (
          <span
            style={{
              color: signal.accuracy >= 70 ? '#10B981' : '#F59E0B',
              fontSize: 10,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            {signal.accuracy}% accuracy
          </span>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE BREAKDOWN
   ═══════════════════════════════════════════════════════════════ */

function FeatureBreakdown({ features }: { features: AISignal['features'] }) {
  const c = useThemeColors();

  const items = [
    { label: 'Technical', value: features.technicalScore, icon: BarChart3 },
    { label: 'Sentiment', value: features.sentimentScore, icon: Activity },
    { label: 'Volume', value: features.volumeScore, icon: TrendingUp },
    { label: 'Momentum', value: features.momentumScore, icon: Zap },
  ];

  return (
    <div className="rounded-2xl p-4" style={{ background: c.surface }}>
      <div className="flex items-center gap-2 mb-3">
        <Brain size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.bold} />
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          AI Feature Scores
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          const color = item.value >= 70 ? '#10B981' : item.value >= 50 ? '#3B82F6' : '#F59E0B';

          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} color={c.text3} strokeWidth={ICON_STROKE.standard} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
                    {item.label}
                  </span>
                </div>
                <span
                  style={{
                    color,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {item.value}/100
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.value}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function AITradingSignals({ pair, signals, onSignalClick }: AITradingSignalsProps) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');

  const filteredSignals = useMemo(() => {
    if (filter === 'all') return signals;
    return signals.filter(s => s.direction === filter);
  }, [signals, filter]);

  const activeSignals = signals.filter(s => s.status === 'active');
  const avgConfidence = activeSignals.length > 0
    ? activeSignals.reduce((sum, s) => sum + s.confidence, 0) / activeSignals.length
    : 0;

  const longSignals = activeSignals.filter(s => s.direction === 'long').length;
  const shortSignals = activeSignals.filter(s => s.direction === 'short').length;

  return (
    <TrCard className="p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: withAlpha('#8B5CF6', ALPHA.hover) }}
        >
          <Brain size={ICON_SIZE.md} color="#8B5CF6" strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <h2 style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
            AI Trading Signals
          </h2>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
            Machine learning powered predictions
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Active</p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {activeSignals.length}
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Avg Confidence</p>
          <p
            style={{
              color: avgConfidence >= 70 ? '#10B981' : '#3B82F6',
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {avgConfidence.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>L/S Ratio</p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {longSignals}/{shortSignals}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'long', 'short'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 rounded-xl px-3 py-2 transition-all"
            style={{
              background: filter === f ? withAlpha('#8B5CF6', ALPHA.soft) : c.surface2,
              border: `1px solid ${filter === f ? '#8B5CF6' : c.borderSolid}`,
              color: filter === f ? '#8B5CF6' : c.text2,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ background: c.surface2 }}>
          <AlertCircle size={ICON_SIZE.xl} color={c.text3} className="mx-auto mb-2" />
          <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>
            No {filter !== 'all' ? filter : ''} signals available
          </p>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>
            AI models are analyzing market conditions
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSignals.map(signal => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onClick={() => onSignalClick?.(signal)}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div
        className="rounded-xl p-3 flex items-start gap-2 mt-4"
        style={{ background: withAlpha('#F59E0B', ALPHA.hover) }}
      >
        <AlertCircle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
        <div>
          <p
            style={{
              color: '#F59E0B',
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
              marginBottom: 2,
            }}
          >
            AI Prediction Disclaimer
          </p>
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Signals are predictions, not guarantees. Always conduct your own research and risk management. Past accuracy does not guarantee future results.
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/**
 * Signal Detail Modal (future implementation)
 */
export function SignalDetailView({ signal }: { signal: AISignal }) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-4">
      <FeatureBreakdown features={signal.features} />

      {/* Full Reasoning */}
      <div className="rounded-2xl p-4" style={{ background: c.surface }}>
        <p
          style={{
            color: c.text1,
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: 8,
          }}
        >
          AI Reasoning
        </p>
        <div className="flex flex-col gap-2">
          {signal.reasoning.map((reason, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: withAlpha('#8B5CF6', ALPHA.soft),
                  color: '#8B5CF6',
                  fontSize: 10,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                {i + 1}
              </span>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                {reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
