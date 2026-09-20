/**
 * ══════════════════════════════════════════════════════════════════
 *  LADDER TRADING — Phase 3: Advanced Trading Tools
 * ══════════════════════════════════════════════════════════════════
 *  Click-to-Trade on Depth of Market (DOM)
 *  - One-click order placement at any price level
 *  - Visual order book with buy/sell walls
 *  - Drag to adjust existing orders
 *  - Quick cancel on ladder
 *  - Position indicator on ladder
 *  - Customizable lot sizes
 */

import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, X, Target, DollarSign, Minus, Plus } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtAmount, fmtCompact } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface OrderBookLevel {
  price: number;
  buyVolume: number;
  sellVolume: number;
  totalBuyVolume: number; // Cumulative for depth visualization
  totalSellVolume: number;
}

export interface LadderOrder {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  filled: number;
}

interface LadderTradingProps {
  symbol: string;
  baseAsset: string;
  currentPrice: number;
  
  // Order book data (sorted by price descending)
  levels: OrderBookLevel[];
  
  // User's open orders on ladder
  openOrders: LadderOrder[];
  
  // User's position (if any)
  position?: {
    side: 'long' | 'short';
    entryPrice: number;
    amount: number;
  };
  
  // Lot size presets
  defaultLotSize: number;
  lotSizes?: number[];
  
  // Callbacks
  onPlaceOrder: (side: 'buy' | 'sell', price: number, amount: number) => void;
  onCancelOrder: (orderId: string) => void;
  onModifyOrder: (orderId: string, newPrice: number) => void;
}

/* ═══════════════════════════════════════════════════════════════
   LADDER TRADING COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function LadderTrading({
  symbol,
  baseAsset,
  currentPrice,
  levels,
  openOrders,
  position,
  defaultLotSize,
  lotSizes = [0.1, 0.5, 1.0, 2.0],
  onPlaceOrder,
  onCancelOrder,
  onModifyOrder,
}: LadderTradingProps) {
  const c = useThemeColors();
  const { hapticSuccess, hapticLight } = useHaptic();

  const [selectedLotSize, setSelectedLotSize] = useState(defaultLotSize);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [clickMode, setClickMode] = useState<'buy' | 'sell' | 'auto'>('auto');

  // Find max volumes for bar width calculation
  const maxBuyVolume = Math.max(...levels.map(l => l.totalBuyVolume), 1);
  const maxSellVolume = Math.max(...levels.map(l => l.totalSellVolume), 1);

  // Handle ladder click
  const handleLadderClick = (price: number, side?: 'buy' | 'sell') => {
    let orderSide: 'buy' | 'sell';

    if (clickMode === 'buy') {
      orderSide = 'buy';
    } else if (clickMode === 'sell') {
      orderSide = 'sell';
    } else {
      // Auto mode: buy below current, sell above
      orderSide = price < currentPrice ? 'buy' : 'sell';
    }

    if (side) orderSide = side; // Override if explicit side clicked

    hapticLight();
    onPlaceOrder(orderSide, price, selectedLotSize);
  };

  // Handle order cancel
  const handleCancelOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticSuccess();
    onCancelOrder(orderId);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} color="#3B82F6" />
          <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Ladder Trading
          </span>
        </div>
        <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
          {symbol}
        </span>
      </div>

      {/* Lot Size Selector */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: FONT_SCALE.xs, color: c.text3, whiteSpace: 'nowrap' }}>
          Lot Size:
        </span>
        <div className="flex gap-1 flex-1">
          {lotSizes.map(size => (
            <button
              key={size}
              onClick={() => { setSelectedLotSize(size); hapticLight(); }}
              className="flex-1 px-2 py-1.5 rounded-lg min-h-8"
              style={{
                fontSize: FONT_SCALE.xs,
                fontWeight: selectedLotSize === size ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                background: selectedLotSize === size ? c.chipActiveBg : c.surface2,
                color: selectedLotSize === size ? c.chipActiveText : c.text2,
                border: selectedLotSize === size
                  ? `2px solid ${c.chipActiveBorder}`
                  : `1px solid ${c.borderSolid}`,
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Click Mode Toggle */}
      <div className="flex gap-1">
        {['buy', 'auto', 'sell'].map(mode => (
          <button
            key={mode}
            onClick={() => { setClickMode(mode as any); hapticLight(); }}
            className="flex-1 px-3 py-2 rounded-lg min-h-9"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: clickMode === mode ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
              background: clickMode === mode ? c.chipActiveBg : c.surface2,
              color: clickMode === mode ? c.chipActiveText : c.text2,
              border: clickMode === mode
                ? `2px solid ${c.chipActiveBorder}`
                : `1px solid ${c.borderSolid}`,
            }}
          >
            {mode === 'buy' && '🟢 Buy Only'}
            {mode === 'auto' && '⚡ Auto'}
            {mode === 'sell' && '🔴 Sell Only'}
          </button>
        ))}
      </div>

      {/* Ladder Container */}
      <TrCard className="p-0 overflow-hidden">
        {/* Column Headers */}
        <div
          className="grid grid-cols-5 gap-1 px-2 py-2 sticky top-0 z-10"
          style={{ background: c.surface2, borderBottom: `1px solid ${c.divider}` }}
        >
          <div className="text-right">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Sell</span>
          </div>
          <div className="text-center">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>My</span>
          </div>
          <div className="text-center">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, fontWeight: FONT_WEIGHT.bold }}>Price</span>
          </div>
          <div className="text-center">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>My</span>
          </div>
          <div className="text-left">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Buy</span>
          </div>
        </div>

        {/* Ladder Levels */}
        <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {levels.map((level, i) => {
            const isCurrentPrice = Math.abs(level.price - currentPrice) < 0.01;
            const hasPosition = position && Math.abs(level.price - position.entryPrice) < 0.01;
            const isHovered = level.price === hoveredPrice;
            
            // Find user orders at this level
            const buyOrders = openOrders.filter(o => o.side === 'buy' && Math.abs(o.price - level.price) < 0.01);
            const sellOrders = openOrders.filter(o => o.side === 'sell' && Math.abs(o.price - level.price) < 0.01);

            // Volume bars width
            const buyBarWidth = (level.totalBuyVolume / maxBuyVolume) * 100;
            const sellBarWidth = (level.totalSellVolume / maxSellVolume) * 100;

            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setHoveredPrice(level.price)}
                onMouseLeave={() => setHoveredPrice(null)}
                style={{
                  background: isCurrentPrice
                    ? 'rgba(59,130,246,0.12)'
                    : hasPosition
                    ? 'rgba(245,158,11,0.08)'
                    : isHovered
                    ? c.surface2
                    : 'transparent',
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                {/* Volume bars background */}
                <div className="absolute inset-0 flex">
                  {/* Sell volume bar (left side) */}
                  <div className="flex-1 flex justify-end">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${sellBarWidth}%`,
                        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.12))',
                      }}
                    />
                  </div>
                  {/* Buy volume bar (right side) */}
                  <div className="flex-1">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${buyBarWidth}%`,
                        background: 'linear-gradient(90deg, rgba(16,185,129,0.12), transparent)',
                      }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-5 gap-1 px-2 py-1.5 relative z-10">
                  {/* Sell Volume */}
                  <button
                    onClick={() => handleLadderClick(level.price, 'sell')}
                    className="text-right"
                  >
                    {level.sellVolume > 0 && (
                      <span style={{ fontSize: FONT_SCALE.xs, color: '#EF4444', fontFamily: 'monospace' }}>
                        {fmtCompact(level.sellVolume)}
                      </span>
                    )}
                  </button>

                  {/* Sell Orders */}
                  <div className="text-center">
                    {sellOrders.map(order => (
                      <button
                        key={order.id}
                        onClick={(e) => handleCancelOrder(order.id, e)}
                        className="px-1 py-0.5 rounded"
                        style={{
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.bold,
                          color: '#EF4444',
                          background: 'rgba(239,68,68,0.15)',
                        }}
                      >
                        {fmtAmount(order.amount)}
                        <X size={8} className="inline ml-0.5" />
                      </button>
                    ))}
                  </div>

                  {/* Price */}
                  <button
                    onClick={() => handleLadderClick(level.price)}
                    className="text-center"
                  >
                    <span
                      style={{
                        fontSize: FONT_SCALE.xs,
                        fontWeight: isCurrentPrice ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                        color: isCurrentPrice ? '#3B82F6' : c.text1,
                        fontFamily: 'monospace',
                      }}
                    >
                      {fmtPrice(level.price)}
                      {isCurrentPrice && ' ●'}
                      {hasPosition && ' ◆'}
                    </span>
                  </button>

                  {/* Buy Orders */}
                  <div className="text-center">
                    {buyOrders.map(order => (
                      <button
                        key={order.id}
                        onClick={(e) => handleCancelOrder(order.id, e)}
                        className="px-1 py-0.5 rounded"
                        style={{
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.bold,
                          color: '#10B981',
                          background: 'rgba(16,185,129,0.15)',
                        }}
                      >
                        {fmtAmount(order.amount)}
                        <X size={8} className="inline ml-0.5" />
                      </button>
                    ))}
                  </div>

                  {/* Buy Volume */}
                  <button
                    onClick={() => handleLadderClick(level.price, 'buy')}
                    className="text-left"
                  >
                    {level.buyVolume > 0 && (
                      <span style={{ fontSize: FONT_SCALE.xs, color: '#10B981', fontFamily: 'monospace' }}>
                        {fmtCompact(level.buyVolume)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* Legend */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>● Current</span>
          </div>
          {position && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rotate-45" style={{ background: '#F59E0B' }} />
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>◆ Position</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
          Click price to place {clickMode === 'auto' ? 'buy/sell' : clickMode} order
        </span>
      </div>

      {/* Position Summary (if exists) */}
      {position && (
        <TrCard className="p-3" accentBorder={position.side === 'long' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {position.side === 'long' ? (
                <TrendingUp size={16} color="#10B981" />
              ) : (
                <TrendingDown size={16} color="#EF4444" />
              )}
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                {position.side.toUpperCase()} {fmtAmount(position.amount)} {baseAsset}
              </span>
            </div>
            <div className="text-right">
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Entry</p>
              <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtPrice(position.entryPrice)}
              </p>
            </div>
          </div>
        </TrCard>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            // Quick buy at best ask
            const bestAsk = levels.find(l => l.sellVolume > 0)?.price || currentPrice;
            onPlaceOrder('buy', bestAsk, selectedLotSize);
            hapticSuccess();
          }}
          className="px-3 py-2 rounded-xl min-h-10 flex items-center justify-center gap-2"
          style={{
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={14} />
          Quick Buy
        </button>
        <button
          onClick={() => {
            // Quick sell at best bid
            const bestBid = levels.find(l => l.buyVolume > 0)?.price || currentPrice;
            onPlaceOrder('sell', bestBid, selectedLotSize);
            hapticSuccess();
          }}
          className="px-3 py-2 rounded-xl min-h-10 flex items-center justify-center gap-2"
          style={{
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
          }}
        >
          <Minus size={14} />
          Quick Sell
        </button>
      </div>
    </div>
  );
}
