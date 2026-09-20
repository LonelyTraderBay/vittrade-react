import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, X, SlidersHorizontal, BarChart3, Clock,
  TrendingUp, Sparkles, Users, Target, Filter,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  PREDICTION_EVENTS,
  PREDICTION_CATEGORIES,
  fmtVolume,
  timeRemaining,
} from '../../data/predictionMockData';
import type { PredictionEvent } from '../../data/predictionMockData';
import { φ, φRadius } from '../../utils/golden';
import { TOAST } from '../../data/toastMessages';

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'liquidity', label: 'Liquidity', icon: BarChart3 },
  { id: 'volume', label: 'Volume', icon: BarChart3 },
  { id: 'newest', label: 'Newest', icon: Sparkles },
  { id: 'ending', label: 'Ending Soon', icon: Clock },
  { id: 'competitive', label: 'Competitive', icon: Target },
] as const;

const STATUS_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['id'];
type StatusFilter = typeof STATUS_FILTERS[number]['id'];

function sortEvents(events: PredictionEvent[], sort: SortOption): PredictionEvent[] {
  switch (sort) {
    case 'trending':
      return [...events].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    case 'liquidity':
      return [...events].sort((a, b) => b.liquidity - a.liquidity);
    case 'volume':
      return [...events].sort((a, b) => b.volume24h - a.volume24h);
    case 'newest':
      return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'ending':
      return [...events].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    case 'competitive':
      return [...events].sort((a, b) => {
        const aSpread = Math.abs(a.outcomes[0].chance - 50);
        const bSpread = Math.abs(b.outcomes[0].chance - 50);
        return aSpread - bSpread;
      });
    default:
      return events;
  }
}

/* ─── Search Result Item ─── */
function SearchResultItem({ event }: { event: PredictionEvent }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const topOutcome = event.outcomes[0];
  const remaining = timeRemaining(event.endDate);
  const isResolved = event.status === 'resolved';

  return (
    <TrCard hover as="button"
      onClick={() => { hapticSelection(); navigate(`${prefix}/markets/predictions/event/${event.id}`); }}
      className="p-4 w-full text-left">
      <div className="flex items-start gap-3">
        {/* Probability circle */}
        <div
          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{
            background: isResolved
              ? 'rgba(100,116,139,0.12)'
              : topOutcome.chance >= 50
                ? 'rgba(16,185,129,0.12)'
                : 'rgba(239,68,68,0.12)',
          }}
        >
          <span
            style={{
              color: isResolved
                ? '#64748B'
                : topOutcome.chance >= 50
                  ? c.buy
                  : c.sell,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {topOutcome.chance}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>
            {event.title}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 9, fontWeight: 600 }}
            >
              {event.category}
            </span>
            {isResolved && (
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(100,116,139,0.12)', color: '#64748B', fontSize: 9, fontWeight: 600 }}
              >
                RESOLVED
              </span>
            )}
            <span style={{ color: c.text3, fontSize: 10 }}>Vol {fmtVolume(event.volume24h)}</span>
            <span style={{ color: c.text3, fontSize: 10 }}>{remaining}</span>
            {event.change24h !== 0 && (
              <span style={{ color: event.change24h > 0 ? c.buy : c.sell, fontSize: 16, fontWeight: 600 }}>
                {event.change24h > 0 ? '+' : ''}{event.change24h}%
              </span>
            )}
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ─── Main Page ─── */
export function PredictionsSearchPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('trending');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const hasActiveFilters = sort !== 'trending' || statusFilter !== 'active' || selectedCategory !== null;

  const results = useMemo(() => {
    let events = [...PREDICTION_EVENTS];

    // Status filter
    if (statusFilter !== 'all') {
      events = events.filter(e => e.status === statusFilter);
    }

    // Category filter
    if (selectedCategory) {
      events = events.filter(e => e.category === selectedCategory);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    }

    // Sort
    events = sortEvents(events, sort);

    return events;
  }, [search, sort, statusFilter, selectedCategory]);

  const clearFilters = () => {
    setSort('trending');
    setStatusFilter('active');
    setSelectedCategory(null);
    setSearch('');
    hapticSelection();
    actionToast.info(TOAST.PREDICTIONS.FILTERS_CLEARED);
  };

  return (
    <PageLayout>
      <Header title="Search Events" subtitle="Tìm kiếm · Prediction" back />

      <div className="flex-1">
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải kết quả"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => setHasError(false)}
          />
        ) : (
        <PageContent>
        {/* Search bar */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            height: 48,
            borderRadius: φRadius.md,
          }}
        >
          <Search size={18} color={c.searchPlaceholder} />
          <input
            type="text"
            placeholder="Search by title, tag, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: c.text1,
              fontSize: 15,
              flex: 1,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} color={c.text3} />
            </button>
          )}
          <button
            onClick={() => { setShowFilters(!showFilters); hapticSelection(); }}
            className="flex items-center justify-center rounded-lg p-1.5"
            style={{
              background: showFilters ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: showFilters ? c.primary : c.text3,
            }}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <TrCard className="p-4">
            {/* Sort */}
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Sort by</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {SORT_OPTIONS.map(opt => {
                const active = sort === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSort(opt.id); hapticSelection(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{
                      background: active ? c.chipActiveBg : c.surface2,
                      color: active ? c.chipActiveText : c.text2,
                      border: `1px solid ${active ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon size={11} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Status */}
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Event Status</p>
            <div className="flex gap-2 mb-4">
              {STATUS_FILTERS.map(sf => {
                const active = statusFilter === sf.id;
                return (
                  <button
                    key={sf.id}
                    onClick={() => { setStatusFilter(sf.id); hapticSelection(); }}
                    className="flex-1 py-2 rounded-xl"
                    style={{
                      background: active ? c.chipActiveBg : c.surface2,
                      color: active ? c.chipActiveText : c.text2,
                      border: `1px solid ${active ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      textAlign: 'center',
                    }}
                  >
                    {sf.label}
                  </button>
                );
              })}
            </div>

            {/* Category */}
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Category</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDICTION_CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(active ? null : cat); hapticSelection(); }}
                    className="px-3 py-1.5 rounded-lg"
                    style={{
                      background: active ? c.primaryAlpha12 : c.surface2,
                      color: active ? c.primary : c.text3,
                      fontSize: 11,
                      fontWeight: 600,
                      border: `1px solid ${active ? c.primaryAlpha12 : c.borderSolid}`,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                style={{
                  background: c.sellAlpha10,
                  border: `1px solid ${c.sellAlpha15}`,
                  color: c.sell,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <X size={13} />
                Clear all filters
              </button>
            )}
          </TrCard>
        )}

        {/* Results count */}
        <p style={{ color: c.text3, fontSize: 11 }}>
          {results.length} event{results.length !== 1 ? 's' : ''} found
        </p>

        {/* Results */}
        {results.length === 0 ? (
          <EmptyState
            icon={Search}
            title={search ? `No results for "${search}"` : 'No events match filters'}
            subtitle="Try adjusting your search or filter criteria"
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {results.map(event => (
              <SearchResultItem key={event.id} event={event} />
            ))}
          </div>
        )}
        </PageContent>
        )}
      </div>
    </PageLayout>
  );
}