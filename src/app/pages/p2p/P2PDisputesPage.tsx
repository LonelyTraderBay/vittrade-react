import React from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_DISPUTES } from '../../data/mockData';
import { φ } from '../../utils/golden';
import {
  AlertTriangle, Clock, CheckCircle, ShieldCheck,
  ChevronRight, Scale, FileText, Info,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   P2P Disputes List — Dedicated Dispute Management Page
   ═══════════════════════════════════════════════════════════ */

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Chờ xử lý', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  under_review: { label: 'Đang xem xét', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: FileText },
  resolved: { label: 'Đã giải quyết', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  escalated: { label: 'Đã leo thang', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertTriangle },
};

export function P2PDisputesPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const disputes = P2P_DISPUTES;
  const activeCount = disputes.filter(d => d.status !== 'resolved').length;
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length;

  return (
    <PageLayout>
      <Header title="Tranh chấp P2P" subtitle="Tranh chấp · P2P" back />

      <div className="flex-1 px-5 py-5 flex flex-col gap-4" style={{ paddingBottom: 40 }}>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard variant="inner" className="p-3 flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Scale size={16} color="#EF4444" />
            </div>
            <span style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {disputes.length}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>Tổng cộng</span>
          </TrCard>
          <TrCard variant="inner" className="p-3 flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Clock size={16} color="#F59E0B" />
            </div>
            <span style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {activeCount}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>Đang xử lý</span>
          </TrCard>
          <TrCard variant="inner" className="p-3 flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle size={16} color="#10B981" />
            </div>
            <span style={{ color: '#10B981', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {resolvedCount}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>Đã giải quyết</span>
          </TrCard>
        </div>

        {/* Safety Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <ShieldCheck size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Quy trình xử lý tranh chấp</p>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Mọi tranh chấp được xử lý qua hệ thống 4 cấp: AI tự động → Nhân viên hỗ trợ → Trọng tài → Ban giám đốc. Trung bình giải quyết trong 2-24 giờ.
            </p>
          </div>
        </div>

        {/* Disputes List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>Danh sách tranh chấp</p>
            {activeCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>{activeCount} đang xử lý</span>
              </div>
            )}
          </div>

          {disputes.length === 0 ? (
            <TrCard className="p-8 flex flex-col items-center gap-2">
              <ShieldCheck size={32} color={c.text3} />
              <p style={{ color: c.text2, fontSize: φ.sm }}>Chưa có tranh chấp nào</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Tất cả giao dịch P2P của bạn đều suôn sẻ</p>
            </TrCard>
          ) : (
            <div className="flex flex-col gap-3">
              {disputes.map(dispute => {
                const statusInfo = STATUS_MAP[dispute.status] || STATUS_MAP.pending;
                const StatusIcon = statusInfo.icon;
                return (
                  <TrCard
                    key={dispute.id}
                    as="button"
                    hover
                    className="p-4 w-full text-left"
                    onClick={() => {
                      hapticSelection();
                      navigate(`${prefix}/p2p/dispute/detail/${dispute.id}`);
                    }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: statusInfo.bg }}>
                          <StatusIcon size={18} color={statusInfo.color} />
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            #{dispute.orderNumber?.slice(-6) || dispute.orderId}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{dispute.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-1 rounded-lg"
                          style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: 10, fontWeight: 600 }}
                        >
                          {statusInfo.label}
                        </span>
                        <ChevronRight size={14} color={c.text3} />
                      </div>
                    </div>

                    {/* Reason */}
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }} className="line-clamp-2">
                      {dispute.reason}
                    </p>

                    {/* Evidence & Timeline */}
                    <div className="flex items-center gap-4">
                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText size={11} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{dispute.evidence.length} bằng chứng</span>
                        </div>
                      )}
                      {dispute.timeline && dispute.timeline.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{dispute.timeline.length} sự kiện</span>
                        </div>
                      )}
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}
        </div>

        {/* How to file dispute */}
        <TrCard variant="inner" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} color="#3B82F6" />
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Cách mở tranh chấp</p>
          </div>
          <ol className="flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'decimal' }}>
            {[
              'Vào đơn hàng đang có vấn đề',
              'Bấm "Mở tranh chấp" trong trang chi tiết đơn',
              'Mô tả vấn đề và đính kèm bằng chứng',
              'Chờ hệ thống xử lý (trung bình 2-24 giờ)',
            ].map((step, i) => (
              <li key={i} style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>{step}</li>
            ))}
          </ol>
        </TrCard>
      </div>
    </PageLayout>
  );
}