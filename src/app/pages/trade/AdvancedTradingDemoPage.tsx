/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED TRADING DEMO PAGE
 * ══════════════════════════════════════════════════════════════════
 *  Showcase all P1 Advanced Controls features
 */

import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  PartialCloseSheet,
  LadderTPSLSheet,
  TrailingStopSheet,
  PositionModeToggle,
  MarginAdjustSheet,
} from '../../components/trading/AdvancedPositionControls';
import {
  OrderTypeSelector,
  OrderTypeInfo,
  IcebergConfig,
  ReduceOnlyIndicator,
  OrderType,
  OrderTimeInForce,
  OrderOptions,
} from '../../components/trading/AdvancedOrderTypes';
import {
  PnLSummary,
  PerformanceStats,
  PeriodPerformance,
  PnLAttribution,
} from '../../components/trading/PnLAnalytics';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

export function AdvancedTradingDemoPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'position' | 'orders' | 'analytics'>('position');

  // Position management states
  const [showPartialClose, setShowPartialClose] = useState(false);
  const [showLadderTPSL, setShowLadderTPSL] = useState(false);
  const [showTrailingStop, setShowTrailingStop] = useState(false);
  const [showMarginAdjust, setShowMarginAdjust] = useState(false);
  const [positionMode, setPositionMode] = useState<'one-way' | 'hedge'>('one-way');

  // Order type states
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderTIF, setOrderTIF] = useState<OrderTimeInForce>('GTC');
  const [orderOptions, setOrderOptions] = useState<OrderOptions>({
    postOnly: false,
    reduceOnly: false,
    iceberg: { enabled: false, visibleSize: 0 },
  });
  const [totalSize, setTotalSize] = useState(1.0);

  // Mock data
  const mockPosition = {
    id: 'pos1',
    pair: 'BTC/USDT',
    side: 'long' as const,
    currentSize: 0.5,
    currentPnl: 1250.00,
    markPrice: 67543.21,
    entryPrice: 65200,
    currentMargin: 6520,
    availableBalance: 5000,
    liquidationPrice: 52160,
  };

  const mockPnLData = {
    realizedPnL: 3250.50,
    unrealizedPnL: 1250.00,
    totalEquity: 15000,
  };

  const mockMetrics = {
    totalTrades: 47,
    winningTrades: 32,
    losingTrades: 15,
    totalProfit: 8450.00,
    totalLoss: -3200.00,
    avgWin: 264.06,
    avgLoss: -213.33,
    largestWin: 1250.00,
    largestLoss: -850.00,
  };

  const mockPeriods = [
    { period: 'Week 11 (Mar 10-16)', pnl: 1250.50, trades: 12, winRate: 75 },
    { period: 'Week 10 (Mar 3-9)', pnl: -320.00, trades: 8, winRate: 37.5 },
    { period: 'Week 9 (Feb 24-Mar 2)', pnl: 890.25, trades: 15, winRate: 66.7 },
    { period: 'Week 8 (Feb 17-23)', pnl: 520.00, trades: 10, winRate: 60 },
    { period: 'Week 7 (Feb 10-16)', pnl: 1100.00, trades: 14, winRate: 71.4 },
  ];

  const mockAttributions = [
    { id: 'a1', pair: 'BTC/USDT', side: 'long' as const, pnl: 1250, pnlPct: 19.2, contribution: 27.8, entryDate: '2024-03-01', closeDate: '2024-03-10', duration: '9 days' },
    { id: 'a2', pair: 'ETH/USDT', side: 'short' as const, pnl: 820, pnlPct: 22.7, contribution: 18.2, entryDate: '2024-03-05', closeDate: '2024-03-11', duration: '6 days' },
    { id: 'a3', pair: 'SOL/USDT', side: 'long' as const, pnl: -450, pnlPct: -15.6, contribution: -10.0, entryDate: '2024-03-08', duration: '3 days (open)' },
    { id: 'a4', pair: 'BNB/USDT', side: 'long' as const, pnl: 380, pnlPct: 9.0, contribution: 8.4, entryDate: '2024-03-02', closeDate: '2024-03-09', duration: '7 days' },
  ];

  return (
    <PageLayout>
      <Header
        title="Advanced Trading"
        subtitle="Position & Order Controls"
        back
      />

      <PageContent gap="default">
        {/* Position Mode Toggle */}
        <PositionModeToggle
          currentMode={positionMode}
          onChange={setPositionMode}
        />

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'position', label: 'Position Controls' },
            { id: 'orders', label: 'Order Types' },
            { id: 'analytics', label: 'PnL Analytics' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* POSITION CONTROLS TAB */}
        {tab === 'position' && (
          <div className="flex flex-col gap-3">
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
                Position Management Features
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 12 }}>
                Professional tools để quản lý vị thế hiệu quả
              </p>

              <div className="flex flex-col gap-2">
                <CTAButton onClick={() => setShowPartialClose(true)} variant="secondary">
                  Partial Close Position (25%/50%/75%/100%)
                </CTAButton>
                <CTAButton onClick={() => setShowLadderTPSL(true)} variant="secondary">
                  Ladder TP/SL (Multiple Levels)
                </CTAButton>
                <CTAButton onClick={() => setShowTrailingStop(true)} variant="secondary">
                  Trailing Stop Loss
                </CTAButton>
                <CTAButton onClick={() => setShowMarginAdjust(true)} variant="secondary">
                  Add/Reduce Margin
                </CTAButton>
              </div>
            </TrCard>

            {/* Current position preview */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
                Mock Position (Demo)
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Pair</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    {mockPosition.pair} · {mockPosition.side.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Size</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    {mockPosition.currentSize} BTC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Unrealized PnL</span>
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                    +${mockPosition.currentPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* ORDER TYPES TAB */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-3">
            <OrderTypeSelector
              selectedType={orderType}
              selectedTIF={orderTIF}
              options={orderOptions}
              onTypeChange={setOrderType}
              onTIFChange={setOrderTIF}
              onOptionsChange={setOrderOptions}
            />

            {/* Info card for selected TIF */}
            {(orderType === 'limit' || orderType === 'stop-limit') && (
              <OrderTypeInfo type={orderTIF} />
            )}

            {/* Iceberg configurator */}
            {orderOptions.iceberg?.enabled && (
              <IcebergConfig
                totalSize={totalSize}
                visibleSize={orderOptions.iceberg.visibleSize}
                onVisibleSizeChange={(size) => 
                  setOrderOptions({
                    ...orderOptions,
                    iceberg: { enabled: true, visibleSize: size },
                  })
                }
              />
            )}

            {/* Reduce-only indicator */}
            {orderOptions.reduceOnly && (
              <ReduceOnlyIndicator
                enabled={orderOptions.reduceOnly}
                currentPosition={mockPosition.currentSize}
                orderSize={0.3}
              />
            )}

            {/* Summary */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
                Order Summary
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Order Type</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    {orderType.toUpperCase()}
                  </span>
                </div>
                {(orderType === 'limit' || orderType === 'stop-limit') && (
                  <div className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Time In Force</span>
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                      {orderTIF}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Reduce-Only</span>
                  <span style={{ color: orderOptions.reduceOnly ? '#10B981' : c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    {orderOptions.reduceOnly ? 'Yes' : 'No'}
                  </span>
                </div>
                {orderOptions.iceberg?.enabled && (
                  <div className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Iceberg</span>
                    <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                      {orderOptions.iceberg.visibleSize.toFixed(4)} visible
                    </span>
                  </div>
                )}
              </div>
            </TrCard>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div className="flex flex-col gap-3">
            <PnLSummary
              realizedPnL={mockPnLData.realizedPnL}
              unrealizedPnL={mockPnLData.unrealizedPnL}
              totalEquity={mockPnLData.totalEquity}
            />

            <PerformanceStats metrics={mockMetrics} />

            <PeriodPerformance periods={mockPeriods} />

            <PnLAttribution
              positions={mockAttributions}
              totalPnL={mockPnLData.realizedPnL + mockPnLData.unrealizedPnL}
            />
          </div>
        )}
      </PageContent>

      {/* Position Management Sheets */}
      <PartialCloseSheet
        positionId={mockPosition.id}
        pair={mockPosition.pair}
        side={mockPosition.side}
        currentSize={mockPosition.currentSize}
        currentPnl={mockPosition.currentPnl}
        markPrice={mockPosition.markPrice}
        open={showPartialClose}
        onClose={() => setShowPartialClose(false)}
        onConfirm={(pct) => console.log('Partial close:', pct)}
      />

      <LadderTPSLSheet
        positionId={mockPosition.id}
        pair={mockPosition.pair}
        side={mockPosition.side}
        entryPrice={mockPosition.entryPrice}
        currentPrice={mockPosition.markPrice}
        currentSize={mockPosition.currentSize}
        open={showLadderTPSL}
        onClose={() => setShowLadderTPSL(false)}
        onConfirm={(tp, sl) => console.log('Ladder TP/SL:', tp, sl)}
      />

      <TrailingStopSheet
        positionId={mockPosition.id}
        pair={mockPosition.pair}
        side={mockPosition.side}
        entryPrice={mockPosition.entryPrice}
        currentPrice={mockPosition.markPrice}
        currentSize={mockPosition.currentSize}
        open={showTrailingStop}
        onClose={() => setShowTrailingStop(false)}
        onConfirm={(distance, type) => console.log('Trailing stop:', distance, type)}
      />

      <MarginAdjustSheet
        positionId={mockPosition.id}
        pair={mockPosition.pair}
        side={mockPosition.side}
        currentMargin={mockPosition.currentMargin}
        availableBalance={mockPosition.availableBalance}
        liquidationPrice={mockPosition.liquidationPrice}
        markPrice={mockPosition.markPrice}
        open={showMarginAdjust}
        onClose={() => setShowMarginAdjust(false)}
        onConfirm={(action, amount) => console.log('Margin adjust:', action, amount)}
      />
    </PageLayout>
  );
}
