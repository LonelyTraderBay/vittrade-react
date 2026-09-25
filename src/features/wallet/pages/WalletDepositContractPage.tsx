import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useWalletDepositNetworksQuery } from '../model/wallet-queries';
import type { WalletDepositNetwork } from '../model/wallet-types';

const EMPTY_NETWORKS: WalletDepositNetwork[] = [];

export function WalletDepositContractPage() {
  const { asset = 'USDT' } = useParams();
  const colors = useThemeColors();
  const networksQuery = useWalletDepositNetworksQuery(asset);
  const networks = networksQuery.data ?? EMPTY_NETWORKS;
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [copied, setCopied] = useState<'address' | 'memo'>();
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    if (networks.length > 0 && !networks.some((network) => network.id === selectedNetworkId)) {
      setSelectedNetworkId(networks[0].id);
    }
  }, [networks, selectedNetworkId]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(undefined), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId) ?? networks[0],
    [networks, selectedNetworkId],
  );

  if (networksQuery.isPending) {
    return (
      <PageLayout>
        <Header title={`Deposit ${asset}`} subtitle="Wallet contract" back />
        <PageContent>
          <div
            className="flex items-center justify-center gap-3 py-16"
            style={{ color: colors.text2 }}
          >
            <Loader2 size={22} className="animate-spin" />
            <span>Loading deposit networks…</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (networksQuery.isError || !selectedNetwork) {
    return (
      <PageLayout>
        <Header title={`Deposit ${asset}`} subtitle="Wallet contract" back />
        <PageContent>
          <ErrorState
            title="Unable to load deposit instructions"
            message="Check your connection or session and try again."
            onAction={() => void networksQuery.refetch()}
          />
        </PageContent>
      </PageLayout>
    );
  }

  const hasMemo = Boolean(selectedNetwork.memo);
  const copyValue = async (value: string, kind: 'address' | 'memo') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError('');
      setCopied(kind);
    } catch {
      setCopyError('Clipboard access is unavailable. Select the value and copy it manually.');
    }
  };

  return (
    <PageLayout>
      <Header title={`Deposit ${asset}`} subtitle="Receive assets into your wallet" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <label
            className="block text-xs"
            style={{ color: colors.text3 }}
            htmlFor="deposit-network"
          >
            Deposit network
          </label>
          <select
            id="deposit-network"
            aria-label="Deposit network"
            value={selectedNetwork.id}
            onChange={(event) => setSelectedNetworkId(event.target.value)}
            className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none"
            style={{ background: colors.surface2, color: colors.text1 }}
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name} · fee {network.fee} · {network.arrivalTime}
              </option>
            ))}
          </select>
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: colors.text3 }}>
            <span className="h-2 w-2 rounded-full" style={{ background: '#10B981' }} />
            <span>Network available</span>
            <span>·</span>
            <span>{selectedNetwork.confirmations} confirmations</span>
          </div>
        </TrCard>

        <div
          className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertTriangle size={17} color="#EF4444" className="mt-0.5 shrink-0" />
          <p className="text-xs leading-5" style={{ color: '#F87171' }}>
            Send only {asset} through {selectedNetwork.name}. Sending through another network may
            permanently lose your funds. Minimum deposit: {selectedNetwork.minDeposit} {asset}.
          </p>
        </div>

        {hasMemo && (
          <div
            className="flex items-start gap-2 rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.35)',
            }}
          >
            <AlertTriangle size={17} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-5" style={{ color: '#D97706' }}>
              {selectedNetwork.memoLabel ?? 'Memo'} is required for this network. Include it when
              sending funds or the deposit may not be credited.
            </p>
          </div>
        )}

        <TrCard className="flex flex-col items-center gap-4 p-5">
          <div className="rounded-2xl bg-white p-4" aria-label="Deposit QR code">
            <QRCodeSVG value={selectedNetwork.address} size={188} level="M" includeMargin />
          </div>
          <CopyableValue
            label={`${asset} deposit address`}
            value={selectedNetwork.address}
            copied={copied === 'address'}
            onCopy={() => void copyValue(selectedNetwork.address, 'address')}
          />
          {hasMemo && selectedNetwork.memo && (
            <CopyableValue
              label={selectedNetwork.memoLabel ?? 'Memo'}
              value={selectedNetwork.memo}
              copied={copied === 'memo'}
              onCopy={() => void copyValue(selectedNetwork.memo!, 'memo')}
            />
          )}
        </TrCard>

        {copyError && (
          <p role="alert" className="text-center text-xs" style={{ color: '#EF4444' }}>
            {copyError}
          </p>
        )}

        <TrCard className="flex flex-col gap-3 p-4">
          <h2 className="font-semibold" style={{ color: colors.text1 }}>
            Deposit details
          </h2>
          <DetailRow label="Processing time" value={selectedNetwork.arrivalTime} />
          <DetailRow label="Confirmations" value={`${selectedNetwork.confirmations} blocks`} />
          <DetailRow label="Deposit fee" value={selectedNetwork.fee} />
          <DetailRow label="Minimum deposit" value={`${selectedNetwork.minDeposit} ${asset}`} />
        </TrCard>

        <button
          type="button"
          onClick={() => void networksQuery.refetch()}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl"
          style={{
            background: colors.surface2,
            border: `1px solid ${colors.borderSolid}`,
            color: colors.text2,
          }}
        >
          <RefreshCw size={16} />
          Refresh deposit instructions
        </button>
      </PageContent>
    </PageLayout>
  );
}

function CopyableValue({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const colors = useThemeColors();
  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs" style={{ color: colors.text3 }}>
        {label}
      </p>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-3"
        style={{ background: colors.surface2 }}
      >
        <code
          className="min-w-0 flex-1 break-all text-center text-xs"
          style={{ color: colors.text1 }}
        >
          {value}
        </code>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={onCopy}
          className="shrink-0 rounded-lg p-2"
          style={{ color: copied ? '#10B981' : colors.primary }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span style={{ color: colors.text2 }}>{label}</span>
      <strong className="text-right" style={{ color: colors.text1 }}>
        {value}
      </strong>
    </div>
  );
}
