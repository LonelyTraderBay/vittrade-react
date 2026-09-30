import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import { DCA_ADVANCED_VIEW_IDS, type DCAAdvancedOverview } from '../model/dca-advanced-types';

const viewStateSchema = z.object({
  id: z.enum(DCA_ADVANCED_VIEW_IDS),
  state: z.literal('backend-required'),
});

const overviewSchema = z
  .object({
    views: z.array(viewStateSchema).length(DCA_ADVANCED_VIEW_IDS.length),
  })
  .superRefine(({ views }, context) => {
    const ids = new Set(views.map(({ id }) => id));
    if (ids.size !== DCA_ADVANCED_VIEW_IDS.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each DCA advanced view must appear exactly once.',
      });
    }
  });

export const dcaAdvancedApi = {
  async getOverview(signal?: AbortSignal): Promise<DCAAdvancedOverview> {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/dca/advanced/overview', signal },
      { retries: 2 },
    );
    return overviewSchema.parse(response);
  },
};
