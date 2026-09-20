/**
 * ══════════════════════════════════════════════════════════════════
 *  ORDER AMENDMENT — Phase 2: Execution Quality
 * ══════════════════════════════════════════════════════════════════
 *  Modify Open Orders Without Losing Queue Position
 *  - Edit price and/or quantity
 *  - Keep queue priority (exchange dependent)
 *  - Real-time validation
 *  - Fallback to cancel+replace if amend unsupported
 *  - Show queue position impact
 */

import React, { useState } from 'react';
import { Edit3, AlertTriangle, Info, CheckCircle, X, TrendingUp, TrendingDown } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface OpenOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'stop-limit';
  
  // Current order details
  price: number;
  stopPrice?: number; // For stop-limit
  amount: number;
  filled: number;
  remaining: number;
  
  // Queue info (if available)
  queuePosition?: number;
  totalInQueue?: number;
  
  // Exchange capabilities
  supportsAmend: boolean; // True if exchange allows amend
  
  // Timing
  createdAt: string;
}

interface OrderAmendmentProps {
  order: OpenOrder;
  currentMarketPrice: number;
  
  onAmend: (orderId: string, newPrice: number, newAmount: number) => void;
  onCancel: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   ORDER AMENDMENT COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function OrderAmendment({
  order,
  currentMarketPrice,
  onAmend,
  onCancel,
}: OrderAmendmentProps) {
  const c = useThemeColors();
  const { hapticSuccess, hapticWarning, hapticSelection } = useHaptic();

  // Edit state
  const [editMode, setEditMode] = useState<'price' | 'amount' | 'both'>('price');
  const [newPrice, setNewPrice] = useState(order.price.toString());
  const [newAmount, setNewAmount] = useState(order.amount.toString());

  // Parse values
  const newPriceNum = parseFloat(newPrice || '0');
  const newAmountNum = parseFloat(newAmount || '0');
  const remainingNum = order.remaining;

  // Calculate changes
  const priceChanged = Math.abs(newPriceNum - order.price) > 0.01;
  const amountChanged = Math.abs(newAmountNum - order.amount) > 0.001;
  const hasChanges = priceChanged || amountChanged;

  const priceChangePct = ((newPriceNum - order.price) / order.price) * 100;
  const amountChangePct = ((newAmountNum - order.amount) / order.amount) * 100;

  // Price direction vs market
  const isPriceBetter = order.side === 'buy'
    ? newPriceNum < currentMarketPrice
    : newPriceNum > currentMarketPrice;

  // Validation
  const isValidPrice = newPriceNum > 0;
  const isValidAmount = newAmountNum > 0 && newAmountNum >= order.filled;
  const canSubmit = hasChanges && isValidPrice && isValidAmount;

  // Queue impact warning
  const willLoseQueue = !order.supportsAmend && hasChanges;
  const queueRisk = order.queuePosition && order.totalInQueue
    ? (order.queuePosition / order.totalInQueue) < 0.2 // In top 20%
    : false;

  const handleSubmit = () => {
    if (!canSubmit) {
      hapticWarning();
      return;
    }

    hapticSuccess();
    onAmend(order.id, newPriceNum, newAmountNum);
  };

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <TrCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Edit3 size={20} color="#3B82F6" />
            <div>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                Modify Order
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                #{order.id.slice(0, 12)}...
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
              color: order.side === 'buy' ? '#10B981' : '#EF4444',
              background: order.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            }}
          >
            {order.side === 'buy' ? 'BUY' : 'SELL'} {order.type.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Symbol
            </p>
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {order.symbol}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Market Price
            </p>
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtPrice(currentMarketPrice)}
            </p>
          </div>
        </div>
      </TrCard>

      {/* Current Order Details */}
      <TrCard className="p-4">
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
          Current Order
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Price</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtPrice(order.price)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Amount</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtAmount(order.amount)} {order.symbol.split('/')[0]}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Filled / Remaining</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
              {fmtAmount(order.filled)} / {fmtAmount(order.remaining)}
            </span>
          </div>
        </div>

        {/* Queue Position */}
        {order.queuePosition && order.totalInQueue && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                Queue Position
              </span>
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: queueRisk ? '#F59E0B' : c.text1 }}>
                #{order.queuePosition} of {order.totalInQueue.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.divider }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(order.queuePosition / order.totalInQueue) * 100}%`,
                  background: queueRisk ? '#F59E0B' : '#3B82F6',
                }}
              />
            </div>
          </div>
        )}
      </TrCard>

      {/* Edit Mode Toggle */}
      <div className="flex gap-2">
        {['price', 'amount', 'both'].map(mode => (
          <button
            key={mode}
            onClick={() => { setEditMode(mode as any); hapticSelection(); }}
            className="flex-1 px-3 py-2 rounded-xl min-h-10"
            style={{
              fontSize: FONT_SCALE.xs,
              fontWeight: editMode === mode ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
              background: editMode === mode ? c.chipActiveBg : c.surface2,
              color: editMode === mode ? c.chipActiveText : c.text2,
              border: editMode === mode
                ? `2px solid ${c.chipActiveBorder}`
                : `1.5px solid ${c.borderSolid}`,
              boxShadow: editMode === mode
                ? '0 1px 3px rgba(59,130,246,0.15)'
                : 'none',
            }}
          >
            {mode === 'price' ? 'Edit Price' : mode === 'amount' ? 'Edit Amount' : 'Edit Both'}
          </button>
        ))}
      </div>

      {/* Edit Price */}
      {(editMode === 'price' || editMode === 'both') && (
        <div>
          <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
            New Price
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={newPrice}
              onChange={e => setNewPrice(formatNum(e.target.value))}
              placeholder={order.price.toString()}
              className="w-full px-3 py-3 rounded-xl min-h-11"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: c.text1,
                background: c.surface2,
                border: `1.5px solid ${priceChanged ? '#3B82F6' : c.borderSolid}`,
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

          {priceChanged && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {priceChangePct >= 0 ? (
                  <TrendingUp size={12} color={priceChangePct > 0 ? '#10B981' : c.text3} />
                ) : (
                  <TrendingDown size={12} color="#EF4444" />
                )}
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                  {priceChangePct >= 0 ? '+' : ''}{fmtPct(priceChangePct)} from current
                </span>
              </div>
              <span style={{
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
                color: isPriceBetter ? '#10B981' : '#F59E0B',
              }}>
                {isPriceBetter ? '✓ Better than market' : '⚠ Worse than market'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Edit Amount */}
      {(editMode === 'amount' || editMode === 'both') && (
        <div>
          <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
            New Amount
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={newAmount}
              onChange={e => setNewAmount(formatNum(e.target.value))}
              placeholder={order.amount.toString()}
              className="w-full px-3 py-3 rounded-xl min-h-11"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: c.text1,
                background: c.surface2,
                border: `1.5px solid ${amountChanged ? '#3B82F6' : c.borderSolid}`,
                fontFamily: 'monospace',
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}
            >
              {order.symbol.split('/')[0]}
            </span>
          </div>

          {amountChanged && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {amountChangePct >= 0 ? (
                  <TrendingUp size={12} color="#10B981" />
                ) : (
                  <TrendingDown size={12} color="#EF4444" />
                )}
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                  {amountChangePct >= 0 ? '+' : ''}{fmtPct(amountChangePct)} from current
                </span>
              </div>
            </div>
          )}

          {newAmountNum < order.filled && (
            <p style={{ fontSize: FONT_SCALE.xs, color: '#EF4444', marginTop: 4 }}>
              ✗ Amount cannot be less than filled ({fmtAmount(order.filled)})
            </p>
          )}
        </div>
      )}

      {/* New Order Preview */}
      {hasChanges && isValidPrice && isValidAmount && (
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
            New Order Preview
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Price</span>
              <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtPrice(newPriceNum)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Amount</span>
              <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtAmount(newAmountNum)} {order.symbol.split('/')[0]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Total Value</span>
              <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtUsd((newAmountNum - order.filled) * newPriceNum)}
              </span>
            </div>
          </div>
        </TrCard>
      )}

      {/* Warnings */}
      {willLoseQueue && queueRisk && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-1" />
          <div className="flex-1">
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#EF4444', marginBottom: 4 }}>
              Queue Position Will Be Lost
            </p>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
              This exchange doesn't support order amendment. Modifying will cancel the current order
              (#{order.queuePosition} in queue) and create a new one, losing your queue priority.
            </p>
          </div>
        </div>
      )}

      {order.supportsAmend && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={14} color="#10B981" className="shrink-0 mt-1" />
          <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
            <strong style={{ color: '#10B981' }}>Queue position preserved</strong> — This exchange
            supports order amendment, so your queue priority will be maintained.
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
          Cancel
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
          <CheckCircle size={16} />
          {order.supportsAmend ? 'Amend Order' : 'Cancel & Replace'}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }}>
        <Info size={14} color={c.text3} className="shrink-0 mt-1" />
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
          Modifying price or amount may affect your order's queue position depending on exchange rules.
          Decreasing size is usually safe, but increasing may reset priority.
        </p>
      </div>
    </div>
  );
}
