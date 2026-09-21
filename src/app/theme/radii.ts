/**
 * ═══════════════════════════════════════════════════════════
 *  Radius Tokens — VitTrade Flutter canonical scale
 * ═══════════════════════════════════════════════════════════
 *
 *  VitTrade radius scale (dp): 2, 4, 8, 14, 16, 21, 24, 999
 *  Use semantic names instead of raw numbers.
 */

export const VitRadii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 14,
  xl: 16,
  '2xl': 21,
  '3xl': 24,
  full: 999,
} as const;

export type VitRadius = keyof typeof VitRadii;

/** Alias cho component mapping — giữ đúng semantic với VitTrade */
export const VitRadiusAlias = {
  input: VitRadii.lg, // 14px — inputs, CTAs, toasts
  cta: VitRadii.lg, // 14px — primary action buttons
  card: VitRadii.xl, // 16px — standard cards
  cardLg: VitRadii['3xl'], // 24px — hero/featured cards
  chip: VitRadii.md, // 8px — chips, badges, small buttons
  avatar: VitRadii.full, // 999px — circular avatars
  sheet: VitRadii['2xl'], // 21px — bottom sheets, dialogs
  pill: VitRadii.full, // 999px — pill-shaped containers
} as const;

export function radiusValue(token: VitRadius | number): number {
  if (typeof token === 'number') return token;
  return VitRadii[token] ?? VitRadii.md;
}

export function radiusClass(token: VitRadius): string {
  const map: Record<VitRadius, string> = {
    none: 'rounded-none',
    xs: 'rounded-[2px]',
    sm: 'rounded-sm',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-[21px]',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };
  return map[token] ?? 'rounded-lg';
}
