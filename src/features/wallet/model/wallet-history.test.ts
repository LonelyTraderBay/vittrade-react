import { describe, expect, it } from 'vitest';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Users } from 'lucide-react';
import { formatAmount, STATUS_FILTERS, transactionMetadata, TYPE_FILTERS } from './wallet-history';

describe('wallet history helpers', () => {
  it('offers only filters supported by the wallet transaction contract', () => {
    expect(TYPE_FILTERS.map(({ id }) => id)).toEqual([
      'all',
      'deposit',
      'withdraw',
      'trade_buy',
      'trade_sell',
      'p2p_buy',
      'p2p_sell',
    ]);
    expect(STATUS_FILTERS.map(({ id }) => id)).toEqual(['all', 'completed', 'pending', 'failed']);
  });

  it.each([
    ['deposit', 'Deposit', '#10B981', ArrowDownLeft],
    ['withdraw', 'Withdrawal', '#EF4444', ArrowUpRight],
    ['trade_buy', 'Buy', '#3B82F6', ArrowLeftRight],
    ['trade_sell', 'Sell', '#3B82F6', ArrowLeftRight],
    ['p2p_buy', 'P2P buy', '#8B5CF6', Users],
    ['p2p_sell', 'P2P sell', '#8B5CF6', Users],
  ] as const)('maps %s transactions to their display metadata', (type, label, color, icon) => {
    expect(transactionMetadata(type)).toEqual({ label, color, icon });
  });

  it('formats wallet amounts with grouped digits and up to eight decimals', () => {
    expect(formatAmount(1234567.123456789)).toBe('1,234,567.12345679');
    expect(formatAmount(0)).toBe('0');
    expect(formatAmount(-12.5)).toBe('-12.5');
  });
});
