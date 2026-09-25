export const riskLabels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' } as const;

export const riskColors = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' } as const;

export function formatAmount(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 8 }).format(value);
}
