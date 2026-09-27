import { DCA_ADVANCED_VIEW_IDS } from '@/features/dca/model/dca-advanced-types';

export const DCA_ADVANCED_OVERVIEW = {
  views: DCA_ADVANCED_VIEW_IDS.map((id) => ({ id, state: 'backend-required' as const })),
};

export const P2P_FRONTEND_VIEWS = [
  'insurance-fund',
  'contribution-history',
  'kyc-requirements',
  'kyc-status',
  'security-center',
  'transaction-limits',
  'wallet',
] as const;

export const P2P_FRONTEND_VIEW_STATES = P2P_FRONTEND_VIEWS.map((view) => ({
  view,
  state: 'backend-required' as const,
}));

export const COPY_FRONTEND_VIEWS = [
  'safety-center',
  'provider-application',
  'provider-governance',
  'performance-attribution',
] as const;

export const COPY_FRONTEND_VIEW_STATES = COPY_FRONTEND_VIEWS.map((view) => ({
  view,
  state: 'backend-required' as const,
}));
