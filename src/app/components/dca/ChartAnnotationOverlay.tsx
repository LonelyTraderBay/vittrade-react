/**
 * Chart Annotation Overlay
 *
 * Canvas-based overlay for annotations on top of the DCA chart.
 * Tools: Select (move/resize), Pen (freehand + width selector),
 *        Text, Arrow (snap-to-chart), Eraser (tap-to-delete).
 * Actions: Duplicate selected, Undo, Clear, Color picker.
 *
 * @module components/dca
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Pen,
  Type,
  MoveUpRight,
  Undo2,
  Trash2,
  X,
  Check,
  Eraser,
  MousePointer2,
  Copy,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════ */
/* ─── Types ──────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

type AnnotationTool = 'pen' | 'text' | 'arrow' | 'eraser' | 'select';

interface PenStroke {
  type: 'pen';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface TextLabel {
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
}

interface ArrowLine {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

type Annotation = PenStroke | TextLabel | ArrowLine;

type DragHandle = 'body' | 'arrow-start' | 'arrow-end';

interface DragState {
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

const HIT_THRESHOLD = 28;
const HANDLE_RADIUS = 10;
const HANDLE_HIT_RADIUS = 22;
const SNAP_THRESHOLD = 36; // canvas-space px — snap zone radius
const DUPLICATE_OFFSET = 30; // offset px when duplicating

const PRESET_COLORS = [
  { key: 'accent', value: '#3B82F6', label: 'Xanh dương' },
  { key: 'red', value: '#EF4444', label: 'Đỏ' },
  { key: 'green', value: '#10B981', label: 'Xanh lá' },
  { key: 'orange', value: '#F59E0B', label: 'Cam' },
  { key: 'white', value: '#FFFFFF', label: 'Trắng' },
];

/** Pen stroke width presets (canvas-space px, 2× retina) */
const PEN_WIDTHS = [
  { key: 'fine', value: 2, label: 'Mỏng', dotSize: 3 },
  { key: 'medium', value: 4, label: 'Vừa', dotSize: 5 },
  { key: 'thick', value: 8, label: 'Dày', dotSize: 8 },
] as const;

/* ═══════════════════════════════════════════════════════════ */
/* ─── Hit-testing utilities ──────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

function distPP(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function distPointToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
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

function hitTestAnnotation(
  pos: { x: number; y: number },
  ann: Annotation,
  ctx: CanvasRenderingContext2D | null,
): boolean {
  switch (ann.type) {
    case 'pen': {
      for (let i = 0; i < ann.points.length - 1; i++) {
        if (distPointToSegment(
          pos.x, pos.y,
          ann.points[i].x, ann.points[i].y,
          ann.points[i + 1].x, ann.points[i + 1].y,
        ) < HIT_THRESHOLD) return true;
      }
      return false;
    }
    case 'text': {
      if (!ctx) return false;
      const bb = getTextBBox(ann, ctx);
      return pos.x >= bb.x && pos.x <= bb.x + bb.w && pos.y >= bb.y && pos.y <= bb.y + bb.h;
    }
    case 'arrow': {
      return distPointToSegment(
        pos.x, pos.y,
        ann.startX, ann.startY, ann.endX, ann.endY,
      ) < HIT_THRESHOLD;
    }
  }
}

function hitTestArrowHandles(
  pos: { x: number; y: number },
  arrow: ArrowLine,
): DragHandle | null {
  if (distPP(pos.x, pos.y, arrow.startX, arrow.startY) < HANDLE_HIT_RADIUS) return 'arrow-start';
  if (distPP(pos.x, pos.y, arrow.endX, arrow.endY) < HANDLE_HIT_RADIUS) return 'arrow-end';
  return null;
}

/* ─── Snap helper ─────────────────────────────────────────── */

/** Find nearest snap point within threshold. Returns snapped position or original. */
function snapToNearest(
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

function drawPenStroke(ctx: CanvasRenderingContext2D, stroke: PenStroke) {
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

function drawTextLabel(ctx: CanvasRenderingContext2D, label: TextLabel) {
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

function drawArrowLine(ctx: CanvasRenderingContext2D, arrow: ArrowLine) {
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw selection UI around an annotation */
function drawSelectionUI(ctx: CanvasRenderingContext2D, ann: Annotation, selColor: string) {
  ctx.save();
  ctx.strokeStyle = selColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  switch (ann.type) {
    case 'pen': {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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

function drawEraserHighlight(ctx: CanvasRenderingContext2D, ann: Annotation) {
  ctx.save();
  ctx.strokeStyle = 'rgba(239,68,68,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  switch (ann.type) {
    case 'pen': {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of ann.points) {
        if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
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
function drawSnapIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
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
/* ─── Public handle & props ──────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

export interface ChartAnnotationHandle {
  getCanvas: () => HTMLCanvasElement | null;
  hasAnnotations: () => boolean;
  clearAll: () => void;
}

export interface ChartAnnotationOverlayProps {
  active: boolean;
  onClose: () => void;
  width: number;
  height: number;
  /** Data point positions (CSS px) for arrow snap-to-chart */
  snapPoints?: SnapPoint[];
}

/* ═══════════════════════════════════════════════════════════ */
/* ─── Component ──────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

export const ChartAnnotationOverlay = forwardRef<
  ChartAnnotationHandle,
  ChartAnnotationOverlayProps
>(function ChartAnnotationOverlay({ active, onClose, width, height, snapPoints: rawSnapPoints }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<AnnotationTool>('pen');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [penWidth, setPenWidth] = useState<number>(PEN_WIDTHS[1].value); // default medium
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [eraserHoverIndex, setEraserHoverIndex] = useState<number | null>(null);

  // Live snap indicator (during arrow drawing)
  const [activeSnap, setActiveSnap] = useState<{ x: number; y: number } | null>(null);

  // Convert snap points from CSS px to canvas coords (×2)
  const canvasSnapPoints = (rawSnapPoints ?? []).map((sp) => ({
    x: sp.x * 2,
    y: sp.y * 2,
    label: sp.label,
  }));

  const drawingRef = useRef<{
    isDrawing: boolean;
    currentStroke: { x: number; y: number }[];
    arrowStart: { x: number; y: number } | null;
  }>({
    isDrawing: false,
    currentStroke: [],
    arrowStart: null,
  });

  const dragRef = useRef<DragState | null>(null);

  const [textInput, setTextInput] = useState<{
    active: boolean;
    x: number;
    y: number;
    value: string;
  } | null>(null);

  /* ── Expose handle ──────────────────────────────────────── */
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    hasAnnotations: () => annotations.length > 0,
    clearAll: () => {
      setAnnotations([]);
      setSelectedIndex(null);
      redrawCanvas([], null, null, null);
    },
  }));

  /* ── Canvas coord helper ────────────────────────────────── */
  const getCanvasPos = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    },
    [],
  );

  const getCtx = useCallback(
    (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') ?? null,
    [],
  );

  /* ── Full redraw ────────────────────────────────────────── */
  const redrawCanvas = useCallback(
    (
      anns: Annotation[],
      selIdx: number | null,
      eraserIdx: number | null,
      snap: { x: number; y: number } | null,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < anns.length; i++) {
        const ann = anns[i];
        switch (ann.type) {
          case 'pen': drawPenStroke(ctx, ann); break;
          case 'text': drawTextLabel(ctx, ann); break;
          case 'arrow': drawArrowLine(ctx, ann); break;
        }
        if (eraserIdx === i) drawEraserHighlight(ctx, ann);
        if (selIdx === i) drawSelectionUI(ctx, ann, '#3B82F6');
      }

      // Snap indicator
      if (snap) {
        drawSnapIndicator(ctx, snap.x, snap.y);
      }
    },
    [],
  );

  /* ── Redraw on state change ─────────────────────────────── */
  useEffect(() => {
    redrawCanvas(annotations, selectedIndex, eraserHoverIndex, activeSnap);
  }, [annotations, selectedIndex, eraserHoverIndex, activeSnap, redrawCanvas]);

  /* ── Canvas size ────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * 2;
    canvas.height = height * 2;
    redrawCanvas(annotations, selectedIndex, eraserHoverIndex, activeSnap);
  }, [width, height]);

  /* ── Deselect when switching tools ──────────────────────── */
  useEffect(() => {
    if (tool !== 'select') setSelectedIndex(null);
    if (tool !== 'eraser') setEraserHoverIndex(null);
    if (tool !== 'arrow') setActiveSnap(null);
    setShowWidthPicker(false);
    setShowColorPicker(false);
  }, [tool]);

  /* ═══════════════════════════════════════════════════════── */
  /* ── Pointer handlers ───────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════── */

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!active) return;
      const pos = getCanvasPos(e);
      const ctx = getCtx();

      /* ── Eraser ──────────────────────────────────────────── */
      if (tool === 'eraser') {
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (hitTestAnnotation(pos, annotations[i], ctx)) {
            setAnnotations((prev) => prev.filter((_, idx) => idx !== i));
            setEraserHoverIndex(null);
            return;
          }
        }
        return;
      }

      /* ── Select ──────────────────────────────────────────── */
      if (tool === 'select') {
        if (selectedIndex !== null && annotations[selectedIndex]) {
          const selAnn = annotations[selectedIndex];
          if (selAnn.type === 'arrow') {
            const hh = hitTestArrowHandles(pos, selAnn);
            if (hh) {
              dragRef.current = { handle: hh, startPos: pos, originalAnnotation: { ...selAnn } };
              return;
            }
          }
          if (hitTestAnnotation(pos, selAnn, ctx)) {
            dragRef.current = {
              handle: 'body',
              startPos: pos,
              originalAnnotation: selAnn.type === 'pen'
                ? { ...selAnn, points: selAnn.points.map((p) => ({ ...p })) }
                : { ...selAnn },
            };
            return;
          }
        }
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (hitTestAnnotation(pos, annotations[i], ctx)) {
            setSelectedIndex(i);
            const ann = annotations[i];
            dragRef.current = {
              handle: 'body',
              startPos: pos,
              originalAnnotation: ann.type === 'pen'
                ? { ...ann, points: ann.points.map((p) => ({ ...p })) }
                : { ...ann },
            };
            return;
          }
        }
        setSelectedIndex(null);
        return;
      }

      /* ── Pen ─────────────────────────────────────────────── */
      if (tool === 'pen') {
        drawingRef.current.isDrawing = true;
        drawingRef.current.currentStroke = [pos];
      }

      /* ── Arrow (with snap) ───────────────────────────────── */
      if (tool === 'arrow') {
        const snapped = snapToNearest(pos, canvasSnapPoints);
        const startPos = snapped.snapped ? { x: snapped.x, y: snapped.y } : pos;
        drawingRef.current.isDrawing = true;
        drawingRef.current.arrowStart = startPos;
        if (snapped.snapped) {
          setActiveSnap({ x: snapped.x, y: snapped.y });
        }
      }

      /* ── Text ────────────────────────────────────────────── */
      if (tool === 'text') {
        setTextInput({ active: true, x: pos.x, y: pos.y, value: '' });
      }
    },
    [active, tool, annotations, selectedIndex, canvasSnapPoints, getCanvasPos, getCtx],
  );

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!active) return;
      const pos = getCanvasPos(e);
      const ctx = getCtx();

      /* ── Eraser hover ────────────────────────────────────── */
      if (tool === 'eraser') {
        let found: number | null = null;
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (hitTestAnnotation(pos, annotations[i], ctx)) { found = i; break; }
        }
        if (found !== eraserHoverIndex) setEraserHoverIndex(found);
        return;
      }

      /* ── Select drag ────────────────────────────────────── */
      if (tool === 'select' && dragRef.current && selectedIndex !== null) {
        const drag = dragRef.current;
        const dx = pos.x - drag.startPos.x;
        const dy = pos.y - drag.startPos.y;
        const orig = drag.originalAnnotation;

        setAnnotations((prev) => {
          const next = [...prev];
          if (drag.handle === 'body') {
            switch (orig.type) {
              case 'pen': {
                const o = orig as PenStroke;
                next[selectedIndex] = { ...o, points: o.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
                break;
              }
              case 'text': {
                const o = orig as TextLabel;
                next[selectedIndex] = { ...o, x: o.x + dx, y: o.y + dy };
                break;
              }
              case 'arrow': {
                const o = orig as ArrowLine;
                next[selectedIndex] = { ...o, startX: o.startX + dx, startY: o.startY + dy, endX: o.endX + dx, endY: o.endY + dy };
                break;
              }
            }
          } else if (drag.handle === 'arrow-start' && orig.type === 'arrow') {
            const o = orig as ArrowLine;
            next[selectedIndex] = { ...o, startX: o.startX + dx, startY: o.startY + dy };
          } else if (drag.handle === 'arrow-end' && orig.type === 'arrow') {
            const o = orig as ArrowLine;
            next[selectedIndex] = { ...o, endX: o.endX + dx, endY: o.endY + dy };
          }
          return next;
        });
        e.preventDefault();
        return;
      }

      /* ── Pen preview ─────────────────────────────────────── */
      if (tool === 'pen' && drawingRef.current.isDrawing) {
        drawingRef.current.currentStroke.push(pos);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const drawCtx = canvas.getContext('2d');
        if (!drawCtx) return;
        redrawCanvas(annotations, selectedIndex, eraserHoverIndex, activeSnap);
        drawPenStroke(drawCtx, {
          type: 'pen',
          points: drawingRef.current.currentStroke,
          color,
          width: penWidth,
        });
        e.preventDefault();
      }

      /* ── Arrow preview (with snap) ───────────────────────── */
      if (tool === 'arrow' && drawingRef.current.isDrawing && drawingRef.current.arrowStart) {
        const snapped = snapToNearest(pos, canvasSnapPoints);
        const endPos = snapped.snapped ? { x: snapped.x, y: snapped.y } : pos;
        const snapShow = snapped.snapped ? { x: snapped.x, y: snapped.y } : null;

        setActiveSnap(snapShow);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const drawCtx = canvas.getContext('2d');
        if (!drawCtx) return;
        redrawCanvas(annotations, selectedIndex, eraserHoverIndex, snapShow);
        drawArrowLine(drawCtx, {
          type: 'arrow',
          startX: drawingRef.current.arrowStart.x,
          startY: drawingRef.current.arrowStart.y,
          endX: endPos.x,
          endY: endPos.y,
          color,
        });
        e.preventDefault();
      }
    },
    [active, tool, annotations, selectedIndex, eraserHoverIndex, activeSnap, color, penWidth, canvasSnapPoints, getCanvasPos, getCtx, redrawCanvas],
  );

  const handlePointerUp = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!active) return;

      /* ── Select: finish drag ─────────────────────────────── */
      if (tool === 'select' && dragRef.current) {
        dragRef.current = null;
        return;
      }

      /* ── Pen: commit ─────────────────────────────────────── */
      if (tool === 'pen' && drawingRef.current.isDrawing) {
        if (drawingRef.current.currentStroke.length > 1) {
          setAnnotations((prev) => [
            ...prev,
            { type: 'pen', points: [...drawingRef.current.currentStroke], color, width: penWidth },
          ]);
        }
        drawingRef.current.isDrawing = false;
        drawingRef.current.currentStroke = [];
      }

      /* ── Arrow: commit (with snap) ───────────────────────── */
      if (tool === 'arrow' && drawingRef.current.isDrawing) {
        if (drawingRef.current.arrowStart) {
          const rawPos = getCanvasPos(e);
          const snapped = snapToNearest(rawPos, canvasSnapPoints);
          const endPos = snapped.snapped ? { x: snapped.x, y: snapped.y } : rawPos;
          const start = drawingRef.current.arrowStart;
          if (distPP(endPos.x, endPos.y, start.x, start.y) > 10) {
            setAnnotations((prev) => [
              ...prev,
              { type: 'arrow', startX: start.x, startY: start.y, endX: endPos.x, endY: endPos.y, color },
            ]);
          }
        }
        drawingRef.current.isDrawing = false;
        drawingRef.current.arrowStart = null;
        setActiveSnap(null);
      }
    },
    [active, tool, color, penWidth, canvasSnapPoints, getCanvasPos],
  );

  /* ── Text input confirm ─────────────────────────────────── */
  const confirmTextInput = useCallback(() => {
    if (!textInput || !textInput.value.trim()) { setTextInput(null); return; }
    setAnnotations((prev) => [
      ...prev,
      { type: 'text', x: textInput.x, y: textInput.y, text: textInput.value.trim(), color },
    ]);
    setTextInput(null);
  }, [textInput, color]);

  /* ── Undo ───────────────────────────────────────────────── */
  const handleUndo = useCallback(() => {
    setAnnotations((prev) => prev.slice(0, -1));
    setSelectedIndex(null);
  }, []);

  /* ── Clear all ──────────────────────────────────────────── */
  const handleClear = useCallback(() => {
    setAnnotations([]);
    setSelectedIndex(null);
  }, []);

  /* ── Delete selected ────────────────────────────────────── */
  const handleDeleteSelected = useCallback(() => {
    if (selectedIndex === null) return;
    setAnnotations((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  }, [selectedIndex]);

  /* ── Duplicate selected ─────────────────────────────────── */
  const handleDuplicate = useCallback(() => {
    if (selectedIndex === null || !annotations[selectedIndex]) return;
    const src = annotations[selectedIndex];
    let clone: Annotation;

    switch (src.type) {
      case 'pen':
        clone = {
          ...src,
          points: src.points.map((p) => ({ x: p.x + DUPLICATE_OFFSET, y: p.y + DUPLICATE_OFFSET })),
        };
        break;
      case 'text':
        clone = { ...src, x: src.x + DUPLICATE_OFFSET, y: src.y + DUPLICATE_OFFSET };
        break;
      case 'arrow':
        clone = {
          ...src,
          startX: src.startX + DUPLICATE_OFFSET,
          startY: src.startY + DUPLICATE_OFFSET,
          endX: src.endX + DUPLICATE_OFFSET,
          endY: src.endY + DUPLICATE_OFFSET,
        };
        break;
    }

    setAnnotations((prev) => [...prev, clone]);
    setSelectedIndex(annotations.length); // select the new clone
  }, [selectedIndex, annotations]);

  /* ── Cursor style ───────────────────────────────────────── */
  const cursorStyle = (() => {
    switch (tool) {
      case 'pen': return 'crosshair';
      case 'text': return 'text';
      case 'arrow': return 'crosshair';
      case 'eraser': return 'pointer';
      case 'select': return 'default';
    }
  })();

  if (!active) return null;

  /* ═══════════════════════════════════════════════════════── */
  /* ── Render ─────────────────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════── */
  return (
    <div className="absolute inset-0 z-20" style={{ touchAction: 'none' }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      />

      {/* Text input floating */}
      {textInput?.active && (
        <div
          className="absolute z-30 flex items-center gap-1"
          style={{
            left: `${(textInput.x / (width * 2)) * 100}%`,
            top: `${(textInput.y / (height * 2)) * 100}%`,
            transform: 'translate(-4px, -4px)',
          }}
        >
          <input
            autoFocus
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => prev ? { ...prev, value: e.target.value } : null)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmTextInput(); if (e.key === 'Escape') setTextInput(null); }}
            placeholder="Ghi chú..."
            className="bg-[rgba(0,0,0,0.7)] text-white text-[13px] px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.2)] outline-none min-w-[120px] max-w-[200px]"
            style={{ fontWeight: 500 }}
          />
          <button onClick={confirmTextInput} className="w-7 h-7 rounded-md text-white flex items-center justify-center flex-shrink-0" style={{ background: '#3B82F6' }} aria-label="Xác nhận">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setTextInput(null)} className="w-7 h-7 rounded-md bg-[rgba(255,255,255,0.15)] text-white flex items-center justify-center flex-shrink-0" aria-label="Hủy">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ══════════════════ Toolbar ══════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <div
          className="bg-[rgba(0,0,0,0.85)] backdrop-blur-sm rounded-2xl px-2 py-2 flex items-center gap-1"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
        >
          {/* ── Tools ──────────────────────────────────────── */}
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} label="Chọn / Di chuyển">
            <MousePointer2 className="w-4 h-4" />
          </ToolButton>

          {/* Pen button with width indicator */}
          <div className="relative">
            <ToolButton active={tool === 'pen'} onClick={() => { setTool('pen'); if (tool === 'pen') setShowWidthPicker((p) => !p); }} label="Vẽ tay">
              <Pen className="w-4 h-4" />
            </ToolButton>
            {/* Width dot indicator */}
            {tool === 'pen' && (
              <div
                className="absolute -top-0.5 -right-0.5 rounded-full bg-white"
                style={{
                  width: PEN_WIDTHS.find((w) => w.value === penWidth)?.dotSize ?? 5,
                  height: PEN_WIDTHS.find((w) => w.value === penWidth)?.dotSize ?? 5,
                }}
              />
            )}
            {/* Width picker popup */}
            {showWidthPicker && tool === 'pen' && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.9)] rounded-xl p-2 flex items-center gap-2">
                {PEN_WIDTHS.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => { setPenWidth(w.value); setShowWidthPicker(false); }}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                      penWidth === w.value
                        ? 'bg-[rgba(59,130,246,0.3)] ring-1 ring-[#3B82F6]'
                        : 'hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                    aria-label={w.label}
                    title={w.label}
                  >
                    <div
                      className="rounded-full bg-white"
                      style={{ width: w.dotSize * 2, height: w.dotSize * 2 }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToolButton active={tool === 'text'} onClick={() => setTool('text')} label="Ghi chú">
            <Type className="w-4 h-4" />
          </ToolButton>

          <ToolButton active={tool === 'arrow'} onClick={() => setTool('arrow')} label="Mũi tên">
            <MoveUpRight className="w-4 h-4" />
          </ToolButton>

          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Xóa ghi chú">
            <Eraser className="w-4 h-4" />
          </ToolButton>

          {/* ── Separator ──────────────────────────────────── */}
          <div className="w-px h-6 bg-[rgba(255,255,255,0.15)] mx-0.5" />

          {/* ── Color picker ───────────────────────────────── */}
          <div className="relative">
            <button
              onClick={() => { setShowColorPicker((p) => !p); setShowWidthPicker(false); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              aria-label="Chọn màu"
            >
              <div className="w-5 h-5 rounded-full border-2 border-white" style={{ background: color }} />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.9)] rounded-xl p-2 flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c.value ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: c.value }}
                    aria-label={c.label}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Separator ──────────────────────────────────── */}
          <div className="w-px h-6 bg-[rgba(255,255,255,0.15)] mx-0.5" />

          {/* ── Actions: Undo / Duplicate / Delete / Clear ── */}
          <ToolButton active={false} onClick={handleUndo} label="Hoàn tác" disabled={annotations.length === 0}>
            <Undo2 className="w-4 h-4" />
          </ToolButton>

          {selectedIndex !== null && (
            <ToolButton active={false} onClick={handleDuplicate} label="Nhân đôi ghi chú" variant="accent">
              <Copy className="w-4 h-4" />
            </ToolButton>
          )}

          {selectedIndex !== null ? (
            <ToolButton active={false} onClick={handleDeleteSelected} label="Xóa mục đã chọn" variant="danger">
              <Trash2 className="w-4 h-4" />
            </ToolButton>
          ) : (
            <ToolButton active={false} onClick={handleClear} label="Xóa tất cả" disabled={annotations.length === 0}>
              <Trash2 className="w-4 h-4" />
            </ToolButton>
          )}

          {/* ── Spacer + Done ──────────────────────────────── */}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-8 px-3.5 rounded-xl text-white text-[13px] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            style={{ fontWeight: 600, background: '#3B82F6' }}
          >
            <Check className="w-3.5 h-3.5" />
            Xong
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-center gap-3 mt-1.5">
          {annotations.length > 0 && (
            <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
              {annotations.length} ghi chú
            </span>
          )}
          {tool === 'eraser' && (
            <span className="text-[11px] text-[rgba(239,68,68,0.7)]">
              Chạm vào ghi chú để xóa
            </span>
          )}
          {tool === 'select' && selectedIndex !== null && (
            <span className="text-[11px] text-[rgba(59,130,246,0.8)]">
              Kéo để di chuyển
              {annotations[selectedIndex]?.type === 'arrow' ? ' · Kéo đầu mũi tên để thay đổi hướng' : ''}
            </span>
          )}
          {tool === 'select' && selectedIndex === null && annotations.length > 0 && (
            <span className="text-[11px] text-[rgba(255,255,255,0.4)]">
              Chạm vào ghi chú để chọn
            </span>
          )}
          {tool === 'arrow' && canvasSnapPoints.length > 0 && (
            <span className="text-[11px] text-[rgba(59,130,246,0.6)]">
              Mũi tên tự bắt điểm dữ liệu trên biểu đồ
            </span>
          )}
          {tool === 'pen' && (
            <span className="text-[11px] text-[rgba(255,255,255,0.4)]">
              Chạm vào bút lần nữa để đổi độ dày nét
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════ */
/* ─── ToolButton ─────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════ */

function ToolButton({
  active, onClick, label, children, disabled = false, variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'danger' | 'accent';
}) {
  const baseClass =
    variant === 'danger'
      ? 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]'
      : variant === 'accent'
        ? 'bg-[rgba(59,130,246,0.2)] text-[#60A5FA]'
        : active
          ? 'bg-[#3B82F6] text-white'
          : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${baseClass} disabled:opacity-30 disabled:pointer-events-none`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}