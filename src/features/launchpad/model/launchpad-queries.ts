import { useQuery } from '@tanstack/react-query';
import { launchpadApi, type LaunchpadProjectQuery } from '../api/launchpad-api';

export const launchpadQueryKeys = {
  projects: (query: LaunchpadProjectQuery) => ['launchpad', 'projects', query] as const,
  project: (id: string) => ['launchpad', 'project', id] as const,
};

export function useLaunchpadProjectsQuery(query: LaunchpadProjectQuery = {}) {
  return useQuery({
    queryKey: launchpadQueryKeys.projects(query),
    queryFn: ({ signal }) => launchpadApi.getProjects(query, signal),
    staleTime: 30_000,
    // The HTTP client already retries idempotent network failures twice.
    // Avoid multiplying that request budget with the app-level query retry.
    retry: false,
  });
}

export function useLaunchpadProjectQuery(id: string) {
  return useQuery({
    queryKey: launchpadQueryKeys.project(id),
    queryFn: ({ signal }) => launchpadApi.getProject(id, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
    // Keep the same bounded transport retry policy as the project list query.
    retry: false,
  });
}
