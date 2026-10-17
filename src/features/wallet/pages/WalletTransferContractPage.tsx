import { useMemo, useRef, useState } from 'react';
import { ArrowDownUp, CheckCircle, Clock, Info, Loader2, WalletCards } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtAmount, fmtUsd } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { textRoleStyle } from '@/shared/theme/typography';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useWalletAccountsQuery,
  useWalletAssetsQuery,
  useWalletTransferMutation,
} from '../model/wallet-queries';
import { validateWalletTransfer } from '../model/validate-wallet-transfer';
import type { WalletAccountId, WalletTransferReceipt } from '../model/wallet-types';

const EMPTY_VALUE = '—';

export function WalletTransferContractPage() {
  const colors = useThemeColors();
  const shellPrefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const canReadWallet = hasPermission('wallet:read');
  const accountsQuery = useWalletAccountsQuery(canReadWallet);
  const assetsQuery = useWalletAssetsQuery(canReadWallet);
  const transferMutation = useWalletTransferMutation();
  const [fromWallet, setFromWallet] = useState<WalletAccountId>('spot');
  const [toWallet, setToWallet] = useState<WalletAccountId>('funding');
  const [assetSymbol, setAssetSymbol] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  const [receipt, setReceipt] = useState<WalletTransferReceipt>();
  const transferAttempt = useRef<{ signature: string; key: string } | null>(null);
  const transferInFlight = useRef(false);

  const accounts = accountsQuery.data?.items ?? [];
  const assets = useMemo(() => assetsQuery.data?.items ?? [], [assetsQuery.data?.items]);
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === assetSymbol) ?? assets[0],
    [assetSymbol, assets],
  );
  const loading = accountsQuery.isPending || assetsQuery.isPending;
  const submitting = transferMutation.isPending;
  const canWriteWallet =
    hasPermission('wallet:write') ||
    hasPermission('wallet:transfer') ||
    hasPermission('transfer:write');

  if (!canReadWallet) {
    return (
      <PageLayout>
        <Header title="Internal transfer" subtitle="Wallet contract" back />
        <PageContent>
          <p role="alert" style={{ color: colors.error }}>
            Wallet read permission is required to view transfer balances.
          </p>
        </PageContent>
      </PageLayout>
    );
  }

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

  if (accountsQuery.isError || assetsQuery.isError || accounts.length < 2 || !selectedAsset) {
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

  const amountValue = Number(amount);
  const available = selectedAsset.available;
  const unitUsd = selectedAsset.balance > 0 ? selectedAsset.usdValue / selectedAsset.balance : 0;
  const usdValue = amountValue > 0 ? amountValue * unitUsd : 0;
  const fromAccount = accounts.find((account) => account.id === fromWallet);
  const toAccount = accounts.find((account) => account.id === toWallet);
  const samePendingTransfer =
    receipt?.status === 'pending' &&
    receipt.fromWallet === fromWallet &&
    receipt.toWallet === toWallet &&
    receipt.asset === selectedAsset.symbol &&
    receipt.amount === amountValue;

  const submitTransfer = async () => {
    if (!canWriteWallet || samePendingTransfer || transferInFlight.current) return;
    const nextError = validateWalletTransfer({
      fromWallet,
      toWallet,
      amount: amountValue,
      available,
      assetSymbol: selectedAsset.symbol,
    });
    setValidationError(nextError);
    if (nextError) return;

    transferInFlight.current = true;
    try {
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

      const result = await transferMutation.mutateAsync({
        request,
        idempotencyKey: transferAttempt.current.key,
      });
      setReceipt(result);
      if (result.status === 'completed') {
        transferAttempt.current = null;
        setAmount('');
      }
    } catch {
      setValidationError('The transfer could not be completed. Please try again.');
    } finally {
      transferInFlight.current = false;
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
            style={{
              background: receipt.status === 'completed' ? colors.buyAlpha10 : colors.warnAlpha10,
              color: receipt.status === 'completed' ? colors.success : colors.warning,
            }}
          >
            {receipt.status === 'pending' ? (
              <Clock size={19} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle size={19} className="mt-0.5 shrink-0" />
            )}
            <div>
              <strong>
                {receipt.status === 'pending' ? 'Transfer pending' : 'Transfer completed'}
              </strong>
              <p className="text-xs" style={{ color: colors.text2 }}>
                {fmtAmount(receipt.amount)} {receipt.asset} · Reference {receipt.id}
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
              disabled={submitting}
            />
            <button
              type="button"
              aria-label="Swap wallets"
              disabled={submitting}
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
              disabled={submitting}
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
            value={selectedAsset.symbol}
            onChange={(event) => setAssetSymbol(event.target.value)}
            disabled={submitting}
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
              disabled={submitting}
            >
              Max {fmtAmount(available)}
            </button>
          </div>
          <InputField
            id="transfer-amount"
            data-testid="wallet-transfer-amount"
            aria-label="Transfer amount"
            disabled={submitting}
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
            style={{ ...textRoleStyle('amountLarge'), color: colors.text1 }}
            suffix={
              <span className="font-semibold" style={{ color: colors.text2 }}>
                {selectedAsset.symbol}
              </span>
            }
            helper={`Available: ${fmtAmount(available)} ${selectedAsset.symbol} · ≈ ${fmtUsd(usdValue)}`}
          />
        </TrCard>

        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3"
          style={{ background: `${colors.primary}14` }}
        >
          <Info size={15} color={colors.primary} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-5" style={{ color: colors.text2 }}>
            Transfers may remain pending. Keep the reference and do not repeat the same transfer
            while its status is pending.
          </p>
        </div>

        {validationError && (
          <p role="alert" className="text-sm" style={{ color: 'var(--tr-error-text)' }}>
            {validationError}
          </p>
        )}

        {samePendingTransfer && (
          <p className="text-sm" style={{ color: colors.text2 }}>
            This exact transfer is still pending. Check its reference before submitting it again.
          </p>
        )}

        {!canWriteWallet && (
          <p role="alert" className="text-sm" style={{ color: 'var(--tr-error-text)' }}>
            Wallet transfer permission is required to move funds.
          </p>
        )}

        <CTAButton
          data-testid="wallet-transfer-submit"
          onClick={() => void submitTransfer()}
          loading={submitting}
          disabled={submitting || !canWriteWallet || samePendingTransfer}
        >
          {submitting ? (
            <span style={{ color: colors.text1 }}>Submitting transfer…</span>
          ) : (
            'Confirm transfer'
          )}
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
  disabled,
}: {
  label: string;
  value: WalletAccountId;
  options: Array<{ id: WalletAccountId; name: string; balanceUsd: number }>;
  exclude: WalletAccountId;
  onChange: (value: WalletAccountId) => void;
  disabled: boolean;
}) {
  const colors = useThemeColors();
  return (
    <label className="block text-xs" style={{ color: colors.text3 }}>
      {label}
      <select
        aria-label={label}
        disabled={disabled}
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
