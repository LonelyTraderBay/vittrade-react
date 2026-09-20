/**
 * ══════════════════════════════════════════════════════════
 *  EXTENDED NUMBER FORMATTING UTILITIES
 * ══════════════════════════════════════════════════════════
 *
 *  Additional number formatters to complement existing
 *  /src/app/data/formatNumber.ts
 */

/**
 * Format number in compact notation (K, M, B, T)
 * @example formatCompactNumber(1500) // "1.5K"
 * @example formatCompactNumber(1500000) // "1.5M"
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
  }
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }
  
  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Format file size in human-readable format
 * @example formatBytes(1536) // "1.5 KB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 * @example formatOrdinal(1) // "1st"
 * @example formatOrdinal(22) // "22nd"
 */
export function formatOrdinal(num: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format Vietnamese ordinal numbers
 * @example formatOrdinalVi(1) // "Thứ 1"
 */
export function formatOrdinalVi(num: number): string {
  return `Thứ ${num}`;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to nearest step
 * @example roundToStep(1.234, 0.01) // 1.23
 * @example roundToStep(1.234, 0.05) // 1.25
 */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Format range (e.g., "1-10", "10-20")
 */
export function formatRange(min: number, max: number, unit?: string): string {
  const unitStr = unit ? ` ${unit}` : '';
  return `${min}${unitStr} - ${max}${unitStr}`;
}

/**
 * Parse number from string safely
 */
export function parseNumber(str: string): number | null {
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Format phone number (Vietnamese format)
 * @example formatPhoneNumber("0123456789") // "012 345 6789"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Abbreviate number with suffix
 * @example abbreviateNumber(1234) // "1.2k"
 */
export function abbreviateNumber(num: number, decimals: number = 1): string {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(decimals)}m`;
  }
  if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(decimals)}k`;
  }
  
  return `${sign}${absNum.toFixed(decimals)}`;
}

/**
 * Format number as Vietnamese currency (VND)
 * @example formatVND(1000000) // "1.000.000 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format score with color indicator
 */
export function formatScore(score: number, max: number = 100): string {
  const percentage = (score / max) * 100;
  return `${score}/${max} (${percentage.toFixed(0)}%)`;
}
