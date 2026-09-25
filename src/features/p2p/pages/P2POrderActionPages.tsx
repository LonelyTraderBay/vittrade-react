import { useState, type ChangeEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Clock, Star, Upload, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { CTAButton } from '@/shared/ui/CTAButton';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2POrderActionCancelMutation,
  useP2POrderActionProofMutation,
  useP2POrderActionQuery,
  useP2POrderActionRateMutation,
} from '../model/p2p-order-action-queries';
import type { P2POrder } from '../model/p2p-types';

const CANCEL_REASONS = [
  'Không muốn giao dịch nữa',
  'Đã tìm được giá tốt hơn',
  'Người bán không phản hồi',
  'Thông tin thanh toán không đúng',
  'Lý do khác',
];

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
});

function formatMoney(value: number, currency: string) {
  return `${currencyFormatter.format(value)} ${currency}`;
}

function OrderSummary({ order }: { order: P2POrder }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: colors.text3, fontSize: 11 }}>Mã đơn</span>
        <strong style={{ color: colors.text1, fontSize: 12 }}>{order.orderNumber}</strong>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span style={{ color: colors.text3, fontSize: 11 }}>Giao dịch</span>
        <span style={{ color: colors.text1, fontSize: 12 }}>
          {order.type === 'buy' ? 'Mua' : 'Bán'} {order.amount} {order.asset}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span style={{ color: colors.text3, fontSize: 11 }}>Tổng tiền</span>
        <strong style={{ color: colors.primary, fontSize: 13 }}>
          {formatMoney(order.total, order.currency)}
        </strong>
      </div>
    </TrCard>
  );
}

function OrderBoundary({
  title,
  query,
  children,
}: {
  title: string;
  query: ReturnType<typeof useP2POrderActionQuery>;
  children: (order: P2POrder) => ReactNode;
}) {
  const colors = useThemeColors();
  if (query.isPending) {
    return (
      <PageLayout>
        <Header title={title} subtitle="Đơn hàng · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải thông tin đơn hàng…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageLayout>
        <Header title={title} subtitle="Đơn hàng · P2P" back />
        <PageContent>
          <ErrorState
            title="Không thể tải đơn hàng"
            message="Đơn hàng không tồn tại hoặc phiên đăng nhập đã hết hạn."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title={title} subtitle="Đơn hàng · P2P" back />
      <PageContent gap="default">
        <OrderSummary order={query.data} />
        {children(query.data)}
      </PageContent>
    </PageLayout>
  );
}

export function P2POrderCancelContractPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const query = useP2POrderActionQuery(orderId);
  const mutation = useP2POrderActionCancelMutation(orderId);
  const [reason, setReason] = useState('');
  const canCancel = hasPermission('p2p:write') || hasPermission('p2p:cancel');

  return (
    <OrderBoundary title="Hủy đơn hàng" query={query}>
      {(order) => (
        <>
          <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} color="#EF4444" />
              <p style={{ color: colors.text2, fontSize: 12, lineHeight: 1.5 }}>
                Hủy đơn sẽ giải phóng {order.escrowAmount} {order.asset} khỏi escrow. Hãy chọn lý do
                để tiếp tục.
              </p>
            </div>
          </TrCard>
          <div className="flex flex-col gap-2">
            {CANCEL_REASONS.map((item) => (
              <button
                key={item}
                type="button"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left"
                style={{
                  background: reason === item ? 'rgba(239,68,68,0.08)' : colors.surface2,
                  border: `1px solid ${reason === item ? '#EF4444' : colors.borderSolid}`,
                  color: reason === item ? '#EF4444' : colors.text2,
                  fontSize: 12,
                }}
                onClick={() => setReason(item)}
              >
                {reason === item ? <CheckCircle size={16} /> : <X size={16} />}
                {item}
              </button>
            ))}
          </div>
          {mutation.isError && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              Không thể hủy đơn. Vui lòng thử lại hoặc mở dispute nếu đơn đã chuyển trạng thái.
            </p>
          )}
          {!canCancel && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              P2P order write permission is required to cancel an order.
            </p>
          )}
          <CTAButton
            variant="danger"
            disabled={!canCancel || !reason || mutation.isPending}
            loading={mutation.isPending}
            onClick={async () => {
              if (!reason) return;
              await mutation.mutateAsync({
                request: { reason },
                idempotencyKey: crypto.randomUUID(),
              });
              navigate(`${prefix}/p2p/order/${order.id}`, { replace: true });
            }}
          >
            Xác nhận hủy đơn
          </CTAButton>
        </>
      )}
    </OrderBoundary>
  );
}

export function P2POrderRateContractPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const query = useP2POrderActionQuery(orderId);
  const mutation = useP2POrderActionRateMutation(orderId);
  const { hasPermission } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const canRate = hasPermission('p2p:write') || hasPermission('p2p:rate');

  return (
    <OrderBoundary title="Đánh giá giao dịch" query={query}>
      {(order) => (
        <>
          <TrCard className="p-4">
            <p className="mb-3 text-center" style={{ color: '#6B7280', fontSize: 12 }}>
              Đánh giá trải nghiệm với {order.merchant}
            </p>
            <div className="flex justify-center gap-2" aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} sao`}
                  onClick={() => setRating(value)}
                  className="rounded-full p-1"
                >
                  <Star
                    size={28}
                    fill={value <= rating ? '#F59E0B' : 'transparent'}
                    color="#F59E0B"
                  />
                </button>
              ))}
            </div>
          </TrCard>
          <textarea
            aria-label="Nhận xét"
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
            className="w-full rounded-xl p-3"
          />
          {mutation.isError && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              Không thể gửi đánh giá. Vui lòng thử lại.
            </p>
          )}
          {!canRate && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              P2P order write permission is required to submit a rating.
            </p>
          )}
          <CTAButton
            disabled={!canRate || !rating || mutation.isPending}
            loading={mutation.isPending}
            onClick={async () => {
              if (!rating) return;
              await mutation.mutateAsync({
                request: { rating, review: review.trim() || undefined },
                idempotencyKey: crypto.randomUUID(),
              });
              navigate(-1);
            }}
          >
            Gửi đánh giá
          </CTAButton>
        </>
      )}
    </OrderBoundary>
  );
}

export function P2POrderProofContractPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const query = useP2POrderActionQuery(orderId);
  const mutation = useP2POrderActionProofMutation(orderId);
  const { hasPermission } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const canSubmitProof = hasPermission('p2p:write') || hasPermission('p2p:payment-proof');

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    const invalid = selected.find(
      (file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024,
    );
    if (invalid || files.length + selected.length > 3) {
      setError('Chỉ nhận tối đa 3 ảnh, mỗi ảnh không quá 10 MB.');
      return;
    }
    setError('');
    setFiles((current) => [...current, ...selected]);
  };

  return (
    <OrderBoundary title="Bằng chứng thanh toán" query={query}>
      {() => (
        <>
          <TrCard className="p-4">
            <label htmlFor="p2p-payment-proof" className="flex cursor-pointer items-center gap-3">
              <Upload size={20} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>
                Chọn ảnh bằng chứng (tối đa 3 ảnh)
              </span>
            </label>
            <input
              id="p2p-payment-proof"
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onFilesSelected}
            />
          </TrCard>
          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className="flex items-center justify-between rounded-lg p-3"
                >
                  <span style={{ color: '#374151', fontSize: 12 }}>{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Xóa ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              {error}
            </p>
          )}
          {mutation.isError && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              Không thể tải bằng chứng lên. Vui lòng thử lại.
            </p>
          )}
          {!canSubmitProof && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
              P2P order write permission is required to submit payment proof.
            </p>
          )}
          <CTAButton
            disabled={!canSubmitProof || !files.length || mutation.isPending}
            loading={mutation.isPending}
            onClick={async () => {
              await mutation.mutateAsync({
                request: { files },
                idempotencyKey: crypto.randomUUID(),
              });
              navigate(-1);
            }}
          >
            Gửi bằng chứng
          </CTAButton>
        </>
      )}
    </OrderBoundary>
  );
}

export function P2POrderTimelineContractPage() {
  const { orderId } = useParams();
  const query = useP2POrderActionQuery(orderId);
  const events = query.data
    ? [
        { label: 'Đã tạo đơn', value: query.data.createdAt, done: true },
        { label: 'Đã thanh toán', value: query.data.paidAt, done: Boolean(query.data.paidAt) },
        {
          label: 'Đã release escrow',
          value: query.data.releasedAt,
          done: Boolean(query.data.releasedAt),
        },
        { label: 'Đã hủy', value: query.data.cancelledAt, done: Boolean(query.data.cancelledAt) },
      ]
    : [];

  return (
    <OrderBoundary title="Tiến trình đơn hàng" query={query}>
      {() => (
        <TrCard className="p-4">
          <div className="flex flex-col gap-4">
            {events.map((event) => (
              <div key={event.label} className="flex items-center gap-3">
                {event.done ? (
                  <CheckCircle size={18} color="#10B981" />
                ) : (
                  <Clock size={18} color="#9CA3AF" />
                )}
                <div>
                  <p style={{ color: '#111827', fontSize: 12, fontWeight: 600 }}>{event.label}</p>
                  {event.value && (
                    <p style={{ color: '#6B7280', fontSize: 11 }}>
                      {new Date(event.value).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TrCard>
      )}
    </OrderBoundary>
  );
}
