import type { ReactNode } from 'react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors, type ThemeColors } from '@/shared/hooks/useThemeColors';
import type { P2PAdCreateRequest, P2PAdType } from '../model/p2p-types';

const paymentOptions = [
  'Vietcombank',
  'Techcombank',
  'VietinBank',
  'BIDV',
  'MB Bank',
  'ACB',
  'Momo',
  'ZaloPay',
  'VNPay',
];

interface P2PCreateAdFormProps {
  colors: ThemeColors;
  adType: P2PAdType;
  asset: string;
  currency: string;
  priceType: 'fixed' | 'floating';
  price: string;
  priceMargin: string;
  available: string;
  minLimit: string;
  maxLimit: string;
  paymentMethods: string[];
  paymentWindow: string;
  tradingHours: string;
  minKycLevel: string;
  minCompletedTrades: string;
  minRegisteredDays: string;
  remarks: string;
  autoReply: string;
  validationMessage: string | null;
  errorMessage: string | null;
  canWriteAds: boolean;
  canSubmit: boolean;
  submitPending: boolean;
  onSubmit: () => void;
  onOpenConfirmation: () => void;
  onAdTypeChange: (value: P2PAdType) => void;
  onAssetChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onPriceTypeChange: (value: 'fixed' | 'floating') => void;
  onPriceChange: (value: string) => void;
  onPriceMarginChange: (value: string) => void;
  onAvailableChange: (value: string) => void;
  onMinLimitChange: (value: string) => void;
  onMaxLimitChange: (value: string) => void;
  onPaymentToggle: (method: string) => void;
  onPaymentWindowChange: (value: string) => void;
  onTradingHoursChange: (value: string) => void;
  onMinKycLevelChange: (value: string) => void;
  onMinCompletedTradesChange: (value: string) => void;
  onMinRegisteredDaysChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
  onAutoReplyChange: (value: string) => void;
}

export function P2PCreateAdForm({
  colors,
  adType,
  asset,
  currency,
  priceType,
  price,
  priceMargin,
  available,
  minLimit,
  maxLimit,
  paymentMethods,
  paymentWindow,
  tradingHours,
  minKycLevel,
  minCompletedTrades,
  minRegisteredDays,
  remarks,
  autoReply,
  validationMessage,
  errorMessage,
  canWriteAds,
  canSubmit,
  submitPending,
  onSubmit,
  onOpenConfirmation,
  onAdTypeChange,
  onAssetChange,
  onCurrencyChange,
  onPriceTypeChange,
  onPriceChange,
  onPriceMarginChange,
  onAvailableChange,
  onMinLimitChange,
  onMaxLimitChange,
  onPaymentToggle,
  onPaymentWindowChange,
  onTradingHoursChange,
  onMinKycLevelChange,
  onMinCompletedTradesChange,
  onMinRegisteredDaysChange,
  onRemarksChange,
  onAutoReplyChange,
}: P2PCreateAdFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <TrCard className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton active={adType === 'buy'} onClick={() => onAdTypeChange('buy')}>
            Tôi muốn MUA
          </ChoiceButton>
          <ChoiceButton active={adType === 'sell'} onClick={() => onAdTypeChange('sell')}>
            Tôi muốn BÁN
          </ChoiceButton>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FieldLabel label="Tài sản">
            <select value={asset} onChange={(event) => onAssetChange(event.target.value)}>
              <option>USDT</option>
              <option>BTC</option>
              <option>ETH</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Tiền tệ">
            <select value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
              <option>VND</option>
              <option>USD</option>
            </select>
          </FieldLabel>
        </div>
      </TrCard>

      <TrCard className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton active={priceType === 'fixed'} onClick={() => onPriceTypeChange('fixed')}>
            Giá cố định
          </ChoiceButton>
          <ChoiceButton
            active={priceType === 'floating'}
            onClick={() => onPriceTypeChange('floating')}
          >
            Giá thả nổi
          </ChoiceButton>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FieldLabel label={`Giá (${currency}/${asset})`} required>
            <input
              aria-label={`Giá (${currency}/${asset})`}
              type="number"
              min="0"
              value={price}
              onChange={(event) => onPriceChange(event.target.value)}
            />
          </FieldLabel>
          {priceType === 'floating' && (
            <FieldLabel label="Biên độ giá (%)">
              <input
                aria-label="Biên độ giá (%)"
                type="number"
                value={priceMargin}
                onChange={(event) => onPriceMarginChange(event.target.value)}
              />
            </FieldLabel>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <FieldLabel label={`Tổng ${asset}`} required>
            <input
              aria-label={`Tổng ${asset}`}
              type="number"
              min="0"
              value={available}
              onChange={(event) => onAvailableChange(event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label={`Tối thiểu (${currency})`} required>
            <input
              aria-label={`Tối thiểu (${currency})`}
              type="number"
              min="0"
              value={minLimit}
              onChange={(event) => onMinLimitChange(event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label={`Tối đa (${currency})`} required>
            <input
              aria-label={`Tối đa (${currency})`}
              type="number"
              min="0"
              value={maxLimit}
              onChange={(event) => onMaxLimitChange(event.target.value)}
            />
          </FieldLabel>
        </div>
      </TrCard>

      <TrCard className="p-4">
        <div className="flex flex-col gap-2 text-xs" style={{ color: colors.text2 }}>
          <span>
            Phương thức thanh toán <span style={{ color: colors.sell }}>*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {paymentOptions.map((method) => (
              <button
                key={method}
                type="button"
                aria-pressed={paymentMethods.includes(method)}
                onClick={() => onPaymentToggle(method)}
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  background: paymentMethods.includes(method) ? colors.primary : colors.surface2,
                  color: paymentMethods.includes(method) ? '#fff' : colors.text2,
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FieldLabel label="Thời gian thanh toán">
            <select
              value={paymentWindow}
              onChange={(event) => onPaymentWindowChange(event.target.value)}
            >
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="60">60 phút</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Giờ giao dịch">
            <select
              value={tradingHours}
              onChange={(event) => onTradingHoursChange(event.target.value)}
            >
              <option>24/7</option>
              <option>08:00 - 22:00</option>
              <option>08:00 - 17:00</option>
            </select>
          </FieldLabel>
        </div>
      </TrCard>

      <TrCard className="p-4">
        <p className="text-sm font-semibold" style={{ color: colors.text1 }}>
          Điều kiện đối tác (tuỳ chọn)
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <FieldLabel label="KYC tối thiểu">
            <input
              aria-label="KYC tối thiểu"
              type="number"
              min="0"
              value={minKycLevel}
              onChange={(event) => onMinKycLevelChange(event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="Số đơn tối thiểu">
            <input
              aria-label="Số đơn tối thiểu"
              type="number"
              min="0"
              value={minCompletedTrades}
              onChange={(event) => onMinCompletedTradesChange(event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="Số ngày tối thiểu">
            <input
              aria-label="Số ngày tối thiểu"
              type="number"
              min="0"
              value={minRegisteredDays}
              onChange={(event) => onMinRegisteredDaysChange(event.target.value)}
            />
          </FieldLabel>
        </div>
        <div className="mt-4 grid gap-3">
          <FieldLabel label="Điều kiện giao dịch">
            <textarea
              value={remarks}
              onChange={(event) => onRemarksChange(event.target.value)}
              rows={2}
            />
          </FieldLabel>
          <FieldLabel label="Tin nhắn tự động">
            <textarea
              value={autoReply}
              onChange={(event) => onAutoReplyChange(event.target.value)}
              rows={2}
            />
          </FieldLabel>
        </div>
      </TrCard>

      {validationMessage && (
        <p role="alert" className="text-sm" style={{ color: colors.sell }}>
          {validationMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm" style={{ color: colors.sell }}>
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        disabled={!canWriteAds || !canSubmit || submitPending}
        onClick={onOpenConfirmation}
        className="rounded-xl py-3 font-semibold"
        style={{
          background: canSubmit ? colors.primary : colors.surface2,
          color: canSubmit ? '#fff' : colors.text3,
        }}
      >
        Xem xác nhận đăng quảng cáo
      </button>
    </form>
  );
}

interface P2PCreateAdConfirmationProps {
  request: P2PAdCreateRequest;
  colors: ThemeColors;
  open: boolean;
  canWriteAds: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function P2PCreateAdConfirmation({
  request,
  colors,
  open,
  canWriteAds,
  pending,
  onClose,
  onConfirm,
}: P2PCreateAdConfirmationProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" role="dialog">
      <div className="w-full max-w-lg rounded-2xl p-5" style={{ background: colors.surface }}>
        <h2 style={{ color: colors.text1, fontWeight: 700 }}>Xác nhận đăng quảng cáo</h2>
        <p className="mt-2 text-sm" style={{ color: colors.text2 }}>
          {request.type === 'sell' ? 'BÁN' : 'MUA'} {request.available} {request.asset} với giá{' '}
          {formatMoney(request.price)} {request.currency}.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg px-3 py-2"
            style={{ background: colors.surface2, color: colors.text2 }}
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canWriteAds || pending}
            className="flex-1 rounded-lg px-3 py-2 font-semibold"
            style={{ background: colors.primary, color: '#fff' }}
          >
            {pending ? 'Đang đăng…' : 'Xác nhận đăng'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs" style={{ color: colors.text2 }}>
      <span>
        {label} {required && <span style={{ color: colors.sell }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-sm font-semibold"
      style={{
        background: active ? colors.primary : colors.surface2,
        color: active ? '#fff' : colors.text2,
      }}
    >
      {children}
    </button>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}
