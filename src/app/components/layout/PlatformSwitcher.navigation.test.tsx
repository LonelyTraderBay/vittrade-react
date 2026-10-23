import { act, fireEvent, render, screen } from '@testing-library/react';
import { lazy, startTransition, Suspense } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformSwitcher } from './PlatformSwitcher';

function PathProbe() {
  const location = useLocation();
  return <output aria-label="Rendered path">{location.pathname}</output>;
}

afterEach(() => vi.useRealTimers());

describe('PlatformSwitcher navigation ownership', () => {
  it.each(['loading', 'committed'] as const)(
    'does not let an old resize replace a %s explicit navigation',
    async (phase) => {
      vi.useFakeTimers();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
      let release!: () => void;
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      const DeferredPage = lazy(async () => {
        await pending;
        return { default: () => <p>Explicit destination</p> };
      });
      const router = createMemoryRouter(
        [
          {
            element: (
              <>
                <PlatformSwitcher
                  canSwitchLocation={(key) =>
                    router.state.navigation.state === 'idle' && router.state.location.key === key
                  }
                />
                <PathProbe />
                <Outlet />
              </>
            ),
            children: [
              { path: '/w/p2p/my-ads', element: <p>Original destination</p> },
              { path: '/p2p/my-ads', element: <p>Stale resize destination</p> },
              {
                path: '/r/trade/convert',
                loader: phase === 'loading' ? () => pending.then(() => null) : undefined,
                element: phase === 'committed' ? <DeferredPage /> : <p>Explicit destination</p>,
              },
            ],
          },
        ],
        { initialEntries: ['/w/p2p/my-ads'] },
      );
      render(
        <Suspense fallback={<p>Loading destination</p>}>
          <RouterProvider router={router} />
        </Suspense>,
      );

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 767 });
      fireEvent(window, new Event('resize'));
      let navigation!: Promise<void>;
      await act(async () => {
        startTransition(() => {
          navigation = router.navigate('/r/trade/convert?source=nav#form');
        });
        await Promise.resolve();
      });
      expect(screen.getByLabelText('Rendered path')).toHaveTextContent('/w/p2p/my-ads');
      if (phase === 'loading') {
        expect(router.state.navigation.location?.pathname).toBe('/r/trade/convert');
      } else {
        expect(router.state.location.pathname).toBe('/r/trade/convert');
      }

      await act(async () => vi.advanceTimersByTime(250));
      await act(async () => {
        release();
        await navigation;
      });

      expect(router.state.location.pathname).toBe('/r/trade/convert');
      expect(router.state.location.search).toBe('?source=nav');
      expect(router.state.location.hash).toBe('#form');
      expect(screen.getByText('Explicit destination')).toBeVisible();
      router.dispose();
    },
  );
});
