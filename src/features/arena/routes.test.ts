import { describe, expect, it } from 'vitest';
import { createArenaRoutes } from './routes';

const Stub = () => null;

describe('Arena feature routes', () => {
  it('owns the contract-backed mode and challenge URLs', () => {
    expect(
      createArenaRoutes({ mode: Stub, challenge: Stub, join: Stub }).map((route) => route.path),
    ).toEqual(['arena/mode/:modeId', 'arena/challenge/:challengeId', 'arena/join/:challengeId']);
  });
});
