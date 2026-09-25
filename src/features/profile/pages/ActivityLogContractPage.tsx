import { useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useActivityQuery } from '../model/profile-queries';

export function ActivityLogContractPage() {
  const colors = useThemeColors();
  const query = useActivityQuery();
  const [filter, setFilter] = useState<'all' | 'login' | 'security'>('all');
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Hoạt động tài khoản" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải activity…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const logs = query.data.items.filter(
    (log) =>
      filter === 'all' ||
      (filter === 'login'
        ? ['login', 'logout'].includes(log.type)
        : !['login', 'logout'].includes(log.type)),
  );
  return (
    <PageLayout>
      <Header title="Hoạt động tài khoản" subtitle="Audit log" back />
      <PageContent gap="default">
        <div className="flex gap-2">
          {(['all', 'login', 'security'] as const).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setFilter(item)}
              className="rounded-lg px-3 py-2"
              style={{
                background: filter === item ? colors.primary : colors.surface2,
                color: filter === item ? '#fff' : colors.text2,
                fontSize: 11,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        {logs.map((log) => (
          <TrCard className="p-4" key={log.id}>
            <div className="flex justify-between gap-3">
              <div>
                <p style={{ color: colors.text1, fontWeight: 700 }}>{log.description}</p>
                <p style={{ color: colors.text2, fontSize: 12 }}>
                  {log.device} · {log.location}
                </p>
                <p style={{ color: colors.text3, fontSize: 11 }}>
                  {log.ipAddress} · {log.timestamp}
                </p>
              </div>
              <span
                style={{
                  color: log.status === 'success' ? colors.success : '#EF4444',
                  fontSize: 11,
                }}
              >
                {log.status}
              </span>
            </div>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}
