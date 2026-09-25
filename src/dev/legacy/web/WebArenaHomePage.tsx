import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Zap,
  Trophy,
  Users,
  Shield,
  ShieldCheck,
  Search,
  ChevronRight,
  Clock,
  TrendingUp,
  Crown,
  Flame,
  Target,
  Gamepad2,
  Plus,
  BarChart3,
  Info,
  AlertCircle,
  BookOpen,
  Sword,
  Brain,
  Sparkles,
  Globe,
  Hash,
  Heart,
  CircleDot,
  ArrowRight,
  Layers,
  Grid3X3,
  FileText,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/**
 * WebArenaHomePage — Open Arena discovery home
 *
 * Route: /w/arena
 *
 * Identity (§10.1, §10.2):
 *   - Creator-driven, points-only social module
 *   - Always disclose: "Arena Points only"
 *   - No financial language
 *
 * Required (§10.3):
 *   - Arena Home, featured modes, live rooms
 *   - Creator discovery, leaderboard preview
 *   - Safety center link
 *   - Category taxonomy
 *
 * Bridge (§11):
 *   - Connected by topic/context/discovery
 *   - NOT by wallet/value/PnL/settlement
 *   - Disclosure on all bridge cards
 *
 * Copy rules (§15.3):
 *   - Arena Points, pool điểm, chốt kết quả, sổ điểm, thử thách, phòng
 *   - MUST NOT: payout USD, profit, wallet value, balance value, stake return
 */

/* ═══ Types ═══ */
interface ArenaMode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  liveRooms: number;
  totalPlayed: number;
  featured?: boolean;
}

interface ArenaRoom {
  id: string;
  title: string;
  mode: string;
  modeColor: string;
  creator: string;
  creatorVerified: boolean;
  participants: number;
  maxParticipants: number;
  pointsPool: number;
  status: 'live' | 'starting' | 'closing';
  endsIn: string;
  category: string;
  trustTier: 'gold' | 'silver' | 'bronze';
  topic?: string;
}

interface ArenaCreator {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  trustScore: number;
  fairPlay: number;
  completionRate: number;
  totalRooms: number;
  followers: number;
  speciality: string;
}

interface LeaderboardEntry {
  rank: number;
  user: string;
  avatar: string;
  fairPlay: number;
  completionRate: number;
  totalPoints: number;
  badge: string;
}

/* ═══ Config ═══ */
const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: Grid3X3 },
  { id: 'crypto', label: 'Crypto', icon: Hash },
  { id: 'sports', label: 'Thể thao', icon: Trophy },
  { id: 'tech', label: 'Công nghệ', icon: Brain },
  { id: 'politics', label: 'Chính trị', icon: Globe },
  { id: 'culture', label: 'Văn hóa', icon: Sparkles },
  { id: 'community', label: 'Cộng đồng', icon: Heart },
];

const TRUST_TIERS: Record<string, { label: string; color: string; bg: string }> = {
  gold: { label: 'Vàng', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  silver: { label: 'Bạc', color: '#94A3B8', bg: 'rgba(148,163,184,0.06)' },
  bronze: { label: 'Đồng', color: '#CD7F32', bg: 'rgba(205,127,50,0.06)' },
};

const ROOM_STATUS: Record<string, { label: string; color: string }> = {
  live: { label: 'Đang diễn ra', color: '#10B981' },
  starting: { label: 'Sắp bắt đầu', color: '#3B82F6' },
  closing: { label: 'Sắp kết thúc', color: '#F59E0B' },
};

/* ═══ Mock data ═══ */
const ARENA_MODES: ArenaMode[] = [
  {
    id: 'prediction',
    name: 'Dự đoán',
    description: 'Dự đoán kết quả sự kiện — Creator đặt câu hỏi, cộng đồng trả lời',
    icon: Target,
    color: '#3B82F6',
    liveRooms: 24,
    totalPlayed: 15240,
    featured: true,
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Trắc nghiệm kiến thức — Trả lời nhanh, chính xác, ghi điểm',
    icon: Brain,
    color: '#8B5CF6',
    liveRooms: 18,
    totalPlayed: 28900,
    featured: true,
  },
  {
    id: 'debate',
    name: 'Tranh luận',
    description: 'Hai phe đối lập — Cộng đồng vote, luật chơi rõ ràng',
    icon: Sword,
    color: '#EF4444',
    liveRooms: 8,
    totalPlayed: 6200,
  },
  {
    id: 'challenge',
    name: 'Thử thách',
    description: 'Hoàn thành nhiệm vụ — Proof-of-completion, creator xác nhận',
    icon: Flame,
    color: '#F59E0B',
    liveRooms: 12,
    totalPlayed: 9800,
    featured: true,
  },
  {
    id: 'poll',
    name: 'Bình chọn',
    description: 'Khảo sát cộng đồng — Không có đúng sai, phân phối điểm theo consensus',
    icon: BarChart3,
    color: '#10B981',
    liveRooms: 31,
    totalPlayed: 42100,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tạo mode mới — Cần governance gate và Rule Clarity Score cao',
    icon: Sparkles,
    color: '#EC4899',
    liveRooms: 5,
    totalPlayed: 1200,
  },
];

const LIVE_ROOMS: ArenaRoom[] = [
  {
    id: 'r1',
    title: 'BTC $100K trước cuối năm?',
    mode: 'Dự đoán',
    modeColor: '#3B82F6',
    creator: 'CryptoMaster_VN',
    creatorVerified: true,
    participants: 142,
    maxParticipants: 200,
    pointsPool: 28400,
    status: 'live',
    endsIn: '2 giờ',
    category: 'crypto',
    trustTier: 'gold',
    topic: 'Bitcoin',
  },
  {
    id: 'r2',
    title: 'World Cup 2026 — Ai vô địch?',
    mode: 'Bình chọn',
    modeColor: '#10B981',
    creator: 'Sports_Guru',
    creatorVerified: true,
    participants: 89,
    maxParticipants: 500,
    pointsPool: 15600,
    status: 'live',
    endsIn: '4 giờ',
    category: 'sports',
    trustTier: 'gold',
  },
  {
    id: 'r3',
    title: 'Quiz: Lịch sử Bitcoin',
    mode: 'Quiz',
    modeColor: '#8B5CF6',
    creator: 'CryptoQuiz',
    creatorVerified: false,
    participants: 45,
    maxParticipants: 100,
    pointsPool: 9000,
    status: 'starting',
    endsIn: '30 phút',
    category: 'crypto',
    trustTier: 'silver',
  },
  {
    id: 'r4',
    title: 'AI có thay thế developer trong 5 năm?',
    mode: 'Tranh luận',
    modeColor: '#EF4444',
    creator: 'TechDebater',
    creatorVerified: true,
    participants: 67,
    maxParticipants: 150,
    pointsPool: 13400,
    status: 'live',
    endsIn: '1 giờ',
    category: 'tech',
    trustTier: 'gold',
    topic: 'AI',
  },
  {
    id: 'r5',
    title: 'Thử thách: Predict SOL ATH trong tuần',
    mode: 'Thử thách',
    modeColor: '#F59E0B',
    creator: 'SOL_Fan',
    creatorVerified: false,
    participants: 28,
    maxParticipants: 50,
    pointsPool: 5600,
    status: 'closing',
    endsIn: '15 phút',
    category: 'crypto',
    trustTier: 'bronze',
  },
  {
    id: 'r6',
    title: 'Bầu cử giữa kỳ Mỹ 2026',
    mode: 'Dự đoán',
    modeColor: '#3B82F6',
    creator: 'PoliticsWatcher',
    creatorVerified: true,
    participants: 234,
    maxParticipants: 500,
    pointsPool: 46800,
    status: 'live',
    endsIn: '8 ngày',
    category: 'politics',
    trustTier: 'gold',
  },
];

const TOP_CREATORS: ArenaCreator[] = [
  {
    id: 'u1',
    name: 'CryptoMaster_VN',
    avatar: 'CM',
    verified: true,
    trustScore: 96,
    fairPlay: 98,
    completionRate: 99,
    totalRooms: 342,
    followers: 12400,
    speciality: 'Crypto',
  },
  {
    id: 'u2',
    name: 'Sports_Guru',
    avatar: 'SG',
    verified: true,
    trustScore: 94,
    fairPlay: 97,
    completionRate: 98,
    totalRooms: 218,
    followers: 8900,
    speciality: 'Thể thao',
  },
  {
    id: 'u3',
    name: 'TechDebater',
    avatar: 'TD',
    verified: true,
    trustScore: 91,
    fairPlay: 95,
    completionRate: 97,
    totalRooms: 156,
    followers: 5600,
    speciality: 'Công nghệ',
  },
  {
    id: 'u4',
    name: 'PoliticsWatcher',
    avatar: 'PW',
    verified: true,
    trustScore: 89,
    fairPlay: 94,
    completionRate: 96,
    totalRooms: 89,
    followers: 3200,
    speciality: 'Chính trị',
  },
];

const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    user: 'crypto_sage',
    avatar: 'CS',
    fairPlay: 99,
    completionRate: 100,
    totalPoints: 284600,
    badge: '🥇',
  },
  {
    rank: 2,
    user: 'quiz_master',
    avatar: 'QM',
    fairPlay: 98,
    completionRate: 99,
    totalPoints: 248200,
    badge: '🥈',
  },
  {
    rank: 3,
    user: 'debate_king',
    avatar: 'DK',
    fairPlay: 97,
    completionRate: 98,
    totalPoints: 215800,
    badge: '🥉',
  },
  {
    rank: 4,
    user: 'challenge_pro',
    avatar: 'CP',
    fairPlay: 96,
    completionRate: 97,
    totalPoints: 198400,
    badge: '',
  },
  {
    rank: 5,
    user: 'predict_god',
    avatar: 'PG',
    fairPlay: 95,
    completionRate: 96,
    totalPoints: 176200,
    badge: '',
  },
];

const ARENA_STATS = {
  liveRooms: 98,
  activePlayers: 3420,
  totalPointsPool: 486200,
  modesAvailable: 6,
};

/* ═══ Component ═══ */
export function WebArenaHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredRooms =
    selectedCategory === 'all'
      ? LIVE_ROOMS
      : LIVE_ROOMS.filter((r) => r.category === selectedCategory);

  const featuredModes = ARENA_MODES.filter((m) => m.featured);

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}
          >
            <Zap size={18} color="#8B5CF6" />
          </div>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Open Arena</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Thử thách xã hội — Arena Points only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              color: c.text2,
              fontSize: WEB_FONT.xs,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Search size={13} /> Tìm kiếm
          </button>
          <button
            onClick={() => navigate('/w/arena/my-arena')}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              color: c.text2,
              fontSize: WEB_FONT.xs,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Users size={13} /> My Arena
          </button>
          <button
            onClick={() => navigate('/w/arena/studio')}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: '#8B5CF6',
              border: 'none',
              color: '#fff',
              fontSize: WEB_FONT.xs,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Tạo phòng
          </button>
        </div>
      </div>

      {/* ─── Disclosure banner ─── */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: '10px 24px',
          background: 'rgba(139,92,246,0.02)',
          borderBottom: `1px solid rgba(139,92,246,0.06)`,
        }}
      >
        <Info size={13} color="#8B5CF6" className="shrink-0" />
        <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
          <strong style={{ color: '#8B5CF6' }}>Arena Points only</strong> — Mọi hoạt động trong Open
          Arena sử dụng Arena Points, không liên quan đến wallet hay tài sản tài chính.{' '}
          <button
            style={{
              color: '#8B5CF6',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Tìm hiểu thêm
          </button>
        </p>
      </div>

      {/* ─── Search bar ─── */}
      {showSearch && (
        <div
          style={{
            padding: '12px 24px',
            borderBottom: `1px solid ${c.borderSolid}`,
            background: c.surface,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color={c.text3}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phòng, mode, creator..."
              autoFocus
              className="outline-none"
              style={{
                width: '100%',
                height: WEB_BUTTON.md,
                borderRadius: 10,
                border: `1px solid ${c.borderSolid}`,
                background: c.bg,
                padding: '0 14px 0 36px',
                color: c.text1,
                fontSize: WEB_FONT.sm,
              }}
            />
          </div>
        </div>
      )}

      {/* ─── Main content ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* ═══ Stats bar ═══ */}
          <div className="flex" style={{ gap: 12 }}>
            {[
              {
                label: 'Phòng đang mở',
                value: ARENA_STATS.liveRooms,
                icon: Gamepad2,
                color: '#10B981',
              },
              {
                label: 'Người chơi',
                value: ARENA_STATS.activePlayers.toLocaleString(),
                icon: Users,
                color: '#3B82F6',
              },
              {
                label: 'Pool điểm',
                value: ARENA_STATS.totalPointsPool.toLocaleString() + ' AP',
                icon: Zap,
                color: '#8B5CF6',
              },
              {
                label: 'Modes',
                value: String(ARENA_STATS.modesAvailable),
                icon: Layers,
                color: '#F59E0B',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex-1 flex items-center gap-3"
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: c.surface,
                  border: `1px solid ${c.borderSolid}`,
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}08` }}
                >
                  <s.icon size={18} color={s.color} />
                </div>
                <div>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.xl,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ Featured modes ═══ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                Mode nổi bật
              </h2>
              <button
                className="flex items-center gap-1"
                style={{
                  color: '#8B5CF6',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Tất cả modes <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex" style={{ gap: 12 }}>
              {featuredModes.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className="flex-1 cursor-pointer transition-all"
                    style={{ ...card(), padding: WEB_SPACING.cardDefault }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `${mode.color}08`,
                          border: `1px solid ${mode.color}15`,
                        }}
                      >
                        <ModeIcon size={20} color={mode.color} />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                          {mode.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="flex items-center gap-1"
                            style={{ color: '#10B981', fontSize: WEB_FONT.xs }}
                          >
                            <CircleDot size={8} /> {mode.liveRooms} phòng
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        color: c.text2,
                        fontSize: WEB_FONT.sm,
                        lineHeight: 1.5,
                        marginBottom: 8,
                      }}
                    >
                      {mode.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                        {mode.totalPlayed.toLocaleString()} lượt chơi
                      </span>
                      <button
                        className="flex items-center gap-1"
                        style={{
                          color: mode.color,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Khám phá <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Category filter ═══ */}
          <div className="flex items-center" style={{ gap: 6 }}>
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(139,92,246,0.06)' : 'transparent',
                    border: `1.5px solid ${isActive ? 'rgba(139,92,246,0.25)' : c.borderSolid}`,
                    color: isActive ? '#8B5CF6' : c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                  }}
                >
                  <CatIcon size={12} /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* ═══ Live rooms grid ═══ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                Phòng đang mở
                <span
                  style={{ color: c.text3, fontSize: WEB_FONT.sm, fontWeight: 400, marginLeft: 8 }}
                >
                  ({filteredRooms.length})
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              {filteredRooms.map((room) => {
                const statusCfg = ROOM_STATUS[room.status];
                const trustCfg = TRUST_TIERS[room.trustTier];
                const fillPct = (room.participants / room.maxParticipants) * 100;
                return (
                  <div
                    key={room.id}
                    className="cursor-pointer transition-all"
                    style={{ ...card(), padding: WEB_SPACING.cardDefault }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{
                            padding: '1px 8px',
                            borderRadius: 6,
                            background: `${room.modeColor}08`,
                            border: `1px solid ${room.modeColor}15`,
                            color: room.modeColor,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {room.mode}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: trustCfg.bg,
                            color: trustCfg.color,
                            fontSize: 9,
                            fontWeight: 600,
                          }}
                        >
                          {trustCfg.label}
                        </span>
                        {room.topic && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: 6,
                              background: 'rgba(59,130,246,0.04)',
                              color: '#3B82F6',
                              fontSize: 9,
                              fontWeight: 600,
                            }}
                          >
                            #{room.topic}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CircleDot size={8} color={statusCfg.color} />
                        <span style={{ color: statusCfg.color, fontSize: 10, fontWeight: 600 }}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        fontWeight: 600,
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}
                    >
                      {room.title}
                    </h3>

                    {/* Creator */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.1)',
                        }}
                      >
                        <span style={{ fontSize: 9, color: '#8B5CF6', fontWeight: 700 }}>
                          {room.creator[0]}
                        </span>
                      </div>
                      <span style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 500 }}>
                        {room.creator}
                      </span>
                      {room.creatorVerified && <ShieldCheck size={11} color="#10B981" />}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center gap-1"
                          style={{ color: c.text3, fontSize: WEB_FONT.xs }}
                        >
                          <Users size={11} /> {room.participants}/{room.maxParticipants}
                        </span>
                        <span
                          className="flex items-center gap-1"
                          style={{ color: '#8B5CF6', fontSize: WEB_FONT.xs, fontWeight: 600 }}
                        >
                          <Zap size={11} /> {room.pointsPool.toLocaleString()} AP
                        </span>
                      </div>
                      <span
                        className="flex items-center gap-1"
                        style={{ color: c.text3, fontSize: WEB_FONT.xs }}
                      >
                        <Clock size={10} /> {room.endsIn}
                      </span>
                    </div>

                    {/* Fill bar */}
                    <div style={{ height: 4, borderRadius: 2, background: c.borderSolid }}>
                      <div
                        style={{
                          width: `${fillPct}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: fillPct > 80 ? '#F59E0B' : '#10B981',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Two columns: Creators + Leaderboard ═══ */}
          <div className="flex" style={{ gap: 16 }}>
            {/* Top Creators */}
            <div className="flex-1" style={card()}>
              <div style={{ padding: WEB_SPACING.cardDefault }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown size={16} color="#F59E0B" />
                    <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      Creator nổi bật
                    </h3>
                  </div>
                  <button
                    className="flex items-center gap-1"
                    style={{
                      color: '#8B5CF6',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Xem tất cả <ChevronRight size={11} />
                  </button>
                </div>

                <div className="flex flex-col" style={{ gap: 10 }}>
                  {TOP_CREATORS.map((cr) => (
                    <div
                      key={cr.id}
                      className="flex items-center cursor-pointer"
                      style={{ gap: 12, padding: '10px 12px', borderRadius: 10, background: c.bg }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.1)',
                        }}
                      >
                        <span style={{ color: '#8B5CF6', fontSize: WEB_FONT.sm, fontWeight: 700 }}>
                          {cr.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                            {cr.name}
                          </p>
                          {cr.verified && <ShieldCheck size={12} color="#10B981" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                            {cr.speciality}
                          </span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                            {cr.totalRooms} phòng
                          </span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                            {cr.followers.toLocaleString()} theo dõi
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#10B981', fontSize: WEB_FONT.sm, fontWeight: 700 }}>
                          {cr.trustScore}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>Trust</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="flex-1" style={card()}>
              <div style={{ padding: WEB_SPACING.cardDefault }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} color="#8B5CF6" />
                    <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      Bảng xếp hạng
                    </h3>
                  </div>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    Fair Play + Completion
                  </span>
                </div>

                <div className="flex flex-col" style={{ gap: 0 }}>
                  <div className="flex items-center" style={{ padding: '4px 0', marginBottom: 4 }}>
                    <span style={{ width: 32, color: c.text3, fontSize: 10, fontWeight: 600 }}>
                      #
                    </span>
                    <span style={{ flex: 1, color: c.text3, fontSize: 10, fontWeight: 600 }}>
                      Người chơi
                    </span>
                    <span
                      style={{
                        width: 50,
                        color: c.text3,
                        fontSize: 10,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      Fair
                    </span>
                    <span
                      style={{
                        width: 50,
                        color: c.text3,
                        fontSize: 10,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      Hoàn
                    </span>
                    <span
                      style={{
                        width: 80,
                        color: c.text3,
                        fontSize: 10,
                        fontWeight: 600,
                        textAlign: 'right',
                      }}
                    >
                      Điểm
                    </span>
                  </div>
                  {LEADERBOARD.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center"
                      style={{ padding: '8px 0', borderTop: `1px solid ${c.borderSolid}` }}
                    >
                      <span
                        style={{
                          width: 32,
                          fontSize: WEB_FONT.sm,
                          fontWeight: 700,
                          color: entry.rank <= 3 ? '#F59E0B' : c.text3,
                        }}
                      >
                        {entry.badge || `#${entry.rank}`}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(139,92,246,0.06)',
                          }}
                        >
                          <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 700 }}>
                            {entry.avatar}
                          </span>
                        </div>
                        <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                          {entry.user}
                        </span>
                      </div>
                      <span
                        style={{
                          width: 50,
                          color: '#10B981',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {entry.fairPlay}%
                      </span>
                      <span
                        style={{
                          width: 50,
                          color: '#3B82F6',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {entry.completionRate}%
                      </span>
                      <span
                        style={{
                          width: 80,
                          color: '#8B5CF6',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 700,
                          textAlign: 'right',
                        }}
                      >
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    color: c.text3,
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 10,
                    lineHeight: 1.4,
                  }}
                >
                  Xếp hạng dựa trên Fair Play, Completion Rate, Community Trust — Không dùng metric
                  tài chính.
                </p>
              </div>
            </div>
          </div>

          {/* ═══ All modes grid ═══ */}
          <div>
            <h2
              style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 12 }}
            >
              Tất cả Mode
            </h2>
            <div className="grid grid-cols-3" style={{ gap: 10 }}>
              {ARENA_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: c.surface,
                      border: `1px solid ${c.borderSolid}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${mode.color}08`,
                      }}
                    >
                      <ModeIcon size={16} color={mode.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                        {mode.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#10B981', fontSize: WEB_FONT.xs }}>
                          {mode.liveRooms} live
                        </span>
                        <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                          {mode.totalPlayed.toLocaleString()} tổng
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} color={c.text3} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Prediction bridge card ═══ */}
          <div style={{ ...card(), borderColor: 'rgba(59,130,246,0.15)' }}>
            <div style={{ padding: WEB_SPACING.cardDefault }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                  PREDICTION MARKETS
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    padding: '1px 8px',
                    borderRadius: 6,
                    background: 'rgba(59,130,246,0.06)',
                    color: '#3B82F6',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  Bối cảnh thị trường
                </span>
              </div>
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 4 }}
              >
                Xem thị trường dự đoán liên quan đến các chủ đề Arena
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                Prediction Markets là module market-based riêng biệt. Arena rooms không ảnh hưởng vị
                thế Prediction, và ngược lại.
              </p>
              <button
                onClick={() => navigate('/w/predictions')}
                className="flex items-center gap-1 mt-2"
                style={{
                  color: '#3B82F6',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Xem Prediction Markets <ChevronRight size={11} />
              </button>
            </div>
          </div>

          {/* ═══ Safety center + footer ═══ */}
          <div className="flex" style={{ gap: 12 }}>
            <div className="flex-1" style={{ ...card(), padding: '16px 20px' }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(16,185,129,0.06)',
                  }}
                >
                  <Shield size={18} color="#10B981" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    Safety Center
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    Quy tắc cộng đồng, báo cáo, anti-scam
                  </p>
                </div>
                <ChevronRight size={14} color={c.text3} />
              </div>
            </div>
            <div className="flex-1" style={{ ...card(), padding: '16px 20px' }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(59,130,246,0.06)',
                  }}
                >
                  <BookOpen size={18} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    Resolution Center
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    Chốt kết quả, giải quyết tranh chấp
                  </p>
                </div>
                <ChevronRight size={14} color={c.text3} />
              </div>
            </div>
            <div className="flex-1" style={{ ...card(), padding: '16px 20px' }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(139,92,246,0.06)',
                  }}
                >
                  <FileText size={18} color="#8B5CF6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>Sổ điểm</p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    Lịch sử Arena Points, truy vết chi tiết
                  </p>
                </div>
                <ChevronRight size={14} color={c.text3} />
              </div>
            </div>
          </div>

          {/* ═══ Disclosure footer ═══ */}
          <div
            className="flex items-start gap-3"
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(139,92,246,0.02)',
              border: '1px solid rgba(139,92,246,0.08)',
            }}
          >
            <AlertCircle size={14} color="#8B5CF6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Open Arena là module xã hội dùng <strong>Arena Points only</strong>. Arena Points
              không phải tài sản tài chính, không có giá trị tiền tệ, không liên quan đến wallet
              hoặc số dư giao dịch. Mọi cộng/trừ điểm đều có lý do, thử thách liên kết, và truy vết
              trong sổ điểm.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
