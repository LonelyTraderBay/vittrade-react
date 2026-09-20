/**
 * DCA Create Plan Sheet
 * 
 * Bottom sheet for creating new DCA plan
 * Migrated to useThemeColors() — no direct CSS var references
 * 
 * @module components/dca
 */

import { useState } from 'react';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { CreateDCAPlanRequest, DCAFrequency } from '../../types/dca';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * DCACreatePlanSheet Props
 */
export interface DCACreatePlanSheetProps {
  open: boolean;
  onClose: () => void;
  onCreate: (request: CreateDCAPlanRequest) => Promise<void>;
  isCreating?: boolean;
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
export function DCACreatePlanSheet({ open, onClose, onCreate, isCreating, preselectedCoin }: DCACreatePlanSheetProps) {
  const c = useThemeColors();
  const [coinSymbol, setCoinSymbol] = useState<string>(preselectedCoin || 'BTC');
  const [frequency, setFrequency] = useState<DCAFrequency>('weekly');
  const [amount, setAmount] = useState<string>('500000');

  const handleCreate = async () => {
    const request: CreateDCAPlanRequest = {
      coinSymbol,
      frequency,
      amountPerPurchase: parseInt(amount),
    };

    await onCreate(request);
    
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
        <div>
          <label className="block text-[14px] font-medium mb-3" style={{ color: c.text1 }}>
            Chọn Coin
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_COINS.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => setCoinSymbol(coin.symbol)}
                className="p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: coinSymbol === coin.symbol ? c.primary : c.border,
                  background: coinSymbol === coin.symbol ? c.primary + '10' : c.surface2,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={coin.icon}
                    alt={coin.name}
                    className="w-8 h-8"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=random`;
                    }}
                  />
                  <div className="text-[12px] font-medium" style={{ color: c.text1 }}>
                    {coin.symbol}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Select Frequency */}
        <div>
          <label className="block text-[14px] font-medium mb-3" style={{ color: c.text1 }}>
            Tần Suất Mua
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFrequency(option.value)}
                className="h-11 rounded-xl border-2 transition-all text-[14px] font-medium"
                style={{
                  borderColor: frequency === option.value ? c.primary : c.border,
                  background: frequency === option.value ? c.primary + '10' : c.surface2,
                  color: frequency === option.value ? c.primary : c.text1,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-[14px] font-medium mb-3" style={{ color: c.text1 }}>
            Số Tiền Mỗi Lần (VND)
          </label>
          
          {/* Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setAmount(value);
              }}
              className="w-full h-14 px-4 pr-16 rounded-xl border-2 outline-none text-[18px] font-medium transition-colors"
              style={{
                background: c.surface2,
                borderColor: c.border,
                color: c.text1,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = c.primary; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = c.border; }}
              placeholder="500.000"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: c.text2 }}>
              VND
            </div>
          </div>

          {/* Display formatted */}
          <div className="text-[14px] mb-3" style={{ color: c.text2 }}>
            = {formatVND(parseInt(amount) || 0)} VND
          </div>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="h-9 rounded-lg text-[12px] font-medium transition-colors"
                style={{ background: c.surface2, color: c.text1 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.surface2; }}
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
            <span className="font-medium" style={{ color: c.text1 }}>{coinSymbol}</span>
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
          <div className="flex justify-between text-[14px] pt-2 border-t" style={{ borderColor: c.border }}>
            <span style={{ color: c.text2 }}>Ước tính/tháng:</span>
            <span className="font-medium" style={{ color: c.text1 }}>
              {formatVND(
                frequency === 'daily'
                  ? (parseInt(amount) || 0) * 30
                  : frequency === 'weekly'
                  ? (parseInt(amount) || 0) * 4
                  : parseInt(amount) || 0
              )}{' '}
              VND
            </span>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={isCreating || !amount || parseInt(amount) < 10000}
          className="w-full h-12 rounded-xl text-white text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: c.primary }}
        >
          {isCreating ? 'Đang tạo...' : 'Tạo Kế Hoạch'}
        </button>

        {/* Disclaimer */}
        <div className="text-[12px] text-center" style={{ color: c.text3 }}>
          Bạn có thể tạm dừng hoặc chỉnh sửa kế hoạch bất cứ lúc nào.
        </div>
      </div>
    </BottomSheetV2>
  );
}
