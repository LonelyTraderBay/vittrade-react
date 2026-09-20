import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Star, Plus, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { WATCHLIST, CRYPTO_PAIRS } from '../../data/mockData';
import { fmtPrice, fmtPct, fmtUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { PageLayout } from '../../components/layout/PageLayout';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

export function WatchlistPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [watchlist, setWatchlist] = useState(WATCHLIST);
  const [searchQuery, setSearchQuery] = useState('');

  const watchlistPairs = watchlist.map(w => {
    const pair = CRYPTO_PAIRS.find(p => p.id === w.pairId);
    return { ...w, pair };
  }).filter(w => w.pair);

  const filteredPairs = searchQuery
    ? watchlistPairs.filter(w => 
        w.pair!.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.pair!.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : watchlistPairs;

  const handleRemove = (id: string) => {
    setWatchlist(watchlist.filter(w => w.id !== id));
  };

  const handleAddNote = (id: string) => {
    const note = prompt('Nhập ghi chú:');
    if (note !== null) {
      setWatchlist(watchlist.map(w => 
        w.id === id ? { ...w, note: note.trim() || undefined } : w
      ));
    }
  };

  return (
    <PageLayout>
      <Header title="Danh sách theo dõi" subtitle="Theo dõi · Markets" back />

      {/* Search & Count */}
      <div className="px-5 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}`, boxShadow: c.cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl"
            style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}` }}>
            <Search size={16} color={c.text2} />
            <input
              type="text"
              placeholder="Tìm kiếm cặp giao dịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: FONT_SCALE.sm }}
            />
          </div>
          <button
            onClick={() => navigate(`${prefix}/markets`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#3B82F6' }}>
            <Plus size={16} color="#fff" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
            {watchlist.length} cặp đang theo dõi
          </span>
        </div>
      </div>

      {/* Watchlist */}
      <div>
        {filteredPairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Star size={48} color={c.borderSolid} />
            <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, textAlign: 'center' }}>
              {searchQuery ? 'Không tìm thấy cặp nào' : 'Chưa có cặp trong danh sách theo dõi'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate(`${prefix}/markets`)}
                className="mt-2 px-4 py-2 rounded-xl min-h-9"
                style={{ background: '#3B82F6', color: '#fff', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Thêm cặp giao dịch
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-2">
            {filteredPairs.map((item) => {
              const pair = item.pair!;
              const isPos = pair.change24h >= 0;

              return (
                <TrCard key={item.id} hover className="mb-3 p-4">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <button
                      onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: pair.logoColor + '22' }}>
                      <span style={{ color: pair.logoColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                        {pair.baseAsset.slice(0, 3)}
                      </span>
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button onClick={() => navigate(`${prefix}/pair/${pair.id}`)} className="text-left">
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
                          {pair.baseAsset}
                        </p>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                          {pair.symbol}
                        </p>
                      </button>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right shrink-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace', marginBottom: 4 }}>
                        ${fmtPrice(pair.price)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {isPos ? <TrendingUp size={14} color="#10B981" /> : <TrendingDown size={14} color="#EF4444" />}
                        <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: isPos ? '#10B981' : '#EF4444' }}>
                          {fmtPct(pair.change24h)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="mb-3">
                    <SparklineChart data={pair.sparklineData} isPositive={isPos} width={280} height={40} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3"
                    style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <div>
                      <p style={{ color: c.text3, fontSize: 12 }}>24h High</p>
                      <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(pair.high24h)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 12 }}>24h Low</p>
                      <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(pair.low24h)}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="rounded-lg px-3 py-2 mb-3"
                      style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                      <p style={{ color: '#3B82F6', fontSize: 12 }}>
                        📝 {item.note}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                      className="flex-1 h-9 rounded-xl font-semibold"
                      style={{ background: '#3B82F6', color: '#fff', fontSize: 13 }}>
                      Giao dịch
                    </button>
                    <button
                      onClick={() => handleAddNote(item.id)}
                      className="h-9 px-3 rounded-xl font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', color: c.text2, fontSize: 13 }}>
                      {item.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                </TrCard>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}