import { useMemo, useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useHelpQuery } from '../model/support-queries';

export function HelpCenterContractPage() {
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canReadHelp = hasPermission('support:read');
  const query = useHelpQuery({ enabled: canReadHelp });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const articles = useMemo(
    () =>
      query.data?.articles.filter(
        (article) =>
          (!category || article.category === category) &&
          (!search ||
            `${article.title} ${article.summary}`.toLowerCase().includes(search.toLowerCase())),
      ) ?? [],
    [category, query.data?.articles, search],
  );
  return (
    <PageLayout>
      <Header title="Trung tâm trợ giúp" back />
      <PageContent gap="default">
        {!canReadHelp ? (
          <p role="alert" style={{ color: colors.error, fontSize: 12 }}>
            Support read permission is required to view the help center.
          </p>
        ) : (
          <>
            <input
              aria-label="Tìm kiếm trợ giúp"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm bài viết"
              className="rounded-xl p-3"
            />
            {query.isPending && <p style={{ color: colors.text2 }}>Đang tải help center…</p>}
            {query.isError && !query.data && <ErrorState onAction={() => void query.refetch()} />}
            {query.isError && query.data && (
              <div
                role="alert"
                className="flex items-center gap-3"
                style={{ color: colors.error, fontSize: 12 }}
              >
                <p>Dữ liệu trợ giúp đang hiển thị có thể đã cũ vì không thể cập nhật.</p>
                <button
                  type="button"
                  onClick={() => void query.refetch()}
                  disabled={query.isFetching}
                  aria-busy={query.isFetching}
                >
                  Thử lại
                </button>
              </div>
            )}
            {query.data && (
              <div className="flex gap-2 overflow-x-auto">
                {query.data.categories.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setCategory(category === item.id ? null : item.id)}
                    className="shrink-0 rounded-lg px-3 py-2"
                    style={{
                      background: category === item.id ? colors.primary : colors.surface2,
                      color: category === item.id ? '#fff' : colors.text2,
                      fontSize: 11,
                    }}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {canReadHelp && query.data && articles.length === 0 ? (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Không tìm thấy bài viết phù hợp.
          </p>
        ) : canReadHelp && query.data ? (
          articles.map((article) => (
            <TrCard className="p-4" key={article.id}>
              <h2 style={{ color: colors.text1, fontWeight: 700 }}>{article.title}</h2>
              <p style={{ color: colors.text2, fontSize: 12, marginTop: 5 }}>{article.summary}</p>
              <p style={{ color: colors.text3, fontSize: 11, marginTop: 8 }}>
                {article.views.toLocaleString('vi-VN')} lượt xem
              </p>
            </TrCard>
          ))
        ) : null}
      </PageContent>
    </PageLayout>
  );
}
