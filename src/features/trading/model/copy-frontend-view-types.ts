export const COPY_FRONTEND_VIEW_IDS = [
  'safety-center',
  'provider-application',
  'provider-governance',
  'performance-attribution',
] as const;

export type CopyFrontendViewId = (typeof COPY_FRONTEND_VIEW_IDS)[number];
