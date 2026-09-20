import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  ChevronRight,
  Search,
  X,
  SortDesc,
  BarChart3,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtAmount, fmtVnd, fmtCompact } from '../../data/formatNumber';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { P2P_ORDERS, P2POrder } from '../../data/mockData';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { SearchBar } from '../../components/ui/SearchBar';
import { useLoadingState } from '../../hooks/useLoadingState';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: 'Chờ thanh toán', color: 'var(--tr-warn)', icon: Clock },
  paid: { label: 'Đã thanh toán', color: 'var(--tr-primary)', icon: Clock },
  released: { label: 'Hoàn tất', color: 'var(--tr-buy)', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'var(--tr-sell)', icon: XCircle },
  disputed: { label: 'Tranh chấp', color: 'var(--tr-sell)', icon: AlertTriangle },
  expired: { label: 'Hết hạn', color: 'var(--tr-text-3)', icon: Clock },
};

const TABS = [
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'completed', label: 'Hoàn tất' },
  { id: 'disputed', label: 'Tranh chấp' },
] as const;
type TabId = typeof TABS[number]['id'];

export function P2PMyOrdersPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const routePrefix = useRoutePrefix();
  const [activeTab, setActiveTab] = useState<TabId>('processing');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState();

  const filtered = useMemo(() => {
    let orders = P2P_ORDERS.filter(order => {
      if (activeTab === 'processing') return order.status === 'pending_payment' || order.status === 'paid';
      if (activeTab === 'completed') return order.status === 'released' || order.status === 'cancelled';
      if (activeTab === 'disputed') return order.status === 'disputed';
      return true;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      orders = orders.filter(o => o.id.toLowerCase().includes(q) || o.merchant.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q));
    }
    orders = [...orders].sort((a, b) => {
      if (sortBy === 'amount') return b.total - a.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return orders;
  }, [activeTab, searchQuery, sortBy]);

  const processingCount = P2P_ORDERS.filter(o => o.status === 'pending_payment' || o.status === 'paid').length;
  const disputedCount = P2P_ORDERS.filter(o => o.status === 'disputed').length;
  const completedOrders = P2P_ORDERS.filter(o => o.status === 'released');
  const totalVolume = completedOrders.reduce((s, o) => s + o.total, 0);

  return (
    <PageLayout>
      <Header title="Đơn P2P của tôi" subtitle="Đơn hàng · P2P" back right={
        <button onClick={() => navigate(`${routePrefix}/p2p/dashboard`)}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <BarChart3 size={16} color="#3B82F6" />
        </button>
      } />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="flex-1">
        <PageContent padding="compact">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
          {[
            { label: 'Tổng đơn', value: P2P_ORDERS.length, color: c.text1 },
            { label: 'Hoàn thành', value: completedOrders.length, color: '#10B981' },
            { label: 'Tổng KL', value: fmtCompact(totalVolume), color: '#3B82F6' },
          ].map(stat => (
            <TrCard key={stat.label} rounded="sm" className="py-2.5 px-2 text-center" style={{ border: `1px solid ${c.cardBorder}` }}>
              <p style={{ color: stat.color, fontSize: φ.base, fontWeight: 700 }}>{stat.value}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>{stat.label}</p>
            </TrCard>
          ))}
        </div>

        {/* Tabs */}
        <TabBar
          variant="segment"
          tabs={TABS.map(tab => ({ id: tab.id, label: tab.label }))}
          active={activeTab}
          onChange={setActiveTab}
          className="mb-3"
        />

        {/* Search & Sort */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã đơn hoặc merchant..."
          variant="compact"
          className="mb-3"
          right={
            <button onClick={() => { setSortBy(sortBy === 'date' ? 'amount' : 'date'); hapticSelection(); }}
              className="flex items-center gap-1 px-2.5 rounded-xl shrink-0"
              style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, height: 36, fontSize: 11, fontWeight: 600 }}>
              <SortDesc size={12} />
              {sortBy === 'date' ? 'Ngày' : 'Số tiền'}
            </button>
          }
        />

        {/* Order List */}
        <RefreshableSkeletonList
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          rows={6}
          isEmpty={filtered.length === 0}
          emptyState={
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <ShoppingCart size={36} color={c.borderSolid} />
              </div>
              <div className="text-center">
                <p style={{ color: c.text2, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Chưa có đơn hàng nào</p>
                <p style={{ color: c.text3, fontSize: 13 }}>
                  {activeTab === 'processing' ? 'Bạn không có đơn đang xử lý' : activeTab === 'disputed' ? 'Không có đơn tranh chấp' : 'Chưa có đơn hoàn tất'}
                </p>
              </div>
              <button onClick={() => navigate(`${routePrefix}/p2p`)} className="px-6 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)', color: '#fff' }}>Tạo giao dịch P2P</button>
            </div>
          }
          lastRefreshedLabel={lastRefreshedLabel}
          refreshCount={refreshCount}
        >
          <div className="flex flex-col gap-3">
            {filtered.map(order => {
              const statusInfo = STATUS_MAP[order.status];
              const StatusIcon = statusInfo.icon;
              return (
                <TrCard key={order.id} as="button" rounded="sm" hover
                  onClick={() => {
                    if (order.status === 'disputed') navigate(`${routePrefix}/p2p/dispute/detail/${order.id}`);
                    else navigate(`${routePrefix}/p2p/order/${order.id}`);
                  }}
                  className="p-4 w-full text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: order.type === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: order.type === 'buy' ? '#10B981' : '#EF4444' }}>
                        {order.type === 'buy' ? 'MUA' : 'BÁN'}
                      </span>
                      <span style={{ color: c.text2, fontSize: 12, fontFamily: 'monospace' }}>#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon size={12} color={statusInfo.color} />
                      <span style={{ color: statusInfo.color, fontSize: 12, fontWeight: 600 }}>{statusInfo.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Số lượng</p>
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(order.amount)} {order.asset}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Giá</p>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmtVnd(order.price)}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text3, fontSize: 11 }}>Tổng tiền</p>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmtVnd(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                        <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{order.merchant.charAt(0)}</span>
                      </div>
                      <span style={{ color: c.text2, fontSize: 12 }}>{order.merchant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{ color: c.text3, fontSize: 11 }}>{order.createdAt.slice(5, 16)}</span>
                      <ChevronRight size={14} color={c.text3} />
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </RefreshableSkeletonList>
        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}