import React, { useState } from 'react';
import { Newspaper, Pin, Calendar, Tag, ChevronRight } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { NEWS_ARTICLES, NewsArticle } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const TYPE_CONFIG = {
  maintenance: { label: 'Bảo trì', color: '#8B95B3', emoji: '⚙️' },
  new_feature: { label: 'Tính năng mới', color: '#3B82F6', emoji: '✨' },
  promotion: { label: 'Khuyến mãi', color: '#10B981', emoji: '🎉' },
  security: { label: 'Bảo mật', color: '#EF4444', emoji: '🔐' },
  listing: { label: 'Niêm yết', color: '#F59E0B', emoji: '📊' },
  general: { label: 'Tổng hợp', color: '#8B5CF6', emoji: '📰' },
};

export function NewsPage() {
  const c = useThemeColors();
  const [articles] = useState(NEWS_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [filterType, setFilterType] = useState<NewsArticle['type'] | 'all'>('all');

  const filteredArticles =
    filterType === 'all' ? articles : articles.filter((a) => a.type === filterType);
  const pinnedArticles = filteredArticles.filter((a) => a.isPinned);
  const normalArticles = filteredArticles.filter((a) => !a.isPinned);

  const renderArticle = (article: NewsArticle, isPinned = false) => {
    const typeConfig = TYPE_CONFIG[article.type];
    return (
      <TrCard
        key={article.id}
        as="button"
        hover
        className="w-full text-left p-4 mb-3"
        accentBorder={isPinned ? 'rgba(59,130,246,0.2)' : undefined}
        style={{ background: isPinned ? 'rgba(59,130,246,0.05)' : undefined }}
        onClick={() => setSelectedArticle(article)}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
            style={{ background: typeConfig.color + '22' }}
          >
            {typeConfig.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isPinned && (
                <div className="flex items-center gap-1">
                  <Pin size={12} color="#3B82F6" fill="#3B82F6" />
                </div>
              )}
              <span
                className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: typeConfig.color + '22', color: typeConfig.color }}
              >
                {typeConfig.label}
              </span>
              <div className="flex items-center gap-1">
                <Calendar size={10} color={c.text3} />
                <span style={{ color: c.text3, fontSize: 10 }}>
                  {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
            <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
              {article.title}
            </h3>
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.4 }}>{article.summary}</p>
          </div>
          <ChevronRight size={16} color={c.text3} className="shrink-0 mt-1" />
        </div>
        {article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {article.tags.map((tag, i) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                style={{ background: c.surface3 }}
              >
                <Tag size={10} color={c.text2} />
                <span style={{ color: c.text2, fontSize: 10 }}>{tag}</span>
              </div>
            ))}
          </div>
        )}
      </TrCard>
    );
  };

  return (
    <PageLayout>
      <Header title="Tin tức & Thông báo" subtitle="Tin tức · Cập nhật" back />
      <div
        className="-mx-0 px-5 py-3 overflow-x-auto"
        style={{
          background: c.surface,
          borderBottom: `1px solid ${c.divider}`,
          boxShadow: c.cardShadow,
        }}
      >
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setFilterType('all')}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: filterType === 'all' ? c.chipActiveBg : c.chipBg,
              color: filterType === 'all' ? c.chipActiveText : c.chipText,
              border: `1px solid ${filterType === 'all' ? c.chipActiveBorder : c.chipBorder}`,
            }}
          >
            Tất cả
          </button>
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={{
                background: filterType === type ? config.color : c.chipBg,
                color: filterType === type ? '#fff' : c.chipText,
                border: `1px solid ${filterType === type ? config.color : c.chipBorder}`,
              }}
            >
              <span>{config.emoji}</span>
              {config.label}
            </button>
          ))}
        </div>
      </div>
      <PageContent gap="default">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Newspaper size={48} color={c.borderSolid} />
            <p style={{ color: c.text3, fontSize: 14 }}>Không có tin tức nào</p>
          </div>
        ) : (
          <div className="contents">
            {pinnedArticles.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pin size={14} color="#3B82F6" fill="#3B82F6" />
                  <h2
                    style={{
                      color: '#3B82F6',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    Ghim ({pinnedArticles.length})
                  </h2>
                </div>
                {pinnedArticles.map((a) => renderArticle(a, true))}
              </div>
            )}
            {normalArticles.length > 0 && (
              <div>
                {pinnedArticles.length > 0 && (
                  <h2
                    style={{
                      color: c.text2,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}
                  >
                    Tin tức khác
                  </h2>
                )}
                {normalArticles.map((a) => renderArticle(a))}
              </div>
            )}
          </div>
        )}
      </PageContent>
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full rounded-t-3xl overflow-hidden"
            style={{ background: c.bg, maxHeight: '85vh', maxWidth: 440, margin: '0 auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-1 rounded-full mx-auto my-4"
              style={{ background: c.borderSolid }}
            />
            <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 40px)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{TYPE_CONFIG[selectedArticle.type].emoji}</span>
                <span
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: TYPE_CONFIG[selectedArticle.type].color + '22',
                    color: TYPE_CONFIG[selectedArticle.type].color,
                  }}
                >
                  {TYPE_CONFIG[selectedArticle.type].label}
                </span>
              </div>
              <h1
                style={{
                  color: c.text1,
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={12} color={c.text2} />
                <span style={{ color: c.text2, fontSize: 12 }}>
                  {new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className="rounded-xl p-4 mb-4"
                style={{
                  background: 'rgba(59,130,246,0.05)',
                  border: '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <p style={{ color: c.text2, fontSize: 14, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {selectedArticle.summary}
                </p>
              </div>
              <div
                style={{ color: c.text1, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}
              >
                {selectedArticle.content}
              </div>
              {selectedArticle.tags.length > 0 && (
                <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedArticle.tags.map((tag, i) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                        style={{ background: c.surface3 }}
                      >
                        <Tag size={12} color={c.text2} />
                        <span style={{ color: c.text2, fontSize: 12 }}>{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full h-12 rounded-xl font-semibold mt-6"
                style={{ background: '#3B82F6', color: '#fff', fontSize: 15 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
