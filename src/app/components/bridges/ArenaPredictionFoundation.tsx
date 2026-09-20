/**
 * ══════════════════════════════════════════════════════════
 *  09A — Arena × Predictions Bridge Foundation Components
 * ══════════════════════════════════════════════════════════
 *
 *  FOUNDATION layer: boundary & bridge components between
 *  Open Arena (points-only) and Prediction Markets (real positions).
 *
 *  Principles enforced:
 *  - Connect by CONTENT/TOPIC only, never by value
 *  - Arena Points ≠ tài sản tài chính
 *  - Wallet/PnL/settlement never shared
 *  - Every bridge has mandatory disclosure
 *
 *  Components:
 *  1. UnifiedTopicChip      — Shared topic chip (4 states)
 *  2. ModuleBoundaryBanner   — 6 disclosure variants
 *  3. ModuleLabelBadge       — 6 module label variants
 *  4. BoundaryInfoRow        — Disclosure row between modules
 *  5. ArenaRelatedRoomCard   — Individual room card for Prediction pages
 *  6. DualModuleStatCard     — 2 separate stat blocks (never merged)
 *  7. BridgeSourceBar        — Source context bar for Arena Studio
 */

import React from 'react';
import { useNavigate } from 'react-router';
import {
  Info, Shield, Star, ChevronRight, ExternalLink,
  Target, Gamepad2, Users, Lock, AlertTriangle, X,
  Link2, Sparkles, Clock,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../ui/TrCard';
import { φ, φRadius } from '../../utils/golden';
import { SHARED_TOPICS, type SharedTopicId } from './ArenaPredictionBridges';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) UnifiedTopicChip
   ═══════════════════════════════════════════
   States: default | selected | compact | disabled
*/

export type TopicChipState = 'default' | 'selected' | 'compact' | 'disabled';

interface UnifiedTopicChipProps {
  topicId: SharedTopicId;
  state?: TopicChipState;
  onPress?: () => void;
}

export function UnifiedTopicChip({ topicId, state = 'default', onPress }: UnifiedTopicChipProps) {
  const topic = SHARED_TOPICS.find(t => t.id === topicId);
  if (!topic) return null;

  const isDisabled = state === 'disabled';
  const isCompact = state === 'compact';
  const isSelected = state === 'selected';

  const bgOpacity = isSelected ? '20' : isDisabled ? '05' : '10';
  const borderOpacity = isSelected ? '40' : isDisabled ? '10' : '18';

  return (
    <button
      onClick={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1 rounded-lg active:opacity-70 ${
        isCompact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'
      }`}
      style={{
        background: `${topic.color}${bgOpacity}`,
        border: `1px solid ${topic.color}${borderOpacity}`,
        color: isDisabled ? '#94A3B8' : topic.color,
        fontSize: isCompact ? 9 : 11,
        fontWeight: 600,
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : onPress ? 'pointer' : 'default',
        minHeight: isCompact ? 20 : 28,
      }}
    >
      {topic.label}
    </button>
  );
}

/* ═══════════════════════════════════════════
   2) ModuleBoundaryBanner — 6 variants
   ═══════════════════════════════════════════ */

export type BannerVariant =
  | 'arena_points_only'
  | 'prediction_market'
  | 'market_context_only'
  | 'no_wallet_link'
  | 'verified_future'
  | 'risk_disclosure';

interface ModuleBoundaryBannerProps {
  variant: BannerVariant;
  compact?: boolean;
}

const BANNER_CONFIG: Record<BannerVariant, {
  icon: typeof Info;
  color: string;
  bg: string;
  border: string;
  title: string;
  description: string;
}> = {
  arena_points_only: {
    icon: Star,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.18)',
    title: 'Arena Points only',
    description: 'Arena Points không phải tài sản tài chính. Không quy đổi, không rút được.',
  },
  prediction_market: {
    icon: Target,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.06)',
    border: 'rgba(139,92,246,0.18)',
    title: 'Prediction Markets',
    description: 'Vị thế thực trên thị trường dự đoán. Tách biệt hoàn toàn với Arena Points.',
  },
  market_context_only: {
    icon: Info,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.18)',
    title: 'Market context only',
    description: 'Chỉ dùng làm bối cảnh tham khảo. Không ảnh hưởng vị thế hoặc số dư.',
  },
  no_wallet_link: {
    icon: Shield,
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.06)',
    border: 'rgba(107,114,128,0.18)',
    title: 'Không liên quan Wallet',
    description: 'Module này không kết nối với ví hoặc số dư tài sản của bạn.',
  },
  verified_future: {
    icon: Lock,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.04)',
    border: 'rgba(139,92,246,0.15)',
    title: 'Verified — Future',
    description: 'Tính năng Verified Challenges sẽ mở trong tương lai.',
  },
  risk_disclosure: {
    icon: AlertTriangle,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.04)',
    border: 'rgba(239,68,68,0.15)',
    title: 'Lưu ý rủi ro',
    description: 'Prediction Markets có rủi ro. Arena Points không phải tiền thật. Xem quy tắc trước khi tham gia.',
  },
};

export function ModuleBoundaryBanner({ variant, compact }: ModuleBoundaryBannerProps) {
  const cfg = BANNER_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl ${compact ? 'p-2.5' : 'p-3.5'}`}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <Icon size={compact ? 12 : 14} color={cfg.color} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p style={{
          color: cfg.color,
          fontSize: compact ? 10 : φ.xs,
          fontWeight: 700,
          letterSpacing: compact ? 0.3 : 0.5,
          textTransform: 'uppercase' as const,
          marginBottom: compact ? 1 : 2,
        }}>
          {cfg.title}
        </p>
        {!compact && (
          <p style={{ color: '#6B7280', fontSize: φ.xs, lineHeight: 1.5 }}>
            {cfg.description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3) ModuleLabelBadge — 6 variants
   ═══════════════════════════════════════════ */

export type BadgeVariant =
  | 'open_arena'
  | 'prediction_markets'
  | 'linked_context'
  | 'future'
  | 'creator_mode'
  | 'event_context';

interface ModuleLabelBadgeProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<BadgeVariant, {
  label: string;
  color: string;
  bg: string;
  icon?: typeof Gamepad2;
}> = {
  open_arena: { label: 'Open Arena', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: Gamepad2 },
  prediction_markets: { label: 'Prediction Markets', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', icon: Target },
  linked_context: { label: 'Linked Context', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', icon: Link2 },
  future: { label: 'Future', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', icon: Lock },
  creator_mode: { label: 'Creator Mode', color: '#10B981', bg: 'rgba(16,185,129,0.10)', icon: Sparkles },
  event_context: { label: 'Event Context', color: '#6366F1', bg: 'rgba(99,102,241,0.10)', icon: Clock },
};

export function ModuleLabelBadge({ variant, size = 'sm' }: ModuleLabelBadgeProps) {
  const cfg = BADGE_CONFIG[variant];
  const Icon = cfg.icon;
  const isMd = size === 'md';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md ${
        isMd ? 'px-2.5 py-1' : 'px-1.5 py-0.5'
      }`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: isMd ? 10 : 8,
        fontWeight: 700,
        border: `1px solid ${hexToRgba(cfg.color, 20)}`,
      }}
    >
      {Icon && <Icon size={isMd ? 10 : 8} />}
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   4) BoundaryInfoRow — Short disclosure
   ═══════════════════════════════════════════ */

interface BoundaryInfoRowProps {
  icon?: typeof Info;
  text: string;
  color?: string;
}

export function BoundaryInfoRow({ icon: Icon = Info, text, color = '#6B7280' }: BoundaryInfoRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon size={10} color={color} className="shrink-0" />
      <p style={{ color, fontSize: 9, lineHeight: 1.4, fontWeight: 500 }}>
        {text}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   5) ArenaRelatedRoomCard (standalone)
   ═══════════════════════════════════════════
   Used in Prediction pages.
   Shows individual room with full detail:
   - room title, format, points entry, creator
   - trust badge, resolution type, privacy chip
   - CTA "Xem room", mandatory "Arena Points only" badge
*/

interface ArenaRelatedRoomCardProps {
  roomId: string;
  title: string;
  format: string;
  entryPoints: number;
  slotsFilled: number;
  slotsTotal: number;
  creatorName: string;
  creatorAvatar: string;
  trustScore?: number;
  resolutionType?: string;
  privacy?: 'public' | 'private' | 'friends_only';
}

export function ArenaRelatedRoomCard({
  roomId, title, format, entryPoints,
  slotsFilled, slotsTotal, creatorName, creatorAvatar,
  trustScore = 85, resolutionType = 'Xác nhận 2 bên',
  privacy = 'public',
}: ArenaRelatedRoomCardProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const fillPct = Math.round((slotsFilled / slotsTotal) * 100);

  const privacyLabels: Record<string, { label: string; icon: string }> = {
    public: { label: 'Công khai', icon: '🌐' },
    private: { label: 'Mời thôi', icon: '🔒' },
    friends_only: { label: 'Bạn bè', icon: '👥' },
  };
  const priv = privacyLabels[privacy] ?? privacyLabels.public;

  return (
    <TrCard hover className="p-4" accentBorder="rgba(245,158,11,0.15)">
      {/* Mandatory boundary badge */}
      <div className="flex items-center gap-1.5 mb-3">
        <Star size={9} color="#F59E0B" />
        <span style={{
          color: '#F59E0B', fontSize: 9, fontWeight: 700,
          letterSpacing: 0.5, textTransform: 'uppercase' as const,
        }}>
          Arena Points only
        </span>
        <div className="flex-1" />
        <ModuleLabelBadge variant="open_arena" />
      </div>

      {/* Room title + format */}
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>
        {title}
      </p>

      {/* Meta chips row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>
          {format}
        </span>
        <span className="px-1.5 py-0.5 rounded-md"
          style={{ background: c.surface2, color: c.text2, fontSize: 9, fontWeight: 600 }}>
          {priv.icon} {priv.label}
        </span>
        <span className="px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: 9, fontWeight: 600 }}>
          {resolutionType}
        </span>
      </div>

      {/* Creator + trust */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>{creatorAvatar}</span>
        <span style={{ color: c.text2, fontSize: φ.xs }}>{creatorName}</span>
        <span className="px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 9, fontWeight: 600 }}>
          <Shield size={8} /> {trustScore}%
        </span>
      </div>

      {/* Entry + slots */}
      <div className="flex items-center gap-3 mb-3">
        <div>
          <p style={{ color: c.text3, fontSize: 9 }}>Entry</p>
          <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
            {entryPoints} pts
          </p>
        </div>
        <div className="flex-1">
          <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Slots {slotsFilled}/{slotsTotal}</p>
          <div className="h-1.5 rounded-full" style={{ background: c.surface2 }}>
            <div className="h-full rounded-full" style={{
              width: `${fillPct}%`,
              background: fillPct >= 90 ? '#EF4444' : fillPct >= 60 ? '#F59E0B' : '#3B82F6',
            }} />
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => { navigate(`${prefix}/arena/challenge/${roomId}`); hapticSelection(); }}
        className="flex items-center gap-1.5 active:opacity-70"
        style={{ minHeight: 36 }}
      >
        <ExternalLink size={11} color="#F59E0B" />
        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Xem room</span>
        <ChevronRight size={10} color="#F59E0B" />
      </button>

      {/* Disclaimer */}
      <BoundaryInfoRow
        icon={Shield}
        text="Room social points-only, không liên quan wallet."
        color="#94A3B8"
      />
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   6) DualModuleStatCard
   ═══════════════════════════════════════════
   2 separate stat blocks — NEVER merged.
*/

interface DualModuleStatCardProps {
  prediction: {
    positions: number;
    pnlLabel: string;
    pnlPositive: boolean;
  };
  arena: {
    pointsLabel: string;
    rooms: number;
  };
  onPredictionTap?: () => void;
  onArenaTap?: () => void;
}

export function DualModuleStatCard({
  prediction, arena, onPredictionTap, onArenaTap,
}: DualModuleStatCardProps) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-3">
      {/* Prediction Portfolio block */}
      <TrCard className="p-4" accentBorder="rgba(139,92,246,0.15)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} color="#8B5CF6" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Prediction Portfolio</span>
          </div>
          <ModuleLabelBadge variant="prediction_markets" />
        </div>
        <div className="flex gap-4 mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Vị thế</p>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {prediction.positions}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>P/L</p>
            <p style={{
              color: prediction.pnlPositive ? '#10B981' : '#EF4444',
              fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace',
            }}>
              {prediction.pnlLabel}
            </p>
          </div>
        </div>
        {onPredictionTap && (
          <button onClick={onPredictionTap} className="flex items-center gap-1.5 active:opacity-70" style={{ minHeight: 28 }}>
            <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Xem danh mục</span>
            <ChevronRight size={10} color="#8B5CF6" />
          </button>
        )}
      </TrCard>

      {/* Boundary separator */}
      <BoundaryInfoRow
        icon={Shield}
        text="2 module tách biệt hoàn toàn. Số liệu KHÔNG được gộp."
        color="#94A3B8"
      />

      {/* Open Arena block */}
      <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 size={14} color="#F59E0B" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Open Arena</span>
          </div>
          <ModuleLabelBadge variant="open_arena" />
        </div>
        <div className="flex gap-4 mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Arena Points</p>
            <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {arena.pointsLabel}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Phòng</p>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {arena.rooms}
            </p>
          </div>
        </div>
        {onArenaTap && (
          <button onClick={onArenaTap} className="flex items-center gap-1.5 active:opacity-70" style={{ minHeight: 28 }}>
            <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Xem sân chơi</span>
            <ChevronRight size={10} color="#F59E0B" />
          </button>
        )}
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   7) BridgeSourceBar — For Arena Studio
   ═══════════════════════════════════════════
   Shows when user comes from a Prediction event.
   Displays source context with remove option.
*/

interface BridgeSourceBarProps {
  eventTitle: string;
  topic: SharedTopicId;
  eventId?: string;
  onRemove?: () => void;
}

export function BridgeSourceBar({ eventTitle, topic, eventId, onRemove }: BridgeSourceBarProps) {
  const c = useThemeColors();
  const topicData = SHARED_TOPICS.find(t => t.id === topic);
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div
      className="flex items-center gap-2.5 p-3 rounded-xl"
      style={{
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
      }}
    >
      <Link2 size={13} color="#3B82F6" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
            Nguồn bối cảnh
          </span>
          <ModuleLabelBadge variant="linked_context" size="sm" />
        </div>
        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, lineHeight: 1.4 }} className="truncate">
          {eventTitle}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {topicData && (
            <UnifiedTopicChip topicId={topic} state="compact" />
          )}
          {eventId && (
            <button
              onClick={() => { navigate(`${prefix}/markets/predictions/event/${eventId}`); hapticSelection(); }}
              className="flex items-center gap-0.5 active:opacity-70"
              style={{ minHeight: 20 }}
            >
              <ExternalLink size={8} color="#8B5CF6" />
              <span style={{ color: '#8B5CF6', fontSize: 9, fontWeight: 600 }}>Xem sự kiện</span>
            </button>
          )}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 active:opacity-70"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        >
          <X size={12} color="#EF4444" />
        </button>
      )}
    </div>
  );
}
