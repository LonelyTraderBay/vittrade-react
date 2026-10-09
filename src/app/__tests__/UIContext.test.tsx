import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { UIProvider } from '../contexts/UIContext';
import { useUI } from '../hooks/useUI';
import { testAuthAdapter } from '@/test/auth-test-adapter';

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});

function TestUIProvider({ children }: PropsWithChildren) {
  return createElement(QueryClientProvider, {
    client,
    children: createElement(AuthProvider, {
      adapter: testAuthAdapter,
      children: createElement(UIProvider, { children }),
    }),
  });
}

afterEach(() => client.clear());

describe('UIContext', () => {
  it('keeps notification counts out of local UI state without read permission', () => {
    const { result } = renderHook(() => useUI(), { wrapper: TestUIProvider });

    expect(result.current.notifications).toBe(0);
  });

  it('keeps balance, offline and reward controls in local UI state', () => {
    const { result } = renderHook(() => useUI(), { wrapper: TestUIProvider });

    expect(result.current.isBalanceHidden).toBe(false);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.pendingRewards).toBe(2);

    act(() => {
      result.current.toggleBalanceHidden();
      result.current.setIsOffline(true);
      result.current.setPendingRewards(4);
    });

    expect(result.current.isBalanceHidden).toBe(true);
    expect(result.current.isOffline).toBe(true);
    expect(result.current.pendingRewards).toBe(4);
  });

  it('throws when used outside its provider', () => {
    expect(() => renderHook(() => useUI())).toThrow('useUI must be used inside UIProvider');
  });
});
