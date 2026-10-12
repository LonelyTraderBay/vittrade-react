import { fmtUsd } from '@/shared/lib/formatNumber';

export function formatAssetPriceTooltip(value: number): [string, 'Giá'] {
  return [fmtUsd(value), 'Giá'];
}
