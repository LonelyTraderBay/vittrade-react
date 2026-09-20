/**
 * ══════════════════════════════════════════════════════════════════
 *  ORDER RECEIPT PAGE — Sprint 2A
 * ══════════════════════════════════════════════════════════════════
 *  Full order receipt after successful placement
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  CheckCircle, Copy, Share2, ChevronRight, Clock,
  AlertTriangle, FileText, ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtPrice, fmtAmount } from '../../data/formatNumber';

interface OrderReceiptData {
  orderId: string;
  symbol: string;
  baseAsset: string;
  side: 'buy' | 'sell';
  orderType: string;
  price: number;
  amount: number;
  total: number;
  fee: number;
  feeRate: string;
  timestamp: string;
  status: 'submitted' | 'pending' | 'partially_filled';
  tpPrice?: number;
  slPrice?: number;
  estimatedFill?: string;
  slippage?: number;
}

export function OrderReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const [showShare, setShowShare] = useState(false);

  // Get order data from navigation state
  const order: OrderReceiptData = (location.state as any)?.order ?? {
    orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    side: 'buy',
    orderType: 'Giới hạn',
    price: 67543.21,
    amount: 0.015,
    total: 1013.15,
    fee: 0.96,
    feeRate: '0.095% (VIP 1, -5%)',
    timestamp: new Date().toLocaleString('vi-VN'),
    status: 'submitted',
    tpPrice: 72000,
    slPrice: 65000,
    estimatedFill: '< 2 phút',
  };

  const sideColor = order.side === 'buy' ? '#10B981' : '#EF4444';

  const handleCopyId = () => {
    navigator.clipboard?.writeText(order.orderId);
    actionToast.success(TOAST.COPY.withLabel('Order ID'));
  };

  return (
    <PageLayout variant="flush">
      <Header title="Chi tiết lệnh" back />
      <PageContent grow>
        {/* Success animation area */}
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: `${sideColor}15`,
              boxShadow: `0 0 0 8px ${sideColor}08`,
            }}>
            <CheckCircle size={32} color={sideColor} />
          </div>
          <div className="text-center">
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
              Đặt lệnh thành công!
            </p>
            <p style={{ color: c.text2, fontSize: 13 }}>
              Lệnh {order.side === 'buy' ? 'Mua' : 'Bán'} {order.symbol} đang được xử lý
            </p>
          </div>
        </div>

        {/* Order summary card */}
        <TrCard rounded="md" className="p-4 mx-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3"
            style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: `${sideColor}15`,
                  color: sideColor,
                }}>
                {order.side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
              <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{order.symbol}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.08)' }}>
              <Clock size={11} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                {order.status === 'submitted' ? 'Đã gửi' : 'Đang xử lý'}
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div className="flex flex-col gap-2.5">
            <Row label="Order ID" value={order.orderId} trailing={
              <button onClick={handleCopyId} className="ml-1"><Copy size={12} color={c.text3} /></button>
            } />
            <Row label="Loại lệnh" value={order.orderType} />
            <Row label="Giá" value={order.orderType === 'Thị trường' ? 'Giá thị trường' : fmtUsd(order.price)} />
            <Row label="Khối lượng" value={`${fmtAmount(order.amount, 6)} ${order.baseAsset}`} />
            <div className="h-px" style={{ background: c.divider }} />
            <Row label="Thành tiền" value={fmtUsd(order.total)} highlight />
            <Row label="Phí giao dịch" value={`${fmtUsd(order.fee)} (${order.feeRate})`} />
            {order.estimatedFill && (
              <Row label="Thời gian ước tính" value={order.estimatedFill} />
            )}
            {order.slippage !== undefined && (
              <Row label="Trượt giá ước tính" value={`${order.slippage.toFixed(2)}%`} />
            )}
            <Row label="Thời gian đặt" value={order.timestamp} />
          </div>

          {/* TP/SL section */}
          {(order.tpPrice || order.slPrice) && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Quản lý rủi ro
              </p>
              <div className="flex gap-3">
                {order.tpPrice && (
                  <div className="flex-1 rounded-lg p-2.5"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Take Profit</p>
                    <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtPrice(order.tpPrice)}
                    </p>
                  </div>
                )}
                {order.slPrice && (
                  <div className="flex-1 rounded-lg p-2.5"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>Stop Loss</p>
                    <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtPrice(order.slPrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TrCard>

        {/* Warning */}
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.5 }}>
            Lệnh có thể bị khớp 1 phần hoặc hủy nếu giá thay đổi nhanh. Kiểm tra trạng thái tại Lệnh đang mở.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-2 mx-5 mt-4">
          <button
            onClick={() => navigate(`${prefix}/trade/orders-history`)}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} color={c.text2} />
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Xem lệnh đang mở</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>

      <StickyFooter>
        <div className="flex gap-3 px-5 pb-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
          >
            <Share2 size={16} color={c.text2} />
            <span style={{ color: c.text2, fontSize: 14, fontWeight: 600 }}>Chia sẻ</span>
          </button>
          <button
            onClick={() => navigate(`${prefix}/trade/${order.symbol.replace('/', '-').toLowerCase()}`)}
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

function Row({ label, value, highlight, trailing }: {
  label: string; value: string; highlight?: boolean; trailing?: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: c.text3, fontSize: 12 }}>{label}</span>
      <div className="flex items-center">
        <span style={{
          color: highlight ? c.text1 : c.text2,
          fontSize: highlight ? 14 : 12,
          fontWeight: highlight ? 700 : 500,
          fontFamily: 'monospace',
        }}>
          {value}
        </span>
        {trailing}
      </div>
    </div>
  );
}
