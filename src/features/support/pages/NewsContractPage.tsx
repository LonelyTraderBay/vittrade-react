import { CTAButton } from '@/shared/ui/CTAButton';
import { useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useNewsQuery } from '../model/support-queries';

export function NewsContractPage({ announcementsOnly = false }: { announcementsOnly?: boolean }) {
  const colors = useThemeColors();
  const query = useNewsQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const data = query.data;
  const items = announcementsOnly
    ? (data?.items ?? []).filter(
        (item) => item.isPinned || item.type === 'maintenance' || item.type === 'security',
      )
    : (data?.items ?? []);
  const selected = items.find((item) => item.id === selectedId);
  return (
    <PageLayout>
      <Header title={announcementsOnly ? 'Thông báo hệ thống' : 'Tin tức'} back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Nội dung tin tức"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p role="progressbar" aria-label="Đang tải nội dung…" style={{ color: colors.text2 }}>
              Đang tải nội dung…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              {selected ? (
                <TrCard className="p-4" style={{ overflowWrap: 'anywhere' }}>
                  <CTAButton
                    variant="secondary"
                    density="compact"
                    fullWidth={false}
                    type="button"
                    onClick={() => setSelectedId(null)}
                  >
                    ← Danh sách
                  </CTAButton>
                  <h2
                    className="mt-3"
                    style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}
                  >
                    {selected.title}
                  </h2>
                  <p className="mt-2" style={{ color: colors.text2, fontSize: 12 }}>
                    {selected.publishedAt}
                  </p>
                  <p
                    className="mt-4 whitespace-pre-line"
                    style={{ color: colors.text2, fontSize: 13, lineHeight: 1.6 }}
                  >
                    {selected.content}
                  </p>
                </TrCard>
              ) : items.length === 0 ? (
                <p role="status" style={{ color: colors.text2 }}>
                  {announcementsOnly ? 'Chưa có thông báo hệ thống nào.' : 'Chưa có tin tức nào.'}
                </p>
              ) : (
                items.map((article) => (
                  <button
                    type="button"
                    key={article.id}
                    className="min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ outlineColor: colors.primary, overflowWrap: 'anywhere' }}
                    onClick={() => setSelectedId(article.id)}
                  >
                    <TrCard className="p-4" style={{ overflowWrap: 'anywhere' }}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 style={{ color: colors.text1, fontWeight: 700 }}>{article.title}</h2>
                          <p className="mt-1" style={{ color: colors.text2, fontSize: 12 }}>
                            {article.summary}
                          </p>
                        </div>
                        {article.isPinned && (
                          <span style={{ color: colors.primary, fontSize: 11 }}>Ghim</span>
                        )}
                      </div>
                      <p className="mt-3" style={{ color: colors.text3, fontSize: 11 }}>
                        {article.publishedAt} · {article.tags.join(', ')}
                      </p>
                    </TrCard>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}

export function AnnouncementsContractPage() {
  return <NewsContractPage announcementsOnly />;
}
