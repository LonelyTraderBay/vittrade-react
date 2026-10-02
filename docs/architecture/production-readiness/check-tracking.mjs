import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';

// Read-only consistency check for the implementation ledger, not certification.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootArgumentIndex = process.argv.indexOf('--root');
const rootArgument = rootArgumentIndex >= 0 ? process.argv[rootArgumentIndex + 1] : null;
if (rootArgumentIndex >= 0 && !rootArgument) throw new Error('--root requires a repository path.');
const root = rootArgument ? path.resolve(rootArgument) : path.resolve(scriptDirectory, '../../..');
const directory = path.join(root, 'docs/architecture/production-readiness');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const tracking = readJson(path.join(directory, 'TRACKING.json'));
const inventory = readJson(path.join(root, 'docs/architecture/page-inventory.json'));
const plan = fs.readFileSync(path.join(directory, 'PLAN.md'), 'utf8');
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const statuses = new Set(['todo', 'in_progress', 'blocked', 'done', 'not_applicable']);
const complete = (item) => ['done', 'not_applicable'].includes(item.status);
const active = (item) => item.lifecycle !== 'retired';
const planPrefix = 'docs/architecture/production-readiness/';
const allGitFiles = [
  ...new Set(
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean),
  ),
];
const currentFiles = allGitFiles.filter(
  (file) => !file.startsWith(planPrefix) && fs.existsSync(path.join(root, file)),
);

function indexed(items, name, key = 'id') {
  const index = new Map();
  for (const item of items) {
    assert(typeof item[key] === 'string' && item[key].length > 0, `${name}: missing ${key}`);
    assert(!index.has(item[key]), `${name}: duplicate ${item[key]}`);
    index.set(item[key], item);
  }
  return index;
}
const tasks = indexed(tracking.tasks, 'tasks');
const pages = indexed(tracking.pages, 'pages');
const routes = indexed(tracking.routes, 'routes');
const operations = indexed(tracking.operations, 'operations');
const evidence = indexed(tracking.evidence, 'evidence');
const changes = indexed(tracking.changes, 'changes');
const decisions = indexed(tracking.decisions, 'decisions');
const files = indexed(tracking.files, 'files', 'path');
const steps = indexed(
  tracking.tasks.flatMap((task) => task.steps.map((step) => ({ ...step, taskId: task.id }))),
  'steps',
);
const filesByStep = new Map([...steps.keys()].map((stepId) => [stepId, []]));
const cataloguedFilesByHead = new Map();

assert(tracking.executionPlan?.version === 1, 'Missing or unsupported executionPlan.version');
assert(
  tracking.executionPlan?.canonicalStepFileMapping?.startsWith('files[].executionScope.stepIds'),
  'Execution plan must designate files[].executionScope.stepIds as the canonical mapping',
);

for (const file of files.values()) {
  const scope = file.executionScope;
  assert(scope && typeof scope === 'object', `${file.path}: missing executionScope`);
  if (!scope) continue;
  assert(tasks.has(scope.ownerTaskId), `${file.path}: executionScope owner task is unknown`);
  assert(
    Array.isArray(file.taskIds) && file.taskIds.includes(scope.ownerTaskId),
    `${file.path}: executionScope owner is missing from taskIds`,
  );
  assert(
    typeof scope.role === 'string' && scope.role.length > 0,
    `${file.path}: missing executionScope.role`,
  );
  assert(
    typeof scope.action === 'string' && scope.action.length > 0,
    `${file.path}: missing executionScope.action`,
  );
  assert(
    Array.isArray(scope.stepIds) && scope.stepIds.length > 0,
    `${file.path}: missing executionScope.stepIds`,
  );
  assert(
    new Set(scope.stepIds ?? []).size === (scope.stepIds ?? []).length,
    `${file.path}: duplicate executionScope.stepIds`,
  );
  for (const stepId of scope.stepIds ?? []) {
    assert(steps.has(stepId), `${file.path}: executionScope references unknown step ${stepId}`);
    if (filesByStep.has(stepId)) filesByStep.get(stepId).push(file.path);
  }
  if (
    file.lifecycle !== 'retired' &&
    file.lifecycle !== 'planned' &&
    !file.path.startsWith(planPrefix)
  ) {
    assert(
      Boolean(file.cataloguedSourceHead && file.cataloguedSha256),
      `${file.path}: missing catalogued source head/hash`,
    );
  }
  if (file.cataloguedSourceHead || file.cataloguedSha256) {
    assert(
      /^[a-f0-9]{40}$/.test(file.cataloguedSourceHead ?? ''),
      `${file.path}: invalid cataloguedSourceHead`,
    );
    assert(
      /^[a-f0-9]{64}$/.test(file.cataloguedSha256 ?? ''),
      `${file.path}: invalid cataloguedSha256`,
    );
    if (/^[a-f0-9]{40}$/.test(file.cataloguedSourceHead ?? '')) {
      const records = cataloguedFilesByHead.get(file.cataloguedSourceHead) ?? [];
      records.push(file);
      cataloguedFilesByHead.set(file.cataloguedSourceHead, records);
    }
  }
}
for (const [sourceHead, records] of cataloguedFilesByHead) {
  let snapshotBlobs;
  try {
    const tree = execFileSync('git', ['ls-tree', '-r', '-z', sourceHead], {
      cwd: root,
      encoding: 'utf8',
    });
    snapshotBlobs = new Map();
    for (const entry of tree.split('\0').filter(Boolean)) {
      const [metadata, filePath] = entry.split('\t');
      const [, type, object] = metadata.split(' ');
      if (type === 'blob') snapshotBlobs.set(filePath, object);
    }
  } catch {
    for (const file of records)
      assert(false, `${file.path}: cataloguedSourceHead is not available in Git`);
    continue;
  }

  const blobIds = new Set();
  for (const file of records) {
    const blobId = snapshotBlobs.get(file.path);
    assert(blobId, `${file.path}: cataloguedSourceHead does not contain this path`);
    if (blobId) blobIds.add(blobId);
  }

  if (blobIds.size > 0) {
    try {
      const output = execFileSync('git', ['cat-file', '--batch'], {
        cwd: root,
        input: `${[...blobIds].join('\n')}\n`,
        maxBuffer: 256 * 1024 * 1024,
      });
      const sourceHashes = new Map();
      let offset = 0;
      for (const expectedId of blobIds) {
        const headerEnd = output.indexOf(0x0a, offset);
        const [, type, sizeText] = output.subarray(offset, headerEnd).toString('utf8').split(' ');
        const size = Number(sizeText);
        offset = headerEnd + 1;
        const sourceHash = createHash('sha256')
          .update(output.subarray(offset, offset + size))
          .digest('hex');
        assert(type === 'blob', `cataloguedSourceHead object ${expectedId} is not a blob`);
        sourceHashes.set(expectedId, sourceHash);
        offset += size + 1;
      }
      for (const file of records) {
        const blobId = snapshotBlobs.get(file.path);
        if (blobId)
          assert(
            sourceHashes.get(blobId) === file.cataloguedSha256,
            `${file.path}: cataloguedSha256 does not match cataloguedSourceHead`,
          );
      }
    } catch {
      for (const file of records)
        assert(false, `${file.path}: could not read source from cataloguedSourceHead`);
    }
  }

  try {
    const changedPaths = new Set(
      execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', sourceHead], {
        cwd: root,
        encoding: 'utf8',
      })
        .split('\0')
        .filter(Boolean),
    );
    for (const file of records)
      if (fs.existsSync(path.join(root, file.path)))
        assert(
          !changedPaths.has(file.path),
          `${file.path}: current source differs from cataloguedSourceHead`,
        );
  } catch {
    for (const file of records)
      assert(false, `${file.path}: could not compare source with cataloguedSourceHead`);
  }
}
for (const [stepId, mappedFiles] of filesByStep)
  assert(mappedFiles.length > 0, `${stepId}: no file is mapped to this step`);
for (const protectedPath of tracking.executionPlan?.protectedPaths ?? []) {
  const file = files.get(protectedPath);
  assert(file, `Protected instruction is missing from file catalog: ${protectedPath}`);
  assert(file?.lifecycle !== 'retired', `Protected instruction is retired: ${protectedPath}`);
  assert(
    file?.executionScope?.role === 'protected_instruction',
    `Protected instruction has the wrong scope role: ${protectedPath}`,
  );
}

function refs(ids, index, label) {
  assert(Array.isArray(ids), `${label}: references must be an array`);
  for (const id of ids ?? []) assert(index.has(id), `${label}: unknown reference ${id}`);
}
function checkStage(value, label, backend = false) {
  assert(value && statuses.has(value.status), `${label}: invalid status`);
  if (!value) return;
  refs(value.evidenceIds, evidence, label);
  if (value.status === 'done') {
    assert(value.evidenceIds?.length > 0, `${label}: done without evidence`);
    assert(
      value.evidenceIds?.some((id) => evidence.get(id)?.result === 'pass'),
      `${label}: done without passing evidence`,
    );
    if (backend)
      assert(
        value.evidenceIds?.some(
          (id) => evidence.get(id)?.kind === 'staging' && evidence.get(id)?.result === 'pass',
        ),
        `${label}: backend done without real staging evidence`,
      );
  }
  if (value.status === 'not_applicable') {
    assert(Boolean(value.notes?.trim()), `${label}: not_applicable needs a reason in notes`);
    assert(
      value.evidenceIds?.some((id) => evidence.get(id)?.kind === 'decision'),
      `${label}: not_applicable needs decision evidence`,
    );
  }
  if (value.status === 'blocked')
    assert(
      Boolean(value.notes?.trim()) || value.blockers?.length > 0,
      `${label}: blocked needs a concrete reason`,
    );
}
function retirement(item, label) {
  if (item.lifecycle !== 'retired') return;
  assert(Boolean(item.retirement?.reason), `${label}: retired needs retirement.reason`);
  assert(item.retirement?.decisionIds?.length > 0, `${label}: retired needs a decision`);
  refs(item.retirement?.decisionIds ?? [], decisions, label);
}
function compareScope(actual, recorded, label) {
  const source = new Set(actual);
  const ledger = new Set(recorded);
  for (const key of source) assert(ledger.has(key), `${label}: missing ledger entry ${key}`);
  for (const key of ledger)
    assert(source.has(key), `${label}: active entry no longer in source; reconcile/retire ${key}`);
  assert(ledger.size === recorded.length, `${label}: duplicate active identity`);
}

assert(tracking.schemaVersion === 1, 'Unsupported schemaVersion');
assert(
  typeof tracking.baseline.sourceHead === 'string' &&
    /^[a-f0-9]{40}$/.test(tracking.baseline.sourceHead),
  'Missing baseline source SHA',
);
for (const task of tasks.values()) {
  checkStage(task, task.id);
  refs(task.dependsOn, tasks, `${task.id}.dependsOn`);
  refs(task.pageIds, pages, `${task.id}.pageIds`);
  refs(task.routeIds, routes, `${task.id}.routeIds`);
  refs(task.operationIds, operations, `${task.id}.operationIds`);
  refs(task.changeIds, changes, `${task.id}.changeIds`);
  assert(plan.includes(`### ${task.id} —`), `${task.id}: missing task instructions in PLAN.md`);
  for (const step of task.steps) {
    checkStage(step, step.id);
    assert(plan.includes(`**${step.id}**`), `${step.id}: missing step instructions in PLAN.md`);
  }
  for (const source of task.sourceFiles)
    assert(files.has(source), `${task.id}: source file missing from file ledger ${source}`);
  if (task.status === 'done') {
    assert(task.steps.every(complete), `${task.id}: task done with incomplete steps`);
    assert(
      task.dependsOn.every((id) => tasks.has(id) && complete(tasks.get(id))),
      `${task.id}: task done before dependencies`,
    );
    assert(Boolean(task.completedAt), `${task.id}: task done without completedAt`);
    if (task.id.startsWith('U')) {
      for (const id of task.pageIds) {
        const page = pages.get(id);
        if (page && active(page))
          assert(
            complete(page.ui) && complete(page.connection),
            `${task.id}: UI domain done but ${id} UI/connection not complete`,
          );
      }
      for (const id of task.routeIds) {
        const route = routes.get(id);
        if (route && active(route))
          assert(
            route.classification !== 'unresolved' && complete(route.ui),
            `${task.id}: unresolved/incomplete route ${id}`,
          );
      }
    }
    if (task.id === 'A07') {
      assert(
        tracking.routes.filter(active).every((route) => route.classification !== 'unresolved'),
        'A07: done with unresolved routes',
      );
    }
    if (task.id === 'C05') {
      assert(
        tracking.pages
          .filter(active)
          .every(
            (page) =>
              page.ui.status === 'not_applicable' || page.userAcceptance.status === 'accepted',
          ),
        'C05: UI acceptance task done with pages still awaiting user acceptance',
      );
    }
  }
}
const visiting = new Set();
const visited = new Set();
function visit(id) {
  if (visiting.has(id)) {
    errors.push(`Task dependency cycle at ${id}`);
    return;
  }
  if (visited.has(id) || !tasks.has(id)) return;
  visiting.add(id);
  for (const dependency of tasks.get(id).dependsOn) visit(dependency);
  visiting.delete(id);
  visited.add(id);
}
for (const id of tasks.keys()) visit(id);

for (const page of pages.values()) {
  retirement(page, page.id);
  assert(tasks.has(page.taskId), `${page.id}: unknown owner task ${page.taskId}`);
  assert(
    tasks.get(page.taskId)?.pageIds.includes(page.id),
    `${page.id}: owner task missing reverse page reference`,
  );
  refs(page.routeIds, routes, `${page.id}.routeIds`);
  refs(page.operationIds, operations, `${page.id}.operationIds`);
  for (const id of page.routeIds)
    assert(
      routes.get(id)?.pageIds.includes(page.id),
      `${page.id}: route ${id} missing reverse page mapping`,
    );
  for (const id of page.operationIds)
    assert(
      operations.get(id)?.pageIds.includes(page.id),
      `${page.id}: operation ${id} missing reverse page mapping`,
    );
  checkStage(page.ui, `${page.id}.ui`);
  checkStage(page.connection, `${page.id}.connection`);
  checkStage(page.backend, `${page.id}.backend`, true);
  for (let n = 1; n <= 8; n++) {
    const key = `P${String(n).padStart(2, '0')}`;
    checkStage(page.checklist[key], `${page.id}.${key}`);
  }
  if (page.ui.status === 'done') {
    assert(
      Object.entries(page.checklist)
        .filter(([key]) => key !== 'P08')
        .every(([, value]) => complete(value)),
      `${page.id}: UI done with incomplete P01-P07`,
    );
    assert(page.uiReview === 'verified', `${page.id}: UI done without technical review`);
    assert(
      page.routeIds.length > 0 || Boolean(page.ui.notes),
      `${page.id}: page UI done without route coverage or explanation`,
    );
  }
  if (page.connection.status === 'done') {
    assert(complete(page.checklist.P08), `${page.id}: API connection ready without P08`);
    assert(
      page.operationIds.length > 0 || Boolean(page.connection.notes),
      `${page.id}: API connection ready without operation mapping or static-page reason`,
    );
  }
  refs(page.userAcceptance.evidenceIds, evidence, `${page.id}.userAcceptance`);
  if (page.userAcceptance.status === 'accepted') {
    assert(
      Boolean(page.userAcceptance.reviewer) && Boolean(page.userAcceptance.reviewedAt),
      `${page.id}: user acceptance needs reviewer and date`,
    );
    assert(
      page.userAcceptance.evidenceIds.length > 0,
      `${page.id}: user acceptance missing evidence`,
    );
  }
}
compareScope(
  inventory.pages.map((item) => item.path),
  tracking.pages
    .filter((item) => active(item) && item.lifecycle !== 'planned')
    .map((item) => item.path),
  'Pages',
);

const occurrences = new Map();
function routeKey(route) {
  const key = JSON.stringify([
    route.source,
    route.path,
    route.component,
    route.target ?? null,
    route.routeFactory ?? null,
    route.componentSlot ?? null,
    route.developmentOnly,
  ]);
  const occurrence = occurrences.get(key) ?? 0;
  occurrences.set(key, occurrence + 1);
  return `${key}#${occurrence}`;
}
compareScope(
  inventory.routes.map(routeKey),
  tracking.routes
    .filter((item) => active(item) && item.lifecycle !== 'planned')
    .map((item) => item.inventoryKey),
  'Routes',
);
for (const route of routes.values()) {
  retirement(route, route.id);
  assert(tasks.has(route.taskId), `${route.id}: unknown task`);
  assert(
    tasks.get(route.taskId)?.routeIds.includes(route.id),
    `${route.id}: owner task missing reverse route reference`,
  );
  refs(route.pageIds, pages, `${route.id}.pageIds`);
  for (const id of route.pageIds)
    assert(
      pages.get(id)?.routeIds.includes(route.id),
      `${route.id}: page ${id} missing reverse route mapping`,
    );
  refs(route.decisionIds, decisions, `${route.id}.decisionIds`);
  checkStage(route.ui, `${route.id}.ui`);
  checkStage(route.backend, `${route.id}.backend`, true);
  for (const scenario of route.scenarios) {
    checkStage(scenario, `${route.id}.scenario.${scenario.id}`);
    assert(Boolean(scenario.url), `${route.id}: scenario missing URL`);
  }
  if (route.ui.status === 'done') {
    assert(route.classification !== 'unresolved', `${route.id}: UI done but route unresolved`);
    assert(route.resolvedUrls.length > 0, `${route.id}: UI done without actual URL`);
    assert(
      route.scenarios.length > 0 && route.scenarios.every(complete),
      `${route.id}: UI done without passing scenario coverage`,
    );
  }
}

const operationKey = (item) => [item.file, item.method.toLowerCase(), item.path].join('|');
const currentOperations = [];
for (const file of currentFiles.filter((item) => /^contracts\/openapi\/.*\.yaml$/.test(item))) {
  const document = parse(fs.readFileSync(path.join(root, file), 'utf8'));
  for (const [apiPath, pathItem] of Object.entries(document.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']) {
      if (pathItem[method]) currentOperations.push({ file, method, path: apiPath });
    }
  }
}
compareScope(
  currentOperations.map(operationKey),
  tracking.operations
    .filter((item) => active(item) && item.lifecycle !== 'planned')
    .map(operationKey),
  'Operations',
);
for (const operation of operations.values()) {
  retirement(operation, operation.id);
  assert(tasks.has(operation.taskId), `${operation.id}: unknown task`);
  assert(
    tasks.get(operation.taskId)?.operationIds.includes(operation.id),
    `${operation.id}: owner task missing reverse operation reference`,
  );
  refs(operation.pageIds, pages, `${operation.id}.pageIds`);
  for (const id of operation.pageIds)
    assert(
      pages.get(id)?.operationIds.includes(operation.id),
      `${operation.id}: page ${id} missing reverse operation mapping`,
    );
  refs(operation.routeIds, routes, `${operation.id}.routeIds`);
  checkStage(operation.contract, `${operation.id}.contract`);
  checkStage(operation.mock, `${operation.id}.mock`);
  checkStage(operation.backend, `${operation.id}.backend`, true);
  if (operation.contract.status === 'done') {
    assert(
      operation.adapterFiles.length > 0 || Boolean(operation.contract.notes),
      `${operation.id}: reviewed contract missing adapter mapping or explanation`,
    );
    assert(
      operation.approval !== 'unreviewed',
      `${operation.id}: reviewed contract still unreviewed approval`,
    );
  }
  if (operation.mock.status === 'done')
    assert(
      operation.handlerFiles.length > 0 && operation.testFiles.length > 0,
      `${operation.id}: mock done without handler/test mapping`,
    );
  if (operation.backend.status === 'done')
    assert(
      Boolean(operation.backendOwner) &&
        Boolean(operation.backendVersion) &&
        Boolean(operation.backendEnvironment),
      `${operation.id}: verified backend missing owner/version/environment`,
    );
}

const changedFromBaseline = [];
for (const file of files.values()) {
  retirement(file, file.path);
  refs(file.taskIds, tasks, file.path);
  refs(file.evidenceIds, evidence, file.path);
  refs(file.changeIds, changes, file.path);
  assert(file.taskIds.length > 0, `${file.path}: no owner task`);
  if (file.disposition === 'not_applicable')
    assert(Boolean(file.reason), `${file.path}: excluded file needs reason`);
  if (file.disposition === 'changed')
    assert(file.changeIds.length > 0, `${file.path}: changed without change record`);
  if (file.disposition === 'reviewed_unchanged')
    assert(file.evidenceIds.length > 0, `${file.path}: reviewed without evidence`);
  if (file.lifecycle === 'planned' || !active(file)) continue;
  const absolute = path.resolve(root, file.path);
  assert(absolute.startsWith(root + path.sep), `${file.path}: path outside repository`);
  if (fs.existsSync(absolute) && file.baselineSha256) {
    const currentHash = createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    if (currentHash !== file.baselineSha256) changedFromBaseline.push(file.path);
  }
}
compareScope(
  currentFiles,
  tracking.files
    .filter(
      (item) => active(item) && item.lifecycle !== 'planned' && !item.path.startsWith(planPrefix),
    )
    .map((item) => item.path),
  'Files',
);
for (const item of evidence.values()) {
  assert(tasks.has(item.taskId), `${item.id}: unknown task`);
  if (item.stepId)
    assert(
      steps.get(item.stepId)?.taskId === item.taskId,
      `${item.id}: step does not belong to task`,
    );
  for (const key of [
    'kind',
    'commandOrSteps',
    'environment',
    'observedAt',
    'sourceHead',
    'expected',
    'actual',
    'artifact',
  ])
    assert(Boolean(item[key]), `${item.id}: missing ${key}`);
  assert(['pass', 'fail'].includes(item.result), `${item.id}: result must be pass or fail`);
}
for (const item of changes.values()) {
  assert(tasks.has(item.taskId), `${item.id}: unknown task`);
  assert(
    steps.get(item.stepId)?.taskId === item.taskId,
    `${item.id}: step does not belong to task`,
  );
  assert(files.has(item.path), `${item.id}: changed file missing from ledger`);
  assert(['add', 'modify', 'delete', 'rename'].includes(item.action), `${item.id}: invalid action`);
  assert(Boolean(item.reason), `${item.id}: missing reason`);
  if (item.action === 'rename') assert(Boolean(item.oldPath), `${item.id}: rename missing oldPath`);
  if (['modify', 'delete', 'rename'].includes(item.action))
    assert(Boolean(item.beforeHash), `${item.id}: missing beforeHash`);
  if (['add', 'modify', 'rename'].includes(item.action))
    assert(Boolean(item.afterHash), `${item.id}: missing afterHash`);
  refs(item.evidenceIds, evidence, item.id);
}
for (const milestone of tracking.milestones)
  checkStage(milestone, milestone.id, milestone.id === 'M4');
const requiredTasks = {
  M1: ['A02', 'A05', 'A06'],
  M2: ['C05'],
  M3: tracking.tasks.filter((task) => task.id.startsWith('U')).map((task) => task.id),
  M4: tracking.tasks.map((task) => task.id),
};
for (const milestone of tracking.milestones.filter((item) => item.status === 'done')) {
  assert(
    (requiredTasks[milestone.id] ?? []).every((id) => tasks.has(id) && complete(tasks.get(id))),
    `${milestone.id}: milestone done before required tasks`,
  );
  if (milestone.id === 'M4') {
    assert(
      tracking.pages.filter(active).every((page) => complete(page.backend)),
      'M4: unfinished page backend verification',
    );
    assert(
      tracking.operations.filter(active).every((operation) => complete(operation.backend)),
      'M4: unfinished operation backend verification',
    );
  }
}
if (tracking.checkpoint.nextTask)
  assert(tasks.has(tracking.checkpoint.nextTask), 'Checkpoint nextTask is unknown');
if (tracking.checkpoint.nextStep)
  assert(steps.has(tracking.checkpoint.nextStep), 'Checkpoint nextStep is unknown');

const count = (items, status) => items.filter((item) => item.status === status).length;
const report = {
  purpose: 'Ledger consistency only; not proof of UI acceptance or production readiness',
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  baselineSourceHead: tracking.baseline.sourceHead,
  scope: {
    tasks: tasks.size,
    steps: steps.size,
    pages: inventory.pages.length,
    routeDeclarations: inventory.routes.length,
    operations: currentOperations.length,
    filesOutsidePlan: currentFiles.length,
  },
  progress: {
    tasksDone: count(tracking.tasks, 'done'),
    tasksBlocked: count(tracking.tasks, 'blocked'),
    tasksNotApplicable: count(tracking.tasks, 'not_applicable'),
    stepsDone: count([...steps.values()], 'done'),
    uiPagesDone: count(
      tracking.pages.map((item) => item.ui),
      'done',
    ),
    userAcceptedPages: tracking.pages.filter((item) => item.userAcceptance.status === 'accepted')
      .length,
    unclassifiedRoutes: tracking.routes.filter(
      (item) => active(item) && item.classification === 'unresolved',
    ).length,
    routeDeclarationsWithResolvedUrls: tracking.routes.filter(
      (item) => active(item) && item.resolvedUrls.length > 0,
    ).length,
    routeDeclarationsWithoutResolvedUrls: tracking.routes.filter(
      (item) => active(item) && item.resolvedUrls.length === 0,
    ).length,
    backendOperationsDone: count(
      tracking.operations.map((item) => item.backend),
      'done',
    ),
  },
  changedFromBaseline,
  errorCount: errors.length,
  errors: errors.slice(0, 40),
};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 40)
  console.error(`Plus ${errors.length - 40} more errors. Reconcile scope before continuing.`);
process.exitCode = errors.length ? 1 : 0;
