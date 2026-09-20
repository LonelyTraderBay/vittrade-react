/**
 * ══════════════════════════════════════════════════════════════════
 *  OCO ORDER FORM — Phase 1: Risk Management Foundation
 * ══════════════════════════════════════════════════════════════════
 *  One-Cancels-Other (OCO) Order Type
 *  - Place Take Profit + Stop Loss simultaneously
 *  - When one executes, the other cancels automatically
 *  - Professional risk management tool (Binance/Coinbase Pro standard)
 */

import React, { useState } from 'react';
import { AlertTriangle, Info, TrendingUp, TrendingDown, Check, X } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface OCOOrderParams {
  side: 'buy' | 'sell';
  symbol: string;
  baseAsset: string;
  currentPrice: number;
  
  // Take Profit Leg
  takeProfitPrice: string;
  takeProfitAmount: string;
  
  // Stop Loss Leg
  stopLossPrice: string;
  stopLossAmount: string;
  
  // Shared settings
  amountType: 'same' | 'split'; // Both legs same amount or different
}

interface OCOOrderFormProps {
  side: 'buy' | 'sell';
  symbol: string;
  baseAsset: string;
  currentPrice: number;
  available: number;
  
  onSubmit: (params: OCOOrderParams) => void;
  onCancel: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   OCO ORDER FORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function OCOOrderForm({
  side,
  symbol,
  baseAsset,
  currentPrice,
  available,
  onSubmit,
  onCancel,
}: OCOOrderFormProps) {
  const c = useThemeColors();
  const { hapticSuccess, hapticWarning, hapticSelection } = useHaptic();

  const [amountType, setAmountType] = useState<'same' | 'split'>('same');
  
  // Take Profit (TP)
  const [tpPrice, setTpPrice] = useState('');
  const [tpAmount, setTpAmount] = useState('');
  
  // Stop Loss (SL)
  const [slPrice, setSlPrice] = useState('');
  const [slAmount, setSlAmount] = useState('');
  
  const [showInfo, setShowInfo] = useState(false);

  /* ─── Calculations ─── */
  const tpPriceNum = parseFloat(tpPrice || '0');
  const slPriceNum = parseFloat(slPrice || '0');
  const tpAmountNum = parseFloat(tpAmount || '0');
  const slAmountNum = amountType === 'same' ? tpAmountNum : parseFloat(slAmount || '0');

  const tpTotal = tpPriceNum * tpAmountNum;
  const slTotal = slPriceNum * slAmountNum;

  // Calculate profit/loss %
  const tpPctChange = ((tpPriceNum - currentPrice) / currentPrice) * 100;
  const slPctChange = ((slPriceNum - currentPrice) / currentPrice) * 100;

  // Risk/Reward ratio
  const riskAmount = Math.abs(slTotal - (currentPrice * slAmountNum));
  const rewardAmount = Math.abs(tpTotal - (currentPrice * tpAmountNum));
  const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  /* ─── Validation ─── */
  const isValidTP = tpPriceNum > 0 && tpAmountNum > 0 && (
    side === 'buy' ? tpPriceNum > currentPrice : tpPriceNum < currentPrice
  );
  
  const isValidSL = slPriceNum > 0 && slAmountNum > 0 && (
    side === 'buy' ? slPriceNum < currentPrice : slPriceNum > currentPrice
  );

  const canSubmit = isValidTP && isValidSL;

  /* ─── Handlers ─── */
  const handleSubmit = () => {
    if (!canSubmit) {
      hapticWarning();
      return;
    }

    hapticSuccess();
    onSubmit({
      side,
      symbol,
      baseAsset,
      currentPrice,
      takeProfitPrice: tpPrice,
      takeProfitAmount: tpAmount,
      stopLossPrice: slPrice,
      stopLossAmount: amountType === 'same' ? tpAmount : slAmount,
      amountType,
    });
  };

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  return (
    <div className="flex flex-col gap-4">
      {/* Header Info */}
      <TrCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 4 }}>
              Lệnh OCO • {side === 'buy' ? 'Mua' : 'Bán'}
            </p>
            <p style={{ fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {symbol}
            </p>
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
              <strong style={{ color: '#3B82F6' }}>Lệnh OCO (One-Cancels-Other)</strong> cho phép đặt 2 lệnh cùng lúc:
              Take Profit (chốt lời) và Stop Loss (cắt lỗ). Khi 1 lệnh khớp, lệnh còn lại tự động hủy.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Giá hiện tại</span>
          <span style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
            {fmtPrice(currentPrice)}
          </span>
        </div>
      </TrCard>

      {/* Amount Type Toggle */}
      <div className="flex gap-2">
        {['same', 'split'].map(type => (
          <button
            key={type}
            onClick={() => { setAmountType(type as any); hapticSelection(); }}
            className="flex-1 px-3 py-2 rounded-xl min-h-10 flex items-center justify-center gap-2"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: amountType === type ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
              background: amountType === type ? c.chipActiveBg : c.surface2,
              color: amountType === type ? c.chipActiveText : c.text2,
              border: amountType === type
                ? `2px solid ${c.chipActiveBorder}`
                : `1.5px solid ${c.borderSolid}`,
              boxShadow: amountType === type
                ? '0 1px 3px rgba(59,130,246,0.15)'
                : 'none',
            }}
          >
            {type === 'same' ? 'Cùng khối lượng' : 'Khối lượng riêng'}
            {amountType === type && <Check size={14} />}
          </button>
        ))}
      </div>

      {/* Take Profit Section */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.3)">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} color="#10B981" />
          <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Take Profit (Chốt lời)
          </span>
        </div>

        {/* TP Price */}
        <div className="mb-3">
          <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
            Giá chốt lời
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={tpPrice}
              onChange={e => setTpPrice(formatNum(e.target.value))}
              placeholder={side === 'buy' ? '> Giá hiện tại' : '< Giá hiện tại'}
              className="w-full px-3 py-3 rounded-xl min-h-11"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: c.text1,
                background: c.surface2,
                border: `1.5px solid ${isValidTP ? '#10B981' : c.borderSolid}`,
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
          {tpPriceNum > 0 && (
            <p style={{ fontSize: FONT_SCALE.micro, color: isValidTP ? '#10B981' : '#EF4444', marginTop: 4 }}>
              {isValidTP ? '✓' : '✗'} {fmtPct(Math.abs(tpPctChange))} {tpPctChange >= 0 ? 'lời' : 'lỗ'}
            </p>
          )}
        </div>

        {/* TP Amount */}
        <div>
          <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
            Khối lượng
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={tpAmount}
              onChange={e => setTpAmount(formatNum(e.target.value))}
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
              {baseAsset}
            </span>
          </div>
          {tpTotal > 0 && (
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 4 }}>
              Thành tiền: {fmtUsd(tpTotal)}
            </p>
          )}
        </div>
      </TrCard>

      {/* Stop Loss Section */}
      <TrCard className="p-4" accentBorder="rgba(239,68,68,0.3)">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={16} color="#EF4444" />
          <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Stop Loss (Cắt lỗ)
          </span>
        </div>

        {/* SL Price */}
        <div className="mb-3">
          <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
            Giá cắt lỗ
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={slPrice}
              onChange={e => setSlPrice(formatNum(e.target.value))}
              placeholder={side === 'buy' ? '< Giá hiện tại' : '> Giá hiện tại'}
              className="w-full px-3 py-3 rounded-xl min-h-11"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: c.text1,
                background: c.surface2,
                border: `1.5px solid ${isValidSL ? '#EF4444' : c.borderSolid}`,
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
          {slPriceNum > 0 && (
            <p style={{ fontSize: FONT_SCALE.micro, color: isValidSL ? '#EF4444' : '#F59E0B', marginTop: 4 }}>
              {isValidSL ? '✓' : '✗'} {fmtPct(Math.abs(slPctChange))} {slPctChange >= 0 ? 'lời' : 'lỗ'}
            </p>
          )}
        </div>

        {/* SL Amount (only if split mode) */}
        {amountType === 'split' && (
          <div>
            <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
              Khối lượng
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={slAmount}
                onChange={e => setSlAmount(formatNum(e.target.value))}
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
                {baseAsset}
              </span>
            </div>
            {slTotal > 0 && (
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 4 }}>
                Thành tiền: {fmtUsd(slTotal)}
              </p>
            )}
          </div>
        )}
      </TrCard>

      {/* Risk/Reward Summary */}
      {canSubmit && (
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 8 }}>
            Risk/Reward Ratio
          </p>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, color: rrRatio >= 2 ? '#10B981' : rrRatio >= 1 ? '#F59E0B' : '#EF4444' }}>
              1:{rrRatio.toFixed(2)}
            </span>
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              {rrRatio >= 2 ? '✓ Tỉ lệ tốt' : rrRatio >= 1 ? '⚠ Tỉ lệ chấp nhận được' : '✗ Tỉ lệ thấp'}
            </span>
          </div>
          <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Tiềm năng lời</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#10B981' }}>
                +{fmtUsd(rewardAmount)}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Rủi ro tối đa</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#EF4444' }}>
                -{fmtUsd(riskAmount)}
              </p>
            </div>
          </div>
        </TrCard>
      )}

      {/* Warning */}
      {canSubmit && rrRatio < 1.5 && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
          <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
            Tỉ lệ Risk/Reward thấp hơn khuyến nghị (1:1.5). Nên điều chỉnh Take Profit cao hơn hoặc Stop Loss gần hơn.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
          style={{
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            color: c.text2,
            background: c.surface2,
            border: `1.5px solid ${c.borderSolid}`,
          }}
        >
          <X size={16} />
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
          style={{
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: canSubmit
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              : c.surface2,
            boxShadow: canSubmit ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          <Check size={16} />
          Đặt lệnh OCO
        </button>
      </div>
    </div>
  );
}
