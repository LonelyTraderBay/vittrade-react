/**
 * ══════════════════════════════════════════════════════════
 *  06F — Open Arena Flow Map
 * ══════════════════════════════════════════════════════════
 *  Interactive prototype flow map for the entire Open Arena module.
 *
 *  SECTION 1: Prototype Flow Map (Core / Discovery / Creator / Participant / Owner)
 *  SECTION 2: Handoff Notes
 *  SECTION 3: Final QA Checklist
 *
 *  All nodes link to actual prototype routes via navigate().
 *  Enterprise compliance: tap targets ≥44pt, φ typography, semantic tokens.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Map,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  Home,
  User,
  BarChart3,
  Sparkles,
  Eye,
  Gamepad2,
  Trophy,
  Star,
  Shield,
  Lock,
  Users,
  Zap,
  Play,
  FileText,
  Settings,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clipboard,
  BookOpen,
  Award,
  Clock,
  Send,
  Flag,
  Globe,
  Search,
  Gift,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { StatusChip, type StatusType } from '@/dev/legacy/arena/components/ArenaChips';
import { ArenaPageFooter } from '@/dev/legacy/arena/components/ArenaPageFooter';
import { φ } from '@/shared/lib/golden';
import { hexToRgba } from '@/shared/lib/string';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  icon: typeof Home;
  route?: string;
  state?: StatusType;
  accent?: string;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

interface FlowGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Map;
  color: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
}

interface QAItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

/* ═══════════════════════════════════════════
   Flow Data — mirrors the spec exactly
   ═══════════════════════════════════════════ */

const FLOW_GROUPS: FlowGroup[] = [
  /* ─── Core Entry Points ─── */
  {
    id: 'core',
    title: 'Core Entry Points',
    subtitle: '3 điểm vào chính từ bottom nav',
    icon: Home,
    color: '#3B82F6',
    nodes: [
      {
        id: 'home',
        label: 'HomePage_v2',
        sublabel: 'Tab Home',
        icon: Home,
        route: '/',
        accent: '#3B82F6',
      },
      {
        id: 'profile',
        label: 'ProfilePage_v2',
        sublabel: 'Tab Profile',
        icon: User,
        route: '/profile',
        accent: '#8B5CF6',
      },
      {
        id: 'market',
        label: 'MarketListPage_v2',
        sublabel: 'Tab Trade',
        icon: BarChart3,
        route: '/trade',
        accent: '#10B981',
      },
      {
        id: 'arena_home',
        label: 'ArenaHomePage',
        sublabel: 'Hub chính',
        icon: Gamepad2,
        route: '/arena',
        accent: '#F59E0B',
      },
    ],
    connections: [
      { from: 'home', to: 'arena_home', label: 'Quick action card' },
      { from: 'profile', to: 'my_arena', label: 'Menu "Sân chơi"' },
      { from: 'market', to: 'arena_home', label: 'Banner Arena' },
    ],
  },
  /* ─── Discovery Flow ─── */
  {
    id: 'discovery',
    title: 'Discovery Flow',
    subtitle: 'Khám phá modes, challenges, creators',
    icon: Search,
    color: '#8B5CF6',
    nodes: [
      {
        id: 'arena_home_d',
        label: 'ArenaHomePage',
        sublabel: 'Hub chính',
        icon: Gamepad2,
        route: '/arena',
        accent: '#F59E0B',
      },
      {
        id: 'studio',
        label: 'ArenaStudioPage',
        sublabel: 'Tạo challenge',
        icon: Sparkles,
        route: '/arena/studio',
        accent: '#8B5CF6',
      },
      {
        id: 'mode_detail',
        label: 'ArenaModeDetailPage',
        sublabel: 'Chi tiết mode',
        icon: FileText,
        route: '/arena/mode/mode001',
        accent: '#10B981',
      },
      {
        id: 'challenge_d',
        label: 'ArenaChallengeDetail',
        sublabel: 'Chi tiết challenge',
        icon: Eye,
        route: '/arena/challenge/ch001',
        accent: '#3B82F6',
      },
      {
        id: 'creator',
        label: 'ArenaCreatorPage',
        sublabel: 'Hồ sơ creator',
        icon: Star,
        route: '/arena/creator/cr001',
        accent: '#F59E0B',
      },
      {
        id: 'leaderboard',
        label: 'ArenaLeaderboardPage',
        sublabel: 'Bảng xếp hạng',
        icon: Trophy,
        route: '/arena/leaderboard',
        accent: '#EF4444',
      },
      {
        id: 'points',
        label: 'ArenaPointsPage',
        sublabel: 'Kiếm Points',
        icon: Gift,
        route: '/arena/points',
        accent: '#F59E0B',
      },
    ],
    connections: [
      { from: 'arena_home_d', to: 'studio', label: 'CTA Tạo mới' },
      { from: 'arena_home_d', to: 'mode_detail', label: 'Featured Modes' },
      { from: 'arena_home_d', to: 'challenge_d', label: 'Live Rooms' },
      { from: 'arena_home_d', to: 'creator', label: 'Creator Spotlight' },
      { from: 'arena_home_d', to: 'leaderboard', label: 'Quick nav chip' },
      { from: 'arena_home_d', to: 'points', label: 'Quick nav chip' },
    ],
  },
  /* ─── Creator Flow ─── */
  {
    id: 'creator_flow',
    title: 'Creator Flow',
    subtitle: '6-step wizard → publish → challenge live',
    icon: Sparkles,
    color: '#10B981',
    nodes: [
      {
        id: 'step1',
        label: 'Step 1 — Template',
        sublabel: 'Chọn template',
        icon: FileText,
        route: '/arena/studio',
        accent: '#8B5CF6',
      },
      {
        id: 'step2',
        label: 'Step 2 — Cấu trúc',
        sublabel: 'Format, slots, join',
        icon: Users,
        accent: '#3B82F6',
      },
      {
        id: 'step3',
        label: 'Step 3 — Luật chơi',
        sublabel: 'Tên, rules, win cond',
        icon: Shield,
        accent: '#F59E0B',
      },
      {
        id: 'step4',
        label: 'Step 4 — Kết quả',
        sublabel: 'Resolution method',
        icon: CheckCircle2,
        accent: '#10B981',
      },
      {
        id: 'step5',
        label: 'Step 5 — Points',
        sublabel: 'Entry, privacy, EV',
        icon: Zap,
        accent: '#F59E0B',
      },
      {
        id: 'step6',
        label: 'Step 6 — Review',
        sublabel: 'Preview & publish',
        icon: Eye,
        accent: '#8B5CF6',
      },
      {
        id: 'publish',
        label: 'Publish',
        sublabel: 'Kiểm duyệt tự động',
        icon: Send,
        accent: '#10B981',
      },
      {
        id: 'ch_open',
        label: 'ChallengeDetail',
        sublabel: 'State: Open',
        icon: Play,
        route: '/arena/challenge/ch001',
        accent: '#3B82F6',
        state: 'open',
      },
    ],
    connections: [
      { from: 'step1', to: 'step2' },
      { from: 'step2', to: 'step3' },
      { from: 'step3', to: 'step4' },
      { from: 'step4', to: 'step5' },
      { from: 'step5', to: 'step6' },
      { from: 'step6', to: 'publish', label: 'Mở phòng' },
      { from: 'publish', to: 'ch_open', label: 'Auto-moderation pass' },
    ],
  },
  /* ─── Participant Flow ─── */
  {
    id: 'participant',
    title: 'Participant Flow',
    subtitle: 'Tham gia challenge → live → kết quả',
    icon: Users,
    color: '#F59E0B',
    nodes: [
      {
        id: 'ch_detail_p',
        label: 'ChallengeDetail',
        sublabel: 'State: Open',
        icon: Eye,
        route: '/arena/challenge/ch001',
        accent: '#3B82F6',
        state: 'open',
      },
      {
        id: 'join_page',
        label: 'ArenaJoinPage',
        sublabel: 'Confirm join + rules',
        icon: Play,
        route: '/arena/challenge/ch001/join',
        accent: '#10B981',
      },
      {
        id: 'ch_live',
        label: 'ChallengeDetail',
        sublabel: 'State: Live',
        icon: Play,
        accent: '#10B981',
        state: 'live',
      },
      {
        id: 'ch_pending',
        label: 'ChallengeDetail',
        sublabel: 'State: Pending Result',
        icon: Clock,
        accent: '#8B5CF6',
        state: 'pending_result',
      },
      {
        id: 'ch_resolved',
        label: 'ChallengeDetail',
        sublabel: 'State: Resolved',
        icon: Trophy,
        accent: '#F59E0B',
        state: 'resolved',
      },
    ],
    connections: [
      { from: 'ch_detail_p', to: 'join_page', label: 'CTA Tham gia' },
      { from: 'join_page', to: 'ch_live', label: 'Confirm Join' },
      { from: 'ch_live', to: 'ch_pending', label: 'Kết thúc thời gian' },
      { from: 'ch_pending', to: 'ch_resolved', label: 'Xác nhận kết quả' },
    ],
  },
  /* ─── Owner Flow ─── */
  {
    id: 'owner',
    title: 'Owner Flow',
    subtitle: 'Quản lý phòng, modes đã tạo, prefill studio',
    icon: Star,
    color: '#EF4444',
    nodes: [
      {
        id: 'my_arena',
        label: 'MyArenaPage',
        sublabel: '5-tab management',
        icon: Star,
        route: '/profile/arena',
        accent: '#8B5CF6',
      },
      {
        id: 'ch_manage',
        label: 'ChallengeDetail',
        sublabel: 'Quản lý phòng',
        icon: Settings,
        route: '/arena/challenge/ch001',
        accent: '#3B82F6',
      },
      {
        id: 'mode_manage',
        label: 'ModeDetailPage',
        sublabel: 'Mode đã tạo/lưu',
        icon: FileText,
        route: '/arena/mode/mode001',
        accent: '#10B981',
      },
      {
        id: 'creator_p',
        label: 'ArenaCreatorPage',
        sublabel: 'Hồ sơ creator',
        icon: Award,
        route: '/arena/creator/cr001',
        accent: '#F59E0B',
      },
      {
        id: 'studio_pf',
        label: 'ArenaStudioPage',
        sublabel: 'Prefilled từ mode',
        icon: Sparkles,
        route: '/arena/studio',
        accent: '#8B5CF6',
      },
    ],
    connections: [
      { from: 'my_arena', to: 'ch_manage', label: 'Tab "Phòng của tôi"' },
      { from: 'my_arena', to: 'mode_manage', label: 'Tab "Mode đã lưu"' },
      { from: 'creator_p', to: 'mode_manage', label: 'Xem mode' },
      { from: 'mode_manage', to: 'studio_pf', label: 'Tạo challenge từ mode', dashed: true },
    ],
  },
];

/* ═══════════════════════════════════════════
   Handoff Notes
   ═══════════════════════════════════════════ */

interface HandoffNote {
  icon: typeof Shield;
  color: string;
  title: string;
  detail: string;
}

const HANDOFF_NOTES: HandoffNote[] = [
  {
    icon: Zap,
    color: '#F59E0B',
    title: 'Open Arena = Points-only',
    detail:
      'Toàn bộ module Open Arena sử dụng Arena Points — không liên quan đến ví tài chính, không chuyển đổi thành tiền thật, không cash-out.',
  },
  {
    icon: Shield,
    color: '#3B82F6',
    title: 'Không liên quan Wallet tài chính',
    detail:
      'Arena Points hoàn toàn tách biệt khỏi Spot Wallet, P2P Wallet. Không có flow deposit/withdraw crypto cho Arena.',
  },
  {
    icon: Lock,
    color: '#EF4444',
    title: 'Verified Challenges = tách module riêng',
    detail:
      'Verified Challenges (có real stakes) sẽ được phát triển riêng trong phase sau, với compliance review, KYC gate, và audit trail. Hiện chỉ future-ready placeholder.',
  },
  {
    icon: Globe,
    color: '#10B981',
    title: 'Không thêm item vào bottom nav',
    detail:
      'Open Arena truy cập qua Home quick action, Profile menu, và Market banner — không chiếm slot bottom navigation.',
  },
  {
    icon: FileText,
    color: '#8B5CF6',
    title: 'Mọi challenge bắt buộc có đủ',
    detail:
      'Rules summary, resolution method, privacy setting, report/block functionality. Không có challenge nào publish mà thiếu thông tin này.',
  },
  {
    icon: Flag,
    color: '#EF4444',
    title: 'Moderation & Safety',
    detail:
      'ReportDialog (7 lý do), BlockUserDialog, CommunityRulesDialog (6 quy tắc), ArenaOfflineBanner — đã integrate toàn bộ Arena pages.',
  },
];

/* ═══════════════════════════════════════════
   QA Checklist Data
   ═══════════════════════════════════════════ */

const INITIAL_QA: QAItem[] = [
  /* Route mapping */
  {
    id: 'qa01',
    category: 'Route Mapping',
    label: 'ArenaHomePage (index) — hub chính',
    checked: false,
  },
  {
    id: 'qa02',
    category: 'Route Mapping',
    label: 'ArenaStudioPage — 6-step wizard',
    checked: false,
  },
  {
    id: 'qa03',
    category: 'Route Mapping',
    label: 'ArenaModeDetailPage — mode/:modeId',
    checked: false,
  },
  {
    id: 'qa04',
    category: 'Route Mapping',
    label: 'ArenaChallengeDetailPage — challenge/:challengeId',
    checked: false,
  },
  {
    id: 'qa05',
    category: 'Route Mapping',
    label: 'ArenaJoinPage — challenge/:challengeId/join',
    checked: false,
  },
  {
    id: 'qa06',
    category: 'Route Mapping',
    label: 'ArenaCreatorPage — creator/:creatorId',
    checked: false,
  },
  {
    id: 'qa07',
    category: 'Route Mapping',
    label: 'ArenaLeaderboardPage — leaderboard',
    checked: false,
  },
  { id: 'qa08', category: 'Route Mapping', label: 'ArenaPointsPage — points', checked: false },
  {
    id: 'qa09',
    category: 'Route Mapping',
    label: 'VerifiedChallengesPage — verified (placeholder)',
    checked: false,
  },
  { id: 'qa10', category: 'Route Mapping', label: 'MyArenaPage — profile/arena', checked: false },

  /* Entry Points */
  {
    id: 'qa11',
    category: 'Entry Points',
    label: 'HomePage_v2 → ArenaHomePage (quick action)',
    checked: false,
  },
  {
    id: 'qa12',
    category: 'Entry Points',
    label: 'ProfilePage_v2 → MyArenaPage (menu)',
    checked: false,
  },
  {
    id: 'qa13',
    category: 'Entry Points',
    label: 'MarketListPage_v2 → ArenaHomePage (banner)',
    checked: false,
  },

  /* Format Coverage */
  {
    id: 'qa14',
    category: 'Format Coverage',
    label: '1v1 layout — ParticipantCard VS ParticipantCard',
    checked: false,
  },
  {
    id: 'qa15',
    category: 'Format Coverage',
    label: '1vN layout — Host VS stacked avatars',
    checked: false,
  },
  {
    id: 'qa16',
    category: 'Format Coverage',
    label: 'NvN layout — Team cards with captain badges',
    checked: false,
  },
  {
    id: 'qa17',
    category: 'Format Coverage',
    label: 'Open Lobby layout — Grid + open slots',
    checked: false,
  },

  /* States Coverage */
  {
    id: 'qa18',
    category: 'States Coverage',
    label: 'StatusChip 12 states (open → offline)',
    checked: false,
  },
  {
    id: 'qa19',
    category: 'States Coverage',
    label: 'ChallengeDetail state-based CTAs',
    checked: false,
  },
  {
    id: 'qa20',
    category: 'States Coverage',
    label: 'ArenaLoadingSkeleton 4 variants',
    checked: false,
  },
  { id: 'qa21', category: 'States Coverage', label: '6 Empty states chuyên biệt', checked: false },
  {
    id: 'qa22',
    category: 'States Coverage',
    label: 'ArenaErrorState + ArenaOfflineBanner',
    checked: false,
  },
  {
    id: 'qa23',
    category: 'States Coverage',
    label: 'Content banners: Draft/UnderReview/Reported/Hidden',
    checked: false,
  },

  /* Moderation */
  {
    id: 'qa24',
    category: 'Moderation',
    label: 'ReportDialog 7 lý do — tích hợp ChallengeDetailPage',
    checked: false,
  },
  {
    id: 'qa25',
    category: 'Moderation',
    label: 'BlockUserDialog — tích hợp ChallengeDetailPage',
    checked: false,
  },
  {
    id: 'qa26',
    category: 'Moderation',
    label: 'CommunityRulesDialog 6 quy tắc — ArenaPageFooter',
    checked: false,
  },
  {
    id: 'qa27',
    category: 'Moderation',
    label: 'ArenaOfflineBanner — tất cả pages via ArenaPageFooter',
    checked: false,
  },
  {
    id: 'qa28',
    category: 'Moderation',
    label: '4 inline banners (AntiScam, PointsOnly, UnderReview, Reported)',
    checked: false,
  },

  /* Creator Ownership */
  {
    id: 'qa29',
    category: 'Creator Ownership',
    label: 'MyArenaPage 5-tab: rooms/joined/saved/drafts/history',
    checked: false,
  },
  {
    id: 'qa30',
    category: 'Creator Ownership',
    label: 'Creator profile → TrustBadge 5 tiers',
    checked: false,
  },
  {
    id: 'qa31',
    category: 'Creator Ownership',
    label: 'ModeDetail → "Tạo challenge từ mode" prefill',
    checked: false,
  },
  {
    id: 'qa32',
    category: 'Creator Ownership',
    label: 'Studio DraftState + ArenaDraftBanner',
    checked: false,
  },

  /* Verified Separation */
  {
    id: 'qa33',
    category: 'Verified Separation',
    label: 'VerifiedChallengesPage = placeholder only',
    checked: false,
  },
  {
    id: 'qa34',
    category: 'Verified Separation',
    label: 'Không mix flow verified với points-only',
    checked: false,
  },
  {
    id: 'qa35',
    category: 'Verified Separation',
    label: 'TrustBadge "verified" exists but gated',
    checked: false,
  },
];

/* ═══════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════ */

/** Single flow node — tappable to navigate to actual route */
function FlowNodeCard({ node, onPress }: { node: FlowNode; onPress?: () => void }) {
  const c = useThemeColors();
  const Icon = node.icon;
  const accent = node.accent || '#3B82F6';

  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className="flex items-center gap-3 w-full text-left active:opacity-70 rounded-xl"
      style={{ minHeight: 48, opacity: onPress ? 1 : 0.85 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: hexToRgba(accent, 0.07),
          border: `1px solid ${hexToRgba(accent, 0.13)}`,
        }}
      >
        <Icon size={18} color={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
          {node.label}
        </p>
        {node.sublabel && <p style={{ color: c.text3, fontSize: φ.xs }}>{node.sublabel}</p>}
      </div>
      {node.state && <StatusChip status={node.state} />}
      {onPress && <ChevronRight size={14} color={c.text3} />}
    </button>
  );
}

/** Arrow connector between nodes */
function FlowArrow({ label, dashed }: { label?: string; dashed?: boolean }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-2 pl-5 py-1">
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        <div
          style={{
            width: 2,
            height: 16,
            background: c.text3,
            opacity: 0.3,
            borderStyle: dashed ? 'dashed' : 'solid',
          }}
        />
        <ArrowDown size={10} color={c.text3} style={{ opacity: 0.5 }} />
      </div>
      {label && <span style={{ color: c.text3, fontSize: 9, fontStyle: 'italic' }}>{label}</span>}
    </div>
  );
}

/** Horizontal connector for non-sequential relationships */
function FlowConnectionRow({ conn }: { conn: FlowConnection }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-2 py-1 pl-3">
      <ArrowRight size={10} color={c.text3} style={{ opacity: 0.4 }} />
      <span style={{ color: c.text3, fontSize: 9 }}>
        {conn.from.replace(/_/g, ' ')} → {conn.to.replace(/_/g, ' ')}
      </span>
      {conn.label && (
        <span style={{ color: c.text3, fontSize: 8, opacity: 0.7 }}>({conn.label})</span>
      )}
    </div>
  );
}

/** Flow group section */
function FlowGroupSection({
  group,
  onNavigate,
}: {
  group: FlowGroup;
  onNavigate: (route: string) => void;
}) {
  const c = useThemeColors();
  const Icon = group.icon;

  // Build sequential chain: for creator/participant flows where connections are sequential
  const isSequential = group.id === 'creator_flow' || group.id === 'participant';

  // Map connections to find what flows from each node
  // (`Map` is the lucide icon here, so reference the global Map constructor explicitly)
  const connectionMap = new globalThis.Map<string, FlowConnection>();
  group.connections.forEach((conn) => {
    connectionMap.set(conn.from, conn);
  });

  return (
    <div className="mb-6">
      {/* Group header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: hexToRgba(group.color, 0.08),
            border: `1px solid ${hexToRgba(group.color, 0.15)}`,
          }}
        >
          <Icon size={16} color={group.color} />
        </div>
        <div>
          <p style={{ color: group.color, fontSize: φ.body, fontWeight: 700 }}>{group.title}</p>
          <p style={{ color: c.text3, fontSize: φ.xs }}>{group.subtitle}</p>
        </div>
      </div>

      <TrCard className="p-3" accentBorder={hexToRgba(group.color, 0.15)}>
        {isSequential ? (
          /* Sequential chain: node → arrow → node → arrow → ... */
          <div className="flex flex-col">
            {group.nodes.map((node, i) => {
              const conn = connectionMap.get(node.id);
              return (
                <div key={node.id}>
                  <FlowNodeCard
                    node={node}
                    onPress={node.route ? () => onNavigate(node.route!) : undefined}
                  />
                  {i < group.nodes.length - 1 && (
                    <FlowArrow label={conn?.label} dashed={conn?.dashed} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Hub-spoke: first node is hub, rest are destinations */
          <div className="flex flex-col gap-1">
            {/* Hub node */}
            <FlowNodeCard
              node={group.nodes[0]}
              onPress={group.nodes[0].route ? () => onNavigate(group.nodes[0].route!) : undefined}
            />
            {/* Divider */}
            <div className="my-2" style={{ borderTop: `1px solid ${c.divider}` }} />
            {/* Spoke nodes */}
            <div className="flex flex-col gap-1.5">
              {group.nodes.slice(1).map((node) => {
                return (
                  <div key={node.id} className="flex items-center gap-1">
                    <ArrowRight
                      size={10}
                      color={c.text3}
                      style={{ opacity: 0.35, marginLeft: 8 }}
                    />
                    <div className="flex-1">
                      <FlowNodeCard
                        node={node}
                        onPress={node.route ? () => onNavigate(node.route!) : undefined}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Cross-connections that don't start from hub */}
            {group.connections.filter(
              (c) =>
                c.from !== group.nodes[0].id &&
                !group.nodes.find((n) => n.id === c.from && group.nodes.indexOf(n) === 0),
            ).length > 0 && (
              <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${c.divider}` }}>
                <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>
                  Cross-links:
                </p>
                {group.connections
                  .filter((conn) => conn.from !== group.nodes[0].id)
                  .map((conn, i) => (
                    <FlowConnectionRow key={i} conn={conn} />
                  ))}
              </div>
            )}
          </div>
        )}
      </TrCard>
    </div>
  );
}

/** Handoff note card */
function HandoffCard({ note }: { note: HandoffNote }) {
  const c = useThemeColors();
  const Icon = note.icon;
  return (
    <TrCard className="p-4 flex items-start gap-3" accentBorder={hexToRgba(note.color, 0.13)}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(note.color, 0.07) }}
      >
        <Icon size={16} color={note.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
          {note.title}
        </p>
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>{note.detail}</p>
      </div>
    </TrCard>
  );
}

/** QA checklist item */
function QACheckItem({ item, onToggle }: { item: QAItem; onToggle: () => void }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <button
      onClick={() => {
        onToggle();
        hapticSelection();
      }}
      className="flex items-center gap-3 w-full text-left active:opacity-70 py-2"
      style={{ minHeight: 44 }}
    >
      <div className="shrink-0">
        {item.checked ? (
          <CheckCircle2 size={20} color="#10B981" fill="rgba(16,185,129,0.15)" />
        ) : (
          <Circle size={20} color={c.text3} />
        )}
      </div>
      <span
        style={{
          color: item.checked ? c.text3 : c.text1,
          fontSize: φ.sm,
          lineHeight: 1.4,
          textDecoration: item.checked ? 'line-through' : 'none',
          opacity: item.checked ? 0.6 : 1,
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   Page Stats Summary
   ═══════════════════════════════════════════ */

function PageStatsSummary() {
  const c = useThemeColors();

  const stats = [
    { label: 'Pages', value: '10', color: '#3B82F6' },
    { label: 'Routes', value: '10', color: '#8B5CF6' },
    { label: 'Components', value: '4 files', color: '#10B981' },
    { label: 'States', value: '12+', color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <TrCard key={s.label} className="p-3 text-center">
          <p style={{ color: s.color, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
            {s.value}
          </p>
          <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
        </TrCard>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Route Registry Table
   ═══════════════════════════════════════════ */

interface RouteEntry {
  path: string;
  page: string;
  status: 'live' | 'placeholder';
}

const ROUTE_REGISTRY: RouteEntry[] = [
  { path: '/arena', page: 'ArenaHomePage', status: 'live' },
  { path: '/arena/studio', page: 'ArenaStudioPage', status: 'live' },
  { path: '/arena/mode/:modeId', page: 'ArenaModeDetailPage', status: 'live' },
  { path: '/arena/challenge/:challengeId', page: 'ArenaChallengeDetailPage', status: 'live' },
  { path: '/arena/challenge/:id/join', page: 'ArenaJoinPage', status: 'live' },
  { path: '/arena/creator/:creatorId', page: 'ArenaCreatorPage', status: 'live' },
  { path: '/arena/leaderboard', page: 'ArenaLeaderboardPage', status: 'live' },
  { path: '/arena/verified', page: 'VerifiedChallengesPage', status: 'placeholder' },
  { path: '/arena/points', page: 'ArenaPointsPage', status: 'live' },
  { path: '/profile/arena', page: 'MyArenaPage', status: 'live' },
];

function RouteRegistryTable() {
  const c = useThemeColors();

  return (
    <TrCard overflow>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: `1px solid ${c.divider}`, background: c.surface2 }}
      >
        <span style={{ color: c.text3, fontSize: 9, fontWeight: 700, flex: 1 }}>ROUTE</span>
        <span
          style={{ color: c.text3, fontSize: 9, fontWeight: 700, width: 70, textAlign: 'right' }}
        >
          STATUS
        </span>
      </div>
      {/* Rows */}
      {ROUTE_REGISTRY.map((entry, i) => (
        <div
          key={entry.path}
          className="flex items-center gap-2 px-4 py-2.5"
          style={{
            borderBottom: i < ROUTE_REGISTRY.length - 1 ? `1px solid ${c.divider}` : 'none',
            minHeight: 44,
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              style={{
                color: c.text1,
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
              className="truncate"
            >
              {entry.path}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>{entry.page}</p>
          </div>
          <span
            className="px-2 py-0.5 rounded-md shrink-0"
            style={{
              background:
                entry.status === 'live' ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)',
              color: entry.status === 'live' ? '#10B981' : '#94A3B8',
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            {entry.status === 'live' ? 'Live' : 'Placeholder'}
          </span>
        </div>
      ))}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Component Registry
   ═══════════════════════════════════════════ */

interface ComponentEntry {
  file: string;
  exports: string[];
  description: string;
}

const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    file: 'ArenaChips.tsx',
    exports: ['FormatChip', 'ResolutionChip', 'StatusChip (12 states)', 'TrustBadge (5 tiers)'],
    description: 'Reusable chips & badges cho format, resolution, status, trust level',
  },
  {
    file: 'ArenaModeration.tsx',
    exports: [
      'ReportDialog (7 lý do)',
      'BlockUserDialog',
      'CommunityRulesDialog (6 quy tắc)',
      'AntiScamBanner',
      'PointsOnlyBanner',
      'UnderReviewBanner',
      'ReportedContentBanner',
    ],
    description: 'Moderation UI: report, block, rules, inline warning banners',
  },
  {
    file: 'ArenaStates.tsx',
    exports: [
      'ArenaLoadingSkeleton (4 variants)',
      '6 Empty states',
      'ArenaErrorState',
      'ArenaOfflineBanner',
      '4 content banners',
    ],
    description: 'Loading/empty/error/offline states + content status banners',
  },
  {
    file: 'ArenaPageFooter.tsx',
    exports: ['ArenaPageFooter'],
    description: 'Shared footer: CommunityRulesDialog + disclaimer + offline detection',
  },
];

function ComponentRegistrySection() {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-3">
      {COMPONENT_REGISTRY.map((comp) => (
        <TrCard key={comp.file} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.12)' }}
            >
              <Clipboard size={13} color="#8B5CF6" />
            </div>
            <span
              style={{
                color: '#8B5CF6',
                fontSize: φ.sm,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {comp.file}
            </span>
          </div>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 6 }}>
            {comp.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {comp.exports.map((exp) => (
              <span
                key={exp}
                className="px-2 py-0.5 rounded-md"
                style={{ background: c.surface2, color: c.text2, fontSize: 9, fontWeight: 600 }}
              >
                {exp}
              </span>
            ))}
          </div>
        </TrCard>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ArenaFlowMapPage — Main
   ═══════════════════════════════════════════ */

export function ArenaFlowMapPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const [qaItems, setQaItems] = useState<QAItem[]>(INITIAL_QA);
  const [expandedSection, setExpandedSection] = useState<string | null>('flow');

  const toggleQA = (id: string) => {
    setQaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const qaChecked = qaItems.filter((q) => q.checked).length;
  const qaTotal = qaItems.length;
  const qaPercent = Math.round((qaChecked / qaTotal) * 100);

  // Group QA by category
  const qaCategories = Array.from(new Set(qaItems.map((q) => q.category)));

  const handleNavigate = (route: string) => {
    hapticSelection();
    navigate(`${prefix}${route}`);
  };

  const toggleSection = (id: string) => {
    hapticSelection();
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  /* ─── Section toggle headers ─── */
  function SectionToggle({
    id,
    title,
    icon: SIcon,
    color,
    badge,
  }: {
    id: string;
    title: string;
    icon: typeof Map;
    color: string;
    badge?: string;
  }) {
    const isExpanded = expandedSection === id;
    return (
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center gap-3 w-full py-3 active:opacity-70"
        style={{ minHeight: 48 }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(color, 0.07) }}
        >
          <SIcon size={16} color={color} />
        </div>
        <div className="flex-1 text-left">
          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>{title}</p>
        </div>
        {badge && (
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ background: hexToRgba(color, 0.07), color, fontSize: 9, fontWeight: 600 }}
          >
            {badge}
          </span>
        )}
        <ChevronRight
          size={16}
          color={c.text3}
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
    );
  }

  return (
    <PageLayout>
      <Header title="Open Arena Flow Map" subtitle="06F — Prototype & QA" back />

      <PageContent gap="default">
        {/* ─── Hero Summary ─── */}
        <div>
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Map size={20} color="#C4B5FD" />
                <p style={{ color: '#C4B5FD', fontSize: φ.base, fontWeight: 700 }}>
                  Open Arena Module
                </p>
              </div>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: φ.sm,
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                Flow map hoàn chỉnh cho toàn bộ module Open Arena — 10 pages, 10 routes, 4 shared
                component files, 12+ challenge states.
              </p>
              <PageStatsSummary />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
         SECTION 1: Prototype Flow Map
         ═══════════════════════════════════════════ */}
        <div>
          <SectionToggle
            id="flow"
            title="SECTION 1 — Flow Map"
            icon={Map}
            color="#3B82F6"
            badge={`${FLOW_GROUPS.length} flows`}
          />
          {expandedSection === 'flow' && (
            <div className="mb-4">
              {/* Route Registry */}
              <div className="mb-4">
                <SectionHeader title="Route Registry" accent accentColor="#3B82F6" mb={8} />
                <RouteRegistryTable />
              </div>

              {/* Flow Groups */}
              {FLOW_GROUPS.map((group) => (
                <FlowGroupSection key={group.id} group={group} onNavigate={handleNavigate} />
              ))}

              {/* Component Registry */}
              <div className="mb-4">
                <SectionHeader title="Shared Components" accent accentColor="#8B5CF6" mb={8} />
                <ComponentRegistrySection />
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
         SECTION 2: Handoff Notes
         ═══════════════════════════════════════════ */}
        <div>
          <SectionToggle
            id="handoff"
            title="SECTION 2 — Handoff Notes"
            icon={BookOpen}
            color="#F59E0B"
            badge={`${HANDOFF_NOTES.length} notes`}
          />
          {expandedSection === 'handoff' && (
            <div className="flex flex-col gap-3 mb-4">
              {HANDOFF_NOTES.map((note, i) => (
                <HandoffCard key={i} note={note} />
              ))}

              {/* Separator card */}
              <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
                  <div>
                    <p
                      style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}
                    >
                      Lưu ý quan trọng
                    </p>
                    <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
                      Open Arena là môi trường points-only, không liên quan tài sản tài chính. Mọi
                      UI copy phải rõ ràng điều này. Không sử dụng từ ngữ gợi ý "đầu tư", "lợi
                      nhuận", hoặc "rút tiền" trong context Arena.
                    </p>
                  </div>
                </div>
              </TrCard>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
         SECTION 3: Final QA Checklist
         ═══════════════════════════════════════════ */}
        <div>
          <SectionToggle
            id="qa"
            title="SECTION 3 — QA Checklist"
            icon={CheckCircle2}
            color="#10B981"
            badge={`${qaChecked}/${qaTotal}`}
          />
          {expandedSection === 'qa' && (
            <div className="mb-4">
              {/* Progress bar */}
              <TrCard
                className="p-4 mb-4"
                accentBorder={qaPercent === 100 ? 'rgba(16,185,129,0.3)' : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
                    Tiến độ QA
                  </span>
                  <span
                    style={{
                      color: qaPercent === 100 ? '#10B981' : qaPercent > 60 ? '#F59E0B' : c.text3,
                      fontSize: φ.body,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {qaPercent}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full" style={{ background: c.surface2 }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${qaPercent}%`,
                      background:
                        qaPercent === 100 ? '#10B981' : qaPercent > 60 ? '#F59E0B' : '#3B82F6',
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>
                    {qaChecked} / {qaTotal} items đã check
                  </span>
                  {qaPercent === 100 && (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}
                    >
                      <CheckCircle2 size={12} /> Hoàn tất
                    </span>
                  )}
                </div>
              </TrCard>

              {/* QA Items grouped by category */}
              {qaCategories.map((category) => {
                const items = qaItems.filter((q) => q.category === category);
                const catChecked = items.filter((q) => q.checked).length;
                return (
                  <div key={category} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        style={{
                          color: c.text2,
                          fontSize: φ.xs,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}
                      >
                        {category.toUpperCase()}
                      </span>
                      <span
                        style={{
                          color: catChecked === items.length ? '#10B981' : c.text3,
                          fontSize: φ.xs,
                          fontWeight: 600,
                        }}
                      >
                        {catChecked}/{items.length}
                      </span>
                    </div>
                    <TrCard className="px-4 py-1">
                      {items.map((item, i) => (
                        <div
                          key={item.id}
                          style={{
                            borderBottom: i < items.length - 1 ? `1px solid ${c.divider}` : 'none',
                          }}
                        >
                          <QACheckItem item={item} onToggle={() => toggleQA(item.id)} />
                        </div>
                      ))}
                    </TrCard>
                  </div>
                );
              })}

              {/* Mark all button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    hapticSelection();
                    setQaItems((prev) => prev.map((q) => ({ ...q, checked: true })));
                  }}
                  className="flex-1 py-3 rounded-xl active:opacity-70"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    color: '#10B981',
                    fontSize: φ.sm,
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  Check tất cả
                </button>
                <button
                  onClick={() => {
                    hapticSelection();
                    setQaItems((prev) => prev.map((q) => ({ ...q, checked: false })));
                  }}
                  className="flex-1 py-3 rounded-xl active:opacity-70"
                  style={{
                    background: c.chipBg,
                    border: `1px solid ${c.chipBorder}`,
                    color: c.chipText,
                    fontSize: φ.sm,
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContent>

      {/* ─── Footer ─── */}
      <ArenaPageFooter />
    </PageLayout>
  );
}
