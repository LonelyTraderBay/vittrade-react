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

import { useState, useCallback } from 'react';
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
  Plus,
  ListOrdered,
} from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { φ, φIcon, φAvatar } from '@/shared/lib/golden';
import { SkeletonCard, Sparkline, TooltipPopover } from './DCAOverviewCardVisuals';

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

/* ─── Tooltip content ────────────────────────────────────── */

type TooltipId = 'plans' | 'invested' | 'average';

const TOOLTIP_CONTENT: Record<TooltipId, { title: string; body: string; example: string }> = {
  plans: {
    title: 'Kế hoạch',
    body: 'là tổng số kế hoạch DCA bạn đã tạo. Mỗi kế hoạch có một trạng thái riêng:',
    example:
      '• Đang chạy — tự động mua crypto đúng lịch.\n• Tạm dừng — bạn đã dừng tạm.\n• Lỗi — giao dịch gặp sự cố.',
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
      onClick={(e) => {
        e.stopPropagation();
        toggleTooltip(id);
      }}
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
        <span style={{ fontWeight: 600, color: c.text1 }}>{TOOLTIP_CONTENT[id].title}</span>{' '}
        {TOOLTIP_CONTENT[id].body}
      </p>
      <p className="mt-1.5 whitespace-pre-line" style={{ color: c.text3 }}>
        {TOOLTIP_CONTENT[id].example}
      </p>
    </TooltipPopover>
  );

  const ghostBg = c.portfolioBtnGhost;

  /* ── Action buttons config ── */
  const ACTION_BUTTONS: { icon: typeof Plus; label: string; color: string; action?: () => void }[] =
    [
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
              onClick={(e) => {
                e.stopPropagation();
                setBalanceHidden(!balanceHidden);
                hapticLight();
              }}
              className="p-1 rounded-lg transition-colors"
              style={{ color: c.portfolioTextMuted }}
              aria-label={balanceHidden ? 'Hiện số dư' : 'Ẩn số dư'}
            >
              {balanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  {isProfit ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {balanceHidden
                    ? '•••'
                    : `${isProfit ? '+' : ''}${formatVNDFull(data.profitLoss)}`}
                  {!balanceHidden && (
                    <span style={{ opacity: 0.8, marginLeft: 2 }}>
                      ({formatPercent(data.profitLossPercent)})
                    </span>
                  )}
                </div>
                <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>tổng lãi/lỗ</span>
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
                <div
                  style={{
                    color: '#FFFFFF',
                    fontSize: 20,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
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
                <div
                  style={{
                    color: '#34D399',
                    fontSize: 20,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
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
                <div
                  style={{
                    color: '#A78BFA',
                    fontSize: 20,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
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
                    style={{
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    className="truncate"
                  >
                    {data.nextExecution.relativeTime}
                    <span style={{ color: c.portfolioTextDim, fontWeight: 400, marginLeft: 6 }}>
                      · {formatCompactVND(data.nextExecution.amount)}
                    </span>
                  </p>
                </div>
              ) : (
                <p style={{ color: c.portfolioTextMuted, fontSize: 13 }}>Không có lịch mua</p>
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
                onClick={(e) => {
                  e.stopPropagation();
                  hapticSelection();
                  btn.action?.();
                }}
                disabled={!btn.action}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-opacity hover:opacity-80 active:scale-[0.97]"
                style={{
                  background: ghostBg,
                  cursor: btn.action ? 'pointer' : 'not-allowed',
                  opacity: btn.action ? 1 : 0.55,
                }}
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
