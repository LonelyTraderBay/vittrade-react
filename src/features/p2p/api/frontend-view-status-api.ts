import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import { P2P_FRONTEND_VIEW_IDS, type P2PFrontendViewId } from '../model/frontend-view-types';

const responseSchema = z.object({
  view: z.enum(P2P_FRONTEND_VIEW_IDS),
  state: z.literal('backend-required'),
});

export const p2pFrontendViewStatusApi = {
  async get(view: P2PFrontendViewId, signal?: AbortSignal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/p2p/frontend-view-status', query: { view }, signal },
      { retries: 2 },
    );
    return responseSchema.parse(response);
  },
};
