import { useMemo, useRef, useState } from 'react';
import { ArrowDownUp, CheckCircle, Info, Loader2, WalletCards } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { CTAButton } from '@/shared/ui/CTAButton';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtAmount, fmtUsd } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useWalletAccountsQuery,
  useWalletAssetsQuery,
  useWalletTransferMutation,
} from '../model/wallet-queries';
import type { WalletAccountId, WalletTransferReceipt } from '../model/wallet-types';

const EMPTY_VALUE = '—';

export function WalletTransferContractPage() {
  const colors = useThemeColors();
  const shellPrefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const accountsQuery = useWalletAccountsQuery();
  const assetsQuery = useWalletAssetsQuery();
  const transferMutation = useWalletTransferMutation();
  const [fromWallet, setFromWallet] = useState<WalletAccountId>('spot');
  const [toWallet, setToWallet] = useState<WalletAccountId>('funding');
  const [assetSymbol, setAssetSymbol] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  const [receipt, setReceipt] = useState<WalletTransferReceipt>();
  const transferAttempt = useRef<{ signature: string; key: string } | null>(null);

  const accounts = accountsQuery.data?.items ?? [];
  const assets = useMemo(() => assetsQuery.data?.items ?? [], [assetsQuery.data?.items]);
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === assetSymbol) ?? assets[0],
    [assetSymbol, assets],
  );
  const amountValue = Number(amount);
  const available = selectedAsset?.available ?? 0;
  const unitUsd =
    selectedAsset && selectedAsset.balance > 0 ? selectedAsset.usdValue / selectedAsset.balance : 0;
  const usdValue = amountValue > 0 ? amountValue * unitUsd : 0;
  const fromAccount = accounts.find((account) => account.id === fromWallet);
  const toAccount = accounts.find((account) => account.id === toWallet);
  const loading = accountsQuery.isPending || assetsQuery.isPending;
  const submitting = transferMutation.isPending;
  const canWriteWallet =
    hasPermission('wallet:write') ||
    hasPermission('wallet:transfer') ||
    hasPermission('transfer:write');

  if (loading) {
    return (
      <PageLayout>
        <Header title="Internal transfer" subtitle="Wallet contract" back />
        <PageContent>
          <div
            className="flex items-center justify-center gap-3 py-16"
            style={{ color: colors.text2 }}
          >
            <Loader2 size={22} className="animate-spin" />
            <span>Loading wallet balances…</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (accountsQuery.isError || assetsQuery.isError || accounts.length < 2 || assets.length === 0) {
    return (
      <PageLayout>
        <Header title="Internal transfer" subtitle="Wallet contract" back />
        <PageContent>
          <ErrorState
            title="Unable to load transfer data"
            message="Check your connection, wallet session and available balances."
            onAction={() => {
              void accountsQuery.refetch();
              void assetsQuery.refetch();
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  const submitTransfer = async () => {
    if (!canWriteWallet) {
      setValidationError('Your account does not have permission to transfer funds.');
      return;
    }

    const nextError = validateTransfer({
      fromWallet,
      toWallet,
      amount: amountValue,
      available,
      assetSymbol: selectedAsset?.symbol,
    });
    setValidationError(nextError);
    if (nextError || !selectedAsset) return;

    const request = {
      fromWallet,
      toWallet,
      asset: selectedAsset.symbol,
      amount: amountValue,
    };
    const signature = JSON.stringify(request);
    if (transferAttempt.current?.signature !== signature) {
      transferAttempt.current = {
        signature,
        key: `wallet-transfer-${crypto.randomUUID()}`,
      };
    }

    try {
      const result = await transferMutation.mutateAsync({
        request,
        idempotencyKey: transferAttempt.current.key,
      });
      transferAttempt.current = null;
      setReceipt(result);
      setAmount('');
    } catch {
      setValidationError('The transfer could not be completed. Please try again.');
    }
  };

  return (
    <PageLayout>
      <Header title="Internal transfer" subtitle="Move assets between your wallets" back />
      <PageContent gap="default">
        {receipt && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
          >
            <CheckCircle size={19} className="mt-0.5 shrink-0" />
            <div>
              <strong>Transfer submitted</strong>
              <p className="text-xs" style={{ color: colors.text2 }}>
                {fmtAmount(receipt.amount)} {receipt.asset} · {receipt.status}
              </p>
            </div>
          </div>
        )}

        <TrCard className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <WalletCards size={17} color={colors.primary} />
            <h2 style={{ color: colors.text1, fontWeight: 700 }}>Transfer route</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <WalletSelect
              label="From wallet"
              value={fromWallet}
              options={accounts}
              exclude={toWallet}
              onChange={setFromWallet}
            />
            <button
              type="button"
              aria-label="Swap wallets"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: colors.primary, color: '#fff' }}
              onClick={() => {
                setFromWallet(toWallet);
                setToWallet(fromWallet);
                setValidationError('');
              }}
            >
              <ArrowDownUp size={17} />
            </button>
            <WalletSelect
              label="To wallet"
              value={toWallet}
              options={accounts}
              exclude={fromWallet}
              onChange={setToWallet}
            />
          </div>
        </TrCard>

        <TrCard className="p-4">
          <label
            className="mb-2 block text-xs"
            style={{ color: colors.text3 }}
            htmlFor="transfer-asset"
          >
            Asset
          </label>
          <select
            id="transfer-asset"
            value={selectedAsset?.symbol ?? ''}
            onChange={(event) => setAssetSymbol(event.target.value)}
            className="mb-4 w-full rounded-xl px-3 py-3 text-sm outline-none"
            style={{ background: colors.surface2, color: colors.text1 }}
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.symbol}>
                {asset.symbol} — available {fmtAmount(asset.available)}
              </option>
            ))}
          </select>

          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs" style={{ color: colors.text3 }} htmlFor="transfer-amount">
              Amount
            </label>
            <button
              type="button"
              className="text-xs font-semibold"
              style={{ color: colors.primary }}
              onClick={() => setAmount(String(available))}
            >
              Max {fmtAmount(available)}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="transfer-amount"
              data-testid="wallet-transfer-amount"
              aria-label="Transfer amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setValidationError('');
              }}
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none"
              style={{ color: colors.text1 }}
            />
            <span className="font-semibold" style={{ color: colors.text2 }}>
              {selectedAsset?.symbol ?? EMPTY_VALUE}
            </span>
          </div>
          <p className="mt-2 text-xs" style={{ color: colors.text3 }}>
            Available: {fmtAmount(available)} {selectedAsset?.symbol} · ≈ {fmtUsd(usdValue)}
          </p>
        </TrCard>

        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3"
          style={{ background: `${colors.primary}14` }}
        >
          <Info size={15} color={colors.primary} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-5" style={{ color: colors.text2 }}>
            Internal transfers are immediate and do not incur a blockchain fee.
          </p>
        </div>

        {validationError && (
          <p role="alert" className="text-sm" style={{ color: '#EF4444' }}>
            {validationError}
          </p>
        )}

        {!canWriteWallet && (
          <p role="alert" className="text-sm" style={{ color: '#EF4444' }}>
            Wallet transfer permission is required to move funds.
          </p>
        )}

        <CTAButton
          data-testid="wallet-transfer-submit"
          onClick={() => void submitTransfer()}
          loading={submitting}
          disabled={submitting || !canWriteWallet}
        >
          Confirm transfer
        </CTAButton>

        <p className="text-center text-xs" style={{ color: colors.text3 }}>
          {fromAccount?.name ?? EMPTY_VALUE} → {toAccount?.name ?? EMPTY_VALUE}
          {shellPrefix && ` · ${shellPrefix} shell`}
        </p>
      </PageContent>
    </PageLayout>
  );
}

function WalletSelect({
  label,
  value,
  options,
  exclude,
  onChange,
}: {
  label: string;
  value: WalletAccountId;
  options: Array<{ id: WalletAccountId; name: string; balanceUsd: number }>;
  exclude: WalletAccountId;
  onChange: (value: WalletAccountId) => void;
}) {
  const colors = useThemeColors();
  return (
    <label className="block text-xs" style={{ color: colors.text3 }}>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as WalletAccountId)}
        className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none"
        style={{ background: colors.surface2, color: colors.text1 }}
      >
        {options
          .filter((account) => account.id !== exclude)
          .map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {fmtUsd(account.balanceUsd)}
            </option>
          ))}
      </select>
    </label>
  );
}

function validateTransfer({
  fromWallet,
  toWallet,
  amount,
  available,
  assetSymbol,
}: {
  fromWallet: WalletAccountId;
  toWallet: WalletAccountId;
  amount: number;
  available: number;
  assetSymbol?: string;
}) {
  if (fromWallet === toWallet) return 'Choose two different wallets.';
  if (!assetSymbol) return 'Choose an asset to transfer.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than zero.';
  if (amount > available) return 'The transfer amount exceeds the available balance.';
  return '';
}
