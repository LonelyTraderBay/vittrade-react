import { describe, expect, it } from 'vitest';
import { validateWalletTransfer } from './validate-wallet-transfer';

const validTransfer = {
  fromWallet: 'spot' as const,
  toWallet: 'funding' as const,
  amount: 12.5,
  available: 75,
  assetSymbol: 'USDT',
};

describe('validateWalletTransfer', () => {
  it('rejects moving funds to the same wallet', () => {
    expect(
      validateWalletTransfer({
        ...validTransfer,
        toWallet: 'spot',
      }),
    ).toBe('Choose two different wallets.');
  });

  it('requires an asset symbol', () => {
    expect(validateWalletTransfer({ ...validTransfer, assetSymbol: '' })).toBe(
      'Choose an asset to transfer.',
    );
  });

  it.each([
    [Number.NaN, 'Enter an amount greater than zero.'],
    [0, 'Enter an amount greater than zero.'],
  ])('rejects invalid amount %s', (amount, message) => {
    expect(validateWalletTransfer({ ...validTransfer, amount })).toBe(message);
  });

  it('rejects amounts above the available balance', () => {
    expect(validateWalletTransfer({ ...validTransfer, amount: 75.01 })).toBe(
      'The transfer amount exceeds the available balance.',
    );
  });

  it('accepts a positive transfer within the available balance', () => {
    expect(validateWalletTransfer(validTransfer)).toBe('');
  });
});
