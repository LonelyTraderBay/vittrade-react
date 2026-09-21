/**
 * ══════════════════════════════════════════════════════════
 *  WEB NEWS & ANNOUNCEMENTS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/news
 *
 *  News hub — Platform updates, market insights, announcements
 *  - Featured articles
 *  - Category filtering (All, Platform, Market, Security, Events)
 *  - Search functionality
 *  - Article cards với thumbnails
 *  - Read/Unread status
 *  - Importance badges (Critical, Important, Info)
 *
 *  Guidelines compliance:
 *  - §15.1: Neutral tone, no hype
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout
 *  - WEB_FONT.SIZE tokens
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Newspaper,
  TrendingUp,
  Shield,
  Bell,
  Calendar,
  Tag,
  Search,
  Filter,
  Clock,
  Eye,
  Bookmark,
  Share2,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertCircle,
  Sparkles,
  LineChart,
  Megaphone,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type NewsCategory = 'all' | 'platform' | 'market' | 'security' | 'events' | 'product';
type NewsPriority = 'critical' | 'important' | 'info';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  priority?: NewsPriority;
  publishedDate: string;
  readTime: string;
  isRead: boolean;
  isFeatured?: boolean;
  thumbnail?: string;
  tags: string[];
}

const CATEGORIES: { id: NewsCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all', label: 'Tất cả', icon: Newspaper, color: '#94A3B8' },
  { id: 'platform', label: 'Nền tảng', icon: Megaphone, color: '#3B82F6' },
  { id: 'market', label: 'Thị trường', icon: LineChart, color: '#10B981' },
  { id: 'security', label: 'Bảo mật', icon: Shield, color: '#EF4444' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, color: '#8B5CF6' },
  { id: 'product', label: 'Sản phẩm', icon: Sparkles, color: '#F59E0B' },
];

const PRIORITY_CONFIG: Record<NewsPriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'Quan trọng', color: '#EF4444', bg: '#EF444415' },
  important: { label: 'Chú ý', color: '#F59E0B', bg: '#F59E0B15' },
  info: { label: 'Thông tin', color: '#3B82F6', bg: '#3B82F615' },
};

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Nâng cấp hệ thống bảo mật — Bắt buộc kích hoạt 2FA',
    excerpt:
      'Từ 20/03/2026, tất cả tài khoản phải bật 2FA để đảm bảo an toàn. Hướng dẫn chi tiết trong bài viết.',
    category: 'security',
    priority: 'critical',
    publishedDate: '2026-03-13',
    readTime: '3 phút',
    isRead: false,
    isFeatured: true,
    tags: ['2FA', 'Bảo mật', 'Bắt buộc'],
  },
  {
    id: 'n2',
    title: 'Bitcoin vượt mốc $75,000 — Phân tích xu hướng thị trường Q1/2026',
    excerpt: 'Bitcoin tăng 25% trong tháng 3. Phân tích kỹ thuật và dự báo xu hướng trong quý 2.',
    category: 'market',
    priority: 'info',
    publishedDate: '2026-03-12',
    readTime: '5 phút',
    isRead: false,
    isFeatured: true,
    tags: ['Bitcoin', 'Phân tích', 'Q1 2026'],
  },
  {
    id: 'n3',
    title: 'Ra mắt VIP Program mới — Phí giao dịch giảm tới 70%',
    excerpt:
      'Chương trình VIP 6 tier với hoa hồng lifetime và quyền lợi đặc biệt cho trader chuyên nghiệp.',
    category: 'platform',
    priority: 'important',
    publishedDate: '2026-03-10',
    readTime: '4 phút',
    isRead: true,
    isFeatured: false,
    tags: ['VIP', 'Phí', 'Trading'],
  },
  {
    id: 'n4',
    title: 'Sự kiện AMA với CEO — Hỏi đáp trực tiếp ngày 25/03',
    excerpt: 'Tham gia buổi AMA với CEO để thảo luận về roadmap 2026 và các sản phẩm mới.',
    category: 'events',
    priority: 'info',
    publishedDate: '2026-03-09',
    readTime: '2 phút',
    isRead: false,
    isFeatured: false,
    tags: ['AMA', 'CEO', 'Sự kiện'],
  },
  {
    id: 'n5',
    title: 'Cập nhật Copy Trading 2.0 — Auto-Rebalance & Risk Control',
    excerpt: 'Tính năng tự động cân bằng danh mục và kiểm soát rủi ro nâng cao cho Copy Trading.',
    category: 'product',
    priority: 'important',
    publishedDate: '2026-03-08',
    readTime: '6 phút',
    isRead: true,
    isFeatured: false,
    tags: ['Copy Trading', 'Cập nhật', 'Tính năng mới'],
  },
  {
    id: 'n6',
    title: 'Ethereum Merge Anniversary — Nhìn lại 1 năm sau Merge',
    excerpt: 'Đánh giá tác động của Ethereum Merge sau 1 năm: Giảm phát, staking, và hệ sinh thái.',
    category: 'market',
    publishedDate: '2026-03-07',
    readTime: '7 phút',
    isRead: true,
    isFeatured: false,
    tags: ['Ethereum', 'Merge', 'Staking'],
  },
  {
    id: 'n7',
    title: 'Bảo trì hệ thống định kỳ — 15/03, 2:00 - 4:00 AM',
    excerpt:
      'Hệ thống sẽ tạm ngưng 2 giờ để nâng cấp máy chủ. Giao dịch không khả dụng trong thời gian này.',
    category: 'platform',
    priority: 'important',
    publishedDate: '2026-03-05',
    readTime: '1 phút',
    isRead: true,
    isFeatured: false,
    tags: ['Bảo trì', 'Thông báo'],
  },
  {
    id: 'n8',
    title: 'Thêm 15 token mới — Listing Q1/2026',
    excerpt:
      'Danh sách 15 token mới được niêm yết trong tháng 3, bao gồm các dự án DeFi và Layer-2.',
    category: 'product',
    publishedDate: '2026-03-03',
    readTime: '4 phút',
    isRead: true,
    isFeatured: false,
    tags: ['Listing', 'Token mới', 'DeFi'],
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function ArticleCard({ article }: { article: NewsArticle }) {
  const c = useThemeColors();
  const category = CATEGORIES.find((cat) => cat.id === article.category);
  const CategoryIcon = category?.icon || Newspaper;

  return (
    <div
      className="flex gap-4 p-4 rounded-xl transition-all cursor-pointer"
      style={{
        background: article.isRead ? c.bg : c.surface,
        border: `1px solid ${article.isRead ? c.divider : c.border}`,
        opacity: article.isRead ? 0.7 : 1,
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: 120,
          height: 90,
          background: `linear-gradient(135deg, ${category?.color}40, ${category?.color}20)`,
        }}
      >
        <CategoryIcon size={32} color={category?.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          {article.priority && (
            <span
              className="px-2 py-0.5 rounded-md flex-shrink-0"
              style={{
                background: PRIORITY_CONFIG[article.priority].bg,
                color: PRIORITY_CONFIG[article.priority].color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {PRIORITY_CONFIG[article.priority].label}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded-md flex-shrink-0"
            style={{
              background: `${category?.color}15`,
              color: category?.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {category?.label}
          </span>
        </div>

        <h3
          className="mb-2"
          style={{
            color: c.text1,
            fontSize: WEB_FONT.SIZE.BODY,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {article.title}
        </h3>

        <p
          className="mb-3"
          style={{
            color: c.text2,
            fontSize: WEB_FONT.SIZE.CAPTION,
            lineHeight: 1.5,
          }}
        >
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-4"
            style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}
          >
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(article.publishedDate).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.readTime}
            </span>
            {!article.isRead && (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: '#3B82F615',
                  color: '#3B82F6',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Mới
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: c.text3,
              }}
            >
              <Bookmark size={16} />
            </button>
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: c.text3,
              }}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebNewsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = NEWS_ARTICLES.filter((article) => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unreadCount = NEWS_ARTICLES.filter((a) => !a.isRead).length;
  const featuredArticles = NEWS_ARTICLES.filter((a) => a.isFeatured);

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (280px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 280,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H2,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Tin tức
            </h2>
            {unreadCount > 0 && (
              <span
                className="px-2 py-1 rounded-full"
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="p-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <Search size={16} color={c.text3} />
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="px-4 pb-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Danh mục
            </div>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const count = NEWS_ARTICLES.filter(
                  (a) => category.id === 'all' || a.category === category.id,
                ).length;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: isActive ? `${category.color}15` : 'transparent',
                      color: isActive ? category.color : c.text2,
                      fontWeight: isActive ? 600 : 500,
                      fontSize: WEB_FONT.SIZE.CAPTION,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      {category.label}
                    </div>
                    <span
                      style={{
                        color: isActive ? category.color : c.text3,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 pb-4 mt-auto">
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 8 }}>
                Thống kê
              </div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>Chưa đọc</span>
                <span
                  style={{ color: '#EF4444', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}
                >
                  {unreadCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  Tổng bài viết
                </span>
                <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                  {NEWS_ARTICLES.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-8">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && selectedCategory === 'all' && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} color="#F59E0B" />
                  <h3
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.SIZE.H3,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Nổi bật
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* All Articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.H3,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {selectedCategory === 'all'
                    ? 'Tất cả bài viết'
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </h3>
                <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  {filteredArticles.length} bài viết
                </span>
              </div>

              {filteredArticles.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredArticles
                    .filter((a) => !(selectedCategory === 'all' && a.isFeatured))
                    .map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-16 rounded-xl"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Newspaper size={48} color={c.text3} className="mb-4" />
                  <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, marginBottom: 8 }}>
                    Không tìm thấy bài viết
                  </div>
                  <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                    Thử thay đổi danh mục hoặc từ khóa tìm kiếm
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
