/**
 * ══════════════════════════════════════════════════════════
 *  ArenaPointsEntryDetailPage — /arena/points/:entryId
 * ══════════════════════════════════════════════════════════
 *  07B: Chi tiết một bản ghi điểm Arena Points.
 *  Shows: amount, type, status, linked challenge, balance before/after,
 *  internal reference ID, timestamps.
 *  CTA: Xem challenge / Liên hệ hỗ trợ.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle, ChevronRight, Shield, Info,
  Copy, CheckCircle2, Clock, HelpCircle,
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
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import {
  getLedgerEntryById, LEDGER_TYPE_CONFIG, fmtPoints,
} from '../../data/arenaData';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Hoàn tất', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  pending: { label: 'Đang xử lý', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  reversed: { label: 'Đã hoàn', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export function ArenaPointsEntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const entry = getLedgerEntryById(entryId || '');

  if (!entry) {
    return (
      <PageLayout>
        <Header title="Chi tiết giao dịch điểm" subtitle="Arena Points · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Giao dịch điểm không tồn tại" />
      </PageLayout>
    );
  }

  const typeCfg = LEDGER_TYPE_CONFIG[entry.type];
  const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.completed;

  const handleCopyRef = () => {
    hapticSelection();
    actionToast.success(TOAST.COPY.withLabel('mã tham chiếu'));
  };

  return (
    <PageLayout>
      <Header title="Chi tiết giao dịch điểm" subtitle="Arena Points · Open Arena" back />

      <PageContent gap="default">

        {/* ─── Amount Hero ─── */}
        <TrCard className="p-5 text-center">
          <p style={{
            color: entry.amount > 0 ? '#10B981' : entry.amount < 0 ? '#EF4444' : c.text1,
            fontSize: 36, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.2,
          }}>
            {entry.amount > 0 ? '+' : ''}{entry.amount === 0 ? '0' : fmtPoints(Math.abs(entry.amount))}
            <span style={{ fontSize: φ.base, fontWeight: 400, marginLeft: 4 }}>pts</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg"
              style={{ background: typeCfg.bg, color: typeCfg.color, fontSize: φ.xs, fontWeight: 600 }}>
              {typeCfg.label}
            </span>
            <span className="px-2.5 py-1 rounded-lg"
              style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: φ.xs, fontWeight: 600 }}>
              {statusCfg.label}
            </span>
          </div>
        </TrCard>

        {/* ─── Details ─── */}
        <div>
          <SectionHeader title="Chi tiết" accent accentColor="#8B5CF6" mb={8} />
          <TrCard className="p-4">
            <div className="flex flex-col gap-3">
              {entry.note && (
                <div className="flex items-start justify-between gap-3">
                  <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 90 }}>Mô tả</span>
                  <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                    {entry.note}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Mã lý do</span>
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                  {entry.reasonCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Thời gian</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{entry.time}</span>
              </div>
              {entry.linkedChallengeName && (
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Challenge liên quan</span>
                  <button
                    onClick={() => { navigate(`${prefix}/arena/challenge/${entry.linkedChallengeId}`); hapticSelection(); }}
                    className="flex items-center gap-1 active:opacity-70"
                    style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}>
                    <span className="truncate max-w-[160px]">{entry.linkedChallengeName}</span>
                    <ChevronRight size={10} />
                  </button>
                </div>
              )}
              {entry.linkedModeName && (
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Mode liên quan</span>
                  <button
                    onClick={() => { navigate(`${prefix}/arena/mode/${entry.linkedModeId}`); hapticSelection(); }}
                    className="flex items-center gap-1 active:opacity-70"
                    style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600, minHeight: 28 }}>
                    <span className="truncate max-w-[160px]">{entry.linkedModeName}</span>
                    <ChevronRight size={10} />
                  </button>
                </div>
              )}
            </div>
          </TrCard>
        </div>

        {/* ─── Balance ─── */}
        <div>
          <SectionHeader title="Biến động số dư" accent accentColor="#10B981" mb={8} />
          <TrCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center flex-1">
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Trước</p>
                <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtPoints(entry.balanceBefore)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: entry.amount >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                <span style={{ color: entry.amount >= 0 ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 700 }}>
                  →
                </span>
              </div>
              <div className="text-center flex-1">
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Sau</p>
                <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtPoints(entry.balanceAfter)}
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* ─── Reference ID ─── */}
        <div>
          <SectionHeader title="Mã tham chiếu" accent accentColor="#6B7280" mb={8} />
          <TrCard className="p-4">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: φ.xs, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {entry.refId}
              </span>
              <button
                onClick={handleCopyRef}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 ml-3 active:opacity-70"
                style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, minHeight: 36 }}>
                <Copy size={12} color={c.chipText} />
                <span style={{ color: c.chipText, fontSize: 10, fontWeight: 600 }}>Sao chép</span>
              </button>
            </div>
          </TrCard>
        </div>

        {/* ─── Audit notice ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Shield size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Bản ghi này được hệ thống tạo tự động và không thể chỉnh sửa. Nếu bạn phát hiện sai sót, vui lòng liên hệ hỗ trợ.
          </p>
        </TrCard>

        {/* ─── CTAs ─── */}
        <div className="flex flex-col gap-3">
          {entry.linkedChallengeId && (
            <CTAButton onClick={() => { navigate(`${prefix}/arena/challenge/${entry.linkedChallengeId}`); hapticSelection(); }}>
              Xem challenge
            </CTAButton>
          )}
          <button
            onClick={() => { actionToast.success('Đã mở trang hỗ trợ'); hapticSelection(); }}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:opacity-70"
            style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}>
            <HelpCircle size={14} />
            Liên hệ hỗ trợ
          </button>
        </div>

      </PageContent>
    </PageLayout>
  );
}
