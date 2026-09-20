/**
 * ══════════════════════════════════════════════════════════════════
 *  CHART THEME CONFIGURATION
 * ══════════════════════════════════════════════════════════════════
 *  Theme-aware color schemes for TradingView charts
 */

import type { DeepPartial, ChartOptions } from 'lightweight-charts';
import { ColorType } from 'lightweight-charts';
import type { ChartTheme, MiniChartConfig } from '../types/chart.types';

/* ═══════════════════════════════════════════════════════════════
   THEME COLOR DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export const CHART_COLORS = {
  green: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    transparent: 'rgba(16, 185, 129, 0.1)',
  },
  red: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    transparent: 'rgba(239, 68, 68, 0.1)',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
  },
  orange: {
    main: '#F0A63A',
    light: '#F5A524',
    dark: '#B96000',
  },
  blue: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
};

/* ═══════════════════════════════════════════════════════════════
   LIGHT THEME
   ═══════════════════════════════════════════════════════════════ */

export function getLightChartTheme(): ChartTheme {
  return {
    background: '#FFFFFF',
    textColor: '#64748B', // slate-500
    lineColor: '#CBD5E1', // slate-300
    gridColor: '#F1F5F9', // slate-100
    candleUpColor: CHART_COLORS.green.main,
    candleDownColor: CHART_COLORS.red.main,
    wickUpColor: CHART_COLORS.green.main,
    wickDownColor: CHART_COLORS.red.main,
    volumeUpColor: 'rgba(16, 185, 129, 0.5)',
    volumeDownColor: 'rgba(239, 68, 68, 0.5)',
  };
}

/* ═══════════════════════════════════════════════════════════════
   DARK THEME
   ═══════════════════════════════════════════════════════════════ */

export function getDarkChartTheme(): ChartTheme {
  return {
    background: '#07090D',
    textColor: '#A7AFBF',
    lineColor: '#2D3440',
    gridColor: '#171C24',
    candleUpColor: CHART_COLORS.green.main,
    candleDownColor: CHART_COLORS.red.main,
    wickUpColor: CHART_COLORS.green.light,
    wickDownColor: CHART_COLORS.red.light,
    volumeUpColor: 'rgba(16, 185, 129, 0.4)',
    volumeDownColor: 'rgba(239, 68, 68, 0.4)',
  };
}

/* ═══════════════════════════════════════════════════════════════
   CHART OPTIONS BUILDER
   ═══════════════════════════════════════════════════════════════ */

export function buildChartOptions(
  theme: ChartTheme,
  width: number,
  height: number,
  showVolume: boolean = true,
): DeepPartial<ChartOptions> {
  return {
    width,
    height,
    layout: {
      background: {
        type: ColorType.Solid,
        color: 'transparent', // Use container background
      },
      textColor: theme.textColor,
      fontSize: 11,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    grid: {
      vertLines: {
        visible: false, // Cleaner look for mini chart
      },
      horzLines: {
        color: theme.gridColor,
        style: 1, // Solid
        visible: true,
      },
    },
    rightPriceScale: {
      visible: true,
      borderVisible: false,
      scaleMargins: {
        top: 0.1,
        bottom: showVolume ? 0.25 : 0.1,
      },
      autoScale: true,
    },
    timeScale: {
      visible: false, // Hide for mini chart
      borderVisible: false,
      timeVisible: false,
      secondsVisible: false,
    },
    crosshair: {
      vertLine: {
        visible: false, // No crosshair for mini chart
        labelVisible: false,
      },
      horzLine: {
        visible: false,
        labelVisible: false,
      },
    },
    handleScroll: false, // Disable scroll for mini chart
    handleScale: false, // Disable zoom
  };
}

/* ═══════════════════════════════════════════════════════════════
   MINI CHART CONFIG BUILDER
   ═══════════════════════════════════════════════════════════════ */

export function buildMiniChartConfig(
  theme: ChartTheme,
  width: number,
  height: number,
  showVolume: boolean = true,
): MiniChartConfig {
  return {
    width,
    height,
    theme,
    candlestickOptions: {
      upColor: theme.candleUpColor,
      downColor: theme.candleDownColor,
      borderUpColor: theme.candleUpColor,
      borderDownColor: theme.candleDownColor,
      wickUpColor: theme.wickUpColor,
      wickDownColor: theme.wickDownColor,
      borderVisible: true,
      wickVisible: true,
    },
    volumeOptions: {
      color: theme.volumeUpColor,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Separate Y-axis
      // Note: scaleMargins for the volume overlay are applied by consumers
      // via series.priceScale().applyOptions() — not part of series options in v5.
    },
    priceLineOptions: {
      color: theme.candleUpColor,
      lineWidth: 1,
      lineStyle: 2, // Dashed
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: false,
    },
    chartOptions: buildChartOptions(theme, width, height, showVolume),
  };
}

/* ═══════════════════════════════════════════════════════════════
   GRADIENT BACKGROUNDS
   ═══════════════════════════════════════════════════════════════ */

export const CHART_GRADIENTS = {
  bullish: {
    light: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 100%)',
    dark: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 100%)',
  },
  bearish: {
    light: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0) 100%)',
    dark: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0) 100%)',
  },
  neutral: {
    light: 'linear-gradient(180deg, rgba(100, 116, 139, 0.03) 0%, rgba(100, 116, 139, 0) 100%)',
    dark: 'linear-gradient(180deg, rgba(148, 163, 184, 0.05) 0%, rgba(148, 163, 184, 0) 100%)',
  },
};

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get gradient based on price trend
 */
export function getChartGradient(isPositive: boolean, isDarkMode: boolean = false): string {
  if (isPositive) {
    return isDarkMode ? CHART_GRADIENTS.bullish.dark : CHART_GRADIENTS.bullish.light;
  } else {
    return isDarkMode ? CHART_GRADIENTS.bearish.dark : CHART_GRADIENTS.bearish.light;
  }
}

/**
 * Get theme based on current app theme
 */
export function getChartTheme(isDarkMode: boolean = false): ChartTheme {
  return isDarkMode ? getDarkChartTheme() : getLightChartTheme();
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
   ═══════════════════════════════════════════════════════════════ */

export const CHART_BREAKPOINTS = {
  xs: 360, // iPhone SE
  sm: 375, // iPhone 12/13 mini
  md: 390, // iPhone 12/13/14
  lg: 414, // iPhone 12/13 Pro Max
  xl: 428, // iPhone 14 Pro Max
} as const;

/**
 * Get optimal chart height based on viewport width
 */
export function getResponsiveChartHeight(viewportWidth: number): number {
  if (viewportWidth < CHART_BREAKPOINTS.sm) {
    return 100; // Smaller devices
  } else if (viewportWidth < CHART_BREAKPOINTS.lg) {
    return 120; // Standard (default)
  } else {
    return 140; // Larger devices
  }
}
