import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { HEATMAP_COINS } from '../../data/mockData';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

const CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Payment', 'AI'];
const METRICS = ['24h', '7d'] as const;

function getChangeBg(change: number): string {
  if (change >= 8) return 'rgba(5,150,105,0.85)';
  if (change >= 5) return 'rgba(16,185,129,0.75)';
  if (change >= 2) return 'rgba(16,185,129,0.55)';
  if (change >= 0) return 'rgba(16,185,129,0.35)';
  if (change >= -2) return 'rgba(239,68,68,0.35)';
  if (change >= -5) return 'rgba(239,68,68,0.55)';
  return 'rgba(239,68,68,0.75)';
}

export function MarketHeatmapPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [category, setCategory] = useState('Tất cả');
  const [metric, setMetric] = useState<'24h' | '7d'>('24h');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  const filteredCoins = category === 'Tất cả'
    ? HEATMAP_COINS
    : HEATMAP_COINS.filter(c => c.category === category);

  const sortedByChange = [...filteredCoins].sort((a, b) => {
    const aVal = metric === '24h' ? a.change24h : a.change7d;
    const bVal = metric === '24h' ? b.change24h : b.change7d;
    return bVal - aVal;
  });

  const topGainers = sortedByChange.filter(c => (metric === '24h' ? c.change24h : c.change7d) > 0).slice(0, 3);
  const topLosers = sortedByChange.filter(c => (metric === '24h' ? c.change24h : c.change7d) < 0).slice(0, 3).reverse();

  const totalMcap = filteredCoins.reduce((s, c) => s + c.marketCap, 0);
  const avgChange = filteredCoins.reduce((s, c) => s + (metric === '24h' ? c.change24h : c.change7d), 0) / (filteredCoins.length || 1);

  const selected = HEATMAP_COINS.find(c => c.id === selectedCoin);

  return (
    <PageLayout>
      <Header title="Market Heatmap" subtitle="Bản đồ · Markets" back />

      <PageContent padding="compact">
      {/* Summary bar */}
      <div className="mt-3 flex gap-3">
        <TrCard rounded="sm" className="flex-1 p-3">
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng Market Cap</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtCompact(totalMcap, { prefix: '$' })}</p>
        </TrCard>
        <TrCard rounded="sm" className="flex-1 p-3">
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>TB thay đổi {metric}</p>
          <p style={{ color: avgChange >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtPct(avgChange)}</p>
        </TrCard>
        <TrCard rounded="sm" className="flex-1 p-3">
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Số coin</p>
          <p style={{ color: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{filteredCoins.length}</p>
        </TrCard>
      </div>

      {/* Filters */}
      <div className="mt-3 flex items-center gap-2">
        {/* Metric toggle */}
        <div className="flex rounded-xl p-1" style={{ background: c.surface2 }}>
          {METRICS.map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className="px-3 py-2 rounded-lg"
              style={{
                minHeight: 36,
                background: metric === m ? c.chipActiveBg : 'transparent',
                color: metric === m ? c.chipActiveText : c.chipText,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
              }}>{m}</button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto flex-1 pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="shrink-0 px-3 py-2 rounded-xl whitespace-nowrap"
              style={{
                minHeight: 36,
                background: category === cat ? c.chipActiveBg : 'transparent',
                color: category === cat ? c.chipActiveText : c.chipText,
                border: `1px solid ${category === cat ? c.chipActiveBorder : 'transparent'}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
              }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Heatmap treemap */}
      <TrCard overflow className="mt-3">
        <div className="relative" style={{ height: 360 }}>
          {/* Grid-based treemap */}
          <div className="grid gap-1 h-full" style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
            gridAutoRows: 'minmax(50px, auto)',
          }}>
            {filteredCoins
              .sort((a, b) => b.marketCap - a.marketCap)
              .map((coin, i) => {
                const change = metric === '24h' ? coin.change24h : coin.change7d;
                const mcapRatio = coin.marketCap / totalMcap;
                // Larger coins get more grid space
                const span = mcapRatio > 0.3 ? 3 : mcapRatio > 0.1 ? 2 : 1;
                const rowSpan = mcapRatio > 0.3 ? 3 : mcapRatio > 0.15 ? 2 : 1;
                const isSelected = selectedCoin === coin.id;

                return (
                  <button
                    key={coin.id}
                    onClick={() => setSelectedCoin(isSelected ? null : coin.id)}
                    className="flex flex-col items-center justify-center p-1 relative overflow-hidden transition-all"
                    style={{
                      background: getChangeBg(change),
                      gridColumn: `span ${span}`,
                      gridRow: `span ${rowSpan}`,
                      border: isSelected ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                    }}
                  >
                    <span style={{ color: '#FFF', fontSize: span >= 2 ? FONT_SCALE.base : FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {coin.symbol}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: span >= 2 ? FONT_SCALE.xs : FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {fmtPct(change)}
                    </span>
                    {span >= 2 && (
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SCALE.micro, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {fmtCompact(coin.marketCap, { prefix: '$' })}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </TrCard>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-1">
        {[
          { label: '<-5%', bg: 'rgba(239,68,68,0.75)' },
          { label: '-2~0%', bg: 'rgba(239,68,68,0.35)' },
          { label: '0~2%', bg: 'rgba(16,185,129,0.35)' },
          { label: '2~5%', bg: 'rgba(16,185,129,0.55)' },
          { label: '>5%', bg: 'rgba(16,185,129,0.75)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.bg }} />
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected coin detail */}
      {selected && (
        <TrCard className="mt-3 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: selected.color + '22', border: `1.5px solid ${selected.color}44` }}>
              <span style={{ color: selected.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>{selected.symbol.slice(0, 3)}</span>
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{selected.name}</p>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{selected.symbol}/USDT • {selected.category}</p>
            </div>
            <button onClick={() => navigate(`${prefix}/pair/${selected.id}usdt`)}
              className="px-3 py-2 rounded-xl min-h-9"
              style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              Chi tiết
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Giá', value: `$${fmtPrice(selected.price)}`, color: c.text1 },
              { label: '24h', value: fmtPct(selected.change24h), color: selected.change24h >= 0 ? '#10B981' : '#EF4444' },
              { label: '7d', value: fmtPct(selected.change7d), color: selected.change7d >= 0 ? '#10B981' : '#EF4444' },
              { label: 'MCap', value: fmtCompact(selected.marketCap, { prefix: '$' }), color: c.text2 },
            ].map(d => (
              <div key={d.label}>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{d.label}</p>
                <p style={{ color: d.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{d.value}</p>
              </div>
            ))}
          </div>
        </TrCard>
      )}

      {/* Top Gainers / Losers */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Gainers */}
        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>Top tăng</span>
          </div>
          {topGainers.map((coin, i) => {
            const change = metric === '24h' ? coin.change24h : coin.change7d;
            return (
              <button key={coin.id} onClick={() => setSelectedCoin(coin.id)}
                className="w-full flex items-center justify-between py-2"
                style={{ borderBottom: i < topGainers.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{i + 1}.</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{coin.symbol}</span>
                </div>
                <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtPct(change)}</span>
              </button>
            );
          })}
        </TrCard>

        {/* Losers */}
        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>Top giảm</span>
          </div>
          {topLosers.map((coin, i) => {
            const change = metric === '24h' ? coin.change24h : coin.change7d;
            return (
              <button key={coin.id} onClick={() => setSelectedCoin(coin.id)}
                className="w-full flex items-center justify-between py-2"
                style={{ borderBottom: i < topLosers.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{i + 1}.</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{coin.symbol}</span>
                </div>
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtPct(change)}</span>
              </button>
            );
          })}
        </TrCard>
      </div>
      </PageContent>
    </PageLayout>
  );
}