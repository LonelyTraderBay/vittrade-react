import { describe, expect, it } from 'vitest';
import { createDiscoveryRoutes } from './routes';

describe('Discovery feature routes', () => {
  it('owns unified search and topic URLs', () => {
    expect(createDiscoveryRoutes().map((route) => route.path)).toEqual(
      expect.arrayContaining(['search', 'topics', 'topic/:topicId']),
    );
  });
});
