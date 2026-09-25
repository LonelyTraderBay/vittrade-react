import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { ErrorState } from '@/shared/ui/ErrorState';
import { fmtUsd } from '@/shared/lib/formatNumber';
import { useAuth } from '@/shared/session/useAuth';
import {
  useCancelOrderMutation,
  useOpenOrdersQuery,
  useOrderHistoryQuery,
  type OrderStatus,
  type OrderType,
  type TradingOrder,
} from '@/features/trading';

type OrderTab = 'open' | 'history';
type SideFilter = 'all' | 'buy' | 'sell';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Đang mở', color: '#3B82F6', icon: Clock },
  partial: { label: 'Khớp một phần', color: '#F59E0B', icon: TrendingUp },
  filled: { label: 'Đã khớp', color: '#10B981', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: '#8B95B3', icon: XCircle },
  rejected: { label: 'Bị từ chối', color: '#EF4444', icon: AlertCircle },
};

const TYPE_LABELS: Record<OrderType, string> = {
  market: 'Market',
  limit: 'Limit',
  stop: 'Stop',
  'stop-limit': 'Stop limit',
  trailing: 'Trailing',
  oco: 'OCO',
  bracket: 'Bracket',
};

function idempotencyKey(orderId: string) {
  return `cancel-${orderId}-${crypto.randomUUID()}`;
}

export function OrdersHistoryPage() {
  const colors = useThemeColors();
  const [tab, setTab] = useState<OrderTab>('open');
  const [side, setSide] = useState<SideFilter>('all');
  const openOrdersQuery = useOpenOrdersQuery();
  const historyQuery = useOrderHistoryQuery();
  const cancelMutation = useCancelOrderMutation();
  const { hasPermission } = useAuth();
  const canCancelOrders = hasPermission('trading:write') || hasPermission('trade:write');

  const activeQuery = tab === 'open' ? openOrdersQuery : historyQuery;
  const orders = useMemo(() => {
    const items = activeQuery.data?.items ?? [];
    return side === 'all' ? items : items.filter((order) => order.side === side);
  }, [activeQuery.data?.items, side]);

  const retry = () => {
    void openOrdersQuery.refetch();
    void historyQuery.refetch();
  };

  return (
    <PageLayout>
      <Header title="Lịch sử lệnh" subtitle="Lệnh · Trade" back />
      <div
        className="flex gap-2 px-4 py-3"
        style={{ background: colors.surface, borderBottom: `1px solid ${colors.divider}` }}
      >
        {[
          { id: 'open' as const, label: 'Lệnh mở', count: openOrdersQuery.data?.items.length ?? 0 },
          {
            id: 'history' as const,
            label: 'Lịch sử',
            count: historyQuery.data?.items.length ?? 0,
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex-1 h-10 rounded-xl font-semibold"
            style={{
              background: tab === item.id ? '#3B82F6' : colors.hoverBg,
              color: tab === item.id ? '#fff' : colors.text2,
              fontSize: 14,
            }}
          >
            {item.label} <span className="ml-1 text-xs opacity-80">{item.count}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 px-4 py-2">
        {[
          { id: 'all' as const, label: 'Tất cả' },
          { id: 'buy' as const, label: 'Mua', color: '#10B981' },
          { id: 'sell' as const, label: 'Bán', color: '#EF4444' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSide(item.id)}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: side === item.id ? `${item.color ?? '#3B82F6'}22` : colors.chipBg,
              color: side === item.id ? (item.color ?? '#3B82F6') : colors.chipText,
              border: `1px solid ${side === item.id ? (item.color ?? '#3B82F6') : colors.chipBorder}44`,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeQuery.isPending ? (
        <p className="px-5 py-12 text-center" style={{ color: colors.text2 }}>
          Đang tải dữ liệu lệnh…
        </p>
      ) : activeQuery.isError ? (
        <ErrorState onAction={retry} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Clock size={44} color={colors.borderSolid} />
          <p style={{ color: colors.text3, fontSize: 14 }}>
            {tab === 'open' ? 'Không có lệnh đang mở' : 'Chưa có lịch sử giao dịch'}
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              colors={colors}
              canCancel={
                canCancelOrders &&
                tab === 'open' &&
                (order.status === 'open' || order.status === 'partial')
              }
              isCancelling={cancelMutation.isPending}
              onCancel={() =>
                void cancelMutation.mutateAsync({
                  orderId: order.id,
                  idempotencyKey: idempotencyKey(order.id),
                })
              }
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

function OrderRow({
  order,
  colors,
  canCancel,
  isCancelling,
  onCancel,
}: {
  order: TradingOrder;
  colors: ReturnType<typeof useThemeColors>;
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}) {
  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const fillPercent = order.amount > 0 ? (order.filled / order.amount) * 100 : 0;
  const isBuy = order.side === 'buy';

  return (
    <div className="px-5 py-3" style={{ borderBottom: `1px solid ${colors.divider}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>{order.symbol}</span>
          <span
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
              background: isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: isBuy ? '#10B981' : '#EF4444',
            }}
          >
            {isBuy ? 'MUA' : 'BÁN'}
          </span>
          <span
            className="px-2 py-1 rounded text-xs font-semibold"
            style={{ background: colors.surface3, color: colors.text2 }}
          >
            {TYPE_LABELS[order.type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <StatusIcon size={14} color={status.color} />
          <span style={{ color: status.color, fontSize: 12, fontWeight: 600 }}>{status.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p style={{ color: colors.text3, fontSize: 12 }}>Giá</p>
          <p style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace' }}>
            {fmtUsd(order.price)}
          </p>
        </div>
        <div>
          <p style={{ color: colors.text3, fontSize: 12 }}>Số lượng</p>
          <p style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace' }}>
            {order.amount.toFixed(6)}
          </p>
        </div>
        <div>
          <p style={{ color: colors.text3, fontSize: 12 }}>Đã khớp</p>
          <p style={{ color: '#10B981', fontSize: 13, fontFamily: 'monospace' }}>
            {order.filled.toFixed(6)} ({Math.min(fillPercent, 100).toFixed(0)}%)
          </p>
        </div>
        <div>
          <p style={{ color: colors.text3, fontSize: 12 }}>Phí</p>
          <p style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace' }}>
            {fmtUsd(order.fee)}
          </p>
        </div>
        <div className="col-span-2">
          <p style={{ color: colors.text3, fontSize: 12 }}>Thời gian</p>
          <p style={{ color: colors.text2, fontSize: 12 }}>
            {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
      {order.status === 'partial' && (
        <div className="mt-2 h-1.5 rounded-full" style={{ background: colors.borderSolid }}>
          <div
            className="h-full rounded-full"
            style={{ background: '#10B981', width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      )}
      {canCancel && (
        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="w-full h-9 mt-3 rounded-xl font-semibold"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444',
            fontSize: 13,
          }}
        >
          {isCancelling ? 'Đang hủy…' : 'Hủy lệnh'}
        </button>
      )}
    </div>
  );
}
