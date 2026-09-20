import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowDown, AlertTriangle, Info, CheckCircle, X, ChevronDown, Loader2, Shield, Clock, BookOpen, ScanLine,
} from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { InputField, InputWrapper } from '../../components/ui/InputField';
import { TrCard } from '../../components/ui/TrCard';
import { Header } from '../../components/layout/Header';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { fmtAmount } from '../../data/formatNumber';
import { WITHDRAW_NETWORKS, USER_ASSETS } from '../../data/mockData';
import type { WithdrawNetwork } from '../../data/mockData';
import { TOAST } from '../../data/toastMessages';
import { CTAButton } from '../../components/ui/CTAButton';
import { useActionToast } from '../../hooks/useActionToast';
import { QRScannerOverlay } from '../../components/ui/QRScannerOverlay';
import { BiometricPrompt, useBiometricPrompt } from '../../components/states/BiometricPrompt';

const RECENT_ADDRESSES = [
  { label: 'Ví lạnh cá nhân', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'BTC', lastUsed: '20/02' },
  { label: 'Binance Exchange', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f', network: 'ETH (ERC20)', lastUsed: '18/02' },
  { label: 'Sàn OKX', address: 'TN3W4H6rK2ce4vX9YnFQHwKx8Vq9m6dxWc', network: 'TRC20', lastUsed: '10/02' },
];

type Step = 'form' | 'confirm' | 'verify' | 'success';

export function WithdrawPage() {
  const { asset = 'USDT' } = useParams();
  const networks = WITHDRAW_NETWORKS[asset as keyof typeof WITHDRAW_NETWORKS] ?? WITHDRAW_NETWORKS.USDT;
  const assetData = USER_ASSETS.find(a => a.symbol === asset) ?? USER_ASSETS[0];

  const [step, setStep] = useState<Step>('form');
  const [selectedNet, setSelectedNet] = useState(networks[0]);
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [showNetPicker, setShowNetPicker] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { hapticSelection, hapticSuccess, hapticWarning, hapticMedium } = useHaptic();
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const navigate = useNavigate();
  const actionToast = useActionToast();
  const biometricPrompt = useBiometricPrompt();

  const requiresMemo = !!selectedNet.requiresMemo;
  const memoLabel = selectedNet.memoLabel || 'Memo';
  const memoPlaceholder = selectedNet.memoPlaceholder || `Nhập ${memoLabel}`;

  const amountNum = parseFloat(amount || '0');
  const fee = selectedNet.fee;
  const received = Math.max(0, amountNum - (typeof fee === 'number' ? fee : 0));
  const isValidAmount = amountNum >= selectedNet.minWithdraw && amountNum <= Math.min(selectedNet.maxWithdraw, assetData.available);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ ví';
    if (address.length < 20) e.address = 'Địa chỉ ví không hợp lệ';
    if (requiresMemo && !memo.trim()) e.memo = `${memoLabel} là bắt buộc cho mạng ${selectedNet.name}`;
    if (!amount || amountNum <= 0) e.amount = 'Vui lòng nhập số tiền';
    if (amountNum < selectedNet.minWithdraw) e.amount = `Tối thiểu ${selectedNet.minWithdraw} ${asset}`;
    if (amountNum > assetData.available) e.amount = 'Số dư không đủ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) { hapticWarning(); return; }
    hapticMedium();
    setShowConfirmSheet(true);
  };

  const handleConfirm = async () => {
    setShowConfirmSheet(false);
    // ── Biometric verification replaces manual OTP ──
    const ok = await biometricPrompt.requestBiometric('Xác nhận rút tiền');
    if (ok) {
      setIsLoading(true);
      hapticMedium();
      await new Promise(r => setTimeout(r, 1500));
      setStep('success');
      setIsLoading(false);
      actionToast.success(TOAST.WALLET.WITHDRAW_SUBMITTED, { haptic: 'success' });
    }
  };

  // Remove old handleVerify — biometric replaces it

  // ═══ Step: Success ═══
  if (step === 'success') {
    return (
      <PageLayout>
        <Header title="Rút tiền" subtitle="Rút tiền · Wallet" back />
        <PageContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: c.buyAlpha15, border: `2px solid ${c.buyAlpha20}` }}>
            <CheckCircle size={48} color={c.success} />
          </div>
          <div className="text-center">
            <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>Yêu cầu đã gửi!</h2>
            <p style={{ color: c.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
              Yêu cầu rút <strong style={{ color: c.text1 }}>{amount} {asset}</strong> đang được xử lý.
              Thời gian ước tính: <strong style={{ color: c.text1 }}>~30 phút</strong>.
            </p>
          </div>
          <TrCard className="w-full p-4 flex flex-col gap-3">
            {[
              { label: 'Tài sản', value: `${amount} ${asset}` },
              { label: 'Mạng', value: selectedNet.name },
              { label: 'Địa chỉ', value: `${address.slice(0, 8)}...${address.slice(-6)}` },
              ...(requiresMemo && memo ? [{ label: memoLabel, value: memo }] : []),
              { label: 'Phí', value: `${fee} ${asset}` },
              { label: 'Nhận được', value: `${received.toFixed(6)} ${asset}` },
              { label: 'Trạng thái', value: '⏳ Đang xử lý' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
              </div>
            ))}
          </TrCard>
          <p style={{ color: c.text3, fontSize: 12, textAlign: 'center' }}>
            Bạn có thể theo dõi trạng thái trong Lịch sử giao dịch
          </p>
        </div>
        </PageContent>
      </PageLayout>
    );
  }

  // ═══ Step: Verify 2FA — kept as fallback for devices without biometric ═══
  if (step === 'verify') {
    return (
      <PageLayout>
        <BiometricPrompt {...biometricPrompt.promptProps} />
        <Header title="Xác minh 2FA" subtitle="Rút tiền · Wallet" back />
        <PageContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: c.primaryAlpha12, border: `1.5px solid ${c.primaryAlpha30}` }}>
            <Shield size={32} color={c.primary} />
          </div>
          <div className="text-center">
            <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Xác minh bảo mật</h2>
            <p style={{ color: c.text2, fontSize: 13, marginTop: 8 }}>
              Nhập mã từ ứng dụng Google Authenticator để xác nhận rút tiền
            </p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>(Demo: nhập 6 số bất kỳ)</p>
          </div>
          <input type="tel" inputMode="numeric" maxLength={6} value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full h-16 text-center rounded-2xl"
            style={{ background: c.surface2, border: `1.5px solid ${c.primary}`, color: c.text1, fontSize: 28, fontWeight: 700, outline: 'none', letterSpacing: 12 }} />
          <CTAButton
            onClick={handleVerify}
            disabled={otp.length < 6}
            loading={isLoading}
            variant="primary"
          >
            {isLoading ? 'Đang xác minh...' : 'Xác nhận rút tiền'}
          </CTAButton>
        </div>
        </PageContent>
      </PageLayout>
    );
  }

  // ═══ Step: Form (main) ═══
  return (
    <PageLayout>
      {/* ═══ Biometric Prompt ═══ */}
      <BiometricPrompt {...biometricPrompt.promptProps} />

      {/* ═══ QR Scanner Overlay ═══ */}
      <QRScannerOverlay
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={(result) => {
          setAddress(result);
          actionToast.success({ title: 'Đã dán địa chỉ', description: `${result.slice(0, 16)}...` }, { haptic: 'success' });
        }}
        title={`Quét QR — ${asset}`}
      />

      {/* ═══ Vaul BottomSheet — Confirm Dialog ═══ */}
      <BottomSheetV2
        open={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        title="Xác nhận rút tiền"
      >
        <div className="flex flex-col gap-4">
          {/* Transaction details */}
          <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Tài sản" value={asset} />
            <BottomSheetRow label="Mạng" value={selectedNet.name} />
            <BottomSheetRow label="Địa chỉ đến" value={`${address.slice(0, 12)}...${address.slice(-8)}`} />
            {requiresMemo && memo && (
              <BottomSheetRow label={memoLabel} value={memo} />
            )}
            <BottomSheetRow label="Số lượng" value={`${amount} ${asset}`} highlight />
            <BottomSheetRow label="Phí mạng" value={`${fee} ${asset}`} />
            <BottomSheetRow label="Nhận được" value={`${received.toFixed(6)} ${asset}`} highlight valueColor={c.success} />
          </div>

          {/* Memo warning in confirm sheet */}
          {requiresMemo && memo && (
            <div className="rounded-2xl p-3" style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.warn} className="shrink-0 mt-0.5" />
                <p style={{ color: c.warningText, fontSize: 12, lineHeight: 1.5 }}>
                  Kiểm tra kỹ <strong>{memoLabel}: {memo}</strong>. Sai {memoLabel} sẽ khiến giao dịch không được ghi nhận.
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="rounded-2xl p-4" style={{ background: c.sellAlpha10, border: `1px solid ${c.sellAlpha20}` }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} color={c.error} className="shrink-0 mt-0.5" />
              <p style={{ color: '#F87171', fontSize: 13, lineHeight: 1.6 }}>
                <strong>Kiểm tra kỹ địa chỉ ví!</strong> Giao dịch blockchain không thể hoàn tác sau khi xác nhận.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <CTAButton
              onClick={() => setShowConfirmSheet(false)}
              variant="ghost"
              bg={c.surface2}
              textColor={c.text2}
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15, boxShadow: 'none' }}
            >
              <X size={16} /> Chỉnh sửa
            </CTAButton>
            <CTAButton
              onClick={handleConfirm}
              variant="primary"
              fullWidth={false}
              className="flex-1"
              style={{ fontSize: 15 }}
            >
              <Shield size={16} /> Xác nhận
            </CTAButton>
          </div>
        </div>
      </BottomSheetV2>

      {/* ═══ Network Picker BottomSheet ═══ */}
      <BottomSheetV2
        open={showNetPicker}
        onClose={() => setShowNetPicker(false)}
        title="Chọn mạng lưới"
      >
        <div className="flex flex-col gap-1">
          {networks.map(net => (
            <button key={net.id} onClick={() => { setSelectedNet(net); setShowNetPicker(false); hapticSelection(); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl market-row"
              style={{ background: net.id === selectedNet.id ? c.primaryAlpha12 : 'transparent' }}>
              <div>
                <div className="flex items-center gap-2">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, textAlign: 'left' }}>{net.name}</p>
                  {(net as any).requiresMemo && (
                    <span className="px-1.5 py-0.5 rounded"
                      style={{ background: c.warnAlpha15, color: c.warn, fontSize: 9, fontWeight: 700 }}>
                      {(net as any).memoLabel || 'Memo'}
                    </span>
                  )}
                </div>
                <p style={{ color: c.text3, fontSize: 12 }}>Phí: {net.fee} {asset} • Tối thiểu: {net.minWithdraw}</p>
              </div>
              {net.id === selectedNet.id && <CheckCircle size={16} color={c.primary} />}
            </button>
          ))}
        </div>
      </BottomSheetV2>

      <Header title={`Rút ${asset}`} subtitle="Rút tiền · Wallet" back />
      <PageContent gap="default">
        {/* Balance */}
        <TrCard className="flex items-center justify-between px-4 py-3">
          <span style={{ color: c.text2, fontSize: 13 }}>Số dư khả dụng</span>
          <div className="text-right">
            <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtAmount(assetData.available)} {asset}
            </span>
          </div>
        </TrCard>

        {/* Network */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>Mạng lưới</label>
          <button onClick={() => { setShowNetPicker(true); hapticSelection(); }}
            className="w-full flex items-center justify-between px-4 rounded-2xl hover-ghost"
            style={{ background: c.surface2, border: `1.5px solid ${errors.network ? c.error : c.borderSolid}`, height: 52, borderRadius: 14 }}>
            <div className="flex flex-col items-start">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{selectedNet.name}</span>
              <span style={{ color: c.text2, fontSize: 11 }}>Phí: {selectedNet.fee} {asset} • Tối thiểu: {selectedNet.minWithdraw}</span>
            </div>
            <ChevronDown size={18} color={c.text2} />
          </button>
          {/* Inline network status indicator */}
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.success }} />
            <span style={{ color: c.text3, fontSize: 10 }}>Mạng hoạt động tốt</span>
            <span style={{ color: c.text3, fontSize: 10 }}>•</span>
            <span style={{ color: c.text3, fontSize: 10 }}>Phí: {selectedNet.fee} {asset}</span>
          </div>
        </div>

        {/* Address */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label style={{ color: c.text2, fontSize: 13 }}>Địa chỉ ví nhận</label>
            <button
              onClick={() => { setShowQRScanner(true); hapticSelection(); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 11, fontWeight: 600 }}
            >
              <ScanLine size={12} />
              Quét QR
            </button>
          </div>
          <div className="flex flex-col rounded-2xl px-4 py-3 gap-2"
            style={{ background: c.surface2, border: `1.5px solid ${errors.address ? c.error : c.borderSolid}` }}>
            <input type="text" placeholder={`Nhập địa chỉ ${asset} (${selectedNet.name.split(' ')[0]})`}
              value={address} onChange={e => setAddress(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, width: '100%', lineHeight: 1.5 }}
            />
          </div>
          {errors.address && <p style={{ color: c.error, fontSize: 12, marginTop: 4 }}>{errors.address}</p>}

          {/* Recent addresses */}
          {!address && RECENT_ADDRESSES.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} color={c.text3} />
                <span style={{ color: c.text3, fontSize: 11 }}>Địa chỉ gần đây</span>
              </div>
              <div className="flex flex-col gap-1">
                {RECENT_ADDRESSES.map((ra, i) => (
                  <button
                    key={i}
                    onClick={() => { setAddress(ra.address); hapticSelection(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left"
                    style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{ra.label}</p>
                      <p className="truncate" style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace', maxWidth: '85%' }}>{ra.address}</p>
                    </div>
                    <span style={{ color: c.text3, fontSize: 9 }}>{ra.lastUsed}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memo */}
        {requiresMemo && (
          <div>
            <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>{memoLabel}</label>
            <div className="flex flex-col rounded-2xl px-4 py-3 gap-2"
              style={{ background: c.surface2, border: `1.5px solid ${errors.memo ? c.error : c.borderSolid}` }}>
              <input type="text" placeholder={memoPlaceholder}
                value={memo} onChange={e => setMemo(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, width: '100%', lineHeight: 1.5 }}
              />
            </div>
            {errors.memo && <p style={{ color: c.error, fontSize: 12, marginTop: 4 }}>{errors.memo}</p>}
          </div>
        )}

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-2">
            <label style={{ color: c.text2, fontSize: 13 }}>Số lượng rút</label>
            <button onClick={() => { setAmount(assetData.available.toFixed(6)); hapticSelection(); }} style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
              Tất cả
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-4"
            style={{ background: c.surface2, border: `1.5px solid ${errors.amount ? c.error : c.borderSolid}`, height: 52, borderRadius: 14 }}>
            <input type="number" inputMode="decimal" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 18, flex: 1, fontFamily: 'monospace', fontWeight: 700 }} />
            <span style={{ color: c.text3, fontSize: 13 }}>{asset}</span>
          </div>
          {errors.amount && <p style={{ color: c.error, fontSize: 12, marginTop: 4 }}>{errors.amount}</p>}

          {amountNum > 0 && (
            <div className="mt-3 flex justify-between px-1">
              <span style={{ color: c.text3, fontSize: 12 }}>Phí mạng: {fee} {asset}</span>
              <span style={{ color: c.text2, fontSize: 12 }}>Nhận: <strong style={{ color: c.text1 }}>{received.toFixed(6)} {asset}</strong></span>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="rounded-2xl p-3" style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}>
          <div className="flex items-start gap-2">
            <Clock size={13} color={c.warn} className="shrink-0 mt-0.5" />
            <p style={{ color: c.warn, fontSize: 12, lineHeight: 1.5 }}>
              Rút tiền cần xác minh 2FA. Yêu cầu rút trên $10,000 sẽ được xem xét trong 24h.
            </p>
          </div>
        </div>

        <CTAButton onClick={handleNext} variant="primary">
          Tiếp tục →
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}