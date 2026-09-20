/**
 * ══════════════════════════════════════════════════════════════════
 *  CHART SKELETON LOADER
 * ══════════════════════════════════════════════════════════════════
 *  Realistic skeleton loader for chart components
 */

import React from 'react';
import { useThemeColors } from '../../app/hooks/useThemeColors';

interface ChartSkeletonProps {
  height?: number;
  showVolume?: boolean;
}

export function ChartSkeleton({ 
  height = 120,
  showVolume = true,
}: ChartSkeletonProps) {
  const c = useThemeColors();

  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{
        background: c.surface,
        border: `1px solid ${c.borderSolid}`,
        height,
      }}
    >
      {/* Shimmer Effect */}
      <div 
        className="absolute inset-0 shimmer"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${c.surface2}40 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />

      {/* Fake Candlesticks */}
      <div className="absolute inset-0 flex items-end justify-around px-3 pb-8 gap-1">
        {Array.from({ length: 24 }).map((_, i) => {
          const isUp = Math.random() > 0.5;
          const heightPct = 30 + Math.random() * 60;
          
          return (
            <div 
              key={i}
              className="flex-1 max-w-[6px] rounded-sm opacity-30"
              style={{
                height: `${heightPct}%`,
                background: isUp ? '#10B981' : '#EF4444',
              }}
            />
          );
        })}
      </div>

      {/* Fake Volume Bars (if enabled) */}
      {showVolume && (
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-3 pb-2 gap-1" 
          style={{ height: '20%' }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const heightPct = 20 + Math.random() * 80;
            const isUp = Math.random() > 0.5;
            
            return (
              <div 
                key={i}
                className="flex-1 max-w-[6px] rounded-sm opacity-20"
                style={{
                  height: `${heightPct}%`,
                  background: isUp ? '#10B981' : '#EF4444',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Loading Text */}
      <div 
        className="absolute top-2 left-2 px-2 py-1 rounded-md"
        style={{
          background: c.surface2,
          color: c.text3,
          fontSize: 10,
          fontWeight: 500,
        }}
      >
        Loading...
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHIMMER ANIMATION (add to global CSS if not exists)
   ═══════════════════════════════════════════════════════════════ */

const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('chart-skeleton-styles')) {
  style.id = 'chart-skeleton-styles';
  document.head.appendChild(style);
}