import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && !(error instanceof ApiError && error.status === 403);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
