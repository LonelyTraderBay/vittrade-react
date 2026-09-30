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
const seenChallengeExceptions = new Set();
let contractCount = 0;
let operationCount = 0;

// Auth operations have operation-specific credential/session semantics. Keep
// the four Wallet/P2P challenge operations as explicit, reason-bearing
// exceptions; other challenge-looking paths remain business mutations.
const challengeMutationExceptions = new Map([
  [
    'POST /wallet/withdrawals/challenge',
    {
      operationId: 'createWalletWithdrawalChallenge',
      reason:
        'Wallet withdrawal MFA challenge issuance remains outside the generic business Idempotency-Key rule; replay semantics are not specified and must be defined separately.',
    },
  ],
  [
    'POST /wallet/withdrawals/challenge/{challengeId}/verify',
    {
      operationId: 'verifyWalletWithdrawalChallenge',
      reason:
        'Wallet withdrawal MFA challenge verification remains outside the generic business Idempotency-Key rule; one-time verification and replay semantics must be defined separately.',
    },
  ],
  [
    'POST /p2p/orders/{orderId}/release/challenge',
    {
      operationId: 'createP2PReleaseChallenge',
      reason:
        'Release MFA challenge issuance is a challenge-flow exception; replay semantics are unspecified and must be defined separately.',
    },
  ],
  [
    'POST /p2p/orders/{orderId}/release/challenge/{challengeId}/verify',
    {
      operationId: 'verifyP2PReleaseChallenge',
      reason:
        'Release MFA challenge verification is a challenge-flow exception; one-time verification and replay semantics must be defined separately.',
    },
  ],
]);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function addError(fileName, message) {
  errors.push(`${fileName}: ${message}`);
}

function hasSecurityDeclaration(document, operation) {
  return Array.isArray(operation.security) || Array.isArray(document.security);
}

function resolveParameter(document, parameter) {
  if (!parameter?.$ref) return parameter;

  const reference = parameter.$ref.match(/^#\/components\/parameters\/([^/]+)$/);
  if (!reference) return null;

  const name = reference[1].replace(/~1/g, '/').replace(/~0/g, '~');
  return document.components?.parameters?.[name] ?? null;
}

function hasRequiredIdempotencyParameter(document, pathItem, operation) {
  const parameters = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ];

  return parameters.some((parameter) => {
    const resolved = resolveParameter(document, parameter);
    return (
      resolved?.name === 'Idempotency-Key' &&
      resolved?.in === 'header' &&
      resolved?.required === true
    );
  });
}

function hasRequiredPermissions(operation) {
  const permissions = operation['x-required-permissions'];
  return (
    Array.isArray(permissions) &&
    permissions.length > 0 &&
    permissions.every((permission) => typeof permission === 'string' && permission.trim()) &&
    new Set(permissions).size === permissions.length
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

      const mutationKey = `${method.toUpperCase()} ${path}`;
      const challengeException = challengeMutationExceptions.get(mutationKey);
      if (challengeException) {
        seenChallengeExceptions.add(mutationKey);
        if (operationId !== challengeException.operationId) {
          addError(
            fileName,
            `${mutationKey} must remain mapped to ${challengeException.operationId}`,
          );
        }
        if (operation['x-idempotency-exception-reason'] !== challengeException.reason) {
          addError(
            fileName,
            `${mutationKey} must record its explicit idempotency exception reason`,
          );
        }
        if (
          operation['x-required-permissions'] !== undefined &&
          !hasRequiredPermissions(operation)
        ) {
          addError(
            fileName,
            `${mutationKey} declares x-required-permissions but the list is invalid`,
          );
        }
      }

      // Auth/credential/session operations follow their operation-specific
      // policy in auth.yaml. All other business mutations require both guards.
      const isBusinessMutation =
        ['post', 'put', 'patch', 'delete'].includes(method) &&
        !path.startsWith('/auth/') &&
        !challengeException;
      if (isBusinessMutation) {
        if (!hasRequiredIdempotencyParameter(document, pathItem, operation)) {
          addError(fileName, `${mutationKey} must require Idempotency-Key: required=true`);
        }
        if (!hasRequiredPermissions(operation)) {
          addError(fileName, `${mutationKey} must declare a non-empty x-required-permissions list`);
        }
        if (
          operation['x-required-permissions-status'] === 'draft_frontend' &&
          (typeof operation['x-required-permissions-owner-question'] !== 'string' ||
            !operation['x-required-permissions-owner-question'].trim())
        ) {
          addError(
            fileName,
            `${mutationKey} draft_frontend permissions must include an owner question`,
          );
        }
      }
    }
  }
}

for (const mutationKey of challengeMutationExceptions.keys()) {
  if (!seenChallengeExceptions.has(mutationKey)) {
    addError('contracts', `${mutationKey} challenge exception is missing`);
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
