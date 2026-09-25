import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const LaunchpadPage = lazyRoute(() =>
  import('./pages/LaunchpadContractPages').then((module) => ({
    default: module.LaunchpadContractPage,
  })),
);
const LaunchpadProjectPage = lazyRoute(() =>
  import('./pages/LaunchpadContractPages').then((module) => ({
    default: module.LaunchpadProjectContractPage,
  })),
);

/** Production route boundary for the contract-backed Launchpad core slice. */
export function createLaunchpadRoutes(): RouteObject[] {
  return [
    { path: 'launchpad', Component: LaunchpadPage },
    { path: 'launchpad/:id', Component: LaunchpadProjectPage },
    // Keep the older deep link while serving the same API-backed detail page.
    { path: 'launchpad/contract/:id', Component: LaunchpadProjectPage },
  ];
}
