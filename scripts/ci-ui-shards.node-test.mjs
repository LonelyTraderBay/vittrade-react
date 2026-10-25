import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { nativeTests, verifyUiCoverage, verifyUiNeeds } from './ci-ui-shards.mjs';
import { fullJobNames, hasFullGate } from './ci-scope.mjs';

const snapshot = { head: 'a'.repeat(40), hashes: { 'src/app/App.tsx': 'abc' } };
const args = ['test', '--config', 'playwright.ui-mock.config.ts'];
const manifest = (extra = []) => ({
  command: 'playwright',
  args: [...args, ...extra],
  status: 'passed',
  childClosed: true,
  exitCode: 0,
  sourceUnchanged: true,
  snapshot,
  snapshotAfter: snapshot,
});
const report = (ids, shard) => ({
  config: { shard },
  errors: [],
  suites: [
    {
      specs: ids.map((id) => ({
        id,
        tests: [
          {
            projectId: 'chromium',
            expectedStatus: 'passed',
            status: 'expected',
            results: [{ status: 'passed' }],
          },
        ],
      })),
    },
  ],
});
const data = () => ({
  plan: {
    native: report(['one', 'two', 'three', 'four'], null),
    manifest: manifest(['--list', '--reporter=json']),
  },
  producers: [['one', 'four'], ['two'], ['three']].map((ids, i) => ({
    native: report(ids, { current: i + 1, total: 3 }),
    manifest: manifest(),
  })),
});
const needs = () => ({
  scope: { result: 'success', outputs: { mode: 'full' } },
  browser: { result: 'success' },
  ui_shards: { result: 'success' },
  ui_coverage: { result: 'success' },
});

test('UI coverage follows discovery, includes new tests and preserves complete native identity', () => {
  const { plan, producers } = data();
  assert.equal(verifyUiCoverage(plan, producers, snapshot).passed, 4);
  assert.equal(nativeTests(plan.native).length, 4);
  plan.native.suites[0].specs.push(...report(['new'], null).suites[0].specs);
  assert.throws(() => verifyUiCoverage(plan, producers, snapshot));
  producers[2].native.suites[0].specs.push(...report(['new'], null).suites[0].specs);
  assert.equal(verifyUiCoverage(plan, producers, snapshot).passed, 5);
});

for (const [name, change] of [
  ['missing shard', (d) => d.producers.pop()],
  ['duplicate shard', (d) => (d.producers[1].native.config.shard.current = 1)],
  ['wrong total', (d) => (d.producers[1].native.config.shard.total = 4)],
  ['sharded denominator', (d) => (d.plan.native.config.shard = { current: 1, total: 3 })],
  ['empty denominator', (d) => (d.plan.native.suites = [])],
  ['missing test', (d) => d.producers[0].native.suites[0].specs.pop()],
  [
    'duplicate test across shards',
    (d) => d.producers[1].native.suites[0].specs.push(d.producers[0].native.suites[0].specs[0]),
  ],
  [
    'duplicate test within shard',
    (d) => d.producers[0].native.suites[0].specs.push(d.producers[0].native.suites[0].specs[0]),
  ],
  ['foreign test', (d) => (d.producers[0].native.suites[0].specs[0].id = 'foreign')],
  [
    'failed test',
    (d) => (d.producers[0].native.suites[0].specs[0].tests[0].results[0].status = 'failed'),
  ],
  [
    'skipped test',
    (d) => (d.producers[0].native.suites[0].specs[0].tests[0].results[0].status = 'skipped'),
  ],
  [
    'unexpected result',
    (d) => (d.producers[0].native.suites[0].specs[0].tests[0].status = 'unexpected'),
  ],
  [
    'retry',
    (d) => d.producers[0].native.suites[0].specs[0].tests[0].results.push({ status: 'passed' }),
  ],
  ['runtime error', (d) => d.producers[0].native.errors.push({ message: 'teardown failed' })],
  [
    'wrong revision',
    (d) => (d.producers[0].manifest.snapshot = { ...snapshot, head: 'b'.repeat(40) }),
  ],
  [
    'different source bytes',
    (d) => (d.producers[0].manifest.snapshot = { ...snapshot, hashes: {} }),
  ],
  ['source mutation', (d) => (d.producers[0].manifest.snapshotAfter = { ...snapshot, hashes: {} })],
  ['unclosed process', (d) => (d.producers[0].manifest.childClosed = false)],
  ['failed producer', (d) => (d.producers[0].manifest.status = 'failed')],
  ['failed exit', (d) => (d.producers[0].manifest.exitCode = 1)],
  ['test filter', (d) => (d.producers[0].manifest.args = [...args, '--grep', 'one'])],
]) {
  test(`UI gate rejects ${name}`, () => {
    const input = structuredClone(data());
    change(input);
    assert.throws(() => verifyUiCoverage(input.plan, input.producers, snapshot));
  });
}

test('UI aggregate and final gate reject absent, skipped, neutral, failed and cancelled jobs', () => {
  verifyUiNeeds(needs(), true);
  for (const job of ['scope', 'browser', 'ui_shards', 'ui_coverage']) {
    for (const result of [undefined, 'skipped', 'neutral', 'failure', 'cancelled']) {
      const input = needs();
      input[job].result = result;
      assert.throws(() => verifyUiNeeds(input, true));
      delete input[job];
      assert.throws(() => verifyUiNeeds(input, true));
    }
  }
  const metadata = needs();
  metadata.scope.outputs.mode = 'metadata-only';
  for (const job of ['browser', 'ui_shards', 'ui_coverage']) metadata[job].result = 'skipped';
  verifyUiNeeds(metadata, true);
  metadata.ui_coverage.result = 'success';
  assert.throws(() => verifyUiNeeds(metadata, true));
});

test('exact-source reuse requires all new producer/coverage jobs and successful evidence upload', () => {
  const run = {
    head_sha: 'abc',
    event: 'pull_request',
    path: '.github/workflows/ci.yml',
    conclusion: 'success',
    pull_requests: [{ number: 1 }],
  };
  const jobs = fullJobNames.map((name) => ({
    name,
    conclusion: 'success',
    steps: [{ name: 'Preserve verification reports', conclusion: 'success' }],
  }));
  assert.equal(hasFullGate(run, jobs, 'abc', 1), true);
  for (const name of ['Browser ui-mock 2/3', 'Browser ui-mock 3/3', 'Complete UI coverage']) {
    assert(fullJobNames.includes(name));
    assert.equal(
      hasFullGate(
        run,
        jobs.filter((job) => job.name !== name),
        'abc',
        1,
      ),
      false,
    );
    assert.equal(
      hasFullGate(run, [...jobs, jobs.find((job) => job.name === name)], 'abc', 1),
      false,
    );
  }
});

test('workflow retains original lanes and requires all UI partitions before Production gates', () => {
  const workflow = parse(
    readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  );
  const jobs = workflow.jobs;
  assert.deepEqual(jobs.ui_shards.strategy.matrix.shard, [2, 3]);
  assert.equal(jobs.ui_shards.strategy['fail-fast'], false);
  assert.equal(jobs.ui_shards.if, "needs.scope.outputs.mode == 'full'");
  assert.deepEqual(jobs.ui_coverage.needs, ['scope', 'browser', 'ui_shards']);
  assert(jobs.verify.needs.includes('ui_coverage') && jobs.verify.needs.includes('ui_shards'));
  assert(jobs.verify.steps.some((step) => step.run === 'node scripts/ci-ui-shards.mjs gate'));
  assert(
    jobs.verify.steps.findIndex((step) => step.run === 'node scripts/ci-ui-shards.mjs gate') <
      jobs.verify.steps.findIndex((step) => step.run === 'node scripts/ci-scope.mjs gate'),
  );
  const download = jobs.ui_coverage.steps.find(
    (step) => step.uses === 'actions/download-artifact@v4',
  );
  assert.equal(download.with['run-id'], undefined);
  assert.equal(download.with['repository'], undefined);
  assert.equal(download.with['merge-multiple'], undefined);
  assert(
    download.with.pattern.includes('github.sha') &&
      download.with.pattern.includes('github.run_attempt'),
  );
  const pattern = download.with.pattern
    .replace('${{ github.sha }}', 'abc')
    .replace('${{ github.run_attempt }}', '2');
  const match = new RegExp('^' + pattern.replaceAll('*', '.*') + '$');
  for (const suffix of ['', '2-of-3-', '3-of-3-'])
    assert(match.test(`production-browser-ui-mock-${suffix}abc-2`));
  assert(!match.test('production-browser-ui-mock-abc-1'));
  const discovery = jobs.browser.steps.find(
    (step) => step.name === 'Discover the complete UI test denominator',
  );
  assert.equal(discovery.env.VITTRADE_UI_SHARD, '');
  assert(discovery.run.endsWith('--list --reporter=json'));
  for (const name of ['browser', 'ui_shards', 'ui_coverage']) {
    const upload = jobs[name].steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    assert.equal(upload.if, 'always()');
    assert.equal(upload.with['if-no-files-found'], 'error');
    assert(
      upload.with.name.includes('github.sha') && upload.with.name.includes('github.run_attempt'),
    );
  }
  assert(
    jobs.browser.steps
      .find((step) => step.uses === 'actions/upload-artifact@v4')
      .with.path.includes('.artifacts/ci/ui-plan.json'),
  );
});
