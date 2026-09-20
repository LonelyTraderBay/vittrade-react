/**
 * ══════════════════════════════════════════════════════════
 *  WEB P2P MY ORDERS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/p2p/my-orders
 *
 *  User's P2P order history & active orders
 *  - Active orders (pending, in progress)
 *  - Completed orders
 *  - Cancelled/Disputed orders
 *  - Order status tracking
 *  - Quick actions
 *  - Filters & search
 *
 *  Guidelines compliance:
 *  - §13: P2P safety patterns
 *  - §13.5: Order room state clarity
 *  - §13.6: Anti-scam messaging
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Eye,
  MessageSquare,
  ChevronRight,
  User,
  Shield,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type OrderStatus =
  | 'pending_payment'
  | 'payment_made'
  | 'pending_release'
  | 'completed'
  | 'cancelled'
  | 'disputed';

type OrderSide = 'buy' | 'sell';

interface P2POrder {
  id: string;
  side: OrderSide;
  asset: string;
  fiatCurrency: string;
  amount: number;
  fiatAmount: number;
  price: number;
  merchant: string;
  merchantRating: number;
  merchantCompletionRate: number;
  paymentMethod: string;
  status: OrderStatus;
  createdDate: string;
  timeLimit?: number; // minutes
  timeRemaining?: number; // minutes
}

const P2P_ORDERS: P2POrder[] = [
  {
    id: 'ord1',
    side: 'buy',
    asset: 'USDT',
    fiatCurrency: 'VND',
    amount: 100,
    fiatAmount: 2500000,
    price: 25000,
    merchant: 'CryptoKing',
    merchantRating: 4.9,
    merchantCompletionRate: 98.5,
    paymentMethod: 'Chuyển khoản ngân hàng',
    status: 'pending_payment',
    createdDate: '2026-03-13 10:30',
    timeLimit: 15,
    timeRemaining: 12,
  },
  {
    id: 'ord2',
    side: 'sell',
    asset: 'USDT',
    fiatCurrency: 'VND',
    amount: 500,
    fiatAmount: 12450000,
    price: 24900,
    merchant: 'TraderPro',
    merchantRating: 4.8,
    merchantCompletionRate: 97.2,
    paymentMethod: 'MoMo',
    status: 'payment_made',
    createdDate: '2026-03-13 09:15',
    timeLimit: 30,
    timeRemaining: 18,
  },
  {
    id: 'ord3',
    side: 'buy',
    asset: 'USDT',
    fiatCurrency: 'VND',
    amount: 200,
    fiatAmount: 5000000,
    price: 25000,
    merchant: 'SafeTrader',
    merchantRating: 5.0,
    merchantCompletionRate: 100,
    paymentMethod: 'Chuyển khoản ngân hàng',
    status: 'completed',
    createdDate: '2026-03-12 14:20',
  },
  {
    id: 'ord4',
    side: 'sell',
    asset: 'BTC',
    fiatCurrency: 'VND',
    amount: 0.05,
    fiatAmount: 3750000,
    price: 75000000,
    merchant: 'BTCMaster',
    merchantRating: 4.7,
    merchantCompletionRate: 95.8,
    paymentMethod: 'Chuyển khoản ngân hàng',
    status: 'completed',
    createdDate: '2026-03-10 16:45',
  },
  {
    id: 'ord5',
    side: 'buy',
    asset: 'USDT',
    fiatCurrency: 'VND',
    amount: 300,
    fiatAmount: 7500000,
    price: 25000,
    merchant: 'QuickTrade',
    merchantRating: 3.8,
    merchantCompletionRate: 85.2,
    paymentMethod: 'MoMo',
    status: 'cancelled',
    createdDate: '2026-03-08 11:30',
  },
  {
    id: 'ord6',
    side: 'sell',
    asset: 'USDT',
    fiatCurrency: 'VND',
    amount: 150,
    fiatAmount: 3750000,
    price: 25000,
    merchant: 'ShadyTrader',
    merchantRating: 3.2,
    merchantCompletionRate: 72.5,
    paymentMethod: 'Chuyển khoản ngân hàng',
    status: 'disputed',
    createdDate: '2026-03-07 09:00',
  },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending_payment: { label: 'Chờ thanh toán', color: '#F59E0B', icon: Clock },
  payment_made: { label: 'Đã thanh toán', color: '#3B82F6', icon: CheckCircle2 },
  pending_release: { label: 'Chờ giải ngân', color: '#8B5CF6', icon: Clock },
  completed: { label: 'Hoàn tất', color: '#10B981', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: '#94A3B8', icon: XCircle },
  disputed: { label: 'Tranh chấp', color: '#EF4444', icon: AlertTriangle },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function OrderCard({ order }: { order: P2POrder }) {
  const c = useThemeColors();
  const navigate = useNavigate();

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;
  const SideIcon = order.side === 'buy' ? TrendingUp : TrendingDown;
  const sideColor = order.side === 'buy' ? '#10B981' : '#EF4444';

  const isActive = ['pending_payment', 'payment_made', 'pending_release'].includes(order.status);

  return (
    <div
      className="p-5 rounded-xl cursor-pointer transition-all"
      style={{
        background: c.surface,
        border: isActive ? `2px solid ${statusConfig.color}` : `1px solid ${c.border}`,
      }}
      onClick={() => navigate(`/w/p2p/order/${order.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 40,
              height: 40,
              background: `${sideColor}15`,
            }}
          >
            <SideIcon size={20} color={sideColor} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  color: sideColor,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {order.side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
                {order.amount} {order.asset}
              </span>
            </div>
            <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
              {order.fiatAmount.toLocaleString()} {order.fiatCurrency} · {order.price.toLocaleString()}{' '}
              {order.fiatCurrency}
            </div>
          </div>
        </div>

        <span
          className="flex items-center gap-1 px-2 py-1 rounded-md"
          style={{
            background: `${statusConfig.color}15`,
            color: statusConfig.color,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <StatusIcon size={10} />
          {statusConfig.label}
        </span>
      </div>

      {/* Time Warning (for active orders) */}
      {isActive && order.timeRemaining !== undefined && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-4"
          style={{
            background: order.timeRemaining <= 5 ? '#EF444415' : '#F59E0B15',
            border: `1px solid ${order.timeRemaining <= 5 ? '#EF444440' : '#F59E0B40'}`,
          }}
        >
          <Clock
            size={14}
            color={order.timeRemaining <= 5 ? '#EF4444' : '#F59E0B'}
            className="flex-shrink-0"
          />
          <div>
            <div
              style={{
                color: order.timeRemaining <= 5 ? '#EF4444' : '#F59E0B',
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              Còn {order.timeRemaining} phút
            </div>
            <div style={{ color: c.text3, fontSize: 11 }}>
              {order.status === 'pending_payment' && 'Hoàn tất thanh toán trước khi hết giờ'}
              {order.status === 'payment_made' && 'Đang chờ người bán giải ngân'}
            </div>
          </div>
        </div>
      )}

      {/* Merchant Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 24,
              height: 24,
              background: `${c.text3}15`,
            }}
          >
            <User size={12} color={c.text3} />
          </div>
          <span style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600 }}>
            {order.merchant}
          </span>
          {order.merchantRating >= 4.5 && (
            <Shield size={12} color="#10B981" />
          )}
        </div>
        <div className="text-right">
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            ⭐ {order.merchantRating} · {order.merchantCompletionRate}% hoàn tất
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div
        className="flex items-center justify-between p-3 rounded-lg mb-4"
        style={{
          background: c.bg,
        }}
      >
        <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
          Phương thức
        </div>
        <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600 }}>
          {order.paymentMethod}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
          {new Date(order.createdDate).toLocaleString('vi-VN')}
        </div>
        <div className="flex items-center gap-1" style={{ color: '#3B82F6', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600 }}>
          Xem chi tiết
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Dispute Warning */}
      {order.status === 'disputed' && (
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: '#EF444415',
            border: `1px solid #EF444440`,
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color="#EF4444" className="flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ color: '#EF4444', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 4 }}>
                Đơn hàng đang tranh chấp
              </div>
              <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                Đội ngũ hỗ trợ đang xem xét. Vui lòng cung cấp đầy đủ chứng từ.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebP2PMyOrdersPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = P2P_ORDERS.filter((order) => {
    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = ['pending_payment', 'payment_made', 'pending_release'].includes(order.status);
    } else if (selectedStatus !== 'all') {
      matchesStatus = order.status === selectedStatus;
    }

    const matchesSearch =
      searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.asset.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const activeCount = P2P_ORDERS.filter((o) =>
    ['pending_payment', 'payment_made', 'pending_release'].includes(o.status)
  ).length;

  const completedCount = P2P_ORDERS.filter((o) => o.status === 'completed').length;

  return (
    <PageLayout>
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* ═══ LEFT SIDEBAR (280px) ═══ */}
      <div
        className="flex flex-col"
        style={{
          width: 280,
          background: c.surface,
          borderRight: `1px solid ${c.divider}`,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: 60,
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <h2
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.H2,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Đơn của tôi
          </h2>
        </div>

        {/* Stats */}
        <div className="p-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Tổng quan
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#F59E0B15',
                border: `1px solid #F59E0B40`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Đang xử lý
              </div>
              <div style={{ color: '#F59E0B', fontSize: 20, fontWeight: 800 }}>
                {activeCount}
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Hoàn tất
              </div>
              <div style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>
                {completedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Lọc trạng thái
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
              style={{
                background: selectedStatus === 'all' ? '#3B82F615' : 'transparent',
                color: selectedStatus === 'all' ? '#3B82F6' : c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: selectedStatus === 'all' ? 600 : 500,
              }}
            >
              <span>Tất cả</span>
              <span style={{ fontSize: 12 }}>{P2P_ORDERS.length}</span>
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
              style={{
                background: selectedStatus === 'active' ? '#F59E0B15' : 'transparent',
                color: selectedStatus === 'active' ? '#F59E0B' : c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: selectedStatus === 'active' ? 600 : 500,
              }}
            >
              <span>Đang xử lý</span>
              <span style={{ fontSize: 12 }}>{activeCount}</span>
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = P2P_ORDERS.filter((o) => o.status === status).length;
              if (count === 0) return null;
              const isActive = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as OrderStatus)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: isActive ? `${config.color}15` : 'transparent',
                    color: isActive ? config.color : c.text2,
                    fontSize: WEB_FONT.SIZE.CAPTION,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <span>{config.label}</span>
                  <span style={{ fontSize: 12 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Lịch sử giao dịch P2P
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                {filteredOrders.length} đơn hàng
              </p>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                width: 320,
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <Search size={16} color={c.text3} />
              <input
                type="text"
                placeholder="Tìm theo ID, merchant, asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                }}
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <ShoppingBag size={48} color={c.text3} className="mb-4" />
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, marginBottom: 8 }}>
                Không tìm thấy đơn hàng
              </div>
              <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PageLayout>
  );
}