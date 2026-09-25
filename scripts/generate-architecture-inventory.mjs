import { access, readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(repositoryRoot, 'src');
const inventoryPath = join(repositoryRoot, 'docs', 'architecture', 'page-inventory.json');
const certificationPath = join(
  repositoryRoot,
  'docs',
  'architecture',
  'production-page-certifications.json',
);
const allowedStatuses = new Set([
  'production',
  'integration-pending',
  'demo',
  'deprecated',
  'not-implemented',
]);
const validatedProductionEvidence = Symbol('validated-production-evidence');

const legacyOwnerByArea = {
  admin: 'app/platform',
  arena: 'features/arena',
  auth: 'features/auth',
  'cross-module': 'app/platform',
  dca: 'features/dca',
  dev: 'app/platform',
  discovery: 'features/discovery',
  earn: 'features/earn',
  launchpad: 'features/launchpad',
  market: 'features/market',
  markets: 'features/market',
  news: 'features/discovery',
  notifications: 'features/support',
  p2p: 'features/p2p',
  predictions: 'features/predictions',
  profile: 'features/profile',
  referral: 'features/referral',
  support: 'features/support',
  trade: 'features/trading',
  trading: 'features/trading',
  wallet: 'features/wallet',
  web: 'app/platform',
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }
  return files.sort();
}

function toRepoPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/');
}

function toDomain(repoPath) {
  const featureMatch = repoPath.match(/^src\/features\/([^/]+)/);
  if (featureMatch) return featureMatch[1];
  const developmentLegacyMatch = repoPath.match(/^src\/dev\/legacy\/([^/]+)/);
  if (developmentLegacyMatch) return developmentLegacyMatch[1];
  return repoPath.match(/^src\/app\/pages\/([^/]+)/)?.[1] ?? 'platform';
}

function getOwner(repoPath) {
  const featureMatch = repoPath.match(/^src\/features\/([^/]+)/);
  if (featureMatch) return `features/${featureMatch[1]}`;
  const legacyArea =
    repoPath.match(/^src\/dev\/legacy\/([^/]+)/)?.[1] ??
    repoPath.match(/^src\/app\/pages\/([^/]+)/)?.[1];
  return legacyOwnerByArea[legacyArea] ?? 'app/platform';
}

function isCompatibilityPageShim(contents) {
  const sourceFile = ts.createSourceFile(
    'compatibility-page.tsx',
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return (
    sourceFile.statements.length > 0 &&
    sourceFile.statements.every(
      (statement) =>
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier !== undefined &&
        ts.isStringLiteral(statement.moduleSpecifier),
    )
  );
}

function getStatus(
  repoPath,
  contents,
  routeRecords,
  certification,
  developmentOnlyPagePaths,
  productionPagePaths,
) {
  const pageRoutes = getRouteRecordsForPage(repoPath, routeRecords, contents);
  if (
    pageRoutes.length === 0 &&
    /^src\/(?:app\/pages|features\/[^/]+\/pages)\//.test(repoPath) &&
    isCompatibilityPageShim(contents)
  ) {
    return 'deprecated';
  }
  if (pageRoutes.length === 0) return 'not-implemented';
  if (/\/dev\//i.test(repoPath) || /(?:Demo|Test)Page\.(?:tsx?|jsx?)$/i.test(repoPath)) {
    return 'demo';
  }
  if (
    repoPath.startsWith('src/app/pages/') &&
    /export\s+(?:\*|\{\s*default\s*\})\s+from\s+['"]@\/dev\/legacy\//.test(contents)
  ) {
    return 'demo';
  }
  if (
    pageRoutes.length > 0 &&
    (pageRoutes.every((route) => route.developmentOnly) ||
      (developmentOnlyPagePaths.has(repoPath) && !productionPagePaths.has(repoPath)))
  ) {
    return 'demo';
  }
  if (certification?.[validatedProductionEvidence]) return 'production';
  return 'integration-pending';
}

async function loadProductionCertifications(pagePaths, options = {}) {
  const root = options.root ?? repositoryRoot;
  const manifest =
    options.manifestPath ??
    join(root, 'docs', 'architecture', 'production-page-certifications.json');
  const document = JSON.parse(await readFile(manifest, 'utf8'));
  if (document.schemaVersion !== 1 || !Array.isArray(document.pages)) {
    throw new Error('Production page certification manifest has an unsupported schema.');
  }

  const pagePathSet = new Set(pagePaths);
  const certifications = new Map();
  const requiredEvidence = [
    'contract',
    'adapter',
    'authorization',
    'integrationTest',
    'stagingVerification',
  ];

  for (const certification of document.pages) {
    if (!certification || typeof certification.path !== 'string') {
      throw new Error('Each production certification must declare a page path.');
    }
    if (!pagePathSet.has(certification.path)) {
      throw new Error(`Production certification references an unknown page: ${certification.path}`);
    }
    if (certifications.has(certification.path)) {
      throw new Error(`Duplicate production certification: ${certification.path}`);
    }

    for (const field of requiredEvidence) {
      if (typeof certification[field] !== 'string' || certification[field].trim() === '') {
        throw new Error(`Production certification for ${certification.path} is missing ${field}.`);
      }
    }

    if (
      !certification.contract.startsWith('contracts/openapi/') ||
      !/\.ya?ml$/i.test(certification.contract)
    ) {
      throw new Error(
        `Production certification for ${certification.path} must reference an OpenAPI contract file.`,
      );
    }
    if (!/^src\/features\/[^/]+\/api\//.test(certification.adapter)) {
      throw new Error(
        `Production certification for ${certification.path} must reference a feature API adapter.`,
      );
    }
    for (const field of ['authorization', 'integrationTest']) {
      if (!/\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(certification[field])) {
        throw new Error(
          `Production certification for ${certification.path} must reference a test file for ${field}.`,
        );
      }
    }
    if (
      !certification.stagingVerification.startsWith('docs/architecture/staging-evidence/') ||
      !/\.json$/i.test(certification.stagingVerification)
    ) {
      throw new Error(
        `Production certification for ${certification.path} must reference a staging evidence JSON file.`,
      );
    }

    for (const field of requiredEvidence) {
      const evidencePath = resolve(root, certification[field]);
      const relativeEvidencePath = relative(root, evidencePath);
      if (isAbsolute(relativeEvidencePath) || relativeEvidencePath.startsWith(`..${sep}`)) {
        throw new Error(
          `Production certification for ${certification.path} must reference a repository file for ${field}.`,
        );
      }
      try {
        await access(evidencePath);
      } catch {
        throw new Error(
          `Production certification for ${certification.path} references missing ${field}: ${certification[field]}`,
        );
      }
    }

    const stagingEvidence = JSON.parse(
      await readFile(resolve(root, certification.stagingVerification), 'utf8'),
    );
    validateStagingEvidence(certification.path, stagingEvidence);
    validateCertificationRevision(certification, stagingEvidence, options.routeRecords ?? [], root);
    Object.defineProperty(certification, validatedProductionEvidence, {
      value: stagingEvidence,
    });

    certifications.set(certification.path, certification);
  }

  return certifications;
}

function validateCertificationRevision(certification, evidence, routeRecords, root) {
  const verifiedCommit = `${evidence.commitSha}^{commit}`;
  try {
    execFileSync('git', ['cat-file', '-e', verifiedCommit], { cwd: root, stdio: 'ignore' });
  } catch {
    throw new Error(
      `Production certification for ${certification.path} references a staging revision that is not available in Git.`,
    );
  }

  const sourcePaths = [
    certification.path,
    certification.contract,
    certification.adapter,
    certification.authorization,
    certification.integrationTest,
    ...routeRecords
      .filter(
        (route) =>
          route.pageTarget?.replace(/\.[^.]+$/, '') === certification.path.replace(/\.[^.]+$/, ''),
      )
      .map((route) => route.source),
  ];
  const uniqueSourcePaths = [...new Set(sourcePaths)];
  const committedChanges = execFileSync(
    'git',
    ['diff', '--name-only', evidence.commitSha, 'HEAD', '--', ...uniqueSourcePaths],
    { cwd: root, encoding: 'utf8' },
  );
  const worktreeChanges = execFileSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '--', ...uniqueSourcePaths],
    { cwd: root, encoding: 'utf8' },
  );
  if (committedChanges.trim() || worktreeChanges.trim()) {
    throw new Error(
      `Production certification for ${certification.path} differs from the verified staging revision.`,
    );
  }
}

function validateStagingEvidence(pagePath, evidence) {
  const secureUrl = (value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };
  const validTimestamp =
    typeof evidence?.verifiedAt === 'string' &&
    Number.isFinite(Date.parse(evidence.verifiedAt)) &&
    /^\d{4}-\d{2}-\d{2}T/.test(evidence.verifiedAt);

  if (
    evidence?.schemaVersion !== 1 ||
    evidence.environment !== 'staging' ||
    !secureUrl(evidence.baseUrl) ||
    !secureUrl(evidence.testRunUrl) ||
    !validTimestamp ||
    typeof evidence.commitSha !== 'string' ||
    !/^[\da-f]{40}$/i.test(evidence.commitSha) ||
    !Array.isArray(evidence.routePaths) ||
    evidence.routePaths.length === 0 ||
    evidence.routePaths.some((routePath) => typeof routePath !== 'string' || routePath.length === 0)
  ) {
    throw new Error(
      `Production certification for ${pagePath} has invalid staging evidence; require a staging URL, test run, timestamp, commit SHA and verified route paths.`,
    );
  }
}

function validateProductionEvidence(repoPath, certification, routeRecords, dependencies, contents) {
  if (!certification) return;
  if (!certification[validatedProductionEvidence]) {
    throw new Error(`Production certification for ${repoPath} has not passed evidence validation.`);
  }

  if (!repoPath.startsWith('src/features/')) {
    throw new Error(`Production certification requires a feature-owned page: ${repoPath}`);
  }
  const pageRoutes = getRouteRecordsForPage(repoPath, routeRecords, contents);
  if (!pageRoutes.some((route) => !route.developmentOnly)) {
    throw new Error(`Production certification requires a non-development route: ${repoPath}`);
  }
  const verifiedRoutes = new Set(certification[validatedProductionEvidence].routePaths);
  const uncoveredRoutes = pageRoutes
    .filter((route) => !route.developmentOnly)
    .map((route) => route.path)
    .filter((routePath) => !verifiedRoutes.has(routePath));
  if (uncoveredRoutes.length > 0) {
    throw new Error(
      `Production certification for ${repoPath} is missing staging verification for routes: ${uncoveredRoutes.join(', ')}`,
    );
  }
  if (dependencies.mockReferences.length > 0) {
    throw new Error(`Production certification cannot include mock dependencies: ${repoPath}`);
  }
  if (Object.values(dependencies.directRuntimeAccess).some(Boolean)) {
    throw new Error(`Production certification cannot include direct runtime access: ${repoPath}`);
  }
}

function extractLocalImports(contents) {
  const imports = new Set();
  const pattern = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of contents.matchAll(pattern)) {
    const value = match[1];
    if (value.startsWith('.') || value.startsWith('@/')) imports.add(value);
  }
  return [...imports].sort();
}

function resolveSourceImport(importerPath, importPath, sourcePaths) {
  const cleanImportPath = importPath.split(/[?#]/, 1)[0];
  const basePath = cleanImportPath.startsWith('@/')
    ? posix.join('src', cleanImportPath.slice(2))
    : cleanImportPath.startsWith('.')
      ? posix.join(posix.dirname(importerPath), cleanImportPath)
      : undefined;
  if (!basePath) return undefined;

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
  ].map((candidate) => posix.normalize(candidate));
  return candidates.find((candidate) => sourcePaths.has(candidate));
}

async function inspectDevelopmentDependencies(pagePath, pageContents, sourcePaths, contentCache) {
  const pending = extractLocalImports(pageContents)
    .map((importPath) => resolveSourceImport(pagePath, importPath, sourcePaths))
    .filter((target) => target?.startsWith('src/dev/'));
  const developmentTargets = new Set();
  const mockReferences = new Set();

  while (pending.length > 0) {
    const targetPath = pending.pop();
    if (!targetPath?.startsWith('src/dev/') || developmentTargets.has(targetPath)) continue;
    developmentTargets.add(targetPath);

    let targetContents = contentCache.get(targetPath);
    if (targetContents === undefined) {
      targetContents = await readFile(resolve(repositoryRoot, targetPath), 'utf8');
      contentCache.set(targetPath, targetContents);
    }

    for (const reference of classifyMockDependencies(targetContents)) {
      mockReferences.add(reference);
    }
    for (const importPath of extractLocalImports(targetContents)) {
      const dependencyPath = resolveSourceImport(targetPath, importPath, sourcePaths);
      if (dependencyPath?.startsWith('src/dev/') && !developmentTargets.has(dependencyPath)) {
        pending.push(dependencyPath);
      }
    }
  }

  return {
    developmentTargets: [...developmentTargets].sort(),
    mockReferences: [...mockReferences].sort(),
  };
}

function extractRouteRecords(repoPath, contents) {
  const routes = [];
  const importTargets = extractRouteImportTargets(contents);
  const sourceFile = ts.createSourceFile(
    repoPath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const developmentRouteGuard = /if\s*\(\s*!\s*isDevelopmentBuild\s*\)\s*return\s+routes\s*;/.exec(
    contents,
  );
  const developmentRoutesPush = developmentRouteGuard
    ? /\broutes\.push\s*\(/.exec(
        contents.slice(developmentRouteGuard.index + developmentRouteGuard[0].length),
      )
    : undefined;
  const developmentRoutesStart = developmentRoutesPush
    ? developmentRouteGuard.index + developmentRouteGuard[0].length + developmentRoutesPush.index
    : -1;

  const getProperty = (object, propertyName) =>
    object.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
        property.name.text === propertyName,
    );

  const findDynamicImport = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      return node.arguments[0].text;
    }
    for (const child of node.getChildren(sourceFile)) {
      const result = findDynamicImport(child);
      if (result) return result;
    }
    return undefined;
  };

  const isDevelopmentGuarded = (node) => {
    let current = node;
    while (current.parent) {
      const parent = current.parent;
      if (ts.isConditionalExpression(parent)) {
        const conditionText = parent.condition.getText(sourceFile);
        const usesDevelopmentFlag =
          /\bisDevelopmentBuild\b/.test(conditionText) ||
          /import\s*\.\s*meta\s*\.\s*env\s*\.\s*DEV/.test(conditionText);
        if (usesDevelopmentFlag) {
          const isNegated =
            ts.isPrefixUnaryExpression(parent.condition) &&
            parent.condition.operator === ts.SyntaxKind.ExclamationToken;
          const isInTrueBranch =
            current === parent.whenTrue ||
            (parent.whenTrue.pos <= node.pos && node.end <= parent.whenTrue.end);
          if (isInTrueBranch !== isNegated) return true;
        }
      }
      current = parent;
    }
    return false;
  };

  const getRouteFactoryName = (node) => {
    let current = node.parent;
    while (current) {
      if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
      current = current.parent;
    }
    return undefined;
  };

  const getComponentTarget = (expression) => {
    let component;
    let componentSlot;
    let targetPath;
    let targetDevelopmentOnly = false;

    if (ts.isIdentifier(expression)) {
      component = expression.text;
    } else if (ts.isPropertyAccessExpression(expression)) {
      component = expression.name.text;
      if (ts.isIdentifier(expression.expression)) componentSlot = expression.name.text;
    } else if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken &&
      ts.isPropertyAccessExpression(expression.left)
    ) {
      component = expression.left.name.text;
      componentSlot = expression.left.name.text;
      if (ts.isIdentifier(expression.right)) {
        const fallbackTarget = importTargets.get(expression.right.text);
        targetPath = fallbackTarget?.path;
        targetDevelopmentOnly = fallbackTarget?.developmentOnly === true;
      }
    } else if (ts.isCallExpression(expression)) {
      const importedModule = findDynamicImport(expression);
      if (importedModule) {
        targetPath = importedModule;
        component = importedModule
          .split('/')
          .pop()
          ?.replace(/\.(?:tsx?|jsx?)$/, '');
      }
    }

    if (component && !targetPath) {
      const target = importTargets.get(component);
      targetPath = target?.path;
      targetDevelopmentOnly ||= target?.developmentOnly === true;
    }

    return { component, componentSlot, targetPath, targetDevelopmentOnly };
  };

  const joinRoutePath = (parentPath, childPath) => {
    if (childPath.startsWith('/')) return childPath;
    if (!parentPath || parentPath === '/') return childPath;
    return `${parentPath.replace(/\/+$/, '')}/${childPath.replace(/^\/+/, '')}`;
  };

  const visit = (node, inheritedPath) => {
    if (ts.isObjectLiteralExpression(node)) {
      const pathProperty = getProperty(node, 'path');
      const indexProperty = getProperty(node, 'index');
      const componentProperty = getProperty(node, 'Component');
      const declaredPath =
        pathProperty && ts.isStringLiteral(pathProperty.initializer)
          ? pathProperty.initializer.text
          : undefined;
      const routePath =
        declaredPath !== undefined
          ? joinRoutePath(inheritedPath, declaredPath)
          : indexProperty?.initializer.kind === ts.SyntaxKind.TrueKeyword
            ? inheritedPath
            : undefined;

      if (routePath && componentProperty) {
        const { component, componentSlot, targetPath, targetDevelopmentOnly } = getComponentTarget(
          componentProperty.initializer,
        );

        if (component) {
          routes.push({
            path: routePath,
            component,
            target: targetPath,
            developmentOnly:
              targetDevelopmentOnly ||
              isDevelopmentGuarded(node) ||
              (developmentRoutesStart >= 0 && node.pos > developmentRoutesStart),
            source: repoPath,
            ...(componentSlot ? { componentSlot, routeFactory: getRouteFactoryName(node) } : {}),
          });
        }
      }

      for (const property of node.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
          property.name.text === 'children'
        ) {
          visit(property.initializer, routePath);
        }
      }
      return;
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) visit(element, inheritedPath);
      return;
    }

    ts.forEachChild(node, (child) => visit(child, undefined));
  };

  visit(sourceFile, undefined);
  return routes;
}

function extractAuthRoutePaths(contents) {
  const sourceFile = ts.createSourceFile(
    'auth-routes.ts',
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const propertyByComponent = new Map();
  const pathByProperty = new Map();

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer?.getText(sourceFile) === 'components'
    ) {
      for (const element of node.name.elements) {
        if (!ts.isIdentifier(element.name)) continue;
        const propertyName =
          element.propertyName && ts.isIdentifier(element.propertyName)
            ? element.propertyName.text
            : element.name.text;
        propertyByComponent.set(element.name.text, propertyName);
      }
    }

    if (ts.isObjectLiteralExpression(node)) {
      const path = node.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          property.name.getText(sourceFile) === 'path' &&
          ts.isStringLiteral(property.initializer),
      );
      const component = node.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          property.name.getText(sourceFile) === 'Component' &&
          ts.isIdentifier(property.initializer),
      );
      if (path && component) {
        const propertyName = propertyByComponent.get(component.initializer.text);
        if (propertyName) pathByProperty.set(propertyName, path.initializer.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return pathByProperty;
}

function extractAuthFactoryRouteRecords(repoPath, contents, authRoutePaths, importTargets) {
  const sourceFile = ts.createSourceFile(
    repoPath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const routes = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createAuthRoutes' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const property of node.arguments[0].properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          !ts.isIdentifier(property.name) ||
          !ts.isIdentifier(property.initializer)
        ) {
          continue;
        }

        const routePath = authRoutePaths.get(property.name.text);
        if (!routePath) continue;
        const target = importTargets.get(property.initializer.text);
        routes.push({
          path: routePath,
          component: property.initializer.text,
          target: target?.path,
          developmentOnly: target?.developmentOnly ?? false,
          source: repoPath,
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return routes;
}

function extractRouteImportTargets(contents) {
  const importTargets = new Map();
  const importPattern =
    /\bconst\s+([A-Za-z0-9_$]+)\s*=\s*(?:(import\.meta\.env\.DEV|isDevelopmentBuild)\s*\?\s*)?(?:lazy|lazyRoute)\s*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g;
  for (const match of contents.matchAll(importPattern)) {
    importTargets.set(match[1], {
      path: match[3],
      developmentOnly: Boolean(match[2]),
    });
  }
  return importTargets;
}

function extractRouteFactoryBindings(repoPath, contents, sourcePaths) {
  const importTargets = extractRouteImportTargets(contents);
  const sourceFile = ts.createSourceFile(
    repoPath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const bindings = [];

  const findDynamicImport = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      return node.arguments[0].text;
    }
    for (const child of node.getChildren(sourceFile)) {
      const result = findDynamicImport(child);
      if (result) return result;
    }
    return undefined;
  };

  const resolveExpression = (expression) => {
    if (ts.isIdentifier(expression)) {
      return { component: expression.text, ...importTargets.get(expression.text) };
    }
    if (ts.isPropertyAccessExpression(expression)) {
      return { component: expression.name.text, ...importTargets.get(expression.name.text) };
    }
    if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      return resolveExpression(expression.left) ?? resolveExpression(expression.right);
    }
    if (ts.isCallExpression(expression)) {
      const path = findDynamicImport(expression);
      if (path) {
        return {
          component: path
            .split('/')
            .pop()
            ?.replace(/\.(?:tsx?|jsx?)$/, ''),
          path,
          developmentOnly: false,
        };
      }
    }
    return undefined;
  };

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      /^create[A-Za-z0-9]*Routes$/.test(node.expression.text) &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const property of node.arguments[0].properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
        ) {
          continue;
        }

        const component = resolveExpression(property.initializer);
        if (!component?.path) continue;

        const resolvedTarget = resolveSourceImport(repoPath, component.path, sourcePaths);
        const target = resolvedTarget
          ? `@/${resolvedTarget.slice('src/'.length).replace(/\.(?:tsx?|jsx?)$/, '')}`
          : component.path;
        bindings.push({
          factory: node.expression.text,
          slot: property.name.text,
          component: component.component,
          target,
          developmentOnly: component.developmentOnly === true,
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return bindings;
}

function extractShellOverrideTargets(contents) {
  const importTargets = extractRouteImportTargets(contents);
  const aliases = new Map();
  const aliasPattern = /\bconst\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\s*;/g;
  for (const match of contents.matchAll(aliasPattern)) aliases.set(match[1], match[2]);

  const resolveTarget = (identifier) => {
    const visited = new Set();
    let current = identifier;
    while (!visited.has(current)) {
      visited.add(current);
      const target = importTargets.get(current);
      if (target) return target;
      current = aliases.get(current);
      if (!current) return undefined;
    }
    return undefined;
  };

  const overrideTargets = new Map();
  const overridePattern =
    /\bconst\s+[A-Za-z0-9_$]+Overrides\s*:\s*ShellOverrides\s*=\s*\{([\s\S]*?)\};/g;
  for (const match of contents.matchAll(overridePattern)) {
    const propertyPattern = /(?:^|,)\s*([A-Za-z0-9_$]+)(?:\s*:\s*([A-Za-z0-9_$]+))?\s*(?=,|$)/gm;
    for (const property of match[1].matchAll(propertyPattern)) {
      const key = property[1];
      const value = property[2] ?? key;
      const target = resolveTarget(value);
      if (target) overrideTargets.set(key, target);
    }
  }

  return overrideTargets;
}

const shellOverrideComponentAliases = new Map([
  ['homePage', 'P2PHomePage'],
  ['tradePage', 'TradePage'],
  ['pairDetail', 'PairDetailPage'],
]);

function resolveShellOverrideTarget(route, overrideTargets) {
  const overrideName = shellOverrideComponentAliases.get(route.component) ?? route.component;
  return overrideTargets.get(overrideName);
}

function componentCandidates(pagePath, contents = '') {
  const fileName = pagePath
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '');
  const candidates = new Set([fileName]);
  candidates.add(fileName.replace(/Pages?$/, ''));
  candidates.add(fileName.replace(/ContractPages?$/, ''));
  candidates.add(fileName.replace(/Page$/, ''));
  const exportedComponents = /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
  for (const match of contents.matchAll(exportedComponents)) candidates.add(match[1]);
  return candidates;
}

function getFeaturePageImports(repoPath, contents, pagePaths) {
  const featurePagePaths = new Set();
  const sourceDirectory = dirname(resolve(repositoryRoot, repoPath));
  const pattern = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

  for (const match of contents.matchAll(pattern)) {
    const importPath = match[1];
    if (!importPath.startsWith('@/') && !importPath.startsWith('.')) continue;

    const importBase = importPath.startsWith('@/')
      ? resolve(sourceRoot, importPath.slice(2))
      : resolve(sourceDirectory, importPath);

    for (const extension of extensions) {
      const candidate = toRepoPath(`${importBase}${extension}`);
      if (
        candidate.startsWith('src/features/') &&
        candidate.includes('/pages/') &&
        pagePaths.includes(candidate)
      ) {
        featurePagePaths.add(candidate);
      }
    }
  }

  return [...featurePagePaths].sort();
}

function pagePathForRouteTarget(target, sourcePath, pagePaths, developmentShimByTarget) {
  if (!target) return undefined;
  const modulePath = target.startsWith('@/')
    ? posix.join('src', target.slice(2))
    : posix.join(posix.dirname(sourcePath), target);
  const normalizedTarget = posix.normalize(modulePath).replace(/\.[^.]+$/, '');
  const pagePath = pagePaths.find(
    (candidate) => candidate.replace(/\.[^.]+$/, '') === normalizedTarget,
  );
  if (pagePath) return pagePath;
  if (normalizedTarget.startsWith('src/dev/')) {
    return developmentShimByTarget.get(normalizedTarget);
  }
  return undefined;
}

function getRouteRecordsForPage(pagePath, routeRecords, contents = '') {
  const candidates = componentCandidates(pagePath, contents);
  const normalizedPagePath = pagePath.replace(/\.[^.]+$/, '');
  return routeRecords.filter((record) => {
    if (record.pageTarget?.replace(/\.[^.]+$/, '') === normalizedPagePath) return true;
    if (
      record.compositionTargets?.some(
        (target) => target.replace(/\.[^.]+$/, '') === normalizedPagePath,
      )
    ) {
      return true;
    }
    if (record.target) return false;
    return candidates.has(record.component);
  });
}

function routePathsForPage(pagePath, routeRecords, contents = '') {
  return [
    ...new Set(
      getRouteRecordsForPage(pagePath, routeRecords, contents).map((record) => record.path),
    ),
  ].sort();
}

function classifyMockDependencies(contents) {
  const references = new Set();
  const sourceFile = ts.createSourceFile(
    'architecture-inventory.tsx',
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const visit = (node) => {
    if (ts.isIdentifier(node)) {
      if (/(?:mockData|predictionMockData|fixture|fixtures)/i.test(node.text)) {
        references.add(node.text);
      }
      if (/^MOCK_[A-Z0-9_]+$/.test(node.text)) references.add('MOCK_*');
      if (/^(?:simulate|simulated|simulation)$/i.test(node.text)) references.add('simulation');
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.getText(sourceFile) === 'Math.random'
    ) {
      references.add('Math.random');
    }

    if (
      (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) ||
      (ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0]))
    ) {
      const importPath = ts.isImportDeclaration(node)
        ? node.moduleSpecifier.text
        : node.arguments[0].text;
      if (/(?:mock|fixture)/i.test(importPath)) references.add('mock/fixture import');
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return [...references].sort();
}

function classifyDirectRuntimeAccess(contents) {
  // Loại comment và string literal để không coi code example trong tài liệu
  // API là hành vi runtime của page.
  const runtimeSource = stripCommentsAndStrings(contents);
  return {
    fetch: /\bfetch\s*\(/.test(runtimeSource),
    websocket: /\bWebSocket\s*\(/.test(runtimeSource),
    storage: /\b(?:localStorage|sessionStorage)\b/.test(runtimeSource),
  };
}

function stripCommentsAndStrings(contents) {
  let output = '';
  let state = 'code';
  let quote = '';

  for (let index = 0; index < contents.length; index += 1) {
    const current = contents[index];
    const next = contents[index + 1];

    if (state === 'code') {
      if (current === '/' && next === '/') {
        state = 'line-comment';
        output += '  ';
        index += 1;
      } else if (current === '/' && next === '*') {
        state = 'block-comment';
        output += '  ';
        index += 1;
      } else if (current === "'" || current === '"' || current === '`') {
        state = 'string';
        quote = current;
        output += ' ';
      } else {
        output += current;
      }
      continue;
    }

    if (state === 'line-comment') {
      if (current === '\n' || current === '\r') {
        state = 'code';
        output += current;
      } else {
        output += ' ';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        state = 'code';
        output += '  ';
        index += 1;
      } else {
        output += current === '\n' || current === '\r' ? current : ' ';
      }
      continue;
    }

    if (current === '\\') {
      output += '  ';
      index += 1;
    } else if (current === quote) {
      state = 'code';
      quote = '';
      output += ' ';
    } else {
      output += current === '\n' || current === '\r' ? current : ' ';
    }
  }

  return output;
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function isTestFile(path) {
  return /\.(?:test|spec)\.[^.]+$/.test(path);
}

async function buildInventory() {
  const allSourceFiles = (await collectFiles(sourceRoot)).filter((file) =>
    /\.(?:ts|tsx|js|jsx)$/.test(file),
  );
  const sourcePaths = new Set(allSourceFiles.map(toRepoPath));
  const routeEntryPaths = ['src/app/routeConfig.ts', 'src/app/routes.ts'].filter((path) =>
    sourcePaths.has(path),
  );
  const reachableRouteGraph = new Set();
  const pendingRouteGraph = [...routeEntryPaths];
  while (pendingRouteGraph.length > 0) {
    const importerPath = pendingRouteGraph.pop();
    if (!importerPath || reachableRouteGraph.has(importerPath)) continue;
    reachableRouteGraph.add(importerPath);

    const contents = await readFile(resolve(repositoryRoot, importerPath), 'utf8');
    for (const importPath of extractLocalImports(contents)) {
      const targetPath = resolveSourceImport(importerPath, importPath, sourcePaths);
      if (targetPath && !reachableRouteGraph.has(targetPath)) pendingRouteGraph.push(targetPath);
    }
  }
  const routePageTargetPaths = new Set();
  const isPageTreeFile = (repoPath) =>
    /^src\/app\/pages\//.test(repoPath) ||
    /^src\/features\/[^/]+\/pages\//.test(repoPath) ||
    (/^src\/dev\/legacy\//.test(repoPath) && /(?:Page|Screen)\.tsx?$/.test(repoPath)) ||
    routePageTargetPaths.has(repoPath);
  const isPageSupportFile = (repoPath) =>
    repoPath.includes('/components/') || /(?:Data|Components)\.(?:ts|tsx|js|jsx)$/i.test(repoPath);
  const routeSourceFiles = allSourceFiles.filter((file) => {
    const repoPath = toRepoPath(file);
    const isRouteSource =
      /(?:^|\/)(?:routeConfig|routes|[A-Za-z0-9]+Routes)(?:\.lazy)?\.(?:ts|tsx)$/i.test(repoPath);
    return isRouteSource && reachableRouteGraph.has(repoPath);
  });
  const routeRecords = [];
  const routeFactoryBindings = [];
  const authRouteContents = await readFile(
    resolve(sourceRoot, 'features', 'auth', 'routes.ts'),
    'utf8',
  );
  const authRoutePaths = extractAuthRoutePaths(authRouteContents);
  for (const file of routeSourceFiles) {
    const sourcePath = toRepoPath(file);
    const contents = await readFile(file, 'utf8');
    const targets = extractRouteImportTargets(contents);
    if (sourcePath !== 'src/features/auth/routes.ts') {
      routeRecords.push(...extractRouteRecords(sourcePath, contents));
      routeRecords.push(
        ...extractAuthFactoryRouteRecords(sourcePath, contents, authRoutePaths, targets),
      );
    }
    routeFactoryBindings.push(...extractRouteFactoryBindings(sourcePath, contents, sourcePaths));
  }

  const resolvedRouteRecords = [];
  for (const route of routeRecords) {
    const bindings = routeFactoryBindings.filter(
      (binding) => binding.factory === route.routeFactory && binding.slot === route.componentSlot,
    );
    if (bindings.length === 0) {
      resolvedRouteRecords.push(route);
      continue;
    }

    for (const binding of bindings) {
      resolvedRouteRecords.push({
        ...route,
        component: binding.component,
        target: binding.target,
        developmentOnly: route.developmentOnly || binding.developmentOnly,
      });
    }
  }
  routeRecords.splice(0, routeRecords.length, ...resolvedRouteRecords);

  const appRoutesPath = 'src/app/routes.ts';
  if (reachableRouteGraph.has(appRoutesPath)) {
    const appRoutesContents = await readFile(resolve(repositoryRoot, appRoutesPath), 'utf8');
    const shellOverrideTargets = extractShellOverrideTargets(appRoutesContents);
    for (const route of routeRecords) {
      if (route.target) continue;
      const target = resolveShellOverrideTarget(route, shellOverrideTargets);
      if (!target) continue;

      const resolvedTarget = resolveSourceImport(appRoutesPath, target.path, sourcePaths);
      route.target = resolvedTarget
        ? `@/${resolvedTarget.slice('src/'.length).replace(/\.(?:tsx?|jsx?)$/, '')}`
        : target.path;
    }
  }

  for (const route of routeRecords) {
    if (!route.target) continue;
    const targetPath = resolveSourceImport(route.source, route.target, sourcePaths);
    if (targetPath?.startsWith('src/dev/legacy/') && /\.(?:tsx|jsx)$/.test(targetPath)) {
      routePageTargetPaths.add(targetPath);
    }
  }

  const pageFiles = allSourceFiles.filter((file) => {
    const repoPath = toRepoPath(file);
    return !isTestFile(repoPath) && isPageTreeFile(repoPath) && !isPageSupportFile(repoPath);
  });
  const dataModuleFiles = [];
  for (const file of allSourceFiles) {
    const repoPath = toRepoPath(file);
    if (isTestFile(repoPath) || !/Data\.(?:ts|tsx)$/i.test(repoPath.split('/').pop() ?? '')) {
      continue;
    }
    if (repoPath.startsWith('src/dev/legacy/')) {
      dataModuleFiles.push(file);
      continue;
    }
    if (!isPageTreeFile(repoPath)) continue;
    const contents = await readFile(file, 'utf8');
    if (!contents.includes('@/dev/legacy/')) dataModuleFiles.push(file);
  }

  const pagePaths = pageFiles.map(toRepoPath);
  const developmentContentCache = new Map();
  const developmentShimByTarget = new Map();
  for (const pagePath of pagePaths) {
    const pageContents = await readFile(resolve(repositoryRoot, pagePath), 'utf8');
    const developmentDependencies = await inspectDevelopmentDependencies(
      pagePath,
      pageContents,
      sourcePaths,
      developmentContentCache,
    );
    for (const target of developmentDependencies.developmentTargets) {
      const normalizedTarget = target.replace(/\.[^.]+$/, '');
      if (!developmentShimByTarget.has(normalizedTarget)) {
        developmentShimByTarget.set(normalizedTarget, pagePath);
      }
    }
  }
  const developmentOnlyPagePaths = new Set();
  const productionPagePaths = new Set();
  for (const route of routeRecords) {
    const pagePath = pagePathForRouteTarget(
      route.target,
      route.source,
      pagePaths,
      developmentShimByTarget,
    );
    if (!pagePath) continue;
    if (route.developmentOnly) developmentOnlyPagePaths.add(pagePath);
    else productionPagePaths.add(pagePath);
  }
  const pageContentCache = new Map();
  for (const route of routeRecords) {
    const adapterPath = pagePathForRouteTarget(
      route.target,
      route.source,
      pagePaths,
      developmentShimByTarget,
    );
    route.pageTarget = adapterPath;
    if (!adapterPath || !adapterPath.startsWith('src/app/pages/')) continue;

    let adapterContents = pageContentCache.get(adapterPath);
    if (adapterContents === undefined) {
      adapterContents = await readFile(resolve(repositoryRoot, adapterPath), 'utf8');
      pageContentCache.set(adapterPath, adapterContents);
    }

    const compositionTargets = getFeaturePageImports(adapterPath, adapterContents, pagePaths);
    if (compositionTargets.length > 0) route.compositionTargets = compositionTargets;
  }

  const unresolvedDevelopmentPageRoutes = routeRecords.filter((route) => {
    if (!route.target) return false;
    const targetPath = resolveSourceImport(route.source, route.target, sourcePaths);
    return (
      targetPath?.startsWith('src/dev/legacy/') === true &&
      pagePaths.includes(targetPath) &&
      route.pageTarget !== targetPath
    );
  });
  if (unresolvedDevelopmentPageRoutes.length > 0) {
    throw new Error(
      `Development page routes are missing inventory targets: ${unresolvedDevelopmentPageRoutes
        .map((route) => `${route.source}:${route.path} -> ${route.target}`)
        .join(', ')}`,
    );
  }

  const productionCertifications = await loadProductionCertifications(pagePaths, { routeRecords });

  const pages = [];
  for (const file of pageFiles) {
    const path = toRepoPath(file);
    const contents = await readFile(file, 'utf8');
    const developmentDependencies = await inspectDevelopmentDependencies(
      path,
      contents,
      sourcePaths,
      developmentContentCache,
    );
    const mockReferences = [
      ...new Set([
        ...classifyMockDependencies(contents),
        ...developmentDependencies.mockReferences,
      ]),
    ].sort();
    const dependencies = {
      localImports: extractLocalImports(contents),
      mockReferences,
      directRuntimeAccess: classifyDirectRuntimeAccess(contents),
    };
    const certification = productionCertifications.get(path);
    validateProductionEvidence(path, certification, routeRecords, dependencies, contents);
    pages.push({
      path,
      domain: toDomain(path),
      owner: getOwner(path),
      status: getStatus(
        path,
        contents,
        routeRecords,
        certification,
        developmentOnlyPagePaths,
        productionPagePaths,
      ),
      lines: contents.split(/\r?\n/).length,
      routePaths: routePathsForPage(path, routeRecords, contents),
      dependencies,
      ...(developmentDependencies.developmentTargets.length > 0
        ? { developmentTargets: developmentDependencies.developmentTargets }
        : {}),
      ...(certification ? { certification } : {}),
    });
  }

  const dataModules = [];
  for (const file of dataModuleFiles) {
    const repoPath = toRepoPath(file);
    const contents = await readFile(file, 'utf8');
    dataModules.push({
      path: repoPath,
      domain: toDomain(repoPath),
      owner: getOwner(repoPath),
      lines: contents.split(/\r?\n/).length,
      mockReferences: classifyMockDependencies(contents),
    });
  }

  const componentFiles = allSourceFiles.filter((file) => {
    const repoPath = toRepoPath(file);
    return (
      !isTestFile(repoPath) &&
      (/\/components\//.test(repoPath) ||
        /^src\/shared\/ui\//.test(repoPath) ||
        (/^src\/app\/pages\//.test(repoPath) && /Components\.tsx$/i.test(repoPath)))
    );
  });
  const components = [];
  for (const file of componentFiles) {
    const repoPath = toRepoPath(file);
    const contents = await readFile(file, 'utf8');
    const isAppComponentCompatibilityShim =
      /^src\/app\/components\//.test(repoPath) &&
      /^\s*(?:export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+['"]@\/(?:shared|features)\/[^'"]+['"]\s*;?\s*)+$/.test(
        contents,
      );
    if (!isAppComponentCompatibilityShim) {
      components.push({ path: repoPath, domain: toDomain(repoPath) });
    }
  }
  const services = allSourceFiles
    .filter(
      (file) => !isTestFile(toRepoPath(file)) && /\/(?:services|api)\//.test(toRepoPath(file)),
    )
    .map((file) => ({ path: toRepoPath(file), domain: toDomain(toRepoPath(file)) }));
  const mocks = allSourceFiles
    .filter((file) => !isTestFile(toRepoPath(file)) && /(?:mock|fixture)/i.test(toRepoPath(file)))
    .map((file) => ({ path: toRepoPath(file), domain: toDomain(toRepoPath(file)) }));
  const routes = [
    ...new Map(
      routeRecords.map((route) => [
        `${route.source}:${route.path}:${route.component}:${route.target ?? ''}:${route.developmentOnly}`,
        route,
      ]),
    ).values(),
  ].sort(
    (left, right) => left.path.localeCompare(right.path) || left.source.localeCompare(right.source),
  );
  const pageStatusCounts = countBy(pages, 'status');

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/generate-architecture-inventory.mjs',
    sourceRoots: [
      'src/app/pages',
      'src/features',
      'src/dev',
      'src/app/components',
      'src/shared/ui',
      'src/app/services',
    ],
    summary: {
      pageCount: pages.length,
      routeCount: routes.length,
      componentCount: components.length,
      dataModuleCount: dataModules.length,
      serviceCount: services.length,
      mockCount: mocks.length,
      pageStatus: Object.fromEntries(
        [...allowedStatuses].map((status) => [status, pageStatusCounts[status] ?? 0]),
      ),
      pageOwner: countBy(pages, 'owner'),
      pagesWithMockReferences: pages.filter((page) => page.dependencies.mockReferences.length > 0)
        .length,
      pagesWithDirectRuntimeAccess: pages.filter((page) =>
        Object.values(page.dependencies.directRuntimeAccess).some(Boolean),
      ).length,
    },
    pages: pages.sort((left, right) => left.path.localeCompare(right.path)),
    routes,
    components: components.sort((left, right) => left.path.localeCompare(right.path)),
    dataModules: dataModules.sort((left, right) => left.path.localeCompare(right.path)),
    services: services.sort((left, right) => left.path.localeCompare(right.path)),
    mocks: mocks.sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function validateInventory(inventory) {
  const errors = [];
  if (!inventory.pages.length) errors.push('No pages were discovered.');
  if (!inventory.routes.length) errors.push('No routes were discovered.');
  const actualPageStatusCounts = countBy(inventory.pages, 'status');
  for (const status of allowedStatuses) {
    const actual = actualPageStatusCounts[status] ?? 0;
    const reported = inventory.summary?.pageStatus?.[status];
    if (reported !== actual) {
      errors.push(`Inventory pageStatus count for ${status} is ${reported}; expected ${actual}.`);
    }
  }
  const paths = new Set();
  for (const page of inventory.pages) {
    if (!page.owner) errors.push(`Missing owner: ${page.path}`);
    if (!allowedStatuses.has(page.status))
      errors.push(`Invalid status ${page.status}: ${page.path}`);
    if (
      ['production', 'integration-pending'].includes(page.status) &&
      page.routePaths.length === 0
    ) {
      errors.push(`Routed page status requires route evidence: ${page.path}`);
    }
    if (page.status === 'not-implemented' && page.routePaths.length > 0) {
      errors.push(`Not-implemented page has route evidence: ${page.path}`);
    }
    if (Object.values(page.dependencies.directRuntimeAccess).some(Boolean)) {
      errors.push(`Page uses direct runtime access; move it behind a shared adapter: ${page.path}`);
    }
    if (paths.has(page.path)) errors.push(`Duplicate page: ${page.path}`);
    paths.add(page.path);
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export {
  extractRouteRecords,
  extractRouteFactoryBindings,
  getStatus,
  loadProductionCertifications,
  resolveShellOverrideTarget,
  validateInventory,
  validateProductionEvidence,
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventory = await buildInventory();
  validateInventory(inventory);
  const serialized = `${JSON.stringify(inventory, null, 2)}\n`;

  if (process.argv.includes('--check')) {
    let current;
    try {
      current = await readFile(inventoryPath, 'utf8');
    } catch {
      throw new Error(
        `Inventory is missing: ${toRepoPath(inventoryPath)}. Run npm run architecture:inventory.`,
      );
    }
    if (current !== serialized) {
      throw new Error(
        `Architecture inventory is stale: ${toRepoPath(inventoryPath)}. Run npm run architecture:inventory.`,
      );
    }
    console.log(
      `Architecture inventory passed: ${inventory.summary.pageCount} pages, ${inventory.summary.routeCount} routes, ${inventory.summary.componentCount} components, ${inventory.summary.dataModuleCount} data modules, ${inventory.summary.serviceCount} services and ${inventory.summary.mockCount} mocks.`,
    );
  } else {
    await mkdir(dirname(inventoryPath), { recursive: true });
    await writeFile(inventoryPath, serialized, 'utf8');
    console.log(
      `Architecture inventory generated: ${toRepoPath(inventoryPath)} (${inventory.summary.pageCount} pages, ${inventory.summary.routeCount} routes, ${inventory.summary.componentCount} components and ${inventory.summary.dataModuleCount} data modules).`,
    );
  }
}
