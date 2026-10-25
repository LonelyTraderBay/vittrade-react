import { createHash } from 'node:crypto';

/** Preserve raw bindings by default; Git text normalization is opt-in for protected instructions. */
export function sourceContentHash(bytes, { normalization, allowGitTextLf = false } = {}) {
  let content = bytes;
  if (normalization !== undefined) {
    if (normalization !== 'git-text-lf' || !allowGitTextLf)
      throw new Error('Git text normalization requires a protected instruction binding.');
    const text = bytes.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(bytes))
      throw new Error('Invalid UTF-8 instruction text.');
    const normalized = text.replaceAll('\r\n', '\n');
    if (normalized.includes('\r')) throw new Error('Unsupported lone CR in instruction text.');
    content = Buffer.from(normalized, 'utf8');
  }
  return createHash('sha256').update(content).digest('hex');
}
