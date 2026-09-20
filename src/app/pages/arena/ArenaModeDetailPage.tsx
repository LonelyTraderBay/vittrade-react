import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronRight, Shield, Users, Copy, Clock, Play, AlertTriangle,
  CheckCircle2, BarChart3, RefreshCw, Flag, Zap,
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
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/states/EmptyState';
import { SkeletonCard, SkeletonRow } from '../../components/states/SkeletonBlock';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/hexToRgba';
import {
  getModeById, getTemplateById, ARENA_ROOMS, ARENA_MODES,
  fmtPoints, roomStatusLabel, disputeRiskLabel, badgeColor,
  type ArenaMode,
} from '../../data/arenaData';
import { PredictionContextCard, mapArenaTagToTopic } from '../../components/bridges/ArenaPredictionBridges';
import { PREDICTION_EVENTS } from '../../data/predictionMockData';
import { PolicyInfoLink, TrustBreakdownSheet, buildTrustBreakdownFromCreator } from '../../components/arena/ArenaSafetyTrust';

/* ═══════════════════════════════════════════
   Complexity chip
   ═══════════════════════════════════════════ */

const COMPLEXITY: Record<string, { label: string; color: string }> = {
  easy: { label: 'Dễ', color: '#10B981' },
  medium: { label: 'Trung bình', color: '#F59E0B' },
  advanced: { label: 'Nâng cao', color: '#EF4444' },
};

/* ═══════════════════════════════════════════
   Skeleton Loader
   ═══════════════════════════════════════════ */

function ModeSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ArenaModeDetailPage
   ═══════════════════════════════════════════ */

export function ArenaModeDetailPage() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const [trustSheetOpen, setTrustSheetOpen] = useState(false);

  const mode = getModeById(modeId || '');
  if (!mode) {
    return (
      <PageLayout>
        <Header title="Mode" subtitle="Chế độ chơi · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy mode" subtitle="Mode này không tồn tại hoặc đã bị xoá" />
      </PageLayout>
    );
  }

  const tpl = getTemplateById(mode.templateId);
  const tplColor = tpl?.color || '#3B82F6';
  const relatedRooms = ARENA_ROOMS.filter(r => r.modeId === mode.id);
  const relatedModes = ARENA_MODES.filter(m => m.templateId === mode.templateId && m.id !== mode.id).slice(0, 4);
  const cx = COMPLEXITY[tpl?.complexity || 'medium'];
  const drl = mode.disputeRiskLevel ? disputeRiskLabel(mode.disputeRiskLevel) : null;

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title={mode.title} subtitle="Chế độ chơi · Open Arena" back />

      {isLoading ? <ModeSkeleton /> : (
        <PageContent padding="compact" gap="default">

          {/* ─── Mode Header ─── */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(tplColor, 0.08)}, ${hexToRgba(tplColor, 0.03)})`,
              border: `1px solid ${hexToRgba(tplColor, 0.19)}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(tplColor, 0.13), fontSize: 26 }}
              >
                {tpl?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{mode.title}</p>
                <p style={{ color: c.text3, fontSize: φ.sm }}>{tpl?.title} template</p>
              </div>
            </div>

            {/* Creator row */}
            <button
              onClick={() => { navigate(`${prefix}/arena/creator/${mode.creator.id}`); hapticSelection(); }}
              className="flex items-center gap-2 mb-3 active:opacity-70"
              style={{ minHeight: 44 }}
            >
              <span style={{ fontSize: 16 }}>{mode.creator.avatar}</span>
              <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>{mode.creator.name}</span>
              {mode.creator.fairPlayBadge && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(16,185,129,0.12)', fontSize: 10, color: '#10B981', fontWeight: 600 }}>
                  <Shield size={9} /> Fair Play
                </span>
              )}
              {mode.creator.badge && (
                <span className="px-2 py-0.5 rounded-md"
                  style={{ background: hexToRgba(badgeColor(mode.creator.badge), 0.08), color: badgeColor(mode.creator.badge), fontSize: 10, fontWeight: 600 }}>
                  {mode.creator.badge}
                </span>
              )}
              <ChevronRight size={14} color={c.text3} />
            </button>

            {/* Trust score link */}
            <button
              onClick={() => { navigate(`${prefix}/arena/trust/${mode.creator.id}`); hapticSelection(); }}
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl active:opacity-70"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', minHeight: 36 }}
            >
              <Shield size={12} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                Trust Score: {mode.creator.trustScore}%
              </span>
              <ChevronRight size={10} color="#10B981" />
            </button>

            {/* Chips row */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cx && (
                <span className="px-2.5 py-1 rounded-lg" style={{ background: hexToRgba(cx.color, 0.08), color: cx.color, fontSize: 10, fontWeight: 600 }}>
                  {cx.label}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>
                Points-only
              </span>
              {mode.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg"
                  style={{ background: c.chipBg, color: c.chipText, fontSize: 10, fontWeight: 600, border: `1px solid ${c.chipBorder}` }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats mini-row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Clone', value: mode.cloneCount.toString(), icon: Copy },
                { label: 'Đang mở', value: mode.activeChallenges.toString(), icon: Play },
                { label: 'Hoàn thành', value: `${mode.completionRate}%`, icon: CheckCircle2 },
              ].map(s => (
                <div key={s.label} className="rounded-xl py-2.5 px-2 text-center" style={{ background: c.surface2 }}>
                  <s.icon size={14} color={c.text3} className="mx-auto mb-1" />
                  <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Description Card ─── */}
          <div>
            <SectionHeader title="Mô tả" accent accentColor={tplColor} mb={8} />
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.6 }}>{mode.description}</p>
            </TrCard>
          </div>

          {/* ─── Rules Summary Card ─── */}
          <div>
            <SectionHeader title="Tóm tắt luật chơi" accent accentColor="#10B981" mb={8} />
            <TrCard className="p-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Formats', value: mode.allowedFormats?.join(', ') || tpl?.formatTags.join(', ') || '—' },
                  { label: 'Điều kiện thắng', value: mode.winCondition || '—' },
                  { label: 'Chốt kết quả', value: mode.resolutionType || '—' },
                  { label: 'Thời lượng TB', value: mode.avgDuration || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 90 }}>{row.label}</span>
                    <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}

                {/* Dispute risk */}
                {drl && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Rủi ro tranh chấp</span>
                    <span className="px-2.5 py-0.5 rounded-md" style={{ background: hexToRgba(drl.color, 0.08), color: drl.color, fontSize: 10, fontWeight: 600 }}>
                      {drl.label}
                    </span>
                  </div>
                )}
              </div>
            </TrCard>
          </div>

          {/* ─── Trust & Quality Stats ─── */}
          <div>
            <SectionHeader title="Chất lượng & Tin cậy" accent accentColor="#8B5CF6" mb={8} />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Hoàn thành', value: `${mode.completionRate}%`, color: '#10B981', icon: CheckCircle2 },
                { label: 'Fair Play', value: mode.fairPlay ? 'Đạt' : 'Chưa đạt', color: mode.fairPlay ? '#10B981' : '#F59E0B', icon: Shield },
                { label: 'Tỷ lệ báo cáo', value: mode.reportRate !== undefined ? `${(mode.reportRate * 100).toFixed(0)}%` : '—', color: (mode.reportRate || 0) < 0.05 ? '#10B981' : '#EF4444', icon: Flag },
                { label: 'Dùng lại', value: mode.repeatUsage !== undefined ? `${mode.repeatUsage} lần/người` : '—', color: '#3B82F6', icon: RefreshCw },
              ].map(s => (
                <TrCard key={s.label} className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: hexToRgba(s.color, 0.08) }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <div>
                    <p style={{ color: s.color, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                  </div>
                </TrCard>
              ))}
            </div>
            <div className="mt-3">
              <PolicyInfoLink
                label="Hiểu chỉ số này"
                onClick={() => { setTrustSheetOpen(true); hapticSelection(); }}
                color="#8B5CF6"
              />
            </div>
          </div>

          {/* ─── CTA Area ─── */}
          <div className="flex flex-col gap-3">
            <CTAButton onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}>
              Dùng mode này
            </CTAButton>
            <button
              onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
              className="w-full py-3.5 rounded-2xl active:opacity-70"
              style={{
                background: c.chipBg,
                border: `1.5px solid ${c.chipBorder}`,
                color: c.chipText,
                fontSize: φ.sm,
                fontWeight: 600,
                minHeight: 44,
              }}
            >
              Tạo room mới
            </button>
          </div>

          {/* ─── Recent Rooms ─── */}
          {relatedRooms.length > 0 && (
            <div>
              <SectionHeader title="Phòng đang mở" accent accentColor="#F59E0B" />
              <TrCard overflow>
                {relatedRooms.map((room, i) => {
                  const st = roomStatusLabel(room.status);
                  return (
                    <button
                      key={room.id}
                      onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}
                      className="flex items-center justify-between px-4 py-3.5 w-full text-left active:opacity-70"
                      style={{
                        borderBottom: i < relatedRooms.length - 1 ? `1px solid ${c.divider}` : 'none',
                        minHeight: 52,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{room.title}</p>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>
                          {room.slotsFilled}/{room.slotsTotal} slots · {fmtPoints(room.entryPoints)} pts
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg shrink-0 ml-2"
                        style={{ background: hexToRgba(st.color, 0.08), color: st.color, fontSize: 10, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </TrCard>
            </div>
          )}

          {/* ─── Related Modes Carousel ─── */}
          {relatedModes.length > 0 && (
            <div>
              <div>
                <SectionHeader title="Mode tương tự" accent accentColor="#3B82F6" />
              </div>
              <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 no-scrollbar">
                {relatedModes.map(rm => {
                  const rmTpl = getTemplateById(rm.templateId);
                  return (
                    <button
                      key={rm.id}
                      onClick={() => { navigate(`${prefix}/arena/mode/${rm.id}`); hapticSelection(); }}
                      className="shrink-0 active:opacity-70"
                      style={{ width: 180 }}
                    >
                      <TrCard className="p-3.5 h-full">
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{ fontSize: 18 }}>{rmTpl?.icon}</span>
                          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
                            {rm.title}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 8 }} className="line-clamp-2">
                          {rm.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: 10 }}>{rm.cloneCount} clone</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>{rm.completionRate}%</span>
                        </div>
                      </TrCard>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── 07D/09C: Prediction Context Bridge ─── */}
          {(() => {
            // Show for prediction/closest_guess modes OR topic-related modes
            const hasPredictionTopic = mode.tags.some(t => mapArenaTagToTopic(t) !== null);
            if (mode.templateId !== 'prediction' && mode.templateId !== 'closest_guess' && !hasPredictionTopic) return null;
            const cryptoTags = mode.tags.map(t => t.toLowerCase());
            const matchedEvent = PREDICTION_EVENTS.find(ev =>
              cryptoTags.some(tag =>
                ev.category.toLowerCase().includes(tag) ||
                ev.tags?.some(et => et.toLowerCase().includes(tag))
              )
            ) || PREDICTION_EVENTS[0];
            const yesOutcome = matchedEvent.outcomes.find(o => o.label === 'Yes');
            return (
              <div>
                <PredictionContextCard
                  eventTitle={matchedEvent.title}
                  probability={yesOutcome?.chance ?? 50}
                  outcomeName="Yes"
                  eventId={matchedEvent.id}
                />
              </div>
            );
          })()}

        </PageContent>
      )}

      {/* Trust Breakdown Sheet */}
      {mode && (
        <TrustBreakdownSheet
          open={trustSheetOpen}
          onClose={() => setTrustSheetOpen(false)}
          data={buildTrustBreakdownFromCreator(mode.creator)}
        />
      )}
    </PullToRefresh>
  );
}