import { SearchBar } from '@/shared/ui/SearchBar';
import { FilterButton } from '@/shared/ui/FilterButton';
import { CTAButton } from '@/shared/ui/CTAButton';
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
        <div
          role="region"
          aria-label="Dữ liệu trợ giúp"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {!canReadHelp ? (
            <p role="alert" style={{ color: colors.errorText, fontSize: 12 }}>
              Support read permission is required to view the help center.
            </p>
          ) : (
            <>
              <SearchBar
                ariaLabel="Tìm kiếm trợ giúp"
                value={search}
                onChange={setSearch}
                placeholder="Tìm kiếm bài viết"
              />
              {query.isPending && !query.data && (
                <p
                  role="progressbar"
                  aria-label="Đang tải help center…"
                  style={{ color: colors.text2 }}
                >
                  Đang tải help center…
                </p>
              )}
              {!query.isPending && !query.data && (
                <div role="alert">
                  <ErrorState onAction={() => void query.refetch()} />
                </div>
              )}
              {query.isError && query.data && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center gap-3"
                  style={{ color: colors.errorText, fontSize: 12 }}
                >
                  <p>Dữ liệu trợ giúp đang hiển thị có thể đã cũ vì không thể cập nhật.</p>
                  <CTAButton
                    variant="secondary"
                    density="compact"
                    fullWidth={false}
                    loading={query.isFetching}
                    onClick={() => void query.refetch()}
                    disabled={query.isFetching}
                    aria-busy={query.isFetching}
                  >
                    Thử lại
                  </CTAButton>
                </div>
              )}
              {query.data && (
                <fieldset>
                  <legend className="sr-only">Danh mục trợ giúp</legend>
                  <div className="flex flex-wrap gap-2">
                    {query.data.categories.map((item) => (
                      <FilterButton
                        key={item.id}
                        selected={category === item.id}
                        label={item.icon + ' ' + item.name}
                        onClick={() => setCategory(category === item.id ? null : item.id)}
                      />
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}
          {canReadHelp && query.data && articles.length === 0 ? (
            <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
              Không tìm thấy bài viết phù hợp.
            </p>
          ) : canReadHelp && query.data ? (
            articles.map((article) => (
              <TrCard
                as="article"
                className="p-4"
                key={article.id}
                style={{ overflowWrap: 'anywhere' }}
              >
                <h2 style={{ color: colors.text1, fontWeight: 700 }}>{article.title}</h2>
                <p style={{ color: colors.text2, fontSize: 12, marginTop: 5 }}>{article.summary}</p>
                <p style={{ color: colors.text3, fontSize: 11, marginTop: 8 }}>
                  {article.views.toLocaleString('vi-VN')} lượt xem
                </p>
              </TrCard>
            ))
          ) : null}
        </div>
      </PageContent>
    </PageLayout>
  );
}
