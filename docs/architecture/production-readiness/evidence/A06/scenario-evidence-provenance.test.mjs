import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  classifySourceHead,
  compareRecordedSourceHashes,
  hashTrackedBytes,
  hasCurrentSourceProvenance,
} from './scenario-evidence-provenance.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('scenario evidence provenance', () => {
  it('keeps evidence current when its recorded revision advances but source bytes still match', () => {
    const sourceHead = 'c'.repeat(40);
    const source = Buffer.from('current source bytes\r\n');
    const sourceHashes = { 'src/example.ts': hash(source) };
    const check = compareRecordedSourceHashes(sourceHashes, () =>
      Buffer.from('current source bytes\n'),
    );

    expect(classifySourceHead(sourceHead, 'b'.repeat(40))).toBe('recorded_revision');
    expect(hasCurrentSourceProvenance({ sourceHead, ...check })).toBe(true);
  });

  it('rejects a source byte change against its recorded hash', () => {
    const sourceHead = 'c'.repeat(40);
    const recordedSource = Buffer.from('const value = 1;\r\n');
    const changedSource = Buffer.from('const value = 2;\n');
    const check = compareRecordedSourceHashes(
      { 'src/example.ts': hash(recordedSource) },
      () => changedSource,
    );

    expect(check.sourceHashMismatches).toEqual(['src/example.ts']);
    expect(hasCurrentSourceProvenance({ sourceHead, ...check })).toBe(false);
  });

  it('keeps baseline revision classification separate from source hash freshness', () => {
    const baselineHead = 'b'.repeat(40);
    const source = Buffer.from('unchanged source bytes\n');
    const check = compareRecordedSourceHashes({ 'src/example.ts': hash(source) }, () => source);

    expect(classifySourceHead(baselineHead, baselineHead)).toBe('historical_baseline');
    expect(hasCurrentSourceProvenance({ sourceHead: baselineHead, ...check })).toBe(true);
  });

  it('rejects missing hashes and malformed revision identifiers', () => {
    expect(
      hasCurrentSourceProvenance({
        sourceHead: 'not-a-commit',
        sourceHashCount: 0,
        sourceHashMismatches: [],
      }),
    ).toBe(false);
    expect(classifySourceHead(null, 'b'.repeat(40))).toBe('unknown');
  });

  it('hashes tracked text identically across LF and CRLF checkouts', () => {
    const lf = Buffer.from('const value = 1;\nnext();\n');
    const crlf = Buffer.from('const value = 1;\r\nnext();\r\n');

    expect(hashTrackedBytes(lf)).toBe(hashTrackedBytes(crlf));
    expect(hashTrackedBytes(lf)).not.toBe(
      hashTrackedBytes(Buffer.from('const value = 2;\nnext();\n')),
    );
  });
});
