import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Lock, Unlock, Copy, CopyCheck, ExternalLink, Shield, ShieldCheck,
  Users, Clock, CheckCircle, AlertTriangle, ChevronRight,
  Eye, EyeOff, Key, UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { P2P_ORDERS, P2P_ORDER } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { TOAST } from '../../data/toastMessages';

/* ═══════════════════════════════════════════════════════════
   Mock Escrow Data — simulated on-chain escrow
   ═══════════════════════════════════════════════════════════ */
function generateEscrowAddress(orderId: string): string {
  const hash = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[(hash * (i + 1) * 7 + i * 13) % 16];
  }
  return addr;
}

function maskAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

interface EscrowSigner {
  id: string;
  role: 'buyer' | 'seller' | 'platform';
  label: string;
  address: string;
  hasSigned: boolean;
  signedAt?: string;
}

interface EscrowTimelineEvent {
  id: string;
  label: string;
  description?: string;
  time: string;
  status: 'completed' | 'active' | 'pending';
  icon: React.ElementType;
}

/* ═══════════════════════════════════════════════════════════
   Multi-Sig Progress Ring
   ═══════════════════════════════════════════════════════════ */
function MultiSigRing({ signed, total, size = 64 }: { signed: number; total: number; size?: number }) {
  const c = useThemeColors();
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (signed / total) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={c.surface2} strokeWidth={4}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10B981" strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700 }}>{signed}/{total}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Escrow Detail Page
   ═══════════════════════════════════════════════════════════ */
export function P2PEscrowDetailPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const { orderId } = useParams();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();

  const order = (orderId ? P2P_ORDERS.find(o => o.id === orderId) : null) || P2P_ORDER;
  const escrowAddress = generateEscrowAddress(order.id);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullAddress, setShowFullAddress] = useState(false);

  /* ─── Determine escrow status from order ─── */
  const isLocked = order.status === 'pending_payment' || order.status === 'paid' || order.status === 'disputed';
  const isReleased = order.status === 'released';
  const isCancelled = order.status === 'cancelled' || order.status === 'expired';

  /* ─── Multi-sig signers ─── */
  const signers: EscrowSigner[] = [
    {
      id: 'buyer',
      role: 'buyer',
      label: 'Người mua',
      address: generateEscrowAddress(order.id + '_buyer'),
      hasSigned: order.status === 'paid' || isReleased,
      signedAt: order.paidAt?.split(' ')[1]?.slice(0, 5),
    },
    {
      id: 'seller',
      role: 'seller',
      label: `Người bán (${order.merchant})`,
      address: generateEscrowAddress(order.id + '_seller'),
      hasSigned: isReleased,
      signedAt: order.releasedAt?.split(' ')[1]?.slice(0, 5),
    },
    {
      id: 'platform',
      role: 'platform',
      label: 'VitTrade Platform',
      address: generateEscrowAddress('platform_main'),
      hasSigned: true, // Platform always signs (creates escrow)
      signedAt: order.createdAt.split(' ')[1]?.slice(0, 5),
    },
  ];

  const signedCount = signers.filter(s => s.hasSigned).length;

  /* ─── Escrow timeline ─── */
  const buildTimeline = (): EscrowTimelineEvent[] => {
    const events: EscrowTimelineEvent[] = [];
    const createdTime = order.createdAt.split(' ')[1]?.slice(0, 5) || '—';

    events.push({
      id: 'created',
      label: 'Escrow được tạo',
      description: `Smart contract khởi tạo · ${fmtAmount(order.escrowAmount)} ${order.asset}`,
      time: createdTime,
      status: 'completed',
      icon: Key,
    });

    events.push({
      id: 'locked',
      label: 'Coin đã khóa',
      description: `${fmtAmount(order.escrowAmount)} ${order.asset} chuyển vào escrow address`,
      time: createdTime,
      status: 'completed',
      icon: Lock,
    });

    if (order.status === 'pending_payment') {
      events.push({
        id: 'waiting_payment',
        label: 'Chờ thanh toán fiat',
        description: 'Người mua cần chuyển khoản & xác nhận',
        time: 'Đang chờ',
        status: 'active',
        icon: Clock,
      });
      events.push({
        id: 'confirm_pending',
        label: 'Xác nhận nhận tiền',
        time: '—',
        status: 'pending',
        icon: Shield,
      });
      events.push({
        id: 'release_pending',
        label: 'Giải phóng coin',
        time: '—',
        status: 'pending',
        icon: Unlock,
      });
    }

    if (order.status === 'paid') {
      const paidTime = order.paidAt?.split(' ')[1]?.slice(0, 5) || '—';
      events.push({
        id: 'buyer_paid',
        label: 'Người mua đã thanh toán',
        description: `Signature 2/3 · Chờ merchant xác nhận`,
        time: paidTime,
        status: 'completed',
        icon: CheckCircle,
      });
      events.push({
        id: 'seller_confirm',
        label: 'Chờ merchant xác nhận',
        description: `${order.merchant} cần xác nhận nhận tiền`,
        time: 'Đang chờ',
        status: 'active',
        icon: Shield,
      });
      events.push({
        id: 'release_pending',
        label: 'Giải phóng coin',
        time: '—',
        status: 'pending',
        icon: Unlock,
      });
    }

    if (isReleased) {
      const paidTime = order.paidAt?.split(' ')[1]?.slice(0, 5) || '—';
      const releasedTime = order.releasedAt?.split(' ')[1]?.slice(0, 5) || '—';
      events.push({
        id: 'buyer_paid',
        label: 'Người mua đã thanh toán',
        description: 'Signature 2/3',
        time: paidTime,
        status: 'completed',
        icon: CheckCircle,
      });
      events.push({
        id: 'seller_confirmed',
        label: 'Merchant đã xác nhận',
        description: 'Signature 3/3 — Đủ quorum',
        time: releasedTime,
        status: 'completed',
        icon: ShieldCheck,
      });
      events.push({
        id: 'released',
        label: 'Coin đã giải phóng',
        description: `${fmtAmount(order.escrowAmount)} ${order.asset} → ví người mua`,
        time: releasedTime,
        status: 'completed',
        icon: Unlock,
      });
    }

    if (isCancelled) {
      const cancelTime = order.cancelledAt?.split(' ')[1]?.slice(0, 5) || order.expiresAt.split(' ')[1]?.slice(0, 5) || '—';
      events.push({
        id: 'cancelled',
        label: order.status === 'expired' ? 'Hết hạn thanh toán' : 'Đơn hàng bị hủy',
        description: order.cancelReason || 'Quá thời gian cho phép',
        time: cancelTime,
        status: 'completed',
        icon: AlertTriangle,
      });
      events.push({
        id: 'refund',
        label: 'Coin hoàn trả merchant',
        description: `${fmtAmount(order.escrowAmount)} ${order.asset} → ví merchant`,
        time: cancelTime,
        status: 'completed',
        icon: Unlock,
      });
    }

    if (order.status === 'disputed') {
      const paidTime = order.paidAt?.split(' ')[1]?.slice(0, 5) || '—';
      events.push({
        id: 'buyer_paid',
        label: 'Người mua đã thanh toán',
        time: paidTime,
        status: 'completed',
        icon: CheckCircle,
      });
      events.push({
        id: 'disputed',
        label: 'Đang tranh chấp',
        description: 'Coin bị khóa cho đến khi giải quyết xong',
        time: 'Đang xử lý',
        status: 'active',
        icon: AlertTriangle,
      });
    }

    return events;
  };

  /* ─── Copy handler ─── */
  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    hapticSelection();
    actionToast.success(TOAST.P2P.ESCROW_ADDRESS_COPIED, { haptic: 'selection' });
    setTimeout(() => setCopiedField(null), 2500);
  }, [hapticSelection, actionToast]);

  /* ─── Escrow status config ─── */
  const statusConfig = isReleased
    ? { label: 'Đã giải phóng', color: '#10B981', icon: Unlock, bg: 'rgba(16,185,129,0.08)' }
    : isCancelled
      ? { label: 'Đã hoàn trả', color: '#6B7280', icon: Unlock, bg: 'rgba(107,114,128,0.08)' }
      : order.status === 'disputed'
        ? { label: 'Đang tranh chấp — Coin bị khóa', color: '#EF4444', icon: Lock, bg: 'rgba(239,68,68,0.08)' }
        : { label: 'Đang khóa — Bảo vệ giao dịch', color: '#F59E0B', icon: Lock, bg: 'rgba(245,158,11,0.08)' };

  const StatusIcon = statusConfig.icon;

  const explorerUrl = `https://bscscan.com/address/${escrowAddress}`;

  return (
    <PageLayout>
      <Header title="Chi tiết Escrow" subtitle="Escrow · P2P" back />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4 pb-8">

        {/* ═══ Status Hero ═══ */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3"
          style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.color}20` }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${statusConfig.color}15` }}
          >
            <StatusIcon size={32} color={statusConfig.color} />
          </motion.div>
          <p style={{ color: statusConfig.color, fontSize: φ.base, fontWeight: 700 }}>
            {statusConfig.label}
          </p>
          <p style={{ color: c.text2, fontSize: φ.sm }}>
            {fmtAmount(order.escrowAmount)} {order.asset}
            {order.currency === 'VND' && ` (${fmtVnd(order.total)} VND)`}
          </p>
        </div>

        {/* ═══ Escrow Address ═══ */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              <Key size={14} className="inline mr-1.5" />Địa chỉ Escrow
            </h3>
            <button
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: c.surface2, minHeight: 28 }}
            >
              {showFullAddress ? <EyeOff size={12} color={c.text3} /> : <Eye size={12} color={c.text3} />}
              <span style={{ color: c.text3, fontSize: 10 }}>
                {showFullAddress ? 'Ẩn' : 'Hiện'}
              </span>
            </button>
          </div>

          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
          >
            <code style={{
              color: c.text1, fontSize: φ.sm, fontFamily: 'monospace',
              wordBreak: 'break-all', flex: 1, letterSpacing: '0.3px',
            }}>
              {showFullAddress ? escrowAddress : maskAddress(escrowAddress)}
            </code>
            <button
              onClick={() => handleCopy(escrowAddress, 'escrow')}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: copiedField === 'escrow' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.1)',
                minWidth: 36, minHeight: 36,
              }}
            >
              {copiedField === 'escrow'
                ? <CopyCheck size={14} color="#10B981" />
                : <Copy size={14} color="#3B82F6" />}
            </button>
          </div>

          {/* Explorer Link */}
          <button
            onClick={() => { hapticSelection(); }}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', minHeight: 44 }}
          >
            <ExternalLink size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600 }}>
              Xem trên Blockchain Explorer
            </span>
          </button>
        </TrCard>

        {/* ═══ Multi-Signature Status ═══ */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              <Users size={14} className="inline mr-1.5" />Multi-Signature ({signedCount}/3)
            </h3>
            <MultiSigRing signed={signedCount} total={3} size={48} />
          </div>

          <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 12, lineHeight: 1.6 }}>
            Escrow yêu cầu tối thiểu 2/3 chữ ký để giải phóng coin.
            Platform luôn ký khi tạo escrow (1/3).
          </p>

          <div className="flex flex-col gap-2">
            {signers.map((signer, i) => {
              const roleConfig = signer.role === 'buyer'
                ? { color: '#3B82F6', icon: UserCheck, gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }
                : signer.role === 'seller'
                  ? { color: '#8B5CF6', icon: UserCheck, gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }
                  : { color: '#10B981', icon: ShieldCheck, gradient: 'linear-gradient(135deg, #10B981, #34D399)' };

              return (
                <motion.div
                  key={signer.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.25 }}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    background: signer.hasSigned ? `${roleConfig.color}08` : c.surface2,
                    border: `1px solid ${signer.hasSigned ? `${roleConfig.color}20` : c.borderSolid}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: signer.hasSigned ? roleConfig.gradient : c.surface2,
                      opacity: signer.hasSigned ? 1 : 0.5,
                    }}
                  >
                    {signer.hasSigned
                      ? <CheckCircle size={16} color="#fff" />
                      : <Clock size={16} color={c.text3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{
                      color: signer.hasSigned ? c.text1 : c.text3,
                      fontSize: φ.sm, fontWeight: 600,
                    }}>
                      {signer.label}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                      {maskAddress(signer.address)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    {signer.hasSigned ? (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: `${roleConfig.color}15`, color: roleConfig.color, fontSize: 9, fontWeight: 700 }}
                      >
                        Đã ký
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: c.surface2, color: c.text3, fontSize: 9, fontWeight: 600 }}
                      >
                        Chờ ký
                      </span>
                    )}
                    {signer.signedAt && (
                      <span style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{signer.signedAt}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TrCard>

        {/* ═══ Order Summary ═══ */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>
            Thông tin đơn hàng
          </h3>
          {[
            { label: 'Mã đơn', value: order.orderNumber },
            { label: 'Loại', value: `${order.type === 'buy' ? 'Mua' : 'Bán'} ${order.asset}` },
            { label: 'Số lượng', value: `${fmtAmount(order.escrowAmount)} ${order.asset}`, mono: true },
            { label: 'Giá', value: `${fmtVnd(order.price)} VND/${order.asset}` },
            { label: 'Tổng', value: `${fmtVnd(order.total)} VND`, bold: true },
            { label: 'Merchant', value: order.merchant },
            { label: 'Phương thức TT', value: order.paymentMethod },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: φ.sm }}>{row.label}</span>
              <span style={{
                color: c.text1, fontSize: φ.sm,
                fontWeight: row.bold ? 700 : 400,
                fontFamily: row.mono ? 'monospace' : 'inherit',
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </TrCard>

        {/* ═══ Escrow Timeline ═══ */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} color={c.text2} />
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tiến trình Escrow</h3>
          </div>

          <div className="flex flex-col">
            {buildTimeline().map((event, i) => {
              const isLast = i === buildTimeline().length - 1;
              const Icon = event.icon;
              const statusStyles = {
                completed: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: '#10B981', line: '#10B981' },
                active: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '#3B82F6', line: '#3B82F6' },
                pending: { bg: c.surface2, color: c.text3, border: c.borderSolid, line: c.borderSolid },
              };
              const s = statusStyles[event.status];

              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.25 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
                    >
                      <Icon size={13} color={s.color} />
                    </motion.div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1"
                        style={{ background: s.line, minHeight: 20, opacity: 0.4 }}
                      />
                    )}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 + 0.05, duration: 0.25 }}
                    className="flex-1 pb-4"
                  >
                    <div className="flex items-center justify-between">
                      <span style={{
                        color: event.status === 'pending' ? c.text3 : c.text1,
                        fontSize: φ.sm, fontWeight: 600,
                      }}>
                        {event.label}
                      </span>
                      <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>
                        {event.time}
                      </span>
                    </div>
                    {event.description && (
                      <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>
                        {event.description}
                      </p>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* ═══ Security Notice ═══ */}
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                Bảo vệ bởi VitTrade Escrow
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                Coin được khóa trong smart contract đa chữ ký (2/3 multisig).
                Không bên nào có thể đơn phương rút coin. Nếu phát sinh tranh chấp,
                VitTrade sẽ đóng vai trọng tài (arbiter).
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Navigate to Order ═══ */}
        <button
          onClick={() => navigate(`${prefix}/p2p/order/${order.id}`)}
          className="flex items-center justify-between rounded-xl p-3"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, minHeight: 48 }}
        >
          <div className="flex items-center gap-2">
            <ChevronRight size={14} color={c.text2} />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Xem chi tiết đơn hàng</span>
          </div>
          <ChevronRight size={14} color={c.text3} />
        </button>
      </div>
    </PageLayout>
  );
}