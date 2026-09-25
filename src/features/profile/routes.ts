import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const EditProfilePage = lazyRoute(() =>
  import('./pages/EditProfileContractPage').then((module) => ({
    default: module.EditProfileContractPage,
  })),
);
const SecurityPage = lazyRoute(() =>
  import('./pages/SecurityContractPage').then((module) => ({
    default: module.SecurityContractPage,
  })),
);
const ActivityLogPage = lazyRoute(() =>
  import('./pages/ActivityLogContractPage').then((module) => ({
    default: module.ActivityLogContractPage,
  })),
);
const DeviceManagementPage = lazyRoute(() =>
  import('./pages/DeviceManagementContractPage').then((module) => ({
    default: module.DeviceManagementContractPage,
  })),
);
const SubAccountPage = lazyRoute(() =>
  import('./pages/SubAccountContractPage').then((module) => ({
    default: module.SubAccountContractPage,
  })),
);

/** Route profile theo contract; page legacy vẫn nằm ngoài boundary này. */
export function createProfileRoutes(): RouteObject[] {
  return [
    { path: 'profile/edit', Component: EditProfilePage },
    { path: 'profile/security', Component: SecurityPage },
    { path: 'profile/activity', Component: ActivityLogPage },
    { path: 'profile/devices', Component: DeviceManagementPage },
    { path: 'profile/sub-accounts', Component: SubAccountPage },
  ];
}
