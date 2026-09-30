import { useQuery } from '@tanstack/react-query';
import { copyFrontendViewStatusApi } from '../api/copy-frontend-view-status-api';
import type { CopyFrontendViewId } from './copy-frontend-view-types';

export function useCopyFrontendViewStatus(view: CopyFrontendViewId) {
  return useQuery({
    queryKey: ['trading', 'copy-frontend-view-status', view],
    queryFn: ({ signal }) => copyFrontendViewStatusApi.get(view, signal),
    staleTime: 60_000,
  });
}
