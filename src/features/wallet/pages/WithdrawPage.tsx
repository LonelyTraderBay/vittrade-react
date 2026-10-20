import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { TOAST } from '@/shared/constants/toastMessages';
import { isApiError } from '@/shared/api/api-error';
import {
  WithdrawalConfirmation,
  WithdrawalErrorState,
  WithdrawalForm,
  WithdrawalLoadingState,
  WithdrawalSuccessState,
  WithdrawalVerifyState,
} from '../components/WithdrawSections';
import {
  useWalletAssetsQuery,
  useWalletWithdrawalChallengeMutation,
  useWalletWithdrawalMutation,
  useWalletWithdrawalNetworksQuery,
  useWalletWithdrawalVerificationMutation,
} from '../model/wallet-queries';
import type {
  WalletWithdrawalChallengeRequest,
  WalletWithdrawalChallenge,
  WalletWithdrawalNetwork,
  WalletWithdrawalReceipt,
  WalletWithdrawalVerification,
} from '../model/wallet-types';

const EMPTY_NETWORKS: WalletWithdrawalNetwork[] = [];
type WithdrawalWorkflow =
  | { step: 'form' }
  | { step: 'verify'; challenge: WalletWithdrawalChallenge }
  | { step: 'result'; receipt: WalletWithdrawalReceipt };

export function WithdrawPage() {
  const { asset = 'USDT' } = useParams();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canReadWallet = hasPermission('wallet:read');
  const canWithdraw = hasPermission('wallet:write') || hasPermission('wallet:withdraw');
  const toast = useActionToast();
  const { hapticSelection, hapticWarning, hapticMedium } = useHaptic();
  const networksQuery = useWalletWithdrawalNetworksQuery(asset, canReadWallet);
  const assetsQuery = useWalletAssetsQuery(canReadWallet);
  const challengeMutation = useWalletWithdrawalChallengeMutation();
  const verificationMutation = useWalletWithdrawalVerificationMutation();
  const withdrawalMutation = useWalletWithdrawalMutation();
  const networks = networksQuery.data ?? EMPTY_NETWORKS;
  const assetData = assetsQuery.data?.items.find((item) => item.symbol === asset);

  const [workflow, setWorkflow] = useState<WithdrawalWorkflow>({ step: 'form' });
  const [networkId, setNetworkId] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const withdrawalAttempt = useRef<{ signature: string; key: string } | null>(null);
  const submissionInFlight = useRef(false);

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === networkId) ?? networks[0],
    [networkId, networks],
  );

  useEffect(() => {
    if (selectedNetwork && selectedNetwork.id !== networkId) setNetworkId(selectedNetwork.id);
  }, [networkId, selectedNetwork]);

  const amountValue = Number(amount || 0);
  const fee = selectedNetwork?.fee ?? 0;
  const received = Math.max(0, amountValue - fee);
  const busy =
    challengeMutation.isPending || verificationMutation.isPending || withdrawalMutation.isPending;

  useEffect(() => {
    const firstInvalidFieldId = errors.address
      ? 'withdraw-address'
      : errors.memo
        ? 'withdraw-memo'
        : errors.amount
          ? 'withdraw-amount'
          : undefined;
    if (firstInvalidFieldId) {
      document.getElementById(firstInvalidFieldId)?.focus();
    }
  }, [errors]);

  if (!canReadWallet) {
    return (
      <PageLayout>
        <Header title={`Rút ${asset}`} subtitle="Rút tiền · Wallet" back />
        <PageContent>
          <p role="alert" style={{ color: colors.error }}>
            Wallet read permission is required to view withdrawal balances and network policies.
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  if (networksQuery.isLoading || assetsQuery.isLoading) {
    return <WithdrawalLoadingState asset={asset} colors={colors} />;
  }

  if (networksQuery.error || assetsQuery.error || !assetData || !selectedNetwork) {
    return (
      <WithdrawalErrorState
        asset={asset}
        onRetry={() => {
          void networksQuery.refetch();
          void assetsQuery.refetch();
        }}
      />
    );
  }

  const challengeRequest: WalletWithdrawalChallengeRequest = {
    asset,
    networkId: selectedNetwork.id,
    address: address.trim(),
    memo: memo.trim() || undefined,
    amount: amountValue,
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (address.trim().length < 20) next.address = 'Địa chỉ ví không hợp lệ.';
    if (selectedNetwork.requiresMemo && !memo.trim()) {
      next.memo = `${selectedNetwork.memoLabel ?? 'Memo'} là bắt buộc cho mạng này.`;
    }
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      next.amount = 'Nhập số tiền cần rút.';
    } else if (amountValue < selectedNetwork.minWithdraw) {
      next.amount = `Tối thiểu ${selectedNetwork.minWithdraw} ${asset}.`;
    } else if (amountValue > selectedNetwork.maxWithdraw) {
      next.amount = `Tối đa ${selectedNetwork.maxWithdraw} ${asset}.`;
    } else if (amountValue > assetData.available) {
      next.amount = 'Số dư không đủ.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const requestChallenge = async () => {
    setConfirmOpen(false);
    try {
      const challenge = await challengeMutation.mutateAsync({ request: challengeRequest });
      setCode('');
      setWorkflow({ step: 'verify', challenge });
    } catch {
      toast.error('Không thể tạo phiên xác minh. Vui lòng thử lại.');
    }
  };

  const verifyAndSubmit = async (challenge: WalletWithdrawalChallenge) => {
    if (!canWithdraw || submissionInFlight.current) return;
    submissionInFlight.current = true;
    try {
      let verification: WalletWithdrawalVerification;
      try {
        verification = await verificationMutation.mutateAsync({
          challengeId: challenge.id,
          code,
        });
      } catch (error) {
        toast.error(
          isApiError(error) && error.status === 401
            ? 'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'
            : 'Không thể hoàn tất xác minh. Vui lòng thử lại.',
        );
        return;
      }
      const signature = JSON.stringify({ challengeId: challenge.id, request: challengeRequest });
      if (withdrawalAttempt.current?.signature !== signature) {
        withdrawalAttempt.current = { signature, key: crypto.randomUUID() };
      }
      const receipt = await withdrawalMutation.mutateAsync({
        request: { ...challengeRequest, verificationToken: verification.verificationToken },
        idempotencyKey: withdrawalAttempt.current.key,
      });
      withdrawalAttempt.current = null;
      setWorkflow({ step: 'result', receipt });
      if (receipt.status === 'failed') {
        toast.error(
          'Yêu cầu rút tiền có trạng thái thất bại. Hãy kiểm tra mã giao dịch trước khi thử lại.',
        );
      } else {
        toast.success(TOAST.WALLET.WITHDRAW_SUBMITTED, { haptic: 'success' });
      }
    } catch {
      toast.error(
        'Chưa xác nhận được kết quả rút tiền. Hãy kiểm tra lịch sử giao dịch trước khi thử lại.',
      );
    } finally {
      submissionInFlight.current = false;
    }
  };

  if (workflow.step === 'result') {
    return (
      <WithdrawalSuccessState
        asset={asset}
        amount={amount}
        address={address}
        colors={colors}
        fee={fee}
        received={received}
        receipt={workflow.receipt}
        selectedNetwork={selectedNetwork}
      />
    );
  }

  if (workflow.step === 'verify') {
    return (
      <WithdrawalVerifyState
        challenge={workflow.challenge}
        code={code}
        colors={colors}
        errors={errors}
        canWithdraw={canWithdraw}
        busy={busy}
        onCodeChange={(nextCode) => {
          setCode(nextCode);
          setErrors((current) => ({ ...current, code: '' }));
        }}
        onSubmit={() => void verifyAndSubmit(workflow.challenge)}
        onBack={() => {
          if (!submissionInFlight.current) setWorkflow({ step: 'form' });
        }}
      />
    );
  }

  return (
    <PageLayout>
      <Header title={`Rút ${asset}`} subtitle="Rút tiền · Wallet" back />
      <PageContent gap="default">
        {!canWithdraw && (
          <p role="alert" style={{ color: colors.error, fontSize: 12 }}>
            Wallet withdrawal permission is required to submit a withdrawal.
          </p>
        )}
        <WithdrawalForm
          asset={asset}
          assetData={assetData}
          colors={colors}
          errors={errors}
          amount={amount}
          address={address}
          memo={memo}
          networks={networks}
          selectedNetwork={selectedNetwork}
          canWithdraw={canWithdraw}
          onNetworkChange={(event) => {
            setNetworkId(event.target.value);
            hapticSelection();
          }}
          onAddressChange={(event) => setAddress(event.target.value)}
          onMemoChange={(event) => setMemo(event.target.value)}
          onAmountChange={(event) => setAmount(event.target.value)}
          onSetMax={() =>
            setAmount(Math.min(assetData.available, selectedNetwork.maxWithdraw).toFixed(6))
          }
          onContinue={() => {
            if (!validate()) {
              hapticWarning();
              return;
            }
            hapticMedium();
            setConfirmOpen(true);
          }}
        />
      </PageContent>
      <WithdrawalConfirmation
        asset={asset}
        amount={amount}
        address={address}
        colors={colors}
        fee={fee}
        received={received}
        selectedNetwork={selectedNetwork}
        open={confirmOpen}
        busy={busy}
        canWithdraw={canWithdraw}
        onClose={() => setConfirmOpen(false)}
        onRequestChallenge={() => void requestChallenge()}
      />
    </PageLayout>
  );
}
