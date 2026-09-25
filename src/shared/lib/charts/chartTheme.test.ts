import { describe, expect, it } from 'vitest';
import {
  buildChartOptions,
  buildMiniChartConfig,
  CHART_BREAKPOINTS,
  CHART_COLORS,
  CHART_GRADIENTS,
  getChartGradient,
  getChartTheme,
  getDarkChartTheme,
  getLightChartTheme,
  getResponsiveChartHeight,
} from './chartTheme';

describe('chart theme utilities', () => {
  it('provides matching light and dark chart palettes', () => {
    const light = getLightChartTheme();
    const dark = getDarkChartTheme();

    expect(light).toMatchObject({
      background: '#FFFFFF',
      textColor: '#64748B',
      lineColor: '#CBD5E1',
      candleUpColor: CHART_COLORS.green.main,
      candleDownColor: CHART_COLORS.red.main,
    });
    expect(dark).toMatchObject({
      background: '#07090D',
      textColor: '#A7AFBF',
      lineColor: '#2D3440',
      candleUpColor: CHART_COLORS.green.main,
      candleDownColor: CHART_COLORS.red.main,
      wickUpColor: CHART_COLORS.green.light,
      wickDownColor: CHART_COLORS.red.light,
    });
    expect(getChartTheme()).toEqual(light);
    expect(getChartTheme(true)).toEqual(dark);
  });

  it('selects trend gradients by direction and display theme', () => {
    expect(getChartGradient(true)).toBe(CHART_GRADIENTS.bullish.light);
    expect(getChartGradient(true, true)).toBe(CHART_GRADIENTS.bullish.dark);
    expect(getChartGradient(false)).toBe(CHART_GRADIENTS.bearish.light);
    expect(getChartGradient(false, true)).toBe(CHART_GRADIENTS.bearish.dark);
  });

  it('builds chart options with and without volume space', () => {
    const theme = getLightChartTheme();
    const withVolume = buildChartOptions(theme, 320, 180);
    const withoutVolume = buildChartOptions(theme, 640, 360, false);

    expect(withVolume).toMatchObject({
      width: 320,
      height: 180,
      layout: { background: { color: 'transparent' }, textColor: theme.textColor },
      grid: { horzLines: { color: theme.gridColor, visible: true } },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { visible: false, timeVisible: false, secondsVisible: false },
      handleScroll: false,
      handleScale: false,
    });
    expect(withoutVolume.rightPriceScale?.scaleMargins?.bottom).toBe(0.1);
  });

  it('builds mini chart series options from the selected palette', () => {
    const theme = getDarkChartTheme();
    const config = buildMiniChartConfig(theme, 240, 120, false);

    expect(config).toMatchObject({
      width: 240,
      height: 120,
      theme,
      candlestickOptions: {
        upColor: theme.candleUpColor,
        downColor: theme.candleDownColor,
        wickUpColor: theme.wickUpColor,
        wickDownColor: theme.wickDownColor,
        borderVisible: true,
        wickVisible: true,
      },
      volumeOptions: {
        color: theme.volumeUpColor,
        priceScaleId: '',
        priceFormat: { type: 'volume' },
      },
      priceLineOptions: { color: theme.candleUpColor, lineWidth: 1, priceLineVisible: false },
    });
    expect(config.chartOptions.rightPriceScale?.scaleMargins?.bottom).toBe(0.1);
  });

  it('chooses responsive chart heights at each breakpoint boundary', () => {
    expect(CHART_BREAKPOINTS).toMatchObject({ xs: 360, sm: 375, md: 390, lg: 414, xl: 428 });
    expect(getResponsiveChartHeight(374)).toBe(100);
    expect(getResponsiveChartHeight(375)).toBe(120);
    expect(getResponsiveChartHeight(413)).toBe(120);
    expect(getResponsiveChartHeight(414)).toBe(140);
  });
});
