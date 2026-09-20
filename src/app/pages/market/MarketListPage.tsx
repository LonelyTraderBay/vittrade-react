import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, X, Loader2, Target, BarChart3, Layers, Activity, Filter, Calendar, Scale, Zap, MessageCircle, PieChart, Newspaper, LineChart, Unlock, Radio, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRefresh } from '../../hooks/useRefresh';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { CRYPTO_PAIRS, CryptoPair } from '../../data/mockData';
import { fmtPct } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { EmptyState } from '../../components/states/EmptyState';
import { StickyColumnHeader } from '../../components/mobile/StickyHeader';
import { MarketItem } from '../../components/trading/MarketItem';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { DiscoverMoreSection } from '../../components/bridges/ArenaPredictionBridges';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'];
const SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price_desc', label: 'Giá cao → thấp' },
  { id: 'price_asc', label: 'Giá thấp → cao' },
  { id: 'change_desc', label: 'Tăng nhiều nhất' },
  { id: 'change_asc', label: 'Giảm nhiều nhất' },
  { id: 'volume_desc', label: 'Volume lớn nhất' },
];

export function MarketListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('default');
  const [showSort, setShowSort] = useState(false);
  const [pairs, setPairs] = useState<CryptoPair[]>(CRYPTO_PAIRS);
  const { hapticSelection } = useHaptic();
  const c = useThemeColors();
  const actionToast = useActionToast();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();

  const toggleFavorite = (id: string) => {
    const pair = pairs.find(p => p.id === id);
    setPairs(ps => ps.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    actionToast.info(pair?.isFavorite ? TOAST.FAVORITE.removed(pair.baseAsset) : TOAST.FAVORITE.added(pair?.baseAsset ?? ''), { haptic: 'selection' });
  };

  const filtered = useMemo(() => {
    let list = pairs;
    if (search) list = list.filter(p => p.symbol.toLowerCase().includes(search.toLowerCase()) || p.baseAsset.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'Tất cả') list = list.filter(p => p.category === category);
    switch (sort) {
      case 'price_desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'price_asc': list = [...list].sort((a, b) => a.price - b.price); break;
      case 'change_desc': list = [...list].sort((a, b) => b.change24h - a.change24h); break;
      case 'change_asc': list = [...list].sort((a, b) => a.change24h - b.change24h); break;
      case 'volume_desc': list = [...list].sort((a, b) => b.volume24h - a.volume24h); break;
    }
    return list;
  }, [pairs, search, category, sort]);

  const {
    items: visiblePairs,
    isLoadingMore,
    isInitialLoading,
    hasMore,
    visibleCount,
    totalCount,
    sentinelRef,
  } = useInfiniteScroll({
    data: filtered,
    pageSize: 8,
    loadDelay: 350,
    resetKey: `${search}|${category}|${sort}`,
  });

  const gainers = pairs.filter(p => p.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const losers = pairs.filter(p => p.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 3);

  const { refresh, lastRefreshedLabel, refreshCount } = useRefresh();

  return (
    <PageLayout>
      <PageContent padding="compact" gap="default">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h1 style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>Thị trường</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`${routePrefix}/markets/overview`)}
                className="w-9 h-9 min-h-9 rounded-xl flex items-center justify-center"
                style={{ background: c.surface2 }}
                aria-label="Tổng quan thị trường"
              >
                <Activity size={16} color={c.text2} />
              </button>
              <button
                onClick={() => navigate(`${routePrefix}/markets/movers`)}
                className="w-9 h-9 min-h-9 rounded-xl flex items-center justify-center"
                style={{ background: c.surface2 }}
                aria-label="Biến động"
              >
                <TrendingUp size={16} color={c.text2} />
              </button>
              <button
                onClick={() => navigate(`${routePrefix}/markets/sectors`)}
                className="w-9 h-9 min-h-9 rounded-xl flex items-center justify-center"
                style={{ background: c.surface2 }}
                aria-label="Ngành"
              >
                <Layers size={16} color={c.text2} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 rounded-2xl px-4 mb-3"
            style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, height: 52, borderRadius: 14 }}>
            <Search size={21} color={c.searchPlaceholder} />
            <input
              type="text" placeholder="Tìm kiếm BTC, ETH..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.base, flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch('')}><X size={14} color={c.text3} /></button>
            )}
            <button onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1 rounded-xl px-2 py-1 min-h-9"
              style={{ background: sort !== 'default' ? 'rgba(59,130,246,0.2)' : 'transparent', color: sort !== 'default' ? '#3B82F6' : c.text3 }}>
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Sort options */}
          {showSort && (
            <TrCard className="p-3 mb-3 flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => { setSort(opt.id); setShowSort(false); hapticSelection(); }}
                  className="px-3 py-2 rounded-xl min-h-9"
                  style={{ 
                    background: sort === opt.id ? c.chipActiveBg : c.surface2, 
                    color: sort === opt.id ? c.chipActiveText : c.text2, 
                    border: `1px solid ${sort === opt.id ? c.chipActiveBorder : c.borderSolid}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>
                  {opt.label}
                </button>
              ))}
            </TrCard>
          )}

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-5 px-5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); hapticSelection(); }}
                className="shrink-0 px-3 py-2 rounded-xl min-h-9"
                style={{
                  background: category === cat ? c.chipActiveBg : c.chipBg,
                  color: category === cat ? c.chipActiveText : c.chipText,
                  border: `1px solid ${category === cat ? c.chipActiveBorder : c.chipBorder}`,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* 07D: Khám phá thêm — moved to bottom as full section */}
        </div>

        {/* Top movers (only when no search) */}
        {!search && category === 'Tất cả' && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <TrCard className="p-3" accentBorder="rgba(16,185,129,0.15)">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tăng mạnh</span>
                </div>
                {gainers.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-1">
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{p.baseAsset}</span>
                    <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{fmtPct(p.change24h)}</span>
                  </div>
                ))}
              </TrCard>
              <TrCard className="p-3" accentBorder="rgba(239,68,68,0.15)">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={14} color="#EF4444" />
                  <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Giảm mạnh</span>
                </div>
                {losers.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-1">
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{p.baseAsset}</span>
                    <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{fmtPct(p.change24h)}</span>
                  </div>
                ))}
              </TrCard>
            </div>

            {/* P1 Market tools row */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 mt-3">
              {[
                { icon: Filter, label: 'Bộ lọc', route: 'screener', color: '#3B82F6' },
                { icon: Scale, label: 'So sánh', route: 'compare', color: '#8B5CF6' },
                { icon: Calendar, label: 'Sự kiện', route: 'calendar', color: '#F59E0B' },
                { icon: Zap, label: 'Phái sinh', route: 'derivatives', color: '#EF4444' },
                { icon: MessageCircle, label: 'Tâm lý', route: 'social-sentiment', color: '#06B6D4' },
                { icon: PieChart, label: 'Danh mục', route: 'portfolio-tracker', color: '#10B981' },
                { icon: Newspaper, label: 'Tin tức', route: 'news', color: '#64748B' },
                { icon: LineChart, label: 'Phân tích', route: 'advanced-charts', color: '#0EA5E9' },
                { icon: Unlock, label: 'Unlock', route: 'unlocks', color: '#A855F7' },
                { icon: Radio, label: 'Tín hiệu', route: 'signals', color: '#F97316' },
                { icon: GitBranch, label: 'Tương quan', route: 'correlations', color: '#14B8A6' },
              ].map(tool => (
                <button
                  key={tool.route}
                  onClick={() => { navigate(`${routePrefix}/markets/${tool.route}`); hapticSelection(); }}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl min-h-9"
                  style={{ background: `${tool.color}08`, border: `1px solid ${tool.color}20` }}
                >
                  <tool.icon size={14} color={tool.color} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Column header — STICKY */}
        <StickyColumnHeader
          columns={[
            { label: 'Cặp giao dịch', align: 'left' },
            { label: 'Biểu đồ', align: 'center' },
            { label: 'Giá / Thay đổi', align: 'right' },
          ]}
        />

        {/* List — with infinite scroll */}
        <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
          <RefreshableSkeletonList
            isLoading={isInitialLoading}
            rows={8}
            isEmpty={filtered.length === 0}
            emptyState={
              <EmptyState
                icon={Search}
                title={search ? `Không tìm thấy "${search}"` : 'Không có kết quả'}
                subtitle="Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác"
                ctaLabel="Xóa bộ lọc"
                onCta={() => { setSearch(''); setCategory('Tất cả'); setSort('default'); }}
              />
            }
            lastRefreshedLabel={lastRefreshedLabel}
            refreshCount={refreshCount}
          >
            <div className="contents">
              {visiblePairs.map(pair => (
                <MarketItem key={pair.id} pair={pair} onFavoriteToggle={toggleFavorite} />
              ))}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2
                    size={14}
                    color="#3B82F6"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Đang tải thêm...</span>
                </div>
              )}

              {/* Infinite scroll sentinel */}
              {hasMore && !isLoadingMore && (
                <div ref={sentinelRef} className="h-4" aria-hidden="true" />
              )}

              {/* End of list */}
              {!hasMore && (
                <div className="flex items-center justify-center py-5 gap-2">
                  <div className="w-8 h-px" style={{ background: c.borderSolid }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    Hiển thị {visibleCount}/{totalCount} cặp giao dịch
                  </span>
                  <div className="w-8 h-px" style={{ background: c.borderSolid }} />
                </div>
              )}
            </div>
          </RefreshableSkeletonList>
        </PullToRefresh>

        {/* ─── 07D: Khám phá thêm — Safe Bridge Section ─── */}
        <DiscoverMoreSection />
      </PageContent>
    </PageLayout>
  );
}