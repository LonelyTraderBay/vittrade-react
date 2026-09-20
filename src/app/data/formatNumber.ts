// ============================================================
// FORMAT NUMBER UTILITIES — VitTrade App
// Chuẩn hiển thị số: en-US (comma = thousands, dot = decimal)
// VND: vi-VN (dot = thousands, comma = decimal)
// ============================================================

/**
 * Format USD amount: $1,234.56
 * Tự động chọn số decimal phù hợp:
 * - >= $1,000 → 2 decimals (67,543.21)
 * - >= $1     → 2 decimals (178.32)
 * - >= $0.01  → 4 decimals (0.6234)
 * - < $0.01   → 6 decimals (0.000123)
 */
export function fmtUsd(value: number, options?: { prefix?: boolean; decimals?: number }): string {
  const prefix = options?.prefix !== false ? '$' : '';

  let decimals = options?.decimals;
  if (decimals === undefined) {
    if (value === 0) decimals = 2;
    else if (Math.abs(value) >= 1) decimals = 2;
    else if (Math.abs(value) >= 0.01) decimals = 4;
    else decimals = 6;
  }

  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${value < 0 ? '-' : ''}${prefix}${formatted}`;
}

/**
 * Format crypto price — tùy theo mức giá:
 * - >= 10,000 → 67,543.21 (2 dec)
 * - >= 100    → 3,521.45 (2 dec)
 * - >= 1      → 14.23 (2 dec)
 * - >= 0.01   → 0.6234 (4 dec)
 * - < 0.01    → 0.000123 (6 dec)
 */
export function fmtPrice(value: number): string {
  if (value >= 1) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (value >= 0.01) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

/**
 * Format crypto amount (balance, quantity):
 * - >= 1,000  → 5,000.00 (2 dec)
 * - >= 1      → 45.8000 (4 dec)
 * - >= 0.001  → 0.234510 (6 dec)
 * - < 0.001   → 0.00012345 (8 dec)
 */
export function fmtAmount(value: number, decimals?: number): string {
  let d = decimals;
  if (d === undefined) {
    if (value === 0) d = 2;
    else if (Math.abs(value) >= 1000) d = 2;
    else if (Math.abs(value) >= 1) d = 4;
    else if (Math.abs(value) >= 0.001) d = 6;
    else d = 8;
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

/**
 * Format percentage: +2.34% / -1.23%
 */
export function fmtPct(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format absolute percentage (no sign) — dùng kèm directional icon ▲/▼/↑/↓
 * fmtAbsPct(-5.67) → "5.67%"
 * fmtAbsPct(2.34)  → "2.34%"
 */
export function fmtAbsPct(value: number, decimals = 2): string {
  return `${Math.abs(value).toFixed(decimals)}%`;
}

/**
 * Format signed USD: +$84.20 / -$84.20
 * Dùng cho PnL, profit/loss — luôn hiển thị dấu +/-
 */
export function fmtSignedUsd(value: number, options?: { decimals?: number }): string {
  const sign = value >= 0 ? '+' : '-';
  const decimals = options?.decimals ?? 2;
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}$${formatted}`;
}

/**
 * Format large numbers rút gọn thông minh:
 * - >= 1B → 1.23B
 * - >= 1M → 50.00M
 * - >= 1K → 500K (K không cần decimal nếu tròn)
 * - < 1K  → 999
 * Luôn dùng comma cho phần ngàn nếu cần
 */
export function fmtCompact(value: number, options?: { prefix?: string; forceDecimals?: number }): string {
  const prefix = options?.prefix ?? '';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${sign}${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    // Show decimal only if not integer
    const dec = v % 1 === 0 ? 0 : (options?.forceDecimals ?? 2);
    return `${sign}${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    const dec = v % 1 === 0 ? 0 : (options?.forceDecimals ?? 1);
    return `${sign}${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}K`;
  }
  return `${sign}${prefix}${abs.toLocaleString('en-US')}`;
}

/**
 * Format VND amount: 5.070.000 ₫ (Vietnamese locale)
 */
export function fmtVnd(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Format fee: $0.0034 or $3.33
 * Tự động chọn decimals phù hợp
 */
export function fmtFee(value: number): string {
  if (value === 0) return '$0';
  if (value >= 1) return fmtUsd(value, { decimals: 2 });
  if (value >= 0.01) return fmtUsd(value, { decimals: 4 });
  return fmtUsd(value, { decimals: 6 });
}

/**
 * Format volume ngắn gọn cho table/compact view
 * 50000 → "$50K", 2000000 → "$2M", 50000000 → "$50M"
 */
export function fmtVolume(value: number): string {
  return fmtCompact(value, { prefix: '$' });
}

/**
 * Format number with thousands separator (no currency symbol)
 * 1234.56 → "1,234.56"
 * 1000000 → "1,000,000"
 */
export function fmtNum(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}