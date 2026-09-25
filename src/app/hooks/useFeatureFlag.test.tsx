import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { featureFlags } from '../services/FeatureFlagService';
import { DCAABTestFlag, DCAFeatureFlag } from '@/features/dca/model/dca-feature-flags';
import {
  useABTestVariant,
  useAllDCAFlags,
  useConditionalRender,
  useDCAAssetDetailButton,
  useDCADeepLinking,
  useDCAEnabled,
  useDCAShortcutVariant,
  useDCAWalletShortcut,
  useFeatureFlag,
  useFeatureFlagUtils,
  useFeatureFlagValue,
  useFeatureFlags,
  useVariantRender,
} from './useFeatureFlag';

describe('useFeatureFlag subscription', () => {
  afterEach(() => {
    featureFlags.clearOverrides();
    vi.restoreAllMocks();
  });

  it('updates consumers when the service override changes', () => {
    const { result } = renderHook(() => useFeatureFlag(DCAFeatureFlag.DCA_ENABLED));

    expect(result.current).toBe(true);

    act(() => {
      featureFlags.override(DCAFeatureFlag.DCA_ENABLED, false);
    });

    expect(result.current).toBe(false);
  });

  it('reads fallback values and reacts to value overrides', () => {
    const { result } = renderHook(() => useFeatureFlagValue('missing_flag', 'fallback'));
    expect(result.current).toBe('fallback');

    act(() => {
      featureFlags.override('missing_flag', 'configured');
    });

    expect(result.current).toBe('configured');
  });

  it('subscribes multiple flag consumers to the same store revision', () => {
    const keys = [DCAFeatureFlag.DCA_ENABLED, DCAFeatureFlag.DCA_ADVANCED_OPTIONS];
    const { result } = renderHook(() => useFeatureFlags(keys));

    expect(result.current).toEqual({
      [DCAFeatureFlag.DCA_ENABLED]: true,
      [DCAFeatureFlag.DCA_ADVANCED_OPTIONS]: false,
    });

    act(() => {
      featureFlags.override(DCAFeatureFlag.DCA_ENABLED, false);
      featureFlags.override(DCAFeatureFlag.DCA_ADVANCED_OPTIONS, true);
    });

    expect(result.current).toEqual({
      [DCAFeatureFlag.DCA_ENABLED]: false,
      [DCAFeatureFlag.DCA_ADVANCED_OPTIONS]: true,
    });
  });

  it('returns a stable A/B variant assignment', () => {
    const { result } = renderHook(() => useABTestVariant(DCAABTestFlag.DCA_SHORTCUT_VARIANT));
    expect(['full', 'compact']).toContain(result.current);
  });

  it('exposes override, clear, refresh and diagnostics utilities', async () => {
    const refresh = vi.spyOn(featureFlags, 'refresh').mockResolvedValue();
    const { result } = renderHook(() => useFeatureFlagUtils());

    act(() => result.current.override('utility_flag', true));
    expect(featureFlags.isEnabled('utility_flag')).toBe(true);

    await act(async () => result.current.refresh());
    expect(refresh).toHaveBeenCalledOnce();
    expect(result.current.getDebugInfo()).toHaveProperty('flags');

    act(() => result.current.clearOverrides());
    expect(featureFlags.isEnabled('utility_flag')).toBe(false);
  });

  it('composes DCA kill switches and exposes the full DCA flag map', () => {
    const { result } = renderHook(() => ({
      enabled: useDCAEnabled(),
      walletShortcut: useDCAWalletShortcut(),
      assetDetailButton: useDCAAssetDetailButton(),
      deepLinking: useDCADeepLinking(),
      shortcutVariant: useDCAShortcutVariant(),
      flags: useAllDCAFlags(),
    }));

    expect(result.current).toMatchObject({
      enabled: true,
      walletShortcut: true,
      assetDetailButton: true,
      deepLinking: true,
      flags: { isEnabled: true, walletShortcut: true, assetDetailButton: true },
    });
    expect(['full', 'compact']).toContain(result.current.shortcutVariant);

    act(() => featureFlags.override(DCAFeatureFlag.DCA_ENABLED, false));

    expect(result.current.enabled).toBe(false);
    expect(result.current.walletShortcut).toBe(false);
    expect(result.current.assetDetailButton).toBe(false);
    expect(result.current.deepLinking).toBe(false);
    expect(result.current.flags.isEnabled).toBe(false);
  });

  it('falls back to the default DCA shortcut variant for unknown assignments', () => {
    vi.spyOn(featureFlags, 'getVariant').mockReturnValue('unsupported');
    const { result } = renderHook(() => useDCAShortcutVariant());
    expect(result.current).toBe('full');
  });

  it('renders conditionally from a feature flag and resolves A/B variants', () => {
    vi.spyOn(featureFlags, 'getVariant').mockReturnValue('compact');
    const { result } = renderHook(() => ({
      conditional: useConditionalRender(DCAFeatureFlag.DCA_ENABLED),
      variant: useVariantRender(DCAABTestFlag.DCA_SHORTCUT_VARIANT),
    }));

    expect(result.current.conditional('visible')).toBe('visible');
    expect(result.current.variant.variant).toBe('compact');
    expect(result.current.variant.renderVariant({ compact: 'compact', default: 'default' })).toBe(
      'compact',
    );

    act(() => featureFlags.override(DCAFeatureFlag.DCA_ENABLED, false));
    expect(result.current.conditional('visible')).toBeNull();
  });

  it('falls back to the default or null when an A/B variant is not configured', () => {
    vi.spyOn(featureFlags, 'getVariant').mockReturnValue('unconfigured');
    const { result } = renderHook(() => useVariantRender('unknown_experiment'));

    expect(result.current.renderVariant({ default: 'fallback' })).toBe('fallback');
    expect(result.current.renderVariant({})).toBeNull();
  });
});
