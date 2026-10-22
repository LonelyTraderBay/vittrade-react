import { useMemo, useState } from 'react';
import { ArrowDownUp, Info, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { CTAButton } from '@/shared/ui/CTAButton';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2PAdsQuery } from '../model/p2p-ad-queries';
import { useP2PPaymentMethodsQuery } from '../model/p2p-payment-method-queries';
import type { P2PAd, P2PAdType } from '../model/p2p-types';

const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'] as const;
const QUICK_AMOUNTS = [1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];
const EMPTY_ADS: P2PAd[] = [];

export function P2PExpressPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tradeType, setTradeType] = useState<P2PAdType>('buy');
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>('USDT');
  const [fiatInput, setFiatInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const adsQuery = useP2PAdsQuery({ asset, currency: 'VND' });
  const paymentMethodsQuery = useP2PPaymentMethodsQuery();
  const resultsReady = adsQuery.isSuccess && paymentMethodsQuery.isSuccess;
  const fiatAmount = Number(fiatInput) || 0;
  const ads = adsQuery.data?.items ?? EMPTY_ADS;
  const compatibleAds = useMemo(() => {
    const requiredType = tradeType === 'buy' ? 'sell' : 'buy';
    return ads
      .filter(
        (ad) =>
          ad.type === requiredType &&
          ad.status === 'active' &&
          (fiatAmount <= 0 || (fiatAmount >= ad.minLimit && fiatAmount <= ad.maxLimit)) &&
          (!paymentMethod || ad.paymentMethods.includes(paymentMethod)),
      )
      .sort((left, right) =>
        tradeType === 'buy' ? left.price - right.price : right.price - left.price,
      );
  }, [ads, fiatAmount, paymentMethod, tradeType]);
  const bestAd = compatibleAds[0];
  const verifiedPayments = (paymentMethodsQuery.data?.items ?? [])
    .filter((method) => method.isVerified)
    .map((method) => method.bankName);
  const availablePayments = Array.from(
    new Set([
      ...verifiedPayments,
      ...compatibleAds.flatMap((ad) => ad.paymentMethods),
      ...(paymentMethod ? [paymentMethod] : []),
    ]),
  );

  const goToConfirm = () => {
    if (!resultsReady || !bestAd || fiatAmount <= 0) return;
    const params = new URLSearchParams({
      type: tradeType,
      asset,
      fiat: String(Math.round(fiatAmount)),
      adId: bestAd.id,
      payment: paymentMethod || bestAd.paymentMethods[0] || '',
    });
    navigate(`${prefix}/p2p/express/confirm?${params.toString()}`);
  };

  return (
    <PageLayout>
      <Header title="Express Trade" subtitle="Mua bán nhanh · P2P" back />
      <PageContent gap="default">
        <div className="flex rounded-2xl p-1" style={{ background: colors.surface2 }}>
          {(['buy', 'sell'] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={tradeType === type}
              onClick={() => setTradeType(type)}
              className="flex-1 rounded-xl py-3 font-bold text-sm"
              style={{
                background:
                  tradeType === type
                    ? type === 'buy'
                      ? 'var(--tr-buy)'
                      : '#EF4444'
                    : 'transparent',
                color: tradeType === type ? 'var(--tr-text-on-color)' : colors.text3,
              }}
            >
              {type === 'buy' ? 'MUA NHANH' : 'BÁN NHANH'}
            </button>
          ))}
        </div>

        <TrCard className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span style={{ color: colors.text3, fontSize: 11 }}>Tài sản</span>
              <select
                value={asset}
                onChange={(event) => setAsset(event.target.value as (typeof ASSETS)[number])}
                className="rounded-xl px-3 py-3"
                style={{ background: colors.surface2, color: colors.text1 }}
              >
                {ASSETS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span style={{ color: colors.text3, fontSize: 11 }}>Số tiền VND</span>
              <input
                value={fiatInput}
                onChange={(event) => setFiatInput(event.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
                className="rounded-xl px-3 py-3"
                style={{ background: colors.surface2, color: colors.text1 }}
              />
            </label>
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setFiatInput(String(amount))}
                className="rounded-lg px-2.5 py-1.5 text-xs"
                style={{ background: colors.chipBg, color: colors.chipText }}
              >
                {amount.toLocaleString('vi-VN')}
              </button>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownUp size={15} color={colors.primary} />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Phương thức thanh toán
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              aria-pressed={!paymentMethod}
              onClick={() => setPaymentMethod('')}
              className="rounded-xl px-3 py-2 text-xs"
              style={{
                background: !paymentMethod ? colors.primaryAlpha12 : colors.surface2,
                color: !paymentMethod ? colors.primary : colors.text2,
              }}
            >
              Tự chọn tốt nhất
            </button>
            {availablePayments.map((method) => (
              <button
                key={method}
                type="button"
                aria-pressed={paymentMethod === method}
                onClick={() => setPaymentMethod(method)}
                className="rounded-xl px-3 py-2 text-xs"
                style={{
                  background: paymentMethod === method ? colors.primaryAlpha12 : colors.surface2,
                  color: paymentMethod === method ? colors.primary : colors.text2,
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </TrCard>

        <div
          role="region"
          aria-label="Offer Express P2P"
          aria-busy={adsQuery.isFetching || paymentMethodsQuery.isFetching}
        >
          {adsQuery.isError || paymentMethodsQuery.isError ? (
            <div role="alert">
              <ErrorState
                title="Không thể tải dữ liệu Express P2P"
                message="Offer hiện chưa khả dụng. Bạn có thể thử lại hoặc đổi tài sản; số tiền và bộ lọc được giữ nguyên."
                actionLabel="Thử lại"
                onAction={() => {
                  void adsQuery.refetch();
                  void paymentMethodsQuery.refetch();
                }}
              />
            </div>
          ) : !resultsReady ? (
            <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
              Đang tìm offer tốt nhất…
            </p>
          ) : bestAd ? (
            <TrCard
              className="p-4"
              accentBorder={tradeType === 'buy' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap
                  size={16}
                  color={tradeType === 'buy' ? 'var(--tr-success-text)' : 'var(--tr-error-text)'}
                />
                <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                  Offer phù hợp nhất
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
                    {bestAd.merchant}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 11 }}>
                    {bestAd.completionRate}% hoàn tất · {bestAd.avgResponseTime}
                  </p>
                </div>
                <p style={{ color: colors.text1, fontSize: 15, fontWeight: 700 }}>
                  {bestAd.price.toLocaleString('vi-VN')} VND
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <ShieldCheck size={14} color="var(--tr-success-text)" />
                <span style={{ color: colors.text2, fontSize: 11 }}>
                  {(fiatAmount / bestAd.price).toFixed(8)} {asset} dự kiến
                </span>
              </div>
            </TrCard>
          ) : (
            <TrCard className="p-4">
              <div className="flex items-start gap-2">
                <Info size={15} color="var(--tr-warning-text)" />
                <p style={{ color: colors.text2, fontSize: 12 }}>
                  Chưa tìm thấy offer phù hợp với số tiền và bộ lọc hiện tại.
                </p>
              </div>
            </TrCard>
          )}
        </div>

        <CTAButton
          variant={tradeType === 'buy' ? 'success' : 'danger'}
          icon={Zap}
          disabled={!resultsReady || !bestAd || fiatAmount <= 0}
          onClick={goToConfirm}
        >
          {tradeType === 'buy' ? 'Mua nhanh' : 'Bán nhanh'} {asset}
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}
