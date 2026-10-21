import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { CTAButton } from '@/shared/ui/CTAButton';
import { SearchBar } from '@/shared/ui/SearchBar';
import { FilterButton } from '@/shared/ui/FilterButton';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import { isApiError } from '@/shared/api/api-error';
import { TransactionHistoryRow } from '../components/WalletTransactionHistoryComponents';
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

  if (query.isError || (!query.isPending && !query.data)) {
    const permissionDenied = isApiError(query.error) && query.error.status === 403;
    if (permissionDenied) {
      return (
        <ErrorState
          title="Không có quyền truy cập"
          message="Tài khoản của bạn không có quyền xem lịch sử giao dịch ví."
        />
      );
    }
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
        subtitle={
          query.data ? `${query.data.total.toLocaleString('en-US')} transactions` : 'Wallet'
        }
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
          <div role="group" aria-label="Transaction type" className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                selected={typeFilter === filter.id}
                label={filter.label}
                onClick={() => resetCursor(() => setTypeFilter(filter.id))}
              />
            ))}
          </div>
          <div role="group" aria-label="Transaction status" className="mt-3 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                selected={statusFilter === filter.id}
                label={filter.label}
                onClick={() => resetCursor(() => setStatusFilter(filter.id))}
              />
            ))}
          </div>
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              resetCursor(() => setAssetFilter(assetInput.trim().toUpperCase()));
            }}
          >
            <SearchBar
              value={assetInput}
              onChange={setAssetInput}
              placeholder="Asset symbol, e.g. BTC"
              ariaLabel="Filter by asset"
              right={
                <CTAButton
                  type="submit"
                  variant="secondary"
                  density="compact"
                  fullWidth={false}
                  bg={colors.primary}
                  textColor="var(--tr-text-on-color)"
                  className="px-3"
                >
                  Apply
                </CTAButton>
              }
            />
          </form>
        </TrCard>

        {query.data ? (
          <>
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
                      // The disabled state guarantees a distinct server cursor before this runs.
                      setCursors((current) => [...current, query.data.nextCursor!]);
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
          </>
        ) : (
          <p role="status" style={{ color: colors.text2 }}>
            Loading transaction history API…
          </p>
        )}
      </PageContent>
    </PageLayout>
  );
}
