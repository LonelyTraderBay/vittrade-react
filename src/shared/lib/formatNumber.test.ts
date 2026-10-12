import { describe, expect, it } from 'vitest';
import {
  fmtAbsPct,
  fmtAmount,
  fmtCompact,
  fmtFee,
  fmtNum,
  fmtPct,
  fmtPrice,
  fmtSignedUsd,
  fmtUsd,
  fmtVnd,
  fmtVolume,
} from './formatNumber';

describe('number formatting contracts', () => {
  it('formats USD at each decimal boundary and supports explicit options', () => {
    expect(fmtUsd(0)).toBe('$0.00');
    expect(fmtUsd(12.3)).toBe('$12.30');
    expect(fmtUsd(0.62)).toBe('$0.6200');
    expect(fmtUsd(0.000123)).toBe('$0.000123');
    expect(fmtUsd(-0.62)).toBe('-$0.6200');
    expect(fmtUsd(12.345, { prefix: false, decimals: 1 })).toBe('12.3');
  });

  it('formats prices and quantities at their precision boundaries', () => {
    expect(fmtPrice(1)).toBe('1.00');
    expect(fmtPrice(0.01)).toBe('0.0100');
    expect(fmtPrice(0.001)).toBe('0.001000');
    expect(fmtAmount(0)).toBe('0.00');
    expect(fmtAmount(1000)).toBe('1,000.00');
    expect(fmtAmount(1)).toBe('1.0000');
    expect(fmtAmount(0.001)).toBe('0.001000');
    expect(fmtAmount(0.0001)).toBe('0.00010000');
    expect(fmtAmount(1.25, 1)).toBe('1.3');
  });

  it('distinguishes signed and absolute percentage and PnL formats', () => {
    expect(fmtPct(2.345)).toBe('+2.35%');
    expect(fmtPct(0)).toBe('0.00%');
    expect(fmtPct(-2.345, 1)).toBe('-2.3%');
    expect(fmtAbsPct(-2.345)).toBe('2.35%');
    expect(fmtAbsPct(2.345, 1)).toBe('2.3%');
    expect(fmtSignedUsd(0)).toBe('+$0.00');
    expect(fmtSignedUsd(-84.2)).toBe('-$84.20');
    expect(fmtSignedUsd(84.2, { decimals: 1 })).toBe('+$84.2');
  });

  it('formats compact values and preserves prefixes, signs, and forced precision', () => {
    expect(fmtCompact(1_230_000_000)).toBe('1.23B');
    expect(fmtCompact(-50_000_000, { prefix: '$' })).toBe('-$50M');
    expect(fmtCompact(2_000_000)).toBe('2M');
    expect(fmtCompact(1_250_000)).toBe('1.25M');
    expect(fmtCompact(1_250_000, { forceDecimals: 3 })).toBe('1.250M');
    expect(fmtCompact(500_000)).toBe('500K');
    expect(fmtCompact(1_250)).toBe('1.3K');
    expect(fmtCompact(1_250, { prefix: '$', forceDecimals: 2 })).toBe('$1.25K');
    expect(fmtCompact(-999, { prefix: '$' })).toBe('-$999');
  });

  it('formats fees, volumes, VND, and plain grouped numbers', () => {
    expect(fmtFee(0)).toBe('$0');
    expect(fmtFee(1)).toBe('$1.00');
    expect(fmtFee(0.01)).toBe('$0.0100');
    expect(fmtFee(0.001)).toBe('$0.001000');
    expect(fmtVolume(50_000)).toBe('$50K');
    expect(fmtVnd(5_070_000)).toBe('5.070.000');
    expect(fmtNum(1234.56)).toBe('1,235');
    expect(fmtNum(1234.56, 2)).toBe('1,234.56');
  });
});
