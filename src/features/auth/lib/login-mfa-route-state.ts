import type { LoginMfaChallenge } from '@/shared/session/session-types';

const loginMfaMethods = new Set<LoginMfaChallenge['method']>(['totp', 'sms', 'email']);

export function parseLoginMfaChallengeState(value: unknown): LoginMfaChallenge | null {
  if (!value || typeof value !== 'object') return null;

  const state = value as Record<string, unknown>;
  if (
    typeof state.challengeId !== 'string' ||
    state.challengeId.trim().length === 0 ||
    typeof state.method !== 'string' ||
    !loginMfaMethods.has(state.method as LoginMfaChallenge['method']) ||
    typeof state.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(state.expiresAt)) ||
    Date.parse(state.expiresAt) <= Date.now() ||
    (state.maskedDestination !== undefined && typeof state.maskedDestination !== 'string')
  ) {
    return null;
  }

  return {
    id: state.challengeId,
    method: state.method as LoginMfaChallenge['method'],
    maskedDestination: state.maskedDestination as string | undefined,
    expiresAt: state.expiresAt,
  };
}
