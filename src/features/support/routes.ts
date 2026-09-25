import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const NotificationsPage = lazyRoute(() =>
  import('./pages/NotificationsContractPage').then((module) => ({
    default: module.NotificationsContractPage,
  })),
);
const SupportPage = lazyRoute(() =>
  import('./pages/SupportContractPage').then((module) => ({
    default: module.SupportContractPage,
  })),
);
const HelpCenterPage = lazyRoute(() =>
  import('./pages/HelpCenterContractPage').then((module) => ({
    default: module.HelpCenterContractPage,
  })),
);
const AnnouncementsPage = lazyRoute(() =>
  import('./pages/NewsContractPage').then((module) => ({
    default: module.AnnouncementsContractPage,
  })),
);
const NewsPage = lazyRoute(() =>
  import('./pages/NewsContractPage').then((module) => ({
    default: module.NewsContractPage,
  })),
);

/** Boundary route public cho support/news. */
export function createSupportPublicRoutes(): RouteObject[] {
  return [{ path: 'news', Component: NewsPage }];
}

/** Boundary route support yêu cầu xác thực. */
export function createSupportProtectedRoutes(): RouteObject[] {
  return [
    { path: 'notifications', Component: NotificationsPage },
    { path: 'support/help', Component: HelpCenterPage },
    { path: 'support/announcements', Component: AnnouncementsPage },
    { path: 'support', Component: SupportPage },
  ];
}
