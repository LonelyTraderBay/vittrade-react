export type ArenaComplexity = 'easy' | 'medium' | 'advanced';
export type ArenaChallengeState =
  | 'open'
  | 'full'
  | 'live'
  | 'pending_result'
  | 'resolved'
  | 'under_review'
  | 'reported'
  | 'hidden'
  | 'canceled'
  | 'error'
  | 'offline';

export interface ArenaCreatorSummary {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  fairPlayBadge: boolean;
}

export interface ArenaRoomSummary {
  id: string;
  title: string;
  format: string;
  slotsTotal: number;
  slotsFilled: number;
  entryPoints: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

export interface ArenaModeSummary {
  id: string;
  title: string;
  description: string;
  cloneCount: number;
  activeChallenges: number;
  fairPlay: boolean;
}

export interface ArenaModeDetail extends ArenaModeSummary {
  template: {
    id: string;
    title: string;
    icon: string;
    color: string;
    complexity: ArenaComplexity;
  };
  creator: ArenaCreatorSummary;
  tags: string[];
  completionRate: number;
  allowedFormats: string[];
  winCondition?: string;
  resolutionType?: string;
  avgDuration?: string;
  disputeRiskLevel?: 'low' | 'medium' | 'high';
  relatedRooms: ArenaRoomSummary[];
  relatedModes: ArenaModeSummary[];
}

export interface ArenaParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'player' | 'captain';
  status: 'joined' | 'invited' | 'waiting' | 'confirmed' | 'left';
  teamId?: string;
}

export interface ArenaLeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  accuracy?: number;
}

export interface ArenaChallengeDetail {
  id: string;
  title: string;
  description: string;
  modeId: string;
  modeName: string;
  creator: ArenaCreatorSummary;
  entryPoints: number;
  prizePool: number;
  slotsTotal: number;
  slotsFilled: number;
  status: 'waiting' | 'in_progress' | 'completed';
  privacy: 'public' | 'private' | 'friends_only';
  format: string;
  rules: string[];
  startAt: string;
  endAt: string;
  leaderboard: ArenaLeaderboardEntry[];
  challengeState?: ArenaChallengeState;
  participantLayout?: '1v1' | '1vN' | 'NvN' | 'open_lobby';
  participants: ArenaParticipant[];
  winCondition?: string;
  resolutionMethod?: string;
  evidenceRequirement?: string;
  voidRule?: string;
  warningBanners?: string[];
  rewardTiers?: { rank: string; pct: number }[];
  refundPolicy?: string;
}

export interface JoinArenaChallengeResponse {
  challenge: ArenaChallengeDetail;
  auditEventId: string;
}
