import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearMutationAttempt,
  getMutationAttemptKey,
  type MutationAttempts,
} from './mutation-attempts';

describe('market mutation attempts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reuses a key for the same request and creates a new key when the request changes', () => {
    const attempts: MutationAttempts = new Map();
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('attempt-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('attempt-2' as `${string}-${string}-${string}-${string}-${string}`);

    const firstKey = getMutationAttemptKey(attempts, 'pair-1', 'create:pair-1', 'market-watchlist');

    expect(getMutationAttemptKey(attempts, 'pair-1', 'create:pair-1', 'market-watchlist')).toBe(
      firstKey,
    );
    expect(getMutationAttemptKey(attempts, 'pair-1', 'delete:pair-1', 'market-watchlist')).toBe(
      'market-watchlist-attempt-2',
    );
    expect(firstKey).toBe('market-watchlist-attempt-1');
  });

  it('clears only the attempt matching the completed request signature', () => {
    const attempts: MutationAttempts = new Map([
      ['pair-1', { signature: 'create:pair-1', key: 'market-watchlist-attempt-1' }],
    ]);

    clearMutationAttempt(attempts, 'pair-1', 'delete:pair-1');
    expect(attempts.has('pair-1')).toBe(true);

    clearMutationAttempt(attempts, 'pair-1', 'create:pair-1');
    expect(attempts.has('pair-1')).toBe(false);
  });
});
