import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

export interface ReferralRouteComponents {
  home: ComponentType;
}

/** Route tổng quan Referral theo contract do feature Referral sở hữu. */
export function createReferralRoutes(components: ReferralRouteComponents): RouteObject[] {
  return [{ path: 'referral', Component: components.home }];
}
