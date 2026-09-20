/**
 * ══════════════════════════════════════════════════════════
 *  Arena Moderation Cases — Reusable Components (07C)
 * ══════════════════════════════════════════════════════════
 *  1) AppealBanner — banner for appeal-eligible cases
 *  2) BlockedUserRow — reusable row for blocked user lists
 *  3) CaseActionCard — action summary card for report cases
 *  4) ReportCaseStatusChip — re-export for naming consistency
 *
 *  Enterprise-level moderation workflow.
 *  Tone: rõ ràng, chuyên nghiệp, không gây hoang mang.
 */

import React from 'react';
import {
  Shield, AlertTriangle, Ban, Eye, ChevronRight,
  Clock, Info, Flag, Scale, FileText,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../ui/TrCard';
import { φ } from '../../utils/golden';
import type { ReportCaseStatus } from '../../data/arenaData';
import { ReportStatusChip } from './ArenaGovernance';
import { hexToRgba } from '../../utils/helpers/string';

/* Re-export for naming consistency with spec */
export { ReportStatusChip as ReportCaseStatusChip } from './ArenaGovernance';

/* ═══════════════════════════════════════════
   1) AppealBanner
   ═══════════════════════════════════════════ */

interface AppealBannerProps {
  onAppeal?: () => void;
  daysLeft?: number;
  className?: string;
}

export function AppealBanner({ onAppeal, daysLeft = 7, className }: AppealBannerProps) {
  const c = useThemeColors();

  return (
    <TrCard
      className={`p-4 ${className ?? ''}`}
      accentBorder="rgba(245,158,11,0.25)"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)' }}
        >
          <Scale size={16} color="#F59E0B" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
            Bạn có thể khiếu nại
          </p>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Nếu bạn cho rằng kết luận chưa chính xác, bạn có thể mở khiếu nại trong {daysLeft} ngày kể từ ngày kết luận.
          </p>
          {onAppeal && (
            <button
              onClick={onAppeal}
              className="flex items-center gap-1 mt-2 active:opacity-70"
              style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}
            >
              Mở khiếu nại
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
        <Clock size={10} color={c.text3} />
        <span style={{ color: c.text3, fontSize: 10 }}>
          Còn {daysLeft} ngày để mở khiếu nại
        </span>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   2) BlockedUserRow
   ═══════════════════════════════════════════ */

interface BlockedUserRowProps {
  avatar: string;
  name: string;
  reason: string;
  blockedAt: string;
  sourceLabel: string;
  onUnblock: () => void;
  onViewProfile?: () => void;
  isLast?: boolean;
}

export function BlockedUserRow({
  avatar, name, reason, blockedAt, sourceLabel,
  onUnblock, onViewProfile, isLast,
}: BlockedUserRowProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{
        borderBottom: !isLast ? `1px solid ${c.divider}` : 'none',
        minHeight: 64,
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: c.surface2, fontSize: 20, opacity: 0.6 }}
      >
        {avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">
          {name}
        </p>
        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginTop: 1 }}>
          {reason}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ color: c.text3, fontSize: 10 }}>{blockedAt}</span>
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <span style={{ color: c.text3, fontSize: 10 }}>{sourceLabel}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0 ml-2">
        <button
          onClick={() => { onUnblock(); hapticSelection(); }}
          className="px-3 py-1.5 rounded-lg active:opacity-70"
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#F59E0B',
            fontSize: 10,
            fontWeight: 600,
            minHeight: 28,
          }}
        >
          Bỏ chặn
        </button>
        {onViewProfile && (
          <button
            onClick={() => { onViewProfile(); hapticSelection(); }}
            className="px-3 py-1.5 rounded-lg active:opacity-70"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              color: c.text2,
              fontSize: 10,
              fontWeight: 600,
              minHeight: 28,
            }}
          >
            Xem hồ sơ
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3) CaseActionCard
   ═══════════════════════════════════════════ */

interface CaseActionCardProps {
  actionTaken: string;
  systemNote?: string;
  status: ReportCaseStatus;
  className?: string;
}

const ACTION_ICONS: Record<string, { icon: typeof Shield; color: string }> = {
  submitted: { icon: Clock, color: '#3B82F6' },
  under_review: { icon: Eye, color: '#F59E0B' },
  action_taken: { icon: Shield, color: '#10B981' },
  closed: { icon: Shield, color: '#6B7280' },
  appeal_open: { icon: AlertTriangle, color: '#EF4444' },
};

export function CaseActionCard({ actionTaken, systemNote, status, className }: CaseActionCardProps) {
  const c = useThemeColors();
  const cfg = ACTION_ICONS[status] || ACTION_ICONS.closed;
  const Icon = cfg.icon;

  return (
    <TrCard className={`p-4 ${className ?? ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(cfg.color, 12) }}
        >
          <Icon size={16} color={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
            Hành động đã thực hiện
          </p>
          <p style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.6 }}>
            {actionTaken}
          </p>
        </div>
      </div>

      {systemNote && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: c.surface2 }}
        >
          <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            {systemNote}
          </p>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   4) ReportCaseRow — row for the reports list
   ═══════════════════════════════════════════ */

interface ReportCaseRowProps {
  id: string;
  targetName: string;
  targetType: 'user' | 'challenge' | 'mode';
  reason: string;
  createdAt: string;
  updatedAt: string;
  status: ReportCaseStatus;
  onPress: () => void;
  isLast?: boolean;
}

const TARGET_ICONS: Record<string, { icon: typeof Flag; color: string }> = {
  user: { icon: Ban, color: '#EF4444' },
  challenge: { icon: Flag, color: '#F59E0B' },
  mode: { icon: FileText, color: '#8B5CF6' },
};

const TARGET_LABELS: Record<string, string> = {
  user: 'Người dùng',
  challenge: 'Challenge',
  mode: 'Mode',
};

export function ReportCaseRow({
  id, targetName, targetType, reason, createdAt, updatedAt, status, onPress, isLast,
}: ReportCaseRowProps) {
  const c = useThemeColors();
  const cfg = TARGET_ICONS[targetType] || TARGET_ICONS.user;
  const Icon = cfg.icon;

  return (
    <button
      onClick={onPress}
      className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
      style={{
        borderBottom: !isLast ? `1px solid ${c.divider}` : 'none',
        minHeight: 72,
      }}
    >
      {/* Target icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(cfg.color, 12) }}
      >
        <Icon size={16} color={cfg.color} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate flex-1 min-w-0">
            {targetName}
          </p>
          <ReportStatusChip status={status} size="sm" />
        </div>
        <p style={{ color: c.text2, fontSize: φ.xs, marginTop: 2 }} className="truncate">
          {reason}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ color: c.text3, fontSize: 10 }}>{TARGET_LABELS[targetType]}</span>
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <span style={{ color: c.text3, fontSize: 10 }}>Gửi {createdAt}</span>
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <span style={{ color: c.text3, fontSize: 10 }}>Cập nhật {updatedAt}</span>
        </div>
      </div>

      <ChevronRight size={14} color={c.text3} className="shrink-0 ml-1" />
    </button>
  );
}