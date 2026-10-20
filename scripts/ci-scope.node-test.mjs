import assert from 'node:assert/strict';
import { lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  fullJobNames,
  hasFullGate,
  metadataPath,
  runtimeFingerprint,
  selectScope,
  verifyGate,
  verifyLedgerFormat,
  verifyReuseArtifact,
} from './ci-scope.mjs';

const input = {
  eventName: 'pull_request',
  paths: [metadataPath],
  beforeFingerprint: 'a',
  headFingerprint: 'a',
  checkoutFingerprint: 'a',
  baseIsAncestor: true,
  provenRunId: 123,
};
const fullNeeds = () => ({
  scope: { result: 'success', outputs: { mode: 'full' } },
  static: { result: 'success' },
  unit: { result: 'success' },
  browser: { result: 'success' },
  metadata: { result: 'skipped' },
});
const run = {
  head_sha: 'abc',
  event: 'pull_request',
  path: '.github/workflows/ci.yml',
  conclusion: 'success',
  pull_requests: [{ number: 3, base: { sha: 'base' }, head: { sha: 'abc' } }],
};
const jobs = () =>
  fullJobNames.map((name) => ({
    name,
    conclusion: 'success',
    steps: [{ name: 'Preserve verification reports', conclusion: 'success' }],
  }));

test('only progress metadata with identical inputs and proven full parent can reuse runtime', () => {
  assert.equal(selectScope(input).mode, 'metadata-only');
  assert.equal(selectScope(input).reusedRunId, '123');
});
for (const file of [
  'docs/ai/WORKFLOW.md',
  '.github/workflows/ci.yml',
  'package-lock.json',
  'src/shared/ui/CTAButton.tsx',
  'src/features/wallet/pages/WithdrawPage.tsx',
  'vitest.config.ts',
  'scripts/new-check.mjs',
  'unknown.md',
]) {
  test(`${file} and mixed changes retain full CI`, () => {
    assert.equal(selectScope({ ...input, paths: [file] }).mode, 'full');
    assert.equal(selectScope({ ...input, paths: [metadataPath, file] }).mode, 'full');
  });
}
for (const delta of [
  { eventName: 'push' },
  { eventName: 'unknown' },
  { paths: [] },
  { baseIsAncestor: false },
  { beforeFingerprint: 'b' },
  { checkoutFingerprint: 'b' },
  { provenRunId: null },
]) {
  test(`uncertain evidence fails closed: ${JSON.stringify(delta)}`, () =>
    assert.equal(selectScope({ ...input, ...delta }).mode, 'full'));
}
test('fingerprint excludes only TRACKING and includes mode/path/blob changes', () => {
  const entry = '100644 blob abc\tsrc/app.ts\0';
  const metadata = `100644 blob old\t${metadataPath}\0`;
  assert.equal(
    runtimeFingerprint(entry + metadata),
    runtimeFingerprint(entry + metadata.replace('old', 'new')),
  );
  for (const changed of [
    entry.replace('100644', '100755'),
    entry.replace('abc', 'def'),
    entry.replace('app.ts', 'app2.ts'),
    entry + '100644 blob abc\tdocs/ai/WORKFLOW.md\0',
  ]) {
    assert.notEqual(runtimeFingerprint(entry), runtimeFingerprint(changed));
  }
  assert.throws(() => runtimeFingerprint('bad entry'));
});
test('a complete exact-source full run is required, not a green metadata run', () => {
  assert.equal(hasFullGate(run, jobs(), 'abc', 3, 'base'), true);
  assert.equal(hasFullGate(run, jobs(), 'different', 3, 'base'), false);
  assert.equal(hasFullGate(run, jobs(), 'abc', 4, 'base'), false);
  assert.equal(
    hasFullGate(
      { ...run, pull_requests: [{ number: 3, head: { sha: 'new-pr-head' } }] },
      jobs(),
      'abc',
      3,
    ),
    true,
  );
  for (const delta of [
    { conclusion: 'failure' },
    { event: 'push' },
    { path: 'other.yml' },
    { pull_requests: [] },
  ]) {
    assert.equal(Boolean(hasFullGate({ ...run, ...delta }, jobs(), 'abc', 3, 'base')), false);
  }
  for (const conclusion of ['skipped', 'failure', 'cancelled', undefined]) {
    const changed = jobs();
    changed[1].conclusion = conclusion;
    assert.equal(hasFullGate(run, changed, 'abc', 3, 'base'), false);
  }
  assert.equal(hasFullGate(run, jobs().slice(1), 'abc', 3, 'base'), false);
  assert.equal(hasFullGate(run, [...jobs(), jobs()[0]], 'abc', 3, 'base'), false);
  const failedUpload = jobs();
  failedUpload[0].steps[0].conclusion = 'failure';
  assert.equal(hasFullGate(run, failedUpload, 'abc', 3, 'base'), false);
  failedUpload[0].steps[0].conclusion = 'skipped';
  assert.equal(hasFullGate(run, failedUpload, 'abc', 3, 'base'), false);
});
test('aggregate accepts exactly the jobs applicable to each scope', () => {
  assert.equal(verifyGate(fullNeeds()).mode, 'full');
  const metadata = fullNeeds();
  metadata.scope.outputs = {
    mode: 'metadata-only',
    reused_run_id: '123',
    runtime_fingerprint: 'a'.repeat(64),
  };
  metadata.metadata.result = 'success';
  for (const key of ['static', 'unit', 'browser']) metadata[key].result = 'skipped';
  assert.equal(verifyGate(metadata).reusedRunId, '123');
  delete metadata.scope.outputs.reused_run_id;
  assert.throws(() => verifyGate(metadata));
});
for (const job of ['scope', 'static', 'unit', 'browser']) {
  for (const result of ['skipped', 'failure', 'cancelled', undefined]) {
    test(`aggregate refuses ${job}: ${result}`, () => {
      const needs = fullNeeds();
      needs[job].result = result;
      assert.throws(() => verifyGate(needs));
      delete needs[job];
      assert.throws(() => verifyGate(needs));
    });
  }
}
test('missing scope, unexpected jobs and unproven metadata fail', () => {
  const needs = fullNeeds();
  needs.metadata.result = 'success';
  assert.throws(() => verifyGate(needs));
  needs.metadata.result = 'skipped';
  delete needs.scope.outputs.mode;
  assert.throws(() => verifyGate(needs));
});
test('coverage uses the identical Vitest invocation plus instrumentation', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['test:coverage'], `${pkg.scripts['test:run']} --coverage`);
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.ok(workflow.includes('npm run test:coverage -- --reporter=dot'));
  assert.ok(!workflow.includes('npm run test:run'));
  assert.ok(workflow.includes('if: always()'));
});

test('auth mock CI retains diagnostic contracts and separately verifies disabled defaults', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const step = workflow.split('      - name: Browser contract\n')[1]?.split('      - name:')[0];
  assert.ok(step?.includes('set -euo pipefail'));
  assert.ok(
    step?.includes('VITE_ENABLE_DEVTOOLS=true npm run test:e2e -- --config "$BROWSER_CONFIG"'),
  );
  assert.ok(
    step?.includes(
      'VITE_ENABLE_DEVTOOLS=false npm run test:e2e -- --config playwright.preview-defaults.config.ts',
    ),
  );
  const profile = readFileSync(
    new URL('../playwright.preview-defaults.config.ts', import.meta.url),
    'utf8',
  );
  assert.ok(profile.includes("process.env.VITE_ENABLE_DEVTOOLS !== 'false'"));
  assert.ok(profile.includes("testMatch: '**/auth-devtools-disabled-mock.spec.ts'"));
});

test('UI rollout runs in development MSW without replacing existing browser contracts', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.ok(
    workflow.includes(
      'VITE_ENABLE_DEVTOOLS=true npm run test:e2e -- --config playwright.ui-mock.config.ts',
    ),
  );
  const ui = readFileSync(new URL('../playwright.ui-mock.config.ts', import.meta.url), 'utf8');
  const smoke = readFileSync(new URL('../playwright.config.ts', import.meta.url), 'utf8');
  assert.ok(ui.includes("testMatch: '**/ui-*-mock.spec.ts'"));
  assert.ok(ui.includes('authMockConfig'));
  assert.ok(smoke.includes("'**/ui-*-mock.spec.ts'"));
});

test('ledger format preserves canonical writer bytes and rejects malformed/reformatted JSON', () => {
  const canonical = JSON.stringify({ evidenceIds: ['EV-1'], value: 'Tiếng Việt' }, null, 2) + '\n';
  assert.doesNotThrow(() => verifyLedgerFormat(canonical));
  for (const invalid of [
    '{',
    canonical.trim(),
    canonical.replaceAll('\n', '\r\n'),
    '{"value":1}\n',
  ]) {
    assert.throws(() => verifyLedgerFormat(invalid));
  }
});

test('immutable scope artifact proves runtime equivalence and rejects stale/tampered evidence', () => {
  const python = process.env.CI_SCOPE_TEST_PYTHON || 'python3';
  const scope = {
    mode: 'full',
    head: 'abc',
    headFingerprint: 'fp',
    checkoutFingerprint: 'fp',
    checkout: 'a'.repeat(40),
  };
  const result = spawnSync(
    python,
    [
      '-c',
      'import io,sys,zipfile\nb=io.BytesIO()\nwith zipfile.ZipFile(b,"w",zipfile.ZIP_DEFLATED) as z: z.writestr("ci/scope.json",sys.stdin.buffer.read())\nsys.stdout.buffer.write(b.getvalue())',
    ],
    { input: JSON.stringify(scope) },
  );
  assert.equal(result.status, 0);
  const bytes = result.stdout;
  const artifact = {
    expired: false,
    workflow_run: { id: 42 },
    size_in_bytes: bytes.length,
    digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    name: `production-scope-${scope.checkout}-1`,
  };
  const sourceRun = { id: 42, run_attempt: 1 };
  assert.deepEqual(verifyReuseArtifact(bytes, artifact, sourceRun, 'abc', 'fp', python), scope);
  for (const changed of [
    { expired: true },
    { digest: 'sha256:bad' },
    { size_in_bytes: 1 },
    { workflow_run: { id: 99 } },
    { name: 'wrong' },
  ]) {
    assert.throws(() =>
      verifyReuseArtifact(bytes, { ...artifact, ...changed }, sourceRun, 'abc', 'fp', python),
    );
  }
  assert.throws(() => verifyReuseArtifact(bytes, artifact, sourceRun, 'other-head', 'fp', python));
  assert.throws(() =>
    verifyReuseArtifact(bytes, artifact, sourceRun, 'abc', 'other-fingerprint', python),
  );
  assert.throws(() =>
    verifyReuseArtifact(bytes, artifact, { ...sourceRun, run_attempt: 2 }, 'abc', 'fp', python),
  );
});

for (const auditExit of [0, 17]) {
  test(`static CI preserves early evidence and audit exit ${auditExit}`, (t) => {
    const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
    const section = workflow.split('\n  static:\n')[1]?.split('\n  unit:\n')[0];
    assert.ok(section, 'Static job must exist');
    const block = (name) => {
      const step = section.split(`      - name: ${name}\n`)[1]?.split('      - name:')[0];
      const run = step?.split('        run: |\n')[1];
      assert.ok(run, `Missing executable step: ${name}`);
      return run
        .split('\n')
        .map((line) => line.replace(/^ {10}/, ''))
        .join('\n');
    };
    const initialize = block('Initialize static verification context');
    const audit = block('Dependency audit');
    assert.ok(
      section.indexOf('Initialize static verification context') < section.indexOf('Setup Node'),
    );
    const retention = section
      .split('      - name: Preserve verification reports\n')[1]
      ?.split('      - name:')[0];
    assert.ok(retention?.includes('if: always()'));
    const uploadPaths = retention
      ?.split('          path: |\n')[1]
      ?.split('          retention-days:')[0];
    assert.ok(uploadPaths?.includes('.artifacts/ci/static-context.json'));
    assert.ok(uploadPaths?.includes('.artifacts/ci/dependency-audit.log'));
    const workspace = mkdtempSync(join(tmpdir(), 'vittrade-ci-audit-'));
    t.after(() => {
      const absolute = resolve(workspace);
      assert.equal(dirname(absolute), resolve(tmpdir()));
      assert.ok(absolute.startsWith(join(resolve(tmpdir()), 'vittrade-ci-audit-')));
      assert.equal(lstatSync(absolute).isSymbolicLink(), false);
      rmSync(absolute, { recursive: true, force: true });
    });
    const bash =
      process.env.CI_SCOPE_TEST_BASH ||
      (process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash');
    const execute = (script) =>
      spawnSync(bash, ['--noprofile', '--norc', '-c', script], {
        cwd: workspace,
        encoding: 'utf8',
        env: {
          ...process.env,
          BASH_ENV: '',
          GITHUB_SHA: 'a'.repeat(40),
          GITHUB_RUN_ID: '42',
          GITHUB_RUN_ATTEMPT: '1',
        },
      });
    const initialized = execute(initialize);
    assert.equal(initialized.status, 0, initialized.stderr || initialized.error?.message);
    const context = JSON.parse(
      readFileSync(join(workspace, '.artifacts/ci/static-context.json'), 'utf8'),
    );
    assert.deepEqual(context, {
      schemaVersion: 1,
      phase: 'started',
      checkoutSha: 'a'.repeat(40),
      runId: '42',
      attempt: '1',
    });
    const mock = `npm() { printf 'controlled audit output\\n'; return ${auditExit}; }\n`;
    const result = execute(mock + audit);
    assert.equal(result.status, auditExit, result.stderr || result.error?.message);
    assert.match(
      readFileSync(join(workspace, '.artifacts/ci/dependency-audit.log'), 'utf8'),
      /controlled audit output/,
    );
    if (auditExit !== 0) {
      const masked = execute(mock + audit.replace('set -euo pipefail', 'set -eu'));
      assert.equal(
        masked.status,
        0,
        'Negative control must expose the missing pipefail failure mask',
      );
    }
  });
}
