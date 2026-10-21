import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { FilterButton } from '@/shared/ui/FilterButton';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { P2PDisputeStatus } from '../model/p2p-types';
import { useP2PDisputesQuery } from '../model/p2p-dispute-queries';

const STATUS_MAP: Record<
  P2PDisputeStatus,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  submitted: {
    label: 'Đã gửi',
    color: 'var(--tr-warning-text)',
    bg: 'rgba(245,158,11,0.12)',
    icon: Clock,
  },
  under_review: {
    label: 'Đang xem xét',
    color: 'var(--tr-info-text)',
    bg: 'rgba(59,130,246,0.12)',
    icon: FileText,
  },
  resolved: {
    label: 'Đã giải quyết',
    color: 'var(--tr-success-text)',
    bg: 'rgba(16,185,129,0.12)',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Bị từ chối',
    color: 'var(--tr-error-text)',
    bg: 'rgba(239,68,68,0.12)',
    icon: AlertTriangle,
  },
};

export function P2PDisputesPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [filter, setFilter] = useState<'all' | P2PDisputeStatus>('all');
  const query = useP2PDisputesQuery(filter === 'all' ? {} : { status: filter });
  const disputes = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const activeCount = useMemo(
    () => disputes.filter((dispute) => !['resolved', 'rejected'].includes(dispute.status)).length,
    [disputes],
  );

  return (
    <PageLayout>
      <Header title="Tranh chấp P2P" subtitle="Compliance · P2P" back />
      <PageContent gap="default">
        <div role="group" aria-label="Lọc trạng thái tranh chấp" className="flex flex-wrap gap-2">
          {(['all', 'submitted', 'under_review', 'resolved', 'rejected'] as const).map((value) => (
            <FilterButton
              key={value}
              selected={filter === value}
              label={value === 'all' ? 'Tất cả' : STATUS_MAP[value].label}
              onClick={() => setFilter(value)}
            />
          ))}
        </div>

        <div
          className="flex items-start gap-2.5 p-3 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <ShieldCheck size={16} color="var(--tr-link)" className="shrink-0 mt-0.5" />
          <p style={{ color: colors.text2, fontSize: 11, lineHeight: 1.5 }}>
            Theo dõi tiến trình xử lý, bằng chứng và cấp hỗ trợ trong chi tiết tranh chấp.
          </p>
        </div>

        <div
          role="region"
          aria-label="Kết quả tranh chấp P2P"
          aria-busy={query.isFetching}
          className="flex flex-col gap-4"
        >
          {query.isPending ? (
            <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
              Đang tải tranh chấp…
            </p>
          ) : query.isError ? (
            <div role="alert">
              <ErrorState
                title="Không thể tải tranh chấp P2P"
                message="Dữ liệu hiện chưa khả dụng. Hãy thử lại hoặc chọn bộ lọc khác."
                actionLabel="Thử lại"
                onAction={() => void query.refetch()}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {/* Successful responses have passed disputesResponseSchema, which requires total. */}
                <SummaryCard
                  icon={<Scale size={16} color="var(--tr-error-text)" />}
                  value={query.data!.total}
                  label="Tổng cộng"
                  color={colors.text1}
                />
                <SummaryCard
                  icon={<Clock size={16} color="var(--tr-warning-text)" />}
                  value={activeCount}
                  label="Đang xử lý"
                  color="var(--tr-warning-text)"
                />
                <SummaryCard
                  icon={<CheckCircle size={16} color="var(--tr-success-text)" />}
                  value={disputes.filter((d) => d.status === 'resolved').length}
                  label="Đã giải quyết"
                  color="var(--tr-success-text)"
                />
              </div>
              {disputes.length === 0 ? (
                <TrCard
                  className="p-8 flex flex-col items-center gap-2"
                  role="status"
                  aria-label="No P2P disputes"
                >
                  <ShieldCheck size={32} color={colors.text3} />
                  <p style={{ color: colors.text2, fontSize: 13 }}>Chưa có tranh chấp nào</p>
                </TrCard>
              ) : (
                <div className="flex flex-col gap-3">
                  {disputes.map((dispute) => {
                    const status = STATUS_MAP[dispute.status];
                    const StatusIcon = status.icon;
                    return (
                      <TrCard
                        key={dispute.id}
                        as="button"
                        aria-label={`Open dispute ${dispute.orderNumber}`}
                        hover
                        className="p-4 w-full text-left"
                        onClick={() => {
                          hapticSelection();
                          navigate(
                            `${prefix}/p2p/dispute/detail/${encodeURIComponent(dispute.id)}`,
                          );
                        }}
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: status.bg }}
                            >
                              <StatusIcon size={18} color={status.color} />
                            </div>
                            <div>
                              <p style={{ color: colors.text1, fontSize: 13, fontWeight: 600 }}>
                                #{dispute.orderNumber.slice(-6)}
                              </p>
                              <p style={{ color: colors.text3, fontSize: 10, marginTop: 1 }}>
                                {dispute.createdAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="px-2 py-1 rounded-lg"
                              style={{
                                background: status.bg,
                                color: status.color,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {status.label}
                            </span>
                            <ChevronRight size={14} color={colors.text3} />
                          </div>
                        </div>
                        <p
                          className="line-clamp-2"
                          style={{
                            color: colors.text2,
                            fontSize: 12,
                            lineHeight: 1.5,
                            marginBottom: 8,
                          }}
                        >
                          {dispute.reason}
                        </p>
                        <div className="flex items-center gap-4">
                          <span style={{ color: colors.text3, fontSize: 10 }}>
                            {dispute.evidence.length} bằng chứng
                          </span>
                          <span style={{ color: colors.text3, fontSize: 10 }}>
                            {dispute.timeline.length} sự kiện
                          </span>
                          <span style={{ color: colors.text3, fontSize: 10 }}>
                            Cấp {dispute.escalationLevel}/4
                          </span>
                        </div>
                      </TrCard>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard variant="inner" className="p-3 flex flex-col items-center gap-1">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}
      >
        {icon}
      </div>
      <span style={{ color, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
      <span style={{ color: colors.text3, fontSize: 10 }}>{label}</span>
    </TrCard>
  );
}
