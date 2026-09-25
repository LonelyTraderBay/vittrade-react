export type MutationAttempt = { signature: string; key: string };
export type MutationAttempts = Map<string, MutationAttempt>;

export function getMutationAttemptKey(
  attempts: MutationAttempts,
  operationId: string,
  signature: string,
  prefix: string,
) {
  let attempt = attempts.get(operationId);
  if (attempt?.signature !== signature) {
    attempt = { signature, key: `${prefix}-${crypto.randomUUID()}` };
    attempts.set(operationId, attempt);
  }
  return attempt.key;
}

export function clearMutationAttempt(
  attempts: MutationAttempts,
  operationId: string,
  signature: string,
) {
  if (attempts.get(operationId)?.signature === signature) attempts.delete(operationId);
}
