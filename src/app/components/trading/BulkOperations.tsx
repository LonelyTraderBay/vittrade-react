/**
 * ══════════════════════════════════════════════════════════════════
 *  BULK OPERATIONS — Phase 3: Advanced Trading Tools
 * ══════════════════════════════════════════════════════════════════
 *  Multi-Select & Batch Actions on Open Orders
 *  - Select multiple orders with checkboxes
 *  - Bulk cancel (all, by side, by symbol)
 *  - Bulk modify (shift prices by %, apply new quantity)
 *  - Quick filters (side, symbol, age)
 *  - Confirmation dialog for destructive actions
 *  - Performance metrics (total value, avg fill %)
 */

import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, Trash2, Edit2, Filter, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtAmount, fmtPct } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface BulkOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'stop-limit';
  price: number;
  amount: number;
  filled: number;
  remaining: number;
  totalValue: number;
  createdAt: string; // ISO date
}

interface BulkOperationsProps {
  orders: BulkOrder[];
  onBulkCancel: (orderIds: string[]) => void;
  onBulkModify: (orderIds: string[], modification: BulkModification) => void;
}

export interface BulkModification {
  type: 'shift_price' | 'set_amount';
  shiftPct?: number; // e.g., +5 or -5
  newAmount?: number;
}

/* ═══════════════════════════════════════════════════════════════
   BULK OPERATIONS COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function BulkOperations({
  orders,
  onBulkCancel,
  onBulkModify,
}: BulkOperationsProps) {
  const c = useThemeColors();
  const { hapticSuccess, hapticWarning, hapticSelection } = useHaptic();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'modify'>('cancel');

  // Filter state
  const [filterSide, setFilterSide] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterSymbol, setFilterSymbol] = useState<string>('all');

  // Modify state
  const [shiftPct, setShiftPct] = useState('');

  // Get unique symbols
  const symbols = useMemo(() => {
    const unique = new Set(orders.map(o => o.symbol));
    return ['all', ...Array.from(unique)];
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterSide !== 'all' && order.side !== filterSide) return false;
      if (filterSymbol !== 'all' && order.symbol !== filterSymbol) return false;
      return true;
    });
  }, [orders, filterSide, filterSymbol]);

  // Selected orders
  const selectedOrders = useMemo(() => {
    return orders.filter(o => selectedIds.has(o.id));
  }, [orders, selectedIds]);

  // Selection stats
  const selectionStats = useMemo(() => {
    const buyOrders = selectedOrders.filter(o => o.side === 'buy');
    const sellOrders = selectedOrders.filter(o => o.side === 'sell');
    const totalValue = selectedOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const avgFillPct = selectedOrders.length > 0
      ? selectedOrders.reduce((sum, o) => sum + (o.filled / o.amount) * 100, 0) / selectedOrders.length
      : 0;

    return {
      total: selectedOrders.length,
      buy: buyOrders.length,
      sell: sellOrders.length,
      totalValue,
      avgFillPct,
    };
  }, [selectedOrders]);

  // Handlers
  const toggleSelection = (id: string) => {
    hapticSelection();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    hapticSelection();
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkCancel = () => {
    if (selectedOrders.length === 0) {
      hapticWarning();
      return;
    }
    setConfirmAction('cancel');
    setShowConfirm(true);
  };

  const handleBulkModify = () => {
    if (selectedOrders.length === 0 || !shiftPct) {
      hapticWarning();
      return;
    }
    setConfirmAction('modify');
    setShowConfirm(true);
  };

  const confirmBulkAction = () => {
    const ids = Array.from(selectedIds);

    if (confirmAction === 'cancel') {
      hapticSuccess();
      onBulkCancel(ids);
      setSelectedIds(new Set());
    } else {
      const pct = parseFloat(shiftPct);
      if (!isNaN(pct) && pct !== 0) {
        hapticSuccess();
        onBulkModify(ids, { type: 'shift_price', shiftPct: pct });
        setSelectedIds(new Set());
        setShiftPct('');
      }
    }

    setShowConfirm(false);
  };

  const formatNum = (v: string) => v.replace(/[^\d.-]/g, '');

  const allSelected = filteredOrders.length > 0 && selectedIds.size === filteredOrders.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} color="#3B82F6" />
          <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Bulk Operations
          </span>
        </div>
        <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
          {orders.length} open orders
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {/* Side Filter */}
        <div className="flex gap-1 flex-1">
          {(['all', 'buy', 'sell'] as const).map(side => (
            <button
              key={side}
              onClick={() => { setFilterSide(side); hapticSelection(); }}
              className="flex-1 px-2 py-1.5 rounded-lg min-h-9"
              style={{
                fontSize: FONT_SCALE.xs,
                fontWeight: filterSide === side ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                background: filterSide === side ? c.chipActiveBg : c.surface2,
                color: filterSide === side ? c.chipActiveText : c.text2,
                border: filterSide === side
                  ? `2px solid ${c.chipActiveBorder}`
                  : `1px solid ${c.borderSolid}`,
              }}
            >
              {side === 'all' ? 'All' : side === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>

        {/* Symbol Filter */}
        <select
          value={filterSymbol}
          onChange={e => { setFilterSymbol(e.target.value); hapticSelection(); }}
          className="px-3 py-1.5 rounded-lg min-h-9"
          style={{
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.semibold,
            color: c.text1,
            background: c.surface2,
            border: `1px solid ${c.borderSolid}`,
          }}
        >
          {symbols.map(sym => (
            <option key={sym} value={sym}>
              {sym === 'all' ? 'All Symbols' : sym}
            </option>
          ))}
        </select>
      </div>

      {/* Selection Stats */}
      {selectedOrders.length > 0 && (
        <TrCard className="p-3" accentBorder="rgba(59,130,246,0.3)">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {selectionStats.total} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 2 }}>
                Buy / Sell
              </p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                {selectionStats.buy} / {selectionStats.sell}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 2 }}>
                Total Value
              </p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtUsd(selectionStats.totalValue)}
              </p>
            </div>
          </div>

          {selectionStats.avgFillPct > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                  Avg Fill Rate
                </span>
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                  {fmtPct(selectionStats.avgFillPct)}
                </span>
              </div>
            </div>
          )}
        </TrCard>
      )}

      {/* Order List */}
      <TrCard className="p-0 overflow-hidden">
        {/* Select All Header */}
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ background: c.surface2, borderBottom: `1px solid ${c.divider}` }}
        >
          <button onClick={toggleSelectAll} className="shrink-0">
            {allSelected ? (
              <CheckSquare size={18} color="#3B82F6" />
            ) : (
              <Square size={18} color={c.text3} />
            )}
          </button>
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
            Select All ({filteredOrders.length})
          </span>
        </div>

        {/* Orders */}
        <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center">
              <p style={{ fontSize: FONT_SCALE.sm, color: c.text3 }}>
                No orders matching filters
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const isSelected = selectedIds.has(order.id);
              const fillPct = (order.filled / order.amount) * 100;

              return (
                <div
                  key={order.id}
                  onClick={() => toggleSelection(order.id)}
                  className="flex items-center gap-3 px-3 py-3"
                  style={{
                    background: isSelected ? c.surface2 : 'transparent',
                    borderBottom: `1px solid ${c.divider}`,
                    cursor: 'pointer',
                  }}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleSelection(order.id); }} className="shrink-0">
                    {isSelected ? (
                      <CheckSquare size={18} color="#3B82F6" />
                    ) : (
                      <Square size={18} color={c.text3} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                          {order.symbol}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            fontSize: FONT_SCALE.micro,
                            fontWeight: FONT_WEIGHT.bold,
                            color: order.side === 'buy' ? '#10B981' : '#EF4444',
                            background: order.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          }}
                        >
                          {order.side.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                        {fmtPrice(order.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                        {fmtAmount(order.filled)} / {fmtAmount(order.amount)} filled
                      </span>
                      <span style={{ fontSize: FONT_SCALE.xs, color: c.text3, fontFamily: 'monospace' }}>
                        {fmtUsd(order.totalValue)}
                      </span>
                    </div>

                    {fillPct > 0 && (
                      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: c.divider }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${fillPct}%`,
                            background: order.side === 'buy' ? '#10B981' : '#EF4444',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </TrCard>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Modify Section */}
          <div>
            <label style={{ fontSize: FONT_SCALE.xs, color: c.text3, display: 'block', marginBottom: 8 }}>
              Shift Prices (%)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={shiftPct}
                  onChange={e => setShiftPct(formatNum(e.target.value))}
                  placeholder="+5 or -5"
                  className="w-full px-3 py-2 rounded-xl min-h-11"
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
                onClick={handleBulkModify}
                disabled={!shiftPct}
                className="px-4 py-2 rounded-xl min-h-11 flex items-center justify-center gap-2"
                style={{
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  color: '#fff',
                  background: shiftPct
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : c.surface2,
                  boxShadow: shiftPct ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                  opacity: shiftPct ? 1 : 0.5,
                }}
              >
                <Edit2 size={16} />
                Modify
              </button>
            </div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 4 }}>
              Example: +5 raises all prices by 5%, -3 lowers by 3%
            </p>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleBulkCancel}
            className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
            style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: '#fff',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
            }}
          >
            <Trash2 size={16} />
            Cancel {selectedOrders.length} Orders
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-4"
            style={{ background: c.bg }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={24} color={confirmAction === 'cancel' ? '#EF4444' : '#F59E0B'} />
              <div className="flex-1">
                <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 6 }}>
                  {confirmAction === 'cancel' ? 'Cancel Orders?' : 'Modify Orders?'}
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  {confirmAction === 'cancel'
                    ? `This will cancel ${selectedOrders.length} open orders. This action cannot be undone.`
                    : `This will shift prices of ${selectedOrders.length} orders by ${shiftPct}%. Original queue positions may be lost.`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl min-h-11"
                style={{
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  color: c.text2,
                  background: c.surface2,
                  border: `1.5px solid ${c.borderSolid}`,
                }}
              >
                <X size={16} className="inline mr-1" />
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                className="flex-1 px-4 py-3 rounded-xl min-h-11"
                style={{
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  color: '#fff',
                  background: confirmAction === 'cancel'
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  boxShadow: confirmAction === 'cancel'
                    ? '0 4px 16px rgba(239,68,68,0.3)'
                    : '0 4px 16px rgba(245,158,11,0.3)',
                }}
              >
                <CheckCircle size={16} className="inline mr-1" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
