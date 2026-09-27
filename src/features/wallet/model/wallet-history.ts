import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Users } from 'lucide-react';
import type { WalletTransactionType } from './wallet-types';

export const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdrawal' },
  { id: 'trade_buy', label: 'Trade buy' },
  { id: 'trade_sell', label: 'Trade sell' },
  { id: 'p2p_buy', label: 'P2P buy' },
  { id: 'p2p_sell', label: 'P2P sell' },
] as const;

export const STATUS_FILTERS = [
  { id: 'all', label: 'All status' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
] as const;

export type TypeFilter = (typeof TYPE_FILTERS)[number]['id'];
export type StatusFilter = (typeof STATUS_FILTERS)[number]['id'];

export const PAGE_SIZE = 50;

export function transactionMetadata(type: WalletTransactionType): {
  label: string;
  color: string;
  icon: typeof ArrowDownLeft;
} {
  if (type === 'deposit') return { label: 'Deposit', color: '#10B981', icon: ArrowDownLeft };
  if (type === 'withdraw') return { label: 'Withdrawal', color: '#EF4444', icon: ArrowUpRight };
  if (type.startsWith('trade')) {
    return {
      label: type === 'trade_buy' ? 'Buy' : 'Sell',
      color: '#3B82F6',
      icon: ArrowLeftRight,
    };
  }
  return { label: type === 'p2p_buy' ? 'P2P buy' : 'P2P sell', color: '#8B5CF6', icon: Users };
}

export function formatAmount(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
}
