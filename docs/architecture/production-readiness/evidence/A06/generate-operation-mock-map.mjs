import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIRECTORY, '../../../../../');
const OUTPUT = path.join(DIRECTORY, 'operation-mock-map-2026-09-28.json');
const TRACKING = 'docs/architecture/production-readiness/TRACKING.json';
const HANDLERS = 'src/dev/mocks/handlers.ts';
const args = process.argv.slice(2);
const mode = args[0] || '--write';

if (!['--write', '--check'].includes(mode) || args.length > 1) {
  console.error('Usage: node generate-operation-mock-map.mjs [--write|--check]');
  process.exit(2);
}

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const hashFile = (relativePath) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, relativePath)))
    .digest('hex');
const readSource = (relativePath) => {
  const file = path.join(ROOT, relativePath);
  const text = fs.readFileSync(file, 'utf8');
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
};
const tracking = readJson(TRACKING);
const handlerSource = readSource(HANDLERS);
const lineAt = (source, node) =>
  source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
const propertyName = (name) =>
  ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : null;
const stringValue = (node) =>
  node && (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;

function normalizePath(value) {
  let route = value.replace(/^https?:\/\/[^/]+/i, '');
  route = route.replace(/^\*\//, '/').replace(/^\/api(?=\/)/, '');
  route = route.split(/[?#]/, 1)[0].replace(/\{([^}]+)\}/g, ':$1');
  return `/${route.replace(/^\/+/, '')}`;
}

function routeMatches(operationPath, testPathValue) {
  const expected = normalizePath(operationPath).split('/');
  const actual = normalizePath(testPathValue).split('/');
  return (
    expected.length === actual.length &&
    expected.every((segment, index) => segment.startsWith(':') || segment === actual[index])
  );
}

function collectIdentifiers(node) {
  const result = new Set();
  function visit(current) {
    if (ts.isIdentifier(current)) result.add(current.text);
    ts.forEachChild(current, visit);
  }
  visit(node);
  return result;
}

const importedNames = new Map();
for (const statement of handlerSource.statements) {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
    continue;
  const clause = statement.importClause;
  const source = statement.moduleSpecifier.text;
  if (clause?.name) importedNames.set(clause.name.text, { source, imported: 'default' });
  if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    for (const specifier of clause.namedBindings.elements) {
      importedNames.set(specifier.name.text, {
        source,
        imported: specifier.propertyName?.text ?? specifier.name.text,
      });
    }
  }
}

const moduleVariables = new Map();
for (const statement of handlerSource.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  const mutable = !(statement.declarationList.flags & ts.NodeFlags.Const);
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name)) {
      moduleVariables.set(declaration.name.text, { declaration, mutable });
    }
  }
}

function initializerSignals(node) {
  if (!node) return { mutableCollection: false, literalObjectOrArray: false };
  let mutableCollection = false;
  function visit(current) {
    if (mutableCollection) return;
    if (
      ts.isNewExpression(current) &&
      /^(Map|Set)$/.test(current.expression.getText(handlerSource).split('.').at(-1))
    ) {
      mutableCollection = true;
      return;
    }
    ts.forEachChild(current, visit);
  }
  visit(node);
  return {
    mutableCollection,
    literalObjectOrArray: ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node),
  };
}

function numericStatus(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  const property = node.properties.find(
    (candidate) => ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === 'status',
  );
  return property && ts.isNumericLiteral(property.initializer)
    ? Number(property.initializer.text)
    : null;
}

function collectResponseSignals(callback) {
  const explicitStatuses = new Set();
  let defaultJsonResponses = 0;
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression;
      if (
        callee.expression.getText(handlerSource) === 'HttpResponse' &&
        callee.name.text === 'json'
      ) {
        const status = numericStatus(node.arguments[1]);
        if (status === null) defaultJsonResponses += 1;
        else explicitStatuses.add(status);
      }
    }
    if (ts.isNewExpression(node) && node.expression.getText(handlerSource) === 'HttpResponse') {
      const status = numericStatus(node.arguments?.[1]);
      if (status !== null) explicitStatuses.add(status);
    }
    ts.forEachChild(node, visit);
  }
  visit(callback);
  return {
    explicitStatusCodes: [...explicitStatuses].sort((left, right) => left - right),
    defaultJsonResponseCount: defaultJsonResponses,
    scope:
      'literal responses found in this callback only; called helper behavior may be outside this scan',
  };
}

function callbackFacts(callback) {
  const identifiers = collectIdentifiers(callback);
  const referencedImports = [...identifiers]
    .map((name) => ({ name, ...importedNames.get(name) }))
    .filter((item) => item.source)
    .sort(
      (left, right) =>
        left.source.localeCompare(right.source) || left.name.localeCompare(right.name),
    );
  const fixtureImports = referencedImports.filter((item) =>
    /(?:fixture|persona|simulator)/i.test(item.source),
  );
  const moduleReferences = [...identifiers]
    .filter((name) => moduleVariables.has(name))
    .map((name) => {
      const { declaration, mutable } = moduleVariables.get(name);
      const initializer = initializerSignals(declaration.initializer);
      return {
        name,
        mutableDeclaration: mutable,
        mutableCollectionInitializer: initializer.mutableCollection,
        literalObjectOrArrayInitializer: initializer.literalObjectOrArray,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  return {
    directImports: referencedImports,
    directFixtureOrPersonaImports: fixtureImports,
    moduleLevelReferences: moduleReferences,
    moduleStateCandidates: moduleReferences
      .filter((item) => item.mutableDeclaration || item.mutableCollectionInitializer)
      .map((item) => item.name),
    usesPersonaRegistry: identifiers.has('DEV_PREVIEW_PERSONAS'),
    usesSharedAuthState: identifiers.has('authenticated') || identifiers.has('currentUser'),
    responseSignals: collectResponseSignals(callback),
  };
}

const handlerArray = handlerSource.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => statement.declarationList.declarations)
  .find(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'handlers',
  )?.initializer;
if (!handlerArray || !ts.isArrayLiteralExpression(handlerArray)) {
  throw new Error(`${HANDLERS}: could not find handlers array`);
}

const handlers = [];
for (const element of handlerArray.elements) {
  if (!ts.isCallExpression(element) || !ts.isPropertyAccessExpression(element.expression)) continue;
  if (element.expression.expression.getText(handlerSource) !== 'http') continue;
  const method = element.expression.name.text.toUpperCase();
  const route = stringValue(element.arguments[0]);
  if (!route) throw new Error(`${HANDLERS}:${lineAt(handlerSource, element)}: non-literal route`);
  const callback = element.arguments[1];
  handlers.push({
    method,
    route: normalizePath(route),
    source: HANDLERS,
    line: lineAt(handlerSource, element),
    facts: callback ? callbackFacts(callback) : null,
  });
}

function collectFiles(directory) {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage')
      continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(absolute));
    else if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) result.push(absolute);
  }
  return result;
}

function testPath(node) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return null;
  return node.templateSpans.reduce((value, span) => {
    const expression = span.expression.getText();
    const parameter = expression.match(/(?:^|\.)([A-Za-z_$][\w$]*)$/)?.[1] ?? 'value';
    return `${value}:${parameter}${span.literal.text}`;
  }, node.head.text);
}

function fetchMethod(call) {
  const init = call.arguments[1];
  if (!init || !ts.isObjectLiteralExpression(init)) return 'GET';
  const method = init.properties.find(
    (property) => ts.isPropertyAssignment(property) && propertyName(property.name) === 'method',
  );
  const value = method && stringValue(method.initializer);
  return value ? value.toUpperCase() : 'GET';
}

const testFiles = [
  ...collectFiles(path.join(ROOT, 'src')),
  ...collectFiles(path.join(ROOT, 'tests')),
]
  .map((absolute) => path.relative(ROOT, absolute).replaceAll(path.sep, '/'))
  .sort();
const testReferences = [];
const handlerBoundTestFiles = [];
const adapterMethodMap = new Map();

for (const testFile of testFiles) {
  const source = readSource(testFile);
  const sourceText = fs.readFileSync(path.join(ROOT, testFile), 'utf8');
  if (/setupServer\s*\(\s*\.\.\.handlers\s*\)/.test(sourceText))
    handlerBoundTestFiles.push(testFile);
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const isFetch =
        (ts.isIdentifier(node.expression) && node.expression.text === 'fetch') ||
        (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'fetch');
      if (isFetch) {
        const value = testPath(node.arguments[0]);
        if (value) {
          const apiIndex = value.indexOf('/api/');
          if (apiIndex >= 0) {
            testReferences.push({
              method: fetchMethod(node),
              route: normalizePath(value.slice(apiIndex + '/api'.length)),
              source: testFile,
              line: lineAt(source, node),
              kind: 'direct-fetch',
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

// The authentication handler tests call the real AuthApi adapter. Trace its method-to-path mapping
// so those tests are not lost merely because they do not spell out fetch URLs.
const authAdapterPath = path.join(ROOT, 'src/features/auth/api/auth-api.ts');
if (fs.existsSync(authAdapterPath)) {
  const adapterSource = readSource('src/features/auth/api/auth-api.ts');
  if (testFiles.some((file) => file === 'src/dev/mocks/auth-handlers.test.ts')) {
    const testText = fs.readFileSync(
      path.join(ROOT, 'src/dev/mocks/auth-handlers.test.ts'),
      'utf8',
    );
    const calledMethods = new Set(
      [...testText.matchAll(/authApi\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
    );
    function visitAdapter(node) {
      if (
        ts.isPropertyAssignment(node) &&
        propertyName(node.name) &&
        calledMethods.has(propertyName(node.name))
      ) {
        const methodName = propertyName(node.name);
        function findRequests(current) {
          if (ts.isObjectLiteralExpression(current)) {
            const methodProperty = current.properties.find(
              (property) =>
                ts.isPropertyAssignment(property) && propertyName(property.name) === 'method',
            );
            const pathProperty = current.properties.find(
              (property) =>
                ts.isPropertyAssignment(property) && propertyName(property.name) === 'path',
            );
            const method = methodProperty && stringValue(methodProperty.initializer);
            const apiPath = pathProperty && stringValue(pathProperty.initializer);
            if (method && apiPath) {
              const paths = adapterMethodMap.get(methodName) ?? [];
              paths.push({ method: method.toUpperCase(), path: apiPath });
              adapterMethodMap.set(methodName, paths);
            }
          }
          ts.forEachChild(current, findRequests);
        }
        findRequests(node.initializer);
      }
      ts.forEachChild(node, visitAdapter);
    }
    visitAdapter(adapterSource);
    // Re-run only the adapter-backed reference extraction now the mapping is available.
    const testSource = readSource('src/dev/mocks/auth-handlers.test.ts');
    function addAuthReferences(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'authApi'
      ) {
        for (const method of adapterMethodMap.get(node.expression.name.text) ?? []) {
          testReferences.push({
            method: method.method,
            route: normalizePath(method.path),
            source: 'src/dev/mocks/auth-handlers.test.ts',
            line: lineAt(testSource, node),
            kind: `auth-adapter-method:${node.expression.name.text}`,
          });
        }
      }
      ts.forEachChild(node, addAuthReferences);
    }
    addAuthReferences(testSource);
  }
}

const operationRows = tracking.operations.map((operation) => {
  const matches = handlers.filter(
    (handler) =>
      handler.method === operation.method.toUpperCase() &&
      normalizePath(handler.route) === normalizePath(operation.path),
  );
  const testedBy = testReferences
    .filter(
      (test) =>
        test.method === operation.method.toUpperCase() && routeMatches(operation.path, test.route),
    )
    .map(({ source, line, kind }) => ({ source, line, kind }))
    .filter(
      (test, index, all) =>
        all.findIndex(
          (candidate) => candidate.source === test.source && candidate.kind === test.kind,
        ) === index,
    );
  const handler = matches[0] ?? null;
  return {
    trackingId: operation.id,
    domain: operation.domain,
    operationId: operation.operationId,
    contractFile: operation.file,
    method: operation.method,
    path: operation.path,
    security: operation.observed?.security ?? [],
    handler: handler
      ? {
          file: handler.source,
          line: handler.line,
          exactMethodPathMatch: true,
          ...handler.facts,
        }
      : null,
    directTestReferences: testedBy,
  };
});

const extraHandlers = handlers.filter(
  (handler) =>
    !tracking.operations.some(
      (operation) =>
        operation.method.toUpperCase() === handler.method &&
        normalizePath(operation.path) === normalizePath(handler.route),
    ),
);
const missingOperations = operationRows.filter((operation) => !operation.handler);
const duplicateMatches = operationRows
  .map((operation) => ({
    operationId: operation.operationId,
    handlerCount: handlers.filter(
      (handler) =>
        handler.method === operation.method.toUpperCase() &&
        normalizePath(handler.route) === normalizePath(operation.path),
    ).length,
  }))
  .filter((item) => item.handlerCount > 1);

const personaText = fs.readFileSync(path.join(ROOT, 'src/dev/mocks/personas.ts'), 'utf8');
const personaIds = [...personaText.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
const directlyTestedOperationIds = operationRows
  .filter((operation) => operation.directTestReferences.length > 0)
  .map((operation) => operation.operationId)
  .sort();
const fixtureReferencedHandlers = operationRows.filter(
  (operation) => operation.handler?.directFixtureOrPersonaImports.length > 0,
).length;

const report = {
  schemaVersion: 1,
  generatedFrom: {
    tracking: TRACKING,
    handlers: HANDLERS,
    personaRegistry: 'src/dev/mocks/personas.ts',
    handlerSourceSha256: hashFile(HANDLERS),
    personaSourceSha256: hashFile('src/dev/mocks/personas.ts'),
  },
  scope:
    'Static inventory of literal MSW handler registrations against tracked OpenAPI operation IDs.',
  summary: {
    trackedOperations: tracking.operations.length,
    literalHandlerRegistrations: handlers.length,
    exactMethodPathMatches: operationRows.filter((operation) => operation.handler).length,
    missingOperations: missingOperations.length,
    extraHandlers: extraHandlers.length,
    duplicateOperationMatches: duplicateMatches.length,
    operationsWithDirectTestReferences: directlyTestedOperationIds.length,
    handlersReferencingFixtureOrPersonaImportsDirectly: fixtureReferencedHandlers,
    handlersReferencingMutableModuleStateCandidates: operationRows.filter(
      (operation) => operation.handler?.moduleStateCandidates.length > 0,
    ).length,
    personas: personaIds,
  },
  personaModel: {
    registryFile: 'src/dev/mocks/personas.ts',
    ids: personaIds,
    selectionEvidence: 'DEV_PREVIEW_PERSONAS is referenced by the POST /auth/login callback only.',
    otherHandlers:
      'The handler module uses shared preview state/default data; no per-persona dataset routing is established by this scan.',
  },
  testInventory: {
    handlerBoundTestFiles,
    operationsWithDirectTestReferences: directlyTestedOperationIds,
    methodPathTrace:
      'Literal fetch URLs are matched by method and normalized route shape; auth adapter methods are traced to their literal request path.',
  },
  limitations: [
    'A static registration match proves only that an MSW method/path declaration exists; it does not prove response schema, business fidelity, browser rendering, or backend behavior.',
    'Direct import references are not transitive: callback helpers may read other fixtures or state not represented in the callback import list.',
    'Module-level references and literal status codes are source signals, not exhaustive runtime state/transition coverage.',
    'Test reference means a test source calls a matching URL or a traced auth adapter method; it does not by itself prove every response branch or contract field.',
    'MSW/Node tests and browser preview are local mock evidence, not real HTTPS staging or backend certification.',
  ],
  reconciliation: {
    missingOperations: missingOperations.map(({ operationId, method, path }) => ({
      operationId,
      method,
      path,
    })),
    extraHandlers: extraHandlers.map(({ method, route, source, line }) => ({
      method,
      path: route,
      source,
      line,
    })),
    duplicateMatches,
  },
  operations: operationRows,
};
const prettierOptions = (await prettier.resolveConfig(OUTPUT)) ?? {};
const formattedReport = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
  ...prettierOptions,
  filepath: OUTPUT,
});

if (mode === '--check') {
  if (!fs.existsSync(OUTPUT))
    throw new Error(`Missing generated report: ${path.relative(ROOT, OUTPUT)}`);
  const existing = fs.readFileSync(OUTPUT, 'utf8');
  if (existing !== formattedReport)
    throw new Error(`Generated report is stale: ${path.relative(ROOT, OUTPUT)}`);
  console.log(
    `A06 operation/mock map is current: ${report.summary.exactMethodPathMatches}/${report.summary.trackedOperations} exact matches; ${report.summary.operationsWithDirectTestReferences} operations have direct test references.`,
  );
} else {
  fs.writeFileSync(OUTPUT, formattedReport);
  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT)}: ${report.summary.exactMethodPathMatches}/${report.summary.trackedOperations} exact matches; ${report.summary.operationsWithDirectTestReferences} operations have direct test references.`,
  );
}

if (missingOperations.length || extraHandlers.length || duplicateMatches.length)
  process.exitCode = 1;
