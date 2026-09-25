import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../app/contexts/AuthContext';
import type { AuthAdapter } from '../app/contexts/AuthContext';
import { ThemeProvider } from '../app/contexts/ThemeContext';
import { UIProvider } from '../app/contexts/UIContext';
import { AppProvider } from '../app/contexts/AppContext';
import { testAuthAdapter } from './auth-test-adapter';

/**
 * ══════════════════════════════════════════════════════════
 *  TEST UTILITIES
 * ══════════════════════════════════════════════════════════
 *  Custom render function that wraps components with all providers
 *  Usage: import { renderWithProviders } from '@/test/test-utils'
 */

interface AllTheProvidersProps {
  children: React.ReactNode;
  routerProps?: MemoryRouterProps;
  authAdapter?: AuthAdapter;
}

/**
 * All Providers Wrapper
 * Wraps components with all app contexts in the correct order
 */
function AllTheProviders({
  children,
  routerProps = {},
  authAdapter = testAuthAdapter,
}: AllTheProvidersProps) {
  const { initialEntries = ['/'], ...otherRouterProps } = routerProps;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <MemoryRouter initialEntries={initialEntries} {...otherRouterProps}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider adapter={authAdapter}>
            <UIProvider>
              <AppProvider authAdapter={authAdapter}>{children}</AppProvider>
            </UIProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

/**
 * Custom render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
  authAdapter?: AuthAdapter;
}

export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const { routerProps, authAdapter, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders routerProps={routerProps} authAdapter={authAdapter}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Render with only Router (for components that don't need contexts)
 */
export function renderWithRouter(ui: ReactElement, routerProps?: MemoryRouterProps) {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter {...routerProps}>{children}</MemoryRouter>,
  });
}

/**
 * Render with Theme only
 */
export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    ...options,
  });
}

/**
 * Create mock user for AuthContext tests
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  username: 'testuser',
  isVerified: true,
  has2FA: true,
  kycStatus: 'verified' as const,
  kycLevel: 2,
  vipLevel: 1,
  joinDate: '2024-01-01',
  totalBalance: 10000,
  referralCode: 'TEST123',
  avatar: null,
  ...overrides,
});

/**
 * Wait for async updates
 */
export const waitForLoadingToFinish = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock intersection observer entry
 */
export const createIntersectionObserverEntry = (
  isIntersecting: boolean,
): IntersectionObserverEntry => ({
  isIntersecting,
  boundingClientRect: {} as DOMRectReadOnly,
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: {} as DOMRectReadOnly,
  rootBounds: null,
  target: document.createElement('div'),
  time: Date.now(),
});

/**
 * Mock window.matchMedia for responsive tests
 */
export const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

/**
 * Mock crypto pairs for market tests
 */
export const createMockCryptoPair = (overrides = {}) => ({
  id: 'btcusdt',
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 50000,
  change24h: 2.5,
  volume24h: 1000000000,
  high24h: 51000,
  low24h: 49000,
  isFavorite: false,
  category: 'Layer 1',
  ...overrides,
});

/**
 * Mock prediction event
 */
export const createMockPredictionEvent = (overrides = {}) => ({
  id: 'event-1',
  title: 'Will BTC reach $100k by end of 2026?',
  category: 'crypto',
  status: 'active' as const,
  probability: 65,
  volume: 500000,
  outcomes: [
    { id: 'yes', label: 'Yes', probability: 65 },
    { id: 'no', label: 'No', probability: 35 },
  ],
  ...overrides,
});

/**
 * Mock arena challenge
 */
export const createMockArenaChallenge = (overrides = {}) => ({
  id: 'challenge-1',
  title: 'BTC Price Prediction',
  mode: 'prediction',
  pool: 5000,
  participants: 120,
  status: 'active' as const,
  createdBy: 'creator-1',
  ...overrides,
});

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
