import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, X, ChevronRight, Shield, Sparkles, Users,
  Trophy, Star, Lock, Zap, Play, Clock, Gift, Map,
  Target, Info, BookOpen,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { CTAButton } from '../../components/ui/CTAButton';
import { SkeletonCard } from '../../components/states/SkeletonBlock';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import { NotificationBadge } from '../../components/arena/ArenaEnhancements';
import { ArenaOfflineBanner, ArenaNotificationPrefs } from '../../components/arena/ArenaNiceToHave';
import { φ, φRadius, φIcon } from '../../utils/golden';
import { hexToRgba } from '../../utils/hexToRgba';
import {
  ARENA_TEMPLATES,
  ARENA_MODES,
  ARENA_ROOMS,
  ARENA_CREATORS,
  MY_ARENA_STATS,
  fmtPoints,
  roomStatusLabel,
  privacyLabel,
} from '../../data/arenaData';

/* ─── Hero Card ─── */
function HeroCard() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  return (
    <div
      className="relative overflow-hidden"
      style={{
        padding: '22px 20px 20px',
        borderRadius: φRadius.lg,
        background: c.portfolioBg,
        border: `1px solid ${c.portfolioBorder}`,
        boxShadow: c.portfolioShadow,
      }}
    >
      {/* Decorative glows — matching portfolio card */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      {/* Header label */}
      <div className="relative z-10 mb-2">
        <span style={{ color: c.portfolioTextDim, fontSize: φ.sm }}>Open Arena</span>
      </div>

      {/* Title */}
      <p
        className="relative z-10"
        style={{
          color: '#FFFFFF',
          fontSize: 34,
          fontWeight: 700,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
          letterSpacing: -1,
          lineHeight: 1.1,
        }}
      >
        Tạo sân chơi
      </p>

      {/* Subtitle */}
      <div className="flex items-center gap-2.5 mt-2 mb-5 relative z-10">
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <Sparkles size={12} color="#C4B5FD" strokeWidth={2.5} />
          <span style={{ color: '#C4B5FD', fontSize: 12, fontWeight: 600 }}>
            Tự đặt luật · Mời bạn bè
          </span>
        </div>
        <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>room riêng</span>
      </div>

      {/* Action buttons — matching portfolio 3-col style */}
      <div className="flex gap-2.5 relative z-10">
        <button
          onClick={() => navigate(`${prefix}/arena/studio`)}
          className="flex-1 flex items-center justify-center gap-1.5 ripple"
          style={{
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
            color: '#fff',
            fontSize: φ.sm,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <Sparkles size={15} strokeWidth={2.2} />
          Tạo challenge
        </button>
        <button
          onClick={() => {
            const el = document.getElementById('arena-templates');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 flex items-center justify-center gap-1.5 ripple"
          style={{
            height: 44,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            fontSize: φ.sm,
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Search size={15} strokeWidth={2.2} />
          Khám phá mode
        </button>
      </div>
    </div>
  );
}

/* ─── Template Cards ─── */
function TemplateSection() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div id="arena-templates">
      <SectionHeader title="Templates" subtitle="Chọn template để bắt đầu tạo challenge" accent accentColor="#8B5CF6" />

      <div className="grid grid-cols-2 gap-3">
        {ARENA_TEMPLATES.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <TrCard
              hover
              as="button"
              onClick={() => { hapticSelection(); navigate(`${prefix}/arena/studio`); }}
              className="p-4 text-left w-full"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: hexToRgba(t.color, 0.09), border: `1px solid ${hexToRgba(t.color, 0.19)}` }}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                </div>
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>{t.title}</p>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
                {t.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.formatTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md"
                    style={{ background: hexToRgba(t.color, 0.07), color: t.color, fontSize: 10, fontWeight: 600 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </TrCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Featured Modes ─── */
function FeaturedModes() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div>
      <SectionHeader
        title="Mode nổi bật"
        subtitle="Được cộng đồng yêu thích"
        accent
        accentColor="#3B82F6"
        right={
          <button
            onClick={() => { navigate(`${prefix}/arena/leaderboard`); hapticSelection(); }}
            className="flex items-center gap-1 active:opacity-70"
            style={{ minHeight: 44 }}
          >
            <span style={{ color: '#3B82F6', fontSize: φ.sm }}>Xem tất cả</span>
            <ChevronRight size={φIcon.sm} color="#3B82F6" />
          </button>
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
        {ARENA_MODES.map(mode => {
          const tpl = ARENA_TEMPLATES.find(t => t.id === mode.templateId);
          return (
            <TrCard
              key={mode.id}
              hover
              as="button"
              onClick={() => navigate(`${prefix}/arena/mode/${mode.id}`)}
              className="shrink-0 p-4 text-left"
              style={{ width: 220 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 16 }}>{tpl?.icon}</span>
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.3 }}>
                  {mode.title}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ fontSize: 12 }}>{mode.creator.avatar}</span>
                <span style={{ color: c.text2, fontSize: φ.xs }}>{mode.creator.name}</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span style={{ color: c.text3, fontSize: 10 }}>
                  <Users size={10} className="inline mr-0.5" style={{ verticalAlign: 'middle' }} />
                  {mode.cloneCount} clone
                </span>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  ✅ {mode.completionRate}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {mode.fairPlay && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(16,185,129,0.12)', fontSize: 10, color: '#10B981', fontWeight: 600 }}
                  >
                    <Shield size={9} /> Fair Play
                  </span>
                )}
                {mode.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded-md"
                    style={{ background: c.chipBg, color: c.chipText, fontSize: 10 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </TrCard>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Live Rooms / Open Lobbies ─── */
function LiveRooms() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  return (
    <div>
      <SectionHeader
        title="Phòng đang mở"
        subtitle="Tham gia ngay hoặc xem"
        accent
        accentColor="#F59E0B"
        right={
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>{ARENA_ROOMS.filter(r => r.status !== 'completed').length} live</span>
          </div>
        }
      />

      <TrCard overflow>
        {ARENA_ROOMS.map((room, i) => {
          const st = roomStatusLabel(room.status);
          const pr = privacyLabel(room.privacy);
          const fillPct = Math.round((room.slotsFilled / room.slotsTotal) * 100);

          return (
            <button
              key={room.id}
              onClick={() => navigate(`${prefix}/arena/challenge/${room.id}`)}
              className="flex flex-col gap-2 px-4 py-3.5 w-full text-left"
              style={{ borderBottom: i < ARENA_ROOMS.length - 1 ? `1px solid ${c.divider}` : 'none' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">
                    {room.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>{room.format}</span>
                    <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 10 }}>{pr.icon}</span>
                    <span style={{ color: c.text3, fontSize: φ.xs }}>{pr.label}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ background: hexToRgba(st.color, 0.08), color: st.color, fontSize: 10, fontWeight: 600 }}
                  >
                    {st.label}
                  </span>
                  <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                    {fmtPoints(room.entryPoints)} pts
                  </span>
                </div>
              </div>

              {/* Slot progress */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: c.surface2 }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fillPct}%`,
                      background: fillPct >= 90 ? '#EF4444' : fillPct >= 60 ? '#F59E0B' : '#3B82F6',
                    }}
                  />
                </div>
                <span style={{ color: c.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
                  {room.slotsFilled}/{room.slotsTotal}
                </span>
              </div>
            </button>
          );
        })}
      </TrCard>
    </div>
  );
}

/* ─── Creator Spotlight ─── */
function CreatorSpotlight() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  return (
    <div>
      <SectionHeader title="Creator nổi bật" accent accentColor="#10B981" />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
        {ARENA_CREATORS.slice(0, 5).map(cr => (
          <TrCard
            key={cr.id}
            hover
            as="button"
            onClick={() => navigate(`${prefix}/arena/creator/${cr.id}`)}
            className="shrink-0 p-4 flex flex-col items-center text-center"
            style={{ width: 140 }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: c.surface2, fontSize: 28 }}
            >
              {cr.avatar}
            </div>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
              {cr.name}
            </p>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>
              {cr.modesCreated} modes · {cr.totalChallenges} challenges
            </p>
            <div className="flex items-center gap-1">
              {cr.fairPlayBadge && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(16,185,129,0.12)', fontSize: 9, color: '#10B981', fontWeight: 600 }}
                >
                  <Shield size={8} /> Fair Play
                </span>
              )}
              <span
                className="px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(59,130,246,0.12)', fontSize: 9, color: '#3B82F6', fontWeight: 600 }}
              >
                {cr.trustScore}% Trust
              </span>
            </div>
          </TrCard>
        ))}
      </div>
    </div>
  );
}

/* ─── 09B: Prediction Bridge — "Bi cảnh thị trường" ─── */
function PredictionBridge() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  return (
    <div>
      <TrCard hover as="button"
        onClick={() => navigate(`${prefix}/markets/predictions`)}
        className="w-full p-4 text-left"
        accentBorder="rgba(139,92,246,0.18)">
        <div className="flex items-center gap-1.5 mb-3">
          <Info size={10} color="#8B5CF6" />
          <span style={{
            color: '#8B5CF6', fontSize: 9, fontWeight: 700,
            letterSpacing: 0.5, textTransform: 'uppercase' as const,
          }}>
            Market context only
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))' }}>
            <Target size={18} color="#8B5CF6" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Bối cảnh thị trường
              </p>
              <span className="px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
                Prediction Market
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 4 }}>
              Theo dõi các prediction events liên quan
            </p>
            <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>
              Xem Prediction Markets
            </span>
          </div>
          <ChevronRight size={14} color="#8B5CF6" />
        </div>
      </TrCard>
    </div>
  );
}

/* ─── Verified Challenges Teaser (Locked) ─── */
function VerifiedTeaser() {
  const c = useThemeColors();

  return (
    <div>
      <TrCard className="p-5 relative overflow-hidden" style={{ opacity: 0.65 }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Lock size={22} color="#8B5CF6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>Verified Challenges</p>
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 10, fontWeight: 700 }}
              >
                Future
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
              Sẽ mở trong tương lai cho challenge xác thực cao hơn
            </p>
          </div>
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ArenaHomePage — Main Export
   ═══════════════════════════════════════════ */
export function ArenaHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [search, setSearch] = useState('');
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const { hapticSelection } = useHaptic();
  const [isOffline, setIsOffline] = useState(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);

  /* ─── Critical #4: Search filtering logic ─── */
  const q = search.trim().toLowerCase();
  const hasSearch = q.length >= 2;
  const filteredModes = hasSearch ? ARENA_MODES.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.creator.name.toLowerCase().includes(q) ||
    m.tags.some(t => t.toLowerCase().includes(q))
  ) : [];
  const filteredRooms = hasSearch ? ARENA_ROOMS.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.format.toLowerCase().includes(q) ||
    r.creator.name.toLowerCase().includes(q)
  ) : [];
  const filteredCreators = hasSearch ? ARENA_CREATORS.filter(cr =>
    cr.name.toLowerCase().includes(q) ||
    (cr.bio || '').toLowerCase().includes(q)
  ) : [];
  const totalResults = filteredModes.length + filteredRooms.length + filteredCreators.length;

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header variant="page" title="Open Arena" subtitle="Sân chơi cộng đồng" back />

      {/* Nice-to-have #12: Offline Banner */}
      <ArenaOfflineBanner isOffline={isOffline} onRetry={refresh} />

      <PageContent padding="compact" gap="default">
      {/* Navigation block: sub-header + search + chips grouped together */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        {/* Sub-header */}
        <div className="flex items-center gap-2">
          <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.4 }}>
            Tạo mode chơi, mở phòng và thách đấu bằng Arena Points
          </p>
          <span
            className="shrink-0 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 10, fontWeight: 700, border: '1px solid rgba(245,158,11,0.2)' }}
          >
            Points only
          </span>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            height: 44,
            borderRadius: 16,
          }}
        >
          <Search size={18} color={c.searchPlaceholder} />
          <input
            type="text"
            placeholder="Tìm mode, creator hoặc challenge..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: φ.sm, flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={φIcon.sm} color={c.text3} /></button>
          )}
        </div>

        {/* Quick nav chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {[
            { label: 'Hướng dẫn', icon: BookOpen, path: `${prefix}/arena/guide`, badge: 0 },
            { label: 'Kiếm Points', icon: Gift, path: `${prefix}/rewards?tab=arena`, badge: 0 },
            { label: 'Leaderboard', icon: Trophy, path: `${prefix}/arena/leaderboard`, badge: 0 },
            { label: 'Sân chơi của tôi', icon: Star, path: `${prefix}/profile/arena`, badge: MY_ARENA_STATS.pendingNotifications || 0 },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="shrink-0 relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:opacity-70"
              style={{
                background: c.chipBg,
                border: `1px solid ${c.chipBorder}`,
                color: c.chipText,
                fontSize: φ.xs,
                fontWeight: 600,
                minHeight: 36,
              }}
            >
              <item.icon size={12} /> {item.label}
              <NotificationBadge count={item.badge} />
            </button>
          ))}
        </div>
      </div>

      {/* ─── Search Results (Critical #4) ─── */}
      {hasSearch ? (
        <div>
          <p style={{ color: c.text2, fontSize: φ.xs, marginBottom: 12 }}>
            {totalResults > 0
              ? `${totalResults} kết quả cho "${search}"`
              : `Không tìm thấy kết quả cho "${search}"`
            }
          </p>

          {/* Matched Modes */}
          {filteredModes.length > 0 && (
            <div className="mb-4">
              <SectionHeader title={`Modes (${filteredModes.length})`} accent accentColor="#3B82F6" mb={8} />
              <div className="flex flex-col gap-2">
                {filteredModes.map(mode => {
                  const tpl = ARENA_TEMPLATES.find(t => t.id === mode.templateId);
                  return (
                    <TrCard key={mode.id} hover as="button"
                      onClick={() => { navigate(`${prefix}/arena/mode/${mode.id}`); hapticSelection(); }}
                      className="flex items-center gap-3 p-3.5 w-full active:opacity-70">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: c.surface2, fontSize: 18 }}>
                        {tpl?.icon || '🎯'}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{mode.title}</p>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>{mode.creator.name} · {mode.cloneCount} clone</p>
                      </div>
                      <ChevronRight size={14} color={c.text3} />
                    </TrCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Rooms */}
          {filteredRooms.length > 0 && (
            <div className="mb-4">
              <SectionHeader title={`Phòng (${filteredRooms.length})`} accent accentColor="#F59E0B" mb={8} />
              <div className="flex flex-col gap-2">
                {filteredRooms.map(room => {
                  const st = roomStatusLabel(room.status);
                  return (
                    <TrCard key={room.id} hover as="button"
                      onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}
                      className="flex items-center gap-3 p-3.5 w-full active:opacity-70">
                      <div className="flex-1 text-left min-w-0">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{room.title}</p>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>{room.format} · {room.slotsFilled}/{room.slotsTotal}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md shrink-0"
                        style={{ background: hexToRgba(st.color, 0.08), color: st.color, fontSize: 10, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </TrCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Creators */}
          {filteredCreators.length > 0 && (
            <div className="mb-4">
              <SectionHeader title={`Creators (${filteredCreators.length})`} accent accentColor="#10B981" mb={8} />
              <div className="flex flex-col gap-2">
                {filteredCreators.map(cr => (
                  <TrCard key={cr.id} hover as="button"
                    onClick={() => { navigate(`${prefix}/arena/creator/${cr.id}`); hapticSelection(); }}
                    className="flex items-center gap-3 p-3.5 w-full active:opacity-70">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: c.surface2, fontSize: 20 }}>
                      {cr.avatar}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{cr.name}</p>
                      <p style={{ color: c.text3, fontSize: φ.xs }}>{cr.modesCreated} modes · {cr.trustScore}% trust</p>
                    </div>
                    {cr.fairPlayBadge && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)', fontSize: 9, color: '#10B981', fontWeight: 600 }}>
                        <Shield size={8} /> Fair Play
                      </span>
                    )}
                    <ChevronRight size={14} color={c.text3} />
                  </TrCard>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Search size={36} color={c.text3} className="mb-3" />
              <p style={{ color: c.text2, fontSize: φ.sm, marginBottom: 4 }}>
                Không tìm thấy kết quả
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                Thử tìm với từ khóa khác hoặc xóa bộ lọc
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="contents">
          {/* A. Hero Card */}
          <HeroCard />

          {/* B. Templates */}
          <TemplateSection />

          {/* C. Featured Modes */}
          <FeaturedModes />

          {/* D. Live Rooms */}
          <LiveRooms />

          {/* E. Creator Spotlight */}
          <CreatorSpotlight />

          {/* ─── 09B: Prediction Bridge — "Bối cảnh thị trường" ─── */}
          <PredictionBridge />

          {/* F. Verified Challenges Teaser */}
          <VerifiedTeaser />
        </div>
      )}

      {/* G. Community Rules & Disclaimer */}
      <ArenaPageFooter />
      </PageContent>
    </PullToRefresh>
  );
}