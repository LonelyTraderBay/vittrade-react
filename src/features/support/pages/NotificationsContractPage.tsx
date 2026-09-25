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
  const canMarkRead = hasPermission('notifications:write') || hasPermission('support:write');
  const query = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();
  const idempotencyKeys = useRef(new Map<string, string>());
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Thông báo" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải thông báo…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header
        title="Thông báo"
        subtitle={`${query.data.items.filter((item) => !item.isRead).length} chưa đọc`}
        back
      />
      <PageContent gap="default">
        {!canMarkRead && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Notification write permission is required to mark notifications as read.
          </p>
        )}
        {query.data.items.length === 0 ? (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Bạn chưa có thông báo nào.
          </p>
        ) : (
          query.data.items.map((notification) => (
            <TrCard
              className="p-4"
              key={notification.id}
              style={{ opacity: notification.isRead ? 0.7 : 1 }}
            >
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 18 }}>{notification.icon ?? '•'}</span>
                <div className="min-w-0 flex-1">
                  <p style={{ color: colors.text1, fontWeight: notification.isRead ? 500 : 700 }}>
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
                  <button
                    type="button"
                    disabled={!canMarkRead || markRead.isPending}
                    style={{ color: colors.primary, fontSize: 11 }}
                    onClick={() => {
                      if (!canMarkRead) return;
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
                        });
                    }}
                  >
                    Đã đọc
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
