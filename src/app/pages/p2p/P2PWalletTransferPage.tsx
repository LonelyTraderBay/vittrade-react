/**
 * ══════════════════════════════════════════════════════════
 *  P2PWalletTransferPage — /p2p/wallet/transfer
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Transfer funds between P2P Wallet ↔ Main Wallet
 *  Internal transfer (instant, free)
 *  Tone: Clear, trust-building, frictionless
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRightLeft, Wallet, ArrowDownLeft, ArrowUpRight,
  Info, AlertTriangle, CheckCircle, ChevronRight, Zap,
  Shield, Clock, Eye, EyeOff,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { toast } from 'sonner';
import { fmtAmount, fmtVnd } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   Mock Balances
   ═══════════════════════════════════════════════════════════ */
interface WalletBalance {
  wallet: 'p2p' | 'main';
  asset: string;
  available: number;
  logo: string;
}

const MOCK_BALANCES: WalletBalance[] = [
  { wallet: 'p2p', asset: 'USDT', available: 12_450.50, logo: '💵' },
  { wallet: 'main', asset: 'USDT', available: 45_200.00, logo: '💵' },
  { wallet: 'p2p', asset: 'BTC', available: 0.0524, logo: '₿' },
  { wallet: 'main', asset: 'BTC', available: 0.1234, logo: '₿' },
  { wallet: 'p2p', asset: 'VND', available: 45_600_000, logo: '₫' },
  { wallet: 'main', asset: 'VND', available: 120_000_000, logo: '₫' },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PWalletTransferPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();
  const [searchParams] = useSearchParams();

  const initialAsset = searchParams.get('asset') || 'USDT';
  const initialType = searchParams.get('type') as 'deposit' | 'withdraw' || 'deposit';

  const [asset, setAsset] = useState(initialAsset);
  const [transferType, setTransferType] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const p2pBalance = MOCK_BALANCES.find(b => b.wallet === 'p2p' && b.asset === asset);
  const mainBalance = MOCK_BALANCES.find(b => b.wallet === 'main' && b.asset === asset);

  const sourceBalance = transferType === 'deposit' ? mainBalance : p2pBalance;
  const destBalance = transferType === 'deposit' ? p2pBalance : mainBalance;

  const sourceLabel = transferType === 'deposit' ? 'Main Wallet' : 'P2P Wallet';
  const destLabel = transferType === 'deposit' ? 'P2P Wallet' : 'Main Wallet';

  const numAmount = parseFloat(amount) || 0;
  const canTransfer = numAmount > 0 && sourceBalance && numAmount <= sourceBalance.available;

  const handleSetMax = () => {
    if (!sourceBalance) return;
    hapticSelection();
    const decimals = asset === 'BTC' ? 8 : asset === 'USDT' ? 2 : 0;
    setAmount(sourceBalance.available.toFixed(decimals));
  };

  const handleSwitchDirection = () => {
    hapticSelection();
    setTransferType(prev => prev === 'deposit' ? 'withdraw' : 'deposit');
  };

  const handleConfirm = () => {
    if (!canTransfer) {
      hapticError();
      return;
    }

    hapticSuccess();
    setShowConfirm(true);
  };

  const handleExecute = () => {
    hapticSuccess();
    toast.success('Chuyển tiền thành công');
    navigate(`${prefix}/p2p/wallet`);
  };

  const formatBalance = (value: number) => {
    if (asset === 'VND') return fmtVnd(value);
    if (asset === 'BTC') return fmtAmount(value, 8);
    return fmtAmount(value, 2);
  };

  if (showConfirm) {
    return (
      <PageLayout>
        <Header title="Xác nhận chuyển tiền" subtitle="Ví · P2P" back />

        <div className="px-5 py-6">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: hexToRgba('#3B82F6', 12) }}
            >
              <ArrowRightLeft size={40} color="#3B82F6" />
            </div>
            <h2 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700, marginBottom: 4 }}>
              Kiểm tra thông tin
            </h2>
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              Đảm bảo thông tin chính xác trước khi xác nhận
            </p>
          </div>

          {/* Details */}
          <TrCard rounded="lg" className="mb-6">
            <div className="p-4 border-b" style={{ borderColor: c.borderSolid }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Số tiền</p>
              <p style={{ color: c.text1, fontSize: φ.xl, fontWeight: 700 }}>
                {formatBalance(numAmount)} {asset}
              </p>
            </div>

            <div className="p-4 border-b" style={{ borderColor: c.borderSolid }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} color="#EF4444" />
                  <span style={{ color: c.text3, fontSize: 11 }}>Từ</span>
                </div>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {sourceLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={16} color="#10B981" />
                  <span style={{ color: c.text3, fontSize: 11 }}>Đến</span>
                </div>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {destLabel}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 11 }}>Phí giao dịch</span>
                <div className="flex items-center gap-1">
                  <Zap size={12} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>
                    Miễn phí
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 11 }}>Thời gian</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} color="#3B82F6" />
                  <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>
                    Tức thì
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: 11 }}>Loại giao dịch</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  Internal Transfer
                </span>
              </div>
            </div>
          </TrCard>

          {/* Security Notice */}
          <div
            className="p-3 rounded-lg flex items-start gap-2 mb-6"
            style={{ background: hexToRgba('#10B981', 10), border: `1px solid ${hexToRgba('#10B981', 30)}` }}
          >
            <Shield size={14} color="#10B981" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Giao dịch nội bộ giữa P2P Wallet và Main Wallet được xử lý tức thì và hoàn toàn miễn phí.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                hapticSelection();
                setShowConfirm(false);
              }}
              className="py-3 rounded-xl font-semibold text-sm"
              style={{ background: c.surface2, color: c.text1 }}
            >
              Quay lại
            </button>
            <CTAButton
              label="Xác nhận"
              onClick={handleExecute}
              icon={CheckCircle}
            />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Chuyển tiền"
        subtitle="Ví · P2P"
        back
      />

      {/* Transfer Direction Card */}
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4">
          <div className="flex items-center gap-3">
            {/* Source */}
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Từ</p>
              <div className="flex items-center gap-2">
                <Wallet size={16} color={transferType === 'deposit' ? '#3B82F6' : '#F59E0B'} />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  {sourceLabel}
                </span>
              </div>
              {sourceBalance && (
                <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                  Khả dụng: {formatBalance(sourceBalance.available)} {asset}
                </p>
              )}
            </div>

            {/* Switch Button */}
            <button
              onClick={handleSwitchDirection}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: hexToRgba('#3B82F6', 12) }}
            >
              <ArrowRightLeft size={18} color="#3B82F6" />
            </button>

            {/* Destination */}
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Đến</p>
              <div className="flex items-center gap-2">
                <Wallet size={16} color={transferType === 'deposit' ? '#F59E0B' : '#3B82F6'} />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  {destLabel}
                </span>
              </div>
              {destBalance && (
                <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                  Số dư: {formatBalance(destBalance.available)} {asset}
                </p>
              )}
            </div>
          </div>
        </TrCard>
      </div>

      {/* Asset Selection */}
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Chọn tài sản
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {['USDT', 'BTC', 'VND'].map(a => {
            const isSelected = asset === a;
            const balance = MOCK_BALANCES.find(b => b.wallet === 'p2p' && b.asset === a);

            return (
              <button
                key={a}
                onClick={() => {
                  hapticSelection();
                  setAsset(a);
                  setAmount('');
                }}
                className="p-3 rounded-xl text-center"
                style={{
                  background: isSelected ? hexToRgba('#3B82F6', 12) : c.surface1,
                  border: `1px solid ${isSelected ? '#3B82F6' : c.borderSolid}`,
                }}
              >
                <div className="text-2xl mb-2">{balance?.logo}</div>
                <p style={{
                  color: isSelected ? '#3B82F6' : c.text1,
                  fontSize: φ.xs,
                  fontWeight: 700,
                }}>
                  {a}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount Input */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Số tiền
          </h3>
          <button
            onClick={handleSetMax}
            className="px-2 py-1 rounded-md text-xs font-semibold"
            style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}
          >
            MAX
          </button>
        </div>

        <InputField
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix={asset}
        />

        {numAmount > 0 && sourceBalance && numAmount > sourceBalance.available && (
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle size={12} color="#EF4444" />
            <p style={{ color: '#EF4444', fontSize: 10 }}>
              Số dư không đủ
            </p>
          </div>
        )}
      </div>

      {/* Quick Amount Buttons */}
      {sourceBalance && (
        <div className="px-5 mb-6">
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map(percent => {
              const quickAmount = (sourceBalance.available * percent) / 100;
              const decimals = asset === 'BTC' ? 8 : asset === 'USDT' ? 2 : 0;

              return (
                <button
                  key={percent}
                  onClick={() => {
                    hapticSelection();
                    setAmount(quickAmount.toFixed(decimals));
                  }}
                  className="py-2 rounded-lg text-xs font-semibold"
                  style={{ background: c.surface2, color: c.text2 }}
                >
                  {percent}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Banners */}
      <div className="px-5 mb-6 flex flex-col gap-3">
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#10B981', 10), border: `1px solid ${hexToRgba('#10B981', 30)}` }}
        >
          <Zap size={14} color="#10B981" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Miễn phí & Tức thì
            </p>
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Chuyển tiền nội bộ hoàn toàn miễn phí và được xử lý ngay lập tức.
            </p>
          </div>
        </div>

        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
        >
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
            P2P Wallet và Main Wallet hoạt động độc lập để đảm bảo an toàn. Số dư trong escrow không thể chuyển.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="px-5">
        <CTAButton
          label={`Chuyển ${numAmount > 0 ? formatBalance(numAmount) : ''} ${asset}`}
          onClick={handleConfirm}
          disabled={!canTransfer}
          icon={ChevronRight}
        />
      </div>
    </PageLayout>
  );
}