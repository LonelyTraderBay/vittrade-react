/**
 * ══════════════════════════════════════════════════════════════
 *  Test Utils — Custom Render & Helpers
 * ══════════════════════════════════════════════════════════════
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <UIProvider>{children}</UIProvider>
        </QueryClientProvider>
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
