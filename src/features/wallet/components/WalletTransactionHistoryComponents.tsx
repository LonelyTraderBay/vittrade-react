import { ArrowUpDown } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { formatAmount, transactionMetadata } from '../model/wallet-history';
import type { WalletTransaction } from '../model/wallet-types';

export function SummaryMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <p style={{ color: colors.text3, fontSize: 11 }}>{label}</p>
      <strong style={{ color, fontSize: 18 }}>{value}</strong>
    </TrCard>
  );
}

export function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-xs font-semibold"
      style={{
        background: active ? `${colors.primary}20` : colors.surface2,
        color: active ? colors.primary : colors.text3,
      }}
    >
      {label}
    </button>
  );
}

export function SortButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 font-semibold"
      style={{ color: active ? colors.primary : colors.text3 }}
    >
      {label}
      <ArrowUpDown size={12} />
    </button>
  );
}

export function TransactionHistoryRow({
  transaction,
  last,
}: {
  transaction: WalletTransaction;
  last: boolean;
}) {
  const colors = useThemeColors();
  const metadata = transactionMetadata(transaction.type);
  const Icon = metadata.icon;
  const debit =
    transaction.type === 'withdraw' ||
    transaction.type === 'trade_sell' ||
    transaction.type === 'p2p_sell';
  return (
    <div
      className="grid grid-cols-[1fr_72px_110px_100px] items-center gap-2 px-4 py-3 text-xs"
      style={{ borderBottom: last ? 'none' : `1px solid ${colors.divider}` }}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${metadata.color}18` }}
        >
          <Icon size={13} color={metadata.color} />
        </span>
        <span className="truncate" style={{ color: colors.text1, fontWeight: 600 }}>
          {metadata.label}
          <small className="ml-1" style={{ color: colors.text3 }}>
            {transaction.status}
          </small>
        </span>
      </span>
      <span style={{ color: colors.text2 }}>{transaction.asset}</span>
      <span
        className="text-right"
        style={{ color: debit ? '#EF4444' : '#10B981', fontWeight: 600 }}
      >
        {debit ? '-' : '+'}
        {formatAmount(transaction.amount)}
      </span>
      <span className="text-right" style={{ color: colors.text3 }}>
        {formatDate(transaction.createdAt)}
      </span>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  resultCount,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  resultCount: number;
  onPageChange: (page: number) => void;
}) {
  const colors = useThemeColors();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 text-xs" style={{ color: colors.text3 }}>
      <span>
        Page {page} of {totalPages} · {resultCount} results
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          style={{ color: page === 1 ? colors.text3 : colors.primary }}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          style={{ color: page === totalPages ? colors.text3 : colors.primary }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}
