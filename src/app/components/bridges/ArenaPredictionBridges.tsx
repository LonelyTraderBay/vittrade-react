/**
 * ══════════════════════════════════════════════════════════
 *  07D — Arena × Predictions Safe Bridge Components
 * ══════════════════════════════════════════════════════════
 *
 *  Principles:
 *  - Bridge by TOPIC/CONTENT only, never by money/value
 *  - Arena Points ≠ Real Money — always badge clearly
 *  - Leaderboards/stats never merged
 *  - Every bridge card has microcopy distinguishing modules
 *
 *  Components:
 *  1. SHARED_TOPICS — Shared topic taxonomy
 *  2. TopicChipBar — Renders shared topic chips
 *  3. PredictionContextCard — Market context in Arena pages
 *  4. ArenaRelatedRoomsSection — Arena rooms in Prediction pages
 *  5. ModuleSummaryCard — Profile/Home dual module cards
 */

import React from 'react';
import { useNavigate } from 'react-router';
import {
  Target, Gamepad2, ChevronRight, TrendingUp, Users,
  Shield, Star, BarChart3, Trophy, Zap, ExternalLink,
  Info, Clock,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../ui/TrCard';
import { SectionHeader } from '../ui/SectionHeader';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) SHARED TOPIC TAXONOMY
   ═══════════════════════════════════════════ */

export const SHARED_TOPICS = [
  { id: 'crypto',    label: 'Crypto',    color: '#F59E0B' },
  { id: 'macro',     label: 'Macro',     color: '#3B82F6' },
  { id: 'politics',  label: 'Politics',  color: '#EF4444' },
  { id: 'sports',    label: 'Sports',    color: '#10B981' },
  { id: 'tech',      label: 'Tech',      color: '#6366F1' },
  { id: 'ai',        label: 'AI',        color: '#8B5CF6' },
  { id: 'culture',   label: 'Culture',   color: '#EC4899' },
  { id: 'community', label: 'Community', color: '#14B8A6' },
] as const;

export type SharedTopicId = typeof SHARED_TOPICS[number]['id'];

/** Map prediction categories → shared topic ids */
export function mapCategoryToTopic(category: string): SharedTopicId | null {
  const map: Record<string, SharedTopicId> = {
    'Live Crypto': 'crypto',
    'Crypto': 'crypto',
    'Finance': 'macro',
    'Macro': 'macro',
    'Politics': 'politics',
    'Sports': 'sports',
    'Tech': 'tech',
    'AI': 'ai',
    'Culture': 'culture',
    'Community': 'community',
  };
  return map[category] ?? null;
}

/** Map arena tags → shared topic ids */
export function mapArenaTagToTopic(tag: string): SharedTopicId | null {
  const lower = tag.toLowerCase();
  for (const t of SHARED_TOPICS) {
    if (lower === t.id || lower.includes(t.id)) return t.id;
  }
  return null;
}

/* ═══════════════════════════════════════════
   2) TopicChipBar — Renders shared topic chips
   ═══════════════════════════════════════════ */

interface TopicChipBarProps {
  topics: SharedTopicId[];
  selected?: SharedTopicId | null;
  onSelect?: (id: SharedTopicId) => void;
  size?: 'sm' | 'md';
}

export function TopicChipBar({ topics, selected, onSelect, size = 'sm' }: TopicChipBarProps) {
  const c = useThemeColors();
  const py = size === 'md' ? 'py-1.5' : 'py-0.5';
  const px = size === 'md' ? 'px-3' : 'px-2';
  const fs = size === 'md' ? φ.xs : 10;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {topics.map(topicId => {
        const topic = SHARED_TOPICS.find(t => t.id === topicId);
        if (!topic) return null;
        const isActive = selected === topicId;
        return (
          <button
            key={topicId}
            onClick={() => onSelect?.(topicId)}
            className={`inline-flex items-center gap-1 ${px} ${py} rounded-lg ${onSelect ? 'active:opacity-70' : ''}`}
            style={{
              background: isActive ? hexToRgba(topic.color, 20) : hexToRgba(topic.color, 8),
              color: topic.color,
              fontSize: fs,
              fontWeight: 600,
              border: isActive ? `1px solid ${hexToRgba(topic.color, 40)}` : `1px solid ${hexToRgba(topic.color, 15)}`,
              minHeight: 28,
            }}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   3) PredictionContextCard
   ═══════════════════════════════════════════
   Used in ArenaModeDetailPage (template=prediction)
   and ArenaChallengeDetailPage (linked topic).
   Shows market context — NOT trading UI.
*/

interface PredictionContextCardProps {
  eventTitle: string;
  probability: number;       // 0–100, e.g. 72
  outcomeName?: string;      // e.g. "Yes"
  eventId?: string;          // for navigation
}

export function PredictionContextCard({
  eventTitle, probability, outcomeName = 'Yes', eventId,
}: PredictionContextCardProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <TrCard className="p-4" accentBorder="rgba(139,92,246,0.15)">
      {/* Module boundary badge — always visible */}
      <div className="flex items-center gap-1.5 mb-3">
        <Info size={10} color={c.accent} />
        <span style={{
          color: c.accent, fontSize: 9, fontWeight: 700,
          letterSpacing: 0.5, textTransform: 'uppercase' as const,
        }}>
          Market context only
        </span>
        <div className="flex-1" />
        <span className="px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 8, fontWeight: 600 }}>
          Prediction Markets
        </span>
      </div>

      {/* Title */}
      <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>
        Bối cảnh thị trường
      </p>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
        {eventTitle}
      </p>

      {/* Probability snapshot */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Target size={12} color={c.accent} />
          <span style={{ color: c.text2, fontSize: φ.xs }}>Xác suất "{outcomeName}":</span>
        </div>
        <span style={{
          color: probability >= 50 ? '#10B981' : '#EF4444',
          fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace',
        }}>
          {probability}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: c.surface2 }}>
        <div className="h-full rounded-full" style={{
          width: `${probability}%`,
          background: probability >= 50
            ? 'linear-gradient(90deg, #10B981, #34D399)'
            : 'linear-gradient(90deg, #EF4444, #F87171)',
          transition: 'width 0.4s ease-out',
        }} />
      </div>

      {/* Navigation link */}
      {eventId && (
        <button
          onClick={() => { navigate(`${prefix}/markets/predictions/event/${eventId}`); hapticSelection(); }}
          className="flex items-center gap-1.5 active:opacity-70"
          style={{ minHeight: 32 }}
        >
          <ExternalLink size={11} color={c.accent} />
          <span style={{ color: c.accent, fontSize: φ.xs, fontWeight: 600 }}>
            Xem thị trường dự đoán
          </span>
          <ChevronRight size={10} color={c.accent} />
        </button>
      )}

      {/* Boundary disclaimer */}
      <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 6 }}>
        Thông tin chỉ mang tính tham khảo. Arena Points và Prediction Markets là 2 hệ thống hoàn toàn riêng biệt.
      </p>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   4) ArenaRelatedRoomsSection
   ═══════════════════════════════════════════
   Used in PredictionEventDetailPage.
   Shows related Arena rooms by topic.
*/

interface ArenaRoomBridge {
  id: string;
  title: string;
  format: string;
  slotsFilled: number;
  slotsTotal: number;
  entryPoints: number;
  creatorName: string;
  creatorAvatar: string;
}

/** Mock bridge data: Arena rooms related to prediction topics */
const BRIDGE_ARENA_ROOMS: Record<string, ArenaRoomBridge[]> = {
  crypto: [
    { id: 'room001', title: 'BTC $70K? — Tuần 9', format: 'Closest Guess', slotsFilled: 38, slotsTotal: 50, entryPoints: 100, creatorName: 'CryptoMaster_VN', creatorAvatar: '🧑‍💻' },
    { id: 'room002', title: 'Altcoin Battle — SOL vs AVAX', format: 'Team Battle', slotsFilled: 40, slotsTotal: 40, entryPoints: 200, creatorName: 'ArenaKing', creatorAvatar: '👑' },
  ],
  macro: [
    { id: 'room003', title: 'Fed Rate Predict — March 2026', format: 'Prediction', slotsFilled: 67, slotsTotal: 100, entryPoints: 50, creatorName: 'PredictorPro', creatorAvatar: '🎯' },
  ],
  politics: [
    { id: 'room003', title: 'Fed Rate Predict — March 2026', format: 'Prediction', slotsFilled: 67, slotsTotal: 100, entryPoints: 50, creatorName: 'PredictorPro', creatorAvatar: '🎯' },
  ],
  tech: [
    { id: 'room004', title: 'Crypto Quiz Night #12', format: 'Bracket', slotsFilled: 12, slotsTotal: 16, entryPoints: 150, creatorName: 'QuizWizard', creatorAvatar: '🧙' },
  ],
  ai: [
    { id: 'room004', title: 'Crypto Quiz Night #12', format: 'Bracket', slotsFilled: 12, slotsTotal: 16, entryPoints: 150, creatorName: 'QuizWizard', creatorAvatar: '🧙' },
  ],
  sports: [],
  culture: [
    { id: 'room005', title: 'Coin tháng 3 — Community Vote', format: 'Community Vote', slotsFilled: 145, slotsTotal: 200, entryPoints: 30, creatorName: 'VoteKing', creatorAvatar: '🗳️' },
  ],
  community: [
    { id: 'room005', title: 'Coin tháng 3 — Community Vote', format: 'Community Vote', slotsFilled: 145, slotsTotal: 200, entryPoints: 30, creatorName: 'VoteKing', creatorAvatar: '🗳️' },
  ],
};

export function getRelatedArenaRooms(topic: SharedTopicId): ArenaRoomBridge[] {
  return BRIDGE_ARENA_ROOMS[topic] ?? [];
}

interface ArenaRelatedRoomsSectionProps {
  topic: SharedTopicId;
}

export function ArenaRelatedRoomsSection({ topic }: ArenaRelatedRoomsSectionProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const rooms = getRelatedArenaRooms(topic).slice(0, 3);

  if (rooms.length === 0) return null;

  return (
    <div>
      <SectionHeader
        title="Open Arena trên cùng chủ đề"
        accent
        accentColor="#F59E0B"
        mb={8}
        right={
          <button
            onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
            className="flex items-center gap-1 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Mở Arena</span>
            <ChevronRight size={10} color="#F59E0B" />
          </button>
        }
      />

      {/* Boundary badges — always very visible */}
      <div className="flex gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
          <Star size={9} />
          Arena Points only
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)', color: '#6B7280', fontSize: 9, fontWeight: 700 }}>
          <Shield size={9} />
          Không liên quan Wallet
        </span>
      </div>

      {/* Room cards */}
      <TrCard overflow>
        {rooms.map((room, i) => (
          <button
            key={room.id}
            onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
            style={{
              borderBottom: i < rooms.length - 1 ? `1px solid ${c.divider}` : 'none',
              minHeight: 52,
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', fontSize: 16 }}>
              {room.creatorAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
                {room.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{ color: c.text3, fontSize: φ.xs }}>
                  {room.slotsFilled}/{room.slotsTotal} slots
                </span>
                <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                  {room.entryPoints} pts
                </span>
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: 8, fontWeight: 600 }}>
                  {room.format}
                </span>
              </div>
            </div>
            <ChevronRight size={12} color={c.text3} />
          </button>
        ))}
      </TrCard>

      {/* Disclaimer */}
      <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 6, paddingLeft: 2 }}>
        Arena sử dụng Points (không phải tiền thật). Kết quả Arena không ảnh hưởng vị thế Prediction Markets của bạn.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   5) ModuleSummaryCard — For Profile & Home
   ═══════════════════════════════════════════
   Displays separate module blocks with clear
   boundary between Predictions and Arena.
*/

interface ModuleSummaryCardProps {
  module: 'predictions' | 'arena';
  onPress: () => void;
}

const MODULE_CONFIG = {
  predictions: {
    icon: Target,
    title: 'Prediction Markets',
    subtitle: 'Thị trường dự đoán · Vị thế · Xác suất',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))',
    border: 'rgba(139,92,246,0.2)',
    badge: 'Real positions',
    badgeBg: 'rgba(139,92,246,0.1)',
    badgeColor: '#8B5CF6',
  },
  arena: {
    icon: Gamepad2,
    title: 'Open Arena',
    subtitle: 'Creator modes · Arena Points · Phòng chơi',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.06))',
    border: 'rgba(245,158,11,0.2)',
    badge: 'Points only',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeColor: '#F59E0B',
  },
};

export function ModuleSummaryCard({ module, onPress }: ModuleSummaryCardProps) {
  const c = useThemeColors();
  const cfg = MODULE_CONFIG[module];
  const Icon = cfg.icon;

  return (
    <TrCard hover as="button" onClick={onPress}
      className="p-4 w-full text-left"
      accentBorder={cfg.border}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.gradient }}>
          <Icon size={20} color={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              {cfg.title}
            </p>
            <span className="px-2 py-0.5 rounded-md"
              style={{ background: cfg.badgeBg, color: cfg.badgeColor, fontSize: 8, fontWeight: 700 }}>
              {cfg.badge}
            </span>
          </div>
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }}>
            {cfg.subtitle}
          </p>
        </div>
        <ChevronRight size={14} color={c.text3} />
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   6) ProfileModuleBlocks — 2 separate blocks
   ═══════════════════════════════════════════ */

interface ProfileModuleBlocksProps {
  predictionStats: {
    positions: number;
    openOrders?: number;
    pnl: number;
    pnlLabel: string;
  };
  arenaStats: {
    points: number;
    pointsLabel: string;
    rooms: number;
    creatorScore?: number;
  };
}

export function ProfileModuleBlocks({ predictionStats, arenaStats }: ProfileModuleBlocksProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div className="flex flex-col gap-3">
      {/* Prediction Portfolio block */}
      <TrCard className="p-4" accentBorder="rgba(139,92,246,0.15)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} color="#8B5CF6" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Prediction Portfolio</span>
          </div>
          <span className="px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
            Prediction Market
          </span>
        </div>
        <div className="flex gap-4 mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Vị thế</p>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {predictionStats.positions}
            </p>
          </div>
          {predictionStats.openOrders != null && (
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Lệnh mở</p>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                {predictionStats.openOrders}
              </p>
            </div>
          )}
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>P/L</p>
            <p style={{
              color: predictionStats.pnl >= 0 ? '#10B981' : '#EF4444',
              fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace',
            }}>
              {predictionStats.pnlLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { navigate(`${prefix}/profile/predictions`); hapticSelection(); }}
            className="flex items-center gap-1.5 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Xem portfolio</span>
            <ChevronRight size={10} color="#8B5CF6" />
          </button>
          <button
            onClick={() => { navigate(`${prefix}/markets/predictions/leaderboard`); hapticSelection(); }}
            className="flex items-center gap-1.5 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <Trophy size={10} color="#8B5CF6" />
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600 }}>Leaderboard</span>
          </button>
        </div>
      </TrCard>

      {/* Open Arena block */}
      <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 size={14} color="#F59E0B" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Open Arena</span>
          </div>
          <span className="px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: 8, fontWeight: 700 }}>
            Points only
          </span>
        </div>
        <div className="flex gap-4 mb-3">
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Arena Points</p>
            <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {arenaStats.pointsLabel}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 9 }}>Phòng</p>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {arenaStats.rooms}
            </p>
          </div>
          {arenaStats.creatorScore != null && (
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Creator</p>
              <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                {arenaStats.creatorScore}%
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { navigate(`${prefix}/profile/arena`); hapticSelection(); }}
            className="flex items-center gap-1.5 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Vào sân chơi của tôi</span>
            <ChevronRight size={10} color="#F59E0B" />
          </button>
          <button
            onClick={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
            className="flex items-center gap-1.5 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <Shield size={10} color="#F59E0B" />
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600 }}>An toàn & Báo cáo</span>
          </button>
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   7) DiscoverMoreSection — For MarketListPage
   ═══════════════════════════════════════════ */

export function DiscoverMoreSection() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div>
      <SectionHeader title="Khám phá thêm" accent accentColor="#6366F1" mb={8} />
      <TrCard overflow>
        {[
          {
            icon: Target,
            title: 'Prediction Markets',
            subtitle: 'Dự đoán sự kiện · Xác suất · Vị thế',
            color: '#8B5CF6',
            badge: 'Real positions',
            route: `${prefix}/markets/predictions`,
          },
          {
            icon: Gamepad2,
            title: 'Open Arena',
            subtitle: 'Creator modes · Thách đấu · Arena Points',
            color: '#F59E0B',
            badge: 'Points only',
            route: `${prefix}/arena`,
          },
        ].map((item, i) => (
          <button
            key={item.title}
            onClick={() => { navigate(item.route); hapticSelection(); }}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
            style={{
              borderBottom: i === 0 ? `1px solid ${c.divider}` : 'none',
              minHeight: 52,
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: hexToRgba(item.color, 12) }}>
              <item.icon size={18} color={item.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{item.title}</p>
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: hexToRgba(item.color, 10), color: item.color, fontSize: 8, fontWeight: 700 }}>
                  {item.badge}
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs }}>{item.subtitle}</p>
            </div>
            <ChevronRight size={12} color={c.text3} />
          </button>
        ))}
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   8) HomeDiscoverySection — For HomePage
   ═══════════════════════════════════════════
   "Dự đoán & Thách đấu" — 2 stacked cards
*/

export function HomeDiscoverySection() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>
          Dự đoán & Thách đấu
        </h2>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Prediction Markets card */}
        <TrCard hover as="button"
          onClick={() => { navigate(`${prefix}/markets/predictions`); hapticSelection(); }}
          className="w-full p-4 text-left"
          accentBorder="rgba(139,92,246,0.2)">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))' }}>
              <Target size={20} color="#8B5CF6" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                  Prediction Markets
                </p>
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
                  Prediction Market
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 6 }}>
                Thị trường xác suất, vị thế và portfolio
              </p>
              <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>
                Khám phá thị trường
              </span>
            </div>
            <ChevronRight size={14} color="#8B5CF6" />
          </div>
        </TrCard>

        {/* Open Arena card */}
        <TrCard hover as="button"
          onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
          className="w-full p-4 text-left"
          accentBorder="rgba(245,158,11,0.2)">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))' }}>
              <Gamepad2 size={20} color="#F59E0B" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                  Open Arena
                </p>
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: 8, fontWeight: 700 }}>
                  Arena Points only
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 6 }}>
                Tạo mode chơi, mở room, dùng Arena Points
              </p>
              <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                Vào Arena
              </span>
            </div>
            <ChevronRight size={14} color="#F59E0B" />
          </div>
        </TrCard>
      </div>

      {/* Microcopy */}
      <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 6, textAlign: 'center' }}>
        Predictions sử dụng vị thế thực. Arena sử dụng Points (không phải tiền thật).
      </p>
    </div>
  );
}