import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Trophy, Zap, ChevronRight, Shield,
  Sparkles, BarChart3, Gift, Star, Clock,
  FileEdit, Bookmark, Eye, Users, Flag, Ban,
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
import { CTAButton } from '../../components/ui/CTAButton';
import { SkeletonCard, SkeletonRow } from '../../components/states/SkeletonBlock';
import { StatusChip, FormatChip, TrustBadge } from '../../components/arena/ArenaChips';
import {
  ArenaEmptyRooms, ArenaEmptyJoined, ArenaEmptySavedModes,
  ArenaEmptyDrafts, ArenaEmptyHistory, ArenaLoadingSkeleton,
} from '../../components/arena/ArenaStates';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import { RewardAnalyticsCard } from '../../components/arena/ArenaRewardComponents';
import { φ, φRadius } from '../../utils/golden';
import { φSpace } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  MY_ARENA_STATS, ARENA_CHALLENGES, ARENA_ROOMS, ARENA_MODES,
  fmtPoints, roomStatusLabel,
  type ArenaChallenge, type ArenaRoom, type ArenaMode,
} from '../../data/arenaData';

/* ═══════════════════════════════════════════
   Tab Types & Config
   ═══════════════════════════════════════════ */

type MyArenaTab = 'my_rooms' | 'joined' | 'saved_modes' | 'drafts' | 'history';

const TABS: { id: MyArenaTab; label: string; icon: typeof Users }[] = [
  { id: 'my_rooms',    label: 'Phòng của tôi', icon: Star },
  { id: 'joined',      label: 'Đã tham gia',   icon: Users },
  { id: 'saved_modes', label: 'Mode đã lưu',   icon: Bookmark },
  { id: 'drafts',      label: 'Bản nháp',       icon: FileEdit },
  { id: 'history',     label: 'Lịch sử',        icon: Clock },
];

/* ─── Mock data per tab ─── */

// My rooms = challenges I created
const MY_ROOMS = ARENA_CHALLENGES.filter(ch =>
  ch.challengeState === 'open' || ch.challengeState === 'live' || ch.challengeState === 'full'
).slice(0, 3);

// Joined = challenges I participate in
const JOINED_CHALLENGES = ARENA_CHALLENGES.filter(ch =>
  ch.challengeState === 'live' || ch.challengeState === 'pending_result' || ch.challengeState === 'open'
).slice(0, 4);

// Saved modes
const SAVED_MODES = ARENA_MODES.slice(0, 3);

// Drafts = incomplete challenges
const DRAFT_CHALLENGES: { id: string; title: string; format: string; updated: string; entryPoints: number }[] = [
  { id: 'draft001', title: 'SOL vs DOT Prediction', format: 'Closest Guess', updated: '27/02 14:30', entryPoints: 100 },
  { id: 'draft002', title: 'DeFi Quiz Night (chưa hoàn thành)', format: 'Bracket', updated: '25/02 18:00', entryPoints: 200 },
];

// History = resolved + canceled
const HISTORY_CHALLENGES = ARENA_CHALLENGES.filter(ch =>
  ch.challengeState === 'resolved' || ch.challengeState === 'canceled'
);

/* ═══════════════════════════════════════════
   Challenge Row Component
   ═══════════════════════════════════════════ */

function ChallengeRow({ ch, onPress }: { ch: ArenaChallenge; onPress: () => void }) {
  const c = useThemeColors();
  const state = ch.challengeState || 'open';
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
      style={{ minHeight: 64 }}
    >
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{ch.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span style={{ color: c.text3, fontSize: φ.xs }}>{ch.format}</span>
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <span style={{ color: c.text3, fontSize: φ.xs }}>{ch.slotsFilled}/{ch.slotsTotal}</span>
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{fmtPoints(ch.entryPoints)} pts</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
        <StatusChip status={state} />
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: 10, fontWeight: 600 }}
        >
          Xem
        </span>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MyArenaPage — Main
   ═══════════════════════════════════════════ */

export function MyArenaPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const [tab, setTab] = useState<MyArenaTab>('my_rooms');

  const stats = MY_ARENA_STATS;
  const winRate = stats.totalChallenges > 0 ? Math.round((stats.wins / stats.totalChallenges) * 100) : 0;

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title="Sân chơi của tôi" subtitle="Quản lý · Open Arena" back />

      {isLoading ? <ArenaLoadingSkeleton variant="home" /> : (
        <PageContent padding="compact" gap="default">

          {/* ─── Points Balance Hero ─── */}
          <div>
            <TrCard className="p-0 overflow-hidden">
              {/* Top section: Balance */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p style={{ color: c.text3, fontSize: φ.sm, fontWeight: 600, letterSpacing: 0.3 }}>
                    Arena Points
                  </p>
                  <button
                    onClick={() => { navigate(`${prefix}/arena/points`); hapticSelection(); }}
                    className="flex items-center gap-1 active:opacity-70"
                    style={{ minHeight: 44, minWidth: 44, justifyContent: 'flex-end' }}
                  >
                    <Eye size={14} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Chi tiết</span>
                  </button>
                </div>

                <div className="flex items-baseline gap-2">
                  <p style={{
                    color: c.text1,
                    fontSize: φ.xl,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: -0.5,
                    lineHeight: 1.2,
                  }}>
                    {fmtPoints(stats.currentBalance)}
                  </p>
                  <span style={{ color: c.text3, fontSize: φ.base, fontWeight: 500 }}>pts</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: c.divider, marginLeft: 20, marginRight: 20 }} />

              {/* Bottom section: In/Out + CTA */}
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Earned */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                    <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 500 }}>Đã nhận</p>
                  </div>
                  <p style={{
                    color: '#10B981',
                    fontSize: φ.base,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    +{fmtPoints(stats.pointsEarned)}
                  </p>
                </div>

                {/* Vertical divider */}
                <div style={{ width: 1, height: 36, background: c.divider }} />

                {/* Spent */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                    <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 500 }}>Đã dùng</p>
                  </div>
                  <p style={{
                    color: '#EF4444',
                    fontSize: φ.base,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    -{fmtPoints(stats.pointsSpent)}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => { navigate(`${prefix}/rewards?tab=arena`); hapticSelection(); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl active:opacity-70 shrink-0"
                  style={{
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    minHeight: 44,
                  }}
                >
                  <Gift size={14} color="#8B5CF6" />
                  <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 600 }}>Kiếm Points</span>
                </button>
              </div>
            </TrCard>
          </div>

          {/* ─── 4 Summary Cards ─── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Đang chơi',
                value: (stats.activeChallenges ?? 0).toString(),
                sub: 'challenges đang hoạt động',
                color: '#3B82F6',
                icon: Zap,
              },
              {
                label: 'Mode đã tạo',
                value: stats.modesCreated.toString(),
                sub: 'modes trong cộng đồng',
                color: '#8B5CF6',
                icon: Sparkles,
              },
              {
                label: 'Điểm Creator',
                value: `${stats.creatorScore ?? 0}%`,
                sub: 'dựa trên đánh giá',
                color: '#10B981',
                icon: Star,
              },
              {
                label: 'Xếp hạng',
                value: `#${stats.rank}`,
                sub: 'trên leaderboard',
                color: '#F59E0B',
                icon: Trophy,
              },
            ].map(s => (
              <TrCard key={s.label} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: hexToRgba(s.color, 14) }}
                  >
                    <s.icon size={14} color={s.color} />
                  </div>
                  <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600 }}>{s.label}</p>
                </div>
                <p style={{
                  color: s.color,
                  fontSize: φ.md,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.2,
                  marginBottom: 2,
                }}>
                  {s.value}
                </p>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{s.sub}</p>
              </TrCard>
            ))}
          </div>

          {/* ─── Quick CTA ─── */}
          <div>
            <CTAButton onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}>
              <Sparkles size={16} className="mr-1.5" style={{ display: 'inline' }} />
              Tạo challenge mới
            </CTAButton>
          </div>

          {/* ─── Quick Links ─── */}
          <div className="flex gap-2">
            {[
              { label: 'Leaderboard', icon: Trophy, path: `${prefix}/arena/leaderboard` },
              { label: 'Khám phá', icon: Zap, path: `${prefix}/arena` },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => { navigate(item.path); hapticSelection(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
                style={{
                  background: c.chipBg, border: `1px solid ${c.chipBorder}`,
                  color: c.chipText, fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                }}
              >
                <item.icon size={12} /> {item.label}
              </button>
            ))}
          </div>

          {/* ─── 5-Tab Navigation ─── */}
          <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 no-scrollbar">
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); hapticSelection(); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    color: active ? c.chipActiveText : c.chipText,
                    fontSize: φ.xs, fontWeight: 600, minHeight: 36,
                  }}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ─── Tab Content ─── */}
          <div>
            {/* My Rooms */}
            {tab === 'my_rooms' && (
              <div>
              {MY_ROOMS.length === 0 ? (
                <ArenaEmptyRooms onCta={() => navigate(`${prefix}/arena/studio`)} />
              ) : (
                <TrCard overflow>
                  {MY_ROOMS.map((ch, i) => (
                    <div key={ch.id}
                      style={{ borderBottom: i < MY_ROOMS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                      <ChallengeRow ch={ch} onPress={() => { navigate(`${prefix}/arena/challenge/${ch.id}`); hapticSelection(); }} />
                    </div>
                  ))}
                </TrCard>
              )}
              </div>
            )}

            {/* Joined */}
            {tab === 'joined' && (
              <div>
              {JOINED_CHALLENGES.length === 0 ? (
                <ArenaEmptyJoined onCta={() => navigate(`${prefix}/arena`)} />
              ) : (
                <TrCard overflow>
                  {JOINED_CHALLENGES.map((ch, i) => (
                    <div key={ch.id}
                      style={{ borderBottom: i < JOINED_CHALLENGES.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                      <ChallengeRow ch={ch} onPress={() => { navigate(`${prefix}/arena/challenge/${ch.id}`); hapticSelection(); }} />
                    </div>
                  ))}
                </TrCard>
              )}
              </div>
            )}

            {/* Saved Modes */}
            {tab === 'saved_modes' && (
              <div>
              {SAVED_MODES.length === 0 ? (
                <ArenaEmptySavedModes onCta={() => navigate(`${prefix}/arena`)} />
              ) : (
                <TrCard overflow>
                  {SAVED_MODES.map((mode, i) => (
                    <button
                      key={mode.id}
                      onClick={() => { navigate(`${prefix}/arena/mode/${mode.id}`); hapticSelection(); }}
                      className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                      style={{
                        borderBottom: i < SAVED_MODES.length - 1 ? `1px solid ${c.divider}` : 'none',
                        minHeight: 64,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{mode.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{mode.creator.name}</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{mode.cloneCount} clone</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{mode.activeChallenges} active</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {mode.fairPlay && <TrustBadge type="fair_play" />}
                        <span
                          className="px-2.5 py-1 rounded-lg"
                          style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: 10, fontWeight: 600 }}
                        >
                          Xem
                        </span>
                      </div>
                    </button>
                  ))}
                </TrCard>
              )}
              </div>
            )}

            {/* Drafts */}
            {tab === 'drafts' && (
              <div>
              {DRAFT_CHALLENGES.length === 0 ? (
                <ArenaEmptyDrafts onCta={() => navigate(`${prefix}/arena/studio`)} />
              ) : (
                <TrCard overflow>
                  {DRAFT_CHALLENGES.map((draft, i) => (
                    <button
                      key={draft.id}
                      onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
                      className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                      style={{
                        borderBottom: i < DRAFT_CHALLENGES.length - 1 ? `1px solid ${c.divider}` : 'none',
                        minHeight: 64,
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(148,163,184,0.12)' }}>
                        <FileEdit size={16} color="#94A3B8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{draft.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{draft.format}</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{draft.updated}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <StatusChip status="draft" />
                        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{fmtPoints(draft.entryPoints)} pts</span>
                      </div>
                    </button>
                  ))}
                </TrCard>
              )}
              </div>
            )}

            {/* History */}
            {tab === 'history' && (
              <div>
              {HISTORY_CHALLENGES.length === 0 ? (
                <ArenaEmptyHistory />
              ) : (
                <TrCard overflow>
                  {HISTORY_CHALLENGES.map((ch, i) => {
                    const isResolved = ch.challengeState === 'resolved';
                    return (
                      <button
                        key={ch.id}
                        onClick={() => { navigate(`${prefix}/arena/challenge/${ch.id}`); hapticSelection(); }}
                        className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                        style={{
                          borderBottom: i < HISTORY_CHALLENGES.length - 1 ? `1px solid ${c.divider}` : 'none',
                          minHeight: 64,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{ch.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span style={{ color: c.text3, fontSize: φ.xs }}>{ch.format}</span>
                            <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                            <span style={{ color: c.text3, fontSize: φ.xs }}>{fmtPoints(ch.prizePool)} pts pool</span>
                            <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                            <span style={{ color: c.text3, fontSize: φ.xs }}>{ch.slotsFilled}/{ch.slotsTotal}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <StatusChip status={ch.challengeState || 'resolved'} />
                          <span
                            className="px-2.5 py-1 rounded-lg"
                            style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: 10, fontWeight: 600 }}
                          >
                            Xem
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </TrCard>
              )}
              </div>
            )}
          </div>

          {/* ─── Modes I created ─── */}
          {stats.modesCreated > 0 && (
            <div>
              <SectionHeader title={`Mode đã tạo (${stats.modesCreated})`} accent accentColor="#8B5CF6" />
              <TrCard hover as="button"
                onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
                className="p-4 flex items-center gap-3 w-full active:opacity-70"
                style={{ minHeight: 52 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <BarChart3 size={18} color="#8B5CF6" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                    {stats.modesCreated} mode đã tạo
                  </p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Quản lý modes và xem thống kê</p>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </TrCard>
            </div>
          )}

          {/* ─── I6: Reward History Analytics ─── */}
          {stats.rewardHistory && (
            <div>
              <SectionHeader title="Phân tích phần thưởng" accent accentColor="#F59E0B" mb={8} />
              <RewardAnalyticsCard
                totalPayouts={stats.rewardHistory.totalPayouts}
                avgROI={stats.rewardHistory.avgROI}
                largestPayout={stats.rewardHistory.largestPayout}
                winsByDistType={stats.rewardHistory.winsByDistType}
                recentPayouts={stats.rewardHistory.recentPayouts}
                onViewChallenge={(id) => { navigate(`${prefix}/arena/challenge/${id}`); hapticSelection(); }}
              />
            </div>
          )}

          {/* ─── Community Rules & Disclaimer ─── */}
          <div>
            <SectionHeader title="An toàn & quản lý" accent accentColor="#10B981" mb={8} />
            <div className="flex flex-col gap-2">
              <TrCard hover as="button"
                onClick={() => { navigate(`${prefix}/profile/arena/reports`); hapticSelection(); }}
                className="flex items-center gap-3 p-4 w-full active:opacity-70"
                style={{ minHeight: 52 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Flag size={16} color="#EF4444" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>Báo cáo của tôi</p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Theo dõi tiến trình xử lý báo cáo</p>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </TrCard>
              <TrCard hover as="button"
                onClick={() => { navigate(`${prefix}/profile/arena/blocked`); hapticSelection(); }}
                className="flex items-center gap-3 p-4 w-full active:opacity-70"
                style={{ minHeight: 52 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Ban size={16} color="#F59E0B" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>Người dùng đã chặn</p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Quản lý danh sách chặn</p>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </TrCard>
              <TrCard hover as="button"
                onClick={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
                className="flex items-center gap-3 p-4 w-full active:opacity-70"
                style={{ minHeight: 52 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <Shield size={16} color="#10B981" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>An toàn & quy tắc</p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Quy tắc cộng đồng, cách báo cáo</p>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </TrCard>
            </div>
          </div>

          <ArenaPageFooter />
        </PageContent>
      )}
    </PullToRefresh>
  );
}