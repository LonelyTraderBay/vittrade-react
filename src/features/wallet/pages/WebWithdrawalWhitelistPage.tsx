import { AddressBookPage } from './AddressBookPage';

/**
 * Web route compatibility entry point.
 *
 * The withdrawal whitelist is intentionally backed by the same wallet address-book
 * contract across shells so web/mobile cannot diverge on security policy.
 */
export function WebWithdrawalWhitelistPage() {
  return <AddressBookPage />;
}
