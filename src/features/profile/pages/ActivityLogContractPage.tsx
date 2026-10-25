import { FilterButton } from '@/shared/ui/FilterButton';
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
  const data = query.data;
  const logs = (data?.items ?? []).filter(
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
        <fieldset>
          <legend className="sr-only">Loại hoạt động</legend>
          <div className="flex flex-wrap gap-2">
            {(['all', 'login', 'security'] as const).map((item) => (
              <FilterButton
                key={item}
                selected={filter === item}
                label={item}
                onClick={() => setFilter(item)}
              />
            ))}
          </div>
        </fieldset>
        <div
          role="region"
          aria-label="Nhật ký hoạt động"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p role="progressbar" aria-label="Đang tải activity…" style={{ color: colors.text2 }}>
              Đang tải activity…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              {logs.length === 0 ? (
                <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
                  {data.items.length === 0
                    ? 'Chưa có hoạt động tài khoản nào.'
                    : 'Không có hoạt động phù hợp bộ lọc.'}
                </p>
              ) : (
                logs.map((log) => (
                  <TrCard
                    as="article"
                    className="p-4"
                    key={log.id}
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="min-w-0 flex-1">
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
                          color: log.status === 'success' ? colors.successText : colors.errorText,
                          fontSize: 11,
                        }}
                      >
                        {log.status}
                      </span>
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
