import React, { useState, useEffect } from 'react';
import { DEVICE } from './device-layout';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * ══════════════════════════════════════════════════════════
 *  STATUS BAR — iPhone 16 Pro Max / iOS 18
 * ══════════════════════════════════════════════════════════
 *
 *  Total safe area top: 59pt
 *  Dynamic Island: 11pt margin + 37pt pill = 48pt
 *  Remaining: 11pt below DI for status icons
 *  Time sits LEFT of DI, icons sit RIGHT of DI
 *  Real iOS renders them at y ≈ 18pt from top
 *
 *  Font: SF Pro Display, weight 600, 15px
 *  Icons: cellular 4-bar, WiFi, battery with percentage
 */

export function StatusBar() {
  const c = useThemeColors();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-end justify-between select-none pointer-events-none z-40 shrink-0"
      style={{
        height: DEVICE.STATUS_BAR,
        paddingLeft: 32,
        paddingRight: 28,
        paddingBottom: 4,
        color: c.statusBarText,
        transition: 'color var(--tr-duration-slow) ease',
      }}
    >
      {/* Time — left side, aligned with DI center height */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.2,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}
      >
        {time}
      </span>

      {/* Right icons — cellular + wifi + battery */}
      <div className="flex items-center" style={{ gap: 6 }}>
        {/* Cellular signal — 4 bars, last one dim */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="9" width="3" height="3" rx="0.75" fill={c.statusBarIcon} />
          <rect x="4.5" y="6" width="3" height="6" rx="0.75" fill={c.statusBarIcon} />
          <rect x="9" y="3" width="3" height="9" rx="0.75" fill={c.statusBarIcon} />
          <rect x="13.5" y="0" width="3" height="12" rx="0.75" fill={c.statusBarIconDim} />
        </svg>

        {/* WiFi icon — 3-arc style matching iOS 18 */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path
            d="M8 10.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"
            fill={c.statusBarIcon}
            transform="translate(0,-1.5)"
          />
          <path
            d="M5.17 9.17a4 4 0 0 1 5.66 0"
            stroke={c.statusBarIcon}
            strokeWidth="1.3"
            strokeLinecap="round"
            transform="translate(0,-1.5)"
          />
          <path
            d="M2.64 6.64a7.07 7.07 0 0 1 10.72 0"
            stroke={c.statusBarIcon}
            strokeWidth="1.3"
            strokeLinecap="round"
            transform="translate(0,-1.5)"
          />
          <path
            d="M0.4 4.1a10.2 10.2 0 0 1 15.2 0"
            stroke={c.statusBarIconDim}
            strokeWidth="1.3"
            strokeLinecap="round"
            transform="translate(0,-1.5)"
          />
        </svg>

        {/* Battery — iOS 18 style */}
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3.5"
            stroke={c.statusBarIconDim}
            strokeWidth="1"
          />
          <rect x="2" y="2" width="17" height="9" rx="2" fill={c.statusBarBattery} />
          <path d="M24 4.5v4a2.5 2.5 0 0 0 0-4z" fill={c.statusBarIconDim} />
        </svg>
      </div>
    </div>
  );
}
