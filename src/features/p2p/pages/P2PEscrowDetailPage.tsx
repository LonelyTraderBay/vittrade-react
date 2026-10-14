import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Lock, ShieldCheck, Unlock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '@/shared/api/api-error';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import type { P2POrder } from '../model/p2p-types';
import {
  useP2PMarkPaidMutation,
  useP2POrderQuery,
  useP2PReleaseChallengeMutation,
  useP2PReleaseOrderMutation,
  useP2PReleaseVerificationMutation,
} from '../model/p2p-order-action-queries';

export function P2PEscrowDetailPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { orderId } = useParams<{ orderId: string }>();
  const { hasPermission } = useAuth();
  const orderQuery = useP2POrderQuery(orderId);
  const markPaidMutation = useP2PMarkPaidMutation(orderId);
  const challengeMutation = useP2PReleaseChallengeMutation(orderId);
  const verificationMutation = useP2PReleaseVerificationMutation(orderId);
  const releaseMutation = useP2PReleaseOrderMutation(orderId);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const markPaidAttemptRef = useRef<{ orderId: string; key: string } | null>(null);
  const releaseAttemptRef = useRef<{ signature: string; key: string } | null>(null);
  const order = orderQuery.data;
  const actionInFlight = useRef(false);
  const actionPending =
    markPaidMutation.isPending ||
    challengeMutation.isPending ||
    verificationMutation.isPending ||
    releaseMutation.isPending;
  const canMarkPaid =
    order?.status === 'pending_payment' &&
    (hasPermission('p2p:write') || hasPermission('p2p:mark-paid'));
  const canRelease =
    order?.status === 'paid' && (hasPermission('p2p:write') || hasPermission('p2p:release'));

  const startRelease = async () => {
    if (!canRelease || challengeId || verificationToken || actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    try {
      const challenge = await challengeMutation.mutateAsync();
      setChallengeId(challenge.id);
    } catch (error) {
      setActionError(
        error instanceof ApiError && error.status === 403
          ? 'Không có quyền tạo thử thách xác thực release escrow.'
          : 'Không thể tạo thử thách xác thực release.',
      );
    } finally {
      actionInFlight.current = false;
    }
  };

  const verify = async () => {
    if (!canRelease || !challengeId || !/^\d{6}$/.test(code) || actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    try {
      const result = await verificationMutation.mutateAsync({ challengeId, code });
      setVerificationToken(result.verificationToken);
    } catch {
      setActionError('Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      actionInFlight.current = false;
    }
  };

  const markPaid = async () => {
    if (!orderId || !canMarkPaid || actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    if (markPaidAttemptRef.current?.orderId !== orderId) {
      markPaidAttemptRef.current = {
        orderId,
        key: `p2p-mark-paid-${orderId}-${crypto.randomUUID()}`,
      };
    }
    try {
      const result = await markPaidMutation.mutateAsync({
        idempotencyKey: markPaidAttemptRef.current.key,
      });
      if (result.id !== orderId || !['paid', 'released'].includes(result.status)) {
        setActionError(
          'Chưa xác nhận được trạng thái thanh toán. Hãy kiểm tra đơn trước khi thử lại.',
        );
        return;
      }
      markPaidAttemptRef.current = null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setActionError(
          'Đơn hàng không thể chuyển sang trạng thái đã thanh toán (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.',
        );
        await orderQuery.refetch();
        return;
      }
      setActionError('Không thể đánh dấu đã thanh toán.');
    } finally {
      actionInFlight.current = false;
    }
  };

  const release = async () => {
    if (!orderId || !canRelease || !verificationToken || actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    const signature = JSON.stringify([orderId, verificationToken]);
    if (releaseAttemptRef.current?.signature !== signature) {
      releaseAttemptRef.current = {
        signature,
        key: `p2p-escrow-release-${orderId}-${crypto.randomUUID()}`,
      };
    }
    try {
      const result = await releaseMutation.mutateAsync({
        verificationToken,
        idempotencyKey: releaseAttemptRef.current.key,
      });
      if (result.id !== orderId || result.status !== 'released') {
        setActionError('Chưa xác nhận được kết quả release. Hãy kiểm tra đơn trước khi thử lại.');
        return;
      }
      releaseAttemptRef.current = null;
      setVerificationToken(null);
      setChallengeId(null);
      await orderQuery.refetch();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setActionError(
          'Đơn hàng không thể chuyển sang trạng thái đã release (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.',
        );
        await orderQuery.refetch();
        return;
      }
      setActionError('Không thể release escrow. Vui lòng thử lại.');
    } finally {
      actionInFlight.current = false;
    }
  };

  if (orderQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Escrow detail" subtitle="Bảo vệ giao dịch · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải trạng thái escrow…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <PageLayout>
        <Header title="Escrow detail" subtitle="Bảo vệ giao dịch · P2P" back />
        <ErrorState
          title="Unable to load P2P escrow"
          message="The order contract is unavailable. Try again without losing the current route."
          actionLabel="Retry"
          onAction={() => void orderQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const statusLabel: Record<P2POrder['status'], string> = {
    pending_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán · Chờ release',
    released: 'Đã release',
    disputed: 'Đang tranh chấp',
    cancelled: 'Đã hủy',
    expired: 'Đã hết hạn',
  };
  const canEscrowAction = canMarkPaid || canRelease;

  return (
    <PageLayout>
      <Header title="Escrow detail" subtitle="Bảo vệ giao dịch · P2P" back />
      <PageContent gap="default">
        <TrCard
          className="p-5"
          accentBorder={
            order.status === 'released' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  order.status === 'released' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
              }}
            >
              {order.status === 'released' ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <Lock size={24} color="#3B82F6" />
              )}
            </div>
            <div>
              <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>
                {statusLabel[order.status]}
              </p>
              <p style={{ color: colors.text3, fontSize: 11 }}>Order #{order.orderNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Tài sản"
              value={`${order.escrowAmount} ${order.asset}`}
              colors={colors}
            />
            <Metric
              label="Tổng giá trị"
              value={`${order.total.toLocaleString('vi-VN')} ${order.currency}`}
              colors={colors}
            />
            <Metric label="Merchant" value={order.merchant} colors={colors} />
            <Metric label="Payment" value={order.paymentMethod} colors={colors} />
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={15} color="#10B981" />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Escrow state transition
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <StateRow label="Order created" done colors={colors} />
            <StateRow
              label="Payment confirmed"
              done={['paid', 'released'].includes(order.status)}
              colors={colors}
            />
            <StateRow label="Escrow released" done={order.status === 'released'} colors={colors} />
          </div>
        </TrCard>

        {!canEscrowAction && ['pending_payment', 'paid'].includes(order.status) && (
          <p role="alert" style={{ color: colors.warning, fontSize: 12, textAlign: 'center' }}>
            P2P write permission is required for escrow actions.
          </p>
        )}

        {canMarkPaid && (
          <button
            type="button"
            aria-label="Mark order paid"
            disabled={actionPending}
            onClick={() => void markPaid()}
            className="w-full rounded-xl py-3 font-bold"
            style={{
              background: '#1D4ED8',
              color: '#fff',
              opacity: markPaidMutation.isPending ? 0.6 : 1,
            }}
          >
            {markPaidMutation.isPending ? 'Đang cập nhật…' : 'Đã thanh toán'}
          </button>
        )}
        {canRelease && !challengeId && !verificationToken && (
          <button
            type="button"
            aria-label="Start escrow release"
            disabled={actionPending}
            onClick={() => void startRelease()}
            className="w-full rounded-xl py-3 font-bold"
            style={{
              background: '#047857',
              color: '#fff',
              opacity: challengeMutation.isPending ? 0.6 : 1,
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Unlock size={16} />
              {challengeMutation.isPending ? 'Đang tạo challenge…' : 'Release escrow'}
            </span>
          </button>
        )}
        {challengeId && !verificationToken && (
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} color="#F59E0B" />
              <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
                Xác thực release
              </span>
            </div>
            <input
              aria-label="Release verification code"
              disabled={!canRelease || actionPending}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="Nhập mã 6 số"
              className="w-full rounded-xl px-3 py-3 mb-3"
              style={{ background: colors.surface2, color: colors.text1 }}
            />
            <button
              type="button"
              aria-label="Verify release code"
              disabled={!canRelease || actionPending || code.length < 6}
              onClick={() => void verify()}
              className="w-full rounded-xl py-3 font-bold"
              style={{
                background: '#1D4ED8',
                color: '#fff',
                opacity: verificationMutation.isPending || code.length < 6 ? 0.6 : 1,
              }}
            >
              Xác thực
            </button>
          </TrCard>
        )}
        {verificationToken && canRelease && (
          <button
            type="button"
            aria-label="Confirm escrow release"
            disabled={actionPending}
            onClick={() => void release()}
            className="w-full rounded-xl py-3 font-bold"
            style={{
              background: '#047857',
              color: '#fff',
              opacity: releaseMutation.isPending ? 0.6 : 1,
            }}
          >
            {releaseMutation.isPending ? 'Đang release…' : 'Xác nhận release escrow'}
          </button>
        )}
        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl p-3"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <AlertTriangle size={14} color="#EF4444" />
            <p style={{ color: '#EF4444', fontSize: 12 }}>{actionError}</p>
          </div>
        )}
        <button
          type="button"
          aria-label="Open order detail"
          disabled={actionPending}
          onClick={() => navigate(`${prefix}/p2p/order/${encodeURIComponent(order.id)}`)}
          className="text-center py-2"
          style={{ color: colors.primary, fontSize: 12 }}
        >
          Mở order detail
        </button>
      </PageContent>
    </PageLayout>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: colors.surface2 }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p style={{ color: colors.text1, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{value}</p>
    </div>
  );
}

function StateRow({
  label,
  done,
  colors,
}: {
  label: string;
  done: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle size={14} color={done ? '#10B981' : colors.borderSolid} />
      <span style={{ color: done ? colors.text1 : colors.text3, fontSize: 12 }}>{label}</span>
    </div>
  );
}
