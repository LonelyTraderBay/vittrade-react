import { isCommonAssetRequest } from 'msw';
import type { UnhandledRequestCallback } from 'msw';
import { env } from '@/shared/config/env';

function isApplicationApiRequest(request: Request): boolean {
  const apiBaseUrl = env.apiBaseUrl || `${window.location.origin}/api`;
  const apiBase = new URL(apiBaseUrl, window.location.origin);
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== apiBase.origin) return false;

  const basePath = apiBase.pathname.replace(/\/+$/, '');
  const pathMatches =
    basePath.length === 0 ||
    requestUrl.pathname === basePath ||
    requestUrl.pathname.startsWith(`${basePath}/`);

  return pathMatches && !isCommonAssetRequest(request);
}

export const onUnhandledRequest: UnhandledRequestCallback = (request, print) => {
  if (isApplicationApiRequest(request)) print.error();
};
