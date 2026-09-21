import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  BarChart3,
  Globe,
  Zap,
  Target,
  Layers,
  PieChart,
  Award,
  ArrowLeftRight,
  Activity,
  Wallet,
  Shield,
  Clock,
  Users,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { CRYPTO_PAIRS, USER_ASSETS, OPEN_ORDERS, TRANSACTIONS } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';

/**
 * WebHomePage — Enterprise Desktop Dashboard
 * Multi-widget grid layout, data tables, professional density
 */

/* ─── Stat Widget ─── */
function StatWidget({
  label,
  value,
  sub,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick?: () => void;
}) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="web-cmd-btn flex items-center gap-4 rounded-xl p-4 text-left transition-colors"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '12', border: `1px solid ${color}22` }}
      >
        <Icon size={WEB_ICON.md} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          style={{
            color: c.text3,
            fontSize: WEB_FONT.xs,
            fontWeight: 600,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </p>
        <p
          style={{
            color: c.text1,
            fontSize: WEB_FONT.xl,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontVariantNumeric: 'tabular-nums' }}>
            {sub}
          </p>
        )}
      </div>
      <ChevronRight size={WEB_ICON.sm} color={c.text3} className="shrink-0" />
    </button>
  );
}

/* ─── Market Table ─── */
function MarketTable() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');

  const filtered = CRYPTO_PAIRS.filter((p) => {
    if (tab === 'favorites') return p.isFavorite;
    if (tab === 'gainers') return p.change24h > 0;
    if (tab === 'losers') return p.change24h < 0;
    return true;
  });

  const tabs = [
    { id: 'all' as const, label: 'Tất cả' },
    { id: 'favorites' as const, label: 'Yêu thích' },
    { id: 'gainers' as const, label: 'Tăng' },
    { id: 'losers' as const, label: 'Giảm' },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${c.divider}` }}
      >
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: tab === t.id ? c.chipActiveBg : 'transparent',
                color: tab === t.id ? c.chipActiveText : c.text3,
                fontSize: WEB_FONT.sm,
                fontWeight: tab === t.id ? 600 : 500,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/w/markets')}
          className="flex items-center gap-1"
          style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}
        >
          Xem tất cả <ChevronRight size={WEB_ICON.xs} />
        </button>
      </div>

      {/* Table header */}
      <div
        className="grid items-center px-5 py-2"
        style={{
          gridTemplateColumns: '2fr 1.2fr 1fr 100px 1fr 80px',
          borderBottom: `1px solid ${c.divider}`,
        }}
      >
        <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
          Cặp giao dịch
        </span>
        <span
          style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
        >
          Giá
        </span>
        <span
          style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
        >
          24h
        </span>
        <span
          style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'center' }}
        >
          Biểu đồ
        </span>
        <span
          style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
        >
          Volume
        </span>
        <span
          style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}
        >
          Market Cap
        </span>
      </div>

      {/* Table rows */}
      {filtered.map((pair, i) => {
        const isPos = pair.change24h >= 0;
        return (
          <button
            key={pair.id}
            onClick={() => navigate(`/w/trade/${pair.id}`)}
            className="web-cmd-btn grid items-center px-5 py-2.5 w-full transition-colors"
            style={{
              gridTemplateColumns: '2fr 1.2fr 1fr 100px 1fr 80px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: pair.logoColor + '18' }}
              >
                <span style={{ color: pair.logoColor, fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                  {pair.baseAsset.slice(0, 3)}
                </span>
              </div>
              <div className="text-left">
                <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}>
                  {pair.baseAsset}
                </span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 4 }}>
                  /{pair.quoteAsset}
                </span>
              </div>
            </div>
            <span
              style={{
                color: c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              ${fmtPrice(pair.price)}
            </span>
            <div style={{ textAlign: 'right' }}>
              <span
                className="inline-block rounded px-1.5 py-0.5"
                style={{
                  background: isPos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: isPos ? '#10B981' : '#EF4444',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtPct(pair.change24h)}
              </span>
            </div>
            <div className="flex justify-center">
              <SparklineChart data={pair.sparklineData} isPositive={isPos} width={72} height={24} />
            </div>
            <span
              style={{
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {fmtCompact(pair.volume24h, { prefix: '$' })}
            </span>
            <span
              style={{
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {fmtCompact(pair.marketCap, { prefix: '$' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Recent Activity Table ─── */
function RecentActivityTable() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const recentTx = TRANSACTIONS.slice(0, 6);

  const TYPE_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> =
    {
      deposit: { label: 'Nạp', color: '#10B981', icon: ArrowDownLeft },
      withdraw: { label: 'Rút', color: '#EF4444', icon: ArrowUpRight },
      trade_buy: { label: 'Mua', color: '#10B981', icon: ArrowLeftRight },
      trade_sell: { label: 'Bán', color: '#EF4444', icon: ArrowLeftRight },
      p2p_buy: { label: 'P2P Mua', color: '#10B981', icon: Users },
      p2p_sell: { label: 'P2P Bán', color: '#EF4444', icon: Users },
    };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${c.divider}` }}
      >
        <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
          Hoạt động gần đây
        </span>
        <button
          onClick={() => navigate('/w/wallet/history')}
          style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}
        >
          Xem tất cả
        </button>
      </div>
      {recentTx.map((tx, i) => {
        const type = TYPE_MAP[tx.type] || { label: tx.type, color: '#8B95B3', icon: Clock };
        const Icon = type.icon;
        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 px-5 py-2.5"
            style={{ borderBottom: i < recentTx.length - 1 ? `1px solid ${c.divider}` : 'none' }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: type.color + '12' }}
            >
              <Icon size={15} color={type.color} />
            </div>
            <div className="flex-1 min-w-0">
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                {type.label}
              </span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm, marginLeft: 6 }}>
                {tx.asset}
              </span>
            </div>
            <span
              style={{
                color: c.text1,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tx.amount.toLocaleString('en-US')} {tx.asset}
            </span>
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                background:
                  tx.status === 'completed'
                    ? 'rgba(16,185,129,0.1)'
                    : tx.status === 'pending'
                      ? 'rgba(245,158,11,0.1)'
                      : 'rgba(239,68,68,0.1)',
                color:
                  tx.status === 'completed'
                    ? '#10B981'
                    : tx.status === 'pending'
                      ? '#F59E0B'
                      : '#EF4444',
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
              }}
            >
              {tx.status === 'completed'
                ? 'Hoàn thành'
                : tx.status === 'pending'
                  ? 'Đang xử lý'
                  : 'Thất bại'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Open Orders Widget ─── */
function OpenOrdersWidget() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${c.divider}` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
            Lệnh đang mở
          </span>
          {OPEN_ORDERS.length > 0 && (
            <span
              className="rounded px-1.5 py-0.5"
              style={{ background: '#3B82F6', color: '#fff', fontSize: 10, fontWeight: 700 }}
            >
              {OPEN_ORDERS.length}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/w/trade/orders-history')}
          style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}
        >
          Xem tất cả
        </button>
      </div>
      {OPEN_ORDERS.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <Clock size={28} color={c.text3} style={{ opacity: 0.5 }} />
          <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Không có lệnh đang mở</p>
        </div>
      ) : (
        OPEN_ORDERS.slice(0, 4).map((order, i) => (
          <div
            key={order.id}
            className="flex items-center gap-3 px-5 py-2.5"
            style={{
              borderBottom:
                i < Math.min(OPEN_ORDERS.length, 4) - 1 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <span
              className="rounded px-1.5 py-0.5 text-xs font-bold"
              style={{
                background: order.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: order.side === 'buy' ? '#10B981' : '#EF4444',
                minWidth: 32,
                textAlign: 'center',
              }}
            >
              {order.side === 'buy' ? 'MUA' : 'BÁN'}
            </span>
            <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, flex: 1 }}>
              {order.symbol}
            </span>
            <span
              style={{ color: c.text2, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}
            >
              {fmtPrice(order.price)}
            </span>
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
              {order.amount} / {order.filled}
            </span>
            <button
              className="px-2 py-1 rounded text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
            >
              Hủy
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Quick Navigation Grid ─── */
function QuickNavGrid() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const items = [
    { icon: ArrowLeftRight, label: 'Spot Trading', path: '/w/trade/btcusdt', color: '#3B82F6' },
    { icon: Globe, label: 'P2P Trading', path: '/w/p2p', color: '#10B981' },
    { icon: Target, label: 'Predictions', path: '/w/markets/predictions', color: '#F59E0B' },
    { icon: Zap, label: 'Open Arena', path: '/w/arena', color: '#8B5CF6' },
    { icon: PieChart, label: 'Earn & Savings', path: '/w/earn/savings', color: '#06B6D4' },
    { icon: Layers, label: 'Launchpad', path: '/w/launchpad', color: '#EF4444' },
    { icon: Activity, label: 'Trading Bots', path: '/w/trade/bots', color: '#F97316' },
    { icon: Award, label: 'Giới thiệu', path: '/w/referral', color: '#EC4899' },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.border}` }}
    >
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
          Truy cập nhanh
        </span>
      </div>
      <div className="grid grid-cols-4 gap-0">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="web-cmd-btn flex flex-col items-center gap-2 py-4 transition-colors"
              style={{
                borderRight: (i + 1) % 4 !== 0 ? `1px solid ${c.divider}` : 'none',
                borderBottom: i < 4 ? `1px solid ${c.divider}` : 'none',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: item.color + '10', border: `1px solid ${item.color}20` }}
              >
                <Icon size={17} color={item.color} />
              </div>
              <span style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function WebHomePage() {
  const c = useThemeColors();
  const { user } = useAuth();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const navigate = useNavigate();

  const totalUSD = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);
  const dailyPnl = 1842.31;
  const dailyPct = 3.52;

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Dashboard"
        subtitle="Chào mừng trở lại"
        right={
          <button
            onClick={toggleBalanceHidden}
            className="web-cmd-btn flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{ border: `1px solid ${c.border}` }}
          >
            {isBalanceHidden ? (
              <EyeOff size={14} color={c.text3} />
            ) : (
              <Eye size={14} color={c.text3} />
            )}
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
              {isBalanceHidden ? 'Hiện số dư' : 'Ẩn số dư'}
            </span>
          </button>
        }
      />
      <div className="flex flex-col gap-6 py-6 px-6" style={{ maxWidth: 1200 }}>
        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-4 gap-4">
          <StatWidget
            label="Tổng tài sản"
            value={isBalanceHidden ? '••••••' : fmtUsd(totalUSD)}
            sub={isBalanceHidden ? '••••' : `${dailyPct > 0 ? '+' : ''}${dailyPct}% hôm nay`}
            icon={Wallet}
            color="#3B82F6"
            onClick={() => navigate('/w/wallet')}
          />
          <StatWidget
            label="P&L 24h"
            value={isBalanceHidden ? '••••' : `+${fmtUsd(dailyPnl)}`}
            sub={`${OPEN_ORDERS.length} lệnh đang mở`}
            icon={TrendingUp}
            color="#10B981"
            onClick={() => navigate('/w/trade/orders-history')}
          />
          <StatWidget
            label="Spot Volume 30d"
            value={isBalanceHidden ? '••••' : fmtCompact(23456789, { prefix: '$' })}
            sub="VIP 3 · Maker 0.08%"
            icon={BarChart3}
            color="#8B5CF6"
            onClick={() => navigate('/w/profile/vip')}
          />
          <StatWidget
            label="Bảo mật"
            value="Cao"
            sub="2FA bật · KYC Lv3"
            icon={Shield}
            color="#F59E0B"
            onClick={() => navigate('/w/profile/security')}
          />
        </div>

        {/* ─── Main Content: Market Table + Sidebar ─── */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 380px' }}>
          {/* Left: Market Table */}
          <div className="flex flex-col gap-6">
            <MarketTable />
            <OpenOrdersWidget />
          </div>

          {/* Right: Activity + Quick Nav */}
          <div className="flex flex-col gap-6">
            <QuickNavGrid />
            <RecentActivityTable />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
