import type { TPSLValues } from './trading-types';

export function isTpslSubmissionValid(
  values: Pick<TPSLValues, 'enabled' | 'tpPrice' | 'slPrice' | 'bracketMode'>,
  side: 'buy' | 'sell',
  entryPrice: number,
  defaultBracketMode = false,
): boolean {
  if (!values.enabled) return true;
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) return false;

  const bracketMode = values.bracketMode ?? defaultBracketMode;
  const parsePrice = (value: string) => {
    const normalized = value.trim();
    if (normalized === '') return undefined;
    return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : Number.NaN;
  };
  const tpPrice = parsePrice(values.tpPrice);
  const slPrice = parsePrice(values.slPrice);
  const tpValid =
    tpPrice === undefined ||
    (Number.isFinite(tpPrice) &&
      tpPrice > 0 &&
      (side === 'buy' ? tpPrice > entryPrice : tpPrice < entryPrice));
  const slValid =
    slPrice === undefined ||
    (Number.isFinite(slPrice) &&
      slPrice > 0 &&
      (side === 'buy' ? slPrice < entryPrice : slPrice > entryPrice));

  return tpValid && slValid && (!bracketMode || (tpPrice !== undefined && slPrice !== undefined));
}
