/**
 * ══════════════════════════════════════════════════════════════════
 *  TIMEFRAME SELECTOR
 * ══════════════════════════════════════════════════════════════════
 *  Compact timeframe switcher for charts
 */

import React from 'react';
import { useThemeColors } from '../../app/hooks/useThemeColors';
import { useHaptic } from '../../app/hooks/useHaptic';
import type { Timeframe } from '../../utils/chartDataGenerator';
export { type Timeframe };

interface TimeframeSelectorProps {
  active: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  compact?: boolean;
}

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
];

export function TimeframeSelector({
  active,
  onChange,
  compact = false,
}: TimeframeSelectorProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div 
      className="inline-flex rounded-lg overflow-hidden"
      style={{
        background: c.surface2,
        border: `1px solid ${c.borderSolid}`,
        padding: 2,
        gap: 2,
      }}
    >
      {TIMEFRAMES.map(({ id, label }) => {
        const isActive = id === active;
        
        return (
          <button
            key={id}
            onClick={() => {
              onChange(id);
              hapticSelection();
            }}
            className="transition-all duration-150"
            style={{
              padding: compact ? '4px 8px' : '6px 12px',
              borderRadius: 6,
              background: isActive ? c.surface : 'transparent',
              color: isActive ? c.text1 : c.text3,
              fontSize: compact ? 10 : 11,
              fontWeight: isActive ? 700 : 600,
              border: isActive ? `1px solid ${c.borderSolid}` : '1px solid transparent',
              minWidth: compact ? 32 : 40,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Minimal pill variant (for mini chart)
 */
export function TimeframePills({
  active,
  onChange,
}: TimeframeSelectorProps) {
  const c = useThemeColors();

  // Show only key timeframes for mini chart
  const miniTimeframes: Timeframe[] = ['1h', '1d', '1w'];

  return (
    <div className="inline-flex gap-1">
      {miniTimeframes.map((tf) => {
        const isActive = tf === active;
        
        return (
          <button
            key={tf}
            onClick={() => onChange(tf)}
            className="transition-all duration-150"
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: isActive 
                ? 'rgba(16, 185, 129, 0.15)' 
                : c.surface2 + '80',
              color: isActive ? '#10B981' : c.text3,
              fontSize: 9,
              fontWeight: 700,
              border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`,
            }}
          >
            {tf.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}