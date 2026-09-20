import type { CSSProperties } from 'react';

/**
 * ═══════════════════════════════════════════════════════════
 *  Typography Tokens — VitTrade Flutter text roles
 * ═══════════════════════════════════════════════════════════
 *
 *  Text roles abstract raw font sizes so components use semantic
 *  names (caption, body, sectionTitle…) instead of hardcoded px.
 *
 *  Underlying scale remains φ-based for consistency with existing
 *  design system; roles map to the scale canonically.
 */

export const VitTypeScale = {
  '2xs': 10,
  xs: 12,
  sm: 13,
  base: 14,
  md: 16,
  lg: 18,
  xl: 21,
  '2xl': 26,
  '3xl': 34,
  '4xl': 43,
  '5xl': 55,
} as const;

export type VitTypeSize = keyof typeof VitTypeScale;

export const VitFontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export type VitFontWeight = keyof typeof VitFontWeight;

export const VitLineHeight = {
  tight: 1.272,
  normal: 1.5,
  relaxed: 1.618,
} as const;

export type VitLineHeight = keyof typeof VitLineHeight;

export interface TextRoleSpec {
  size: VitTypeSize;
  weight: VitFontWeight;
  lineHeight: VitLineHeight;
}

export const VitTextRoles = {
  overline: { size: '2xs', weight: 'semibold', lineHeight: 'tight' },
  caption: { size: 'xs', weight: 'regular', lineHeight: 'normal' },
  captionMedium: { size: 'xs', weight: 'medium', lineHeight: 'normal' },
  body: { size: 'base', weight: 'regular', lineHeight: 'normal' },
  bodyMedium: { size: 'base', weight: 'medium', lineHeight: 'normal' },
  button: { size: 'sm', weight: 'semibold', lineHeight: 'normal' },
  label: { size: 'sm', weight: 'medium', lineHeight: 'normal' },
  sectionLabel: { size: 'base', weight: 'bold', lineHeight: 'tight' },
  sectionTitle: { size: 'md', weight: 'semibold', lineHeight: 'tight' },
  headline: { size: 'xl', weight: 'bold', lineHeight: 'tight' },
  amountBase: { size: 'md', weight: 'bold', lineHeight: 'tight' },
  amountLarge: { size: '2xl', weight: 'bold', lineHeight: 'tight' },
  amountXl: { size: '3xl', weight: 'bold', lineHeight: 'tight' },
  display: { size: '4xl', weight: 'bold', lineHeight: 'relaxed' },
  jumbo: { size: '5xl', weight: 'bold', lineHeight: 'relaxed' },
} as const satisfies Record<string, TextRoleSpec>;

export type VitTextRole = keyof typeof VitTextRoles;

export function typeSize(token: VitTypeSize | number): number {
  if (typeof token === 'number') return token;
  return VitTypeScale[token] ?? VitTypeScale.base;
}

export function fontWeight(token: VitFontWeight | number): number {
  if (typeof token === 'number') return token;
  return VitFontWeight[token] ?? VitFontWeight.regular;
}

export function lineHeight(token: VitLineHeight | number): number {
  if (typeof token === 'number') return token;
  return VitLineHeight[token] ?? VitLineHeight.normal;
}

export function textRoleSpec(role: VitTextRole): Required<TextRoleSpec> {
  const spec = VitTextRoles[role] ?? VitTextRoles.body;
  return {
    size: spec.size,
    weight: spec.weight,
    lineHeight: spec.lineHeight,
  };
}

export function textRoleStyle(role: VitTextRole): CSSProperties {
  const spec = textRoleSpec(role);
  return {
    fontSize: typeSize(spec.size),
    fontWeight: fontWeight(spec.weight),
    lineHeight: lineHeight(spec.lineHeight),
  };
}

/** Convenience: lấy font-size từ text role */
export function textRoleSize(role: VitTextRole): number {
  return textRoleStyle(role).fontSize as number;
}

/** Convenience: lấy font-weight từ text role */
export function textRoleWeight(role: VitTextRole): number {
  return textRoleStyle(role).fontWeight as number;
}

/* Re-export để component có thể dùng trực tiếp */
export { VitTextRoles as textRoles };
