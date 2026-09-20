import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, X, TrendingUp, TrendingDown, Star, Eye } from 'lucide-react';
import { CRYPTO_PAIRS, CryptoPair } from '../../data/mockData';
import { MarketItem } from '../../components/trading/MarketItem';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtPrice, fmtPct } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { PageLayout } from '../../components/layout/PageLayout';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'];
const SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price_desc', label: 'Giá cao → thấp' },
  { id: 'price_asc', label: 'Giá thấp → cao' },
  { id: 'change_desc', label: 'Tăng nhiều nhất' },
  { id: 'change_asc', label: 'Giảm nhiều nhất' },
  { id: 'volume_desc', label: 'Volume lớn nhất' },
];

/* ─── Right Panel: Top Movers + Watchlist (Desktop only) ─── */
function RightPanel({ pairs }: { pairs: CryptoPair[] }) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const gainers = pairs.filter(p => p.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const losers = pairs.filter(p => p.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const favorites = pairs.filter(p => p.isFavorite);

  return (
    <div className="flex flex-col gap-4" style={{ width: 340 }}>
      {/* Top Gainers */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp size={16} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>Top Tăng mạnh</span>
        </div>
        {gainers.map((p, i) => (
          <button key={p.id} onClick={() => navigate(`${prefix}/pair/${p.id}`)}
            className="flex items-center justify-between py-2 w-full active:opacity-70"
            style={{ borderBottom: i < gainers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: p.logoColor + '22' }}>
                <span style={{ color: p.logoColor, fontSize: 9, fontWeight: 700 }}>{p.baseAsset.slice(0, 3)}</span>
              </div>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{p.baseAsset}</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace' }}>
                ${fmtPrice(p.price)}
              </span>
              <span className="rounded px-1.5 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                +{fmtPct(p.change24h)}
              </span>
            </div>
          </button>
        ))}
      </TrCard>

      {/* Top Losers */}
      <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingDown size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>Top Giảm mạnh</span>
        </div>
        {losers.map((p, i) => (
          <button key={p.id} onClick={() => navigate(`${prefix}/pair/${p.id}`)}
            className="flex items-center justify-between py-2 w-full active:opacity-70"
            style={{ borderBottom: i < losers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: p.logoColor + '22' }}>
                <span style={{ color: p.logoColor, fontSize: 9, fontWeight: 700 }}>{p.baseAsset.slice(0, 3)}</span>
              </div>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{p.baseAsset}</span>
            </div>
            <span className="rounded px-1.5 py-0.5 text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              {fmtPct(p.change24h)}
            </span>
          </button>
        ))}
      </TrCard>

      {/* Watchlist preview */}
      <TrCard className="p-4" accentBorder="rgba(59,130,246,0.2)">
        <div className="flex items-center gap-1.5 mb-3">
          <Eye size={16} color="#3B82F6" />
          <span style={{ color: '#3B82F6', fontSize: 14, fontWeight: 700 }}>Watchlist</span>
          <span style={{ color: c.text3, fontSize: 12 }}>({favorites.length})</span>
        </div>
        {favorites.length === 0 ? (
          <p style={{ color: c.text3, fontSize: 13 }}>Chưa có cặp yêu thích</p>
        ) : favorites.slice(0, 5).map((p, i) => {
          const isPos = p.change24h >= 0;
          return (
            <button key={p.id} onClick={() => navigate(`${prefix}/pair/${p.id}`)}
              className="flex items-center justify-between py-2 w-full"
              style={{ borderBottom: i < Math.min(favorites.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{p.symbol}</span>
              <SparklineChart data={p.sparklineData} isPositive={isPos} width={48} height={20} />
              <span style={{ color: isPos ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                {isPos ? '+' : ''}{fmtPct(p.change24h)}
              </span>
            </button>
          );
        })}
      </TrCard>
    </div>
  );
}

export function ResponsiveMarketListPage() {
  const { isDesktop, isTablet } = useBreakpoint();
  const c = useThemeColors();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('default');
  const [showSort, setShowSort] = useState(false);
  const [pairs, setPairs] = useState<CryptoPair[]>(CRYPTO_PAIRS);

  const toggleFavorite = (id: string) => {
    setPairs(ps => ps.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
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

  const mainContent = (
    <PageLayout style={{ flex: 1 }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 style={{ color: c.text1, fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Thị trường</h1>

        <div className="flex items-center gap-3 rounded-2xl px-4 mb-3"
          style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, height: 52, borderRadius: 14 }}>
          <Search size={18} color={c.text3} />
          <input type="text" placeholder="Tìm kiếm BTC, ETH..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 15, flex: 1 }} />
          {search && <button onClick={() => setSearch('')}><X size={16} color={c.text3} /></button>}
          <button onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1 rounded-xl px-2 py-1"
            style={{ background: sort !== 'default' ? 'rgba(59,130,246,0.2)' : 'transparent', color: sort !== 'default' ? '#3B82F6' : c.text3 }}>
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {showSort && (
          <div className="rounded-2xl p-3 mb-3 flex flex-wrap gap-2"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { setSort(opt.id); setShowSort(false); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: sort === opt.id ? c.chipActiveBg : c.surface, color: sort === opt.id ? c.chipActiveText : c.text2, border: `1px solid ${sort === opt.id ? c.chipActiveBorder : c.borderSolid}` }}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: category === cat ? c.chipActiveBg : c.chipBg, color: category === cat ? c.chipActiveText : c.chipText, border: `1px solid ${category === cat ? c.chipActiveBorder : c.chipBorder}` }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Column header — extra columns on tablet/desktop */}
      <div className="flex items-center px-4 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text3, fontSize: 11, flex: 1 }}>Cặp giao dịch</span>
        {(isTablet || isDesktop) && (
          <span style={{ color: c.text3, fontSize: 11, width: 80, textAlign: 'center' }}>Volume</span>
        )}
        {(isTablet || isDesktop) && (
          <span style={{ color: c.text3, fontSize: 11, width: 80, textAlign: 'center' }}>MarketCap</span>
        )}
        <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'center' }}>Biểu đồ</span>
        <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right' }}>Giá / Thay đổi</span>
        <div className="w-8" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <Search size={40} color={c.borderSolid} />
          <p style={{ color: c.text3, fontSize: 14 }}>Không tìm thấy "{search}"</p>
        </div>
      ) : (
        filtered.map(pair => (
          <MarketItem key={pair.id} pair={pair} onFavoriteToggle={toggleFavorite} />
        ))
      )}
    </PageLayout>
  );

  // Desktop: 2-column layout (list + right panel)
  if (isDesktop) {
    return (
      <div className="flex gap-6 py-4">
        <div className="flex-1 min-w-0">{mainContent}</div>
        <RightPanel pairs={pairs} />
      </div>
    );
  }

  return mainContent;
}