/**
 * ══════════════════════════════════════════════════════════
 *  ARENA TYPES — Open Arena Module
 * ══════════════════════════════════════════════════════════
 *
 *  Types for creator-driven, points-only social module.
 *  Following Guidelines.md: Arena Points are NOT wallet value.
 */

/* ─── Arena Core Types ─── */

export type ArenaRoomStatus = 'draft' | 'pending_review' | 'published' | 'active' | 'settling' | 'settled' | 'void';
export type ArenaRoomVisibility = 'public' | 'unlisted' | 'private';

export interface ArenaRoom {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  modeId: string;
  modeName: string;
  category: ArenaCategory;
  visibility: ArenaRoomVisibility;
  status: ArenaRoomStatus;
  
  // Rules
  rules: ArenaRules;
  
  // Pool
  totalPool: number;           // Arena Points
  entryFee: number;            // Arena Points
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  
  // Timeline
  createdAt: Date;
  startsAt: Date;
  endsAt: Date;
  settledAt?: Date;
  
  // Trust & Safety
  trustScore?: number;
  safetyTier?: 'safe' | 'moderate' | 'risky';
  reportCount?: number;
  
  // Governance
  publishEligibility?: 'approved' | 'pending' | 'rejected';
  ruleClarityScore?: number;
}

export interface ArenaRules {
  domain: string;              // e.g., "crypto", "sports", "prediction"
  challengeType: string;       // e.g., "price_target", "event_outcome"
  winCondition: string;
  tieRule: string;
  voidRule: string;
  resultDeadline: Date;
  customRules?: string;
}

export type ArenaCategory = 
  | 'crypto' 
  | 'sports' 
  | 'politics' 
  | 'entertainment' 
  | 'tech' 
  | 'gaming'
  | 'community';

/* ─── Arena Mode (Template) ─── */

export interface ArenaMode {
  id: string;
  name: string;
  description: string;
  category: ArenaCategory;
  template: string;            // e.g., "price_target", "event_outcome"
  isOfficial: boolean;
  creatorId?: string;
  usageCount: number;
  popularityScore: number;
  createdAt: Date;
}

/* ─── Arena Participation ─── */

export type ParticipationStatus = 'joined' | 'active' | 'won' | 'lost' | 'tie' | 'void' | 'abandoned';

export interface ArenaParticipation {
  id: string;
  roomId: string;
  userId: string;
  status: ParticipationStatus;
  entryFee: number;            // Arena Points paid
  payout?: number;             // Arena Points received
  prediction?: string;
  joinedAt: Date;
  resultAt?: Date;
}

/* ─── Arena Points Ledger ─── */

export type PointsTransactionType = 
  | 'entry_fee' 
  | 'payout' 
  | 'refund' 
  | 'bonus' 
  | 'penalty' 
  | 'daily_reward';

export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  amount: number;              // positive = credit, negative = debit
  balance: number;             // balance after transaction
  reason: string;
  roomId?: string;
  challengeId?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'reversed';
}

/* ─── Arena Trust & Safety ─── */

export interface TrustMetric {
  label: string;
  value: number;               // 0-100
  weight: number;              // importance 0-1
  description?: string;
}

export interface CreatorTrust {
  userId: string;
  overallScore: number;        // 0-100
  fairPlay: number;
  completionRate: number;
  disputeRate: number;
  reportUpheldRate: number;
  creatorReliability: number;
  totalRoomsCreated: number;
  totalSettled: number;
  metrics: TrustMetric[];
}

export interface SafetySnapshot {
  roomId: string;
  safetyTier: 'safe' | 'moderate' | 'risky';
  trustScore: number;
  ruleClarityScore: number;
  disputeRisk: 'low' | 'medium' | 'high';
  warnings: string[];
  updatedAt: Date;
}

/* ─── Arena Moderation ─── */

export type ReportType = 'scam' | 'abuse' | 'spam' | 'unfair_rules' | 'manipulation' | 'other';
export type ReportCaseStatus = 'open' | 'investigating' | 'resolved' | 'dismissed' | 'appealing';

export interface ReportCase {
  id: string;
  reporterId: string;
  targetType: 'room' | 'user' | 'challenge';
  targetId: string;
  targetName: string;
  type: ReportType;
  reason: string;
  description: string;
  evidence?: string[];
  status: ReportCaseStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  actionTaken?: string;
  systemNote?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface BlockedUser {
  userId: string;
  username: string;
  blockedAt: Date;
  reason?: string;
}

/* ─── Arena Resolution ─── */

export type ResolutionStatus = 'pending' | 'submitted' | 'approved' | 'disputed' | 'finalized';

export interface RoomResolution {
  roomId: string;
  submittedBy: string;
  result: string;
  evidence?: string[];
  status: ResolutionStatus;
  submittedAt: Date;
  approvedAt?: Date;
  disputeCount: number;
  finalizedAt?: Date;
}

/* ─── Arena Studio (Creation) ─── */

export interface ArenaDraft {
  title: string;
  description: string;
  modeId?: string;
  category: ArenaCategory;
  visibility: ArenaRoomVisibility;
  rules: Partial<ArenaRules>;
  entryFee: number;
  minParticipants: number;
  maxParticipants: number;
  startsAt: Date;
  endsAt: Date;
}

export interface PublishEligibilityCheck {
  eligible: boolean;
  ruleClarityScore: number;
  issues: string[];
  warnings: string[];
  requiresReview: boolean;
}

/* ─── Arena Leaderboard ─── */

export type LeaderboardMetric = 'fair_play' | 'creator_quality' | 'completion' | 'trust' | 'activity';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  metric: LeaderboardMetric;
  totalRooms?: number;
  totalWins?: number;
  winRate?: number;
}

/* ─── Arena Discovery ─── */

export interface ArenaTrendingRoom {
  room: ArenaRoom;
  trendingScore: number;
  participantGrowth: number;
  recentActivity: number;
}

export interface ArenaFeaturedMode {
  mode: ArenaMode;
  activeRooms: number;
  totalParticipants: number;
  description: string;
}
