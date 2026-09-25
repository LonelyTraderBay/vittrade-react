import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useP2PAdQuery } from '../model/p2p-ad-queries';
import { useP2POrderMutation } from '../model/p2p-order-creation-queries';

export function P2PAdDetailContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const adQuery = useP2PAdQuery(id);
  const orderMutation = useP2POrderMutation();
  const canCreateOrder = hasPermission('p2p:write') || hasPermission('p2p:order:create');
  const [fiatAmount, setFiatAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ad = adQuery.data;
  const paymentMethod = selectedPayment || ad?.paymentMethods[0] || '';
  const numericFiatAmount = Number(fiatAmount);
  const cryptoAmount = ad ? numericFiatAmount / ad.price : 0;
  const validationMessage = useMemo(() => {
    if (!ad || !fiatAmount) return 'Nhập số tiền muốn giao dịch.';
    if (!Number.isFinite(numericFiatAmount) || numericFiatAmount <= 0) {
      return 'Số tiền phải lớn hơn 0.';
    }
    if (numericFiatAmount < ad.minLimit)
      return `Tối thiểu ${formatMoney(ad.minLimit)} ${ad.currency}.`;
    if (numericFiatAmount > ad.maxLimit)
      return `Tối đa ${formatMoney(ad.maxLimit)} ${ad.currency}.`;
    if (cryptoAmount > ad.available) return `Chỉ còn ${ad.available} ${ad.asset} khả dụng.`;
    if (!paymentMethod) return 'Chọn phương thức thanh toán.';
    return null;
  }, [ad, cryptoAmount, fiatAmount, numericFiatAmount, paymentMethod]);

  if (adQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Chi tiết quảng cáo" subtitle="Contract-backed P2P ad" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải quảng cáo P2P…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (adQuery.isError || !ad) {
    return (
      <PageLayout>
        <Header title="Chi tiết quảng cáo" subtitle="Contract-backed P2P ad" back />
        <ErrorState title="Không thể tải quảng cáo P2P" onAction={() => void adQuery.refetch()} />
      </PageLayout>
    );
  }

  const canReview = validationMessage === null;
  const submitOrder = async () => {
    if (!canCreateOrder || !canReview || orderMutation.isPending) return;
    try {
      const receipt = await orderMutation.mutateAsync({
        request: {
          adId: ad.id,
          asset: ad.asset,
          currency: ad.currency,
          amount: cryptoAmount,
          fiatAmount: numericFiatAmount,
          paymentMethod,
        },
        idempotencyKey: `p2p-ad-order-${crypto.randomUUID()}`,
      });
      navigate(`${prefix}/p2p/order/${receipt.orderId}`, { replace: true });
    } catch {
      setErrorMessage('Không thể tạo đơn P2P. Vui lòng thử lại.');
    }
  };

  return (
    <PageLayout>
      <Header title="Chi tiết quảng cáo" subtitle={`${ad.merchant} · ${ad.asset}`} back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 style={{ color: colors.text1, fontWeight: 700 }}>{ad.merchant}</h2>
              <p style={{ color: colors.text2, fontSize: 12 }}>
                {ad.merchantVerified ? 'Đã xác minh' : 'Chưa xác minh'} · {ad.completionRate}% hoàn
                tất
              </p>
            </div>
            <strong style={{ color: ad.type === 'sell' ? '#10B981' : '#EF4444' }}>
              {ad.type === 'sell' ? 'Mua' : 'Bán'} {ad.asset}
            </strong>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Detail label="Giá" value={`${formatMoney(ad.price)} ${ad.currency}`} />
            <Detail label="Khả dụng" value={`${ad.available} ${ad.asset}`} />
            <Detail label="Tối thiểu" value={`${formatMoney(ad.minLimit)} ${ad.currency}`} />
            <Detail label="Tối đa" value={`${formatMoney(ad.maxLimit)} ${ad.currency}`} />
          </div>
        </TrCard>

        <TrCard className="p-4">
          <label className="flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Số tiền thanh toán ({ad.currency})
            <input
              aria-label="Fiat amount"
              inputMode="decimal"
              type="number"
              min="0"
              value={fiatAmount}
              onChange={(event) => {
                setFiatAmount(event.target.value);
                setErrorMessage(null);
              }}
              className="rounded-lg p-3"
            />
          </label>
          <p className="mt-2 text-xs" style={{ color: colors.text3 }}>
            Nhận khoảng {cryptoAmount > 0 ? cryptoAmount.toFixed(6) : '0'} {ad.asset}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ad.paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                aria-pressed={paymentMethod === method}
                onClick={() => setSelectedPayment(method)}
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  background: paymentMethod === method ? colors.primary : colors.surface2,
                  color: paymentMethod === method ? '#fff' : colors.text2,
                }}
              >
                {method}
              </button>
            ))}
          </div>
          {validationMessage && (
            <p role="alert" className="mt-3 text-xs" style={{ color: '#EF4444' }}>
              {validationMessage}
            </p>
          )}
          {errorMessage && (
            <p role="alert" className="mt-3 text-xs" style={{ color: '#EF4444' }}>
              {errorMessage}
            </p>
          )}
          {!canCreateOrder && (
            <p role="alert" className="mt-3 text-xs" style={{ color: '#EF4444' }}>
              P2P order write permission is required to create an order.
            </p>
          )}
        </TrCard>

        <button
          type="button"
          disabled={!canCreateOrder || !canReview || orderMutation.isPending}
          onClick={() => setConfirmOpen(true)}
          className="w-full rounded-xl py-3 font-semibold"
          style={{
            background: canCreateOrder && canReview ? colors.primary : colors.surface2,
            color: canCreateOrder && canReview ? '#fff' : colors.text3,
          }}
        >
          Xem xác nhận đơn P2P
        </button>
      </PageContent>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl p-5" style={{ background: colors.surface }}>
            <h2 style={{ color: colors.text1, fontWeight: 700 }}>Xác nhận đơn P2P</h2>
            <p className="mt-2 text-sm" style={{ color: colors.text2 }}>
              {formatMoney(numericFiatAmount)} {ad.currency} qua {paymentMethod} để nhận{' '}
              {cryptoAmount.toFixed(6)} {ad.asset}.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg px-3 py-2 text-sm"
                style={{ background: colors.surface2, color: colors.text2 }}
              >
                Hủy
              </button>
              <button
                type="button"
                aria-label="Confirm P2P order"
                onClick={() => void submitOrder()}
                disabled={!canCreateOrder || orderMutation.isPending}
                className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold"
                style={{ background: colors.primary, color: '#fff' }}
              >
                {orderMutation.isPending ? 'Đang tạo…' : 'Xác nhận đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 11 }}>{label}</p>
      <strong style={{ color: colors.text1 }}>{value}</strong>
    </div>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}
