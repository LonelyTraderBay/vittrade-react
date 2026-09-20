/**
 * ══════════════════════════════════════════════════════════════════
 *  SLIPPAGE PROTECTION — Phase 2: Execution Quality
 * ══════════════════════════════════════════════════════════════════
 *  Prevent bad market order fills by setting max acceptable slippage
 *  - Tolerance % slider (0.1% - 5%)
 *  - Price impact estimation
 *  - Auto-reject if slippage exceeded
 *  - Partial fill options
 */

import React, { useState } from 'react';
import { Shield, AlertTriangle, Info, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface SlippageSettings {
  enabled: boolean;
  maxSlippagePct: number;
  allowPartialFill: boolean;
  rejectOnExceed: boolean;
}

interface SlippageProtectionProps {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  expectedPrice: number;
  currentPrice: number;
  
  // Liquidity data (for impact estimation)
  orderBookDepth?: {
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  };
  
  // Current settings
  settings: SlippageSettings;
  onSettingsChange: (settings: SlippageSettings) => void;
  
  // Callbacks
  onApply?: () => void;
}

const SLIPPAGE_PRESETS = [
  { value: 0.1, label: '0.1%', level: 'Strict', color: '#10B981' },
  { value: 0.5, label: '0.5%', level: 'Normal', color: '#3B82F6' },
  { value: 1.0, label: '1%', level: 'Moderate', color: '#F59E0B' },
  { value: 2.0, label: '2%', level: 'High', color: '#EF4444' },
];

/* ═══════════════════════════════════════════════════════════════
   SLIPPAGE IMPACT CALCULATOR
   ═══════════════════════════════════════════════════════════════ */

function estimatePriceImpact(
  side: 'buy' | 'sell',
  amount: number,
  orderBook?: { bids: Array<{ price: number; quantity: number }>; asks: Array<{ price: number; quantity: number }> }
): { avgPrice: number; impactPct: number; worstPrice: number } {
  if (!orderBook) {
    // Fallback: assume 0.2% impact for every 10 units
    const estimatedImpact = (amount / 10) * 0.2;
    return {
      avgPrice: 0,
      impactPct: Math.min(estimatedImpact, 5),
      worstPrice: 0,
    };
  }

  const levels = side === 'buy' ? orderBook.asks : orderBook.bids;
  let remaining = amount;
  let totalCost = 0;
  let worstPrice = levels[0]?.price || 0;

  for (const level of levels) {
    if (remaining <= 0) break;
    
    const fillQty = Math.min(remaining, level.quantity);
    totalCost += fillQty * level.price;
    remaining -= fillQty;
    worstPrice = level.price;
  }

  const avgPrice = amount > 0 ? totalCost / amount : 0;
  const bestPrice = levels[0]?.price || 0;
  const impactPct = Math.abs((avgPrice - bestPrice) / bestPrice) * 100;

  return { avgPrice, impactPct, worstPrice };
}

/* ═══════════════════════════════════════════════════════════════
   SLIPPAGE PROTECTION COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function SlippageProtection({
  symbol,
  side,
  amount,
  expectedPrice,
  currentPrice,
  orderBookDepth,
  settings,
  onSettingsChange,
  onApply,
}: SlippageProtectionProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticWarning } = useHaptic();
  const [showInfo, setShowInfo] = useState(false);

  // Estimate price impact
  const impact = estimatePriceImpact(side, amount, orderBookDepth);
  
  // Calculate max acceptable price
  const maxAcceptablePrice = side === 'buy'
    ? expectedPrice * (1 + settings.maxSlippagePct / 100)
    : expectedPrice * (1 - settings.maxSlippagePct / 100);

  // Check if current impact exceeds tolerance
  const impactExceedsTolerance = impact.impactPct > settings.maxSlippagePct;
  const wouldReject = settings.enabled && settings.rejectOnExceed && impactExceedsTolerance;

  const handleToggle = () => {
    onSettingsChange({ ...settings, enabled: !settings.enabled });
    hapticSelection();
  };

  const handleSlippageChange = (value: number) => {
    onSettingsChange({ ...settings, maxSlippagePct: value });
    hapticSelection();
  };

  const handlePartialFillToggle = () => {
    onSettingsChange({ ...settings, allowPartialFill: !settings.allowPartialFill });
    hapticSelection();
  };

  const handleRejectToggle = () => {
    onSettingsChange({ ...settings, rejectOnExceed: !settings.rejectOnExceed });
    hapticSelection();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <TrCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={20} color={settings.enabled ? '#3B82F6' : c.text3} />
            <div>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                Slippage Protection
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                {symbol} • {side === 'buy' ? 'Mua' : 'Bán'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowInfo(!showInfo); hapticSelection(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: c.surface2 }}
            >
              <Info size={16} color={c.text2} />
            </button>
            <button
              onClick={handleToggle}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{
                background: settings.enabled ? '#3B82F6' : c.surface2,
                border: `1.5px solid ${settings.enabled ? '#3B82F6' : c.borderSolid}`,
              }}
            >
              <div
                className="absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  top: 2,
                  left: settings.enabled ? 22 : 2,
                }}
              />
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)` }}>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text2, lineHeight: 1.6 }}>
              <strong style={{ color: '#3B82F6' }}>Slippage Protection</strong> ngăn lệnh Market
              thực thi với giá quá tệ. Nếu slippage vượt ngưỡng, lệnh sẽ bị reject tự động.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Trạng thái</span>
          <span
            className="px-2 py-1 rounded"
            style={{
              fontSize: FONT_SCALE.micro,
              fontWeight: FONT_WEIGHT.bold,
              color: settings.enabled ? '#10B981' : c.text3,
              background: settings.enabled ? 'rgba(16,185,129,0.12)' : c.surface2,
            }}
          >
            {settings.enabled ? '✓ Enabled' : 'Disabled'}
          </span>
        </div>
      </TrCard>

      {/* Slippage Tolerance Selector */}
      {settings.enabled && (
        <>
          <div>
            <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
              Max Slippage Tolerance
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLIPPAGE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handleSlippageChange(preset.value)}
                  className="px-3 py-3 rounded-xl min-h-11 text-left"
                  style={{
                    background: settings.maxSlippagePct === preset.value ? c.chipActiveBg : c.surface2,
                    border: settings.maxSlippagePct === preset.value
                      ? `2px solid ${c.chipActiveBorder}`
                      : `1.5px solid ${c.borderSolid}`,
                    boxShadow: settings.maxSlippagePct === preset.value
                      ? '0 1px 3px rgba(59,130,246,0.15)'
                      : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{
                      fontSize: FONT_SCALE.xs,
                      fontWeight: settings.maxSlippagePct === preset.value ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                      color: settings.maxSlippagePct === preset.value ? c.chipActiveText : c.text2,
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
                    color: settings.maxSlippagePct === preset.value ? c.chipActiveText : c.text3,
                  }}>
                    {preset.level}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Impact Estimation */}
          <TrCard className="p-4" accentBorder={impactExceedsTolerance ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)'}>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              Estimated Price Impact
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
                  Expected Price
                </p>
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                  {fmtPrice(expectedPrice)}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
                  Max Accept
                </p>
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                  {fmtPrice(maxAcceptablePrice)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{
              background: impactExceedsTolerance ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
              border: `1px solid ${impactExceedsTolerance ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
                  Estimated Slippage
                </span>
                <span style={{
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  color: impactExceedsTolerance ? '#EF4444' : '#3B82F6',
                }}>
                  {fmtPct(impact.impactPct)}
                </span>
              </div>
              {impactExceedsTolerance && (
                <p style={{ fontSize: FONT_SCALE.micro, color: '#EF4444', lineHeight: 1.4 }}>
                  ⚠️ Vượt ngưỡng {fmtPct(settings.maxSlippagePct)}
                </p>
              )}
            </div>
          </TrCard>

          {/* Options */}
          <TrCard className="p-4">
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 12 }}>
              Advanced Options
            </p>

            <div className="flex flex-col gap-3">
              {/* Reject on exceed */}
              <button
                onClick={handleRejectToggle}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: settings.rejectOnExceed ? 'rgba(59,130,246,0.08)' : c.surface2,
                  border: `1px solid ${settings.rejectOnExceed ? 'rgba(59,130,246,0.2)' : c.borderSolid}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: settings.rejectOnExceed ? '#3B82F6' : c.surface2,
                      border: `1.5px solid ${settings.rejectOnExceed ? '#3B82F6' : c.borderSolid}`,
                    }}
                  >
                    {settings.rejectOnExceed && <Check size={12} color="#fff" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
                      Reject if worse than limit
                    </p>
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, lineHeight: 1.4 }}>
                      Tự động hủy lệnh nếu slippage vượt ngưỡng
                    </p>
                  </div>
                </div>
              </button>

              {/* Partial fill */}
              <button
                onClick={handlePartialFillToggle}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: settings.allowPartialFill ? 'rgba(59,130,246,0.08)' : c.surface2,
                  border: `1px solid ${settings.allowPartialFill ? 'rgba(59,130,246,0.2)' : c.borderSolid}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: settings.allowPartialFill ? '#3B82F6' : c.surface2,
                      border: `1.5px solid ${settings.allowPartialFill ? '#3B82F6' : c.borderSolid}`,
                    }}
                  >
                    {settings.allowPartialFill && <Check size={12} color="#fff" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
                      Allow partial fill
                    </p>
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, lineHeight: 1.4 }}>
                      Chấp nhận khớp một phần nếu không đủ thanh khoản
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </TrCard>

          {/* Warning if would reject */}
          {wouldReject && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-1" />
              <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                <strong>Lệnh sẽ bị reject!</strong> Estimated slippage ({fmtPct(impact.impactPct)}) 
                vượt ngưỡng ({fmtPct(settings.maxSlippagePct)}). Tăng tolerance hoặc giảm khối lượng.
              </p>
            </div>
          )}

          {/* Apply Button */}
          {onApply && (
            <button
              onClick={() => {
                hapticSuccess();
                onApply();
              }}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              <Check size={16} />
              Apply Settings
            </button>
          )}
        </>
      )}
    </div>
  );
}
