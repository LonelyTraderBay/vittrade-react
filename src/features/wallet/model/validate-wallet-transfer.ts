import type { WalletAccountId } from './wallet-types';

interface WalletTransferValidationInput {
  fromWallet: WalletAccountId;
  toWallet: WalletAccountId;
  amount: number;
  available: number;
  assetSymbol: string;
}

export function validateWalletTransfer({
  fromWallet,
  toWallet,
  amount,
  available,
  assetSymbol,
}: WalletTransferValidationInput): string {
  if (fromWallet === toWallet) return 'Choose two different wallets.';
  if (!assetSymbol) return 'Choose an asset to transfer.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than zero.';
  if (amount > available) return 'The transfer amount exceeds the available balance.';
  return '';
}
