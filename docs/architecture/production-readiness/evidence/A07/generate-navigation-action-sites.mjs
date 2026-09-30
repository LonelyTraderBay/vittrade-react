import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');
const OUTPUT =
  'docs/architecture/production-readiness/evidence/A07/navigation-action-sites-2026-09-28.json';
const URL_EVIDENCE =
  'docs/architecture/production-readiness/evidence/A07/route-url-resolution-2026-09-28.json';
const ROUTE_TREE =
  'docs/architecture/production-readiness/evidence/A07/runtime-route-tree-2026-09-28.json';
const mode = process.argv[2] || '--preview';

if (!['--preview', '--apply', '--check'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node generate-navigation-action-sites.mjs [--preview|--apply|--check]');
  process.exit(2);
}

const json = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const hash = (file) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, file)))
    .digest('hex');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec)\./.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
      ? [absolute]
      : [];
  });
}

function targetsFor(node, sourceFile) {
  if (!node) return [];
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.startsWith('/') ? [node.text] : [];
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text || '';
    for (const span of node.templateSpans) {
      value += `:${span.expression.getText(sourceFile).replace(/[^\w-]/g, '_')}`;
      value += span.literal.text;
    }
    if (value.startsWith(':prefix/')) {
      return ['/t', '/w', '/r', ''].map((prefix) => `${prefix}${value.slice(':prefix'.length)}`);
    }
    return value.startsWith('/') ? [value] : [];
  }
  if (ts.isConditionalExpression(node)) {
    return [...targetsFor(node.whenTrue, sourceFile), ...targetsFor(node.whenFalse, sourceFile)];
  }
  if (ts.isIdentifier(node) && node.text === 'tabPath') {
    let initializer;
    function findTabPath(current) {
      if (
        ts.isVariableDeclaration(current) &&
        ts.isIdentifier(current.name) &&
        current.name.text === 'tabPath'
      ) {
        initializer = current.initializer;
      }
      ts.forEachChild(current, findTabPath);
    }
    findTabPath(sourceFile);
    return initializer ? targetsFor(initializer, sourceFile) : [];
  }
  if (
    ts.isPropertyAccessExpression(node) &&
    ['path', 'route', 'redirectRoute'].includes(node.name.text)
  ) {
    const values = [];
    function findProperty(current) {
      if (
        ts.isPropertyAssignment(current) &&
        (ts.isIdentifier(current.name) || ts.isStringLiteralLike(current.name)) &&
        current.name.text === node.name.text
      ) {
        values.push(...targetsFor(current.initializer, sourceFile));
      }
      ts.forEachChild(current, findProperty);
    }
    findProperty(sourceFile);
    return values;
  }
  return [];
}

function routeMatch(left, right) {
  const segments = (value) => value.split(/[?#]/, 1)[0].split('/').filter(Boolean);
  const a = segments(left);
  const b = segments(right);
  return (
    a.length === b.length &&
    a.every((part, index) => part.startsWith(':') || b[index].startsWith(':') || part === b[index])
  );
}

function actionCategory(action) {
  const value = action.expression;
  if (action.primitive === 'href')
    return value.startsWith('/') ? 'internal-href' : 'external-data-link';
  if (action.primitive === 'to') return 'router-link';
  if (/navigate\(-\d+\)/.test(action.call)) return 'history-back';
  if (/navigate\(\d+\)/.test(action.call)) return 'history-forward';
  if (/targetPrefix|getRoutePath|routePath/.test(value)) return 'platform-route-transform';
  if (/loginPath/.test(value)) return 'auth-redirect';
  if (/copy(?:Provider|Active)|copyProviderFlowPath/.test(value)) return 'route-builder';
  if (/^(?:back|backRoute)$/.test(value)) return 'back-action';
  if (value === 'tabPath' || /\.(?:path|route|redirectRoute)$/.test(value))
    return 'data-driven-route';
  if (/routePrefix \|\| ['"]\/['"]/.test(value)) return 'shell-root-fallback';
  if (action.source.includes('/dev/')) return 'development-tool-navigation';
  if (value.includes('?')) return 'conditional-or-query-route';
  if (/^['"`]/.test(value)) return 'literal-or-template-route';
  return 'unclassified';
}

function main() {
  const routeEvidence = json(URL_EVIDENCE);
  const runtimeTree = json(ROUTE_TREE);
  const actions = [];
  const sourceHashes = {};
  const files = sourceFiles(path.join(ROOT, 'src'));

  for (const absolute of files) {
    const source = path.relative(ROOT, absolute).replaceAll(path.sep, '/');
    const text = fs.readFileSync(absolute, 'utf8');
    const sourceFile = ts.createSourceFile(
      source,
      text,
      ts.ScriptTarget.Latest,
      true,
      source.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function add(node, primitive, targetNode, call = '') {
      const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      actions.push({
        source,
        line: location.line + 1,
        primitive,
        expression: targetNode?.getText(sourceFile) || '<missing>',
        call,
        targetNode,
        sourceFile,
      });
      sourceHashes[source] = hash(source);
    }
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'navigate'
      ) {
        add(node, 'navigate', node.arguments[0], node.getText(sourceFile));
      }
      if (
        ts.isJsxAttribute(node) &&
        ['to', 'href'].includes(node.name.getText(sourceFile)) &&
        node.initializer
      ) {
        const target = ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : node.initializer;
        if (target) add(node, node.name.getText(sourceFile), target);
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  const categories = {};
  const runtimeRows = runtimeTree.rows.filter((row) => typeof row.fullPath === 'string');
  let unresolvedTargets = 0;
  const outputActions = actions.map((action) => {
    const { targetNode, sourceFile, ...site } = action;
    const category = actionCategory(site);
    categories[category] = (categories[category] || 0) + 1;
    const candidates = [...new Set(targetsFor(targetNode, sourceFile))];
    const resolvedCandidates = candidates.map((candidate) => {
      const routeIds = routeEvidence.urlRecords
        .filter((record) => record.urlTemplates.some((template) => routeMatch(candidate, template)))
        .map((record) => record.routeId)
        .sort();
      const runtimeNodeIds = runtimeRows
        .filter((row) => routeMatch(candidate, row.fullPath))
        .map((row) => row.id)
        .sort();
      if (!routeIds.length && !runtimeNodeIds.length) unresolvedTargets += 1;
      return { pathTemplate: candidate, routeIds, runtimeNodeIds };
    });
    return { ...site, category, resolvedCandidates };
  });
  const unclassified = categories.unclassified || 0;
  const output = {
    schemaVersion: 1,
    taskId: 'A07',
    stepId: 'A07.04',
    inputs: {
      routeUrlEvidence: { path: URL_EVIDENCE, sha256: hash(URL_EVIDENCE) },
      runtimeRouteTree: { path: ROUTE_TREE, sha256: hash(ROUTE_TREE) },
      scannedSourceFiles: files.length,
      sourceHashes,
    },
    counts: {
      actionSites: outputActions.length,
      sourceFilesWithActions: Object.keys(sourceHashes).length,
      categories,
      unresolvedLiteralTargets: unresolvedTargets,
      unclassifiedActionSites: unclassified,
    },
    actions: outputActions,
    limitations: [
      'Source inventory covers direct React Router navigate calls and JSX to/href attributes in non-test TypeScript source; it does not certify every page interaction in a browser.',
      'Indirect data, helper, history, external and platform-transform destinations are classified at their call sites; owning source and route evidence remain the target basis.',
      'The separate navigation-targets artifact covers each shared menu target; browser evidence covers representative CTA, back, direct, refresh, 404 and auth flows.',
    ],
  };
  const serialized = JSON.stringify(output, null, 2) + '\n';
  const outputFile = path.join(ROOT, OUTPUT);

  if (unclassified) throw new Error(`Unclassified navigation actions: ${unclassified}`);
  if (mode === '--check') {
    if (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8') !== serialized) {
      throw new Error(`Navigation action evidence is stale: ${OUTPUT}`);
    }
    console.log(
      `Navigation action evidence is current: ${outputActions.length} sites, ${unresolvedTargets} unresolved literal targets.`,
    );
  } else if (mode === '--apply') {
    fs.writeFileSync(outputFile, serialized, 'utf8');
    console.log(
      `Wrote ${OUTPUT}: ${outputActions.length} sites in ${Object.keys(sourceHashes).length} files; ${unresolvedTargets} unresolved literal targets.`,
    );
  } else {
    console.log(serialized);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
