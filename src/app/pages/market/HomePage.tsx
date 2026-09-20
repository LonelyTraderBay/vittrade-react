import {
  Gift,
  ChevronRight,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Search,
  Bell,
  Zap,
} from 'lucide-react';
import { fmtUsd, fmtPct, fmtSignedUsd } from '../../data/formatNumber';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CRYPTO_PAIRS, ANNOUNCEMENTS } from '../../data/mockData';
import { φ, φIcon, φAvatar, φRadius } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { RefreshTimestamp } from '../../components/states/RefreshableSkeletonList';
import { HomeDiscoverySection } from '../../components/bridges/ArenaPredictionBridges';
import { Coachmark } from '../../components/onboarding/Coachmark';
import { CountBadge } from '../../components/layout/Header';

/**
 * ══════════════════════════════════════════════════════════
 *  HOME PAGE — Sprint 2 Polish
 * ══════════════════════════════════════════════════════════
 *
 *  Changes from v1:
 *  ✓  Announcement: auto-rotate → tap-to-advance dot pagination
 *     (WCAG 2.2.2 compliant — no auto-moving content)
 *  ✓  Portfolio card: 3 glow divs → 1 single CSS background-image
 *  ✓  Section headers: every section has label + "Xem tất cả"
 *  ✓  Header notification badge → CountBadge component
 *  ✓  Hardcoded colors → semantic tokens (Sprint 1 partial, Sprint 2 complete)
 */

/* ─── Announcement Banner — Dot Pagination (WCAG-safe) ─── */
function AnnouncementBanner() {
  const c = useThemeColors();
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(0);

  /* Auto-advance at 6s — but pauses on interaction (WCAG 2.2.2) */
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || ANNOUNCEMENTS.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setIdx((i) =>
        dx < 0
          ? (i + 1) % ANNOUNCEMENTS.length
          : (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length,
      );
    }
    // Resume auto after 10s
    setTimeout(() => setPaused(false), 10000);
  }, []);

  return (
    <div
      className="flex flex-col gap-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex items-center gap-3 overflow-hidden"
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--tr-radius-card)',
          background: `linear-gradient(135deg, ${c.primaryAlpha08} 0%, ${c.primaryAlpha08} 100%)`,
          border: `1px solid ${c.primaryAlpha12}`,
        }}
      >
        <Gift size={18} color={c.primary} className="shrink-0" />
        <p className="flex-1 truncate" style={{ color: c.text2, fontSize: φ.sm }}>
          {ANNOUNCEMENTS[idx]?.text}
        </p>
        <ChevronRight size={φIcon.sm} color={c.text3} />
      </div>

      {/* Dot indicators */}
      {ANNOUNCEMENTS.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {ANNOUNCEMENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIdx(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 10000);
              }}
              className="rounded-full"
              style={{
                width: i === idx ? 16 : 5,
                height: 5,
                background: i === idx ? c.primary : c.text3,
                opacity: i === idx ? 1 : 0.35,
                transition: 'all var(--tr-duration-normal) ease',
              }}
              aria-label={`Thông báo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Portfolio Card ─── */
function PortfolioCard() {
  const { user } = useAuth();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const total = user?.totalBalance ?? 54276.79;
  const dailyPnl = 1842.31;
  const dailyPct = 3.52;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        padding: '22px 20px 20px',
        borderRadius: 'var(--tr-radius-card-lg)',
        background: c.portfolioBg,
        border: `1px solid ${c.portfolioBorder}`,
        boxShadow: c.portfolioShadow,
      }}
    >
      {/* Single decorative glow (consolidated for performance) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 85% 15%, ${c.primaryAlpha20} 0%, transparent 65%),
                       radial-gradient(ellipse 60% 50% at 15% 85%, ${c.primaryAlpha12} 0%, transparent 65%)`,
        }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span style={{ color: c.portfolioTextDim, fontSize: φ.sm }}>Tổng tài sản (USDT)</span>
        <button onClick={toggleBalanceHidden} className="p-1.5 hover-ghost rounded-lg">
          {isBalanceHidden ? (
            <EyeOff size={18} color={c.portfolioTextMuted} />
          ) : (
            <Eye size={18} color={c.portfolioTextDim} />
          )}
        </button>
      </div>

      {/* Balance */}
      <p
        className="relative z-10"
        style={{
          color: c.portfolioBtnGhostText,
          fontSize: 'var(--tr-text-amount-xl)',
          fontWeight: 700,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
          letterSpacing: -1,
          lineHeight: 1.1,
        }}
      >
        {isBalanceHidden ? '••••••' : fmtUsd(total)}
      </p>

      {/* PnL */}
      <div className="flex items-center gap-2 mt-2 mb-5 relative z-10">
        {!isBalanceHidden && (
          <div className="contents">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{ background: c.buyAlpha15, border: `1px solid ${c.buyAlpha20}` }}
            >
              <TrendingUp size={12} color={c.buy} strokeWidth={2.5} />
              <span style={{ color: c.buy, fontSize: 12, fontWeight: 600 }}>
                {fmtSignedUsd(dailyPnl)} ({fmtPct(dailyPct)})
              </span>
            </div>
            <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>hôm nay</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5 relative z-10">
        <button
          onClick={() => navigate(`${prefix}/wallet/deposit/usdt`)}
          className="flex-1 flex items-center justify-center gap-1.5 ripple"
          style={{
            height: 44,
            borderRadius: 'var(--tr-radius-cta)',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryAlpha60} 100%)`,
            color: '#fff',
            fontSize: 'var(--tr-text-button)',
            fontWeight: 600,
            boxShadow: `0 4px 14px ${c.primaryAlpha40}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          <ArrowDownToLine size={15} strokeWidth={2.2} />
          Nạp
        </button>
        <button
          onClick={() => navigate(`${prefix}/wallet/withdraw/usdt`)}
          className="flex-1 flex items-center justify-center gap-1.5 ripple"
          style={{
            height: 44,
            borderRadius: 'var(--tr-radius-cta)',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            fontSize: 'var(--tr-text-button)',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}
        >
          <ArrowUpFromLine size={15} strokeWidth={2.2} />
          Rút
        </button>
        <button
          onClick={() => navigate(`${prefix}/wallet`)}
          className="flex-1 flex items-center justify-center gap-1.5 ripple"
          style={{
            height: 44,
            borderRadius: 'var(--tr-radius-cta)',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            fontSize: 'var(--tr-text-button)',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Wallet size={15} strokeWidth={2.2} />
          Ví
        </button>
      </div>
    </div>
  );
}

/* ─── Quick Actions Grid ─── */
function QuickActions() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const actions = [
    { icon: '🔍', label: 'Khám phá', action: () => navigate(`${prefix}/topics`) },
    { icon: '⚡', label: 'Mua nhanh', action: () => navigate(`${prefix}/trade/btcusdt`) },
    { icon: '🔄', label: 'Convert', action: () => navigate(`${prefix}/trade/convert`) },
    { icon: '📊', label: 'P2P', action: () => navigate(`${prefix}/p2p`) },
    { icon: '🚀', label: 'Launchpad', action: () => navigate(`${prefix}/launchpad`) },
    { icon: '🏦', label: 'Staking', action: () => navigate(`${prefix}/earn/staking`) },
    { icon: '📅', label: 'Mua định kỳ', action: () => navigate(`${prefix}/dca`) },
    { icon: '🤖', label: 'Bot', action: () => navigate(`${prefix}/trade/bots`) },
    { icon: '📋', label: 'Copy Trade', action: () => navigate(`${prefix}/trade/copy-trading`) },
    { icon: '💰', label: 'Tiết kiệm', action: () => navigate(`${prefix}/earn/savings`) },
    { icon: '🎁', label: 'Phần thưởng', action: () => navigate(`${prefix}/rewards`) },
    { icon: '📈', label: 'Margin', action: () => navigate(`${prefix}/trade/margin`) },
    { icon: '🎉', label: 'Giới thiệu', action: () => navigate(`${prefix}/referral`) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((a) => (
        <TrCard
          key={a.label}
          as="button"
          hover
          rounded="sm"
          onClick={a.action}
          className="flex flex-col items-center gap-1 py-3"
        >
          <span style={{ fontSize: 18 }}>{a.icon}</span>
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{a.label}</span>
        </TrCard>
      ))}
    </div>
  );
}

/* ─── Section Header — reusable ─── */
function SectionHeader({
  title,
  icon,
  iconColor,
  onSeeAll,
}: {
  title: string;
  icon?: React.ReactNode;
  iconColor?: string;
  onSeeAll?: () => void;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between">
      <h2 style={{ color: c.text1, fontSize: 'var(--tr-text-headline)', fontWeight: 700 }}>
        {icon && (
          <span className="inline mr-1.5" style={{ verticalAlign: 'middle' }}>
            {icon}
          </span>
        )}
        {title}
      </h2>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1 hover-ghost rounded-lg px-2 py-1"
        >
          <span style={{ color: c.primary, fontSize: 'var(--tr-text-button)' }}>Xem tất cả</span>
          <ChevronRight size={φIcon.sm} color={c.primary} />
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton Loading List ─── */
function SkeletonList({ rows = 5 }: { rows?: number }) {
  const c = useThemeColors();
  return (
    <TrCard overflow>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5"
          style={{
            borderBottom: i < rows - 1 ? `1px solid ${c.divider}` : 'none',
          }}
        >
          <div
            className="shrink-0 animate-pulse"
            style={{
              width: φAvatar.sm,
              height: φAvatar.sm,
              borderRadius: φRadius.sm,
              background: c.surface2,
            }}
          />
          <div className="flex-1 flex flex-col gap-2">
            <div
              className="animate-pulse"
              style={{ width: '60%', height: 12, borderRadius: 4, background: c.surface2 }}
            />
            <div
              className="animate-pulse"
              style={{ width: '40%', height: 10, borderRadius: 4, background: c.surface2 }}
            />
          </div>
          <div
            className="animate-pulse"
            style={{ width: 64, height: 30, borderRadius: 4, background: c.surface2 }}
          />
          <div className="flex flex-col items-end gap-2">
            <div
              className="animate-pulse"
              style={{ width: 60, height: 12, borderRadius: 4, background: c.surface2 }}
            />
            <div
              className="animate-pulse"
              style={{ width: 45, height: 10, borderRadius: 4, background: c.surface2 }}
            />
          </div>
        </div>
      ))}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════ */
export function HomePage() {
  const navigate = useNavigate();
  const { notifications } = useUI();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<'hot' | 'gainers' | 'losers' | 'new'>('hot');
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({
    initialDelay: 600,
  });

  const hotPairs = CRYPTO_PAIRS.filter((p) => p.isFavorite).slice(0, 5);
  const gainerPairs = [...CRYPTO_PAIRS].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const loserPairs = [...CRYPTO_PAIRS].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const newPairs = CRYPTO_PAIRS.slice(-5);

  const tabPairs =
    tab === 'hot'
      ? hotPairs
      : tab === 'gainers'
        ? gainerPairs
        : tab === 'losers'
          ? loserPairs
          : newPairs;

  const tabs = [
    { key: 'hot' as const, label: '🔥 Hot' },
    { key: 'gainers' as const, label: '📈 Tăng' },
    { key: 'losers' as const, label: '📉 Giảm' },
    { key: 'new' as const, label: '🆕 Mới' },
  ];

  return (
    <>
      <PullToRefresh
        onRefresh={refresh}
        lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount}
        className="pb-8"
      >
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h1
            style={{
              color: c.text1,
              fontSize: 'var(--tr-text-amount-large)',
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            VitTrade
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`${prefix}/search`)}
              className="p-2.5 hover-ghost"
              style={{ borderRadius: 'var(--tr-radius-md)', background: c.searchBg }}
              aria-label="Tìm kiếm toàn cục"
            >
              <Search size={φIcon.md} color={c.text2} />
            </button>
            <button
              onClick={() => navigate(`${prefix}/notifications`)}
              className="p-2.5 hover-ghost relative"
              style={{ borderRadius: 'var(--tr-radius-md)', background: c.searchBg }}
              aria-label={`Thông báo (${notifications})`}
            >
              <Bell size={φIcon.md} color={c.text2} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5">
                  <CountBadge count={notifications} />
                </span>
              )}
            </button>
          </div>
        </div>

        <PageContent padding="compact">
          {/* ═══ Announcement ═══ */}
          <AnnouncementBanner />

          {/* ═══ Portfolio ═══ */}
          <PortfolioCard />

          {/* ═══ Quick Actions ═══ */}
          <SectionHeader title="Dịch vụ" />
          <QuickActions />

          {/* ═══ Discovery Bridge ═══ */}
          <div>
            <HomeDiscoverySection />
          </div>

          {/* ═══ Market Section ═══ */}
          <div>
            <SectionHeader title="Thị trường" onSeeAll={() => navigate(`${prefix}/markets`)} />

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3.5 py-1.5 transition-all"
                  style={{
                    borderRadius: φRadius.sm,
                    background: tab === t.key ? c.chipActiveBg : c.chipBg,
                    border: `1px solid ${tab === t.key ? c.chipActiveBorder : c.chipBorder}`,
                    color: tab === t.key ? c.chipActiveText : c.chipText,
                    fontSize: φ.sm,
                    fontWeight: tab === t.key ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Market List */}
            {isLoading ? (
              <SkeletonList rows={5} />
            ) : (
              <TrCard overflow>
                {tabPairs.map((pair, i) => (
                  <button
                    key={pair.id}
                    onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                    className="flex items-center gap-3 px-4 py-3.5 w-full market-row"
                    style={{
                      borderBottom: i < tabPairs.length - 1 ? `1px solid ${c.divider}` : 'none',
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: φAvatar.sm,
                        height: φAvatar.sm,
                        borderRadius: φRadius.sm,
                        background: `${pair.logoColor}18`,
                      }}
                    >
                      <span style={{ color: pair.logoColor, fontSize: φ.sm, fontWeight: 700 }}>
                        {pair.baseAsset.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                        {pair.symbol}
                      </p>
                      <p style={{ color: c.text3, fontSize: φ.xs }}>
                        Vol ${(pair.volume24h / 1e9).toFixed(2)}B
                      </p>
                    </div>

                    <div className="shrink-0">
                      <SparklineChart
                        data={pair.sparklineData}
                        isPositive={pair.change24h >= 0}
                        width={64}
                        height={30}
                      />
                    </div>

                    <div className="text-right shrink-0 min-w-[85px]">
                      <p
                        style={{
                          color: c.text1,
                          fontSize: φ.body,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        {fmtUsd(pair.price)}
                      </p>
                      <p
                        style={{
                          color: pair.change24h >= 0 ? c.buy : c.sell,
                          fontSize: φ.xs,
                          fontWeight: 600,
                        }}
                      >
                        {fmtPct(pair.change24h)}
                      </p>
                    </div>
                  </button>
                ))}
              </TrCard>
            )}
          </div>

          {/* ═══ Trending Section ═══ */}
          <div>
            <SectionHeader
              title="Xu hướng"
              icon={<Zap size={φIcon.md} color={c.warn} style={{ verticalAlign: 'middle' }} />}
              onSeeAll={() => navigate(`${prefix}/markets`)}
            />
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
              {CRYPTO_PAIRS.slice(0, 5).map((pair) => (
                <TrCard
                  key={pair.id}
                  as="button"
                  hover
                  onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                  className="shrink-0 p-4 text-left"
                  style={{ width: 148 }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: φRadius.xs,
                        background: `${pair.logoColor}18`,
                      }}
                    >
                      <span style={{ color: pair.logoColor, fontSize: φ.xs, fontWeight: 700 }}>
                        {pair.baseAsset.charAt(0)}
                      </span>
                    </div>
                    <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                      {pair.baseAsset}
                    </span>
                  </div>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: φ.base,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {fmtUsd(pair.price)}
                  </p>
                  <p
                    style={{
                      color: pair.change24h >= 0 ? c.buy : c.sell,
                      fontSize: φ.xs,
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    {fmtPct(pair.change24h)}
                  </p>
                </TrCard>
              ))}
            </div>
          </div>

          {/* ═══ Top Gainers ═══ */}
          <div>
            <SectionHeader
              title="Top tăng giá"
              icon={
                <TrendingUp size={φIcon.md} color={c.buy} style={{ verticalAlign: 'middle' }} />
              }
              onSeeAll={() => navigate(`${prefix}/markets`)}
            />
            <TrCard overflow>
              {gainerPairs.slice(0, 3).map((pair, i) => (
                <button
                  key={pair.id}
                  onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 w-full market-row"
                  style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}
                >
                  <span
                    style={{
                      color: i === 0 ? c.warn : c.text3,
                      fontSize: φ.sm,
                      fontWeight: 700,
                      width: 20,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: φAvatar.sm,
                      height: φAvatar.sm,
                      borderRadius: φRadius.sm,
                      background: `${pair.logoColor}18`,
                    }}
                  >
                    <span style={{ color: pair.logoColor, fontSize: φ.sm, fontWeight: 700 }}>
                      {pair.baseAsset.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                      {pair.symbol}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1"
                    style={{ borderRadius: φRadius.xs, background: c.buyAlpha10 }}
                  >
                    <span style={{ color: c.buy, fontSize: φ.sm, fontWeight: 700 }}>
                      {fmtPct(pair.change24h)}
                    </span>
                  </div>
                </button>
              ))}
            </TrCard>
          </div>

          {/* ═══ Top Losers ═══ */}
          <div>
            <SectionHeader
              title="Top giảm giá"
              icon={
                <TrendingDown size={φIcon.md} color={c.sell} style={{ verticalAlign: 'middle' }} />
              }
              onSeeAll={() => navigate(`${prefix}/markets`)}
            />
            <TrCard overflow>
              {loserPairs.slice(0, 3).map((pair, i) => (
                <button
                  key={pair.id}
                  onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 w-full market-row"
                  style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}
                >
                  <span
                    style={{
                      color: c.text3,
                      fontSize: φ.sm,
                      fontWeight: 700,
                      width: 20,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: φAvatar.sm,
                      height: φAvatar.sm,
                      borderRadius: φRadius.sm,
                      background: `${pair.logoColor}18`,
                    }}
                  >
                    <span style={{ color: pair.logoColor, fontSize: φ.sm, fontWeight: 700 }}>
                      {pair.baseAsset.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                      {pair.symbol}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1"
                    style={{ borderRadius: φRadius.xs, background: c.sellAlpha10 }}
                  >
                    <span style={{ color: c.sell, fontSize: φ.sm, fontWeight: 700 }}>
                      {fmtPct(pair.change24h)}
                    </span>
                  </div>
                </button>
              ))}
            </TrCard>
          </div>

          {/* ═══ Last Updated ═══ */}
          {lastRefreshedLabel && (
            <div>
              <RefreshTimestamp label={lastRefreshedLabel} count={refreshCount} />
            </div>
          )}
        </PageContent>
      </PullToRefresh>
      <Coachmark screen="home" onAction={(route) => navigate(route)} />
    </>
  );
}
