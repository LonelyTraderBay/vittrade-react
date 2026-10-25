import { useRef, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/shared/session/useAuth';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { CTAButton } from '@/shared/ui/CTAButton';
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
import { formatEarnActionError } from '../model/earn-error-message';

function PortfolioLoadingState() {
  const colors = useThemeColors();
  return (
    <>
      <p role="status" style={{ color: colors.text2 }}>
        Đang tải dữ liệu API…
      </p>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="h-36 animate-pulse rounded-3xl"
          style={{ background: colors.surface2 }}
        />
      ))}
    </>
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
  const portfolioFocusRef = useRef<HTMLDivElement>(null);
  const redemptionInFlight = useRef(false);
  const redemptionKeys = useRef(new Map<string, string>());
  const positions =
    snapshotQuery.data?.positions.filter((position) =>
      snapshotQuery.data.products.some(
        (product) => product.id === position.productId && product.domain === 'savings',
      ),
    ) ?? [];

  const readUnavailable = snapshotQuery.isPending || snapshotQuery.isError || !snapshotQuery.data;

  const submitRedemption = async (amount: number) => {
    if (readUnavailable) return;
    if (
      !canRedeem ||
      !selectedPosition ||
      redemptionInFlight.current ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > selectedPosition.amount
    )
      return;
    redemptionInFlight.current = true;
    const actionId = `${selectedPosition.id}:${amount}`;
    const key = redemptionKeys.current.get(actionId) ?? crypto.randomUUID();
    redemptionKeys.current.set(actionId, key);
    try {
      const receipt = await redeemMutation.mutateAsync({
        request: { positionId: selectedPosition.id, amount },
        idempotencyKey: key,
      });
      redemptionKeys.current.delete(actionId);
      setSelectedPosition(undefined);
      if (receipt.status === 'pending') {
        navigate(`${prefix}/earn/savings/receipt`, { state: { receipt } });
        return;
      }
      setSuccessMessage('Yêu cầu rút vốn đã được ghi nhận.');
      hapticSuccess();
    } finally {
      redemptionInFlight.current = false;
    }
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
        <div
          ref={portfolioFocusRef}
          role="region"
          aria-label="Dữ liệu vị thế tiết kiệm"
          tabIndex={-1}
          className="flex min-w-0 flex-col gap-6 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--tr-primary)' }}
        >
          {snapshotQuery.isPending ? (
            <PortfolioLoadingState />
          ) : snapshotQuery.isError || !snapshotQuery.data ? (
            <div role="alert">
              <ErrorState onAction={() => void snapshotQuery.refetch()} />
            </div>
          ) : (
            <>
              {!canRedeem && (
                <p role="alert" className="text-xs" style={{ color: 'var(--tr-warning-text)' }}>
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
                <div role="list" className="flex flex-col gap-3" aria-label="Các vị thế tiết kiệm">
                  {positions.map((position) => (
                    <PositionCard
                      key={position.id}
                      position={position}
                      role="listitem"
                      onRedeem={() => {
                        if (canRedeem) setSelectedPosition(position);
                      }}
                      canRedeem={canRedeem}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PageContent>
      {selectedPosition && (
        <EarnActionSheet
          position={selectedPosition}
          balance={selectedPosition.amount}
          pending={redeemMutation.isPending}
          submitDisabled={readUnavailable}
          fallbackFocusRef={portfolioFocusRef}
          recovery={
            readUnavailable ? (
              <div role="alert" className="flex flex-col gap-3">
                <p style={{ color: 'var(--tr-error-text)', fontSize: 12 }}>
                  Không thể đọc dữ liệu vị thế. Tải lại dữ liệu trước khi xác nhận rút vốn.
                </p>
                <CTAButton
                  variant="secondary"
                  loading={snapshotQuery.isFetching}
                  onClick={() => void snapshotQuery.refetch()}
                >
                  Thử lại
                </CTAButton>
              </div>
            ) : undefined
          }
          error={
            redeemMutation.error instanceof Error
              ? formatEarnActionError(redeemMutation.error)
              : undefined
          }
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
