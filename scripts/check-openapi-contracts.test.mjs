import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { stringify } from 'yaml';

const checkerPath = resolve(process.cwd(), 'scripts', 'check-openapi-contracts.mjs');

const challengeExceptions = [
  {
    path: '/wallet/withdrawals/challenge',
    operationId: 'createWalletWithdrawalChallenge',
    reason:
      'Wallet withdrawal MFA challenge issuance remains outside the generic business Idempotency-Key rule; replay semantics are not specified and must be defined separately.',
  },
  {
    path: '/wallet/withdrawals/challenge/{challengeId}/verify',
    operationId: 'verifyWalletWithdrawalChallenge',
    reason:
      'Wallet withdrawal MFA challenge verification remains outside the generic business Idempotency-Key rule; one-time verification and replay semantics must be defined separately.',
  },
  {
    path: '/p2p/orders/{orderId}/release/challenge',
    operationId: 'createP2PReleaseChallenge',
    reason:
      'Release MFA challenge issuance is a challenge-flow exception; replay semantics are unspecified and must be defined separately.',
  },
  {
    path: '/p2p/orders/{orderId}/release/challenge/{challengeId}/verify',
    operationId: 'verifyP2PReleaseChallenge',
    reason:
      'Release MFA challenge verification is a challenge-flow exception; one-time verification and replay semantics must be defined separately.',
  },
];

function createContract() {
  const paths = {
    '/auth/login': {
      post: { operationId: 'login', responses: { 200: { description: 'OK' } } },
    },
    '/orders': {
      post: {
        operationId: 'createOrder',
        parameters: [{ $ref: '#/components/parameters/IdempotencyKey' }],
        'x-required-permissions': ['orders:create'],
        responses: { 201: { description: 'Created' } },
      },
    },
  };

  for (const { path, operationId, reason } of challengeExceptions) {
    paths[path] = {
      post: {
        operationId,
        'x-idempotency-exception-reason': reason,
        responses: { 200: { description: 'OK' } },
      },
    };
  }

  return {
    openapi: '3.0.3',
    info: { title: 'Contract gate fixture', version: '1.0.0' },
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      parameters: {
        IdempotencyKey: {
          name: 'Idempotency-Key',
          in: 'header',
          required: true,
          schema: { type: 'string' },
        },
      },
    },
    paths,
  };
}

function runGate(mutate) {
  const root = mkdtempSync(join(tmpdir(), 'openapi-contract-gate-'));
  const contractPath = join(root, 'contracts', 'openapi', 'fixture.yaml');
  const contract = createContract();
  mutate?.(contract);
  mkdirSync(dirname(contractPath), { recursive: true });
  writeFileSync(contractPath, stringify(contract));

  try {
    const result = spawnSync(process.execPath, [checkerPath], {
      cwd: root,
      encoding: 'utf8',
    });
    return { ...result, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function expectGateFailure(mutate, message) {
  const result = runGate(mutate);
  expect(result.status).toBe(1);
  expect(result.output).toContain(message);
}

describe('OpenAPI contract gate', () => {
  it('keeps /auth mutations separate and permits only the four reason-bearing challenge exceptions', () => {
    const result = runGate();

    expect(result.status).toBe(0);
    expect(result.output).toContain('1 contracts, 6 operations validated');
  });

  it('rejects a business mutation without Idempotency-Key', () => {
    expectGateFailure(
      (contract) => delete contract.paths['/orders'].post.parameters,
      'POST /orders must require Idempotency-Key: required=true',
    );
  });

  it('rejects an optional Idempotency-Key', () => {
    expectGateFailure((contract) => {
      contract.components.parameters.IdempotencyKey.required = false;
    }, 'POST /orders must require Idempotency-Key: required=true');
  });

  it('rejects missing business permission metadata', () => {
    expectGateFailure(
      (contract) => delete contract.paths['/orders'].post['x-required-permissions'],
      'POST /orders must declare a non-empty x-required-permissions list',
    );
  });

  it('rejects duplicate operationId values', () => {
    expectGateFailure((contract) => {
      contract.paths['/auth/login'].post.operationId = 'createOrder';
    }, 'duplicates operationId createOrder');
  });

  it('rejects a mutation with no responses', () => {
    expectGateFailure((contract) => {
      contract.paths['/orders'].post.responses = {};
    }, 'POST /orders must declare responses');
  });

  it('rejects an operation without operation-level or inherited security', () => {
    expectGateFailure((contract) => {
      delete contract.security;
    }, 'POST /orders must declare security or inherit root security');
  });

  it('rejects a challenge exception with a changed policy reason', () => {
    expectGateFailure((contract) => {
      contract.paths[challengeExceptions[0].path].post['x-idempotency-exception-reason'] =
        'temporary exception';
    }, 'must record its explicit idempotency exception reason');
  });

  it('rejects removal of one of the explicitly listed challenge exceptions', () => {
    expectGateFailure(
      (contract) => delete contract.paths[challengeExceptions[0].path],
      'POST /wallet/withdrawals/challenge challenge exception is missing',
    );
  });

  it('does not exempt an unlisted challenge-like business endpoint', () => {
    expectGateFailure((contract) => {
      contract.paths['/orders/{orderId}/challenge'] = {
        post: {
          operationId: 'createOrderChallenge',
          responses: { 200: { description: 'OK' } },
        },
      };
    }, 'POST /orders/{orderId}/challenge must require Idempotency-Key: required=true');
  });
});
