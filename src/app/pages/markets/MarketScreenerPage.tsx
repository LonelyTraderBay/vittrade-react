/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET SCREENER PAGE — P1 Advanced Filtering & Discovery
 * ══════════════════════════════════════════════════════════════════
 *  Multi-filter screener with presets, range sliders, category
 *  chips, sortable results table. Route: /markets/screener
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Filter, ChevronDown, ChevronUp, RotateCcw,
  ArrowUpRight, ArrowDownRight,
  Search, X, Sliders,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { CRYPTO_PAIRS, type CryptoPair } from '../../data/mockData';
import { SCREENER_PRESETS, type ScreenerFilters } from '../../data/marketP1Data';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'];

const SORT_OPTIONS = [
  { id: 'marketCap' as const, label: 'Vốn hóa' },
  { id: 'volume' as const, label: 'Khối lượng' },
  { id: 'change24h' as const, label: 'Thay đổi 24h' },
  { id: 'price' as const, label: 'Giá' },
];

const DEFAULT_FILTERS: ScreenerFilters = {
  categories: [],
  sortBy: 'marketCap',
  sortDir: 'desc',
};

export function MarketScreenerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticLight, hapticSelection } = useHaptic();

  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = SCREENER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setActivePreset(presetId);
      hapticSelection();
    }
  }, [hapticSelection]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActivePreset(null);
    setSearch('');
    hapticLight();
  }, [hapticLight]);

  // Toggle category
  const toggleCategory = useCallback((cat: string) => {
    if (cat === 'Tất cả') {
      setFilters(prev => ({ ...prev, categories: [] }));
    } else {
      setFilters(prev => {
        const cats = prev.categories.includes(cat)
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat];
        return { ...prev, categories: cats };
      });
    }
    setActivePreset(null);
    hapticSelection();
  }, [hapticSelection]);

  // Toggle sort
  const toggleSort = useCallback((sortBy: ScreenerFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDir: prev.sortBy === sortBy && prev.sortDir === 'desc' ? 'asc' : 'desc',
    }));
    setActivePreset(null);
    hapticSelection();
  }, [hapticSelection]);

  // Filter and sort results
  const results = useMemo(() => {
    let items = [...CRYPTO_PAIRS];

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.baseAsset.toLowerCase().includes(q) ||
        p.symbol.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      items = items.filter(p => filters.categories.includes(p.category));
    }

    // Range filters
    if (filters.minPrice !== undefined) items = items.filter(p => p.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) items = items.filter(p => p.price <= filters.maxPrice!);
    if (filters.minMarketCap !== undefined) items = items.filter(p => p.marketCap >= filters.minMarketCap!);
    if (filters.maxMarketCap !== undefined) items = items.filter(p => p.marketCap <= filters.maxMarketCap!);
    if (filters.minVolume24h !== undefined) items = items.filter(p => p.volume24h >= filters.minVolume24h!);
    if (filters.maxVolume24h !== undefined) items = items.filter(p => p.volume24h <= filters.maxVolume24h!);
    if (filters.minChange24h !== undefined) items = items.filter(p => p.change24h >= filters.minChange24h!);
    if (filters.maxChange24h !== undefined) items = items.filter(p => p.change24h <= filters.maxChange24h!);

    // Sort
    const dir = filters.sortDir === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      switch (filters.sortBy) {
        case 'marketCap': return (a.marketCap - b.marketCap) * dir;
        case 'volume': return (a.volume24h - b.volume24h) * dir;
        case 'change24h': return (a.change24h - b.change24h) * dir;
        case 'price': return (a.price - b.price) * dir;
        default: return 0;
      }
    });

    return items;
  }, [search, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.minMarketCap !== undefined || filters.maxMarketCap !== undefined) count++;
    if (filters.minVolume24h !== undefined || filters.maxVolume24h !== undefined) count++;
    if (filters.minChange24h !== undefined || filters.maxChange24h !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <PageLayout>
      <Header title="Bộ lọc thị trường" back />

      <PageContent gap="default">
        {/* Search bar */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            height: 48,
            borderRadius: 14,
          }}
        >
          <Search size={18} color={c.searchPlaceholder} />
          <input
            type="text"
            placeholder="Tìm kiếm token..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: c.text1, fontSize: FONT_SCALE.sm, flex: 1,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={14} color={c.text3} /></button>
          )}
          <button
            onClick={() => { setShowFilters(!showFilters); hapticLight(); }}
            className="flex items-center gap-1 rounded-xl px-2 py-1"
            style={{
              background: activeFilterCount > 0 ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeFilterCount > 0 ? '#3B82F6' : c.text3,
            }}
          >
            <Sliders size={14} />
            {activeFilterCount > 0 && (
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Preset chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
          {SCREENER_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl min-h-9"
              style={{
                background: activePreset === preset.id ? c.chipActiveBg : c.surface2,
                color: activePreset === preset.id ? c.chipActiveText : c.text2,
                border: `1px solid ${activePreset === preset.id ? c.chipActiveBorder : 'transparent'}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.medium,
              }}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Bộ lọc nâng cao
              </span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1"
                style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs }}
              >
                <RotateCcw size={12} />
                Đặt lại
              </button>
            </div>

            {/* Category chips */}
            <PageSection label="Danh mục" accentColor="#3B82F6" gap={8}>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const isActive = cat === 'Tất cả'
                    ? filters.categories.length === 0
                    : filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className="px-3 py-2 rounded-lg min-h-9"
                      style={{
                        background: isActive ? c.chipActiveBg : c.surface2,
                        color: isActive ? c.chipActiveText : c.text3,
                        fontSize: FONT_SCALE.xs,
                        fontWeight: FONT_WEIGHT.medium,
                        border: `1px solid ${isActive ? c.chipActiveBorder : 'transparent'}`,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </PageSection>

            {/* Range filters */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <RangeInput
                label="Giá min ($)"
                value={filters.minPrice}
                onChange={v => setFilters(p => ({ ...p, minPrice: v }))}
                c={c}
              />
              <RangeInput
                label="Giá max ($)"
                value={filters.maxPrice}
                onChange={v => setFilters(p => ({ ...p, maxPrice: v }))}
                c={c}
              />
              <RangeInput
                label="Vốn hóa min ($)"
                value={filters.minMarketCap}
                onChange={v => setFilters(p => ({ ...p, minMarketCap: v }))}
                c={c}
                placeholder="e.g. 1000000000"
              />
              <RangeInput
                label="KL 24h min ($)"
                value={filters.minVolume24h}
                onChange={v => setFilters(p => ({ ...p, minVolume24h: v }))}
                c={c}
                placeholder="e.g. 100000000"
              />
              <RangeInput
                label="% Thay đổi min"
                value={filters.minChange24h}
                onChange={v => setFilters(p => ({ ...p, minChange24h: v }))}
                c={c}
                placeholder="e.g. -5"
              />
              <RangeInput
                label="% Thay đổi max"
                value={filters.maxChange24h}
                onChange={v => setFilters(p => ({ ...p, maxChange24h: v }))}
                c={c}
                placeholder="e.g. 10"
              />
            </div>
          </TrCard>
        )}

        {/* Sort header */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {SORT_OPTIONS.map(opt => {
            const isActive = filters.sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => toggleSort(opt.id)}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg min-h-9"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: isActive ? '#3B82F6' : c.text3,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: isActive ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                }}
              >
                {opt.label}
                {isActive && (
                  filters.sortDir === 'desc'
                    ? <ChevronDown size={12} />
                    : <ChevronUp size={12} />
                )}
              </button>
            );
          })}
          <span
            className="shrink-0 ml-auto"
            style={{ color: c.text3, fontSize: FONT_SCALE.xs }}
          >
            {results.length} kết quả
          </span>
        </div>

        {/* Results list */}
        <div className="flex flex-col" style={{ gap: 2 }}>
          {results.map((pair, idx) => (
            <ScreenerRow
              key={pair.id}
              pair={pair}
              rank={idx + 1}
              c={c}
              onTap={() => { navigate(`${prefix}/pair/${pair.id}`); hapticLight(); }}
            />
          ))}
        </div>

        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Filter size={40} color={c.text3} style={{ opacity: 0.3 }} />
            <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
              Không tìm thấy kết quả phù hợp
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: FONT_SCALE.xs }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function RangeInput({
  label, value, onChange, c, placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  c: ReturnType<typeof useThemeColors>;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        placeholder={placeholder ?? '—'}
        className="w-full px-3 py-2 rounded-lg"
        style={{
          background: c.surface2,
          border: `1px solid ${c.borderSolid}`,
          color: c.text1,
          fontSize: FONT_SCALE.xs,
          outline: 'none',
        }}
      />
    </div>
  );
}

function ScreenerRow({
  pair, rank, c, onTap,
}: {
  pair: CryptoPair;
  rank: number;
  c: ReturnType<typeof useThemeColors>;
  onTap: () => void;
}) {
  const isUp = pair.change24h >= 0;

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-left"
      style={{ background: c.surface }}
    >
      {/* Rank */}
      <span style={{
        color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium,
        width: 20, textAlign: 'center', flexShrink: 0,
      }}>
        {rank}
      </span>

      {/* Logo circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${pair.logoColor}18` }}
      >
        <span style={{ color: pair.logoColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {pair.baseAsset.slice(0, 2)}
        </span>
      </div>

      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          {pair.baseAsset}
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
          {fmtCompact(pair.marketCap, { prefix: '$' })}
        </p>
      </div>

      {/* Sparkline */}
      <div className="shrink-0">
        <SparklineChart data={pair.sparklineData} isPositive={isUp} width={56} height={24} />
      </div>

      {/* Price + change */}
      <div className="text-right shrink-0" style={{ minWidth: 80 }}>
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          ${fmtPrice(pair.price)}
        </p>
        <div className="flex items-center justify-end gap-1">
          {isUp
            ? <ArrowUpRight size={12} color="#10B981" />
            : <ArrowDownRight size={12} color="#EF4444" />
          }
          <span style={{
            color: isUp ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.medium,
          }}>
            {fmtPct(pair.change24h)}
          </span>
        </div>
      </div>
    </button>
  );
}