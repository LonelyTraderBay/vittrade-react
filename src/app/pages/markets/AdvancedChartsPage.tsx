/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED CHARTS PAGE — P3 Multi-Indicator Technical Analysis
 * ══════════════════════════════════════════════════════════════════
 *  Indicator library, drawing tools, tech signal summary, pivot
 *  points, multi-timeframe analysis. Route: /markets/advanced-charts
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown, Check, X, Pencil, Layers,
  TrendingUp, TrendingDown, Minus, Info,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtNum } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { CRYPTO_PAIRS } from '../../data/mockData';
import {
  INDICATOR_LIST, DRAWING_TOOLS, TECH_SIGNAL_SUMMARIES,
  type IndicatorConfig, type DrawingTool, type TechSignalSummary,
} from '../../data/marketP3Data';

const TABS = ['Chỉ báo', 'Công cụ vẽ', 'Tín hiệu kỹ thuật'];
const CATEGORIES: { id: IndicatorConfig['category']; label: string; color: string }[] = [
  { id: 'trend', label: 'Xu hướng', color: '#3B82F6' },
  { id: 'momentum', label: 'Động lượng', color: '#F59E0B' },
  { id: 'volatility', label: 'Biến động', color: '#EC4899' },
  { id: 'volume', label: 'Khối lượng', color: '#14B8A6' },
];

const SIGNAL_LABELS: Record<TechSignalSummary['overallSignal'], { label: string; color: string }> = {
  strong_buy: { label: 'Mua mạnh', color: '#059669' },
  buy: { label: 'Mua', color: '#10B981' },
  neutral: { label: 'Trung lập', color: '#6B7280' },
  sell: { label: 'Bán', color: '#EF4444' },
  strong_sell: { label: 'Bán mạnh', color: '#DC2626' },
};

const DRAWING_CATEGORIES: { id: DrawingTool['category']; label: string }[] = [
  { id: 'line', label: 'Đường' },
  { id: 'shape', label: 'Hình dạng' },
  { id: 'fib', label: 'Fibonacci' },
  { id: 'measure', label: 'Đo lường' },
];

export function AdvancedChartsPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState('Chỉ báo');
  const [catFilter, setCatFilter] = useState<IndicatorConfig['category'] | 'all'>('all');
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set(['sma', 'rsi']));
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [drawCatFilter, setDrawCatFilter] = useState<DrawingTool['category'] | 'all'>('all');

  const filteredIndicators = useMemo(() => {
    if (catFilter === 'all') return INDICATOR_LIST;
    return INDICATOR_LIST.filter(i => i.category === catFilter);
  }, [catFilter]);

  const filteredTools = useMemo(() => {
    if (drawCatFilter === 'all') return DRAWING_TOOLS;
    return DRAWING_TOOLS.filter(t => t.category === drawCatFilter);
  }, [drawCatFilter]);

  const toggleIndicator = (id: string) => {
    setActiveIndicators(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    hapticSelection();
  };

  return (
    <PageLayout>
      <Header title="Phân tích kỹ thuật" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* ═══ Indicators tab ═══ */}
        {tab === 'Chỉ báo' && (
          <>
            {/* Active indicators count */}
            <div className="flex items-center justify-between">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                Đang sử dụng: {activeIndicators.size} chỉ báo
              </p>
              {activeIndicators.size > 0 && (
                <button
                  onClick={() => { setActiveIndicators(new Set()); hapticLight(); }}
                  className="px-2 py-1 rounded"
                  style={{ color: '#EF4444', fontSize: FONT_SCALE.micro }}
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Active chips */}
            {activeIndicators.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(activeIndicators).map(id => {
                  const ind = INDICATOR_LIST.find(i => i.id === id);
                  if (!ind) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                      style={{
                        background: `${ind.color}15`,
                        border: `1px solid ${ind.color}30`,
                      }}
                    >
                      <span style={{ color: ind.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                        {ind.shortName}
                      </span>
                      <button onClick={() => toggleIndicator(id)}>
                        <X size={10} color={ind.color} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
              <button
                onClick={() => { setCatFilter('all'); hapticSelection(); }}
                className="shrink-0 px-3 py-1.5 rounded-xl"
                style={{
                  background: catFilter === 'all' ? c.chipActiveBg : c.surface2,
                  color: catFilter === 'all' ? c.chipActiveText : c.text3,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                Tất cả
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCatFilter(cat.id); hapticSelection(); }}
                  className="shrink-0 px-3 py-1.5 rounded-xl"
                  style={{
                    background: catFilter === cat.id ? `${cat.color}15` : c.surface2,
                    color: catFilter === cat.id ? cat.color : c.text3,
                    border: `1px solid ${catFilter === cat.id ? `${cat.color}30` : 'transparent'}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Indicator list */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              {filteredIndicators.map(ind => {
                const isActive = activeIndicators.has(ind.id);
                const isExpanded = expandedIndicator === ind.id;
                const catCfg = CATEGORIES.find(c => c.id === ind.category);

                return (
                  <TrCard key={ind.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedIndicator(isExpanded ? null : ind.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${ind.color}12` }}
                      >
                        <span style={{ color: ind.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {ind.shortName.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                            {ind.shortName}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{ background: `${catCfg?.color ?? '#6B7280'}10`, color: catCfg?.color ?? '#6B7280', fontSize: 8 }}
                          >
                            {catCfg?.label}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 1 }}>
                          {ind.name}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleIndicator(ind.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isActive ? `${ind.color}15` : c.surface2,
                          border: `1px solid ${isActive ? ind.color : c.borderSolid}`,
                        }}
                      >
                        {isActive ? <Check size={14} color={ind.color} /> : <span style={{ color: c.text3, fontSize: 14 }}>+</span>}
                      </button>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
                        <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginBottom: 8 }}>
                          {ind.description}
                        </p>
                        {ind.params.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {ind.params.map(param => (
                              <div key={param.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: c.surface2 }}>
                                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{param.label}:</span>
                                <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                                  {param.default}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </TrCard>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ Drawing Tools tab ═══ */}
        {tab === 'Công cụ vẽ' && (
          <>
            {/* Info banner */}
            <TrCard className="p-4" accentBorder="rgba(59,130,246,0.15)">
              <div className="flex gap-3">
                <Pencil size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                    Bộ công cụ vẽ chuyên nghiệp
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Chọn công cụ bên dưới để vẽ trên biểu đồ. Hỗ trợ đường xu hướng, kênh giá, Fibonacci và đo lường.
                  </p>
                </div>
              </div>
            </TrCard>

            {/* Category filter */}
            <div className="flex gap-2">
              <button
                onClick={() => { setDrawCatFilter('all'); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl"
                style={{
                  background: drawCatFilter === 'all' ? c.chipActiveBg : c.surface2,
                  color: drawCatFilter === 'all' ? c.chipActiveText : c.text3,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                Tất cả
              </button>
              {DRAWING_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setDrawCatFilter(cat.id); hapticSelection(); }}
                  className="px-3 py-1.5 rounded-xl"
                  style={{
                    background: drawCatFilter === cat.id ? c.chipActiveBg : c.surface2,
                    color: drawCatFilter === cat.id ? c.chipActiveText : c.text3,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Drawing tools grid */}
            <div className="grid grid-cols-3 gap-2">
              {filteredTools.map(tool => {
                const catLabel = DRAWING_CATEGORIES.find(c => c.id === tool.category)?.label ?? '';
                return (
                  <TrCard key={tool.id} as="button" hover className="p-3 text-center">
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{tool.icon}</span>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                      {tool.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 8 }}>{catLabel}</p>
                  </TrCard>
                );
              })}
            </div>

            {/* Quick tips */}
            <PageSection label="Mẹo sử dụng" accentColor="#F59E0B">
              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  {[
                    { tip: 'Nhấn giữ để vẽ đường xu hướng trên chart', icon: '📏' },
                    { tip: 'Double-tap để đặt điểm Fibonacci', icon: '🔢' },
                    { tip: 'Kéo 2 ngón để zoom in/out biểu đồ', icon: '🔍' },
                    { tip: 'Vuốt ngang để di chuyển timeline', icon: '👆' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                        {item.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {/* ═══ Technical Signals tab ═══ */}
        {tab === 'Tín hiệu kỹ thuật' && (
          <>
            {/* Disclaimer */}
            <TrCard className="p-3" accentBorder="rgba(245,158,11,0.15)">
              <div className="flex gap-2">
                <Info size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                  Tín hiệu kỹ thuật chỉ mang tính tham khảo. Không phải khuyến nghị đầu tư.
                </p>
              </div>
            </TrCard>

            {/* Signal summaries per pair */}
            <div className="flex flex-col" style={{ gap: 8 }}>
              {TECH_SIGNAL_SUMMARIES.map(signal => {
                const signalCfg = SIGNAL_LABELS[signal.overallSignal];
                const maCfg = SIGNAL_LABELS[signal.maSummary === 'buy' ? 'buy' : signal.maSummary === 'sell' ? 'sell' : 'neutral'];
                const oscCfg = SIGNAL_LABELS[signal.oscSummary === 'buy' ? 'buy' : signal.oscSummary === 'sell' ? 'sell' : 'neutral'];
                const total = signal.buyCount + signal.sellCount + signal.neutralCount;

                return (
                  <TrCard key={signal.pair} className="p-4">
                    {/* Pair header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                          {signal.pair}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: c.surface2, color: c.text3, fontSize: 10 }}
                        >
                          {signal.timeframe}
                        </span>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          background: `${signalCfg.color}12`,
                          color: signalCfg.color,
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.bold,
                        }}
                      >
                        {signalCfg.label}
                      </span>
                    </div>

                    {/* Buy/Sell/Neutral bar */}
                    <div className="mb-3">
                      <div className="flex rounded overflow-hidden" style={{ height: 8 }}>
                        <div style={{ width: `${(signal.buyCount / total) * 100}%`, background: '#10B981' }} />
                        <div style={{ width: `${(signal.neutralCount / total) * 100}%`, background: '#6B7280' }} />
                        <div style={{ width: `${(signal.sellCount / total) * 100}%`, background: '#EF4444' }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span style={{ color: '#10B981', fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}>
                          Mua {signal.buyCount}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: 10 }}>
                          Trung lập {signal.neutralCount}
                        </span>
                        <span style={{ color: '#EF4444', fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}>
                          Bán {signal.sellCount}
                        </span>
                      </div>
                    </div>

                    {/* MA + Oscillator summary */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Moving Averages</p>
                        <p style={{ color: maCfg.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {maCfg.label}
                        </p>
                      </div>
                      <div className="px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Oscillators</p>
                        <p style={{ color: oscCfg.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {oscCfg.label}
                        </p>
                      </div>
                    </div>

                    {/* Pivot points */}
                    <div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, marginBottom: 6 }}>
                        Pivot Points
                      </p>
                      <div className="flex gap-1">
                        {signal.pivotPoints.map(pp => {
                          const isPivot = pp.label === 'Pivot';
                          const isSupport = pp.label.startsWith('S');
                          const color = isPivot ? '#3B82F6' : isSupport ? '#10B981' : '#EF4444';
                          return (
                            <div
                              key={pp.label}
                              className="flex-1 text-center py-1.5 rounded"
                              style={{
                                background: isPivot ? `${color}12` : 'transparent',
                                border: isPivot ? `1px solid ${color}30` : 'none',
                              }}
                            >
                              <p style={{ color, fontSize: 8, fontWeight: FONT_WEIGHT.semibold }}>{pp.label}</p>
                              <p style={{ color: c.text1, fontSize: 10, fontWeight: FONT_WEIGHT.medium }}>
                                {fmtNum(pp.value)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}