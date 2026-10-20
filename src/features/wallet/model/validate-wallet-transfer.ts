import type { WalletAccountId } from './wallet-types';

interface WalletTransferValidationInput {
  fromWallet: WalletAccountId;
  toWallet: WalletAccountId;
  amount: number;
  available: number;
  assetSymbol: string;
}

export interface WalletTransferValidationError {
  field: 'wallets' | 'asset' | 'amount';
  message: string;
}

/** Keep the string API for callers that only need a summary. */
export function validateWalletTransfer(input: WalletTransferValidationInput): string {
  return getWalletTransferValidationError(input)?.message ?? '';
}

export function getWalletTransferValidationError({
  fromWallet,
  toWallet,
  amount,
  available,
  assetSymbol,
}: WalletTransferValidationInput): WalletTransferValidationError | null {
  if (fromWallet === toWallet)
    return { field: 'wallets', message: 'Choose two different wallets.' };
  if (!assetSymbol) return { field: 'asset', message: 'Choose an asset to transfer.' };
  if (!Number.isFinite(amount) || amount <= 0)
    return { field: 'amount', message: 'Enter an amount greater than zero.' };
  if (amount > available)
    return { field: 'amount', message: 'The transfer amount exceeds the available balance.' };
  return null;
}
