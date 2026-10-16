import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { renderWithProviders } from '@/test/test-utils';
import { BottomSheetRow, BottomSheetV2 } from './BottomSheetV2';

const reducedMotion = vi.hoisted(() => ({ value: false as boolean | null }));

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return { ...actual, useReducedMotion: () => reducedMotion.value };
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  reducedMotion.value = false;
  document.getElementById('sheet-portal')?.remove();
});

describe('BottomSheetV2', () => {
  it('renders the default bottom sheet and closes from its header', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <BottomSheetV2 open={false} onClose={onClose} title="Tùy chọn">
        <p>Nội dung</p>
      </BottomSheetV2>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <BottomSheetV2 open onClose={onClose} title="Tùy chọn">
        <p>Nội dung</p>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Tùy chọn' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Nội dung');
    expect(dialog).toHaveStyle({ maxHeight: '85vh' });
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(close).toHaveAttribute('type', 'button');
    expect(close).toBeEnabled();
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the modal layer active through exit and allows reopen after it completes', async () => {
    function ReopenableSheet() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open sheet
          </button>
          <BottomSheetV2 open={open} onClose={() => setOpen(false)} title="Reopenable sheet">
            <p>Sheet content</p>
          </BottomSheetV2>
        </>
      );
    }

    renderWithProviders(<ReopenableSheet />);
    fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog', { name: 'Reopenable sheet' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(document.querySelector('[data-bottom-sheet-overlay]')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open sheet' })).not.toBeInTheDocument();
    expect(document.body.style.pointerEvents).toBe('none');

    await waitFor(() =>
      expect(document.querySelector('[data-bottom-sheet-overlay]')).not.toBeInTheDocument(),
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    await waitFor(() => expect(document.body.style.pointerEvents).toBe(''));
    expect(screen.getByRole('button', { name: 'Open sheet' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }));

    expect(screen.getByRole('dialog', { name: 'Reopenable sheet' })).toBeVisible();
    expect(screen.getByText('Sheet content')).toBeVisible();
  });

  it('blocks every close request while preventClose is active', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <BottomSheetV2 open onClose={onClose} title="Đang xử lý" preventClose>
        <button>Tiếp tục</button>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Đang xử lý' });
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(close).toBeDisabled();
    fireEvent.click(close);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    fireEvent.click(dialog.parentElement!.querySelector('[aria-hidden="true"]')!);
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <BottomSheetV2 open onClose={onClose} title="Đang xử lý">
        <button>Tiếp tục</button>
      </BottomSheetV2>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('supports the center variant, custom header, and an explicit accessible label', () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <BottomSheetV2
        open
        onClose={onClose}
        variant="center"
        maxHeight="50vh"
        showHandle={false}
        showCloseButton={false}
        ariaLabel="Xác nhận riêng"
        customHeader={<header>Tiêu đề tùy chỉnh</header>}
      >
        <p>Chi tiết</p>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Xác nhận riêng' });
    expect(dialog).toHaveStyle({ maxHeight: '50vh' });
    expect(dialog).toHaveTextContent('Tiêu đề tùy chỉnh');
    expect(dialog).toHaveTextContent('Chi tiết');
    expect(screen.queryByRole('button', { name: 'Đóng' })).not.toBeInTheDocument();
    expect(container.querySelector('.cursor-grab')).not.toBeInTheDocument();
    expect(dialog.parentElement?.querySelector('.cursor-grab')).not.toBeInTheDocument();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses center defaults, the default header, and reduced-motion transitions', () => {
    reducedMotion.value = true;
    const onClose = vi.fn();
    renderWithProviders(
      <BottomSheetV2 open onClose={onClose} variant="center" title="Center">
        <p>Centered content</p>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Center' });
    expect(dialog).toHaveStyle({ maxHeight: '80vh' });
    expect(dialog.querySelector('.pt-3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeEnabled();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog.parentElement!.parentElement!.querySelector('[aria-hidden="true"]')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('uses regular motion when the reduced-motion preference is unavailable', () => {
    reducedMotion.value = null;
    renderWithProviders(
      <BottomSheetV2 open onClose={() => undefined} variant="center" title="Motion fallback">
        Content
      </BottomSheetV2>,
    );
    expect(screen.getByRole('dialog', { name: 'Motion fallback' })).toBeInTheDocument();
  });

  it('uses the title as a label and renders a close-only header when no title is provided', () => {
    renderWithProviders(
      <BottomSheetV2 open onClose={() => undefined}>
        <p>Nội dung không tiêu đề</p>
      </BottomSheetV2>,
    );

    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
  });

  it('traps Tab at both ends and safely handles a sheet without focusable content', () => {
    const { rerender } = renderWithProviders(
      <BottomSheetV2 open onClose={() => undefined} title="Tab order">
        <button>Đầu</button>
        <a href="/cuoi">Cuối</a>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Tab order' });
    const first = screen.getByRole('button', { name: 'Đóng' });
    const last = screen.getByRole('link', { name: 'Cuối' });
    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(first).toHaveFocus();
    first.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    rerender(
      <BottomSheetV2
        open
        onClose={() => undefined}
        showCloseButton={false}
        customHeader={<div>Không có điều khiển</div>}
      >
        Chỉ có văn bản
      </BottomSheetV2>,
    );
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Dialog' }), { key: 'Tab' });
  });

  it('closes on Escape when dismissal is allowed', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <BottomSheetV2 open onClose={onClose} title="Escape">
        Nội dung
      </BottomSheetV2>,
    );

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Escape' }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('hides background content and prevents focus from escaping the modal', () => {
    const outside = document.createElement('button');
    outside.textContent = 'Background action';
    document.body.append(outside);

    renderWithProviders(
      <BottomSheetV2 open onClose={() => undefined} title="Modal focus">
        <button>Sheet action</button>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Modal focus' });
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    outside.focus();
    expect(dialog).toHaveFocus();

    outside.remove();
  });

  it('supports swipe dismissal only when the gesture starts at the top of the content', () => {
    const onClose = vi.fn();
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    renderWithProviders(
      <BottomSheetV2 open onClose={onClose} title="Swipe">
        <p>Scrollable content</p>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Swipe' });
    const content = dialog.querySelector<HTMLElement>('[class*="overflow-y-auto"]')!;
    const startTouch = (clientY: number) => {
      const event = new Event('touchstart', { bubbles: true });
      Object.defineProperty(event, 'touches', { value: [{ clientY }] });
      fireEvent(dialog, event);
    };
    const moveTouch = (clientY: number) => {
      const event = new Event('touchmove', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: [{ clientY }] });
      fireEvent(dialog, event);
      return event;
    };
    const endTouch = () => fireEvent(dialog, new Event('touchend', { bubbles: true }));

    content.scrollTop = 5;
    startTouch(0);
    expect(moveTouch(150).defaultPrevented).toBe(false);
    endTouch();
    expect(onClose).not.toHaveBeenCalled();

    content.scrollTop = 0;
    startTouch(0);
    expect(moveTouch(80).defaultPrevented).toBe(true);
    expect(raf).toHaveBeenCalled();
    moveTouch(-1);
    endTouch();
    expect(onClose).not.toHaveBeenCalled();

    startTouch(0);
    moveTouch(80);
    endTouch();
    expect(onClose).not.toHaveBeenCalled();

    startTouch(0);
    moveTouch(150);
    endTouch();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('supports header mouse drags and ignores mouse drags that start in content', () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    renderWithProviders(
      <BottomSheetV2 open onClose={onClose} title="Mouse swipe">
        <button>Action</button>
      </BottomSheetV2>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Mouse swipe' });
    const action = screen.getByRole('button', { name: 'Action' });
    fireEvent.mouseMove(window, { clientY: 150 });
    fireEvent.mouseUp(window);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(action, { clientY: 0 });
    fireEvent.mouseMove(window, { clientY: 150 });
    fireEvent.mouseUp(window);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(dialog, { clientY: 0 });
    fireEvent.mouseMove(window, { clientY: 150 });
    fireEvent.mouseUp(window);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not start touch or mouse dismissal while close is prevented', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <BottomSheetV2 open onClose={onClose} title="Pending" preventClose>
        Pending
      </BottomSheetV2>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Pending' });
    const touchStart = new Event('touchstart', { bubbles: true });
    Object.defineProperty(touchStart, 'touches', { value: [{ clientY: 0 }] });
    fireEvent(dialog, touchStart);
    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touchMove, 'touches', { value: [{ clientY: 200 }] });
    fireEvent(dialog, touchMove);
    fireEvent(dialog, new Event('touchend', { bubbles: true }));
    fireEvent.mouseDown(dialog, { clientY: 0 });
    fireEvent.mouseMove(window, { clientY: 200 });
    fireEvent.mouseUp(window);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onAfterOpen once and restores focus when the sheet closes', async () => {
    reducedMotion.value = true;
    const trigger = document.createElement('button');
    trigger.textContent = 'Open sheet';
    document.body.append(trigger);
    trigger.focus();
    const onAfterOpen = vi.fn();
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <BottomSheetV2 open onClose={onClose} onAfterOpen={onAfterOpen} title="Focus">
        <button>Action</button>
      </BottomSheetV2>,
    );

    await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Focus' })).toHaveFocus());
    rerender(
      <BottomSheetV2 open={false} onClose={onClose} onAfterOpen={onAfterOpen} title="Focus">
        <button>Action</button>
      </BottomSheetV2>,
    );
    await waitFor(() =>
      expect(document.querySelector('[data-bottom-sheet-overlay]')).not.toBeInTheDocument(),
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open sheet' })).toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });
});

describe('BottomSheetRow', () => {
  it('renders default and highlighted values with optional color', () => {
    const { rerender } = renderWithProviders(<BottomSheetRow label="Số lượng" value="25" />);
    const value = screen.getByText('25');
    expect(value).toHaveStyle({ fontWeight: 400 });

    rerender(<BottomSheetRow label="Tổng" value="100 USDT" highlight valueColor="green" />);
    expect(screen.getByText('100 USDT')).toHaveStyle({ color: 'rgb(0, 128, 0)', fontWeight: 700 });
  });
});
