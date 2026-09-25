import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useP2PAdCreateMutation } from '../model/p2p-ad-create-queries';
import type { P2PAdCreateRequest, P2PAdType } from '../model/p2p-types';
import { P2PCreateAdConfirmation, P2PCreateAdForm } from '../components/P2PCreateAdSections';

export function P2PCreateAdContractPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const createMutation = useP2PAdCreateMutation();
  const canWriteAds = hasPermission('p2p:write') || hasPermission('p2p:ad:write');
  const [adType, setAdType] = useState<P2PAdType>('sell');
  const [asset, setAsset] = useState('USDT');
  const [currency, setCurrency] = useState('VND');
  const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
  const [price, setPrice] = useState('');
  const [priceMargin, setPriceMargin] = useState('');
  const [available, setAvailable] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentWindow, setPaymentWindow] = useState('15');
  const [tradingHours, setTradingHours] = useState('24/7');
  const [minKycLevel, setMinKycLevel] = useState('');
  const [minCompletedTrades, setMinCompletedTrades] = useState('');
  const [minRegisteredDays, setMinRegisteredDays] = useState('');
  const [remarks, setRemarks] = useState('');
  const [autoReply, setAutoReply] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const request = useMemo<P2PAdCreateRequest | null>(() => {
    const numericPrice = Number(price);
    const numericAvailable = Number(available);
    const numericMinLimit = Number(minLimit);
    const numericMaxLimit = Number(maxLimit);
    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      !Number.isFinite(numericAvailable) ||
      numericAvailable <= 0 ||
      !Number.isFinite(numericMinLimit) ||
      numericMinLimit < 0 ||
      !Number.isFinite(numericMaxLimit) ||
      numericMaxLimit <= 0 ||
      numericMaxLimit < numericMinLimit ||
      paymentMethods.length === 0
    ) {
      return null;
    }

    return {
      type: adType,
      asset,
      currency,
      priceType,
      price: numericPrice,
      priceMargin: priceType === 'floating' ? Number(priceMargin) || 0 : undefined,
      available: numericAvailable,
      minLimit: numericMinLimit,
      maxLimit: numericMaxLimit,
      paymentMethods,
      paymentWindow: Number(paymentWindow),
      tradingHours,
      remarks: remarks.trim() || undefined,
      autoReply: autoReply.trim() || undefined,
      counterpartyRequirements: {
        minKycLevel: Number(minKycLevel) || undefined,
        minCompletedTrades: Number(minCompletedTrades) || undefined,
        minRegisteredDays: Number(minRegisteredDays) || undefined,
      },
    };
  }, [
    adType,
    asset,
    autoReply,
    available,
    currency,
    maxLimit,
    minCompletedTrades,
    minKycLevel,
    minLimit,
    minRegisteredDays,
    paymentMethods,
    paymentWindow,
    price,
    priceMargin,
    priceType,
    remarks,
    tradingHours,
  ]);

  const validationMessage = getValidationMessage({
    price,
    available,
    minLimit,
    maxLimit,
    paymentMethods,
    priceType,
    priceMargin,
  });

  const togglePayment = (method: string) => {
    setPaymentMethods((current) =>
      current.includes(method)
        ? current.filter((value) => value !== method)
        : current.length < 5
          ? [...current, method]
          : current,
    );
  };

  const submit = async () => {
    if (!canWriteAds || !request || createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({
        request,
        idempotencyKey: `p2p-ad-${crypto.randomUUID()}`,
      });
      navigate(`${prefix}/p2p/my-ads`, { replace: true });
    } catch {
      setConfirmOpen(false);
      setErrorMessage('Không thể đăng quảng cáo. Vui lòng thử lại.');
    }
  };

  return (
    <PageLayout>
      <Header title="Đăng quảng cáo P2P" subtitle="Contract-backed ad creation" back />
      <PageContent gap="default">
        {!canWriteAds && (
          <p role="alert" className="text-sm" style={{ color: colors.sell }}>
            P2P ad write permission is required to create an advertisement.
          </p>
        )}
        <P2PCreateAdForm
          colors={colors}
          adType={adType}
          asset={asset}
          currency={currency}
          priceType={priceType}
          price={price}
          priceMargin={priceMargin}
          available={available}
          minLimit={minLimit}
          maxLimit={maxLimit}
          paymentMethods={paymentMethods}
          paymentWindow={paymentWindow}
          tradingHours={tradingHours}
          minKycLevel={minKycLevel}
          minCompletedTrades={minCompletedTrades}
          minRegisteredDays={minRegisteredDays}
          remarks={remarks}
          autoReply={autoReply}
          validationMessage={validationMessage}
          errorMessage={errorMessage}
          canWriteAds={canWriteAds}
          canSubmit={Boolean(request)}
          submitPending={createMutation.isPending}
          onSubmit={() => void submit()}
          onOpenConfirmation={() => setConfirmOpen(true)}
          onAdTypeChange={setAdType}
          onAssetChange={setAsset}
          onCurrencyChange={setCurrency}
          onPriceTypeChange={setPriceType}
          onPriceChange={setPrice}
          onPriceMarginChange={setPriceMargin}
          onAvailableChange={setAvailable}
          onMinLimitChange={setMinLimit}
          onMaxLimitChange={setMaxLimit}
          onPaymentToggle={togglePayment}
          onPaymentWindowChange={setPaymentWindow}
          onTradingHoursChange={setTradingHours}
          onMinKycLevelChange={setMinKycLevel}
          onMinCompletedTradesChange={setMinCompletedTrades}
          onMinRegisteredDaysChange={setMinRegisteredDays}
          onRemarksChange={setRemarks}
          onAutoReplyChange={setAutoReply}
        />
      </PageContent>
      {request && (
        <P2PCreateAdConfirmation
          request={request}
          colors={colors}
          open={confirmOpen}
          canWriteAds={canWriteAds}
          pending={createMutation.isPending}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => void submit()}
        />
      )}
    </PageLayout>
  );
}

function getValidationMessage({
  price,
  available,
  minLimit,
  maxLimit,
  paymentMethods,
  priceType,
  priceMargin,
}: {
  price: string;
  available: string;
  minLimit: string;
  maxLimit: string;
  paymentMethods: string[];
  priceType: 'fixed' | 'floating';
  priceMargin: string;
}) {
  if (!price || Number(price) <= 0) return 'Nhập giá quảng cáo hợp lệ.';
  if (priceType === 'floating' && priceMargin && !Number.isFinite(Number(priceMargin))) {
    return 'Biên độ giá không hợp lệ.';
  }
  if (!available || Number(available) <= 0) return 'Nhập số lượng tài sản khả dụng.';
  if (!minLimit || Number(minLimit) < 0) return 'Nhập hạn mức tối thiểu.';
  if (!maxLimit || Number(maxLimit) <= 0 || Number(maxLimit) < Number(minLimit)) {
    return 'Hạn mức tối đa phải lớn hơn hoặc bằng tối thiểu.';
  }
  if (paymentMethods.length === 0) return 'Chọn ít nhất một phương thức thanh toán.';
  return null;
}
