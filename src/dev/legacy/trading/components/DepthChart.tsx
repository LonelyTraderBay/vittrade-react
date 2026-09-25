import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/shared/theme/useTheme';

/**
 * ══════════════════════════════════════════════════════════
 *  DepthChart — Canvas-based Orderbook Depth Visualization
 * ══════════════════════════════════════════════════════════
 *
 *  Shows cumulative bid (green, left) and ask (red, right)
 *  volumes as stepped area chart with gradient fills.
 *  Mid-price shown as vertical center line.
 */

interface DepthChartProps {
  midPrice: number;
  levels?: number;
}

interface DepthLevel {
  price: number;
  cumulative: number;
}

function generateDepthData(
  midPrice: number,
  levels: number,
): { bids: DepthLevel[]; asks: DepthLevel[] } {
  const bids: DepthLevel[] = [];
  const asks: DepthLevel[] = [];
  let cumBid = 0;
  let cumAsk = 0;
  const spread = midPrice * 0.0002;

  for (let i = 0; i < levels; i++) {
    const bidPrice = midPrice - spread * (i + 1) - Math.random() * spread * 0.5;
    const askPrice = midPrice + spread * (i + 1) + Math.random() * spread * 0.5;
    // Volume tends to increase further from mid
    const bidVol = (Math.random() * 3 + 0.5) * (1 + i * 0.15);
    const askVol = (Math.random() * 3 + 0.5) * (1 + i * 0.15);
    cumBid += bidVol;
    cumAsk += askVol;
    bids.push({
      price: parseFloat(bidPrice.toFixed(2)),
      cumulative: parseFloat(cumBid.toFixed(4)),
    });
    asks.push({
      price: parseFloat(askPrice.toFixed(2)),
      cumulative: parseFloat(cumAsk.toFixed(4)),
    });
  }

  return { bids, asks };
}

export function DepthChart({ midPrice, levels = 30 }: DepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [resizeKey, setResizeKey] = useState(0);

  const data = useMemo(() => generateDepthData(midPrice, levels), [midPrice, levels]);

  // Resize observer to trigger re-render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setResizeKey((k) => k + 1));
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const { bids, asks } = data;
    if (bids.length === 0 || asks.length === 0) return;

    // Price range
    const minPrice = bids[bids.length - 1].price;
    const maxPrice = asks[asks.length - 1].price;
    const priceRange = maxPrice - minPrice;

    // Volume range
    const maxVol = Math.max(bids[bids.length - 1].cumulative, asks[asks.length - 1].cumulative);

    // Coordinate mapping
    const px = (price: number) => ((price - minPrice) / priceRange) * W;
    const py = (vol: number) => H - (vol / maxVol) * (H * 0.85) - 1;
    const midX = px(midPrice);

    // Background grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = (H / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // ─── Draw bids (green, right to left) ───
    const bidGrad = ctx.createLinearGradient(0, 0, 0, H);
    bidGrad.addColorStop(0, isDark ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.20)');
    bidGrad.addColorStop(1, isDark ? 'rgba(16,185,129,0.02)' : 'rgba(16,185,129,0.02)');

    ctx.beginPath();
    ctx.moveTo(midX, H);
    ctx.lineTo(midX, py(0));

    // Step through bids (nearest to farthest)
    bids.forEach((b, i) => {
      const x = px(b.price);
      const y = py(b.cumulative);
      if (i > 0) {
        const prevY = py(bids[i - 1].cumulative);
        ctx.lineTo(x, prevY); // horizontal step
      }
      ctx.lineTo(x, y); // vertical step
    });

    // Close path
    ctx.lineTo(px(bids[bids.length - 1].price), H);
    ctx.closePath();
    ctx.fillStyle = bidGrad;
    ctx.fill();

    // Bid line
    ctx.beginPath();
    ctx.moveTo(midX, py(0));
    bids.forEach((b, i) => {
      const x = px(b.price);
      const y = py(b.cumulative);
      if (i > 0) {
        ctx.lineTo(x, py(bids[i - 1].cumulative));
      }
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── Draw asks (red, left to right) ───
    const askGrad = ctx.createLinearGradient(0, 0, 0, H);
    askGrad.addColorStop(0, isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)');
    askGrad.addColorStop(1, isDark ? 'rgba(239,68,68,0.02)' : 'rgba(239,68,68,0.02)');

    ctx.beginPath();
    ctx.moveTo(midX, H);
    ctx.lineTo(midX, py(0));

    asks.forEach((a, i) => {
      const x = px(a.price);
      const y = py(a.cumulative);
      if (i > 0) {
        ctx.lineTo(x, py(asks[i - 1].cumulative));
      }
      ctx.lineTo(x, y);
    });

    ctx.lineTo(px(asks[asks.length - 1].price), H);
    ctx.closePath();
    ctx.fillStyle = askGrad;
    ctx.fill();

    // Ask line
    ctx.beginPath();
    ctx.moveTo(midX, py(0));
    asks.forEach((a, i) => {
      const x = px(a.price);
      const y = py(a.cumulative);
      if (i > 0) {
        ctx.lineTo(x, py(asks[i - 1].cumulative));
      }
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── Mid-price line ───
    ctx.beginPath();
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mid-price label
    ctx.font = '11px monospace';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'center';
    const priceStr =
      midPrice >= 100
        ? midPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })
        : midPrice.toFixed(4);
    ctx.fillText(`$${priceStr}`, midX, 15);

    // Bid / Ask labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.textAlign = 'left';
    ctx.fillText('BID', 8, 15);
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'right';
    ctx.fillText('ASK', W - 8, 15);

    // Volume scale labels
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 1; i <= 3; i++) {
      const vol = (maxVol / 4) * i;
      const y = py(vol);
      ctx.fillText(vol.toFixed(1), W - 4, y - 2);
    }
  }, [data, isDark, midPrice, resizeKey]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
}
