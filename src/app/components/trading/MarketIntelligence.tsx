/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET INTELLIGENCE — P2 Features
 * ══════════════════════════════════════════════════════════════════
 *  Market data & sentiment analysis:
 *  - Open Interest tracking
 *  - Long/Short Ratio
 *  - Top Trader Positions
 *  - Market Sentiment
 *  - Funding Rate History
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Info, ChevronRight, Eye } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. OPEN INTEREST DISPLAY
   ═══════════════════════════════════════════════════════════════ */

interface OpenInterestData {
  current: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface OpenInterestProps {
  pair: string;
  data: OpenInterestData;
  className?: string;
}

export function OpenInterestWidget({ pair, data, className = '' }: OpenInterestProps) {
  const c = useThemeColors();

  const isIncreasing = data.change24h > 0;
  const pairName = pair.replace('/', '');

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={ICON_SIZE.sm} color="#3B82F6" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Open Interest
          </span>
        </div>
        <button className="flex items-center gap-1">
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{pair}</span>
          <ChevronRight size={12} color={c.text3} />
        </button>
      </div>

      {/* Current OI */}
      <div className="mb-3">
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 4 }}>
          Total Open Interest
        </p>
        <div className="flex items-end gap-2">
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.xl,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            ${(data.current / 1000000).toFixed(2)}M
          </p>
          <div
            className="px-2 py-0.5 rounded-lg mb-1"
            style={{
              background: isIncreasing ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft),
            }}
          >
            <span
              style={{
                color: isIncreasing ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {isIncreasing ? '+' : ''}
              {data.change24hPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 24h Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: c.surface2 }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Change 24h
          </p>
          <p
            style={{
              color: isIncreasing ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {isIncreasing ? '+' : ''}${(data.change24h / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: c.surface2 }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            High 24h
          </p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${(data.high24h / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: c.surface2 }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Low 24h
          </p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${(data.low24h / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 p-2.5 rounded-xl"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
      >
        <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          OI tăng + giá tăng = bullish strong. OI tăng + giá giảm = bearish momentum. OI giảm = positions đóng.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. LONG/SHORT RATIO
   ═══════════════════════════════════════════════════════════════ */

interface LongShortRatioData {
  longPct: number;
  shortPct: number;
  longAccounts: number;
  shortAccounts: number;
  longVolume: number;
  shortVolume: number;
  timestamp: number;
}

interface LongShortRatioProps {
  pair: string;
  data: LongShortRatioData;
  className?: string;
}

export function LongShortRatio({ pair, data, className = '' }: LongShortRatioProps) {
  const c = useThemeColors();
  const [view, setView] = useState<'accounts' | 'volume'>('accounts');

  const longPct = view === 'accounts' ? data.longPct : (data.longVolume / (data.longVolume + data.shortVolume)) * 100;
  const shortPct = view === 'accounts' ? data.shortPct : (data.shortVolume / (data.longVolume + data.shortVolume)) * 100;

  const ratio = longPct / shortPct;
  const sentiment = ratio > 2 ? 'Strong Long' : ratio > 1.2 ? 'Long' : ratio > 0.8 ? 'Neutral' : ratio > 0.5 ? 'Short' : 'Strong Short';
  const sentimentColor = ratio > 1.2 ? '#10B981' : ratio > 0.8 ? '#F59E0B' : '#EF4444';

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={ICON_SIZE.sm} color="#8B5CF6" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Long/Short Ratio
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{
            background: withAlpha(sentimentColor, ALPHA.soft),
            color: sentimentColor,
            fontSize: FONT_SCALE.micro,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {sentiment}
        </span>
      </div>

      {/* View Toggle */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        <button
          onClick={() => setView('accounts')}
          className="flex-1 py-2 rounded-xl transition-all"
          style={{
            background: view === 'accounts' ? c.primary : 'transparent',
            color: view === 'accounts' ? '#fff' : c.text3,
            fontSize: FONT_SCALE.xs,
            fontWeight: view === 'accounts' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
          }}
        >
          By Accounts
        </button>
        <button
          onClick={() => setView('volume')}
          className="flex-1 py-2 rounded-xl transition-all"
          style={{
            background: view === 'volume' ? c.primary : 'transparent',
            color: view === 'volume' ? '#fff' : c.text3,
            fontSize: FONT_SCALE.xs,
            fontWeight: view === 'volume' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
          }}
        >
          By Volume
        </button>
      </div>

      {/* Visual Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} color="#10B981" strokeWidth={ICON_STROKE.standard} />
            <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
              Long {longPct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
              Short {shortPct.toFixed(1)}%
            </span>
            <TrendingDown size={14} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
          <div
            className="transition-all"
            style={{
              width: `${longPct}%`,
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              borderRight: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <div
            className="transition-all"
            style={{
              width: `${shortPct}%`,
              background: 'linear-gradient(90deg, #dc2626 0%, #EF4444 100%)',
            }}
          />
        </div>

        {/* Ratio number */}
        <div className="text-center mt-2">
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
            Long/Short Ratio
          </p>
          <p
            style={{
              color: sentimentColor,
              fontSize: FONT_SCALE.lg,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {ratio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#10B981', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            {view === 'accounts' ? 'Long Accounts' : 'Long Volume'}
          </p>
          <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            {view === 'accounts' ? data.longAccounts.toLocaleString() : `$${(data.longVolume / 1000000).toFixed(1)}M`}
          </p>
        </div>
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            {view === 'accounts' ? 'Short Accounts' : 'Short Volume'}
          </p>
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            {view === 'accounts' ? data.shortAccounts.toLocaleString() : `$${(data.shortVolume / 1000000).toFixed(1)}M`}
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. TOP TRADER POSITIONS
   ═══════════════════════════════════════════════════════════════ */

interface TopTraderData {
  longPct: number;
  shortPct: number;
  change24h: number; // Change in long%
  timestamp: number;
}

interface TopTraderPositionsProps {
  pair: string;
  data: TopTraderData;
  className?: string;
}

export function TopTraderPositions({ pair, data, className = '' }: TopTraderPositionsProps) {
  const c = useThemeColors();

  const isLongBias = data.longPct > 50;
  const bias = data.longPct > 60 ? 'Strong Long' : data.longPct > 55 ? 'Long' : data.longPct < 40 ? 'Strong Short' : data.longPct < 45 ? 'Short' : 'Neutral';
  const biasColor = data.longPct > 55 ? '#10B981' : data.longPct < 45 ? '#EF4444' : '#F59E0B';

  const change24hAbs = Math.abs(data.change24h);
  const changeDirection = data.change24h > 0 ? 'Long' : 'Short';

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Top Traders
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{
            background: withAlpha(biasColor, ALPHA.soft),
            color: biasColor,
            fontSize: FONT_SCALE.micro,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {bias}
        </span>
      </div>

      {/* Main gauge */}
      <div className="mb-3">
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: withAlpha(biasColor, ALPHA.hover),
            border: `1.5px solid ${withAlpha(biasColor, ALPHA.soft)}`,
          }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 4 }}>
            Top traders đang {isLongBias ? 'Long' : 'Short'}
          </p>
          <p
            style={{
              color: biasColor,
              fontSize: 40,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            {data.longPct.toFixed(1)}%
          </p>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 4 }}>
            of top traders are long
          </p>
        </div>
      </div>

      {/* Visual bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3" style={{ background: c.surface2 }}>
        <div
          className="transition-all"
          style={{
            width: `${data.longPct}%`,
            background: '#10B981',
          }}
        />
        <div
          className="transition-all"
          style={{
            width: `${data.shortPct}%`,
            background: '#EF4444',
          }}
        />
      </div>

      {/* 24h Change */}
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ background: c.surface2 }}
      >
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 2 }}>
            24h Change
          </p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
            Shifted {change24hAbs.toFixed(1)}% to {changeDirection}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: data.change24h > 0 ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted),
          }}
        >
          {data.change24h > 0 ? (
            <TrendingUp size={ICON_SIZE.md} color="#10B981" strokeWidth={ICON_STROKE.bold} />
          ) : (
            <TrendingDown size={ICON_SIZE.md} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
          )}
        </div>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: withAlpha('#F59E0B', ALPHA.hover) }}
      >
        <Info size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Top traders = accounts với volume cao nhất. Thường là whales, institutions. Theo trend của họ có thể profitable.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. MARKET SENTIMENT COMPOSITE
   ═══════════════════════════════════════════════════════════════ */

interface MarketSentimentData {
  overall: 'extreme_greed' | 'greed' | 'neutral' | 'fear' | 'extreme_fear';
  score: number; // 0-100
  components: {
    openInterest: number; // -100 to 100
    longShortRatio: number;
    topTraders: number;
    fundingRate: number;
    priceAction: number;
  };
  timestamp: number;
}

interface MarketSentimentProps {
  pair: string;
  data: MarketSentimentData;
  className?: string;
}

export function MarketSentiment({ pair, data, className = '' }: MarketSentimentProps) {
  const c = useThemeColors();

  const sentimentConfig = {
    extreme_greed: { label: 'Extreme Greed', color: '#10B981', emoji: '🚀' },
    greed: { label: 'Greed', color: '#84CC16', emoji: '📈' },
    neutral: { label: 'Neutral', color: '#F59E0B', emoji: '😐' },
    fear: { label: 'Fear', color: '#F97316', emoji: '📉' },
    extreme_fear: { label: 'Extreme Fear', color: '#EF4444', emoji: '😱' },
  };

  const config = sentimentConfig[data.overall];

  const components = [
    { label: 'Open Interest', value: data.components.openInterest, max: 100 },
    { label: 'Long/Short', value: data.components.longShortRatio, max: 100 },
    { label: 'Top Traders', value: data.components.topTraders, max: 100 },
    { label: 'Funding Rate', value: data.components.fundingRate, max: 100 },
    { label: 'Price Action', value: data.components.priceAction, max: 100 },
  ];

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={ICON_SIZE.sm} color={config.color} strokeWidth={ICON_STROKE.standard} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Market Sentiment
        </span>
      </div>

      {/* Main score */}
      <div
        className="rounded-2xl p-5 text-center mb-3"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(config.color, ALPHA.hover)} 0%, ${withAlpha(config.color, ALPHA.soft)} 100%)`,
          border: `1.5px solid ${withAlpha(config.color, ALPHA.soft)}`,
        }}
      >
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 6 }}>
          {pair} Sentiment
        </p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span style={{ fontSize: 32 }}>{config.emoji}</span>
          <p
            style={{
              color: config.color,
              fontSize: 48,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            {data.score}
          </p>
        </div>
        <p
          style={{
            color: config.color,
            fontSize: FONT_SCALE.base,
            fontWeight: FONT_WEIGHT.bold,
          }}
        >
          {config.label}
        </p>
      </div>

      {/* Component breakdown */}
      <div className="flex flex-col gap-2">
        <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>
          Component Scores
        </p>
        {components.map(comp => {
          const normalized = ((comp.value + 100) / 200) * 100; // Convert -100~100 to 0~100
          const color = comp.value > 20 ? '#10B981' : comp.value < -20 ? '#EF4444' : '#F59E0B';

          return (
            <div key={comp.label}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{comp.label}</span>
                <span
                  style={{
                    color,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {comp.value > 0 ? '+' : ''}{comp.value}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${normalized}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          {data.overall === 'extreme_greed' && 'Market quá tham lam → Có thể sắp điều chỉnh. Cân nhắc chốt lời.'}
          {data.overall === 'greed' && 'Sentiment tích cực nhưng chưa quá nóng. Theo trend nhưng cẩn thận.'}
          {data.overall === 'neutral' && 'Market cân bằng. Chờ tín hiệu rõ ràng hơn.'}
          {data.overall === 'fear' && 'Market sợ hãi. Có thể là cơ hội mua nếu fundamentals ổn.'}
          {data.overall === 'extreme_fear' && 'Panic selling có thể xảy ra. Cơ hội cho long-term investors.'}
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. FUNDING RATE HISTORY CHART
   ═══════════════════════════════════════════════════════════════ */

interface FundingRateHistory {
  timestamp: number;
  rate: number; // e.g., 0.0001 = 0.01%
  avgRate: number; // Moving average
}

interface FundingRateHistoryProps {
  pair: string;
  history: FundingRateHistory[];
  currentRate: number;
  nextFundingIn: number; // seconds
  className?: string;
}

export function FundingRateHistory({
  pair,
  history,
  currentRate,
  nextFundingIn,
  className = '',
}: FundingRateHistoryProps) {
  const c = useThemeColors();

  const hours = Math.floor(nextFundingIn / 3600);
  const minutes = Math.floor((nextFundingIn % 3600) / 60);

  const avgRate = history.reduce((sum, h) => sum + h.rate, 0) / history.length;
  const minRate = Math.min(...history.map(h => h.rate));
  const maxRate = Math.max(...history.map(h => h.rate));

  const currentColor = currentRate >= 0 ? '#EF4444' : '#10B981';

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign size={ICON_SIZE.sm} color="#3B82F6" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Funding Rate
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{
            background: withAlpha(currentColor, ALPHA.soft),
            color: currentColor,
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          {currentRate >= 0 ? '+' : ''}{(currentRate * 100).toFixed(4)}%
        </span>
      </div>

      {/* Countdown */}
      <div
        className="rounded-xl p-3 mb-3 flex items-center justify-between"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
      >
        <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
          Next funding in
        </span>
        <span
          style={{
            color: '#3B82F6',
            fontSize: FONT_SCALE.lg,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Current
          </p>
          <p
            style={{
              color: currentColor,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {currentRate >= 0 ? '+' : ''}{(currentRate * 100).toFixed(3)}%
          </p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            24h Avg
          </p>
          <p
            style={{
              color: avgRate >= 0 ? '#EF4444' : '#10B981',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            {avgRate >= 0 ? '+' : ''}{(avgRate * 100).toFixed(3)}%
          </p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Range
          </p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            {(maxRate * 100).toFixed(3)}%
          </p>
        </div>
      </div>

      {/* Simple sparkline */}
      <div className="h-16 rounded-xl overflow-hidden" style={{ background: c.surface2 }}>
        <svg width="100%" height="100%" viewBox="0 0 300 64" preserveAspectRatio="none">
          {/* Zero line */}
          <line
            x1="0"
            y1="32"
            x2="300"
            y2="32"
            stroke={c.divider}
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Line chart */}
          <polyline
            fill="none"
            stroke={currentRate >= 0 ? '#EF4444' : '#10B981'}
            strokeWidth="2"
            points={history
              .map((h, i) => {
                const x = (i / (history.length - 1)) * 300;
                const normalized = ((h.rate - minRate) / (maxRate - minRate)) * 48 + 8;
                const y = 64 - normalized;
                return `${x},${y}`;
              })
              .join(' ')}
          />
        </svg>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Funding rate dương (đỏ) → Long trả Short. Âm (xanh) → Short trả Long. Thanh toán mỗi 8 giờ.
        </p>
      </div>
    </TrCard>
  );
}
