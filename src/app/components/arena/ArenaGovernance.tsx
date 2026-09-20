/**
 * ══════════════════════════════════════════════════════════
 *  Arena Governance — Reusable Components (07A)
 * ══════════════════════════════════════════════════════════
 *  1) ReportStatusChip — status badge for report cases
 *  2) ModerationTimelineRow — timeline step in report flow
 *  3) SafetyBanner — inline safety awareness banner
 *  4) TrustBreakdownCard — detailed trust score metrics
 *
 *  Enterprise-level: serious tone, clear status, no gamification.
 */

import React from 'react';
import {
  Shield, CheckCircle2, Clock, AlertTriangle,
  FileText, ChevronRight, Info, Lock,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../ui/TrCard';
import { φ } from '../../utils/golden';
import {
  type ReportCaseStatus, type TrustMetric,
  REPORT_STATUS_CONFIG,
} from '../../data/arenaData';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) ReportStatusChip
   ═══════════════════════════════════════════ */

interface ReportStatusChipProps {
  status: ReportCaseStatus;
  size?: 'sm' | 'md';
}

export function ReportStatusChip({ status, size = 'sm' }: ReportStatusChipProps) {
  const cfg = REPORT_STATUS_CONFIG[status];
  const icons: Record<ReportCaseStatus, typeof Clock> = {
    submitted: FileText,
    under_review: Clock,
    action_taken: CheckCircle2,
    closed: Lock,
    appeal_open: AlertTriangle,
  };
  const Icon = icons[status];
  const fs = size === 'md' ? φ.sm : φ.xs;
  const iconSz = size === 'md' ? 12 : 10;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: fs,
        fontWeight: 600,
      }}
    >
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   2) ModerationTimelineRow
   ═══════════════════════════════════════════ */

interface ModerationTimelineRowProps {
  label: string;
  date: string;
  done: boolean;
  isLast?: boolean;
}

export function ModerationTimelineRow({ label, date, done, isLast }: ModerationTimelineRowProps) {
  const c = useThemeColors();
  return (
    <div className="flex gap-3">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        <div
          className="w-3 h-3 rounded-full shrink-0 mt-1"
          style={{
            background: done ? '#10B981' : c.surface2,
            border: done ? 'none' : `2px solid ${c.borderSolid}`,
          }}
        />
        {!isLast && (
          <div
            className="flex-1 w-px"
            style={{ background: done ? 'rgba(16,185,129,0.3)' : c.divider, minHeight: 24 }}
          />
        )}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <p style={{
          color: done ? c.text1 : c.text3,
          fontSize: φ.sm,
          fontWeight: done ? 600 : 400,
          lineHeight: 1.4,
        }}>
          {label}
        </p>
        {date && (
          <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>{date}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3) SafetyBanner
   ═══════════════════════════════════════════ */

interface SafetyBannerProps {
  variant?: 'info' | 'warning' | 'safety';
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function SafetyBanner({ variant = 'info', title, description, onAction, actionLabel, className }: SafetyBannerProps) {
  const c = useThemeColors();
  const colorMap = {
    info: '#3B82F6',
    warning: '#F59E0B',
    safety: '#10B981',
  };
  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    safety: Shield,
  };
  const clr = colorMap[variant];
  const Icon = iconMap[variant];

  return (
    <TrCard className={`p-4 ${className ?? ''}`} accentBorder={hexToRgba(clr, 25)}>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(clr, 12) }}
        >
          <Icon size={18} color={clr} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2, lineHeight: 1.4 }}>
            {title}
          </p>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            {description}
          </p>
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="flex items-center gap-1 mt-2 active:opacity-70"
              style={{ color: clr, fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}
            >
              {actionLabel}
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   4) TrustBreakdownCard
   ═══════════════════════════════════════════ */

interface TrustBreakdownCardProps {
  metrics: TrustMetric[];
  overallScore: number;
  creatorName: string;
  className?: string;
}

export function TrustBreakdownCard({ metrics, overallScore, creatorName, className }: TrustBreakdownCardProps) {
  const c = useThemeColors();

  const scoreColor = overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`}>
      {/* Overall score */}
      <TrCard className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: hexToRgba(scoreColor, 12), border: `2px solid ${hexToRgba(scoreColor, 30)}` }}
          >
            <span style={{ color: scoreColor, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
              {overallScore}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>Trust Score</p>
            <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.4 }}>
              {creatorName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield size={10} color={scoreColor} />
              <span style={{ color: scoreColor, fontSize: φ.xs, fontWeight: 600 }}>
                {overallScore >= 80 ? 'Tin cậy cao' : overallScore >= 60 ? 'Trung bình' : 'Cần cải thiện'}
              </span>
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${overallScore}%`,
              background: `linear-gradient(90deg, ${hexToRgba(scoreColor, 80)}, ${scoreColor})`,
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      </TrCard>

      {/* Individual metrics */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Các chỉ số chi tiết
        </p>
        <div className="flex flex-col gap-4">
          {metrics.map(m => (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{m.label}</span>
                  <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>
                    ({m.weight}%)
                  </span>
                </div>
                <span style={{ color: m.color, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                  {m.value}/{m.maxValue}
                </span>
              </div>
              <div className="h-1.5 rounded-full mb-1.5" style={{ background: c.surface2 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (m.value / m.maxValue) * 100)}%`,
                    background: m.color,
                    transition: 'width 0.4s ease-out',
                  }}
                />
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Disclaimer */}
      <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(139,92,246,0.2)">
        <Info size={13} color={c.accent} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
          Trust Score dựa trên lịch sử hoạt động trong Open Arena.
          Điểm số không phải chỉ số tài chính và không ảnh hưởng đến tài sản của bạn.
        </p>
      </TrCard>
    </div>
  );
}