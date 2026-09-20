import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CheckCircle, Info, AlertTriangle, Eye, Clock, Shield, ChevronRight, X, Megaphone, ChevronDown, ChevronUp, Radio, CreditCard, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { fmtVnd, fmtPct, fmtAbsPct } from '../../data/formatNumber';
import { φ, φIcon, φRadius } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { P2PConfirmationModal } from '../../components/p2p/P2PConfirmationModal';
import type { ConfirmSummaryRow, ConfirmWarning } from '../../components/p2p/P2PConfirmationModal';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

import { LivePreviewSection } from '../../components/p2p/LivePreviewSection';

const PAYMENT_OPTIONS = ['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'MB Bank', 'ACB', 'Momo', 'ZaloPay', 'VNPay'];
const MARKET_PRICES: Record<string, number> = { USDT: 25300, BTC: 1715000000, ETH: 89200000 };

export function P2PCreateAdPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const routePrefix = useRoutePrefix();
  const actionToast = useActionToast();

  // Form state
  const [adType, setAdType] = useState<'buy' | 'sell'>('sell');
  const [asset, setAsset] = useState('USDT');
  const [currency, setCurrency] = useState('VND');
  const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
  const [price, setPrice] = useState('');
  const [priceMargin, setPriceMargin] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [termsNote, setTermsNote] = useState('');
  const [autoReply, setAutoReply] = useState('');
  const [paymentWindow, setPaymentWindow] = useState('15');
  const [tradingHours, setTradingHours] = useState('24/7');
  const [isLoading, setIsLoading] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  /* ─── Scroll lock handled by BottomSheetV2 internally ─── */
  const { onAfterOpen: onPublishSheetOpen } = useSheetAnalytics('p2p-create-ad-publish-confirm');

  const [livePreviewExpanded, setLivePreviewExpanded] = useState(false);

  // Counterparty requirements
  const [reqKyc, setReqKyc] = useState(false);
  const [reqKycLevel, setReqKycLevel] = useState('1');
  const [reqMinTrades, setReqMinTrades] = useState('');
  const [reqMinDays, setReqMinDays] = useState('');

  const togglePayment = (pm: string) => {
    if (selectedPayments.length >= 5 && !selectedPayments.includes(pm)) return;
    setSelectedPayments(prev => prev.includes(pm) ? prev.filter(p => p !== pm) : [...prev, pm]);
    hapticSelection();
  };

  const marketPrice = MARKET_PRICES[asset] || 25300;
  const effectivePrice = useMemo(() => {
    if (priceType === 'fixed') return parseFloat(price || '0');
    const margin = parseFloat(priceMargin || '0');
    return Math.round(marketPrice * (1 + margin / 100));
  }, [priceType, price, priceMargin, marketPrice]);

  const priceDiff = effectivePrice ? ((effectivePrice - marketPrice) / marketPrice * 100) : 0;

  const handlePublish = async () => {
    if (!isValid) return;
    setShowPublishConfirm(true);
  };

  const handleConfirmedPublish = async () => {
    setShowPublishConfirm(false);
    setIsLoading(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 1500));
    actionToast.success(TOAST.P2P.AD_PUBLISHED(adType, asset), { haptic: 'success' });
    navigate(`${routePrefix}/p2p/my-ads`, { replace: true });
  };

  const isValid = effectivePrice > 0 && parseFloat(totalAmount) > 0 && selectedPayments.length > 0;

  const InputRow = ({ label, children, hint, required }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label style={{ color: c.text2, fontSize: 13 }}>
          {label}
          {required && <span style={{ color: c.sell }}> *</span>}
        </label>
        {hint && <Info size={12} color={c.text3} />}
      </div>
      {children}
      {hint && <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>{hint}</p>}
    </div>
  );

  return (
    <PageLayout variant="flush">
      <Header title="Đăng quảng cáo P2P" subtitle="Tạo mới · P2P" back />
      <PageContent gap="relaxed" grow>
        {/* Ad Type */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 8, display: 'block' }}>Loại quảng cáo</label>
          <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
            <button onClick={() => { setAdType('buy'); hapticSelection(); }} className="flex-1 py-2.5 rounded-lg flex items-center justify-center"
              style={{ background: adType === 'buy' ? c.buy : 'transparent', color: adType === 'buy' ? '#fff' : c.text3, fontWeight: 700, fontSize: 13 }}>Tôi muốn MUA</button>
            <button onClick={() => { setAdType('sell'); hapticSelection(); }} className="flex-1 py-2.5 rounded-lg flex items-center justify-center"
              style={{ background: adType === 'sell' ? c.sell : 'transparent', color: adType === 'sell' ? '#fff' : c.text3, fontWeight: 700, fontSize: 13 }}>Tôi muốn BÁN</button>
          </div>
        </div>

        {/* Asset & Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ color: c.text2, fontSize: 13, marginBottom: 8, display: 'block' }}>Tài sản</label>
            <div className="flex gap-2">
              {['USDT', 'BTC', 'ETH'].map(a => (
                <button key={a} onClick={() => { setAsset(a); hapticSelection(); }} className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: asset === a ? c.chipActiveBg : c.chipBg, color: asset === a ? c.chipActiveText : c.chipText, border: `1px solid ${asset === a ? c.chipActiveBorder : c.chipBorder}` }}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 13, marginBottom: 8, display: 'block' }}>Tiền tệ</label>
            <div className="flex gap-2">
              {['VND', 'USD'].map(cr => (
                <button key={cr} onClick={() => { setCurrency(cr); hapticSelection(); }} className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: currency === cr ? c.chipActiveBg : c.chipBg, color: currency === cr ? c.chipActiveText : c.chipText, border: `1px solid ${currency === cr ? c.chipActiveBorder : c.chipBorder}` }}>{cr}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Price Type */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 8, display: 'block' }}>Loại giá</label>
          <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
            <button onClick={() => { setPriceType('fixed'); hapticSelection(); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: priceType === 'fixed' ? c.chipActiveBg : 'transparent', color: priceType === 'fixed' ? c.chipActiveText : c.text3 }}>
              Cố định
            </button>
            <button onClick={() => { setPriceType('floating'); hapticSelection(); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: priceType === 'floating' ? 'rgba(168,85,247,0.15)' : 'transparent', color: priceType === 'floating' ? '#A855F7' : c.text3 }}>
              Thả nổi %
            </button>
          </div>
        </div>

        {/* Price Input */}
        {priceType === 'fixed' ? (
          <InputRow label={`Giá (${currency}/${asset})`} hint={`Giá thị trường: ${fmtVnd(marketPrice)} ${currency}`} required>
            <InputField type="number" placeholder={fmtVnd(marketPrice)} value={price} onChange={e => setPrice(e.target.value)}
              suffix={<span style={{ color: c.text3, fontSize: 13 }}>{currency}</span>} style={{ fontSize: 17, fontFamily: 'monospace', fontWeight: 700 }} />
            {effectivePrice > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <span style={{ color: priceDiff >= 0 ? c.buy : c.sell, fontSize: 12, fontWeight: 600 }}>
                  {priceDiff >= 0 ? '▲' : '▼'} {fmtAbsPct(priceDiff)} so với thị trường
                </span>
              </div>
            )}
          </InputRow>
        ) : (
          <InputRow label="Biên độ giá (%)" hint={`Giá = Thị trường × (1 + biên độ%). Giá hiện tại: ${fmtVnd(effectivePrice)} ${currency}`} required>
            <InputField type="number" placeholder="0.00" value={priceMargin} onChange={e => setPriceMargin(e.target.value)}
              prefix={<span style={{ color: c.text3, fontSize: 13 }}>±</span>}
              suffix={<span style={{ color: c.text3, fontSize: 13 }}>%</span>}
              style={{ fontSize: 17, fontFamily: 'monospace', fontWeight: 700 }} />
            <div className="flex gap-2 mt-2">
              {[-1, -0.5, 0, 0.5, 1, 2].map(m => (
                <button key={m} onClick={() => { setPriceMargin(m.toString()); hapticSelection(); }}
                  className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: priceMargin === m.toString() ? 'rgba(168,85,247,0.15)' : c.surface2, color: priceMargin === m.toString() ? '#A855F7' : c.text3 }}>
                  {m >= 0 ? '+' : ''}{m}%
                </button>
              ))}
            </div>
          </InputRow>
        )}

        {/* Total Amount */}
        <InputRow label={`Tổng ${asset} giao dịch`} required>
          <InputField type="number" placeholder="0.00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
            suffix={<span style={{ color: c.text3, fontSize: 13 }}>{asset}</span>} style={{ fontSize: 17, fontFamily: 'monospace', fontWeight: 700 }} />
        </InputRow>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-3">
          <InputRow label={`Tối thiểu (${currency})`} required>
            <InputField type="number" placeholder="500,000" value={minLimit} onChange={e => setMinLimit(e.target.value)} style={{ fontSize: 15, fontFamily: 'monospace' }} />
          </InputRow>
          <InputRow label={`Tối đa (${currency})`} required>
            <InputField type="number" placeholder="50,000,000" value={maxLimit} onChange={e => setMaxLimit(e.target.value)} style={{ fontSize: 15, fontFamily: 'monospace' }} />
          </InputRow>
        </div>

        {/* Payment Methods */}
        <InputRow label="Phương thức thanh toán" hint={`Đã chọn ${selectedPayments.length}/5`} required>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map(pm => {
              const isSelected = selectedPayments.includes(pm);
              return (
                <button key={pm} onClick={() => togglePayment(pm)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: isSelected ? c.primaryAlpha12 : c.surface2, color: isSelected ? c.primary : c.text2, border: `1px solid ${isSelected ? c.primaryAlpha12 : c.borderSolid}` }}>
                  {isSelected && <CheckCircle size={12} color={c.primary} />}{pm}
                </button>
              );
            })}
          </div>
        </InputRow>

        {/* Payment Window */}
        <InputRow label="Thời gian thanh toán">
          <div className="flex gap-2">
            {['15', '30', '60'].map(min => (
              <button key={min} onClick={() => { setPaymentWindow(min); hapticSelection(); }} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: paymentWindow === min ? c.chipActiveBg : c.chipBg, color: paymentWindow === min ? c.chipActiveText : c.chipText, border: `1px solid ${paymentWindow === min ? c.chipActiveBorder : c.chipBorder}` }}>
                {min} phút
              </button>
            ))}
          </div>
        </InputRow>

        {/* Trading Hours */}
        <InputRow label="Giờ giao dịch">
          <div className="flex gap-2">
            {['24/7', '08:00 - 22:00', '08:00 - 17:00'].map(h => (
              <button key={h} onClick={() => { setTradingHours(h); hapticSelection(); }} className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: tradingHours === h ? c.chipActiveBg : c.chipBg, color: tradingHours === h ? c.chipActiveText : c.chipText, border: `1px solid ${tradingHours === h ? c.chipActiveBorder : c.chipBorder}` }}>
                {h}
              </button>
            ))}
          </div>
        </InputRow>

        {/* Counterparty Requirements */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              <Shield size={14} className="inline mr-1" />Yêu cầu đối tác
            </span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>Tuỳ chọn</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: φ.sm }}>Yêu cầu KYC</span>
              <button onClick={() => { setReqKyc(!reqKyc); hapticSelection(); }}
                className="w-11 h-6 rounded-full relative"
                style={{ background: reqKyc ? c.primary : c.surface2, border: `1px solid ${reqKyc ? c.primary : c.borderSolid}` }}>
                <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                  style={{ background: '#fff', left: reqKyc ? 24 : 2 }} />
              </button>
            </div>
            {reqKyc && (
              <div className="flex gap-2">
                {['1', '2', '3'].map(lvl => (
                  <button key={lvl} onClick={() => { setReqKycLevel(lvl); hapticSelection(); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: reqKycLevel === lvl ? c.primaryAlpha12 : c.surface2, color: reqKycLevel === lvl ? c.primary : c.text3 }}>
                    Cấp {lvl}
                  </button>
                ))}
              </div>
            )}
            <InputField label="Số đơn tối thiểu" type="number" placeholder="0" value={reqMinTrades} onChange={e => setReqMinTrades(e.target.value)}
              containerStyle={{ height: 40 }} style={{ fontSize: 13 }} />
            <InputField label="Số ngày tối thiểu" type="number" placeholder="0" value={reqMinDays} onChange={e => setReqMinDays(e.target.value)}
              containerStyle={{ height: 40 }} style={{ fontSize: 13 }} />
          </div>
        </TrCard>

        {/* Terms */}
        <InputRow label="Điều kiện giao dịch (tuỳ chọn)">
          <textarea value={termsNote} onChange={e => setTermsNote(e.target.value)}
            placeholder="VD: Chỉ giao dịch với tài khoản đã xác minh KYC..." rows={3}
            className="w-full rounded-2xl px-4 py-3"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.6 }} />
        </InputRow>

        {/* Auto Reply */}
        <InputRow label="Tin nhắn tự động (tuỳ chọn)" hint="Gửi tự động khi đối tác tạo đơn">
          <textarea value={autoReply} onChange={e => setAutoReply(e.target.value)}
            placeholder="VD: Cảm ơn bạn! Vui lòng chuyển khoản theo thông tin bên dưới." rows={2}
            className="w-full rounded-2xl px-4 py-3"
            style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.6 }} />
        </InputRow>

        {/* Warning */}
        <div className="rounded-2xl p-3" style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} color={c.warn} className="shrink-0 mt-0.5" />
            <p style={{ color: c.warn, fontSize: 12, lineHeight: 1.6 }}>Quảng cáo sẽ được xem xét. Vi phạm chính sách sẽ bị đình chỉ tài khoản.</p>
          </div>
        </div>

        {/* ═══ LIVE PREVIEW ═══ */}
        <LivePreviewSection
          c={c}
          expanded={livePreviewExpanded}
          onToggle={() => { setLivePreviewExpanded(!livePreviewExpanded); hapticSelection(); }}
          adType={adType}
          asset={asset}
          currency={currency}
          priceType={priceType}
          effectivePrice={effectivePrice}
          priceDiff={priceDiff}
          priceMargin={priceMargin}
          totalAmount={totalAmount}
          minLimit={minLimit}
          maxLimit={maxLimit}
          selectedPayments={selectedPayments}
          paymentWindow={paymentWindow}
          tradingHours={tradingHours}
          termsNote={termsNote}
          reqKyc={reqKyc}
          reqKycLevel={reqKycLevel}
          reqMinTrades={reqMinTrades}
          reqMinDays={reqMinDays}
          isValid={isValid}
        />
      </PageContent>

      <StickyFooter>
        <CTAButton onClick={handlePublish} disabled={!isValid} loading={isLoading}
          variant={adType === 'buy' ? 'success' : 'danger'}>
          {isLoading ? 'Đang đăng...' : `Đăng quảng cáo ${adType === 'buy' ? 'MUA' : 'BÁN'} ${asset}`}
        </CTAButton>
      </StickyFooter>

      {/* Publish Confirmation Modal */}
      <P2PConfirmationModal
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={handleConfirmedPublish}
        isLoading={isLoading}
        title="Xác nhận đăng quảng cáo"
        subtitle={`${adType === 'buy' ? 'MUA' : 'BÁN'} ${totalAmount || '0'} ${asset} với giá ${fmtVnd(effectivePrice)} ${currency}`}
        icon={Megaphone}
        iconColor={adType === 'buy' ? c.buy : c.sell}
        summaryRows={[
          { label: 'Loại', value: adType === 'buy' ? 'Quảng cáo MUA' : 'Quảng cáo BÁN', highlight: true },
          { label: 'Tài sản', value: `${totalAmount || '0'} ${asset}`, mono: true },
          { label: 'Giá', value: `${fmtVnd(effectivePrice)} ${currency}/${asset}`, mono: true },
          { label: 'Loại giá', value: priceType === 'fixed' ? 'Cố định' : `Thả nổi ${priceMargin || '0'}%` },
          { label: 'Giới hạn', value: `${fmtVnd(parseFloat(minLimit || '0'))} – ${fmtVnd(parseFloat(maxLimit || '0'))} ${currency}`, mono: true },
          { label: 'Thanh toán', value: selectedPayments.join(', ') || '—' },
          { label: 'Cửa sổ TT', value: `${paymentWindow} phút` },
          { label: 'Giờ giao dịch', value: tradingHours },
        ]}
        warnings={[
          { text: 'Quảng cáo sẽ được xem xét tự động. Vi phạm chính sách có thể dẫn đến đình chỉ tài khoản.', type: 'warning' },
          { text: adType === 'sell' ? `${totalAmount || '0'} ${asset} sẽ bị khóa trong Escrow khi có người đặt đơn.` : 'Bạn cần đảm bảo đủ số dư để thanh toán khi có đơn hàng.', type: 'info' },
        ]}
        confirmLabel={`Đăng ${adType === 'buy' ? 'MUA' : 'BÁN'}`}
        confirmVariant={adType === 'buy' ? 'success' : 'danger'}
        agreementText="Tôi xác nhận thông tin chính xác và đồng ý với Điều khoản đăng quảng cáo P2P của VitTrade"
        onAfterOpen={onPublishSheetOpen}
      />
    </PageLayout>
  );
}