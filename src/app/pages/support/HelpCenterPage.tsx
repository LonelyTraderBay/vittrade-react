import React, { useState } from 'react';
import { Search, ChevronRight, BookOpen, Eye, MessageCircle, Headphones, ExternalLink } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { HELP_CATEGORIES, HELP_ARTICLES } from '../../data/mockData';
import { fmtCompact } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';

export function HelpCenterPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filtered = search
    ? HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase()))
    : selectedCategory
      ? HELP_ARTICLES.filter(a => a.category === selectedCategory)
      : HELP_ARTICLES;

  return (
    <PageLayout>
      <Header title="Trung tâm trợ giúp" subtitle="Trung tâm · Hỗ trợ" back />

      <PageContent>
        {/* Hero section */}
        <div className="mx-5 mt-4 rounded-3xl p-5"
          style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2550 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} color={c.primary} />
            <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Bạn cần giúp gì?</span>
          </div>
          <p style={{ color: c.text2, fontSize: 12, marginBottom: 12 }}>
            Tìm câu trả lời nhanh chóng từ cơ sở kiến thức của chúng tôi
          </p>
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}` }}>
            <Search size={16} color={c.searchPlaceholder} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedCategory(null); }}
              placeholder="Tìm kiếm bài viết..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: c.text1 }}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mx-5 mt-4">
          {[
            { icon: MessageCircle, label: 'Chat hỗ trợ', color: '#10B981', path: `${prefix}/support` },
            { icon: Headphones, label: 'Gửi ticket', color: '#3B82F6', path: `${prefix}/support` },
          ].map(action => (
            <TrCard key={action.label} as="button" hover
              onClick={() => navigate(action.path)}
              className="flex-1 flex items-center gap-2 px-4 py-3">
              <action.icon size={18} color={action.color} />
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{action.label}</span>
            </TrCard>
          ))}
        </div>

        {/* Categories */}
        {!search && (
          <div className="mx-5 mt-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Danh mục</p>
            <div className="grid grid-cols-2 gap-2">
              {HELP_CATEGORIES.map(cat => (
                <TrCard key={cat.id} as="button" hover rounded="sm"
                  onClick={() => { setSelectedCategory(cat.id); hapticSelection(); }}
                  className="p-3.5 w-full text-left">
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div>
                    <p style={{ color: selectedCategory === cat.id ? c.chipActiveText : c.text1, fontSize: 13, fontWeight: 600 }}>{cat.name}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{cat.count} bài viết</p>
                  </div>
                </TrCard>
              ))}
            </div>
          </div>
        )}

        {/* Articles */}
        <div className="mx-5 mt-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {search ? `Kết quả (${filtered.length})` : selectedCategory ? HELP_CATEGORIES.find(c => c.id === selectedCategory)?.name : 'Bài viết phổ biến'}
          </p>
          {filtered.length === 0 && (
            <TrCard className="py-8 text-center">
              <Search size={28} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text3, fontSize: 13 }}>Không tìm thấy bài viết phù hợp</p>
            </TrCard>
          )}
          <div className="flex flex-col gap-2">
            {filtered.map(article => (
              <TrCard key={article.id} as="button" hover rounded="sm"
                onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                className="p-3.5 w-full text-left">
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 16 }}>{article.categoryIcon}</span>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{article.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Eye size={11} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 11 }}>{fmtCompact(article.views)}</span>
                      </div>
                    </div>
                    {expandedArticle === article.id && (
                      <p style={{ color: c.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                        {article.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} color={c.text3} style={{ transform: expandedArticle === article.id ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </div>
              </TrCard>
            ))}
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}