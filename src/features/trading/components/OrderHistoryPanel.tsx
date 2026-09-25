import { Download } from 'lucide-react';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtFee, fmtPrice } from '@/shared/lib/formatNumber';
import type { TradingOrder } from '../model/trading-types';

interface OrderHistoryPanelProps {
  orders: TradingOrder[];
  onSelectOrder: (order: TradingOrder) => void;
  onExportHistory: () => void;
}

export function OrderHistoryPanel({
  orders,
  onSelectOrder,
  onExportHistory,
}: OrderHistoryPanelProps) {
  const colors = useThemeColors();

  return (
    <PageContent gap="default">
      {orders.map((order) => (
        <TrCard
          key={order.id}
          rounded="sm"
          hover
          className="p-4"
          onClick={() => onSelectOrder(order)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded-md text-xs font-bold"
                style={{
                  background:
                    order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: order.side === 'buy' ? '#10B981' : '#EF4444',
                }}
              >
                {order.side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
              <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                {order.symbol}
              </span>
            </div>
            <span
              className="px-2 py-1 rounded-md text-xs font-semibold"
              style={{
                background:
                  order.status === 'filled'
                    ? 'rgba(16,185,129,0.1)'
                    : order.status === 'cancelled'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                color:
                  order.status === 'filled'
                    ? '#10B981'
                    : order.status === 'cancelled'
                      ? '#EF4444'
                      : '#F59E0B',
              }}
            >
              {order.status === 'filled'
                ? 'Đã khớp'
                : order.status === 'cancelled'
                  ? 'Đã hủy'
                  : 'Một phần'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: colors.text3, fontSize: 12 }}>Giá</p>
              <p
                style={{
                  color: colors.text1,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {fmtPrice(order.price)}
              </p>
            </div>
            <div>
              <p style={{ color: colors.text3, fontSize: 12 }}>Khối lượng</p>
              <p
                style={{
                  color: colors.text1,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {order.amount}
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: colors.text3, fontSize: 12 }}>Phí</p>
              <p
                style={{
                  color: colors.text1,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {fmtFee(order.fee)}
              </p>
            </div>
          </div>

          <p style={{ color: colors.text3, fontSize: 12, marginTop: 8 }}>{order.createdAt}</p>
        </TrCard>
      ))}

      <button
        type="button"
        onClick={onExportHistory}
        className="flex items-center justify-center gap-2 py-2 rounded-lg"
        style={{ color: colors.text3, fontSize: 12 }}
      >
        <Download size={12} />
        Xuất lịch sử giao dịch
      </button>
    </PageContent>
  );
}
