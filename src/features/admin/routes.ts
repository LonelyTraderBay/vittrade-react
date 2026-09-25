import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

export interface AdminRouteComponents {
  home: ComponentType;
  analytics: ComponentType;
  funnel: ComponentType;
  abTests: ComponentType;
}

/** Feature-owned admin routes. The app router adds the role/permission boundary. */
export function createAdminRoutes(components: AdminRouteComponents): RouteObject[] {
  return [
    { path: 'admin', Component: components.home },
    { path: 'admin/analytics', Component: components.analytics },
    { path: 'admin/funnels', Component: components.funnel },
    { path: 'admin/abtests', Component: components.abTests },
  ];
}
