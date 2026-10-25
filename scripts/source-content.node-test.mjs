import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { sourceContentHash } from './source-content.mjs';

const lf = Buffer.from('# Hướng dẫn\nGiữ nguyên nội dung.\n');
const crlf = Buffer.from(lf.toString().replaceAll('\n', '\r\n'));
const protectedBinding = { normalization: 'git-text-lf', allowGitTextLf: true };

test('raw bindings preserve the exact bytes for ordinary source', () => {
  assert.notEqual(sourceContentHash(lf), sourceContentHash(crlf));
  assert.equal(sourceContentHash(lf), createHash('sha256').update(lf).digest('hex'));
});

test('protected LF/CRLF bindings agree with the actual Git clean policy', () => {
  const gitHash = (bytes) =>
    execFileSync('git', ['hash-object', '--path=AGENTS.md', '--stdin'], {
      input: bytes,
      encoding: 'utf8',
    }).trim();
  assert.equal(gitHash(lf), gitHash(crlf));
  assert.equal(sourceContentHash(crlf, protectedBinding), sourceContentHash(lf));
  assert.equal(sourceContentHash(lf, protectedBinding), sourceContentHash(lf));
});

test('normalization cannot be selected for an ordinary source binding', () => {
  assert.throws(() => sourceContentHash(crlf, { normalization: 'git-text-lf' }), /protected/);
  assert.throws(() => sourceContentHash(crlf, { ...protectedBinding, normalization: 'trim' }));
});

test('content, whitespace and final newline mutations still invalidate the binding', () => {
  const expected = sourceContentHash(lf, protectedBinding);
  for (const text of [
    lf.toString().replace('Giữ', 'Sửa'),
    lf.toString().replace('nội dung', 'nội  dung'),
    lf.toString().trimEnd(),
    lf.toString() + '\n',
  ])
    assert.notEqual(sourceContentHash(Buffer.from(text), protectedBinding), expected);
});

test('BOM remains part of the content rather than being silently discarded', () => {
  const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), lf]);
  assert.notEqual(
    sourceContentHash(bom, protectedBinding),
    sourceContentHash(lf, protectedBinding),
  );
});

test('invalid UTF-8 and lone CR instruction text fail closed', () => {
  assert.throws(() => sourceContentHash(Buffer.from([0xff]), protectedBinding), /UTF-8/);
  assert.throws(() => sourceContentHash(Buffer.from('a\rb'), protectedBinding), /lone CR/);
});
