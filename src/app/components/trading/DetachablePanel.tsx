import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2, X, Move, Pin, PinOff } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  DetachablePanel — Floating multi-window panel system
 * ══════════════════════════════════════════════════════════
 *
 *  Allows any panel (chart, orderbook, order form, etc.)
 *  to be detached into a floating window within the page.
 *
 *  Features:
 *  ● Drag to reposition (title bar drag handle)
 *  ● Resize via corner handle
 *  ● Pin/unpin (prevent accidental move)
 *  ● Maximize to fill viewport
 *  ● Z-index management (click to bring to front)
 */

export interface DetachedWindow {
  id: string;
  title: string;
  icon?: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  pinned: boolean;
  maximized: boolean;
  zIndex: number;
}

interface DetachablePanelProps {
  window: DetachedWindow;
  onUpdate: (id: string, updates: Partial<DetachedWindow>) => void;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

export function DetachablePanel({ window: win, onUpdate, onClose, onFocus, children }: DetachablePanelProps) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  const panelBg = isDark ? '#0F1117' : '#FFFFFF';
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const headerBg = isDark ? '#13151D' : '#F3F4F6';

  // Drag handling
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (win.pinned || win.maximized) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };
    onFocus(win.id);

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onUpdate(win.id, {
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [win.id, win.x, win.y, win.pinned, win.maximized, onUpdate, onFocus]);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height };
    onFocus(win.id);

    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      onUpdate(win.id, {
        width: Math.max(win.minWidth || 280, resizeRef.current.origW + dx),
        height: Math.max(win.minHeight || 200, resizeRef.current.origH + dy),
      });
    };
    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [win.id, win.width, win.height, win.minWidth, win.minHeight, win.maximized, onUpdate, onFocus]);

  const toggleMaximize = () => {
    onUpdate(win.id, { maximized: !win.maximized });
  };

  const togglePin = () => {
    onUpdate(win.id, { pinned: !win.pinned });
  };

  return (
    <div ref={panelRef}
      className="absolute flex flex-col rounded-lg overflow-hidden shadow-2xl"
      style={{
        left: win.maximized ? 8 : win.x,
        top: win.maximized ? 8 : win.y,
        width: win.maximized ? 'calc(100% - 16px)' : win.width,
        height: win.maximized ? 'calc(100% - 16px)' : win.height,
        zIndex: win.zIndex,
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        boxShadow: isDark
          ? '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 12px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        transition: win.maximized ? 'all 0.2s ease' : 'none',
      }}
      onMouseDown={() => onFocus(win.id)}>

      {/* Title bar */}
      <div className="flex items-center justify-between px-2 py-1 shrink-0 select-none"
        style={{ background: headerBg, borderBottom: `1px solid ${panelBorder}`, cursor: win.pinned ? 'default' : 'grab' }}
        onMouseDown={handleDragStart}>
        <div className="flex items-center gap-1.5">
          {!win.pinned && <Move size={9} color={c.text3} style={{ opacity: 0.4 }} />}
          {win.icon}
          <span style={{ color: c.text1, fontSize: 10, fontWeight: 700 }}>{win.title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={togglePin}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
            style={{ background: win.pinned ? 'rgba(59,130,246,0.1)' : 'transparent' }}
            title={win.pinned ? 'Bỏ ghim' : 'Ghim'}>
            {win.pinned ? <Pin size={8} color="#3B82F6" /> : <PinOff size={8} color={c.text3} />}
          </button>
          <button onClick={toggleMaximize}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
            title={win.maximized ? 'Thu nhỏ' : 'Phóng to'}>
            {win.maximized ? <Minimize2 size={8} color={c.text3} /> : <Maximize2 size={8} color={c.text3} />}
          </button>
          <button onClick={() => onClose(win.id)}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
            style={{ background: 'rgba(239,68,68,0.06)' }}
            title="Đóng">
            <X size={8} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
          style={{ zIndex: 10 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" className="absolute bottom-1 right-1">
            <path d="M8 2L2 8M8 5L5 8M8 8L8 8" stroke={c.text3} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   useDetachableWindows — Hook for managing floating windows
   ═══════════════════════════════════════════════════════════ */

let nextZIndex = 100;

export function useDetachableWindows() {
  const [windows, setWindows] = useState<DetachedWindow[]>([]);

  const addWindow = useCallback((config: Omit<DetachedWindow, 'zIndex'>) => {
    setWindows(prev => {
      if (prev.find(w => w.id === config.id)) return prev;
      return [...prev, { ...config, zIndex: ++nextZIndex }];
    });
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<DetachedWindow>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: ++nextZIndex } : w
    ));
  }, []);

  return { windows, addWindow, updateWindow, closeWindow, focusWindow };
}
