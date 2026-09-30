import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');
const OUTPUT_PATH =
  'docs/architecture/production-readiness/evidence/A07/navigation-targets-2026-09-28.json';
const URL_PATH =
  'docs/architecture/production-readiness/evidence/A07/route-url-resolution-2026-09-28.json';
const TREE_PATH =
  'docs/architecture/production-readiness/evidence/A07/runtime-route-tree-2026-09-28.json';
const args = process.argv.slice(2);
const mode = args[0] || '--preview';

if (!['--preview', '--apply', '--check'].includes(mode) || args.length > 1) {
  console.error('Usage: node generate-navigation-targets.mjs [--preview|--apply|--check]');
  process.exit(2);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function hashFile(relativePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, relativePath)))
    .digest('hex');
}

function propertyName(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return name?.getText(sourceFile) || '';
}

function evaluateString(node, variables, seen = new Set()) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;

  if (ts.isTemplateExpression(node)) {
    let result = node.head.text;
    for (const span of node.templateSpans) {
      if (!ts.isIdentifier(span.expression) || seen.has(span.expression.text)) return null;
      const initializer = variables.get(span.expression.text);
      if (!initializer) return null;
      const value = evaluateString(
        initializer,
        variables,
        new Set([...seen, span.expression.text]),
      );
      if (value === null) return null;
      result += value + span.literal.text;
    }
    return result;
  }

  return null;
}

function literalProperty(object, name, sourceFile, variables) {
  if (!ts.isObjectLiteralExpression(object)) return null;
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) && propertyName(candidate.name, sourceFile) === name,
  );
  return property ? evaluateString(property.initializer, variables) : null;
}

function collectSourceTargets(spec) {
  const absolutePath = path.join(ROOT, spec.path);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    spec.path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const variables = new Map();
  const targets = [];

  function collectVariables(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      variables.set(node.name.text, node.initializer);
    }
    ts.forEachChild(node, collectVariables);
  }
  collectVariables(sourceFile);

  function addTarget(pathValue, label, node, kind) {
    if (!pathValue?.startsWith('/')) return;
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    targets.push({
      group: spec.group,
      kind,
      label: label || pathValue,
      path: pathValue,
      source: spec.path,
      line: position.line + 1,
    });
  }

  function visit(node, activeVariable = null) {
    let active = activeVariable;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      spec.variables.includes(node.name.text)
    ) {
      active = node.name.text;
    }

    if (active && ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          propertyName(property.name, sourceFile) === 'path'
        ) {
          addTarget(
            evaluateString(property.initializer, variables),
            literalProperty(node, 'label', sourceFile, variables),
            property,
            active === 'TABS' ? 'core-tab' : 'menu-link',
          );
        }
      }
    }

    if (
      spec.collectNavigateCalls &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'navigate'
    ) {
      const target = evaluateString(node.arguments[0], variables);
      addTarget(target, null, node, 'shortcut');
    }

    ts.forEachChild(node, (child) => visit(child, active));
  }

  visit(sourceFile);
  return { targets, hash: hashFile(spec.path) };
}

function matchesRuntimePath(url, fullPath) {
  const actual = url.split('/');
  const pattern = fullPath.split('/');
  return (
    actual.length === pattern.length &&
    pattern.every((segment, index) => segment.startsWith(':') || segment === actual[index])
  );
}

function main() {
  const urlEvidence = readJson(URL_PATH);
  const runtimeTree = readJson(TREE_PATH);
  const specs = [
    {
      group: 'responsive-bottom-nav',
      path: 'src/app/components/layout/ResponsiveBottomNav.tsx',
      variables: ['TABS'],
    },
    {
      group: 'responsive-left-rail',
      path: 'src/app/components/layout/LeftRail.tsx',
      variables: ['NAV_ITEMS', 'BOTTOM_ITEMS'],
    },
    {
      group: 'tablet-sidebar',
      path: 'src/app/components/layout/TabletSidebar.tsx',
      variables: ['NAV_SECTIONS', 'BOTTOM_ITEMS'],
    },
    {
      group: 'tablet-top-bar',
      path: 'src/app/components/layout/TabletTopBar.tsx',
      variables: [],
      collectNavigateCalls: true,
    },
    {
      group: 'web-sidebar',
      path: 'src/app/components/layout/WebSidebar.tsx',
      variables: ['NAV_SECTIONS', 'BOTTOM_ITEMS'],
      collectNavigateCalls: true,
    },
  ];

  const sourceHashes = {};
  const collected = specs.map((spec) => {
    const result = collectSourceTargets(spec);
    sourceHashes[spec.path] = result.hash;
    return { group: spec.group, targets: result.targets };
  });
  const declaredUrls = new Set(urlEvidence.urlRecords.flatMap((record) => record.previewUrls));
  const runtimeRows = runtimeTree.rows.filter((row) => typeof row.fullPath === 'string');
  const routeByUrl = new Map();

  for (const record of urlEvidence.urlRecords) {
    for (const url of record.previewUrls) {
      const existing = routeByUrl.get(url) || [];
      existing.push(record.routeId);
      routeByUrl.set(url, existing);
    }
  }

  const allTargets = collected.flatMap((group) => group.targets);
  const targets = [...new Set(allTargets.map((target) => target.path))]
    .sort((left, right) => left.localeCompare(right))
    .map((url) => {
      const runtimeMatches = runtimeRows.filter((row) => matchesRuntimePath(url, row.fullPath));
      const routeIds = routeByUrl.get(url) || [];
      const indexOnly = !declaredUrls.has(url) && runtimeMatches.some((row) => row.index);
      return {
        url,
        resolution: declaredUrls.has(url)
          ? 'route-declaration'
          : indexOnly
            ? 'runtime-index-route'
            : runtimeMatches.length
              ? 'runtime-pattern'
              : 'unresolved',
        routeIds: [...new Set(routeIds)].sort(),
        runtimeNodeIds: runtimeMatches.map((row) => row.id).sort(),
        sources: allTargets
          .filter((target) => target.path === url)
          .map(({ group, kind, label, source, line }) => ({ group, kind, label, source, line })),
      };
    });

  const responsiveTabs = collected
    .find((group) => group.group === 'responsive-bottom-nav')
    .targets.filter((target) => target.kind === 'core-tab')
    .map(({ path: targetPath, label }) => ({ path: targetPath, label }));
  const expectedCoreTabs = [
    { path: '/r/home', label: 'Trang chủ' },
    { path: '/r/markets', label: 'Thị trường' },
    { path: '/r/trade/btcusdt', label: 'Giao dịch' },
    { path: '/r/wallet', label: 'Ví' },
    { path: '/r/profile', label: 'Tôi' },
  ];
  const unresolved = targets.filter((target) => target.resolution === 'unresolved');
  const output = {
    schemaVersion: 1,
    taskId: 'A07',
    stepId: 'A07.04',
    inputs: {
      routeUrlEvidence: { path: URL_PATH, sha256: hashFile(URL_PATH) },
      runtimeRouteTree: { path: TREE_PATH, sha256: hashFile(TREE_PATH) },
      navigationSources: sourceHashes,
    },
    counts: {
      sourceGroups: collected.map(({ group, targets: entries }) => ({
        group,
        links: entries.length,
      })),
      sourceLinkEntries: allTargets.length,
      uniqueTargets: targets.length,
      declaredTargets: targets.filter((target) => target.resolution === 'route-declaration').length,
      runtimeIndexTargets: targets.filter((target) => target.resolution === 'runtime-index-route')
        .length,
      unresolvedTargets: unresolved.length,
    },
    coreTabs: {
      expected: expectedCoreTabs,
      actual: responsiveTabs,
      matchesGuideline: JSON.stringify(responsiveTabs) === JSON.stringify(expectedCoreTabs),
    },
    targets,
    limitations: [
      'A static/runtime route match proves a registered URL target, not that every page is complete or accepted.',
      'Browser observations for representative navigation, back, direct load, refresh, not-found and auth redirects are recorded separately in the A07.04 browser-check artifact.',
      'Two prediction destinations are React Router index nodes and therefore do not have separate declaration IDs in the 428-route baseline.',
    ],
  };

  if (!output.coreTabs.matchesGuideline)
    throw new Error(
      'The five required responsive core tabs differ from the current guideline contract.',
    );
  if (unresolved.length)
    throw new Error(
      `Unresolved navigation targets: ${unresolved.map((target) => target.url).join(', ')}`,
    );

  const serialized = JSON.stringify(output, null, 2) + '\n';
  const outputFile = path.join(ROOT, OUTPUT_PATH);
  if (mode === '--check') {
    if (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8') !== serialized) {
      throw new Error(`Navigation target evidence is stale: ${OUTPUT_PATH}`);
    }
    console.log(
      `Navigation target evidence is current: ${targets.length} unique targets, ${unresolved.length} unresolved.`,
    );
  } else if (mode === '--apply') {
    fs.writeFileSync(outputFile, serialized, 'utf8');
    console.log(
      `Wrote ${OUTPUT_PATH}: ${targets.length} unique targets, ${unresolved.length} unresolved.`,
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
