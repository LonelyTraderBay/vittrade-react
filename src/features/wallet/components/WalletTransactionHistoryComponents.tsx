import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { formatAmount, transactionMetadata } from '../model/wallet-history';
import type { WalletTransaction } from '../model/wallet-types';

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}
