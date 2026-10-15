import { act } from '@testing-library/react';

/**
 * Invoke a rendered React handler after a control became disabled. This models
 * a queued/stale callback and verifies the owner-level guard independently of
 * the browser's disabled-control event suppression.
 */
export function invokeStaleReactHandler(
  element: HTMLElement,
  handlerName: string,
  ...args: unknown[]
): void {
  const handler = getRenderedReactHandler(element, handlerName);
  act(() => {
    handler(...args);
  });
}

export function getRenderedReactHandler(
  element: HTMLElement,
  handlerName: string,
): (...args: unknown[]) => unknown {
  const propsKey = Object.keys(element).find((key) => key.startsWith('__reactProps$'));
  if (!propsKey) throw new Error('Rendered element has no React event props.');

  const props = (element as unknown as Record<string, Record<string, unknown>>)[propsKey];
  const handler = props?.[handlerName];
  if (typeof handler !== 'function') {
    throw new Error(`Rendered element has no ${handlerName} handler.`);
  }
  return handler as (...args: unknown[]) => unknown;
}
