import { useState } from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
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
import { formatAmount } from '../lib/formatters';
import { useAuth } from '@/shared/session/useAuth';

function LoadingPage({ title }: { title: string }) {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} back />
      <PageContent>
        <div className="h-48 animate-pulse rounded-3xl" style={{ background: c.surface2 }} />
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
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [agreed, setAgreed] = useState(false);
  const product = snapshotQuery.data?.products.find((item) => item.id === productId);
  const balance = product ? (snapshotQuery.data?.balances[product.asset] ?? 0) : 0;
  const amountNumber = Number(amount);
  const canSubmit =
    canSubscribe &&
    Boolean(product) &&
    amountNumber >= (product?.minAmount ?? Infinity) &&
    amountNumber <= balance &&
    agreed;

  if (snapshotQuery.isPending) return <LoadingPage title="Chi tiết sản phẩm" />;
  if (snapshotQuery.isError || !product) {
    return (
      <PageLayout>
        <Header title="Chi tiết sản phẩm" back />
        <ErrorState onAction={() => void snapshotQuery.refetch()} />
      </PageLayout>
    );
  }

  const submit = async () => {
    if (!canSubscribe || !canSubmit) return;
    try {
      const receipt = await mutation.mutateAsync({
        request: { productId: product.id, amount: amountNumber },
        idempotencyKey: `earn-subscribe-${idempotencyKey}`,
      });
      hapticSuccess();
      navigate(`${prefix}/earn/savings/receipt`, { state: { receipt } });
    } catch {
      // The mutation error is rendered inline below and reported by the API boundary.
    }
  };

  return (
    <PageLayout>
      <Header title="Chi tiết sản phẩm" subtitle="Earn · Tiết kiệm" back />
      <PageContent gap="relaxed">
        <TrCard variant="hero" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ color: c.text2, fontSize: 13 }}>{product.asset}</p>
              <h1 style={{ color: c.text1, fontSize: 22, fontWeight: 800 }}>{product.name}</h1>
            </div>
            <ShieldCheck color="#34D399" size={28} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>APY hiện tại</p>
              <p style={{ color: '#34D399', fontSize: 26, fontWeight: 800 }}>{product.apy}%</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11 }}>Thời hạn</p>
              <p style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>
                {product.lockDays ? `${product.lockDays} ngày` : 'Linh hoạt'}
              </p>
            </div>
          </div>
        </TrCard>
        <TrCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="earn-detail-amount"
              style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}
            >
              Số lượng đăng ký
            </label>
            <button
              className="text-xs font-semibold text-blue-500"
              onClick={() => setAmount(String(balance))}
            >
              Khả dụng {formatAmount(balance)} {product.asset}
            </button>
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl p-3"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <input
              id="earn-detail-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setIdempotencyKey(crypto.randomUUID());
              }}
              className="min-w-0 flex-1 bg-transparent text-lg outline-none"
              placeholder={String(product.minAmount)}
            />
            <span style={{ color: c.text2, fontWeight: 700 }}>{product.asset}</span>
          </div>
          <p className="mt-2" style={{ color: c.text3, fontSize: 11 }}>
            Tối thiểu {formatAmount(product.minAmount)} {product.asset}
          </p>
        </TrCard>
        <label className="flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5"
          />
          Tôi đã đọc điều khoản, lợi suất và rủi ro của sản phẩm.
        </label>
        {mutation.error instanceof Error && (
          <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-xs text-red-500">
            {mutation.error.message}
          </p>
        )}
        {!canSubscribe && (
          <p role="alert" className="text-xs text-red-500">
            Earn subscription permission is required to subscribe to a product.
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
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const position = snapshotQuery.data?.positions.find((item) => item.id === positionId);
  const amountNumber = Number(amount);
  const canSubmit =
    canRedeem && Boolean(position) && amountNumber > 0 && amountNumber <= (position?.amount ?? 0);

  if (snapshotQuery.isPending) return <LoadingPage title="Rút vốn" />;
  if (snapshotQuery.isError || !position) {
    return (
      <PageLayout>
        <Header title="Rút vốn" back />
        <ErrorState onAction={() => void snapshotQuery.refetch()} />
      </PageLayout>
    );
  }

  const submit = async () => {
    if (!canRedeem || !canSubmit) return;
    try {
      const receipt = await mutation.mutateAsync({
        request: { positionId: position.id, amount: amountNumber },
        idempotencyKey: `earn-redeem-${idempotencyKey}`,
      });
      hapticSuccess();
      navigate(`${prefix}/earn/savings/receipt`, { state: { receipt } });
    } catch {
      // The mutation error is rendered inline below.
    }
  };

  return (
    <PageLayout>
      <Header title="Rút vốn" subtitle="Earn · Tiết kiệm" back />
      <PageContent gap="relaxed">
        <TrCard className="p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: `${position.color}22` }}
            >
              <span style={{ color: position.color, fontWeight: 800 }}>
                {position.asset.slice(0, 3)}
              </span>
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{position.product}</p>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Đang gửi {formatAmount(position.amount)} {position.asset}
              </p>
            </div>
          </div>
          <div
            className="mt-5 flex items-center gap-2 rounded-2xl p-3"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <input
              id="earn-redeem-amount"
              aria-label="Số lượng rút"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setIdempotencyKey(crypto.randomUUID());
              }}
              className="min-w-0 flex-1 bg-transparent text-lg outline-none"
              placeholder="0.00"
            />
            <button
              className="text-xs font-semibold text-blue-500"
              onClick={() => setAmount(String(position.amount))}
            >
              MAX
            </button>
            <span style={{ color: c.text2, fontWeight: 700 }}>{position.asset}</span>
          </div>
        </TrCard>
        <div className="flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
          <LockKeyhole size={15} className="mt-0.5 shrink-0" />
          Yêu cầu rút vốn sẽ được xử lý theo trạng thái sản phẩm và chính sách backend.
        </div>
        {mutation.error instanceof Error && (
          <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-xs text-red-500">
            {mutation.error.message}
          </p>
        )}
        {!canRedeem && (
          <p role="alert" className="text-xs text-red-500">
            Earn redemption permission is required to redeem a position.
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
  const prefix = useRoutePrefix();
  const navigate = useNavigate();
  const location = useLocation();
  const receipt = (location.state as { receipt?: EarnReceipt } | null)?.receipt;
  if (!receipt)
    return (
      <PageLayout>
        <Header title="Biên nhận" back />
        <EmptyState
          icon={CheckCircle2}
          title="Không có biên nhận"
          subtitle="Hãy thực hiện giao dịch từ trang Earn."
          ctaLabel="Về Earn"
          onCta={() => navigate(`${prefix}/earn/savings`)}
        />
      </PageLayout>
    );
  return (
    <PageLayout>
      <Header title="Biên nhận" subtitle="Earn · Giao dịch" back />
      <PageContent gap="relaxed">
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 size={56} color="#10B981" />
          <h1 className="text-xl font-bold">Giao dịch đã ghi nhận</h1>
          <p className="text-center text-sm opacity-70">
            Trạng thái và kết quả cuối cùng sẽ được đồng bộ từ backend.
          </p>
        </div>
        <TrCard className="flex flex-col gap-3 p-4">
          <div className="flex justify-between text-sm">
            <span className="opacity-70">Loại</span>
            <span className="font-semibold">
              {receipt.operation === 'subscribe' ? 'Đăng ký' : 'Rút vốn'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-70">Tài sản</span>
            <span className="font-mono font-semibold">
              {formatAmount(receipt.amount)} {receipt.asset}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-70">Trạng thái</span>
            <span className="font-semibold text-emerald-500">{receipt.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-70">Mã giao dịch</span>
            <span className="max-w-[55%] truncate font-mono text-xs">{receipt.id}</span>
          </div>
        </TrCard>
        <CTAButton onClick={() => navigate(`${prefix}/earn/savings`)}>Về Tiết kiệm</CTAButton>
      </PageContent>
    </PageLayout>
  );
}
