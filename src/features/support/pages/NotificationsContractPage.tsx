import { CTAButton } from '@/shared/ui/CTAButton';
import { useRef } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useAuth } from '@/shared/session/useAuth';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useMarkNotificationReadMutation, useNotificationsQuery } from '../model/support-queries';

export function NotificationsContractPage() {
  const colors = useThemeColors();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('notifications:read');
  const canMarkRead = hasPermission('notifications:write');
  const query = useNotificationsQuery({ enabled: canRead });
  const markRead = useMarkNotificationReadMutation();
  const idempotencyKeys = useRef(new Map<string, string>());
  const inFlight = useRef(false);
  const data = query.data;
  if (!canRead)
    return (
      <PageLayout>
        <Header title="Thông báo" back />
        <PageContent>
          <p role="alert" style={{ color: colors.text2 }}>
            Notification read permission is required to view notifications.
          </p>
        </PageContent>
      </PageLayout>
    );
  return (
    <PageLayout>
      <Header
        title="Thông báo"
        subtitle={
          !query.isError && data
            ? `${data.items.filter((item) => !item.isRead).length} chưa đọc`
            : undefined
        }
        back
      />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Danh sách thông báo"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p role="progressbar" aria-label="Đang tải thông báo…" style={{ color: colors.text2 }}>
              Đang tải thông báo…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              {!canMarkRead && (
                <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
                  Notification write permission is required to mark notifications as read.
                </p>
              )}
              {data.items.length === 0 ? (
                <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
                  Bạn chưa có thông báo nào.
                </p>
              ) : (
                data.items.map((notification) => (
                  <TrCard
                    className="p-4"
                    key={notification.id}
                    as="article"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span style={{ fontSize: 18 }}>{notification.icon ?? '•'}</span>
                      <div className="min-w-0 flex-1">
                        <p
                          style={{
                            color: colors.text1,
                            fontWeight: notification.isRead ? 500 : 700,
                          }}
                        >
                          {notification.title}
                        </p>
                        <p style={{ color: colors.text2, fontSize: 12, marginTop: 4 }}>
                          {notification.message}
                        </p>
                        <p style={{ color: colors.text3, fontSize: 11, marginTop: 6 }}>
                          {notification.time}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <CTAButton
                          variant="secondary"
                          density="compact"
                          fullWidth={false}
                          type="button"
                          disabled={!canMarkRead || markRead.isPending}
                          onClick={() => {
                            if (!canMarkRead || inFlight.current) return;
                            inFlight.current = true;
                            const idempotencyKey =
                              idempotencyKeys.current.get(notification.id) ?? crypto.randomUUID();
                            idempotencyKeys.current.set(notification.id, idempotencyKey);
                            void markRead
                              .mutateAsync({
                                id: notification.id,
                                idempotencyKey: `notification-read-${notification.id}-${idempotencyKey}`,
                              })
                              .then(() => {
                                idempotencyKeys.current.delete(notification.id);
                                actionToast.success('Đã đánh dấu thông báo là đã đọc.');
                              })
                              .catch((error: unknown) => {
                                actionToast.error(
                                  error instanceof Error
                                    ? error.message
                                    : 'Không thể cập nhật trạng thái thông báo.',
                                );
                              })
                              .finally(() => {
                                inFlight.current = false;
                              });
                          }}
                        >
                          Đã đọc
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
