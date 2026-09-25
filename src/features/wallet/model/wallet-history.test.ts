import { describe, expect, it, vi } from 'vitest';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Users } from 'lucide-react';
import { formatAmount, toggleSort, transactionMetadata } from './wallet-history';

describe('wallet history helpers', () => {
  it('toggles direction when the active sort key is selected again', () => {
    const setKey = vi.fn();
    const setDirection = vi.fn();

    toggleSort('time', 'time', 'asc', setKey, setDirection);
    expect(setDirection).toHaveBeenCalledWith('desc');
    expect(setKey).not.toHaveBeenCalled();

    toggleSort('time', 'time', 'desc', setKey, setDirection);
    expect(setDirection).toHaveBeenLastCalledWith('asc');
  });

  it('selects a new sort key and starts with descending order', () => {
    const setKey = vi.fn();
    const setDirection = vi.fn();

    toggleSort('amount', 'time', 'asc', setKey, setDirection);

    expect(setKey).toHaveBeenCalledWith('amount');
    expect(setDirection).toHaveBeenCalledWith('desc');
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
