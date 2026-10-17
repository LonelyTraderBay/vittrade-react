import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { testDcaApi } from '@/test/dca-test-adapter';
import { dcaApi, type DCAApi } from '../api/dca-api';
import type { DCASnapshot } from './dca-types';
import { DCAProvider } from './dca-context-provider';
import { useDCA } from './use-dca-context';

describe('unseeded DCAProvider', () => {
  it.each(['default', 'injected'] as const)(
    'keeps an unseeded %s API loading until the actual snapshot arrives',
    async (mode) => {
      let resolveSnapshot!: (snapshot: DCASnapshot) => void;
      const pending = new Promise<DCASnapshot>((resolve) => {
        resolveSnapshot = resolve;
      });
      const api: DCAApi = {
        getSnapshot: vi.fn(() => pending),
        createPlan: vi.fn(),
        updatePlan: vi.fn(),
        deletePlan: vi.fn(),
      };
      const request =
        mode === 'default'
          ? vi.spyOn(dcaApi, 'getSnapshot').mockReturnValue(pending)
          : api.getSnapshot;
      const wrapper = ({ children }: { children: ReactNode }) => (
        <DCAProvider api={mode === 'injected' ? api : undefined}>{children}</DCAProvider>
      );
      try {
        const { result } = renderHook(() => useDCA(), { wrapper });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.plans).toEqual([]);
        expect(result.current.purchaseHistory).toEqual([]);
        expect(result.current.portfolioHistory).toEqual([]);
        expect(result.current.overview.currentValue).toBe(0);
        expect(request).toHaveBeenCalledTimes(1);
        const snapshot = testDcaApi.getInitialSnapshot();
        await act(async () => {
          resolveSnapshot(snapshot);
          await pending;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.plans).toEqual(snapshot.plans);
        expect(result.current.overview).toEqual(snapshot.overview);
      } finally {
        vi.restoreAllMocks();
      }
    },
  );
});
