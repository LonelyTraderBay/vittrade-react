/**
 * ══════════════════════════════════════════════════════════════════
 *  POSITION SIZING CALCULATOR — Phase 1: Risk Management Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Calculate optimal position size based on risk tolerance
 *  - Account balance input
 *  - Risk % per trade (1-5%)
 *  - Entry and stop loss prices
 *  - Auto-calculate suggested position size
 *  - Show max loss if SL hits
 */

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Info, Target } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

interface PositionSizingCalculatorProps {
  // Required inputs
  symbol: string;
  baseAsset: string;
  currentPrice: number;
  accountBalance: number;
  
  // Optional: Pre-fill values
  initialEntryPrice?: number;
  initialStopLoss?: number;
  
  // Callbacks
  onCalculate?: (result: PositionSizeResult) => void;
  onApply?: (amount: number) => void;
}

export interface PositionSizeResult {
  suggestedAmount: number;
  totalCost: number;
  riskAmount: number;
  riskPct: number;
  stopLossDistance: number;
  stopLossPct: number;
}

const RISK_PRESETS = [
  { value: 1, label: '1% (Conservative)', color: '#10B981' },
  { value: 2, label: '2% (Moderate)', color: '#3B82F6' },
  { value: 3, label: '3% (Balanced)', color: '#F59E0B' },
  { value: 5, label: '5% (Aggressive)', color: '#EF4444' },
];

/* ═══════════════════════════════════════════════════════════════
   POSITION SIZING CALCULATOR COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function PositionSizingCalculator({
  symbol,
  baseAsset,
  currentPrice,
  accountBalance,
  initialEntryPrice,
  initialStopLoss,
  onCalculate,
  onApply,
}: PositionSizingCalculatorProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();

  // Inputs
  const [riskPct, setRiskPct] = useState(2); // Default 2%
  const [entryPrice, setEntryPrice] = useState(initialEntryPrice?.toString() || currentPrice.toString());
  const [stopLossPrice, setStopLossPrice] = useState(initialStopLoss?.toString() || '');
  const [showInfo, setShowInfo] = useState(false);

  // Parse numbers
  const entryPriceNum = parseFloat(entryPrice || '0');
  const stopLossPriceNum = parseFloat(stopLossPrice || '0');

  // Calculate position size
  const result = React.useMemo<PositionSizeResult | null>(() => {
    if (entryPriceNum <= 0 || stopLossPriceNum <= 0) return null;
    if (Math.abs(entryPriceNum - stopLossPriceNum) < 0.01) return null; // Too close

    const riskAmount = accountBalance * (riskPct / 100);
    const stopLossDistance = Math.abs(entryPriceNum - stopLossPriceNum);
    const stopLossPct = (stopLossDistance / entryPriceNum) * 100;
    
    // Risk per unit = price distance between entry and SL
    const riskPerUnit = stopLossDistance;
    
    // Suggested amount = Total risk / Risk per unit
    const suggestedAmount = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
    const totalCost = suggestedAmount * entryPriceNum;

    return {
      suggestedAmount,
      totalCost,
      riskAmount,
      riskPct,
      stopLossDistance,
      stopLossPct,
    };
  }, [accountBalance, riskPct, entryPriceNum, stopLossPriceNum]);

  // Notify parent when calculation changes
  useEffect(() => {
    if (result && onCalculate) {
      onCalculate(result);
    }
  }, [result, onCalculate]);

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  const handleApply = () => {
    if (result && onApply) {
      hapticSuccess();
      onApply(result.suggestedAmount);
    }
  };

  // Validation
  const isValidStopLoss = stopLossPriceNum > 0 && stopLossPriceNum !== entryPriceNum;
  const hasEnoughBalance = result ? result.totalCost <= accountBalance : false;
  const canApply = result && isValidStopLoss && hasEnoughBalance;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <TrCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator size={20} color="#3B82F6" />
            <div>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                Position Sizing Calculator
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                {symbol}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowInfo(!showInfo); hapticSelection(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: c.surface2 }}
          >
            <Info size={16} color={c.text2} />
          </button>
        </div>

        {showInfo && (
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)` }}>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text2, lineHeight: 1.6 }}>
              Công cụ tính toán khối lượng lệnh tối ưu dựa trên <strong style={{ color: '#3B82F6' }}>tỷ lệ rủi ro</strong> bạn chấp nhận.
              Điều này giúp bạn không bị over-leverage và bảo vệ tài khoản.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Số dư khả dụng</span>
          <span style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
            {fmtUsd(accountBalance)}
          </span>
        </div>
      </TrCard>

      {/* Risk % Selector */}
      <div>
        <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
          Rủi ro mỗi lệnh
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RISK_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => { setRiskPct(preset.value); hapticSelection(); }}
              className="px-3 py-3 rounded-xl min-h-11 text-left"
              style={{
                background: riskPct === preset.value ? c.chipActiveBg : c.surface2,
                border: riskPct === preset.value
                  ? `2px solid ${c.chipActiveBorder}`
                  : `1.5px solid ${c.borderSolid}`,
                boxShadow: riskPct === preset.value
                  ? '0 1px 3px rgba(59,130,246,0.15)'
                  : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{
                  fontSize: FONT_SCALE.xs,
                  fontWeight: riskPct === preset.value ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                  color: riskPct === preset.value ? c.chipActiveText : c.text2,
                }}>
                  {preset.value}%
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: preset.color }}
                />
              </div>
              <span style={{
                fontSize: FONT_SCALE.micro,
                color: riskPct === preset.value ? c.chipActiveText : c.text3,
              }}>
                {preset.label.split(' ')[1].replace(/[()]/g, '')}
              </span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 6 }}>
          Khuyến nghị: Không nên rủi ro quá 2-3% mỗi lệnh
        </p>
      </div>

      {/* Entry Price */}
      <div>
        <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
          Giá vào lệnh
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={entryPrice}
            onChange={e => setEntryPrice(formatNum(e.target.value))}
            placeholder="0.00"
            className="w-full px-3 py-3 rounded-xl min-h-11"
            style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: c.text1,
              background: c.surface2,
              border: `1.5px solid ${c.borderSolid}`,
              fontFamily: 'monospace',
            }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}
          >
            USDT
          </span>
        </div>
        {entryPriceNum > 0 && entryPriceNum !== currentPrice && (
          <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 4 }}>
            Current: {fmtPrice(currentPrice)} ({fmtPct(Math.abs((entryPriceNum - currentPrice) / currentPrice * 100))} {entryPriceNum > currentPrice ? 'cao hơn' : 'thấp hơn'})
          </p>
        )}
      </div>

      {/* Stop Loss Price */}
      <div>
        <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
          Giá Stop Loss
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={stopLossPrice}
            onChange={e => setStopLossPrice(formatNum(e.target.value))}
            placeholder="0.00"
            className="w-full px-3 py-3 rounded-xl min-h-11"
            style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: c.text1,
              background: c.surface2,
              border: `1.5px solid ${isValidStopLoss ? '#EF4444' : c.borderSolid}`,
              fontFamily: 'monospace',
            }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}
          >
            USDT
          </span>
        </div>
        {stopLossPriceNum > 0 && entryPriceNum > 0 && (
          <p style={{ fontSize: FONT_SCALE.micro, color: isValidStopLoss ? '#EF4444' : '#F59E0B', marginTop: 4 }}>
            {isValidStopLoss
              ? `✓ ${fmtPct(Math.abs((stopLossPriceNum - entryPriceNum) / entryPriceNum * 100))} từ entry`
              : '✗ Stop loss phải khác entry price'
            }
          </p>
        )}
      </div>

      {/* Calculation Result */}
      {result && (
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} color="#3B82F6" />
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              Kết quả tính toán
            </span>
          </div>

          {/* Suggested Amount - HIGHLIGHT */}
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)` }}>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 6 }}>
              Khối lượng đề xuất
            </p>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, color: '#3B82F6', fontFamily: 'monospace' }}>
                {fmtAmount(result.suggestedAmount)}
              </span>
              <span style={{ fontSize: FONT_SCALE.sm, color: c.text2 }}>
                {baseAsset}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
                Tổng chi phí
              </p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtUsd(result.totalCost)}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
                Rủi ro tối đa
              </p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#EF4444', fontFamily: 'monospace' }}>
                {fmtUsd(result.riskAmount)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                Nếu stop loss chạm:
              </span>
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#EF4444' }}>
                -{fmtUsd(result.riskAmount)} ({fmtPct(result.riskPct)})
              </span>
            </div>
          </div>
        </TrCard>
      )}

      {/* Warnings */}
      {result && !hasEnoughBalance && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-1" />
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
            Không đủ số dư! Cần {fmtUsd(result.totalCost)} nhưng chỉ có {fmtUsd(accountBalance)}.
          </p>
        </div>
      )}

      {result && result.stopLossPct > 15 && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
          <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
            Stop loss xa entry ({fmtPct(result.stopLossPct)}). Nên đặt gần hơn để tối ưu R:R ratio.
          </p>
        </div>
      )}

      {/* Apply Button */}
      {onApply && (
        <button
          onClick={handleApply}
          disabled={!canApply}
          className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
          style={{
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: canApply
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              : c.surface2,
            boxShadow: canApply ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
            opacity: canApply ? 1 : 0.5,
          }}
        >
          <TrendingUp size={16} />
          Áp dụng khối lượng
        </button>
      )}
    </div>
  );
}
