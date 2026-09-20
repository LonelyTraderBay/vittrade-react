/**
 * ══════════════════════════════════════════════════════════
 *  P2PEscrowBalancePage — /p2p/wallet/escrow
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Detailed escrow balance breakdown
 *  Show all orders locking funds in escrow
 *  Tone: Clear, transparent, financial clarity
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Lock, ChevronRight, Clock, User, Info, AlertCircle,
  TrendingUp, TrendingDown, Shield, FileText,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtAmount, fmtVnd } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   Escrow Order Types
   ═══════════════════════════════════════════════════════════ */
interface EscrowOrder {
  id: string;
  orderId: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  fiatAmount: number;
  fiatCurrency: string;
  counterparty: string;
  status: 'pending_payment' | 'paid' | 'pending_release' | 'dispute';
  lockedAt: string;
  estimatedRelease: string;
}

const MOCK_ESCROW_ORDERS: Record<string, EscrowOrder[]> = {
  USDT: [
    {
      id: '1',
      orderId: '#P2P-45892',
      type: 'sell',
      asset: 'USDT',
      amount: 1_500.00,
      fiatAmount: 36_000_000,
      fiatCurrency: 'VND',
      counterparty: 'buyer_***89',
      status: 'paid',
      lockedAt: '2026-03-05 14:20',
      estimatedRelease: '2026-03-05 15:20',
    },
    {
      id: '2',
      orderId: '#P2P-45880',
      type: 'sell',
      asset: 'USDT',
      amount: 1_000.00,
      fiatAmount: 24_000_000,
      fiatCurrency: 'VND',
      counterparty: 'buyer_***12',
      status: 'pending_payment',
      lockedAt: '2026-03-05 13:45',
      estimatedRelease: '2026-03-05 14:45',
    },
    {
      id: '3',
      orderId: '#P2P-45870',
      type: 'sell',
      asset: 'USDT',
      amount: 700.00,
      fiatAmount: 16_800_000,
      fiatCurrency: 'VND',
      counterparty: 'buyer_***45',
      status: 'dispute',
      lockedAt: '2026-03-05 10:30',
      estimatedRelease: 'Đang giải quyết',
    },
  ],
  BTC: [
    {
      id: '4',
      orderId: '#P2P-45860',
      type: 'sell',
      asset: 'BTC',
      amount: 0.01,
      fiatAmount: 25_000_000,
      fiatCurrency: 'VND',
      counterparty: 'buyer_***78',
      status: 'paid',
      lockedAt: '2026-03-04 16:20',
      estimatedRelease: '2026-03-05 16:20',
    },
  ],
  VND: [
    {
      id: '5',
      orderId: '#P2P-45850',
      type: 'buy',
      asset: 'USDT',
      amount: 500.00,
      fiatAmount: 12_000_000,
      fiatCurrency: 'VND',
      counterparty: 'seller_***34',
      status: 'pending_release',
      lockedAt: '2026-03-05 12:10',
      estimatedRelease: '2026-03-05 13:10',
    },
  ],
};

const ESCROW_TOTALS = {
  USDT: 3_200.00,
  BTC: 0.01,
  VND: 12_000_000,
};

/* ═══════════════════════════════════════════════════════════
   Escrow Order Card
   ═══════════════════════════════════════════════════════════ */
function EscrowOrderCard({ order }: { order: EscrowOrder }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const getStatusConfig = () => {
    switch (order.status) {
      case 'pending_payment':
        return { color: '#F59E0B', label: 'Chờ thanh toán', icon: Clock };
      case 'paid':
        return { color: '#3B82F6', label: 'Đã thanh toán', icon: Shield };
      case 'pending_release':
        return { color: '#10B981', label: 'Chờ release', icon: Lock };
      case 'dispute':
        return { color: '#EF4444', label: 'Tranh chấp', icon: AlertCircle };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={() => {
        hapticSelection();
        navigate(`${prefix}/p2p/orders/${order.orderId.replace('#P2P-', '')}`);
      }}
      className="w-full"
    >
      <TrCard rounded="md" className="p-4 text-left">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p
                style={{
                  color: c.text1,
                  fontSize: φ.sm,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {order.orderId}
              </p>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{
                  background: order.type === 'buy'
                    ? hexToRgba('#10B981', 15)
                    : hexToRgba('#EF4444', 15),
                  color: order.type === 'buy' ? '#10B981' : '#EF4444',
                }}
              >
                {order.type === 'buy' ? 'MUA' : 'BÁN'}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <User size={10} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 11 }}>{order.counterparty}</p>
            </div>
          </div>

          <div
            className="px-2 py-1 rounded-md flex items-center gap-1"
            style={{ background: hexToRgba(statusConfig.color, 12) }}
          >
            <StatusIcon size={10} color={statusConfig.color} />
            <span style={{ color: statusConfig.color, fontSize: 9, fontWeight: 700 }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Số tiền escrow</p>
            <p
              style={{
                color: '#F59E0B',
                fontSize: φ.sm,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {order.asset === 'BTC'
                ? fmtAmount(order.amount, 8)
                : order.asset === 'VND'
                  ? fmtVnd(order.amount)
                  : fmtAmount(order.amount, 2)}{' '}
              {order.asset}
            </p>
          </div>

          <div>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Giá trị</p>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              {fmtVnd(order.fiatAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock size={10} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10 }}>
              Khóa lúc: {order.lockedAt}
            </p>
          </div>
          <ChevronRight size={14} color={c.text3} />
        </div>

        {order.status === 'dispute' && (
          <div
            className="mt-3 p-2 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#EF4444', 10) }}
          >
            <AlertCircle size={12} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Đơn hàng đang tranh chấp. Số tiền sẽ được giữ cho đến khi giải quyết xong.
            </p>
          </div>
        )}
      </TrCard>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PEscrowBalancePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [searchParams] = useSearchParams();

  const initialAsset = searchParams.get('asset') || 'USDT';
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const orders = MOCK_ESCROW_ORDERS[selectedAsset] || [];
  const totalEscrow = ESCROW_TOTALS[selectedAsset as keyof typeof ESCROW_TOTALS] || 0;

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Escrow Balance" subtitle="Escrow · P2P" back />

        {/* Total Escrow Card */}
        <div className="px-5 py-4">
          <TrCard
            rounded="lg"
            className="p-5"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Lock size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 4 }}>
                  Tổng đang escrow
                </p>
                <h2
                  style={{
                    color: '#FFFFFF',
                    fontSize: φ.xl,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {selectedAsset === 'BTC'
                    ? fmtAmount(totalEscrow, 8)
                    : selectedAsset === 'VND'
                      ? fmtVnd(totalEscrow)
                      : fmtAmount(totalEscrow, 2)}{' '}
                  {selectedAsset}
                </h2>
              </div>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>
                {orders.length} đơn hàng đang giữ tiền
              </p>
            </div>
          </TrCard>
        </div>

        {/* Info Banner */}
        <div className="px-5 mb-6">
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Escrow là gì?
              </p>
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                Khi bạn bán crypto, số tiền sẽ bị khóa trong escrow cho đến khi buyer thanh toán và
                bạn release. Điều này đảm bảo an toàn cho cả hai bên.
              </p>
            </div>
          </div>
        </div>

        {/* Asset Tabs */}
        <div className="px-5 mb-4">
          <div className="flex gap-2">
            {['USDT', 'BTC', 'VND'].map(asset => {
              const count = MOCK_ESCROW_ORDERS[asset]?.length || 0;
              const isSelected = selectedAsset === asset;

              return (
                <button
                  key={asset}
                  onClick={() => {
                    hapticSelection();
                    setSelectedAsset(asset);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                  style={{
                    background: isSelected ? '#F59E0B' : c.surface2,
                    color: isSelected ? '#FFFFFF' : c.text2,
                  }}
                >
                  {asset}
                  {count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: isSelected ? 'rgba(255,255,255,0.2)' : hexToRgba('#F59E0B', 15),
                        color: isSelected ? '#FFFFFF' : '#F59E0B',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        <div className="px-5">
          {orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {orders.map(order => (
                <EscrowOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Lock size={48} color={c.text3} className="mx-auto mb-4" />
              <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                Không có tiền trong escrow
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                {selectedAsset} của bạn chưa bị khóa trong đơn hàng nào
              </p>
            </div>
          )}
        </div>

        {/* Help */}
        {orders.length > 0 && (
          <div className="px-5 mt-6">
            <TrCard rounded="md" className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <FileText size={16} color={c.text3} className="shrink-0 mt-0.5" />
                <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Khi nào tiền được giải phóng?
                </h4>
              </div>
              <ul style={{ color: c.text2, fontSize: 11, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Bán crypto: sau khi bạn release cho buyer</li>
                <li>Mua crypto: sau khi seller release cho bạn</li>
                <li>Tranh chấp: sau khi Support giải quyết xong</li>
                <li>Hủy đơn: tiền trả về ngay lập tức</li>
              </ul>
            </TrCard>
          </div>
        )}
      </PageLayout>
    </PullToRefresh>
  );
}