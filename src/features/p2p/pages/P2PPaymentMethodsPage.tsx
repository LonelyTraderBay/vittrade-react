import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CreditCard,
  Edit3,
  Plus,
  Shield,
  Smartphone,
  Star,
  Trash2,
} from 'lucide-react';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2PPaymentMethodDeleteMutation,
  useP2PPaymentMethodsQuery,
  useP2PPaymentMethodUpdateMutation,
} from '../model/p2p-payment-method-queries';
import type { P2PPaymentMethod } from '../model/p2p-types';

const requestKey = (action: string, id: string) => `${action}-${id}-${crypto.randomUUID()}`;

export function P2PPaymentMethodsPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hapticSelection, hapticError } = useHaptic();
  const { hasPermission } = useAuth();
  const methodsQuery = useP2PPaymentMethodsQuery();
  const updateMutation = useP2PPaymentMethodUpdateMutation();
  const deleteMutation = useP2PPaymentMethodDeleteMutation();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const canWritePaymentMethods =
    hasPermission('p2p:write') || hasPermission('p2p:payment-methods:write');

  const methods = useMemo(() => methodsQuery.data?.items ?? [], [methodsQuery.data?.items]);
  const grouped = useMemo(
    () => ({
      bank: methods.filter((method) => method.type === 'bank'),
      ewallet: methods.filter((method) => method.type === 'ewallet'),
    }),
    [methods],
  );

  const add = (type: 'bank' | 'ewallet') => {
    if (!canWritePaymentMethods) return;
    hapticSelection();
    navigate(`${prefix}/p2p/payment-method/add?type=${type}`);
  };

  const setDefault = async (method: P2PPaymentMethod) => {
    if (!canWritePaymentMethods) return;
    try {
      await updateMutation.mutateAsync({
        id: method.id,
        request: { isDefault: true },
        idempotencyKey: requestKey('p2p-payment-method-default', method.id),
      });
      hapticSelection();
    } catch {
      toast.error('Không thể đặt phương thức thanh toán mặc định.');
    }
  };

  const remove = async () => {
    if (!canWritePaymentMethods || !deleteId) return;
    try {
      await deleteMutation.mutateAsync({
        id: deleteId,
        idempotencyKey: requestKey('p2p-payment-method-delete', deleteId),
      });
      setDeleteId(null);
      hapticError();
      toast.success('Đã xóa phương thức thanh toán.');
    } catch {
      toast.error('Không thể xóa phương thức thanh toán.');
    }
  };

  if (methodsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Phương thức thanh toán" subtitle="Thanh toán · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải phương thức thanh toán…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (methodsQuery.isError) {
    return (
      <PageLayout>
        <Header title="Phương thức thanh toán" subtitle="Thanh toán · P2P" back />
        <ErrorState
          title="Unable to load P2P payment methods"
          message="The payment-method contract is unavailable. Try again without losing the current route."
          actionLabel="Retry"
          onAction={() => void methodsQuery.refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Phương thức thanh toán" subtitle="Thanh toán · P2P" back />
      <PageContent gap="default">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => add('bank')}
            disabled={!canWritePaymentMethods}
            aria-label="Add bank payment method"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(59,130,246,0.08)',
              color: '#3B82F6',
              border: '1px dashed rgba(59,130,246,0.3)',
            }}
          >
            <Plus size={16} />
            <CreditCard size={14} /> Thêm ngân hàng
          </button>
          <button
            type="button"
            onClick={() => add('ewallet')}
            disabled={!canWritePaymentMethods}
            aria-label="Add e-wallet payment method"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(168,85,247,0.08)',
              color: '#A855F7',
              border: '1px dashed rgba(168,85,247,0.3)',
            }}
          >
            <Plus size={16} />
            <Smartphone size={14} /> Thêm ví điện tử
          </button>
        </div>

        {!canWritePaymentMethods && (
          <p role="alert" style={{ color: colors.warning, fontSize: 12 }}>
            P2P payment-method write permission is required to manage payment methods.
          </p>
        )}

        {(['bank', 'ewallet'] as const).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const Icon = type === 'bank' ? CreditCard : Smartphone;
          return (
            <div className="flex flex-col gap-3" key={type}>
              <h3 style={{ color: colors.text2, fontSize: 13, fontWeight: 600 }}>
                <Icon size={14} className="inline mr-2" />
                {type === 'bank' ? 'Tài khoản ngân hàng' : 'Ví điện tử'} ({items.length})
              </h3>
              {items.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  colors={colors}
                  onDefault={() => void setDefault(method)}
                  onEdit={() => navigate(`${prefix}/p2p/payment-method/add?type=${method.type}`)}
                  onDelete={() => setDeleteId(method.id)}
                  canWrite={canWritePaymentMethods}
                  busy={updateMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          );
        })}

        {methods.length === 0 && (
          <TrCard className="p-10 text-center" role="status" aria-label="No P2P payment methods">
            <CreditCard size={36} color={colors.borderSolid} className="mx-auto mb-3" />
            <p style={{ color: colors.text2, fontSize: 13, fontWeight: 600 }}>
              Chưa có phương thức thanh toán
            </p>
            <p style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
              Thêm ngân hàng hoặc ví điện tử để giao dịch P2P.
            </p>
          </TrCard>
        )}

        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.6 }}>
            <Shield size={10} className="inline mr-1" />
            Thông tin thanh toán chỉ hiển thị cho đối tác khi đơn hàng P2P được tạo.
          </p>
        </div>
      </PageContent>

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void remove()}
        variant="danger"
        icon={<Trash2 size={24} color="#EF4444" />}
        title="Delete payment method?"
        description="Hành động này không thể hoàn tác. Quảng cáo P2P đang dùng phương thức này cần được cập nhật."
        confirmText="Delete"
      />
    </PageLayout>
  );
}

function PaymentMethodCard({
  method,
  colors,
  onDefault,
  onEdit,
  onDelete,
  canWrite,
  busy,
}: {
  method: P2PPaymentMethod;
  colors: ReturnType<typeof useThemeColors>;
  onDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canWrite: boolean;
  busy: boolean;
}) {
  const isBank = method.type === 'bank';
  return (
    <TrCard
      rounded="sm"
      className="p-4"
      accentBorder={method.isDefault ? 'rgba(59,130,246,0.3)' : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isBank ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)' }}
        >
          {isBank ? (
            <CreditCard size={18} color="#3B82F6" />
          ) : (
            <Smartphone size={18} color="#A855F7" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              {method.bankName}
            </span>
            {method.isVerified && <Shield size={12} color="#10B981" />}
            {method.isDefault && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 9 }}
              >
                Mặc định
              </span>
            )}
          </div>
          <p
            style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}
          >
            {method.accountNumber}
          </p>
          <p style={{ color: colors.text3, fontSize: 11 }}>{method.accountName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            disabled={!canWrite || busy}
            aria-label={`Edit ${method.bankName}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: colors.surface2 }}
          >
            <Edit3 size={14} color={colors.text2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canWrite || busy}
            aria-label={`Delete ${method.bankName}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
      </div>
      {!method.isDefault && (
        <button
          type="button"
          onClick={onDefault}
          disabled={!canWrite || busy}
          aria-label={`Set default ${method.bankName}`}
          className="w-full mt-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: colors.surface2,
            color: colors.text2,
            border: `1px solid ${colors.borderSolid}`,
          }}
        >
          <Star size={10} className="inline mr-1" /> Đặt làm mặc định
        </button>
      )}
      {!method.isVerified && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle size={10} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 10 }}>
            Chưa xác minh — cần xác minh để dùng trên P2P.
          </span>
        </div>
      )}
    </TrCard>
  );
}
