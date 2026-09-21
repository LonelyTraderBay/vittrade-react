import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Bell, ChevronRight, Star, Gift, Zap, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { CRYPTO_PAIRS, ANNOUNCEMENTS } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { getReferralStats, getCurrentTier } from '../../data/referralData';

function AnnouncementBanner() {
  const c = useThemeColors();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
    >
      <Zap size={14} color="#3B82F6" className="shrink-0" />
      <p style={{ color: c.text2, fontSize: 12, flex: 1 }}>{ANNOUNCEMENTS[idx].text}</p>
      <div className="flex gap-1">
        {ANNOUNCEMENTS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: i === idx ? '#3B82F6' : c.borderSolid }}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioCard() {
  const { user } = useAuth();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const total = user?.totalBalance ?? 54276.79;
  const dailyPnl = 1842.31;
  const dailyPct = 3.52;

  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a2550 0%, #0d1b3e 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        boxShadow: '0 8px 32px rgba(59,130,246,0.1)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: '#3B82F6', transform: 'translate(40%, -40%)' }}
      />
      <div className="flex items-center justify-between mb-1 relative">
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Tổng tài sản (USDT)</span>
        <button onClick={toggleBalanceHidden}>
          {isBalanceHidden ? (
            <EyeOff size={16} color="rgba(255,255,255,0.7)" />
          ) : (
            <Eye size={16} color="rgba(255,255,255,0.7)" />
          )}
        </button>
      </div>
      <div className="flex items-end gap-3 mb-3 relative">
        <span style={{ color: '#fff', fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
          {isBalanceHidden ? '••••••' : fmtUsd(total)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-4 relative">
        <div
          className="flex items-center gap-1 rounded-lg px-2 py-1"
          style={{ background: 'rgba(16,185,129,0.15)' }}
        >
          <TrendingUp size={12} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
            {isBalanceHidden ? '••••' : `+${fmtUsd(dailyPnl)} (+${dailyPct}%)`}
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>24h qua</span>
      </div>
      <div className="flex gap-3 relative">
        <button
          onClick={() => navigate(`${prefix}/wallet/deposit/USDT`)}
          className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6', fontSize: 14 }}
        >
          <span>↓</span> Nạp tiền
        </button>
        <button
          onClick={() => navigate(`${prefix}/wallet/withdraw/USDT`)}
          className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14 }}
        >
          <span>↑</span> Rút tiền
        </button>
        <button
          onClick={() => navigate(`${prefix}/wallet`)}
          className="h-11 w-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
        </button>
      </div>
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { isDesktop } = useBreakpoint();
  const actions = [
    {
      icon: '⚡',
      label: 'Mua nhanh',
      color: '#3B82F6',
      action: () => navigate(`${prefix}/trade/btcusdt`),
    },
    {
      icon: '🔄',
      label: 'Convert',
      color: '#10B981',
      action: () => navigate(`${prefix}/trade/convert`),
    },
    { icon: '📊', label: 'P2P', color: '#8B5CF6', action: () => navigate(`${prefix}/p2p`) },
    {
      icon: '🚀',
      label: 'Launchpad',
      color: '#F59E0B',
      action: () => navigate(`${prefix}/launchpad`),
    },
    {
      icon: '🏦',
      label: 'Staking',
      color: '#EF4444',
      action: () => navigate(`${prefix}/earn/staking`),
    },
    { icon: '📅', label: 'Mua định kỳ', color: '#8B5CF6', action: () => navigate(`${prefix}/dca`) },
    { icon: '🤖', label: 'Bot', color: '#06B6D4', action: () => navigate(`${prefix}/trade/bots`) },
    {
      icon: '📋',
      label: 'Copy Trade',
      color: '#F7931A',
      action: () => navigate(`${prefix}/trade/copy-trading`),
    },
    {
      icon: '💰',
      label: 'Tiết kiệm',
      color: '#26A17B',
      action: () => navigate(`${prefix}/earn/savings`),
    },
    {
      icon: '🎁',
      label: 'Phần thưởng',
      color: '#8B5CF6',
      action: () => navigate(`${prefix}/rewards`),
    },
    {
      icon: '📈',
      label: 'Margin',
      color: '#EF4444',
      action: () => navigate(`${prefix}/trade/margin`),
    },
    {
      icon: '🗺️',
      label: 'Heatmap',
      color: '#06B6D4',
      action: () => navigate(`${prefix}/markets/heatmap`),
    },
    {
      icon: '🏟️',
      label: 'Open Arena',
      color: '#8B5CF6',
      action: () => navigate(`${prefix}/arena`),
    },
  ];
  return (
    <div className={`grid gap-3 ${isDesktop ? 'grid-cols-8' : 'grid-cols-4'}`}>
      {actions.map((a, i) => (
        <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: a.color + '18', border: `1.5px solid ${a.color}33` }}
          >
            {a.icon}
          </div>
          <span style={{ color: c.text2, fontSize: 12 }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function MarketSection() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { isDesktop, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<'favorites' | 'gainers' | 'losers' | 'new'>(
    'favorites',
  );

  const filtered = CRYPTO_PAIRS.filter((p) => {
    if (activeTab === 'favorites') return p.isFavorite;
    if (activeTab === 'gainers') return p.change24h > 0;
    if (activeTab === 'losers') return p.change24h < 0;
    return true;
  }).slice(0, isDesktop ? 8 : 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Thị trường</span>
        <button
          onClick={() => navigate(`${prefix}/markets`)}
          className="flex items-center gap-1"
          style={{ color: '#3B82F6', fontSize: 13 }}
        >
          Xem tất cả <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'favorites', label: '⭐ Yêu thích' },
          { id: 'gainers', label: '🔺 Tăng mạnh' },
          { id: 'losers', label: '🔻 Giảm mạnh' },
          { id: 'new', label: '🆕 Mới' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: activeTab === tab.id ? c.chipActiveBg : c.chipBg,
              color: activeTab === tab.id ? c.chipActiveText : c.chipText,
              border: `1px solid ${activeTab === tab.id ? c.chipActiveBorder : c.chipBorder}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-1 mb-1">
        <span style={{ color: c.text3, fontSize: 11, flex: 1 }}>Tên</span>
        {(isTablet || isDesktop) && (
          <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'center' }}>
            Volume 24h
          </span>
        )}
        <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'center' }}>Biểu đồ</span>
        <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right' }}>Giá / 24h</span>
      </div>
      <TrCard overflow>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Star size={32} color={c.borderSolid} />
            <p style={{ color: c.text3, fontSize: 13 }}>Chưa có cặp giao dịch yêu thích</p>
          </div>
        ) : (
          filtered.map((pair, i) => {
            const isPos = pair.change24h >= 0;
            return (
              <button
                key={pair.id}
                onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                className="flex items-center gap-3 px-4 py-3 w-full active:opacity-70"
                style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: pair.logoColor + '22' }}
                >
                  <span style={{ color: pair.logoColor, fontSize: 11, fontWeight: 700 }}>
                    {pair.baseAsset.slice(0, 3)}
                  </span>
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                    {pair.baseAsset}
                  </span>
                  <span style={{ color: c.text3, fontSize: 11 }}>{pair.symbol}</span>
                </div>
                {(isTablet || isDesktop) && (
                  <div className="flex-1 text-center">
                    <span style={{ color: c.text2, fontSize: 12, fontFamily: 'monospace' }}>
                      {fmtCompact(pair.volume24h)}
                    </span>
                  </div>
                )}
                <SparklineChart
                  data={pair.sparklineData}
                  isPositive={isPos}
                  width={60}
                  height={28}
                />
                <div className="flex flex-col items-end shrink-0">
                  <span
                    style={{
                      color: c.text1,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {fmtPrice(pair.price)}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: isPos ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: isPos ? '#10B981' : '#EF4444',
                    }}
                  >
                    {fmtPct(pair.change24h)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </TrCard>
    </div>
  );
}

export function ResponsiveHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { notifications } = useUI();
  const { isDesktop } = useBreakpoint();

  return (
    <div
      className="flex flex-col gap-4 pb-6 pt-2"
      style={{ maxWidth: isDesktop ? 1200 : undefined }}
    >
      {/* Header — simplified on web since WebCommandBar handles nav/search */}
      {!isDesktop && (
        <div className="flex items-center justify-between px-5 pt-2">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 10L8 5L12 9L17 4"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>Xin chào 👋</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Nguyễn Văn A</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`${prefix}/markets`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: c.hoverBg }}
            >
              <Search size={18} color={c.text2} />
            </button>
            <button
              onClick={() => navigate(`${prefix}/notifications`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl relative"
              style={{ background: c.hoverBg }}
            >
              <Bell size={18} color={c.text2} />
              {notifications > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#EF4444', fontSize: 9, color: '#fff', fontWeight: 700 }}
                >
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Welcome header */}
      {isDesktop && (
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: c.text3, fontSize: 13 }}>Xin chào 👋</p>
            <p style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>Nguyễn Văn A</p>
          </div>
        </div>
      )}

      <div className={isDesktop ? '' : 'px-5'}>
        <button onClick={() => navigate(`${prefix}/news`)} className="w-full">
          <AnnouncementBanner />
        </button>
      </div>

      {/* Desktop: 2-column layout for Portfolio + Quick Actions */}
      {isDesktop ? (
        <div className="grid grid-cols-[1fr_1fr] gap-6">
          <PortfolioCard />
          <div className="flex flex-col gap-4">
            <QuickActions />
          </div>
        </div>
      ) : (
        <div className="contents">
          <div className="px-5">
            <PortfolioCard />
          </div>
          <div className="px-5">
            <QuickActions />
          </div>
        </div>
      )}

      <div className={isDesktop ? '' : 'px-5'}>
        <MarketSection />
      </div>

      <div
        className={`rounded-2xl p-4 flex items-center gap-4 ${isDesktop ? '' : 'mx-5'}`}
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(16,185,129,0.2)' }}
        >
          <Gift size={24} color="#10B981" />
        </div>
        <div className="flex-1">
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>P2P Trading</p>
          <p style={{ color: '#6EE7B7', fontSize: 12 }}>Mua bán USDT bằng VND — Không phí!</p>
        </div>
        <button
          onClick={() => navigate(`${prefix}/p2p`)}
          className="px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: '#10B981', color: '#fff' }}
        >
          Thử ngay
        </button>
      </div>

      {/* ─── Referral Banner ─── */}
      <div className={isDesktop ? '' : 'contents'}>
        <ReferralBanner prefix={prefix} />
      </div>
    </div>
  );
}

function ReferralBanner({ prefix }: { prefix: string }) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { isDesktop } = useBreakpoint();
  const stats = getReferralStats();
  const { current: currentTier } = getCurrentTier(stats.totalFriends);

  return (
    <div
      className={`rounded-2xl p-4 ${isDesktop ? '' : 'mx-5'}`}
      style={{ background: c.surface, border: `1px solid ${c.borderSolid}` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1))',
            border: `1px solid rgba(245,158,11,0.2)`,
          }}
        >
          <span style={{ fontSize: 22 }}>{currentTier.icon}</span>
        </div>
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Giới thiệu bạn bè</p>
          <p style={{ color: c.text3, fontSize: 12 }}>
            {stats.totalFriends} bạn bè · {fmtUsd(stats.totalCommission)} hoa hồng ·{' '}
            {currentTier.commission}%
          </p>
        </div>
        <button
          onClick={() => navigate(`${prefix}/referral`)}
          className="px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: 'rgba(245,158,11,0.15)',
            color: '#F59E0B',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          Xem
        </button>
      </div>
    </div>
  );
}
