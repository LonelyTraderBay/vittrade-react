/**
 * ══════════════════════════════════════════════════════════
 *  P2PWalletPage — /p2p/wallet
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Separate P2P Wallet (isolated from main wallet)
 *  Balance breakdown: Available / In Escrow / Locked
 *  Quick transfer to/from main wallet
 *  Tone: Clear, trust-building, financial clarity
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Wallet, Lock, Shield, ArrowRightLeft, Eye, EyeOff,
  ChevronRight, Info, TrendingUp, TrendingDown, Clock,
  DollarSign, AlertCircle, History, ArrowUpRight, ArrowDownLeft,
  FileText, Download, Plus, Minus, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
   P2P Wallet Balance Mock Data
   ═══════════════════════════════════════════════════════════ */
interface AssetBalance {
  asset: string;
  symbol: string;
  available: number;
  inEscrow: number;
  locked: number;
  total: number;
  usdValue: number;
  logo: string;
}

const MOCK_BALANCES: AssetBalance[] = [
  {
    asset: 'USDT',
    symbol: 'USDT',
    available: 12_450.50,
    inEscrow: 3_200.00,
    locked: 500.00,
    total: 16_150.50,
    usdValue: 16_150.50,
    logo: '💵',
  },
  {
    asset: 'BTC',
    symbol: 'BTC',
    available: 0.0524,
    inEscrow: 0.0100,
    locked: 0.0000,
    total: 0.0624,
    usdValue: 4_243.20,
    logo: '₿',
  },
  {
    asset: 'VND',
    symbol: 'VND',
    available: 45_600_000,
    inEscrow: 12_000_000,
    locked: 0,
    total: 57_600_000,
    usdValue: 2_400.00,
    logo: '₫',
  },
];

const TOTAL_USD_VALUE = MOCK_BALANCES.reduce((acc, b) => acc + b.usdValue, 0);

/* ═══════════════════════════════════════════════════════════
   Recent Transactions Mock
   ═══════════════════════════════════════════════════════════ */
interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'transfer_in' | 'transfer_out';
  asset: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  time: string;
  orderId?: string;
}

const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'escrow_release',
    asset: 'USDT',
    amount: 1_500.00,
    status: 'completed',
    time: '10 phút trước',
    orderId: '#P2P-45892',
  },
  {
    id: '2',
    type: 'transfer_in',
    asset: 'USDT',
    amount: 5_000.00,
    status: 'completed',
    time: '2 giờ trước',
  },
  {
    id: '3',
    type: 'escrow_lock',
    asset: 'BTC',
    amount: 0.01,
    status: 'pending',
    time: '3 giờ trước',
    orderId: '#P2P-45880',
  },
  {
    id: '4',
    type: 'transfer_out',
    asset: 'VND',
    amount: 10_000_000,
    status: 'completed',
    time: '1 ngày trước',
  },
];

/* ═══════════════════════════════════════════════════════════
   Balance Card Component
   ═══════════════════════════════════════════════════════════ */
function BalanceCard({ balance, expanded, onToggle }: {
  balance: AssetBalance;
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <TrCard rounded="md" className="overflow-hidden">
      <button
        onClick={() => {
          hapticSelection();
          onToggle();
        }}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
          style={{ background: c.surface2 }}
        >
          {balance.logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              {balance.asset}
            </h3>
            <span style={{ color: c.text3, fontSize: 10 }}>
              ≈ ${fmtAmount(balance.usdValue, 2)}
            </span>
          </div>
          <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {balance.symbol === 'VND' ? fmtVnd(balance.total) : fmtAmount(balance.total, balance.symbol === 'BTC' ? 8 : 2)}
          </p>
        </div>

        <ChevronDown
          size={18}
          color={c.text3}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t" style={{ borderColor: c.borderSolid }}>
              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Wallet size={10} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Khả dụng</p>
                  </div>
                  <p style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {balance.symbol === 'VND' ? fmtVnd(balance.available) : fmtAmount(balance.available, balance.symbol === 'BTC' ? 8 : 2)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Lock size={10} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Escrow</p>
                  </div>
                  <p style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {balance.symbol === 'VND' ? fmtVnd(balance.inEscrow) : fmtAmount(balance.inEscrow, balance.symbol === 'BTC' ? 8 : 2)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Shield size={10} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Locked</p>
                  </div>
                  <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {balance.symbol === 'VND' ? fmtVnd(balance.locked) : fmtAmount(balance.locked, balance.symbol === 'BTC' ? 8 : 2)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticSelection();
                    navigate(`${prefix}/p2p/wallet/transfer?asset=${balance.asset}&type=deposit`);
                  }}
                  className="py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1"
                  style={{ background: hexToRgba('#10B981', 12), color: '#10B981' }}
                >
                  <Plus size={12} />
                  Chuyển vào
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticSelection();
                    navigate(`${prefix}/p2p/wallet/transfer?asset=${balance.asset}&type=withdraw`);
                  }}
                  className="py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1"
                  style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}
                >
                  <Minus size={12} />
                  Chuyển ra
                </button>
              </div>

              {balance.inEscrow > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticSelection();
                    navigate(`${prefix}/p2p/escrow/balance?asset=${balance.asset}`);
                  }}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  style={{ background: c.surface2, color: c.text2 }}
                >
                  <FileText size={11} />
                  Xem chi tiết Escrow
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PWalletPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
        return ArrowDownLeft;
      case 'withdraw':
      case 'transfer_out':
        return ArrowUpRight;
      case 'escrow_lock':
        return Lock;
      case 'escrow_release':
        return Shield;
      default:
        return DollarSign;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
      case 'escrow_release':
        return '#10B981';
      case 'withdraw':
      case 'transfer_out':
        return '#EF4444';
      case 'escrow_lock':
        return '#F59E0B';
      default:
        return c.text3;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Nạp tiền';
      case 'withdraw': return 'Rút tiền';
      case 'transfer_in': return 'Chuyển vào từ Main Wallet';
      case 'transfer_out': return 'Chuyển ra Main Wallet';
      case 'escrow_lock': return 'Khóa Escrow';
      case 'escrow_release': return 'Giải phóng Escrow';
      default: return 'Giao dịch';
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header
          title="P2P Wallet"
          subtitle="Ví · P2P"
          back
          action={{
            icon: History,
            onClick: () => navigate(`${prefix}/p2p/wallet/history`),
          }}
        />

        {/* Total Balance Card */}
        <div className="px-5 py-4">
          <TrCard
            rounded="lg"
            className="p-5"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 4 }}>
                  Tổng tài sản P2P
                </p>
                <div className="flex items-center gap-2">
                  {balanceVisible ? (
                    <h2 style={{
                      color: '#FFFFFF',
                      fontSize: φ.xl,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      ${fmtAmount(TOTAL_USD_VALUE, 2)}
                    </h2>
                  ) : (
                    <h2 style={{ color: '#FFFFFF', fontSize: φ.xl, fontWeight: 700 }}>
                      ••••••
                    </h2>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  hapticSelection();
                  setBalanceVisible(!balanceVisible);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {balanceVisible ? (
                  <Eye size={16} color="#FFFFFF" />
                ) : (
                  <EyeOff size={16} color="#FFFFFF" />
                )}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  hapticSelection();
                  navigate(`${prefix}/p2p/wallet/transfer?direction=from-main`);
                }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
              >
                <ArrowDownLeft size={16} />
                Chuyển từ Main
              </button>
              <button
                onClick={() => {
                  hapticSelection();
                  navigate(`${prefix}/p2p/wallet/transfer?direction=to-main`);
                }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#3B82F6' }}
              >
                <ArrowUpRight size={16} />
                Chuyển về Main
              </button>
            </div>
          </TrCard>
        </div>

        {/* Info Banner */}
        <div className="px-5 mb-4">
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              P2P Wallet tách biệt khỏi Main Wallet để đảm bảo an toàn. Chuyển tiền nội bộ miễn phí & tức thì.
            </p>
          </div>
        </div>

        {/* Asset Balances */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Tài sản
          </h3>

          <div className="flex flex-col gap-3">
            {MOCK_BALANCES.map(balance => (
              <BalanceCard
                key={balance.asset}
                balance={balance}
                expanded={expandedAsset === balance.asset}
                onToggle={() => setExpandedAsset(expandedAsset === balance.asset ? null : balance.asset)}
              />
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Giao dịch gần đây
            </h3>
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/wallet/history`);
              }}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#3B82F6' }}
            >
              Xem tất cả
              <ChevronRight size={12} />
            </button>
          </div>

          <TrCard rounded="lg" className="overflow-hidden">
            {RECENT_TRANSACTIONS.map((tx, idx) => {
              const TxIcon = getTransactionIcon(tx.type);
              const txColor = getTransactionColor(tx.type);
              const isLast = idx === RECENT_TRANSACTIONS.length - 1;

              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center gap-3"
                  style={{
                    borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: hexToRgba(txColor, 12) }}
                  >
                    <TxIcon size={18} color={txColor} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                      {getTransactionLabel(tx.type)}
                    </p>
                    <div className="flex items-center gap-2">
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        <Clock size={9} className="inline mr-1" />
                        {tx.time}
                      </p>
                      {tx.orderId && (
                        <>
                          <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                          <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                            {tx.orderId}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      style={{
                        color: txColor,
                        fontSize: φ.sm,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {tx.type.includes('in') || tx.type === 'escrow_release' || tx.type === 'deposit' ? '+' : '-'}
                      {fmtAmount(tx.amount, tx.asset === 'BTC' ? 8 : 2)} {tx.asset}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: tx.status === 'completed' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {tx.status === 'completed' ? 'Hoàn thành' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                    </p>
                  </div>
                </div>
              );
            })}
          </TrCard>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}