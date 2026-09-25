import type { Dispatch, ReactNode, RefCallback, SetStateAction } from 'react';
import {
  Activity,
  Calendar,
  Filter,
  GitBranch,
  Layers,
  LineChart,
  Loader2,
  MessageCircle,
  Newspaper,
  PieChart,
  Radio,
  Scale,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { RefreshableSkeletonList } from '@/shared/ui/RefreshableSkeletonList';
import { TrCard } from '@/shared/ui/TrCard';
import { PullToRefresh } from '@/shared/ui/PullToRefresh';
import { StickyColumnHeader } from '@/shared/ui/StickyHeader';
import { MarketItem } from '@/features/market/components/MarketItem';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtPct } from '@/shared/lib/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '@/shared/theme/legacyTypography';
import type { MarketPair } from '@/features/market';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'];
const SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price_desc', label: 'Giá cao → thấp' },
  { id: 'price_asc', label: 'Giá thấp → cao' },
  { id: 'change_desc', label: 'Tăng nhiều nhất' },
  { id: 'change_asc', label: 'Giảm nhiều nhất' },
  { id: 'volume_desc', label: 'Volume lớn nhất' },
];

export interface MarketListHeaderProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  showSort: boolean;
  setShowSort: Dispatch<SetStateAction<boolean>>;
}

export function MarketListHeader({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  showSort,
  setShowSort,
}: MarketListHeaderProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>
          Thị trường
        </h1>
        <div className="flex items-center gap-2">
          <HeaderAction
            label="Tổng quan thị trường"
            onClick={() => navigate(`${routePrefix}/markets/overview`)}
          >
            <Activity size={16} color={c.text2} />
          </HeaderAction>
          <HeaderAction label="Biến động" onClick={() => navigate(`${routePrefix}/markets/movers`)}>
            <TrendingUp size={16} color={c.text2} />
          </HeaderAction>
          <HeaderAction label="Ngành" onClick={() => navigate(`${routePrefix}/markets/sectors`)}>
            <Layers size={16} color={c.text2} />
          </HeaderAction>
        </div>
      </div>

      <div
        className="mb-3 flex items-center gap-3 rounded-2xl px-4"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${c.searchBorder}`,
          height: 52,
          borderRadius: 14,
        }}
      >
        <Search size={21} color={c.searchPlaceholder} />
        <input
          type="text"
          placeholder="Tìm kiếm BTC, ETH..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: c.text1,
            fontSize: FONT_SCALE.base,
            flex: 1,
          }}
        />
        {search && (
          <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setSearch('')}>
            <X size={14} color={c.text3} />
          </button>
        )}
        <button
          type="button"
          aria-label="Mở bộ sắp xếp"
          onClick={() => setShowSort((value) => !value)}
          className="flex min-h-9 items-center gap-1 rounded-xl px-2 py-1"
          style={{
            background: sort !== 'default' ? 'rgba(59,130,246,0.2)' : 'transparent',
            color: sort !== 'default' ? '#3B82F6' : c.text3,
          }}
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {showSort && (
        <TrCard className="mb-3 flex flex-wrap gap-2 p-3">
          {SORT_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => {
                setSort(option.id);
                setShowSort(false);
                hapticSelection();
              }}
              className="min-h-9 rounded-xl px-3 py-2"
              style={{
                background: sort === option.id ? c.chipActiveBg : c.surface2,
                color: sort === option.id ? c.chipActiveText : c.text2,
                border: `1px solid ${sort === option.id ? c.chipActiveBorder : c.borderSolid}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            >
              {option.label}
            </button>
          ))}
        </TrCard>
      )}

      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => {
              setCategory(item);
              hapticSelection();
            }}
            className="shrink-0 rounded-xl px-3 py-2 min-h-9"
            style={{
              background: category === item ? c.chipActiveBg : c.chipBg,
              color: category === item ? c.chipActiveText : c.chipText,
              border: `1px solid ${category === item ? c.chipActiveBorder : c.chipBorder}`,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const c = useThemeColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 min-h-9 items-center justify-center rounded-xl"
      style={{ background: c.surface2 }}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function MarketTopMovers({
  pairs,
  search,
  category,
}: {
  pairs: MarketPair[];
  search: string;
  category: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const gainers = pairs
    .filter((pair) => pair.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 3);
  const losers = pairs
    .filter((pair) => pair.change24h < 0)
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, 3);
  const tools = [
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
  ];

  if (search || category !== 'Tất cả') return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <MoverCard
          title="Tăng mạnh"
          color="#10B981"
          icon={<TrendingUp size={14} />}
          items={gainers}
        />
        <MoverCard
          title="Giảm mạnh"
          color="#EF4444"
          icon={<TrendingDown size={14} />}
          items={losers}
        />
      </div>
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.route}
            onClick={() => {
              navigate(`${routePrefix}/markets/${tool.route}`);
              hapticSelection();
            }}
            className="flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: `${tool.color}08`, border: `1px solid ${tool.color}20` }}
          >
            <tool.icon size={14} color={tool.color} />
            <span
              style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}
            >
              {tool.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MoverCard({
  title,
  color,
  icon,
  items,
}: {
  title: string;
  color: string;
  icon: ReactNode;
  items: MarketPair[];
}) {
  const c = useThemeColors();
  return (
    <TrCard className="p-3" accentBorder={`${color}26`}>
      <div className="mb-2 flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span style={{ color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
          {title}
        </span>
      </div>
      {items.map((pair) => (
        <div key={pair.id} className="flex items-center justify-between py-1">
          <span
            style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}
          >
            {pair.baseAsset}
          </span>
          <span style={{ color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtPct(pair.change24h)}
          </span>
        </div>
      ))}
    </TrCard>
  );
}

export function MarketPairsList({
  visiblePairs,
  favoritePairIds,
  onFavoriteToggle,
  favoriteDisabled,
  isMarketLoading,
  isInitialLoading,
  isMarketError,
  filteredLength,
  search,
  lastRefreshedLabel,
  refreshCount,
  refresh,
  refetchMarketPairs,
  clearFilters,
  isLoadingMore,
  hasMore,
  visibleCount,
  totalCount,
  sentinelRef,
}: {
  visiblePairs: MarketPair[];
  favoritePairIds: ReadonlySet<string>;
  onFavoriteToggle: (id: string) => void | Promise<void>;
  favoriteDisabled: boolean;
  isMarketLoading: boolean;
  isInitialLoading: boolean;
  isMarketError: boolean;
  filteredLength: number;
  search: string;
  lastRefreshedLabel: string;
  refreshCount: number;
  refresh: () => Promise<void>;
  refetchMarketPairs: () => void;
  clearFilters: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  visibleCount: number;
  totalCount: number;
  sentinelRef: RefCallback<HTMLDivElement>;
}) {
  const c = useThemeColors();
  return (
    <>
      <StickyColumnHeader
        columns={[
          { label: 'Cặp giao dịch', align: 'left' },
          { label: 'Biểu đồ', align: 'center' },
          { label: 'Giá / Thay đổi', align: 'right' },
        ]}
      />
      <PullToRefresh
        onRefresh={refresh}
        lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount}
      >
        <RefreshableSkeletonList
          isLoading={isMarketLoading || isInitialLoading}
          rows={8}
          isEmpty={isMarketError || filteredLength === 0}
          emptyState={
            isMarketError ? (
              <ErrorState onAction={refetchMarketPairs} />
            ) : (
              <EmptyState
                icon={Search}
                title={search ? `Không tìm thấy "${search}"` : 'Không có kết quả'}
                subtitle="Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác"
                ctaLabel="Xóa bộ lọc"
                onCta={clearFilters}
              />
            )
          }
          lastRefreshedLabel={lastRefreshedLabel}
          refreshCount={refreshCount}
        >
          <div className="contents">
            {visiblePairs.map((pair) => (
              <MarketItem
                key={pair.id}
                pair={pair}
                isFavorite={favoritePairIds.has(pair.id)}
                onFavoriteToggle={onFavoriteToggle}
                favoriteDisabled={favoriteDisabled}
              />
            ))}
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2
                  size={14}
                  color="#3B82F6"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Đang tải thêm...</span>
              </div>
            )}
            {hasMore && !isLoadingMore && (
              <div ref={sentinelRef} className="h-4" aria-hidden="true" />
            )}
            {!hasMore && (
              <div className="flex items-center justify-center gap-2 py-5">
                <div className="h-px w-8" style={{ background: c.borderSolid }} />
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  Hiển thị {visibleCount}/{totalCount} cặp giao dịch
                </span>
                <div className="h-px w-8" style={{ background: c.borderSolid }} />
              </div>
            )}
          </div>
        </RefreshableSkeletonList>
      </PullToRefresh>
    </>
  );
}
