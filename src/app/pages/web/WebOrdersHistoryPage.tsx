/**
 * ══════════════════════════════════════════════════════════
 *  WEB ORDERS HISTORY PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/trade/orders
 *
 *  Enterprise-grade orders history with:
 *  - Multi-dimensional filters (status, type, pair, date range)
 *  - Real-time status updates
 *  - Export functionality
 *  - Detailed order modal
 *  - Proper desktop sizing & tokens
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Filter,
  Download,
  ChevronDown,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled';
type OrderType = 'market' | 'limit' | 'stop_limit';
type OrderSide = 'buy' | 'sell';

interface Order {
  id: string;
  pair: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: number;
  amount: number;
  filled: number;
  total: number;
  time: string;
  fee: number;
  avgPrice?: number;
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001234',
    pair: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    status: 'filled',
    price: 98500,
    amount: 0.5,
    filled: 0.5,
    total: 49250,
    time: '2026-03-13 14:32:15',
    fee: 49.25,
    avgPrice: 98500,
  },
  {
    id: 'ORD-2026-001233',
    pair: 'ETH/USDT',
    side: 'sell',
    type: 'market',
    status: 'filled',
    price: 3420,
    amount: 2.5,
    filled: 2.5,
    total: 8550,
    time: '2026-03-13 13:18:42',
    fee: 8.55,
    avgPrice: 3420,
  },
  {
    id: 'ORD-2026-001232',
    pair: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    status: 'open',
    price: 97000,
    amount: 1.0,
    filled: 0,
    total: 97000,
    time: '2026-03-13 12:05:30',
    fee: 0,
  },
  {
    id: 'ORD-2026-001231',
    pair: 'SOL/USDT',
    side: 'buy',
    type: 'stop_limit',
    status: 'partially_filled',
    price: 142.5,
    amount: 50,
    filled: 20,
    total: 7125,
    time: '2026-03-13 11:24:18',
    fee: 2.85,
    avgPrice: 142.5,
  },
  {
    id: 'ORD-2026-001230',
    pair: 'BNB/USDT',
    side: 'sell',
    type: 'limit',
    status: 'cancelled',
    price: 615,
    amount: 10,
    filled: 0,
    total: 6150,
    time: '2026-03-13 10:15:05',
    fee: 0,
  },
  {
    id: 'ORD-2026-001229',
    pair: 'ADA/USDT',
    side: 'buy',
    type: 'market',
    status: 'filled',
    price: 0.68,
    amount: 5000,
    filled: 5000,
    total: 3400,
    time: '2026-03-13 09:42:33',
    fee: 3.4,
    avgPrice: 0.68,
  },
  {
    id: 'ORD-2026-001228',
    pair: 'MATIC/USDT',
    side: 'sell',
    type: 'limit',
    status: 'filled',
    price: 1.15,
    amount: 2000,
    filled: 2000,
    total: 2300,
    time: '2026-03-12 16:30:22',
    fee: 2.3,
    avgPrice: 1.15,
  },
  {
    id: 'ORD-2026-001227',
    pair: 'DOGE/USDT',
    side: 'buy',
    type: 'limit',
    status: 'cancelled',
    price: 0.082,
    amount: 10000,
    filled: 0,
    total: 820,
    time: '2026-03-12 14:22:11',
    fee: 0,
  },
];

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'filled':
      return { label: 'Đã khớp', color: '#10B981', icon: CheckCircle };
    case 'partially_filled':
      return { label: 'Khớp 1 phần', color: '#F59E0B', icon: AlertCircle };
    case 'open':
      return { label: 'Chờ khớp', color: '#3B82F6', icon: Clock };
    case 'cancelled':
      return { label: 'Đã hủy', color: '#6B7280', icon: XCircle };
  }
}

function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebOrdersHistoryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<OrderSide | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (typeFilter !== 'all' && order.type !== typeFilter) return false;
      if (sideFilter !== 'all' && order.side !== sideFilter) return false;
      if (searchQuery && !order.pair.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, typeFilter, sideFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const open = MOCK_ORDERS.filter((o) => o.status === 'open').length;
    const filled = MOCK_ORDERS.filter((o) => o.status === 'filled').length;
    const cancelled = MOCK_ORDERS.filter((o) => o.status === 'cancelled').length;
    const totalVolume = MOCK_ORDERS.filter((o) => o.status === 'filled').reduce((sum, o) => sum + o.total, 0);
    return { open, filled, cancelled, totalVolume };
  }, []);

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export orders to CSV');
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Lịch sử lệnh"
        subtitle="Quản lý và theo dõi tất cả lệnh giao dịch"
        back
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl transition-all"
              style={{
                height: WEB_BUTTON.md,
                padding: '0 16px',
                background: showFilters ? c.primary + '15' : c.surface,
                border: `1px solid ${showFilters ? c.primary : c.border}`,
                color: showFilters ? c.primary : c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              <Filter size={WEB_ICON.sm} />
              <span>Bộ lọc</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl transition-all"
              style={{
                height: WEB_BUTTON.md,
                padding: '0 16px',
                background: c.surface,
                border: `1px solid ${c.border}`,
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              <Download size={WEB_ICON.sm} />
              <span>Xuất file</span>
            </button>
          </div>
        }
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>

        {/* ─── Stats Cards ─── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3, marginBottom: 8 }}>
              Lệnh chờ
            </p>
            <p style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: '#3B82F6' }}>
              {stats.open}
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3, marginBottom: 8 }}>
              Đã khớp
            </p>
            <p style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: '#10B981' }}>
              {stats.filled}
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3, marginBottom: 8 }}>
              Đã hủy
            </p>
            <p style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text3 }}>
              {stats.cancelled}
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3, marginBottom: 8 }}>
              Tổng khối lượng
            </p>
            <p style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
              ${formatNumber(stats.totalVolume, 0)}
            </p>
          </div>
        </div>

        {/* ─── Filters Panel ─── */}
        {showFilters && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="grid grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: WEB_FONT.sm,
                    color: c.text3,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Tìm cặp
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3"
                  style={{
                    height: WEB_BUTTON.md,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Search size={WEB_ICON.sm} color={c.text3} />
                  <input
                    type="text"
                    placeholder="BTC, ETH..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X size={WEB_ICON.sm} color={c.text3} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: WEB_FONT.sm,
                    color: c.text3,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-xl px-3 w-full"
                  style={{
                    height: WEB_BUTTON.md,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="open">Chờ khớp</option>
                  <option value="filled">Đã khớp</option>
                  <option value="partially_filled">Khớp 1 phần</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: WEB_FONT.sm,
                    color: c.text3,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Loại lệnh
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="rounded-xl px-3 w-full"
                  style={{
                    height: WEB_BUTTON.md,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop_limit">Stop Limit</option>
                </select>
              </div>

              {/* Side Filter */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: WEB_FONT.sm,
                    color: c.text3,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Hướng
                </label>
                <select
                  value={sideFilter}
                  onChange={(e) => setSideFilter(e.target.value as any)}
                  className="rounded-xl px-3 w-full"
                  style={{
                    height: WEB_BUTTON.md,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="buy">Mua</option>
                  <option value="sell">Bán</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Orders Table ─── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          {/* Table Header */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: '140px 100px 100px 100px 120px 120px 120px 120px 140px 100px',
              padding: '0 20px',
              height: WEB_SPACING.rowCompact,
              borderBottom: `1px solid ${c.divider}`,
              background: c.bg,
            }}
          >
            {['Mã lệnh', 'Cặp', 'Hướng', 'Loại', 'Giá', 'Số lượng', 'Đã khớp', 'Tổng', 'Thời gian', 'Trạng thái'].map(
              (label) => (
                <div
                  key={label}
                  className="flex items-center"
                  style={{
                    fontSize: WEB_FONT.xs,
                    fontWeight: 700,
                    color: c.text3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>

          {/* Table Body */}
          <div>
            {filteredOrders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  padding: '60px 20px',
                }}
              >
                <AlertCircle size={48} color={c.text3} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: WEB_FONT.md, color: c.text3, marginBottom: 8 }}>
                  Không tìm thấy lệnh nào
                </p>
                <p style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
                  Thử điều chỉnh bộ lọc hoặc tìm kiếm
                </p>
              </div>
            ) : (
              filteredOrders.map((order, idx) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const isBuy = order.side === 'buy';

                return (
                  <div
                    key={order.id}
                    className="grid cursor-pointer transition-all hover:bg-opacity-50"
                    style={{
                      gridTemplateColumns: '140px 100px 100px 100px 120px 120px 120px 120px 140px 100px',
                      padding: '0 20px',
                      height: WEB_SPACING.rowDefault,
                      borderBottom: idx < filteredOrders.length - 1 ? `1px solid ${c.divider}` : 'none',
                    }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order ID */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: c.text2,
                          fontFamily: 'monospace',
                        }}
                      >
                        {order.id.split('-').pop()}
                      </span>
                    </div>

                    {/* Pair */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 700,
                          color: c.text1,
                        }}
                      >
                        {order.pair.split('/')[0]}
                      </span>
                    </div>

                    {/* Side */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        {isBuy ? (
                          <TrendingUp size={WEB_ICON.sm} color="#10B981" />
                        ) : (
                          <TrendingDown size={WEB_ICON.sm} color="#EF4444" />
                        )}
                        <span
                          style={{
                            fontSize: WEB_FONT.sm,
                            fontWeight: 600,
                            color: isBuy ? '#10B981' : '#EF4444',
                          }}
                        >
                          {isBuy ? 'Mua' : 'Bán'}
                        </span>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="flex items-center">
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          color: c.text2,
                          background: c.bg,
                        }}
                      >
                        {order.type === 'market' ? 'Market' : order.type === 'limit' ? 'Limit' : 'Stop Limit'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: c.text1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ${formatNumber(order.price, order.price < 1 ? 4 : 2)}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: c.text2,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatNumber(order.amount, order.amount < 1 ? 4 : 2)}
                      </span>
                    </div>

                    {/* Filled */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: order.filled > 0 ? c.text1 : c.text3,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatNumber(order.filled, order.filled < 1 ? 4 : 2)}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: c.text1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ${formatNumber(order.total, 2)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center">
                      <span
                        style={{
                          fontSize: WEB_FONT.xs,
                          fontWeight: 500,
                          color: c.text3,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {order.time}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={WEB_ICON.sm} color={statusConfig.color} />
                        <span
                          style={{
                            fontSize: WEB_FONT.sm,
                            fontWeight: 600,
                            color: statusConfig.color,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mt-4">
          <p style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
            Hiển thị {filteredOrders.length} / {MOCK_ORDERS.length} lệnh
          </p>
        </div>
      </div>

      {/* ─── Order Detail Modal (TODO) ─── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              maxWidth: 600,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1, marginBottom: 16 }}>
              Chi tiết lệnh: {selectedOrder.id}
            </h3>
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
              Coming soon...
            </p>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 rounded-xl w-full"
              style={{
                height: WEB_BUTTON.md,
                background: c.primary,
                color: '#fff',
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}