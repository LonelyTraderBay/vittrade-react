/**
 * ══════════════════════════════════════════════════════════════
 *  DustConverterPage — P3: Small Balance Converter
 * ══════════════════════════════════════════════════════════════
 *  Converts small residual balances ("dust") to a target asset
 *  (BNB or USDT). Shows eligible assets, conversion preview,
 *  fee breakdown, and confirm flow.
 *  Pattern C — Form/Wizard with Bottom CTA
 *  Compliance: §8.4 Wallet, §7.1 Buttons, §7.3 Bottom sheets
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { USER_ASSETS } from '../../data/mockData';
import { fmtAmount, fmtUsd } from '../../data/formatNumber';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { φ, φIcon } from '../../utils/golden';
import {
  Sparkles, CheckCircle, Info, AlertTriangle, Coins, ArrowRight,
  Check, Square, CheckSquare,
} from 'lucide-react';

const DUST_THRESHOLD = 10; // $10 threshold
const CONVERSION_FEE_PCT = 0.5; // 0.5% conversion fee

const TARGET_OPTIONS = [
  { symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
];

export function DustConverterPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticMedium } = useHaptic();
  const actionToast = useActionToast();

  const [targetAsset, setTargetAsset] = useState('USDT');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Filter dust assets (< threshold, not the target, not frozen/in-order)
  const dustAssets = useMemo(() =>
    USER_ASSETS.filter(a =>
      a.usdValue < DUST_THRESHOLD &&
      a.usdValue > 0 &&
      a.symbol !== targetAsset &&
      a.available > 0
    ), [targetAsset]
  );

  const toggleAsset = (id: string) => {
    hapticSelection();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    hapticSelection();
    if (selectedIds.size === dustAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dustAssets.map(a => a.id)));
    }
  };

  const selectedAssets = dustAssets.filter(a => selectedIds.has(a.id));
  const totalDustUsd = selectedAssets.reduce((s, a) => s + a.usdValue, 0);
  const conversionFee = totalDustUsd * (CONVERSION_FEE_PCT / 100);
  const receivedUsd = totalDustUsd - conversionFee;

  // Estimate target amount
  const targetData = USER_ASSETS.find(a => a.symbol === targetAsset);
  const targetPrice = targetData ? targetData.usdValue / targetData.balance : 1;
  const receivedAmount = receivedUsd / targetPrice;

  const handleConvert = async () => {
    setIsConverting(true);
    hapticMedium();
    await new Promise(r => setTimeout(r, 2000));
    setIsConverting(false);
    setShowConfirmSheet(false);
    setShowSuccessSheet(true);
    hapticSuccess();
  };

  return (
    <PageLayout variant="flush">
      <Header title="Chuyển đổi số dư nhỏ" back />

      {/* Success sheet */}
      <BottomSheetV2
        open={showSuccessSheet}
        onClose={() => { setShowSuccessSheet(false); setSelectedIds(new Set()); }}
        title="Chuyển đổi thành công!"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
            <CheckCircle size={36} color={c.success} />
          </div>
          <div className="text-center">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Đã chuyển {selectedAssets.length} tài sản nhỏ
            </p>
            <p style={{ color: c.success, fontSize: 22, fontWeight: 700, marginTop: 8, fontFamily: 'monospace' }}>
              +{fmtAmount(receivedAmount)} {targetAsset}
            </p>
            <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 4 }}>
              ≈ {fmtUsd(receivedUsd)}
            </p>
          </div>
          <CTAButton onClick={() => { setShowSuccessSheet(false); setSelectedIds(new Set()); }}>
            Hoàn tất
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* Confirm sheet */}
      <BottomSheetV2
        open={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        title="Xác nhận chuyển đổi"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Số tài sản" value={`${selectedAssets.length} loại`} />
            <BottomSheetRow label="Tổng giá trị" value={fmtUsd(totalDustUsd)} />
            <BottomSheetRow label="Phí chuyển đổi" value={`${fmtUsd(conversionFee)} (${CONVERSION_FEE_PCT}%)`} />
            <BottomSheetRow label="Nhận được" value={`${fmtAmount(receivedAmount)} ${targetAsset}`} highlight valueColor="#10B981" />
            <BottomSheetRow label="Giá trị nhận" value={fmtUsd(receivedUsd)} />
          </div>

          {/* Assets being converted */}
          <div>
            <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Tài sản sẽ chuyển đổi:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedAssets.map(a => (
                <span key={a.id} className="px-2 py-1 rounded-lg"
                  style={{ background: `${a.logoColor}18`, color: a.logoColor, fontSize: 11, fontWeight: 600 }}>
                  {fmtAmount(a.available)} {a.symbol}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{ background: c.primaryAlpha08 }}>
            <Info size={13} color={c.primary} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Giá chuyển đổi dựa trên giá thị trường tại thời điểm xác nhận. Tỷ giá có thể thay đổi nhẹ.
            </p>
          </div>

          <CTAButton onClick={handleConvert} loading={isConverting} variant="primary">
            {isConverting ? 'Đang chuyển đổi...' : `Chuyển đổi sang ${targetAsset}`}
          </CTAButton>
        </div>
      </BottomSheetV2>

      <PageContent grow gap="default">
        {/* Hero info */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.3)' }}>
              <Sparkles size={24} color={c.warn} />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>Dọn dẹp ví</p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                Chuyển đổi số dư nhỏ (dưới {fmtUsd(DUST_THRESHOLD)}) sang {targetAsset}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Dust tìm thấy', value: dustAssets.length.toString(), color: '#F59E0B' },
              { label: 'Đã chọn', value: selectedIds.size.toString(), color: '#3B82F6' },
              { label: 'Giá trị', value: fmtUsd(totalDustUsd), color: '#10B981' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center"
                style={{ background: c.portfolioBtnGhost }}>
                <p style={{ color: s.color, fontSize: φ.sm, fontWeight: 700 }}>{s.value}</p>
                <p style={{ color: c.portfolioTextMuted, fontSize: 9 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Target asset selector */}
        <PageSection label="Chuyển đổi sang">
          <div className="flex gap-2">
            {TARGET_OPTIONS.map(opt => (
              <button key={opt.symbol}
                onClick={() => { setTargetAsset(opt.symbol); setSelectedIds(new Set()); hapticSelection(); }}
                className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                style={{
                  background: targetAsset === opt.symbol ? `${opt.color}15` : c.surface2,
                  border: `1.5px solid ${targetAsset === opt.symbol ? `${opt.color}60` : c.borderSolid}`,
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${opt.color}22` }}>
                  <span style={{ color: opt.color, fontSize: 10, fontWeight: 700 }}>{opt.symbol.slice(0, 3)}</span>
                </div>
                <div className="text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{opt.symbol}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{opt.name}</p>
                </div>
                {targetAsset === opt.symbol && <CheckCircle size={16} color={opt.color} className="ml-auto" />}
              </button>
            ))}
          </div>
        </PageSection>

        {/* Dust assets list */}
        <PageSection label={`Số dư nhỏ (${dustAssets.length})`}>
          {dustAssets.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Coins size={32} color={c.text3} />
              <p style={{ color: c.text3, fontSize: φ.sm }}>Không có số dư nhỏ nào</p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>Ví sạch! Không có dust cần dọn dẹp.</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <button onClick={selectAll}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-2"
                style={{ background: c.surface2 }}>
                {selectedIds.size === dustAssets.length
                  ? <CheckSquare size={16} color="#3B82F6" />
                  : <Square size={16} color={c.text3} />
                }
                <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
                  {selectedIds.size === dustAssets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </span>
              </button>

              <div className="flex flex-col gap-1.5">
                {dustAssets.map(asset => {
                  const isSelected = selectedIds.has(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl"
                      style={{
                        background: isSelected ? `${asset.logoColor}08` : c.surface2,
                        border: `1.5px solid ${isSelected ? `${asset.logoColor}40` : 'transparent'}`,
                      }}
                    >
                      {/* Checkbox */}
                      {isSelected
                        ? <CheckSquare size={18} color="#3B82F6" />
                        : <Square size={18} color={c.text3} />
                      }

                      {/* Logo */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${asset.logoColor}22`, border: `1px solid ${asset.logoColor}44` }}>
                        <span style={{ color: asset.logoColor, fontSize: 9, fontWeight: 700 }}>{asset.symbol.slice(0, 3)}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{asset.symbol}</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{asset.name}</p>
                      </div>

                      {/* Balance */}
                      <div className="text-right shrink-0">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                          {fmtAmount(asset.available)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>≈ {fmtUsd(asset.usdValue)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </PageSection>

        {/* Conversion preview */}
        {selectedIds.size > 0 && (
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Ước tính chuyển đổi</p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedAssets.slice(0, 4).map(a => (
                    <div key={a.id} className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: `${a.logoColor}30`, border: `1px solid ${c.surface}`, zIndex: 1 }}>
                      <span style={{ color: a.logoColor, fontSize: 7, fontWeight: 700 }}>{a.symbol.slice(0, 2)}</span>
                    </div>
                  ))}
                  {selectedAssets.length > 4 && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: c.surface2, border: `1px solid ${c.divider}`, zIndex: 1 }}>
                      <span style={{ color: c.text3, fontSize: 7, fontWeight: 700 }}>+{selectedAssets.length - 4}</span>
                    </div>
                  )}
                </div>
                <span style={{ color: c.text2, fontSize: 12 }}>{selectedAssets.length} tài sản</span>
              </div>
              <ArrowRight size={16} color={c.text3} />
              <div className="flex items-center gap-2">
                <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                  +{fmtAmount(receivedAmount)} {targetAsset}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs" style={{ color: c.text3 }}>
              <span>Giá trị: {fmtUsd(totalDustUsd)}</span>
              <span>Phí: {fmtUsd(conversionFee)} ({CONVERSION_FEE_PCT}%)</span>
            </div>
          </TrCard>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
            Số dư nhỏ dưới {fmtUsd(DUST_THRESHOLD)} có thể được chuyển đổi.
            Phí chuyển đổi: {CONVERSION_FEE_PCT}%. Giá dựa trên tỷ giá thị trường.
            Tài sản đang đóng băng hoặc trong lệnh không thể chuyển đổi.
          </p>
        </div>
      </PageContent>

      <StickyFooter>
        <CTAButton
          onClick={() => { setShowConfirmSheet(true); hapticMedium(); }}
          disabled={selectedIds.size === 0}
          variant="primary"
        >
          {selectedIds.size === 0
            ? 'Chọn tài sản để chuyển đổi'
            : `Chuyển đổi ${selectedIds.size} tài sản → ${targetAsset}`
          }
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}