import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Copy,
  Eye,
  EyeOff,
  MessageSquare,
  User,
  Phone,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Flag,
  Ban,
  RefreshCw,
  ExternalLink,
  Wallet,
  Lock,
  Star,
  MapPin,
  FileText,
  Zap,
  Timer,
  CircleDot,
  AlertCircle,
  X,
  Check,
  Image,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebP2POrderRoomPage — Real-time P2P order room
 *
 * Route: /w/p2p/order/:orderId
 *
 * Features:
 *   - Order status timeline with progress steps
 *   - Countdown timer for payment window
 *   - Payment method info card (bank details)
 *   - Live chat with merchant
 *   - Action bar (Mark Paid, Release, Dispute)
 *   - Anti-scam banners
 *   - Release = destructive confirm
 *   - Order summary sidebar
 *
 * Guidelines:
 *   - §13.5: Order room — status pill, countdown, timeline, payment info, action bar
 *   - §13.6: Anti-scam — never transact outside platform, only confirm when really paid
 *   - §14.3: Release = high-risk → destructive confirm
 *   - §5: Safety-by-design
 */

/* ═══ Types ═══ */
type OrderStatus =
  'pending_payment' | 'paid' | 'releasing' | 'completed' | 'cancelled' | 'disputed';
type MessageType = 'text' | 'system' | 'image' | 'payment_proof';

interface ChatMessage {
  id: string;
  sender: 'me' | 'merchant' | 'system';
  type: MessageType;
  content: string;
  time: string;
  read?: boolean;
}

interface OrderData {
  id: string;
  side: 'buy' | 'sell';
  asset: string;
  amount: number;
  fiatAmount: number;
  fiatCurrency: string;
  price: number;
  status: OrderStatus;
  merchant: {
    name: string;
    completionRate: number;
    totalOrders: number;
    avgReleaseTime: string;
    verified: boolean;
    online: boolean;
  };
  paymentMethod: {
    type: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
  };
  paymentWindow: number; // minutes
  createdAt: string;
  expiresAt: number; // timestamp
  escrowTx: string;
  fee: number;
  feeAsset: string;
}

/* ═══ Status config ═══ */
const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
  { key: 'pending_payment', label: 'Chờ thanh toán', icon: Clock },
  { key: 'paid', label: 'Đã thanh toán', icon: CheckCircle },
  { key: 'releasing', label: 'Đang xác nhận', icon: RefreshCw },
  { key: 'completed', label: 'Hoàn tất', icon: ShieldCheck },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Chờ thanh toán', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  paid: { label: 'Đã thanh toán', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
  releasing: { label: 'Đang xử lý', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
  completed: { label: 'Hoàn tất', color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
  cancelled: { label: 'Đã hủy', color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
  disputed: { label: 'Tranh chấp', color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
};

/* ═══ Mock data ═══ */
const MOCK_ORDER: OrderData = {
  id: 'P2P-20260314-3847',
  side: 'buy',
  asset: 'USDT',
  amount: 500,
  fiatAmount: 12650000,
  fiatCurrency: 'VND',
  price: 25300,
  status: 'pending_payment',
  merchant: {
    name: 'CryptoTrader_VN',
    completionRate: 98.7,
    totalOrders: 2847,
    avgReleaseTime: '~5 phút',
    verified: true,
    online: true,
  },
  paymentMethod: {
    type: 'bank_transfer',
    bankName: 'Vietcombank',
    accountName: 'NGUYEN VAN A',
    accountNumber: '0071 0004 5678 9012',
    branch: 'CN Hồ Chí Minh',
  },
  paymentWindow: 15,
  createdAt: '14/03/2026, 10:30',
  expiresAt: Date.now() + 12 * 60 * 1000,
  escrowTx: '0x8f3a...b2c1',
  fee: 0,
  feeAsset: 'USDT',
};

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'system',
    type: 'system',
    content: 'Đơn hàng đã được tạo. Vui lòng chuyển khoản trong vòng 15 phút.',
    time: '10:30',
  },
  {
    id: 'm2',
    sender: 'merchant',
    type: 'text',
    content:
      'Chào bạn! Vui lòng chuyển khoản theo thông tin bên dưới. Nhớ ghi đúng nội dung chuyển khoản nhé.',
    time: '10:31',
    read: true,
  },
  {
    id: 'm3',
    sender: 'me',
    type: 'text',
    content: 'Chào, mình sẽ chuyển ngay.',
    time: '10:32',
    read: true,
  },
  {
    id: 'm4',
    sender: 'system',
    type: 'system',
    content: '⚠️ Không chia sẻ thông tin cá nhân hay giao dịch ngoài nền tảng.',
    time: '10:32',
  },
  {
    id: 'm5',
    sender: 'merchant',
    type: 'text',
    content: 'Bạn nhớ ghi nội dung chuyển khoản: P2P-3847 nhé!',
    time: '10:33',
    read: true,
  },
];

/* ═══ Helpers ═══ */
function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ═══ Component ═══ */
export function WebP2POrderRoomPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const c = useThemeColors();
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── State ─── */
  const [order, setOrder] = useState(MOCK_ORDER);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [countdown, setCountdown] = useState(order.expiresAt - Date.now());
  const [copiedField, setCopiedField] = useState('');
  const [showConfirmPaid, setShowConfirmPaid] = useState(false);
  const [showConfirmRelease, setShowConfirmRelease] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showEscrowDetails, setShowEscrowDetails] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  /* ─── Timer ─── */
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = order.expiresAt - Date.now();
      setCountdown(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [order.expiresAt]);

  /* ─── Auto scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─── Actions ─── */
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text.replace(/\s/g, ''));
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'me',
      type: 'text',
      content: newMessage.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  const handleMarkPaid = async () => {
    setPaidLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setOrder((prev) => ({ ...prev, status: 'paid' }));
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        type: 'system',
        content: '✅ Bạn đã xác nhận thanh toán. Chờ người bán xác nhận và giải phóng crypto.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setShowConfirmPaid(false);
    setPaidLoading(false);
  };

  const handleRelease = async () => {
    setReleaseLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setOrder((prev) => ({ ...prev, status: 'completed' }));
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        type: 'system',
        content: '🎉 Giao dịch hoàn tất! Crypto đã được giải phóng cho người mua.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setShowConfirmRelease(false);
    setReleaseLoading(false);
  };

  /* ─── Computed ─── */
  const sts = STATUS_CONFIG[order.status];
  const statusIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const isActive = !isCompleted && !isCancelled;
  const timerUrgent = countdown < 3 * 60 * 1000 && countdown > 0;
  const timerExpired = countdown <= 0 && order.status === 'pending_payment';

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/p2p/my-orders')}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                Phòng giao dịch
              </h1>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 20,
                  background: sts.bg,
                  color: sts.color,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                }}
              >
                {sts.label}
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>P2P &gt; Đơn #{order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && order.status === 'pending_payment' && (
            <div
              className="flex items-center gap-1.5"
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: timerExpired
                  ? 'rgba(239,68,68,0.06)'
                  : timerUrgent
                    ? 'rgba(245,158,11,0.06)'
                    : 'rgba(59,130,246,0.06)',
                border: `1px solid ${timerExpired ? 'rgba(239,68,68,0.15)' : timerUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}`,
              }}
            >
              <Timer
                size={14}
                color={timerExpired ? '#EF4444' : timerUrgent ? '#F59E0B' : '#3B82F6'}
              />
              <span
                style={{
                  color: timerExpired ? '#EF4444' : timerUrgent ? '#F59E0B' : '#3B82F6',
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                }}
              >
                {timerExpired ? 'Hết thời gian' : formatCountdown(countdown)}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowDispute(true)}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.04)',
              border: `1px solid rgba(239,68,68,0.12)`,
              color: '#EF4444',
              fontSize: WEB_FONT.xs,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Flag size={12} /> Tranh chấp
          </button>
        </div>
      </div>

      {/* ─── Anti-scam banner ─── */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: '10px 24px',
          background: 'rgba(245,158,11,0.03)',
          borderBottom: `1px solid rgba(245,158,11,0.08)`,
        }}
      >
        <ShieldAlert size={14} color="#F59E0B" className="shrink-0" />
        <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
          <strong style={{ color: '#D97706' }}>An toàn giao dịch:</strong> Không giao dịch ngoài nền
          tảng. Chỉ bấm "Đã thanh toán" khi đã chuyển tiền thật. Không chia sẻ thông tin cá nhân
          trong chat.
        </p>
      </div>

      {/* ─── Main content (2 columns) ─── */}
      <div className="flex" style={{ flex: 1, minHeight: 0 }}>
        {/* ═══ LEFT: Chat + Actions (flex-1) ═══ */}
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ borderRight: `1px solid ${c.borderSolid}` }}
        >
          {/* Status timeline */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSolid}` }}>
            <div className="flex items-center" style={{ gap: 0 }}>
              {STATUS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isCompleteStep =
                  i < statusIdx || (i === statusIdx && order.status === 'completed');
                const isCurrent = i === statusIdx && order.status !== 'completed';
                const isPending = i > statusIdx;
                const color = isCompleteStep ? '#10B981' : isCurrent ? sts.color : c.text3;
                return (
                  <div
                    key={step.key}
                    className="flex items-center"
                    style={{ flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}
                  >
                    <div className="flex flex-col items-center" style={{ position: 'relative' }}>
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isCompleteStep
                            ? 'rgba(16,185,129,0.08)'
                            : isCurrent
                              ? `${sts.color}10`
                              : c.bg,
                          border: `2px solid ${color}`,
                        }}
                      >
                        {isCompleteStep ? (
                          <Check size={14} color="#10B981" />
                        ) : (
                          <StepIcon size={14} color={color} />
                        )}
                      </div>
                      <span
                        style={{
                          color,
                          fontSize: 10,
                          fontWeight: 600,
                          marginTop: 4,
                          whiteSpace: 'nowrap',
                          position: 'absolute',
                          top: '100%',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: isCompleteStep ? '#10B981' : c.borderSolid,
                          marginLeft: 4,
                          marginRight: 4,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '16px 24px', minHeight: 0 }}>
            <div className="flex flex-col" style={{ gap: 10, paddingTop: 24, paddingBottom: 8 }}>
              {messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          background: 'rgba(107,114,128,0.04)',
                          border: `1px solid ${c.borderSolid}`,
                        }}
                      >
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs, textAlign: 'center' }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: 14,
                        background: isMe ? '#3B82F6' : c.surface,
                        border: isMe ? 'none' : `1px solid ${c.borderSolid}`,
                        borderBottomRightRadius: isMe ? 4 : 14,
                        borderBottomLeftRadius: isMe ? 14 : 4,
                      }}
                    >
                      <p
                        style={{
                          color: isMe ? '#fff' : c.text1,
                          fontSize: WEB_FONT.sm,
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content}
                      </p>
                      <p
                        style={{
                          color: isMe ? 'rgba(255,255,255,0.6)' : c.text3,
                          fontSize: 10,
                          textAlign: 'right',
                          marginTop: 4,
                        }}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat input */}
          <div
            style={{
              padding: '12px 24px',
              borderTop: `1px solid ${c.borderSolid}`,
              background: c.surface,
            }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 outline-none"
                style={{
                  height: WEB_BUTTON.md,
                  borderRadius: 10,
                  border: `1px solid ${c.borderSolid}`,
                  background: c.bg,
                  padding: '0 14px',
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                }}
              />
              <button
                onClick={handleSendMessage}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: WEB_BUTTON.md,
                  height: WEB_BUTTON.md,
                  borderRadius: 10,
                  background: newMessage.trim() ? '#3B82F6' : c.bg,
                  border: newMessage.trim() ? 'none' : `1px solid ${c.borderSolid}`,
                  cursor: newMessage.trim() ? 'pointer' : 'default',
                }}
              >
                <Send size={16} color={newMessage.trim() ? '#fff' : c.text3} />
              </button>
            </div>
          </div>

          {/* Action bar */}
          {isActive && (
            <div
              style={{
                padding: '12px 24px',
                borderTop: `1px solid ${c.borderSolid}`,
                background: c.surface,
              }}
            >
              <div className="flex items-center" style={{ gap: 10 }}>
                {order.status === 'pending_payment' && (
                  <>
                    <button
                      onClick={() => setShowConfirmPaid(true)}
                      className="flex-1 flex items-center justify-center gap-2"
                      style={{
                        height: WEB_BUTTON.lg,
                        borderRadius: 10,
                        background: '#3B82F6',
                        border: 'none',
                        color: '#fff',
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle size={16} /> Tôi đã thanh toán
                    </button>
                    <button
                      style={{
                        height: WEB_BUTTON.lg,
                        padding: '0 20px',
                        borderRadius: 10,
                        background: c.bg,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Hủy đơn
                    </button>
                  </>
                )}
                {order.status === 'paid' && order.side === 'sell' && (
                  <button
                    onClick={() => setShowConfirmRelease(true)}
                    className="flex-1 flex items-center justify-center gap-2"
                    style={{
                      height: WEB_BUTTON.lg,
                      borderRadius: 10,
                      background: '#10B981',
                      border: 'none',
                      color: '#fff',
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Lock size={16} /> Giải phóng crypto
                  </button>
                )}
                {order.status === 'paid' && order.side === 'buy' && (
                  <div
                    className="flex-1 flex items-center justify-center gap-2"
                    style={{
                      height: WEB_BUTTON.lg,
                      borderRadius: 10,
                      background: 'rgba(59,130,246,0.04)',
                      border: `1px solid rgba(59,130,246,0.15)`,
                    }}
                  >
                    <RefreshCw
                      size={14}
                      color="#3B82F6"
                      style={{ animation: 'spin 2s linear infinite' }}
                    />
                    <span style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      Chờ người bán xác nhận...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Order info sidebar (380px) ═══ */}
        <div
          className="shrink-0 overflow-y-auto"
          style={{ width: 380, padding: '20px', background: c.bg }}
        >
          <div className="flex flex-col" style={{ gap: 14 }}>
            {/* Order summary */}
            <div style={{ ...card(), padding: WEB_SPACING.cardDefault }}>
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={16} color={order.side === 'buy' ? '#10B981' : '#EF4444'} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  {order.side === 'buy' ? 'Mua' : 'Bán'} {order.asset}
                </h3>
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {[
                  { label: 'Số lượng', value: `${order.amount} ${order.asset}`, highlight: true },
                  { label: 'Tổng tiền', value: formatVND(order.fiatAmount), highlight: true },
                  { label: 'Giá', value: formatVND(order.price) + `/${order.asset}` },
                  {
                    label: 'Phí',
                    value: order.fee === 0 ? 'Miễn phí' : `${order.fee} ${order.feeAsset}`,
                  },
                  { label: 'Thời gian tạo', value: order.createdAt },
                  { label: 'Mã đơn', value: order.id },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between"
                    style={{ padding: '4px 0' }}
                  >
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{r.label}</span>
                    <span
                      style={{
                        color: r.highlight ? c.text1 : c.text2,
                        fontSize: r.highlight ? WEB_FONT.md : WEB_FONT.xs,
                        fontWeight: r.highlight ? 700 : 500,
                      }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowEscrowDetails(!showEscrowDetails)}
                className="flex items-center gap-1 mt-2"
                style={{
                  color: '#3B82F6',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Lock size={10} /> Escrow: {order.escrowTx}
                {showEscrowDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {showEscrowDetails && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(16,185,129,0.03)',
                    border: '1px solid rgba(16,185,129,0.1)',
                  }}
                >
                  <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                    <strong>
                      {order.amount} {order.asset}
                    </strong>{' '}
                    đã được khóa trong escrow smart contract. Crypto chỉ được giải phóng khi người
                    bán xác nhận đã nhận tiền.
                  </p>
                </div>
              )}
            </div>

            {/* Payment info */}
            <div
              style={{
                ...card(),
                padding: WEB_SPACING.cardDefault,
                borderColor:
                  order.status === 'pending_payment' ? 'rgba(59,130,246,0.25)' : c.borderSolid,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} color="#3B82F6" />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Thông tin thanh toán
                </h3>
              </div>
              <div className="flex flex-col" style={{ gap: 10 }}>
                {[
                  {
                    label: 'Ngân hàng',
                    value: order.paymentMethod.bankName,
                    icon: Building2,
                    copyable: false,
                  },
                  {
                    label: 'Chủ tài khoản',
                    value: order.paymentMethod.accountName,
                    icon: User,
                    copyable: true,
                    copyKey: 'name',
                  },
                  {
                    label: 'Số tài khoản',
                    value: order.paymentMethod.accountNumber,
                    icon: CreditCard,
                    copyable: true,
                    copyKey: 'acct',
                  },
                  {
                    label: 'Chi nhánh',
                    value: order.paymentMethod.branch,
                    icon: MapPin,
                    copyable: false,
                  },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between"
                      style={{ padding: '6px 10px', borderRadius: 8, background: c.bg }}
                    >
                      <div className="flex items-center gap-2">
                        <r.icon size={13} color={c.text3} />
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
                          <p
                            style={{
                              color: c.text1,
                              fontSize: WEB_FONT.sm,
                              fontWeight: 600,
                              fontFamily: r.label === 'Số tài khoản' ? 'monospace' : 'inherit',
                              letterSpacing: r.label === 'Số tài khoản' ? 1 : 0,
                            }}
                          >
                            {r.value}
                          </p>
                        </div>
                      </div>
                      {r.copyable && (
                        <button
                          onClick={() => handleCopy(r.value!, r.copyKey!)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                        >
                          {copiedField === r.copyKey ? (
                            <CheckCircle size={14} color="#10B981" />
                          ) : (
                            <Copy size={14} color={c.text3} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.1)',
                }}
              >
                <p
                  style={{
                    color: '#D97706',
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  Nội dung chuyển khoản:
                </p>
                <div className="flex items-center justify-between">
                  <code
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    P2P-3847
                  </code>
                  <button
                    onClick={() => handleCopy('P2P-3847', 'ref')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    {copiedField === 'ref' ? (
                      <CheckCircle size={14} color="#10B981" />
                    ) : (
                      <Copy size={14} color={c.text3} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Merchant info */}
            <div style={{ ...card(), padding: WEB_SPACING.cardDefault }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.12)',
                  }}
                >
                  <User size={18} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                      {order.merchant.name}
                    </p>
                    {order.merchant.verified && <ShieldCheck size={14} color="#10B981" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <CircleDot size={8} color={order.merchant.online ? '#10B981' : '#6B7280'} />
                    <span
                      style={{
                        color: order.merchant.online ? '#10B981' : c.text3,
                        fontSize: WEB_FONT.xs,
                      }}
                    >
                      {order.merchant.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex" style={{ gap: 12 }}>
                {[
                  {
                    label: 'Hoàn thành',
                    value: `${order.merchant.completionRate}%`,
                    color: '#10B981',
                  },
                  {
                    label: 'Tổng đơn',
                    value: String(order.merchant.totalOrders),
                    color: '#3B82F6',
                  },
                  { label: 'TB release', value: order.merchant.avgReleaseTime, color: '#8B5CF6' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex-1 text-center"
                    style={{ padding: '8px 4px', borderRadius: 8, background: c.bg }}
                  >
                    <p style={{ color: s.color, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      {s.value}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div
              style={{
                ...card(),
                padding: '14px',
                background: 'rgba(239,68,68,0.01)',
                borderColor: 'rgba(239,68,68,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 700 }}>
                  Lưu ý quan trọng
                </p>
              </div>
              <div className="flex flex-col" style={{ gap: 6 }}>
                {[
                  'Chỉ bấm "Đã thanh toán" khi đã chuyển tiền thật',
                  'Không giao dịch ngoài nền tảng',
                  'Không chia sẻ thông tin cá nhân',
                  'Kiểm tra đúng tên người nhận trước khi chuyển',
                  'Liên hệ hỗ trợ nếu cần — Đừng tự giải quyết',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle
                      size={10}
                      color="#EF4444"
                      className="shrink-0"
                      style={{ marginTop: 3 }}
                    />
                    <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Confirm Paid modal ═══ */}
      {showConfirmPaid && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        >
          <div
            style={{
              width: 440,
              borderRadius: 16,
              background: c.surface,
              padding: 28,
              border: `1px solid ${c.borderSolid}`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(59,130,246,0.06)',
                }}
              >
                <CheckCircle size={22} color="#3B82F6" />
              </div>
              <div>
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                  Xác nhận đã thanh toán?
                </h3>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Đơn #{order.id}</p>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.1)',
                marginBottom: 16,
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={13}
                  color="#F59E0B"
                  className="shrink-0"
                  style={{ marginTop: 2 }}
                />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Chỉ xác nhận khi bạn đã{' '}
                  <strong>thực sự chuyển khoản {formatVND(order.fiatAmount)}</strong> cho{' '}
                  {order.merchant.name}. Xác nhận sai có thể dẫn đến khóa tài khoản.
                </p>
              </div>
            </div>

            <div className="flex flex-col" style={{ gap: 6, marginBottom: 20 }}>
              {[
                { l: 'Số tiền chuyển', v: formatVND(order.fiatAmount) },
                { l: 'Ngân hàng', v: order.paymentMethod.bankName },
                { l: 'Tài khoản', v: order.paymentMethod.accountNumber },
                { l: 'Nội dung CK', v: 'P2P-3847' },
              ].map((r) => (
                <div key={r.l} className="flex justify-between" style={{ fontSize: WEB_FONT.sm }}>
                  <span style={{ color: c.text3 }}>{r.l}</span>
                  <span style={{ color: c.text1, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmPaid(false)}
                className="flex-1"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  color: c.text2,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quay lại
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={paidLoading}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: '#3B82F6',
                  border: 'none',
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  cursor: paidLoading ? 'not-allowed' : 'pointer',
                  opacity: paidLoading ? 0.7 : 1,
                }}
              >
                {paidLoading ? (
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CheckCircle size={14} />
                )}
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Confirm Release modal (DESTRUCTIVE) ═══ */}
      {showConfirmRelease && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        >
          <div
            style={{
              width: 440,
              borderRadius: 16,
              background: c.surface,
              padding: 28,
              border: `2px solid rgba(239,68,68,0.3)`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.06)',
                }}
              >
                <AlertTriangle size={22} color="#EF4444" />
              </div>
              <div>
                <h3 style={{ color: '#EF4444', fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                  Giải phóng crypto?
                </h3>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  Hành động này KHÔNG THỂ hoàn tác
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.12)',
                marginBottom: 16,
              }}
            >
              <div className="flex items-start gap-2">
                <ShieldAlert
                  size={13}
                  color="#EF4444"
                  className="shrink-0"
                  style={{ marginTop: 2 }}
                />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Bạn sẽ giải phóng{' '}
                  <strong>
                    {order.amount} {order.asset}
                  </strong>{' '}
                  cho người mua. Chỉ thực hiện khi bạn đã{' '}
                  <strong style={{ color: '#EF4444' }}>
                    nhận được {formatVND(order.fiatAmount)}
                  </strong>{' '}
                  trong tài khoản ngân hàng. Sau khi giải phóng, crypto sẽ không thể thu hồi.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmRelease(false)}
                className="flex-1"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  color: c.text2,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quay lại kiểm tra
              </button>
              <button
                onClick={handleRelease}
                disabled={releaseLoading}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  cursor: releaseLoading ? 'not-allowed' : 'pointer',
                  opacity: releaseLoading ? 0.7 : 1,
                }}
              >
                {releaseLoading ? (
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Lock size={14} />
                )}
                Xác nhận giải phóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Dispute modal ═══ */}
      {showDispute && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        >
          <div
            style={{
              width: 440,
              borderRadius: 16,
              background: c.surface,
              padding: 28,
              border: `1px solid ${c.borderSolid}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(239,68,68,0.06)',
                  }}
                >
                  <Flag size={22} color="#EF4444" />
                </div>
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                  Mở tranh chấp
                </h3>
              </div>
              <button
                onClick={() => setShowDispute(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color={c.text3} />
              </button>
            </div>
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5, marginBottom: 14 }}>
              Nếu gặp vấn đề với giao dịch này (không nhận được thanh toán, thông tin sai, v.v.),
              hãy mô tả chi tiết bên dưới. Đội ngũ hỗ trợ sẽ xem xét trong vòng 30 phút.
            </p>
            <textarea
              placeholder="Mô tả vấn đề của bạn..."
              className="outline-none"
              rows={4}
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${c.borderSolid}`,
                background: c.bg,
                padding: 12,
                color: c.text1,
                fontSize: WEB_FONT.sm,
                resize: 'vertical',
              }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDispute(false)}
                className="flex-1"
                style={{
                  height: WEB_BUTTON.md,
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                className="flex-1"
                style={{
                  height: WEB_BUTTON.md,
                  borderRadius: 10,
                  background: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Gửi tranh chấp
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
