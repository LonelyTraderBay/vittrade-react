export type ProfileKycStatus = 'pending' | 'verified' | 'rejected' | 'not_started';

export interface Profile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  username: string;
  avatar: string | null;
  kycLevel: number;
  kycStatus: ProfileKycStatus;
  referralCode: string;
  vipLevel: number;
  joinDate: string;
  has2FA: boolean;
  totalBalance: number;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
}

export type ActivityLogType =
  | 'login'
  | 'logout'
  | 'password_change'
  | '2fa_enable'
  | '2fa_disable'
  | 'kyc_submit'
  | 'api_create'
  | 'api_delete';

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  description: string;
  ipAddress: string;
  device: string;
  location: string;
  status: 'success' | 'failed' | 'suspicious';
  timestamp: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  isTrusted: boolean;
  loginAt: string;
}

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  type: 'spot' | 'margin' | 'futures' | 'all';
  status: 'active' | 'frozen' | 'pending';
  balance: number;
  pnl30d: number;
  permissions: string[];
  createdAt: string;
  lastActive: string;
  apiKeyCount: number;
  tradingVolume30d: number;
}
