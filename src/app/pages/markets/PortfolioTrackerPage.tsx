/**
 * ══════════════════════════════════════════════════════════════════
 *  PORTFOLIO TRACKER PAGE — P2 Holdings & Performance Analysis
 * ══════════════════════════════════════════════════════════════════
 *  Portfolio overview, allocation chart, PnL tracking, performance
 *  timeline, asset breakdown. Route: /markets/portfolio
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowUpRight, ArrowDownRight, TrendingUp,
  PieChart, BarChart3, Eye, EyeOff,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { SparklineChart } from '../../components/trading/SparklineChart';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtUsd, fmtPct, fmtCompact, fmtPrice } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  PORTFOLIO_HOLDINGS, PORTFOLIO_STATS, PORTFOLIO_PERFORMANCE,
  type PortfolioHolding,
} from '../../data/marketP2Data';

const TABS = ['Tổng quan', 'Tài sản', 'Hiệu suất'];
const TIME_FILTERS = ['24h', '7d', '30d', 'Tất cả'];

export function PortfolioTrackerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState('Tổng quan');
  const [timeFilter, setTimeFilter] = useState('30d');
  const [hideBalance, setHideBalance] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'change'>('value');

  const stats = PORTFOLIO_STATS;

  const sortedHoldings = useMemo(() => {
    const items = [...PORTFOLIO_HOLDINGS];
    switch (sortBy) {
      case 'value': return items.sort((a, b) => b.value - a.value);
      case 'pnl': return items.sort((a, b) => b.pnlPct - a.pnlPct);
      case 'change': return items.sort((a, b) => b.change24h - a.change24h);
      default: return items;
    }
  }, [sortBy]);

  const maskedValue = (val: string) => hideBalance ? '••••••' : val;

  return (
    <PageLayout>
      <Header title="Danh mục" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* ═══ Overview tab ═══ */}
        {tab === 'Tổng quan' && (
          <>
            {/* Total value hero */}
            <TrCard variant="hero" className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>
                  Tổng giá trị
                </p>
                <button onClick={() => { setHideBalance(!hideBalance); hapticLight(); }}>
                  {hideBalance
                    ? <EyeOff size={16} color={c.text3} />
                    : <Eye size={16} color={c.text3} />
                  }
                </button>
              </div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>
                {maskedValue(fmtUsd(stats.totalValue))}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {stats.totalPnl >= 0
                  ? <ArrowUpRight size={14} color="#10B981" />
                  : <ArrowDownRight size={14} color="#EF4444" />
                }
                <span style={{
                  color: stats.totalPnl >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                  {maskedValue(`${fmtUsd(Math.abs(stats.totalPnl))} (${fmtPct(stats.totalPnlPct)})`)}
                </span>
              </div>
            </TrCard>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <TrCard className="p-3 text-center">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Vốn đầu tư</p>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {maskedValue(fmtCompact(stats.totalCost, { prefix: '$' }))}
                </p>
              </TrCard>
              <TrCard className="p-3 text-center">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Tốt nhất 24h</p>
                <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {stats.best24h.symbol} {fmtPct(stats.best24h.change)}
                </p>
              </TrCard>
              <TrCard className="p-3 text-center">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Kém nhất 24h</p>
                <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {stats.worst24h.symbol} {fmtPct(stats.worst24h.change)}
                </p>
              </TrCard>
            </div>

            {/* Allocation donut */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
                Phân bổ tài sản
              </p>
              <div className="flex items-center gap-4">
                <AllocationDonut holdings={PORTFOLIO_HOLDINGS} c={c} />
                <div className="flex-1 flex flex-col gap-2">
                  {PORTFOLIO_HOLDINGS.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: h.color }} />
                      <span style={{ color: c.text2, fontSize: FONT_SCALE.micro, flex: 1 }}>
                        {h.symbol}
                      </span>
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                        {h.allocation.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TrCard>

            {/* Top holdings */}
            <PageSection label="Tài sản chính" accentColor="#3B82F6">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {PORTFOLIO_HOLDINGS.slice(0, 4).map(holding => (
                  <HoldingRow
                    key={holding.id}
                    holding={holding}
                    c={c}
                    hideBalance={hideBalance}
                    onTap={() => { navigate(`${prefix}/pair/${holding.id}usdt`); hapticLight(); }}
                  />
                ))}
              </div>
            </PageSection>

            {/* Risk indicator */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  Đánh giá rủi ro
                </p>
                <span
                  className="px-2 py-0.5 rounded"
                  style={{
                    background: stats.stableAllocation > 20 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: stats.stableAllocation > 20 ? '#10B981' : '#F59E0B',
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}
                >
                  {stats.stableAllocation > 20 ? 'Cân bằng' : 'Rủi ro cao'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Stablecoin</span>
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                      {stats.stableAllocation}%
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: c.surface2 }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${stats.stableAllocation}%`,
                        background: '#10B981',
                      }}
                    />
                  </div>
                </div>
              </div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 8, lineHeight: 1.5 }}>
                Danh mục có {stats.stableAllocation}% stablecoin, giúp giảm biến động. 
                Khuyến nghị duy trì ít nhất 10-20% stablecoin cho quản lý rủi ro.
              </p>
            </TrCard>
          </>
        )}

        {/* ═══ Assets tab ═══ */}
        {tab === 'Tài sản' && (
          <>
            {/* Sort options */}
            <div className="flex gap-2">
              {([
                { id: 'value' as const, label: 'Giá trị' },
                { id: 'pnl' as const, label: 'Lãi/Lỗ' },
                { id: 'change' as const, label: 'Thay đổi 24h' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); hapticSelection(); }}
                  className="px-3 py-1.5 rounded-xl"
                  style={{
                    background: sortBy === opt.id ? c.chipActiveBg : c.surface2,
                    color: sortBy === opt.id ? c.chipActiveText : c.text3,
                    border: `1px solid ${sortBy === opt.id ? c.chipActiveBorder : 'transparent'}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Full holdings list */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              {sortedHoldings.map(holding => (
                <HoldingDetailCard
                  key={holding.id}
                  holding={holding}
                  c={c}
                  hideBalance={hideBalance}
                  onTap={() => { navigate(`${prefix}/pair/${holding.id}usdt`); hapticLight(); }}
                />
              ))}
            </div>
          </>
        )}

        {/* ═══ Performance tab ═══ */}
        {tab === 'Hiệu suất' && (
          <>
            {/* Time filter */}
            <div className="flex gap-2">
              {TIME_FILTERS.map(tf => (
                <button
                  key={tf}
                  onClick={() => { setTimeFilter(tf); hapticSelection(); }}
                  className="px-3 py-1.5 rounded-xl"
                  style={{
                    background: timeFilter === tf ? c.chipActiveBg : c.surface2,
                    color: timeFilter === tf ? c.chipActiveText : c.text3,
                    border: `1px solid ${timeFilter === tf ? c.chipActiveBorder : 'transparent'}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Performance chart */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  Giá trị danh mục
                </p>
                <span style={{
                  color: '#10B981',
                  fontSize: FONT_SCALE.xs,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                  {fmtPct(stats.totalPnlPct)}
                </span>
              </div>
              <PerformanceChart data={PORTFOLIO_PERFORMANCE} c={c} />
            </TrCard>

            {/* PnL breakdown */}
            <PageSection label="Lãi/Lỗ theo tài sản" accentColor="#10B981">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {PORTFOLIO_HOLDINGS
                  .filter(h => h.symbol !== 'USDT')
                  .sort((a, b) => b.pnl - a.pnl)
                  .map(holding => {
                    const maxPnl = Math.max(...PORTFOLIO_HOLDINGS.map(h => Math.abs(h.pnl)));
                    const barWidth = Math.min(100, (Math.abs(holding.pnl) / maxPnl) * 100);
                    return (
                      <div key={holding.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: c.surface }}>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${holding.color}18` }}
                        >
                          <span style={{ color: holding.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {holding.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                              {holding.symbol}
                            </span>
                            <span style={{
                              color: holding.pnl >= 0 ? '#10B981' : '#EF4444',
                              fontSize: FONT_SCALE.xs,
                              fontWeight: FONT_WEIGHT.bold,
                            }}>
                              {maskedValue(`${holding.pnl >= 0 ? '+' : ''}${fmtUsd(holding.pnl)}`)}
                            </span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: c.surface2 }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barWidth}%`,
                                background: holding.pnl >= 0 ? '#10B981' : '#EF4444',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </PageSection>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2">
              <TrCard className="p-3">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>Tổng lãi/lỗ</p>
                <p style={{
                  color: stats.totalPnl >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                }}>
                  {maskedValue(`${stats.totalPnl >= 0 ? '+' : ''}${fmtUsd(stats.totalPnl)}`)}
                </p>
              </TrCard>
              <TrCard className="p-3">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>ROI tổng</p>
                <p style={{
                  color: stats.totalPnlPct >= 0 ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                }}>
                  {fmtPct(stats.totalPnlPct)}
                </p>
              </TrCard>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function AllocationDonut({ holdings, c }: {
  holdings: PortfolioHolding[];
  c: ReturnType<typeof useThemeColors>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 120;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = 52;
    const innerR = 36;

    let startAngle = -Math.PI / 2;

    holdings.forEach(h => {
      const sliceAngle = (h.allocation / 100) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = h.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;

      startAngle = endAngle;
    });

    // Center text
    ctx.fillStyle = c.text1;
    ctx.font = `700 14px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${holdings.length}`, cx, cy - 6);

    ctx.fillStyle = c.text3;
    ctx.font = `500 9px system-ui`;
    ctx.fillText('tài sản', cx, cy + 8);

  }, [holdings, c]);

  return <canvas ref={canvasRef} />;
}

function HoldingRow({ holding, c, hideBalance, onTap }: {
  holding: PortfolioHolding;
  c: ReturnType<typeof useThemeColors>;
  hideBalance: boolean;
  onTap: () => void;
}) {
  const masked = (v: string) => hideBalance ? '••••' : v;

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left"
      style={{ background: c.surface }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${holding.color}18` }}
      >
        <span style={{ color: holding.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {holding.symbol.slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          {holding.symbol}
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
          {masked(holding.quantity.toFixed(4))} · {holding.allocation}%
        </p>
      </div>
      <div className="shrink-0">
        <SparklineChart data={holding.sparkline} isPositive={holding.change24h >= 0} width={48} height={20} />
      </div>
      <div className="text-right shrink-0" style={{ minWidth: 72 }}>
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          {masked(fmtUsd(holding.value))}
        </p>
        <span style={{
          color: holding.pnlPct >= 0 ? '#10B981' : '#EF4444',
          fontSize: FONT_SCALE.micro,
          fontWeight: FONT_WEIGHT.medium,
        }}>
          {fmtPct(holding.pnlPct)}
        </span>
      </div>
    </button>
  );
}

function HoldingDetailCard({ holding, c, hideBalance, onTap }: {
  holding: PortfolioHolding;
  c: ReturnType<typeof useThemeColors>;
  hideBalance: boolean;
  onTap: () => void;
}) {
  const masked = (v: string) => hideBalance ? '••••••' : v;

  return (
    <TrCard as="button" hover className="p-4 w-full text-left" onClick={onTap}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${holding.color}18` }}
        >
          <span style={{ color: holding.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
            {holding.symbol.slice(0, 2)}
          </span>
        </div>
        <div className="flex-1">
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            {holding.symbol}
          </span>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{holding.name}</p>
        </div>
        <div className="text-right">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            {masked(fmtUsd(holding.value))}
          </p>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
            {holding.allocation.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Số lượng</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {masked(holding.quantity.toFixed(4))}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Giá TB mua</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            ${fmtPrice(holding.avgBuyPrice)}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Giá hiện tại</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            ${fmtPrice(holding.currentPrice)}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Lãi/Lỗ</p>
          <p style={{
            color: holding.pnl >= 0 ? '#10B981' : '#EF4444',
            fontSize: FONT_SCALE.xs,
            fontWeight: FONT_WEIGHT.bold,
          }}>
            {masked(fmtPct(holding.pnlPct))}
          </p>
        </div>
      </div>
    </TrCard>
  );
}

function PerformanceChart({ data, c }: {
  data: { date: string; value: number }[];
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
    const height = 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const values = data.map(d => d.value);
    const minVal = Math.min(...values) * 0.995;
    const maxVal = Math.max(...values) * 1.005;
    const range = maxVal - minVal;

    const padding = { top: 8, bottom: 24, left: 0, right: 0 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const isUp = values[values.length - 1] >= values[0];
    const lineColor = isUp ? '#10B981' : '#EF4444';

    // Area fill
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + (1 - (d.value - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, padding.top, 0, height);
    grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + (1 - (d.value - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End dot
    const lastX = padding.left + chartW;
    const lastY = padding.top + (1 - (values[values.length - 1] - minVal) / range) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // X labels
    ctx.fillStyle = c.text3;
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    [0, Math.floor(data.length / 2), data.length - 1].forEach(i => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      ctx.fillText(data[i].date, x, height - 4);
    });

  }, [data, c]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}