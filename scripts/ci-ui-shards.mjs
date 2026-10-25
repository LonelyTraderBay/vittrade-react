import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceSnapshot } from './run-with-artifacts.mjs';

const config = 'playwright.ui-mock.config.ts';
const testArgs = ['test', '--config', config];
const planArgs = [...testArgs, '--list', '--reporter=json'];

export function verifyUiNeeds(needs, final = false) {
  assert.equal(needs.scope?.result, 'success', 'UI scope must succeed');
  const mode = needs.scope.outputs?.mode;
  assert(['full', 'metadata-only'].includes(mode), 'Unknown UI scope');
  for (const job of ['browser', 'ui_shards', ...(final ? ['ui_coverage'] : [])])
    assert.equal(needs[job]?.result, mode === 'full' ? 'success' : 'skipped', `UI job ${job}`);
}

export function nativeTests(report) {
  const tests = [];
  function visit(suite) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        assert(spec.id && test.projectId, 'Missing native test identity');
        tests.push({ ...test, id: `${spec.id}/${test.projectId}` });
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  }
  visit(report);
  const ids = tests.map((test) => test.id);
  assert(ids.length > 0 && new Set(ids).size === ids.length, 'Empty/duplicate native IDs');
  return tests;
}

function verifyProducer(manifest, snapshot, args) {
  assert.equal(manifest.command, 'playwright');
  assert.deepEqual(manifest.args, args, 'Unexpected test filters or invocation');
  assert.equal(manifest.status, 'passed');
  assert.equal(manifest.childClosed, true);
  assert.equal(manifest.exitCode, 0);
  assert.equal(manifest.sourceUnchanged, true);
  assert.deepEqual(manifest.snapshot, snapshot, 'Producer source differs from current checkout');
  assert.deepEqual(manifest.snapshotAfter, snapshot, 'Producer source changed');
}

export function verifyUiCoverage(plan, producers, snapshot) {
  verifyProducer(plan.manifest, snapshot, planArgs);
  assert.equal(plan.native.config.shard, null, 'Denominator must be unsharded');
  assert.deepEqual(plan.native.errors, []);
  const expected = nativeTests(plan.native)
    .map((test) => test.id)
    .sort();
  assert.equal(producers.length, 3, 'All three UI producers are mandatory');
  const observed = [];
  for (let current = 1; current <= 3; current++) {
    const matches = producers.filter((p) => p.native.config.shard?.current === current);
    assert.equal(matches.length, 1, `Missing/duplicate UI shard ${current}`);
    const producer = matches[0];
    verifyProducer(producer.manifest, snapshot, testArgs);
    assert.deepEqual(producer.native.config.shard, { current, total: 3 });
    assert.deepEqual(producer.native.errors, []);
    for (const test of nativeTests(producer.native)) {
      assert.equal(test.expectedStatus, 'passed');
      assert.equal(test.status, 'expected', `Non-passing UI result: ${test.id}`);
      assert.equal(test.results.length, 1, 'UI retries must remain disabled');
      assert.equal(test.results[0].status, 'passed', `Skipped/failed UI result: ${test.id}`);
      observed.push(test.id);
    }
  }
  assert.deepEqual(observed.sort(), expected, 'UI native IDs must match discovery exactly once');
  return {
    planned: expected.length,
    passed: observed.length,
    shards: 3,
    sourceHead: snapshot.head,
  };
}

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), 'Linked evidence refused');
    return entry.isDirectory() ? files(target) : [target];
  });
}

export function readInputs(directory, snapshot, attempt = process.env.GITHUB_RUN_ATTEMPT) {
  const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  const groups = fs.readdirSync(directory);
  const expectedNames = [
    `production-browser-ui-mock-${snapshot.head}-${attempt}`,
    ...[2, 3].map((n) => `production-browser-ui-mock-${n}-of-3-${snapshot.head}-${attempt}`),
  ];
  assert.deepEqual(groups.sort(), expectedNames.sort(), 'Unexpected current-attempt UI artifacts');
  const all = files(directory);
  const plans = all.filter((file) => file.endsWith(`${path.sep}ui-plan.json`));
  assert.equal(plans.length, 1, 'Exactly one complete discovery report is required');
  const planManifests = all
    .filter((file) => path.basename(file) === 'run.json')
    .map(json)
    .filter((m) => JSON.stringify(m.args) === JSON.stringify(planArgs));
  assert.equal(planManifests.length, 1, 'Discovery producer is required');
  const producers = all
    .filter((file) => file.endsWith(`${path.sep}ui-native.json`))
    .map((file) => ({
      native: json(file),
      manifest: json(path.join(path.dirname(path.dirname(file)), 'run.json')),
    }));
  return { plan: { native: json(plans[0]), manifest: planManifests[0] }, producers };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const needs = JSON.parse(process.env.CI_UI_NEEDS ?? '{}');
  const final = process.argv[2] === 'gate';
  const output = `.artifacts/ci/${final ? 'ui-gate' : 'ui-coverage'}.json`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const context = {
    head: process.env.GITHUB_SHA,
    runId: process.env.GITHUB_RUN_ID,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
  };
  try {
    assert(context.head && context.runId && context.attempt, 'Current CI run identity is required');
    verifyUiNeeds(needs, final);
    let coverage = {};
    if (!final) {
      const snapshot = sourceSnapshot(process.cwd());
      assert.equal(snapshot.head, context.head);
      const { plan, producers } = readInputs(process.argv[2], snapshot);
      coverage = verifyUiCoverage(plan, producers, snapshot);
    }
    const result = { result: 'pass', ...context, ...coverage };
    fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
  } catch (error) {
    fs.writeFileSync(
      output,
      JSON.stringify({ result: 'fail', ...context, error: error.message }, null, 2) + '\n',
    );
    throw error;
  }
}
