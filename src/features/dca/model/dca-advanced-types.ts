export const DCA_ADVANCED_VIEW_IDS = [
  'backtester',
  'dynamic-amount',
  'multi-asset',
  'performance-compare',
  'portfolio-optimizer',
  'rebalance-config',
  'rebalance-dashboard',
  'schedule-analytics',
  'schedule-config',
  'smart-rules',
] as const;

export type DCAAdvancedViewId = (typeof DCA_ADVANCED_VIEW_IDS)[number];

export interface DCAAdvancedViewState {
  id: DCAAdvancedViewId;
  state: 'backend-required';
}

export interface DCAAdvancedOverview {
  views: DCAAdvancedViewState[];
}
