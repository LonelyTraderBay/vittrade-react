import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../api/discovery-api';
import type { DiscoveryTopicId } from './discovery-types';

export const discoveryQueryKeys = {
  all: ['discovery'] as const,
  search: (query: string) => ['discovery', 'search', query] as const,
  topic: (topicId: DiscoveryTopicId) => ['discovery', 'topic', topicId] as const,
};

export function useDiscoverySearchQuery(query: string) {
  return useQuery({
    queryKey: discoveryQueryKeys.search(query),
    queryFn: ({ signal }) => discoveryApi.search(query, signal),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  });
}

export function useDiscoveryTopicQuery(topicId: DiscoveryTopicId) {
  return useQuery({
    queryKey: discoveryQueryKeys.topic(topicId),
    queryFn: ({ signal }) => discoveryApi.getTopic(topicId, signal),
    staleTime: 30_000,
  });
}
