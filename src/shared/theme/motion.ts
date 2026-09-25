/**
 * ═══════════════════════════════════════════════════════════
 *  Motion Tokens — VitTrade Flutter canonical timing
 * ═══════════════════════════════════════════════════════════
 *
 *  Durations (ms): instant 100, fast 150, normal 200, slow 300, slower 500
 *  Easings: standard, decelerate, accelerate, bounce
 */

export const VitDurations = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export type VitDuration = keyof typeof VitDurations;

export const VitEasings = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

export type VitEasing = keyof typeof VitEasings;

export function durationValue(token: VitDuration | number): number {
  if (typeof token === 'number') return token;
  return VitDurations[token] ?? VitDurations.normal;
}

export function ms(token: VitDuration | number): string {
  return `${durationValue(token)}ms`;
}

export function easingValue(token: VitEasing | string): string {
  if (typeof token !== 'string') return VitEasings.standard;
  return VitEasings[token as VitEasing] ?? token;
}

export function transition(
  properties: string | string[],
  durationToken: VitDuration | number = 'normal',
  easingToken: VitEasing | string = 'standard',
  delay = 0,
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  const dur = ms(durationToken);
  const ease = easingValue(easingToken);
  const delayStr = delay > 0 ? ` ${delay}ms` : '';
  return props.map((p) => `${p} ${dur} ${ease}${delayStr}`).join(', ');
}
