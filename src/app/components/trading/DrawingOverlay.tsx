import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  DrawingOverlay — Canvas-based drawing tools for charts
 * ══════════════════════════════════════════════════════════
 *
 *  Tools: Trendline, Fibonacci Retracement, Horizontal Line
 *  Renders on a transparent canvas overlay on top of LWC chart
 *  Coordinates are in pixel space (screen-relative)
 */

export type DrawingTool = 'none' | 'trendline' | 'fibonacci' | 'hline' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface Drawing {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
}

interface DrawingOverlayProps {
  activeTool: DrawingTool;
  onDrawingCount?: (count: number) => void;
}

/* Fibonacci retracement levels */
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];

export function DrawingOverlay({ activeTool, onDrawingCount }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const drawingIdRef = useRef(0);

  // Colors based on tool
  const toolColor = (tool: DrawingTool): string => {
    switch (tool) {
      case 'trendline':
        return '#3B82F6';
      case 'fibonacci':
        return '#8B5CF6';
      case 'hline':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

  // Render all drawings + current drawing-in-progress
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const drawOneLine = (p1: Point, p2: Point, color: string, dashed = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (dashed) ctx.setLineDash([6, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    const drawHLine = (y: number, color: string, dashed = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    };

    const drawFib = (p1: Point, p2: Point, color: string) => {
      const dy = p2.y - p1.y;
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const width = Math.max(maxX - minX, rect.width * 0.3);

      FIB_LEVELS.forEach((level, i) => {
        const y = p1.y + dy * level;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = level === 0 || level === 1 ? 1.2 : 0.8;
        ctx.setLineDash(level === 0.5 ? [4, 3] : []);
        ctx.moveTo(minX, y);
        ctx.lineTo(minX + width, y);
        ctx.stroke();

        // Fill zone
        if (i < FIB_LEVELS.length - 1) {
          const nextY = p1.y + dy * FIB_LEVELS[i + 1];
          ctx.fillStyle = color + (isDark ? '08' : '06');
          ctx.fillRect(minX, y, width, nextY - y);
        }

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(FIB_LABELS[i], minX + 4, y - 3);
      });
    };

    // Draw completed drawings
    drawings.forEach((d) => {
      if (d.tool === 'trendline' && d.points.length === 2) {
        drawOneLine(d.points[0], d.points[1], d.color);
        // Extend line slightly
        const dx = d.points[1].x - d.points[0].x;
        const ddy = d.points[1].y - d.points[0].y;
        const len = Math.sqrt(dx * dx + ddy * ddy);
        if (len > 0) {
          const ext = 30;
          const ex = d.points[1].x + (dx / len) * ext;
          const ey = d.points[1].y + (ddy / len) * ext;
          drawOneLine(d.points[1], { x: ex, y: ey }, d.color + '40', true);
        }
        // Dots at endpoints
        d.points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
        });
      } else if (d.tool === 'fibonacci' && d.points.length === 2) {
        drawFib(d.points[0], d.points[1], d.color);
      } else if (d.tool === 'hline' && d.points.length >= 1) {
        drawHLine(d.points[0].y, d.color);
        // Price label
        ctx.font = '10px monospace';
        ctx.fillStyle = d.color;
        ctx.textAlign = 'right';
        ctx.fillText('─ H-Line', rect.width - 8, d.points[0].y - 4);
      }
    });

    // Draw in-progress
    if (
      isDrawing &&
      startPoint &&
      currentPoint &&
      activeTool !== 'none' &&
      activeTool !== 'eraser'
    ) {
      const color = toolColor(activeTool) + 'CC';
      if (activeTool === 'trendline') {
        drawOneLine(startPoint, currentPoint, color, true);
        [startPoint, currentPoint].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      } else if (activeTool === 'fibonacci') {
        drawFib(startPoint, currentPoint, color);
      } else if (activeTool === 'hline') {
        drawHLine(currentPoint.y, color, true);
      }
    }

    ctx.setLineDash([]);
  }, [drawings, isDrawing, startPoint, currentPoint, activeTool, isDark]);

  useEffect(() => {
    render();
  }, [render]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render]);

  // Notify parent of drawing count
  useEffect(() => {
    onDrawingCount?.(drawings.length);
  }, [drawings.length, onDrawingCount]);

  const getPos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'none') return;

    if (activeTool === 'eraser') {
      // Remove drawing nearest to click
      const pos = getPos(e);
      let closestIdx = -1;
      let closestDist = 20; // threshold
      drawings.forEach((d, idx) => {
        d.points.forEach((p) => {
          const dist = Math.sqrt((p.x - pos.x) ** 2 + (p.y - pos.y) ** 2);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });
      });
      if (closestIdx >= 0) {
        setDrawings((prev) => prev.filter((_, i) => i !== closestIdx));
      }
      return;
    }

    const pos = getPos(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setCurrentPoint(getPos(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    const id = `d_${++drawingIdRef.current}`;
    const color = toolColor(activeTool);

    if (activeTool === 'hline') {
      setDrawings((prev) => [...prev, { id, tool: 'hline', points: [currentPoint], color }]);
    } else {
      // Need at least some distance
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        setDrawings((prev) => [
          ...prev,
          { id, tool: activeTool, points: [startPoint, currentPoint], color },
        ]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const cursorMap: Record<DrawingTool, string> = {
    none: 'default',
    trendline: 'crosshair',
    fibonacci: 'crosshair',
    hline: 'row-resize',
    eraser: 'pointer',
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: activeTool !== 'none' ? 10 : 0,
        cursor: cursorMap[activeTool],
        pointerEvents: activeTool !== 'none' ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
