import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureException } from '@/shared/telemetry/telemetry';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@/shared/telemetry/telemetry', () => ({
  captureException: vi.fn(),
}));

function renderFailingChild({ compact = false }: { compact?: boolean } = {}) {
  return render(
    <ErrorBoundary compact={compact} section="Wallet">
      <ThrowOnRender />
    </ErrorBoundary>,
  );
}

function ThrowOnRender(): ReactElement {
  throw new Error('wallet render failed');
}

afterEach(() => {
  vi.mocked(captureException).mockClear();
});

describe('ErrorBoundary', () => {
  it('reports a render failure and exposes recoverable details', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderFailingChild();

    expect(screen.getByText('Oops! Có lỗi xảy ra')).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'wallet render failed' }),
      expect.objectContaining({
        area: 'react',
        operation: 'render',
        metadata: expect.objectContaining({ section: 'Wallet' }),
      }),
    );

    fireEvent.click(screen.getByText('Xem chi tiết lỗi'));
    expect(screen.getByText('Error: wallet render failed')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('shows a compact fallback for a failing section', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderFailingChild({ compact: true });

    expect(screen.getByText('Lỗi tải Wallet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    expect(screen.queryByText('Xem chi tiết lỗi')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
