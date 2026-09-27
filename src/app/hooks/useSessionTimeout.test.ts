import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionTimeout } from './useSessionTimeout';

afterEach(() => {
  vi.useRealTimers();
});

describe('useSessionTimeout', () => {
  it('warns before the configured deadline and locks at that deadline', () => {
    vi.useFakeTimers();
    const onWarning = vi.fn();
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimeout({ timeout: 10_000, warningBefore: 4_000, onWarning, onTimeout }),
    );

    act(() => vi.advanceTimersByTime(6_000));
    expect(result.current.isWarning).toBe(true);
    expect(result.current.remainingSeconds).toBe(4);
    expect(onWarning).toHaveBeenCalledOnce();
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => window.dispatchEvent(new Event('keydown')));
    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current.remainingSeconds).toBe(1);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isTimedOut).toBe(true);
    expect(result.current.remainingSeconds).toBe(0);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('does not start a timeout when disabled', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimeout({ timeout: 5_000, warningBefore: 1_000, onTimeout, enabled: false }),
    );

    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current.isWarning).toBe(false);
    expect(result.current.isTimedOut).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('starts a fresh warning and timeout window when the session is extended', () => {
    vi.useFakeTimers();
    const onWarning = vi.fn();
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimeout({ timeout: 10_000, warningBefore: 4_000, onWarning, onTimeout }),
    );

    act(() => vi.advanceTimersByTime(6_000));
    act(() => result.current.extendSession());

    expect(result.current.isWarning).toBe(false);
    expect(result.current.isTimedOut).toBe(false);

    act(() => vi.advanceTimersByTime(6_000));
    expect(result.current.isWarning).toBe(true);
    expect(onWarning).toHaveBeenCalledTimes(2);

    act(() => vi.advanceTimersByTime(4_000));
    expect(result.current.isTimedOut).toBe(true);
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});
