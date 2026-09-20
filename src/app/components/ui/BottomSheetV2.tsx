import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useScrollLock } from '../../hooks/useScrollLock';
import { φElevation } from '../../utils/golden';

/* ═══════════════════════════════════════════════════════════
   BottomSheetV2
   ═══════════════════════════════════════════════════════════
   Enterprise-grade reusable bottom sheet / center modal.

   Architecture (bottom variant):
   ┌─ fixed inset-0 z-[60] flex items-end ───┐  ← Wrapper (definite height = viewport)
   │  ┌─ absolute inset-0 ──────────────┐    │  ← Backdrop (blur + dark)
   │  └────────────────────────────────────┘    │
   │  ┌─ relative w-full flex-col ───────┐    │  ← Sheet panel (flex child)
   │  │  overflow-hidden rounded-t-3xl    │    │
   │  │  ┌─ handle ────────────────────┐ │    │
   │  │  ├─ header (44×44 close btn)   │ │    │
   │  │  ├─ flex-1 min-h-0 scroll ─────┤ │    │  ← Content (scrollable)
   │  │  │  {children}                  │ │    │
   │  │  └─────────────────────────────┘ │    │
   │  └──────────────────────────────────┘    │
   └──────────────────────────────────────────┘

   Key fixes vs previous version:
   1. Wrapper `fixed inset-0 flex items-end` → sheet is flex child
      → definite height chain → flex-1 on content works correctly
   2. Sheet has `overflow-hidden` → clipping context established
   3. Content has `min-h-0` → flex shrink works for overflow
   4. Close button 44×44pt (WCAG / Apple HIG compliant)
   5. Manual swipe-to-dismiss with scrollTop guard
   6. Backdrop inside wrapper with aria-hidden
   7. Safe-area padding on sheet panel (not content)
   8. maxHeight raised to 85vh
   ═══════════════════════════════════════════════════════════ */

export interface BottomSheetV2Props {
  /** Whether the sheet is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Sheet title (displayed in header row) */
  title?: string;
  /** Content inside the sheet */
  children: React.ReactNode;
  /**
   * Positioning variant:
   * - `'bottom'` — anchored to bottom, slides up (default)
   * - `'center'` — centered modal, scale fade-in
   */
  variant?: 'bottom' | 'center';
  /** Max height of the sheet. Default: '85vh' (bottom) / '80vh' (center) */
  maxHeight?: string;
  /** Show drag handle bar. Default: true */
  showHandle?: boolean;
  /** Show close (X) button in title row. Default: true */
  showCloseButton?: boolean;
  /** Prevent closing via backdrop click, swipe, or Escape (e.g. during loading). Default: false */
  preventClose?: boolean;
  /** Accessibility label. Falls back to `title` if provided. */
  ariaLabel?: string;
  /** Additional className for the sheet panel */
  className?: string;
  /** Custom header content (replaces default title + close) */
  customHeader?: React.ReactNode;
  /** Callback fired after the open animation completes (~350ms). Useful for analytics/tracking. */
  onAfterOpen?: () => void;
}

export function BottomSheetV2({
  open,
  onClose,
  title,
  children,
  variant = 'bottom',
  maxHeight,
  showHandle = true,
  showCloseButton = true,
  preventClose = false,
  ariaLabel,
  className,
  customHeader,
  onAfterOpen,
}: BottomSheetV2Props) {
  const c = useThemeColors();
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ─── Scroll lock ─── */
  useScrollLock(open);

  /* ─── Swipe-to-dismiss: native touch + mouse listeners for reliable swipe-to-dismiss ─── */
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const isDraggingRef = useRef(false);
  const latestDragOffset = useRef(0);
  const dragRafRef = useRef(0);

  // Reset when sheet opens
  useEffect(() => {
    if (open) {
      setDragOffset(0);
      latestDragOffset.current = 0;
      isDraggingRef.current = false;
    }
  }, [open]);

  // Store latest preventClose & onClose in refs so native listeners can read them
  const preventCloseRef = useRef(preventClose);
  preventCloseRef.current = preventClose;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Native touch + mouse listeners for reliable swipe-to-dismiss
  useEffect(() => {
    const el = sheetRef.current;
    if (!open || !el) return;

    /* ── Shared drag logic ── */
    const startDrag = (clientY: number) => {
      dragStartY.current = clientY;
      isDraggingRef.current = false;
    };

    const moveDrag = (clientY: number, preventDefault?: () => void) => {
      if (preventCloseRef.current) return;
      const diff = clientY - dragStartY.current;
      const contentEl = contentRef.current;
      const scrolledToTop = !contentEl || contentEl.scrollTop <= 0;

      if (diff > 0 && scrolledToTop) {
        preventDefault?.();
        isDraggingRef.current = true;
        latestDragOffset.current = diff;
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = requestAnimationFrame(() => {
          setDragOffset(diff);
        });
      } else if (isDraggingRef.current && diff <= 0) {
        isDraggingRef.current = false;
        latestDragOffset.current = 0;
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = requestAnimationFrame(() => {
          setDragOffset(0);
        });
      }
    };

    const endDrag = () => {
      cancelAnimationFrame(dragRafRef.current);
      if (!isDraggingRef.current) return;
      if (latestDragOffset.current > 100) {
        onCloseRef.current();
      } else {
        setDragOffset(0);
      }
      isDraggingRef.current = false;
      latestDragOffset.current = 0;
    };

    /* ── Touch handlers ── */
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientY, () => e.preventDefault());
    const onTouchEnd = () => endDrag();

    /* ── Mouse handlers (for desktop / browser preview) ── */
    let mouseIsDown = false;
    const onMouseDown = (e: MouseEvent) => {
      // Only start drag from handle area or header (not from content)
      const target = e.target as HTMLElement;
      const contentEl = contentRef.current;
      if (contentEl && contentEl.contains(target)) return; // skip if clicking inside content
      mouseIsDown = true;
      startDrag(e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseIsDown) return;
      e.preventDefault();
      moveDrag(e.clientY);
    };
    const onMouseUp = () => {
      if (!mouseIsDown) return;
      mouseIsDown = false;
      endDrag();
    };

    // Touch: passive:false on touchmove so preventDefault works
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    // Mouse: listen on el for mousedown, on window for move/up (drag can leave el)
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(dragRafRef.current);
    };
  }, [open]);

  // Backdrop opacity follows drag
  const computedBackdropOpacity = dragOffset > 0
    ? Math.max(0, 1 - dragOffset / 300)
    : 1;

  /* ─── Previous focus restore ─── */
  const previousFocusRef = useRef<Element | null>(null);
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
    } else if (previousFocusRef.current instanceof HTMLElement) {
      const el = previousFocusRef.current;
      requestAnimationFrame(() => el.focus());
      previousFocusRef.current = null;
    }
  }, [open]);

  /* ─── Auto-focus on open ─── */
  useEffect(() => {
    if (open && sheetRef.current) {
      const timer = setTimeout(() => {
        sheetRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  /* ─── onAfterOpen callback ─── */
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = false;
      const timer = setTimeout(() => {
        if (!hasOpenedRef.current) {
          hasOpenedRef.current = true;
          onAfterOpen?.();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, onAfterOpen]);

  /* ─── Focus trap + Escape ─── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !preventClose) {
      onClose();
      return;
    }
    if (e.key === 'Tab' && sheetRef.current) {
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }, [onClose, preventClose]);

  const handleBackdropClick = useCallback(() => {
    if (!preventClose) onClose();
  }, [onClose, preventClose]);

  /* ─── Resolved values ─── */
  const resolvedMaxHeight = maxHeight ?? (variant === 'bottom' ? '85vh' : '80vh');
  const resolvedAriaLabel = ariaLabel ?? title ?? 'Dialog';

  /* ─── Default header — 44×44pt close button ─── */
  const defaultHeader = (title || showCloseButton) ? (
    <div className="flex items-center justify-between px-5 shrink-0"
      style={{ paddingTop: 4, paddingBottom: 4 }}
    >
      {title ? (
        <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>{title}</h3>
      ) : (
        <div />
      )}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="flex items-center justify-center shrink-0 rounded-full transition-colors"
          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, color: c.text3 }}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      )}
    </div>
  ) : null;

  /* ─── Drag handle ─── */
  const handleElement = showHandle ? (
    <div className="flex justify-center shrink-0 cursor-grab active:cursor-grabbing"
      style={{ paddingTop: 12, paddingBottom: 4 }}
    >
      <div className="rounded-full" style={{ width: 40, height: 4, background: c.text3, opacity: 0.3 }} />
    </div>
  ) : null;

  /* ─── Portal target: render outside PageTransition/SwipeBack transform chain ─── */
  const portalTarget =
    document.getElementById('sheet-portal') ??
    document.getElementById('app-layout-root') ??
    document.body;

  const sheetContent = (
    <AnimatePresence>
      {open && (
        <div className="contents">
          {variant === 'bottom' ? (
            /* ═══ Bottom Sheet ═══ */
            <div className="absolute inset-0 z-[60] flex justify-center items-end">
              {/* ─── Backdrop ─── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: computedBackdropOpacity }}
                exit={{ opacity: 0 }}
                transition={dragOffset > 0 ? { duration: 0 } : { duration: 0.2 }}
                className="absolute inset-0"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                onClick={handleBackdropClick}
                aria-hidden="true"
              />

              {/* ─── Sheet panel ─── */}
              <motion.div
                ref={sheetRef}
                initial={{ y: '100%', opacity: 1 }}
                animate={{ y: dragOffset, opacity: 1 }}
                exit={{ y: '100%', opacity: 1 }}
                transition={
                  dragOffset > 0
                    ? { duration: 0 }
                    : { type: 'spring', damping: 28, stiffness: 320 }
                }
                className={`relative w-full rounded-t-3xl flex flex-col overflow-hidden outline-none ${className ?? ''}`}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                role="dialog"
                aria-modal="true"
                aria-label={resolvedAriaLabel}
                onClick={e => e.stopPropagation()}
                style={{
                  background: c.surface,
                  maxWidth: 440,
                  maxHeight: resolvedMaxHeight,
                  boxShadow: φElevation.overlay,
                  paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                {handleElement}
                {customHeader ?? defaultHeader}

                {/* Content — scrollable */}
                <div
                  ref={contentRef}
                  className="flex-1 min-h-0 overflow-y-auto px-5 scrollbar-none"
                  style={{
                    overscrollBehaviorY: 'contain',
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  {children}
                </div>
              </motion.div>
            </div>
          ) : (
            /* ═══ Center Modal ═══ */
            <div className="contents">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-[60]"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                onClick={handleBackdropClick}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                style={{ padding: 12 }}
              >
                <motion.div
                  ref={sheetRef}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 400 }}
                  className={`rounded-3xl w-full pointer-events-auto flex flex-col overflow-hidden outline-none ${className ?? ''}`}
                  tabIndex={-1}
                  onKeyDown={handleKeyDown}
                  role="dialog"
                  aria-modal="true"
                  aria-label={resolvedAriaLabel}
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: c.surface,
                    maxHeight: resolvedMaxHeight,
                    boxShadow: φElevation.overlay,
                  }}
                >
                  {showHandle && (
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                      <div className="rounded-full" style={{ width: 40, height: 4, background: c.text3, opacity: 0.3 }} />
                    </div>
                  )}
                  {customHeader ?? defaultHeader}
                  <div
                    ref={contentRef}
                    className="flex-1 min-h-0 overflow-y-auto px-5 pb-6 scrollbar-none"
                    style={{ overscrollBehaviorY: 'contain', paddingTop: 8 }}
                  >
                    {children}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(sheetContent, portalTarget);
}

/* ═══════════════════════════════════════════════════════════
   BottomSheetRow
   ═══════════════════════════════════════════════════════════
   Helper component for displaying label-value rows inside sheets.
   Provides consistent styling for detail rows in confirmations.
   ═══════════════════��═══════════════════════════════════════ */

export interface BottomSheetRowProps {
  /** Label (left side) */
  label: string;
  /** Value (right side) */
  value: string;
  /** Highlight the value (bold) */
  highlight?: boolean;
  /** Custom color for value */
  valueColor?: string;
}

export function BottomSheetRow({
  label,
  value,
  highlight,
  valueColor,
}: BottomSheetRowProps) {
  const c = useThemeColors();
  return (
    <div className="flex justify-between items-center py-2">
      <span style={{ color: c.text2, fontSize: 13 }}>{label}</span>
      <span
        style={{
          color: valueColor || c.text1,
          fontSize: 13,
          fontWeight: highlight ? 700 : 400,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}