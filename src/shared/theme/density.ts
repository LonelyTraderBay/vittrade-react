/**
 * ══════════════════════════════════════════════════════════
 *  Density Tokens — VitTrade Flutter inspired
 * ══════════════════════════════════════════════════════════
 *
 *  Cross-component density scale used for card padding,
 *  control heights, and vertical rhythm. Phone-first values
 *  mirror VitTrade's `VitDensity` enum.
 */

export type VitDensity = 'compact' | 'standard' | 'relaxed' | 'hero' | 'tool';

export interface DensityMetrics {
  controlHeight: number;
  cardPaddingX: number;
  cardPaddingY: number;
  verticalSpace: number;
}

const DENSITY_MAP: Record<VitDensity, DensityMetrics> = {
  compact: {
    controlHeight: 44,
    cardPaddingX: 12,
    cardPaddingY: 12,
    verticalSpace: 8,
  },
  standard: {
    controlHeight: 52,
    cardPaddingX: 16,
    cardPaddingY: 16,
    verticalSpace: 13,
  },
  relaxed: {
    controlHeight: 58,
    cardPaddingX: 24,
    cardPaddingY: 24,
    verticalSpace: 21,
  },
  hero: {
    controlHeight: 58,
    cardPaddingX: 20,
    cardPaddingY: 24,
    verticalSpace: 21,
  },
  tool: {
    controlHeight: 44,
    cardPaddingX: 12,
    cardPaddingY: 8,
    verticalSpace: 8,
  },
};

export function getDensityMetrics(density: VitDensity = 'standard'): DensityMetrics {
  return DENSITY_MAP[density];
}

export function resolveCardPadding(
  density: VitDensity | undefined,
  customPadding: React.CSSProperties['padding'] | undefined,
): React.CSSProperties['padding'] {
  if (customPadding !== undefined) return customPadding;
  if (!density) return undefined;
  const m = DENSITY_MAP[density];
  return `${m.cardPaddingY}px ${m.cardPaddingX}px`;
}
