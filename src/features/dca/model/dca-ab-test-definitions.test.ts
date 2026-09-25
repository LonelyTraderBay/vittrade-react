import { describe, expect, it } from 'vitest';
import { AB_TESTS, getActiveTests, getTestByFlagKey, getTestById } from './dca-ab-test-definitions';

describe('DCA A/B test definitions', () => {
  it('looks up each experiment by ID and feature flag key', () => {
    expect(AB_TESTS).toHaveLength(5);
    expect(getTestById('dca_wallet_shortcut_v1')?.id).toBe('dca_wallet_shortcut_v1');
    expect(getTestByFlagKey('dca_shortcut_variant')?.id).toBe('dca_wallet_shortcut_v1');
    expect(getTestByFlagKey('dca_onboarding_flow')?.id).toBe('dca_onboarding_v1');
    expect(getTestByFlagKey('dca_frequency_presets')?.id).toBe('dca_frequency_v1');
    expect(getTestByFlagKey('dca_create_form_layout')?.id).toBe('dca_form_layout_v1');
    expect(getTestByFlagKey('dca_pair_detail_placement')?.id).toBe('dca_pair_detail_placement_v1');
    expect(getTestById('missing')).toBeUndefined();
    expect(getTestByFlagKey('unknown_flag')).toBeUndefined();
  });

  it('returns only active experiments', () => {
    expect(getActiveTests().map((test) => test.id)).toEqual([
      'dca_wallet_shortcut_v1',
      'dca_pair_detail_placement_v1',
    ]);
  });
});
