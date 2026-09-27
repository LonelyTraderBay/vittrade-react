import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartAnnotationOverlay, type ChartAnnotationHandle } from './ChartAnnotationOverlay';

const context = {
  arc: vi.fn(),
  arcTo: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  measureText: vi.fn(() => ({ width: 80 })),
  moveTo: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  setLineDash: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  translate: vi.fn(),
} as unknown as CanvasRenderingContext2D;

afterEach(() => vi.restoreAllMocks());

function renderOverlay(options: { active?: boolean; onClose?: () => void } = {}) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 300,
    height: 300,
    left: 0,
    right: 400,
    top: 0,
    width: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  const ref = createRef<ChartAnnotationHandle>();
  const onClose = options.onClose ?? vi.fn();
  const view = render(
    <ChartAnnotationOverlay
      ref={ref}
      active={options.active ?? true}
      onClose={onClose}
      width={400}
      height={300}
    />,
  );

  return { ...view, canvas: view.container.querySelector('canvas')!, onClose, ref };
}

describe('ChartAnnotationOverlay', () => {
  it('stays hidden and exposes an empty imperative handle while inactive', () => {
    const { ref, container } = renderOverlay({ active: false });

    expect(container).toBeEmptyDOMElement();
    expect(ref.current?.getCanvas()).toBeNull();
    expect(ref.current?.hasAnnotations()).toBe(false);
  });

  it('sizes the canvas when annotation mode opens after the chart layout is measured', () => {
    const { container, onClose, ref, rerender } = renderOverlay({ active: false });

    rerender(
      <ChartAnnotationOverlay ref={ref} active onClose={onClose} width={400} height={300} />,
    );

    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('draws, edits, duplicates, erases and clears annotations through its toolbar', () => {
    const { canvas, ref } = renderOverlay();

    expect(canvas).toHaveStyle({ cursor: 'crosshair' });
    expect(screen.getByText('Chạm vào bút lần nữa để đổi độ dày nét')).toBeInTheDocument();

    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(canvas, { clientX: 30, clientY: 30 });
    expect(screen.getByText('1 ghi chú')).toBeInTheDocument();
    expect(ref.current?.hasAnnotations()).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
    expect(ref.current?.hasAnnotations()).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    const input = screen.getByPlaceholderText('Ghi chú...');
    fireEvent.change(input, { target: { value: 'Mốc mua' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(screen.getByText('1 ghi chú')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chọn / Di chuyển' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    expect(screen.getByText('Kéo để di chuyển')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nhân đôi ghi chú' }));
    expect(screen.getByText('2 ghi chú')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa mục đã chọn' }));
    expect(screen.getByText('1 ghi chú')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xóa ghi chú' }));
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    expect(ref.current?.hasAnnotations()).toBe(false);
    expect(screen.queryByText(/ghi chú$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chọn màu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đỏ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vẽ tay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vẽ tay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dày' }));
    fireEvent.mouseDown(canvas, { clientX: 80, clientY: 80 });
    fireEvent.mouseMove(canvas, { clientX: 90, clientY: 90 });
    fireEvent.mouseUp(canvas, { clientX: 90, clientY: 90 });
    expect(ref.current?.hasAnnotations()).toBe(true);

    act(() => ref.current?.clearAll());
    expect(ref.current?.hasAnnotations()).toBe(false);
  });

  it('snaps arrow endpoints to chart points and closes annotation mode', () => {
    const onClose = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const ref = createRef<ChartAnnotationHandle>();
    const { container } = render(
      <ChartAnnotationOverlay
        ref={ref}
        active
        onClose={onClose}
        width={400}
        height={300}
        snapPoints={[
          { x: 20, y: 20, label: 'start' },
          { x: 100, y: 100, label: 'end' },
        ]}
      />,
    );
    const canvas = container.querySelector('canvas')!;

    fireEvent.click(screen.getByRole('button', { name: 'Mũi tên' }));
    expect(screen.getByText('Mũi tên tự bắt điểm dữ liệu trên biểu đồ')).toBeInTheDocument();
    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
    expect(ref.current?.hasAnnotations()).toBe(true);
    expect(screen.getByText('1 ghi chú')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves and duplicates text and pen annotations, then clears the remaining annotation', () => {
    vi.clearAllMocks();
    const { canvas, ref } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    fireEvent.change(screen.getByPlaceholderText('Ghi chú...'), {
      target: { value: 'Mốc mua' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chọn / Di chuyển' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    vi.mocked(context.fillText).mockClear();
    fireEvent.mouseMove(canvas, { clientX: 60, clientY: 70 });

    expect(context.fillText).toHaveBeenCalledWith('Mốc mua', 120, 140);
    fireEvent.mouseUp(canvas, { clientX: 60, clientY: 70 });
    fireEvent.click(screen.getByRole('button', { name: 'Nhân đôi ghi chú' }));
    expect(context.fillText).toHaveBeenCalledWith('Mốc mua', 150, 170);
    expect(screen.getByText('2 ghi chú')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vẽ tay' }));
    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(canvas, { clientX: 30, clientY: 30 });
    expect(screen.getByText('3 ghi chú')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Chọn / Di chuyển' }));
    fireEvent.mouseDown(canvas, { clientX: 25, clientY: 25 });
    expect(screen.getByText('Kéo để di chuyển')).toBeInTheDocument();
    vi.mocked(context.moveTo).mockClear();
    vi.mocked(context.lineTo).mockClear();
    fireEvent.mouseMove(canvas, { clientX: 35, clientY: 35 });

    expect(
      vi.mocked(context.moveTo).mock.calls.some(([x, y]) => Math.abs(x - 60) < 1 && y === 60),
    ).toBe(true);
    expect(
      vi.mocked(context.lineTo).mock.calls.some(([x, y]) => Math.abs(x - 80) < 1 && y === 80),
    ).toBe(true);
    fireEvent.mouseUp(canvas, { clientX: 35, clientY: 35 });
    fireEvent.click(screen.getByRole('button', { name: 'Nhân đôi ghi chú' }));
    expect(context.moveTo).toHaveBeenCalledWith(90, 90);
    expect(screen.getByText('4 ghi chú')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xóa mục đã chọn' }));
    expect(screen.getByText('3 ghi chú')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tất cả' }));
    expect(ref.current?.hasAnnotations()).toBe(false);
  });

  it('moves arrow bodies and either endpoint without changing the other endpoint', () => {
    vi.clearAllMocks();
    const { canvas } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'Mũi tên' }));
    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(screen.getByRole('button', { name: 'Chọn / Di chuyển' }));

    fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 });
    fireEvent.mouseUp(canvas, { clientX: 60, clientY: 60 });
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    expect(screen.getByText(/Kéo để di chuyển · Kéo đầu mũi tên/)).toBeInTheDocument();
    vi.mocked(context.moveTo).mockClear();
    vi.mocked(context.lineTo).mockClear();
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 100 });
    expect(
      vi.mocked(context.moveTo).mock.calls.some(([x, y]) => Math.abs(x - 40) < 1 && y === 40),
    ).toBe(true);
    expect(
      vi.mocked(context.lineTo).mock.calls.some(([x, y]) => Math.abs(x - 220) < 1 && y === 200),
    ).toBe(true);
    fireEvent.mouseUp(canvas, { clientX: 110, clientY: 100 });

    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
    vi.mocked(context.moveTo).mockClear();
    vi.mocked(context.lineTo).mockClear();
    fireEvent.mouseMove(canvas, { clientX: 15, clientY: 25 });
    expect(
      vi.mocked(context.moveTo).mock.calls.some(([x, y]) => Math.abs(x - 30) < 1 && y === 50),
    ).toBe(true);
    expect(
      vi.mocked(context.lineTo).mock.calls.some(([x, y]) => Math.abs(x - 220) < 1 && y === 200),
    ).toBe(true);
    fireEvent.mouseUp(canvas, { clientX: 15, clientY: 25 });

    fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 });
    vi.mocked(context.moveTo).mockClear();
    vi.mocked(context.lineTo).mockClear();
    fireEvent.mouseMove(canvas, { clientX: 65, clientY: 65 });
    expect(
      vi.mocked(context.moveTo).mock.calls.some(([x, y]) => Math.abs(x - 40) < 1 && y === 60),
    ).toBe(true);
    expect(
      vi.mocked(context.lineTo).mock.calls.some(([x, y]) => Math.abs(x - 230) < 1 && y === 210),
    ).toBe(true);
    fireEvent.mouseUp(canvas, { clientX: 65, clientY: 65 });

    fireEvent.click(screen.getByRole('button', { name: 'Nhân đôi ghi chú' }));
    expect(
      vi.mocked(context.moveTo).mock.calls.some(([x, y]) => Math.abs(x - 70) < 1 && y === 90),
    ).toBe(true);
    expect(
      vi.mocked(context.lineTo).mock.calls.some(([x, y]) => Math.abs(x - 260) < 1 && y === 240),
    ).toBe(true);
    expect(screen.getByText('2 ghi chú')).toBeInTheDocument();
  });

  it('ignores empty text and only erases an annotation after a hit', () => {
    vi.clearAllMocks();
    const { canvas, ref } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(ref.current?.hasAnnotations()).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    fireEvent.change(screen.getByPlaceholderText('Ghi chú...'), {
      target: { value: 'Giữ lại' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText('Ghi chú...'), { key: 'Enter' });
    expect(ref.current?.hasAnnotations()).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Xóa ghi chú' }));
    fireEvent.mouseMove(canvas, { clientX: 300, clientY: 250 });
    fireEvent.mouseDown(canvas, { clientX: 300, clientY: 250 });
    expect(ref.current?.hasAnnotations()).toBe(true);
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
    expect(ref.current?.hasAnnotations()).toBe(false);
  });
});
