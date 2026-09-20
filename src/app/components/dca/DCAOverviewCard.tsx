/**
 * DCAOverviewCard Component
 *
 * Hero-style overview card matching the Wallet "Tổng tài sản" card design.
 * Uses TrCard variant="hero" for consistent deep-blue gradient background.
 *
 * Features:
 *   - Shimmer skeleton loading state
 *   - Sparkline with draw-on-mount animation
 *   - Action buttons (Tạo mới / Tạm dừng / Biểu đồ / Lịch sử)
 *   - Eye toggle hide/show balance
 *   - 3-column ghost metrics with tooltips
 *   - Next execution + plan status badges
 *
 * @module components/dca
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Clock,
  AlertCircle,
  Pause,
  Play,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Maximize2,
  Plus,
  ListOrdered,
} from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ, φIcon, φAvatar } from '../../utils/golden';

/* ─── Types ──────────────────────────────────────────────── */

export interface DCAOverviewData {
  currentValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
  activePlans: number;
  pausedPlans: number;
  errorPlans: number;
  nextExecution: {
    relativeTime: string;
    amount: number;
  } | null;
}

export interface DCAActionCallbacks {
  onCreatePlan?: () => void;
  onPauseAll?: () => void;
  onViewChart?: () => void;
  onViewHistory?: () => void;
}

export interface DCAOverviewCardProps {
  data: DCAOverviewData;
  sparklineData?: number[];
  onSparklineTap?: () => void;
  onClick?: () => void;
  actions?: DCAActionCallbacks;
  isLoading?: boolean;
  className?: string;
}

/* ─── Formatters ─────────────────────────────────────────── */

const formatCompactVND = (amount: number): string => {
  const millions = amount / 1_000_000;
  if (millions >= 1000) return `${(millions / 1000).toFixed(2)}B`;
  return `${millions.toFixed(2)}M`;
};

const formatVNDFull = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.round(amount));

const formatPercent = (p: number): string => {
  const sign = p >= 0 ? '+' : '';
  return `${sign}${p.toFixed(1).replace('.', ',')}%`;
};

/* ─── Shimmer Skeleton ───────────────────────────────────── */

function ShimmerBlock({ w, h, r = 8, className = '' }: { w: string | number; h: number; r?: number; className?: string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: typeof w === 'number' ? w : w,
        height: h,
        borderRadius: r,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
        backgroundSize: '200% 100%',
        animation: 'dcaShimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonCard({ ghostBg }: { ghostBg: string }) {
  return (
    <div className="space-y-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <ShimmerBlock w={160} h={14} />
        <ShimmerBlock w={20} h={20} r={10} />
      </div>

      {/* Big value */}
      <ShimmerBlock w="75%" h={34} r={10} />

      {/* P&L badge */}
      <div className="flex items-center gap-2">
        <ShimmerBlock w={130} h={24} r={6} />
        <ShimmerBlock w={60} h={14} />
      </div>

      {/* 3-column metrics */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: ghostBg }}>
            <div className="flex items-center gap-1.5">
              <ShimmerBlock w={24} h={24} r={12} />
              <ShimmerBlock w={50} h={10} />
            </div>
            <ShimmerBlock w="80%" h={22} r={6} />
            <ShimmerBlock w="60%" h={10} r={4} />
          </div>
        ))}
      </div>

      {/* Next execution row */}
      <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5" style={{ background: ghostBg }}>
        <ShimmerBlock w={32} h={32} r={12} />
        <div className="space-y-1.5 flex-1">
          <ShimmerBlock w={80} h={10} />
          <ShimmerBlock w={140} h={14} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-2xl" style={{ background: ghostBg }}>
            <ShimmerBlock w={34} h={34} r={12} />
            <ShimmerBlock w={30} h={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mini Sparkline (animated draw-on-mount) ────────────── */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isProfit: boolean;
  onTap?: () => void;
}

function Sparkline({ data, width = 100, height = 44, isProfit, onTap }: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const [mounted, setMounted] = useState(false);
  const animKey = useRef(0);

  /** Fingerprint of data so we can detect real changes */
  const dataFingerprint = useMemo(() => {
    if (data.length < 2) return '';
    return `${data.length}_${data[0]}_${data[data.length - 1]}_${data[Math.floor(data.length / 2)]}`;
  }, [data]);

  const path = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 2;
    const usableH = height - padY * 2;
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: padY + usableH - ((v - min) / range) * usableH,
    }));
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
    }
    return d;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  const lastPointY = useMemo(() => {
    if (data.length < 2) return 0;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 2;
    const usableH = height - padY * 2;
    return padY + usableH - ((data[data.length - 1] - min) / range) * usableH;
  }, [data, height]);

  /* ── Re-animate whenever data fingerprint changes ── */
  useEffect(() => {
    // Reset state for re-animation
    setMounted(false);
    animKey.current += 1;
    const currentKey = animKey.current;

    const el = pathRef.current;
    if (!el || !path) return;

    // Reset to hidden state first
    el.style.transition = 'none';
    const totalLength = el.getTotalLength();
    el.style.strokeDasharray = `${totalLength}`;
    el.style.strokeDashoffset = `${totalLength}`;

    // Force reflow so the reset state is applied
    el.getBoundingClientRect();

    // Start draw animation
    requestAnimationFrame(() => {
      if (animKey.current !== currentKey) return; // stale
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.strokeDashoffset = '0';
    });

    // Fade in area & dot after line partially draws
    const timer = setTimeout(() => {
      if (animKey.current !== currentKey) return;
      setMounted(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [path, dataFingerprint]);

  const strokeColor = isProfit ? '#10B981' : '#EF4444';
  const fillStart = isProfit ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)';
  const gradientId = isProfit ? 'dcaSparkUp' : 'dcaSparkDown';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onTap?.(); }}
      className={`relative block rounded-lg transition-all ${onTap ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'}`}
      aria-label="Xem biểu đồ chi tiết"
      style={{ padding: 0, background: 'transparent', border: 'none' }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillStart} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Area fill — fades in */}
        {areaPath && (
          <path
            ref={areaRef}
            d={areaPath}
            fill={`url(#${gradientId})`}
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.6s ease-out',
            }}
          />
        )}

        {/* Line stroke — animated dashoffset */}
        {path && (
          <path
            ref={pathRef}
            d={path}
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* End dot — fades in with pulse ring */}
        {data.length >= 2 && (
          <g
            ref={dotRef}
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.4s ease-out 0.8s',
            }}
          >
            <circle cx={width} cy={lastPointY} r={6} fill={strokeColor} opacity={0.3}>
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={width} cy={lastPointY} r={3} fill={strokeColor} />
          </g>
        )}
      </svg>

      {onTap && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.3s ease-out 1s',
          }}
        >
          <Maximize2 className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
        </div>
      )}
    </button>
  );
}

/* ─── Tooltip Popover ────────────────────────────────────── */

type TooltipId = 'plans' | 'invested' | 'average';

interface TooltipPopoverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function TooltipPopover({ open, onClose, children }: TooltipPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const c = useThemeColors();
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute z-30 bottom-full left-0 right-0 mb-2">
      <div
        className="rounded-xl p-3 shadow-lg text-[12px] leading-[1.6]"
        style={{
          background: c.surface2,
          border: `1px solid ${c.border}`,
          color: c.text2,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>{children}</div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-px"
            style={{ color: c.text3 }}
            aria-label="Đóng"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
          style={{
            background: c.surface2,
            borderRight: `1px solid ${c.border}`,
            borderBottom: `1px solid ${c.border}`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Tooltip content ────────────────────────────────────── */

const TOOLTIP_CONTENT: Record<TooltipId, { title: string; body: string; example: string }> = {
  plans: {
    title: 'Kế hoạch',
    body: 'là tổng số kế hoạch DCA bạn đã tạo. Mỗi kế hoạch có một trạng thái riêng:',
    example: '• Đang chạy — tự động mua crypto đúng lịch.\n• Tạm dừng — bạn đã dừng tạm.\n• Lỗi — giao dịch gặp sự cố.',
  },
  invested: {
    title: 'Đã đầu tư',
    body: 'là tổng số tiền thực (VND) bạn đã bỏ vào tất cả các kế hoạch DCA từ khi bắt đầu đến hiện tại.',
    example: 'Ví dụ: 3 kế hoạch, mỗi kế hoạch mua 10M/tháng × 1 tháng → Đã đầu tư = 30M VND.',
  },
  average: {
    title: 'Trung bình',
    body: 'là tổng số tiền bạn đã đầu tư chia đều cho số kế hoạch DCA.',
    example: 'Ví dụ: Đầu tư tổng 35.5M vào 3 kế hoạch → Trung bình ≈ 11.83M / kế hoạch.',
  },
};

/* ─── Shimmer keyframes (injected once) ──────────────────── */

const SHIMMER_STYLE_ID = 'dca-shimmer-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SHIMMER_STYLE_ID;
  style.textContent = `
    @keyframes dcaShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Main Component ─────────────────────────────────────── */

export function DCAOverviewCard({
  data,
  sparklineData,
  onSparklineTap,
  onClick,
  actions,
  isLoading = false,
  className = '',
}: DCAOverviewCardProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticLight } = useHaptic();
  const isProfit = data.profitLoss >= 0;
  const totalPlans = data.activePlans + data.pausedPlans + data.errorPlans;
  const averagePerPlan = totalPlans > 0 ? data.totalInvested / totalPlans : 0;

  const [balanceHidden, setBalanceHidden] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<TooltipId | null>(null);

  const toggleTooltip = useCallback((id: TooltipId) => {
    setActiveTooltip((prev) => (prev === id ? null : id));
  }, []);
  const closeTooltip = useCallback(() => setActiveTooltip(null), []);

  const helpBtn = (id: TooltipId) => (
    <button
      onClick={(e) => { e.stopPropagation(); toggleTooltip(id); }}
      className="w-5 h-5 flex items-center justify-center rounded-full transition-colors"
      style={{ color: 'rgba(255,255,255,0.4)' }}
      aria-label={`Giải thích ${TOOLTIP_CONTENT[id].title}`}
    >
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  );

  const tooltipFor = (id: TooltipId) => (
    <TooltipPopover open={activeTooltip === id} onClose={closeTooltip}>
      <p>
        <span style={{ fontWeight: 600, color: c.text1 }}>
          {TOOLTIP_CONTENT[id].title}
        </span>{' '}
        {TOOLTIP_CONTENT[id].body}
      </p>
      <p className="mt-1.5 whitespace-pre-line" style={{ color: c.text3 }}>
        {TOOLTIP_CONTENT[id].example}
      </p>
    </TooltipPopover>
  );

  const ghostBg = c.portfolioBtnGhost;

  /* ── Action buttons config ── */
  const ACTION_BUTTONS: { icon: typeof Plus; label: string; color: string; action?: () => void }[] = [
    { icon: Plus, label: 'Tạo mới', color: '#10B981', action: actions?.onCreatePlan },
    { icon: Pause, label: 'Tạm dừng', color: '#FBBF24', action: actions?.onPauseAll },
    { icon: BarChart3, label: 'Biểu đồ', color: '#8B5CF6', action: actions?.onViewChart },
    { icon: ListOrdered, label: 'Lịch sử', color: '#CBD5E1', action: actions?.onViewHistory },
  ];

  return (
    <TrCard
      variant="hero"
      rounded="lg"
      className={`p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* ── Loading skeleton ───────────────────────────── */}
      {isLoading ? (
        <SkeletonCard ghostBg={ghostBg} />
      ) : (
        <div>
          {/* ── Row 1: Label + Eye toggle ────────────────── */}
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.portfolioTextDim, fontSize: φ.sm }}>
              Tổng danh mục DCA (VND)
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setBalanceHidden(!balanceHidden); hapticLight(); }}
              className="p-1 rounded-lg transition-colors"
              style={{ color: c.portfolioTextMuted }}
              aria-label={balanceHidden ? 'Hiện số dư' : 'Ẩn số dư'}
            >
              {balanceHidden
                ? <EyeOff size={18} />
                : <Eye size={18} />
              }
            </button>
          </div>

          {/* ── Row 2: Big value + Sparkline ──────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1">
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                    lineHeight: 1.15,
                    letterSpacing: -1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {balanceHidden ? '••••••' : `₫${formatVNDFull(data.currentValue)}`}
                </span>
              </div>

              {/* P&L badge */}
              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{
                    background: isProfit ? 'rgba(16,185,129,0.20)' : 'rgba(239,68,68,0.20)',
                    color: isProfit ? '#34D399' : '#F87171',
                    fontSize: 13,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isProfit
                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                    : <ArrowDownRight className="w-3.5 h-3.5" />
                  }
                  {balanceHidden ? '•••' : `${isProfit ? '+' : ''}${formatVNDFull(data.profitLoss)}`}
                  {!balanceHidden && (
                    <span style={{ opacity: 0.8, marginLeft: 2 }}>
                      ({formatPercent(data.profitLossPercent)})
                    </span>
                  )}
                </div>
                <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>
                  tổng lãi/lỗ
                </span>
              </div>
            </div>

            {/* Sparkline — animated draw */}
            {sparklineData && sparklineData.length >= 2 && (
              <div className="shrink-0 pt-2 flex flex-col items-end">
                <Sparkline
                  data={sparklineData}
                  width={88}
                  height={44}
                  isProfit={isProfit}
                  onTap={onSparklineTap}
                />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>
                  90 ngày
                </span>
              </div>
            )}
          </div>

          {/* ── Row 3: 3-column ghost metrics ────────────── */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {/* Kế hoạch */}
            <div className="relative">
              <div className="rounded-2xl p-3" style={{ background: ghostBg }}>
                <div className="flex items-center gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(59,130,246,0.25)' }}
                  >
                    <RefreshCw className="w-3 h-3" style={{ color: '#60A5FA' }} />
                  </div>
                  <span style={{ color: c.portfolioTextDim, fontSize: 11 }}>Kế hoạch</span>
                  {helpBtn('plans')}
                </div>
                <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {balanceHidden ? '•' : String(totalPlans)}
                </div>
                <div style={{ color: c.portfolioTextMuted, fontSize: 10, marginTop: 4 }}>
                  {data.activePlans} đang chạy
                </div>
              </div>
              {tooltipFor('plans')}
            </div>

            {/* Đã đầu tư */}
            <div className="relative">
              <div className="rounded-2xl p-3" style={{ background: ghostBg }}>
                <div className="flex items-center gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.25)' }}
                  >
                    <TrendingUp className="w-3 h-3" style={{ color: '#34D399' }} />
                  </div>
                  <span style={{ color: c.portfolioTextDim, fontSize: 11 }}>Đã đầu tư</span>
                  {helpBtn('invested')}
                </div>
                <div style={{ color: '#34D399', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {balanceHidden ? '•••' : formatCompactVND(data.totalInvested)}
                </div>
                <div style={{ color: c.portfolioTextMuted, fontSize: 10, marginTop: 4 }}>
                  {balanceHidden ? '•••••' : formatVNDFull(data.totalInvested)}
                </div>
              </div>
              {tooltipFor('invested')}
            </div>

            {/* Trung bình */}
            <div className="relative">
              <div className="rounded-2xl p-3" style={{ background: ghostBg }}>
                <div className="flex items-center gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(139,92,246,0.25)' }}
                  >
                    <BarChart3 className="w-3 h-3" style={{ color: '#A78BFA' }} />
                  </div>
                  <span style={{ color: c.portfolioTextDim, fontSize: 11 }}>TB/plan</span>
                  {helpBtn('average')}
                </div>
                <div style={{ color: '#A78BFA', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {balanceHidden ? '•••' : formatCompactVND(averagePerPlan)}
                </div>
                <div style={{ color: c.portfolioTextMuted, fontSize: 10, marginTop: 4 }}>
                  VND / kế hoạch
                </div>
              </div>
              {tooltipFor('average')}
            </div>
          </div>

          {/* ── Row 4: Next execution + status badges ───── */}
          <div
            className="flex items-center justify-between gap-3 mt-3 rounded-2xl px-3 py-2.5"
            style={{ background: ghostBg }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.20)' }}
              >
                <Clock className="w-4 h-4" style={{ color: '#60A5FA' }} />
              </div>
              {data.nextExecution ? (
                <div className="min-w-0">
                  <p style={{ color: c.portfolioTextMuted, fontSize: 10 }}>Lần mua tiếp</p>
                  <p
                    style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                    className="truncate"
                  >
                    {data.nextExecution.relativeTime}
                    <span style={{ color: c.portfolioTextDim, fontWeight: 400, marginLeft: 6 }}>
                      · {formatCompactVND(data.nextExecution.amount)}
                    </span>
                  </p>
                </div>
              ) : (
                <p style={{ color: c.portfolioTextMuted, fontSize: 13 }}>
                  Không có lịch mua
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge
                icon={<Play className="w-3 h-3" />}
                count={data.activePlans}
                bg="rgba(16,185,129,0.20)"
                color="#34D399"
                label="đang chạy"
              />
              {data.pausedPlans > 0 && (
                <StatusBadge
                  icon={<Pause className="w-3 h-3" />}
                  count={data.pausedPlans}
                  bg="rgba(245,158,11,0.20)"
                  color="#FBBF24"
                  label="tạm dừng"
                />
              )}
              {data.errorPlans > 0 && (
                <StatusBadge
                  icon={<AlertCircle className="w-3 h-3" />}
                  count={data.errorPlans}
                  bg="rgba(239,68,68,0.20)"
                  color="#F87171"
                  label="lỗi"
                />
              )}
            </div>
          </div>

          {/* ── Row 5: Action buttons (wallet-style) ───── */}
          <div className="flex gap-3 mt-4">
            {ACTION_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={(e) => { e.stopPropagation(); hapticSelection(); btn.action?.(); }}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-opacity hover:opacity-80 active:scale-[0.97]"
                style={{ background: ghostBg }}
              >
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: φAvatar.sm, height: φAvatar.sm, background: btn.color + '22' }}
                >
                  <btn.icon size={φIcon.md} color={btn.color} />
                </div>
                <span style={{ color: c.portfolioTextDim, fontSize: φ.xs }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

interface StatusBadgeProps {
  icon: React.ReactNode;
  count: number;
  bg: string;
  color: string;
  label: string;
}

function StatusBadge({ icon, count, bg, color, label }: StatusBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
      style={{ background: bg, color }}
      title={`${count} ${label}`}
    >
      {icon}
      <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </span>
    </div>
  );
}