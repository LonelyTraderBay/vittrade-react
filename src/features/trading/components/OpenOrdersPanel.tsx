import { BarChart3, Download, Edit3, Shield, Target } from 'lucide-react';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtPrice } from '@/shared/lib/formatNumber';
import type { TradingOrder } from '../model/trading-types';

interface OpenOrdersPanelProps {
  orders: TradingOrder[];
  canWrite: boolean;
  cancelPending: boolean;
  onModifyOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onExportHistory: () => void;
}

export function OpenOrdersPanel({
  orders,
  canWrite,
  cancelPending,
  onModifyOrder,
  onCancelOrder,
  onExportHistory,
}: OpenOrdersPanelProps) {
  const colors = useThemeColors();

  return (
    <PageContent gap="default">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: colors.surface2 }}
          >
            <BarChart3 size={28} color={colors.borderSolid} />
          </div>
          <p style={{ color: colors.text3, fontSize: 14 }}>Không có lệnh đang mở</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <TrCard key={order.id} rounded="sm" hover className="p-4">
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
                  <span
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: colors.hoverBg, color: colors.text2 }}
                  >
                    {order.type}
                  </span>
                  {order.bracketMode && (
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}
                    >
                      Bracket
                    </span>
                  )}
                  {order.ocoLinked && (
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}
                    >
                      OCO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onModifyOrder(order.id)}
                    disabled={!canWrite}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                    style={{
                      background: 'rgba(59,130,246,0.08)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }}
                  >
                    <Edit3 size={10} />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelOrder(order.id)}
                    disabled={!canWrite || cancelPending}
                    data-testid={`cancel-order-${order.id}`}
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
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
                  <p style={{ color: colors.text3, fontSize: 12 }}>Đã khớp</p>
                  <p
                    style={{
                      color: colors.text1,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {order.filled}/{order.amount}
                  </p>
                </div>
              </div>

              {(order.bracketMode || order.ocoLinked) && order.tpPrice && order.slPrice && (
                <div
                  className="flex items-center gap-3 py-2 px-3 rounded-lg mb-2"
                  style={{
                    background: 'rgba(139,92,246,0.04)',
                    border: '1px solid rgba(139,92,246,0.1)',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Target size={10} color="#10B981" />
                    <span
                      style={{
                        color: '#10B981',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      TP {fmtPrice(order.tpPrice)}
                    </span>
                  </div>
                  <div style={{ width: 1, height: 12, background: colors.divider }} />
                  <div className="flex items-center gap-1">
                    <Shield size={10} color="#EF4444" />
                    <span
                      style={{
                        color: '#EF4444',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      SL {fmtPrice(order.slPrice)}
                    </span>
                  </div>
                  <span style={{ color: colors.text3, fontSize: 9, marginLeft: 'auto' }}>
                    {order.ocoLinked ? 'Linked' : 'Bracket'}
                  </span>
                </div>
              )}

              {order.status === 'partial' && (
                <div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: colors.surface3 }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: 'linear-gradient(90deg, #10B981, #34D399)',
                        width: `${(order.filled / order.amount) * 100}%`,
                      }}
                    />
                  </div>
                  <p style={{ color: colors.text3, fontSize: 12, marginTop: 4 }}>
                    Đã khớp {((order.filled / order.amount) * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              <p style={{ color: colors.text3, fontSize: 12, marginTop: 4 }}>{order.createdAt}</p>
            </TrCard>
          ))}
        </div>
      )}

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
