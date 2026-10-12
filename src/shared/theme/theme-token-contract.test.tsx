import { describe, expect, it } from 'vitest';
import { renderHook, renderWithProviders, screen } from '@/test/test-utils';
import { ALPHA, CRYPTO_COLORS, OPACITY, SEMANTIC_COLORS, withAlpha } from './colors';
import { ICON_CONTAINER, ICON_SIZE, ICON_STROKE } from './icons';
import { VitDurations, VitEasings, durationValue, easingValue, ms, transition } from './motion';
import { VitRadii, VitRadiusAlias, radiusClass, radiusValue } from './radii';
import {
  VitFontWeight,
  VitLineHeight,
  VitTextRoles,
  VitTypeScale,
  fontWeight,
  lineHeight,
  textRoleSize,
  textRoleSpec,
  textRoleStyle,
  textRoleWeight,
  typeSize,
} from './typography';
import { useWebStyles } from './useWebStyles';
import {
  ButtonFontSize,
  ButtonGradients,
  ButtonHeights,
  ButtonPadding,
  ButtonRadius,
  ButtonShadows,
  IconButtonColors,
} from './button';
import { getDensityMetrics, resolveCardPadding } from './density';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING, LINE_HEIGHT } from './legacyTypography';
import * as CoreTheme from './index';
import { ThemeProvider } from './ThemeContext';
import { useTheme } from './useTheme';

describe('shared theme token contracts', () => {
  it('maps every documented color alpha and safely handles custom hex alpha', () => {
    expect(Object.keys(ALPHA)).toEqual(Object.keys(OPACITY));
    for (const [token, suffix] of Object.entries(ALPHA)) {
      expect(withAlpha('var(--tr-primary)', suffix)).toContain(
        ` ${Math.round(OPACITY[token as keyof typeof OPACITY] * 100)}%, transparent)`,
      );
    }
    expect(withAlpha('#000000', 'FF')).toBe('color-mix(in srgb, #000000 100%, transparent)');
    expect(SEMANTIC_COLORS.profit).toBe('success');
    expect(CRYPTO_COLORS.BTC).toBe('#F7931A');
  });

  it('resolves duration and easing tokens with numeric and fallback inputs', () => {
    expect(Object.values(VitDurations)).toEqual([100, 150, 200, 300, 500]);
    expect(durationValue('fast')).toBe(150);
    expect(durationValue(275)).toBe(275);
    expect(durationValue('missing' as keyof typeof VitDurations)).toBe(VitDurations.normal);
    expect(ms('slow')).toBe('300ms');
    expect(easingValue('bounce')).toBe(VitEasings.bounce);
    expect(easingValue('steps(2)')).toBe('steps(2)');
    expect(easingValue(2 as unknown as string)).toBe(VitEasings.standard);
    expect(transition('opacity')).toBe('opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)');
    expect(transition(['color', 'transform'], 125, 'easeOut', 50)).toBe(
      'color 125ms ease-out 50ms, transform 125ms ease-out 50ms',
    );
    expect(transition(['opacity', 'height'], 'fast', 'easeInOut', -1)).toBe(
      'opacity 150ms ease-in-out, height 150ms ease-in-out',
    );
  });

  it('keeps semantic radii, aliases, and class fallbacks consistent', () => {
    expect(radiusValue('card' as keyof typeof VitRadii)).toBe(VitRadii.md);
    expect(radiusValue(7)).toBe(7);
    expect(radiusValue('unknown' as keyof typeof VitRadii)).toBe(VitRadii.md);
    expect(VitRadiusAlias.card).toBe(VitRadii.xl);
    for (const token of Object.keys(VitRadii) as (keyof typeof VitRadii)[]) {
      expect(radiusClass(token)).toMatch(/^rounded/);
    }
    expect(radiusClass('unknown' as keyof typeof VitRadii)).toBe('rounded-lg');
  });

  it('resolves all typography roles and numeric fallbacks', () => {
    expect(typeSize('base')).toBe(VitTypeScale.base);
    expect(typeSize(19)).toBe(19);
    expect(typeSize('missing' as keyof typeof VitTypeScale)).toBe(VitTypeScale.base);
    expect(fontWeight('bold')).toBe(VitFontWeight.bold);
    expect(fontWeight(650)).toBe(650);
    expect(fontWeight('missing' as keyof typeof VitFontWeight)).toBe(VitFontWeight.regular);
    expect(lineHeight('relaxed')).toBe(VitLineHeight.relaxed);
    expect(lineHeight(1.4)).toBe(1.4);
    expect(lineHeight('missing' as keyof typeof VitLineHeight)).toBe(VitLineHeight.normal);
    for (const role of Object.keys(VitTextRoles) as (keyof typeof VitTextRoles)[]) {
      expect(textRoleSpec(role)).toMatchObject(VitTextRoles[role]);
      expect(textRoleStyle(role).fontSize).toBeGreaterThan(0);
      expect(textRoleSize(role)).toBe(textRoleStyle(role).fontSize);
      expect(textRoleWeight(role)).toBe(textRoleStyle(role).fontWeight);
    }
    expect(textRoleSpec('missing' as keyof typeof VitTextRoles)).toMatchObject(VitTextRoles.body);
  });

  it('provides usable semantic desktop style factories', () => {
    function Probe() {
      const styles = useWebStyles();
      return (
        <output data-testid="web-styles">
          {JSON.stringify({
            pageTitle: styles.pageTitle,
            tableCellNum: styles.tableCellNum,
            chipActive: styles.chipActive,
            font: styles.font,
            spacing: styles.spacing,
            icon: styles.icon,
            button: styles.button,
            commandBarHeight: styles.commandBarHeight,
            theme: { primary: styles.c.primary, chipActiveBg: styles.c.chipActiveBg },
          })}
        </output>
      );
    }

    renderWithProviders(<Probe />);
    const styles = JSON.parse(screen.getByTestId('web-styles').textContent ?? '{}') as {
      pageTitle: { fontSize: number; fontWeight: number };
      tableCellNum: { fontSize: number; fontVariantNumeric: string };
      chipActive: { background: string };
      commandBarHeight: number;
      theme: { primary: string; chipActiveBg: string };
    };
    expect(styles.pageTitle).toMatchObject({ fontSize: 22, fontWeight: 700 });
    expect(styles.tableCellNum).toMatchObject({
      fontSize: 13,
      fontVariantNumeric: 'tabular-nums',
    });
    expect(styles.chipActive.background).toBe(styles.theme.chipActiveBg);
    expect(styles.commandBarHeight).toBeGreaterThan(0);
  });

  it('maps every density variant to its contract metrics and padding', () => {
    const densities = ['compact', 'standard', 'relaxed', 'hero', 'tool'] as const;
    for (const density of densities) {
      const metrics = getDensityMetrics(density);
      expect(metrics.controlHeight).toBeGreaterThan(0);
      expect(resolveCardPadding(density, undefined)).toBe(
        `${metrics.cardPaddingY}px ${metrics.cardPaddingX}px`,
      );
    }
    expect(getDensityMetrics()).toEqual(getDensityMetrics('standard'));
    expect(resolveCardPadding(undefined, undefined)).toBeUndefined();
    expect(resolveCardPadding('compact', '3px')).toBe('3px');
  });

  it('exports the canonical button and icon scales through the shared theme barrel', () => {
    expect(Object.keys(ButtonGradients)).toEqual(Object.keys(ButtonShadows));
    expect(Object.keys(ButtonHeights)).toEqual(Object.keys(ButtonPadding));
    expect(Object.keys(ButtonHeights)).toEqual(Object.keys(ButtonRadius));
    expect(Object.keys(ButtonHeights)).toEqual(Object.keys(ButtonFontSize));
    expect(Object.keys(IconButtonColors)).toEqual(['primary', 'success', 'danger', 'warning']);
    expect(ICON_SIZE.sm).toBe(16);
    expect(ICON_STROKE.standard).toBe(2);
    expect(ICON_CONTAINER.base).toBe(36);
    expect(CoreTheme.VitDurations).toBe(VitDurations);
    expect(FONT_SCALE.base).toBe(16);
    expect(FONT_WEIGHT.semibold).toBe(600);
    expect(LINE_HEIGHT.normal).toBe(1.4);
    expect(LETTER_SPACING.wide).toBe(0.5);
  });

  it('exposes the active theme through the hook and rejects use outside its provider', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current).toBeTruthy();
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used inside ThemeProvider',
    );
  });
});
