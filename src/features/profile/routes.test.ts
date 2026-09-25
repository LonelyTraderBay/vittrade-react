import { describe, expect, it } from 'vitest';
import { createProfileRoutes } from './routes';

describe('Profile feature routes', () => {
  it('owns contract-backed account management URLs', () => {
    expect(createProfileRoutes().map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'profile/edit',
        'profile/security',
        'profile/activity',
        'profile/devices',
        'profile/sub-accounts',
      ]),
    );
  });
});
