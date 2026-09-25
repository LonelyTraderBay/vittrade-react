import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { funnelTracker } from './dca-funnel-service';
import {
  useAllFunnelAnalytics,
  useAssetToCreationFunnel,
  useCleanOldSessions,
  useDCATracking,
  useFirstTimeUserFunnel,
  useFunnelAnalytics,
  useFunnelDebug,
  useFunnelEvent,
  useFunnelPageView,
  useFunnelTracking,
  usePairDetailToCreationFunnel,
  usePlanActivationFunnel,
  useWalletToCreationFunnel,
} from './use-dca-funnel-tracking';
import { dcaAnalytics } from './dca-analytics-service';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DCA funnel hooks', () => {
  it('tracks general funnel events and all named funnel steps', () => {
    const trackEvent = vi.spyOn(funnelTracker, 'trackEvent').mockImplementation(() => undefined);
    const general = renderHook(() => useFunnelTracking('user-1')).result.current;
    const wallet = renderHook(() => useWalletToCreationFunnel()).result.current;
    const asset = renderHook(() => useAssetToCreationFunnel()).result.current;
    const firstTime = renderHook(() => useFirstTimeUserFunnel()).result.current;
    const activation = renderHook(() => usePlanActivationFunnel()).result.current;
    const pair = renderHook(() => usePairDetailToCreationFunnel()).result.current;

    act(() => {
      general.trackEvent('custom', { key: 'value' });
      wallet.trackShortcutImpression();
      wallet.trackShortcutClick();
      wallet.trackDCAPageView();
      wallet.trackCreateSheetOpened();
      wallet.trackPlanCreated();
      asset.trackButtonImpression();
      asset.trackButtonClick();
      asset.trackCreateSheetOpened();
      asset.trackPreselectedCoinUsed();
      asset.trackPlanCreated();
      firstTime.trackDCAPageView();
      firstTime.trackEmptyStateImpression();
      firstTime.trackEmptyStateClick();
      firstTime.trackCreateSheetOpened();
      firstTime.trackFirstPlanCreated();
      activation.trackPlanCreated();
      activation.trackPlanDetailsViewed();
      activation.trackFirstExecution();
      pair.trackButtonImpression();
      pair.trackButtonClick();
      pair.trackCreateSheetOpened();
      pair.trackPreselectedCoinUsed();
      pair.trackPlanCreated();
    });

    expect(general.trackEvent).toBeTypeOf('function');
    expect(wallet.funnelId).toBe('wallet_to_creation');
    expect(asset.funnelId).toBe('asset_to_creation');
    expect(firstTime.funnelId).toBe('first_time_user');
    expect(activation.funnelId).toBe('plan_activation');
    expect(pair.funnelId).toBe('pair_detail_to_creation');
    expect(trackEvent).toHaveBeenCalledWith('custom', 'user-1', { key: 'value' });
    expect(trackEvent).toHaveBeenCalledTimes(24);
  });

  it('tracks page and mount events, combines DCA and funnel tracking', () => {
    const funnelEvent = vi.spyOn(funnelTracker, 'trackEvent').mockImplementation(() => undefined);
    const analyticsEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);
    renderHook(() => useFunnelPageView('dca-page', 'user-2'));
    renderHook(() => useFunnelEvent('dca_create_sheet_opened', { variant: 'compact' }, 'user-2'));
    const combined = renderHook(() => useDCATracking('user-2')).result.current;

    act(() => combined.trackEvent('dca_plan_created', { planId: 'plan-1' }));

    expect(funnelEvent).toHaveBeenCalledWith('page_view', 'user-2', { page: 'dca-page' });
    expect(funnelEvent).toHaveBeenCalledWith('dca_create_sheet_opened', 'user-2', {
      variant: 'compact',
    });
    expect(funnelEvent).toHaveBeenCalledWith('dca_plan_created', 'user-2', { planId: 'plan-1' });
    expect(analyticsEvent).toHaveBeenCalledWith('dca_plan_created', { planId: 'plan-1' });
  });

  it('returns all funnel metrics, handles lookup errors and formats debug output', () => {
    const getAnalytics = vi.spyOn(funnelTracker, 'getFunnelAnalytics').mockReturnValue({
      funnelId: 'wallet_to_creation',
      totalSessions: 4,
      completedSessions: 2,
      completionRate: 0.5,
      avgCompletionTime: 1200,
      medianCompletionTime: 1000,
      stepAnalytics: [
        {
          stepId: 'entry',
          stepName: 'Entry',
          reached: 4,
          completed: 3,
          completionRate: 0.75,
          avgTimeToComplete: 500,
          dropoutRate: 0.25,
        },
      ],
      dropoutAnalysis: [{ step: 'entry', count: 1, rate: 0.25, avgTimeBeforeDropout: 300 }],
    });
    const all = renderHook(() => useAllFunnelAnalytics()).result.current;
    const debug = renderHook(() => useFunnelDebug('wallet_to_creation')).result.current;

    expect(all.walletToCreation?.totalSessions).toBe(4);
    expect(all.pairDetailToCreation?.funnelId).toBe('wallet_to_creation');
    expect(debug).toMatchObject({
      completionRate: '50.00%',
      avgCompletionTime: '1.20s',
      steps: [{ rate: '75.00%', avgTime: '0.50s', dropout: '25.00%' }],
      dropouts: [{ step: 'entry', rate: '25.00%' }],
    });

    getAnalytics.mockImplementation(() => {
      throw new Error('temporarily unavailable');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(renderHook(() => useFunnelAnalytics('wallet_to_creation')).result.current).toBeNull();
    expect(renderHook(() => useFunnelDebug('wallet_to_creation')).result.current).toBeNull();
    expect(error).toHaveBeenCalledWith('[useFunnelAnalytics] Error:', expect.any(Error));
  });

  it('cleans old funnel sessions immediately and on the hourly interval', () => {
    vi.useFakeTimers();
    const clean = vi.spyOn(funnelTracker, 'cleanOldSessions').mockImplementation(() => undefined);
    const hook = renderHook(({ maxAge }) => useCleanOldSessions(maxAge), {
      initialProps: { maxAge: 6000 },
    });

    expect(clean).toHaveBeenCalledWith(6000);
    act(() => vi.advanceTimersByTime(3_600_000));
    expect(clean).toHaveBeenCalledTimes(2);
    hook.unmount();
    act(() => vi.advanceTimersByTime(3_600_000));
    expect(clean).toHaveBeenCalledTimes(2);
  });
});
