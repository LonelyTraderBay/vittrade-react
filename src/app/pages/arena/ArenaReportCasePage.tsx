/**
 * ══════════════════════════════════════════════════════════
 *  ArenaReportCasePage — /profile/arena/reports/:caseId
 * ══════════════════════════════════════════════════════════
 *  07A: Chi tiết báo cáo vi phạm.
 *  Shows case status, timeline, reason, action taken, notes.
 *  CTA varies by state.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Flag, User, Trophy, AlertTriangle, ChevronRight,
  FileText, Shield, Info,
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
import { ReportStatusChip, ModerationTimelineRow } from '../../components/arena/ArenaGovernance';
import { AppealBanner, CaseActionCard } from '../../components/arena/ArenaModerationCases';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import {
  getReportCaseById, ARENA_REPORT_CASES,
  type ArenaReportCase,
} from '../../data/arenaData';

export function ArenaReportCasePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const reportCase = getReportCaseById(caseId || '');

  if (!reportCase) {
    return (
      <PageLayout>
        <Header title="Chi tiết báo cáo" subtitle="An toàn · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Báo cáo không tồn tại" />
      </PageLayout>
    );
  }

  const targetIcon = reportCase.targetType === 'challenge' ? Trophy : reportCase.targetType === 'mode' ? FileText : User;
  const targetLabel = reportCase.targetType === 'challenge' ? 'Challenge' : reportCase.targetType === 'mode' ? 'Mode' : 'Người dùng';

  const handlePrimaryCTA = () => {
    hapticSuccess();
    if (reportCase.status === 'appeal_open' || reportCase.status === 'action_taken') {
      actionToast.success(TOAST.ARENA.APPEAL_SUBMITTED);
    }
    navigate(-1);
  };

  const primaryCTALabel = (() => {
    switch (reportCase.status) {
      case 'submitted':
      case 'under_review':
        return 'Đóng';
      case 'action_taken':
        return reportCase.relatedChallenge ? 'Xem challenge' : 'Đóng';
      case 'closed':
        return 'Đóng';
      case 'appeal_open':
        return 'Mở khiếu nại';
      default:
        return 'Đóng';
    }
  })();

  const handleViewChallenge = () => {
    if (reportCase.relatedChallenge) {
      navigate(`${prefix}/arena/challenge/${reportCase.relatedChallenge}`);
      hapticSelection();
    }
  };

  return (
    <PageLayout>
      <Header title="Chi tiết báo cáo" subtitle="An toàn · Open Arena" back />

      <PageContent gap="default">

        {/* ─── Status + Case ID ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: c.text3, fontSize: φ.xs, fontFamily: 'monospace' }}>
              #{reportCase.id.toUpperCase()}
            </span>
            <ReportStatusChip status={reportCase.status} size="md" />
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <targetIcon size={18} color="#EF4444" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>
                {reportCase.targetName}
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                {targetLabel} · Báo cáo lúc {reportCase.createdAt}
              </p>
            </div>
          </div>
        </TrCard>

        {/* ─── Lý do ─── */}
        <div>
          <SectionHeader title="Lý do báo cáo" accent accentColor="#EF4444" mb={8} />
          <TrCard className="p-4 flex items-start gap-3">
            <Flag size={16} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
              {reportCase.reason}
            </p>
          </TrCard>
        </div>

        {/* ─── Timeline ─── */}
        <div>
          <SectionHeader title="Tiến trình xử lý" accent accentColor="#10B981" mb={8} />
          <TrCard className="p-4">
            {reportCase.timeline.map((step, i) => (
              <ModerationTimelineRow
                key={i}
                label={step.label}
                date={step.date}
                done={step.done}
                isLast={i === reportCase.timeline.length - 1}
              />
            ))}
          </TrCard>
        </div>

        {/* ─── Hành động đã thực hiện ─── */}
        {reportCase.actionTaken && (
          <div>
            <SectionHeader title="Hành động đã thực hiện" accent accentColor="#F59E0B" mb={8} />
            <CaseActionCard
              actionTaken={reportCase.actionTaken}
              systemNote={reportCase.systemNote}
              status={reportCase.status}
            />
          </div>
        )}

        {/* ─── Ghi chú hệ thống (only if no actionTaken, otherwise shown inside CaseActionCard) ─── */}
        {!reportCase.actionTaken && reportCase.systemNote && (
          <div>
            <SectionHeader title="Ghi chú hệ thống" accent accentColor="#6B7280" mb={8} />
            <TrCard className="p-4 flex items-start gap-3" accentBorder="rgba(107,114,128,0.2)">
              <Info size={14} color="#6B7280" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                {reportCase.systemNote}
              </p>
            </TrCard>
          </div>
        )}

        {/* ─── Related challenge link ─── */}
        {reportCase.relatedChallenge && (
          <TrCard
            hover as="button"
            onClick={handleViewChallenge}
            className="flex items-center gap-3 p-4 w-full active:opacity-70"
            style={{ minHeight: 52 }}
          >
            <Trophy size={16} color="#8B5CF6" />
            <span className="flex-1 text-left" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Xem challenge liên quan
            </span>
            <ChevronRight size={16} color={c.text3} />
          </TrCard>
        )}

        {/* ─── Appeal info banner ─── */}
        {reportCase.status === 'action_taken' && (
          <AppealBanner
            onAppeal={() => {
              hapticSuccess();
              actionToast.success(TOAST.ARENA.APPEAL_SUBMITTED);
            }}
            daysLeft={7}
          />
        )}

        {/* ─── View all reports link ─── */}
        <TrCard
          hover as="button"
          onClick={() => { navigate(`${prefix}/arena/my-reports`); hapticSelection(); }}
          className="flex items-center gap-3 p-4 w-full active:opacity-70"
          style={{ minHeight: 52 }}
        >
          <Flag size={16} color="#6B7280" />
          <span className="flex-1 text-left" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
            Xem tất cả báo cáo
          </span>
          <ChevronRight size={16} color={c.text3} />
        </TrCard>

        {/* ─── Other reports ─── */}
        <div className="flex flex-col gap-2">
          {ARENA_REPORT_CASES.filter(r => r.id !== reportCase.id).slice(0, 2).map(r => (
            <TrCard
              key={r.id}
              hover as="button"
              onClick={() => { navigate(`${prefix}/arena/report/${r.id}`); hapticSelection(); }}
              className="flex items-center gap-3 p-3.5 w-full active:opacity-70"
              style={{ minHeight: 48 }}
            >
              <div className="flex-1 min-w-0 text-left">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
                  {r.targetName} — {r.reason}
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>{r.createdAt}</p>
              </div>
              <ReportStatusChip status={r.status} />
            </TrCard>
          ))}
        </div>

        {/* ─── CTA ─── */}
        <CTAButton onClick={handlePrimaryCTA} variant="primary">
          {primaryCTALabel}
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}