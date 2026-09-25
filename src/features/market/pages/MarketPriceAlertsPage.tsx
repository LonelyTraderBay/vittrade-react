import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtPrice, fmtUsd } from '@/shared/lib/formatNumber';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useMarketPairsQuery,
  useMarketPriceAlertCreateMutation,
  useMarketPriceAlertDeleteMutation,
  useMarketPriceAlertsQuery,
  useMarketPriceAlertUpdateMutation,
  type MarketPriceAlert,
  type MarketPriceAlertFilter,
  type MarketPair,
} from '@/features/market';

const EMPTY_PAIRS: MarketPair[] = [];

export function MarketPriceAlertsPage() {
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canManageAlerts = hasPermission('market:write') || hasPermission('market:alerts:write');
  const [filter, setFilter] = useState<MarketPriceAlertFilter>('all');
  const [pairId, setPairId] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [createKey, setCreateKey] = useState(() => crypto.randomUUID());
  const updateKeys = useRef(new Map<string, string>());
  const deleteKeys = useRef(new Map<string, string>());
  const alertsQuery = useMarketPriceAlertsQuery();
  const pairsQuery = useMarketPairsQuery({ limit: 100 });
  const createMutation = useMarketPriceAlertCreateMutation();
  const updateMutation = useMarketPriceAlertUpdateMutation();
  const deleteMutation = useMarketPriceAlertDeleteMutation();
  const pairs = pairsQuery.data?.items ?? EMPTY_PAIRS;
  const effectivePairId = pairId || pairs[0]?.id || '';
  const pairMap = useMemo(() => new Map(pairs.map((pair) => [pair.id, pair])), [pairs]);
  const alerts = useMemo(() => {
    const items = alertsQuery.data?.items ?? [];
    if (filter === 'active') return items.filter((item) => item.isActive);
    if (filter === 'triggered') return items.filter((item) => !item.isActive && item.triggeredAt);
    return items;
  }, [alertsQuery.data?.items, filter]);

  const handleCreate = async () => {
    if (!canManageAlerts) {
      toast.error('Market price-alert permission is required to create alerts.');
      return;
    }
    const parsedTarget = Number(targetPrice);
    if (!effectivePairId || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      toast.error('Chọn cặp giao dịch và nhập mức giá hợp lệ.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        request: { pairId: effectivePairId, condition, targetPrice: parsedTarget },
        idempotencyKey: `price-alert-create-${createKey}`,
      });
      setTargetPrice('');
      setCreateKey(crypto.randomUUID());
      toast.success('Đã tạo cảnh báo giá.');
    } catch {
      toast.error('Không thể tạo cảnh báo giá.');
    }
  };

  const handleToggle = async (alert: MarketPriceAlert) => {
    if (!canManageAlerts) return;
    const nextActive = !alert.isActive;
    const actionId = `${alert.id}:${nextActive ? 'active' : 'paused'}`;
    const key = updateKeys.current.get(actionId) ?? crypto.randomUUID();
    updateKeys.current.set(actionId, key);
    try {
      await updateMutation.mutateAsync({
        id: alert.id,
        request: { isActive: nextActive },
        idempotencyKey: `price-alert-update-${alert.id}-${key}`,
      });
      updateKeys.current.delete(actionId);
    } catch {
      toast.error('Không thể cập nhật cảnh báo giá.');
    }
  };

  const handleDelete = async (alert: MarketPriceAlert) => {
    if (!canManageAlerts) return;
    const key = deleteKeys.current.get(alert.id) ?? crypto.randomUUID();
    deleteKeys.current.set(alert.id, key);
    try {
      await deleteMutation.mutateAsync({
        id: alert.id,
        idempotencyKey: `price-alert-delete-${alert.id}-${key}`,
      });
      deleteKeys.current.delete(alert.id);
      toast.success('Đã xóa cảnh báo giá.');
    } catch {
      toast.error('Không thể xóa cảnh báo giá.');
    }
  };

  if (alertsQuery.isPending || pairsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Cảnh báo giá" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải cảnh báo giá…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (alertsQuery.isError || pairsQuery.isError) {
    return (
      <PageLayout>
        <Header title="Cảnh báo giá" back />
        <ErrorState
          onAction={() => {
            void Promise.all([alertsQuery.refetch(), pairsQuery.refetch()]);
          }}
        />
      </PageLayout>
    );
  }

  const allAlerts = alertsQuery.data?.items ?? [];
  const activeCount = allAlerts.filter((alert) => alert.isActive).length;
  const triggeredCount = allAlerts.filter((alert) => !alert.isActive && alert.triggeredAt).length;

  return (
    <PageLayout>
      <Header title="Cảnh báo giá" subtitle="Market API · idempotent mutations" back />
      <PageContent gap="default">
        {!canManageAlerts && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Market price alerts are read-only for this session.
          </p>
        )}
        <div className="flex gap-2">
          {[
            { id: 'all' as const, label: 'Tất cả' },
            { id: 'active' as const, label: 'Đang hoạt động' },
            { id: 'triggered' as const, label: 'Đã kích hoạt' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="rounded-xl px-3 py-2"
              style={{
                background: filter === tab.id ? colors.chipActiveBg : colors.chipBg,
                border: `1px solid ${filter === tab.id ? colors.chipActiveBorder : colors.chipBorder}`,
                color: filter === tab.id ? colors.chipActiveText : colors.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Summary label="Tổng" value={allAlerts.length} color={colors.text1} />
          <Summary label="Hoạt động" value={activeCount} color="#10B981" />
          <Summary label="Đã kích hoạt" value={triggeredCount} color="#3B82F6" />
        </div>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} color="#3B82F6" />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>Tạo cảnh báo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={effectivePairId}
              disabled={!canManageAlerts}
              onChange={(event) => {
                setPairId(event.target.value);
                setCreateKey(crypto.randomUUID());
              }}
              className="rounded-lg px-2 py-2"
              style={{ background: colors.surface2, color: colors.text1, fontSize: 11 }}
              aria-label="Chọn cặp giao dịch"
            >
              {pairs.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.symbol}
                </option>
              ))}
            </select>
            <select
              value={condition}
              disabled={!canManageAlerts}
              onChange={(event) => {
                setCondition(event.target.value as 'above' | 'below');
                setCreateKey(crypto.randomUUID());
              }}
              className="rounded-lg px-2 py-2"
              style={{ background: colors.surface2, color: colors.text1, fontSize: 11 }}
              aria-label="Điều kiện cảnh báo"
            >
              <option value="above">Giá trên</option>
              <option value="below">Giá dưới</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={targetPrice}
              disabled={!canManageAlerts}
              type="number"
              min="0"
              step="any"
              aria-label="Mức giá mục tiêu"
              placeholder="Mức giá mục tiêu"
              className="flex-1 rounded-lg px-3 py-2"
              style={{ background: colors.surface2, color: colors.text1, fontSize: 12 }}
              onChange={(event) => {
                setTargetPrice(event.target.value);
                setCreateKey(crypto.randomUUID());
              }}
            />
            <button
              onClick={() => void handleCreate()}
              disabled={!canManageAlerts || createMutation.isPending || !effectivePairId}
              className="rounded-lg px-3 py-2"
              style={{ background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 700 }}
            >
              Tạo
            </button>
          </div>
        </TrCard>

        {createMutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Không thể tạo cảnh báo giá. Hãy thử lại.
          </p>
        )}
        {updateMutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Không thể cập nhật cảnh báo giá. Hãy thử lại.
          </p>
        )}
        {deleteMutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            Không thể xóa cảnh báo giá. Hãy thử lại.
          </p>
        )}

        {alerts.length === 0 ? (
          <TrCard className="p-10 text-center">
            <Bell size={30} color={colors.text3} className="mx-auto mb-2" />
            <p style={{ color: colors.text3, fontSize: 12 }}>Chưa có cảnh báo phù hợp.</p>
          </TrCard>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              logoColor={pairMap.get(alert.pairId)?.logoColor}
              onToggle={() => void handleToggle(alert)}
              onDelete={() => void handleDelete(alert)}
              canManage={canManageAlerts}
              isUpdating={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: colors.surface2 }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function AlertCard({
  alert,
  logoColor,
  onToggle,
  onDelete,
  canManage,
  isUpdating,
  isDeleting,
}: {
  alert: MarketPriceAlert;
  logoColor?: string;
  onToggle: () => void;
  onDelete: () => void;
  canManage: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const colors = useThemeColors();
  const isAbove = alert.condition === 'above';
  const triggered = !alert.isActive && Boolean(alert.triggeredAt);
  const progress = Math.min(100, Math.max(0, (alert.currentPrice / alert.targetPrice) * 100));
  const accent = logoColor ?? '#3B82F6';
  return (
    <TrCard
      className="px-4 py-3"
      style={{ background: triggered ? 'rgba(16,185,129,0.05)' : undefined }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: `${accent}22` }}
          >
            <span style={{ color: accent, fontSize: 10, fontWeight: 700 }}>
              {alert.symbol.split('/')[0].slice(0, 3)}
            </span>
          </div>
          <div>
            <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>{alert.symbol}</p>
            <span
              className="flex items-center gap-1"
              style={{ color: isAbove ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}
            >
              {isAbove ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {isAbove ? 'Trên' : 'Dưới'} {fmtUsd(alert.targetPrice)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {triggered ? (
            <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>Đã kích hoạt</span>
          ) : (
            <button
              onClick={onToggle}
              disabled={!canManage || isUpdating}
              aria-label={alert.isActive ? 'Tắt cảnh báo' : 'Bật cảnh báo'}
            >
              {alert.isActive ? (
                <ToggleRight size={27} color="#10B981" />
              ) : (
                <ToggleLeft size={27} color={colors.text3} />
              )}
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={!canManage || isDeleting}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)' }}
            aria-label="Xóa cảnh báo"
          >
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span style={{ color: colors.text3, fontSize: 10 }}>Giá hiện tại</span>
            <span style={{ color: colors.text1, fontSize: 11, fontFamily: 'monospace' }}>
              {fmtPrice(alert.currentPrice)}
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: colors.surface2 }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: isAbove ? '#3B82F6' : '#F59E0B' }}
            />
          </div>
        </div>
        <div className="text-right">
          <p style={{ color: colors.text3, fontSize: 10 }}>Mục tiêu</p>
          <p
            style={{
              color: isAbove ? '#10B981' : '#EF4444',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            {fmtPrice(alert.targetPrice)}
          </p>
        </div>
      </div>
      {triggered && alert.triggeredAt && (
        <p
          className="mt-2 pt-2"
          style={{ borderTop: `1px solid ${colors.divider}`, color: colors.text3, fontSize: 10 }}
        >
          Kích hoạt lúc {new Date(alert.triggeredAt).toLocaleString('vi-VN')}
        </p>
      )}
    </TrCard>
  );
}
