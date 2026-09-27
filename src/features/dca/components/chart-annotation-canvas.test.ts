import { describe, expect, it, vi } from 'vitest';
import {
  distPP,
  drawArrowLine,
  drawEraserHighlight,
  drawPenStroke,
  drawSelectionUI,
  drawSnapIndicator,
  drawTextLabel,
  hitTestAnnotation,
  hitTestArrowHandles,
  snapToNearest,
  type Annotation,
} from './chart-annotation-canvas';

function createCanvasContext() {
  return {
    arc: vi.fn(),
    arcTo: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    measureText: vi.fn(() => ({ width: 40 })),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    setLineDash: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const pen: Annotation = {
  type: 'pen',
  points: [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
  ],
  color: '#fff',
  width: 4,
};

const text: Annotation = { type: 'text', x: 100, y: 100, text: 'BTC', color: '#fff' };
const arrow: Annotation = {
  type: 'arrow',
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 0,
  color: '#fff',
};

describe('chart annotation hit testing', () => {
  it('measures point distance and detects pen, text, and arrow hits and misses', () => {
    const ctx = createCanvasContext();

    expect(distPP(0, 0, 3, 4)).toBe(5);
    expect(hitTestAnnotation({ x: 10, y: 5 }, pen, ctx)).toBe(true);
    expect(hitTestAnnotation({ x: 100, y: 100 }, pen, ctx)).toBe(false);
    expect(
      hitTestAnnotation(
        { x: 1, y: 1 },
        {
          ...pen,
          points: [
            { x: 1, y: 1 },
            { x: 1, y: 1 },
          ],
        },
        ctx,
      ),
    ).toBe(true);
    expect(hitTestAnnotation({ x: 0, y: 0 }, { ...pen, points: [{ x: 0, y: 0 }] }, ctx)).toBe(
      false,
    );

    expect(hitTestAnnotation({ x: 100, y: 100 }, text, null)).toBe(false);
    expect(hitTestAnnotation({ x: 100, y: 100 }, text, ctx)).toBe(true);
    expect(hitTestAnnotation({ x: 200, y: 200 }, text, ctx)).toBe(false);
    expect(hitTestAnnotation({ x: 50, y: 4 }, arrow, ctx)).toBe(true);
    expect(hitTestAnnotation({ x: 50, y: 40 }, arrow, ctx)).toBe(false);
  });

  it('identifies arrow handles and snaps only to the nearest point inside the threshold', () => {
    expect(hitTestArrowHandles({ x: 0, y: 0 }, arrow)).toBe('arrow-start');
    expect(hitTestArrowHandles({ x: 100, y: 0 }, arrow)).toBe('arrow-end');
    expect(hitTestArrowHandles({ x: 50, y: 50 }, arrow)).toBeNull();

    expect(
      snapToNearest({ x: 10, y: 3 }, [
        { x: 12, y: 4 },
        { x: 30, y: 3 },
      ]),
    ).toEqual({
      x: 12,
      y: 4,
      snapped: true,
      snapIdx: 0,
    });
    expect(snapToNearest({ x: 36, y: 0 }, [{ x: 0, y: 0 }])).toEqual({
      x: 0,
      y: 0,
      snapped: true,
      snapIdx: 0,
    });
    expect(snapToNearest({ x: 37, y: 0 }, [{ x: 0, y: 0 }])).toEqual({
      x: 37,
      y: 0,
      snapped: false,
      snapIdx: -1,
    });
    expect(snapToNearest({ x: 3, y: 4 }, [])).toEqual({
      x: 3,
      y: 4,
      snapped: false,
      snapIdx: -1,
    });
  });
});

describe('chart annotation drawing', () => {
  it('draws multi-point strokes and leaves a one-point stroke untouched', () => {
    const ctx = createCanvasContext();

    drawPenStroke(ctx, { ...pen, points: [{ x: 1, y: 1 }] });
    expect(ctx.beginPath).not.toHaveBeenCalled();

    drawPenStroke(ctx, pen);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 20, 0);
    expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 20, 20);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });

  it('draws text backgrounds, arrow heads, selection handles, erase outlines, and snap indicators', () => {
    const ctx = createCanvasContext();

    drawTextLabel(ctx, text);
    expect(ctx.fillText).toHaveBeenCalledWith('BTC', 100, 100);
    expect(ctx.arcTo).toHaveBeenCalledTimes(4);

    drawArrowLine(ctx, arrow);
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 4, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();

    drawSelectionUI(ctx, pen, '#00f');
    drawSelectionUI(ctx, text, '#00f');
    drawSelectionUI(ctx, arrow, '#00f');
    expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
    expect(ctx.setLineDash).toHaveBeenCalledWith([6, 4]);

    drawEraserHighlight(ctx, pen);
    drawEraserHighlight(ctx, text);
    drawEraserHighlight(ctx, arrow);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(4);

    drawSnapIndicator(ctx, 12, 24);
    expect(ctx.restore).toHaveBeenCalledTimes(12);
  });
});
