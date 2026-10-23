import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { parse } from 'yaml';

const root = process.cwd();
const contractDirectory = join(root, 'contracts', 'openapi');
const handlersPath = join(root, 'src', 'dev', 'mocks', 'handlers.ts');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);

function canonicalPath(path, source) {
  let normalized = path;
  if (source === 'mock') normalized = normalized.replace(/^\*\//, '/');
  return normalized.replace(/\{([^{}]+)\}/g, ':$1');
}

function routeKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

export function collectContractRoutes(contractSources) {
  const routes = new Map();
  const errors = [];

  for (const { fileName, source } of contractSources) {
    let document;
    try {
      document = parse(source);
    } catch (error) {
      errors.push(`${fileName}: YAML parse failed: ${error.message}`);
      continue;
    }

    if (!document?.paths || typeof document.paths !== 'object' || Array.isArray(document.paths)) {
      errors.push(`${fileName}: missing OpenAPI paths object`);
      continue;
    }

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!path.startsWith('/') || !pathItem || typeof pathItem !== 'object') {
        errors.push(`${fileName}: invalid OpenAPI path item ${path}`);
        continue;
      }

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!methods.has(method.toLowerCase())) continue;
        const key = routeKey(method, canonicalPath(path, 'contract'));
        if (routes.has(key)) {
          errors.push(`${fileName}: duplicate OpenAPI route ${key} (also in ${routes.get(key)})`);
        } else {
          routes.set(key, fileName);
        }
        if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
          errors.push(`${fileName}: ${key} is not an operation object`);
        }
      }
    }
  }

  return { routes, errors };
}

export function collectMockRoutes(handlerSource) {
  const sourceFile = ts.createSourceFile(
    handlersPath,
    handlerSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const routes = new Map();
  const errors = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const isHttpCall =
        (ts.isPropertyAccessExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          expression.expression.text === 'http') ||
        (ts.isElementAccessExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          expression.expression.text === 'http');

      if (isHttpCall) {
        if (!ts.isPropertyAccessExpression(expression)) {
          errors.push(
            `line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: computed http method is not supported`,
          );
        } else {
          const method = expression.name.text.toLowerCase();
          if (!methods.has(method)) {
            errors.push(
              `line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: unsupported http method ${method}`,
            );
          } else {
            const routeArgument = node.arguments[0];
            if (!routeArgument || !ts.isStringLiteralLike(routeArgument)) {
              errors.push(
                `line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: http.${method} route must be a string literal`,
              );
            } else {
              const routePath = canonicalPath(routeArgument.text, 'mock');
              if (!routePath.startsWith('/')) {
                errors.push(
                  `line ${sourceFile.getLineAndCharacterOfPosition(routeArgument.getStart()).line + 1}: MSW route must resolve to an absolute path`,
                );
              } else {
                const key = routeKey(method, routePath);
                if (routes.has(key)) {
                  errors.push(
                    `line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: duplicate MSW route ${key} (first declared on line ${routes.get(key)})`,
                  );
                } else {
                  routes.set(
                    key,
                    sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                  );
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  for (const diagnostic of sourceFile.parseDiagnostics) {
    const line = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
    errors.push(
      `line ${line}: TypeScript parse error: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
    );
  }
  return { routes, errors };
}

export function compareRouteSets(contractRoutes, mockRoutes) {
  const missing = [...contractRoutes.keys()].filter((key) => !mockRoutes.has(key)).sort();
  const extra = [...mockRoutes.keys()].filter((key) => !contractRoutes.has(key)).sort();
  return { missing, extra };
}

export function checkParity({ contractSources, handlerSource }) {
  const contracts = collectContractRoutes(contractSources);
  const mocks = collectMockRoutes(handlerSource);
  const differences = compareRouteSets(contracts.routes, mocks.routes);
  const errors = [...contracts.errors, ...mocks.errors];
  if (contracts.routes.size === 0) errors.push('No OpenAPI operations were found.');
  if (mocks.routes.size === 0) errors.push('No MSW HTTP handlers were found.');
  return {
    contractCount: contracts.routes.size,
    mockCount: mocks.routes.size,
    errors,
    ...differences,
    passed:
      errors.length === 0 && differences.missing.length === 0 && differences.extra.length === 0,
  };
}

async function main() {
  const contractFiles = (await readdir(contractDirectory))
    .filter((fileName) => extname(fileName) === '.yaml')
    .sort();
  const contractSources = await Promise.all(
    contractFiles.map(async (fileName) => ({
      fileName,
      source: await readFile(join(contractDirectory, fileName), 'utf8'),
    })),
  );
  const result = checkParity({
    contractSources,
    handlerSource: await readFile(handlersPath, 'utf8'),
  });

  if (result.passed) {
    console.log(
      `OpenAPI/MSW method-path parity passed: ${result.contractCount}/${result.mockCount} routes match across ${contractFiles.length} contracts.`,
    );
    return;
  }

  console.error(
    `OpenAPI/MSW method-path parity failed: ${result.contractCount} contract routes, ${result.mockCount} MSW routes, ${result.missing.length} missing, ${result.extra.length} extra.`,
  );
  for (const error of result.errors) console.error(`- ${error}`);
  for (const route of result.missing) console.error(`- Missing MSW handler: ${route}`);
  for (const route of result.extra) console.error(`- Undeclared MSW handler: ${route}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
