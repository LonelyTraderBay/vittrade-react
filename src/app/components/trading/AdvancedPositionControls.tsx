/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED POSITION CONTROLS — P1 Features
 * ══════════════════════════════════════════════════════════════════
 *  Enterprise-level position management:
 *  - Partial Close Position (25%/50%/75%/100%)
 *  - Ladder TP/SL (multiple levels)
 *  - Trailing Stop Loss
 *  - Position Mode Toggle (One-way vs Hedge)
 *  - Add/Reduce Margin
 *  - Realized vs Unrealized PnL
 */

import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Target, Shield, Sliders, Plus, Minus,
  Trash2, Settings, Info, AlertTriangle, CheckCircle, X, ChevronRight,
} from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. PARTIAL CLOSE POSITION
   ═══════════════════════════════════════════════════════════════ */

interface PartialCloseProps {
  positionId: string;
  pair: string;
  side: 'long' | 'short';
  currentSize: number;
  currentPnl: number;
  markPrice: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => void;
}

export function PartialCloseSheet({
  positionId,
  pair,
  side,
  currentSize,
  currentPnl,
  markPrice,
  open,
  onClose,
  onConfirm,
}: PartialCloseProps) {
  const c = useThemeColors();
  const [selectedPct, setSelectedPct] = useState(50);
  const [customPct, setCustomPct] = useState('');

  const closeSize = (currentSize * selectedPct) / 100;
  const realizePnl = (currentPnl * selectedPct) / 100;
  const remainSize = currentSize - closeSize;
  const remainPnl = currentPnl - realizePnl;

  const presets = [25, 50, 75, 100];

  const handleConfirm = () => {
    onConfirm(selectedPct);
    onClose();
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Đóng một phần vị thế"
      subtitle={`${pair} · ${side === 'long' ? 'Long' : 'Short'}`}
    >
      <div className="flex flex-col gap-4">
        {/* Current position summary */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Vị thế hiện tại</span>
            <span
              className="px-2 py-0.5 rounded-lg"
              style={{
                background: side === 'long' ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft),
                color: side === 'long' ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {side === 'long' ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Size</span>
            <span style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {currentSize.toFixed(4)} {pair.split('/')[0]}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>PnL chưa chốt</span>
            <span
              style={{
                color: currentPnl >= 0 ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.base,
                fontWeight: FONT_WEIGHT.bold,
                fontFamily: 'monospace',
              }}
            >
              {currentPnl >= 0 ? '+' : ''}${currentPnl.toFixed(2)}
            </span>
          </div>
        </TrCard>

        {/* Percentage presets */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Chọn % đóng
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map(pct => (
              <button
                key={pct}
                onClick={() => setSelectedPct(pct)}
                className="py-3 rounded-xl transition-all"
                style={{
                  background: selectedPct === pct
                    ? `linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)`
                    : c.surface2,
                  color: selectedPct === pct ? '#fff' : c.text2,
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                  border: `1px solid ${selectedPct === pct ? 'transparent' : c.borderSolid}`,
                  boxShadow: selectedPct === pct ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom percentage slider */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Hoặc chọn tùy chỉnh
          </label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={selectedPct}
            onChange={e => setSelectedPct(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: '#3B82F6' }}
          />
          <div className="flex justify-between mt-1">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>1%</span>
            <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {selectedPct}%
            </span>
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>100%</span>
          </div>
        </div>

        {/* Preview */}
        <TrCard
          className="p-4"
          style={{
            background: withAlpha('#3B82F6', ALPHA.hover),
            border: `1.5px solid ${withAlpha('#3B82F6', ALPHA.soft)}`,
          }}
        >
          <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
            Ước tính sau khi đóng {selectedPct}%
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Size sẽ đóng</span>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                {closeSize.toFixed(4)} {pair.split('/')[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>PnL sẽ chốt</span>
              <span
                style={{
                  color: realizePnl >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                {realizePnl >= 0 ? '+' : ''}${realizePnl.toFixed(2)}
              </span>
            </div>
            <div
              className="pt-2 mt-2"
              style={{ borderTop: `1px solid ${c.divider}` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Size còn lại</span>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>
                  {remainSize.toFixed(4)} {pair.split('/')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>PnL chưa chốt</span>
                <span
                  style={{
                    color: remainPnl >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.xs,
                    fontFamily: 'monospace',
                  }}
                >
                  {remainPnl >= 0 ? '+' : ''}${remainPnl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </TrCard>

        {/* Confirm */}
        <div className="flex gap-2">
          <CTAButton onClick={onClose} variant="secondary" className="flex-1">
            Hủy
          </CTAButton>
          <CTAButton onClick={handleConfirm} variant="primary" className="flex-1">
            Đóng {selectedPct}%
          </CTAButton>
        </div>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. LADDER TP/SL (MULTIPLE LEVELS)
   ═══════════════════════════════════════════════════════════════ */

interface TPLevel {
  id: string;
  price: number;
  percentage: number; // % of position to close
}

interface SLLevel {
  id: string;
  price: number;
  percentage: number;
}

interface LadderTPSLProps {
  positionId: string;
  pair: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  currentSize: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (tpLevels: TPLevel[], slLevels: SLLevel[]) => void;
}

export function LadderTPSLSheet({
  positionId,
  pair,
  side,
  entryPrice,
  currentPrice,
  currentSize,
  open,
  onClose,
  onConfirm,
}: LadderTPSLProps) {
  const c = useThemeColors();
  const [tab, setTab] = useState<'tp' | 'sl'>('tp');
  const [tpLevels, setTpLevels] = useState<TPLevel[]>([
    { id: 'tp1', price: entryPrice * (side === 'long' ? 1.05 : 0.95), percentage: 50 },
  ]);
  const [slLevels, setSlLevels] = useState<SLLevel[]>([
    { id: 'sl1', price: entryPrice * (side === 'long' ? 0.95 : 1.05), percentage: 100 },
  ]);

  const addTPLevel = () => {
    const lastTP = tpLevels[tpLevels.length - 1];
    const newPrice = side === 'long'
      ? lastTP.price * 1.03
      : lastTP.price * 0.97;
    setTpLevels([
      ...tpLevels,
      { id: `tp${tpLevels.length + 1}`, price: newPrice, percentage: 25 },
    ]);
  };

  const addSLLevel = () => {
    setSlLevels([
      ...slLevels,
      { id: `sl${slLevels.length + 1}`, price: entryPrice * (side === 'long' ? 0.90 : 1.10), percentage: 50 },
    ]);
  };

  const removeTPLevel = (id: string) => {
    setTpLevels(tpLevels.filter(tp => tp.id !== id));
  };

  const removeSLLevel = (id: string) => {
    setSlLevels(slLevels.filter(sl => sl.id !== id));
  };

  const updateTPPrice = (id: string, price: number) => {
    setTpLevels(tpLevels.map(tp => tp.id === id ? { ...tp, price } : tp));
  };

  const updateTPPercentage = (id: string, percentage: number) => {
    setTpLevels(tpLevels.map(tp => tp.id === id ? { ...tp, percentage } : tp));
  };

  const updateSLPrice = (id: string, price: number) => {
    setSlLevels(slLevels.map(sl => sl.id === id ? { ...sl, price } : sl));
  };

  const updateSLPercentage = (id: string, percentage: number) => {
    setSlLevels(slLevels.map(sl => sl.id === id ? { ...sl, percentage } : sl));
  };

  const totalTPPercentage = tpLevels.reduce((sum, tp) => sum + tp.percentage, 0);
  const totalSLPercentage = slLevels.reduce((sum, sl) => sum + sl.percentage, 0);

  const handleConfirm = () => {
    onConfirm(tpLevels, slLevels);
    onClose();
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Ladder TP/SL"
      subtitle={`${pair} · ${side === 'long' ? 'Long' : 'Short'} · Entry: $${entryPrice.toFixed(2)}`}
    >
      <div className="flex flex-col gap-4">
        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
          <button
            onClick={() => setTab('tp')}
            className="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: tab === 'tp' ? withAlpha('#10B981', ALPHA.muted) : 'transparent',
              color: tab === 'tp' ? '#10B981' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: tab === 'tp' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            <Target size={ICON_SIZE.sm} />
            Take Profit ({tpLevels.length})
          </button>
          <button
            onClick={() => setTab('sl')}
            className="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: tab === 'sl' ? withAlpha('#EF4444', ALPHA.muted) : 'transparent',
              color: tab === 'sl' ? '#EF4444' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: tab === 'sl' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            <Shield size={ICON_SIZE.sm} />
            Stop Loss ({slLevels.length})
          </button>
        </div>

        {/* Take Profit Tab */}
        {tab === 'tp' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                TP Levels ({tpLevels.length})
              </span>
              <span
                style={{
                  color: totalTPPercentage === 100 ? '#10B981' : totalTPPercentage > 100 ? '#EF4444' : '#F59E0B',
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                {totalTPPercentage}% / 100%
              </span>
            </div>

            {tpLevels.map((tp, index) => (
              <TrCard key={tp.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                    TP {index + 1}
                  </span>
                  {tpLevels.length > 1 && (
                    <button onClick={() => removeTPLevel(tp.id)}>
                      <Trash2 size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <label style={{ color: c.text3, fontSize: FONT_SCALE.micro, display: 'block', marginBottom: 4 }}>
                      Trigger Price (USDT)
                    </label>
                    <input
                      type="number"
                      value={tp.price}
                      onChange={e => updateTPPrice(tp.id, parseFloat(e.target.value))}
                      className="w-full rounded-xl px-3 py-2 outline-none"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text1,
                        fontSize: FONT_SCALE.sm,
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: c.text3, fontSize: FONT_SCALE.micro, display: 'block', marginBottom: 4 }}>
                      Close % of position
                    </label>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          onClick={() => updateTPPercentage(tp.id, pct)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: tp.percentage === pct ? '#10B981' : c.surface2,
                            color: tp.percentage === pct ? '#fff' : c.text2,
                            border: `1px solid ${tp.percentage === pct ? '#10B981' : c.borderSolid}`,
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-2 rounded-lg"
                    style={{ background: withAlpha('#10B981', ALPHA.hover) }}
                  >
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      Khi giá chạm ${tp.price.toFixed(2)}, đóng {tp.percentage}% position (≈{((currentSize * tp.percentage) / 100).toFixed(4)} {pair.split('/')[0]})
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}

            <button
              onClick={addTPLevel}
              className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.surface2,
                border: `1.5px dashed ${c.borderSolid}`,
                color: '#10B981',
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            >
              <Plus size={ICON_SIZE.sm} />
              Thêm TP Level
            </button>

            {totalTPPercentage !== 100 && (
              <div
                className="flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: withAlpha('#F59E0B', ALPHA.hover) }}
              >
                <Info size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: '#F59E0B', fontSize: 10, lineHeight: 1.5 }}>
                  Tổng % TP levels phải = 100% để đóng toàn bộ vị thế
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stop Loss Tab */}
        {tab === 'sl' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                SL Levels ({slLevels.length})
              </span>
              <span
                style={{
                  color: totalSLPercentage === 100 ? '#10B981' : totalSLPercentage > 100 ? '#EF4444' : '#F59E0B',
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                {totalSLPercentage}% / 100%
              </span>
            </div>

            {slLevels.map((sl, index) => (
              <TrCard key={sl.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                    SL {index + 1}
                  </span>
                  {slLevels.length > 1 && (
                    <button onClick={() => removeSLLevel(sl.id)}>
                      <Trash2 size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <label style={{ color: c.text3, fontSize: FONT_SCALE.micro, display: 'block', marginBottom: 4 }}>
                      Trigger Price (USDT)
                    </label>
                    <input
                      type="number"
                      value={sl.price}
                      onChange={e => updateSLPrice(sl.id, parseFloat(e.target.value))}
                      className="w-full rounded-xl px-3 py-2 outline-none"
                      style={{
                        background: c.surface2,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text1,
                        fontSize: FONT_SCALE.sm,
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: c.text3, fontSize: FONT_SCALE.micro, display: 'block', marginBottom: 4 }}>
                      Close % of position
                    </label>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          onClick={() => updateSLPercentage(sl.id, pct)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: sl.percentage === pct ? '#EF4444' : c.surface2,
                            color: sl.percentage === pct ? '#fff' : c.text2,
                            border: `1px solid ${sl.percentage === pct ? '#EF4444' : c.borderSolid}`,
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-2 rounded-lg"
                    style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
                  >
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      Khi giá chạm ${sl.price.toFixed(2)}, đóng {sl.percentage}% position để cắt lỗ
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}

            <button
              onClick={addSLLevel}
              className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.surface2,
                border: `1.5px dashed ${c.borderSolid}`,
                color: '#EF4444',
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            >
              <Plus size={ICON_SIZE.sm} />
              Thêm SL Level
            </button>
          </div>
        )}

        {/* Confirm */}
        <div className="flex gap-2">
          <CTAButton onClick={onClose} variant="secondary" className="flex-1">
            Hủy
          </CTAButton>
          <CTAButton onClick={handleConfirm} variant="primary" className="flex-1">
            Xác nhận TP/SL
          </CTAButton>
        </div>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. TRAILING STOP LOSS
   ═══════════════════════════════════════════════════════════════ */

interface TrailingStopProps {
  positionId: string;
  pair: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  currentSize: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (trailDistance: number, trailType: 'percentage' | 'price') => void;
}

export function TrailingStopSheet({
  positionId,
  pair,
  side,
  entryPrice,
  currentPrice,
  currentSize,
  open,
  onClose,
  onConfirm,
}: TrailingStopProps) {
  const c = useThemeColors();
  const [trailType, setTrailType] = useState<'percentage' | 'price'>('percentage');
  const [trailDistance, setTrailDistance] = useState(5); // 5% or $5

  const activationPrice = currentPrice;
  const currentStopPrice = trailType === 'percentage'
    ? currentPrice * (side === 'long' ? (1 - trailDistance / 100) : (1 + trailDistance / 100))
    : side === 'long'
      ? currentPrice - trailDistance
      : currentPrice + trailDistance;

  const handleConfirm = () => {
    onConfirm(trailDistance, trailType);
    onClose();
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Trailing Stop Loss"
      subtitle={`${pair} · ${side === 'long' ? 'Long' : 'Short'}`}
    >
      <div className="flex flex-col gap-4">
        {/* Info banner */}
        <TrCard
          className="p-3"
          style={{ background: withAlpha('#3B82F6', ALPHA.hover), border: `1px solid ${withAlpha('#3B82F6', ALPHA.soft)}` }}
        >
          <div className="flex items-start gap-2">
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
                Trailing Stop tự động điều chỉnh
              </p>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                Stop loss sẽ tự động tăng/giảm theo giá thị trường, giúp bảo vệ lợi nhuận khi giá đi đúng hướng.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Trail type selector */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Loại khoảng cách
          </label>
          <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
            <button
              onClick={() => setTrailType('percentage')}
              className="flex-1 py-2.5 rounded-xl transition-all"
              style={{
                background: trailType === 'percentage' ? c.primary : 'transparent',
                color: trailType === 'percentage' ? '#fff' : c.text3,
                fontSize: FONT_SCALE.xs,
                fontWeight: trailType === 'percentage' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
              }}
            >
              Phần trăm (%)
            </button>
            <button
              onClick={() => setTrailType('price')}
              className="flex-1 py-2.5 rounded-xl transition-all"
              style={{
                background: trailType === 'price' ? c.primary : 'transparent',
                color: trailType === 'price' ? '#fff' : c.text3,
                fontSize: FONT_SCALE.xs,
                fontWeight: trailType === 'price' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
              }}
            >
              Giá cố định ($)
            </button>
          </div>
        </div>

        {/* Trail distance input */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Khoảng cách trail {trailType === 'percentage' ? '(%)' : '(USDT)'}
          </label>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: c.surface, border: `1.5px solid ${c.borderSolid}` }}
          >
            <input
              type="number"
              value={trailDistance}
              onChange={e => setTrailDistance(parseFloat(e.target.value))}
              placeholder={trailType === 'percentage' ? '5' : '100'}
              className="w-full bg-transparent outline-none"
              style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}
            />
          </div>
          {/* Presets */}
          <div className="flex gap-2 mt-2">
            {trailType === 'percentage'
              ? [2, 3, 5, 7, 10].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTrailDistance(pct)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: trailDistance === pct ? c.primary : c.surface2,
                      color: trailDistance === pct ? '#fff' : c.text2,
                      border: `1px solid ${trailDistance === pct ? c.primary : c.borderSolid}`,
                    }}
                  >
                    {pct}%
                  </button>
                ))
              : [50, 100, 200, 500].map(price => (
                  <button
                    key={price}
                    onClick={() => setTrailDistance(price)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: trailDistance === price ? c.primary : c.surface2,
                      color: trailDistance === price ? '#fff' : c.text2,
                      border: `1px solid ${trailDistance === price ? c.primary : c.borderSolid}`,
                    }}
                  >
                    ${price}
                  </button>
                ))}
          </div>
        </div>

        {/* Visual explanation */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
            Cách hoạt động
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Giá hiện tại</span>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                ${currentPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Stop price ban đầu</span>
              <span style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${currentStopPrice.toFixed(2)}
              </span>
            </div>
            <div
              className="px-2.5 py-2 rounded-lg mt-1"
              style={{ background: c.surface2 }}
            >
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                {side === 'long'
                  ? `Khi giá tăng, stop price sẽ tự động tăng theo. Khi giá giảm ${trailType === 'percentage' ? `${trailDistance}%` : `$${trailDistance}`} từ đỉnh, vị thế sẽ đóng.`
                  : `Khi giá giảm, stop price sẽ tự động giảm theo. Khi giá tăng ${trailType === 'percentage' ? `${trailDistance}%` : `$${trailDistance}`} từ đáy, vị thế sẽ đóng.`}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Confirm */}
        <div className="flex gap-2">
          <CTAButton onClick={onClose} variant="secondary" className="flex-1">
            Hủy
          </CTAButton>
          <CTAButton onClick={handleConfirm} variant="primary" className="flex-1">
            Kích hoạt Trailing Stop
          </CTAButton>
        </div>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. POSITION MODE TOGGLE (ONE-WAY VS HEDGE)
   ═══════════════════════════════════════════════════════════════ */

interface PositionModeProps {
  currentMode: 'one-way' | 'hedge';
  onChange: (mode: 'one-way' | 'hedge') => void;
  className?: string;
}

export function PositionModeToggle({ currentMode, onChange, className = '' }: PositionModeProps) {
  const c = useThemeColors();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <TrCard className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.standard} />
            <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              Position Mode
            </span>
          </div>
          <button onClick={() => setShowInfo(true)}>
            <Info size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
          </button>
        </div>

        <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
          <button
            onClick={() => onChange('one-way')}
            className="flex-1 py-2.5 rounded-xl transition-all"
            style={{
              background: currentMode === 'one-way' ? c.primary : 'transparent',
              color: currentMode === 'one-way' ? '#fff' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: currentMode === 'one-way' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            One-Way Mode
          </button>
          <button
            onClick={() => onChange('hedge')}
            className="flex-1 py-2.5 rounded-xl transition-all"
            style={{
              background: currentMode === 'hedge' ? c.primary : 'transparent',
              color: currentMode === 'hedge' ? '#fff' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: currentMode === 'hedge' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            Hedge Mode
          </button>
        </div>

        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 8, lineHeight: 1.5 }}>
          {currentMode === 'one-way'
            ? 'Chỉ được giữ Long HOẶC Short cho mỗi cặp. Đơn giản, phù hợp beginner.'
            : 'Có thể giữ đồng thời Long VÀ Short cho cùng 1 cặp. Dùng cho hedging strategy.'}
        </p>
      </TrCard>

      <BottomSheetV2
        open={showInfo}
        onClose={() => setShowInfo(false)}
        title="Position Mode"
      >
        <div className="flex flex-col gap-4">
          <TrCard className="p-4">
            <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 6 }}>
              One-Way Mode
            </p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginBottom: 8 }}>
              Chế độ 1 chiều - chỉ được giữ Long HOẶC Short cho mỗi cặp tiền.
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Đơn giản, dễ hiểu cho beginner',
                'Khi mở Long mới, position Long cũ sẽ cộng dồn',
                'Không thể hedge (long + short cùng lúc)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro }}>•</span>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{item}</p>
                </div>
              ))}
            </div>
          </TrCard>

          <TrCard className="p-4">
            <p style={{ color: '#8B5CF6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 6 }}>
              Hedge Mode
            </p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginBottom: 8 }}>
              Chế độ hedge - có thể giữ đồng thời Long VÀ Short cho cùng 1 cặp.
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Cho phép hedging: bảo vệ vị thế bằng position ngược chiều',
                'Long và Short là 2 position riêng biệt',
                'Margin tính riêng cho mỗi side',
                'Phù hợp pro traders có chiến lược phức tạp',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span style={{ color: '#8B5CF6', fontSize: FONT_SCALE.micro }}>•</span>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{item}</p>
                </div>
              ))}
            </div>
          </TrCard>

          <CTAButton onClick={() => setShowInfo(false)} variant="secondary">
            Đóng
          </CTAButton>
        </div>
      </BottomSheetV2>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. ADD/REDUCE MARGIN
   ═══════════════════════════════════════════════════════════════ */

interface MarginAdjustProps {
  positionId: string;
  pair: string;
  side: 'long' | 'short';
  currentMargin: number;
  availableBalance: number;
  liquidationPrice: number;
  markPrice: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (action: 'add' | 'reduce', amount: number) => void;
}

export function MarginAdjustSheet({
  positionId,
  pair,
  side,
  currentMargin,
  availableBalance,
  liquidationPrice,
  markPrice,
  open,
  onClose,
  onConfirm,
}: MarginAdjustProps) {
  const c = useThemeColors();
  const [action, setAction] = useState<'add' | 'reduce'>('add');
  const [amount, setAmount] = useState('');

  const amountNum = parseFloat(amount || '0');
  const newMargin = action === 'add' ? currentMargin + amountNum : currentMargin - amountNum;
  const newLiqPrice = action === 'add'
    ? liquidationPrice * (currentMargin / newMargin) // Simplified calculation
    : liquidationPrice * (currentMargin / newMargin);

  const handleConfirm = () => {
    if (amountNum > 0) {
      onConfirm(action, amountNum);
      onClose();
    }
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Điều chỉnh margin"
      subtitle={`${pair} · ${side === 'long' ? 'Long' : 'Short'}`}
    >
      <div className="flex flex-col gap-4">
        {/* Action toggle */}
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
          <button
            onClick={() => setAction('add')}
            className="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: action === 'add' ? withAlpha('#10B981', ALPHA.muted) : 'transparent',
              color: action === 'add' ? '#10B981' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: action === 'add' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            <Plus size={ICON_SIZE.sm} />
            Thêm Margin
          </button>
          <button
            onClick={() => setAction('reduce')}
            className="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: action === 'reduce' ? withAlpha('#EF4444', ALPHA.muted) : 'transparent',
              color: action === 'reduce' ? '#EF4444' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: action === 'reduce' ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            <Minus size={ICON_SIZE.sm} />
            Giảm Margin
          </button>
        </div>

        {/* Current state */}
        <TrCard className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Margin hiện tại</span>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${currentMargin.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Giá thanh lý</span>
              <span style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${liquidationPrice.toFixed(2)}
              </span>
            </div>
            {action === 'add' && (
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Số dư khả dụng</span>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontFamily: 'monospace' }}>
                  ${availableBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </TrCard>

        {/* Amount input */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Số lượng (USDT)
          </label>
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{ background: c.surface, border: `1.5px solid ${c.borderSolid}` }}
          >
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}
            />
            <button
              onClick={() => setAmount(action === 'add' ? availableBalance.toString() : (currentMargin * 0.5).toString())}
              className="px-3 py-1.5 rounded-lg"
              style={{
                background: withAlpha(c.primary, ALPHA.soft),
                color: c.primary,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {action === 'add' ? 'Max' : '50%'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {amountNum > 0 && (
          <TrCard
            className="p-4"
            style={{
              background: action === 'add' ? withAlpha('#10B981', ALPHA.hover) : withAlpha('#EF4444', ALPHA.hover),
              border: `1.5px solid ${action === 'add' ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft)}`,
            }}
          >
            <p
              style={{
                color: action === 'add' ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                marginBottom: 8,
              }}
            >
              Sau khi {action === 'add' ? 'thêm' : 'giảm'} margin
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Margin mới</span>
                <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                  ${newMargin.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Giá thanh lý mới</span>
                <span
                  style={{
                    color: action === 'add' ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.sm,
                    fontWeight: FONT_WEIGHT.bold,
                    fontFamily: 'monospace',
                  }}
                >
                  ${newLiqPrice.toFixed(2)}
                  <span style={{ fontSize: FONT_SCALE.micro, marginLeft: 4 }}>
                    ({action === 'add' ? '▼' : '▲'} {Math.abs(((newLiqPrice - liquidationPrice) / liquidationPrice) * 100).toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>
          </TrCard>
        )}

        {/* Confirm */}
        <div className="flex gap-2">
          <CTAButton onClick={onClose} variant="secondary" className="flex-1">
            Hủy
          </CTAButton>
          <CTAButton
            onClick={handleConfirm}
            variant={action === 'add' ? 'success' : 'danger'}
            disabled={amountNum <= 0}
            className="flex-1"
          >
            {action === 'add' ? 'Thêm' : 'Giảm'} ${amountNum.toFixed(2)}
          </CTAButton>
        </div>
      </div>
    </BottomSheetV2>
  );
}
