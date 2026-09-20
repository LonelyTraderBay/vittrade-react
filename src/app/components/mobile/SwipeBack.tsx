import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';

interface SwipeBackProps {
  children: React.ReactNode;
  /** Disable swipe-back (e.g. on home screen) */
  disabled?: boolean;
  /** Threshold to trigger back (px) */
  threshold?: number;
}

/**
 * Enterprise Fintech — Swipe-to-Go-Back Gesture
 * Swipe từ cạnh trái → phải để navigate(-1)
 * Giống iOS native back gesture
 * Chỉ active khi touch bắt đầu từ 12px bên trái (tránh trùng nút back ở px-5)
 *
 * CRITICAL: Uses activated ref to prevent unnecessary setState on simple taps.
 */
export function SwipeBack({ children, disabled = false, threshold = 80 }: SwipeBackProps) {
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const isTracking = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  /** true once user has confirmed horizontal swipe past dead zone */
  const activated = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    // Chỉ track khi bắt đầu từ edge trái (12px) — tránh trùng nút back (starts at px-5 = 20px)
    if (touch.clientX > 12) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isTracking.current = true;
    isHorizontal.current = null;
    activated.current = false;
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
        if (!isHorizontal.current) {
          isTracking.current = false;
          return;
        }
        activated.current = true;
      } else {
        return;
      }
    }

    if (deltaX < 0) {
      if (activated.current) setSwipeX(0);
      return;
    }

    setSwipeX(deltaX);
    setIsSwiping(true);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isTracking.current) return;
    isTracking.current = false;
    isHorizontal.current = null;

    // If we never activated (no significant movement), skip setState entirely.
    // This prevents re-renders during simple taps that started near the edge.
    if (!activated.current) {
      activated.current = false;
      return;
    }
    activated.current = false;

    if (swipeX >= threshold) {
      navigate(-1);
    }

    setSwipeX(0);
    setIsSwiping(false);
  }, [swipeX, threshold, navigate]);

  const progress = Math.min(swipeX / threshold, 1);

  return (
    <div
      className="relative w-full min-h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Edge indicator — hiện khi đang swipe */}
      {isSwiping && (
        <div className="contents">
          {/* Back arrow indicator */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `rgba(59,130,246,${0.1 + progress * 0.2})`,
              border: `1.5px solid rgba(59,130,246,${0.2 + progress * 0.4})`,
              transform: `translate(${Math.min(swipeX * 0.3, 24)}px, -50%) scale(${0.6 + progress * 0.4})`,
              transition: 'transform 0.05s ease',
              opacity: progress,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Shadow overlay */}
          <div
            className="absolute inset-0 z-40 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, rgba(0,0,0,${progress * 0.15}) 0%, transparent 30%)`,
            }}
          />
        </div>
      )}

      {/* Content with slight transform when swiping */}
      <div
        style={{
          transform: isSwiping ? `translateX(${swipeX * 0.15}px)` : 'none',
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
