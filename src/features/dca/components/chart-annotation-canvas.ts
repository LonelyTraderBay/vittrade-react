/* Canvas annotation primitives and hit-testing helpers. */

export type AnnotationTool = 'pen' | 'text' | 'arrow' | 'eraser' | 'select';

export interface PenStroke {
  type: 'pen';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface TextLabel {
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface ArrowLine {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export type Annotation = PenStroke | TextLabel | ArrowLine;

export type DragHandle = 'body' | 'arrow-start' | 'arrow-end';

export interface DragState {
  handle: DragHandle;
  startPos: { x: number; y: number };
  originalAnnotation: Annotation;
}

/** A chart data point position (in CSS px, relative to chart container) */
export interface SnapPoint {
  x: number;
  y: number;
  label?: string;
}

/* ─── Constants ──────────────────────────────────────────── */

export const HIT_THRESHOLD = 28;
export const HANDLE_RADIUS = 10;
export const HANDLE_HIT_RADIUS = 22;
export const SNAP_THRESHOLD = 36; // canvas-space px — snap zone radius
export const DUPLICATE_OFFSET = 30; // offset px when duplicating

export const PRESET_COLORS = [
  { key: 'accent', value: '#3B82F6', label: 'Xanh dương' },
  { key: 'red', value: '#EF4444', label: 'Đỏ' },
  { key: 'green', value: '#10B981', label: 'Xanh lá' },
  { key: 'orange', value: '#F59E0B', label: 'Cam' },
  { key: 'white', value: '#FFFFFF', label: 'Trắng' },
];

/** Pen stroke width presets (canvas-space px, 2× retina) */
export const PEN_WIDTHS = [
  { key: 'fine', value: 2, label: 'Mỏng', dotSize: 3 },
  { key: 'medium', value: 4, label: 'Vừa', dotSize: 5 },
  { key: 'thick', value: 8, label: 'Dày', dotSize: 8 },
] as const;

/* ═══════════════════════════════════════════════════════════ */
/* ─── Hit-testing utilities ──────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

export function distPP(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function distPointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distPP(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distPP(px, py, ax + t * dx, ay + t * dy);
}

function getTextBBox(
  label: TextLabel,
  ctx: CanvasRenderingContext2D,
): { x: number; y: number; w: number; h: number } {
  const fontSize = 28;
  const pad = 8;
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const metrics = ctx.measureText(label.text);
  return {
    x: label.x - pad,
    y: label.y - pad,
    w: metrics.width + pad * 2,
    h: fontSize + pad * 2,
  };
}

export function hitTestAnnotation(
  pos: { x: number; y: number },
  ann: Annotation,
  ctx: CanvasRenderingContext2D | null,
): boolean {
  switch (ann.type) {
    case 'pen': {
      for (let i = 0; i < ann.points.length - 1; i++) {
        if (
          distPointToSegment(
            pos.x,
            pos.y,
            ann.points[i].x,
            ann.points[i].y,
            ann.points[i + 1].x,
            ann.points[i + 1].y,
          ) < HIT_THRESHOLD
        )
          return true;
      }
      return false;
    }
    case 'text': {
      if (!ctx) return false;
      const bb = getTextBBox(ann, ctx);
      return pos.x >= bb.x && pos.x <= bb.x + bb.w && pos.y >= bb.y && pos.y <= bb.y + bb.h;
    }
    case 'arrow': {
      return (
        distPointToSegment(pos.x, pos.y, ann.startX, ann.startY, ann.endX, ann.endY) < HIT_THRESHOLD
      );
    }
  }
}

export function hitTestArrowHandles(
  pos: { x: number; y: number },
  arrow: ArrowLine,
): DragHandle | null {
  if (distPP(pos.x, pos.y, arrow.startX, arrow.startY) < HANDLE_HIT_RADIUS) return 'arrow-start';
  if (distPP(pos.x, pos.y, arrow.endX, arrow.endY) < HANDLE_HIT_RADIUS) return 'arrow-end';
  return null;
}

/* ─── Snap helper ─────────────────────────────────────────── */

/** Find nearest snap point within threshold. Returns snapped position or original. */
export function snapToNearest(
  pos: { x: number; y: number },
  snapPoints: { x: number; y: number }[],
): { x: number; y: number; snapped: boolean; snapIdx: number } {
  let bestDist = Infinity;
  let bestIdx = -1;
  for (let i = 0; i < snapPoints.length; i++) {
    const d = distPP(pos.x, pos.y, snapPoints[i].x, snapPoints[i].y);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  if (bestDist <= SNAP_THRESHOLD && bestIdx >= 0) {
    return { x: snapPoints[bestIdx].x, y: snapPoints[bestIdx].y, snapped: true, snapIdx: bestIdx };
  }
  return { ...pos, snapped: false, snapIdx: -1 };
}

/* ═══════════════════════════════════════════════════════════ */
/* ─── Drawing utilities ──────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

export function drawPenStroke(ctx: CanvasRenderingContext2D, stroke: PenStroke) {
  if (stroke.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
}

export function drawTextLabel(ctx: CanvasRenderingContext2D, label: TextLabel) {
  const fontSize = 28;
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'top';
  const bb = getTextBBox(label, ctx);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  roundRect(ctx, bb.x, bb.y, bb.w, bb.h, 8);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = label.color;
  ctx.fillText(label.text, label.x, label.y);
}

export function drawArrowLine(ctx: CanvasRenderingContext2D, arrow: ArrowLine) {
  const headLen = 16;
  const dx = arrow.endX - arrow.startX;
  const dy = arrow.endY - arrow.startY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.strokeStyle = arrow.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.moveTo(arrow.startX, arrow.startY);
  ctx.lineTo(arrow.endX, arrow.endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = arrow.color;
  ctx.moveTo(arrow.endX, arrow.endY);
  ctx.lineTo(
    arrow.endX - headLen * Math.cos(angle - Math.PI / 6),
    arrow.endY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    arrow.endX - headLen * Math.cos(angle + Math.PI / 6),
    arrow.endY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = arrow.color;
  ctx.arc(arrow.startX, arrow.startY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw selection UI around an annotation */
export function drawSelectionUI(ctx: CanvasRenderingContext2D, ann: Annotation, selColor: string) {
  ctx.save();
  ctx.strokeStyle = selColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  switch (ann.type) {
    case 'pen': {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of ann.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = 12;
      ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
      drawGrabHandle(ctx, (minX + maxX) / 2, minY - pad, selColor);
      break;
    }
    case 'text': {
      const bb = getTextBBox(ann, ctx);
      const pad = 4;
      ctx.strokeRect(bb.x - pad, bb.y - pad, bb.w + pad * 2, bb.h + pad * 2);
      drawGrabHandle(ctx, bb.x + bb.w / 2, bb.y - pad, selColor);
      break;
    }
    case 'arrow': {
      drawGrabHandle(ctx, ann.startX, ann.startY, selColor);
      drawGrabHandle(ctx, ann.endX, ann.endY, selColor);
      ctx.beginPath();
      ctx.moveTo(ann.startX, ann.startY);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawGrabHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawEraserHighlight(ctx: CanvasRenderingContext2D, ann: Annotation) {
  ctx.save();
  ctx.strokeStyle = 'rgba(239,68,68,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  switch (ann.type) {
    case 'pen': {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of ann.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = 12;
      ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
      break;
    }
    case 'text': {
      const bb = getTextBBox(ann, ctx);
      const pad = 4;
      ctx.strokeRect(bb.x - pad, bb.y - pad, bb.w + pad * 2, bb.h + pad * 2);
      break;
    }
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(ann.startX, ann.startY);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** Draw snap indicator: pulsing circle at a chart data point */
export function drawSnapIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Outer glow ring
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(59,130,246,0.15)';
  ctx.fill();
  // Middle ring
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner dot
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#3B82F6';
  ctx.fill();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════ */
