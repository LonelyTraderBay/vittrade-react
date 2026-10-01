import { createHash } from 'node:crypto';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const decodeUtf8 = (bytes) => {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
};

export function hashTrackedBytes(bytes) {
  const text = decodeUtf8(bytes);
  return sha256(text === null ? bytes : Buffer.from(text.replace(/\r\n/g, '\n'), 'utf8'));
}

export function matchesRecordedSourceHash(expectedHash, source) {
  const text = decodeUtf8(source);
  if (text === null) return sha256(source) === expectedHash;

  const lfText = text.replace(/\r\n/g, '\n');
  const lineEndingVariants = [lfText, lfText.replace(/\n/g, '\r\n')];
  return lineEndingVariants.some(
    (variant) => sha256(Buffer.from(variant, 'utf8')) === expectedHash,
  );
}

export function compareRecordedSourceHashes(recordedHashes, readSource) {
  const entries = Object.entries(recordedHashes);
  const sourceHashMismatches = entries
    .filter(([relativePath, expectedHash]) => {
      const source = readSource(relativePath);
      return source === null || !matchesRecordedSourceHash(expectedHash, source);
    })
    .map(([relativePath]) => relativePath)
    .sort();

  return {
    sourceHashCount: entries.length,
    sourceHashMismatches,
  };
}

export function hasCurrentSourceProvenance({ sourceHead, sourceHashCount, sourceHashMismatches }) {
  return (
    typeof sourceHead === 'string' &&
    /^[a-f0-9]{40}$/i.test(sourceHead) &&
    sourceHashCount > 0 &&
    sourceHashMismatches.length === 0
  );
}

export function classifySourceHead(sourceHead, baselineHead) {
  if (typeof sourceHead !== 'string' || !/^[a-f0-9]{40}$/i.test(sourceHead)) return 'unknown';
  if (sourceHead === baselineHead) return 'historical_baseline';
  return 'recorded_revision';
}
