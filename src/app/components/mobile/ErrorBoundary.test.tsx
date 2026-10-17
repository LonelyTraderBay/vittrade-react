import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureException } from '@/shared/telemetry/telemetry';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@/shared/telemetry/telemetry', () => ({
  captureException: vi.fn(),
}));

const { runtimeEnv } = vi.hoisted(() => ({ runtimeEnv: { isDev: true, releaseVersion: 'test' } }));
vi.mock('@/shared/config/env', () => ({ env: runtimeEnv }));

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
  runtimeEnv.isDev = true;
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('does not offer raw exception or component details outside development', () => {
    runtimeEnv.isDev = false;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderFailingChild();
    expect(screen.queryByRole('button', { name: 'Xem chi tiết lỗi' })).not.toBeInTheDocument();
    expect(screen.queryByText(/wallet render failed/)).not.toBeInTheDocument();
    expect(captureException).toHaveBeenCalled();
  });

  it('does not write application-owned raw exception logs outside development', () => {
    runtimeEnv.isDev = false;
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderFailingChild();
    expect(
      errorLog.mock.calls.filter(
        ([first]) => typeof first === 'string' && first.startsWith('[ErrorBoundary'),
      ),
    ).toHaveLength(0);
  });

  it('offers a real root link for recovery instead of repeating the failed render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderFailingChild();
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  });

  it.each([false, true])('retries a recovered child with compact=$compact', (compact) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let failing = true;
    function RecoverableChild() {
      if (failing) throw new Error('temporary render failure');
      return <p>Recovered content</p>;
    }
    render(
      <ErrorBoundary compact={compact}>
        <RecoverableChild />
      </ErrorBoundary>,
    );
    failing = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

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
    fireEvent.click(screen.getByText('Ẩn chi tiết'));
    expect(screen.queryByText('Error: wallet render failed')).not.toBeInTheDocument();

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
