/**
 * ══════════════════════════════════════════════════════════
 *  ArenaTrustBreakdownPage — /arena/trust/:entityId
 * ══════════════════════════════════════════════════════════
 *  07A: Full-page trust score breakdown.
 *  Accessible from ArenaCreatorPage, ArenaModeDetailPage,
 *  ArenaChallengeDetailPage when tapping trust score.
 *
 *  Shows: Fair Play, Completion Rate, Report Rate,
 *  Dispute Rate, Creator Reliability with explanations.
 *  No financial wording — purely community metrics.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertTriangle, ChevronRight, Shield } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TrCard } from '@/shared/ui/TrCard';
import { CTAButton } from '@/shared/ui/CTAButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { TrustBreakdownCard, SafetyBanner } from '@/dev/legacy/arena/components/ArenaGovernance';
import { φ } from '@/shared/lib/golden';
import { getCreatorById, getTrustMetrics } from '@/dev/mocks/arena-fixtures';

export function ArenaTrustBreakdownPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const creator = getCreatorById(entityId || '');

  if (!creator) {
    return (
      <PageLayout>
        <Header title="Trust Score" subtitle="Độ tin cậy · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Creator không tồn tại" />
      </PageLayout>
    );
  }

  const metrics = getTrustMetrics(creator);

  return (
    <PageLayout>
      <Header title="Trust Score" subtitle="Độ tin cậy · Open Arena" back />

      <PageContent gap="default">
        {/* Trust breakdown */}
        <TrustBreakdownCard
          metrics={metrics}
          overallScore={creator.trustScore}
          creatorName={creator.name}
        />

        {/* Creator profile link */}
        <TrCard
          hover
          as="button"
          onClick={() => {
            navigate(`${prefix}/arena/creator/${creator.id}`);
            hapticSelection();
          }}
          className="flex items-center gap-3 p-4 w-full active:opacity-70"
          style={{ minHeight: 52 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.surface2, fontSize: 20 }}
          >
            {creator.avatar}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{creator.name}</p>
            <div className="flex items-center gap-2">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Xem profile đầy đủ</span>
              {creator.fairPlayBadge && (
                <span
                  className="flex items-center gap-0.5"
                  style={{ color: '#10B981', fontSize: 10 }}
                >
                  <Shield size={8} /> Fair Play
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={16} color={c.text3} />
        </TrCard>

        {/* Safety link */}
        <SafetyBanner
          variant="safety"
          title="Trust Score giúp bạn đánh giá"
          description="Kiểm tra trust score trước khi tham gia challenge giúp đảm bảo trải nghiệm an toàn."
          onAction={() => {
            navigate(`${prefix}/arena/safety`);
            hapticSelection();
          }}
          actionLabel="Xem quy tắc an toàn"
        />

        <CTAButton onClick={() => navigate(-1)} variant="primary">
          Đóng
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}
