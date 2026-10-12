import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WebWithdrawalWhitelistPage } from './WebWithdrawalWhitelistPage';

vi.mock('./AddressBookPage', () => ({
  AddressBookPage: () => <main>Withdrawal address whitelist</main>,
}));

describe('WebWithdrawalWhitelistPage', () => {
  it('uses the shared address-book contract for the web compatibility route', () => {
    render(<WebWithdrawalWhitelistPage />);

    expect(screen.getByRole('main')).toHaveTextContent('Withdrawal address whitelist');
  });
});
