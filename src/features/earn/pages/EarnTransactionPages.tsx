import { useRef, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  useCreateEarnSubscriptionMutation,
  useEarnSnapshotQuery,
  useRedeemEarnPositionMutation,
} from '../model/earn-queries';
import type { EarnReceipt } from '../model/earn-types';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { CTAButton } from '@/shared/ui/CTAButton';
import { TrCard } from '@/shared/ui/TrCard';
import { ErrorState } from '@/shared/ui/ErrorState';
import { EmptyState } from '@/shared/ui/EmptyState';
import { InputField } from '@/shared/ui/InputField';
import { InfoRow } from '@/shared/ui/InfoRow';
import { withAlpha } from '@/shared/theme/colors';
import { formatAmount } from '../lib/formatters';
import { useAuth } from '@/shared/session/useAuth';
import { formatEarnActionError } from '../model/earn-error-message';

function LoadingPage({ title }: { title: string }) {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} back />
      <PageContent>
        <p role="status" style={{ color: c.text2 }}>
          Đang tải dữ liệu API…
        </p>
        <div
          aria-hidden="true"
          className="h-48 animate-pulse rounded-3xl"
          style={{ background: c.surface2 }}
        />
      </PageContent>
    </PageLayout>
  );
}

export function EarnProductDetailPage() {
  const { productId = '' } = useParams();
  const prefix = useRoutePrefix();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const { hasPermission } = useAuth();
  const canSubscribe = hasPermission('earn:write') || hasPermission('earn:subscribe');
  const snapshotQuery = useEarnSnapshotQuery();
  const mutation = useCreateEarnSubscriptionMutation();
  const [amount, setAmount] = useState('');
  const submitInFlight = useRef(false);
  const attemptKeys = useRef(new Map<string, string>());
  const [agreed, setAgreed] = useState(false);
  const product = snapshotQuery.data?.products.find((item) => item.id === productId);
  const balance = product ? (snapshotQuery.data?.balances[product.asset] ?? 0) : 0;
  const amountNumber = Number(amount);
  const canSubmit =
    canSubscribe &&
    Boolean(product) &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    amountNumber >= (product?.minAmount ?? Infinity) &&
    amountNumber <= balance &&
    agreed;
  const amountError = !amount
    ? undefined
    : !Number.isFinite(amountNumber)
      ? 'Nhập số lượng hợp lệ.'
      : amountNumber <= 0
        ? 'Số lượng phải lớn hơn 0.'
        : amountNumber < (product?.minAmount ?? Infinity)
          ? `Tối thiểu ${formatAmount(product?.minAmount ?? 0)} ${product?.asset ?? ''}`
          : amountNumber > balance
            ? 'Số lượng vượt quá số dư khả dụng.'
            : undefined;

  if (snapshotQuery.isPending) return <LoadingPage title="Chi tiết sản phẩm" />;
  if (snapshotQuery.isError || !product) {
    return (
      <PageLayout>
        <Header title="Chi tiết sản phẩm" back />
        <PageContent>
          <div role="alert">
            <ErrorState onAction={() => void snapshotQuery.refetch()} />
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const submit = async () => {
    if (!canSubmit || submitInFlight.current) return;
    submitInFlight.current = true;
    const request = { productId: product.id, amount: amountNumber };
    const signature = JSON.stringify(request);
    const key = attemptKeys.current.get(signature) ?? crypto.randomUUID();
    attemptKeys.current.set(signature, key);
    try {
      const receipt = await mutation.mutateAsync({
        request,
        idempotencyKey: `earn-subscribe-${key}`,
      });
      attemptKeys.current.delete(signature);
      hapticSuccess();
      navigate(`${prefix}/earn/savings/receipt`, { state: { receipt } });
    } catch {
      // The mutation error is rendered inline below and reported by the API boundary.
    } finally {
      submitInFlight.current = false;
    }
  };

  return (
    <PageLayout>
      <Header title="Chi tiết sản phẩm" subtitle="Earn · Tiết kiệm" back />
      <PageContent gap="relaxed">
        <TrCard variant="hero" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p style={{ color: c.text2, fontSize: 13 }}>{product.asset}</p>
              <h2
                style={{ color: c.text1, fontSize: 22, fontWeight: 800, overflowWrap: 'anywhere' }}
              >
                {product.name}
              </h2>
            </div>
            <ShieldCheck color={c.successText} size={28} className="shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>APY hiện tại</p>
              <p style={{ color: c.successText, fontSize: 26, fontWeight: 800 }}>{product.apy}%</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>Thời hạn</p>
              <p style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>
                {product.lockDays ? `${product.lockDays} ngày` : 'Linh hoạt'}
              </p>
            </div>
          </div>
        </TrCard>
        <TrCard className="flex flex-col gap-3 p-4">
          <InputField
            id="earn-detail-amount"
            label="Số lượng đăng ký"
            inputMode="decimal"
            value={amount}
            disabled={mutation.isPending}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={String(product.minAmount)}
            helper={
              amountError
                ? undefined
                : `Tối thiểu ${formatAmount(product.minAmount)} ${product.asset}`
            }
            error={amountError}
            suffix={<span style={{ color: c.text2, fontWeight: 700 }}>{product.asset}</span>}
          />
          <CTAButton
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => setAmount(String(balance))}
          >
            Khả dụng {formatAmount(balance)} {product.asset}
          </CTAButton>
        </TrCard>
        <label className="flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
          <input
            type="checkbox"
            disabled={mutation.isPending}
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5"
          />
          Tôi đã đọc điều khoản, lợi suất và rủi ro của sản phẩm.
        </label>
        {mutation.error instanceof Error && (
          <p
            role="alert"
            className="rounded-xl p-3 text-xs"
            style={{ color: c.errorText, background: withAlpha(c.error, '1A') }}
          >
            {formatEarnActionError(mutation.error)}
          </p>
        )}
        {!canSubscribe && (
          <p role="alert" className="text-xs" style={{ color: c.errorText }}>
            Earn subscription permission is required to subscribe to a product.
          </p>
        )}
        {mutation.isPending && (
          <p role="status" style={{ color: c.text2 }}>
            Đang gửi yêu cầu đăng ký…
          </p>
        )}
        <CTAButton
          variant="success"
          loading={mutation.isPending}
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          Xác nhận đăng ký
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}

export function EarnRedeemPage() {
  const { positionId = '' } = useParams();
  const prefix = useRoutePrefix();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const { hasPermission } = useAuth();
  const canRedeem = hasPermission('earn:write') || hasPermission('earn:redeem');
  const snapshotQuery = useEarnSnapshotQuery();
  const mutation = useRedeemEarnPositionMutation();
  const [amount, setAmount] = useState('');
  const submitInFlight = useRef(false);
  const attemptKeys = useRef(new Map<string, string>());
  const position = snapshotQuery.data?.positions.find((item) => item.id === positionId);
  const amountNumber = Number(amount);
  const canSubmit =
    canRedeem &&
    position !== undefined &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    amountNumber <= position.amount;
  const amountError = !amount
    ? undefined
    : !Number.isFinite(amountNumber)
      ? 'Nhập số lượng hợp lệ.'
      : amountNumber <= 0
        ? 'Số lượng phải lớn hơn 0.'
        : amountNumber > (position?.amount ?? 0)
          ? 'Số lượng vượt quá số vốn đang gửi.'
          : undefined;

  if (snapshotQuery.isPending) return <LoadingPage title="Rút vốn" />;
  if (snapshotQuery.isError || !position) {
    return (
      <PageLayout>
        <Header title="Rút vốn" back />
        <PageContent>
          <div role="alert">
            <ErrorState onAction={() => void snapshotQuery.refetch()} />
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const submit = async () => {
    if (!canSubmit || submitInFlight.current) return;
    submitInFlight.current = true;
    const request = { positionId: position.id, amount: amountNumber };
    const signature = JSON.stringify(request);
    const key = attemptKeys.current.get(signature) ?? crypto.randomUUID();
    attemptKeys.current.set(signature, key);
    try {
      const receipt = await mutation.mutateAsync({
        request,
        idempotencyKey: `earn-redeem-${key}`,
      });
      attemptKeys.current.delete(signature);
      hapticSuccess();
      navigate(`${prefix}/earn/savings/receipt`, { state: { receipt } });
    } catch {
      // The mutation error is rendered inline below.
    } finally {
      submitInFlight.current = false;
    }
  };

  return (
    <PageLayout>
      <Header title="Rút vốn" subtitle="Earn · Tiết kiệm" back />
      <PageContent gap="relaxed">
        <TrCard className="flex flex-col gap-5 p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: withAlpha(position.color, '22') }}
            >
              <span style={{ color: c.text1, fontWeight: 800 }}>{position.asset.slice(0, 3)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                style={{ color: c.text1, fontSize: 16, fontWeight: 700, overflowWrap: 'anywhere' }}
              >
                {position.product}
              </p>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Đang gửi {formatAmount(position.amount)} {position.asset}
              </p>
            </div>
          </div>
          <InputField
            id="earn-redeem-amount"
            label="Số lượng rút"
            inputMode="decimal"
            value={amount}
            disabled={mutation.isPending}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            helper={
              amountError ? undefined : `Tối đa ${formatAmount(position.amount)} ${position.asset}`
            }
            error={amountError}
            suffix={<span style={{ color: c.text2, fontWeight: 700 }}>{position.asset}</span>}
          />
          <CTAButton
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => setAmount(String(position.amount))}
          >
            MAX
          </CTAButton>
        </TrCard>
        <div className="flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
          <LockKeyhole size={15} className="mt-0.5 shrink-0" />
          Yêu cầu rút vốn sẽ được xử lý theo trạng thái sản phẩm và chính sách backend.
        </div>
        {mutation.error instanceof Error && (
          <p
            role="alert"
            className="rounded-xl p-3 text-xs"
            style={{ color: c.errorText, background: withAlpha(c.error, '1A') }}
          >
            {formatEarnActionError(mutation.error)}
          </p>
        )}
        {!canRedeem && (
          <p role="alert" className="text-xs" style={{ color: c.errorText }}>
            Earn redemption permission is required to redeem a position.
          </p>
        )}
        {mutation.isPending && (
          <p role="status" style={{ color: c.text2 }}>
            Đang gửi yêu cầu rút vốn…
          </p>
        )}
        <CTAButton
          variant="danger"
          loading={mutation.isPending}
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          Xác nhận rút vốn
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}

export function EarnReceiptPage() {
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const navigate = useNavigate();
  const location = useLocation();
  const { domain: routeDomain } = useParams();
  const domain = routeDomain === 'staking' ? 'staking' : 'savings';
  const receipt = (location.state as { receipt?: EarnReceipt } | null)?.receipt;
  if (!receipt)
    return (
      <PageLayout>
        <Header title="Biên nhận" back />
        <PageContent>
          <EmptyState
            icon={CheckCircle2}
            title="Không có biên nhận"
            subtitle="Hãy thực hiện giao dịch từ trang Earn."
            ctaLabel="Về Earn"
            onCta={() => navigate(`${prefix}/earn/${domain}`)}
          />
        </PageContent>
      </PageLayout>
    );
  const isPending = receipt.status === 'pending';
  return (
    <PageLayout>
      <Header title="Biên nhận" subtitle="Earn · Giao dịch" back />
      <PageContent gap="relaxed">
        <div className="flex flex-col items-center gap-3 py-6">
          {isPending ? (
            <Clock3 size={56} color="var(--tr-warning-text)" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={56} color="var(--tr-success-text)" aria-hidden="true" />
          )}
          <h2 className="text-xl font-bold">
            {isPending ? 'Yêu cầu đang xử lý' : 'Giao dịch đã hoàn tất'}
          </h2>
          <p className="text-center text-sm opacity-70">
            {isPending
              ? 'Yêu cầu đã được tiếp nhận. Kết quả cuối cùng vẫn đang chờ backend xác nhận.'
              : 'Backend đã xác nhận giao dịch hoàn tất.'}
          </p>
        </div>
        <TrCard className="p-4">
          <InfoRow label="Loại" value={receipt.operation === 'subscribe' ? 'Đăng ký' : 'Rút vốn'} />
          <InfoRow
            label="Tài sản"
            value={`${formatAmount(receipt.amount)} ${receipt.asset}`}
            variant="stacked"
            mono
          />
          <InfoRow
            label="Trạng thái"
            trailing={
              <span
                role="status"
                className="font-semibold"
                style={{ color: isPending ? 'var(--tr-warning-text)' : c.successText }}
              >
                {isPending ? 'Đang xử lý' : 'Hoàn tất'}
              </span>
            }
          />
          <InfoRow
            label="Mã giao dịch"
            value={receipt.id}
            variant="stacked"
            mono
            separator={false}
          />
        </TrCard>
        <CTAButton onClick={() => navigate(`${prefix}/earn/${domain}`)}>
          {domain === 'staking' ? 'Về Staking' : 'Về Tiết kiệm'}
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}
