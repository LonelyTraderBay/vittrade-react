import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtUsd } from '../../data/formatNumber';
import { OPEN_ORDERS, ORDER_HISTORY, Order } from '../../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

const STATUS_CONFIG = {
  open: { label: 'Đang mở', color: '#3B82F6', icon: Clock },
  partial: { label: 'Khớp 1 phần', color: '#F59E0B', icon: TrendingUp },
  filled: { label: 'Đã khớp', color: '#10B981', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: '#8B95B3', icon: XCircle },
};

const TYPE_LABELS = {
  market: 'Market',
  limit: 'Limit',
  stop: 'Stop',
};

export function OrdersHistoryPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState();
  const actionToast = useActionToast();

  const openOrders = filterType === 'all'
    ? OPEN_ORDERS 
    : OPEN_ORDERS.filter(o => o.side === filterType);

  const historyOrders = filterType === 'all'
    ? ORDER_HISTORY
    : ORDER_HISTORY.filter(o => o.side === filterType);

  const displayOrders = activeTab === 'open' ? openOrders : historyOrders;

  const handleCancelOrder = (orderId: string) => {
    actionToast.warning(TOAST.TRADE.ORDER_CANCELLED(orderId), { haptic: 'selection' });
  };

  const renderOrder = (order: Order) => {
    const status = STATUS_CONFIG[order.status];
    const isBuy = order.side === 'buy';
    const fillPercent = order.status === 'partial' ? (order.filled / order.amount) * 100 : 0;

    return (
      <div key={order.id} className="px-5 py-3"
        style={{ borderBottom: `1px solid ${c.divider}` }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
              {order.symbol}
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold"
              style={{
                background: isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: isBuy ? '#10B981' : '#EF4444',
              }}>
              {isBuy ? 'MUA' : 'BÁN'}
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold"
              style={{ background: c.surface3, color: c.text2 }}>
              {TYPE_LABELS[order.type]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <status.icon size={14} color={status.color} />
            <span style={{ color: status.color, fontSize: 12, fontWeight: 600 }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2">
          <div>
            <p style={{ color: c.text3, fontSize: 12 }}>Giá</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
              {fmtUsd(order.price)}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 12 }}>Số lượng</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
              {order.amount.toFixed(4)}
            </p>
          </div>
          {order.status === 'partial' && (
            <div className="contents">
              <div>
                <p style={{ color: c.text3, fontSize: 12 }}>Đã khớp</p>
                <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  {order.filled.toFixed(4)} ({fillPercent.toFixed(0)}%)
                </p>
              </div>
            </div>
          )}
          {order.fee > 0 && (
            <div>
              <p style={{ color: c.text3, fontSize: 12 }}>Phí</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                ${order.fee.toFixed(2)}
              </p>
            </div>
          )}
          <div className="col-span-2">
            <p style={{ color: c.text3, fontSize: 12 }}>Thời gian</p>
            <p style={{ color: c.text2, fontSize: 12 }}>
              {order.createdAt}
            </p>
          </div>
        </div>

        {/* Progress bar for partial filled */}
        {order.status === 'partial' && (
          <div className="mb-2">
            <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
              <div className="h-full rounded-full" 
                style={{ 
                  background: 'linear-gradient(90deg, #10B981, #34D399)',
                  width: `${fillPercent}%`,
                }} />
            </div>
          </div>
        )}

        {/* Actions */}
        {order.status === 'open' || order.status === 'partial' ? (
          <button
            onClick={() => handleCancelOrder(order.id)}
            className="w-full h-9 rounded-xl font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>
            Hủy lệnh
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <PageLayout>
      <Header title="Lịch sử lệnh" subtitle="Lệnh · Trade" back />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="flex-1">
        {/* Tabs */}
        <div className="flex gap-2 px-4 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}`, boxShadow: c.cardShadow }}>
          {[
            { id: 'open', label: 'Lệnh mở', count: OPEN_ORDERS.length },
            { id: 'history', label: 'Lịch sử', count: ORDER_HISTORY.length },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); hapticSelection(); }}
              className="flex-1 h-10 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{
                background: activeTab === tab.id ? '#3B82F6' : c.hoverBg,
                color: activeTab === tab.id ? '#fff' : c.text2,
                fontSize: 14,
              }}>
              {tab.label}
              <span className="px-2 py-1 rounded text-xs"
                style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : c.surface3 }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 px-4 py-2">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'buy', label: 'Mua', color: '#10B981' },
            { id: 'sell', label: 'Bán', color: '#EF4444' },
          ].map(f => (
            <button key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className="px-3 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: filterType === f.id ? (f.color ? f.color + '22' : '#3B82F6') : c.chipBg,
                color: filterType === f.id ? (f.color || '#3B82F6') : c.chipText,
                border: `1px solid ${filterType === f.id ? (f.color || '#3B82F6') + '44' : c.chipBorder}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <RefreshableSkeletonList
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          rows={6}
          isEmpty={displayOrders.length === 0}
          emptyState={
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Clock size={48} color={c.borderSolid} />
              <p style={{ color: c.text3, fontSize: 14 }}>
                {activeTab === 'open' ? 'Không có lệnh đang mở' : 'Chưa có lịch sử giao dịch'}
              </p>
            </div>
          }
          lastRefreshedLabel={lastRefreshedLabel}
          refreshCount={refreshCount}
        >
          <div
            key={`${activeTab}-${filterType}`}
          >
            {displayOrders.map((order, idx) => (
              <div key={order.id}>
                {renderOrder(order)}
              </div>
            ))}
          </div>
        </RefreshableSkeletonList>
      </PullToRefresh>
    </PageLayout>
  );
}