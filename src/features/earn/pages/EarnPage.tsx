import { useMemo, useRef, useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  useCreateEarnSubscriptionMutation,
  useEarnSnapshotQuery,
  useRedeemEarnPositionMutation,
} from '../model/earn-queries';
import type { EarnDomain, EarnPosition, EarnProduct, EarnProductType } from '../model/earn-types';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TabBar } from '@/shared/ui/TabBar';
import { ErrorState } from '@/shared/ui/ErrorState';
import { EmptyState } from '@/shared/ui/EmptyState';
import { CTAButton } from '@/shared/ui/CTAButton';
import { FilterButton } from '@/shared/ui/FilterButton';
import {
  EarnActionSheet,
  EarnEmptyPositions,
  EarnSuccessMessage,
  EarnSummaryCard,
  ProductCard,
  PositionCard,
} from '../components/EarnFeatureComponents';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { formatEarnActionError } from '../model/earn-error-message';

type EarnPageProps = { domain: EarnDomain };
const typeLabels: Record<EarnProductType | 'all', string> = {
  all: 'Tất cả',
  flexible: 'Linh hoạt',
  fixed: 'Cố định',
  defi: 'DeFi',
};

export function EarnPage({ domain }: EarnPageProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSuccess } = useHaptic();
  const { hasPermission } = useAuth();
  const canSubscribe = hasPermission('earn:write') || hasPermission('earn:subscribe');
  const canRedeem = hasPermission('earn:write') || hasPermission('earn:redeem');
  const [tab, setTab] = useState<'products' | 'positions'>('products');
  const [filter, setFilter] = useState<EarnProductType | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<EarnProduct>();
  const [selectedPosition, setSelectedPosition] = useState<EarnPosition>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const subscriptionKeys = useRef(new Map<string, string>());
  const redemptionKeys = useRef(new Map<string, string>());
  const actionInFlight = useRef(false);
  const resultsFocusRef = useRef<HTMLDivElement>(null);
  const snapshotQuery = useEarnSnapshotQuery({
    pausePolling: Boolean(selectedProduct || selectedPosition),
  });
  const subscribeMutation = useCreateEarnSubscriptionMutation();
  const redeemMutation = useRedeemEarnPositionMutation();
  const snapshot = snapshotQuery.data;
  const products = useMemo(
    () => (snapshot?.products ?? []).filter((product) => product.domain === domain),
    [domain, snapshot?.products],
  );
  const productIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const positions = useMemo(
    () => (snapshot?.positions ?? []).filter((position) => productIds.has(position.productId)),
    [productIds, snapshot?.positions],
  );
  const filteredProducts =
    filter === 'all' ? products : products.filter((product) => product.type === filter);
  const title = domain === 'savings' ? 'Tiết kiệm' : 'Staking & Earn';
  const readUnavailable = snapshotQuery.isPending || snapshotQuery.isError || !snapshot;

  const submitSubscription = async (amount: number) => {
    if (readUnavailable || !canSubscribe || !selectedProduct || actionInFlight.current) return;
    actionInFlight.current = true;
    const actionId = `${selectedProduct.id}:${amount}`;
    const key = subscriptionKeys.current.get(actionId) ?? crypto.randomUUID();
    subscriptionKeys.current.set(actionId, key);
    try {
      const receipt = await subscribeMutation.mutateAsync({
        request: { productId: selectedProduct.id, amount },
        idempotencyKey: `earn-subscribe-${key}`,
      });
      subscriptionKeys.current.delete(actionId);
      setSelectedProduct(undefined);
      if (receipt.status === 'pending') {
        navigate(`${prefix}/earn/${domain}/receipt`, { state: { receipt } });
        return;
      }
      setSuccessMessage('Đăng ký sản phẩm thành công.');
      hapticSuccess();
    } finally {
      actionInFlight.current = false;
    }
  };
  const submitRedemption = async (amount: number) => {
    if (readUnavailable || !canRedeem || !selectedPosition || actionInFlight.current) return;
    actionInFlight.current = true;
    const actionId = `${selectedPosition.id}:${amount}`;
    const key = redemptionKeys.current.get(actionId) ?? crypto.randomUUID();
    redemptionKeys.current.set(actionId, key);
    try {
      const receipt = await redeemMutation.mutateAsync({
        request: { positionId: selectedPosition.id, amount },
        idempotencyKey: `earn-redeem-${key}`,
      });
      redemptionKeys.current.delete(actionId);
      setSelectedPosition(undefined);
      if (receipt.status === 'pending') {
        navigate(`${prefix}/earn/${domain}/receipt`, { state: { receipt } });
        return;
      }
      setSuccessMessage('Yêu cầu rút vốn đã được ghi nhận.');
      hapticSuccess();
    } finally {
      actionInFlight.current = false;
    }
  };

  const readRecovery = readUnavailable ? (
    <div role="alert" className="flex flex-col gap-3">
      <p style={{ color: c.errorText, fontSize: 12 }}>
        Không thể đọc dữ liệu Earn. Tải lại dữ liệu trước khi xác nhận.
      </p>
      <CTAButton
        variant="secondary"
        loading={snapshotQuery.isFetching}
        onClick={() => void snapshotQuery.refetch()}
      >
        Thử lại
      </CTAButton>
    </div>
  ) : undefined;
  return (
    <PageLayout>
      <Header title={title} subtitle="Lợi suất theo sản phẩm" back />
      <PageContent padding="compact" gap="relaxed">
        {successMessage && (
          <EarnSuccessMessage
            message={successMessage}
            onClose={() => setSuccessMessage(undefined)}
          />
        )}
        {(!canSubscribe || !canRedeem) && (
          <p role="alert" style={{ color: c.text2, fontSize: 12 }}>
            Earn actions require the corresponding subscription or redemption permission.
          </p>
        )}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'products', label: 'Sản phẩm' },
            { id: 'positions', label: `Của tôi (${positions.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'products' && (
          <fieldset>
            <legend className="sr-only">Loại sản phẩm</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'all',
                  'fixed',
                  'flexible',
                  ...(domain === 'staking' ? ['defi' as const] : []),
                ] as const
              ).map((type) => (
                <FilterButton
                  key={type}
                  selected={filter === type}
                  label={typeLabels[type]}
                  onClick={() => setFilter(type)}
                />
              ))}
            </div>
          </fieldset>
        )}
        <div
          ref={resultsFocusRef}
          role="region"
          aria-label="Dữ liệu Earn"
          tabIndex={-1}
          className="flex min-w-0 flex-col gap-6 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--tr-primary)' }}
        >
          {snapshotQuery.isPending ? (
            <>
              <p role="status" style={{ color: c.text2 }}>
                Đang tải dữ liệu API…
              </p>
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  aria-hidden="true"
                  className="h-28 animate-pulse rounded-2xl"
                  style={{ background: c.surface2 }}
                />
              ))}
            </>
          ) : snapshotQuery.isError || !snapshot ? (
            <div role="alert">
              <ErrorState onAction={() => void snapshotQuery.refetch()} />
            </div>
          ) : (
            <>
              <EarnSummaryCard
                earned={snapshot.summary.totalEarnedUsd}
                active={snapshot.summary.activePositions}
                deposited={snapshot.summary.totalDepositedUsd}
                averageApy={snapshot.summary.averageApy}
              />
              {tab === 'products' ? (
                filteredProducts.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="Chưa có sản phẩm phù hợp"
                    subtitle="Chọn loại sản phẩm khác hoặc quay lại sau."
                  />
                ) : (
                  <div role="list" aria-label="Các sản phẩm Earn" className="flex flex-col gap-3">
                    {filteredProducts.map((product) => (
                      <div role="listitem" key={product.id}>
                        <ProductCard
                          product={product}
                          onSelect={() => setSelectedProduct(product)}
                          disabled={!canSubscribe}
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : positions.length === 0 ? (
                <EarnEmptyPositions onBrowse={() => setTab('products')} />
              ) : (
                <div role="list" aria-label="Các vị thế Earn" className="flex flex-col gap-3">
                  {positions.map((position) => (
                    <PositionCard
                      key={position.id}
                      role="listitem"
                      position={position}
                      onRedeem={() => setSelectedPosition(position)}
                      canRedeem={canRedeem}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <CTAButton
          variant="secondary"
          icon={domain === 'savings' ? Zap : RefreshCw}
          onClick={() => navigate(`${prefix}/earn/${domain === 'savings' ? 'staking' : 'savings'}`)}
        >
          {domain === 'savings' ? 'Khám phá Staking' : 'Khám phá Tiết kiệm'}
        </CTAButton>
      </PageContent>
      {selectedProduct && (
        <EarnActionSheet
          product={selectedProduct}
          balance={snapshot?.balances[selectedProduct.asset] ?? 0}
          pending={subscribeMutation.isPending}
          submitDisabled={readUnavailable}
          fallbackFocusRef={resultsFocusRef}
          recovery={readRecovery}
          error={
            subscribeMutation.error ? formatEarnActionError(subscribeMutation.error) : undefined
          }
          onClose={() => {
            setSelectedProduct(undefined);
            subscribeMutation.reset();
          }}
          onSubmit={(amount) => {
            void submitSubscription(amount).catch(() => undefined);
          }}
        />
      )}
      {selectedPosition && (
        <EarnActionSheet
          position={selectedPosition}
          balance={selectedPosition.amount}
          pending={redeemMutation.isPending}
          submitDisabled={readUnavailable}
          fallbackFocusRef={resultsFocusRef}
          recovery={readRecovery}
          error={redeemMutation.error ? formatEarnActionError(redeemMutation.error) : undefined}
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

export function SavingsPage() {
  return <EarnPage domain="savings" />;
}
export function StakingPage() {
  return <EarnPage domain="staking" />;
}
