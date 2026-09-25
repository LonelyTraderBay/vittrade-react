import { useMemo, useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHelpQuery } from '../model/support-queries';

export function HelpCenterContractPage() {
  const colors = useThemeColors();
  const query = useHelpQuery();
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
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Trung tâm trợ giúp" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải help center…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Trung tâm trợ giúp" back />
      <PageContent gap="default">
        <input
          aria-label="Tìm kiếm trợ giúp"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm kiếm bài viết"
          className="rounded-xl p-3"
        />{' '}
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
        {articles.length === 0 ? (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Không tìm thấy bài viết phù hợp.
          </p>
        ) : (
          articles.map((article) => (
            <TrCard className="p-4" key={article.id}>
              <h2 style={{ color: colors.text1, fontWeight: 700 }}>{article.title}</h2>
              <p style={{ color: colors.text2, fontSize: 12, marginTop: 5 }}>{article.summary}</p>
              <p style={{ color: colors.text3, fontSize: 11, marginTop: 8 }}>
                {article.views.toLocaleString('vi-VN')} lượt xem
              </p>
            </TrCard>
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}
