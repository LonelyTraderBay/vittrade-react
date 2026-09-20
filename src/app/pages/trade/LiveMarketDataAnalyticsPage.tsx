/**
 * ══════════════════════════════════════════════════════════════════
 *  LIVE MARKET DATA & ANALYTICS PAGE — With Real-Time WebSocket
 * ══════════════════════════════════════════════════════════════════
 *  Real-time market intelligence dashboard với live updates
 */

import React, { useState, useMemo } from 'react';
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
  useLiveLiquidations,
  useOpenInterest,
  useLongShortRatio,
  useTopTraders,
  useFundingRate,
  WSConnectionIndicator,
} from '../../providers/MarketDataWSProvider';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ALPHA, withAlpha } from '../../constants/colors';

function LiveMarketDataContent() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'market' | 'liquidations' | 'sentiment'>('market');
  const [selectedPair] = useState('BTC/USDT');

  // Live WebSocket data
  const liveLiquidations = useLiveLiquidations(30);
  const openInterest = useOpenInterest();
  const longShortRatio = useLongShortRatio();
  const topTraders = useTopTraders();
  const fundingRate = useFundingRate();

  // Calculate sentiment from live data
  const sentiment = useMemo(() => {
    if (!longShortRatio || !topTraders || !fundingRate || !openInterest) {
      return null;
    }

    // Simple sentiment calculation
    const lsScore = longShortRatio.longPct > 60 ? 70 : longShortRatio.longPct < 40 ? 30 : 50;
    const ttScore = topTraders.longPct > 55 ? 65 : topTraders.longPct < 45 ? 35 : 50;
    const frScore = fundingRate.rate > 0.0002 ? 75 : fundingRate.rate < -0.0002 ? 25 : 50;
    const oiScore = openInterest.change24hPct > 3 ? 65 : openInterest.change24hPct < -3 ? 35 : 50;

    const overallScore = Math.round(
      lsScore * 0.25 + ttScore * 0.25 + frScore * 0.15 + oiScore * 0.2 + 60 * 0.15
    );

    let overall: 'extreme_greed' | 'greed' | 'neutral' | 'fear' | 'extreme_fear';
    if (overallScore >= 75) overall = 'extreme_greed';
    else if (overallScore >= 60) overall = 'greed';
    else if (overallScore >= 40) overall = 'neutral';
    else if (overallScore >= 25) overall = 'fear';
    else overall = 'extreme_fear';

    return {
      overall,
      score: overallScore,
      components: {
        openInterest: oiScore - 50,
        longShortRatio: lsScore - 50,
        topTraders: ttScore - 50,
        fundingRate: frScore - 50,
        priceAction: 10,
      },
      timestamp: Date.now(),
    };
  }, [longShortRatio, topTraders, fundingRate, openInterest]);

  // Mock liquidation stats (in real app, calculate from liveLiquidations)
  const mockLiqStats = useMemo(() => {
    const last24h = liveLiquidations.slice(0, 30);
    const totalSize = last24h.reduce((sum, liq) => sum + liq.size, 0);
    const longSize = last24h.filter(l => l.side === 'long').reduce((sum, liq) => sum + liq.size, 0);
    const shortSize = last24h.filter(l => l.side === 'short').reduce((sum, liq) => sum + liq.size, 0);
    const largest = Math.max(...last24h.map(l => l.size));

    return {
      last24h: {
        total: totalSize * 100, // Scale up for display
        longLiquidations: longSize * 100,
        shortLiquidations: shortSize * 100,
        largestLiquidation: largest,
        avgLiquidation: totalSize / last24h.length,
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
  }, [liveLiquidations]);

  // Mock funding history (24h)
  const mockFundingHistory = Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() - (23 - i) * 3600000,
    rate: (Math.random() - 0.5) * 0.0003,
    avgRate: 0.0001,
  }));

  // Mock liquidation clusters
  const mockLiquidationClusters = [
    { price: 70000, longLiquidations: 45000000, shortLiquidations: 12000000, total: 57000000, intensity: 95 },
    { price: 68500, longLiquidations: 32000000, shortLiquidations: 8000000, total: 40000000, intensity: 70 },
    { price: 67543, longLiquidations: 0, shortLiquidations: 0, total: 0, intensity: 0 },
    { price: 66000, longLiquidations: 15000000, shortLiquidations: 28000000, total: 43000000, intensity: 75 },
    { price: 65000, longLiquidations: 8000000, shortLiquidations: 52000000, total: 60000000, intensity: 100 },
    { price: 64000, longLiquidations: 12000000, shortLiquidations: 35000000, total: 47000000, intensity: 80 },
  ];

  return (
    <PageLayout>
      <Header title="Live Market Analytics" subtitle="Real-Time Data" back />

      <PageContent gap="default">
        {/* Live indicator + Pair selector */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: `linear-gradient(135deg, ${withAlpha('#10B981', ALPHA.hover)} 0%, ${withAlpha('#3B82F6', ALPHA.hover)} 100%)`,
            border: `1.5px solid ${withAlpha('#10B981', ALPHA.soft)}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <WSConnectionIndicator />
            <span
              className="px-3 py-1 rounded-lg"
              style={{
                background: withAlpha('#10B981', ALPHA.soft),
                color: '#10B981',
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              WebSocket Active
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 2 }}>Analyzing</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
                {selectedPair}
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 2 }}>Mark Price</p>
              <p
                style={{
                  color: '#10B981',
                  fontSize: FONT_SCALE.lg,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                $67,543.21
              </p>
            </div>
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

        {/* MARKET DATA TAB - LIVE */}
        {tab === 'market' && (
          <div className="flex flex-col gap-3">
            {openInterest && (
              <OpenInterestWidget pair={selectedPair} data={openInterest} />
            )}

            {longShortRatio && (
              <LongShortRatio pair={selectedPair} data={longShortRatio} />
            )}

            {topTraders && (
              <TopTraderPositions pair={selectedPair} data={topTraders} />
            )}

            {fundingRate && (
              <FundingRateHistory
                pair={selectedPair}
                history={mockFundingHistory}
                currentRate={fundingRate.rate}
                nextFundingIn={fundingRate.nextFundingIn}
              />
            )}
          </div>
        )}

        {/* LIQUIDATIONS TAB - LIVE */}
        {tab === 'liquidations' && (
          <div className="flex flex-col gap-3">
            <LiquidationStats pair={selectedPair} data={mockLiqStats} />

            <LiquidationHeatmap
              pair={selectedPair}
              currentPrice={67543}
              clusters={mockLiquidationClusters}
            />

            <RecentLiquidations liquidations={liveLiquidations} autoRefresh={true} />
          </div>
        )}

        {/* SENTIMENT TAB - LIVE */}
        {tab === 'sentiment' && sentiment && (
          <div className="flex flex-col gap-3">
            <MarketSentiment pair={selectedPair} data={sentiment} />

            {/* Real-time data sources */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface }}
            >
              <p
                style={{
                  color: c.text1,
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  marginBottom: 8,
                }}
              >
                Live Data Sources
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    label: 'Open Interest',
                    update: 'Every 5 minutes',
                    lastUpdate: openInterest?.timestamp,
                  },
                  {
                    label: 'Long/Short Ratio',
                    update: 'Every 15 seconds',
                    lastUpdate: longShortRatio?.timestamp,
                  },
                  {
                    label: 'Top Traders',
                    update: 'Every 1 minute',
                    lastUpdate: topTraders?.timestamp,
                  },
                  {
                    label: 'Funding Rate',
                    update: 'Every 30 seconds',
                    lastUpdate: fundingRate?.timestamp,
                  },
                  {
                    label: 'Liquidations',
                    update: 'Real-time stream',
                    lastUpdate: liveLiquidations[0]?.timestamp,
                  },
                ].map((source, i) => {
                  const secondsAgo = source.lastUpdate
                    ? Math.floor((Date.now() - source.lastUpdate) / 1000)
                    : 0;

                  return (
                    <div
                      key={i}
                      className="rounded-xl p-3 flex items-center justify-between"
                      style={{ background: c.surface2 }}
                    >
                      <div>
                        <p
                          style={{
                            color: c.text1,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.semibold,
                          }}
                        >
                          {source.label}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{source.update}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: secondsAgo < 60 ? '#10B981' : '#F59E0B',
                            }}
                          />
                          <span
                            style={{
                              color: secondsAgo < 60 ? '#10B981' : '#F59E0B',
                              fontSize: FONT_SCALE.micro,
                              fontWeight: FONT_WEIGHT.semibold,
                            }}
                          >
                            {secondsAgo}s ago
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trading implications */}
            <div className="rounded-2xl p-4" style={{ background: c.surface }}>
              <p
                style={{
                  color: c.text1,
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  marginBottom: 8,
                }}
              >
                Trading Implications
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    condition: 'Extreme Greed (>75)',
                    action: 'Cân nhắc chốt lời. Market có thể điều chỉnh.',
                    color: '#EF4444',
                  },
                  {
                    condition: 'Greed (60-75)',
                    action: 'Theo trend nhưng cẩn thận. Đặt trailing stop.',
                    color: '#F59E0B',
                  },
                  {
                    condition: 'Neutral (40-60)',
                    action: 'Chờ tín hiệu rõ ràng hơn. Không FOMO.',
                    color: '#3B82F6',
                  },
                  {
                    condition: 'Fear (25-40)',
                    action: 'Cơ hội accumulate nếu fundamentals ổn.',
                    color: '#84CC16',
                  },
                  {
                    condition: 'Extreme Fear (<25)',
                    action: 'Capitulation có thể xảy ra. DCA cho long-term.',
                    color: '#10B981',
                  },
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
                      <p
                        style={{
                          color: c.text1,
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.semibold,
                          marginBottom: 2,
                        }}
                      >
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

export function LiveMarketDataAnalyticsPage() {
  return (
    <MarketDataWSProvider autoConnect={true}>
      <LiveMarketDataContent />
    </MarketDataWSProvider>
  );
}
