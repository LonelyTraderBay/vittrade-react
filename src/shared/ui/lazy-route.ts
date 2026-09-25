import React from 'react';
import { LazyRoute } from './LazyRoute';

type LazyRouteModule = { default: React.ComponentType };

/** Create a route component with retry and error-boundary handling. */
export function lazyRoute(importFn: () => Promise<LazyRouteModule>): React.ComponentType {
  return function LazyRouteWrapper() {
    return React.createElement(LazyRoute, { load: importFn });
  };
}
