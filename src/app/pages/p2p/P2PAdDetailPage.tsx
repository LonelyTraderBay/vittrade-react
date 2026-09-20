import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Shield,
  Star,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Eye,
  BarChart3,
  Clock,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  Info,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { useHaptic } from '../../hooks/useHaptic';
import { P2P_ADS, P2P_MERCHANTS } from '../../data/mockData';
import type { P2PAd } from '../../data/mockData';
import { fmtVnd, fmtAmount, fmtVolume } from '../../data/formatNumber';
import { φ, φIcon, φAvatar, φRadius } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { TrInput } from '../../components/ui/TrInput';
import { P2PConfirmationModal } from '../../components/p2p/P2PConfirmationModal';
import type { ConfirmSummaryRow, ConfirmWarning } from '../../components/p2p/P2PConfirmationModal';

/* ═══════════════════════════════════════════════════════════
   Market prices for comparison
   ═══════════════════════════════════════════════════════════ */
const MARKET_PRICES: Record<string, number> = {
  USDT: 25_300,
  BTC: 1_715_000_000,
  ETH: 89_000_000,
  BNB: 15_200_000,
  SOL: 4_800_000,
};

export function P2PAdDetailPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();
  const { adId } = useParams();
  // The shared P2PAd type lacks the optional `paymentWindow` field this page reads
  // (the `|| 15` fallback keeps it optional).
  const ad: P2PAd & { paymentWindow?: number } = P2P_ADS.find((a) => a.id === adId) || P2P_ADS[0];
  const merchant = P2P_MERCHANTS.find((m) => m.id === ad.merchantId);

  const [amount, setAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [inputMode, setInputMode] = useState<'crypto' | 'fiat'>('fiat');
  const [selectedPayment, setSelectedPayment] = useState(ad.paymentMethods[0] || '');
  const [showTerms, setShowTerms] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);

  /* ─── Scroll lock handled by BottomSheetV2 internally ─── */
  const { onAfterOpen: onConfirmSheetOpen } = useSheetAnalytics('p2p-ad-detail-confirm');

  const isBuyAd = ad.type === 'sell';
  const tradeLabel = isBuyAd ? 'Mua' : 'Bán';
  const tradeColor = isBuyAd ? '#10B981' : '#EF4444';

  /* ─── Price vs Market ─── */
  const marketPrice = MARKET_PRICES[ad.asset] || ad.price;
  const priceDiffPct = ((ad.price - marketPrice) / marketPrice) * 100;
  const priceIsFavorable = isBuyAd ? priceDiffPct <= 0.5 : priceDiffPct >= -0.5;

  /* ─── Trust Score Calculation ─── */
  const trustScore = useMemo(() => {
    let score = 0;
    // Completion rate: max 30pts
    score += Math.min(30, (ad.completionRate / 100) * 30);
    // Order count: max 25pts
    score += Math.min(25, (ad.completedOrders / 500) * 25);
    // Is verified: 15pts
    if (ad.merchantVerified) score += 15;
    // Has badge: 10pts
    if (ad.merchantBadge) score += 10;
    // Merchant level: max 10pts
    score += Math.min(10, ad.merchantLevel * 3.33);
    // Has rating >= 4.5: 10pts
    if ((ad.merchantRating || 0) >= 4.5) score += 10;
    return Math.round(Math.min(100, score));
  }, [ad]);

  const trustColor = trustScore >= 80 ? '#10B981' : trustScore >= 60 ? '#F59E0B' : '#EF4444';
  const trustLabel =
    trustScore >= 80 ? 'Rất đáng tin' : trustScore >= 60 ? 'Đáng tin' : 'Cần cẩn thận';

  /* ─── Amount Logic ─── */
  const cryptoAmount = useMemo(() => {
    if (inputMode === 'crypto') return parseFloat(amount || '0');
    return parseFloat(fiatAmount || '0') / ad.price;
  }, [amount, fiatAmount, inputMode, ad.price]);

  const fiatTotal = useMemo(() => {
    if (inputMode === 'fiat') return parseFloat(fiatAmount || '0');
    return parseFloat(amount || '0') * ad.price;
  }, [amount, fiatAmount, inputMode, ad.price]);

  const handleFiatChange = (val: string) => {
    setFiatAmount(val);
    setInputMode('fiat');
    const num = parseFloat(val || '0');
    setAmount(num > 0 ? (num / ad.price).toFixed(6) : '');
  };

  const handleCryptoChange = (val: string) => {
    setAmount(val);
    setInputMode('crypto');
    const num = parseFloat(val || '0');
    setFiatAmount(num > 0 ? Math.round(num * ad.price).toString() : '');
  };

  const isValid =
    cryptoAmount > 0 &&
    fiatTotal >= ad.minLimit &&
    fiatTotal <= ad.maxLimit &&
    cryptoAmount <= ad.available &&
    selectedPayment;

  const errorMsg = useMemo(() => {
    if (fiatTotal > 0 && fiatTotal < ad.minLimit)
      return `Tối thiểu ${fmtVnd(ad.minLimit)} ${ad.currency}`;
    if (fiatTotal > ad.maxLimit) return `Tối đa ${fmtVnd(ad.maxLimit)} ${ad.currency}`;
    if (cryptoAmount > ad.available)
      return `Chỉ còn ${fmtAmount(ad.available)} ${ad.asset} khả dụng`;
    return '';
  }, [fiatTotal, cryptoAmount, ad]);

  const handleCreateOrder = async () => {
    if (!isValid) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedOrder = async () => {
    setShowConfirmModal(false);
    setIsCreating(true);
    hapticSuccess();
    await new Promise((r) => setTimeout(r, 1200));
    navigate(`${prefix}/p2p/order/p2p001`, { replace: true });
  };

  const confirmSummary: ConfirmSummaryRow[] = [
    { label: 'Loại giao dịch', value: `${tradeLabel} ${ad.asset}`, highlight: true },
    { label: 'Số lượng', value: `${fmtAmount(cryptoAmount)} ${ad.asset}`, mono: true },
    { label: 'Giá', value: `${fmtVnd(ad.price)} ${ad.currency}`, mono: true },
    { label: 'Merchant', value: ad.merchant },
    { label: 'Thanh toán qua', value: selectedPayment },
    { label: 'Phí giao dịch', value: 'Miễn phí' },
  ];

  const confirmWarnings: ConfirmWarning[] = [
    {
      text: 'Chuyển khoản xong mới nhấn xác nhận. Nhấn trước khi chuyển có thể bị mất tiền.',
      type: 'danger',
    },
    {
      text: `Bạn có ${ad.paymentWindow || 15} phút để hoàn tất thanh toán sau khi tạo đơn.`,
      type: 'warning',
    },
  ];

  /* ─── Account Age ─── */
  const accountAgeDays = ad.merchantJoinDate
    ? Math.floor((Date.now() - new Date(ad.merchantJoinDate).getTime()) / 86_400_000)
    : 0;

  return (
    <PageLayout variant="flush">
      <Header title="Chi tiết quảng cáo" subtitle="Quảng cáo · P2P" back />
      <PageContent grow>
        {/* ═══ 1. Merchant Info Card — Enhanced ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <TrCard
            as="button"
            hover
            onClick={() => {
              navigate(`${prefix}/p2p/merchant/${ad.merchantId}`);
              hapticSelection();
            }}
            className="p-4 w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: φAvatar.md,
                    height: φAvatar.md,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: φ.base, fontWeight: 700 }}>
                    {ad.merchant.charAt(0)}
                  </span>
                </div>
                <div
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                  style={{
                    background: ad.isOnline ? '#10B981' : '#6B7280',
                    borderColor: c.surface,
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
                    {ad.merchant}
                  </span>
                  {ad.merchantVerified && (
                    <Shield size={φIcon.sm} color="#3B82F6" fill="rgba(59,130,246,0.2)" />
                  )}
                  {ad.merchantBadge && (
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          ad.merchantBadge === 'elite'
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(139,92,246,0.12)',
                        color: ad.merchantBadge === 'elite' ? '#F59E0B' : '#8B5CF6',
                        fontSize: 8,
                        fontWeight: 700,
                      }}
                    >
                      {ad.merchantBadge === 'elite' ? 'Elite' : 'Pro'}
                    </span>
                  )}
                  <div className="flex gap-0.5">
                    {Array.from({ length: ad.merchantLevel }, (_, i) => (
                      <Star key={i} size={10} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>{ad.completedOrders} đơn</span>
                  <span style={{ color: c.text3, fontSize: φ.xs }}>
                    {ad.completionRate}% hoàn thành
                  </span>
                  <span style={{ color: ad.isOnline ? '#10B981' : c.text3, fontSize: φ.xs }}>
                    {ad.isOnline ? 'Online' : ad.lastActive}
                  </span>
                </div>
              </div>
              <ChevronRight size={φIcon.md} color={c.text3} />
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ 2. Trust Score & Price Comparison Bar ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex gap-2.5">
            {/* Trust Score */}
            <button
              onClick={() => {
                setShowTrustDetails(!showTrustDetails);
                hapticSelection();
              }}
              className="flex-1 rounded-2xl p-3"
              style={{
                background: c.surface,
                border: `1px solid ${c.cardBorder}`,
                boxShadow: c.cardShadow,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} color={trustColor} />
                <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>Độ tin cậy</span>
                {showTrustDetails ? (
                  <ChevronUp size={10} color={c.text3} />
                ) : (
                  <ChevronDown size={10} color={c.text3} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    color: trustColor,
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {trustScore}
                </span>
                <span style={{ color: trustColor, fontSize: 9, fontWeight: 600 }}>/100</span>
              </div>
              <div
                className="h-1.5 rounded-full mt-1.5 overflow-hidden"
                style={{ background: c.surface2 }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trustScore}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: trustColor }}
                />
              </div>
              <p style={{ color: trustColor, fontSize: 9, fontWeight: 600, marginTop: 3 }}>
                {trustLabel}
              </p>
            </button>

            {/* Price vs Market */}
            <div
              className="flex-1 rounded-2xl p-3"
              style={{
                background: c.surface,
                border: `1px solid ${c.cardBorder}`,
                boxShadow: c.cardShadow,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={12} color={priceIsFavorable ? '#10B981' : '#F59E0B'} />
                <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>
                  So với thị trường
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  style={{
                    color: priceDiffPct === 0 ? c.text1 : priceDiffPct > 0 ? '#EF4444' : '#10B981',
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {priceDiffPct > 0 ? '+' : ''}
                  {priceDiffPct.toFixed(2)}%
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 3 }}>
                Thị trường: {fmtVnd(marketPrice)}
              </p>
              <p
                style={{
                  color: priceIsFavorable ? '#10B981' : '#F59E0B',
                  fontSize: 9,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {priceIsFavorable ? 'Giá hợp lý' : 'Cao hơn TB'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ 2b. Trust Score Details (Expandable) ═══ */}
        <AnimatePresence>
          {showTrustDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden -mt-1"
            >
              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                  Phân tích độ tin cậy
                </p>
                {[
                  {
                    label: 'Tỷ lệ hoàn thành',
                    value: `${ad.completionRate}%`,
                    pct: ad.completionRate,
                    color: '#10B981',
                  },
                  {
                    label: 'Số đơn hoàn thành',
                    value: `${ad.completedOrders}`,
                    pct: Math.min(100, (ad.completedOrders / 500) * 100),
                    color: '#3B82F6',
                  },
                  {
                    label: 'Xác minh danh tính',
                    value: ad.merchantVerified ? 'Đã xác minh' : 'Chưa',
                    pct: ad.merchantVerified ? 100 : 0,
                    color: '#8B5CF6',
                  },
                  {
                    label: 'Tuổi tài khoản',
                    value: `${accountAgeDays} ngày`,
                    pct: Math.min(100, (accountAgeDays / 365) * 100),
                    color: '#F59E0B',
                  },
                  {
                    label: 'Thời gian phản hồi',
                    value: ad.avgResponseTime || '—',
                    pct: 85,
                    color: '#10B981',
                  },
                ].map((item, i) => (
                  <div key={item.label} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: c.text2, fontSize: 10 }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: 10, fontWeight: 600 }}>
                        {item.value}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: c.surface2 }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </TrCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 3. Viewers + Volume Indicators ═══ */}
        {(ad.viewerCount || ad.totalVolume30d > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="flex gap-3"
          >
            {ad.viewerCount && ad.viewerCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.12)',
                }}
              >
                <Eye size={11} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                  {ad.viewerCount} đang xem
                </span>
              </div>
            )}
            {ad.totalVolume30d > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.12)',
                }}
              >
                <BarChart3 size={11} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                  KL 30d: {fmtVolume(ad.totalVolume30d)}
                </span>
              </div>
            )}
            {ad.merchantRating && (
              <div
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.12)',
                }}
              >
                <Star size={10} fill="#F59E0B" color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700 }}>
                  {ad.merchantRating}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ 4. Price & Info ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text2, fontSize: φ.sm }}>Giá</span>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    color: c.text1,
                    fontSize: φ.md,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {fmtVnd(ad.price)}
                </span>
                <span style={{ color: c.text3, fontSize: φ.sm }}>
                  {ad.currency}/{ad.asset}
                </span>
              </div>
            </div>
            {ad.priceType === 'floating' && ad.priceMargin !== undefined && (
              <div
                className="flex items-center justify-between mb-3 pb-3"
                style={{ borderBottom: `1px solid ${c.divider}` }}
              >
                <span style={{ color: c.text3, fontSize: φ.xs }}>Loại giá</span>
                <span
                  style={{
                    color: ad.priceMargin >= 0 ? '#10B981' : '#3B82F6',
                    fontSize: φ.xs,
                    fontWeight: 600,
                  }}
                >
                  Thả nổi {ad.priceMargin >= 0 ? '+' : ''}
                  {ad.priceMargin}%
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Khả dụng</p>
                <p
                  style={{
                    color: c.text1,
                    fontSize: φ.sm,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {fmtAmount(ad.available)} {ad.asset}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Giới hạn</p>
                <p style={{ color: c.text1, fontSize: φ.xs, fontFamily: 'monospace' }}>
                  {fmtVnd(ad.minLimit)} - {fmtVnd(ad.maxLimit)}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Phản hồi</p>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  <Clock size={10} className="inline mr-1" />
                  {ad.avgResponseTime}
                </p>
              </div>
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ 5. Amount Input ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <TrCard className="p-4">
            <h3 style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 12 }}>
              Nhập số lượng
            </h3>

            {/* Fiat input */}
            <TrInput
              label={`Số tiền (${ad.currency})`}
              placeholder={`${fmtVnd(ad.minLimit)} - ${fmtVnd(ad.maxLimit)}`}
              value={fiatAmount}
              onChange={handleFiatChange}
              suffix={ad.currency}
              numeric
              inputMode="decimal"
              error={errorMsg && inputMode === 'fiat' ? errorMsg : undefined}
              className="mb-3"
            />

            {/* Crypto input */}
            <TrInput
              label={`Số lượng (${ad.asset})`}
              placeholder="0.00"
              value={amount}
              onChange={handleCryptoChange}
              suffix={ad.asset}
              numeric
              inputMode="decimal"
              error={errorMsg && inputMode === 'crypto' ? errorMsg : undefined}
              className="mb-3"
            />

            {/* Quick amount buttons */}
            <div className="flex gap-2 mb-2">
              {[25, 50, 75, 100].map((pct) => {
                const val = Math.min(
                  Math.round((ad.maxLimit * pct) / 100),
                  Math.round(ad.available * ad.price),
                );
                return (
                  <button
                    key={pct}
                    onClick={() => {
                      handleFiatChange(val.toString());
                      hapticSelection();
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: c.chipBg,
                      color: c.chipText,
                      border: `1px solid ${c.chipBorder}`,
                    }}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <p style={{ color: '#EF4444', fontSize: φ.xs, marginTop: 4 }}>
                <AlertTriangle size={10} className="inline mr-1" />
                {errorMsg}
              </p>
            )}
          </TrCard>
        </motion.div>

        {/* ═══ 6. Payment Method Selection ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TrCard className="p-4">
            <h3 style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 12 }}>
              <CreditCard size={φIcon.sm} className="inline mr-2" />
              Phương thức thanh toán
            </h3>
            <div className="flex flex-wrap gap-2">
              {ad.paymentMethods.map((pm) => (
                <button
                  key={pm}
                  onClick={() => {
                    setSelectedPayment(pm);
                    hapticSelection();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: selectedPayment === pm ? 'rgba(59,130,246,0.15)' : c.surface2,
                    color: selectedPayment === pm ? '#3B82F6' : c.text2,
                    border: `1.5px solid ${selectedPayment === pm ? 'rgba(59,130,246,0.4)' : c.borderSolid}`,
                  }}
                >
                  {selectedPayment === pm && <CheckCircle size={14} color="#3B82F6" />}
                  {pm}
                </button>
              ))}
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ 7. Counterparty Requirements ═══ */}
        {ad.counterpartyRequirements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
          >
            <div
              className="rounded-2xl p-3"
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Info size={12} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 600 }}>
                  Yêu cầu đối tác
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ad.counterpartyRequirements.minKycLevel && (
                  <span
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                  >
                    KYC cấp {ad.counterpartyRequirements.minKycLevel}+
                  </span>
                )}
                {ad.counterpartyRequirements.minCompletedTrades !== undefined && (
                  <span
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                  >
                    {ad.counterpartyRequirements.minCompletedTrades}+ giao dịch
                  </span>
                )}
                {ad.counterpartyRequirements.minRegisteredDays && (
                  <span
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                  >
                    {ad.counterpartyRequirements.minRegisteredDays}+ ngày
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ 8. Merchant Terms ═══ */}
        {ad.remarks && (
          <TrCard overflow>
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: c.surface }}
            >
              <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
                Điều kiện giao dịch
              </span>
              <ChevronRight
                size={φIcon.sm}
                color={c.text3}
                style={{
                  transform: showTerms ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {showTerms && (
              <div
                className="px-4 py-3"
                style={{ background: c.surface, borderTop: `1px solid ${c.divider}` }}
              >
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{ad.remarks}</p>
                {ad.tradingHours && (
                  <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 8 }}>
                    <Clock size={10} className="inline mr-1" />
                    Giờ giao dịch: {ad.tradingHours}
                  </p>
                )}
              </div>
            )}
          </TrCard>
        )}

        {/* ═══ 9. Escrow Info ═══ */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <div className="flex items-start gap-2">
            <Lock size={14} color="#10B981" className="shrink-0 mt-0.5" />
            <p style={{ color: '#10B981', fontSize: φ.xs, lineHeight: 1.6 }}>
              Tài sản được bảo vệ bởi hệ thống Escrow VitTrade. {fmtAmount(cryptoAmount || 0)}{' '}
              {ad.asset} sẽ được khóa cho đến khi xác nhận thanh toán thành công.
            </p>
          </div>
        </div>

        {/* ═══ 10. Order Summary ═══ */}
        {fiatTotal > 0 && isValid && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="rounded-2xl p-4"
              style={{ background: `${tradeColor}10`, border: `1px solid ${tradeColor}25` }}
            >
              <h4 style={{ color: tradeColor, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>
                Tóm tắt đơn hàng
              </h4>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Giao dịch</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                    {tradeLabel} {fmtAmount(cryptoAmount)} {ad.asset}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Giá</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontFamily: 'monospace' }}>
                    {fmtVnd(ad.price)} {ad.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Thanh toán qua</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                    {selectedPayment}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: `1px solid ${tradeColor}20` }}
                >
                  <span style={{ color: tradeColor, fontSize: φ.sm, fontWeight: 700 }}>
                    {isBuyAd ? 'Cần thanh toán' : 'Sẽ nhận được'}
                  </span>
                  <span
                    style={{
                      color: tradeColor,
                      fontSize: φ.base,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {fmtVnd(Math.round(fiatTotal))} {ad.currency}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </PageContent>
      <StickyFooter>
        <CTAButton
          onClick={handleCreateOrder}
          disabled={!isValid}
          loading={isCreating}
          variant={isBuyAd ? 'success' : 'danger'}
        >
          {isCreating ? 'Đang tạo đơn...' : `${tradeLabel} ${ad.asset}`}
        </CTAButton>
      </StickyFooter>

      {/* ═══ Confirmation Modal ═══ */}
      <P2PConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedOrder}
        isLoading={isCreating}
        title={`Xác nhận ${tradeLabel} ${ad.asset}`}
        subtitle={`Bạn sắp ${tradeLabel.toLowerCase()} ${fmtAmount(cryptoAmount)} ${ad.asset} từ ${ad.merchant}`}
        icon={isBuyAd ? ShieldCheck : Shield}
        iconColor={tradeColor}
        summaryRows={confirmSummary}
        totalRow={{
          label: isBuyAd ? 'Cần thanh toán' : 'Sẽ nhận được',
          value: `${fmtVnd(Math.round(fiatTotal))} ${ad.currency}`,
          color: tradeColor,
        }}
        warnings={confirmWarnings}
        showEscrow
        escrowText={`${fmtAmount(cryptoAmount)} ${ad.asset} sẽ được khóa trong Escrow VitTrade cho đến khi xác nhận thanh toán thành công.`}
        showTimeLimit
        timeLimitText={`Bạn có ${ad.paymentWindow || 15} phút để hoàn tất thanh toán sau khi tạo đơn.`}
        confirmLabel={`Xác nhận ${tradeLabel}`}
        confirmVariant={isBuyAd ? 'success' : 'danger'}
        onAfterOpen={onConfirmSheetOpen}
      />
    </PageLayout>
  );
}
