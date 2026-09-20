/**
 * ══════════════════════════════════════════════════════════
 *  MyArenaReportsPage — /profile/arena/reports
 * ══════════════════════════════════════════════════════════
 *  07C: List of all user's report cases with filter chips.
 *  User biết report xong thì chuyện gì xảy ra.
 *  Tone: rõ ràng, chuyên nghiệp.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Flag, AlertTriangle, Filter, Info,
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
import { EmptyState } from '../../components/states/EmptyState';
import { SkeletonCard, SkeletonRow } from '../../components/states/SkeletonBlock';
import { ReportCaseRow } from '../../components/arena/ArenaModerationCases';
import { SafetyBanner } from '../../components/arena/ArenaGovernance';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  ARENA_REPORT_CASES,
  type ReportCaseStatus,
} from '../../data/arenaData';

/* ─── Filter chip config ─── */
type FilterKey = 'all' | ReportCaseStatus;

const FILTER_CHIPS: { id: FilterKey; label: string; color: string }[] = [
  { id: 'all',          label: 'Tất cả',        color: '#6B7280' },
  { id: 'submitted',    label: 'Đã gửi',        color: '#3B82F6' },
  { id: 'under_review', label: 'Đang xem xét',  color: '#F59E0B' },
  { id: 'action_taken', label: 'Đã xử lý',      color: '#10B981' },
  { id: 'closed',       label: 'Đã đóng',       color: '#6B7280' },
  { id: 'appeal_open',  label: 'Khiếu nại',     color: '#EF4444' },
];

/* ─── Loading skeleton ─── */
function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-3">
      <SkeletonRow count={6} height={32} gap={8} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MyArenaReportsPage
   ═══════════════════════════════════════════ */

export function MyArenaReportsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredCases = filter === 'all'
    ? ARENA_REPORT_CASES
    : ARENA_REPORT_CASES.filter(r => r.status === filter);

  const statusCounts: Record<string, number> = {};
  ARENA_REPORT_CASES.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title="Báo cáo của tôi" subtitle="Báo cáo · Open Arena" back />

      {isLoading ? <ReportsSkeleton /> : (
        <PageContent padding="compact">

          {/* ─── Stats summary ─── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tổng cộng', value: ARENA_REPORT_CASES.length.toString(), color: '#6B7280' },
              { label: 'Đang xử lý', value: ((statusCounts.submitted || 0) + (statusCounts.under_review || 0)).toString(), color: '#F59E0B' },
              { label: 'Đã giải quyết', value: ((statusCounts.action_taken || 0) + (statusCounts.closed || 0)).toString(), color: '#10B981' },
            ].map(s => (
              <TrCard key={s.label} className="p-3 text-center">
                <p style={{ color: s.color, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
              </TrCard>
            ))}
          </div>

          {/* ─── Filter chips ─── */}
          <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 no-scrollbar">
            {FILTER_CHIPS.map(chip => {
              const active = filter === chip.id;
              const count = chip.id === 'all' ? ARENA_REPORT_CASES.length : (statusCounts[chip.id] || 0);
              return (
                <button
                  key={chip.id}
                  onClick={() => { setFilter(chip.id); hapticSelection(); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    color: active ? c.chipActiveText : c.chipText,
                    fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                  }}
                >
                  {chip.label}
                  {count > 0 && (
                    <span
                      className="ml-0.5 px-1.5 py-0.5 rounded-md"
                      style={{
                        background: active ? hexToRgba(chip.color, 20) : c.surface2,
                        color: active ? chip.color : c.text3,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Info banner ─── */}
          <div>
            <SafetyBanner
              variant="info"
              title="Về quy trình xử lý"
              description="Mỗi báo cáo được đội ngũ xem xét trong 24–72h. Bạn có thể theo dõi tiến trình ở đây."
            />
          </div>

          {/* ─── Case list ─── */}
          <div>
            {filteredCases.length === 0 ? (
              <EmptyState
                icon={Flag}
                title={filter === 'all' ? 'Chưa có báo cáo' : 'Không có kết quả'}
                subtitle={filter === 'all'
                  ? 'Bạn chưa gửi báo cáo vi phạm nào trong Open Arena.'
                  : `Không có báo cáo nào ở trạng thái "${FILTER_CHIPS.find(c => c.id === filter)?.label}".`
                }
              />
            ) : (
              <TrCard overflow>
                {filteredCases.map((reportCase, i) => (
                  <ReportCaseRow
                    key={reportCase.id}
                    id={reportCase.id}
                    targetName={reportCase.targetName}
                    targetType={reportCase.targetType}
                    reason={reportCase.reason}
                    createdAt={reportCase.createdAt}
                    updatedAt={reportCase.updatedAt}
                    status={reportCase.status}
                    onPress={() => { navigate(`${prefix}/profile/arena/reports/${reportCase.id}`); hapticSelection(); }}
                    isLast={i === filteredCases.length - 1}
                  />
                ))}
              </TrCard>
            )}
          </div>

          {/* ─── Footer info ─── */}
          {filteredCases.length > 0 && (
            <p style={{ color: c.text3, fontSize: φ.xs, textAlign: 'center' }}>
              {filteredCases.length} báo cáo{filter !== 'all' ? ` (${FILTER_CHIPS.find(c => c.id === filter)?.label})` : ''}
            </p>
          )}
        </PageContent>
      )}
    </PullToRefresh>
  );
}