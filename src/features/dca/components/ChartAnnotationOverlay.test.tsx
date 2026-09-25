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
});
