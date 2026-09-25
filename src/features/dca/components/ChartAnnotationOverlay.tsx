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

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChartAnnotationToolbar } from './ChartAnnotationToolbar';
import {
  ChartAnnotationTextInput,
  type ChartAnnotationTextInputState,
} from './ChartAnnotationTextInput';
import {
  DUPLICATE_OFFSET,
  PEN_WIDTHS,
  PRESET_COLORS,
  drawArrowLine,
  drawEraserHighlight,
  drawPenStroke,
  drawSelectionUI,
  drawSnapIndicator,
  drawTextLabel,
  distPP,
  hitTestAnnotation,
  hitTestArrowHandles,
  snapToNearest,
  type Annotation,
  type AnnotationTool,
  type ArrowLine,
  type DragState,
  type PenStroke,
  type SnapPoint,
  type TextLabel,
} from './chart-annotation-canvas';
export type { SnapPoint } from './chart-annotation-canvas';

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
>(function ChartAnnotationOverlay(
  { active, onClose, width, height, snapPoints: rawSnapPoints },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<AnnotationTool>('pen');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
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

  const [textInput, setTextInput] = useState<ChartAnnotationTextInputState | null>(null);

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
          case 'pen':
            drawPenStroke(ctx, ann);
            break;
          case 'text':
            drawTextLabel(ctx, ann);
            break;
          case 'arrow':
            drawArrowLine(ctx, ann);
            break;
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
  }, [width, height, redrawCanvas, annotations, selectedIndex, eraserHoverIndex, activeSnap]);

  /* ── Deselect when switching tools ──────────────────────── */
  useEffect(() => {
    if (tool !== 'select') setSelectedIndex(null);
    if (tool !== 'eraser') setEraserHoverIndex(null);
    if (tool !== 'arrow') setActiveSnap(null);
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
              originalAnnotation:
                selAnn.type === 'pen'
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
              originalAnnotation:
                ann.type === 'pen'
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
          if (hitTestAnnotation(pos, annotations[i], ctx)) {
            found = i;
            break;
          }
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
                next[selectedIndex] = {
                  ...o,
                  points: o.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                };
                break;
              }
              case 'text': {
                const o = orig as TextLabel;
                next[selectedIndex] = { ...o, x: o.x + dx, y: o.y + dy };
                break;
              }
              case 'arrow': {
                const o = orig as ArrowLine;
                next[selectedIndex] = {
                  ...o,
                  startX: o.startX + dx,
                  startY: o.startY + dy,
                  endX: o.endX + dx,
                  endY: o.endY + dy,
                };
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
    [
      active,
      tool,
      annotations,
      selectedIndex,
      eraserHoverIndex,
      activeSnap,
      color,
      penWidth,
      canvasSnapPoints,
      getCanvasPos,
      getCtx,
      redrawCanvas,
    ],
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
              {
                type: 'arrow',
                startX: start.x,
                startY: start.y,
                endX: endPos.x,
                endY: endPos.y,
                color,
              },
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
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
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
      case 'pen':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'arrow':
        return 'crosshair';
      case 'eraser':
        return 'pointer';
      case 'select':
        return 'default';
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

      <ChartAnnotationTextInput
        textInput={textInput}
        width={width}
        height={height}
        setTextInput={setTextInput}
        confirmTextInput={confirmTextInput}
      />
      <ChartAnnotationToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        annotations={annotations}
        selectedIndex={selectedIndex}
        canvasSnapPoints={canvasSnapPoints}
        onClose={onClose}
        handleUndo={handleUndo}
        handleDuplicate={handleDuplicate}
        handleDeleteSelected={handleDeleteSelected}
        handleClear={handleClear}
      />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════ */
