import { useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/shared/session/useAuth';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import {
  EarnActionSheet,
  EarnSuccessMessage,
  PositionCard,
} from '../components/EarnFeatureComponents';
import { useEarnSnapshotQuery, useRedeemEarnPositionMutation } from '../model/earn-queries';
import type { EarnPosition } from '../model/earn-types';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

function PortfolioLoadingState() {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title="Danh mục tiết kiệm" subtitle="Các vị thế Earn của bạn" back />
      <PageContent gap="relaxed">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-3xl"
            style={{ background: colors.surface2 }}
          />
        ))}
      </PageContent>
    </PageLayout>
  );
}

export function SavingsPortfolioPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const { hapticSuccess } = useHaptic();
  const canRedeem = hasPermission('earn:write') || hasPermission('earn:redeem');
  const snapshotQuery = useEarnSnapshotQuery();
  const redeemMutation = useRedeemEarnPositionMutation();
  const [selectedPosition, setSelectedPosition] = useState<EarnPosition>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const positions =
    snapshotQuery.data?.positions.filter((position) =>
      snapshotQuery.data.products.some(
        (product) => product.id === position.productId && product.domain === 'savings',
      ),
    ) ?? [];

  if (snapshotQuery.isPending) return <PortfolioLoadingState />;
  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <PageLayout>
        <Header title="Danh mục tiết kiệm" subtitle="Các vị thế Earn của bạn" back />
        <ErrorState onAction={() => void snapshotQuery.refetch()} />
      </PageLayout>
    );
  }

  const submitRedemption = async (amount: number) => {
    if (!canRedeem || !selectedPosition) return;
    await redeemMutation.mutateAsync({
      request: { positionId: selectedPosition.id, amount },
      idempotencyKey: crypto.randomUUID(),
    });
    setSelectedPosition(undefined);
    setSuccessMessage('Yêu cầu rút vốn đã được ghi nhận.');
    hapticSuccess();
  };

  return (
    <PageLayout>
      <Header title="Danh mục tiết kiệm" subtitle="Các vị thế Earn của bạn" back />
      <PageContent gap="relaxed">
        {successMessage && (
          <EarnSuccessMessage
            message={successMessage}
            onClose={() => setSuccessMessage(undefined)}
          />
        )}
        {!canRedeem && (
          <p role="alert" className="text-xs text-amber-500">
            Earn redemption permission is required to withdraw a flexible position.
          </p>
        )}
        {positions.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Chưa có vị thế tiết kiệm"
            subtitle="Các vị thế tiết kiệm sẽ xuất hiện tại đây sau khi đăng ký sản phẩm."
            ctaLabel="Xem sản phẩm"
            onCta={() => navigate(`${prefix}/earn/savings`)}
          />
        ) : (
          <div className="flex flex-col gap-3" aria-label="Các vị thế tiết kiệm">
            {positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onRedeem={() => {
                  if (canRedeem) setSelectedPosition(position);
                }}
                canRedeem={canRedeem}
              />
            ))}
          </div>
        )}
      </PageContent>
      {selectedPosition && (
        <EarnActionSheet
          position={selectedPosition}
          balance={selectedPosition.amount}
          pending={redeemMutation.isPending}
          error={redeemMutation.error instanceof Error ? redeemMutation.error.message : undefined}
          onClose={() => {
            setSelectedPosition(undefined);
            redeemMutation.reset();
          }}
          onSubmit={(amount) => {
            void submitRedemption(amount).catch(() => undefined);
          }}
        />
      )}
    </PageLayout>
  );
}
