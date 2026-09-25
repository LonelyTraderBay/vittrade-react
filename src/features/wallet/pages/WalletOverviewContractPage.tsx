import { useMemo, useState } from 'react';
import { ArrowDownUp, ChevronRight, Download, Eye, EyeOff, PieChart, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useWalletAssetsQuery, useWalletTransactionsQuery } from '../model/wallet-queries';
import type { WalletAsset, WalletTransaction } from '../model/wallet-types';

const ACTIONS = [
  { label: 'Deposit', path: '/wallet/deposit/USDT', icon: Download, color: '#10B981' },
  { label: 'Withdraw', path: '/wallet/withdraw/USDT', icon: Upload, color: '#EF4444' },
  { label: 'Transfer', path: '/wallet/transfer', icon: ArrowDownUp, color: '#8B5CF6' },
] as const;

export function WalletOverviewContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const shellPrefix = useRoutePrefix();
  const [search, setSearch] = useState('');
  const [hideSmall, setHideSmall] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const assetsQuery = useWalletAssetsQuery();
  const transactionsQuery = useWalletTransactionsQuery({ limit: 10 });

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (assetsQuery.data?.items ?? []).filter((asset) => {
      if (hideSmall && asset.usdValue < 1) return false;
      if (!query) return true;
      return asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query);
    });
  }, [assetsQuery.data?.items, hideSmall, search]);

  if (assetsQuery.isPending || transactionsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Wallet" subtitle="Wallet contract" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Loading wallet API…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (
    assetsQuery.isError ||
    transactionsQuery.isError ||
    !assetsQuery.data ||
    !transactionsQuery.data
  ) {
    return (
      <PageLayout>
        <Header title="Wallet" subtitle="Wallet contract" back />
        <PageContent>
          <ErrorState
            title="Unable to load wallet"
            message="Check your connection or session and try again."
            onAction={() => {
              void assetsQuery.refetch();
              void transactionsQuery.refetch();
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  const { summary } = assetsQuery.data;
  return (
    <PageLayout>
      <Header
        title="Wallet"
        subtitle="Server-owned balances and activity"
        back
        right={
          <button
            type="button"
            onClick={() => navigate(`${shellPrefix}/wallet/history`)}
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: colors.surface2, color: colors.text2 }}
          >
            Transaction history
          </button>
        }
      />
      <PageContent gap="default">
        <SummaryCard
          totalUsd={summary.totalUsd}
          availableUsd={summary.availableUsd}
          inOrderUsd={summary.inOrderUsd}
          hidden={balanceHidden}
          onToggle={() => setBalanceHidden((value) => !value)}
          onAnalytics={() =>
            navigate(
              `${shellPrefix}${shellPrefix === '/w' ? '/portfolio/analytics' : '/wallet/portfolio-analytics'}`,
            )
          }
        />

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map(({ label, path, icon: Icon, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(`${shellPrefix}${path}`)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold"
              style={{ background: colors.surface2, color: colors.text2 }}
            >
              <Icon size={15} color={color} />
              {label}
            </button>
          ))}
        </div>

        <TrCard className="overflow-hidden">
          <SectionHeader
            title={`Assets (${filteredAssets.length})`}
            action={
              <label className="flex items-center gap-2 text-xs" style={{ color: colors.text3 }}>
                <input
                  type="checkbox"
                  checked={hideSmall}
                  onChange={(event) => setHideSmall(event.target.checked)}
                />
                Hide small balances
              </label>
            }
          />
          <div className="border-b px-4 py-3" style={{ borderColor: colors.divider }}>
            <input
              aria-label="Search assets"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: colors.surface2, color: colors.text1 }}
            />
          </div>
          {filteredAssets.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: colors.text3 }}>
              No assets match this filter.
            </p>
          ) : (
            filteredAssets.map((asset, index) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                hidden={balanceHidden}
                last={index === filteredAssets.length - 1}
                onClick={() => navigate(`${shellPrefix}/wallet/asset/${asset.id}`)}
              />
            ))
          )}
        </TrCard>

        <TrCard className="overflow-hidden">
          <SectionHeader
            title="Recent activity"
            action={
              <button
                type="button"
                onClick={() => navigate(`${shellPrefix}/wallet/history`)}
                className="text-xs font-semibold"
                style={{ color: colors.primary }}
              >
                View all
              </button>
            }
          />
          {transactionsQuery.data.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: colors.text3 }}>
              No wallet activity yet.
            </p>
          ) : (
            transactionsQuery.data.items.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                hidden={balanceHidden}
                last={index === transactionsQuery.data.items.length - 1}
              />
            ))
          )}
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function SummaryCard({
  totalUsd,
  availableUsd,
  inOrderUsd,
  hidden,
  onToggle,
  onAnalytics,
}: {
  totalUsd: number;
  availableUsd: number;
  inOrderUsd: number;
  hidden: boolean;
  onToggle: () => void;
  onAnalytics: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p style={{ color: colors.text3, fontSize: 12 }}>Total balance</p>
            <button type="button" aria-label="Toggle balance" onClick={onToggle}>
              {hidden ? (
                <EyeOff size={15} color={colors.text3} />
              ) : (
                <Eye size={15} color={colors.text3} />
              )}
            </button>
          </div>
          <strong style={{ color: colors.text1, fontSize: 28 }}>
            {hidden ? '••••••' : formatUsd(totalUsd)}
          </strong>
        </div>
        <button
          type="button"
          onClick={onAnalytics}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ background: colors.surface2, color: colors.primary }}
        >
          <PieChart size={15} />
          Analytics
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Available" value={hidden ? '••••' : formatUsd(availableUsd)} />
        <Metric label="In orders" value={hidden ? '••••' : formatUsd(inOrderUsd)} />
        <Metric label="Currency" value="USD" />
      </div>
    </TrCard>
  );
}

function AssetRow({
  asset,
  hidden,
  last,
  onClick,
}: {
  asset: WalletAsset;
  hidden: boolean;
  last: boolean;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left"
      style={{ borderBottom: last ? 'none' : `1px solid ${colors.divider}` }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: `${asset.logoColor}20`, color: asset.logoColor }}
      >
        {asset.symbol.slice(0, 3)}
      </span>
      <span className="min-w-0 flex-1">
        <strong style={{ color: colors.text1, fontSize: 13 }}>{asset.symbol}</strong>
        <span className="ml-2 truncate text-xs" style={{ color: colors.text3 }}>
          {asset.name}
        </span>
      </span>
      <span className="text-right">
        <strong style={{ color: colors.text1, fontSize: 12 }}>
          {hidden ? '••••' : formatAmount(asset.balance)}
        </strong>
        <span className="block text-xs" style={{ color: colors.text3 }}>
          {hidden ? '••••' : formatUsd(asset.usdValue)}
        </span>
      </span>
      <ChevronRight size={15} color={colors.text3} />
    </button>
  );
}

function TransactionRow({
  transaction,
  hidden,
  last,
}: {
  transaction: WalletTransaction;
  hidden: boolean;
  last: boolean;
}) {
  const colors = useThemeColors();
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? 'none' : `1px solid ${colors.divider}` }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: statusColor(transaction.status) }}
      />
      <div className="min-w-0 flex-1">
        <strong style={{ color: colors.text1, fontSize: 12 }}>
          {transactionLabel(transaction.type)}
        </strong>
        <p style={{ color: colors.text3, fontSize: 10 }}>
          {transaction.asset} · {formatDate(transaction.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <strong style={{ color: colors.text1, fontSize: 12 }}>
          {hidden ? '••••' : `${formatAmount(transaction.amount)} ${transaction.asset}`}
        </strong>
        <p style={{ color: statusColor(transaction.status), fontSize: 10 }}>{transaction.status}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-4 py-3"
      style={{ borderColor: colors.divider }}
    >
      <h2 style={{ color: colors.text1, fontWeight: 700 }}>{title}</h2>
      {action}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-3" style={{ background: colors.surface2 }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <strong style={{ color: colors.text1, fontSize: 12 }}>{value}</strong>
    </div>
  );
}

function formatUsd(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

function transactionLabel(type: WalletTransaction['type']) {
  return {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    trade_buy: 'Buy',
    trade_sell: 'Sell',
    p2p_buy: 'P2P buy',
    p2p_sell: 'P2P sell',
  }[type];
}

function statusColor(status: WalletTransaction['status']) {
  return { completed: '#10B981', pending: '#F59E0B', failed: '#EF4444' }[status];
}
