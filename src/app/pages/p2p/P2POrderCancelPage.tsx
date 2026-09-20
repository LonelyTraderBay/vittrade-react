import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { X, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_ORDER, P2P_ORDERS } from '../../data/mockData';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { φ } from '../../utils/golden';

const CANCEL_REASONS = [
  'Không muốn giao dịch nữa',
  'Đã tìm được giá tốt hơn',
  'Người bán không phản hồi',
  'Thông tin thanh toán không đúng',
  'Lý do khác',
];

export function P2POrderCancelPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticWarning } = useHaptic();
  const prefix = useRoutePrefix();
  const { orderId } = useParams();
  const order = (orderId ? P2P_ORDERS.find(o => o.id === orderId) : null) || P2P_ORDER;

  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!cancelReason) return;
    setIsSubmitting(true);
    hapticWarning();
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    navigate(`${prefix}/p2p/order/${order.id}`, { replace: true });
  };

  return (
    <PageLayout>
      <Header title="Hủy đơn hàng" subtitle="Đơn hàng · P2P" back />
        <div className="flex-1 px-5 py-5 flex flex-col gap-5">
          {/* Icon Hero */}
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <X size={28} color="#EF4444" />
            </div>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>Hủy đơn hàng?</p>
            <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', maxWidth: 280 }}>
              Vui lòng chọn lý do hủy. Hủy đơn quá nhiều có thể ảnh hưởng đến uy tín.
            </p>
          </div>

          {/* Order Summary */}
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>THÔNG TIN ĐƠN HÀNG</p>
            {[
              { label: 'Mã đơn', value: order.orderNumber },
              { label: 'Giao dịch', value: `${order.type === 'buy' ? 'Mua' : 'Bán'} ${fmtAmount(order.amount)} ${order.asset}` },
              { label: 'Tổng tiền', value: `${fmtVnd(order.total)} ${order.currency}` },
              { label: 'Merchant', value: order.merchant },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </TrCard>

          {/* Reason Selection */}
          <div>
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 12 }}>Lý do hủy</p>
            <div className="flex flex-col gap-2">
              {CANCEL_REASONS.map(reason => (
                <button key={reason} onClick={() => { setCancelReason(reason); hapticSelection(); }}
                  className="w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3"
                  style={{
                    background: cancelReason === reason ? 'rgba(239,68,68,0.06)' : c.surface2,
                    color: cancelReason === reason ? '#EF4444' : c.text2,
                    border: `1.5px solid ${cancelReason === reason ? 'rgba(239,68,68,0.3)' : c.borderSolid}`,
                    fontSize: 13,
                  }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: cancelReason === reason ? '#EF4444' : 'transparent',
                      border: `2px solid ${cancelReason === reason ? '#EF4444' : c.borderSolid}`,
                    }}>
                    {cancelReason === reason && <CheckCircle size={10} color="#fff" />}
                  </div>
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <TrCard className="p-3" accentBorder="rgba(245,158,11,0.2)">
            <div className="flex items-start gap-2">
              <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#D97706', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Lưu ý quan trọng</p>
                <p style={{ color: '#D97706', fontSize: 10, lineHeight: 1.6 }}>
                  Hủy đơn sẽ giải phóng {fmtAmount(order.escrowAmount)} {order.asset} từ Escrow trả về merchant.
                  Tỷ lệ hủy cao có thể bị giới hạn giao dịch.
                </p>
              </div>
            </div>
          </TrCard>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex gap-3">
            <CTAButton onClick={() => navigate(-1)} variant="ghost" bg={c.surface2} textColor={c.text2}
              fullWidth={false} className="flex-1" style={{ border: `1px solid ${c.borderSolid}`, boxShadow: 'none' }}>
              Quay lại
            </CTAButton>
            <CTAButton onClick={handleCancel} variant="danger" disabled={!cancelReason} loading={isSubmitting}
              fullWidth={false} className="flex-1">
              Xác nhận hủy
            </CTAButton>
          </div>
          <div style={{ height: 16 }} />
        </div>
    </PageLayout>
  );
}