/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET CORRELATIONS PAGE — P3 Cross-Asset Correlation Matrix
 * ══════════════════════════════════════════════════════════════════
 *  Correlation heatmap, diversification score, pair analysis,
 *  portfolio risk insights. Route: /markets/correlations
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Grid3X3, BarChart3, Shield, Info,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  CORR_ASSETS, getCorrelationMatrix, getCorrelationPairs,
  calcDiversificationScore, type CorrelationPair,
} from '../../data/marketP3Data';

const TABS = ['Ma trận', 'Cặp tương quan', 'Đa dạng hóa'];
const TIMEFRAMES = ['7d', '30d', '90d'] as const;

function getCorrColor(value: number): string {
  if (value >= 0.85) return '#DC2626';
  if (value >= 0.7) return '#EF4444';
  if (value >= 0.5) return '#F59E0B';
  if (value >= 0.3) return '#10B981';
  if (value >= 0.0) return '#06B6D4';
  return '#3B82F6';
}

function getCorrLabel(value: number): string {
  if (value >= 0.85) return 'Rất cao';
  if (value >= 0.7) return 'Cao';
  if (value >= 0.5) return 'Trung bình';
  if (value >= 0.3) return 'Thấp';
  return 'Rất thấp';
}

export function MarketCorrelationsPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const [tab, setTab] = useState('Ma trận');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high');

  const matrix = useMemo(() => getCorrelationMatrix(timeframe), [timeframe]);
  const pairs = useMemo(() => {
    const p = getCorrelationPairs(timeframe);
    const getVal = (pair: CorrelationPair) =>
      timeframe === '7d' ? pair.correlation7d : timeframe === '30d' ? pair.correlation30d : pair.correlation90d;
    return sortOrder === 'high'
      ? p.sort((a, b) => getVal(b) - getVal(a))
      : p.sort((a, b) => getVal(a) - getVal(b));
  }, [timeframe, sortOrder]);

  const divScore = useMemo(() => calcDiversificationScore(timeframe), [timeframe]);

  return (
    <PageLayout>
      <Header title="Tương quan thị trường" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Timeframe selector */}
        <div className="flex gap-2">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); hapticSelection(); }}
              className="px-3 py-2 rounded-xl min-h-9"
              style={{
                background: timeframe === tf ? c.chipActiveBg : c.surface2,
                color: timeframe === tf ? c.chipActiveText : c.text3,
                border: `1px solid ${timeframe === tf ? c.chipActiveBorder : 'transparent'}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.medium,
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* ═══ Matrix tab ═══ */}
        {tab === 'Ma trận' && (
          <>
            <TrCard className="p-3">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8 }}>
                Ma trận tương quan ({timeframe})
              </p>
              <CorrelationHeatmap matrix={matrix} assets={CORR_ASSETS} c={c} />
            </TrCard>

            {/* Legend */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {[
                { label: 'Rất cao (>0.85)', color: '#DC2626' },
                { label: 'Cao (0.7-0.85)', color: '#EF4444' },
                { label: 'TB (0.5-0.7)', color: '#F59E0B' },
                { label: 'Thấp (0.3-0.5)', color: '#10B981' },
                { label: 'Rất thấp (<0.3)', color: '#06B6D4' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  <span style={{ color: c.text3, fontSize: 8 }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Info card */}
            <TrCard className="p-4" accentBorder="rgba(59,130,246,0.12)">
              <div className="flex gap-3">
                <Info size={14} color="#3B82F6" className="shrink-0 mt-1" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                    Cách đọc ma trận
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    Giá trị 1.0 = hoàn toàn cùng chiều. Giá trị 0 = không liên quan. 
                    Tương quan cao có nghĩa 2 tài sản thường di chuyển cùng hướng. 
                    Để giảm rủi ro, nên giữ tài sản có tương quan thấp.
                  </p>
                </div>
              </div>
            </TrCard>

            {/* Quick insights */}
            <div className="grid grid-cols-2 gap-2">
              <TrCard className="p-3 text-center">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Cao nhất</p>
                <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                  {divScore.highestCorr.value.toFixed(2)}
                </p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{divScore.highestCorr.pair}</p>
              </TrCard>
              <TrCard className="p-3 text-center">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Thấp nhất</p>
                <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                  {divScore.lowestCorr.value.toFixed(2)}
                </p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{divScore.lowestCorr.pair}</p>
              </TrCard>
            </div>

            {/* Recommendation */}
            <TrCard className="p-4" accentBorder="rgba(59,130,246,0.12)">
              <div className="flex gap-3">
                <Shield size={16} color="#3B82F6" className="shrink-0 mt-1" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>
                    Khuyến nghị
                  </p>
                  <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    {divScore.recommendation}
                  </p>
                </div>
              </div>
            </TrCard>
          </>
        )}

        {/* ═══ Pairs tab ═══ */}
        {tab === 'Cặp tương quan' && (
          <>
            {/* Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => { setSortOrder('high'); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl"
                style={{
                  background: sortOrder === 'high' ? 'rgba(239,68,68,0.1)' : c.surface2,
                  color: sortOrder === 'high' ? '#EF4444' : c.text3,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                Tương quan cao
              </button>
              <button
                onClick={() => { setSortOrder('low'); hapticSelection(); }}
                className="px-3 py-1.5 rounded-xl"
                style={{
                  background: sortOrder === 'low' ? 'rgba(16,185,129,0.1)' : c.surface2,
                  color: sortOrder === 'low' ? '#10B981' : c.text3,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                Tương quan thấp
              </button>
            </div>

            {/* Pairs list */}
            <div className="flex flex-col" style={{ gap: 2 }}>
              {pairs.map((pair, idx) => {
                const val = timeframe === '7d' ? pair.correlation7d : timeframe === '30d' ? pair.correlation30d : pair.correlation90d;
                const maxVal = Math.max(...pairs.map(p => timeframe === '7d' ? p.correlation7d : timeframe === '30d' ? p.correlation30d : p.correlation90d));
                const barWidth = (val / maxVal) * 100;

                return (
                  <div key={`${pair.assetA}-${pair.assetB}`} className="flex items-center gap-3 px-4 py-3 rounded-xl relative" style={{ background: c.surface }}>
                    {/* Background bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl"
                      style={{
                        width: `${barWidth}%`,
                        background: `${getCorrColor(val)}06`,
                      }}
                    />

                    {/* Rank */}
                    <span style={{ color: c.text3, fontSize: 10, width: 16, position: 'relative', zIndex: 1 }}>
                      {idx + 1}
                    </span>

                    {/* Asset pair */}
                    <div className="flex items-center gap-1.5 relative z-10">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: `${pair.colorA}18` }}
                      >
                        <span style={{ color: pair.colorA, fontSize: 7, fontWeight: FONT_WEIGHT.bold }}>
                          {pair.assetA.slice(0, 2)}
                        </span>
                      </div>
                      <span style={{ color: c.text3, fontSize: 10 }}>↔</span>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: `${pair.colorB}18` }}
                      >
                        <span style={{ color: pair.colorB, fontSize: 7, fontWeight: FONT_WEIGHT.bold }}>
                          {pair.assetB.slice(0, 2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        {pair.assetA}/{pair.assetB}
                      </span>
                    </div>

                    <div className="text-right shrink-0 relative z-10">
                      <p style={{
                        color: getCorrColor(val),
                        fontSize: FONT_SCALE.sm,
                        fontWeight: FONT_WEIGHT.bold,
                      }}>
                        {val.toFixed(2)}
                      </p>
                      <p style={{ color: c.text3, fontSize: 8 }}>{getCorrLabel(val)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ Diversification tab ═══ */}
        {tab === 'Đa dạng hóa' && (
          <>
            {/* Diversification score hero */}
            <TrCard variant="hero" className="p-4">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, marginBottom: 4 }}>
                Chỉ số đa dạng hóa
              </p>
              <div className="flex items-end gap-3 mb-3">
                <span style={{
                  color: divScore.score >= 50 ? '#10B981' : divScore.score >= 30 ? '#F59E0B' : '#EF4444',
                  fontSize: FONT_SCALE.xl,
                  fontWeight: FONT_WEIGHT.bold,
                }}>
                  {divScore.score}
                </span>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, paddingBottom: 3 }}>/ 100</span>
                <span
                  className="px-2 py-1 rounded-lg mb-1"
                  style={{
                    background: divScore.score >= 50 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: divScore.score >= 50 ? '#10B981' : '#F59E0B',
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}
                >
                  {divScore.label}
                </span>
              </div>

              {/* Score bar */}
              <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: c.surface2 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${divScore.score}%`,
                    background: `linear-gradient(90deg, #EF4444, #F59E0B, #10B981)`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: '#EF4444', fontSize: 8 }}>Kém</span>
                <span style={{ color: '#F59E0B', fontSize: 8 }}>TB</span>
                <span style={{ color: '#10B981', fontSize: 8 }}>Tốt</span>
              </div>
            </TrCard>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
              <TrCard className="p-3">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Tương quan TB</p>
                <p style={{
                  color: divScore.avgCorrelation > 0.7 ? '#EF4444' : '#F59E0B',
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                }}>
                  {divScore.avgCorrelation.toFixed(2)}
                </p>
              </TrCard>
              <TrCard className="p-3">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Cặp ít tương quan nhất</p>
                <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                  {divScore.lowestCorr.pair}
                </p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{divScore.lowestCorr.value.toFixed(2)}</p>
              </TrCard>
            </div>

            {/* Correlation by timeframe comparison */}
            <PageSection label="So sánh theo thời gian" accentColor="#8B5CF6">
              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  {TIMEFRAMES.map(tf => {
                    const score = calcDiversificationScore(tf);
                    return (
                      <div key={tf} className="flex items-center gap-3">
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, width: 28 }}>{tf}</span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: c.surface2 }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score.score}%`,
                              background: score.score >= 50 ? '#10B981' : score.score >= 30 ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </div>
                        <span style={{
                          color: score.score >= 50 ? '#10B981' : score.score >= 30 ? '#F59E0B' : '#EF4444',
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.bold,
                          width: 28,
                          textAlign: 'right',
                        }}>
                          {score.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            </PageSection>

            {/* Disclaimer */}
            <TrCard className="p-3" accentBorder="rgba(245,158,11,0.12)">
              <div className="flex gap-2">
                <Info size={12} color="#F59E0B" className="shrink-0 mt-1" />
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                  Tương quan quá khứ không đảm bảo tương lai. Trong giai đoạn biến động mạnh, 
                  tương quan giữa crypto thường tăng cao (risk-on/risk-off). Chỉ mang tính tham khảo.
                </p>
              </div>
            </TrCard>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Heatmap Component ─── */

function CorrelationHeatmap({ matrix, assets, c }: {
  matrix: number[][];
  assets: { symbol: string; color: string }[];
  c: ReturnType<typeof useThemeColors>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const n = assets.length;
    const labelSize = 28;
    const cellSize = (width - labelSize) / n;
    const height = labelSize + cellSize * n;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Column labels (top)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    assets.forEach((asset, i) => {
      const x = labelSize + i * cellSize + cellSize / 2;
      ctx.fillStyle = asset.color;
      ctx.font = '500 8px system-ui';
      ctx.fillText(asset.symbol, x, labelSize - 4);
    });

    // Row labels (left) + cells
    assets.forEach((rowAsset, row) => {
      // Row label
      const y = labelSize + row * cellSize + cellSize / 2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rowAsset.color;
      ctx.font = '500 8px system-ui';
      ctx.fillText(rowAsset.symbol, labelSize - 4, y);

      // Cells
      assets.forEach((_, col) => {
        const val = matrix[row][col];
        const x = labelSize + col * cellSize;
        const cellY = labelSize + row * cellSize;

        // Cell background
        const color = getCorrColor(val);
        const opacity = row === col ? 0.6 : 0.12 + val * 0.35;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(x + 1, cellY + 1, cellSize - 2, cellSize - 2);
        ctx.globalAlpha = 1;

        // Cell border
        ctx.strokeStyle = c.borderSolid;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, cellY + 1, cellSize - 2, cellSize - 2);

        // Cell value
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = val >= 0.7 ? '#fff' : c.text1;
        ctx.font = `${row === col ? '600' : '500'} ${row === col ? '8' : '7'}px system-ui`;
        ctx.fillText(
          row === col ? '1.0' : val.toFixed(2),
          x + cellSize / 2,
          cellY + cellSize / 2
        );
      });
    });

  }, [matrix, assets, c]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}