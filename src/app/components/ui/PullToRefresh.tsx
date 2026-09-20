import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

/**
 * ══════════════════════════════════════════════════════════
 *  PullToRefresh — Mobile Pull-to-Refresh Gesture Component
 * ══════════════════════════════════════════════════════════
 *  Wraps scrollable content. When user pulls down from top,
 *  shows a spinning indicator and triggers onRefresh callback.
 *
 *  CRITICAL FIX: Dead zone + skip-setState-on-tap pattern prevents
 *  re-renders during simple taps, which previously caused click events
 *  to be swallowed (back button "needs 2 clicks" bug).
 */

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  lastRefreshedLabel?: string;
  refreshCount?: number;
}

const INDICATOR_HEIGHT = 48;

/** Find nearest scrollable ancestor for scrollTop checks */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  const scrollEl = el.closest('[data-pull-scroll]') as HTMLElement | null;
  if (scrollEl) return scrollEl;
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 64,
  className = '',
  style,
  lastRefreshedLabel,
  refreshCount,
}: PullToRefreshProps) {
  const c = useThemeColors();
  const { hapticLight } = useHaptic();
  const actionToast = useActionToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  /** true once user has moved past the dead zone (10px vertical) */
  const activated = useRef(false);
  const prevPhaseRef = useRef<'idle' | 'pulling' | 'triggered' | 'refreshing'>('idle');

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'pulling' | 'triggered' | 'refreshing'>('idle');

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const el = containerRef.current;
    if (!el) return;
    const scrollEl = getScrollParent(el) || el;
    if (scrollEl.scrollTop > 5) return;

    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isPulling.current = true;
    activated.current = false;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const el = containerRef.current;
    if (!el) return;
    const scrollEl = getScrollParent(el) || el;
    if (scrollEl.scrollTop > 5) {
      isPulling.current = false;
      activated.current = false;
      // Only reset state if we actually started pulling (skip for taps)
      if (activated.current) {
        setPullDistance(0);
        setPhase('idle');
      }
      return;
    }

    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;

    // Dead zone: require 10px vertical movement before any state changes.
    // This prevents re-renders during simple taps/clicks on buttons (back button fix).
    if (!activated.current) {
      if (Math.abs(delta) < 10) return;
      activated.current = true;
    }

    if (delta <= 0) {
      if (activated.current) {
        setPullDistance(0);
        setPhase('idle');
      }
      return;
    }

    // Rubber-band damping
    const dampened = Math.min(delta * 0.45, threshold * 1.8);
    setPullDistance(dampened);
    const nextPhase = dampened >= threshold ? 'triggered' : 'pulling';
    if (nextPhase === 'triggered' && prevPhaseRef.current !== 'triggered') {
      hapticLight();
    }
    prevPhaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    // If we never passed the dead zone (simple tap), skip setState entirely.
    // This is critical: unnecessary setState during tap → re-render → browser swallows click event.
    if (!activated.current) {
      activated.current = false;
      return;
    }
    activated.current = false;

    if (phase === 'triggered' && !isRefreshing) {
      setPhase('refreshing');
      setIsRefreshing(true);
      setPullDistance(INDICATOR_HEIGHT);
      hapticLight();

      let success = true;
      try {
        await onRefresh();
      } catch {
        success = false;
      }

      await new Promise(r => setTimeout(r, 300));
      setIsRefreshing(false);
      setPullDistance(0);
      setPhase('idle');

      if (success) {
        actionToast.success(TOAST.REFRESH.SUCCESS, { haptic: 'success' });
      } else {
        actionToast.error(TOAST.REFRESH.ERROR);
      }
    } else {
      setPullDistance(0);
      setPhase('idle');
    }
  }, [phase, isRefreshing, onRefresh]);

  // Rotation angle based on pull progress
  const rotation = Math.min(pullDistance / threshold, 1) * 360;
  const indicatorOpacity = Math.min(pullDistance / (threshold * 0.5), 1);
  const indicatorScale = 0.5 + Math.min(pullDistance / threshold, 1) * 0.5;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative flex-1 ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance,
          transition: isPulling.current ? 'none' : 'height var(--tr-duration-slow) cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{
            opacity: indicatorOpacity,
            transform: `scale(${indicatorScale})`,
            transition: isPulling.current ? 'none' : 'all var(--tr-duration-slow) ease',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                transform: `rotate(${phase === 'refreshing' ? 0 : rotation}deg)`,
                animation: phase === 'refreshing' ? 'ptr-spin 0.7s linear infinite' : 'none',
              }}
            >
              <RefreshCw
                size={18}
                color={phase === 'triggered' || phase === 'refreshing' ? '#3B82F6' : c.text3}
                strokeWidth={2.5}
              />
            </div>
            <span
              style={{
                color: phase === 'triggered' || phase === 'refreshing' ? '#3B82F6' : c.text3,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {phase === 'refreshing'
                ? 'Đang tải...'
                : phase === 'triggered'
                  ? 'Thả để làm mới'
                  : 'Kéo xuống để làm mới'}
            </span>
            {refreshCount !== undefined && refreshCount > 0 && (
              <span
                className="rounded-full flex items-center justify-center"
                style={{
                  color: '#3B82F6',
                  fontSize: 9,
                  fontWeight: 700,
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                }}
              >
                {refreshCount}
              </span>
            )}
          </div>
          {lastRefreshedLabel && phase !== 'refreshing' && (
            <span
              style={{
                color: c.text3,
                fontSize: 9,
                fontWeight: 400,
              }}
            >
              Cập nhật: {lastRefreshedLabel}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {children}

      {/* Top progress bar — visible during refreshing */}
      {phase === 'refreshing' && (
        <div
          className="absolute top-0 left-0 right-0 overflow-hidden"
          style={{ height: 2, zIndex: 50 }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #3B82F6 40%, #60A5FA 60%, transparent)',
              borderRadius: 1,
              animation: 'ptr-progress 1s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ptr-progress {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
