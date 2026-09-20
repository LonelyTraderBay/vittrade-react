/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET DEPTH PAGE — P2 Visual Depth Chart & Order Book Analysis
 * ══════════════════════════════════════════════════════════════════
 *  Cumulative bid/ask depth visualization, spread analysis,
 *  whale order alerts, order book density. Route: /pair/:pairId/depth
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle,
  Layers, Activity, BarChart3,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { CRYPTO_PAIRS } from '../../data/mockData';
import { generateDepthData, generateWhaleOrders, type DepthLevel } from '../../data/marketP2Data';

const TABS = ['Depth Chart', 'Order Book', 'Whale Alert'];

export function MarketDepthPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { hapticSelection } = useHaptic();
  const { pairId } = useParams<{ pairId: string }>();

  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const [tab, setTab] = useState('Depth Chart');
  const [depthLevels, setDepthLevels] = useState(25);

  const depth = useMemo(
    () => generateDepthData(pair.price, depthLevels),
    [pair.price, depthLevels]
  );

  const whaleOrders = useMemo(
    () => generateWhaleOrders(pair.price),
    [pair.price]
  );

  return (
    <PageLayout>
      <Header title={`${pair.baseAsset} Depth`} back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Pair summary header */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${pair.logoColor}18` }}
              >
                <span style={{ color: pair.logoColor, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                  {pair.baseAsset.slice(0, 2)}
                </span>
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                  {pair.symbol}
                </p>
                <div className="flex items-center gap-1">
                  {pair.change24h >= 0
                    ? <ArrowUpRight size={12} color="#10B981" />
                    : <ArrowDownRight size={12} color="#EF4444" />
                  }
                  <span style={{
                    color: pair.change24h >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}>
                    {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
                ${fmtPrice(pair.price)}
              </p>
            </div>
          </div>
        </TrCard>

        {/* ═══ Depth Chart tab ═══ */}
        {tab === 'Depth Chart' && (
          <>
            {/* Spread info */}
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Spread" value={`$${depth.spread.toFixed(2)}`} sub={`${depth.spreadPct.toFixed(4)}%`} c={c} />
              <MiniStat label="Bid Wall" value={fmtCompact(depth.bids.reduce((s, b) => s + b.quantity, 0))} sub={pair.baseAsset} c={c} color="#10B981" />
              <MiniStat label="Ask Wall" value={fmtCompact(depth.asks.reduce((s, a) => s + a.quantity, 0))} sub={pair.baseAsset} c={c} color="#EF4444" />
            </div>

            {/* Depth chart visualization */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  Biểu đồ độ sâu
                </p>
                <div className="flex gap-2">
                  {[15, 25, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => { setDepthLevels(n); hapticSelection(); }}
                      className="px-2 py-1 rounded"
                      style={{
                        background: depthLevels === n ? c.chipActiveBg : 'transparent',
                        color: depthLevels === n ? c.chipActiveText : c.text3,
                        fontSize: FONT_SCALE.micro,
                        fontWeight: FONT_WEIGHT.medium,
                      }}
                    >
                      {n}L
                    </button>
                  ))}
                </div>
              </div>

              <DepthChartCanvas
                bids={depth.bids}
                asks={depth.asks}
                midPrice={depth.midPrice}
                c={c}
              />

              {/* Legend */}
              <div className="flex justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(16,185,129,0.3)' }} />
                  <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Mua (Bid)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.3)' }} />
                  <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Bán (Ask)</span>
                </div>
              </div>
            </TrCard>

            {/* Buy/Sell wall ratio */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8 }}>
                Tỷ lệ tường mua/bán
              </p>
              {(() => {
                const totalBid = depth.bids.reduce((s, b) => s + b.quantity, 0);
                const totalAsk = depth.asks.reduce((s, a) => s + a.quantity, 0);
                const total = totalBid + totalAsk;
                const bidPct = (totalBid / total) * 100;
                return (
                  <>
                    <div className="flex rounded-lg overflow-hidden" style={{ height: 20 }}>
                      <div style={{ width: `${bidPct}%`, background: '#10B981' }} />
                      <div style={{ width: `${100 - bidPct}%`, background: '#EF4444' }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        Mua {bidPct.toFixed(1)}%
                      </span>
                      <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        Bán {(100 - bidPct).toFixed(1)}%
                      </span>
                    </div>
                  </>
                );
              })()}
            </TrCard>
          </>
        )}

        {/* ═══ Order Book tab ═══ */}
        {tab === 'Order Book' && (
          <>
            {/* Column header */}
            <div className="flex px-3 py-2" style={{ background: c.surface2, borderRadius: 8 }}>
              <span style={{ flex: 1, color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                Giá (USDT)
              </span>
              <span style={{ flex: 1, color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, textAlign: 'right' }}>
                Số lượng ({pair.baseAsset})
              </span>
              <span style={{ flex: 1, color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, textAlign: 'right' }}>
                Tích lũy
              </span>
            </div>

            {/* Asks (reversed, top = highest) */}
            <PageSection label="Lệnh bán (Ask)" accentColor="#EF4444" gap={0}>
              <div className="flex flex-col">
                {depth.asks.slice(0, 15).reverse().map((level, idx) => {
                  const maxCum = depth.asks[Math.min(14, depth.asks.length - 1)]?.cumulative ?? 1;
                  return (
                    <OrderBookRow
                      key={idx}
                      price={level.price}
                      quantity={level.quantity}
                      cumulative={level.cumulative}
                      maxCumulative={maxCum}
                      side="sell"
                      c={c}
                    />
                  );
                })}
              </div>
            </PageSection>

            {/* Mid price */}
            <div className="flex items-center justify-center py-2 my-1 rounded-lg" style={{ background: c.surface2 }}>
              <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                ${fmtPrice(depth.midPrice)}
              </span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginLeft: 8 }}>
                Spread: {depth.spreadPct.toFixed(4)}%
              </span>
            </div>

            {/* Bids */}
            <PageSection label="Lệnh mua (Bid)" accentColor="#10B981" gap={0}>
              <div className="flex flex-col">
                {depth.bids.slice(0, 15).map((level, idx) => {
                  const maxCum = depth.bids[Math.min(14, depth.bids.length - 1)]?.cumulative ?? 1;
                  return (
                    <OrderBookRow
                      key={idx}
                      price={level.price}
                      quantity={level.quantity}
                      cumulative={level.cumulative}
                      maxCumulative={maxCum}
                      side="buy"
                      c={c}
                    />
                  );
                })}
              </div>
            </PageSection>
          </>
        )}

        {/* ═══ Whale Alert tab ═══ */}
        {tab === 'Whale Alert' && (
          <>
            <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
              <div className="flex gap-3">
                <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                    Cảnh báo cá voi
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    Các lệnh lớn bất thường trong sổ lệnh {pair.symbol}. 
                    Không phải tín hiệu giao dịch — chỉ mang tính tham khảo.
                  </p>
                </div>
              </div>
            </TrCard>

            <PageSection label="Lệnh lớn gần đây" accentColor="#F59E0B">
              <div className="flex flex-col" style={{ gap: 4 }}>
                {whaleOrders.map(order => (
                  <TrCard key={order.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: order.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        }}
                      >
                        <span style={{ fontSize: 18 }}>🐋</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 rounded"
                            style={{
                              background: order.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: order.side === 'buy' ? '#10B981' : '#EF4444',
                              fontSize: FONT_SCALE.micro,
                              fontWeight: FONT_WEIGHT.bold,
                            }}
                          >
                            {order.side === 'buy' ? 'MUA' : 'BÁN'}
                          </span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            {order.timeAgo}
                          </span>
                        </div>
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                          {order.quantity.toFixed(4)} {pair.baseAsset}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            @ ${fmtPrice(order.price)}
                          </span>
                          <span style={{ color: c.text2, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                            ≈ {fmtCompact(order.usdValue, { prefix: '$' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            {/* Whale summary */}
            <div className="grid grid-cols-2 gap-2">
              <TrCard className="p-3 text-center">
                <p style={{ color: '#10B981', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                  {whaleOrders.filter(o => o.side === 'buy').length}
                </p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lệnh mua lớn</p>
                <p style={{ color: '#10B981', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, marginTop: 2 }}>
                  {fmtCompact(
                    whaleOrders.filter(o => o.side === 'buy').reduce((s, o) => s + o.usdValue, 0),
                    { prefix: '$' }
                  )}
                </p>
              </TrCard>
              <TrCard className="p-3 text-center">
                <p style={{ color: '#EF4444', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                  {whaleOrders.filter(o => o.side === 'sell').length}
                </p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lệnh bán lớn</p>
                <p style={{ color: '#EF4444', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, marginTop: 2 }}>
                  {fmtCompact(
                    whaleOrders.filter(o => o.side === 'sell').reduce((s, o) => s + o.usdValue, 0),
                    { prefix: '$' }
                  )}
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

function MiniStat({ label, value, sub, c, color }: {
  label: string; value: string; sub: string;
  c: ReturnType<typeof useThemeColors>; color?: string;
}) {
  return (
    <TrCard className="p-3 text-center">
      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 4 }}>{label}</p>
      <p style={{ color: color ?? c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{value}</p>
      <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{sub}</p>
    </TrCard>
  );
}

function DepthChartCanvas({ bids, asks, midPrice, c }: {
  bids: DepthLevel[];
  asks: DepthLevel[];
  midPrice: number;
  c: ReturnType<typeof useThemeColors>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxCum = Math.max(
      bids[bids.length - 1]?.cumulative ?? 0,
      asks[asks.length - 1]?.cumulative ?? 0
    );

    const bidMinPrice = bids[bids.length - 1]?.price ?? midPrice * 0.95;
    const askMaxPrice = asks[asks.length - 1]?.price ?? midPrice * 1.05;
    const priceRange = askMaxPrice - bidMinPrice;
    const midX = ((midPrice - bidMinPrice) / priceRange) * width;

    const padding = 8;
    const chartHeight = height - padding * 2;

    // Draw bid area (left side)
    ctx.beginPath();
    ctx.moveTo(midX, height - padding);

    for (let i = 0; i < bids.length; i++) {
      const x = ((bids[i].price - bidMinPrice) / priceRange) * width;
      const y = height - padding - (bids[i].cumulative / maxCum) * chartHeight;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        // Step pattern
        const prevX = ((bids[i - 1].price - bidMinPrice) / priceRange) * width;
        ctx.lineTo(prevX, y);
        ctx.lineTo(x, y);
      }
    }

    const lastBidX = ((bids[bids.length - 1]?.price ?? bidMinPrice) - bidMinPrice) / priceRange * width;
    ctx.lineTo(lastBidX, height - padding);
    ctx.closePath();

    const bidGrad = ctx.createLinearGradient(0, 0, 0, height);
    bidGrad.addColorStop(0, 'rgba(16,185,129,0.35)');
    bidGrad.addColorStop(1, 'rgba(16,185,129,0.05)');
    ctx.fillStyle = bidGrad;
    ctx.fill();

    // Bid line
    ctx.beginPath();
    for (let i = 0; i < bids.length; i++) {
      const x = ((bids[i].price - bidMinPrice) / priceRange) * width;
      const y = height - padding - (bids[i].cumulative / maxCum) * chartHeight;
      if (i === 0) {
        ctx.moveTo(midX, height - padding);
        ctx.lineTo(x, y);
      } else {
        const prevX = ((bids[i - 1].price - bidMinPrice) / priceRange) * width;
        ctx.lineTo(prevX, y);
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw ask area (right side)
    ctx.beginPath();
    ctx.moveTo(midX, height - padding);

    for (let i = 0; i < asks.length; i++) {
      const x = ((asks[i].price - bidMinPrice) / priceRange) * width;
      const y = height - padding - (asks[i].cumulative / maxCum) * chartHeight;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = ((asks[i - 1].price - bidMinPrice) / priceRange) * width;
        ctx.lineTo(prevX, y);
        ctx.lineTo(x, y);
      }
    }

    const lastAskX = ((asks[asks.length - 1]?.price ?? askMaxPrice) - bidMinPrice) / priceRange * width;
    ctx.lineTo(lastAskX, height - padding);
    ctx.closePath();

    const askGrad = ctx.createLinearGradient(0, 0, 0, height);
    askGrad.addColorStop(0, 'rgba(239,68,68,0.35)');
    askGrad.addColorStop(1, 'rgba(239,68,68,0.05)');
    ctx.fillStyle = askGrad;
    ctx.fill();

    // Ask line
    ctx.beginPath();
    for (let i = 0; i < asks.length; i++) {
      const x = ((asks[i].price - bidMinPrice) / priceRange) * width;
      const y = height - padding - (asks[i].cumulative / maxCum) * chartHeight;
      if (i === 0) {
        ctx.moveTo(midX, height - padding);
        ctx.lineTo(x, y);
      } else {
        const prevX = ((asks[i - 1].price - bidMinPrice) / priceRange) * width;
        ctx.lineTo(prevX, y);
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mid price line
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(midX, padding);
    ctx.lineTo(midX, height - padding);
    ctx.strokeStyle = c.text3;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

  }, [bids, asks, midPrice, c]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

function OrderBookRow({ price, quantity, cumulative, maxCumulative, side, c }: {
  price: number;
  quantity: number;
  cumulative: number;
  maxCumulative: number;
  side: 'buy' | 'sell';
  c: ReturnType<typeof useThemeColors>;
}) {
  const barPct = (cumulative / maxCumulative) * 100;
  const bgColor = side === 'buy' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
  const priceColor = side === 'buy' ? '#10B981' : '#EF4444';

  return (
    <div
      className="flex items-center px-3 py-2 relative"
      style={{ minHeight: 28 }}
    >
      {/* Background bar */}
      <div
        className="absolute inset-y-0 right-0"
        style={{
          width: `${barPct}%`,
          background: bgColor,
        }}
      />
      <span style={{ flex: 1, color: priceColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, position: 'relative', zIndex: 1 }}>
        {fmtPrice(price)}
      </span>
      <span style={{ flex: 1, color: c.text1, fontSize: FONT_SCALE.xs, textAlign: 'right', position: 'relative', zIndex: 1 }}>
        {quantity.toFixed(4)}
      </span>
      <span style={{ flex: 1, color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'right', position: 'relative', zIndex: 1 }}>
        {cumulative.toFixed(4)}
      </span>
    </div>
  );
}