import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Trophy, Crown, Shield, Star, TrendingUp,
  CheckCircle2, Zap, Users, Flame,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonRow } from '../../components/states/SkeletonBlock';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  MY_ARENA_STATS, fmtPoints,
  LEADERBOARD_CREATORS, LEADERBOARD_PLAYERS, LEADERBOARD_TEAMS,
} from '../../data/arenaData';

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

type MainTab = 'creators' | 'players' | 'teams';
type MetricChip = 'fair_play' | 'popularity' | 'win_rate' | 'activity' | 'completion';
type SeasonFilter = 'today' | 'weekly' | 'monthly' | 'season';

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'creators', label: 'Creators' },
  { id: 'players', label: 'Players' },
  { id: 'teams', label: 'Teams' },
];

const METRIC_CHIPS: { id: MetricChip; label: string; icon: typeof Shield }[] = [
  { id: 'fair_play', label: 'Fair Play', icon: Shield },
  { id: 'popularity', label: 'Popularity', icon: TrendingUp },
  { id: 'win_rate', label: 'Win Rate', icon: Trophy },
  { id: 'activity', label: 'Activity', icon: Zap },
  { id: 'completion', label: 'Completion', icon: CheckCircle2 },
];

const SEASON_FILTERS: { id: SeasonFilter; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'weekly', label: 'Tuần' },
  { id: 'monthly', label: 'Tháng' },
  { id: 'season', label: 'Mùa' },
];

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'];

/* ═══════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════ */

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Podium (Top 3)
   ═══════════════════════════════════════════ */

function Podium({ entries }: { entries: { avatar: string; name: string; value: string; rank: number }[] }) {
  const c = useThemeColors();
  if (entries.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-3 mb-5">
      {/* 2nd place */}
      <div className="flex flex-col items-center flex-1">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: c.surface2, fontSize: 24, border: `2px solid ${RANK_COLORS[1]}` }}>
          {entries[1].avatar}
        </div>
        <p style={{ color: RANK_COLORS[1], fontSize: φ.xs, fontWeight: 700 }}>#2</p>
        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate max-w-full">{entries[1].name}</p>
        <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>{entries[1].value}</p>
      </div>

      {/* 1st place */}
      <div className="flex flex-col items-center flex-1">
        <Crown size={20} color="#F59E0B" className="mb-1" />
        <div className="flex items-center justify-center mb-2"
          style={{ width: 72, height: 72, borderRadius: 16, background: c.surface2, fontSize: 30, border: `2px solid ${RANK_COLORS[0]}`, boxShadow: `0 0 20px ${hexToRgba(RANK_COLORS[0], 33)}` }}>
          {entries[0].avatar}
        </div>
        <p style={{ color: RANK_COLORS[0], fontSize: φ.sm, fontWeight: 700 }}>#1</p>
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate max-w-full">{entries[0].name}</p>
        <p style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>{entries[0].value}</p>
      </div>

      {/* 3rd place */}
      <div className="flex flex-col items-center flex-1">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: c.surface2, fontSize: 24, border: `2px solid ${RANK_COLORS[2]}` }}>
          {entries[2].avatar}
        </div>
        <p style={{ color: RANK_COLORS[2], fontSize: φ.xs, fontWeight: 700 }}>#3</p>
        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate max-w-full">{entries[2].name}</p>
        <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>{entries[2].value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ArenaLeaderboardPage
   ═══════════════════════════════════════════ */

export function ArenaLeaderboardPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [mainTab, setMainTab] = useState<MainTab>('creators');
  const [metric, setMetric] = useState<MetricChip>('fair_play');
  const [season, setSeason] = useState<SeasonFilter>('monthly');

  /* ─── Derived data ─── */

  const sortedCreators = useMemo(() => {
    const list = [...LEADERBOARD_CREATORS];
    switch (metric) {
      case 'fair_play': return list.sort((a, b) => b.fairPlayScore - a.fairPlayScore);
      case 'popularity': return list.sort((a, b) => b.creator.followers - a.creator.followers);
      case 'win_rate': return list.sort((a, b) => b.winRate - a.winRate);
      case 'activity': return list.sort((a, b) => b.activity - a.activity);
      case 'completion': return list.sort((a, b) => b.completionQuality - a.completionQuality);
      default: return list;
    }
  }, [metric]);

  const sortedPlayers = useMemo(() => {
    const list = [...LEADERBOARD_PLAYERS];
    switch (metric) {
      case 'fair_play': return list.sort((a, b) => b.fairPlayScore - a.fairPlayScore);
      case 'popularity': return list.sort((a, b) => b.totalChallenges - a.totalChallenges);
      case 'win_rate': return list.sort((a, b) => b.winRate - a.winRate);
      case 'activity': return list.sort((a, b) => b.streak - a.streak);
      case 'completion': return list.sort((a, b) => b.trustScore - a.trustScore);
      default: return list;
    }
  }, [metric]);

  const sortedTeams = useMemo(() => {
    const list = [...LEADERBOARD_TEAMS];
    switch (metric) {
      case 'fair_play': return list.sort((a, b) => b.fairPlayScore - a.fairPlayScore);
      case 'popularity': return list.sort((a, b) => b.members - a.members);
      case 'win_rate': return list.sort((a, b) => b.winRate - a.winRate);
      case 'activity': return list.sort((a, b) => b.totalWins - a.totalWins);
      case 'completion': return list.sort((a, b) => b.fairPlayScore - a.fairPlayScore);
      default: return list;
    }
  }, [metric]);

  /* ─── Metric value getter ─── */
  function getCreatorMetricValue(entry: typeof sortedCreators[0]): string {
    switch (metric) {
      case 'fair_play': return `${entry.fairPlayScore}%`;
      case 'popularity': return fmtPoints(entry.creator.followers);
      case 'win_rate': return `${entry.winRate}%`;
      case 'activity': return `${entry.activity} rooms`;
      case 'completion': return `${entry.completionQuality}%`;
    }
  }

  function getPlayerMetricValue(entry: typeof sortedPlayers[0]): string {
    switch (metric) {
      case 'fair_play': return `${entry.fairPlayScore}%`;
      case 'popularity': return `${entry.totalChallenges}`;
      case 'win_rate': return `${entry.winRate}%`;
      case 'activity': return `${entry.streak} streak`;
      case 'completion': return `${entry.trustScore}%`;
    }
  }

  function getTeamMetricValue(entry: typeof sortedTeams[0]): string {
    switch (metric) {
      case 'fair_play': return `${entry.fairPlayScore}%`;
      case 'popularity': return `${entry.members} members`;
      case 'win_rate': return `${entry.winRate}%`;
      case 'activity': return `${entry.totalWins} wins`;
      case 'completion': return `${entry.fairPlayScore}%`;
    }
  }

  /* ─── Podium entries ─── */
  const podiumEntries = useMemo(() => {
    if (mainTab === 'creators') {
      return sortedCreators.slice(0, 3).map(e => ({
        avatar: e.creator.avatar, name: e.creator.name,
        value: getCreatorMetricValue(e), rank: e.rank,
      }));
    }
    if (mainTab === 'players') {
      return sortedPlayers.slice(0, 3).map(e => ({
        avatar: e.avatar, name: e.name,
        value: getPlayerMetricValue(e), rank: e.rank,
      }));
    }
    return sortedTeams.slice(0, 3).map(e => ({
      avatar: e.avatar, name: e.teamName,
      value: getTeamMetricValue(e), rank: e.rank,
    }));
  }, [mainTab, sortedCreators, sortedPlayers, sortedTeams, metric]);

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title="Arena Leaderboard" subtitle="Bảng xếp hạng · Open Arena" back />

      <PageContent padding="compact" gap="default">
      {/* ─── My Rank Card ─── */}
      <div>
        <TrCard className="p-4 flex items-center gap-3" accentBorder="rgba(139,92,246,0.2)">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <Trophy size={18} color="#8B5CF6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>Hạng của bạn</p>
            <p style={{ color: c.text3, fontSize: φ.xs }}>{MY_ARENA_STATS.wins} wins · {MY_ARENA_STATS.totalChallenges} challenges</p>
          </div>
          <div className="text-right">
            <p style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>#{MY_ARENA_STATS.rank}</p>
            <p style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{fmtPoints(MY_ARENA_STATS.pointsEarned)} pts</p>
          </div>
        </TrCard>
      </div>

      {/* ─── Filter Controls Block ─── */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        {/* Main Tabs */}
        <div className="flex gap-2">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setMainTab(t.id); hapticSelection(); }}
              className="flex-1 py-2 rounded-xl text-center active:opacity-70"
              style={{
                background: mainTab === t.id ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${mainTab === t.id ? c.chipActiveBorder : c.chipBorder}`,
                color: mainTab === t.id ? c.chipActiveText : c.chipText,
                fontSize: φ.sm,
                fontWeight: 600,
                minHeight: 40,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Metric Chips (horizontal scroll) */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 no-scrollbar">
          {METRIC_CHIPS.map(ch => {
            const active = metric === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => { setMetric(ch.id); hapticSelection(); }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:opacity-70"
                style={{
                  background: active ? 'rgba(139,92,246,0.12)' : c.chipBg,
                  border: `1.5px solid ${active ? 'rgba(139,92,246,0.3)' : c.chipBorder}`,
                  color: active ? '#8B5CF6' : c.chipText,
                  fontSize: φ.xs,
                  fontWeight: 600,
                  minHeight: 36,
                }}
              >
                <ch.icon size={12} />
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* Season Filter */}
        <div className="flex gap-1.5">
          {SEASON_FILTERS.map(sf => {
            const active = season === sf.id;
            return (
              <button
                key={sf.id}
                onClick={() => { setSeason(sf.id); hapticSelection(); }}
                className="px-3 py-1.5 rounded-lg active:opacity-70"
                style={{
                  background: active ? c.chipActiveBg : 'transparent',
                  color: active ? c.chipActiveText : c.text3,
                  fontSize: φ.xs,
                  fontWeight: 600,
                  minHeight: 32,
                }}
              >
                {sf.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? <LeaderboardSkeleton /> : (
        <div className="flex flex-col">

          {/* ─── Podium ─── */}
          <div>
            <Podium entries={podiumEntries} />
          </div>

          {/* ─── Section: Top list ─── */}
          <div className="mb-4">
            <SectionHeader
              title={mainTab === 'creators' ? 'Top Creators' : mainTab === 'players' ? 'Top Players' : 'Top Teams'}
              accent
              accentColor="#8B5CF6"
              mb={8}
            />
            <TrCard overflow>
              {(mainTab === 'creators' ? sortedCreators.slice(3) : mainTab === 'players' ? sortedPlayers.slice(3) : sortedTeams.slice(3)).map((entry, i, arr) => {
                const isCreator = mainTab === 'creators';
                const isPlayer = mainTab === 'players';
                const avatar = isCreator ? (entry as typeof sortedCreators[0]).creator.avatar : (entry as any).avatar;
                const name = isCreator ? (entry as typeof sortedCreators[0]).creator.name : isPlayer ? (entry as typeof sortedPlayers[0]).name : (entry as typeof sortedTeams[0]).teamName;
                const metricVal = isCreator
                  ? getCreatorMetricValue(entry as typeof sortedCreators[0])
                  : isPlayer
                    ? getPlayerMetricValue(entry as typeof sortedPlayers[0])
                    : getTeamMetricValue(entry as typeof sortedTeams[0]);
                const rank = i + 4;

                return (
                  <div
                    key={rank}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 52 }}
                  >
                    <span style={{ color: c.text3, fontSize: φ.body, fontWeight: 700, width: 28, textAlign: 'center', fontFamily: 'monospace' }}>
                      {rank}
                    </span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.surface2, fontSize: 18 }}>
                      {avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{name}</p>
                      {isCreator && (entry as typeof sortedCreators[0]).creator.fairPlayBadge && (
                        <span className="flex items-center gap-0.5" style={{ color: '#10B981', fontSize: 10 }}>
                          <Shield size={8} /> Fair Play
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                      {metricVal}
                    </span>
                  </div>
                );
              })}
            </TrCard>
          </div>

          {/* ─── Rising section (Creators tab only) ─── */}
          {mainTab === 'creators' && (
            <div className="mb-4">
              <SectionHeader title="Rising Creators" accent accentColor="#F59E0B" mb={8} />
              <TrCard overflow>
                {sortedCreators.slice(-2).reverse().map((entry, i) => (
                  <button
                    key={entry.creator.id}
                    onClick={() => { navigate(`${prefix}/arena/creator/${entry.creator.id}`); hapticSelection(); }}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                    style={{ borderBottom: i < 1 ? `1px solid ${c.divider}` : 'none', minHeight: 52 }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)', fontSize: 18 }}>
                      {entry.creator.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{entry.creator.name}</p>
                      <p style={{ color: c.text3, fontSize: φ.xs }}>
                        {entry.creator.modesCreated} modes · {entry.activity} rooms/tháng
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame size={12} color="#F59E0B" />
                      <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Rising</span>
                    </div>
                  </button>
                ))}
              </TrCard>
            </div>
          )}

          {/* ─── Cleanest Rooms / Most Trusted (Players tab only) ─── */}
          {mainTab === 'players' && (
            <div className="mb-4">
              <SectionHeader title="Người chơi đáng tin nhất" accent accentColor="#10B981" mb={8} />
              <TrCard overflow>
                {sortedPlayers.filter(p => p.trustScore >= 90).slice(0, 5).map((p, i, arr) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 52 }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(16,185,129,0.12)', fontSize: 18 }}>
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#10B981', fontSize: 10 }}>Trust {p.trustScore}%</span>
                        <span style={{ color: c.text3, fontSize: 10 }}>{p.totalChallenges} challenges</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield size={12} color="#10B981" />
                      <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700 }}>{p.fairPlayScore}%</span>
                    </div>
                  </div>
                ))}
              </TrCard>
            </div>
          )}

          {/* ─── Disclaimer ─── */}
          <ArenaPageFooter hideDisclaimer />
          <div className="mt-2">
            <TrCard className="p-3 flex items-start gap-2">
              <Shield size={14} color="#8B5CF6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                Bảng xếp hạng dựa trên chất lượng, sự công bằng và độ tin cậy — không nhấn mạnh số tiền. Arena Points không phải tài sản tài chính.
              </p>
            </TrCard>
          </div>

        </div>
      )}
      </PageContent>
    </PullToRefresh>
  );
}