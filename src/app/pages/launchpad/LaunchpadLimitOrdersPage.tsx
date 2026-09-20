/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadLimitOrdersPage — Phase 4.11 (Feature 2/4)
 * ══════════════════════════════════════════════════════════════
 *  Automated limit order execution for token purchases
 *  Pattern B — Page with Tabs (Active/History/Settings)
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Plus, Clock, CheckCircle, XCircle, ArrowDown, ArrowUp,
  TrendingUp, Calendar, AlertTriangle, Edit2, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TABS = ['Hoạt động', 'Lịch sử', 'Tạo lệnh'] as const;
type Tab = typeof TABS[number];

interface LimitOrder {
  id: string;
  token: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  targetPrice: number;
  currentPrice: number;
  amount: number;
  filled: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  partialFill: boolean;
}

const MOCK_ORDERS: LimitOrder[] = [
  {
    id: 'lo_001',
    token: 'Arbitrum',
    tokenSymbol: 'ARB',
    type: 'buy',
    targetPrice: 2.35,
    currentPrice: 2.48,
    amount: 1000,
    filled: 0,
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 86400000),
    createdAt: new Date(Date.now() - 3600000),
    partialFill: true,
  },
  {
    id: 'lo_002',
    token: 'Optimism',
    tokenSymbol: 'OP',
    type: 'sell',
    targetPrice: 2.10,
    currentPrice: 1.87,
    amount: 500,
    filled: 0,
    status: 'active',
    expiresAt: new Date(Date.now() + 14 * 86400000),
    createdAt: new Date(Date.now() - 86400000),
    partialFill: false,
  },
  {
    id: 'lo_003',
    token: 'Polygon',
    tokenSymbol: 'MATIC',
    type: 'buy',
    targetPrice: 0.85,
    currentPrice: 0.89,
    amount: 2000,
    filled: 2000,
    status: 'filled',
    expiresAt: new Date(Date.now() + 7 * 86400000),
    createdAt: new Date(Date.now() - 172800000),
    partialFill: true,
  },
  {
    id: 'lo_004',
    token: 'Avalanche',
    tokenSymbol: 'AVAX',
    type: 'buy',
    targetPrice: 38.50,
    currentPrice: 42.30,
    amount: 100,
    filled: 45,
    status: 'active',
    expiresAt: new Date(Date.now() + 3 * 86400000),
    createdAt: new Date(Date.now() - 259200000),
    partialFill: true,
  },
];

export function LaunchpadLimitOrdersPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Hoạt động');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Create form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [token, setToken] = useState('ARB');
  const [targetPrice, setTargetPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [partialFill, setPartialFill] = useState(true);

  const activeOrders = MOCK_ORDERS.filter(o => o.status === 'active');
  const historyOrders = MOCK_ORDERS.filter(o => o.status !== 'active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#3B82F6';
      case 'filled': return '#10B981';
      case 'cancelled': return '#6B7280';
      case 'expired': return '#EF4444';
      default: return c.text3;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'rgba(59,130,246,0.08)';
      case 'filled': return 'rgba(16,185,129,0.08)';
      case 'cancelled': return 'rgba(107,114,128,0.08)';
      case 'expired': return 'rgba(239,68,68,0.08)';
      default: return c.bg;
    }
  };

  const getProgressToTarget = (order: LimitOrder) => {
    if (order.type === 'buy') {
      return Math.max(0, Math.min(100, ((order.targetPrice - order.currentPrice) / order.targetPrice) * 100 + 100));
    } else {
      return Math.max(0, Math.min(100, (order.currentPrice / order.targetPrice) * 100));
    }
  };

  const handleCreateOrder = () => {
    alert(`Limit Order Created:\nType: ${orderType.toUpperCase()}\nToken: ${token}\nPrice: $${targetPrice}\nAmount: ${amount}\nExpiry: ${expiryDays} days\nPartial: ${partialFill}`);
    setShowCreateSheet(false);
  };

  return (
    <PageLayout>
      <Header
        title="Limit Orders"
        back
        action={{
          icon: Plus,
          onClick: () => setTab('Tạo lệnh'),
        }}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Hoạt động' && (
          <>
            {/* Stats Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Active</p>
                  <p style={{ color: '#3B82F6', fontSize: 20, fontWeight: 700 }}>
                    {activeOrders.length}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Filled 24h</p>
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>3</p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Value</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>$4.2K</p>
                </div>
              </div>
            </div>

            {/* Active Orders */}
            <PageSection label="Lệnh hoạt động">
              {activeOrders.map((order) => {
                const progress = getProgressToTarget(order);
                const distancePercent = ((order.currentPrice - order.targetPrice) / order.targetPrice) * 100;
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: order.type === 'buy' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          }}
                        >
                          {order.type === 'buy' ? (
                            <ArrowDown size={20} color="#10B981" />
                          ) : (
                            <ArrowUp size={20} color="#EF4444" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>
                              {order.type === 'buy' ? 'Buy' : 'Sell'} {order.tokenSymbol}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                              style={{
                                background: getStatusBg(order.status),
                                color: getStatusColor(order.status),
                              }}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p style={{ color: c.text3, fontSize: 11 }}>{order.token}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:opacity-80" style={{ background: c.bg }}>
                          <Edit2 size={14} color={c.text3} />
                        </button>
                        <button className="p-2 rounded-lg hover:opacity-80" style={{ background: c.bg }}>
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Target Price</p>
                        <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          ${order.targetPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Price</p>
                        <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          ${order.currentPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Amount</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {order.amount} {order.tokenSymbol}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Filled</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {order.filled} / {order.amount}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text3, fontSize: 10 }}>Distance to target</p>
                        <p
                          style={{
                            color: Math.abs(distancePercent) < 5 ? '#10B981' : '#F59E0B',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {distancePercent > 0 ? '+' : ''}{distancePercent.toFixed(2)}%
                        </p>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: c.bg }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: progress > 90 ? '#10B981' : progress > 50 ? '#F59E0B' : '#3B82F6',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={11} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          Expires: {order.expiresAt.toLocaleDateString()}
                        </p>
                      </div>
                      {order.partialFill && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
                          style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}
                        >
                          PARTIAL OK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </PageSection>

            {activeOrders.length === 0 && (
              <div className="text-center py-12">
                <Clock size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                <p style={{ color: c.text2, fontSize: 14, marginBottom: 4 }}>No active orders</p>
                <p style={{ color: c.text3, fontSize: 12 }}>Create a limit order to get started</p>
              </div>
            )}
          </>
        )}

        {tab === 'Lịch sử' && (
          <PageSection label="Lịch sử lệnh">
            {historyOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                        {order.type === 'buy' ? 'Buy' : 'Sell'} {order.tokenSymbol}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          background: getStatusBg(order.status),
                          color: getStatusColor(order.status),
                        }}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{order.token}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                      ${order.targetPrice.toFixed(2)}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>{order.amount} {order.tokenSymbol}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                  </p>
                  {order.status === 'filled' && (
                    <CheckCircle size={14} color="#10B981" />
                  )}
                  {order.status === 'cancelled' && (
                    <XCircle size={14} color="#6B7280" />
                  )}
                  {order.status === 'expired' && (
                    <AlertTriangle size={14} color="#EF4444" />
                  )}
                </div>
              </div>
            ))}
          </PageSection>
        )}

        {tab === 'Tạo lệnh' && (
          <>
            <PageSection label="Loại lệnh">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('buy')}
                  className="rounded-2xl p-4 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: orderType === 'buy' ? 'rgba(16,185,129,0.08)' : c.surface,
                    border: `2px solid ${orderType === 'buy' ? '#10B981' : c.border}`,
                  }}
                >
                  <ArrowDown
                    size={24}
                    color={orderType === 'buy' ? '#10B981' : c.text3}
                    style={{ margin: '0 auto 8px' }}
                  />
                  <p
                    style={{
                      color: orderType === 'buy' ? '#10B981' : c.text1,
                      fontSize: 15,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    Buy
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, textAlign: 'center' }}>Mua khi giá xuống</p>
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className="rounded-2xl p-4 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: orderType === 'sell' ? 'rgba(239,68,68,0.08)' : c.surface,
                    border: `2px solid ${orderType === 'sell' ? '#EF4444' : c.border}`,
                  }}
                >
                  <ArrowUp
                    size={24}
                    color={orderType === 'sell' ? '#EF4444' : c.text3}
                    style={{ margin: '0 auto 8px' }}
                  />
                  <p
                    style={{
                      color: orderType === 'sell' ? '#EF4444' : c.text1,
                      fontSize: 15,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    Sell
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, textAlign: 'center' }}>Bán khi giá lên</p>
                </button>
              </div>
            </PageSection>

            <PageSection label="Chi tiết lệnh">
              <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Token
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ARB"
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Target Price (USD)
                  </label>
                  <input
                    type="text"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Amount
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Expiry (days)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1', '7', '14', '30'].map((days) => (
                      <button
                        key={days}
                        onClick={() => setExpiryDays(days)}
                        className="py-2 rounded-xl transition-all"
                        style={{
                          background: expiryDays === days ? c.primary : c.bg,
                          color: expiryDays === days ? '#fff' : c.text1,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
                  <div>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Allow Partial Fill</p>
                    <p style={{ color: c.text3, fontSize: 11 }}>Cho phép khớp một phần</p>
                  </div>
                  <button
                    onClick={() => setPartialFill(!partialFill)}
                    className="relative"
                    style={{ width: 48, height: 28, borderRadius: 14, background: partialFill ? c.primary : c.border }}
                  >
                    <div
                      className="absolute top-1 transition-all"
                      style={{
                        left: partialFill ? 22 : 2,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: '#fff',
                      }}
                    />
                  </button>
                </div>
              </div>
            </PageSection>

            {/* Preview */}
            {targetPrice && amount && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Order Preview</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Type</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      {orderType.toUpperCase()} {token}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Total Value</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      ${(parseFloat(targetPrice) * parseFloat(amount)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Expires</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{expiryDays} days</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Partial</p>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      {partialFill ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PageContent>

      {/* Floating CTA for Create tab */}
      {tab === 'Tạo lệnh' && targetPrice && amount && (
        <>
          <div style={{ height: 60 }} />
          <div
            className="fixed left-0 right-0 px-5 pb-8"
            style={{ bottom: 92, maxWidth: 480, margin: '0 auto' }}
          >
            <button
              onClick={handleCreateOrder}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Tạo Limit Order
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
}