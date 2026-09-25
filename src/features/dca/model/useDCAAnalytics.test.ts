import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dcaAnalytics } from './dca-analytics-service';
import {
  useDCAAnalytics,
  useImpressionTracking,
  usePageViewTracking,
  useTimeTracking,
} from './useDCAAnalytics';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DCA analytics hooks', () => {
  it('exposes callbacks for every DCA analytics action', () => {
    const methods = [
      'trackEvent',
      'trackPageView',
      'trackPlanCreation',
      'trackPlanStatusChange',
      'trackPlanDeletion',
      'trackWalletShortcut',
      'trackAssetDetailButton',
      'trackDeepLink',
      'trackEmptyState',
      'trackExecution',
      'trackHomeQuickAction',
      'trackTradeChip',
      'trackPairDetailBanner',
      'trackProfileMenu',
    ] as const;
    const spies = methods.map((method) =>
      vi.spyOn(dcaAnalytics, method).mockImplementation(() => undefined),
    );
    const { result } = renderHook(() => useDCAAnalytics());

    act(() => {
      result.current.trackEvent('custom_event', { source: 'test' });
      result.current.trackPageView('overview');
      result.current.trackPlanCreation('plan-1', 'BTC', 'daily', 25, 'dca_page');
      result.current.trackPlanStatusChange('plan-1', 'paused');
      result.current.trackPlanDeletion('plan-1', 'requested');
      result.current.trackWalletShortcut('click', 'compact');
      result.current.trackAssetDetailButton('click', 'BTC');
      result.current.trackDeepLink('ETH', true);
      result.current.trackEmptyState('impression');
      result.current.trackExecution('plan-1', false, 'failed');
      result.current.trackHomeQuickAction('mobile');
      result.current.trackTradeChip('SOL', 'responsive');
      result.current.trackPairDetailBanner('click', 'SOL');
      result.current.trackProfileMenu('responsive');
    });

    expect(spies.every((spy) => spy.mock.calls.length > 0)).toBe(true);
  });

  it('tracks page views and immediate or delayed impressions once mounted', () => {
    vi.useFakeTimers();
    const trackPageView = vi
      .spyOn(dcaAnalytics, 'trackPageView')
      .mockImplementation(() => undefined);
    const trackEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);
    renderHook(() => usePageViewTracking('dca-dashboard'));
    const immediate = renderHook(() => useImpressionTracking('dca_plan_created'));

    expect(trackPageView).toHaveBeenCalledWith('dca-dashboard');
    expect(trackEvent).toHaveBeenCalledWith('dca_plan_created', undefined);
    immediate.rerender();

    const delayed = renderHook(() =>
      useImpressionTracking('dca_wallet_shortcut_click', undefined, { delay: 25 }),
    );
    expect(trackEvent).not.toHaveBeenCalledWith('dca_wallet_shortcut_click', undefined);
    act(() => vi.advanceTimersByTime(25));
    expect(trackEvent).toHaveBeenCalledWith('dca_wallet_shortcut_click', undefined);
    delayed.unmount();
  });

  it('cancels a delayed impression on unmount and tracks elapsed time on cleanup', () => {
    vi.useFakeTimers();
    const trackEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);
    const delayed = renderHook(() =>
      useImpressionTracking('dca_plan_created', undefined, { delay: 50 }),
    );
    delayed.unmount();
    act(() => vi.advanceTimersByTime(50));
    expect(trackEvent).not.toHaveBeenCalled();

    const timed = renderHook(() => useTimeTracking('DCAWidget'));
    act(() => vi.advanceTimersByTime(120));
    timed.unmount();
    expect(trackEvent).toHaveBeenCalledWith(
      'component_time_spent',
      expect.objectContaining({ component: 'DCAWidget', time_ms: 120 }),
    );
  });
});
