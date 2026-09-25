import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const authContract = parse(
  readFileSync(resolve(process.cwd(), 'contracts/openapi/auth.yaml'), 'utf8'),
);

describe('auth OpenAPI login MFA contract', () => {
  it('describes login as an authenticated session or backend-issued MFA challenge', () => {
    const responseSchema =
      authContract.paths['/auth/login'].post.responses['200'].content['application/json'].schema;

    expect(responseSchema).toMatchObject({
      oneOf: [
        { $ref: '#/components/schemas/AuthenticatedLoginResult' },
        { $ref: '#/components/schemas/MfaRequiredLoginResult' },
      ],
      discriminator: {
        propertyName: 'status',
        mapping: {
          authenticated: '#/components/schemas/AuthenticatedLoginResult',
          mfa_required: '#/components/schemas/MfaRequiredLoginResult',
        },
      },
    });

    expect(authContract.components.schemas.AuthenticatedLoginResult).toMatchObject({
      required: ['status', 'session'],
      properties: {
        status: { const: 'authenticated' },
        session: { $ref: '#/components/schemas/AuthSession' },
      },
    });
    expect(authContract.components.schemas.MfaRequiredLoginResult).toMatchObject({
      required: ['status', 'challenge'],
      properties: {
        status: { const: 'mfa_required' },
        challenge: { $ref: '#/components/schemas/LoginMfaChallenge' },
      },
    });
    expect(authContract.components.schemas.LoginMfaChallenge).toMatchObject({
      required: ['id', 'method', 'expiresAt'],
      properties: {
        id: { type: 'string', minLength: 1 },
        method: { type: 'string', enum: ['totp', 'sms', 'email'] },
        maskedDestination: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    });
  });

  it('defines login challenge verification with only a challenge ID and code', () => {
    const operation = authContract.paths['/auth/login/mfa/verify'].post;
    const requestSchema = operation.requestBody.content['application/json'].schema;

    expect(requestSchema).toEqual({
      $ref: '#/components/schemas/LoginMfaVerificationRequest',
    });
    expect(authContract.components.schemas.LoginMfaVerificationRequest).toMatchObject({
      required: ['challengeId', 'code'],
      properties: {
        challengeId: { type: 'string', minLength: 1 },
        code: { type: 'string', pattern: '^\\d{6}$' },
      },
    });
    expect(
      Object.keys(authContract.components.schemas.LoginMfaVerificationRequest.properties),
    ).toEqual(['challengeId', 'code']);
    expect(operation.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/AuthSession',
    });
    expect(operation.responses).toHaveProperty('400');
    expect(operation.responses).toHaveProperty('410');
    expect(operation.responses['423']).toEqual({ $ref: '#/components/responses/AccountLocked' });
    expect(operation.responses).toHaveProperty('429');
  });
});
