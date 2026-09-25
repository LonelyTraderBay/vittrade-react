import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { formatAmount } from '../lib/formatters';
import { useEarnTransactionsQuery } from '../model/earn-queries';
import type { EarnDomain, EarnTransaction, EarnTransactionOperation } from '../model/earn-types';

type OperationFilter = 'all' | EarnTransactionOperation;

const operationLabels: Record<OperationFilter, string> = {
  all: 'Tất cả',
  subscribe: 'Đăng ký',
  redeem: 'Rút vốn',
};

const statusLabels: Record<EarnTransaction['status'], string> = {
  pending: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
};

function formatTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ngày không hợp lệ';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function EarnHistoryPage({ domain }: { domain: EarnDomain }) {
  const colors = useThemeColors();
  const [operation, setOperation] = useState<OperationFilter>('all');
  const title = domain === 'savings' ? 'Lịch sử tiết kiệm' : 'Lịch sử staking';
  const domainLabel = domain === 'savings' ? 'tiết kiệm' : 'staking';
  const transactionsQuery = useEarnTransactionsQuery(domain);
  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [transactionsQuery.data?.pages],
  );
  const filteredTransactions = useMemo(
    () =>
      operation === 'all'
        ? transactions
        : transactions.filter((transaction) => transaction.operation === operation),
    [operation, transactions],
  );

  if (transactionsQuery.isPending) {
    return (
      <PageLayout>
        <Header title={title} subtitle={`Giao dịch ${domainLabel} của bạn`} back />
        <PageContent gap="relaxed">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-3xl"
              style={{ background: colors.surface2 }}
            />
          ))}
        </PageContent>
      </PageLayout>
    );
  }

  if (transactionsQuery.isError && !transactionsQuery.data) {
    return (
      <PageLayout>
        <Header title={title} subtitle={`Giao dịch ${domainLabel} của bạn`} back />
        <ErrorState onAction={() => void transactionsQuery.refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title={title} subtitle={`Giao dịch ${domainLabel} của bạn`} back />
      <PageContent gap="relaxed">
        <div className="flex gap-2 overflow-x-auto" aria-label="Lọc loại giao dịch">
          {(Object.keys(operationLabels) as OperationFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={operation === filter}
              onClick={() => setOperation(filter)}
              className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{
                background: operation === filter ? colors.chipActiveBg : colors.chipBg,
                color: operation === filter ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${operation === filter ? colors.chipActiveBorder : colors.chipBorder}`,
              }}
            >
              {operationLabels[filter]}
            </button>
          ))}
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={History}
            title={
              transactions.length === 0 ? `Chưa có giao dịch ${domainLabel}` : 'Không có kết quả'
            }
            subtitle={
              transactions.length === 0
                ? `Các giao dịch ${domainLabel} sẽ xuất hiện tại đây.`
                : 'Thử chọn một loại giao dịch khác.'
            }
          />
        ) : (
          <div className="flex flex-col gap-3" aria-label={`Giao dịch ${domainLabel}`}>
            {filteredTransactions.map((transaction) => {
              const isSubscription = transaction.operation === 'subscribe';
              const Icon = isSubscription ? ArrowUpRight : ArrowDownLeft;
              return (
                <TrCard key={transaction.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        color: isSubscription ? '#10B981' : colors.primary,
                        background: isSubscription
                          ? 'rgba(16,185,129,0.12)'
                          : colors.primaryAlpha12,
                      }}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                          {operationLabels[transaction.operation]} · {transaction.product}
                        </p>
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-semibold"
                          style={{
                            color:
                              transaction.status === 'completed'
                                ? '#059669'
                                : transaction.status === 'failed'
                                  ? '#DC2626'
                                  : '#D97706',
                            background:
                              transaction.status === 'completed'
                                ? 'rgba(16,185,129,0.12)'
                                : transaction.status === 'failed'
                                  ? 'rgba(239,68,68,0.1)'
                                  : 'rgba(245,158,11,0.12)',
                          }}
                        >
                          {statusLabels[transaction.status]}
                        </span>
                      </div>
                      <p className="mt-1" style={{ color: colors.text3, fontSize: 11 }}>
                        {formatTransactionDate(transaction.createdAt)}
                      </p>
                      <p
                        className="mt-3 text-right font-mono text-sm font-bold"
                        style={{ color: isSubscription ? colors.text1 : colors.primary }}
                      >
                        {isSubscription ? '+' : '−'} {formatAmount(transaction.amount)}{' '}
                        {transaction.asset}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        )}

        {transactionsQuery.isError && transactionsQuery.data && (
          <p role="alert" className="text-center text-xs text-red-500">
            Không tải được trang tiếp theo. Hãy thử lại.
          </p>
        )}
        {transactionsQuery.hasNextPage && (
          <button
            type="button"
            disabled={transactionsQuery.isFetchingNextPage}
            onClick={() => void transactionsQuery.fetchNextPage()}
            className="rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50"
            style={{ color: colors.text1, borderColor: colors.borderSolid }}
          >
            {transactionsQuery.isFetchingNextPage
              ? 'Đang tải…'
              : transactionsQuery.isError && transactionsQuery.data
                ? 'Thử tải lại trang tiếp theo'
                : 'Tải thêm giao dịch'}
          </button>
        )}
      </PageContent>
    </PageLayout>
  );
}

export function SavingsHistoryPage() {
  return <EarnHistoryPage domain="savings" />;
}

export function StakingHistoryPage() {
  return <EarnHistoryPage domain="staking" />;
}
