/**
 * ══════════════════════════════════════════════════════════════════
 *  COMPARISON TOOL PAGE — P1 Side-by-Side Token Analysis
 * ══════════════════════════════════════════════════════════════════
 *  Compare 2-4 tokens across price, volume, market cap,
 *  performance metrics. Route: /markets/compare
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, X, Search, ArrowUpRight, ArrowDownRight,
  Scale,
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

const MAX_COMPARE = 4;

const POPULAR_PAIRS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt'];

interface MetricRow {
  label: string;
  key: string;
  format: 'price' | 'compact' | 'pct' | 'raw';
  getValue: (p: CryptoPair) => number;
  highlight?: 'high' | 'low';
}

const METRICS: MetricRow[] = [
  { label: 'Giá hiện tại', key: 'price', format: 'price', getValue: p => p.price },
  { label: 'Vốn hóa', key: 'mcap', format: 'compact', getValue: p => p.marketCap, highlight: 'high' },
  { label: 'Khối lượng 24h', key: 'vol', format: 'compact', getValue: p => p.volume24h, highlight: 'high' },
  { label: 'Thay đổi 24h', key: 'chg', format: 'pct', getValue: p => p.change24h, highlight: 'high' },
  { label: 'Cao nhất 24h', key: 'high', format: 'price', getValue: p => p.high24h },
  { label: 'Thấp nhất 24h', key: 'low', format: 'price', getValue: p => p.low24h },
  { label: 'Biên độ 24h', key: 'range', format: 'pct', getValue: p => ((p.high24h - p.low24h) / p.low24h) * 100 },
  { label: 'Vol/MCap', key: 'volmcap', format: 'pct', getValue: p => (p.volume24h / p.marketCap) * 100 },
];

export function ComparisonToolPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticLight, hapticSelection } = useHaptic();

  const [selectedIds, setSelectedIds] = useState<string[]>(['btcusdt', 'ethusdt']);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedPairs = useMemo(
    () => selectedIds.map(id => CRYPTO_PAIRS.find(p => p.id === id)).filter(Boolean) as CryptoPair[],
    [selectedIds]
  );

  const addToken = useCallback((id: string) => {
    if (selectedIds.length < MAX_COMPARE && !selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
      hapticSelection();
    }
    setShowPicker(false);
    setPickerSearch('');
  }, [selectedIds, hapticSelection]);

  const removeToken = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
    hapticLight();
  }, [hapticLight]);

  const filteredPairs = useMemo(() => {
    if (!pickerSearch) return CRYPTO_PAIRS.filter(p => !selectedIds.includes(p.id));
    const q = pickerSearch.toLowerCase();
    return CRYPTO_PAIRS.filter(p =>
      !selectedIds.includes(p.id) &&
      (p.baseAsset.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q))
    );
  }, [pickerSearch, selectedIds]);

  const formatValue = (val: number, format: MetricRow['format']) => {
    switch (format) {
      case 'price': return `$${fmtPrice(val)}`;
      case 'compact': return fmtCompact(val, { prefix: '$' });
      case 'pct': return fmtPct(val);
      default: return val.toFixed(2);
    }
  };

  // Find best value for highlighting
  const getBestIdx = (metric: MetricRow) => {
    if (!metric.highlight || selectedPairs.length < 2) return -1;
    const vals = selectedPairs.map(p => metric.getValue(p));
    return metric.highlight === 'high'
      ? vals.indexOf(Math.max(...vals))
      : vals.indexOf(Math.min(...vals));
  };

  return (
    <PageLayout>
      <Header title="So sánh" back />

      <PageContent gap="default">
        {/* Selected tokens header */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
          {selectedPairs.map(pair => (
            <div
              key={pair.id}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: `${pair.logoColor}18` }}
              >
                <span style={{ color: pair.logoColor, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                  {pair.baseAsset.slice(0, 2)}
                </span>
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  {pair.baseAsset}
                </p>
                <p style={{ color: pair.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.micro }}>
                  {fmtPct(pair.change24h)}
                </p>
              </div>
              {selectedIds.length > 2 && (
                <button onClick={() => removeToken(pair.id)} className="ml-1">
                  <X size={12} color={c.text3} />
                </button>
              )}
            </div>
          ))}
          {selectedIds.length < MAX_COMPARE && (
            <button
              onClick={() => { setShowPicker(true); hapticLight(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{ border: `1.5px dashed ${c.borderSolid}`, color: c.text3 }}
            >
              <Plus size={14} />
              <span style={{ fontSize: FONT_SCALE.xs }}>Thêm</span>
            </button>
          )}
        </div>

        {/* Token picker modal */}
        {showPicker && (
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Chọn token so sánh
              </span>
              <button onClick={() => { setShowPicker(false); setPickerSearch(''); }}>
                <X size={16} color={c.text3} />
              </button>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 mb-3"
              style={{ background: c.surface2, height: 40 }}
            >
              <Search size={14} color={c.text3} />
              <input
                type="text"
                placeholder="Tìm BTC, ETH..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: c.text1, fontSize: FONT_SCALE.xs, flex: 1,
                }}
                autoFocus
              />
            </div>

            {/* Quick picks */}
            {!pickerSearch && (
              <div className="flex gap-2 mb-3">
                {POPULAR_PAIRS.filter(id => !selectedIds.includes(id)).map(id => {
                  const p = CRYPTO_PAIRS.find(pp => pp.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => addToken(id)}
                      className="px-3 py-2 rounded-lg min-h-9"
                      style={{ background: `${p.logoColor}12`, color: p.logoColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}
                    >
                      {p.baseAsset}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {filteredPairs.map(pair => (
                <button
                  key={pair.id}
                  onClick={() => addToken(pair.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left"
                  style={{ background: 'transparent' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: `${pair.logoColor}18` }}
                  >
                    <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: FONT_WEIGHT.bold }}>
                      {pair.baseAsset.slice(0, 2)}
                    </span>
                  </div>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, flex: 1 }}>{pair.baseAsset}</span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>${fmtPrice(pair.price)}</span>
                </button>
              ))}
            </div>
          </TrCard>
        )}

        {/* Sparkline comparison */}
        {selectedPairs.length >= 2 && (
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
              Biểu đồ giá 24h
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedPairs.length}, 1fr)` }}>
              {selectedPairs.map(pair => (
                <div key={pair.id} className="flex flex-col items-center">
                  <SparklineChart
                    data={pair.sparklineData}
                    isPositive={pair.change24h >= 0}
                    width={selectedPairs.length <= 2 ? 120 : 70}
                    height={40}
                  />
                  <span style={{
                    color: pair.logoColor,
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.semibold,
                    marginTop: 6,
                  }}>
                    {pair.baseAsset}
                  </span>
                </div>
              ))}
            </div>
          </TrCard>
        )}

        {/* Comparison table */}
        {selectedPairs.length >= 2 && (
          <PageSection label="So sánh chi tiết" accentColor="#8B5CF6">
            <div className="flex flex-col" style={{ gap: 2 }}>
              {METRICS.map(metric => {
                const bestIdx = getBestIdx(metric);
                return (
                  <div
                    key={metric.key}
                    className="rounded-xl px-4 py-3"
                    style={{ background: c.surface }}
                  >
                    <p style={{
                      color: c.text3, fontSize: FONT_SCALE.micro,
                      fontWeight: FONT_WEIGHT.medium, marginBottom: 8,
                    }}>
                      {metric.label}
                    </p>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedPairs.length}, 1fr)` }}>
                      {selectedPairs.map((pair, idx) => {
                        const val = metric.getValue(pair);
                        const isBest = idx === bestIdx;
                        const isPct = metric.format === 'pct' && metric.key === 'chg';
                        return (
                          <div key={pair.id} className="text-center">
                            <p style={{
                              color: isPct
                                ? (val >= 0 ? '#10B981' : '#EF4444')
                                : isBest ? '#3B82F6' : c.text1,
                              fontSize: FONT_SCALE.sm,
                              fontWeight: isBest ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                            }}>
                              {formatValue(val, metric.format)}
                            </p>
                            {isBest && (
                              <span style={{
                                fontSize: 8,
                                color: '#3B82F6',
                                fontWeight: FONT_WEIGHT.semibold,
                                letterSpacing: 0.5,
                              }}>
                                TỐT NHẤT
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </PageSection>
        )}

        {/* Volume comparison bar */}
        {selectedPairs.length >= 2 && (
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
              Phân bổ khối lượng 24h
            </p>
            {(() => {
              const totalVol = selectedPairs.reduce((s, p) => s + p.volume24h, 0);
              return (
                <div>
                  {/* Stacked bar */}
                  <div className="flex rounded-lg overflow-hidden" style={{ height: 24 }}>
                    {selectedPairs.map(pair => {
                      const pct = (pair.volume24h / totalVol) * 100;
                      return (
                        <div
                          key={pair.id}
                          style={{ width: `${pct}%`, background: pair.logoColor, opacity: 0.7 }}
                        />
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {selectedPairs.map(pair => {
                      const pct = (pair.volume24h / totalVol) * 100;
                      return (
                        <div key={pair.id} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: pair.logoColor }} />
                          <span style={{ color: c.text2, fontSize: FONT_SCALE.micro }}>
                            {pair.baseAsset} {pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </TrCard>
        )}

        {/* Market cap comparison bar */}
        {selectedPairs.length >= 2 && (
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
              Phân bổ vốn hóa
            </p>
            {(() => {
              const totalMcap = selectedPairs.reduce((s, p) => s + p.marketCap, 0);
              return (
                <div className="flex flex-col gap-2">
                  {selectedPairs.map(pair => {
                    const pct = (pair.marketCap / totalMcap) * 100;
                    return (
                      <div key={pair.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: c.text2, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                            {pair.baseAsset}
                          </span>
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                            {fmtCompact(pair.marketCap, { prefix: '$' })} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: pair.logoColor, opacity: 0.8 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TrCard>
        )}

        {selectedPairs.length < 2 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Scale size={48} color={c.text3} style={{ opacity: 0.3 }} />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
              Chọn ít nhất 2 token để so sánh
            </p>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>
              Bấm nút "Thêm" phía trên
            </p>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}