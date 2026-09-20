/**
 * ══════════════════════════════════════════════════════════
 *  WEB COPY TRADING PAGE — Enterprise Fintech v2
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/trade/copy
 *
 *  Layout (full Shell width, no inner maxWidth):
 *  ──────────────────────────────────────────────
 *  S1  Sub-nav bar (Discover / Active Copies / Education)
 *  S2  Platform stats banner (4 KPIs inline)
 *  S3  Search + Filter + Sort bar
 *  S4  Trader grid (3-col responsive) with enterprise cards
 *  S5  Risk disclosure footer
 *
 *  Canonical tokens only: WEB_FONT flat, WEB_BUTTON flat,
 *  WEB_ICON flat, useThemeColors (c.text1/text2/text3/bg/surface/border/divider).
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Star,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Search,
  SlidersHorizontal,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  BookOpen,
  Zap,
  Award,
  Crown,
  Layers,
  Activity,
  Eye,
  ChevronDown,
  Info,
  Target,
  Percent,
  Clock,
  Flame,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COPY_TRADERS, type CopyTrader } from '../../data/mockData';
import { fmtSignedUsd } from '../../data/formatNumber';
import {
  SORT_OPTIONS,
  RISK_LEVELS,
  TIER_THRESHOLDS,
  COMPLIANCE_MESSAGES,
} from '../../constants/copyTrading';
import type { SortOption } from '../../constants/copyTrading';
import { WEB_FONT, WEB_BUTTON, WEB_ICON } from '../../components/layout/webConstants';

/* ═══════════════════════════════════════════════════════════
   HELPERS & CONFIG
   ═══════════════════════════════════════════════════════════ */

const RISK_CONFIG: Record<string, { color: string; label: string; icon: LucideIcon }> = {
  low: { color: RISK_LEVELS.LOW.color, label: RISK_LEVELS.LOW.label, icon: Shield },
  medium: { color: RISK_LEVELS.MEDIUM.color, label: RISK_LEVELS.MEDIUM.label, icon: Activity },
  high: { color: RISK_LEVELS.HIGH.color, label: RISK_LEVELS.HIGH.label, icon: Zap },
};

interface TierCfg {
  icon: LucideIcon;
  color: string;
  label: string;
  bg: string;
}

const getTier = (copiers: number): TierCfg => {
  if (copiers > TIER_THRESHOLDS.PRO)
    return { icon: Crown, color: '#F59E0B', label: 'Pro Trader', bg: '#F59E0B10' };
  if (copiers > TIER_THRESHOLDS.VERIFIED)
    return { icon: CheckCircle, color: '#10B981', label: 'Verified', bg: '#10B98110' };
  return { icon: AlertCircle, color: '#6B7280', label: 'Basic', bg: '#6B728010' };
};

const fmtC = (v: number, pfx = '') => {
  if (v >= 1e9) return `${pfx}${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${pfx}${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${pfx}${(v / 1e3).toFixed(1)}K`;
  return `${pfx}${v.toLocaleString('en-US')}`;
};

/* ─── Sparkline ─── */
function Spark({ data, w = 100, h = 32 }: { data: number[]; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const mn = Math.min(...data),
    mx = Math.max(...data),
    rng = mx - mn || 1,
    p = 2;
  const pts = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2);
    const y = h - p - ((v - mn) / rng) * (h - p * 2);
    return `${x},${y}`;
  });
  const lastPositive = data[data.length - 1] >= data[0];
  const clr = lastPositive ? '#10B981' : '#EF4444';
  const gId = `ct-${clr.replace('#', '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clr} stopOpacity={0.15} />
          <stop offset="100%" stopColor={clr} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`${p},${h} ${pts.join(' ')} ${w - p},${h}`} fill={`url(#${gId})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={clr}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {(() => {
        const c = pts[pts.length - 1].split(',');
        return <circle cx={c[0]} cy={c[1]} r={2.5} fill={clr} />;
      })()}
    </svg>
  );
}

/* ─── Weekly bar chart ─── */
function WeeklyBars({ data }: { data: number[] }) {
  const max = Math.max(...data.map(Math.abs), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 28 }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (Math.abs(v) / max) * 100)}%`,
            background: v >= 0 ? '#10B981' : '#EF4444',
            opacity: 0.7 + (i / data.length) * 0.3,
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Sub-navigation tabs ─── */
interface SubTab {
  readonly key: string;
  readonly label: string;
  readonly icon: typeof Search;
  readonly badge?: number;
}
const SUB_TABS: readonly SubTab[] = [
  { key: 'discover', label: 'Khám phá', icon: Search },
  { key: 'active', label: 'Đang copy', icon: Copy, badge: 1 },
  { key: 'education', label: 'Hướng dẫn', icon: BookOpen },
];

interface RiskFilterOption {
  readonly key: string;
  readonly label: string;
  readonly color?: string;
}
const RISK_FILTERS: readonly RiskFilterOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'low', label: 'Rủi ro thấp', color: '#10B981' },
  { key: 'medium', label: 'Trung bình', color: '#F59E0B' },
  { key: 'high', label: 'Rủi ro cao', color: '#EF4444' },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebCopyTradingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<SortOption>('Top ROI');
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COPY_TRADERS.map((t) => [t.id, t.isFollowing])),
  );

  const traders = useMemo(() => {
    let list: CopyTrader[] = [...COPY_TRADERS];
    if (riskFilter !== 'all') list = list.filter((t) => t.riskLevel === riskFilter);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.tags.some((tg) => tg.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => {
      if (sortBy === 'Top ROI') return b.totalPnlPct - a.totalPnlPct;
      if (sortBy === 'Ổn định nhất') return b.sharpeRatio - a.sharpeRatio;
      if (sortBy === 'Nhiều copier') return b.copiers - a.copiers;
      return b.aum - a.aum;
    });
  }, [sortBy, riskFilter, searchQ]);

  const stats = useMemo(
    () => ({
      traders: COPY_TRADERS.length,
      copiers: COPY_TRADERS.reduce((s, t) => s + t.copiers, 0),
      aum: COPY_TRADERS.reduce((s, t) => s + t.aum, 0),
      avgRoi: COPY_TRADERS.reduce((s, t) => s + t.totalPnlPct, 0) / COPY_TRADERS.length,
    }),
    [],
  );

  const toggleFollow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const R = 12;
  const bdr = `1px solid ${c.border}`;

  /* ─── Hover styles ─── */
  const HOVER_SHADOW =
    '0 0 0 3px rgba(59,130,246,0.08), 0 8px 24px rgba(59,130,246,0.10), 0 2px 8px rgba(0,0,0,0.04)';
  const HOVER_BORDER = 'rgba(59,130,246,0.35)';

  /* ─── Featured trader (highest AUM) ─── */
  const featured = useMemo(() => {
    return [...COPY_TRADERS].sort((a, b) => b.aum - a.aum)[0];
  }, []);

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Copy Trading"
        subtitle="Sao chép · Trade"
        back
        action={{ icon: SlidersHorizontal, onClick: () => {} }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            S1: SUB-NAV + ACTIVE COPIES QUICK ACCESS
            ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1"
            style={{ background: c.surface, border: bdr, borderRadius: 10, padding: 3 }}
          >
            {SUB_TABS.map((tab) => {
              const active = tab.key === 'discover';
              const I = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === 'active') navigate('/w/trade/copy/active');
                    else if (tab.key === 'education') navigate('/w/trade/copy/education');
                  }}
                  className="flex items-center gap-1.5 transition-colors"
                  style={{
                    height: WEB_BUTTON.sm,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: active ? c.bg : 'transparent',
                    color: active ? c.text1 : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: active ? 700 : 500,
                    border: active ? bdr : '1px solid transparent',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : undefined,
                  }}
                >
                  <I size={13} />
                  {tab.label}
                  {tab.badge && (
                    <span
                      className="flex items-center justify-center"
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        padding: '0 4px',
                        background: '#3B82F6',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/w/trade/copy/active')}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                height: WEB_BUTTON.sm,
                padding: '0 14px',
                borderRadius: 8,
                background: '#3B82F608',
                border: '1px solid #3B82F620',
                color: '#3B82F6',
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Layers size={13} /> 1 đang copy · $2,500
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            S2: PLATFORM STATS BANNER
            ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            background: c.surface,
            border: bdr,
            borderRadius: R,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            {
              icon: Users,
              label: 'Traders hoạt động',
              value: String(stats.traders),
              sub: 'Đã xác minh',
              color: '#3B82F6',
            },
            {
              icon: Copy,
              label: 'Tổng copiers',
              value: fmtC(stats.copiers),
              sub: '+12% tháng này',
              color: '#8B5CF6',
            },
            {
              icon: DollarSign,
              label: 'Tổng AUM',
              value: fmtC(stats.aum, '$'),
              sub: 'Tài sản quản lý',
              color: '#10B981',
            },
            {
              icon: TrendingUp,
              label: 'ROI trung bình',
              value: `+${stats.avgRoi.toFixed(1)}%`,
              sub: 'Toàn nền tảng',
              color: '#F59E0B',
            },
          ].map((kpi, idx) => {
            const I = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="flex items-center gap-4"
                style={{
                  padding: '18px 24px',
                  borderRight: idx < 3 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}10` }}
                >
                  <I size={WEB_ICON.lg} color={kpi.color} />
                </div>
                <div>
                  <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 4 }}>
                    {kpi.label}
                  </div>
                  <div
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.xl,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
                    {kpi.sub.startsWith('+') && <ArrowUpRight size={10} color="#10B981" />}
                    <span
                      style={{
                        color: kpi.sub.startsWith('+') ? '#10B981' : c.text3,
                        fontSize: WEB_FONT.xs,
                      }}
                    >
                      {kpi.sub}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Risk Warning — slim inline */}
        <div
          className="flex items-center gap-3"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: '#FEF3C710',
            border: '1px solid #F59E0B20',
            borderLeft: '3px solid #F59E0B',
          }}
        >
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0" />
          <span style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            {COMPLIANCE_MESSAGES.RISK_WARNING}
          </span>
          <button
            className="flex items-center gap-1 shrink-0 ml-auto"
            style={{
              color: '#F59E0B',
              fontSize: WEB_FONT.xs,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Tìm hiểu thêm <ChevronRight size={12} />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            S3: SEARCH + FILTER + SORT BAR
            ═══════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between"
          style={{
            background: c.surface,
            border: bdr,
            borderRadius: R,
            padding: '10px 16px',
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2"
            style={{
              flex: '0 0 260px',
              height: WEB_BUTTON.md,
              padding: '0 12px',
              borderRadius: 8,
              background: c.bg,
              border: bdr,
            }}
          >
            <Search size={14} color={c.text3} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm trader theo tên hoặc chiến lược..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: c.text1,
                fontSize: WEB_FONT.sm,
                flex: 1,
              }}
            />
          </div>

          {/* Risk filters */}
          <div className="flex items-center gap-2">
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginRight: 4 }}>Rủi ro:</span>
            {RISK_FILTERS.map((rf) => {
              const active = riskFilter === rf.key;
              return (
                <button
                  key={rf.key}
                  onClick={() => setRiskFilter(rf.key)}
                  className="flex items-center gap-1 transition-colors"
                  style={{
                    height: WEB_BUTTON.xs,
                    padding: '0 10px',
                    borderRadius: 6,
                    background: active ? (rf.color ? `${rf.color}14` : c.bg) : 'transparent',
                    border: active
                      ? `1px solid ${rf.color || c.border}30`
                      : '1px solid transparent',
                    color: active ? rf.color || c.text1 : c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {rf.color && (
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: rf.color }} />
                  )}
                  {rf.label}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginRight: 4 }}>Sắp xếp:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className="transition-colors"
                style={{
                  height: WEB_BUTTON.xs,
                  padding: '0 12px',
                  borderRadius: 6,
                  background: sortBy === opt ? '#3B82F6' : 'transparent',
                  border: sortBy === opt ? '1px solid #3B82F6' : '1px solid transparent',
                  color: sortBy === opt ? '#fff' : c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: sortBy === opt ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between">
          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
            {traders.length} trader{traders.length !== 1 ? 's' : ''} phù hợp
          </span>
          <div
            className="flex items-center gap-1"
            style={{ color: c.text3, fontSize: WEB_FONT.xs }}
          >
            <Eye size={12} /> Hiệu suất 90 ngày · Cập nhật realtime
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            S4: TRADER GRID — 3 columns
            ═══════════════════════════════════════════════════════ */}
        {traders.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{ padding: 64, background: c.surface, border: bdr, borderRadius: R }}
          >
            <Search size={32} color={c.text3} style={{ marginBottom: 12, opacity: 0.4 }} />
            <span
              style={{ color: c.text2, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 4 }}
            >
              Không tìm thấy trader
            </span>
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── FEATURED TRADER CARD ── */}
            {!searchQ.trim() &&
              riskFilter === 'all' &&
              (() => {
                const ft = featured;
                const fTier = getTier(ft.copiers);
                const fRisk = RISK_CONFIG[ft.riskLevel];
                const FTI = fTier.icon;
                const FRI = fRisk.icon;
                const fFollowing = followingMap[ft.id];
                const fRoiPos = ft.totalPnlPct >= 0;
                const fCapPct = Math.min((ft.copiers / ft.maxCopiers) * 100, 100);
                return (
                  <div
                    style={{
                      background: c.surface,
                      borderRadius: R,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid rgba(59,130,246,0.18)',
                      boxShadow:
                        '0 0 0 1px rgba(59,130,246,0.06), 0 4px 20px rgba(59,130,246,0.06)',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                    }}
                    onClick={() => navigate(`/w/trade/copy/provider/${ft.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = HOVER_SHADOW;
                      e.currentTarget.style.borderColor = HOVER_BORDER;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 0 0 1px rgba(59,130,246,0.06), 0 4px 20px rgba(59,130,246,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.18)';
                    }}
                  >
                    {/* Featured accent bar */}
                    <div
                      style={{
                        height: 3,
                        background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #3B82F6)',
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                      {/* ── COL 1: Identity ── */}
                      <div style={{ padding: '20px 24px', borderRight: `1px solid ${c.divider}` }}>
                        {/* Featured badge */}
                        <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                          <div
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                          >
                            <Flame size={11} color="#fff" />
                            <span style={{ color: '#fff', fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                              Featured Trader
                            </span>
                          </div>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                            Được chọn bởi nền tảng
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          {/* Avatar large */}
                          <div className="relative shrink-0">
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                background: `${fTier.color}18`,
                                border: `2px solid ${fTier.color}50`,
                              }}
                            >
                              <span
                                style={{
                                  color: fTier.color,
                                  fontSize: WEB_FONT['2xl'],
                                  fontWeight: 800,
                                }}
                              >
                                {ft.avatar}
                              </span>
                            </div>
                            <div
                              className="absolute flex items-center justify-center"
                              style={{
                                bottom: -3,
                                right: -3,
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                background: c.surface,
                                border: `2px solid ${fTier.color}`,
                              }}
                            >
                              <FTI size={12} color={fTier.color} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <span
                                className="truncate"
                                style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 800 }}
                              >
                                {ft.name}
                              </span>
                              {fFollowing && <Star size={14} fill="#F59E0B" color="#F59E0B" />}
                              <button
                                onClick={(e) => toggleFollow(ft.id, e)}
                                className="flex items-center justify-center shrink-0 ml-auto"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: fFollowing ? '#F59E0B10' : c.bg,
                                  border: fFollowing ? '1px solid #F59E0B30' : bdr,
                                  cursor: 'pointer',
                                }}
                              >
                                <Star
                                  size={13}
                                  color={fFollowing ? '#F59E0B' : c.text3}
                                  fill={fFollowing ? '#F59E0B' : 'none'}
                                />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded"
                                style={{
                                  background: fTier.bg,
                                  color: fTier.color,
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 600,
                                }}
                              >
                                {fTier.label}
                              </span>
                              {ft.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded"
                                  style={{
                                    background: c.bg,
                                    color: c.text3,
                                    fontSize: WEB_FONT.xs,
                                    fontWeight: 500,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              <span
                                className="flex items-center gap-1 px-2 py-0.5 rounded"
                                style={{
                                  background: `${fRisk.color}10`,
                                  border: `1px solid ${fRisk.color}18`,
                                  color: fRisk.color,
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 600,
                                }}
                              >
                                <FRI size={10} /> {fRisk.label}
                              </span>
                            </div>
                            <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 8 }}>
                              Chiến lược Long-term · Ưu tiên BTC/ETH · Holding trung bình{' '}
                              {ft.avgHoldingTime}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── COL 2: Performance ── */}
                      <div style={{ padding: '20px 24px', borderRight: `1px solid ${c.divider}` }}>
                        <div
                          className="flex items-baseline justify-between"
                          style={{ marginBottom: 12 }}
                        >
                          <div>
                            <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 3 }}>
                              Tổng ROI (90d)
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span
                                style={{
                                  color: fRoiPos ? '#10B981' : '#EF4444',
                                  fontSize: WEB_FONT['3xl'],
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  lineHeight: 1,
                                }}
                              >
                                {fRoiPos ? '+' : ''}
                                {ft.totalPnlPct.toFixed(1)}%
                              </span>
                              <span
                                className="flex items-center gap-0.5"
                                style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}
                              >
                                <ArrowDownRight size={10} /> {ft.maxDrawdown.toFixed(1)}% DD
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              color: '#10B981',
                              fontSize: WEB_FONT.lg,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {fmtSignedUsd(ft.totalPnl)}
                          </div>
                        </div>

                        {/* Weekly P/L */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 6 }}>
                            P/L 7 ngày
                          </div>
                          <WeeklyBars data={ft.weeklyPnl} />
                        </div>

                        {/* 4 metrics row */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            {
                              l: 'Win Rate',
                              v: `${ft.winRate}%`,
                              cl: ft.winRate >= 70 ? '#10B981' : '#F59E0B',
                            },
                            {
                              l: 'Sharpe',
                              v: ft.sharpeRatio.toFixed(2),
                              cl: ft.sharpeRatio >= 2 ? '#10B981' : '#F59E0B',
                            },
                            { l: 'Copiers', v: fmtC(ft.copiers), cl: '#3B82F6' },
                            { l: 'Trades', v: fmtC(ft.totalTrades), cl: c.text1 },
                          ].map((m) => (
                            <div key={m.l} style={{ textAlign: 'center' }}>
                              <div
                                style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 2 }}
                              >
                                {m.l}
                              </div>
                              <div
                                style={{
                                  color: m.cl,
                                  fontSize: WEB_FONT.md,
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {m.v}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── COL 3: AUM + Capacity + CTA ── */}
                      <div
                        style={{
                          padding: '20px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 4 }}>
                              AUM (Tài sản quản lý)
                            </div>
                            <div
                              style={{
                                color: c.text1,
                                fontSize: WEB_FONT['2xl'],
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                lineHeight: 1,
                              }}
                            >
                              {fmtC(ft.aum, '$')}
                            </div>
                          </div>

                          {/* Copier capacity */}
                          <div style={{ marginBottom: 16 }}>
                            <div
                              className="flex items-center justify-between"
                              style={{ marginBottom: 4 }}
                            >
                              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                Copier slots
                              </span>
                              <span
                                style={{
                                  color: c.text1,
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {ft.copiers}/{fmtC(ft.maxCopiers)}
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 5,
                                borderRadius: 3,
                                background: c.bg,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${fCapPct}%`,
                                  background:
                                    fCapPct > 90
                                      ? '#EF4444'
                                      : fCapPct > 70
                                        ? 'linear-gradient(90deg, #3B82F6, #F59E0B)'
                                        : '#3B82F6',
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                            {fCapPct > 80 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle size={10} color="#F59E0B" />
                                <span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs }}>
                                  Gần đầy — còn {ft.maxCopiers - ft.copiers} slots
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick info */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock size={11} color={c.text3} />
                              <span style={{ color: c.text2, fontSize: WEB_FONT.xs }}>
                                Hold: {ft.avgHoldingTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 size={11} color={c.text3} />
                              <span style={{ color: c.text2, fontSize: WEB_FONT.xs }}>
                                {ft.totalTrades.toLocaleString()} lệnh
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/w/trade/copy/provider/${ft.id}`);
                          }}
                          className="flex items-center justify-center gap-2 w-full"
                          style={{
                            height: WEB_BUTTON.lg,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            color: '#fff',
                            fontSize: WEB_FONT.md,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.92';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          Xem & Bắt đầu Copy <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* ── TRADER GRID ── */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {traders.map((trader) => {
                const risk = RISK_CONFIG[trader.riskLevel];
                const tier = getTier(trader.copiers);
                const TierIcon = tier.icon;
                const RiskIcon = risk.icon;
                const isFollowing = followingMap[trader.id];
                const roiPositive = trader.totalPnlPct >= 0;
                const copierPct = Math.min((trader.copiers / trader.maxCopiers) * 100, 100);

                return (
                  <div
                    key={trader.id}
                    className="group transition-all"
                    style={{
                      background: c.surface,
                      border: bdr,
                      borderRadius: R,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
                    }}
                    onClick={() => navigate(`/w/trade/copy/provider/${trader.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = HOVER_SHADOW;
                      e.currentTarget.style.borderColor = HOVER_BORDER;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* ── Card Header ── */}
                    <div style={{ padding: '16px 20px 0' }}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: `${tier.color}18`,
                              border: `2px solid ${tier.color}40`,
                            }}
                          >
                            <span
                              style={{ color: tier.color, fontSize: WEB_FONT.xl, fontWeight: 800 }}
                            >
                              {trader.avatar}
                            </span>
                          </div>
                          <div
                            className="absolute flex items-center justify-center"
                            style={{
                              bottom: -3,
                              right: -3,
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              background: c.surface,
                              border: `1.5px solid ${tier.color}`,
                            }}
                          >
                            <TierIcon size={11} color={tier.color} />
                          </div>
                        </div>

                        {/* Name + tags */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                            <span
                              className="truncate"
                              style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}
                            >
                              {trader.name}
                            </span>
                            {isFollowing && <Star size={13} fill="#F59E0B" color="#F59E0B" />}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded"
                              style={{
                                background: tier.bg,
                                color: tier.color,
                                fontSize: WEB_FONT.xs,
                                fontWeight: 600,
                              }}
                            >
                              {tier.label}
                            </span>
                            {trader.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded"
                                style={{
                                  background: c.bg,
                                  color: c.text3,
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 500,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Follow button */}
                        <button
                          onClick={(e) => toggleFollow(trader.id, e)}
                          className="flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: isFollowing ? '#F59E0B10' : c.bg,
                            border: isFollowing ? '1px solid #F59E0B30' : bdr,
                            cursor: 'pointer',
                          }}
                        >
                          <Star
                            size={14}
                            color={isFollowing ? '#F59E0B' : c.text3}
                            fill={isFollowing ? '#F59E0B' : 'none'}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ── ROI Hero + Risk ── */}
                    <div
                      className="flex items-end justify-between"
                      style={{ padding: '14px 20px 12px' }}
                    >
                      <div>
                        <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 3 }}>
                          Tổng ROI (90d)
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span
                            style={{
                              color: roiPositive ? '#10B981' : '#EF4444',
                              fontSize: WEB_FONT['2xl'],
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              lineHeight: 1,
                            }}
                          >
                            {roiPositive ? '+' : ''}
                            {trader.totalPnlPct.toFixed(1)}%
                          </span>
                          <span
                            className="flex items-center gap-0.5"
                            style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}
                          >
                            <ArrowDownRight size={10} />
                            {trader.maxDrawdown.toFixed(1)}% DD
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: `${risk.color}10`,
                          border: `1px solid ${risk.color}18`,
                        }}
                      >
                        <RiskIcon size={12} color={risk.color} />
                        <span style={{ color: risk.color, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                          {risk.label}
                        </span>
                      </div>
                    </div>

                    {/* ── Weekly P/L Chart ── */}
                    <div style={{ padding: '0 20px 12px' }}>
                      <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 6 }}>
                        P/L 7 ngày
                      </div>
                      <WeeklyBars data={trader.weeklyPnl} />
                    </div>

                    {/* ── Key Metrics Grid ── */}
                    <div
                      className="grid grid-cols-4"
                      style={{
                        borderTop: `1px solid ${c.divider}`,
                        borderBottom: `1px solid ${c.divider}`,
                      }}
                    >
                      {[
                        {
                          icon: Target,
                          label: 'Win Rate',
                          value: `${trader.winRate}%`,
                          color:
                            trader.winRate >= 70
                              ? '#10B981'
                              : trader.winRate >= 55
                                ? '#F59E0B'
                                : '#EF4444',
                        },
                        {
                          icon: DollarSign,
                          label: 'PnL',
                          value: fmtSignedUsd(trader.totalPnl),
                          color: trader.totalPnl >= 0 ? '#10B981' : '#EF4444',
                        },
                        {
                          icon: Users,
                          label: 'Copiers',
                          value: fmtC(trader.copiers),
                          color: '#3B82F6',
                        },
                        {
                          icon: BarChart3,
                          label: 'Sharpe',
                          value: trader.sharpeRatio.toFixed(2),
                          color:
                            trader.sharpeRatio >= 2
                              ? '#10B981'
                              : trader.sharpeRatio >= 1
                                ? '#F59E0B'
                                : '#EF4444',
                        },
                      ].map((m, idx) => {
                        const MI = m.icon;
                        return (
                          <div
                            key={m.label}
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                              borderRight: idx < 3 ? `1px solid ${c.divider}` : 'none',
                            }}
                          >
                            <div
                              className="flex items-center justify-center gap-1"
                              style={{ marginBottom: 4 }}
                            >
                              <MI size={10} color={c.text3} />
                              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                {m.label}
                              </span>
                            </div>
                            <span
                              style={{
                                color: m.color,
                                fontSize: WEB_FONT.md,
                                fontWeight: 700,
                                fontFamily: 'monospace',
                              }}
                            >
                              {m.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Footer: AUM + Copier Capacity + CTA ── */}
                    <div
                      className="flex items-center justify-between"
                      style={{ padding: '12px 20px' }}
                    >
                      <div className="flex items-center gap-4">
                        {/* AUM */}
                        <div>
                          <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>AUM</div>
                          <div
                            style={{
                              color: c.text1,
                              fontSize: WEB_FONT.sm,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {fmtC(trader.aum, '$')}
                          </div>
                        </div>
                        {/* Copier capacity */}
                        <div>
                          <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 3 }}>
                            Slots {trader.copiers}/{fmtC(trader.maxCopiers)}
                          </div>
                          <div
                            style={{
                              width: 60,
                              height: 3,
                              borderRadius: 2,
                              background: c.bg,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${copierPct}%`,
                                background:
                                  copierPct > 90
                                    ? '#EF4444'
                                    : copierPct > 70
                                      ? '#F59E0B'
                                      : '#3B82F6',
                              }}
                            />
                          </div>
                        </div>
                        {/* Avg holding */}
                        <div>
                          <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Avg Hold</div>
                          <div className="flex items-center gap-1">
                            <Clock size={10} color={c.text3} />
                            <span
                              style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 600 }}
                            >
                              {trader.avgHoldingTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/w/trade/copy/provider/${trader.id}`);
                        }}
                        className="flex items-center gap-1.5 transition-colors"
                        style={{
                          height: WEB_BUTTON.sm,
                          padding: '0 16px',
                          borderRadius: 8,
                          background: '#3B82F6',
                          color: '#fff',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        Xem & Copy <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            S5: DISCLOSURE FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: c.surface, border: bdr, borderRadius: R, overflow: 'hidden' }}>
          {/* How copy trading works — top row */}
          <div
            className="flex items-center gap-6"
            style={{ padding: '14px 20px', borderBottom: `1px solid ${c.divider}` }}
          >
            <span
              style={{
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Cách hoạt động:
            </span>
            {[
              { n: 1, i: Search, t: 'Chọn trader' },
              { n: 2, i: Shield, t: 'Đánh giá rủi ro' },
              { n: 3, i: DollarSign, t: 'Cấu hình copy' },
              { n: 4, i: Copy, t: 'Tự động sao chép' },
              { n: 5, i: BarChart3, t: 'Theo dõi hiệu suất' },
            ].map((step, idx) => {
              const SI = step.i;
              return (
                <div key={step.n} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight size={12} color={c.text3} className="shrink-0" />}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{ width: 24, height: 24, borderRadius: 6, background: '#3B82F610' }}
                    >
                      <SI size={12} color="#3B82F6" />
                    </div>
                    <span className="flex items-center gap-1">
                      <span style={{ color: '#3B82F6', fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                        {step.n}.
                      </span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                        {step.t}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimers — bottom 3-col */}
          <div className="grid grid-cols-3">
            <div
              className="flex items-start gap-2"
              style={{ padding: '10px 16px', borderRight: `1px solid ${c.divider}` }}
            >
              <AlertTriangle size={12} color="#F59E0B" className="mt-0.5 shrink-0" />
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                {COMPLIANCE_MESSAGES.RISK_WARNING}
              </span>
            </div>
            <div
              className="flex items-start gap-2"
              style={{ padding: '10px 16px', borderRight: `1px solid ${c.divider}` }}
            >
              <Info size={12} color={c.text3} className="mt-0.5 shrink-0" />
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                {COMPLIANCE_MESSAGES.FIDUCIARY_DISCLAIMER}
              </span>
            </div>
            <div className="flex items-start gap-2" style={{ padding: '10px 16px' }}>
              <Shield size={12} color={c.text3} className="mt-0.5 shrink-0" />
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                Phí: Platform 0.1% · Performance 10% (high-water mark) · Trading 0.25%/lệnh.{' '}
                {COMPLIANCE_MESSAGES.HIGH_WATER_MARK}.
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
