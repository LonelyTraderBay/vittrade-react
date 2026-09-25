import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const SearchPage = lazyRoute(() =>
  import('./pages/DiscoveryContractPages').then((module) => ({
    default: module.DiscoverySearchContractPage,
  })),
);
const TopicPage = lazyRoute(() =>
  import('./pages/DiscoveryContractPages').then((module) => ({
    default: module.DiscoveryTopicContractPage,
  })),
);

/** Route discovery theo contract. */
export function createDiscoveryRoutes(): RouteObject[] {
  return [
    { path: 'search', Component: SearchPage },
    { path: 'topics', Component: TopicPage },
    { path: 'topic/:topicId', Component: TopicPage },
  ];
}
