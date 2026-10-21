/**
 * DCA Create Plan Sheet
 *
 * Bottom sheet for creating new DCA plan
 * Migrated to useThemeColors() — no direct CSS var references
 *
 * @module components/dca
 */

import { useEffect, useId, useState } from 'react';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import type { CreateDCAPlanRequest, DCAFrequency } from '../model/dca-types';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { textRoleStyle } from '@/shared/theme/typography';
import { DcaPlanCoinIcon } from './DcaPlanCoinIcon';

/**
 * DCACreatePlanSheet Props
 */
export interface DCACreatePlanSheetProps {
  open: boolean;
  onClose: () => void;
  /** Only confirmed success permits resetting the draft; false also covers an unknown outcome. */
  onCreate: (request: CreateDCAPlanRequest) => Promise<boolean>;
  isCreating?: boolean;
  /** Derived from the owner's mutation; keep failure feedback inside the open modal. */
  creationUnconfirmed?: boolean;
  /** Preselected coin symbol (for deep linking from wallet) */
  preselectedCoin?: string | null;
}

/**
 * Available coins
 */
const AVAILABLE_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { symbol: 'BNB', name: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
];

/**
 * Frequency options
 */
const FREQUENCY_OPTIONS: { value: DCAFrequency; label: string }[] = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
];

/**
 * Amount presets (VND)
 */
const AMOUNT_PRESETS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

/**
 * DCA Create Plan Sheet Component
 */
export function DCACreatePlanSheet({
  open,
  onClose,
  onCreate,
  isCreating,
  creationUnconfirmed = false,
  preselectedCoin,
}: DCACreatePlanSheetProps) {
  const c = useThemeColors();
  const [coinSymbol, setCoinSymbol] = useState<string>(preselectedCoin || 'BTC');
  const [frequency, setFrequency] = useState<DCAFrequency>('weekly');
  const [amount, setAmount] = useState<string>('500000');
  const amountId = useId();
  const belowMinimum = parseInt(amount) < 10_000;

  useEffect(() => {
    if (preselectedCoin) setCoinSymbol(preselectedCoin);
  }, [preselectedCoin]);

  const handleCreate = async () => {
    const request: CreateDCAPlanRequest = {
      coinSymbol,
      frequency,
      amountPerPurchase: parseInt(amount),
    };

    if (!(await onCreate(request))) return;

    // Reset form
    setCoinSymbol('BTC');
    setFrequency('weekly');
    setAmount('500000');
  };

  const formatVND = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Tạo Kế Hoạch DCA Mới"
      preventClose={isCreating}
    >
      <div className="space-y-6 pb-6">
        {/* Select Coin */}
        <fieldset className="min-w-0" disabled={isCreating}>
          <legend className="mb-3" style={{ ...textRoleStyle('bodyMedium'), color: c.text1 }}>
            Chọn Coin
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_COINS.map((coin) => (
              <button
                key={coin.symbol}
                type="button"
                disabled={isCreating}
                aria-pressed={coinSymbol === coin.symbol}
                onClick={() => setCoinSymbol(coin.symbol)}
                className="p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: coinSymbol === coin.symbol ? c.primary : c.border,
                  background: coinSymbol === coin.symbol ? c.primaryAlpha08 : c.surface2,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <DcaPlanCoinIcon
                    icon={coin.icon}
                    symbol={coin.symbol}
                    alt={coin.name}
                    size={32}
                  />
                  <div className="text-[12px] font-medium" style={{ color: c.text1 }}>
                    {coin.symbol}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Select Frequency */}
        <fieldset className="min-w-0" disabled={isCreating}>
          <legend className="mb-3" style={{ ...textRoleStyle('bodyMedium'), color: c.text1 }}>
            Tần Suất Mua
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isCreating}
                aria-pressed={frequency === option.value}
                onClick={() => setFrequency(option.value)}
                className="h-11 rounded-xl border-2 transition-all text-[14px] font-medium"
                style={{
                  borderColor: frequency === option.value ? c.primary : c.border,
                  background: frequency === option.value ? c.primaryAlpha08 : c.surface2,
                  color: frequency === option.value ? c.primary : c.text1,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Amount Input */}
        <div>
          <InputField
            id={amountId}
            label="Số Tiền Mỗi Lần (VND)"
            type="text"
            inputMode="numeric"
            required
            value={amount}
            disabled={isCreating}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setAmount(value);
            }}
            placeholder="500.000"
            helper="Tối thiểu 10.000 VND mỗi lần mua."
            error={amount && belowMinimum ? 'Nhập ít nhất 10.000 VND.' : undefined}
            suffix={
              <span aria-hidden="true" style={{ color: c.text2 }}>
                VND
              </span>
            }
            containerClassName="mb-3"
          />

          {/* Display formatted */}
          <div className="text-[14px] mb-3" style={{ color: c.text2 }}>
            = {formatVND(parseInt(amount) || 0)} VND
          </div>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                disabled={isCreating}
                onClick={() => setAmount(preset.toString())}
                className="h-9 rounded-lg text-[12px] font-medium transition-colors"
                style={{ background: c.surface2, color: c.text1 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = c.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = c.surface2;
                }}
              >
                {formatVND(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: c.surface2 }}>
          <div className="text-[14px] font-medium mb-3" style={{ color: c.text1 }}>
            Tóm Tắt
          </div>

          <div className="flex justify-between text-[14px]">
            <span style={{ color: c.text2 }}>Coin:</span>
            <span className="font-medium" style={{ color: c.text1 }}>
              {coinSymbol}
            </span>
          </div>

          <div className="flex justify-between text-[14px]">
            <span style={{ color: c.text2 }}>Tần suất:</span>
            <span className="font-medium" style={{ color: c.text1 }}>
              {FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label}
            </span>
          </div>

          <div className="flex justify-between text-[14px]">
            <span style={{ color: c.text2 }}>Mỗi lần:</span>
            <span className="font-medium" style={{ color: c.text1 }}>
              {formatVND(parseInt(amount) || 0)} VND
            </span>
          </div>

          {/* Monthly estimate */}
          <div
            className="flex justify-between text-[14px] pt-2 border-t"
            style={{ borderColor: c.border }}
          >
            <span style={{ color: c.text2 }}>Ước tính/tháng:</span>
            <span className="font-medium" style={{ color: c.text1 }}>
              {formatVND(
                frequency === 'daily'
                  ? (parseInt(amount) || 0) * 30
                  : frequency === 'weekly'
                    ? (parseInt(amount) || 0) * 4
                    : parseInt(amount) || 0,
              )}{' '}
              VND
            </span>
          </div>
        </div>

        {/* Create Button */}
        {creationUnconfirmed && (
          <p role="alert" style={{ ...textRoleStyle('body'), color: c.errorText }}>
            Chưa nhận được xác nhận tạo kế hoạch. Dữ liệu đã được giữ nguyên. Hãy kiểm tra danh sách
            kế hoạch trước khi thử lại.
          </p>
        )}
        <CTAButton
          onClick={handleCreate}
          loading={isCreating}
          disabled={isCreating || !amount || belowMinimum}
        >
          {isCreating ? 'Đang tạo...' : 'Tạo Kế Hoạch'}
        </CTAButton>

        {/* Disclaimer */}
        <div className="text-[12px] text-center" style={{ color: c.text3 }}>
          Bạn có thể tạm dừng hoặc chỉnh sửa kế hoạch bất cứ lúc nào.
        </div>
      </div>
    </BottomSheetV2>
  );
}
