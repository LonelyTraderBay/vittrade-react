import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  classifySourceHead,
  compareRecordedSourceHashes,
  hasCurrentSourceProvenance,
} from './scenario-evidence-provenance.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('scenario evidence provenance', () => {
  it('accepts a runner captured at the current HEAD when every input hash matches', () => {
    const currentHead = 'c'.repeat(40);
    const source = Buffer.from('current source bytes\n');
    const sourceHashes = { 'src/example.ts': hash(source) };
    const check = compareRecordedSourceHashes(sourceHashes, () => source);

    expect(classifySourceHead(currentHead, currentHead, 'b'.repeat(40))).toBe('current');
    expect(
      hasCurrentSourceProvenance({
        sourceHead: currentHead,
        currentHead,
        ...check,
      }),
    ).toBe(true);
  });

  it('rejects a non-EOL source byte change against the recorded hash', () => {
    const currentHead = 'c'.repeat(40);
    const recordedSource = Buffer.from('const value = 1;\n');
    const changedSource = Buffer.from('const value = 2;\n');
    const check = compareRecordedSourceHashes(
      { 'src/example.ts': hash(recordedSource) },
      () => changedSource,
    );

    expect(check.sourceHashMismatches).toEqual(['src/example.ts']);
    expect(
      hasCurrentSourceProvenance({
        sourceHead: currentHead,
        currentHead,
        ...check,
      }),
    ).toBe(false);
  });

  it('classifies baseline evidence as historical even when its input hashes match', () => {
    expect(classifySourceHead('b'.repeat(40), 'c'.repeat(40), 'b'.repeat(40))).toBe(
      'historical_baseline',
    );
  });
});
