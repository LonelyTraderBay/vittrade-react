import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Zap, Shield, Star, CheckCircle, ChevronDown, ChevronRight,
  Clock, AlertTriangle, ArrowUpDown, Lock, TrendingUp, Info,
  CreditCard, Repeat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { CTAButton } from '../../components/ui/CTAButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { P2P_ADS, P2PAd, P2P_PAYMENT_METHODS } from '../../data/mockData';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { TrInput } from '../../components/ui/TrInput';
import { φ, φIcon } from '../../utils/golden';

/* ═══════════════════════════════════════════════════════════
   Market prices (same as P2PHomePage)
   ═══════════════════════════════════════════════════════════ */
const MARKET_PRICES: Record<string, number> = {
  USDT: 25_300, BTC: 1_715_000_000, ETH: 89_000_000, BNB: 15_200_000, SOL: 4_800_000,
};

const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'] as const;

const QUICK_AMOUNTS_VND = [1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000];

/* ═══════════════════════════════════════════════════════════
   Auto-match: find best ad for given amount + direction
   ═══════════════════════════════════════════════════════════ */
function findBestAd(
  tradeType: 'buy' | 'sell',
  asset: string,
  fiatAmount: number,
  paymentFilter?: string,
): P2PAd | null {
  const adType = tradeType === 'buy' ? 'sell' : 'buy';
  let candidates = P2P_ADS
    .filter(ad => ad.type === adType && ad.asset === asset && ad.status === 'active')
    .filter(ad => fiatAmount >= ad.minLimit && fiatAmount <= ad.maxLimit);

  if (paymentFilter) {
    candidates = candidates.filter(ad => ad.paymentMethods.includes(paymentFilter));
  }

  // Sort by best price: lowest for buy, highest for sell
  candidates.sort((a, b) => tradeType === 'buy' ? a.price - b.price : b.price - a.price);

  return candidates[0] || null;
}

function findTopAds(
  tradeType: 'buy' | 'sell',
  asset: string,
  fiatAmount: number,
): P2PAd[] {
  const adType = tradeType === 'buy' ? 'sell' : 'buy';
  let candidates = P2P_ADS
    .filter(ad => ad.type === adType && ad.asset === asset && ad.status === 'active');

  if (fiatAmount > 0) {
    candidates = candidates.filter(ad => fiatAmount >= ad.minLimit && fiatAmount <= ad.maxLimit);
  }

  candidates.sort((a, b) => tradeType === 'buy' ? a.price - b.price : b.price - a.price);
  return candidates.slice(0, 3);
}

/* ═══════════════════════════════════════════════════════════
   P2P Express Trade Page
   ═══════════════════════════════════════════════════════════ */
export function P2PExpressPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticWarning } = useHaptic();
  const prefix = useRoutePrefix();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('USDT');
  const [fiatInput, setFiatInput] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const fiatAmount = parseFloat(fiatInput || '0');
  const marketPrice = MARKET_PRICES[asset] || 25_300;

  const bestAd = useMemo(() => {
    if (fiatAmount <= 0) return null;
    return findBestAd(tradeType, asset, fiatAmount, selectedPayment || undefined);
  }, [tradeType, asset, fiatAmount, selectedPayment]);

  const topAds = useMemo(() => {
    return findTopAds(tradeType, asset, fiatAmount);
  }, [tradeType, asset, fiatAmount]);

  const cryptoAmount = useMemo(() => {
    if (!bestAd || fiatAmount <= 0) return 0;
    return fiatAmount / bestAd.price;
  }, [bestAd, fiatAmount]);

  const priceDiff = useMemo(() => {
    if (!bestAd) return 0;
    return ((bestAd.price - marketPrice) / marketPrice) * 100;
  }, [bestAd, marketPrice]);

  // Available payment methods from best ads
  const availablePayments = useMemo(() => {
    const set = new Set<string>();
    topAds.forEach(ad => ad.paymentMethods.forEach(pm => set.add(pm)));
    return Array.from(set);
  }, [topAds]);

  // User's saved payment methods
  const userPayments = P2P_PAYMENT_METHODS.filter(pm => pm.isVerified);

  const isValid = fiatAmount > 0 && bestAd !== null;

  const handleToggleType = useCallback(() => {
    setTradeType(prev => prev === 'buy' ? 'sell' : 'buy');
    hapticSelection();
  }, [hapticSelection]);

  const handleQuickAmount = useCallback((amount: number) => {
    setFiatInput(amount.toString());
    hapticSelection();
  }, [hapticSelection]);

  const tradeColor = tradeType === 'buy' ? c.buy : c.sell;
  const tradeGradient = tradeType === 'buy'
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';

  return (
    <PageLayout>
      <Header
        title="Express Trade"
        subtitle="Mua bán nhanh"
        back
        right={
          <button
            onClick={() => navigate(`${prefix}/p2p`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Marketplace</span>
            <ChevronRight size={12} color={c.text3} />
          </button>
        }
      />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4 pb-6">
        {/* ───── Buy/Sell Toggle ───── */}
        <div className="flex rounded-2xl p-1" style={{ background: c.surface2 }}>
          <button
            onClick={() => { setTradeType('buy'); hapticSelection(); }}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              background: tradeType === 'buy' ? tradeGradient : 'transparent',
              color: tradeType === 'buy' ? '#fff' : c.text3,
              fontWeight: 700, fontSize: φ.base,
              transition: 'all 0.25s ease',
            }}
          >
            <Zap size={16} />MUA NHANH
          </button>
          <button
            onClick={() => { setTradeType('sell'); hapticSelection(); }}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              background: tradeType === 'sell' ? tradeGradient : 'transparent',
              color: tradeType === 'sell' ? '#fff' : c.text3,
              fontWeight: 700, fontSize: φ.base,
              transition: 'all 0.25s ease',
            }}
          >
            <Zap size={16} />BÁN NHANH
          </button>
        </div>

        {/* ───── Asset Selector ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: c.text2, fontSize: φ.sm }}>
              {tradeType === 'buy' ? 'Tôi muốn mua' : 'Tôi muốn bán'}
            </span>
            <button
              onClick={() => { setShowAssetPicker(!showAssetPicker); hapticSelection(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: c.surface2, border: `1px solid ${c.border}` }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: tradeColor + '20' }}
              >
                <span style={{ color: tradeColor, fontSize: 10, fontWeight: 800 }}>
                  {asset.charAt(0)}
                </span>
              </div>
              <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{asset}</span>
              <ChevronDown size={14} color={c.text3} />
            </button>
          </div>

          {/* Asset Picker Dropdown */}
          <AnimatePresence>
            {showAssetPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex gap-2 flex-wrap">
                  {ASSETS.map(a => (
                    <button
                      key={a}
                      onClick={() => { setAsset(a); setShowAssetPicker(false); hapticSelection(); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                      style={{
                        background: asset === a ? tradeColor + '15' : c.surface2,
                        border: `1.5px solid ${asset === a ? tradeColor + '40' : c.borderSolid}`,
                        color: asset === a ? tradeColor : c.text2,
                        fontWeight: 600, fontSize: φ.sm,
                      }}
                    >
                      {a}
                      <span style={{ color: c.text3, fontSize: φ.xs }}>
                        ≈ {fmtVnd(MARKET_PRICES[a] || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Market Price Reference */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
            <TrendingUp size={12} color={c.text3} />
            <span style={{ color: c.text3, fontSize: φ.xs }}>Giá thị trường:</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtVnd(marketPrice)}
            </span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>VND/{asset}</span>
          </div>
        </TrCard>

        {/* ───── Amount Input ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text2, fontSize: φ.sm }}>Số tiền (VND)</span>
            {fiatAmount > 0 && bestAd && (
              <span style={{ color: tradeColor, fontSize: φ.xs, fontWeight: 600 }}>
                ≈ {fmtAmount(cryptoAmount)} {asset}
              </span>
            )}
          </div>

          <div
            className="flex items-center rounded-2xl px-4"
            style={{
              background: c.surface2,
              border: `2px solid ${fiatAmount > 0 && !bestAd ? c.sell : fiatAmount > 0 ? tradeColor + '60' : c.borderSolid}`,
              height: 60,
              transition: 'border-color 0.2s',
            }}
          >
            <span style={{ color: c.text3, fontSize: φ.md, fontWeight: 600, marginRight: 8 }}>₫</span>
            <TrInput
              type="number"
              inputMode="numeric"
              placeholder="Nhập số tiền..."
              value={fiatInput}
              onChange={e => setFiatInput(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: c.text1, fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
              }}
            />
            <span style={{ color: c.text3, fontSize: φ.sm, fontWeight: 600 }}>VND</span>
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_AMOUNTS_VND.map(amt => (
              <button
                key={amt}
                onClick={() => handleQuickAmount(amt)}
                className="px-3 py-2 rounded-xl"
                style={{
                  background: fiatAmount === amt ? tradeColor + '15' : c.chipBg,
                  color: fiatAmount === amt ? tradeColor : c.chipText,
                  border: `1px solid ${fiatAmount === amt ? tradeColor + '40' : c.chipBorder}`,
                  fontWeight: 600, fontSize: φ.xs, fontFamily: 'monospace',
                }}
              >
                {fmtVnd(amt)}
              </button>
            ))}
          </div>

          {/* Error: No matching ad */}
          {fiatAmount > 0 && !bestAd && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
              style={{ background: c.sellAlpha10, border: `1px solid ${c.sellAlpha15}` }}>
              <AlertTriangle size={12} color={c.sell} />
              <span style={{ color: c.sell, fontSize: φ.xs }}>
                Không tìm thấy offer phù hợp. Thử thay đổi số tiền hoặc loại coin.
              </span>
            </div>
          )}
        </TrCard>

        {/* ───── Payment Method ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={14} color={c.text2} />
              <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>Thanh toán qua</span>
            </div>
            {selectedPayment && (
              <button
                onClick={() => { setSelectedPayment(''); hapticSelection(); }}
                style={{ color: c.text3, fontSize: φ.xs }}
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(userPayments.length > 0
              ? [...new Set(userPayments.map(p => p.bankName))]
              : availablePayments.slice(0, 6)
            ).map(pm => (
              <button
                key={pm}
                onClick={() => { setSelectedPayment(selectedPayment === pm ? '' : pm); hapticSelection(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{
                  background: selectedPayment === pm ? c.primaryAlpha12 : c.surface2,
                  border: `1.5px solid ${selectedPayment === pm ? c.primaryAlpha40 : c.borderSolid}`,
                  color: selectedPayment === pm ? c.primary : c.text2,
                  fontWeight: 600, fontSize: φ.xs,
                }}
              >
                {selectedPayment === pm && <CheckCircle size={12} color={c.primary} />}
                {pm}
              </button>
            ))}
          </div>

          {userPayments.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Shield size={10} color={c.buy} />
              <span style={{ color: c.buy, fontSize: 9, fontWeight: 600 }}>
                Phương thức đã xác minh của bạn
              </span>
            </div>
          )}
        </TrCard>

        {/* ───── Best Match Result ───── */}
        <AnimatePresence>
          {bestAd && fiatAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <TrCard className="p-4" accentBorder={tradeColor + '40'}>
                {/* Match Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: tradeGradient }}
                  >
                    <Zap size={13} color="#fff" />
                  </div>
                  <span style={{ color: tradeColor, fontSize: φ.sm, fontWeight: 700 }}>
                    Offer tốt nhất được tìm thấy
                  </span>
                  <div className="flex-1" />
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: tradeColor + '15', color: tradeColor, fontSize: 9, fontWeight: 700 }}
                  >
                    Auto-Match
                  </span>
                </div>

                {/* Merchant Info */}
                <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: bestAd.merchantBadge === 'elite'
                          ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                          : bestAd.merchantBadge === 'pro'
                            ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
                            : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                      }}
                    >
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                        {bestAd.merchant.charAt(0)}
                      </span>
                    </div>
                    {bestAd.isOnline && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ background: '#10B981', borderColor: c.surface }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                        {bestAd.merchant}
                      </span>
                      {bestAd.merchantVerified && <Shield size={11} color={c.primary} fill={c.primaryAlpha20} />}
                      {bestAd.merchantBadge && (
                        <span
                          className="px-1.5 py-px rounded"
                          style={{
                            background: bestAd.merchantBadge === 'elite' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
                            color: bestAd.merchantBadge === 'elite' ? '#F59E0B' : '#8B5CF6',
                            fontWeight: 700, fontSize: 9,
                          }}
                        >
                          {bestAd.merchantBadge === 'elite' ? 'Elite' : 'Pro'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color: c.text3, fontSize: φ.xs }}>{bestAd.completedOrders} đơn</span>
                      <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>
                        {bestAd.completionRate}%
                      </span>
                      {bestAd.merchantRating && (
                        <div className="flex items-center gap-0.5">
                          <Star size={9} fill="#F59E0B" color="#F59E0B" />
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{bestAd.merchantRating}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5">
                        <Clock size={9} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: φ.xs }}>{bestAd.avgResponseTime}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate(`${prefix}/p2p/merchant/${bestAd.merchantId}`); hapticSelection(); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: c.surface2 }}
                  >
                    <ChevronRight size={14} color={c.text3} />
                  </button>
                </div>

                {/* Price & Amount Summary */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Giá/{asset}</p>
                    <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtVnd(bestAd.price)}
                    </p>
                    <p style={{
                      color: priceDiff >= 0 ? (tradeType === 'buy' ? '#F59E0B' : '#10B981') : '#3B82F6',
                      fontSize: 9, fontWeight: 600,
                    }}>
                      {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(2)}% vs thị trường
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>
                      {tradeType === 'buy' ? 'Bạn sẽ nhận' : 'Bạn sẽ bán'}
                    </p>
                    <p style={{ color: tradeColor, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtAmount(cryptoAmount)}
                    </p>
                    <p style={{ color: c.text3, fontSize: 9 }}>{asset}</p>
                  </div>
                </div>

                {/* Payment methods on this ad */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span style={{ color: c.text3, fontSize: 9 }}>Chấp nhận:</span>
                  {bestAd.paymentMethods.slice(0, 4).map(pm => (
                    <span
                      key={pm}
                      className="px-1.5 py-0.5 rounded"
                      style={{ background: c.surface2, color: c.text2, fontSize: 9, fontWeight: 600 }}
                    >
                      {pm}
                    </span>
                  ))}
                </div>
              </TrCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Other Available Offers (collapsed) ───── */}
        {topAds.length > 1 && fiatAmount > 0 && bestAd && (
          <TrCard className="px-4 py-3">
            <button
              onClick={() => navigate(`${prefix}/p2p`)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Repeat size={12} color={c.text3} />
                <span style={{ color: c.text2, fontSize: φ.xs }}>
                  {topAds.length - 1} offer khác khả dụng
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: c.primary, fontSize: φ.xs, fontWeight: 600 }}>
                  Xem marketplace
                </span>
                <ChevronRight size={12} color={c.primary} />
              </div>
            </button>
          </TrCard>
        )}

        {/* ───── Escrow Trust Badge ───── */}
        <div
          className="rounded-2xl p-3 flex items-start gap-2.5"
          style={{ background: c.buyAlpha10, border: `1px solid ${c.buyAlpha15}` }}
        >
          <Lock size={14} color={c.buy} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.buy, fontSize: φ.xs, fontWeight: 600, marginBottom: 2 }}>
              Bảo vệ bởi Escrow VitTrade
            </p>
            <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5 }}>
              {tradeType === 'buy'
                ? `${asset} sẽ được khóa trong Escrow cho đến khi bạn thanh toán và merchant xác nhận.`
                : `${asset} của bạn sẽ được khóa trong Escrow và chỉ giải phóng khi nhận được thanh toán.`}
            </p>
          </div>
        </div>

        {/* ───── How it works ───── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={13} color={c.primary} />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Express hoạt động thế nào?</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { step: '1', text: 'Nhập số tiền VND muốn giao dịch', icon: '💰' },
              { step: '2', text: 'Hệ thống tự match offer giá tốt nhất', icon: '⚡' },
              { step: '3', text: `Xác nhận → Tạo đơn → ${tradeType === 'buy' ? 'Thanh toán' : 'Nhận tiền'}`, icon: '✅' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)' }}
                >
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                </div>
                <span style={{ color: c.text2, fontSize: φ.xs }}>{item.text}</span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* ───── CTA Button ───── */}
        <div className="mt-auto pt-3">
          <CTAButton
            onClick={() => {
              if (bestAd) {
                const params = new URLSearchParams({
                  type: tradeType,
                  asset,
                  fiat: String(Math.round(fiatAmount)),
                  crypto: String(cryptoAmount),
                  adId: bestAd.id,
                  payment: selectedPayment || bestAd.paymentMethods[0] || '',
                });
                navigate(`${prefix}/p2p/express/confirm?${params.toString()}`);
                hapticSelection();
              }
            }}
            disabled={!isValid}
            variant={tradeType === 'buy' ? 'success' : 'danger'}
            style={{ fontSize: 15 }}
          >
            <Zap size={18} />
            {tradeType === 'buy' ? 'Mua nhanh' : 'Bán nhanh'} {asset}
          </CTAButton>
        </div>
      </div>
    </PageLayout>
  );
}