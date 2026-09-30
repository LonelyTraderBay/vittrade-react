export const P2P_FRONTEND_VIEW_IDS = [
  'insurance-fund',
  'contribution-history',
  'kyc-requirements',
  'kyc-status',
  'security-center',
  'transaction-limits',
  'wallet',
] as const;

export type P2PFrontendViewId = (typeof P2P_FRONTEND_VIEW_IDS)[number];

export interface P2PFrontendViewStatus {
  view: P2PFrontendViewId;
  state: 'backend-required';
}
