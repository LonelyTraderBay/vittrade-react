/**
 * ══════════════════════════════════════════════════════════════════
 *  PORTFOLIO RISK ANALYZER — Advanced Risk Metrics
 * ══════════════════════════════════════════════════════════════════
 *  P3 Feature: VaR, Sharpe Ratio, Max Drawdown, Beta, Risk Score
 */

import React from 'react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';
import {
  Shield,
  TrendingDown,
  Activity,
  AlertTriangle,
  BarChart3,
  Target,
  Percent,
  DollarSign,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface RiskMetrics {
  // Value at Risk
  var95: number; // 95% VaR (1-day)
  var99: number; // 99% VaR (1-day)
  varWeekly: number; // 95% VaR (7-day)
  
  // Performance Metrics
  sharpeRatio: number; // Risk-adjusted return
  sortinoRatio: number; // Downside risk-adjusted return
  calmarRatio: number; // Return / Max Drawdown
  
  // Drawdown
  maxDrawdown: number; // Largest peak-to-trough decline
  currentDrawdown: number; // Current decline from peak
  drawdownDuration: number; // Days in drawdown
  
  // Volatility
  volatility: number; // 30-day volatility (annualized)
  downsideVolatility: number; // Only negative returns
  
  // Portfolio Stats
  beta: number; // Correlation to market (BTC)
  correlation: number; // Correlation coefficient
  
  // Risk Score
  overallRiskScore: number; // 0-100 (composite)
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

interface PortfolioRiskAnalyzerProps {
  metrics: RiskMetrics;
  portfolioValue: number;
  leverage: number;
}

/* ═══════════════════════════════════════════════════════════════
   RISK SCORE GAUGE
   ═══════════════════════════════════════════════════════════════ */

function RiskScoreGauge({ score, level }: { score: number; level: RiskMetrics['riskLevel'] }) {
  const c = useThemeColors();

  const levelConfig = {
    very_low: { color: '#10B981', label: 'Very Low Risk' },
    low: { color: '#84CC16', label: 'Low Risk' },
    medium: { color: '#F59E0B', label: 'Medium Risk' },
    high: { color: '#FB923C', label: 'High Risk' },
    very_high: { color: '#EF4444', label: 'Very High Risk' },
  };

  const config = levelConfig[level];

  return (
    <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={ICON_SIZE.md} color={config.color} strokeWidth={ICON_STROKE.bold} />
          <div>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              Risk Score
            </p>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
              {config.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            style={{
              color: config.color,
              fontSize: 32,
              fontWeight: FONT_WEIGHT.bold,
              lineHeight: 1,
            }}
          >
            {score}
          </p>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>/ 100</p>
        </div>
      </div>

      {/* Gauge Bar */}
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
        {/* Gradient zones */}
        <div className="absolute inset-0 flex">
          <div style={{ width: '20%', background: '#10B981' }} />
          <div style={{ width: '20%', background: '#84CC16' }} />
          <div style={{ width: '20%', background: '#F59E0B' }} />
          <div style={{ width: '20%', background: '#FB923C' }} />
          <div style={{ width: '20%', background: '#EF4444' }} />
        </div>

        {/* Score Indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all"
          style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span style={{ color: '#10B981', fontSize: 9, fontWeight: FONT_WEIGHT.semibold }}>
          SAFE
        </span>
        <span style={{ color: '#EF4444', fontSize: 9, fontWeight: FONT_WEIGHT.semibold }}>
          RISKY
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════════════════════════ */

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  benchmark,
  status,
  description,
}: {
  icon: any;
  label: string;
  value: number;
  unit?: string;
  benchmark?: { value: number; label: string };
  status: 'good' | 'neutral' | 'bad';
  description: string;
}) {
  const c = useThemeColors();

  const statusColor = {
    good: '#10B981',
    neutral: '#3B82F6',
    bad: '#EF4444',
  }[status];

  return (
    <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
        <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
          {label}
        </p>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <p
          style={{
            color: statusColor,
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          {value.toFixed(2)}
        </p>
        {unit && (
          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
            {unit}
          </span>
        )}
      </div>

      {benchmark && (
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>
          {benchmark.label}: {benchmark.value.toFixed(2)}
        </p>
      )}

      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
        {description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VAR BREAKDOWN
   ═══════════════════════════════════════════════════════════════ */

function VaRBreakdown({
  var95,
  var99,
  varWeekly,
  portfolioValue,
}: {
  var95: number;
  var99: number;
  varWeekly: number;
  portfolioValue: number;
}) {
  const c = useThemeColors();

  const items = [
    {
      label: 'VaR 95% (1-day)',
      value: var95,
      dollarValue: portfolioValue * (var95 / 100),
      description: '95% confidence: max loss in 1 day',
    },
    {
      label: 'VaR 99% (1-day)',
      value: var99,
      dollarValue: portfolioValue * (var99 / 100),
      description: '99% confidence: max loss in 1 day',
    },
    {
      label: 'VaR 95% (7-day)',
      value: varWeekly,
      dollarValue: portfolioValue * (varWeekly / 100),
      description: '95% confidence: max loss in 1 week',
    },
  ];

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.bold} />
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Value at Risk (VaR)
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{ background: c.surface2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {item.label}
              </p>
              <p
                style={{
                  color: '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                {item.value.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p style={{ color: c.text3, fontSize: 10 }}>
                {item.description}
              </p>
              <p
                style={{
                  color: '#EF4444',
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.semibold,
                  fontFamily: 'monospace',
                }}
              >
                -${item.dollarValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-3 mt-2 flex items-start gap-2"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
      >
        <Activity size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          VaR estimates maximum potential loss at given confidence level. Does not represent guaranteed maximum loss (tail risk exists).
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function PortfolioRiskAnalyzer({
  metrics,
  portfolioValue,
  leverage,
}: PortfolioRiskAnalyzerProps) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-3">
      {/* Risk Score */}
      <RiskScoreGauge score={metrics.overallRiskScore} level={metrics.riskLevel} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Portfolio Value</p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${portfolioValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Leverage</p>
          <p
            style={{
              color: leverage > 5 ? '#EF4444' : leverage > 2 ? '#F59E0B' : '#10B981',
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {leverage.toFixed(1)}x
          </p>
        </div>
      </div>

      {/* VaR Breakdown */}
      <VaRBreakdown
        var95={metrics.var95}
        var99={metrics.var99}
        varWeekly={metrics.varWeekly}
        portfolioValue={portfolioValue}
      />

      {/* Performance Ratios */}
      <TrCard className="p-4">
        <p
          style={{
            color: c.text1,
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: 8,
          }}
        >
          Performance Ratios
        </p>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            icon={Target}
            label="Sharpe"
            value={metrics.sharpeRatio}
            benchmark={{ value: 1.0, label: 'Good' }}
            status={metrics.sharpeRatio >= 1 ? 'good' : metrics.sharpeRatio >= 0.5 ? 'neutral' : 'bad'}
            description="Risk-adjusted return"
          />
          <MetricCard
            icon={TrendingDown}
            label="Sortino"
            value={metrics.sortinoRatio}
            benchmark={{ value: 1.5, label: 'Good' }}
            status={metrics.sortinoRatio >= 1.5 ? 'good' : metrics.sortinoRatio >= 1 ? 'neutral' : 'bad'}
            description="Downside risk-adjusted"
          />
          <MetricCard
            icon={BarChart3}
            label="Calmar"
            value={metrics.calmarRatio}
            benchmark={{ value: 3.0, label: 'Good' }}
            status={metrics.calmarRatio >= 3 ? 'good' : metrics.calmarRatio >= 2 ? 'neutral' : 'bad'}
            description="Return / Max DD"
          />
        </div>
      </TrCard>

      {/* Drawdown */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Drawdown Analysis
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Max DD</p>
            <p
              style={{
                color: '#EF4444',
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {metrics.maxDrawdown.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Current DD</p>
            <p
              style={{
                color: metrics.currentDrawdown > 0 ? '#F59E0B' : '#10B981',
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {metrics.currentDrawdown.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Duration</p>
            <p
              style={{
                color: c.text1,
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {metrics.drawdownDuration}d
            </p>
          </div>
        </div>

        <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(metrics.currentDrawdown / metrics.maxDrawdown) * 100}%`,
              background: metrics.currentDrawdown > metrics.maxDrawdown * 0.8 ? '#EF4444' : '#F59E0B',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ color: c.text3, fontSize: 9 }}>0%</span>
          <span style={{ color: c.text3, fontSize: 9 }}>Max: {metrics.maxDrawdown.toFixed(1)}%</span>
        </div>
      </TrCard>

      {/* Volatility & Beta */}
      <TrCard className="p-4">
        <p
          style={{
            color: c.text1,
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: 8,
          }}
        >
          Market Exposure
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={14} color={c.text3} />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Volatility (30d)</p>
            </div>
            <p
              style={{
                color: metrics.volatility > 60 ? '#EF4444' : metrics.volatility > 40 ? '#F59E0B' : '#10B981',
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {metrics.volatility.toFixed(1)}%
            </p>
            <p style={{ color: c.text3, fontSize: 10 }}>
              Annualized
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 size={14} color={c.text3} />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Beta (vs BTC)</p>
            </div>
            <p
              style={{
                color: Math.abs(metrics.beta - 1) > 0.5 ? '#EF4444' : '#3B82F6',
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {metrics.beta.toFixed(2)}
            </p>
            <p style={{ color: c.text3, fontSize: 10 }}>
              Correlation: {(metrics.correlation * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </TrCard>
    </div>
  );
}
