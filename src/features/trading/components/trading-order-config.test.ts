import { describe, expect, it } from 'vitest';
import { getOrderTypeLabel } from './trading-order-config';

describe('getOrderTypeLabel', () => {
  it('returns the configured label or the default for an unknown order type', () => {
    expect(getOrderTypeLabel('market')).toBe('Thị trường');
    expect(getOrderTypeLabel('unsupported')).toBe('Giới hạn');
  });
});
