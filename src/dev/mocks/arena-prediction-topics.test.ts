import { describe, expect, it } from 'vitest';
import { mapArenaTagToTopic, mapCategoryToTopic } from './arena-prediction-topics';

describe('Arena and prediction topic mapping', () => {
  it('maps supported prediction categories and rejects unknown categories', () => {
    expect(mapCategoryToTopic('Live Crypto')).toBe('crypto');
    expect(mapCategoryToTopic('Finance')).toBe('macro');
    expect(mapCategoryToTopic('unknown')).toBeNull();
  });

  it('matches Arena tags case-insensitively and rejects unrelated tags', () => {
    expect(mapArenaTagToTopic('BTC Crypto')).toBe('crypto');
    expect(mapArenaTagToTopic('SPORTS league')).toBe('sports');
    expect(mapArenaTagToTopic('unrelated')).toBeNull();
  });
});
