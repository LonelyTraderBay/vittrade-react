import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φIcon } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════
 *  StatusPill — Enterprise Status Indicator
 * ══════════════════════════════════════════════════════════
 *
 *  Standardized status chips for:
 *  - P2P orders (pending, paid, released, cancelled, expired, disputed)
 *  - Trade orders (open, filled, partial, cancelled)
 *  - KYC status (unverified, pending, verified, rejected)
 *  - Arena rooms (open, live, closed, disputed, resolved)
 *  - DCA plans (active, paused, error, completed)
 *  - General (info, success, warning, error, neutral)
 *
 *  SIZE VARIANTS:
 *  ─────────────────────────────────────────────────────────
 *  "sm"  — 20px height, φ.xs text (10px) — inline/table use
 *  "md"  — 26px height, φ.sm text (13px) — card headers, lists (default)
 *  "lg"  — 32px height, φ.body text (14px) — standalone, page headers
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  <StatusPill status="success" label="Đã xác minh" />
 *  <StatusPill status="warning" label="Đang chờ" icon={Clock} />
 *  <StatusPill status="error" label="Từ chối" size="sm" />
 *  <StatusPill status="info" label="Đang xem xét" pulse />
 *  <StatusPill color="#8B5CF6" label="VIP 1" />
 *  <StatusPill status="neutral" label="Đã hết hạn" />
 */

/* ─── Preset status palette ─── */
type PresetStatus =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'orange';

type PillSize = 'sm' | 'md' | 'lg';

interface StatusPillProps {
  /** Preset status theme (overridden by `color`) */
  status?: PresetStatus;
  /** Custom color (overrides `status` preset) — raw hex, e.g. '#8B5CF6' */
  color?: string;
  /** Display text */
  label: string;
  /** Optional leading icon */
  icon?: LucideIcon;
  /** Size variant */
  size?: PillSize;
  /** Show pulse animation (for active/live states) */
  pulse?: boolean;
  /** Outline variant (border only, no background fill) */
  outline?: boolean;
  /** Count badge next to label */
  count?: number;
  /** Additional className */
  className?: string;
  /** onClick handler (makes it a button) */
  onClick?: () => void;
}

/* ─── Color presets — each returns { bg, text, border } ─── */
const PRESETS: Record<PresetStatus, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'rgba(16,185,129,0.12)',
    text: '#10B981',
    border: 'rgba(16,185,129,0.25)',
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    text: '#F59E0B',
    border: 'rgba(245,158,11,0.25)',
  },
  error: {
    bg: 'rgba(239,68,68,0.12)',
    text: '#EF4444',
    border: 'rgba(239,68,68,0.25)',
  },
  info: {
    bg: 'rgba(59,130,246,0.12)',
    text: '#3B82F6',
    border: 'rgba(59,130,246,0.25)',
  },
  neutral: {
    bg: 'rgba(148,163,184,0.12)',
    text: '#94A3B8',
    border: 'rgba(148,163,184,0.25)',
  },
  purple: {
    bg: 'rgba(139,92,246,0.12)',
    text: '#8B5CF6',
    border: 'rgba(139,92,246,0.25)',
  },
  orange: {
    bg: 'rgba(249,115,22,0.12)',
    text: '#F97316',
    border: 'rgba(249,115,22,0.25)',
  },
};

/* ─── Size presets ─── */
const SIZES: Record<PillSize, { height: number; fontSize: number; iconSize: number; px: number; gap: number }> = {
  sm: { height: 20, fontSize: φ.xs, iconSize: 10, px: 6, gap: 3 },
  md: { height: 26, fontSize: φ.sm, iconSize: 12, px: 10, gap: 4 },
  lg: { height: 32, fontSize: φ.body, iconSize: 14, px: 12, gap: 5 },
};

/* ─── Resolve colors from custom hex ─── */
function customColorFromHex(hex: string) {
  return {
    bg: `${hex}1F`, // ~12% alpha
    text: hex,
    border: `${hex}40`, // ~25% alpha
  };
}

export function StatusPill({
  status = 'neutral',
  color,
  label,
  icon: Icon,
  size = 'md',
  pulse = false,
  outline = false,
  count,
  className = '',
  onClick,
}: StatusPillProps) {
  const c = useThemeColors();
  const palette = color ? customColorFromHex(color) : PRESETS[status];
  const s = SIZES[size];

  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center shrink-0 ${className}`}
      style={{
        height: s.height,
        paddingLeft: s.px,
        paddingRight: s.px,
        gap: s.gap,
        borderRadius: s.height / 2, // full round
        background: outline ? 'transparent' : palette.bg,
        border: `1px solid ${palette.border}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--tr-duration-fast) ease',
      }}
    >
      {/* Pulse dot for live/active states */}
      {pulse && (
        <span
          className="shrink-0 rounded-full animate-pulse"
          style={{
            width: s.iconSize * 0.6,
            height: s.iconSize * 0.6,
            background: palette.text,
            boxShadow: `0 0 4px ${palette.text}80`,
          }}
        />
      )}

      {/* Leading icon */}
      {Icon && !pulse && (
        <Icon
          size={s.iconSize}
          color={palette.text}
          strokeWidth={2.2}
          className="shrink-0"
        />
      )}

      {/* Label */}
      <span
        style={{
          color: palette.text,
          fontSize: s.fontSize,
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>

      {/* Count badge */}
      {count != null && count > 0 && (
        <span
          className="rounded-full flex items-center justify-center"
          style={{
            minWidth: s.height * 0.65,
            height: s.height * 0.65,
            padding: '0 3px',
            background: palette.text,
            color: '#fff',
            fontSize: s.fontSize - 2,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════════════
   Convenience presets for common use cases
   ═══════════════════════════════════════════════════════════ */

/** P2P Order statuses — pre-mapped */
export const P2P_STATUS_MAP: Record<string, { status: PresetStatus; label: string }> = {
  pending_payment: { status: 'warning', label: 'Chờ thanh toán' },
  paid:            { status: 'info',    label: 'Đã thanh toán' },
  released:        { status: 'success', label: 'Đã giải phóng' },
  completed:       { status: 'success', label: 'Hoàn tất' },
  cancelled:       { status: 'neutral', label: 'Đã hủy' },
  expired:         { status: 'neutral', label: 'Hết hạn' },
  disputed:        { status: 'error',   label: 'Tranh chấp' },
  appealed:        { status: 'orange',  label: 'Kháng cáo' },
};

/** Trade order statuses */
export const TRADE_STATUS_MAP: Record<string, { status: PresetStatus; label: string }> = {
  open:      { status: 'info',    label: 'Đang mở' },
  partial:   { status: 'warning', label: 'Khớp 1 phần' },
  filled:    { status: 'success', label: 'Đã khớp' },
  cancelled: { status: 'neutral', label: 'Đã hủy' },
  rejected:  { status: 'error',   label: 'Bị từ chối' },
};

/** KYC statuses */
export const KYC_STATUS_MAP: Record<string, { status: PresetStatus; label: string }> = {
  unverified: { status: 'error',   label: 'Chưa xác minh' },
  pending:    { status: 'warning', label: 'Đang xem xét' },
  verified:   { status: 'success', label: 'Đã xác minh' },
  rejected:   { status: 'error',   label: 'Bị từ chối' },
};

/** DCA plan statuses */
export const DCA_STATUS_MAP: Record<string, { status: PresetStatus; label: string }> = {
  active:    { status: 'success', label: 'Đang chạy' },
  paused:    { status: 'warning', label: 'Tạm dừng' },
  error:     { status: 'error',   label: 'Lỗi' },
  completed: { status: 'neutral', label: 'Hoàn tất' },
};
