import React, { useState, useMemo } from 'react';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { fmtUsd, fmtAmount, fmtPct } from '../../data/formatNumber';
import { useLoadingState } from '../../hooks/useLoadingState';
import { USER_ASSETS } from '../../data/mockData';
import { useUI } from '../../contexts/UIContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { φ, φIcon, φAvatar, φRadius } from '../../utils/golden';
import {
  Eye, EyeOff, Download, Upload, ShoppingCart, Clock,
  ChevronRight, ArrowDownUp, Search, Lock, ListOrdered, Gauge, ArrowDownLeft, Sparkles, Wifi,
} from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';
import { TabBar } from '../../components/layout/TabBar';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { SearchBar } from '../../components/ui/SearchBar';
import { WalletDCAShortcut, WalletDCAEmptyState } from '../../components/dca/WalletDCAShortcut';
import { useDCA } from '../../contexts/DCAContext';

/**
 * ══════════════════════════════════════════════════════════
 *  WALLET PAGE — Sprint 2 Restructure
 * ══════════════════════════════════════════════════════════
 *
 *  Changes from v1:
 *  ✓  Search bar for asset filtering
 *  ✓  "Hide small balances" toggle
 *  ✓  Cleaner 2-column asset row (left: symbol+name, right: balance+usd)
 *  ✓  Removed Referral Banner (wrong context — belongs in Profile/Home)
 *  ✓  Hardcoded colors → semantic tokens
 *  ✓  Action buttons use semantic icon colors
 *  ✓  PageLayout wrapper (already added in Sprint 1)
 */

/* ─── Mini Donut Chart ─── */
function MiniPieChart({ assets }: { assets: typeof USER_ASSETS }) {
  const c = useThemeColors();
  const total = assets.reduce((s, a) => s + a.usdValue, 0);
  const COLORS = ['#26A17B', '#F7931A', '#627EEA', '#9945FF', '#F3BA2F', '#0033AD'];
  let cumAngle = 0;

  const slices = assets.map((a, i) => {
    const pct = a.usdValue / total;
    const angle = pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...a, pct, angle, startAngle, color: COLORS[i % COLORS.length] };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const size = 89;
  const cx = size / 2;
  const radius = size * 0.42;
  const innerR = size * 0.25;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const start = polarToCartesian(cx, cx, radius, s.startAngle);
        const end = polarToCartesian(cx, cx, radius, s.startAngle + s.angle);
        const large = s.angle > 180 ? 1 : 0;
        const d = `M${cx},${cx} L${start.x},${start.y} A${radius},${radius} 0 ${large},1 ${end.x},${end.y} Z`;
        return <path key={i} d={d} fill={s.color} opacity={0.85} />;
      })}
      <circle cx={cx} cy={cx} r={innerR} fill={c.surface} />
      <text x={cx} y={cx - 2} textAnchor="middle" fill={c.text1} fontSize={φ.xs} fontWeight="700">
        {assets.length}
      </text>
      <text x={cx} y={cx + 10} textAnchor="middle" fill={c.text3} fontSize={8}>
        tài sản
      </text>
    </svg>
  );
}

/* ─── Action button colors mapped to semantic tokens ─── */
const ACTION_BUTTONS = [
  { icon: Download, label: 'Nạp', color: '#10B981', route: '/wallet/deposit/USDT' },
  { icon: Upload, label: 'Rút', color: '#EF4444', route: '/wallet/withdraw/USDT' },
  { icon: ShoppingCart, label: 'Mua', color: '#3B82F6', route: '/wallet/buy-crypto' },
  { icon: ArrowDownUp, label: 'Chuyển', color: '#8B5CF6', route: '/wallet/transfer' },
  { icon: Clock, label: 'Lịch sử', color: '#94A3B8', route: '/wallet/history' },
] as const;

const COLORS_MAP = ['#26A17B', '#F7931A', '#627EEA', '#9945FF', '#F3BA2F', '#0033AD'];

/* ═══════════════════════════════════════════════════════ */
export function WalletPage() {
  const navigate = useNavigate();
  const { isBalanceHidden, toggleBalanceHidden } = useUI();
  const c = useThemeColors();
  const [tab, setTab] = useState<'assets' | 'chart'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const { hapticSelection, hapticLight } = useHaptic();
  const routePrefix = useRoutePrefix();
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 600 });
  const { plans } = useDCA();

  const totalUSD = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);
  const totalBTC = totalUSD / 67543.21;

  /* ─── Balance breakdown ─── */
  const totalAvailable = useMemo(() => USER_ASSETS.reduce((s, a) => s + (a.available / a.balance) * a.usdValue, 0), []);
  const totalInOrder = useMemo(() => USER_ASSETS.reduce((s, a) => s + (a.inOrder / Math.max(a.balance, 0.000001)) * a.usdValue, 0), []);
  const totalFrozen = useMemo(() => USER_ASSETS.reduce((s, a) => s + (a.frozen / Math.max(a.balance, 0.000001)) * a.usdValue, 0), []);

  /* ─── Filtered & sorted assets ─── */
  const filteredAssets = useMemo(() => {
    let list = USER_ASSETS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    if (hideSmallBalances) {
      list = list.filter((a) => a.usdValue >= 1);
    }
    return list;
  }, [searchQuery, hideSmallBalances]);

  return (
    <PageLayout>
      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="min-h-full">
        <PageContent>
          {/* ═══ Page Title ═══ */}
          <div>
            <h1 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>Ví tài sản</h1>
          </div>

          {/* ═══ Balance Hero Card ═══ */}
          <TrCard variant="hero" rounded="lg" className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: c.portfolioTextDim, fontSize: φ.sm }}>
                Tổng tài sản ước tính
              </span>
              <button
                onClick={() => { toggleBalanceHidden(); hapticLight(); }}
                className="p-1 rounded-lg hover-ghost"
                aria-label={isBalanceHidden ? 'Hiện số dư' : 'Ẩn số dư'}
              >
                {isBalanceHidden
                  ? <EyeOff size={φIcon.sm} color={c.portfolioTextMuted} />
                  : <Eye size={φIcon.sm} color={c.portfolioTextDim} />
                }
              </button>
            </div>

            <div className="mb-1">
              <span
                style={{
                  color: c.portfolioBtnGhostText,
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                  lineHeight: 1.15,
                  letterSpacing: -1,
                }}
              >
                {isBalanceHidden ? '••••••' : fmtUsd(totalUSD)}
              </span>
            </div>

            <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs, marginBottom: φ.base, fontFamily: 'monospace' }}>
              {isBalanceHidden ? '••••• BTC' : `≈ ${totalBTC.toFixed(8)} BTC`}
            </p>

            {/* ═══ Balance Breakdown — Available / In Order / Locked ═══ */}
            <div
              className="grid grid-cols-3 gap-2 rounded-2xl p-3 mb-3"
              style={{ background: c.portfolioBtnGhost }}
            >
              {[
                { label: 'Khả dụng', value: totalAvailable, color: c.buy, icon: Eye },
                { label: 'Trong lệnh', value: totalInOrder, color: '#F59E0B', icon: ListOrdered },
                { label: 'Đóng băng', value: totalFrozen, color: c.sell, icon: Lock },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <item.icon size={10} color={item.color} />
                    <span style={{ color: c.portfolioTextMuted, fontSize: 10 }}>{item.label}</span>
                  </div>
                  <span
                    style={{
                      color: c.portfolioTextDim,
                      fontSize: φ.xs,
                      fontWeight: 600,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                    }}
                  >
                    {isBalanceHidden ? '••••' : fmtUsd(item.value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {ACTION_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => { navigate(`${routePrefix}${btn.route}`); hapticSelection(); }}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl hover-ghost"
                  style={{ background: c.portfolioBtnGhost }}
                >
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{ width: φAvatar.sm, height: φAvatar.sm, background: `${btn.color}22` }}
                  >
                    <btn.icon size={φIcon.md} color={btn.color} />
                  </div>
                  <span style={{ color: c.portfolioTextDim, fontSize: φ.xs }}>{btn.label}</span>
                </button>
              ))}
            </div>
          </TrCard>

          {/* ═══ DCA Shortcut ═══ */}
          <div>
            {plans.length > 0 ? (
              <WalletDCAShortcut variant="full" />
            ) : (
              <WalletDCAEmptyState />
            )}
          </div>

          {/* ═══ Quick Wallet Tools ═══ */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigate(`${routePrefix}/wallet/pending-deposits`); hapticSelection(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover-ghost"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
            >
              <ArrowDownLeft size={16} color={c.warn} />
              <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Nạp đang chờ</span>
            </button>
            <button
              onClick={() => { navigate(`${routePrefix}/wallet/limits`); hapticSelection(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover-ghost"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
            >
              <Gauge size={16} color={c.primary} />
              <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Hạn mức rút</span>
            </button>
            <button
              onClick={() => { navigate(`${routePrefix}/wallet/dust-converter`); hapticSelection(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover-ghost"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
            >
              <Sparkles size={16} color={c.accent} />
              <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Dọn dust</span>
            </button>
            <button
              onClick={() => { navigate(`${routePrefix}/wallet/network-status`); hapticSelection(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover-ghost"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
            >
              <Wifi size={16} color={c.success} />
              <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Trạng thái mạng</span>
            </button>
          </div>

          {/* ═══ View Toggle ═══ */}
          <TabBar
            variant="segment"
            tabs={[
              { id: 'assets', label: 'Danh sách' },
              { id: 'chart', label: 'Phân bổ' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {/* ═══ Allocation Chart ═══ */}
          {tab === 'chart' && (
            <TrCard className="p-4">
              <div className="flex items-center gap-4">
                <MiniPieChart assets={USER_ASSETS} />
                <div className="flex flex-col gap-2 flex-1">
                  {USER_ASSETS.map((a, i) => {
                    const pct = (a.usdValue / totalUSD) * 100;
                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: COLORS_MAP[i % COLORS_MAP.length] }}
                        />
                        <span style={{ color: c.text2, fontSize: φ.xs, flex: 1 }}>{a.symbol}</span>
                        <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TrCard>
          )}

          {/* ═══ Asset List ═══ */}
          {tab === 'assets' && (
            <div>
              {/* ─── Search + Filter Bar ─── */}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Tìm tài sản..."
                variant="compact"
                filterActive={hideSmallBalances}
                onFilterToggle={() => { setHideSmallBalances(!hideSmallBalances); hapticSelection(); }}
                className="mb-3"
              />

              {/* ─── Section Header ─── */}
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
                  {filteredAssets.length} tài sản
                  {hideSmallBalances && <span style={{ color: c.text3 }}> (đã lọc)</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { navigate(`${routePrefix}/wallet/address-book`); hapticSelection(); }}
                    className="px-2 py-1 rounded-xl hover-chip"
                    style={{
                      background: c.surface2,
                      color: c.text2,
                      fontSize: φ.xs,
                      fontWeight: 600,
                      border: `1px solid ${c.borderSolid}`,
                    }}
                  >
                    Sổ địa chỉ
                  </button>
                  <button
                    onClick={() => { navigate(`${routePrefix}/wallet/portfolio-analytics`); hapticSelection(); }}
                    className="px-2 py-1 rounded-xl hover-chip"
                    style={{
                      background: c.primaryAlpha12,
                      color: c.primary,
                      fontSize: φ.xs,
                      fontWeight: 600,
                      border: `1px solid ${c.primaryAlpha20}`,
                    }}
                  >
                    Phân tích
                  </button>
                </div>
              </div>

              {/* ─── Asset Rows — Restructured 2-column layout ─── */}
              <TrCard overflow>
                <RefreshableSkeletonList
                  isLoading={isLoading}
                  isRefreshing={isRefreshing}
                  rows={6}
                  lastRefreshedLabel={lastRefreshedLabel}
                  refreshCount={refreshCount}
                >
                  {filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Search size={24} color={c.text3} />
                      <p style={{ color: c.text3, fontSize: φ.sm }}>
                        Không tìm thấy tài sản
                      </p>
                    </div>
                  ) : (
                    filteredAssets.map((asset, i) => (
                      <button
                        key={asset.id}
                        onClick={() => { navigate(`${routePrefix}/wallet/asset/${asset.id}`); hapticSelection(); }}
                        className="flex items-center gap-3 px-4 w-full market-row"
                        style={{
                          paddingTop: 14,
                          paddingBottom: 14,
                          borderBottom: i < filteredAssets.length - 1 ? `1px solid ${c.divider}` : 'none',
                        }}
                      >
                        {/* Logo */}
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: φAvatar.sm,
                            height: φAvatar.sm,
                            background: `${asset.logoColor}22`,
                            border: `1.5px solid ${asset.logoColor}44`,
                          }}
                        >
                          <span style={{ color: asset.logoColor, fontSize: φ.xs, fontWeight: 700 }}>
                            {asset.symbol.slice(0, 3)}
                          </span>
                        </div>

                        {/* Left: Symbol + Name */}
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                              {asset.symbol}
                            </span>
                            <span
                              style={{
                                color: asset.change24h >= 0 ? c.buy : c.sell,
                                fontSize: φ.xs,
                                fontWeight: 600,
                              }}
                            >
                              {fmtPct(asset.change24h)}
                            </span>
                          </div>
                          <span className="truncate w-full text-left" style={{ color: c.text3, fontSize: φ.xs }}>
                            {asset.name}
                          </span>
                        </div>

                        {/* Right: Balance + USD value */}
                        <div className="flex flex-col items-end shrink-0">
                          <span
                            style={{
                              color: c.text1,
                              fontSize: φ.body,
                              fontWeight: 600,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                            }}
                          >
                            {isBalanceHidden ? '••••' : fmtAmount(asset.balance)}
                          </span>
                          <span style={{ color: c.text2, fontSize: φ.xs }}>
                            {isBalanceHidden ? '••••' : `≈ ${fmtUsd(asset.usdValue)}`}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronRight size={φIcon.sm} color={c.text3} className="shrink-0 ml-1" />
                      </button>
                    ))
                  )}
                </RefreshableSkeletonList>
              </TrCard>
            </div>
          )}
        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}