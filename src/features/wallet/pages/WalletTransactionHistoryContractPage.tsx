import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import {
  FilterButton,
  TransactionHistoryRow,
} from '../components/WalletTransactionHistoryComponents';
import {
  PAGE_SIZE,
  STATUS_FILTERS,
  TYPE_FILTERS,
  type StatusFilter,
  type TypeFilter,
} from '../model/wallet-history';
import { useWalletTransactionsQuery } from '../model/wallet-queries';
import type { WalletTransaction } from '../model/wallet-types';

const EMPTY_TRANSACTIONS: WalletTransaction[] = [];

export function WalletTransactionHistoryContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const shellPrefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const canReadWallet = hasPermission('wallet:read');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assetInput, setAssetInput] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursors[cursors.length - 1];
  const query = useWalletTransactionsQuery(
    {
      asset: assetFilter || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      cursor,
      limit: PAGE_SIZE,
    },
    canReadWallet,
  );
  const transactions = query.data?.items ?? EMPTY_TRANSACTIONS;

  if (!canReadWallet) {
    return (
      <PageLayout>
        <Header title="Transaction history" subtitle="Wallet" back />
        <PageContent>
          <p role="alert" style={{ color: colors.error }}>
            Wallet read permission is required to view transaction history.
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }

  const resetCursor = (callback: () => void) => {
    callback();
    setCursors([undefined]);
  };

  return (
    <PageLayout>
      <Header
        title="Transaction history"
        subtitle={`${query.data.total.toLocaleString('en-US')} transactions`}
        back
        right={
          <button
            type="button"
            onClick={() => navigate(`${shellPrefix}/wallet`)}
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: colors.surface2, color: colors.text2 }}
          >
            Wallet
          </button>
        }
      />
      <PageContent gap="default">
        <TrCard className="p-3">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                active={typeFilter === filter.id}
                label={filter.label}
                onClick={() => resetCursor(() => setTypeFilter(filter.id))}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                active={statusFilter === filter.id}
                label={filter.label}
                onClick={() => resetCursor(() => setStatusFilter(filter.id))}
              />
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              resetCursor(() => setAssetFilter(assetInput.trim().toUpperCase()));
            }}
          >
            <input
              aria-label="Filter by asset"
              value={assetInput}
              onChange={(event) => setAssetInput(event.target.value)}
              placeholder="Asset symbol, e.g. BTC"
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: colors.surface2, color: colors.text1 }}
            />
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: colors.primary, color: '#fff' }}
            >
              Apply
            </button>
          </form>
        </TrCard>

        <TrCard className="overflow-hidden">
          <div
            className="grid grid-cols-[1fr_72px_110px_100px] items-center gap-2 border-b px-4 py-3 text-xs"
            style={{ borderColor: colors.divider }}
          >
            <span style={{ color: colors.text3 }}>Type</span>
            <span style={{ color: colors.text3 }}>Asset</span>
            <span className="text-right" style={{ color: colors.text3 }}>
              Amount
            </span>
            <span className="text-right" style={{ color: colors.text3 }}>
              Time
            </span>
          </div>
          {transactions.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: colors.text3 }}>
              No transactions match the selected filters.
            </p>
          ) : (
            transactions.map((transaction, index) => (
              <TransactionHistoryRow
                key={transaction.id}
                transaction={transaction}
                last={index === transactions.length - 1}
              />
            ))
          )}
        </TrCard>

        {(cursors.length > 1 || query.data.nextCursor) && (
          <div
            aria-label="Transaction history pagination"
            className="flex items-center justify-between px-2 text-xs"
            style={{ color: colors.text3 }}
          >
            <span>
              Page {cursors.length} · {query.data.total.toLocaleString('en-US')} transactions
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={cursors.length === 1 || query.isFetching}
                onClick={() => setCursors((current) => current.slice(0, -1))}
                style={{ color: cursors.length === 1 ? colors.text3 : colors.primary }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={
                  !query.data.nextCursor || query.data.nextCursor === cursor || query.isFetching
                }
                onClick={() => {
                  const nextCursor = query.data.nextCursor;
                  if (nextCursor) {
                    setCursors((current) =>
                      current[current.length - 1] === nextCursor
                        ? current
                        : [...current, nextCursor],
                    );
                  }
                }}
                style={{
                  color:
                    query.data.nextCursor && query.data.nextCursor !== cursor
                      ? colors.primary
                      : colors.text3,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function LoadingPage() {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title="Transaction history" back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Loading transaction history API…</p>
      </PageContent>
    </PageLayout>
  );
}
