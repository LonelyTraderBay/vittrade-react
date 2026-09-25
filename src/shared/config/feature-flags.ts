import type { FeatureFlagConfig } from '@/shared/types/feature-flags';

export const DEFAULT_FEATURE_FLAG_CONFIG: FeatureFlagConfig = {
  enabled: true,
  debug: false,
  refreshInterval: 300000,
  cache: true,
  cacheTTL: 3600000,
};
