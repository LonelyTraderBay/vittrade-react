import { createHash } from 'node:crypto';

export function compareRecordedSourceHashes(recordedHashes, readSource) {
  const entries = Object.entries(recordedHashes);
  const sourceHashMismatches = entries
    .filter(([relativePath, expectedHash]) => {
      const source = readSource(relativePath);
      return source === null || createHash('sha256').update(source).digest('hex') !== expectedHash;
    })
    .map(([relativePath]) => relativePath)
    .sort();

  return {
    sourceHashCount: entries.length,
    sourceHashMismatches,
  };
}

export function hasCurrentSourceProvenance({
  sourceHead,
  currentHead,
  sourceHashCount,
  sourceHashMismatches,
}) {
  return sourceHead === currentHead && sourceHashCount > 0 && sourceHashMismatches.length === 0;
}

export function classifySourceHead(sourceHead, currentHead, baselineHead) {
  if (sourceHead === currentHead) return 'current';
  if (sourceHead === baselineHead) return 'historical_baseline';
  return 'other_or_unknown';
}
