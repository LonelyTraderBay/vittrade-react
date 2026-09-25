import type { TouchList } from 'react';

/* ─── Watermark config ───────────────────────────────────── */

const WATERMARK_CONFIG = {
  text: 'CryptoTrade DCA',
  subtext: '', // filled at runtime with date
  opacity: 0.35,
  fontSize: 22,
  subFontSize: 13,
  padding: 20,
};

/* ─── Pinch/Zoom helpers ─────────────────────────────────── */

export function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getTouchCenter(touches: TouchList, containerRect: DOMRect): number {
  if (touches.length < 2) return 0.5;
  const cx = (touches[0].clientX + touches[1].clientX) / 2;
  return (cx - containerRect.left) / containerRect.width;
}

/* ─── Watermark drawing ──────────────────────────────────── */

export function drawWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { text, opacity, fontSize, subFontSize, padding } = WATERMARK_CONFIG;
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.save();
  ctx.globalAlpha = opacity;

  // Main brand text — bottom-right
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#94A3B8'; // slate-400 neutral
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, canvas.width - padding, canvas.height - padding - subFontSize - 4);

  // Date subtext
  ctx.font = `400 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillText(dateStr, canvas.width - padding, canvas.height - padding);

  // Subtle diagonal repeated watermark (very faint)
  ctx.globalAlpha = 0.06;
  ctx.font = `600 ${fontSize * 1.2}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = 260;
  for (let y = -canvas.height; y < canvas.height * 2; y += step) {
    for (let x = -canvas.width; x < canvas.width * 2; x += step) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.35);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════ */
