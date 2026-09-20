import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Star, X, ArrowUpDown, BarChart3,
} from 'lucide-react';
import { CRYPTO_PAIRS, CryptoPair } from '../../data/mockData';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'];

type SortKey = 'name' | 'price' | 'change' | 'volume' | 'mcap';
type SortDir = 'asc' | 'desc';

function SortHeader({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string; sortKey: SortKey; currentKey: SortKey; currentDir: SortDir; onSort: (k: SortKey) => void;
}) {
  const c = useThemeColors();
  const active = currentKey === sortKey;
  return (
    <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 select-none"
      style={{ color: active ? '#3B82F6' : c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
      {label}
      {active && <ArrowUpDown size={WEB_ICON.xs} />}
    </button>
  );
}

/* ─── Sidebar: Top Movers ─── */
function MoversSidebar() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const gainers = [...CRYPTO_PAIRS].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const losers = [...CRYPTO_PAIRS].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');

  const list = tab === 'gainers' ? gainers : losers;

  return (
    <div className="flex flex-col gap-4" style={{ width: 320 }}>
      {/* Top movers */}
      <div className="rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-0 px-1 py-1 mx-4 mt-3 rounded-lg" style={{ background: c.hoverBg }}>
          {(['gainers', 'losers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-md text-center transition-colors"
              style={{
                background: tab === t ? c.surface : 'transparent',
                color: tab === t ? (t === 'gainers' ? '#10B981' : '#EF4444') : c.text3,
                fontSize: WEB_FONT.sm, fontWeight: tab === t ? 700 : 500,
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t === 'gainers' ? '▲ Top Tăng' : '▼ Top Giảm'}
            </button>
          ))}
        </div>
        <div className="px-4 py-2">
          {list.map((p, i) => (
            <button key={p.id} onClick={() => navigate(`/w/trade/${p.id}`)}
              className="web-cmd-btn flex items-center justify-between py-2 w-full transition-colors rounded-md px-2"
              style={{ borderBottom: i < list.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: p.logoColor + '15' }}>
                  <span style={{ color: p.logoColor, fontSize: 10, fontWeight: 700 }}>{p.baseAsset.slice(0, 3)}</span>
                </div>
                <div className="text-left">
                  <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{p.baseAsset}</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 3 }}>/{p.quoteAsset}</span>
                </div>
              </div>
              <div className="text-right">
                <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}>${fmtPrice(p.price)}</p>
                <p style={{
                  color: p.change24h >= 0 ? '#10B981' : '#EF4444',
                  fontSize: WEB_FONT.xs, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                }}>{fmtPct(p.change24h)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <p style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700, marginBottom: 12 }}>Thống kê thị trường</p>
        {[
          { label: 'Tổng Market Cap', value: fmtCompact(2450000000000, { prefix: '$' }) },
          { label: 'Volume 24h', value: fmtCompact(98700000000, { prefix: '$' }) },
          { label: 'BTC Dominance', value: '52.4%' },
          { label: 'Tăng / Giảm', value: `${CRYPTO_PAIRS.filter(p => p.change24h > 0).length} / ${CRYPTO_PAIRS.filter(p => p.change24h < 0).length}` },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center justify-between py-2"
            style={{ borderBottom: i < 3 ? `1px solid ${c.divider}` : 'none' }}>
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{s.label}</span>
            <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export function WebMarketListPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [pairs, setPairs] = useState<CryptoPair[]>(CRYPTO_PAIRS);

  const toggleFav = (id: string) => {
    setPairs(ps => ps.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = pairs;
    if (search) list = list.filter(p => p.symbol.toLowerCase().includes(search.toLowerCase()) || p.baseAsset.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'Tất cả') list = list.filter(p => p.category === category);

    list = [...list].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'name': diff = a.baseAsset.localeCompare(b.baseAsset); break;
        case 'price': diff = a.price - b.price; break;
        case 'change': diff = a.change24h - b.change24h; break;
        case 'volume': diff = a.volume24h - b.volume24h; break;
        case 'mcap': diff = a.marketCap - b.marketCap; break;
      }
      return sortDir === 'asc' ? diff : -diff;
    });
    return list;
  }, [pairs, search, category, sortKey, sortDir]);

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Thị trường"
        right={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/w/markets/watchlist')}
              className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text2 }}>
              <Star size={13} /> Watchlist
            </button>
            <button onClick={() => navigate('/w/markets/heatmap')}
              className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text2 }}>
              <BarChart3 size={13} /> Heatmap
            </button>
          </div>
        }
      />
      <div className="flex gap-6 py-6 px-6" style={{ maxWidth: 1200 }}>
      {/* Main table */}
      <div className="flex-1 min-w-0">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 rounded-lg px-3"
            style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 38 }}>
            <Search size={15} color={c.text3} />
            <input type="text" placeholder="Tìm kiếm cặp giao dịch..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 13 }} />
            {search && <button onClick={() => setSearch('')}><X size={14} color={c.text3} /></button>}
          </div>
          <div className="flex gap-1.5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-md transition-colors"
                style={{
                  background: category === cat ? c.chipActiveBg : 'transparent',
                  color: category === cat ? c.chipActiveText : c.text3,
                  fontSize: WEB_FONT.sm, fontWeight: category === cat ? 600 : 500,
                  border: category === cat ? `1px solid ${c.chipActiveBorder}` : `1px solid transparent`,
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          {/* Header */}
          <div className="grid items-center px-4 py-2.5"
            style={{ gridTemplateColumns: '32px 2fr 1.2fr 90px 100px 1fr 90px', borderBottom: `1px solid ${c.divider}` }}>
            <span />
            <SortHeader label="Cặp giao dịch" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <div className="text-right">
              <SortHeader label="Giá" sortKey="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </div>
            <div className="text-right">
              <SortHeader label="24h %" sortKey="change" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </div>
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'center' }}>Biểu đồ 7d</span>
            <div className="text-right">
              <SortHeader label="Volume 24h" sortKey="volume" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </div>
            <div className="text-right">
              <SortHeader label="Market Cap" sortKey="mcap" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </div>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Search size={32} color={c.text3} style={{ opacity: 0.4 }} />
              <p style={{ color: c.text3, fontSize: WEB_FONT.base }}>Không tìm thấy kết quả</p>
            </div>
          ) : (
            filtered.map((pair, i) => {
              const isPos = pair.change24h >= 0;
              return (
                <div key={pair.id}
                  className="web-cmd-btn grid items-center px-4 py-2 transition-colors cursor-pointer"
                  onClick={() => navigate(`/w/trade/${pair.id}`)}
                  style={{
                    gridTemplateColumns: '32px 2fr 1.2fr 90px 100px 1fr 90px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
                  }}>
                  <button onClick={e => { e.stopPropagation(); toggleFav(pair.id); }} className="flex items-center justify-center">
                    <Star size={14} fill={pair.isFavorite ? '#F59E0B' : 'none'} color={pair.isFavorite ? '#F59E0B' : c.text3} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: pair.logoColor + '15' }}>
                      <span style={{ color: pair.logoColor, fontSize: WEB_FONT.xs, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
                    </div>
                    <div>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}>{pair.baseAsset}</span>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 3 }}>/{pair.quoteAsset}</span>
                    </div>
                  </div>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                    ${fmtPrice(pair.price)}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="inline-block rounded px-1.5 py-0.5"
                      style={{
                        background: isPos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isPos ? '#10B981' : '#EF4444',
                        fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      }}>
                      {fmtPct(pair.change24h)}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <SparklineChart data={pair.sparklineData} isPositive={isPos} width={72} height={24} />
                  </div>
                  <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                    {fmtCompact(pair.volume24h, { prefix: '$' })}
                  </span>
                  <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                    {fmtCompact(pair.marketCap, { prefix: '$' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-3 px-2">
          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Hiển thị {filtered.length} / {CRYPTO_PAIRS.length} cặp giao dịch</span>
        </div>
      </div>

      {/* Right sidebar */}
      <MoversSidebar />
      </div>
    </PageLayout>
  );
}