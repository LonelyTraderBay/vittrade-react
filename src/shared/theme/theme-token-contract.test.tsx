import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
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
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const themeCss = readFileSync(resolve(process.cwd(), 'src/styles/theme.css'), 'utf8');
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const themeRoot = postcss.parse(themeCss);

type CssVariableReference = { name: string; fallback?: string };

function cssVariableReferences(value: string): CssVariableReference[] {
  const references: CssVariableReference[] = [];
  const functionStart = /\bvar\s*\(/gi;

  while (functionStart.exec(value)) {
    let depth = 1;
    let end = functionStart.lastIndex;
    for (; end < value.length && depth > 0; end += 1) {
      if (value[end] === '(') depth += 1;
      if (value[end] === ')') depth -= 1;
    }
    if (depth !== 0) throw new Error(`Unclosed var() in CSS value: ${value}`);

    const body = value.slice(functionStart.lastIndex, end - 1);
    let nestedDepth = 0;
    let comma = -1;
    for (let index = 0; index < body.length; index += 1) {
      if (body[index] === '(') nestedDepth += 1;
      if (body[index] === ')') nestedDepth -= 1;
      if (body[index] === ',' && nestedDepth === 0) {
        comma = index;
        break;
      }
    }

    const name = body.slice(0, comma < 0 ? body.length : comma).trim();
    if (!name.startsWith('--')) throw new Error(`Invalid CSS variable reference: var(${body})`);
    references.push({
      name,
      ...(comma >= 0 ? { fallback: body.slice(comma + 1).trim() } : {}),
    });
    functionStart.lastIndex = end;
  }

  return references;
}

function themeVariables(selector: string) {
  const variables = new Map<string, string>();
  themeRoot.walkRules((rule) => {
    if (rule.selector !== selector) return;
    rule.walkDecls((declaration) => {
      if (declaration.prop.startsWith('--')) {
        variables.set(declaration.prop, declaration.value);
      }
    });
  });
  return variables;
}

function hasVariableCycle(variables: Map<string, string>) {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (name: string): boolean => {
    if (visiting.has(name)) return true;
    if (visited.has(name)) return false;
    visiting.add(name);
    for (const reference of cssVariableReferences(variables.get(name) ?? '')) {
      if (variables.has(reference.name) && visit(reference.name)) return true;
    }
    visiting.delete(name);
    visited.add(name);
    return false;
  };

  return [...variables.keys()].some(visit);
}

function cssValueResolves(
  value: string,
  variables: Map<string, string>,
  stack = new Set<string>(),
): boolean {
  return cssVariableReferences(value).every((reference) => {
    if (variables.has(reference.name)) {
      if (stack.has(reference.name)) return false;
      const nextStack = new Set(stack).add(reference.name);
      return cssValueResolves(variables.get(reference.name) ?? '', variables, nextStack);
    }
    return (
      reference.fallback !== undefined && cssValueResolves(reference.fallback, variables, stack)
    );
  });
}

function themeBlock(selector: string) {
  const match = themeCss.match(new RegExp(`${selector}\\s*\\{([^}]+)\\}`));
  if (!match) throw new Error(`Missing theme block: ${selector}`);
  return match[1];
}

function themeColor(block: string, name: string) {
  const match = block.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6})`, 'i'));
  if (!match) throw new Error(`Missing solid theme color: --${name}`);
  return match[1];
}

function themeGradientStops(block: string, name: string) {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+)`));
  const stops = match?.[1].match(/#[\da-f]{6}/gi);
  if (!stops?.length) throw new Error(`Missing gradient theme stops: --${name}`);
  return stops;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color
      .slice(1)
      .match(/.{2}/g)
      ?.map((channel) => parseInt(channel, 16) / 255);
    if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${color}`);
    const [red, green, blue] = channels.map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

describe('shared theme token contracts', () => {
  it('bootstraps the document with the supported locale and ThemeProvider default', () => {
    const htmlTag = indexHtml.match(/<html\b([^>]*)>/i)?.[1] ?? '';
    expect(htmlTag).toMatch(/\blang=["']vi["']/i);
    expect(htmlTag).toMatch(/\bclass=["']light["']/i);
  });

  it('resolves token aliases without missing references or cycles in every theme', () => {
    const base = themeVariables(':root');
    const inlineThemeValues: string[] = [];
    themeRoot.walkAtRules('theme', (atRule) => {
      if (atRule.params.trim() !== 'inline') return;
      atRule.walkDecls((declaration) => {
        if (declaration.prop.startsWith('--')) inlineThemeValues.push(declaration.value);
      });
    });

    const contexts = [
      { name: 'root', variables: base },
      { name: 'dark', variables: new Map([...base, ...themeVariables('.dark')]) },
      { name: 'light', variables: new Map([...base, ...themeVariables('.light')]) },
    ];

    for (const context of contexts) {
      expect(hasVariableCycle(context.variables), `${context.name} theme has a token cycle`).toBe(
        false,
      );
      for (const [name, value] of context.variables) {
        expect(cssValueResolves(value, context.variables), `${context.name} ${name}`).toBe(true);
      }
      for (const value of inlineThemeValues) {
        expect(cssValueResolves(value, context.variables), `${context.name} @theme inline`).toBe(
          true,
        );
      }
    }

    const colorReferences = Object.values(useThemeColors()).map(
      (value) => value.match(/^var\((--[^),\s]+)\)$/)?.[1],
    );
    expect(colorReferences.length).toBeGreaterThan(0);
    for (const name of colorReferences) {
      expect(name).toBeDefined();
      expect(
        contexts.every(({ variables }) => variables.has(name ?? '')),
        name ?? 'invalid useThemeColors value',
      ).toBe(true);
    }
  });

  it('uses CSS fallbacks for missing aliases and rejects cyclic token graphs', () => {
    const stable = new Map([['--known', '#fff']]);
    expect(cssValueResolves('var(--missing, var(--known))', stable)).toBe(true);
    expect(cssValueResolves('var(--missing)', stable)).toBe(false);

    const cyclic = new Map([
      ['--cycle-a', 'var(--cycle-b)'],
      ['--cycle-b', 'var(--cycle-a)'],
    ]);
    expect(hasVariableCycle(cyclic)).toBe(true);
    expect(cssValueResolves('var(--cycle-a)', cyclic)).toBe(false);
  });

  it('keeps muted portfolio text at WCAG AA contrast across dark and light hero gradients', () => {
    for (const block of [themeBlock(':root'), themeBlock('\\.light')]) {
      const foreground = themeColor(block, 'tr-portfolio-text-muted');
      const backgrounds = themeGradientStops(block, 'tr-portfolio-bg');
      for (const background of backgrounds) {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps the primary state indicator at non-text contrast on page and surface backgrounds', () => {
    for (const block of [themeBlock(':root'), themeBlock('\\.light')]) {
      const foreground = themeColor(block, 'tr-primary');
      for (const backgroundToken of ['tr-bg', 'tr-surface']) {
        const background = themeColor(block, backgroundToken);
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
      }
    }
  });

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
    expect(textRoleStyle('pageTitle')).toEqual({
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1.272,
    });
    expect(textRoleStyle('subtitle')).toEqual({ fontSize: 13, fontWeight: 400, lineHeight: 1.5 });
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
