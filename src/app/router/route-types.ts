import type { ComponentType } from 'react';

/**
 * Feature-owned route boundary.
 *
 * The current router still consumes React Router route objects while the
 * legacy page catalog is migrated. New feature routes should expose this
 * metadata so auth, permission and feature-flag policy can be tested without
 * importing page implementation details.
 */
export interface FeatureRoute {
  path: string;
  element: ComponentType;
  requiredAuth?: boolean;
  permissions?: string[];
  featureFlag?: string;
}

export type RouteStatus =
  'production' | 'integration-pending' | 'demo' | 'deprecated' | 'not-implemented';

export interface RouteOwnership {
  domain: string;
  owner: string;
  status: RouteStatus;
}
