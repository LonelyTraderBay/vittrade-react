/**
 * ══════════════════════════════════════════════════════════
 *  Unified Search Page — §12.1 / §12.2
 * ══════════════════════════════════════════════════════════
 *
 *  Search across ALL modules with SEGMENTED results:
 *  - Prediction Events (market-based, USDT)
 *  - Arena Modes (creator-driven, Points only)
 *  - Arena Rooms (live rooms, Points only)
 *  - Creators (Arena creators)
 *  - Trading Pairs (Spot)
 *
 *  §12.2: Each card MUST have module label/disclosure.
 *  §12.4: Discovery-only — CTAs are "Xem thị trường" / "Xem room" etc.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, X, TrendingUp, Zap, Trophy, User, ArrowRight,
  Target, Star, Shield, Clock, BarChart3, Sparkles,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import { PREDICTION_EVENTS, fmtVolume } from '../../data/predictionMockData';
import type { PredictionEvent } from '../../data/predictionMockData';
import { ARENA_MODES, ARENA_ROOMS, ARENA_CREATORS } from '../../data/arenaData';
import type { ArenaMode, ArenaRoom, ArenaCreator } from '../../data/arenaData';
import { SHARED_TOPICS, mapCategoryToTopic, mapArenaTagToTopic } from '../../components/bridges/ArenaPredictionBridges';
import { CRYPTO_PAIRS } from '../../data/mockData';
import type { CryptoPair } from '../../data/mockData';
import { φ } from '../../utils/golden';
import { fmtUsd, fmtCompact } from '../../data/formatNumber';

/* ═══════════════════════════════════════════
   Search Logic
   ═══════════════════════════════════════════ */

interface SearchResults {
  predictions: PredictionEvent[];
  arenaModes: ArenaMode[];
  arenaRooms: ArenaRoom[];
  creators: ArenaCreator[];
  tradingPairs: typeof CRYPTO_PAIRS;
}

function performSearch(query: string): SearchResults {
  const q = query.toLowerCase().trim();
  if (!q) return { predictions: [], arenaModes: [], arenaRooms: [], creators: [], tradingPairs: [] };

  return {
    predictions: PREDICTION_EVENTS.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    ),
    arenaModes: ARENA_MODES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    ),
    arenaRooms: ARENA_ROOMS.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.format.toLowerCase().includes(q)
    ),
    creators: ARENA_CREATORS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.bio && c.bio.toLowerCase().includes(q))
    ),
    tradingPairs: CRYPTO_PAIRS.filter(p =>
      p.symbol.toLowerCase().includes(q) ||
      p.baseAsset.toLowerCase().includes(q) ||
      p.quoteAsset.toLowerCase().includes(q)
    ),
  };
}

/* ═══════════════════════════════════════════
   Trending / Suggestions
   ═══════════════════════════════════════════ */

const TRENDING_QUERIES = [
  { label: 'Bitcoin', icon: '₿' },
  { label: 'ETH price', icon: '⟠' },
  { label: 'Fed rate', icon: '🏦' },
  { label: 'Arena challenge', icon: '⚔️' },
  { label: 'Altcoin battle', icon: '🔥' },
  { label: 'Macro news', icon: '📰' },
];

const RECENT_KEY = 'unified_search_recent_v1';
function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}
function saveRecentSearch(q: string) {
  const recent = getRecentSearches().filter(s => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
}

/* ═══════════════════════════════════════════
   Module Badge
   ═══════════════════════════════════════════ */

function ModuleBadge({ variant }: { variant: 'prediction' | 'arena' | 'arena_points' | 'spot' }) {
  const cfg = {
    prediction: { label: 'Prediction Market', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', color: '#8B5CF6', icon: Target },
    arena: { label: 'Open Arena', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B', icon: Zap },
    arena_points: { label: 'Arena Points only', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B', icon: Star },
    spot: { label: 'Spot Trading', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: '#3B82F6', icon: BarChart3 },
  }[variant];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 9, fontWeight: 700 }}>
      <Icon size={8} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   Result Cards — §12.2 each with module label
   ═══════════════════════════════════════════ */

function PredictionCard({ event }: { event: PredictionEvent }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const topOutcome = event.outcomes[0];

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/markets/predictions/event/${event.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-2 mb-2">
        <ModuleBadge variant="prediction" />
        <span style={{ color: c.text3, fontSize: 9 }}>{event.category}</span>
      </div>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>
        {event.title}
      </p>
      <div className="flex items-center gap-3">
        <span style={{ color: topOutcome.color, fontSize: φ.xs, fontWeight: 700 }}>
          {topOutcome.label} {topOutcome.chance}%
        </span>
        <span style={{ color: c.text3, fontSize: 10 }}>
          Vol {fmtVolume(event.volume24h)}
        </span>
        <span className="ml-auto" style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>
          Xem thị trường →
        </span>
      </div>
    </TrCard>
  );
}

function ArenaModeCard({ mode }: { mode: ArenaMode }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/arena/mode/${mode.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-2 mb-2">
        <ModuleBadge variant="arena" />
        {mode.fairPlay && (
          <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>✓ Fair Play</span>
        )}
      </div>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
        {mode.title}
      </p>
      <p style={{ color: c.text2, fontSize: φ.xs, marginBottom: 6, lineHeight: 1.4 }}>
        {mode.description.length > 70 ? mode.description.slice(0, 70) + '…' : mode.description}
      </p>
      <div className="flex items-center gap-3">
        <span style={{ color: c.text3, fontSize: 10 }}>
          {mode.activeChallenges} challenges · {mode.cloneCount} clones
        </span>
        <span className="ml-auto" style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
          Xem mode →
        </span>
      </div>
    </TrCard>
  );
}

function ArenaRoomCard({ room }: { room: ArenaRoom }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const fillPct = Math.round((room.slotsFilled / room.slotsTotal) * 100);

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-2 mb-2">
        <ModuleBadge variant="arena_points" />
        <span style={{ color: c.text3, fontSize: 9 }}>{room.format}</span>
      </div>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
        {room.title}
      </p>
      <div className="flex items-center gap-3 mb-2">
        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700 }}>
          {room.entryPoints} pts entry
        </span>
        <span style={{ color: c.text3, fontSize: 10 }}>
          {room.slotsFilled}/{room.slotsTotal} slots ({fillPct}%)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 12 }}>{room.creator.avatar}</span>
        <span style={{ color: c.text2, fontSize: 10 }}>{room.creator.name}</span>
        <span className="ml-auto" style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
          Xem room →
        </span>
      </div>
    </TrCard>
  );
}

function CreatorCard({ creator }: { creator: ArenaCreator }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/arena/creator/${creator.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.12)', fontSize: 18 }}>
          {creator.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{creator.name}</span>
            {creator.fairPlayBadge && (
              <Shield size={10} color="#10B981" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: c.text3, fontSize: 10 }}>
              Trust {creator.trustScore}% · {creator.modesCreated} modes
            </span>
          </div>
        </div>
        <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>
          Xem creator →
        </span>
      </div>
    </TrCard>
  );
}

function TradingPairCard({ pair }: { pair: CryptoPair }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const isUp = pair.change24h >= 0;

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/market/${pair.id}`); hapticSelection(); }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ModuleBadge variant="spot" />
          <div>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{pair.symbol}</p>
            <p style={{ color: c.text3, fontSize: 10 }}>{pair.baseAsset}/{pair.quoteAsset}</p>
          </div>
        </div>
        <div className="text-right">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
            {fmtUsd(pair.price)}
          </p>
          <p style={{ color: isUp ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: 600 }}>
            {isUp ? '+' : ''}{pair.change24h.toFixed(2)}%
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Section Header
   ═══════════════════════════════════════════ */

function ResultSection({ icon: Icon, label, count, color, children }: {
  icon: React.ElementType; label: string; count: number; color: string; children: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={14} color={color} />
        </div>
        <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{label}</h2>
        <span className="px-1.5 py-0.5 rounded-md"
          style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 600 }}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export function UnifiedSearchPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => performSearch(query), [query]);
  const totalResults = results.predictions.length + results.arenaModes.length +
    results.arenaRooms.length + results.creators.length + results.tradingPairs.length;
  const hasQuery = query.trim().length > 0;

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) saveRecentSearch(q.trim());
  }, []);

  const handleClearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  return (
    <PageLayout>
      <Header title="Tìm kiếm" back />

      {/* Search bar */}
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="relative">
          <Search size={16} color={c.text3} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && query.trim()) handleSearch(query); }}
            placeholder="Tìm sự kiện, mode, room, creator, coin..."
            className="w-full pl-10 pr-10 py-3 rounded-xl"
            style={{
              background: c.surface2,
              border: `1.5px solid ${hasQuery ? c.chipActiveBorder : c.borderSolid}`,
              color: c.text1,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
          {hasQuery && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: c.surface3 }}>
              <X size={12} color={c.text2} />
            </button>
          )}
        </div>
      </div>

      <OfflineBanner showStaleHint />

      <PageContent gap="relaxed">
        {/* ─── Empty state: no query → trending + recent ─── */}
        {!hasQuery && (
          <>
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Tìm kiếm gần đây</span>
                  <button onClick={handleClearRecent}
                    style={{ color: c.text3, fontSize: 10 }}>Xoá tất cả</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => { setQuery(s); hapticSelection(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:opacity-70"
                      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                      <Clock size={10} color={c.text3} />
                      <span style={{ color: c.text2, fontSize: φ.xs }}>{s}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} color="#8B5CF6" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Trending</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_QUERIES.map(t => (
                  <button key={t.label} onClick={() => { setQuery(t.label); hapticSelection(); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                    <span style={{ fontSize: 12 }}>{t.icon}</span>
                    <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 500 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Module discovery cards */}
            <section>
              <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 8, display: 'block' }}>Khám phá theo module</span>
              <div className="flex flex-col gap-2">
                <TrCard className="p-3.5 active:opacity-70"
                  onClick={() => { navigate(`${prefix}/markets/predictions`); hapticSelection(); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.12)' }}>
                      <Target size={18} color="#8B5CF6" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Prediction Markets</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Thị trường dự đoán · Vị thế thực · USDT</p>
                    </div>
                    <ArrowRight size={14} color={c.text3} />
                  </div>
                </TrCard>
                <TrCard className="p-3.5 active:opacity-70"
                  onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.12)' }}>
                      <Zap size={18} color="#F59E0B" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Open Arena</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Creator modes · Thách đấu · Arena Points only</p>
                    </div>
                    <ArrowRight size={14} color={c.text3} />
                  </div>
                </TrCard>
                <TrCard className="p-3.5 active:opacity-70"
                  onClick={() => { navigate(`${prefix}/topics`); hapticSelection(); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <Sparkles size={18} color="#10B981" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Topic Hub</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Khám phá theo chủ đề · Crypto, Sports, Macro...</p>
                    </div>
                    <ArrowRight size={14} color={c.text3} />
                  </div>
                </TrCard>
              </div>
            </section>
          </>
        )}

        {/* ─── No results ─── */}
        {hasQuery && totalResults === 0 && (
          <EmptyState
            icon={Search}
            title="Không tìm thấy kết quả"
            subtitle={`Không có kết quả cho "${query}". Thử từ khoá khác hoặc xem gợi ý.`}
          />
        )}

        {/* ─── Results segmented by module (§12.1) ─── */}
        {hasQuery && totalResults > 0 && (
          <>
            {/* Result count */}
            <div className="flex items-center gap-2">
              <span style={{ color: c.text2, fontSize: φ.xs }}>
                Tìm thấy <strong style={{ color: c.text1 }}>{totalResults}</strong> kết quả cho "{query}"
              </span>
            </div>

            {/* Prediction Events */}
            {results.predictions.length > 0 && (
              <ResultSection icon={Target} label="Prediction Events" count={results.predictions.length} color="#8B5CF6">
                {results.predictions.map(e => <PredictionCard key={e.id} event={e} />)}
              </ResultSection>
            )}

            {/* Arena Modes */}
            {results.arenaModes.length > 0 && (
              <ResultSection icon={Zap} label="Arena Modes" count={results.arenaModes.length} color="#F59E0B">
                {results.arenaModes.map(m => <ArenaModeCard key={m.id} mode={m} />)}
              </ResultSection>
            )}

            {/* Arena Rooms */}
            {results.arenaRooms.length > 0 && (
              <ResultSection icon={Trophy} label="Arena Rooms" count={results.arenaRooms.length} color="#F59E0B">
                {results.arenaRooms.map(r => <ArenaRoomCard key={r.id} room={r} />)}
              </ResultSection>
            )}

            {/* Creators */}
            {results.creators.length > 0 && (
              <ResultSection icon={User} label="Creators" count={results.creators.length} color="#14B8A6">
                {results.creators.map(cr => <CreatorCard key={cr.id} creator={cr} />)}
              </ResultSection>
            )}

            {/* Trading Pairs */}
            {results.tradingPairs.length > 0 && (
              <ResultSection icon={BarChart3} label="Trading Pairs" count={results.tradingPairs.length} color="#3B82F6">
                {results.tradingPairs.map(p => <TradingPairCard key={p.symbol} pair={p} />)}
              </ResultSection>
            )}

            {/* Module boundary disclosure (§12.4) */}
            <div className="rounded-xl p-3 text-center"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5 }}>
                <strong style={{ color: c.text2 }}>Lưu ý:</strong> Prediction Markets sử dụng USDT thật.
                Arena Challenges chỉ dùng Arena Points (không liên quan ví).
                Đây là trang khám phá — không phải trang giao dịch.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}