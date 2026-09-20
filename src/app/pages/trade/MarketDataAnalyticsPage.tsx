/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET DATA & ANALYTICS PAGE — P2 Showcase
 * ══════════════════════════════════════════════════════════════════
 *  Comprehensive market intelligence dashboard
 */

import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  OpenInterestWidget,
  LongShortRatio,
  TopTraderPositions,
  MarketSentiment,
  FundingRateHistory,
} from '../../components/trading/MarketIntelligence';
import {
  LiquidationHeatmap,
  RecentLiquidations,
  LiquidationStats,
} from '../../components/trading/LiquidationData';
import {
  MarketDataWSProvider,
  useMarketDataWS,
  useLiveLiquidations,
  useOpenInterest,
  useLongShortRatio,
  useTopTraders,
  useFundingRate,
  WSConnectionIndicator,
} from '../../providers/MarketDataWSProvider';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

export function MarketDataAnalyticsPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'market' | 'liquidations' | 'sentiment'>('market');
  const [selectedPair] = useState('BTC/USDT');

  // Mock data - in real app, fetch from API/WebSocket
  const mockOpenInterest = {
    current: 25680000000, // $25.68B
    change24h: 1250000000, // +$1.25B
    change24hPct: 5.12,
    high24h: 26100000000,
    low24h: 24500000000,
    timestamp: Date.now(),
  };

  const mockLongShortRatio = {
    longPct: 62.5,
    shortPct: 37.5,
    longAccounts: 125400,
    shortAccounts: 75200,
    longVolume: 18500000000,
    shortVolume: 11200000000,
    timestamp: Date.now(),
  };

  const mockTopTraders = {
    longPct: 58.3,
    shortPct: 41.7,
    change24h: 3.2, // Shifted 3.2% more to long in last 24h
    timestamp: Date.now(),
  };

  const mockSentiment = {
    overall: 'greed' as const,
    score: 68,
    components: {
      openInterest: 45,
      longShortRatio: 62,
      topTraders: 58,
      fundingRate: -15,
      priceAction: 72,
    },
    timestamp: Date.now(),
  };

  const mockFundingHistory = Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() - (23 - i) * 3600000,
    rate: (Math.random() - 0.5) * 0.0003, // -0.015% to +0.015%
    avgRate: 0.0001,
  }));

  const mockLiquidationClusters = [
    { price: 70000, longLiquidations: 45000000, shortLiquidations: 12000000, total: 57000000, intensity: 95 },
    { price: 68500, longLiquidations: 32000000, shortLiquidations: 8000000, total: 40000000, intensity: 70 },
    { price: 67543, longLiquidations: 0, shortLiquidations: 0, total: 0, intensity: 0 }, // Current price
    { price: 66000, longLiquidations: 15000000, shortLiquidations: 28000000, total: 43000000, intensity: 75 },
    { price: 65000, longLiquidations: 8000000, shortLiquidations: 52000000, total: 60000000, intensity: 100 },
    { price: 64000, longLiquidations: 12000000, shortLiquidations: 35000000, total: 47000000, intensity: 80 },
  ];

  const mockRecentLiquidations = Array.from({ length: 30 }, (_, i) => ({
    id: `liq-${i}`,
    timestamp: Date.now() - i * 45000, // Every 45 seconds
    pair: Math.random() > 0.7 ? 'ETH/USDT' : 'BTC/USDT',
    side: Math.random() > 0.55 ? 'long' as const : 'short' as const,
    size: Math.random() * 500000 + 10000,
    price: 67543 + (Math.random() - 0.5) * 1000,
    exchange: 'Binance',
  }));

  const mockLiqStats = {
    last24h: {
      total: 320000000,
      longLiquidations: 185000000,
      shortLiquidations: 135000000,
      largestLiquidation: 2500000,
      avgLiquidation: 45000,
      count: 7120,
    },
    last7d: {
      total: 1850000000,
      count: 42300,
    },
    last30d: {
      total: 6200000000,
      count: 158000,
    },
  };

  return (
    <PageLayout>
      <Header
        title="Market Analytics"
        subtitle="Data & Intelligence"
        back
      />

      <PageContent gap="default">
        {/* Pair selector (mock) */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: c.surface }}
        >
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 2 }}>
              Analyzing
            </p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
              {selectedPair}
            </p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 2 }}>
              Mark Price
            </p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              $67,543.21
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'market', label: 'Market Data' },
            { id: 'liquidations', label: 'Liquidations' },
            { id: 'sentiment', label: 'Sentiment' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* MARKET DATA TAB */}
        {tab === 'market' && (
          <div className="flex flex-col gap-3">
            <OpenInterestWidget
              pair={selectedPair}
              data={mockOpenInterest}
            />

            <LongShortRatio
              pair={selectedPair}
              data={mockLongShortRatio}
            />

            <TopTraderPositions
              pair={selectedPair}
              data={mockTopTraders}
            />

            <FundingRateHistory
              pair={selectedPair}
              history={mockFundingHistory}
              currentRate={0.0001}
              nextFundingIn={7200} // 2 hours
            />
          </div>
        )}

        {/* LIQUIDATIONS TAB */}
        {tab === 'liquidations' && (
          <div className="flex flex-col gap-3">
            <LiquidationStats
              pair={selectedPair}
              data={mockLiqStats}
            />

            <LiquidationHeatmap
              pair={selectedPair}
              currentPrice={67543}
              clusters={mockLiquidationClusters}
            />

            <RecentLiquidations
              liquidations={mockRecentLiquidations}
              autoRefresh={true}
            />
          </div>
        )}

        {/* SENTIMENT TAB */}
        {tab === 'sentiment' && (
          <div className="flex flex-col gap-3">
            <MarketSentiment
              pair={selectedPair}
              data={mockSentiment}
            />

            {/* Sentiment components breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface }}
            >
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
                How Sentiment is Calculated
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Open Interest Trend', weight: '20%', description: 'OI tăng + giá tăng = bullish' },
                  { label: 'Long/Short Ratio', weight: '25%', description: 'Tỷ lệ long vs short traders' },
                  { label: 'Top Trader Positions', weight: '25%', description: 'Whales đang long hay short' },
                  { label: 'Funding Rate', weight: '15%', description: 'Dương = bullish pressure' },
                  { label: 'Price Action', weight: '15%', description: 'Momentum và volatility' },
                ].map((comp, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{ background: c.surface2 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        {comp.label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-lg"
                        style={{
                          background: c.primary,
                          color: '#fff',
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.bold,
                        }}
                      >
                        {comp.weight}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                      {comp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trading implications */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface }}
            >
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
                Trading Implications
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { condition: 'Extreme Greed (>75)', action: 'Cân nhắc chốt lời. Market có thể điều chỉnh.', color: '#EF4444' },
                  { condition: 'Greed (60-75)', action: 'Theo trend nhưng cẩn thận. Đặt trailing stop.', color: '#F59E0B' },
                  { condition: 'Neutral (40-60)', action: 'Chờ tín hiệu rõ ràng hơn. Không FOMO.', color: '#3B82F6' },
                  { condition: 'Fear (25-40)', action: 'Cơ hội accumulate nếu fundamentals ổn.', color: '#84CC16' },
                  { condition: 'Extreme Fear (<25)', action: 'Capitulation có thể xảy ra. DCA cho long-term.', color: '#10B981' },
                ].map((implication, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: c.surface2 }}
                  >
                    <div
                      className="w-1.5 h-full rounded-full shrink-0 mt-1"
                      style={{ background: implication.color, minHeight: 36 }}
                    />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                        {implication.condition}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                        {implication.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}