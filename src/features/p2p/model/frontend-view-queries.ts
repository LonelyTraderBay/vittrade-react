import { useQuery } from '@tanstack/react-query';
import { p2pFrontendViewStatusApi } from '../api/frontend-view-status-api';
import type { P2PFrontendViewId } from './frontend-view-types';

export function useP2PFrontendViewStatus(view: P2PFrontendViewId) {
  return useQuery({
    queryKey: ['p2p', 'frontend-view-status', view],
    queryFn: ({ signal }) => p2pFrontendViewStatusApi.get(view, signal),
    staleTime: 60_000,
  });
}
