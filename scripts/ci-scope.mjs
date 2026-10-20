import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Only progress data can reuse runtime evidence. Policy/docs, tests, dependencies,
// workflow changes and unknown paths always retain the complete gate.
export const metadataPath = 'docs/architecture/production-readiness/TRACKING.json';
export const fullJobNames = [
  'CI scope',
  'Static and build gates',
  'Unit and coverage',
  'Browser smoke',
  'Browser auth-api',
  'Browser auth-mock',
  'Production gates',
];

export function runtimeFingerprint(treeOutput) {
  const entries = treeOutput
    .split('\0')
    .filter(Boolean)
    .filter((entry) => {
      const separator = entry.indexOf('\t');
      if (separator < 0) throw new Error('Invalid Git tree entry');
      return entry.slice(separator + 1) !== metadataPath;
    });
  return createHash('sha256').update(entries.sort().join('\0')).digest('hex');
}

export function hasFullGate(run, jobs, head, pullNumber) {
  return (
    run.head_sha === head &&
    run.event === 'pull_request' &&
    run.path === '.github/workflows/ci.yml' &&
    run.conclusion === 'success' &&
    // Related PR refs are mutable even on historical run API responses.
    // Bind source to run.head_sha; bind tested inputs to the immutable artifact.
    run.pull_requests?.some((pr) => pr.number === pullNumber) &&
    fullJobNames.every((name) => {
      const matches = jobs.filter((job) => job.name === name);
      return (
        matches.length === 1 &&
        matches[0].conclusion === 'success' &&
        matches[0].steps?.length > 0 &&
        matches[0].steps.every((step) => step.conclusion === 'success') &&
        matches[0].steps.some(
          (step) => step.name === 'Preserve verification reports' && step.conclusion === 'success',
        )
      );
    })
  );
}

export function readScopeArchive(bytes, python = 'python3') {
  const result = spawnSync(
    python,
    [
      '-c',
      'import io,sys,zipfile\nwith zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as z:\n names=[i for i in z.infolist() if i.filename.endswith("/scope.json") or i.filename=="scope.json"]\n assert len(names)==1 and names[0].file_size < 2000000\n sys.stdout.buffer.write(z.read(names[0]))',
    ],
    { input: bytes, encoding: 'utf8', maxBuffer: 2_000_000 },
  );
  if (result.status !== 0) throw new Error('Cannot verify immutable scope archive');
  return JSON.parse(result.stdout);
}

export function verifyReuseArtifact(bytes, artifact, run, head, expectedFingerprint, python) {
  if (
    artifact.expired ||
    artifact.workflow_run?.id !== run.id ||
    bytes.length !== artifact.size_in_bytes ||
    `sha256:${createHash('sha256').update(bytes).digest('hex')}` !== artifact.digest
  )
    throw new Error('Previous scope artifact identity/bytes/digest mismatch');
  const scope = readScopeArchive(bytes, python);
  if (
    scope.mode !== 'full' ||
    scope.head !== head ||
    scope.headFingerprint !== expectedFingerprint ||
    scope.checkoutFingerprint !== expectedFingerprint ||
    !/^[a-f0-9]{40}$/.test(scope.checkout ?? '') ||
    artifact.name !== `production-scope-${scope.checkout}-${run.run_attempt}`
  )
    throw new Error('Previous tested runtime inputs are not equivalent to source');
  return scope;
}

export function selectScope(input) {
  const full = (reason) => ({ mode: 'full', reason, reusedRunId: '' });
  if (input.eventName !== 'pull_request')
    return full('Main/push and unknown events require full CI');
  if (!input.paths.length || input.paths.some((file) => file !== metadataPath))
    return full('Source, policy, configuration or unknown path changed');
  if (!input.baseIsAncestor) return full('PR base is not included in the previous source head');
  if (
    input.beforeFingerprint !== input.headFingerprint ||
    input.headFingerprint !== input.checkoutFingerprint
  )
    return full('Runtime/build/test/policy inputs or the tested merge tree changed');
  if (!input.provenRunId)
    return full('No successful complete CI for the exact previous source head');
  return {
    mode: 'metadata-only',
    reason: 'Only progress data changed; exact previous full gate and all other Git inputs match',
    reusedRunId: String(input.provenRunId),
  };
}

export function verifyGate(needs) {
  const scope = needs.scope;
  if (scope?.result !== 'success') throw new Error('CI scope did not succeed');
  const mode = scope.outputs?.mode;
  if (!['full', 'metadata-only'].includes(mode)) throw new Error('Missing/unknown CI scope');
  const required = mode === 'full' ? ['static', 'unit', 'browser'] : ['metadata'];
  const notApplicable = mode === 'full' ? ['metadata'] : ['static', 'unit', 'browser'];
  for (const job of required) {
    if (needs[job]?.result !== 'success')
      throw new Error(`Required job ${job} is ${needs[job]?.result ?? 'missing'}`);
  }
  for (const job of notApplicable) {
    if (needs[job]?.result !== 'skipped') throw new Error(`Unexpected scope/result for ${job}`);
  }
  if (
    mode === 'metadata-only' &&
    (!/^\d+$/.test(scope.outputs.reused_run_id ?? '') ||
      !/^[a-f0-9]{64}$/.test(scope.outputs.runtime_fingerprint ?? ''))
  )
    throw new Error('Metadata gate has no verified source evidence');
  return { mode, required, notApplicable, reusedRunId: scope.outputs.reused_run_id || null };
}

export function verifyLedgerFormat(text) {
  // Existing ledger writers use this serialization, including self-audit hashes.
  // A different formatter would rewrite unrelated history/evidence bytes.
  if (text !== JSON.stringify(JSON.parse(text), null, 2) + '\n')
    throw new Error(
      'Ledger must use its existing JSON.stringify two-space serialization and final LF',
    );
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const fingerprint = (ref) => runtimeFingerprint(git(['ls-tree', '-r', '-z', ref]));
const revision = (ref) => git(['rev-parse', ref]).trim();
function report(name, value) {
  mkdirSync('.artifacts/ci', { recursive: true });
  writeFileSync(`.artifacts/ci/${name}.json`, JSON.stringify(value, null, 2) + '\n');
}

async function previousFullRun(head, pullNumber, expectedFingerprint) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !process.env.GITHUB_TOKEN) return null;
  const api = async (endpoint) => {
    const response = await fetch(
      `${process.env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repository}/${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) throw new Error(`GitHub evidence lookup: HTTP ${response.status}`);
    return response.json();
  };
  try {
    const data = await api(
      `actions/runs?head_sha=${head}&event=pull_request&status=success&per_page=20`,
    );
    // Bound evidence lookups. If older evidence is outside this window, run full CI.
    for (const run of data.workflow_runs
      .filter((run) => run.path === '.github/workflows/ci.yml')
      .slice(0, 2)) {
      const jobs = await api(
        `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`,
      );
      if (jobs.total_count === jobs.jobs.length && hasFullGate(run, jobs.jobs, head, pullNumber)) {
        const artifacts = await api(`actions/runs/${run.id}/artifacts?per_page=100`);
        const candidates = artifacts.artifacts.filter(
          (artifact) =>
            artifact.name.startsWith('production-scope-') &&
            artifact.name.endsWith(`-${run.run_attempt}`),
        );
        if (candidates.length !== 1 || candidates[0].size_in_bytes > 2_000_000) continue;
        const artifact = candidates[0];
        const response = await fetch(
          `${process.env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repository}/actions/artifacts/${artifact.id}/zip`,
          {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
            },
            redirect: 'manual',
            signal: AbortSignal.timeout(10_000),
          },
        );
        let download = response;
        if (response.status === 302) {
          const location = new URL(response.headers.get('location'));
          if (location.protocol !== 'https:') throw new Error('Unsafe artifact download scheme');
          // Never forward the API token to the signed artifact storage URL.
          download = await fetch(location, { signal: AbortSignal.timeout(30_000) });
        }
        if (!download.ok) throw new Error(`Artifact download: HTTP ${download.status}`);
        verifyReuseArtifact(
          Buffer.from(await download.arrayBuffer()),
          artifact,
          run,
          head,
          expectedFingerprint,
        );
        return run.id;
      }
    }
  } catch (error) {
    console.warn(`${error.message}; falling back to full CI.`);
  }
  return null;
}

async function classify() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const head = event.pull_request?.head.sha ?? revision('HEAD');
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error('Invalid source head');
  const before = revision(`${head}^`);
  const paths = git(['diff', '--name-only', '-z', before, head]).split('\0').filter(Boolean);
  const input = {
    eventName: process.env.GITHUB_EVENT_NAME,
    paths,
    beforeFingerprint: fingerprint(before),
    headFingerprint: fingerprint(head),
    checkoutFingerprint: fingerprint('HEAD'),
    baseIsAncestor:
      Boolean(event.pull_request?.base.sha) &&
      spawnSync('git', ['merge-base', '--is-ancestor', event.pull_request.base.sha, before])
        .status === 0,
    provenRunId: null,
  };
  const candidate = selectScope({ ...input, provenRunId: 1 }).mode === 'metadata-only';
  if (candidate)
    input.provenRunId = await previousFullRun(
      before,
      event.pull_request.number,
      input.beforeFingerprint,
    );
  const result = { ...selectScope(input), head, before, checkout: revision('HEAD'), ...input };
  report('scope', result);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `mode=${result.mode}\nreused_run_id=${result.reusedRunId}\nruntime_fingerprint=${input.headFingerprint}\n`,
    );
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv[2] === 'gate') {
    const needs = JSON.parse(process.env.CI_NEEDS);
    try {
      report('gate', { result: 'pass', ...verifyGate(needs), needs });
    } catch (error) {
      report('gate', { result: 'fail', error: error.message, needs });
      throw error;
    }
  } else if (process.argv[2] === 'ledger-format')
    verifyLedgerFormat(readFileSync(metadataPath, 'utf8'));
  else if (process.argv[2] === 'classify') await classify();
  else throw new Error('Expected classify or gate');
}
