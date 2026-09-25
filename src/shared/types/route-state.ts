/**
 * State tạm thời truyền giữa các route, không phải nguồn sự thật giao dịch.
 * Các deep-link state phải được validate trước khi đưa vào form.
 */
export interface DcaRouteState {
  preselectedCoin?: string;
}

const COIN_SYMBOL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/;

export function normalizeCoinSymbol(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const symbol = value.trim().toUpperCase();
  return COIN_SYMBOL_PATTERN.test(symbol) ? symbol : null;
}

export function readDcaPreselectedCoin(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null;
  const candidate = (state as DcaRouteState).preselectedCoin;
  return normalizeCoinSymbol(candidate);
}
