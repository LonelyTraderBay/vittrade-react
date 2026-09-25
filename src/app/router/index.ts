import type { RouteObject } from 'react-router';
import { router } from '../routes';

export { router };
export type { FeatureRoute, RouteOwnership, RouteStatus } from './route-types';

/**
 * Returns route templates from the runtime route tree.
 * Dynamic segments are intentionally preserved (for example `:orderId`) so
 * contract tests can protect public URL compatibility without inventing IDs.
 */
export function collectRoutePaths(routes: RouteObject[] = router.routes): string[] {
  const paths: string[] = [];

  const visit = (nodes: RouteObject[], parentPath = '') => {
    nodes.forEach((node) => {
      const currentPath = node.path
        ? joinRoutePath(parentPath, node.path)
        : node.index
          ? parentPath || '/'
          : parentPath;

      if (node.path || node.index) paths.push(currentPath || '/');
      if (node.children) visit(node.children, currentPath);
    });
  };

  visit(routes);
  return [...new Set(paths)].sort();
}

function joinRoutePath(parentPath: string, childPath: string): string {
  const parent = parentPath.replace(/\/$/, '');
  const child = childPath.replace(/^\//, '');
  if (!parent) return `/${child}`;
  if (!child) return parent || '/';
  return `${parent}/${child}`;
}
