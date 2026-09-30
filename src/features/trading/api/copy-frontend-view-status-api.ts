import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import { COPY_FRONTEND_VIEW_IDS, type CopyFrontendViewId } from '../model/copy-frontend-view-types';

const responseSchema = z.object({
  view: z.enum(COPY_FRONTEND_VIEW_IDS),
  state: z.literal('backend-required'),
});

export const copyFrontendViewStatusApi = {
  async get(view: CopyFrontendViewId, signal?: AbortSignal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/trading/copy/frontend-view-status', query: { view }, signal },
      { retries: 2 },
    );
    return responseSchema.parse(response);
  },
};
