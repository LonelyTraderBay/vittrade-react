import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { usePendingDepositsQuery } from '../model/wallet-queries';
import { formatAmount } from '../model/wallet-history';

export function PendingDepositsPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const canReadWallet = hasPermission('wallet:read');
  const query = usePendingDepositsQuery(canReadWallet);
  const deposits = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageLayout>
      <Header title="Pending deposits" subtitle="Wallet · Deposits" back />
      <PageContent gap="default">
        {!canReadWallet ? (
          <p role="alert" style={{ color: colors.error }}>
            Wallet read permission is required to view pending deposits.
          </p>
        ) : query.isPending ? (
          <p style={{ color: colors.text2 }}>Loading pending deposits…</p>
        ) : query.isError ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : deposits.length === 0 ? (
          <TrCard className="p-4">
            <p style={{ color: colors.text2 }}>There are no pending deposits.</p>
          </TrCard>
        ) : (
          <>
            <p style={{ color: colors.text2, fontSize: 13 }}>
              {deposits.length} pending deposit{deposits.length === 1 ? '' : 's'} loaded
            </p>
            <div className="flex flex-col gap-2">
              {deposits.map((deposit) => (
                <TrCard key={deposit.id} className="p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => navigate(`${prefix}/wallet/transaction/${deposit.id}`)}
                    aria-label={`${deposit.asset} deposit ${formatAmount(deposit.amount)}`}
                  >
                    <span className="min-w-0">
                      <span
                        className="block truncate"
                        style={{ color: colors.text1, fontWeight: 700 }}
                      >
                        {deposit.asset} deposit · {deposit.network ?? 'Network not provided'}
                      </span>
                      <span className="block" style={{ color: colors.text3, fontSize: 12 }}>
                        {deposit.createdAt}
                      </span>
                    </span>
                    <span className="shrink-0" style={{ color: colors.text1, fontWeight: 700 }}>
                      {formatAmount(deposit.amount)} {deposit.asset}
                    </span>
                  </button>
                </TrCard>
              ))}
            </div>
            {query.hasNextPage && (
              <button
                type="button"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="self-center rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: colors.surface2, color: colors.text1 }}
              >
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
