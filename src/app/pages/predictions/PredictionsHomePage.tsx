import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, X, Info, TrendingUp, Clock, Flame, Zap,
  BarChart3, Target, Users, ChevronRight, Sparkles, Briefcase,
  Gamepad2, Shield,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { SkeletonCard } from '../../components/states/SkeletonBlock';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  PREDICTION_EVENTS,
  PREDICTION_CATEGORIES,
  fmtVolume,
  timeRemaining,
} from '../../data/predictionMockData';
import type { PredictionEvent } from '../../data/predictionMockData';
import { PREDICTION_POSITIONS } from '../../data/predictionMockData';
import { φ, φRadius, φIcon } from '../../utils/golden';

const FILTER_TABS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'popular', label: 'Popular', icon: Users },
  { id: 'liquid', label: 'Liquid', icon: BarChart3 },
  { id: 'ending', label: 'Ending Soon', icon: Clock },
  { id: 'competitive', label: 'Competitive', icon: Target },
] as const;

type FilterTab = typeof FILTER_TABS[number]['id'];

function applyFilter(events: PredictionEvent[], filter: FilterTab): PredictionEvent[] {
  const active = events.filter(e => e.status === 'active');
  switch (filter) {
    case 'trending':
      return [...active].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    case 'new':
      return [...active].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'popular':
      return [...active].sort((a, b) => b.participants - a.participants);
    case 'liquid':
      return [...active].sort((a, b) => b.liquidity - a.liquidity);
    case 'ending':
      return [...active].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    case 'competitive': {
      // Most competitive = outcomes closest to 50/50
      return [...active].sort((a, b) => {
        const aSpread = Math.abs(a.outcomes[0].chance - 50);
        const bSpread = Math.abs(b.outcomes[0].chance - 50);
        return aSpread - bSpread;
      });
    }
    default:
      return active;
  }
}

/* ─── Market Card ─── */
function PredictionCard({ event, onTap }: { event: PredictionEvent; onTap: () => void }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const topTwo = event.outcomes.slice(0, 2);
  const isMulti = event.outcomes.length > 2;
  const remaining = timeRemaining(event.endDate);
  const isResolved = event.status === 'resolved';

  return (
    <TrCard hover className="p-4" onClick={onTap}>
      {/* Tags row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded-md"
          style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 10, fontWeight: 600 }}
        >
          {event.category}
        </span>
        {event.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md"
            style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 500 }}
          >
            {tag}
          </span>
        ))}
        {event.isNew && (
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}
          >
            NEW
          </span>
        )}
        {event.isTrending && (
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ background: c.warnAlpha10, color: c.warn, fontSize: 10, fontWeight: 600 }}
          >
            HOT
          </span>
        )}
      </div>

      {/* Title */}
      <p
        style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, lineHeight: 1.4, marginBottom: 10 }}
      >
        {event.title}
      </p>

      {/* Probability bar (for binary events) */}
      {!isMulti && topTwo.length === 2 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: topTwo[0].color, fontSize: 12, fontWeight: 700 }}>
              {topTwo[0].label} {topTwo[0].chance}%
            </span>
            <span style={{ color: topTwo[1].color, fontSize: 12, fontWeight: 700 }}>
              {topTwo[1].label} {topTwo[1].chance}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
            <motion.div
              className="h-full rounded-l-full"
              style={{ background: topTwo[0].color }}
              initial={{ width: '50%' }}
              animate={{ width: `${topTwo[0].chance}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: topTwo[1].color }}
              initial={{ width: '50%' }}
              animate={{ width: `${topTwo[1].chance}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Multi-outcome display */}
      {isMulti && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.outcomes.slice(0, 3).map(o => (
            <div
              key={o.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: o.color + '12', border: `1px solid ${o.color}25` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: o.color }} />
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{o.label}</span>
              <span style={{ color: o.color, fontSize: 11, fontWeight: 700 }}>{o.chance}%</span>
            </div>
          ))}
          {event.outcomes.length > 3 && (
            <span style={{ color: c.text3, fontSize: 11, lineHeight: '28px' }}>
              +{event.outcomes.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <BarChart3 size={11} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>Vol: {fmtVolume(event.volume24h)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={11} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>{event.participants.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>{remaining}</span>
        </div>
        {event.change24h !== 0 && (
          <div className="flex items-center gap-0.5 ml-auto">
            <TrendingUp
              size={11}
              color={event.change24h > 0 ? c.buy : c.sell}
              style={{ transform: event.change24h < 0 ? 'rotate(180deg)' : 'none' }}
            />
            <span style={{ color: event.change24h > 0 ? c.buy : c.sell, fontSize: 11, fontWeight: 600 }}>
              {event.change24h > 0 ? '+' : ''}{event.change24h}%
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isResolved ? (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticSelection();
              actionToast.success(`Bought YES on "${event.title.slice(0, 30)}..."`);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: c.buy,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Yes {topTwo[0]?.chance}%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticSelection();
              actionToast.success(`Bought NO on "${event.title.slice(0, 30)}..."`);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: c.sell,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            No {topTwo[1]?.chance}%
          </button>
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{
            background: event.resolvedOutcome === 'Yes' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${event.resolvedOutcome === 'Yes' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          <span style={{
            color: event.resolvedOutcome === 'Yes' ? c.buy : c.sell,
            fontSize: 13,
            fontWeight: 700,
          }}>
            Resolved: {event.resolvedOutcome}
          </span>
        </div>
      )}
    </TrCard>
  );
}

/* ─── Loading Skeleton ─── */
function PredictionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

/* ─── Main Page ─── */
export function PredictionsHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 500 });

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('trending');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const filteredEvents = useMemo(() => {
    let events = applyFilter(PREDICTION_EVENTS, activeFilter);
    if (activeCategory) {
      events = events.filter(e => e.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return events;
  }, [activeFilter, activeCategory, search]);

  const breakingMovers = [...PREDICTION_EVENTS]
    .filter(e => e.status === 'active')
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 3);

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Prediction Markets"
        subtitle="Thị trường dự đoán"
        back
        right={
          <button
            onClick={() => {
              hapticSelection();
              navigate(`${prefix}/markets/predictions/search`);
            }}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.searchBg,
              border: `1px solid ${c.border}`,
            }}
            aria-label="Tìm kiếm"
          >
            <Search size={18} color={c.text1} strokeWidth={1.8} />
          </button>
        }
      />

      <PullToRefresh
        onRefresh={refresh}
        lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount}
        className="flex-1 pb-8"
      >
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải dữ liệu"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : (
        <PageContent>
        {/* ─── Search bar ─── */}
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
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
        </div>

        {/* ─── Filter Tabs ─── */}
        <div className="flex gap-2 -mx-5 px-5 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map(tab => {
            const active = activeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveFilter(tab.id); hapticSelection(); }}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl"
                style={{
                  background: active ? c.chipActiveBg : c.chipBg,
                  border: `1px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                  color: active ? c.chipActiveText : c.chipText,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Category Chips ─── */}
        <div className="flex gap-2 -mx-5 px-5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveCategory(null); hapticSelection(); }}
            className="shrink-0 px-3 py-1.5 rounded-lg"
            style={{
              background: !activeCategory ? c.primaryAlpha12 : c.surface2,
              color: !activeCategory ? c.primary : c.text3,
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${!activeCategory ? 'rgba(59,130,246,0.3)' : c.borderSolid}`,
            }}
          >
            All
          </button>
          {PREDICTION_CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(active ? null : cat); hapticSelection(); }}
                className="shrink-0 px-3 py-1.5 rounded-lg"
                style={{
                  background: active ? c.primaryAlpha12 : c.surface2,
                  color: active ? c.primary : c.text3,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : c.borderSolid}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ─── Breaking Movers CTA ─── */}
        {!search && (
          <div>
            {/* Portfolio CTA */}
            <TrCard
              hover
              as="button"
              onClick={() => navigate(`${prefix}/profile/predictions`)}
              className="w-full p-3.5 mb-3"
              accentBorder="rgba(139,92,246,0.2)"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}
                >
                  <Briefcase size={18} color="#8B5CF6" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                    My Predictions
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {PREDICTION_POSITIONS.filter(p => p.status === 'open').length} open positions
                  </p>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </div>
            </TrCard>

            {/* Breaking movers CTA */}
            <TrCard
              hover
              as="button"
              onClick={() => navigate(`${prefix}/markets/predictions/breaking`)}
              className="w-full p-3.5"
              accentBorder="rgba(245,158,11,0.2)"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)' }}
                >
                  <Zap size={18} color="#F59E0B" />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                    Breaking movers (24h)
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {breakingMovers.slice(0, 2).map(m => (
                      <span key={m.id} style={{ color: m.change24h > 0 ? c.buy : c.sell, fontSize: 10, fontWeight: 600 }}>
                        {m.change24h > 0 ? '+' : ''}{m.change24h}%
                      </span>
                    ))}
                    <span style={{ color: c.text3, fontSize: 10 }}>
                      & {breakingMovers.length - 2}+ more
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </div>
            </TrCard>
          </div>
        )}

        {/* ─── 09B: Arena Bridge — "Thử thách cùng chủ đề" ─── */}
        {!search && !isLoading && (
          <TrCard hover as="button"
            onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
            className="w-full p-4 text-left"
            accentBorder="rgba(245,158,11,0.18)">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))' }}>
                <Gamepad2 size={18} color="#F59E0B" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    Thử thách cùng chủ đề
                  </p>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ background: c.warnAlpha10, color: c.warn, fontSize: 8, fontWeight: 700 }}>
                    Arena Points only
                  </span>
                </div>
                <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginBottom: 4 }}>
                  Khám phá các room social points-only trong Open Arena
                </p>
                <span style={{ color: c.warn, fontSize: φ.xs, fontWeight: 600 }}>
                  Xem Arena
                </span>
              </div>
              <ChevronRight size={14} color="#F59E0B" />
            </div>
          </TrCard>
        )}

        {/* ─── Market Cards ─── */}
        {isLoading ? (
          <PredictionSkeleton />
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={40} color={c.text3} style={{ opacity: 0.4 }} />
            <p style={{ color: c.text2, fontSize: 14, fontWeight: 600, marginTop: 12 }}>
              No events found
            </p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEvents.map(event => (
              <PredictionCard
                key={event.id}
                event={event}
                onTap={() => {
                  hapticSelection();
                  navigate(`${prefix}/markets/predictions/event/${event.id}`);
                }}
              />
            ))}
          </div>
        )}

        </PageContent>
        )}
      </PullToRefresh>
    </PageLayout>
  );
}