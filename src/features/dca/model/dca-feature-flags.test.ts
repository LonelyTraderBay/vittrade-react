import { describe, expect, it } from 'vitest';
import {
  DCAABTestFlag,
  DCAFeatureFlag,
  DEFAULT_DCA_AB_TEST_FLAGS,
  DEFAULT_DCA_FEATURE_FLAGS,
} from './dca-feature-flags';

describe('DCA feature flag definitions', () => {
  it('defines one default for each DCA feature flag', () => {
    expect(Object.keys(DEFAULT_DCA_FEATURE_FLAGS).sort()).toEqual(
      Object.values(DCAFeatureFlag).sort(),
    );

    for (const [key, flag] of Object.entries(DEFAULT_DCA_FEATURE_FLAGS)) {
      expect(flag.key).toBe(key);
      expect(flag.rolloutPercentage).toBe(flag.enabled ? 100 : 0);
    }
  });

  it('defines one default for each DCA experiment and keeps weights at 100 percent', () => {
    expect(Object.keys(DEFAULT_DCA_AB_TEST_FLAGS).sort()).toEqual(
      Object.values(DCAABTestFlag).sort(),
    );

    for (const [key, flag] of Object.entries(DEFAULT_DCA_AB_TEST_FLAGS)) {
      expect(flag.key).toBe(key);
      expect(flag.variants?.reduce((weight, variant) => weight + variant.weight, 0)).toBe(100);
    }
  });

  it('keeps public experiment defaults stable for existing DCA consumers', () => {
    expect(DEFAULT_DCA_FEATURE_FLAGS[DCAFeatureFlag.DCA_ENABLED].enabled).toBe(true);
    expect(DEFAULT_DCA_FEATURE_FLAGS[DCAFeatureFlag.DCA_ADVANCED_OPTIONS].enabled).toBe(false);
    expect(DEFAULT_DCA_AB_TEST_FLAGS[DCAABTestFlag.DCA_SHORTCUT_VARIANT].defaultVariant).toBe(
      'full',
    );
  });
});
