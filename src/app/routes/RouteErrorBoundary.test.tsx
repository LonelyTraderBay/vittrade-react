import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const { runtimeEnv, report } = vi.hoisted(() => ({
  runtimeEnv: { isDev: false, releaseVersion: 'test' },
  report: vi.fn(),
}));
vi.mock('@/shared/config/env', () => ({ env: runtimeEnv }));
vi.mock('@/shared/telemetry/telemetry', () => ({ captureException: report }));

afterEach(() => {
  runtimeEnv.isDev = false;
  report.mockClear();
});

function renderFailure(error: unknown) {
  const router = createMemoryRouter(
    [
      { path: '/previous', element: <p>Previous page</p> },
      {
        path: '/broken',
        loader: () => {
          throw error;
        },
        element: <p>Unreachable</p>,
        errorElement: <RouteErrorBoundary />,
      },
    ],
    { initialEntries: ['/previous', '/broken'], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('route failure recovery', () => {
  it.each([
    { label: 'render error', error: new Error('password=private-token') },
    {
      label: 'server failure',
      error: new Response('private body', { status: 500, statusText: 'password=private-token' }),
    },
    {
      label: 'missing route',
      error: new Response('private body', { status: 404, statusText: 'password=private-token' }),
    },
  ])('keeps a $label private outside development', async ({ error }) => {
    const router = renderFailure(error);
    try {
      const alert = await screen.findByRole('alert');
      expect(alert).not.toHaveTextContent('private-token');
      expect(alert).not.toHaveTextContent('private body');
      expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument();
      await waitFor(() => expect(report).toHaveBeenCalled());
    } finally {
      router.dispose();
    }
  });

  it('keeps developer diagnostics in development and returns to the previous route', async () => {
    runtimeEnv.isDev = true;
    const router = renderFailure(new Error('developer diagnostic'));
    try {
      expect(await screen.findByText('developer diagnostic')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
      expect(await screen.findByText('Previous page')).toBeInTheDocument();
    } finally {
      router.dispose();
    }
  });
});
