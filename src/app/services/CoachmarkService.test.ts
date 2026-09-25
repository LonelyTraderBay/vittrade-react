import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { CoachmarkService, type CoachmarkScreen } from './CoachmarkService';

describe('CoachmarkService storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('restores persisted coachmark state and saves updates through browser storage', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({ seen: [], dismissed: [], disabled: false, lastShown: 0 }),
    );
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const service = new CoachmarkService();
    const coachmark = service.getAllDefinitions()[0];

    expect(service.getState()).toMatchObject({ disabled: false, seen: [], dismissed: [] });
    service.markSeen(coachmark.id);

    expect(service.getState().seen).toContain(coachmark.id);
    expect(setItem).toHaveBeenCalledWith(
      'app_coachmark_state',
      expect.stringContaining(coachmark.id),
    );
  });

  it('falls back to empty state when persisted JSON is invalid', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{invalid');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const service = new CoachmarkService();

    expect(service.getState()).toEqual({
      seen: [],
      dismissed: [],
      disabled: false,
      lastShown: 0,
    });
    expect(warn).toHaveBeenCalledWith('Failed to load coachmark state:', expect.any(SyntaxError));
  });
});

describe('CoachmarkService queries and updates', () => {
  afterEach(() => vi.restoreAllMocks());

  it('filters a screen and sorts coachmarks by priority then order', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new CoachmarkService();

    expect(service.getForScreen('p2p').map(({ id }) => id)).toEqual([
      'p2p-escrow-safety',
      'p2p-anti-scam',
    ]);
    expect(service.getForScreen('home').map(({ id }) => id)).toEqual([
      'home-modules-overview',
      'home-prediction-entry',
      'home-arena-entry',
    ]);
    expect(service.getNextForScreen('p2p')?.id).toBe('p2p-escrow-safety');
    expect(service.getNextForScreen('markets')).toBeNull();
    expect(service.hasUnseenForScreen('home')).toBe(true);
    expect(service.hasUnseenForScreen('markets')).toBe(false);
  });

  it('marks coachmarks as seen once and updates the last shown time', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const service = new CoachmarkService();
    vi.spyOn(Date, 'now').mockReturnValue(1234);

    service.markSeen('home-modules-overview');
    service.markSeen('home-modules-overview');

    expect(service.getState()).toMatchObject({
      seen: ['home-modules-overview'],
      lastShown: 1234,
    });
    expect(service.hasUnseenForScreen('home')).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('dismisses one or all coachmarks for a screen without duplicates', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new CoachmarkService();

    service.dismiss('home-modules-overview');
    service.dismiss('home-modules-overview');
    expect(service.getNextForScreen('home')?.id).toBe('home-prediction-entry');

    service.dismissAllForScreen('home');
    expect(service.getForScreen('home')).toEqual([]);
    expect(service.getState().dismissed).toEqual([
      'home-modules-overview',
      'home-prediction-entry',
      'home-arena-entry',
    ]);
  });

  it('hides all tips while disabled and restores them after reset', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new CoachmarkService();

    service.setDisabled(true);
    expect(service.isDisabled()).toBe(true);
    expect(service.getForScreen('home')).toEqual([]);

    service.markSeen('home-modules-overview');
    service.dismiss('home-prediction-entry');
    service.resetAll();

    expect(service.getState()).toEqual({
      seen: [],
      dismissed: [],
      disabled: false,
      lastShown: 0,
    });
    expect(service.getForScreen('home')).toHaveLength(3);
  });

  it('returns a copy of coachmark definitions for configured screens', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new CoachmarkService();
    const definitions = service.getAllDefinitions();
    const screens: CoachmarkScreen[] = [
      'home',
      'trade',
      'wallet',
      'profile',
      'p2p',
      'predictions',
      'arena',
      'dca',
    ];

    expect(definitions).not.toBe(service.getAllDefinitions());
    expect(new Set(definitions.map(({ screen }) => screen))).toEqual(new Set(screens));
  });
});
