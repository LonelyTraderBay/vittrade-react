/**
 * ChartGradientDefs — Shared gradient definitions for Recharts charts
 *
 * Eliminates duplicate `<defs>` boilerplate across 50+ chart files.
 * MUST always include `key="gradient-defs"` to avoid Recharts internal
 * `<defs>` key collision (clipPath defs use key=null by default).
 *
 * @module components/charts/ChartGradientDefs
 * @version 1.0
 *
 * Usage:
 * ```tsx
 * <AreaChart data={data}>
 *   <ChartGradientDefs
 *     gradients={[
 *       { id: 'fillGreen', color: '#10B981' },
 *       { id: 'fillBlue', color: '#3B82F6', opacityFrom: 0.4 },
 *     ]}
 *   />
 *   <Area fill="url(#fillGreen)" ... />
 * </AreaChart>
 * ```
 */

import React from 'react';

export interface GradientConfig {
  /** Unique SVG gradient id — referenced via `fill="url(#id)"` */
  id: string;
  /** Gradient color (hex, rgb, hsl) */
  color: string;
  /** Top opacity (default 0.3) */
  opacityFrom?: number;
  /** Bottom opacity (default 0) */
  opacityTo?: number;
  /** Direction — vertical (default) or horizontal */
  direction?: 'vertical' | 'horizontal';
}

interface ChartGradientDefsProps {
  gradients: GradientConfig[];
}

/**
 * Drop-in Recharts child that renders `<defs>` with proper key.
 *
 * IMPORTANT: This component renders as a direct child of a Recharts
 * chart (AreaChart, LineChart, ComposedChart, etc). Recharts' internal
 * `renderByOrder()` clones children preserving their `key` prop.
 * We set `key="gradient-defs"` to avoid collision with Recharts'
 * internal `<defs>` that uses `key=null` for clipPath.
 */
export function ChartGradientDefs({ gradients }: ChartGradientDefsProps) {
  return (
    <defs key="gradient-defs">
      {gradients.map((g) => {
        const isHorizontal = g.direction === 'horizontal';
        return (
          <linearGradient
            key={g.id}
            id={g.id}
            x1="0"
            y1="0"
            x2={isHorizontal ? '1' : '0'}
            y2={isHorizontal ? '0' : '1'}
          >
            <stop
              offset="0%"
              stopColor={g.color}
              stopOpacity={g.opacityFrom ?? 0.3}
            />
            <stop
              offset="100%"
              stopColor={g.color}
              stopOpacity={g.opacityTo ?? 0}
            />
          </linearGradient>
        );
      })}
    </defs>
  );
}

/**
 * Pre-built gradient presets for common chart colors
 */
export const CHART_GRADIENTS = {
  green: (id = 'gradientGreen'): GradientConfig => ({
    id,
    color: '#10B981',
  }),
  red: (id = 'gradientRed'): GradientConfig => ({
    id,
    color: '#EF4444',
  }),
  blue: (id = 'gradientBlue'): GradientConfig => ({
    id,
    color: '#3B82F6',
  }),
  purple: (id = 'gradientPurple'): GradientConfig => ({
    id,
    color: '#8B5CF6',
  }),
  amber: (id = 'gradientAmber'): GradientConfig => ({
    id,
    color: '#F59E0B',
  }),
  cyan: (id = 'gradientCyan'): GradientConfig => ({
    id,
    color: '#06B6D4',
  }),
} as const;
