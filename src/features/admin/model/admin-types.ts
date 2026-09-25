export type AdminAbTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'expired';

export interface AdminOverview {
  activeUsers: number;
  verifiedUsers: number;
  grossVolume: string;
  generatedAt: string;
}

export interface AdminFunnelStep {
  key: string;
  count: number;
  conversionRate: number;
}

export interface AdminFunnelResponse {
  steps: AdminFunnelStep[];
}

export interface AdminAbTestVariant {
  key: string;
  rolloutPercentage: number;
}

export interface AdminAbTest {
  id: string;
  key: string;
  status: AdminAbTestStatus;
  owner: string;
  expiresAt: string;
  variants: AdminAbTestVariant[];
}

export interface AdminFeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  owner: string;
  expiresAt: string;
  rollbackBehavior?: string;
}

export interface AdminFeatureFlagUpdateRequest {
  enabled: boolean;
  rolloutPercentage: number;
  expiresAt: string;
  rollbackBehavior?: 'disable' | 'previous-version' | 'manual';
}

export interface AdminFunnelQuery {
  from?: string;
  to?: string;
}
