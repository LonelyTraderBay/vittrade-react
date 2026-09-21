import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * ══════════════════════════════════════════════════════════
 *  MOBILE FRAME — iPhone 16 Pro Max Enterprise Standard
 * ══════════════════════════════════════════════════════════
 *
 *  Logical resolution: 440 × 956 pt (3x retina)
 *  Dynamic Island:     126 × 37 pt, 11pt from top
 *  Corner radius:      55 pt (device housing)
 *  Home indicator:     20 pt bottom safe area (Figma Make optimized)
 *  Status bar:         59 pt (top safe area)
 *  Tab bar:            52 pt (content area)
 *  Total bottom:       72 pt (tab + home indicator)
 *  Content area:       825 pt (956 - 59 - 72)
 *
 *  Frame design: Natural Titanium finish with subtle
 *  depth layers matching real device aesthetics
 */

// ── iPhone 16 Pro Max Constants ──
const DEVICE = {
  WIDTH: 440,
  HEIGHT: 956,
  STATUS_BAR: 59,
  TAB_BAR: 52,
  HOME_INDICATOR: 20,
  BOTTOM_CHROME: 72, // TAB_BAR + HOME_INDICATOR
  CONTENT_AREA: 825, // HEIGHT - STATUS_BAR - BOTTOM_CHROME
  DYNAMIC_ISLAND: { width: 126, height: 37, top: 11, radius: 22 },
  HOME_BAR: { width: 134, height: 5, radius: 3, bottomPad: 8 },
} as const;

export { DEVICE };

interface MobileFrameProps {
  children: React.ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  const c = useThemeColors();
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: c.frameOuter,
        overscrollBehavior: 'none',
      }}
    >
      {/* iPhone 16 Pro Max Frame — fixed 440 × 956 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: DEVICE.WIDTH,
          height: DEVICE.HEIGHT,
          maxHeight: '100dvh',
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          overscrollBehavior: 'contain',
          touchAction: 'manipulation',
          background: c.frameBg,
          transition: 'background var(--tr-duration-slow) ease',
        }}
      >
        {/* ─── Dynamic Island ─── */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
          style={{
            width: DEVICE.DYNAMIC_ISLAND.width,
            height: DEVICE.DYNAMIC_ISLAND.height,
            marginTop: DEVICE.DYNAMIC_ISLAND.top,
            borderRadius: DEVICE.DYNAMIC_ISLAND.radius,
            background: c.diBackground,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 2px rgba(0,0,0,0.8)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* Front camera lens with realistic glass effect */}
          <div
            className="absolute rounded-full"
            style={{
              width: 12,
              height: 12,
              right: 18,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle at 35% 35%, #1a2540 0%, #0a0e1a 60%, #000 100%)',
              boxShadow: 'inset 0 0 3px rgba(59,130,246,0.15), 0 0 2px rgba(0,0,0,0.8)',
            }}
          >
            {/* Lens reflection dot */}
            <div
              className="absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                top: 2,
                left: 3,
                background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent)',
              }}
            />
          </div>

          {/* Infrared sensor (subtle) */}
          <div
            className="absolute rounded-full"
            style={{
              width: 5,
              height: 5,
              left: 22,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#0a0a0a',
              boxShadow: 'inset 0 0 2px rgba(100,50,50,0.1)',
            }}
          />
        </div>

        {children}

        {/* ─── Home Indicator ─── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{ paddingBottom: DEVICE.HOME_BAR.bottomPad }}
        >
          <div
            style={{
              width: DEVICE.HOME_BAR.width,
              height: DEVICE.HOME_BAR.height,
              borderRadius: DEVICE.HOME_BAR.radius,
              background: c.homeBar,
            }}
          />
        </div>
      </div>
    </div>
  );
}
