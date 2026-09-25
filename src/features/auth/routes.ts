import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

export interface AuthRouteComponents {
  login: ComponentType;
  register?: ComponentType;
  otp?: ComponentType;
  twoFASetup?: ComponentType;
  forgotPassword?: ComponentType;
  resetPassword?: ComponentType;
  success?: ComponentType;
  accountLocked?: ComponentType;
  sessionExpired?: ComponentType;
  deviceTrust?: ComponentType;
}

export interface PasswordResetRouteComponents {
  forgotPassword: ComponentType;
  resetPassword: ComponentType;
}

/** Compose the auth URL segments while allowing each shell to provide its page adapters. */
export function createAuthRoutes(components: AuthRouteComponents): RouteObject[] {
  const {
    login: LoginPage,
    register: RegisterPage,
    otp: OTPPage,
    twoFASetup: TwoFASetupPage,
    forgotPassword: ForgotPasswordContractPage,
    resetPassword: ResetPasswordContractPage,
    success: AuthSuccessPage,
    accountLocked: AccountLockedPage,
    sessionExpired: SessionExpiredPage,
    deviceTrust: DeviceTrustPage,
  } = components;
  const routes: RouteObject[] = [{ path: 'login', Component: LoginPage }];

  if (RegisterPage) routes.push({ path: 'register', Component: RegisterPage });
  if (OTPPage) routes.push({ path: 'otp', Component: OTPPage });
  if (TwoFASetupPage) routes.push({ path: '2fa-setup', Component: TwoFASetupPage });
  if (ForgotPasswordContractPage) {
    routes.push({ path: 'forgot-password', Component: ForgotPasswordContractPage });
  }
  if (ResetPasswordContractPage) {
    routes.push({ path: 'reset-password', Component: ResetPasswordContractPage });
  }
  if (AuthSuccessPage) routes.push({ path: 'success', Component: AuthSuccessPage });
  if (AccountLockedPage) routes.push({ path: 'account-locked', Component: AccountLockedPage });
  if (SessionExpiredPage) routes.push({ path: 'session-expired', Component: SessionExpiredPage });
  if (DeviceTrustPage) routes.push({ path: 'device-trust', Component: DeviceTrustPage });

  return routes;
}

/** Compatibility helper for callers that compose password reset independently. */
export function createPasswordResetRoutes(components: PasswordResetRouteComponents): RouteObject[] {
  return [
    { path: 'forgot-password', Component: components.forgotPassword },
    { path: 'reset-password', Component: components.resetPassword },
  ];
}
