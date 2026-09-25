import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { parse } from 'yaml';

const contractDirectory = join(process.cwd(), 'contracts', 'openapi');
const operationMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]);
const errors = [];
const operationIds = new Map();
let contractCount = 0;
let operationCount = 0;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function addError(fileName, message) {
  errors.push(`${fileName}: ${message}`);
}

function hasSecurityDeclaration(document, operation) {
  return Array.isArray(operation.security) || Array.isArray(document.security);
}

function hasRequiredIdempotencyParameter(pathItem, operation) {
  const parameters = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ];

  return parameters.some(
    (parameter) =>
      (parameter?.name === 'Idempotency-Key' && parameter?.in === 'header') ||
      parameter?.$ref?.endsWith('/IdempotencyKey'),
  );
}

const files = (await readdir(contractDirectory)).filter(
  (fileName) => extname(fileName) === '.yaml',
);

for (const fileName of files.sort()) {
  const filePath = join(contractDirectory, fileName);
  let document;

  try {
    document = parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    addError(
      fileName,
      `YAML parse failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    continue;
  }

  contractCount += 1;
  if (!isRecord(document) || !/^3\./.test(String(document.openapi ?? ''))) {
    addError(fileName, 'must declare an OpenAPI 3.x document');
    continue;
  }
  if (!isRecord(document.info) || !document.info.title || !document.info.version) {
    addError(fileName, 'must declare info.title and info.version');
  }
  if (!isRecord(document.paths) || Object.keys(document.paths).length === 0) {
    addError(fileName, 'must declare at least one path');
    continue;
  }
  if (!isRecord(document.components?.securitySchemes)) {
    addError(fileName, 'must declare components.securitySchemes');
  }

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!isRecord(pathItem)) {
      addError(fileName, `${path} must be a path item object`);
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operationMethods.has(method)) continue;
      if (!isRecord(operation)) {
        addError(fileName, `${method.toUpperCase()} ${path} must be an operation object`);
        continue;
      }

      operationCount += 1;
      const operationId = operation.operationId;
      if (typeof operationId !== 'string' || operationId.length === 0) {
        addError(fileName, `${method.toUpperCase()} ${path} is missing operationId`);
      } else if (operationIds.has(operationId)) {
        addError(
          fileName,
          `${method.toUpperCase()} ${path} duplicates operationId ${operationId} from ${operationIds.get(operationId)}`,
        );
      } else {
        operationIds.set(operationId, `${fileName} ${method.toUpperCase()} ${path}`);
      }

      if (!isRecord(operation.responses) || Object.keys(operation.responses).length === 0) {
        addError(fileName, `${method.toUpperCase()} ${path} must declare responses`);
      }
      if (!hasSecurityDeclaration(document, operation)) {
        addError(
          fileName,
          `${method.toUpperCase()} ${path} must declare security or inherit root security`,
        );
      }

      // Business mutations must be idempotent. Authentication challenges are
      // intentionally excluded because they are nonce issuance/verification flows.
      const isBusinessMutation =
        ['post', 'put', 'patch', 'delete'].includes(method) &&
        !path.startsWith('/auth/') &&
        !path.includes('/challenge');
      if (isBusinessMutation && !hasRequiredIdempotencyParameter(pathItem, operation)) {
        addError(fileName, `${method.toUpperCase()} ${path} must require Idempotency-Key`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('OpenAPI contract gate failed:');
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `OpenAPI contract gate passed: ${contractCount} contracts, ${operationCount} operations validated.`,
);
