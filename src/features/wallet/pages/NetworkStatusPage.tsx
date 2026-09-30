import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useWalletNetworkStatusQuery } from '../model/wallet-queries';
import type { WalletNetworkHealth } from '../model/wallet-types';

const STATUS_LABELS: Record<WalletNetworkHealth, string> = {
  operational: 'Hoạt động',
  degraded: 'Chậm',
  congested: 'Tắc nghẽn',
  maintenance: 'Bảo trì',
};

function getStatusColor(status: WalletNetworkHealth, colors: ReturnType<typeof useThemeColors>) {
  if (status === 'operational') return colors.success;
  if (status === 'maintenance') return colors.text3;
  return colors.warning;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export function NetworkStatusPage() {
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canReadNetworkStatus = hasPermission('wallet:read');
  const query = useWalletNetworkStatusQuery(canReadNetworkStatus);
  const networks = query.data?.items ?? [];
  const operationalCount = networks.filter((network) => network.status === 'operational').length;
  const attentionCount = networks.length - operationalCount;

  return (
    <PageLayout>
      <Header title="Trạng thái mạng" subtitle="Wallet · Network status" back />
      <PageContent gap="default">
        {canReadNetworkStatus && (
          <div className="flex justify-end">
            <button
              type="button"
              aria-label="Cập nhật trạng thái mạng"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: colors.surface2, color: colors.text1 }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Cập nhật
            </button>
          </div>
        )}

        {!canReadNetworkStatus ? (
          <p role="alert" style={{ color: colors.text2 }}>
            Tài khoản của bạn không có quyền xem trạng thái mạng.
          </p>
        ) : query.isPending ? (
          <p role="status" style={{ color: colors.text2 }}>
            Đang tải trạng thái từ Wallet API…
          </p>
        ) : query.isError ? (
          <ErrorState
            title="Không thể tải trạng thái mạng"
            message="Wallet API chưa trả dữ liệu trạng thái mạng. Trạng thái hiện tại chưa xác định; dữ liệu cũ và số liệu mô phỏng không được hiển thị."
            onAction={() => void query.refetch()}
          />
        ) : networks.length === 0 ? (
          <EmptyState
            icon={WifiOff}
            title="Chưa có trạng thái mạng"
            subtitle="Wallet API chưa trả về mạng nào. Không thể xác nhận khả năng nạp hoặc rút."
          />
        ) : (
          <>
            <TrCard variant="hero" rounded="lg" className="p-4">
              <div className="flex items-center gap-3">
                {attentionCount > 0 ? (
                  <AlertTriangle size={22} color={colors.warning} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={22} color={colors.success} aria-hidden="true" />
                )}
                <div>
                  <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                    {operationalCount} hoạt động · {attentionCount} cần chú ý
                  </p>
                  <p style={{ color: colors.text3, fontSize: 12 }}>
                    Trạng thái và thời điểm cập nhật do Wallet API cung cấp.
                  </p>
                </div>
              </div>
            </TrCard>

            <div className="flex flex-col gap-3">
              {networks.map((network) => {
                const statusColor = getStatusColor(network.status, colors);

                return (
                  <TrCard key={network.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                          {network.name}
                        </p>
                        <p style={{ color: colors.text3, fontSize: 11 }}>
                          Cập nhật {formatTimestamp(network.updatedAt)}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ color: statusColor, border: `1px solid ${statusColor}` }}
                      >
                        {STATUS_LABELS[network.status]}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <p style={{ color: network.depositEnabled ? colors.success : colors.error }}>
                        Nạp: {network.depositEnabled ? 'đang mở' : 'tạm dừng'}
                      </p>
                      <p
                        style={{ color: network.withdrawalEnabled ? colors.success : colors.error }}
                      >
                        Rút: {network.withdrawalEnabled ? 'đang mở' : 'tạm dừng'}
                      </p>
                    </div>

                    {network.message && (
                      <p className="mt-3" style={{ color: colors.text2, fontSize: 12 }}>
                        {network.message}
                      </p>
                    )}
                  </TrCard>
                );
              })}
            </div>
          </>
        )}

        <p style={{ color: colors.text3, fontSize: 11, lineHeight: 1.5 }}>
          Nạp/rút chỉ được xác nhận từ trạng thái mới do Wallet API trả về. Khi nguồn dữ liệu lỗi,
          trang sẽ ẩn trạng thái mạng thay vì giữ lại thông tin cũ.
        </p>
      </PageContent>
    </PageLayout>
  );
}
