import React from 'react';
import { z } from 'zod';
import { AlertTriangle, CheckCircle, Clock, Copy, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout, StickyFooter } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { TOAST } from '@/shared/constants/toastMessages';
import { fmtAmount, fmtFee, fmtPrice, fmtUsd } from '@/shared/lib/formatNumber';

const orderReceiptSchema = z.object({
  orderId: z.string().min(1),
  symbol: z.string().min(1),
  baseAsset: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  orderType: z.string().min(1),
  price: z.number().finite().nonnegative(),
  amount: z.number().finite().positive(),
  total: z.number().finite().nonnegative(),
  fee: z.number().finite().nonnegative(),
  timestamp: z.string().min(1),
  status: z.enum(['open', 'filled', 'partial', 'cancelled', 'rejected']),
  tpPrice: z.number().finite().positive().optional(),
  slPrice: z.number().finite().positive().optional(),
});

type OrderReceiptData = z.infer<typeof orderReceiptSchema>;

const ORDER_STATUS_LABEL: Record<OrderReceiptData['status'], string> = {
  open: 'Đang mở',
  filled: 'Đã khớp',
  partial: 'Khớp một phần',
  cancelled: 'Đã hủy',
  rejected: 'Bị từ chối',
};

export function OrderReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const colors = useThemeColors();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const state = location.state as { order?: unknown } | null;
  const result = orderReceiptSchema.safeParse(state?.order);

  if (!result.success) {
    return (
      <PageLayout>
        <Header title="Chi tiết lệnh" back />
        <PageContent>
          <ErrorState
            title="Không có dữ liệu biên nhận"
            message="Hãy mở chi tiết từ một lệnh vừa đặt hoặc từ lịch sử giao dịch."
            actionLabel="Quay lại giao dịch"
            onAction={() => navigate(`${prefix}/trade`)}
          />
        </PageContent>
      </PageLayout>
    );
  }

  const order = result.data;
  const sideColor = order.side === 'buy' ? '#10B981' : '#EF4444';
  const formattedTimestamp = Number.isNaN(Date.parse(order.timestamp))
    ? order.timestamp
    : new Date(order.timestamp).toLocaleString('vi-VN');

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId);
      actionToast.success(TOAST.COPY.withLabel('Order ID'));
    } catch {
      actionToast.error('Không thể sao chép Order ID trên thiết bị này.');
    }
  };

  return (
    <PageLayout variant="flush">
      <Header title="Chi tiết lệnh" back />
      <PageContent grow>
        <div className="flex flex-col items-center py-6 gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${sideColor}15`, boxShadow: `0 0 0 8px ${sideColor}08` }}
          >
            <CheckCircle size={32} color={sideColor} />
          </div>
          <div className="text-center">
            <p style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>Chi tiết lệnh</p>
            <p style={{ color: colors.text2, fontSize: 13 }}>
              Lệnh {order.side === 'buy' ? 'Mua' : 'Bán'} {order.symbol}
            </p>
          </div>
        </div>

        <TrCard rounded="md" className="p-4 mx-5">
          <div
            className="flex items-center justify-between pb-3 mb-3"
            style={{ borderBottom: `1px solid ${colors.divider}` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: `${sideColor}15`, color: sideColor }}
              >
                {order.side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
              <span style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>
                {order.symbol}
              </span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.08)' }}
            >
              <Clock size={11} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Row
              label="Order ID"
              value={order.orderId}
              trailing={
                <button
                  type="button"
                  aria-label="Sao chép Order ID"
                  onClick={() => void handleCopyId()}
                  className="ml-1"
                >
                  <Copy size={12} color={colors.text3} />
                </button>
              }
            />
            <Row label="Loại lệnh" value={order.orderType} />
            <Row label="Giá" value={fmtPrice(order.price)} />
            <Row label="Khối lượng" value={`${fmtAmount(order.amount, 6)} ${order.baseAsset}`} />
            <div className="h-px" style={{ background: colors.divider }} />
            <Row label="Thành tiền" value={fmtUsd(order.total)} highlight />
            <Row label="Phí do máy chủ xác nhận" value={fmtFee(order.fee)} />
            <Row label="Thời gian đặt" value={formattedTimestamp} />
          </div>

          {(order.tpPrice || order.slPrice) && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <p style={{ color: colors.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Quản lý rủi ro
              </p>
              <div className="flex gap-3">
                {order.tpPrice && (
                  <RiskPrice label="Take Profit" price={order.tpPrice} color="#10B981" />
                )}
                {order.slPrice && (
                  <RiskPrice label="Stop Loss" price={order.slPrice} color="#EF4444" />
                )}
              </div>
            </div>
          )}
        </TrCard>

        <div
          className="mx-5 mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.5 }}>
            Lệnh có thể khớp một phần hoặc bị hủy nếu giá thay đổi nhanh. Trạng thái hiển thị theo
            phản hồi của máy chủ.
          </p>
        </div>
      </PageContent>

      <StickyFooter>
        <div className="flex gap-3 px-5 pb-2">
          <button
            type="button"
            onClick={() => navigate(`${prefix}/trade/orders-history`)}
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2"
            style={{ background: colors.surface2, border: `1px solid ${colors.borderSolid}` }}
          >
            <FileText size={16} color={colors.text2} />
            <span style={{ color: colors.text1, fontSize: 14, fontWeight: 600 }}>Lịch sử lệnh</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`${prefix}/trade/${order.symbol.replace('/', '-').toLowerCase()}`)
            }
            className="flex-[2] h-12 rounded-xl flex items-center justify-center font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${sideColor} 0%, ${order.side === 'buy' ? '#059669' : '#dc2626'} 100%)`,
              fontSize: 14,
            }}
          >
            Tiếp tục giao dịch
          </button>
        </div>
      </StickyFooter>
    </PageLayout>
  );
}

function RiskPrice({ label, price, color }: { label: string; price: number; color: string }) {
  return (
    <div
      className="flex-1 rounded-lg p-2.5"
      style={{ background: `${color}0F`, border: `1px solid ${color}26` }}
    >
      <p style={{ color, fontSize: 10, fontWeight: 600 }}>{label}</p>
      <p style={{ color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
        {fmtPrice(price)}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  trailing,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  trailing?: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: colors.text3, fontSize: 12 }}>{label}</span>
      <div className="flex items-center">
        <span
          style={{
            color: highlight ? colors.text1 : colors.text2,
            fontSize: highlight ? 14 : 12,
            fontWeight: highlight ? 700 : 500,
            fontFamily: 'monospace',
          }}
        >
          {value}
        </span>
        {trailing}
      </div>
    </div>
  );
}
