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

  const submitSubscription = async (amount: number) => {
    if (!canSubscribe || !selectedProduct) return;
    const actionId = `${selectedProduct.id}:${amount}`;
    const key = subscriptionKeys.current.get(actionId) ?? crypto.randomUUID();
    subscriptionKeys.current.set(actionId, key);
    await subscribeMutation.mutateAsync({
      request: { productId: selectedProduct.id, amount },
      idempotencyKey: `earn-subscribe-${key}`,
    });
    subscriptionKeys.current.delete(actionId);
    setSelectedProduct(undefined);
    setSuccessMessage('Đăng ký sản phẩm thành công.');
    hapticSuccess();
  };
  const submitRedemption = async (amount: number) => {
    if (!canRedeem || !selectedPosition) return;
    const actionId = `${selectedPosition.id}:${amount}`;
    const key = redemptionKeys.current.get(actionId) ?? crypto.randomUUID();
    redemptionKeys.current.set(actionId, key);
    await redeemMutation.mutateAsync({
      request: { positionId: selectedPosition.id, amount },
      idempotencyKey: `earn-redeem-${key}`,
    });
    redemptionKeys.current.delete(actionId);
    setSelectedPosition(undefined);
    setSuccessMessage('Yêu cầu rút vốn đã được ghi nhận.');
    hapticSuccess();
  };

  if (snapshotQuery.isError && !snapshot)
    return (
      <PageLayout>
        <Header title={title} back />
        <ErrorState onAction={() => void snapshotQuery.refetch()} />
      </PageLayout>
    );
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
        <EarnSummaryCard
          earned={snapshot?.summary.totalEarnedUsd ?? 0}
          active={snapshot?.summary.activePositions ?? 0}
          deposited={snapshot?.summary.totalDepositedUsd ?? 0}
          averageApy={snapshot?.summary.averageApy ?? 0}
        />
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
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 overflow-x-auto">
              {(
                [
                  'all',
                  'fixed',
                  'flexible',
                  ...(domain === 'staking' ? ['defi' as const] : []),
                ] as const
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: filter === type ? c.chipActiveBg : c.chipBg,
                    color: filter === type ? c.chipActiveText : c.chipText,
                    border: `1px solid ${filter === type ? c.chipActiveBorder : c.chipBorder}`,
                  }}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
            {snapshotQuery.isPending ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-28 animate-pulse rounded-2xl"
                    style={{ background: c.surface2 }}
                  />
                ))}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => {
                    if (canSubscribe) setSelectedProduct(product);
                  }}
                  disabled={!canSubscribe}
                />
              ))
            )}
          </div>
        )}
        {tab === 'positions' &&
          (positions.length === 0 ? (
            <EarnEmptyPositions onBrowse={() => setTab('products')} />
          ) : (
            <div className="flex flex-col gap-3">
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
          ))}
        {domain === 'savings' && (
          <button
            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-500"
            onClick={() => navigate(`${prefix}/earn/staking`)}
          >
            <Zap size={16} />
            Khám phá Staking
          </button>
        )}
        {domain === 'staking' && (
          <button
            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-500"
            onClick={() => navigate(`${prefix}/earn/savings`)}
          >
            <RefreshCw size={16} />
            Khám phá Tiết kiệm
          </button>
        )}
      </PageContent>
      {selectedProduct && (
        <EarnActionSheet
          product={selectedProduct}
          balance={snapshot?.balances[selectedProduct.asset] ?? 0}
          pending={subscribeMutation.isPending}
          error={
            subscribeMutation.error instanceof Error ? subscribeMutation.error.message : undefined
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

export function SavingsPage() {
  return <EarnPage domain="savings" />;
}
export function StakingPage() {
  return <EarnPage domain="staking" />;
}
