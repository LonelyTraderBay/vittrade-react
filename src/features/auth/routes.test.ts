import { describe, expect, it } from 'vitest';
import { createAuthRoutes, createPasswordResetRoutes } from './routes';

const Stub = () => null;

describe('Auth feature routes', () => {
  it('owns the shell-independent auth URL segments', () => {
    expect(createAuthRoutes({ login: Stub })).toEqual([{ path: 'login', Component: Stub }]);
    expect(
      createAuthRoutes({
        login: Stub,
        register: Stub,
        otp: Stub,
        twoFASetup: Stub,
        forgotPassword: Stub,
        resetPassword: Stub,
        success: Stub,
        accountLocked: Stub,
        sessionExpired: Stub,
        deviceTrust: Stub,
      }).map(({ path }) => path),
    ).toEqual([
      'login',
      'register',
      'otp',
      '2fa-setup',
      'forgot-password',
      'reset-password',
      'success',
      'account-locked',
      'session-expired',
      'device-trust',
    ]);
    expect(createPasswordResetRoutes({ forgotPassword: Stub, resetPassword: Stub })).toEqual([
      { path: 'forgot-password', Component: Stub },
      { path: 'reset-password', Component: Stub },
    ]);
  });
});
