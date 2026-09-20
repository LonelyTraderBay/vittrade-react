import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ChevronRight, ArrowDownLeft, ArrowUpRight, Repeat, PieChart, Download, Upload, ShoppingCart, ArrowDownUp, Clock } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../contexts/UIContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { USER_ASSETS, TRANSACTIONS } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtAmount } from '../../data/formatNumber';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { getReferralStats, getCurrentTier } from '../../data/referralData';
import { WalletDCAShortcut, WalletDCAEmptyState } from '../../components/dca/WalletDCAShortcut';
import { useDCA } from '../../contexts/DCAContext';
import { PageLayout } from '../../components/layout/PageLayout';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  deposit: { label: 'Nạp', color: '#10B981', icon: '↓' },
  withdraw: { label: 'Rút', color: '#EF4444', icon: '↑' },
  trade_buy: { label: 'Mua', color: '#10B981', icon: '🔄' },
  trade_sell: { label: 'Bán', color: '#EF4444', icon: '🔄' },
  p2p_buy: { label: 'P2P Mua', color: '#10B981', icon: '🤝' },
  p2p_sell: { label: 'P2P Bán', color: '#EF4444', icon: '🤝' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Hoàn thành', color: '#10B981' },
  pending: { label: 'Đang xử lý', color: '#F59E0B' },
  failed: { label: 'Thất bại', color: '#EF4444' },
};

/* ─── Right Panel: Recent Activity (Desktop) ─── */
function RecentActivityPanel() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const recentTx = TRANSACTIONS.slice(0, 8);

  return (
    <div className="flex flex-col gap-4" style={{ width: 360 }}>
      <TrCard overflow>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Hoạt động gần đây</span>
          <button onClick={() => navigate(`${prefix}/wallet/history`)} style={{ color: '#3B82F6', fontSize: 13 }}>
            Xem tất cả
          </button>
        </div>
        {recentTx.map((tx, i) => {
          const type = TYPE_LABELS[tx.type] || { label: tx.type, color: '#8B95B3', icon: '•' };
          const status = STATUS_LABELS[tx.status] || { label: tx.status, color: '#8B95B3' };
          return (
            <button key={tx.id} onClick={() => navigate(`${prefix}/wallet/transaction/${tx.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < recentTx.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: type.color + '15', fontSize: 14 }}>
                {type.icon}
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{type.label} {tx.asset}</p>
                <p style={{ color: c.text3, fontSize: 11 }}>{tx.date}</p>
              </div>
              <div className="text-right">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  {fmtAmount(tx.amount)} {tx.asset}
                </p>
                <p style={{ color: status.color, fontSize: 11 }}>{status.label}</p>
              </div>
            </button>
          );
        })}
      </TrCard>
    </div>
  );
}

export function ResponsiveWalletPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const { isDesktop, isTablet } = useBreakpoint();
  const [tab, setTab] = useState<'assets' | 'chart'>('assets');
  const { plans } = useDCA();

  const totalUSD = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);
  const totalBTC = totalUSD / 67543.21;

  const mainContent = (
    <div className="flex flex-col flex-1">
      {/* Balance card */}
      <div className="rounded-3xl p-5 mb-4"
        style={{
          background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2550 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}>
        <div className="flex items-center justify-between mb-1">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Tổng tài sản ước tính</span>
          <button onClick={toggleBalanceHidden}>
            {isBalanceHidden ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.6)" />}
          </button>
        </div>
        <p style={{ color: '#FFFFFF', fontSize: isDesktop ? 36 : 28, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.15 }}>
          {isBalanceHidden ? '••••••' : fmtUsd(totalUSD)}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace', marginBottom: 16 }}>
          {isBalanceHidden ? '••••• BTC' : `≈ ${totalBTC.toFixed(8)} BTC`}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          {[
            { icon: Download, label: 'Nạp', color: '#10B981', action: () => navigate(`${prefix}/wallet/deposit/USDT`) },
            { icon: Upload, label: 'Rút', color: '#EF4444', action: () => navigate(`${prefix}/wallet/withdraw/USDT`) },
            { icon: ShoppingCart, label: 'Mua', color: '#3B82F6', action: () => navigate(`${prefix}/wallet/buy-crypto`) },
            { icon: ArrowDownUp, label: 'Chuyển', color: '#8B5CF6', action: () => navigate(`${prefix}/wallet/transfer`) },
            { icon: Clock, label: 'Lịch sử', color: '#8B95B3', action: () => navigate(`${prefix}/wallet/history`) },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: btn.color + '22' }}>
                <btn.icon size={18} color={btn.color} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => navigate(`${prefix}/wallet/portfolio-analytics`)}
          className="px-3 py-1.5 rounded-xl text-xs"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 600 }}>
          Phân tích Portfolio
        </button>
        <button onClick={() => navigate(`${prefix}/wallet/address-book`)}
          className="px-3 py-1.5 rounded-xl text-xs"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontWeight: 600 }}>
          Sổ địa chỉ
        </button>
        <span className="ml-auto" style={{ color: c.text3, fontSize: 12 }}>{USER_ASSETS.length} tài sản</span>
      </div>

      {/* DCA Shortcut — Consistency parity with WalletPage */}
      <div className="mb-4">
        {plans.length > 0 ? (
          <WalletDCAShortcut variant="full" />
        ) : (
          <WalletDCAEmptyState />
        )}
      </div>

      {/* Asset list */}
      <TrCard overflow>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <span className="flex-1" style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Tài sản</span>
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, width: 120, textAlign: 'right' }}>Số dư</span>
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, width: 100, textAlign: 'right' }}>Giá trị</span>
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, width: 80, textAlign: 'right' }}>24h</span>
          <span style={{ width: 24 }} />
        </div>
        {USER_ASSETS.map((asset, i) => (
          <button key={asset.id} onClick={() => navigate(`${prefix}/wallet/asset/${asset.id}`)}
            className="flex items-center gap-3 px-4 py-3 w-full active:opacity-70"
            style={{ borderBottom: i < USER_ASSETS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
            {/* Logo */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: asset.logoColor + '22', border: `1.5px solid ${asset.logoColor}44` }}>
              <span style={{ color: asset.logoColor, fontSize: 11, fontWeight: 700 }}>{asset.symbol.slice(0, 3)}</span>
            </div>

            {/* Name */}
            <div className="flex flex-col items-start flex-1">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{asset.symbol}</span>
              <span style={{ color: c.text3, fontSize: 11 }}>{asset.name}</span>
            </div>

            {/* Balance */}
            <div className={isDesktop ? "flex flex-col items-end" : "flex flex-col items-end"} style={isDesktop ? { width: 120 } : undefined}>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                {isBalanceHidden ? '••••' : fmtAmount(asset.balance)}
              </span>
              {!isDesktop && (
                <span style={{ color: c.text2, fontSize: 11 }}>
                  {isBalanceHidden ? '••••' : `≈ ${fmtUsd(asset.usdValue)}`}
                </span>
              )}
            </div>

            {/* USD Value (desktop only) */}
            {isDesktop && (
              <div style={{ width: 100, textAlign: 'right' }}>
                <span style={{ color: c.text2, fontSize: 13, fontFamily: 'monospace' }}>
                  {isBalanceHidden ? '••••' : fmtUsd(asset.usdValue)}
                </span>
              </div>
            )}

            {/* Change */}
            <div className="flex flex-col items-end" style={isDesktop ? { width: 80 } : { marginLeft: 8 }}>
              <span style={{ color: asset.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                {fmtPct(asset.change24h)}
              </span>
            </div>

            <ChevronRight size={16} color={c.text3} />
          </button>
        ))}
      </TrCard>
    </div>
  );

  return (
    <PageLayout>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Ví tài sản</h1>
      </div>

      <div className={`px-5 ${isDesktop ? 'flex gap-6' : ''}`}>
        {mainContent}
        {isDesktop && <RecentActivityPanel />}
      </div>

      {/* ─── Referral Banner ─── */}
      <div className="mx-5 mt-4">
        <WalletReferralCard prefix={prefix} />
      </div>
    </PageLayout>
  );
}

function WalletReferralCard({ prefix }: { prefix: string }) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const stats = getReferralStats();
  const { current: currentTier } = getCurrentTier(stats.totalFriends);

  return (
    <TrCard
      hover
      as="button"
      onClick={() => navigate(`${prefix}/referral`)}
      className="w-full p-4"
      accentBorder="rgba(245,158,11,0.2)"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1))' }}>
          <span style={{ fontSize: 18 }}>{currentTier.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Mời bạn bè, nhận thưởng</p>
          <p style={{ color: c.text3, fontSize: 12 }}>
            Hạng {currentTier.name} · {currentTier.commission}% hoa hồng vĩnh viễn
          </p>
        </div>
        <ChevronRight size={16} color={c.text3} />
      </div>
    </TrCard>
  );
}