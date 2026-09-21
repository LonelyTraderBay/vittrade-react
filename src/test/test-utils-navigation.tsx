/**
 * ══════════════════════════════════════════════════════════════
 *  Test Utils — Custom Render & Helpers
 * ══════════════════════════════════════════════════════════════
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { vi } from 'vitest';
import { UIProvider } from '../app/contexts/UIContext';

/**
 * Custom render function with all required providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  { initialRoute = '/', ...renderOptions }: CustomRenderOptions = {},
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <UIProvider>{children}</UIProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Mock useNavigate hook
 */
export const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Simulate user wait/delay
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock theme colors (matches useThemeColors hook)
 */
export const mockThemeColors = {
  bg: '#FFFFFF',
  surface: '#F9FAFB',
  surface2: '#F3F4F6',
  border: '#E5E7EB',
  text1: '#111827',
  text2: '#374151',
  text3: '#6B7280',
  primary: '#3B82F6',
  success: '#10B981',
  successBg: '#D1FAE5',
  successBorder: '#6EE7B7',
  successText: '#065F46',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FCA5A5',
  dangerText: '#991B1B',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningBorder: '#FCD34D',
  warningText: '#92400E',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  infoBorder: '#93C5FD',
  infoText: '#1E40AF',
};

/**
 * Mock useThemeColors hook
 */
vi.mock('../app/hooks/useThemeColors', () => ({
  useThemeColors: () => mockThemeColors,
}));

/**
 * Mock useRoutePrefix hook
 */
vi.mock('../app/hooks/useRoutePrefix', () => ({
  useRoutePrefix: () => '',
}));

/**
 * Get element by test ID
 */
export const getByTestId = (id: string) => document.querySelector(`[data-testid="${id}"]`);

/**
 * Check if element has class
 */
export const hasClass = (element: Element | null, className: string) =>
  element?.classList.contains(className) ?? false;

/**
 * Get computed style
 */
export const getStyle = (element: Element | null, property: string) =>
  element ? window.getComputedStyle(element).getPropertyValue(property) : '';

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
