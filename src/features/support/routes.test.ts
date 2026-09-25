import { describe, expect, it } from 'vitest';
import { createSupportProtectedRoutes, createSupportPublicRoutes } from './routes';

describe('Support feature routes', () => {
  it('keeps news public', () => {
    expect(createSupportPublicRoutes().map((route) => route.path)).toContain('news');
  });

  it('owns authenticated support routes', () => {
    expect(createSupportProtectedRoutes().map((route) => route.path)).toEqual(
      expect.arrayContaining(['notifications', 'support/help', 'support/announcements', 'support']),
    );
  });
});
