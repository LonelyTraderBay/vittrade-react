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
  if (query.isPending)
    return (
      <PageLayout>
        <Header title={announcementsOnly ? 'Thông báo hệ thống' : 'Tin tức'} back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải nội dung…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const items = announcementsOnly
    ? query.data.items.filter(
        (item) => item.isPinned || item.type === 'maintenance' || item.type === 'security',
      )
    : query.data.items;
  const selected = items.find((item) => item.id === selectedId);
  return (
    <PageLayout>
      <Header title={announcementsOnly ? 'Thông báo hệ thống' : 'Tin tức'} back />
      <PageContent gap="default">
        {selected ? (
          <TrCard className="p-4">
            <button
              type="button"
              style={{ color: colors.primary, fontSize: 12 }}
              onClick={() => setSelectedId(null)}
            >
              ← Danh sách
            </button>
            <h1 className="mt-3" style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>
              {selected.title}
            </h1>
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
        ) : (
          items.map((article) => (
            <button
              type="button"
              key={article.id}
              className="text-left"
              onClick={() => setSelectedId(article.id)}
            >
              <TrCard className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
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
      </PageContent>
    </PageLayout>
  );
}

export function AnnouncementsContractPage() {
  return <NewsContractPage announcementsOnly />;
}
