const PARSE_BASE = 'https://relative.invalid'; // Parsing only; this URL is never requested.
const AUTH_PATH = /^\/(?:(?:t|w|r)\/)?(?:auth|onboarding)(?:\/|$)/i;
const hasControlCharacter = (value: string) =>
  [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

/** Accept a local destination while rejecting external targets and auth redirect loops. */
export function getLoginReturnPath(state: unknown, fallback: string): string {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return fallback;
  const context = state as Record<string, unknown>;
  const value = typeof context.from === 'string' ? context.from : context.returnTo;
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.trim() !== value ||
    hasControlCharacter(value) ||
    value.split(/[?#]/, 1)[0].includes('\\')
  )
    return fallback;

  try {
    const url = new URL(value, PARSE_BASE);
    const decodedPath = decodeURIComponent(url.pathname);
    const normalizedPath = new URL(decodedPath, PARSE_BASE);
    if (
      url.origin !== PARSE_BASE ||
      normalizedPath.origin !== PARSE_BASE ||
      decodedPath.startsWith('//') ||
      hasControlCharacter(decodedPath) ||
      AUTH_PATH.test(normalizedPath.pathname)
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
