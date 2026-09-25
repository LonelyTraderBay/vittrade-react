import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import {
  FilterButton,
  Pagination,
  SortButton,
  SummaryMetric,
  TransactionHistoryRow,
} from '../components/WalletTransactionHistoryComponents';
import {
  formatAmount,
  PAGE_SIZE,
  STATUS_FILTERS,
  toggleSort,
  TYPE_FILTERS,
  type SortDirection,
  type SortKey,
  type StatusFilter,
  type TypeFilter,
} from '../model/wallet-history';
import { useWalletTransactionsQuery } from '../model/wallet-queries';

export function WalletTransactionHistoryContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const shellPrefix = useRoutePrefix();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const query = useWalletTransactionsQuery({ limit: 100 });

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const result = (query.data?.items ?? []).filter((transaction) => {
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'trade' && transaction.type.startsWith('trade')) ||
        (typeFilter === 'p2p' && transaction.type.startsWith('p2p')) ||
        transaction.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        transaction.asset.toLowerCase().includes(normalizedSearch) ||
        transaction.txHash?.toLowerCase().includes(normalizedSearch) ||
        transaction.network?.toLowerCase().includes(normalizedSearch);
      return matchesType && matchesStatus && matchesSearch;
    });

    return result.sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'amount') return (left.amount - right.amount) * direction;
      if (sortKey === 'type') return left.type.localeCompare(right.type) * direction;
      return (Date.parse(left.createdAt) - Date.parse(right.createdAt)) * direction;
    });
  }, [query.data?.items, search, sortDirection, sortKey, statusFilter, typeFilter]);

  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleTransactions = filteredTransactions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const completedDeposits = query.data.items
    .filter((transaction) => transaction.type === 'deposit' && transaction.status === 'completed')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const completedWithdrawals = query.data.items
    .filter((transaction) => transaction.type === 'withdraw' && transaction.status === 'completed')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const pendingCount = query.data.items.filter(
    (transaction) => transaction.status === 'pending',
  ).length;

  const setFilter = (callback: () => void) => {
    callback();
    setPage(1);
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryMetric
            label="Completed deposits"
            value={formatAmount(completedDeposits)}
            color="#10B981"
          />
          <SummaryMetric
            label="Completed withdrawals"
            value={formatAmount(completedWithdrawals)}
            color="#EF4444"
          />
          <SummaryMetric
            label="Pending transactions"
            value={pendingCount.toString()}
            color="#F59E0B"
          />
        </div>

        <TrCard className="p-3">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                active={typeFilter === filter.id}
                label={filter.label}
                onClick={() => setFilter(() => setTypeFilter(filter.id))}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <FilterButton
                key={filter.id}
                active={statusFilter === filter.id}
                label={filter.label}
                onClick={() => setFilter(() => setStatusFilter(filter.id))}
              />
            ))}
          </div>
          <input
            aria-label="Search transactions"
            value={search}
            onChange={(event) => setFilter(() => setSearch(event.target.value))}
            placeholder="Search asset, tx hash or network"
            className="mt-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: colors.surface2, color: colors.text1 }}
          />
        </TrCard>

        <TrCard className="overflow-hidden">
          <div
            className="grid grid-cols-[1fr_72px_110px_100px] items-center gap-2 border-b px-4 py-3 text-xs"
            style={{ borderColor: colors.divider }}
          >
            <SortButton
              label="Type"
              active={sortKey === 'type'}
              onClick={() =>
                toggleSort('type', sortKey, sortDirection, setSortKey, setSortDirection)
              }
            />
            <span style={{ color: colors.text3 }}>Asset</span>
            <SortButton
              label="Amount"
              active={sortKey === 'amount'}
              onClick={() =>
                toggleSort('amount', sortKey, sortDirection, setSortKey, setSortDirection)
              }
            />
            <SortButton
              label="Time"
              active={sortKey === 'time'}
              onClick={() =>
                toggleSort('time', sortKey, sortDirection, setSortKey, setSortDirection)
              }
            />
          </div>
          {visibleTransactions.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: colors.text3 }}>
              No transactions match the selected filters.
            </p>
          ) : (
            visibleTransactions.map((transaction, index) => (
              <TransactionHistoryRow
                key={transaction.id}
                transaction={transaction}
                last={index === visibleTransactions.length - 1}
              />
            ))
          )}
        </TrCard>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          resultCount={filteredTransactions.length}
          onPageChange={setPage}
        />
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
