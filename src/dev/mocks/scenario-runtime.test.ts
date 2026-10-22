import { env } from '@/shared/config/env';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateOrderBook } from './trading-fixtures';
import {
  configureDevMockScenario,
  devMockNowIso,
  devMockNowMs,
  getDevPreviewScenario,
  nextDevMockId,
  nextDevMockRandom,
  resetDevMockRuntime,
  setDevPreviewScenario,
} from './scenario-runtime';

const originalDevtoolsEnabled = env.enableDevtools;
function setDevtoolsEnabled(value: boolean) {
  Object.defineProperty(env, 'enableDevtools', { configurable: true, value });
}

beforeEach(() => setDevtoolsEnabled(true));
afterEach(() => {
  setDevtoolsEnabled(originalDevtoolsEnabled);
  resetDevMockRuntime();
});

describe('development mock scenario runtime', () => {
  it('ignores a persisted override while diagnostics are disabled and restores it only on explicit opt-in', () => {
    const scenario = { domain: 'wallet', state: 'forbidden' } as const;
    setDevPreviewScenario(scenario);
    setDevtoolsEnabled(false);
    expect(getDevPreviewScenario()).toBeNull();
    setDevtoolsEnabled(true);
    expect(getDevPreviewScenario()).toEqual(scenario);
  });

  it('replays IDs and seeded fixture values after a reset', () => {
    configureDevMockScenario({ seed: 7123 });
    const firstId = nextDevMockId('order');
    const firstRandomValues = [nextDevMockRandom(), nextDevMockRandom(), nextDevMockRandom()];
    const firstOrderBook = generateOrderBook(65_000);

    resetDevMockRuntime();
    configureDevMockScenario({ seed: 7123 });

    expect(nextDevMockId('order')).toBe(firstId);
    expect([nextDevMockRandom(), nextDevMockRandom(), nextDevMockRandom()]).toEqual(
      firstRandomValues,
    );
    expect(generateOrderBook(65_000)).toEqual(firstOrderBook);
  });

  it('uses the configured scenario clock for timestamps and relative expiry calculations', () => {
    const fixedTime = Date.parse('2026-09-27T20:00:00.000Z');
    configureDevMockScenario({ now: fixedTime });

    expect(devMockNowMs()).toBe(fixedTime);
    expect(devMockNowIso()).toBe('2026-09-27T20:00:00.000Z');
    expect(new Date(devMockNowMs() + 5 * 60 * 1000).toISOString()).toBe('2026-09-27T20:05:00.000Z');
  });

  it('allows a scenario to choose a different seed without sharing random state', () => {
    configureDevMockScenario({ seed: 10 });
    const first = nextDevMockRandom();
    configureDevMockScenario({ seed: 11 });

    expect(nextDevMockRandom()).not.toBe(first);
  });

  it('persists a selectable API scenario and clears it during reset', () => {
    const scenario = { domain: 'wallet', state: 'forbidden' } as const;
    setDevPreviewScenario(scenario);

    expect(getDevPreviewScenario()).toEqual(scenario);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'vittrade.dev-preview.scenario',
      JSON.stringify(scenario),
    );

    resetDevMockRuntime();

    expect(getDevPreviewScenario()).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('vittrade.dev-preview.scenario');
  });
});
