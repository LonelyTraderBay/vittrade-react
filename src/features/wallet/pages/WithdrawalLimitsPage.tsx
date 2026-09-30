import { useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useWalletAssetsQuery, useWalletWithdrawalNetworksQuery } from '../model/wallet-queries';
import { formatAmount } from '../model/wallet-history';

export function WithdrawalLimitsPage() {
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canReadWallet = hasPermission('wallet:read');
  const [selectedAsset, setSelectedAsset] = useState<string>();
  const assetsQuery = useWalletAssetsQuery(canReadWallet);
  const asset = selectedAsset ?? assetsQuery.data?.items[0]?.symbol;
  const networksQuery = useWalletWithdrawalNetworksQuery(asset, canReadWallet);

  return (
    <PageLayout>
      <Header title="Withdrawal limits" subtitle="Wallet · Network policies" back />
      <PageContent gap="default">
        {!canReadWallet ? (
          <p role="alert" style={{ color: colors.error }}>
            Wallet read permission is required to view withdrawal policies.
          </p>
        ) : assetsQuery.isPending ? (
          <p style={{ color: colors.text2 }}>Loading wallet assets…</p>
        ) : assetsQuery.isError || !assetsQuery.data ? (
          <ErrorState onAction={() => void assetsQuery.refetch()} />
        ) : assetsQuery.data.items.length === 0 ? (
          <TrCard className="p-4">
            <p style={{ color: colors.text2 }}>No wallet assets are available.</p>
          </TrCard>
        ) : (
          <>
            <label className="flex flex-col gap-2" style={{ color: colors.text2, fontSize: 13 }}>
              Asset
              <select
                aria-label="Withdrawal asset"
                value={asset}
                onChange={(event) => setSelectedAsset(event.target.value)}
                className="rounded-lg px-3 py-2"
                style={{ background: colors.surface2, color: colors.text1 }}
              >
                {assetsQuery.data.items.map((item) => (
                  <option key={item.id} value={item.symbol}>
                    {item.symbol}
                  </option>
                ))}
              </select>
            </label>
            {networksQuery.isPending ? (
              <p style={{ color: colors.text2 }}>Loading withdrawal network policies…</p>
            ) : networksQuery.isError || !networksQuery.data ? (
              <ErrorState onAction={() => void networksQuery.refetch()} />
            ) : networksQuery.data.length === 0 ? (
              <TrCard className="p-4">
                <p style={{ color: colors.text2 }}>
                  No withdrawal networks are available for {asset}.
                </p>
              </TrCard>
            ) : (
              <div className="flex flex-col gap-2">
                {networksQuery.data.map((network) => (
                  <TrCard key={network.id} className="p-4">
                    <h2 style={{ color: colors.text1, fontWeight: 700 }}>{network.name}</h2>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <PolicyValue
                        label="Minimum withdrawal"
                        value={`${formatAmount(network.minWithdraw)} ${asset}`}
                        color={colors}
                      />
                      <PolicyValue
                        label="Maximum withdrawal"
                        value={`${formatAmount(network.maxWithdraw)} ${asset}`}
                        color={colors}
                      />
                      <PolicyValue
                        label="Network fee"
                        value={`${formatAmount(network.fee)} ${asset}`}
                        color={colors}
                      />
                      {network.requiresMemo && (
                        <PolicyValue
                          label="Memo required"
                          value={network.memoLabel ?? 'Yes'}
                          color={colors}
                        />
                      )}
                    </dl>
                  </TrCard>
                ))}
              </div>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function PolicyValue({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div>
      <dt style={{ color: color.text3 }}>{label}</dt>
      <dd style={{ color: color.text1, fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
