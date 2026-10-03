import { useEffect } from 'react';
import { NotificationsContractPage } from '@/features/support/pages/NotificationsContractPage';
import { useNotificationsQuery } from '@/features/support';
import { useAuth } from '@/shared/session/useAuth';
import { useUI } from '@/app/hooks/useUI';

export function NotificationsPageAdapter() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('notifications:read');
  const { setNotifications } = useUI();
  const query = useNotificationsQuery({ enabled: canRead });

  useEffect(() => {
    if (!canRead) {
      setNotifications(0);
      return;
    }
    if (query.data) {
      setNotifications(query.data.items.filter((item) => !item.isRead).length);
    }
  }, [canRead, query.data, setNotifications]);

  return <NotificationsContractPage />;
}
