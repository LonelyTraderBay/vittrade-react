import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { dcaAnalytics } from './dca-analytics-service';
import { WALLET_SHORTCUT_TEST } from './dca-ab-test-definitions';
import { ABTestAnalyticsService } from './dca-ab-test-analytics';

describe('ABTestAnalyticsService', () => {
  const services: ABTestAnalyticsService[] = [];

  afterEach(() => {
    services.splice(0).forEach((service) => service.clearAllData());
    vi.restoreAllMocks();
  });

  function createService() {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const service = new ABTestAnalyticsService();
    services.push(service);
    return service;
  }

  it('records one exposure per user and associates conversions with the assigned variant', () => {
    const service = createService();
    const trackEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);

    service.trackExposure(WALLET_SHORTCUT_TEST.id, 'full', 'user-1');
    service.trackExposure(WALLET_SHORTCUT_TEST.id, 'compact', 'user-1');
    expect(service.hasExposure(`${WALLET_SHORTCUT_TEST.id}:user-1`)).toBe(true);
    expect(service.getUserVariant(WALLET_SHORTCUT_TEST.id, 'user-1')).toBe('full');
    service.trackConversion(WALLET_SHORTCUT_TEST.id, 'Click-Through Rate', 'user-1', 120);

    expect(service.exportData().exposures).toHaveLength(1);
    expect(service.exportData().conversions).toMatchObject([
      {
        testId: WALLET_SHORTCUT_TEST.id,
        variantId: 'full',
        metricName: 'Click-Through Rate',
        value: 120,
      },
    ]);
    expect(trackEvent).toHaveBeenCalledWith(
      'ab_test_exposure',
      expect.objectContaining({ variant_id: 'full' }),
    );
    expect(trackEvent).toHaveBeenCalledWith(
      'ab_test_conversion',
      expect.objectContaining({ value: 120 }),
    );
  });

  it('calculates conversion, revenue and a winner only after reaching sample thresholds', () => {
    const service = createService();
    vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);
    const [control, variant] = WALLET_SHORTCUT_TEST.variants;

    for (let index = 0; index < 100; index += 1) {
      const controlUser = `control-${index}`;
      const variantUser = `variant-${index}`;
      service.trackExposure(WALLET_SHORTCUT_TEST.id, control.id, controlUser);
      service.trackExposure(WALLET_SHORTCUT_TEST.id, variant.id, variantUser);
      if (index < 10) {
        service.trackConversion(WALLET_SHORTCUT_TEST.id, 'Click-Through Rate', controlUser, 10);
      }
      if (index < 60) {
        service.trackConversion(WALLET_SHORTCUT_TEST.id, 'Click-Through Rate', variantUser, 20);
      }
    }

    const results = service.getTestResults(WALLET_SHORTCUT_TEST);
    expect(results.winner).toBe('compact');
    expect(results.significance).toBeGreaterThanOrEqual(WALLET_SHORTCUT_TEST.targetSignificance);
    expect(results.variants).toMatchObject([
      {
        variantId: 'full',
        exposures: 100,
        conversions: 10,
        conversionRate: 0.1,
        revenue: 100,
        arpu: 1,
      },
      {
        variantId: 'compact',
        exposures: 100,
        conversions: 60,
        conversionRate: 0.6,
        revenue: 1200,
        arpu: 12,
      },
    ]);
    expect(results.lastUpdated).toBeInstanceOf(Date);
  });

  it('warns when conversions arrive before exposure and returns empty test results', () => {
    const service = createService();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    service.trackConversion(WALLET_SHORTCUT_TEST.id, 'Click-Through Rate', 'unknown-user');
    const results = service.getTestResults(WALLET_SHORTCUT_TEST);

    expect(warning).toHaveBeenCalledWith(expect.stringContaining('No variant found'));
    expect(results.winner).toBeUndefined();
    expect(results.significance).toBe(0);
    expect(results.variants.every((variant) => variant.exposures === 0)).toBe(true);
    expect(service.getUserVariant(WALLET_SHORTCUT_TEST.id, 'unknown-user')).toBeUndefined();
  });

  it('clears a single test or all analytics and serializes data to safe storage', () => {
    const service = createService();
    const setItem = vi.spyOn(browserStorage.local, 'setItem');
    service.trackExposure(WALLET_SHORTCUT_TEST.id, 'full', 'user-1');
    service.trackConversion(WALLET_SHORTCUT_TEST.id, 'Click-Through Rate', 'user-1', 1);

    expect(setItem).toHaveBeenCalledWith('ab_test_analytics', expect.stringContaining('user-1'));
    service.clearTestData(WALLET_SHORTCUT_TEST.id);
    expect(service.exportData()).toEqual({ exposures: [], conversions: [] });
    service.trackExposure('another-test', 'control', 'user-2');
    service.clearAllData();
    expect(service.exportData()).toEqual({ exposures: [], conversions: [] });
  });

  it('restores persisted results and safely handles malformed stored data', () => {
    const savedData = {
      exposures: [
        [
          WALLET_SHORTCUT_TEST.id,
          [{ testId: WALLET_SHORTCUT_TEST.id, variantId: 'full', userId: 'saved' }],
        ],
      ],
      conversions: [],
      userVariants: [[WALLET_SHORTCUT_TEST.id, [['saved', 'full']]]],
    };
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(JSON.stringify(savedData));
    const restored = new ABTestAnalyticsService();
    services.push(restored);
    expect(restored.getUserVariant(WALLET_SHORTCUT_TEST.id, 'saved')).toBe('full');
    expect(restored.exportData().exposures).toHaveLength(1);

    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{bad-json');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const malformed = new ABTestAnalyticsService();
    services.push(malformed);
    expect(malformed.exportData()).toEqual({ exposures: [], conversions: [] });
    expect(error).toHaveBeenCalledWith(
      '[ABTestAnalytics] Failed to load:',
      expect.any(SyntaxError),
    );
  });

  it('reports storage write failures without interrupting tracking', () => {
    const service = createService();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('storage denied');
    });

    service.trackExposure(WALLET_SHORTCUT_TEST.id, 'full', 'user-1');

    expect(service.getUserVariant(WALLET_SHORTCUT_TEST.id, 'user-1')).toBe('full');
    expect(error).toHaveBeenCalledWith('[ABTestAnalytics] Failed to save:', expect.any(Error));
  });
});
