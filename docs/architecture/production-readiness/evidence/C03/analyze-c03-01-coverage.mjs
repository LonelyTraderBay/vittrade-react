import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import coverageLibrary from 'istanbul-lib-coverage';

const { createCoverageMap } = coverageLibrary;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '../../../../../');
const tempRoot = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Temp')
  : path.join(process.env.TEMP || process.env.TMP || '.', '.');
const currentPath = path.join(tempRoot, 'vittrade-c03-01-coverage-20260929', 'coverage-final.json');
const baselinePath = path.join(root, 'coverage', 'coverage-final.json');
const outputPath = path.join(scriptDir, 'c03-01-coverage-remeasurement-2026-09-29.json');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value) => value.replaceAll('\\', '/');
const relative = (value) => normalize(path.relative(root, value));
const currentRaw = fs.readFileSync(currentPath, 'utf8');
const baselineRaw = fs.readFileSync(baselinePath, 'utf8');
const current = createCoverageMap(JSON.parse(currentRaw));
const baseline = createCoverageMap(JSON.parse(baselineRaw));

function coverageSummary(map) {
  const summary = map.getCoverageSummary().toJSON();
  const metrics = {};
  for (const metric of ['statements', 'branches', 'functions', 'lines']) {
    const item = summary[metric];
    metrics[metric] = {
      covered: item.covered,
      total: item.total,
      pct: item.pct,
    };
  }
  return metrics;
}

function fileRows(map) {
  return map
    .files()
    .map((file) => {
      const item = map.fileCoverageFor(file).toSummary().toJSON();
      return {
        file: relative(file),
        statements: item.statements,
        branches: item.branches,
        functions: item.functions,
        lines: item.lines,
      };
    })
    .sort((left, right) => left.file.localeCompare(right.file));
}

function walk(directory, predicate, result = []) {
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, result);
    else if (predicate(absolute)) result.push(absolute);
  }
  return result;
}

function resolveLocalImport(importer, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(importer), specifier);
  else return null;

  const candidates = [
    base,
    ...['.ts', '.tsx', '.js', '.jsx'].map((extension) => base + extension),
    ...['index.ts', 'index.tsx', 'index.js', 'index.jsx'].map((name) => path.join(base, name)),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ||
    null
  );
}

const graphFiles = ['src', 'scripts', 'tests'].flatMap((directory) =>
  walk(
    path.join(root, directory),
    (file) => /\.(ts|tsx|js|jsx)$/.test(file) && !normalize(file).includes('/tests/e2e/'),
  ),
);
const graph = new Map();
const directCallers = new Map();

for (const file of graphFiles) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const dependencies = new Set();
  const addDependency = (specifier) => {
    const dependency = resolveLocalImport(file, specifier);
    if (!dependency) return;
    dependencies.add(dependency);
    if (!directCallers.has(dependency)) directCallers.set(dependency, new Set());
    directCallers.get(dependency).add(file);
  };

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      !(statement.importClause && statement.importClause.isTypeOnly)
    ) {
      addDependency(statement.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      !statement.isTypeOnly
    ) {
      addDependency(statement.moduleSpecifier.text);
    }
  }

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      addDependency(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  graph.set(file, [...dependencies]);
}

function reachableFrom(roots) {
  const visited = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    pending.push(...(graph.get(file) || []));
  }
  return visited;
}

const appReachable = reachableFrom([path.join(root, 'src', 'main.tsx')]);
const testRoots = ['src', 'scripts', 'tests'].flatMap((directory) =>
  walk(
    path.join(root, directory),
    (file) =>
      /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file) &&
      !normalize(file).includes('/tests/e2e/'),
  ),
);
const testReachable = reachableFrom(testRoots);

function sourceKind(absolute) {
  const text = fs.readFileSync(absolute, 'utf8');
  const sourceFile = ts.createSourceFile(
    absolute,
    text,
    ts.ScriptTarget.Latest,
    true,
    absolute.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const statements = [...sourceFile.statements];
  if (
    statements.length > 0 &&
    statements.every(
      (statement) => ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement),
    )
  ) {
    return 'barrel/re-export';
  }
  const emitted = ts
    .transpileModule(text, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    .outputText.replace(/\s+/g, '');
  if (emitted === '' || emitted === 'export{};')
    return 'type-only/declaration erased by TypeScript';
  const hasControlOrCallableBehavior = statements.some(
    (statement) =>
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isIfStatement(statement) ||
      ts.isSwitchStatement(statement) ||
      ts.isForStatement(statement) ||
      ts.isWhileStatement(statement) ||
      ts.isExpressionStatement(statement),
  );
  if (
    !hasControlOrCallableBehavior &&
    statements.every(
      (statement) =>
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement) ||
        ts.isVariableStatement(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement),
    )
  ) {
    return 'static config/token/data';
  }
  return absolute.endsWith('.tsx') ? 'runtime UI/component' : 'runtime utility/module';
}

function classify(file, summary) {
  const absolute = path.join(root, file);
  const callers = [...(directCallers.get(absolute) || [])].map(relative).sort();
  const appReach = appReachable.has(absolute);
  const testReach = testReachable.has(absolute);
  if (summary.statements.pct > 0) {
    return {
      classification: appReach
        ? 'production-reachable with partial statement execution'
        : 'partially executed; no static app-entry path identified',
      productionReachable: appReach,
      unitTestGraphReachable: testReach,
      directCallers: callers.slice(0, 12),
    };
  }
  const kind = sourceKind(absolute);
  if (
    kind === 'barrel/re-export' ||
    kind === 'type-only/declaration erased by TypeScript' ||
    kind === 'static config/token/data'
  ) {
    return {
      classification: kind,
      productionReachable: appReach,
      unitTestGraphReachable: testReach,
      directCallers: callers.slice(0, 12),
    };
  }
  if (appReach) {
    return {
      classification: 'production-reachable runtime; zero statement execution (test gap candidate)',
      productionReachable: true,
      unitTestGraphReachable: testReach,
      directCallers: callers.slice(0, 12),
    };
  }
  if (callers.length === 0) {
    return {
      classification:
        'no static callers found; possible orphan, verify route/reflection before removal',
      productionReachable: false,
      unitTestGraphReachable: false,
      directCallers: [],
    };
  }
  if (callers.every((caller) => caller.startsWith('src/dev/legacy/'))) {
    return {
      classification: 'development/legacy-only callers; not reachable from app entry',
      productionReachable: false,
      unitTestGraphReachable: testReach,
      directCallers: callers.slice(0, 12),
    };
  }
  return {
    classification:
      'static caller exists but app entry does not reach it; review route/export boundary',
    productionReachable: false,
    unitTestGraphReachable: testReach,
    directCallers: callers.slice(0, 12),
  };
}

function domainGroups(rows) {
  const grouped = { app: [], domain: [], shared: [] };
  for (const row of rows) {
    const group = row.file.startsWith('src/app/')
      ? 'app'
      : row.file.startsWith('src/features/')
        ? 'domain'
        : row.file.startsWith('src/shared/')
          ? 'shared'
          : null;
    if (group) grouped[group].push(row);
  }
  return Object.fromEntries(
    Object.entries(grouped).map(([name, items]) => {
      const result = {
        files: items.length,
        below80Statements: items.filter((item) => item.statements.pct < 80).length,
        zeroStatements: items.filter((item) => item.statements.pct === 0).length,
      };
      for (const metric of ['statements', 'branches', 'functions', 'lines']) {
        const total = items.reduce((sum, item) => sum + item[metric].total, 0);
        const covered = items.reduce((sum, item) => sum + item[metric].covered, 0);
        result[metric] = { covered, total, pct: Number(((covered / total) * 100).toFixed(2)) };
      }
      return [name, result];
    }),
  );
}

const currentRows = fileRows(current);
const baselineRows = fileRows(baseline);
const currentByPath = new Map(currentRows.map((row) => [row.file, row]));
const baselineByPath = new Map(baselineRows.map((row) => [row.file, row]));
const lowBaseline = baselineRows.filter((row) => row.statements.pct < 80);
const lowCurrent = currentRows.filter((row) => row.statements.pct < 80);
const zeroBaseline = baselineRows.filter((row) => row.statements.pct === 0);
const zeroCurrent = currentRows.filter((row) => row.statements.pct === 0);
const reportInputFiles = [
  ...currentRows.map((row) => path.join(root, row.file)),
  ...testRoots,
  ...['vitest.config.ts', 'package.json', 'package-lock.json']
    .map((file) => path.join(root, file))
    .filter(fs.existsSync),
]
  .filter((file, index, all) => all.indexOf(file) === index)
  .sort();
const fingerprint = sha256(
  reportInputFiles
    .map((file) => relative(file) + ':' + sha256(fs.readFileSync(file)) + '\n')
    .join(''),
);
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const statusEntries = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean).length;
const baselineStat = fs.statSync(baselinePath);
const baselineSummary = coverageSummary(baseline);
const currentSummary = coverageSummary(current);
const thresholdValues = { statements: 90, branches: 80, functions: 85, lines: 90 };
const thresholds = Object.fromEntries(
  Object.entries(thresholdValues).map(([metric, required]) => [
    metric,
    {
      required,
      actual: currentSummary[metric].pct,
      passed: currentSummary[metric].pct >= required,
    },
  ]),
);
const delta = Object.fromEntries(
  ['statements', 'branches', 'functions', 'lines'].map((metric) => [
    metric,
    {
      covered: currentSummary[metric].covered - baselineSummary[metric].covered,
      total: currentSummary[metric].total - baselineSummary[metric].total,
      percentagePoints: Number(
        (currentSummary[metric].pct - baselineSummary[metric].pct).toFixed(2),
      ),
    },
  ]),
);
const fileClassification = (row) => ({
  ...row,
  baselineStatementPct: baselineByPath.get(row.file)?.statements.pct ?? null,
  ...classify(row.file, row),
});
const lowBaselineRows = lowBaseline.map((row) => ({
  file: row.file,
  baseline: row,
  current: currentByPath.get(row.file) || null,
  classification: currentByPath.has(row.file)
    ? classify(row.file, currentByPath.get(row.file))
    : {
        classification: 'removed from current denominator',
        productionReachable: false,
        unitTestGraphReachable: false,
        directCallers: [],
      },
}));
const lowCurrentRows = lowCurrent.map(fileClassification);
const zeroCurrentRows = zeroCurrent.map(fileClassification);
const baselineZeroPaths = new Set(zeroBaseline.map((row) => row.file));
const currentZeroPaths = new Set(zeroCurrent.map((row) => row.file));
const baselineLowPaths = new Set(lowBaseline.map((row) => row.file));
const currentLowPaths = new Set(lowCurrent.map((row) => row.file));
const configHash = sha256(fs.readFileSync(path.join(root, 'vitest.config.ts')));
const packageHash = sha256(fs.readFileSync(path.join(root, 'package.json')));
const report = {
  schemaVersion: 1,
  taskId: 'C03',
  stepId: 'C03.01',
  measuredAt: '2026-09-29T14:26:18.746Z',
  sourceRevision: head,
  worktree: {
    dirtyStatusEntries: statusEntries,
    sourceFileCount: currentRows.length,
    testGraphRootCount: testRoots.length,
    inputFileCount: reportInputFiles.length,
    inputFingerprintSha256: fingerprint,
    vitestConfigSha256: configHash,
    packageJsonSha256: packageHash,
  },
  execution: {
    command:
      'node node_modules/vitest/vitest.mjs run --coverage --coverage.reportOnFailure --coverage.reportsDirectory %LOCALAPPDATA%/Temp/vittrade-c03-01-coverage-20260929',
    vitestVersion: '4.1.11',
    provider: 'v8',
    include: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**',
      '**/routes.ts',
      'src/test/',
      'scripts/',
      'src/dev/',
      'src/app/components/dev/',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData',
      '**/routeConfig.ts',
      'src/app/routes/**',
      'dist/',
    ],
    thresholds,
    testFiles: 282,
    testsPassed: 2385,
    testsFailed: 1,
    testsSkipped: 0,
    exitCode: 1,
    failedTest: {
      file: 'src/features/auth/pages/WebLoginPage.test.tsx:237',
      title: 'reports backend failure and keeps the user on the login route',
      expectedText: 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.',
      currentSourceText: 'Không thể đăng nhập lúc này. Vui lòng thử lại.',
      note: 'The current working-tree source file was already modified when this roadmap step began; its behavior and test were preserved. The assertion mismatch is carried forward for C03.03/C03.05 review.',
    },
    reportOnFailure: true,
    rawReport: {
      path: '%LOCALAPPDATA%/Temp/vittrade-c03-01-coverage-20260929/coverage-final.json',
      sha256: sha256(currentRaw),
      bytes: Buffer.byteLength(currentRaw),
    },
    existingBaselineArtifact: {
      path: 'coverage/coverage-final.json (ignored, pre-existing, preserved)',
      observedMtime: baselineStat.mtime.toISOString(),
      sha256: sha256(baselineRaw),
      bytes: Buffer.byteLength(baselineRaw),
    },
  },
  baseline: {
    fileCount: baselineRows.length,
    summary: baselineSummary,
    statementFilesBelow80: lowBaseline.length,
    statementFilesAtZero: zeroBaseline.length,
    lowFileRows: lowBaselineRows,
  },
  current: {
    fileCount: currentRows.length,
    summary: currentSummary,
    domainGroups: domainGroups(currentRows),
    statementFilesBelow80: lowCurrent.length,
    statementFilesAtZero: zeroCurrent.length,
    lowFileRows: lowCurrentRows,
    zeroFileRows: zeroCurrentRows,
    newBelow80Files: lowCurrent
      .filter((row) => !baselineLowPaths.has(row.file))
      .map((row) => row.file),
    recoveredBaselineLowFiles: lowBaseline
      .filter((row) => !currentLowPaths.has(row.file))
      .map((row) => ({
        file: row.file,
        currentStatementPct: currentByPath.get(row.file)?.statements.pct ?? null,
      })),
    changedZeroFileSets: {
      noLongerZero: [...baselineZeroPaths].filter((file) => !currentZeroPaths.has(file)),
      newlyZero: [...currentZeroPaths].filter((file) => !baselineZeroPaths.has(file)),
    },
  },
  comparison: { delta },
  reachabilityMethod:
    'TypeScript AST import/export and literal dynamic-import graph from src/main.tsx and Vitest-like test roots in src/scripts/tests, excluding tests/e2e. Resolves relative and @/ imports; ignores type-only imports. This is a static triage index, not proof that a file is dead or that a route was rendered. Generated registries, reflection, and other aliases require manual verification.',
  conclusions: [
    'Coverage thresholds pass at aggregate level; command exit code 1 is due to one existing UI assertion mismatch.',
    'The old plan listed 61 files below 80% and 33 at 0%; the preserved local baseline report confirms those counts. Current measurement has 60 below 80% and 33 at 0%.',
    'AdminFunnelContractPage.tsx is the one baseline-low file now at 100% statement coverage; there are no newly below-80% files and the same 33 files remain at 0%.',
    'The baseline raw report has one fewer covered statement, branch, function, and line than the previous PLAN narrative. This evidence records the raw artifact values rather than repeating that narrative.',
    'Path grouping: src/app is app; src/features is domain; src/shared is shared. No thresholds or coverage exclusions were changed.',
  ],
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      output: relative(outputPath),
      sha256: sha256(fs.readFileSync(outputPath)),
      bytes: fs.statSync(outputPath).size,
      baseline: {
        files: baselineRows.length,
        summary: baselineSummary,
        low: lowBaseline.length,
        zero: zeroBaseline.length,
      },
      current: {
        files: currentRows.length,
        summary: currentSummary,
        low: lowCurrent.length,
        zero: zeroCurrent.length,
      },
      groups: report.current.domainGroups,
      zeroClassifications: zeroCurrentRows.reduce((counts, row) => {
        counts[row.classification] = (counts[row.classification] || 0) + 1;
        return counts;
      }, {}),
      fingerprint,
    },
    null,
    2,
  ),
);
