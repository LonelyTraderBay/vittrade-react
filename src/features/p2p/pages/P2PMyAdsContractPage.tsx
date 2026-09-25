import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2PAdDeleteMutation,
  useP2PAdStatusMutation,
  useP2PMyAdsQuery,
} from '../model/p2p-my-ads-queries';
import type { P2PAd } from '../model/p2p-types';

type Filter = 'all' | 'active' | 'paused';
const EMPTY_ADS: P2PAd[] = [];

export function P2PMyAdsContractPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const adsQuery = useP2PMyAdsQuery();
  const statusMutation = useP2PAdStatusMutation();
  const deleteMutation = useP2PAdDeleteMutation();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canWriteAds = hasPermission('p2p:write') || hasPermission('p2p:ad:write');

  const ads = adsQuery.data?.items ?? EMPTY_ADS;
  const visibleAds = useMemo(
    () => ads.filter((ad) => filter === 'all' || ad.status === filter),
    [ads, filter],
  );
  const activeCount = ads.filter((ad) => ad.status === 'active').length;
  const pausedCount = ads.filter((ad) => ad.status === 'paused').length;
  const totalVolume = ads.reduce((total, ad) => total + ad.totalVolume30d, 0);

  const updateStatus = async (ad: P2PAd) => {
    if (!canWriteAds || ad.status === 'expired' || statusMutation.isPending) return;
    setActionError(null);
    try {
      await statusMutation.mutateAsync({
        adId: ad.id,
        request: { status: ad.status === 'active' ? 'paused' : 'active' },
        idempotencyKey: `p2p-ad-status-${ad.id}-${crypto.randomUUID()}`,
      });
    } catch {
      setActionError('Không thể cập nhật trạng thái quảng cáo.');
    }
  };

  const deleteAd = async () => {
    if (!canWriteAds || !deleteId || deleteMutation.isPending) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({
        adId: deleteId,
        idempotencyKey: `p2p-ad-delete-${deleteId}-${crypto.randomUUID()}`,
      });
      setDeleteId(null);
    } catch {
      setActionError('Không thể xóa quảng cáo.');
    }
  };

  if (adsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Quảng cáo của tôi" subtitle="Contract-backed P2P ads" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải quảng cáo…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (adsQuery.isError) {
    return (
      <PageLayout>
        <Header title="Quảng cáo của tôi" subtitle="Contract-backed P2P ads" back />
        <ErrorState title="Không thể tải quảng cáo" onAction={() => void adsQuery.refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Quảng cáo của tôi"
        subtitle="Contract-backed P2P ads"
        back
        right={
          <button
            type="button"
            aria-label="Create P2P ad"
            onClick={() => navigate(`${prefix}/p2p/create`)}
            disabled={!canWriteAds}
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: colors.primary, color: '#fff' }}
          >
            Tạo mới
          </button>
        }
      />
      <PageContent gap="default">
        {!canWriteAds && (
          <p role="alert" style={{ color: colors.sell }}>
            P2P ad write permission is required to manage advertisements.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Summary label="Đang hoạt động" value={activeCount} color="#10B981" />
          <Summary label="Tạm dừng" value={pausedCount} color="#F59E0B" />
          <Summary label="KL 30 ngày" value={formatMoney(totalVolume)} color={colors.primary} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['all', 'active', 'paused'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className="rounded-lg px-2 py-2 text-xs font-semibold"
              style={{
                background: filter === value ? colors.primary : colors.surface2,
                color: filter === value ? '#fff' : colors.text2,
              }}
            >
              {value === 'all'
                ? `Tất cả (${ads.length})`
                : value === 'active'
                  ? `Hoạt động (${activeCount})`
                  : `Tạm dừng (${pausedCount})`}
            </button>
          ))}
        </div>

        {actionError && (
          <p role="alert" style={{ color: colors.sell }}>
            {actionError}
          </p>
        )}

        {visibleAds.length === 0 ? (
          <TrCard className="p-8 text-center">
            <p style={{ color: colors.text2 }}>Không có quảng cáo trong bộ lọc này.</p>
            <button
              type="button"
              onClick={() => navigate(`${prefix}/p2p/create`)}
              disabled={!canWriteAds}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: colors.primary, color: '#fff' }}
            >
              Đăng quảng cáo đầu tiên
            </button>
          </TrCard>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                colors={colors}
                onOpen={() => navigate(`${prefix}/p2p/ad/${ad.id}`)}
                onToggle={() => void updateStatus(ad)}
                onDelete={() => setDeleteId(ad.id)}
                canWrite={canWriteAds}
                isMutating={statusMutation.isPending || deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </PageContent>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl p-5" style={{ background: colors.surface }}>
            <h2 style={{ color: colors.text1, fontWeight: 700 }}>Xóa quảng cáo?</h2>
            <p className="mt-2 text-sm" style={{ color: colors.text2 }}>
              Hành động này không thể hoàn tác sau khi backend xác nhận.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg px-3 py-2"
                style={{ background: colors.surface2, color: colors.text2 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void deleteAd()}
                disabled={!canWriteAds || deleteMutation.isPending}
                className="flex-1 rounded-lg px-3 py-2 font-semibold"
                style={{ background: colors.sell, color: '#fff' }}
              >
                {deleteMutation.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function Summary({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3 text-center">
      <p style={{ color, fontWeight: 700 }}>{value}</p>
      <p className="text-[10px]" style={{ color: colors.text3 }}>
        {label}
      </p>
    </TrCard>
  );
}

function AdCard({
  ad,
  colors,
  onOpen,
  onToggle,
  onDelete,
  canWrite,
  isMutating,
}: {
  ad: P2PAd;
  colors: ReturnType<typeof useThemeColors>;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
  canWrite: boolean;
  isMutating: boolean;
}) {
  const isActive = ad.status === 'active';
  return (
    <TrCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <p className="font-semibold" style={{ color: colors.text1 }}>
            {ad.type === 'sell' ? 'BÁN' : 'MUA'} {ad.asset}/{ad.currency}
          </p>
          <p className="mt-1 text-xs" style={{ color: colors.text2 }}>
            {formatMoney(ad.price)} {ad.currency} · {formatMoney(ad.available)} {ad.asset}
          </p>
        </button>
        <span
          className="rounded-full px-2 py-1 text-[10px]"
          style={{
            color: isActive ? '#10B981' : colors.text3,
            background: isActive ? 'rgba(16,185,129,.12)' : colors.surface2,
          }}
        >
          {isActive ? 'Đang hoạt động' : ad.status === 'paused' ? 'Tạm dừng' : 'Hết hạn'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: colors.text3 }}>
        <span>
          Min {formatMoney(ad.minLimit)} {ad.currency}
        </span>
        <span>
          Max {formatMoney(ad.maxLimit)} {ad.currency}
        </span>
        <span>{ad.paymentMethods.join(', ')}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-lg px-3 py-2 text-xs"
          style={{ background: colors.surface2, color: colors.text2 }}
        >
          Chi tiết
        </button>
        {ad.status !== 'expired' && (
          <button
            type="button"
            aria-label={`${isActive ? 'Pause' : 'Resume'} ${ad.id}`}
            onClick={onToggle}
            disabled={!canWrite || isMutating}
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: colors.primary, color: '#fff' }}
          >
            {isActive ? 'Tạm dừng' : 'Bật lại'}
          </button>
        )}
        <button
          type="button"
          aria-label={`Delete ${ad.id}`}
          onClick={onDelete}
          disabled={!canWrite || isMutating}
          className="rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,.12)', color: colors.sell }}
        >
          Xóa
        </button>
      </div>
    </TrCard>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}
