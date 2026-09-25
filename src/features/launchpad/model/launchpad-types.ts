export type LaunchpadProjectType = 'ido' | 'ieo' | 'launchpool';
export type LaunchpadProjectStatus = 'upcoming' | 'active' | 'ended';

export interface LaunchpadTokenAllocation {
  label: string;
  percent: number;
  color: string;
}

export interface LaunchpadVestingStep {
  label: string;
  percent: number;
  date: string;
  status: 'locked' | 'claimable' | 'claimed';
}

export interface LaunchpadTeamMember {
  name: string;
  role: string;
  avatar: string;
  verified: boolean;
}

export interface LaunchpadAudit {
  auditor: string;
  status: 'passed' | 'pending' | 'issues';
  critical: number;
  high: number;
  medium: number;
  reportUrl: string;
}

export interface LaunchpadProjectSummary {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  logoColor: string;
  description: string;
  type: LaunchpadProjectType;
  status: LaunchpadProjectStatus;
  totalRaise: string;
  price: number;
  priceUnit: string;
  startDate: string;
  endDate: string;
  listingDate: string;
  progress: number;
  participants: number;
  subscribed: number;
  allocation: number;
  roi?: number;
  tags: string[];
  kyc: boolean;
  kycLevel: number;
  whitelist: boolean;
  chain: string;
}

export interface LaunchpadProjectDetail extends LaunchpadProjectSummary {
  longDescription: string;
  hardCap: string;
  minBuy: number;
  maxBuy: number;
  contractAddress: string;
  website: string;
  twitter: string;
  telegram: string;
  tokenomics: LaunchpadTokenAllocation[];
  vesting: LaunchpadVestingStep[];
  team: LaunchpadTeamMember[];
  audit: LaunchpadAudit;
  platformFee: number;
  restrictions: string[];
}

export interface LaunchpadProjectListResponse {
  projects: LaunchpadProjectSummary[];
  total: number;
  activeCount: number;
}
