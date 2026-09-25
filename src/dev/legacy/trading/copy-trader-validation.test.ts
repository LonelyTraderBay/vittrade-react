import { describe, expect, it } from 'vitest';
import { COPY_TRADERS, type CopyTrader } from '@/dev/mocks/trading-fixtures';
import {
  sanitizeCopyTrader,
  validateCopyTrader,
  validateCopyTraders,
} from './copy-trader-validation';

const validTrader: CopyTrader = {
  id: 'provider-1',
  name: 'Steady Provider',
  avatar: 'S',
  winRate: 72,
  totalPnl: 5_000,
  totalPnlPct: 50,
  aum: 10_000,
  copiers: 10,
  maxCopiers: 20,
  sharpeRatio: 1.5,
  maxDrawdown: -12,
  totalTrades: 50,
  avgHoldingTime: '4h',
  weeklyPnl: [1, -1, 2, 0, 1, -2, 3],
  tags: [],
  isFollowing: false,
  riskLevel: 'medium',
};

describe('copy trader validation', () => {
  it('keeps the development provider fixture set within its domain rules', () => {
    expect(validateCopyTraders(COPY_TRADERS)).toEqual({ isValid: true, errors: [] });
  });

  it('accepts a provider that satisfies the domain invariants', () => {
    expect(validateCopyTrader(validTrader)).toEqual({ isValid: true, errors: [] });
  });

  it('reports every invalid provider field and unreasonable metric', () => {
    const invalidTrader: CopyTrader = {
      ...validTrader,
      id: '',
      name: '',
      avatar: '',
      copiers: 25,
      maxCopiers: 20,
      weeklyPnl: [1, 2],
      maxDrawdown: 3,
      winRate: 101,
      totalPnl: 20_000,
      totalPnlPct: 50,
      sharpeRatio: 6,
      riskLevel: 'extreme' as CopyTrader['riskLevel'],
    };

    const result = validateCopyTrader(invalidTrader);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(7);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('exceeds maxCopiers'),
        expect.stringContaining('exactly 7 days'),
        expect.stringContaining('maxDrawdown should be negative'),
        expect.stringContaining('winRate should be 0-100%'),
        expect.stringContaining('sharpeRatio'),
        expect.stringContaining('missing required fields'),
        expect.stringContaining('invalid riskLevel'),
      ]),
    );
  });

  it('detects duplicate provider ids across a response', () => {
    expect(validateCopyTraders([validTrader, { ...validTrader }])).toEqual({
      isValid: false,
      errors: ['Duplicate trader IDs detected'],
    });
  });

  it('normalizes counts, weekly history, drawdown and bounded metrics', () => {
    const sanitized = sanitizeCopyTrader({
      ...validTrader,
      copiers: 30,
      weeklyPnl: [1, 2, 3, 4, 5],
      maxDrawdown: 12,
      winRate: 120,
      sharpeRatio: 9,
    });

    expect(sanitized).toMatchObject({
      copiers: 20,
      weeklyPnl: [1, 2, 3, 4, 5, 0, 0],
      maxDrawdown: -12,
      winRate: 100,
      sharpeRatio: 5,
    });
  });

  it('truncates weekly history when it contains more than seven days', () => {
    const sanitized = sanitizeCopyTrader({
      ...validTrader,
      weeklyPnl: [1, 2, 3, 4, 5, 6, 7, 8],
    });

    expect(sanitized.weeklyPnl).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
