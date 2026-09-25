import type { ChangeEvent } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, Clock, Loader2, Shield, X } from 'lucide-react';
import { BottomSheetRow, BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { CTAButton } from '@/shared/ui/CTAButton';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtAmount } from '@/shared/lib/formatNumber';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import type {
  WalletAsset,
  WalletWithdrawalChallenge,
  WalletWithdrawalNetwork,
} from '../model/wallet-types';

type WithdrawalErrors = Record<string, string>;

interface WithdrawalFrameProps {
  asset: string;
}

interface WithdrawalErrorFrameProps extends WithdrawalFrameProps {
  onRetry: () => void;
}

export function WithdrawalLoadingState({
  asset,
  colors,
}: WithdrawalFrameProps & { colors: ThemeColors }) {
  return (
    <PageLayout>
      <Header title={`Rút ${asset}`} subtitle="Rút tiền · Wallet" back />
      <PageContent>
        <div
          className="flex items-center justify-center gap-3 py-16"
          style={{ color: colors.text2 }}
        >
          <Loader2 size={24} className="animate-spin" />
          <span>Đang tải chính sách rút tiền…</span>
        </div>
      </PageContent>
    </PageLayout>
  );
}

export function WithdrawalErrorState({ asset, onRetry }: WithdrawalErrorFrameProps) {
  return (
    <PageLayout>
      <Header title={`Rút ${asset}`} subtitle="Rút tiền · Wallet" back />
      <PageContent>
        <ErrorState
          title="Không thể tải thông tin rút tiền"
          message="Kiểm tra kết nối hoặc số dư rồi thử lại."
          onAction={onRetry}
        />
      </PageContent>
    </PageLayout>
  );
}

interface WithdrawalSuccessStateProps {
  asset: string;
  amount: string;
  address: string;
  colors: ThemeColors;
  fee: number;
  received: number;
  selectedNetwork: WalletWithdrawalNetwork;
}

export function WithdrawalSuccessState({
  asset,
  amount,
  address,
  colors,
  fee,
  received,
  selectedNetwork,
}: WithdrawalSuccessStateProps) {
  return (
    <PageLayout>
      <Header title="Rút tiền" subtitle="Rút tiền · Wallet" back />
      <PageContent>
        <div className="flex flex-col items-center gap-6">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full"
            style={{ background: colors.buyAlpha15, border: `2px solid ${colors.buyAlpha20}` }}
          >
            <CheckCircle size={48} color={colors.success} />
          </div>
          <div className="text-center">
            <h2 style={{ color: colors.text1, fontSize: 22, fontWeight: 700 }}>Yêu cầu đã gửi</h2>
            <p style={{ color: colors.text2, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
              Yêu cầu rút{' '}
              <strong style={{ color: colors.text1 }}>
                {amount} {asset}
              </strong>{' '}
              đang được xử lý.
            </p>
          </div>
          <TrCard className="flex w-full flex-col gap-3 p-4">
            <BottomSheetRow label="Mạng" value={selectedNetwork.name} />
            <BottomSheetRow label="Địa chỉ" value={`${address.slice(0, 8)}…${address.slice(-6)}`} />
            <BottomSheetRow label="Phí" value={`${fee} ${asset}`} />
            <BottomSheetRow label="Nhận được" value={`${received.toFixed(6)} ${asset}`} highlight />
            <BottomSheetRow label="Trạng thái" value="Đang xử lý" />
          </TrCard>
        </div>
      </PageContent>
    </PageLayout>
  );
}

interface WithdrawalVerifyStateProps {
  challenge?: WalletWithdrawalChallenge;
  code: string;
  colors: ThemeColors;
  errors: WithdrawalErrors;
  canWithdraw: boolean;
  busy: boolean;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function WithdrawalVerifyState({
  challenge,
  code,
  colors,
  errors,
  canWithdraw,
  busy,
  onCodeChange,
  onSubmit,
  onBack,
}: WithdrawalVerifyStateProps) {
  return (
    <PageLayout>
      <Header title="Xác minh 2FA" subtitle="Rút tiền · Wallet" back />
      <PageContent>
        <div className="flex flex-col items-center gap-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: colors.primaryAlpha12,
              border: `1px solid ${colors.primaryAlpha30}`,
            }}
          >
            <Shield size={32} color={colors.primary} />
          </div>
          <div className="text-center">
            <h2 style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>Xác minh bảo mật</h2>
            <p style={{ color: colors.text2, fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
              Nhập mã {challenge?.method === 'sms' ? 'SMS' : 'TOTP'}
              {challenge?.maskedDestination ? ` (${challenge.maskedDestination})` : ''} để xác nhận
              rút tiền.
            </p>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            aria-label="Mã xác minh 2FA"
            className="h-16 w-full rounded-2xl text-center"
            style={{
              background: colors.surface2,
              border: `1.5px solid ${errors.code ? colors.error : colors.primary}`,
              color: colors.text1,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 12,
              outline: 'none',
            }}
          />
          {errors.code && <p style={{ color: colors.error, fontSize: 12 }}>{errors.code}</p>}
          <CTAButton
            onClick={onSubmit}
            disabled={!canWithdraw || code.length < 6 || busy}
            loading={busy}
          >
            Xác nhận rút tiền
          </CTAButton>
          <button type="button" onClick={onBack} style={{ color: colors.text2, fontSize: 13 }}>
            Quay lại chỉnh sửa
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}

interface WithdrawalFormProps {
  asset: string;
  assetData: WalletAsset;
  colors: ThemeColors;
  errors: WithdrawalErrors;
  amount: string;
  address: string;
  memo: string;
  networks: WalletWithdrawalNetwork[];
  selectedNetwork: WalletWithdrawalNetwork;
  canWithdraw: boolean;
  onNetworkChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onAddressChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMemoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSetMax: () => void;
  onContinue: () => void;
}

export function WithdrawalForm({
  asset,
  assetData,
  colors,
  errors,
  amount,
  address,
  memo,
  networks,
  selectedNetwork,
  canWithdraw,
  onNetworkChange,
  onAddressChange,
  onMemoChange,
  onAmountChange,
  onSetMax,
  onContinue,
}: WithdrawalFormProps) {
  return (
    <>
      <TrCard className="flex items-center justify-between px-4 py-3">
        <span style={{ color: colors.text2, fontSize: 13 }}>Số dư khả dụng</span>
        <strong style={{ color: colors.text1, fontFamily: 'monospace' }}>
          {fmtAmount(assetData.available)} {asset}
        </strong>
      </TrCard>

      <div>
        <label
          htmlFor="withdraw-network"
          style={{ color: colors.text2, display: 'block', fontSize: 13, marginBottom: 6 }}
        >
          Mạng lưới
        </label>
        <div className="relative">
          <select
            id="withdraw-network"
            value={selectedNetwork.id}
            disabled={!canWithdraw}
            onChange={onNetworkChange}
            className="h-14 w-full appearance-none rounded-2xl px-4"
            style={{
              background: colors.surface2,
              border: `1.5px solid ${colors.borderSolid}`,
              color: colors.text1,
            }}
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name} · phí {network.fee} {asset}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-4"
            size={18}
            color={colors.text2}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="withdraw-address"
          style={{ color: colors.text2, display: 'block', fontSize: 13, marginBottom: 6 }}
        >
          Địa chỉ ví nhận
        </label>
        <input
          id="withdraw-address"
          value={address}
          disabled={!canWithdraw}
          onChange={onAddressChange}
          placeholder={`Nhập địa chỉ ${asset}`}
          className="h-14 w-full rounded-2xl px-4"
          style={{
            background: colors.surface2,
            border: `1.5px solid ${errors.address ? colors.error : colors.borderSolid}`,
            color: colors.text1,
          }}
        />
        {errors.address && (
          <p style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.address}</p>
        )}
      </div>

      {selectedNetwork.requiresMemo && (
        <div>
          <label
            htmlFor="withdraw-memo"
            style={{ color: colors.text2, display: 'block', fontSize: 13, marginBottom: 6 }}
          >
            {selectedNetwork.memoLabel ?? 'Memo'}
          </label>
          <input
            id="withdraw-memo"
            value={memo}
            disabled={!canWithdraw}
            onChange={onMemoChange}
            placeholder={selectedNetwork.memoPlaceholder ?? 'Nhập memo'}
            className="h-14 w-full rounded-2xl px-4"
            style={{
              background: colors.surface2,
              border: `1.5px solid ${errors.memo ? colors.error : colors.borderSolid}`,
              color: colors.text1,
            }}
          />
          {errors.memo && (
            <p style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.memo}</p>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 flex justify-between">
          <label htmlFor="withdraw-amount" style={{ color: colors.text2, fontSize: 13 }}>
            Số lượng rút
          </label>
          <button
            type="button"
            disabled={!canWithdraw}
            onClick={onSetMax}
            style={{ color: colors.primary, fontSize: 12 }}
          >
            Tất cả
          </button>
        </div>
        <input
          id="withdraw-amount"
          type="number"
          disabled={!canWithdraw}
          min={selectedNetwork.minWithdraw}
          max={Math.min(selectedNetwork.maxWithdraw, assetData.available)}
          step="any"
          value={amount}
          onChange={onAmountChange}
          placeholder="0.00"
          className="h-14 w-full rounded-2xl px-4"
          style={{
            background: colors.surface2,
            border: `1.5px solid ${errors.amount ? colors.error : colors.borderSolid}`,
            color: colors.text1,
            fontFamily: 'monospace',
            fontSize: 18,
          }}
        />
        {errors.amount && (
          <p style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.amount}</p>
        )}
      </div>

      <div
        className="flex items-start gap-2 rounded-2xl p-3"
        style={{ background: colors.warnAlpha10 }}
      >
        <Clock size={14} color={colors.warn} className="mt-0.5 shrink-0" />
        <span style={{ color: colors.warn, fontSize: 12, lineHeight: 1.5 }}>
          Giao dịch blockchain không thể hoàn tác. Bạn cần hoàn tất xác minh 2FA.
        </span>
      </div>

      <CTAButton disabled={!canWithdraw} onClick={onContinue} variant="primary">
        Tiếp tục →
      </CTAButton>
    </>
  );
}

interface WithdrawalConfirmationProps {
  asset: string;
  amount: string;
  address: string;
  colors: ThemeColors;
  fee: number;
  received: number;
  selectedNetwork: WalletWithdrawalNetwork;
  open: boolean;
  busy: boolean;
  canWithdraw: boolean;
  onClose: () => void;
  onRequestChallenge: () => void;
}

export function WithdrawalConfirmation({
  asset,
  amount,
  address,
  colors,
  fee,
  received,
  selectedNetwork,
  open,
  busy,
  canWithdraw,
  onClose,
  onRequestChallenge,
}: WithdrawalConfirmationProps) {
  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Xác nhận rút tiền">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl p-4" style={{ background: colors.surface2 }}>
          <BottomSheetRow label="Tài sản" value={`${amount} ${asset}`} />
          <BottomSheetRow label="Mạng" value={selectedNetwork.name} />
          <BottomSheetRow label="Địa chỉ" value={`${address.slice(0, 12)}…${address.slice(-8)}`} />
          <BottomSheetRow label="Phí" value={`${fee} ${asset}`} />
          <BottomSheetRow
            label="Nhận được"
            value={`${received.toFixed(6)} ${asset}`}
            highlight
            valueColor={colors.success}
          />
        </div>
        <div
          className="flex items-start gap-2 rounded-2xl p-3"
          style={{ background: colors.sellAlpha10 }}
        >
          <AlertTriangle size={16} color={colors.error} className="mt-0.5 shrink-0" />
          <span style={{ color: colors.error, fontSize: 12, lineHeight: 1.5 }}>
            Kiểm tra kỹ địa chỉ ví trước khi xác nhận.
          </span>
        </div>
        <div className="flex gap-3">
          <CTAButton onClick={onClose} variant="ghost" className="flex-1" fullWidth={false}>
            <X size={16} /> Sửa
          </CTAButton>
          <CTAButton
            onClick={onRequestChallenge}
            disabled={!canWithdraw || busy}
            loading={busy}
            className="flex-1"
            fullWidth={false}
          >
            <Shield size={16} /> Xác minh 2FA
          </CTAButton>
        </div>
      </div>
    </BottomSheetV2>
  );
}
