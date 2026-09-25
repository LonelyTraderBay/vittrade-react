import { createHttpClient } from './http-client';

type UnauthorizedHandler = () => void | Promise<void>;

let accessToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Access tokens are intentionally memory-only. Refresh is delegated to the HttpOnly cookie. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function createAppApiClient(baseUrl: string) {
  return createHttpClient({
    baseUrl,
    getAccessToken,
    onUnauthorized: () => unauthorizedHandler?.(),
  });
}
