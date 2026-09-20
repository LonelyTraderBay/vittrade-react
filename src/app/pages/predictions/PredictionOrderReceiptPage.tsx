/**
 * ══════════════════════════════════════════════════════════
 *  PredictionOrderReceiptPage — /markets/predictions/receipt/:orderId
 * ══════════════════════════════════════════════════════════
 *  07C: Chi tiết lệnh prediction market.
 *  Shows summary, timeline, related actions.
 *  Enterprise-level: transparent, auditable, no hype.
 *
 *  Features added:
 *  - Share receipt via deep link
 *  - Mock push notification when order fills
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Shield, Info, ArrowUp, ArrowDown, Copy, HelpCircle,
  Share2, Bell, X, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/states/EmptyState';
import { ModerationTimelineRow } from '../../components/arena/ArenaGovernance';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import {
  getPredictionOrderById, PREDICTION_ORDER_STATUS_CONFIG,
} from '../../data/predictionMockData';

/* ═══════════════════════════════════════════
   Mock Push Notification Banner
   ═══════════════════════════════════════════ */

interface FillNotificationProps {
  visible: boolean;
  shares: number;
  price: string;
  outcome: string;
  onDismiss: () => void;
}

function FillNotificationBanner({ visible, shares, price, outcome, onDismiss }: FillNotificationProps) {
  const c = useThemeColors();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="mb-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Bell size={16} color="#10B981" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} color={c.warn} />
                <span style={{ color: c.warn, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                  LỆNH KHỚP
                </span>
              </div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                {shares} shares "{outcome}" vừa khớp @ ${price}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                Vừa xong · Kiểm tra tiến trình bên dưới
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:opacity-70"
              style={{ background: c.surface2 }}
            >
              <X size={12} color={c.text3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   Main Receipt Page
   ═══════════════════════════════════════════ */

export function PredictionOrderReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const order = getPredictionOrderById(orderId || '');

  // Mock push notification state
  const [showFillNotification, setShowFillNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  // Simulate a fill notification for partially_filled or submitted orders
  useEffect(() => {
    if (!order || notificationDismissed) return;
    const canNotify = order.status === 'partially_filled' || order.status === 'submitted';
    if (!canNotify) return;

    const timer = setTimeout(() => {
      setShowFillNotification(true);
      hapticSuccess();
    }, 2500); // 2.5s delay to simulate real-time fill

    return () => clearTimeout(timer);
  }, [order, notificationDismissed]);

  const handleDismissNotification = () => {
    setShowFillNotification(false);
    setNotificationDismissed(true);
  };

  // Share receipt deep link
  const handleShareReceipt = () => {
    hapticSelection();
    // Mock deep link: in production this would be a real URL
    const deepLink = `tradeapp://predictions/receipt/${order?.id || ''}`;
    // Copy to clipboard simulation
    actionToast.success(TOAST.PREDICTIONS.RECEIPT_SHARED);
  };

  if (!order) {
    return (
      <PageLayout>
        <Header title="Chi tiết lệnh" subtitle="Biên lai · Prediction" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Lệnh không tồn tại hoặc đã bị xoá" />
      </PageLayout>
    );
  }

  const statusCfg = PREDICTION_ORDER_STATUS_CONFIG[order.status];
  const isBuy = order.side === 'buy';
  const fillPct = order.shares > 0 ? Math.round((order.filledShares / order.shares) * 100) : 0;

  // Mock notification data
  const mockFillShares = order.status === 'partially_filled' ? 25 : 10;
  const mockFillPrice = order.avgPrice > 0 ? order.avgPrice.toFixed(2) : order.price.toFixed(2);

  return (
    <PageLayout>
      <Header title="Chi tiết lệnh" subtitle="Biên lai · Prediction" back />
      <PageContent>
      <div className="flex flex-col gap-4 pt-3">

        {/* ─── Mock Push Notification ─── */}
        <FillNotificationBanner
          visible={showFillNotification}
          shares={mockFillShares}
          price={mockFillPrice}
          outcome={order.outcome}
          onDismiss={handleDismissNotification}
        />

        <div className="flex flex-col gap-4">

          {/* ─── Status + Order Type Hero ─── */}
          <TrCard className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg"
                style={{ background: isBuy ? c.buyAlpha10 : c.sellAlpha10, color: isBuy ? c.buy : c.sell, fontSize: φ.sm, fontWeight: 700 }}>
                {isBuy ? '↑ Buy' : '↓ Sell'}
              </span>
              <span className="px-3 py-1 rounded-lg"
                style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: φ.sm, fontWeight: 600 }}>
                {statusCfg.label}
              </span>
            </div>
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
              {order.outcome}
            </p>
            <p style={{ color: c.text3, fontSize: φ.xs }} className="truncate">
              {order.eventTitle}
            </p>
          </TrCard>

          {/* ─── Order Summary ─── */}
          <div>
            <SectionHeader title="Tổng quan lệnh" accent accentColor="#3B82F6" mb={8} />
            <TrCard className="p-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Loại lệnh', value: order.orderType === 'market' ? 'Market' : 'Limit' },
                  { label: 'Outcome', value: order.outcome },
                  { label: 'Shares', value: `${order.filledShares}/${order.shares}`, mono: true },
                  { label: 'Giá đặt', value: `$${order.price.toFixed(2)}`, mono: true },
                  ...(order.avgPrice > 0 ? [{ label: 'Giá khớp TB', value: `$${order.avgPrice.toFixed(2)}`, mono: true }] : []),
                  { label: 'Tổng giá trị', value: `$${order.total.toFixed(2)}`, mono: true },
                  { label: 'Phí (2%)', value: `$${order.fee.toFixed(2)}`, mono: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>{row.label}</span>
                    <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: (row as any).mono ? 'monospace' : 'inherit' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fill progress */}
              {order.status !== 'canceled' && order.status !== 'rejected' && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ color: c.text3, fontSize: 10 }}>Tiến trình khớp</span>
                    <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{fillPct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{
                      width: `${fillPct}%`,
                      background: fillPct === 100 ? c.buy : c.warn,
                      transition: 'width 0.4s ease-out',
                    }} />
                  </div>
                </div>
              )}
            </TrCard>
          </div>

          {/* ─── Timeline ─── */}
          <div>
            <SectionHeader title="Tiến trình" accent accentColor="#10B981" mb={8} />
            <TrCard className="p-4">
              {order.timeline.map((step, i) => (
                <ModerationTimelineRow
                  key={i}
                  label={step.label}
                  date={step.date}
                  done={step.done}
                  isLast={i === order.timeline.length - 1}
                />
              ))}
            </TrCard>
          </div>

          {/* ─── Timestamps ─── */}
          <TrCard className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Tạo lúc</span>
                <span style={{ color: c.text1, fontSize: φ.sm }}>{order.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Cập nhật</span>
                <span style={{ color: c.text1, fontSize: φ.sm }}>{order.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Mã lệnh</span>
                <button
                  onClick={() => { actionToast.success(TOAST.COPY.withLabel('mã lệnh')); hapticSelection(); }}
                  className="flex items-center gap-1.5 active:opacity-70"
                  style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace', minHeight: 28 }}>
                  {order.id.toUpperCase()} <Copy size={10} />
                </button>
              </div>
            </div>
          </TrCard>

          {/* ─── Share Receipt ─── */}
          <button
            onClick={handleShareReceipt}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2.5 active:opacity-70"
            style={{
              background: c.primaryAlpha12,
              border: `1.5px solid ${c.primaryAlpha12}`,
              color: c.primary,
              fontSize: φ.sm,
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            <Share2 size={14} />
            Chia sẻ chi tiết lệnh
          </button>

          {/* ─── Disclaimer ─── */}
          <TrCard className="p-3 flex items-start gap-2">
            <Shield size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
              Probability không phải certainty. Giá thị trường dự đoán phản ánh ước lượng cộng đồng và có thể thay đổi bất cứ lúc nào. Đây không phải lời khuyên đầu tư.
            </p>
          </TrCard>

          {/* ─── CTAs ─── */}
          <div className="flex flex-col gap-3">
            <CTAButton onClick={() => { navigate(`${prefix}/markets/predictions/event/${order.eventId}`); hapticSelection(); }}>
              Xem sự kiện
            </CTAButton>
            <button
              onClick={() => { navigate(`${prefix}/profile/predictions`); hapticSelection(); }}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:opacity-70"
              style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}>
              Xem danh mục
            </button>
          </div>

        </div>
      </div>
      </PageContent>
    </PageLayout>
  );
}