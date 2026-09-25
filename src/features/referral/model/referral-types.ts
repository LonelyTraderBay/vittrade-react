export interface ReferralStats {
  totalFriends: number;
  activeFriends: number;
  kycCompleted: number;
  totalCommission: number;
  pendingCommission: number;
  totalVolume: number;
  thisMonthCommission: number;
  thisMonthFriends: number;
}

export interface ReferralTier {
  name: string;
  nameEn: string;
  friends: number;
  commission: number;
  color: string;
  icon: string;
  kycBonus: number;
}

export interface ReferralFriend {
  id: string;
  name: string;
  avatar: string;
  joinedDate: string;
  status: 'pending_kyc' | 'kyc_done' | 'active_trader' | 'inactive';
  totalVolume: number;
  totalCommission: number;
  isActive: boolean;
}

export interface ReferralCampaign {
  id: string;
  title: string;
  description: string;
  bonusLabel: string;
  daysLeft: number;
  totalParticipants: number;
}

export interface ReferralOverviewResponse {
  referralCode: string;
  stats: ReferralStats;
  currentTier: ReferralTier;
  nextTier?: ReferralTier;
  friends: ReferralFriend[];
  campaign: ReferralCampaign;
}
