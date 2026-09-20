/**
 * ══════════════════════════════════════════════════════════════════
 *  POSITION DASHBOARD — Phase 1: Risk Management Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Real-time Position Tracking with P&L
 *  - Entry price vs current price
 *  - Unrealized gain/loss ($ + %)
 *  - Position size % of portfolio
 *  - Break-even price calculation
 *  - Liquidation price (for margin positions)
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface Position {
  id: string;
  symbol: string;
  baseAsset: string;
  logoColor: string;
  
  // Position details
  side: 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  
  // Optional: Margin trading
  leverage?: number;
  liquidationPrice?: number;
  
  // Timestamp
  openedAt: string; // ISO date
}

interface PositionDashboardProps {
  positions: Position[];
  totalPortfolioValue: number;
  onPositionClick?: (position: Position) => void;
}

/* ═══════════════════════════════════════════════════════════════
   POSITION CARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function PositionCard({ position, portfolioValue, onClick }: {
  position: Position;
  portfolioValue: number;
  onClick?: () => void;
}) {
  const c = useThemeColors();

  // Calculate P&L
  const entryValue = position.amount * position.entryPrice;
  const currentValue = position.amount * position.currentPrice;
  const pnlUsd = position.side === 'long'
    ? currentValue - entryValue
    : entryValue - currentValue;
  const pnlPct = (pnlUsd / entryValue) * 100;
  const isProfit = pnlUsd >= 0;

  // Position size as % of portfolio
  const positionPct = (currentValue / portfolioValue) * 100;

  // Break-even price (including 0.1% fee on entry and exit)
  const feeRate = 0.001; // 0.1%
  const breakEvenPrice = position.side === 'long'
    ? position.entryPrice * (1 + feeRate * 2)
    : position.entryPrice * (1 - feeRate * 2);

  // Liquidation risk (for margin)
  const hasLiqRisk = position.liquidationPrice !== undefined;
  const liqDistance = hasLiqRisk
    ? Math.abs((position.currentPrice - position.liquidationPrice!) / position.currentPrice) * 100
    : 0;
  const isHighRisk = hasLiqRisk && liqDistance < 10; // Within 10% of liquidation

  return (
    <TrCard
      as={onClick ? 'button' : 'div'}
      hover={!!onClick}
      className="p-4"
      onClick={onClick}
      accentBorder={isProfit ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${position.logoColor}1F` }}
          >
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: position.logoColor }}>
              {position.baseAsset.slice(0, 3)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                {position.symbol}
              </span>
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.bold,
                  color: position.side === 'long' ? '#10B981' : '#EF4444',
                  background: position.side === 'long' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                }}
              >
                {position.side === 'long' ? 'LONG' : 'SHORT'}
                {position.leverage && ` ${position.leverage}x`}
              </span>
            </div>
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
              {fmtAmount(position.amount)} {position.baseAsset}
            </span>
          </div>
        </div>

        {/* P&L Badge */}
        <div className="text-right">
          <p
            style={{
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.bold,
              color: isProfit ? '#10B981' : '#EF4444',
              fontFamily: 'monospace',
            }}
          >
            {isProfit ? '+' : ''}{fmtUsd(pnlUsd)}
          </p>
          <p
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
              color: isProfit ? '#10B981' : '#EF4444',
            }}
          >
            {isProfit ? '+' : ''}{fmtPct(pnlPct)}
          </p>
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
            Giá vào lệnh
          </p>
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
            {fmtPrice(position.entryPrice)}
          </p>
        </div>
        <div className="text-right">
          <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
            Giá hiện tại
          </p>
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
            {fmtPrice(position.currentPrice)}
          </p>
        </div>
      </div>

      {/* Position Size Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
            Tỷ trọng danh mục
          </span>
          <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            {fmtPct(positionPct)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(positionPct, 100)}%`,
              background: isProfit
                ? 'linear-gradient(90deg, #10B981, #059669)'
                : 'linear-gradient(90deg, #EF4444, #dc2626)',
            }}
          />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
        <div>
          <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Break-even</p>
          <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
            {fmtPrice(breakEvenPrice)}
          </p>
        </div>
        
        {hasLiqRisk && (
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: isHighRisk ? '#EF4444' : c.text3 }}>
              Liquidation
            </p>
            <div className="flex items-center gap-1">
              {isHighRisk && <AlertTriangle size={12} color="#EF4444" />}
              <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: isHighRisk ? '#EF4444' : c.text2, fontFamily: 'monospace' }}>
                {fmtPrice(position.liquidationPrice!)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* High Risk Warning */}
      {isHighRisk && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={12} color="#EF4444" className="shrink-0" />
          <span style={{ fontSize: FONT_SCALE.micro, color: '#EF4444', lineHeight: 1.4 }}>
            Cảnh báo: Còn {fmtPct(liqDistance)} đến giá thanh lý
          </span>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POSITION DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function PositionDashboard({
  positions,
  totalPortfolioValue,
  onPositionClick,
}: PositionDashboardProps) {
  const c = useThemeColors();

  // Calculate total P&L
  const totalPnL = useMemo(() => {
    return positions.reduce((sum, pos) => {
      const entryValue = pos.amount * pos.entryPrice;
      const currentValue = pos.amount * pos.currentPrice;
      const pnl = pos.side === 'long'
        ? currentValue - entryValue
        : entryValue - currentValue;
      return sum + pnl;
    }, 0);
  }, [positions]);

  const totalPnLPct = totalPortfolioValue > 0
    ? (totalPnL / (totalPortfolioValue - totalPnL)) * 100
    : 0;
  const isProfit = totalPnL >= 0;

  if (positions.length === 0) {
    return (
      <TrCard className="p-6 flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(100,116,139,0.12)' }}
        >
          <DollarSign size={24} color={c.text3} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, marginBottom: 4 }}>
            Chưa có vị thế nào
          </p>
          <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
            Vị thế của bạn sẽ hiển thị ở đây sau khi đặt lệnh
          </p>
        </div>
      </TrCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Card */}
      <TrCard className="p-4" accentBorder={isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
            Tổng Unrealized P&L
          </span>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isProfit ? '#10B981' : '#EF4444',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          {isProfit ? <TrendingUp size={20} color="#10B981" /> : <TrendingDown size={20} color="#EF4444" />}
          <div>
            <p
              style={{
                fontSize: FONT_SCALE.xl,
                fontWeight: FONT_WEIGHT.bold,
                color: isProfit ? '#10B981' : '#EF4444',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {isProfit ? '+' : ''}{fmtUsd(totalPnL)}
            </p>
            <p
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: isProfit ? '#10B981' : '#EF4444',
                marginTop: 4,
              }}
            >
              {isProfit ? '+' : ''}{fmtPct(totalPnLPct)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Tổng giá trị</p>
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtUsd(totalPortfolioValue)}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Số vị thế</p>
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {positions.length}
            </p>
          </div>
        </div>
      </TrCard>

      {/* Individual Positions */}
      <div className="flex flex-col gap-3">
        {positions.map(pos => (
          <PositionCard
            key={pos.id}
            position={pos}
            portfolioValue={totalPortfolioValue}
            onClick={onPositionClick ? () => onPositionClick(pos) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
