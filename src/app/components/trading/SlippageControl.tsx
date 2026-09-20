/**
 * ══════════════════════════════════════════════════════════════════
 *  SLIPPAGE CONTROL — Phase 2: Execution Quality
 * ══════════════════════════════════════════════════════════════════
 *  Slippage Tolerance Settings for Market Orders
 *  - Preset tolerance levels (0.1%, 0.5%, 1%, 2%)
 *  - Custom tolerance input
 *  - Max acceptable price calculation
 *  - Auto-reject if slippage exceeded
 *  - Price impact estimation
 */

import React, { useState } from 'react';
import { Shield, AlertTriangle, Info, TrendingUp, Zap } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface SlippageSettings {
  tolerancePct: number;
  customTolerance?: number;
  rejectOnExceed: boolean;
  partialFillAllowed: boolean;
}

interface SlippageControlProps {
  // Market order details
  side: 'buy' | 'sell';
  symbol: string;
  expectedPrice: number;
  orderSize: number; // In base asset (e.g., BTC amount)
  
  // Liquidity data (optional - for price impact estimation)
  availableLiquidity?: number;
  
  // Current settings
  settings: SlippageSettings;
  onChange: (settings: SlippageSettings) => void;
  
  // UI mode
  mode?: 'inline' | 'sheet'; // inline = compact, sheet = full details
}

const SLIPPAGE_PRESETS = [
  { value: 0.1, label: '0.1%', level: 'tight', color: '#10B981', risk: 'Low risk' },
  { value: 0.5, label: '0.5%', level: 'normal', color: '#3B82F6', risk: 'Normal' },
  { value: 1.0, label: '1%', level: 'medium', color: '#F59E0B', risk: 'Medium' },
  { value: 2.0, label: '2%', level: 'high', color: '#EF4444', risk: 'High risk' },
];

/* ═══════════════════════════════════════════════════════════════
   SLIPPAGE CONTROL COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function SlippageControl({
  side,
  symbol,
  expectedPrice,
  orderSize,
  availableLiquidity,
  settings,
  onChange,
  mode = 'sheet',
}: SlippageControlProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Calculate max acceptable price
  const maxAcceptablePrice = side === 'buy'
    ? expectedPrice * (1 + settings.tolerancePct / 100)
    : expectedPrice * (1 - settings.tolerancePct / 100);

  // Estimate price impact (if liquidity data available)
  const estimatedImpact = availableLiquidity
    ? ((orderSize / availableLiquidity) * 100)
    : null;

  const isPriceImpactHigh = estimatedImpact !== null && estimatedImpact > settings.tolerancePct;

  // Handle preset selection
  const handlePresetSelect = (pct: number) => {
    hapticSelection();
    onChange({
      ...settings,
      tolerancePct: pct,
      customTolerance: undefined,
    });
    setShowCustom(false);
  };

  // Handle custom tolerance
  const handleCustomApply = () => {
    const custom = parseFloat(customInput);
    if (custom > 0 && custom <= 10) {
      hapticSelection();
      onChange({
        ...settings,
        tolerancePct: custom,
        customTolerance: custom,
      });
      setShowCustom(false);
    }
  };

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  // Compact inline mode
  if (mode === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <span style={{ fontSize: FONT_SCALE.xs, color: c.text3, whiteSpace: 'nowrap' }}>
          Slippage:
        </span>
        <div className="flex gap-1">
          {SLIPPAGE_PRESETS.slice(0, 3).map(preset => (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className="px-2 py-1 rounded-lg min-h-9"
              style={{
                fontSize: FONT_SCALE.xs,
                fontWeight: settings.tolerancePct === preset.value ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                background: settings.tolerancePct === preset.value ? c.chipActiveBg : c.surface2,
                color: settings.tolerancePct === preset.value ? c.chipActiveText : c.text2,
                border: settings.tolerancePct === preset.value
                  ? `2px solid ${c.chipActiveBorder}`
                  : `1px solid ${c.borderSolid}`,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full sheet mode
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <TrCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={20} color="#3B82F6" />
            <div>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                Slippage Protection
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                {symbol} • Market {side === 'buy' ? 'Buy' : 'Sell'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)` }}>
          <p style={{ fontSize: FONT_SCALE.xs, color: c.text2, lineHeight: 1.6 }}>
            <strong style={{ color: '#3B82F6' }}>Slippage tolerance</strong> bảo vệ bạn khỏi việc
            mua/bán ở giá xấu khi thị trường biến động mạnh. Nếu giá thực tế vượt quá ngưỡng cho phép,
            lệnh sẽ tự động bị từ chối.
          </p>
        </div>
      </TrCard>

      {/* Expected vs Max Price */}
      <TrCard className="p-4">
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
          Price Range
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Expected Price
            </p>
            <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtPrice(expectedPrice)}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Max Accept Price
            </p>
            <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: side === 'buy' ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
              {fmtPrice(maxAcceptablePrice)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Max slippage:
            </span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {fmtUsd(Math.abs(maxAcceptablePrice - expectedPrice) * orderSize)}
            </span>
          </div>
        </div>
      </TrCard>

      {/* Tolerance Presets */}
      <div>
        <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
          Slippage Tolerance
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SLIPPAGE_PRESETS.map(preset => {
            const isActive = settings.tolerancePct === preset.value && !settings.customTolerance;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className="px-3 py-3 rounded-xl min-h-11 text-left"
                style={{
                  background: isActive ? c.chipActiveBg : c.surface2,
                  border: isActive
                    ? `2px solid ${c.chipActiveBorder}`
                    : `1.5px solid ${c.borderSolid}`,
                  boxShadow: isActive
                    ? '0 1px 3px rgba(59,130,246,0.15)'
                    : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{
                    fontSize: FONT_SCALE.sm,
                    fontWeight: isActive ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                    color: isActive ? c.chipActiveText : c.text1,
                  }}>
                    {preset.label}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: preset.color }}
                  />
                </div>
                <span style={{
                  fontSize: FONT_SCALE.micro,
                  color: isActive ? c.chipActiveText : c.text3,
                }}>
                  {preset.risk}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Tolerance */}
        {!showCustom && (
          <button
            onClick={() => { setShowCustom(true); hapticSelection(); }}
            className="w-full mt-2 px-3 py-2 rounded-xl min-h-10"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              color: settings.customTolerance ? c.chipActiveText : c.text2,
              background: settings.customTolerance ? c.chipActiveBg : c.surface2,
              border: settings.customTolerance
                ? `2px solid ${c.chipActiveBorder}`
                : `1.5px solid ${c.borderSolid}`,
            }}
          >
            {settings.customTolerance
              ? `Custom: ${settings.customTolerance}%`
              : '+ Custom Tolerance'
            }
          </button>
        )}

        {showCustom && (
          <div className="mt-2 flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="decimal"
                value={customInput}
                onChange={e => setCustomInput(formatNum(e.target.value))}
                placeholder="0.5"
                className="w-full px-3 py-2 rounded-xl min-h-10"
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
                %
              </span>
            </div>
            <button
              onClick={handleCustomApply}
              className="px-4 py-2 rounded-xl min-h-10"
              style={{
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Price Impact Warning */}
      {estimatedImpact !== null && (
        <TrCard className="p-4" accentBorder={isPriceImpactHigh ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}>
          <div className="flex items-start gap-3">
            <Zap size={16} color={isPriceImpactHigh ? '#EF4444' : '#F59E0B'} className="shrink-0 mt-1" />
            <div className="flex-1">
              <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 4 }}>
                Estimated Price Impact: {fmtPct(estimatedImpact)}
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                {isPriceImpactHigh
                  ? `⚠️ Lệnh lớn có thể bị slippage cao hơn ${fmtPct(settings.tolerancePct)}. Cân nhắc tăng tolerance hoặc chia nhỏ lệnh.`
                  : `Order size hợp lý so với liquidity hiện có. Slippage dự kiến nằm trong giới hạn.`
                }
              </p>
            </div>
          </div>
        </TrCard>
      )}

      {/* Advanced Options */}
      <TrCard className="p-4">
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
          Advanced Options
        </p>

        {/* Reject on Exceed */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
              Auto-reject if exceeded
            </p>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, lineHeight: 1.4 }}>
              Hủy lệnh nếu giá thực tế vượt quá max accept price
            </p>
          </div>
          <button
            onClick={() => {
              hapticSelection();
              onChange({ ...settings, rejectOnExceed: !settings.rejectOnExceed });
            }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{
              background: settings.rejectOnExceed
                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                : c.surface2,
            }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
              style={{
                left: settings.rejectOnExceed ? 'calc(100% - 22px)' : '2px',
              }}
            />
          </button>
        </div>

        {/* Partial Fill */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
              Allow partial fills
            </p>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, lineHeight: 1.4 }}>
              Chấp nhận khớp một phần nếu không đủ liquidity
            </p>
          </div>
          <button
            onClick={() => {
              hapticSelection();
              onChange({ ...settings, partialFillAllowed: !settings.partialFillAllowed });
            }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{
              background: settings.partialFillAllowed
                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                : c.surface2,
            }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
              style={{
                left: settings.partialFillAllowed ? 'calc(100% - 22px)' : '2px',
              }}
            />
          </button>
        </div>
      </TrCard>

      {/* Info Footer */}
      <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }}>
        <Info size={14} color={c.text3} className="shrink-0 mt-1" />
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
          <strong>Best practice:</strong> Dùng 0.5% cho BTC/ETH, 1-2% cho altcoins có liquidity thấp hơn.
          Giờ cao điểm (US market open) thường có slippage thấp hơn.
        </p>
      </div>
    </div>
  );
}
