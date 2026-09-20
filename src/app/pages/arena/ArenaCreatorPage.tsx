import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Shield, Users, ChevronRight, Star, Trophy, Flag,
  CheckCircle2, Clock, Copy, AlertTriangle, Zap,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CTAButton } from '../../components/ui/CTAButton';
import { EmptyState } from '../../components/states/EmptyState';
import { SkeletonCard, SkeletonRow } from '../../components/states/SkeletonBlock';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  getCreatorById, ARENA_MODES, ARENA_ROOMS, ARENA_TEMPLATES,
  fmtPoints, roomStatusLabel, badgeColor,
} from '../../data/arenaData';
import { PolicyInfoLink } from '../../components/arena/ArenaSafetyTrust';
import { TrustBreakdownSheet, buildTrustBreakdownFromCreator } from '../../components/arena/ArenaSafetyTrust';
import { ReportDialog } from '../../components/arena/ArenaModeration';

/* ═══════════════════════════════════════════
   Tab Types
   ═══════════════════════════════════════════ */

type CreatorTab = 'modes' | 'live' | 'history' | 'about';

const TABS: { id: CreatorTab; label: string }[] = [
  { id: 'modes', label: 'Modes' },
  { id: 'live', label: 'Live Rooms' },
  { id: 'history', label: 'Lịch sử' },
  { id: 'about', label: 'Giới thiệu' },
];

/* ═══════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════ */

function CreatorSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ArenaCreatorPage
   ═══════════════════════════════════════════ */

export function ArenaCreatorPage() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const [tab, setTab] = useState<CreatorTab>('modes');
  const [trustSheetOpen, setTrustSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const creator = getCreatorById(creatorId || '');
  if (!creator) {
    return (
      <PageLayout>
        <Header title="Creator" subtitle="Hồ sơ · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy creator" subtitle="Creator không tồn tại" />
      </PageLayout>
    );
  }

  const creatorModes = ARENA_MODES.filter(m => m.creator.id === creator.id);
  const creatorRooms = ARENA_ROOMS.filter(r =>
    creatorModes.some(m => m.id === r.modeId) || r.creator.name === creator.name
  );
  const liveRooms = creatorRooms.filter(r => r.status !== 'completed');
  const historyRooms = creatorRooms.filter(r => r.status === 'completed');
  const bdg = creator.badge ? badgeColor(creator.badge) : '#6B7280';

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title="Creator Profile" subtitle="Nhà sáng tạo · Open Arena" back />

      {isLoading ? <CreatorSkeleton /> : (
        <PageContent padding="compact" gap="default">

          {/* ─── Profile Card ─── */}
          <div>
            <TrCard className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: c.surface2, fontSize: 36 }}
                >
                  {creator.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{creator.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {creator.fairPlayBadge && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(16,185,129,0.12)', fontSize: 10, color: '#10B981', fontWeight: 600 }}>
                        <Shield size={9} /> Fair Play
                      </span>
                    )}
                    {creator.badge && (
                      <span className="px-2 py-0.5 rounded-md"
                        style={{ background: hexToRgba(bdg, 15), color: bdg, fontSize: 10, fontWeight: 600 }}>
                        {creator.badge}
                      </span>
                    )}
                    {creator.level !== undefined && (
                      <span className="px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>
                        Lv.{creator.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Modes', value: creator.modesCreated.toString(), color: '#3B82F6', tappable: false },
                  { label: 'Phòng HT', value: (creator.completedRooms || creator.totalChallenges).toString(), color: '#8B5CF6', tappable: false },
                  { label: 'Clone', value: fmtPoints(creator.totalClones || 0), color: '#10B981', tappable: false },
                  { label: 'Trust', value: `${creator.trustScore}%`, color: '#F59E0B', tappable: true },
                ].map(s => (
                  s.tappable ? (
                    <button
                      key={s.label}
                      onClick={() => { setTrustSheetOpen(true); hapticSelection(); }}
                      className="rounded-xl p-2.5 text-center active:opacity-70"
                      style={{ background: c.surface2, border: `1.5px solid ${hexToRgba(s.color, 25)}`, minHeight: 44 }}
                    >
                      <p style={{ color: s.color, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                      <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
                    </button>
                  ) : (
                    <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
                      <p style={{ color: s.color, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                      <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
                    </div>
                  )
                ))}
              </div>
            </TrCard>
          </div>

          {/* ─── Detailed Stats ─── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionHeader title="Chi tiết tin cậy" accent accentColor="#10B981" mb={0} />
              <button
                onClick={() => { navigate(`${prefix}/arena/trust/${creator.id}`); hapticSelection(); }}
                className="flex items-center gap-1 active:opacity-70"
                style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}
              >
                Xem chi tiết <ChevronRight size={12} />
              </button>
            </div>
            <button
              onClick={() => { setTrustSheetOpen(true); hapticSelection(); }}
              className="w-full text-left active:opacity-70"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Fair Play', value: `${creator.trustScore}%`, color: '#10B981', icon: Shield },
                  { label: 'Tỷ lệ tranh chấp', value: creator.disputeRate !== undefined ? `${(creator.disputeRate * 100).toFixed(1)}%` : '—', color: (creator.disputeRate || 0) < 0.05 ? '#10B981' : '#EF4444', icon: Flag },
                  { label: 'Hoàn thành', value: creator.completionRate !== undefined ? `${creator.completionRate}%` : '—', color: '#3B82F6', icon: CheckCircle2 },
                  { label: 'Đánh giá CĐ', value: creator.communityRating !== undefined ? `${creator.communityRating}/5` : '—', color: '#F59E0B', icon: Star },
                ].map(s => (
                  <TrCard key={s.label} className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba(s.color, 15) }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                    <div>
                      <p style={{ color: s.color, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                    </div>
                  </TrCard>
                ))}
              </div>
            </button>
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); hapticSelection(); }}
                className="flex-1 py-2 rounded-xl text-center active:opacity-70"
                style={{
                  background: tab === t.id ? c.chipActiveBg : c.chipBg,
                  border: `1.5px solid ${tab === t.id ? c.chipActiveBorder : c.chipBorder}`,
                  color: tab === t.id ? c.chipActiveText : c.chipText,
                  fontSize: φ.xs,
                  fontWeight: 600,
                  minHeight: 40,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Tab Content ─── */}
          <div>
            {/* Modes tab */}
            {tab === 'modes' && (
              <div className="contents">
                {creatorModes.length === 0 ? (
                  <EmptyState icon={Zap} title="Chưa có mode" subtitle="Creator chưa tạo mode nào" />
                ) : (
                  <TrCard overflow>
                    {creatorModes.map((mode, i) => {
                      const tpl = ARENA_TEMPLATES.find(t => t.id === mode.templateId);
                      return (
                        <button
                          key={mode.id}
                          onClick={() => { navigate(`${prefix}/arena/mode/${mode.id}`); hapticSelection(); }}
                          className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                          style={{
                            borderBottom: i < creatorModes.length - 1 ? `1px solid ${c.divider}` : 'none',
                            minHeight: 52,
                          }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: hexToRgba(tpl?.color || '#3B82F6', 15), fontSize: 18 }}>
                            {tpl?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{mode.title}</p>
                            <p style={{ color: c.text3, fontSize: φ.xs }}>
                              {mode.cloneCount} clone · {mode.completionRate}% hoàn thành
                            </p>
                          </div>
                          <ChevronRight size={16} color={c.text3} />
                        </button>
                      );
                    })}
                  </TrCard>
                )}

                {/* Small CTA under modes */}
                {creatorModes.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { navigate(`${prefix}/arena/mode/${creatorModes[0].id}`); hapticSelection(); }}
                      className="flex-1 py-3 rounded-xl active:opacity-70"
                      style={{
                        background: c.chipBg, border: `1.5px solid ${c.chipBorder}`,
                        color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44,
                      }}
                    >
                      Xem mode
                    </button>
                    <button
                      onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
                      className="flex-1 py-3 rounded-xl active:opacity-70"
                      style={{
                        background: c.chipActiveBg, border: `1.5px solid ${c.chipActiveBorder}`,
                        color: c.chipActiveText, fontSize: φ.sm, fontWeight: 600, minHeight: 44,
                      }}
                    >
                      Dùng mode
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live Rooms tab */}
            {tab === 'live' && (
              <div className="contents">
                {liveRooms.length === 0 ? (
                  <EmptyState icon={Zap} title="Không có phòng" subtitle="Hiện chưa có phòng nào đang mở" />
                ) : (
                  <TrCard overflow>
                    {liveRooms.map((room, i) => {
                      const st = roomStatusLabel(room.status);
                      return (
                        <button
                          key={room.id}
                          onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}
                          className="flex items-center justify-between px-4 py-3.5 w-full text-left active:opacity-70"
                          style={{
                            borderBottom: i < liveRooms.length - 1 ? `1px solid ${c.divider}` : 'none',
                            minHeight: 52,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{room.title}</p>
                            <p style={{ color: c.text3, fontSize: φ.xs }}>
                              {room.slotsFilled}/{room.slotsTotal} · {fmtPoints(room.entryPoints)} pts
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg shrink-0 ml-2"
                            style={{ background: hexToRgba(st.color, 15), color: st.color, fontSize: 10, fontWeight: 600 }}>
                            {st.label}
                          </span>
                        </button>
                      );
                    })}
                  </TrCard>
                )}
              </div>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <div className="contents">
                {historyRooms.length === 0 ? (
                  <div className="contents">
                    <TrCard className="p-5">
                      <div className="flex flex-col items-center text-center gap-3 py-4">
                        <Clock size={28} color={c.text3} />
                        <p style={{ color: c.text2, fontSize: φ.sm }}>
                          Chưa có lịch sử phòng hoàn thành. Các challenge đã kết thúc sẽ hiển thị ở đây.
                        </p>
                      </div>
                    </TrCard>
                    {/* Mock completed history */}
                    <TrCard className="mt-3" overflow>
                      {[
                        { title: 'BTC $68K Predict — Tuần 7', slots: '50/50', pts: '4,800 pts', status: 'Hoàn tất' },
                        { title: 'ETH Merge Predict', slots: '30/30', pts: '2,700 pts', status: 'Hoàn tất' },
                        { title: 'Altcoin Battle — Tuần 5', slots: '40/40', pts: '7,200 pts', status: 'Hoàn tất' },
                      ].map((h, i) => (
                        <div key={i}
                          className="flex items-center justify-between px-4 py-3.5"
                          style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{h.title}</p>
                            <p style={{ color: c.text3, fontSize: φ.xs }}>{h.slots} · {h.pts}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg shrink-0 ml-2"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </TrCard>
                  </div>
                ) : (
                  <TrCard overflow>
                    {historyRooms.map((room, i) => (
                      <div key={room.id}
                        className="flex items-center justify-between px-4 py-3.5"
                        style={{ borderBottom: i < historyRooms.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{room.title}</p>
                          <p style={{ color: c.text3, fontSize: φ.xs }}>{room.slotsFilled}/{room.slotsTotal} · {fmtPoints(room.entryPoints)} pts</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg shrink-0 ml-2"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                          Hoàn tất
                        </span>
                      </div>
                    ))}
                  </TrCard>
                )}
              </div>
            )}

            {/* About tab */}
            {tab === 'about' && (
              <div className="flex flex-col gap-4">
                {/* Bio */}
                <TrCard className="p-4">
                  <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>Giới thiệu</p>
                  <p style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.6 }}>
                    {creator.bio || 'Chưa có thông tin giới thiệu.'}
                  </p>
                </TrCard>

                {/* Details */}
                <TrCard className="p-4">
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Followers', value: fmtPoints(creator.followers) },
                      { label: 'Tổng challenges', value: creator.totalChallenges.toString() },
                      { label: 'Tham gia từ', value: creator.joinedAt || '—' },
                      { label: 'Community Trust', value: `${creator.trustScore}%` },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span style={{ color: c.text3, fontSize: φ.xs }}>{row.label}</span>
                        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </TrCard>

                {/* Report CTA */}
                <button
                  onClick={() => { setReportOpen(true); hapticSelection(); }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: '#EF4444',
                    fontSize: φ.sm,
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  <Flag size={14} />
                  Báo cáo creator
                </button>
              </div>
            )}

          </div>

          {/* ─── Chính sách creator link ─── */}
          <div>
            <PolicyInfoLink
              label="Chính sách creator"
              onClick={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
              color="#8B5CF6"
            />
          </div>
        </PageContent>
      )}

      {/* ─── Trust Breakdown Sheet ─── */}
      {creator && (
        <TrustBreakdownSheet
          open={trustSheetOpen}
          onClose={() => setTrustSheetOpen(false)}
          data={buildTrustBreakdownFromCreator(creator)}
        />
      )}

      {/* ─── Report Dialog ─── */}
      {creator && (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetName={creator.name}
          targetType="user"
        />
      )}
    </PullToRefresh>
  );
}