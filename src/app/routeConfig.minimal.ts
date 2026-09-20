import React from 'react';
import type { RouteObject } from 'react-router';

// ═══════════════════════════════════════════════════════════
//  MINIMAL ROUTE CONFIG - EAGER LOADED ONLY
//  All routes use eager imports to prevent Figma iframe errors
// ═══════════════════════════════════════════════════════════

// ─── Auth Pages ───
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OTPPage } from './pages/auth/OTPPage';
import { TwoFASetupPage } from './pages/auth/TwoFASetupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// ─── Auth Layout ───
import { AuthLayout } from './components/layout/AuthLayout';

// ─── Core Pages (Eager) ───
import { TradePage } from './pages/trade/TradePage';
import { WalletPage } from './pages/wallet/WalletPage';
import { TransactionHistoryPage as TxHistoryPage } from './pages/wallet/TransactionHistoryPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { P2PHomePage } from './pages/p2p/P2PHomePage';
import { HomePage } from './pages/market/HomePage';
import { MarketListPage } from './pages/market/MarketListPage';

/**
 * Minimal route configuration with ONLY eager-loaded components
 * This prevents Figma Make iframe errors from lazy loading
 */
export const routeConfig: RouteObject[] = [
  // ═══════════════════════════════════════════════════════════
  //  AUTH ROUTES (Public)
  // ═══════════════════════════════════════════════════════════
  {
    path: '/auth',
    Component: AuthLayout,
    children: [
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'otp', Component: OTPPage },
      { path: '2fa-setup', Component: TwoFASetupPage },
      { path: 'forgot-password', Component: ForgotPasswordPage },
      { path: 'reset-password', Component: ResetPasswordPage },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  CORE APP ROUTES (Protected - Minimal)
  // ═══════════════════════════════════════════════════════════
  
  // Home / Markets
  { path: '/', Component: HomePage },
  { path: '/home', Component: HomePage },
  { path: '/markets', Component: MarketListPage },
  
  // Trade (Simple - No sub-routes)
  { path: '/trade/:pairId', Component: TradePage },
  
  // Wallet (Simple - No sub-routes)
  { path: '/wallet', Component: WalletPage },
  { path: '/wallet/history', Component: TxHistoryPage },
  
  // Profile (Simple - No sub-routes)
  { path: '/profile', Component: ProfilePage },
  
  // P2P (Simple - Home only)
  { path: '/p2p', Component: P2PHomePage },
];
