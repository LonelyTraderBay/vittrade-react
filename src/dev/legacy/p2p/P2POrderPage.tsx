import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import {
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Flag,
  Lock,
  Upload,
  X,
  Shield,
  QrCode,
  CopyCheck,
  ArrowDownToLine,
  ExternalLink,
  FileCheck,
  UserX,
  HelpCircle,
  Users,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CTAButton } from '@/shared/ui/CTAButton';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { fmtVnd, fmtAmount } from '@/shared/lib/formatNumber';
import { φ } from '@/shared/lib/golden';
import { TrCard } from '@/shared/ui/TrCard';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { TOAST } from '@/shared/constants/toastMessages';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { useSheetAnalytics } from '@/dev/legacy/hooks/useSheetAnalytics';
import { ErrorState } from '@/shared/ui/ErrorState';
import {
  useP2PMarkPaidMutation,
  useP2POrderQuery,
  useP2PReleaseOrderMutation,
  useP2PReleaseChallengeMutation,
  useP2PReleaseVerificationMutation,
  type P2POrderStatus,
} from '@/features/p2p';

/* ═══════════════════════════════════════════════════════════
   QR Code Visual Component (simulated pattern for prototype)
   ═══════════════════════════════════════════════════════════ */
function QRCodeVisual({
  data,
  size = 140,
  color = '#000',
}: {
  data: string;
  size?: number;
  color?: string;
}) {
  // Deterministic pseudo-random pattern from data string
  const seed = data.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gridSize = 21;
  const cellSize = size / gridSize;

  const cells: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    cells[r] = [];
    for (let col = 0; col < gridSize; col++) {
      // Fixed position markers (3 corners)
      const inTopLeft = r < 7 && col < 7;
      const inTopRight = r < 7 && col >= gridSize - 7;
      const inBottomLeft = r >= gridSize - 7 && col < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const localR = inTopLeft ? r : inBottomLeft ? r - (gridSize - 7) : r;
        const localC = inTopLeft ? col : inTopRight ? col - (gridSize - 7) : col;
        // Classic QR finder pattern
        const isOuter = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const isInner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        cells[r][col] = isOuter || isInner;
      } else {
        // Pseudo-random data area
        const hash = (seed * (r * gridSize + col + 1) * 31) % 100;
        cells[r][col] = hash < 42;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx={4} />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Transaction Timeline Component
   ═══════════════════════════════════════════════════════════ */
interface TimelineEvent {
  id: string;
  label: string;
  description?: string;
  time: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  icon: React.ElementType;
}

function TransactionTimeline({ events }: { events: TimelineEvent[] }) {
  const c = useThemeColors();

  const statusStyles: Record<string, { bg: string; color: string; border: string; line: string }> =
    {
      completed: { bg: c.buyAlpha10, color: c.buy, border: c.buy, line: c.buy },
      active: { bg: c.primaryAlpha12, color: c.primary, border: c.primary, line: c.primary },
      pending: { bg: c.surface2, color: c.text3, border: c.borderSolid, line: c.borderSolid },
      error: { bg: c.sellAlpha10, color: c.sell, border: c.sell, line: c.sell },
    };

  return (
    <div className="flex flex-col">
      {events.map((event, i) => {
        const s = statusStyles[event.status];
        const Icon = event.icon;
        const isLast = i === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Dot + Line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
              >
                <Icon size={13} color={s.color} />
              </motion.div>
              {!isLast && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.1 + 0.15, duration: 0.25 }}
                  className="w-0.5 flex-1 origin-top"
                  style={{ background: s.line, minHeight: 20, opacity: 0.4 }}
                />
              )}
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.05, duration: 0.3 }}
              className="flex-1 pb-4"
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    color: event.status === 'pending' ? c.text3 : c.text1,
                    fontSize: φ.sm,
                    fontWeight: 600,
                  }}
                >
                  {event.label}
                </span>
                <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>
                  {event.time}
                </span>
              </div>
              {event.description && (
                <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>{event.description}</p>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════
   Countdown Timer
   ═════════════════════════════════════════════════ */
function CountdownTimer({ seconds: initSec, onExpire }: { seconds: number; onExpire: () => void }) {
  const c = useThemeColors();
  const [seconds, setSeconds] = useState(initSec);
  const onExpireRef = React.useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 180;
  const pct = (seconds / initSec) * 100;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: c.warnAlpha15, maxWidth: 80 }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: isUrgent ? c.sell : c.warn }}
        />
      </div>
      <span
        style={{
          color: isUrgent ? c.sell : c.warn,
          fontWeight: 700,
          fontFamily: 'monospace',
          fontSize: 16,
        }}
      >
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

function getInitialOrderStep(
  status: P2POrderStatus | undefined,
): 'payment' | 'confirm' | 'complete' | 'cancelled' | 'expired' {
  switch (status) {
    case 'pending_payment':
      return 'payment';
    case 'paid':
      return 'confirm';
    case 'released':
      return 'complete';
    case 'cancelled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    default:
      return 'payment';
  }
}

/* ═════════════════════════════════════════════════
   P2P Order Page (Enhanced)
   ═════════════════════════════════════════════════ */
export function P2POrderPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError, hapticWarning } = useHaptic();
  const { orderId } = useParams();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useP2POrderQuery(orderId);
  const markPaidMutation = useP2PMarkPaidMutation(orderId);
  const releaseMutation = useP2PReleaseOrderMutation(orderId);
  const releaseChallengeMutation = useP2PReleaseChallengeMutation(orderId);
  const releaseVerificationMutation = useP2PReleaseVerificationMutation(orderId);

  const [step, setStep] = useState<'payment' | 'confirm' | 'complete' | 'cancelled' | 'expired'>(
    'payment',
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [releaseTyped, setReleaseTyped] = useState('');
  const [releaseCode, setReleaseCode] = useState('');
  const [releaseChallengeId, setReleaseChallengeId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(true);

  /* ─── Scroll lock now handled by BottomSheetV2 internally ─── */

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onPinSheetOpen } = useSheetAnalytics('p2p-order-pin-confirm');

  /* ─── Optimistic Update Refs ─── */
  // Reset all state when navigating between different orders
  useEffect(() => {
    setStep(getInitialOrderStep(order?.status));
    setCopiedField(null);
    setShowPinConfirm(false);
    setReleaseTyped('');
    setReleaseCode('');
    setReleaseChallengeId(null);
    setShowQR(true);
  }, [orderId, order?.status]);

  /* ─── Enhanced Copy with Toast ─── */
  const handleCopy = useCallback(
    (text: string, field: string, label?: string) => {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedField(field);
      actionToast.success(label ? TOAST.COPY.withLabel(label) : TOAST.COPY.DEFAULT, {
        haptic: 'selection',
      });
      setTimeout(() => setCopiedField(null), 2500);
    },
    [actionToast],
  );

  /* ─── Copy All Payment Info ─── */
  const handleCopyAll = useCallback(() => {
    if (!order?.paymentInfo) return;
    const allText = [
      `Ngân hàng: ${order.paymentInfo.bankName}`,
      `Số TK: ${order.paymentInfo.accountNumber}`,
      `Tên TK: ${order.paymentInfo.accountName}`,
      `Số tiền: ${fmtVnd(order.total)} VND`,
      `Nội dung: VITTA ${order.id.toUpperCase()}`,
    ].join('\n');
    navigator.clipboard.writeText(allText).catch(() => {});
    actionToast.success(TOAST.COPY.ALL_PAYMENT, { haptic: 'success' });
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2500);
  }, [order, actionToast]);

  const handleExpire = () => {
    setStep('expired');
    hapticError();
  };

  const handleMarkPaid = async () => {
    if (markPaidMutation.isPending) return;
    try {
      await markPaidMutation.mutateAsync();
      setStep('confirm');
      hapticWarning();
      toast.success(TOAST.P2P.PAYMENT_MARKED, { duration: 3000 });
    } catch {
      actionToast.error('Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại.');
    }
  };

  const handleComplete = () => {
    if (!order) return;
    setStep('complete');
    setShowPinConfirm(false);
    hapticSuccess();
    setTimeout(() => navigate(`${prefix}/p2p/order/rate/${order.id}`), 800);
  };

  const statusMap = {
    payment: { label: 'Chờ thanh toán', color: c.warn, step: 1 },
    confirm: { label: 'Đã thanh toán — Chờ xác nhận', color: c.primary, step: 2 },
    complete: { label: 'Hoàn thành', color: c.buy, step: 3 },
    cancelled: { label: 'Đã hủy', color: c.sell, step: 0 },
    expired: { label: 'Đã hết hạn', color: '#6B7280', step: 0 },
  };
  const current = statusMap[step];

  /* Legacy biometric handler is intentionally disabled; release uses server-backed MFA below.

  const handleReleaseWithBiometric = async () => {
    if (releaseTyped !== 'RELEASE') return;
    if (releaseMutation.isPending) return;
    if (ok) {
      try {
        await releaseMutation.mutateAsync();
        handleComplete();
      } catch {
        actionToast.error('Không thể giải phóng Escrow. Vui lòng thử lại.');
      }
    }
  };

  */

  const handleReleaseWithSecurityChallenge = async () => {
    if (releaseTyped !== 'RELEASE' || releaseMutation.isPending) return;
    if (!releaseChallengeId) {
      try {
        const challenge = await releaseChallengeMutation.mutateAsync();
        setReleaseChallengeId(challenge.id);
        setReleaseCode('');
      } catch {
        actionToast.error('KhÃ´ng thá»ƒ táº¡o phiÃªn xÃ¡c minh. Vui lÃ²ng thá»­ láº¡i.');
      }
      return;
    }
    if (!/^\d{6}$/.test(releaseCode)) {
      actionToast.error('Vui lÃ²ng nháº­p mÃ£ 2FA gá»“m 6 chá»¯ sá»‘.');
      return;
    }
    try {
      const verification = await releaseVerificationMutation.mutateAsync({
        challengeId: releaseChallengeId,
        code: releaseCode,
      });
      await releaseMutation.mutateAsync({
        verificationToken: verification.verificationToken,
        idempotencyKey: crypto.randomUUID(),
      });
      handleComplete();
    } catch {
      actionToast.error('MÃ£ 2FA khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.');
    }
  };

  if (orderLoading) {
    return (
      <PageLayout>
        <Header title="Đơn P2P" subtitle="Escrow · P2P" back />
        <PageContent>
          <div className="py-16 text-center" style={{ color: c.text2 }}>
            Đang tải đơn P2P…
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (orderError || !order) {
    return (
      <PageLayout>
        <Header title="Đơn P2P" subtitle="Escrow · P2P" back />
        <PageContent>
          <ErrorState
            title="Không thể tải đơn P2P"
            onAction={() => {
              void refetchOrder();
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  /* ─── Build Timeline Events ─── */
  const buildTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const createdTime = order.createdAt.split(' ')[1]?.slice(0, 5) || '—';

    // 1. Order created
    events.push({
      id: 'created',
      label: 'Đơn hàng đã tạo',
      description: `${order.type === 'buy' ? 'Mua' : 'Bán'} ${fmtAmount(order.amount)} ${order.asset} · Escrow đã khóa`,
      time: createdTime,
      status: 'completed',
      icon: FileCheck,
    });

    // 2. Payment step
    if (step === 'payment') {
      events.push({
        id: 'payment',
        label: 'Chờ thanh toán',
        description: `Chuyển ${fmtVnd(order.total)} VND qua ${order.paymentMethod}`,
        time: 'Đang chờ',
        status: 'active',
        icon: Clock,
      });
      events.push({
        id: 'confirm_pending',
        label: 'Xác nhận thanh toán',
        time: '—',
        status: 'pending',
        icon: Shield,
      });
      events.push({
        id: 'release_pending',
        label: 'Giải phóng crypto',
        time: '—',
        status: 'pending',
        icon: Lock,
      });
    }

    if (step === 'confirm') {
      const paidTime =
        order.paidAt?.split(' ')[1]?.slice(0, 5) ||
        createdTime.replace(
          /(\d+):(\d+)/,
          (_, h, m) => `${h}:${String(parseInt(m) + 5).padStart(2, '0')}`,
        );
      events.push({
        id: 'payment_done',
        label: 'Đã thanh toán',
        description: `${fmtVnd(order.total)} VND qua ${order.paymentMethod}`,
        time: paidTime,
        status: 'completed',
        icon: CheckCircle,
      });
      events.push({
        id: 'confirm_active',
        label: 'Chờ merchant xác nhận',
        description: `${order.merchant} đang kiểm tra thanh toán`,
        time: 'Đang chờ',
        status: 'active',
        icon: Shield,
      });
      events.push({
        id: 'release_pending',
        label: 'Giải phóng crypto',
        time: '—',
        status: 'pending',
        icon: Lock,
      });
    }

    if (step === 'complete') {
      const paidTime = order.paidAt?.split(' ')[1]?.slice(0, 5) || '—';
      const releasedTime = order.releasedAt?.split(' ')[1]?.slice(0, 5) || '—';
      events.push({
        id: 'payment_done',
        label: 'Đã thanh toán',
        description: `${fmtVnd(order.total)} VND qua ${order.paymentMethod}`,
        time: paidTime,
        status: 'completed',
        icon: CheckCircle,
      });
      events.push({
        id: 'confirmed',
        label: 'Merchant đã xác nhận',
        description: `${order.merchant} xác nhận nhận tiền`,
        time: releasedTime,
        status: 'completed',
        icon: Shield,
      });
      events.push({
        id: 'released',
        label: 'Crypto đã giải phóng',
        description: `+${fmtAmount(order.amount)} ${order.asset} vào ví của bạn`,
        time: releasedTime,
        status: 'completed',
        icon: CheckCircle,
      });
    }

    if (step === 'cancelled') {
      events.push({
        id: 'cancelled',
        label: 'Đơn hàng đã hủy',
        description: order.cancelReason || 'Đã hủy bởi người dùng',
        time: order.cancelledAt?.split(' ')[1]?.slice(0, 5) || '—',
        status: 'error',
        icon: X,
      });
      events.push({
        id: 'refund',
        label: 'Escrow đã hoàn trả',
        description: `${fmtAmount(order.escrowAmount)} ${order.asset} trả về merchant`,
        time: order.cancelledAt?.split(' ')[1]?.slice(0, 5) || '—',
        status: 'completed',
        icon: ArrowDownToLine,
      });
    }

    if (step === 'expired') {
      events.push({
        id: 'expired',
        label: 'Đơn hàng hết hạn',
        description: 'Quá thời gian thanh toán cho phép (15 phút)',
        time: order.expiresAt.split(' ')[1]?.slice(0, 5) || '—',
        status: 'error',
        icon: Clock,
      });
      events.push({
        id: 'refund',
        label: 'Escrow đã hoàn trả',
        description: `${fmtAmount(order.escrowAmount)} ${order.asset} trả về merchant`,
        time: order.expiresAt.split(' ')[1]?.slice(0, 5) || '—',
        status: 'completed',
        icon: ArrowDownToLine,
      });
    }

    return events;
  };

  // QR data string
  const qrData = order.paymentInfo
    ? `${order.paymentInfo.bankName}|${order.paymentInfo.accountNumber}|${order.paymentInfo.accountName}|${order.total}|VITTA${order.id.toUpperCase()}`
    : order.orderNumber;

  return (
    <PageLayout>
      <Header title="Chi tiết đơn hàng" subtitle="Đơn hàng · P2P" back />

      {/* Status Banner */}
      <div
        className="flex items-center justify-between py-3"
        style={{ background: current.color + '12', borderBottom: `1px solid ${current.color}25` }}
      >
        <span style={{ color: current.color, fontSize: φ.sm, fontWeight: 600 }}>
          {current.label}
        </span>
        {step === 'payment' && <CountdownTimer seconds={900} onExpire={handleExpire} />}
        {step === 'confirm' && <CountdownTimer seconds={1800} onExpire={handleExpire} />}
      </div>

      {/* Stepper */}
      {step !== 'cancelled' && step !== 'expired' && (
        <div className="flex items-center gap-2 py-4">
          {['Đặt lệnh', 'Thanh toán', 'Nhận tiền'].map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2"
              style={{ flex: i < 2 ? 1 : undefined }}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i < current.step ? c.primary : c.surface2,
                    color: i < current.step ? '#fff' : c.text3,
                    border: `1.5px solid ${i < current.step ? c.primary : c.borderSolid}`,
                  }}
                >
                  {i < current.step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ color: i < current.step ? c.primary : c.text3, fontSize: 10 }}>
                  {s}
                </span>
              </div>
              {i < 2 && (
                <div
                  className="flex-1 h-0.5 mb-4"
                  style={{ background: i < current.step - 1 ? c.primary : c.borderSolid }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <PageContent gap="default">
        {/* ═══ Anti-Scam Safety Banner (persistent) ═══ */}
        {(step === 'payment' || step === 'confirm') && (
          <div
            className="rounded-xl p-3"
            style={{ background: c.sellAlpha10, border: `1px solid ${c.sellAlpha15}` }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: c.sellAlpha10 }}
              >
                <Shield size={16} color={c.sell} />
              </div>
              <div className="flex-1">
                <p style={{ color: c.sell, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                  Lưu ý an toàn giao dịch P2P
                </p>
                <ul
                  style={{
                    color: '#F87171',
                    fontSize: 11,
                    lineHeight: 1.7,
                    margin: 0,
                    paddingLeft: 14,
                  }}
                >
                  <li>Không giao dịch ngoài nền tảng</li>
                  <li>Chỉ nhấn "Đã thanh toán" khi đã chuyển khoản thật</li>
                  <li>Không chia sẻ mã OTP hoặc mật khẩu cho bất kỳ ai</li>
                  <li>Báo cáo ngay nếu bị yêu cầu làm điều bất thường</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Escrow Info */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: c.buyAlpha10, border: `1px solid ${c.buyAlpha15}` }}
        >
          <Lock size={16} color={c.buy} />
          <div className="flex-1">
            <p style={{ color: c.buy, fontSize: φ.xs, fontWeight: 600 }}>
              Escrow: {fmtAmount(order.escrowAmount)} {order.asset} đã khóa
            </p>
            <p style={{ color: c.text3, fontSize: 10 }}>
              Tài sản được bảo vệ cho đến khi xác nhận thanh toán
            </p>
          </div>
          <button
            onClick={() => {
              navigate(`${prefix}/p2p/escrow/${order.id}`);
              hapticSelection();
            }}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: c.buyAlpha10, minHeight: 28 }}
          >
            <span style={{ color: c.buy, fontSize: 10, fontWeight: 600 }}>Chi tiết</span>
            <ChevronRight size={10} color={c.buy} />
          </button>
        </div>

        {/* Auto-Release Banner (confirm step) */}
        {step === 'confirm' && (
          <div
            className="rounded-xl p-3"
            style={{ background: c.primaryAlpha08, border: `1px solid ${c.primaryAlpha12}` }}
          >
            <div className="flex items-start gap-2">
              <Clock size={14} color={c.primary} className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: c.primary, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Auto-release đang hoạt động
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                  Nếu merchant không xác nhận trong 30 phút, coin sẽ tự động được giải phóng cho
                  bạn.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Info */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Đơn hàng</h3>
            <button
              onClick={() => handleCopy(order.orderNumber, 'orderNum', 'mã đơn')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                background: copiedField === 'orderNum' ? 'rgba(16,185,129,0.1)' : c.surface2,
                color: copiedField === 'orderNum' ? '#10B981' : c.text2,
              }}
            >
              {copiedField === 'orderNum' ? <CopyCheck size={10} /> : <Copy size={10} />}
              {order.orderNumber}
            </button>
          </div>
          {[
            {
              label: 'Giao dịch',
              value: `${order.type === 'buy' ? 'Mua' : 'Bán'} ${fmtAmount(order.amount)} ${order.asset}`,
              highlight: true,
            },
            { label: 'Giá', value: `${fmtVnd(order.price)} VND/${order.asset}` },
            {
              label: 'Cần thanh toán',
              value: `${fmtVnd(order.total)} ${order.currency}`,
              highlight: true,
            },
            { label: 'Thanh toán qua', value: order.paymentMethod },
            { label: 'Người bán', value: order.merchant },
            {
              label: 'Phí',
              value: order.fee > 0 ? `${fmtAmount(order.fee)} ${order.asset}` : 'Miễn phí',
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-2"
              style={{ borderBottom: `1px solid ${c.divider}` }}
            >
              <span style={{ color: c.text2, fontSize: φ.sm }}>{row.label}</span>
              <span
                style={{
                  color: c.text1,
                  fontSize: φ.sm,
                  fontWeight: row.highlight ? 700 : 400,
                  fontFamily: row.highlight ? 'monospace' : 'inherit',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </TrCard>

        {/* ═══════════════════════════════════════════════
           Payment Info + QR Code + Auto-copy
           ═══════════════════════════════════════════════ */}
        {step === 'payment' && order.paymentInfo && (
          <TrCard className="p-4" accentBorder="rgba(59,130,246,0.2)">
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>
                <Shield size={14} className="inline mr-1" />
                Thông tin chuyển khoản
              </h3>
              {/* Copy All Button */}
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background:
                    copiedField === 'all' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.08)',
                  color: copiedField === 'all' ? '#10B981' : '#3B82F6',
                  border: `1px solid ${copiedField === 'all' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.2)'}`,
                  fontSize: 11,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {copiedField === 'all' ? <CopyCheck size={12} /> : <Copy size={12} />}
                {copiedField === 'all' ? 'Đã copy!' : 'Copy tất cả'}
              </button>
            </div>

            {/* QR Code Section */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowQR(!showQR);
                  hapticSelection();
                }}
                className="w-full flex items-center justify-between py-2 mb-2"
              >
                <div className="flex items-center gap-2">
                  <QrCode size={14} color="#3B82F6" />
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    Mã QR chuyển khoản
                  </span>
                </div>
                <span style={{ color: '#3B82F6', fontSize: φ.xs }}>
                  {showQR ? 'Thu gọn' : 'Hiển thị'}
                </span>
              </button>
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex flex-col items-center rounded-2xl p-4 mb-3"
                      style={{ background: c.surface2, border: `1px dashed ${c.borderSolid}` }}
                    >
                      <div
                        className="rounded-xl overflow-hidden mb-3 p-2"
                        style={{ background: '#fff' }}
                      >
                        <QRCodeVisual data={qrData} size={140} color="#1a1a2e" />
                      </div>
                      <p
                        style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 2 }}
                      >
                        Quét mã bằng app ngân hàng
                      </p>
                      <p style={{ color: c.text3, fontSize: 9 }}>
                        {order.paymentInfo.bankName} · {order.paymentInfo.accountName}
                      </p>
                      <button
                        onClick={() => {
                          hapticSelection();
                        }}
                        className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(59,130,246,0.08)',
                          color: '#3B82F6',
                          fontSize: φ.xs,
                          fontWeight: 600,
                        }}
                      >
                        <ExternalLink size={11} />
                        Mở app ngân hàng
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Payment Fields with Enhanced Copy */}
            {[
              { label: 'Ngân hàng', value: order.paymentInfo.bankName, field: 'bank' },
              { label: 'Số tài khoản', value: order.paymentInfo.accountNumber, field: 'account' },
              { label: 'Tên chủ TK', value: order.paymentInfo.accountName, field: 'name' },
              { label: 'Số tiền', value: `${fmtVnd(order.total)} VND`, field: 'amount' },
              { label: 'Nội dung CK', value: `VITTA ${order.id.toUpperCase()}`, field: 'content' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: `1px solid ${c.divider}` }}
              >
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text3, fontSize: 11 }}>{row.label}</p>
                  <p
                    style={{
                      color: c.text1,
                      fontSize:
                        row.field === 'account' || row.field === 'amount' || row.field === 'content'
                          ? φ.base
                          : φ.sm,
                      fontWeight:
                        row.field === 'account' || row.field === 'amount' || row.field === 'content'
                          ? 700
                          : 600,
                      fontFamily:
                        row.field === 'account' || row.field === 'content'
                          ? 'monospace'
                          : 'inherit',
                      letterSpacing: row.field === 'account' ? '0.5px' : undefined,
                    }}
                  >
                    {row.value}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleCopy(row.value, row.field, row.label.toLowerCase())}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg ml-2 flex-shrink-0"
                  style={{
                    background:
                      copiedField === row.field ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.1)',
                    color: copiedField === row.field ? '#10B981' : '#3B82F6',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {copiedField === row.field ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1"
                      >
                        <CopyCheck size={12} />
                        <span>Đã copy</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1"
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            ))}

            {/* Transfer Note Warning */}
            <div
              className="mt-3 rounded-xl p-3"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: '#D97706', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    Lưu ý quan trọng
                  </p>
                  <p style={{ color: '#D97706', fontSize: 11, lineHeight: 1.6 }}>
                    Nội dung chuyển khoản phải ghi chính xác:{' '}
                    <strong>VITTA {order.id.toUpperCase()}</strong>. Không ghi nội dung khác.
                  </p>
                </div>
              </div>
            </div>
          </TrCard>
        )}

        {/* Payment Proof — navigates to dedicated page */}
        {(step === 'payment' || step === 'confirm') && (
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                <Upload size={14} className="inline mr-1" />
                Bằng chứng thanh toán
              </h3>
              {step === 'payment' && (
                <button
                  onClick={() => navigate(`${prefix}/p2p/order/proof/${order.id}`)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                >
                  <Upload size={12} /> Tải lên
                </button>
              )}
            </div>
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              {step === 'payment'
                ? 'Tải ảnh chụp giao dịch ngân hàng trước khi xác nhận thanh toán'
                : 'Đang chờ merchant xác nhận'}
            </p>
          </TrCard>
        )}

        {/* ═══════════════════════════════════════════════
           Transaction Timeline
           ═══════════════════════════════════════════════ */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} color={c.text2} />
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Tiến trình giao dịch
            </h3>
          </div>
          <TransactionTimeline events={buildTimelineEvents()} />
        </TrCard>

        {/* Warning */}
        {(step === 'payment' || step === 'confirm') && (
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
              <p style={{ color: '#F87171', fontSize: 12, lineHeight: 1.6 }}>
                {step === 'payment'
                  ? 'Chuyển khoản xong mới nhấn "Đã thanh toán". Nhấn trước khi chuyển có thể bị mất tiền.'
                  : 'Chờ người bán xác nhận nhận tiền. Nếu quá lâu, bạn có thể khiếu nại.'}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled/Expired info */}
        {(step === 'cancelled' || step === 'expired') && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              {step === 'cancelled' ? (
                <X size={32} color="#EF4444" />
              ) : (
                <Clock size={32} color="#6B7280" />
              )}
            </div>
            <p
              style={{
                color: step === 'cancelled' ? '#EF4444' : '#6B7280',
                fontSize: φ.base,
                fontWeight: 700,
              }}
            >
              {step === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Đơn hàng đã hết hạn'}
            </p>
            {order.cancelReason && (
              <p style={{ color: c.text2, fontSize: φ.sm }}>Lý do: {order.cancelReason}</p>
            )}
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              Escrow {fmtAmount(order.escrowAmount)} {order.asset} đã được hoàn trả
            </p>
          </div>
        )}

        {/* Complete celebration */}
        {step === 'complete' && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)' }}
            >
              <CheckCircle size={32} color="#10B981" />
            </div>
            <p style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700 }}>
              Giao dịch hoàn thành!
            </p>
            <p style={{ color: c.text2, fontSize: φ.sm }}>
              +{fmtAmount(order.amount)} {order.asset} đã vào ví
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-auto">
          <CTAButton
            onClick={() => navigate(`${prefix}/p2p/chat/${order.id}`)}
            variant="ghost"
            bg={c.surface2}
            textColor={c.text2}
            fullWidth={false}
            className="flex-1"
            style={{ border: `1px solid ${c.borderSolid}`, fontSize: 15, boxShadow: 'none' }}
          >
            <MessageCircle size={18} /> Nhắn tin
          </CTAButton>
          {step === 'payment' && (
            <CTAButton
              onClick={handleMarkPaid}
              variant="success"
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15 }}
            >
              <CheckCircle size={16} /> Đã thanh toán
            </CTAButton>
          )}
          {step === 'confirm' && (
            <CTAButton
              onClick={() => setShowPinConfirm(true)}
              variant="primary"
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15 }}
            >
              <Clock size={16} /> Chờ xác nhận…
            </CTAButton>
          )}
          {step === 'complete' && (
            <CTAButton
              onClick={() => navigate(`${prefix}/p2p`)}
              variant="success"
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15 }}
            >
              Hoàn tất
            </CTAButton>
          )}
          {(step === 'cancelled' || step === 'expired') && (
            <CTAButton
              onClick={() => navigate(`${prefix}/p2p`)}
              variant="primary"
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15 }}
            >
              Quay lại P2P
            </CTAButton>
          )}
        </div>

        {/* Secondary actions */}
        {step === 'payment' && (
          <button
            onClick={() => navigate(`${prefix}/p2p/order/cancel/${order.id}`)}
            className="flex items-center justify-center gap-2 py-2"
            style={{ color: '#EF4444', fontSize: φ.sm }}
          >
            <X size={14} /> Hủy đơn hàng
          </button>
        )}
        {step === 'confirm' && (
          <button
            onClick={() => navigate(`${prefix}/p2p/dispute/${order.id}`)}
            className="flex items-center justify-center gap-2 py-2"
            style={{ color: '#EF4444', fontSize: φ.sm }}
          >
            <Flag size={14} /> Khiếu nại đơn hàng
          </button>
        )}

        {/* ═══ Dispute Shortcut Banner (Confirm step — prominent) ═══ */}
        {step === 'confirm' && (
          <TrCard className="p-3" accentBorder="rgba(239,68,68,0.2)">
            <button
              onClick={() => {
                navigate(`${prefix}/p2p/dispute/${order.id}`);
                hapticSelection();
              }}
              className="w-full flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <Flag size={14} color="#EF4444" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>Gặp vấn đề?</p>
                <p style={{ color: c.text3, fontSize: 10 }}>
                  Mở tranh chấp nếu merchant không xác nhận sau 30 phút
                </p>
              </div>
              <ChevronRight size={14} color="#EF4444" />
            </button>
          </TrCard>
        )}

        {/* ═══ Quick Actions Bar ═══ */}
        {(step === 'payment' || step === 'confirm') && (
          <TrCard className="p-3">
            <p
              style={{
                color: c.text3,
                fontSize: 9,
                fontWeight: 600,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              HÀNH ĐỘNG NHANH
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigate(`${prefix}/p2p/merchant/${order.merchantId || 'mc001'}`);
                  hapticSelection();
                }}
                className="flex-1 flex items-center gap-1.5 justify-center py-2 rounded-xl"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
              >
                <Users size={11} color={c.text2} />
                <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>Merchant</span>
              </button>
              <button
                onClick={() => {
                  navigate(`${prefix}/p2p/blacklist`);
                  hapticSelection();
                }}
                className="flex-1 flex items-center gap-1.5 justify-center py-2 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.04)',
                  border: '1px solid rgba(239,68,68,0.1)',
                }}
              >
                <UserX size={11} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>Chặn</span>
              </button>
              <button
                onClick={() => {
                  navigate(`${prefix}/p2p/guide`);
                  hapticSelection();
                }}
                className="flex-1 flex items-center gap-1.5 justify-center py-2 rounded-xl"
                style={{
                  background: 'rgba(139,92,246,0.04)',
                  border: '1px solid rgba(139,92,246,0.1)',
                }}
              >
                <BookOpen size={11} color="#8B5CF6" />
                <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>Hướng dẫn</span>
              </button>
              <button
                onClick={() => {
                  navigate(`${prefix}/support/help`);
                  hapticSelection();
                }}
                className="flex-1 flex items-center gap-1.5 justify-center py-2 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.04)',
                  border: '1px solid rgba(16,185,129,0.1)',
                }}
              >
                <HelpCircle size={11} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Hỗ trợ</span>
              </button>
            </div>
          </TrCard>
        )}
      </PageContent>

      {/* PIN Confirm Modal → BottomSheetV2 center — Destructive Typed Confirm */}
      <BottomSheetV2
        open={showPinConfirm}
        onClose={() => {
          setShowPinConfirm(false);
          setReleaseTyped('');
        }}
        variant="center"
        title="Xác nhận giải phóng Crypto"
        showHandle={false}
        ariaLabel="Xác nhận giải phóng crypto — hành động không thể hoàn tác"
        onAfterOpen={onPinSheetOpen}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <AlertTriangle size={28} color="#EF4444" />
          </div>

          <div className="text-center">
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Giải phóng {fmtAmount(order.escrowAmount)} {order.asset}?
            </p>
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
              Crypto sẽ được chuyển cho người mua ngay lập tức.
            </p>
          </div>

          {/* Destructive warning box */}
          <div
            className="w-full rounded-xl p-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <div className="flex items-start gap-2">
              <Shield size={14} color="#EF4444" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                  Hành động không thể hoàn tác
                </p>
                <ul
                  style={{
                    color: '#F87171',
                    fontSize: 11,
                    lineHeight: 1.7,
                    margin: 0,
                    paddingLeft: 14,
                  }}
                >
                  <li>Xác nhận rằng bạn đã nhận đủ tiền</li>
                  <li>Kiểm tra kỹ số tiền trong tài khoản ngân hàng</li>
                  <li>Không giải phóng nếu chưa nhận được tiền thật</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="w-full flex flex-col gap-2 rounded-xl p-3"
            style={{ background: c.surface2 }}
          >
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>Số tiền nhận</span>
              <span
                style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}
              >
                {fmtVnd(order.total)} VND
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>Giải phóng</span>
              <span
                style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}
              >
                {fmtAmount(order.escrowAmount)} {order.asset}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>Người mua</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {order.merchant}
              </span>
            </div>
          </div>

          {/* Typed confirmation — type "RELEASE" to unlock */}
          <div className="w-full">
            <p style={{ color: c.text2, fontSize: 12, marginBottom: 6, lineHeight: 1.5 }}>
              Nhập{' '}
              <span
                style={{
                  color: '#EF4444',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                }}
              >
                RELEASE
              </span>{' '}
              để xác nhận:
            </p>
            <div className="relative">
              <input
                type="text"
                value={releaseTyped}
                onChange={(e) => setReleaseTyped(e.target.value.toUpperCase())}
                placeholder="Nhập RELEASE"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl text-center"
                style={{
                  background: c.surface2,
                  border: `2px solid ${releaseTyped === 'RELEASE' ? '#EF4444' : c.borderSolid}`,
                  color: c.text1,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 3,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
              {releaseTyped === 'RELEASE' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle size={20} color="#EF4444" />
                </motion.div>
              )}
            </div>
            {releaseTyped.length > 0 && releaseTyped !== 'RELEASE' && (
              <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                {releaseTyped.length < 7
                  ? `Còn ${7 - releaseTyped.length} ký tự`
                  : 'Sai cụm từ — vui lòng nhập đúng RELEASE'}
              </p>
            )}
          </div>

          {/* Destructive confirm button — requires typed confirmation and server-backed MFA */}
          {releaseChallengeId && (
            <div className="w-full rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                Nhập mã {releaseChallengeMutation.data?.method === 'sms' ? 'SMS' : 'TOTP'} để xác
                nhận giải phóng escrow.
              </p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={releaseCode}
                onChange={(event) =>
                  setReleaseCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="••••••"
                aria-label="Mã 2FA giải phóng escrow"
                className="w-full rounded-xl px-4 py-3 text-center"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  color: c.text1,
                  fontFamily: 'monospace',
                  fontSize: 20,
                  letterSpacing: 8,
                  outline: 'none',
                }}
              />
            </div>
          )}

          <button
            onClick={handleReleaseWithSecurityChallenge}
            disabled={releaseTyped !== 'RELEASE'}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                releaseTyped === 'RELEASE'
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : c.surface2,
              color: releaseTyped === 'RELEASE' ? '#fff' : c.text3,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: releaseTyped === 'RELEASE' ? '0 4px 16px rgba(239,68,68,0.3)' : 'none',
              cursor: releaseTyped === 'RELEASE' ? 'pointer' : 'not-allowed',
              opacity: releaseTyped === 'RELEASE' ? 1 : 0.6,
            }}
          >
            <Lock size={16} />
            {releaseTyped === 'RELEASE' ? 'Xác nhận giải phóng Crypto' : 'Nhập RELEASE để mở khoá'}
          </button>

          <button
            onClick={() => {
              setShowPinConfirm(false);
              setReleaseTyped('');
            }}
            className="w-full py-3 text-center"
            style={{ color: c.text2, fontSize: 14, fontWeight: 600 }}
          >
            Hủy — Chưa nhận được tiền
          </button>
        </div>
      </BottomSheetV2>
    </PageLayout>
  );
}
