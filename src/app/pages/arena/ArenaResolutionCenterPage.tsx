/**
 * ══════════════════════════════════════════════════════════
 *  ArenaResolutionCenterPage — /arena/challenge/:challengeId/resolution
 * ══════════════════════════════════════════════════════════
 *  07B: Chốt kết quả challenge.
 *  Most important page in resolution flow.
 *  Shows: method, evidence, result proposal, timeline, CTA by state.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Shield, Info, Camera, Link2, Image, Video,
  Users, Trophy, XCircle, RefreshCw,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/states/EmptyState';
import { ModerationTimelineRow } from '../../components/arena/ArenaGovernance';
import { ResultReceiptSheet, buildReceiptFromResolution } from '../../components/arena/ArenaResultReceipt';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  getChallengeById, getResolutionByChallengeId, fmtPoints,
  RESOLUTION_METHOD_CONFIG, RESOLUTION_STATUS_CONFIG,
  type ArenaResolution, type ResolutionStatus,
} from '../../data/arenaData';

/* ─── Evidence icon mapping ─── */
const EVIDENCE_ICONS: Record<string, typeof Camera> = {
  screenshot: Image,
  link: Link2,
  photo: Camera,
  video: Video,
};

/* ─── Resolution Status Chip ─── */
function ResolutionStatusChip({ status }: { status: ResolutionStatus }) {
  const cfg = RESOLUTION_STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
      style={{ background: cfg.bg, color: cfg.color, fontSize: φ.xs, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

export function ArenaResolutionCenterPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const challenge = getChallengeById(challengeId || '');
  const resolution = getResolutionByChallengeId(challengeId || '');
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (!challenge || !resolution) {
    return (
      <PageLayout>
        <Header title="Chốt kết quả" subtitle="Resolution · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Challenge không tồn tại hoặc đã bị xoá" />
      </PageLayout>
    );
  }

  const methodCfg = RESOLUTION_METHOD_CONFIG[resolution.method];
  const isSettled = resolution.status === 'settled';
  const isDisputed = resolution.status === 'disputed';

  const handlePrimaryCTA = () => {
    hapticSuccess();
    if (resolution.status === 'proposed') {
      actionToast.success(TOAST.ARENA.RESULT_CONFIRMED_V2);
    } else if (resolution.status === 'pending' || resolution.status === 'evidence_submitted') {
      actionToast.success(TOAST.ARENA.EVIDENCE_UPLOADED);
    } else {
      actionToast.success(TOAST.ARENA.RESULT_SUBMITTED);
    }
  };

  const ctaLabel = (() => {
    switch (resolution.status) {
      case 'pending': return 'Nộp bằng chứng';
      case 'evidence_submitted': return 'Gửi kết quả';
      case 'proposed': return 'Xác nhận kết quả';
      case 'confirmed':
      case 'settled': return 'Đã chốt';
      case 'disputed': return 'Chờ xử lý';
      default: return 'Đóng';
    }
  })();

  const ctaDisabled = isSettled || isDisputed || resolution.status === 'confirmed';

  return (
    <PageLayout>
      <Header title="Chốt kết quả" subtitle="Resolution · Open Arena" back />

      <PageContent gap="default">

        {/* ─── Challenge Summary ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <ResolutionStatusChip status={resolution.status} />
            <span style={{ color: c.text3, fontSize: φ.xs, fontFamily: 'monospace' }}>
              #{challenge.id.toUpperCase()}
            </span>
          </div>
          <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
            {challenge.title}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <Users size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: φ.xs }}>{challenge.slotsFilled}/{challenge.slotsTotal}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={12} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{fmtPoints(challenge.prizePool)} pts</span>
            </div>
          </div>
        </TrCard>

        {/* ─── Resolution Method ─── */}
        <div>
          <SectionHeader title="Phương thức chốt" accent accentColor={methodCfg.color} mb={8} />
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(methodCfg.color, 12), fontSize: 20 }}>
                {methodCfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  {methodCfg.label}
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                  {methodCfg.desc}
                </p>
              </div>
            </div>

            {/* Method-specific details */}
            {resolution.method === 'auto' && resolution.source && (
              <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Nguồn dữ liệu</span>
                  <span className="px-2 py-0.5 rounded-md"
                    style={{
                      background: resolution.syncStatus === 'synced' ? 'rgba(16,185,129,0.12)' : resolution.syncStatus === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: resolution.syncStatus === 'synced' ? '#10B981' : resolution.syncStatus === 'error' ? '#EF4444' : '#F59E0B',
                      fontSize: 10, fontWeight: 600,
                    }}>
                    {resolution.syncStatus === 'synced' ? 'Đã đồng bộ' : resolution.syncStatus === 'error' ? 'Lỗi' : 'Chờ đồng bộ'}
                  </span>
                </div>
                <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5 }}>{resolution.source}</p>
              </div>
            )}

            {resolution.method === 'mutual_confirm' && resolution.confirmations && (
              <div className="pt-3 mt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                {resolution.confirmations.map(conf => (
                  <div key={conf.name} className="flex items-center gap-3">
                    <span style={{ fontSize: 16 }}>{conf.avatar}</span>
                    <span className="flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{conf.name}</span>
                    {conf.confirmed ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                        <CheckCircle2 size={10} /> Đã xác nhận
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(148,163,184,0.12)', color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>
                        <Clock size={10} /> Chờ xác nhận
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {resolution.method === 'referee' && resolution.refereeName && (
              <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Trọng tài</span>
                  <button
                    onClick={() => { navigate(`${prefix}/arena/creator/${resolution.refereeId}`); hapticSelection(); }}
                    className="flex items-center gap-1 active:opacity-70"
                    style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}>
                    {resolution.refereeName} <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            )}

            {resolution.method === 'community_vote' && (
              <div className="pt-3 mt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Phiếu bầu</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
                    {resolution.currentVotes || 0}/{resolution.minVotes || 0}
                  </span>
                </div>
                {resolution.voteDeadline && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Hạn bỏ phiếu</span>
                    <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                      {new Date(resolution.voteDeadline).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                {resolution.currentVotes !== undefined && resolution.minVotes !== undefined && (
                  <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, (resolution.currentVotes / resolution.minVotes) * 100)}%`,
                      background: resolution.currentVotes >= resolution.minVotes ? '#10B981' : '#F59E0B',
                    }} />
                  </div>
                )}
              </div>
            )}
          </TrCard>
        </div>

        {/* ─── Evidence Section ─── */}
        <div>
          <SectionHeader title="Bằng chứng" accent accentColor="#3B82F6" mb={8} />
          <TrCard className="p-4">
            <div className="flex flex-col gap-2.5">
              {resolution.evidence.map((ev, i) => {
                const Icon = EVIDENCE_ICONS[ev.type] || Camera;
                return (
                  <div key={i} className="flex items-center gap-3" style={{ minHeight: 44 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: ev.submitted ? 'rgba(16,185,129,0.12)' : c.surface2 }}>
                      <Icon size={16} color={ev.submitted ? '#10B981' : c.text3} />
                    </div>
                    <span className="flex-1" style={{ color: c.text1, fontSize: φ.sm }}>{ev.label}</span>
                    {ev.submitted ? (
                      <CheckCircle2 size={16} color="#10B981" />
                    ) : (
                      <span style={{ color: c.text3, fontSize: φ.xs }}>Chưa nộp</span>
                    )}
                  </div>
                );
              })}
            </div>
          </TrCard>
        </div>

        {/* ─── Result Proposal ─── */}
        {resolution.resultProposal && (
          <div>
            <SectionHeader title="Đề xuất kết quả" accent accentColor="#F59E0B" mb={8} />
            <TrCard className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Người thắng</span>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 14 }}>{resolution.resultProposal.winnerAvatar}</span>
                    <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>
                      {resolution.resultProposal.winner}
                    </span>
                  </div>
                </div>
                {resolution.resultProposal.loser && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Người thua</span>
                    <span style={{ color: c.text2, fontSize: φ.sm }}>{resolution.resultProposal.loser}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Phân phối pool</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                    {resolution.resultProposal.poolDistribution}
                  </span>
                </div>
                <div className="pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Quy tắc void</p>
                      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.4 }}>
                        {resolution.resultProposal.voidRule}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* ─── Disputed banner ─── */}
        {isDisputed && (
          <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(239,68,68,0.3)">
            <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: '#EF4444', fontSize: φ.xs, lineHeight: 1.5 }}>
              Challenge này đang có tranh chấp. Đội ngũ kiểm duyệt đang xem xét. Điểm sẽ được giữ cho đến khi có kết luận.
            </p>
          </TrCard>
        )}

        {/* ─── Timeline ─── */}
        <div>
          <SectionHeader title="Tiến trình" accent accentColor="#10B981" mb={8} />
          <TrCard className="p-4">
            {resolution.timeline.map((step, i) => (
              <ModerationTimelineRow
                key={i}
                label={step.label}
                date={step.date}
                done={step.done}
                isLast={i === resolution.timeline.length - 1}
              />
            ))}
          </TrCard>
        </div>

        {/* ─── Settlement Receipt (if settled) ─── */}
        {isSettled && resolution.resultProposal && (
          <TrCard className="p-4" accentBorder="rgba(16,185,129,0.25)">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Đã chốt & phân phối</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Challenge</span>
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate max-w-[200px]">{challenge.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Kết quả</span>
                <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>{resolution.resultProposal.winner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Pool điểm</span>
                <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace' }}>{fmtPoints(challenge.prizePool)} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Thời gian chốt</span>
                <span style={{ color: c.text1, fontSize: φ.xs }}>{resolution.timeline[resolution.timeline.length - 1]?.date || '—'}</span>
              </div>
            </div>
            <button
              onClick={() => { navigate(`${prefix}/arena/ledger`); hapticSelection(); }}
              className="flex items-center gap-1 mt-3 active:opacity-70"
              style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}>
              Xem lịch sử điểm <ChevronRight size={10} />
            </button>
            <button
              onClick={() => { setReceiptOpen(true); hapticSelection(); }}
              className="flex items-center gap-1 mt-1 active:opacity-70"
              style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}>
              Xem biên nhận đầy đủ <ChevronRight size={10} />
            </button>
          </TrCard>
        )}

        {/* ─── Points disclaimer ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Info size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Mọi thay đổi điểm đều được ghi lại đầy đủ trong lịch sử Arena Points. Arena Points không phải tài sản tài chính.
          </p>
        </TrCard>

        {/* ─── CTA ─── */}
        <div className="flex flex-col gap-3">
          <CTAButton onClick={handlePrimaryCTA} disabled={ctaDisabled}>
            {ctaLabel}
          </CTAButton>
          <button
            onClick={() => { navigate(`${prefix}/arena/challenge/${challengeId}`); hapticSelection(); }}
            className="w-full py-3 rounded-2xl active:opacity-70"
            style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}>
            Quay lại challenge
          </button>
        </div>

      </PageContent>

      {/* ─── Result Receipt Sheet ─── */}
      {isSettled && (() => {
        const receiptData = buildReceiptFromResolution(challenge, resolution, methodCfg?.label || 'Tự động');
        return (
          <ResultReceiptSheet
            open={receiptOpen}
            onClose={() => setReceiptOpen(false)}
            data={receiptData}
            onViewChallenge={() => navigate(`${prefix}/arena/challenge/${challengeId}`)}
            onViewLedger={() => navigate(`${prefix}/arena/ledger`)}
          />
        );
      })()}
    </PageLayout>
  );
}