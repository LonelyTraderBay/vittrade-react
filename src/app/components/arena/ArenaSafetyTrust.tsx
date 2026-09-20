/**
 * ══════════════════════════════════════════════════════════
 *  Arena Safety & Trust — Reusable Components (07B)
 * ══════════════════════════════════════════════════════════
 *  1) TrustMetricRow — single metric with bar + microcopy
 *  2) DisputeRiskChip — colored chip for dispute risk level
 *  3) PolicyInfoLink — small tappable link to policy/info pages
 *  4) SafetySnapshotCard — summary card near CTA join
 *  5) TrustBreakdownSheet — bottom sheet overlay for trust metrics
 *
 *  Enterprise-level: serious, explanatory, no gamification.
 *  Trust phải nhìn ra được nguồn gốc. Wording ngắn, không học thuật.
 */

import React from 'react';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import {
  Shield, ChevronRight, Info, Lock, Eye,
  FileText, Scale, AlertTriangle, X, Flag,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../ui/TrCard';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* Re-export SafetyBanner from ArenaGovernance for 07B module completeness */
export { SafetyBanner } from './ArenaGovernance';

/* ═══════════════════════════════════════════
   1) TrustMetricRow
   ═══════════════════════════════════════════ */

export interface TrustMetricRowData {
  key: string;
  label: string;
  value: number;      // 0–100
  maxValue?: number;   // default 100
  color: string;
  description: string; // microcopy explaining this metric
  suffix?: string;     // e.g. '%' or '/5'
}

interface TrustMetricRowProps {
  metric: TrustMetricRowData;
  showBar?: boolean;
}

export function TrustMetricRow({ metric, showBar = true }: TrustMetricRowProps) {
  const c = useThemeColors();
  const max = metric.maxValue || 100;
  const pct = Math.min(100, (metric.value / max) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: metric.color }}
          />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
            {metric.label}
          </span>
        </div>
        <span style={{
          color: metric.color,
          fontSize: φ.sm,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}>
          {metric.value}{metric.suffix || `/${max}`}
        </span>
      </div>
      {showBar && (
        <div className="h-1.5 rounded-full mb-1.5" style={{ background: c.surface2 }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: metric.color,
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>
      )}
      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }}>
        {metric.description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2) DisputeRiskChip
   ═══════════════════════════════════════════ */

interface DisputeRiskChipProps {
  level: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md';
}

const RISK_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  low: { label: 'Rủi ro thấp', color: '#10B981', icon: Shield },
  medium: { label: 'Rủi ro TB', color: '#F59E0B', icon: AlertTriangle },
  high: { label: 'Rủi ro cao', color: '#EF4444', icon: AlertTriangle },
};

export function DisputeRiskChip({ level, size = 'sm' }: DisputeRiskChipProps) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  const Icon = cfg.icon;
  const fs = size === 'md' ? φ.sm : φ.xs;
  const iconSz = size === 'md' ? 12 : 10;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
      style={{
        background: hexToRgba(cfg.color, 12),
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
   3) PolicyInfoLink
   ═══════════════════════════════════════════ */

interface PolicyInfoLinkProps {
  label: string;
  onClick: () => void;
  color?: string;
  icon?: React.ElementType;
}

export function PolicyInfoLink({ label, onClick, color, icon: IconComp }: PolicyInfoLinkProps) {
  const c = useThemeColors();
  const clr = color || c.accent;
  const Icon = IconComp || Info;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 active:opacity-70"
      style={{ color: clr, fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}
    >
      <Icon size={12} />
      <span>{label}</span>
      <ChevronRight size={10} />
    </button>
  );
}

/* ═══════════════════════════════════════════
   4) SafetySnapshotCard
   ═══════════════════════════════════════════ */

interface SafetySnapshotData {
  resolutionMethod?: string;
  evidenceRequired?: string;
  privacy: string;
  voidRule?: string;
  creatorTrustScore: number;
  creatorName: string;
}

interface SafetySnapshotCardProps {
  data: SafetySnapshotData;
  onTrustTap?: () => void;
  onSafetyTap?: () => void;
  onResolutionTap?: () => void;
  className?: string;
}

export function SafetySnapshotCard({
  data, onTrustTap, onSafetyTap, onResolutionTap, className,
}: SafetySnapshotCardProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const trustColor = data.creatorTrustScore >= 80 ? '#10B981'
    : data.creatorTrustScore >= 60 ? '#F59E0B' : '#EF4444';

  const rows: { label: string; value: string; icon: React.ElementType; color: string }[] = [
    {
      label: 'Chốt kết quả',
      value: data.resolutionMethod || 'Bình chọn',
      icon: Scale,
      color: '#3B82F6',
    },
    {
      label: 'Bằng chứng',
      value: data.evidenceRequired || 'Ảnh chụp màn hình',
      icon: FileText,
      color: '#8B5CF6',
    },
    {
      label: 'Quyền riêng tư',
      value: data.privacy,
      icon: data.privacy === 'Công khai' ? Eye : Lock,
      color: '#F59E0B',
    },
    {
      label: 'Quy tắc hủy',
      value: data.voidRule || 'Hoàn points',
      icon: AlertTriangle,
      color: '#EF4444',
    },
  ];

  return (
    <TrCard className={`p-4 ${className ?? ''}`} accentBorder="rgba(16,185,129,0.15)">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} color="#10B981" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
          An toàn nhanh
        </span>
      </div>

      {/* Metric rows */}
      <div className="flex flex-col gap-2.5 mb-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <row.icon size={13} color={row.color} className="shrink-0" />
              <span style={{ color: c.text2, fontSize: φ.xs }}>{row.label}</span>
            </div>
            <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* Creator trust — tappable */}
        <button
          onClick={() => { onTrustTap?.(); hapticSelection(); }}
          className="flex items-center justify-between active:opacity-70"
          style={{ minHeight: 28 }}
        >
          <div className="flex items-center gap-2">
            <Shield size={13} color={trustColor} className="shrink-0" />
            <span style={{ color: c.text2, fontSize: φ.xs }}>Tin cậy creator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{
              color: trustColor,
              fontSize: φ.xs,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}>
              {data.creatorTrustScore}%
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>
              {data.creatorName}
            </span>
            <ChevronRight size={10} color={c.text3} />
          </div>
        </button>
      </div>

      {/* Divider + policy links */}
      <div className="pt-2.5 flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: `1px solid ${c.divider}` }}>
        {onSafetyTap && (
          <PolicyInfoLink label="An toàn & báo cáo" onClick={onSafetyTap} color="#EF4444" icon={Flag} />
        )}
        {onResolutionTap && (
          <PolicyInfoLink label="Cách chốt kết quả" onClick={onResolutionTap} color="#3B82F6" icon={Scale} />
        )}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   5) TrustBreakdownSheet
   ═══════════════════════════════════════════ */

/**
 * Standard trust metrics for the breakdown sheet.
 * Each metric has clear microcopy explaining its origin.
 */

export interface TrustBreakdownData {
  fairPlay: number;                // 0–100
  completionRate: number;          // 0–100 %
  disputeRate: number;             // 0–100 (lower = better)
  reportUpheldRate: number;        // 0–100 %
  creatorReliability: number;      // 0–100
  roomSafetyTier: 'green' | 'yellow' | 'red';
  entityName: string;
  overallScore: number;
}

const SAFETY_TIER_CONFIG: Record<string, { label: string; color: string }> = {
  green: { label: 'An toàn', color: '#10B981' },
  yellow: { label: 'Cần lưu ý', color: '#F59E0B' },
  red: { label: 'Rủi ro', color: '#EF4444' },
};

interface TrustBreakdownSheetProps {
  open: boolean;
  onClose: () => void;
  data: TrustBreakdownData;
}

export function TrustBreakdownSheet({ open, onClose, data }: TrustBreakdownSheetProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const scoreColor = data.overallScore >= 80 ? '#10B981'
    : data.overallScore >= 60 ? '#F59E0B' : '#EF4444';

  const tier = SAFETY_TIER_CONFIG[data.roomSafetyTier] || SAFETY_TIER_CONFIG.green;

  const metrics: TrustMetricRowData[] = [
    {
      key: 'fair_play',
      label: 'Fair Play',
      value: data.fairPlay,
      color: data.fairPlay >= 80 ? '#10B981' : data.fairPlay >= 60 ? '#F59E0B' : '#EF4444',
      description: 'Mức tuân thủ luật chơi và chấp nhận kết quả. Nguồn: đánh giá từ hệ thống sau mỗi challenge.',
      suffix: '%',
    },
    {
      key: 'completion',
      label: 'Tỷ lệ hoàn thành',
      value: data.completionRate,
      color: data.completionRate >= 90 ? '#10B981' : data.completionRate >= 70 ? '#F59E0B' : '#EF4444',
      description: 'Phòng hoàn thành đầy đủ (từ join đến kết thúc). Không tính phòng bị hủy bởi hệ thống.',
      suffix: '%',
    },
    {
      key: 'dispute',
      label: 'Tỷ lệ tranh chấp',
      value: data.disputeRate,
      color: data.disputeRate <= 5 ? '#10B981' : data.disputeRate <= 15 ? '#F59E0B' : '#EF4444',
      description: 'Phòng có tranh chấp / tổng phòng đã tham gia. Càng thấp càng ít xung đột.',
      suffix: '%',
    },
    {
      key: 'report_upheld',
      label: 'Báo cáo xác nhận',
      value: data.reportUpheldRate,
      color: data.reportUpheldRate <= 3 ? '#10B981' : data.reportUpheldRate <= 10 ? '#F59E0B' : '#EF4444',
      description: 'Tỷ lệ báo cáo vi phạm được xác nhận đúng. Thấp = ít vi phạm thực tế.',
      suffix: '%',
    },
    {
      key: 'reliability',
      label: 'Độ tin cậy creator',
      value: data.creatorReliability,
      color: data.creatorReliability >= 80 ? '#10B981' : data.creatorReliability >= 60 ? '#F59E0B' : '#EF4444',
      description: 'Đánh giá uy tín khi tạo và quản lý challenge. Nguồn: đánh giá cộng đồng + lịch sử.',
      suffix: '%',
    },
  ];

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Chi tiết tin cậy">
        {/* Overall score */}
        <TrCard className="p-4 mb-4">
          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: hexToRgba(scoreColor, 12), border: `2px solid ${hexToRgba(scoreColor, 30)}` }}
            >
              <span style={{ color: scoreColor, fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
                {data.overallScore}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                {data.entityName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield size={10} color={scoreColor} />
                <span style={{ color: scoreColor, fontSize: φ.xs, fontWeight: 600 }}>
                  {data.overallScore >= 80 ? 'Tin cậy cao' : data.overallScore >= 60 ? 'Trung bình' : 'Cần cải thiện'}
                </span>
              </div>
            </div>
          </div>
          {/* Score bar */}
          <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${data.overallScore}%`,
                background: `linear-gradient(90deg, ${hexToRgba(scoreColor, 80)}, ${scoreColor})`,
                transition: 'width 0.6s ease-out',
              }}
            />
          </div>
        </TrCard>

        {/* Room Safety Tier */}
        <TrCard className="p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} color={tier.color} />
            <div>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                Mức an toàn phòng
              </span>
            </div>
          </div>
          <span
            className="px-2.5 py-1 rounded-lg"
            style={{ background: hexToRgba(tier.color, 12), color: tier.color, fontSize: φ.xs, fontWeight: 600 }}
          >
            {tier.label}
          </span>
        </TrCard>

        {/* Individual metrics */}
        <TrCard className="p-4 mb-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Chỉ số chi tiết
          </p>
          <div className="flex flex-col gap-4">
            {metrics.map(m => (
              <TrustMetricRow key={m.key} metric={m} />
            ))}
          </div>
        </TrCard>

        {/* Source disclaimer */}
        <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(139,92,246,0.2)">
          <Info size={13} color={c.accent} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Các chỉ số dựa trên dữ liệu hoạt động trong Open Arena.
            Điểm không phải chỉ số tài chính. Nguồn: lịch sử challenge + đánh giá cộng đồng + hệ thống kiểm duyệt.
          </p>
        </TrCard>
    </BottomSheetV2>
  );
}

/**
 * Helper: generate TrustBreakdownData from a creator object
 */
export function buildTrustBreakdownFromCreator(creator: {
  name: string;
  trustScore: number;
  completionRate?: number;
  disputeRate?: number;
  fairPlayBadge?: boolean;
}): TrustBreakdownData {
  const ts = creator.trustScore;
  return {
    fairPlay: ts,
    completionRate: creator.completionRate ?? Math.min(100, ts + 5),
    disputeRate: creator.disputeRate !== undefined
      ? Math.round(creator.disputeRate * 100)
      : Math.round(Math.max(0, 100 - ts) * 0.3),
    reportUpheldRate: Math.max(0, Math.round((100 - ts) * 0.15)),
    creatorReliability: Math.min(100, ts + 3),
    roomSafetyTier: ts >= 80 ? 'green' : ts >= 60 ? 'yellow' : 'red',
    entityName: creator.name,
    overallScore: ts,
  };
}