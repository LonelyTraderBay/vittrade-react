/**
 * ══════════════════════════════════════════════════════════
 *  Arena Reusable Chips & Badges
 * ══════════════════════════════════════════════════════════
 *  Section 2 of 06E: Format, Resolution, Status, Trust chips
 *  All chips match existing design system: φ scale, TrCard borders,
 *  semantic colors, minHeight for tap targets where interactive.
 */

import React from 'react';
import {
  Users, Swords, Crown, Globe, Bot, Handshake,
  UserCheck, Vote, Shield, Lock, Sparkles, Star,
  Eye, Clock, Activity, CheckCircle2, Flag,
  XCircle, AlertTriangle, WifiOff, FileEdit,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';
import type { ChallengeState, ParticipantLayout } from '../../data/arenaData';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) FORMAT CHIPS
   ═══════════════════════════════════════════ */

export type FormatType = '1v1' | '1vN' | 'NvN' | 'open_lobby';

const FORMAT_CONFIG: Record<FormatType, { label: string; icon: typeof Users; color: string }> = {
  '1v1':        { label: '1v1',         icon: Swords,  color: '#EF4444' },
  '1vN':        { label: '1vN',         icon: Crown,   color: '#8B5CF6' },
  'NvN':        { label: 'NvN',         icon: Users,   color: '#3B82F6' },
  'open_lobby': { label: 'Open Lobby',  icon: Globe,   color: '#10B981' },
};

interface ChipProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function FormatChip({ format, size = 'sm', className }: ChipProps & { format: FormatType }) {
  const cfg = FORMAT_CONFIG[format];
  const Icon = cfg.icon;
  const py = size === 'md' ? 'py-1.5' : 'py-0.5';
  const px = size === 'md' ? 'px-3' : 'px-2';
  const fs = size === 'md' ? φ.xs : 10;
  const iconSz = size === 'md' ? 12 : 10;

  return (
    <span className={`inline-flex items-center gap-1 ${px} ${py} rounded-lg ${className ?? ''}`}
      style={{ background: hexToRgba(cfg.color, 12), color: cfg.color, fontSize: fs, fontWeight: 600 }}>
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   2) RESOLUTION CHIPS
   ═══════════════════════════════════════════ */

export type ResolutionType = 'auto' | 'mutual_confirm' | 'referee' | 'community_vote';

const RESOLUTION_CONFIG: Record<ResolutionType, { label: string; icon: typeof Bot; color: string }> = {
  auto:            { label: 'Tự động',         icon: Bot,       color: '#3B82F6' },
  mutual_confirm:  { label: 'Đồng thuận',      icon: Handshake, color: '#10B981' },
  referee:         { label: 'Trọng tài',       icon: UserCheck, color: '#F59E0B' },
  community_vote:  { label: 'Bình chọn',       icon: Vote,      color: '#8B5CF6' },
};

export function ResolutionChip({ resolution, size = 'sm', className }: ChipProps & { resolution: ResolutionType }) {
  const cfg = RESOLUTION_CONFIG[resolution];
  const Icon = cfg.icon;
  const py = size === 'md' ? 'py-1.5' : 'py-0.5';
  const px = size === 'md' ? 'px-3' : 'px-2';
  const fs = size === 'md' ? φ.xs : 10;
  const iconSz = size === 'md' ? 12 : 10;

  return (
    <span className={`inline-flex items-center gap-1 ${px} ${py} rounded-lg ${className ?? ''}`}
      style={{ background: hexToRgba(cfg.color, 12), color: cfg.color, fontSize: fs, fontWeight: 600 }}>
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   3) STATUS CHIPS (full ChallengeState + Draft)
   ═══════════════════════════════════════════ */

export type StatusType = ChallengeState | 'draft';

const STATUS_CONFIG: Record<StatusType, { label: string; icon: typeof Eye; color: string }> = {
  draft:          { label: 'Bản nháp',       icon: FileEdit,      color: '#94A3B8' },
  open:           { label: 'Đang mở',        icon: Eye,           color: '#3B82F6' },
  full:           { label: 'Đã đầy',         icon: Users,         color: '#F59E0B' },
  live:           { label: 'Đang diễn ra',   icon: Activity,      color: '#10B981' },
  pending_result: { label: 'Chờ kết quả',    icon: Clock,         color: '#8B5CF6' },
  resolved:       { label: 'Hoàn tất',       icon: CheckCircle2,  color: '#10B981' },
  under_review:   { label: 'Đang xem xét',   icon: Shield,        color: '#F59E0B' },
  reported:       { label: 'Đã báo cáo',     icon: Flag,          color: '#EF4444' },
  hidden:         { label: 'Đã ẩn',          icon: XCircle,       color: '#94A3B8' },
  canceled:       { label: 'Đã hủy',         icon: XCircle,       color: '#EF4444' },
  error:          { label: 'Lỗi',            icon: AlertTriangle, color: '#EF4444' },
  offline:        { label: 'Ngoại tuyến',    icon: WifiOff,       color: '#94A3B8' },
};

export function StatusChip({ status, size = 'sm', className }: ChipProps & { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const py = size === 'md' ? 'py-1.5' : 'py-0.5';
  const px = size === 'md' ? 'px-3' : 'px-2';
  const fs = size === 'md' ? φ.xs : 10;
  const iconSz = size === 'md' ? 12 : 10;

  return (
    <span className={`inline-flex items-center gap-1 ${px} ${py} rounded-lg ${className ?? ''}`}
      style={{ background: hexToRgba(cfg.color, 15), color: cfg.color, fontSize: fs, fontWeight: 600 }}>
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}

/** Get status config without rendering */
export function getStatusConfig(status: StatusType) {
  return STATUS_CONFIG[status];
}

/* ═══════════════════════════════════════════
   4) TRUST / BADGE COMPONENTS
   ═══════════════════════════════════════════ */

export type TrustBadgeType = 'points_only' | 'fair_play' | 'high_trust' | 'new_creator' | 'verified_locked';

const TRUST_CONFIG: Record<TrustBadgeType, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  points_only:     { label: 'Points Only',     icon: Star,     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  fair_play:       { label: 'Fair Play',       icon: Shield,   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  high_trust:      { label: 'High Trust',      icon: Shield,   color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  new_creator:     { label: 'Mới',             icon: Sparkles, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  verified_locked: { label: 'Verified (Soon)', icon: Lock,     color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

export function TrustBadge({ type, size = 'sm', className }: ChipProps & { type: TrustBadgeType }) {
  const cfg = TRUST_CONFIG[type];
  const Icon = cfg.icon;
  const py = size === 'md' ? 'py-1.5' : 'py-0.5';
  const px = size === 'md' ? 'px-3' : 'px-2';
  const fs = size === 'md' ? φ.xs : 10;
  const iconSz = size === 'md' ? 11 : 9;
  const isLocked = type === 'verified_locked';

  return (
    <span className={`inline-flex items-center gap-1 ${px} ${py} rounded-lg ${className ?? ''}`}
      style={{ background: cfg.bg, color: cfg.color, fontSize: fs, fontWeight: 600, opacity: isLocked ? 0.6 : 1 }}>
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}
