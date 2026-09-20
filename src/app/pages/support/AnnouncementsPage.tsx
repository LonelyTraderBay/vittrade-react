import React, { useState } from 'react';
import { Tag, Zap, Megaphone, Settings, Shield, Bell, Pin, Calendar, ChevronRight } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { NEWS_ARTICLES } from '../../data/mockData';

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  promotion: { icon: Tag, color: '#F59E0B', label: 'Khuyến mãi' },
  new_feature: { icon: Zap, color: '#3B82F6', label: 'Tính năng mới' },
  listing: { icon: Megaphone, color: '#10B981', label: 'Niêm yết' },
  maintenance: { icon: Settings, color: '#8B95B3', label: 'Bảo trì' },
  security: { icon: Shield, color: '#EF4444', label: 'Bảo mật' },
  general: { icon: Bell, color: '#6366F1', label: 'Chung' },
};

const FILTERS = ['Tất cả', 'Khuyến mãi', 'Tính năng', 'Niêm yết', 'Bảo trì', 'Bảo mật'];
const FILTER_MAP: Record<string, string | null> = {
  'Tất cả': null, 'Khuyến mãi': 'promotion', 'Tính năng': 'new_feature',
  'Niêm yết': 'listing', 'Bảo trì': 'maintenance', 'Bảo mật': 'security',
};

export function AnnouncementsPage() {
  const c = useThemeColors();
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterType = FILTER_MAP[activeFilter];
  const articles = filterType
    ? NEWS_ARTICLES.filter(a => a.type === filterType)
    : NEWS_ARTICLES;

  const pinned = articles.filter(a => a.isPinned);
  const regular = articles.filter(a => !a.isPinned);

  return (
    <PageLayout>
      <Header title="Thông báo" subtitle="Thông báo · Hỗ trợ" back />

      <PageContent>
        {/* Filter chips */}
        <div className="flex gap-2 px-5 mt-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs whitespace-nowrap"
              style={{
                background: activeFilter === f ? c.chipActiveBg : c.chipBg,
                color: activeFilter === f ? c.chipActiveText : c.chipText,
                border: `1px solid ${activeFilter === f ? c.chipActiveBorder : c.chipBorder}`,
                fontWeight: 600,
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Pinned announcements */}
        {pinned.length > 0 && (
          <div className="mx-5 mt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Pin size={13} color={c.primary} />
              <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>GHIM</span>
            </div>
            {pinned.map(article => (
              <AnnouncementCard key={article.id} article={article} c={c}
                expanded={expandedId === article.id}
                onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)} />
            ))}
          </div>
        )}

        {/* Regular announcements */}
        <div className="mx-5 mt-4 flex flex-col gap-3">
          {regular.length === 0 && pinned.length === 0 && (
            <TrCard className="py-12 text-center">
              <Bell size={32} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text3, fontSize: 13 }}>Không có thông báo nào</p>
            </TrCard>
          )}
          {regular.map(article => (
            <AnnouncementCard key={article.id} article={article} c={c}
              expanded={expandedId === article.id}
              onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)} />
          ))}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function AnnouncementCard({ article, c, expanded, onToggle }: any) {
  const config = TYPE_CONFIG[article.type] || TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <TrCard as="button" hover onClick={onToggle} className="w-full text-left p-4 mb-2 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: config.color + '15' }}>
          <Icon size={18} color={config.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md" style={{ background: config.color + '15', color: config.color, fontSize: 10, fontWeight: 600 }}>
              {config.label}
            </span>
            {article.isPinned && <Pin size={11} color={c.primary} />}
          </div>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{article.title}</p>
          <p style={{ color: c.text2, fontSize: 12, marginTop: 2 }}>{article.summary}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Calendar size={11} color={c.text3} />
            <span style={{ color: c.text3, fontSize: 11 }}>{article.publishedAt.slice(0, 10)}</span>
          </div>
          {expanded && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {article.content}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {article.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md"
                    style={{ background: c.surface2, color: c.text2, fontSize: 10 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <ChevronRight size={16} color={c.text3}
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '0.2s', marginTop: 4 }} />
      </div>
    </TrCard>
  );
}