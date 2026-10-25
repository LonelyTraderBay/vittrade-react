import { useRef } from 'react';
import { CTAButton } from '@/shared/ui/CTAButton';
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
  const data = query.data;
  const readUnavailable = query.isPending || query.isError || !data;
  const actionPending = trust.isPending || revoke.isPending;
  const inFlight = useRef(false);
  const updateDeviceTrust = async (deviceId: string, trusted: boolean) => {
    if (!canManageSecurity || readUnavailable || inFlight.current) return;
    inFlight.current = true;
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
    } finally {
      inFlight.current = false;
    }
  };
  const revokeDevice = async (deviceId: string) => {
    if (!canManageSecurity || readUnavailable || inFlight.current) return;
    inFlight.current = true;
    try {
      await revoke.mutateAsync({
        deviceId,
        idempotencyKey: `profile-device-revoke-${crypto.randomUUID()}`,
      });
      actionToast.success('Đã thu hồi thiết bị.');
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể thu hồi thiết bị.');
    } finally {
      inFlight.current = false;
    }
  };
  return (
    <PageLayout>
      <Header title="Quản lý thiết bị" subtitle="Bảo mật · Profile" back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Danh sách thiết bị"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p role="progressbar" aria-label="Đang tải thiết bị…" style={{ color: colors.text2 }}>
              Đang tải thiết bị…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              {!canManageSecurity && (
                <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
                  Profile security permission is required to manage trusted devices.
                </p>
              )}
              {data.items.length === 0 ? (
                <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
                  Chưa có thiết bị nào được ghi nhận.
                </p>
              ) : (
                data.items.map((device) => (
                  <TrCard
                    as="article"
                    className="p-4"
                    key={device.id}
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 style={{ color: colors.text1, fontWeight: 700 }}>{device.name}</h2>
                        <p style={{ color: colors.text2, fontSize: 12 }}>
                          {device.browser} · {device.os}
                        </p>
                        <p style={{ color: colors.text3, fontSize: 11 }}>
                          {device.location} · {device.lastActive}
                        </p>
                      </div>
                      <span
                        style={{
                          color: device.isCurrent ? colors.successText : colors.text3,
                          fontSize: 11,
                        }}
                      >
                        {device.isCurrent
                          ? 'Thiết bị hiện tại'
                          : device.isTrusted
                            ? 'Đáng tin cậy'
                            : 'Chưa tin cậy'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!device.isCurrent && (
                        <CTAButton
                          type="button"
                          disabled={!canManageSecurity || actionPending}
                          variant="secondary"
                          density="compact"
                          fullWidth={false}
                          loading={trust.isPending && trust.variables?.deviceId === device.id}
                          onClick={() => void updateDeviceTrust(device.id, !device.isTrusted)}
                        >
                          {device.isTrusted ? 'Bỏ tin cậy' : 'Tin cậy'}
                        </CTAButton>
                      )}
                      {!device.isCurrent && (
                        <CTAButton
                          type="button"
                          disabled={!canManageSecurity || actionPending}
                          variant="danger-subtle"
                          density="compact"
                          fullWidth={false}
                          loading={revoke.isPending && revoke.variables?.deviceId === device.id}
                          onClick={() => void revokeDevice(device.id)}
                        >
                          Thu hồi
                        </CTAButton>
                      )}
                    </div>
                  </TrCard>
                ))
              )}
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
