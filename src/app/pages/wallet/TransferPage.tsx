import React, { useState } from 'react';
import { ArrowDownUp, ChevronDown, Info, CheckCircle, Wallet, BarChart3, Banknote, Shield, X } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { USER_ASSETS } from '../../data/mockData';
import { fmtAmount, fmtUsd } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';

const WALLETS = [
  { id: 'spot', name: 'Ví Spot', icon: BarChart3, balance: 54276.79 },
  { id: 'funding', name: 'Ví Funding', icon: Wallet, balance: 8450.20 },
  { id: 'futures', name: 'Ví Futures', icon: Banknote, balance: 3200.00 },
];

export function TransferPage() {
  const c = useThemeColors();
  const [fromWallet, setFromWallet] = useState('spot');
  const [toWallet, setToWallet] = useState('funding');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const { hapticSelection, hapticMedium, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const fromW = WALLETS.find(w => w.id === fromWallet)!;
  const toW = WALLETS.find(w => w.id === toWallet)!;
  const asset = USER_ASSETS.find(a => a.symbol === selectedAsset);
  const available = asset?.available ?? 0;
  const amountNum = parseFloat(amount || '0');
  const usdEquiv = amountNum * (asset ? asset.usdValue / asset.balance : 1);
  const errors: Record<string, string> = {};
  if (amount && amountNum <= 0) errors.amount = 'Số lượng phải lớn hơn 0';
  if (amount && amountNum > available) errors.amount = 'Số dư không đủ';

  const handleSwap = () => {
    setFromWallet(toWallet);
    setToWallet(fromWallet);
    hapticSelection();
  };

  const handleNext = () => {
    if (!amount || amountNum <= 0 || amountNum > available) return;
    hapticMedium();
    setShowConfirmSheet(true);
  };

  const handleConfirmTransfer = () => {
    setShowConfirmSheet(false);
    setShowSuccess(true);
    hapticSuccess();
    actionToast.success({ title: 'Chuyển thành công!', description: `${fmtAmount(amountNum)} ${selectedAsset} đã chuyển từ ${fromW.name} sang ${toW.name}` }, { haptic: 'success' });
    setTimeout(() => setShowSuccess(false), 3000);
    setAmount('');
  };

  const WalletPicker = ({ show, onSelect, exclude }: { show: boolean; onSelect: (id: string) => void; exclude: string }) => {
    if (!show) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-10"
        style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
        {WALLETS.filter(w => w.id !== exclude).map(w => (
          <button key={w.id} onClick={() => onSelect(w.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
            style={{ borderBottom: `1px solid ${c.divider}` }}>
            <w.icon size={18} color={c.primary} />
            <div className="flex-1">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{w.name}</span>
              <span style={{ color: c.text2, fontSize: 12, marginLeft: 8 }}>{fmtUsd(w.balance)}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <PageLayout>
      <Header title="Chuyển nội bộ" subtitle="Chuyển tiền · Wallet" back />

      <PageContent>
        {/* Success toast */}
        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={18} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>Chuyển thành công!</span>
          </div>
        )}

        {/* Transfer Direction */}
        <div className="flex flex-col gap-3">
          {/* From */}
          <TrCard className="p-4 relative">
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Từ</p>
            <button onClick={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false); }}
              className="w-full flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}>
                <fromW.icon size={20} color={c.primary} />
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{fromW.name}</p>
                <p style={{ color: c.text2, fontSize: 12 }}>Số dư: {fmtUsd(fromW.balance)}</p>
              </div>
              <ChevronDown size={18} color={c.text3} />
            </button>
            <WalletPicker show={showFromPicker} exclude={toWallet}
              onSelect={(id) => { setFromWallet(id); setShowFromPicker(false); }} />
          </TrCard>

          {/* Swap button */}
          <div className="flex justify-center -my-1 z-20">
            <button onClick={handleSwap}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: c.primary, boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
              <ArrowDownUp size={18} color="#FFF" />
            </button>
          </div>

          {/* To */}
          <TrCard className="p-4 relative">
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Đến</p>
            <button onClick={() => { setShowToPicker(!showToPicker); setShowFromPicker(false); }}
              className="w-full flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <toW.icon size={20} color="#10B981" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{toW.name}</p>
                <p style={{ color: c.text2, fontSize: 12 }}>Số dư: {fmtUsd(toW.balance)}</p>
              </div>
              <ChevronDown size={18} color={c.text3} />
            </button>
            <WalletPicker show={showToPicker} exclude={fromWallet}
              onSelect={(id) => { setToWallet(id); setShowToPicker(false); }} />
          </TrCard>
        </div>

        {/* Asset selector */}
        <TrCard className="p-4 relative">
          <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Tài sản</p>
          <button onClick={() => setShowAssetPicker(!showAssetPicker)}
            className="w-full flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: (asset?.logoColor ?? c.primary) + '22', border: `1.5px solid ${(asset?.logoColor ?? c.primary)}44` }}>
              <span style={{ color: asset?.logoColor ?? c.primary, fontSize: 10, fontWeight: 700 }}>{selectedAsset.slice(0, 3)}</span>
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{selectedAsset}</p>
              <p style={{ color: c.text2, fontSize: 12 }}>Khả dụng: {fmtAmount(available)} {selectedAsset}</p>
            </div>
            <ChevronDown size={18} color={c.text3} />
          </button>

          {showAssetPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-10 max-h-60 overflow-y-auto"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
              {USER_ASSETS.map(a => (
                <button key={a.id} onClick={() => { setSelectedAsset(a.symbol); setShowAssetPicker(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: a.logoColor + '22' }}>
                    <span style={{ color: a.logoColor, fontSize: 9, fontWeight: 700 }}>{a.symbol.slice(0, 3)}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{a.symbol}</span>
                  <span className="ml-auto" style={{ color: c.text2, fontSize: 12, fontFamily: 'monospace' }}>{fmtAmount(a.available)}</span>
                </button>
              ))}
            </div>
          )}
        </TrCard>

        {/* Amount input */}
        <TrCard className="p-4">
          <div className="flex justify-between mb-2">
            <span style={{ color: c.text3, fontSize: 11 }}>Số lượng</span>
            <button onClick={() => setAmount(String(available))} style={{ color: c.primary, fontSize: 11, fontWeight: 600 }}>Tối đa</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}
            />
            <span style={{ color: c.text2, fontSize: 14, fontWeight: 600 }}>{selectedAsset}</span>
          </div>
          {amount && (
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
              ≈ {fmtUsd(usdEquiv)}
            </p>
          )}
        </TrCard>

        {/* Info */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)' }}>
          <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
            Chuyển nội bộ giữa các ví miễn phí, xử lý ngay lập tức. Không cần xác nhận blockchain.
          </p>
        </div>

        {/* Transfer button */}
        <div>
          <CTAButton
            onClick={handleNext}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
          >
            Xác nhận chuyển
          </CTAButton>
        </div>

        {/* Recent transfers */}
        <div>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Lịch sử chuyển gần đây</p>
          {[
            { from: 'Spot', to: 'Funding', asset: 'USDT', amount: 2000, time: '21/02 11:30' },
            { from: 'Funding', to: 'Spot', asset: 'USDT', amount: 500, time: '20/02 09:15' },
            { from: 'Spot', to: 'Futures', asset: 'USDT', amount: 1000, time: '19/02 14:20' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <ArrowDownUp size={16} color={c.primary} />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{tx.from} → {tx.to}</p>
                <p style={{ color: c.text3, fontSize: 11 }}>{tx.time}</p>
              </div>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtAmount(tx.amount)} {tx.asset}
              </span>
            </div>
          ))}
        </div>
      </PageContent>

      {/* Confirm sheet */}
      <BottomSheetV2 open={showConfirmSheet} onClose={() => setShowConfirmSheet(false)} title="Xác nhận chuyển nội bộ">
        <div className="flex flex-col gap-4">
          {/* Details */}
          <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Từ" value={fromW.name} />
            <BottomSheetRow label="Đến" value={toW.name} />
            <BottomSheetRow label="Tài sản" value={selectedAsset} />
            <BottomSheetRow label="Số lượng" value={`${fmtAmount(amountNum)} ${selectedAsset}`} highlight />
            <BottomSheetRow label="Giá trị" value={fmtUsd(usdEquiv)} />
            <BottomSheetRow label="Phí" value="Miễn phí" valueColor="#10B981" />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(59,130,246,0.06)' }}>
            <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              Chuyển nội bộ xử lý ngay lập tức, không mất phí.
            </p>
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
              <X size={16} /> Huỷ
            </CTAButton>
            <CTAButton
              onClick={handleConfirmTransfer}
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
    </PageLayout>
  );
}