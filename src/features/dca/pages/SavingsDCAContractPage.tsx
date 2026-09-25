import { useRef, useState } from 'react';
import { Pause, Play, Trash2 } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useAuth } from '@/shared/session/useAuth';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import {
  useDCASnapshotQuery,
  useCreateDCAPlanMutation,
  useDeleteDCAPlanMutation,
  useUpdateDCAPlanMutation,
} from '../model/dca-queries';

export function SavingsDCAContractPage() {
  const colors = useThemeColors();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const canManageDCA = hasPermission('dca:write');
  const query = useDCASnapshotQuery();
  const create = useCreateDCAPlanMutation();
  const update = useUpdateDCAPlanMutation();
  const remove = useDeleteDCAPlanMutation();
  const [coinSymbol, setCoinSymbol] = useState('BTC');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [amount, setAmount] = useState('');
  const [createKey, setCreateKey] = useState(() => crypto.randomUUID());
  const [confirmCancelPlanId, setConfirmCancelPlanId] = useState<string | null>(null);
  const updateKeys = useRef(new Map<string, string>());
  const deleteKeys = useRef(new Map<string, string>());
  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const amountValue = Number(amount);
  const canCreate = canManageDCA && Number.isFinite(amountValue) && amountValue > 0;
  const createPlan = async () => {
    if (!canCreate || create.isPending) return;
    try {
      await create.mutateAsync({
        request: {
          coinSymbol: coinSymbol.trim().toUpperCase(),
          frequency,
          amountPerPurchase: amountValue,
        },
        idempotencyKey: `dca-create-${createKey}`,
      });
      setAmount('');
      setCreateKey(crypto.randomUUID());
      actionToast.success('Đã tạo kế hoạch DCA.');
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể tạo kế hoạch DCA.');
    }
  };
  const updatePlanStatus = async (planId: string, status: 'active' | 'paused') => {
    if (!canManageDCA || update.isPending) return;
    const actionId = `${planId}:${status}`;
    const key = updateKeys.current.get(actionId) ?? crypto.randomUUID();
    updateKeys.current.set(actionId, key);
    try {
      await update.mutateAsync({
        planId,
        request: { status },
        idempotencyKey: `dca-update-${planId}-${status}-${key}`,
      });
      updateKeys.current.delete(actionId);
      actionToast.success(
        status === 'paused' ? 'Đã tạm dừng kế hoạch DCA.' : 'Đã tiếp tục kế hoạch DCA.',
      );
    } catch (error) {
      actionToast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật kế hoạch DCA.',
      );
    }
  };
  const cancelPlan = async () => {
    if (!canManageDCA || !confirmCancelPlanId || remove.isPending) return;
    const planId = confirmCancelPlanId;
    const key = deleteKeys.current.get(planId) ?? crypto.randomUUID();
    deleteKeys.current.set(planId, key);
    try {
      await remove.mutateAsync({
        planId,
        idempotencyKey: `dca-cancel-${planId}-${key}`,
      });
      deleteKeys.current.delete(planId);
      actionToast.success('Đã hủy kế hoạch DCA.');
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể hủy kế hoạch DCA.');
    }
  };
  return (
    <PageLayout>
      <Header title="Savings DCA" subtitle="Contract-first scheduled investments" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Invested" value={query.data.overview.totalInvested.toLocaleString()} />
            <Metric label="Value" value={query.data.overview.currentValue.toLocaleString()} />
            <Metric label="Active" value={query.data.overview.activePlans} />
          </div>
        </TrCard>
        {!canManageDCA && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            DCA write permission is required to change scheduled investment plans.
          </p>
        )}
        <TrCard className="p-4">
          <p style={{ color: colors.text1, fontWeight: 700 }}>Create DCA plan</p>
          <div className="mt-3 grid gap-2">
            <input
              aria-label="DCA coin"
              value={coinSymbol}
              onChange={(event) => {
                setCoinSymbol(event.target.value);
                setCreateKey(crypto.randomUUID());
              }}
              disabled={!canManageDCA}
              className="rounded-lg p-2"
              placeholder="BTC"
            />
            <input
              aria-label="DCA amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setCreateKey(crypto.randomUUID());
              }}
              disabled={!canManageDCA}
              className="rounded-lg p-2"
              placeholder="Amount per purchase"
            />
            <select
              aria-label="DCA frequency"
              value={frequency}
              onChange={(event) => {
                setFrequency(event.target.value as typeof frequency);
                setCreateKey(crypto.randomUUID());
              }}
              disabled={!canManageDCA}
              className="rounded-lg p-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              type="button"
              aria-label="Create DCA plan"
              disabled={!canCreate || create.isPending}
              onClick={() => void createPlan()}
              className="rounded-lg px-3 py-2"
            >
              {create.isPending ? 'Creating…' : 'Create DCA plan'}
            </button>
          </div>
          {create.isError && (
            <p role="alert" className="mt-2" style={{ color: '#EF4444', fontSize: 12 }}>
              Unable to create the DCA plan. Please retry.
            </p>
          )}
        </TrCard>
        {update.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Unable to update the DCA plan. Please retry.
          </p>
        )}
        {remove.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Unable to cancel the DCA plan. Please retry.
          </p>
        )}
        {query.data.plans.length === 0 && (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Bạn chưa có kế hoạch DCA nào.
          </p>
        )}
        {query.data.plans.map((plan) => {
          const isActive = plan.status === 'active';
          return (
            <TrCard key={plan.id} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: colors.surface2, color: colors.primary }}
                >
                  {plan.coinIcon}
                </span>
                <div className="min-w-0 flex-1">
                  <p style={{ color: colors.text1, fontWeight: 700 }}>
                    {plan.coinName} · {plan.frequency}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 11 }}>
                    {plan.amountPerPurchase} per purchase · next{' '}
                    {plan.nextExecution.toLocaleDateString()}
                  </p>
                </div>
                <span style={{ color: isActive ? colors.buy : colors.text3, fontSize: 11 }}>
                  {plan.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={!canManageDCA || update.isPending}
                  onClick={() => void updatePlanStatus(plan.id, isActive ? 'paused' : 'active')}
                  className="flex items-center gap-1 rounded-lg px-3 py-2"
                  style={{ background: colors.surface2, color: colors.text2, fontSize: 11 }}
                >
                  {isActive ? <Pause size={12} /> : <Play size={12} />}{' '}
                  {isActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  disabled={!canManageDCA || remove.isPending}
                  onClick={() => setConfirmCancelPlanId(plan.id)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2"
                  style={{ background: `${colors.sell}15`, color: colors.sell, fontSize: 11 }}
                >
                  <Trash2 size={12} /> Cancel
                </button>
              </div>
            </TrCard>
          );
        })}
      </PageContent>
      <ConfirmationDialog
        open={confirmCancelPlanId !== null}
        onClose={() => setConfirmCancelPlanId(null)}
        onConfirm={() => void cancelPlan()}
        variant="danger"
        icon={<Trash2 size={24} color={colors.sell} />}
        title="Hủy kế hoạch DCA?"
        description="Bạn có chắc muốn hủy kế hoạch này? Các lệnh mua định kỳ tiếp theo sẽ dừng."
        confirmText="Xác nhận hủy"
        cancelText="Giữ kế hoạch"
      />
    </PageLayout>
  );
}

function LoadingPage() {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title="Savings DCA" back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu DCA API…</p>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2 text-center" style={{ background: colors.surface2 }}>
      <strong style={{ color: colors.text1 }}>{value}</strong>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
    </div>
  );
}
