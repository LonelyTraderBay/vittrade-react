import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useAuth } from '@/shared/session/useAuth';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { TrCard } from '@/shared/ui/TrCard';
import {
  useDevicesQuery,
  useRevokeDeviceMutation,
  useSetDeviceTrustMutation,
} from '../model/profile-queries';

export function DeviceManagementContractPage() {
  const colors = useThemeColors();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const canManageSecurity =
    hasPermission('profile:write') || hasPermission('profile:security:write');
  const query = useDevicesQuery();
  const revoke = useRevokeDeviceMutation();
  const trust = useSetDeviceTrustMutation();
  const updateDeviceTrust = async (deviceId: string, trusted: boolean) => {
    if (!canManageSecurity) return;
    try {
      await trust.mutateAsync({
        deviceId,
        trusted,
        idempotencyKey: `profile-device-trust-${crypto.randomUUID()}`,
      });
      actionToast.success(
        trusted ? 'Đã đánh dấu thiết bị đáng tin cậy.' : 'Đã bỏ tin cậy thiết bị.',
      );
    } catch (error) {
      actionToast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật trạng thái thiết bị.',
      );
    }
  };
  const revokeDevice = async (deviceId: string) => {
    if (!canManageSecurity) return;
    try {
      await revoke.mutateAsync({
        deviceId,
        idempotencyKey: `profile-device-revoke-${crypto.randomUUID()}`,
      });
      actionToast.success('Đã thu hồi thiết bị.');
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể thu hồi thiết bị.');
    }
  };
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Quản lý thiết bị" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải thiết bị…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Quản lý thiết bị" subtitle="Bảo mật · Profile" back />
      <PageContent gap="default">
        {!canManageSecurity && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Profile security permission is required to manage trusted devices.
          </p>
        )}
        {query.data.items.length === 0 ? (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Chưa có thiết bị nào được ghi nhận.
          </p>
        ) : (
          query.data.items.map((device) => (
            <TrCard className="p-4" key={device.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <h2 style={{ color: colors.text1, fontWeight: 700 }}>{device.name}</h2>
                  <p style={{ color: colors.text2, fontSize: 12 }}>
                    {device.browser} · {device.os}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 11 }}>
                    {device.location} · {device.lastActive}
                  </p>
                </div>
                <span
                  style={{ color: device.isCurrent ? colors.success : colors.text3, fontSize: 11 }}
                >
                  {device.isCurrent
                    ? 'Thiết bị hiện tại'
                    : device.isTrusted
                      ? 'Đáng tin cậy'
                      : 'Chưa tin cậy'}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {!device.isCurrent && (
                  <button
                    type="button"
                    disabled={!canManageSecurity || trust.isPending}
                    className="rounded-lg px-3 py-2"
                    style={{ background: colors.surface2, color: colors.text1, fontSize: 12 }}
                    onClick={() => void updateDeviceTrust(device.id, !device.isTrusted)}
                  >
                    {device.isTrusted ? 'Bỏ tin cậy' : 'Tin cậy'}
                  </button>
                )}
                {!device.isCurrent && (
                  <button
                    type="button"
                    disabled={!canManageSecurity || revoke.isPending}
                    className="rounded-lg px-3 py-2"
                    style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}
                    onClick={() => void revokeDevice(device.id)}
                  >
                    Thu hồi
                  </button>
                )}
              </div>
            </TrCard>
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}
