import { describe, expect, it } from 'vitest';
import { getLoginReturnPath } from './login-return-path';

describe('getLoginReturnPath', () => {
  it.each([
    '/wallet/transfer?origin=c06&asset=BTC%2FUSDT#amount',
    '/t/wallet/transfer?amount=12.3456789012#amount',
    '/r/markets?search=BTC%2FUSDT#results',
    '/w/trade/BTC%2FUSDT?view=order-book#price',
    '/topic/%C4%91%E1%BB%93ng?note=%0A#details',
    '/',
  ])('keeps the local URL and its encoded business context: %s', (path) => {
    expect(getLoginReturnPath({ from: path }, '/home')).toBe(path);
  });

  it.each([
    undefined,
    null,
    [],
    {},
    { from: 123 },
    { from: '' },
    { from: 'https://foreign.test/path' },
    { from: '//foreign.test/path' },
    { from: '/\\foreign.test/path' },
    { from: '/%2f%2fforeign.test/path' },
    { from: '/%5cforeign.test/path' },
    { from: 'javascript:alert(1)' },
    { from: '/wallet\n/transfer' },
    { from: '/wallet%00/transfer' },
    { from: '/%E0%A4%A' },
    { from: '/auth/login' },
    { from: '/W/AUTH/OTP?from=wallet' },
    { from: '/t/onboarding/start' },
    { from: '/private/../auth/login' },
    { from: '/%61uth/login' },
    { from: ' /wallet/transfer' },
  ])('uses the trusted shell home for invalid/looping context %o', (state) => {
    expect(getLoginReturnPath(state, '/w/home')).toBe('/w/home');
  });

  it('accepts the existing session-expired returnTo contract', () => {
    expect(
      getLoginReturnPath({ returnTo: '/w/wallet/history?type=withdraw#recent' }, '/w/home'),
    ).toBe('/w/wallet/history?type=withdraw#recent');
  });

  it('prefers the guarded from context over a secondary returnTo', () => {
    expect(getLoginReturnPath({ from: '/r/wallet', returnTo: '/w/home' }, '/home')).toBe(
      '/r/wallet',
    );
    expect(getLoginReturnPath({ from: '//foreign.test', returnTo: '/w/wallet' }, '/home')).toBe(
      '/home',
    );
  });
});
