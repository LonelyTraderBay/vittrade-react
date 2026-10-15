export const riskLabels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' } as const;

export const riskColors = {
  low: 'var(--tr-success-text)',
  medium: 'var(--tr-warning-text)',
  high: 'var(--tr-error-text)',
} as const;

export function formatAmount(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 8 }).format(value);
}
