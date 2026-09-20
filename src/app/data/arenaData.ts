/**
 * ══════════════════════════════════════════════════════════
 *  Open Arena — Mock Data & Types
 * ══════════════════════════════════════════════════════════
 *  Arena Points only — NOT financial assets.
 *  Tất cả data hardcode cho prototype.
 */

/* ─── Types ─── */

export interface ArenaTemplate {
  id: string;
  title: string;
  icon: string;
  description: string;
  formatTags: string[];
  color: string;
  complexity: 'easy' | 'medium' | 'advanced';
  verifiedOnly?: boolean; // future-ready disabled chip
}

export interface ArenaMode {
  id: string;
  title: string;
  description: string;
  creator: ArenaCreator;
  templateId: string;
  cloneCount: number;
  completionRate: number;
  fairPlay: boolean;
  tags: string[];
  activeChallenges: number;
  createdAt: string;
  /* ─── Discovery fields (06C) ─── */
  allowedFormats?: string[];
  winCondition?: string;
  resolutionType?: string;
  avgDuration?: string;
  disputeRiskLevel?: 'low' | 'medium' | 'high';
  reportRate?: number;
  repeatUsage?: number;
}

export interface ArenaCreator {
  id: string;
  name: string;
  avatar: string; // emoji placeholder
  modesCreated: number;
  trustScore: number; // 0–100
  fairPlayBadge: boolean;
  followers: number;
  totalChallenges: number;
  /* ─── Discovery fields (06C) ─── */
  level?: number;
  badge?: string;
  completedRooms?: number;
  totalClones?: number;
  communityRating?: number; // 1–5
  disputeRate?: number;
  completionRate?: number;
  bio?: string;
  joinedAt?: string;
}

export type RoomStatus = 'waiting' | 'in_progress' | 'completed';
export type RoomPrivacy = 'public' | 'private' | 'friends_only';

export interface ArenaRoom {
  id: string;
  title: string;
  modeId: string;
  format: string;
  slotsTotal: number;
  slotsFilled: number;
  entryPoints: number;
  privacy: RoomPrivacy;
  status: RoomStatus;
  creator: { name: string; avatar: string };
  endsAt: string;
}

export interface ArenaChallenge {
  id: string;
  title: string;
  description: string;
  modeId: string;
  modeName: string;
  creator: ArenaCreator;
  entryPoints: number;
  prizePool: number;
  slotsTotal: number;
  slotsFilled: number;
  status: RoomStatus;
  privacy: RoomPrivacy;
  format: string;
  rules: string[];
  startAt: string;
  endAt: string;
  leaderboard: ArenaLeaderboardEntry[];
  /* ─── 06D Discovery fields ─── */
  challengeState?: ChallengeState;
  participantLayout?: ParticipantLayout;
  participants?: ChallengeParticipant[];
  teams?: ChallengeTeam[];
  winCondition?: string;
  resolutionMethod?: string;
  evidenceRequirement?: string;
  voidRule?: string;
  warningBanners?: string[];
  /* ─── Reward Distribution fields (enterprise audit) ─── */
  rewardDistType?: string;
  rewardDistLabel?: string;
  rewardTiers?: { rank: string; pct: number }[];
  platformFeePct?: number;
  creatorCutPct?: number;
  consolationEnabled?: boolean;
  consolationPct?: number;
  bonusPool?: number;
  dynamicPool?: boolean;
  dynamicPoolMin?: number;
  refundPolicy?: string;
}

export type ChallengeState =
  | 'open' | 'full' | 'live' | 'pending_result'
  | 'resolved' | 'under_review' | 'reported'
  | 'hidden' | 'canceled' | 'error' | 'offline';

export type ParticipantLayout = '1v1' | '1vN' | 'NvN' | 'open_lobby';

export interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'player' | 'captain';
  teamId?: string;
  status: 'joined' | 'invited' | 'waiting' | 'confirmed' | 'left';
}

export interface ChallengeTeam {
  id: string;
  name: string;
  color: string;
  captainId: string;
  memberIds: string[];
}

export interface ArenaLeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  accuracy?: number;
}

export interface MyArenaStats {
  totalChallenges: number;
  wins: number;
  pointsEarned: number;
  pointsSpent: number;
  currentBalance: number;
  lockedBalance: number;
  rank: number;
  modesCreated: number;
  /* ─── 06E fields ─── */
  activeChallenges?: number;
  creatorScore?: number;
  savedModes?: number;
  drafts?: number;
  /* ─── Important #9: Notifications ─── */
  pendingNotifications?: number;
  yourTurnChallenges?: string[];
  /* ─── Reward Analytics (I6) ─── */
  rewardHistory?: {
    totalPayouts: number;
    avgROI: number;
    largestPayout: number;
    winsByDistType: { type: string; label: string; wins: number; total: number }[];
    recentPayouts: { challengeId: string; title: string; amount: number; date: string; distType: string; rank: number }[];
  };
}

/* ─── Chat & Activity Types ─── */

export interface ArenaChatMessage {
  id: string;
  sender: { name: string; avatar: string };
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface ArenaActivityEvent {
  id: string;
  type: 'join' | 'leave' | 'guess' | 'result' | 'points' | 'system';
  text: string;
  icon: string;
  time: string;
  highlight?: boolean;
}

/* ─── Points Earning Types ─── */

export interface PointsTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
  type: 'daily' | 'weekly' | 'milestone' | 'volume';
  progress: number;  // 0–100
  target: string;
  isCompleted: boolean;
  isClaimed: boolean;
  cooldown?: string;  // time until next available
}

export interface DailyCheckIn {
  day: number;
  points: number;
  isClaimed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/* ─── Templates ─── */

export const ARENA_TEMPLATES: ArenaTemplate[] = [
  {
    id: 'prediction',
    title: 'Prediction',
    icon: '🎯',
    description: 'Dự đoán kết quả sự kiện, giá coin, hay bất kỳ điều gì',
    formatTags: ['Binary', 'Multi-choice'],
    color: '#8B5CF6',
    complexity: 'medium',
  },
  {
    id: 'closest_guess',
    title: 'Closest Guess',
    icon: '🔢',
    description: 'Đoán số gần nhất với kết quả thực tế sẽ thắng',
    formatTags: ['Numeric', 'Range'],
    color: '#3B82F6',
    complexity: 'easy',
  },
  {
    id: 'team_battle',
    title: 'Team Battle',
    icon: '⚔️',
    description: 'Chia đội và thi đấu theo nhóm, cộng điểm team',
    formatTags: ['2-Team', 'Multi-team'],
    color: '#EF4444',
    complexity: 'medium',
  },
  {
    id: 'bracket',
    title: 'Bracket',
    icon: '🏆',
    description: 'Giải đấu theo nhánh loại trực tiếp',
    formatTags: ['Single elim', 'Double elim'],
    color: '#F59E0B',
    complexity: 'advanced',
    verifiedOnly: true,
  },
  {
    id: 'community_vote',
    title: 'Community Vote',
    icon: '🗳️',
    description: 'Bình chọn cộng đồng, kết quả do đa số quyết định',
    formatTags: ['Poll', 'Ranked'],
    color: '#10B981',
    complexity: 'easy',
  },
  {
    id: 'proof_challenge',
    title: 'Proof Challenge',
    icon: '📸',
    description: 'Hoàn thành thử thách và gửi bằng chứng để xác nhận',
    formatTags: ['Photo', 'Video', 'Screenshot'],
    color: '#06B6D4',
    complexity: 'medium',
  },
];

/* ─── Creators ─── */

export const ARENA_CREATORS: ArenaCreator[] = [
  {
    id: 'cr001',
    name: 'CryptoMaster_VN',
    avatar: '🧑‍💻',
    modesCreated: 12,
    trustScore: 95,
    fairPlayBadge: true,
    followers: 1842,
    totalChallenges: 89,
    /* ─── Discovery fields (06C) ─── */
    level: 5,
    badge: 'Gold',
    completedRooms: 78,
    totalClones: 345,
    communityRating: 4.8,
    disputeRate: 0.02,
    completionRate: 96,
    bio: 'Chuyên gia về thị trường tiền điện tử, có kinh nghiệm nhiều năm trong lĩnh vực dự đoán và phân tích.',
    joinedAt: '2020-01-15',
  },
  {
    id: 'cr002',
    name: 'ArenaKing',
    avatar: '👑',
    modesCreated: 8,
    trustScore: 91,
    fairPlayBadge: true,
    followers: 965,
    totalChallenges: 54,
    /* ─── Discovery fields (06C) ─── */
    level: 4,
    badge: 'Silver',
    completedRooms: 56,
    totalClones: 234,
    communityRating: 4.5,
    disputeRate: 0.05,
    completionRate: 92,
    bio: 'Người sáng tạo nội dung hấp dẫn và đa dạng, chuyên về các trò chơi và giải đấu trực tuyến.',
    joinedAt: '2021-03-20',
  },
  {
    id: 'cr003',
    name: 'PredictorPro',
    avatar: '🎯',
    modesCreated: 15,
    trustScore: 88,
    fairPlayBadge: true,
    followers: 2340,
    totalChallenges: 127,
    /* ─── Discovery fields (06C) ─── */
    level: 5,
    badge: 'Gold',
    completedRooms: 110,
    totalClones: 456,
    communityRating: 4.9,
    disputeRate: 0.01,
    completionRate: 98,
    bio: 'Chuyên gia dự đoán tài chính, có kỹ năng phân tích dữ liệu và dự đoán xu hướng thị trường.',
    joinedAt: '2019-06-10',
  },
  {
    id: 'cr004',
    name: 'GameMaker_HN',
    avatar: '🎮',
    modesCreated: 6,
    trustScore: 82,
    fairPlayBadge: false,
    followers: 430,
    totalChallenges: 32,
    /* ─── Discovery fields (06C) ─── */
    level: 3,
    badge: 'Bronze',
    completedRooms: 30,
    totalClones: 123,
    communityRating: 4.0,
    disputeRate: 0.1,
    completionRate: 85,
    bio: 'Người sáng tạo trò chơi và giải đấu trực tuyến, chuyên về các trò chơi chiến thuật và chiến đấu nhóm.',
    joinedAt: '2022-08-25',
  },
  {
    id: 'cr005',
    name: 'QuizWizard',
    avatar: '🧙',
    modesCreated: 10,
    trustScore: 93,
    fairPlayBadge: true,
    followers: 1560,
    totalChallenges: 78,
    /* ─── Discovery fields (06C) ─── */
    level: 4,
    badge: 'Silver',
    completedRooms: 70,
    totalClones: 289,
    communityRating: 4.6,
    disputeRate: 0.03,
    completionRate: 94,
    bio: 'Chuyên gia về các trò chơi trí tuệ và câu đố, có kỹ năng tạo ra các câu hỏi thú vị và sáng tạo.',
    joinedAt: '2020-09-05',
  },
];

/* ─── Featured Modes ─── */

export const ARENA_MODES: ArenaMode[] = [
  {
    id: 'mode001',
    title: 'BTC Weekly Predict',
    description: 'Dự đoán giá BTC cuối tuần. Gần nhất thắng pool.',
    creator: ARENA_CREATORS[0],
    templateId: 'closest_guess',
    cloneCount: 234,
    completionRate: 92,
    fairPlay: true,
    tags: ['Crypto', 'Weekly', 'Popular'],
    activeChallenges: 5,
    createdAt: '2025-12-01',
    /* ─── Discovery fields (06C) ─── */
    allowedFormats: ['Numeric', 'Range'],
    winCondition: 'Người đoán gần nhất với giá BTC thực tế sẽ thắng.',
    resolutionType: 'API CoinGecko',
    avgDuration: '1 tuần',
    disputeRiskLevel: 'low',
    reportRate: 0.01,
    repeatUsage: 5,
  },
  {
    id: 'mode002',
    title: 'Altcoin Battle Royale',
    description: 'Chia 4 đội, mỗi đội chọn 1 altcoin. Coin tăng nhiều nhất tuần → team đó thắng.',
    creator: ARENA_CREATORS[1],
    templateId: 'team_battle',
    cloneCount: 156,
    completionRate: 87,
    fairPlay: true,
    tags: ['Crypto', 'Team', 'Trending'],
    activeChallenges: 3,
    createdAt: '2025-11-15',
    /* ─── Discovery fields (06C) ─── */
    allowedFormats: ['2-Team', 'Multi-team'],
    winCondition: 'Đội có altcoin tăng nhiều nhất tuần sẽ thắng.',
    resolutionType: 'API CoinGecko',
    avgDuration: '1 tuần',
    disputeRiskLevel: 'medium',
    reportRate: 0.03,
    repeatUsage: 3,
  },
  {
    id: 'mode003',
    title: 'Macro News Predict',
    description: 'Dự đoán kết quả tin tức kinh tế vĩ mô: CPI, Fed rate, GDP...',
    creator: ARENA_CREATORS[2],
    templateId: 'prediction',
    cloneCount: 412,
    completionRate: 94,
    fairPlay: true,
    tags: ['Macro', 'News', 'Hot'],
    activeChallenges: 8,
    createdAt: '2025-10-20',
    /* ─── Discovery fields (06C) ─── */
    allowedFormats: ['Binary', 'Multi-choice'],
    winCondition: 'Người đoán chính xác kết quả tin tức sẽ thắng.',
    resolutionType: 'API CoinGecko',
    avgDuration: '1 tuần',
    disputeRiskLevel: 'low',
    reportRate: 0.01,
    repeatUsage: 4,
  },
  {
    id: 'mode004',
    title: 'Crypto Trivia Cup',
    description: 'Giải đấu bracket trivia về blockchain & crypto.',
    creator: ARENA_CREATORS[4],
    templateId: 'bracket',
    cloneCount: 98,
    completionRate: 78,
    fairPlay: true,
    tags: ['Trivia', 'Bracket', 'Fun'],
    activeChallenges: 2,
    createdAt: '2026-01-05',
    /* ─── Discovery fields (06C) ─── */
    allowedFormats: ['Single elim', 'Double elim'],
    winCondition: 'Người trả lời chính xác nhiều nhất sẽ thắng.',
    resolutionType: 'API CoinGecko',
    avgDuration: '1 tuần',
    disputeRiskLevel: 'low',
    reportRate: 0.01,
    repeatUsage: 2,
  },
  {
    id: 'mode005',
    title: 'Community Coin Vote',
    description: 'Cộng đồng bình chọn coin tiềm năng nhất tháng. Top 3 chia pool.',
    creator: ARENA_CREATORS[3],
    templateId: 'community_vote',
    cloneCount: 189,
    completionRate: 96,
    fairPlay: false,
    tags: ['Community', 'Monthly'],
    activeChallenges: 1,
    createdAt: '2026-01-20',
    /* ─── Discovery fields (06C) ─── */
    allowedFormats: ['Poll', 'Ranked'],
    winCondition: 'Top 3 coin được bình chọn sẽ thắng.',
    resolutionType: 'API CoinGecko',
    avgDuration: '1 tháng',
    disputeRiskLevel: 'high',
    reportRate: 0.1,
    repeatUsage: 1,
  },
];

/* ─── Live Rooms ─── */

export const ARENA_ROOMS: ArenaRoom[] = [
  {
    id: 'room001',
    title: 'BTC $70K? — Tuần 9',
    modeId: 'mode001',
    format: 'Closest Guess',
    slotsTotal: 50,
    slotsFilled: 38,
    entryPoints: 100,
    privacy: 'public',
    status: 'waiting',
    creator: { name: 'CryptoMaster_VN', avatar: '🧑‍💻' },
    endsAt: '2026-03-07T23:59:00Z',
  },
  {
    id: 'room002',
    title: 'Altcoin Battle — SOL vs AVAX vs MATIC vs DOT',
    modeId: 'mode002',
    format: 'Team Battle',
    slotsTotal: 40,
    slotsFilled: 40,
    entryPoints: 200,
    privacy: 'public',
    status: 'in_progress',
    creator: { name: 'ArenaKing', avatar: '👑' },
    endsAt: '2026-03-03T18:00:00Z',
  },
  {
    id: 'room003',
    title: 'Fed Rate Predict — March 2026',
    modeId: 'mode003',
    format: 'Prediction',
    slotsTotal: 100,
    slotsFilled: 67,
    entryPoints: 50,
    privacy: 'public',
    status: 'waiting',
    creator: { name: 'PredictorPro', avatar: '🎯' },
    endsAt: '2026-03-19T14:00:00Z',
  },
  {
    id: 'room004',
    title: 'Crypto Quiz Night #12',
    modeId: 'mode004',
    format: 'Bracket',
    slotsTotal: 16,
    slotsFilled: 12,
    entryPoints: 150,
    privacy: 'friends_only',
    status: 'waiting',
    creator: { name: 'QuizWizard', avatar: '🧙' },
    endsAt: '2026-03-01T20:00:00Z',
  },
  {
    id: 'room005',
    title: 'Coin tháng 3 — Community Vote',
    modeId: 'mode005',
    format: 'Community Vote',
    slotsTotal: 200,
    slotsFilled: 145,
    entryPoints: 30,
    privacy: 'public',
    status: 'in_progress',
    creator: { name: 'GameMaker_HN', avatar: '🎮' },
    endsAt: '2026-03-31T23:59:00Z',
  },
];

/* ─── Sample Challenge Detail ─── */

export const ARENA_CHALLENGES: ArenaChallenge[] = [
  {
    id: 'ch001',
    title: 'BTC $70K? — Tuần 9',
    description: 'Đoán giá BTC vào 23:59 UTC Chủ nhật 07/03. Người đoán gần nhất sẽ nhận toàn bộ pool.',
    modeId: 'mode001',
    modeName: 'BTC Weekly Predict',
    creator: ARENA_CREATORS[0],
    entryPoints: 100,
    prizePool: 3800,
    slotsTotal: 50,
    slotsFilled: 38,
    status: 'waiting',
    privacy: 'public',
    format: 'Closest Guess',
    rules: [
      'Mỗi người nhập 1 con số dự đoán (giá BTC/USDT)',
      'Kết quả lấy từ CoinGecko API lúc 23:59 UTC',
      'Người đoán gần nhất nhận 80% pool, nhì 15%, ba 5%',
      'Entry points bị trừ ngay khi tham gia, không hoàn lại',
      'Nếu hủy trước deadline: hoàn 50% points',
    ],
    startAt: '2026-02-28T00:00:00Z',
    endAt: '2026-03-07T23:59:00Z',
    leaderboard: [
      { rank: 1, name: 'CryptoWhale', avatar: '🐋', points: 2400, accuracy: 99.2 },
      { rank: 2, name: 'HODLer_VN', avatar: '💎', points: 800, accuracy: 98.7 },
      { rank: 3, name: 'TraderX', avatar: '📊', points: 300, accuracy: 97.1 },
      { rank: 4, name: 'SatoshiFan', avatar: '₿', points: 0 },
      { rank: 5, name: 'AlphaSeeker', avatar: '🔍', points: 0 },
    ],
    challengeState: 'open',
    participantLayout: 'open_lobby',
    participants: [
      { id: 'p001', name: 'CryptoWhale', avatar: '🐋', role: 'player', status: 'joined' },
      { id: 'p002', name: 'HODLer_VN', avatar: '💎', role: 'player', status: 'joined' },
      { id: 'p003', name: 'TraderX', avatar: '📊', role: 'player', status: 'joined' },
      { id: 'p004', name: 'SatoshiFan', avatar: '₿', role: 'player', status: 'joined' },
      { id: 'p005', name: 'AlphaSeeker', avatar: '🔍', role: 'player', status: 'joined' },
    ],
    winCondition: 'Người đoán gần nhất với giá BTC thực tế sẽ thắng.',
    resolutionMethod: 'API CoinGecko',
    evidenceRequirement: 'Không cần',
    voidRule: 'Không áp dụng',
    warningBanners: ['Kết quả lấy từ CoinGecko API, không ai can thiệp được 🔒'],
    rewardDistType: 'top3',
    rewardDistLabel: 'Top 3',
    rewardTiers: [{ rank: '🥇 1st', pct: 60 }, { rank: '🥈 2nd', pct: 25 }, { rank: '🥉 3rd', pct: 15 }],
    platformFeePct: 10,
    creatorCutPct: 5,
    consolationEnabled: true,
    consolationPct: 5,
    bonusPool: 200,
    dynamicPool: true,
    dynamicPoolMin: 10,
    refundPolicy: 'Nếu challenge bị hủy hoặc void → hoàn 100% entry points. Rời trước deadline → hoàn 50%.',
  },

  /* ─── ch002: FULL state — 1v1 layout ─── */
  {
    id: 'ch002',
    title: 'ETH Prediction Duel',
    description: '1v1 đoán giá ETH cuối tuần. Người gần nhất thắng toàn bộ pool.',
    modeId: 'mode001',
    modeName: 'BTC Weekly Predict',
    creator: ARENA_CREATORS[1],
    entryPoints: 200,
    prizePool: 400,
    slotsTotal: 2,
    slotsFilled: 2,
    status: 'waiting',
    privacy: 'private',
    format: 'Closest Guess',
    rules: [
      'Mỗi người nhập 1 dự đoán giá ETH/USDT',
      'Kết quả từ CoinGecko API lúc 23:59 UTC Chủ nhật',
      'Người gần nhất thắng 100% pool',
      'Không hoàn entry points nếu hủy',
    ],
    startAt: '2026-02-27T00:00:00Z',
    endAt: '2026-03-06T23:59:00Z',
    leaderboard: [],
    challengeState: 'full',
    participantLayout: '1v1',
    participants: [
      { id: 'p101', name: 'ArenaKing', avatar: '👑', role: 'host', status: 'joined' },
      { id: 'p102', name: 'PredictorPro', avatar: '🎯', role: 'player', status: 'joined' },
    ],
    winCondition: 'Người đoán gần nhất thắng.',
    resolutionMethod: 'API CoinGecko',
    evidenceRequirement: 'Không cần',
    voidRule: 'Hủy nếu cả 2 không submit trước deadline.',
    rewardDistType: 'winner_all',
    rewardDistLabel: 'Winner Takes All',
    rewardTiers: [{ rank: '🥇 1st', pct: 100 }],
    platformFeePct: 10,
    creatorCutPct: 0,
    consolationEnabled: false,
    consolationPct: 0,
    bonusPool: 0,
    refundPolicy: 'Nếu challenge bị hủy hoặc void → hoàn 100% entry points.',
  },

  /* ─── ch003: LIVE state — NvN layout (Team Battle) ─── */
  {
    id: 'ch003',
    title: 'Altcoin Team Battle — SOL vs AVAX',
    description: '2 đội chọn coin, coin tăng nhiều nhất trong tuần → team đó thắng pool.',
    modeId: 'mode002',
    modeName: 'Altcoin Battle Royale',
    creator: ARENA_CREATORS[1],
    entryPoints: 200,
    prizePool: 7200,
    slotsTotal: 40,
    slotsFilled: 40,
    status: 'in_progress',
    privacy: 'public',
    format: 'Team Battle',
    rules: [
      'Chia 2 đội: Team SOL và Team AVAX',
      'Coin nào tăng giá nhiều hơn trong 7 ngày → team đó thắng',
      'Team thắng chia đều pool theo đóng góp points',
      'Kết quả từ CoinGecko API, tự động chốt',
      'Không hủy sau khi challenge bắt đầu',
    ],
    startAt: '2026-02-25T00:00:00Z',
    endAt: '2026-03-03T18:00:00Z',
    leaderboard: [],
    challengeState: 'live',
    participantLayout: 'NvN',
    participants: [
      { id: 'p201', name: 'ArenaKing', avatar: '👑', role: 'captain', teamId: 'team_sol', status: 'joined' },
      { id: 'p202', name: 'CryptoWhale', avatar: '🐋', role: 'player', teamId: 'team_sol', status: 'joined' },
      { id: 'p203', name: 'HODLer_VN', avatar: '💎', role: 'player', teamId: 'team_sol', status: 'joined' },
      { id: 'p204', name: 'BlockchainBee', avatar: '🐝', role: 'player', teamId: 'team_sol', status: 'joined' },
      { id: 'p205', name: 'PredictorPro', avatar: '🎯', role: 'captain', teamId: 'team_avax', status: 'joined' },
      { id: 'p206', name: 'TraderX', avatar: '📊', role: 'player', teamId: 'team_avax', status: 'joined' },
      { id: 'p207', name: 'DeFiDragon', avatar: '🐉', role: 'player', teamId: 'team_avax', status: 'joined' },
      { id: 'p208', name: 'MoonRunner', avatar: '🌙', role: 'player', teamId: 'team_avax', status: 'joined' },
    ],
    teams: [
      { id: 'team_sol', name: 'Team SOL', color: '#9945FF', captainId: 'p201', memberIds: ['p201', 'p202', 'p203', 'p204'] },
      { id: 'team_avax', name: 'Team AVAX', color: '#E84142', captainId: 'p205', memberIds: ['p205', 'p206', 'p207', 'p208'] },
    ],
    winCondition: 'Coin tăng giá nhiều nhất trong 7 ngày → team đó thắng.',
    resolutionMethod: 'API CoinGecko — so sánh % thay đổi 7 ngày',
    evidenceRequirement: 'Không cần — tự động từ API',
    voidRule: 'Void nếu 1 trong 2 coin bị delist trong thời gian challenge.',
    rewardDistType: 'winner_all',
    rewardDistLabel: 'Winner Takes All',
    rewardTiers: [{ rank: '🏆 Team thắng', pct: 100 }],
    platformFeePct: 10,
    creatorCutPct: 3,
    consolationEnabled: false,
    bonusPool: 0,
    refundPolicy: 'Nếu void → hoàn 100% entry points. Không hoàn sau khi challenge bắt đầu.',
  },

  /* ─── ch004: PENDING_RESULT state — 1vN layout ─── */
  {
    id: 'ch004',
    title: 'Fed Rate Predict — March',
    description: 'Dự đoán kết quả Fed meeting tháng 3. Deadline trước khi công bố.',
    modeId: 'mode003',
    modeName: 'Macro News Predict',
    creator: ARENA_CREATORS[2],
    entryPoints: 50,
    prizePool: 3350,
    slotsTotal: 100,
    slotsFilled: 67,
    status: 'in_progress',
    privacy: 'public',
    format: 'Prediction',
    rules: [
      'Chọn 1 trong các phương án: Tăng / Giữ / Giảm lãi suất',
      'Kết quả từ FedReserve.gov chính thức',
      'Người đoán đúng chia pool theo tỷ lệ entry',
      'Nếu kết quả ngoài các phương án → void, hoàn points',
    ],
    startAt: '2026-02-20T00:00:00Z',
    endAt: '2026-03-19T14:00:00Z',
    leaderboard: [
      { rank: 1, name: 'PredictorPro', avatar: '🎯', points: 1200 },
      { rank: 2, name: 'CryptoMaster_VN', avatar: '🧑‍💻', points: 800 },
      { rank: 3, name: 'AlphaSeeker', avatar: '🔍', points: 600 },
    ],
    challengeState: 'pending_result',
    participantLayout: '1vN',
    participants: [
      { id: 'p301', name: 'PredictorPro', avatar: '🎯', role: 'host', status: 'joined' },
      { id: 'p302', name: 'CryptoMaster_VN', avatar: '🧑‍💻', role: 'player', status: 'joined' },
      { id: 'p303', name: 'AlphaSeeker', avatar: '🔍', role: 'player', status: 'joined' },
      { id: 'p304', name: 'HODLer_VN', avatar: '💎', role: 'player', status: 'joined' },
      { id: 'p305', name: 'SatoshiFan', avatar: '₿', role: 'player', status: 'joined' },
      { id: 'p306', name: 'TokenTiger', avatar: '🐯', role: 'player', status: 'joined' },
    ],
    winCondition: 'Đoán đúng kết quả quyết định lãi suất Fed.',
    resolutionMethod: 'Kết quả chính thức từ FedReserve.gov',
    evidenceRequirement: 'Screenshot kết quả',
    voidRule: 'Void nếu Fed meeting bị hoãn.',
    warningBanners: ['Đang chờ kết quả chính thức từ FedReserve.gov'],
    rewardDistType: 'equal_split',
    rewardDistLabel: 'Chia đều (đúng)',
    rewardTiers: [{ rank: 'Tất cả đúng', pct: 100 }],
    platformFeePct: 10,
    creatorCutPct: 0,
    consolationEnabled: false,
    bonusPool: 0,
    refundPolicy: 'Void nếu Fed meeting bị hoãn → hoàn 100%. Không hoàn nếu đoán sai.',
  },

  /* ─── ch005: RESOLVED state — Open Lobby ─── */
  {
    id: 'ch005',
    title: 'Crypto Quiz Night #11',
    description: 'Quiz trivia blockchain đã kết thúc. Xem kết quả và thống kê.',
    modeId: 'mode004',
    modeName: 'Crypto Trivia Cup',
    creator: ARENA_CREATORS[4],
    entryPoints: 150,
    prizePool: 2400,
    slotsTotal: 16,
    slotsFilled: 16,
    status: 'completed',
    privacy: 'public',
    format: 'Bracket',
    rules: [
      'Giải đấu bracket single elimination',
      'Mỗi vòng trả lời 5 câu hỏi trong 60 giây',
      'Người trả lời đúng nhiều nhất thắng vòng',
      'Final: best of 3 rounds',
    ],
    startAt: '2026-02-20T20:00:00Z',
    endAt: '2026-02-20T22:00:00Z',
    leaderboard: [
      { rank: 1, name: 'QuizWizard', avatar: '🧙', points: 1440, accuracy: 92 },
      { rank: 2, name: 'CryptoWhale', avatar: '🐋', points: 720, accuracy: 85 },
      { rank: 3, name: 'TraderX', avatar: '📊', points: 240, accuracy: 78 },
    ],
    challengeState: 'resolved',
    participantLayout: 'open_lobby',
    participants: [
      { id: 'p401', name: 'QuizWizard', avatar: '🧙', role: 'host', status: 'joined' },
      { id: 'p402', name: 'CryptoWhale', avatar: '🐋', role: 'player', status: 'joined' },
      { id: 'p403', name: 'TraderX', avatar: '📊', role: 'player', status: 'joined' },
      { id: 'p404', name: 'SatoshiFan', avatar: '₿', role: 'player', status: 'joined' },
    ],
    winCondition: 'Người trả lời chính xác nhiều nhất.',
    resolutionMethod: 'Tự động — hệ thống chấm điểm',
    evidenceRequirement: 'Không cần',
    voidRule: 'Void nếu dưới 4 người tham gia.',
    rewardDistType: 'top3',
    rewardDistLabel: 'Top 3',
    rewardTiers: [{ rank: '🥇 1st', pct: 60 }, { rank: '🥈 2nd', pct: 25 }, { rank: '🥉 3rd', pct: 15 }],
    platformFeePct: 10,
    creatorCutPct: 0,
    consolationEnabled: false,
    bonusPool: 0,
    refundPolicy: 'Void nếu dưới 4 người tham gia → hoàn 100%.',
  },

  /* ─── ch006: UNDER_REVIEW state ─── */
  {
    id: 'ch006',
    title: 'Community Coin Vote — Tháng 2',
    description: 'Bình chọn coin tiềm năng đang được xem xét do có báo cáo bất thường.',
    modeId: 'mode005',
    modeName: 'Community Coin Vote',
    creator: ARENA_CREATORS[3],
    entryPoints: 30,
    prizePool: 4350,
    slotsTotal: 200,
    slotsFilled: 145,
    status: 'in_progress',
    privacy: 'public',
    format: 'Community Vote',
    rules: [
      'Bình chọn 1 coin tiềm năng nhất',
      'Top 3 coin được bình chọn nhiều nhất → pool chia cho người bầu',
      'Kết quả cuối tháng',
    ],
    startAt: '2026-02-01T00:00:00Z',
    endAt: '2026-02-28T23:59:00Z',
    leaderboard: [],
    challengeState: 'under_review',
    participantLayout: 'open_lobby',
    participants: [
      { id: 'p501', name: 'GameMaker_HN', avatar: '🎮', role: 'host', status: 'joined' },
      { id: 'p502', name: 'MoonRunner', avatar: '🌙', role: 'player', status: 'joined' },
    ],
    winCondition: 'Top 3 coin được bình chọn nhiều nhất.',
    resolutionMethod: 'Đếm phiếu bầu',
    evidenceRequirement: 'Không cần',
    voidRule: 'Void nếu có bằng chứng spam vote.',
    warningBanners: [
      'Challenge này đang được đội ngũ kiểm duyệt xem xét.',
      'Kết quả có thể bị tạm giữ cho đến khi xác minh xong.',
    ],
    rewardDistType: 'proportional',
    rewardDistLabel: 'Tỷ lệ theo phiếu bầu',
    rewardTiers: [{ rank: 'Theo % vote', pct: 100 }],
    platformFeePct: 10,
    creatorCutPct: 0,
    consolationEnabled: false,
    bonusPool: 0,
    refundPolicy: 'Void nếu spam vote → hoàn 100%. Kết quả đang chờ xác minh.',
  },

  /* ─── ch007: CANCELED state ─── */
  {
    id: 'ch007',
    title: 'NFT Floor Price Guess (đã hủy)',
    description: 'Challenge đã bị hủy do không đủ số lượng tham gia tối thiểu.',
    modeId: 'mode001',
    modeName: 'BTC Weekly Predict',
    creator: ARENA_CREATORS[3],
    entryPoints: 80,
    prizePool: 0,
    slotsTotal: 20,
    slotsFilled: 3,
    status: 'completed',
    privacy: 'public',
    format: 'Closest Guess',
    rules: ['Đoán floor price NFT collection', 'Tối thiểu 10 người tham gia'],
    startAt: '2026-02-15T00:00:00Z',
    endAt: '2026-02-22T23:59:00Z',
    leaderboard: [],
    challengeState: 'canceled',
    participantLayout: 'open_lobby',
    participants: [
      { id: 'p601', name: 'GameMaker_HN', avatar: '🎮', role: 'host', status: 'joined' },
      { id: 'p602', name: 'TokenTiger', avatar: '🐯', role: 'player', status: 'joined' },
      { id: 'p603', name: 'ChainChamp', avatar: '🏅', role: 'player', status: 'joined' },
    ],
    winCondition: 'N/A — Đã hủy',
    resolutionMethod: 'N/A',
    evidenceRequirement: 'Không cần',
    voidRule: 'Hủy do không đủ 10 người. Entry points đã được hoàn 100%.',
    rewardDistType: 'top3',
    rewardDistLabel: 'Top 3',
    rewardTiers: [{ rank: '🥇 1st', pct: 60 }, { rank: '🥈 2nd', pct: 25 }, { rank: '🥉 3rd', pct: 15 }],
    platformFeePct: 10,
    creatorCutPct: 0,
    consolationEnabled: false,
    bonusPool: 0,
    dynamicPool: true,
    dynamicPoolMin: 10,
    refundPolicy: 'Hủy do không đủ 10 người → đã hoàn 100% entry points.',
  },
];

/* ─── My Arena Stats ─── */

export const MY_ARENA_STATS: MyArenaStats = {
  totalChallenges: 23,
  wins: 7,
  pointsEarned: 4520,
  pointsSpent: 2300,
  currentBalance: 2220,
  lockedBalance: 450,
  rank: 142,
  modesCreated: 2,
  /* ─── 06E fields ─── */
  activeChallenges: 5,
  creatorScore: 85,
  savedModes: 3,
  drafts: 2,
  /* ─── Important #9 ─── */
  pendingNotifications: 3,
  yourTurnChallenges: ['ch003', 'ch004'],
  /* ─── Reward Analytics (I6) ─── */
  rewardHistory: {
    totalPayouts: 12,
    avgROI: 142,
    largestPayout: 2400,
    winsByDistType: [
      { type: 'top3', label: 'Top 3', wins: 4, total: 8 },
      { type: 'winner_all', label: 'Winner Takes All', wins: 2, total: 6 },
      { type: 'equal_split', label: 'Chia đều', wins: 3, total: 5 },
      { type: 'proportional', label: 'Tỷ lệ theo điểm', wins: 1, total: 2 },
      { type: 'top5', label: 'Top 5', wins: 2, total: 2 },
    ],
    recentPayouts: [
      { challengeId: 'ch005', title: 'DeFi Quiz Night #12', amount: 1440, date: '20/02/2026', distType: 'Top 3', rank: 1 },
      { challengeId: 'ch001', title: 'BTC $70K? — Tuần 8', amount: 800, date: '02/03/2026', distType: 'Top 3', rank: 2 },
      { challengeId: 'ch_hist1', title: 'ETH Merge Anniversary', amount: 360, date: '15/02/2026', distType: 'Winner Takes All', rank: 1 },
      { challengeId: 'ch_hist2', title: 'Macro Quiz — Feb', amount: 220, date: '10/02/2026', distType: 'Chia đều', rank: 1 },
      { challengeId: 'ch_hist3', title: 'SOL Prediction #5', amount: -100, date: '08/02/2026', distType: 'Top 3', rank: 0 },
    ],
  },
};

/* ─── Leaderboard ─── */

export const ARENA_GLOBAL_LEADERBOARD: ArenaLeaderboardEntry[] = [
  { rank: 1, name: 'CryptoWhale', avatar: '🐋', points: 18500, accuracy: 78.5 },
  { rank: 2, name: 'PredictorPro', avatar: '🎯', points: 15200, accuracy: 82.1 },
  { rank: 3, name: 'ArenaKing', avatar: '👑', points: 12800, accuracy: 75.3 },
  { rank: 4, name: 'CryptoMaster_VN', avatar: '🧑‍💻', points: 11400, accuracy: 80.0 },
  { rank: 5, name: 'QuizWizard', avatar: '🧙', points: 9800, accuracy: 71.2 },
  { rank: 6, name: 'HODLer_VN', avatar: '💎', points: 8900, accuracy: 69.8 },
  { rank: 7, name: 'TraderX', avatar: '📊', points: 7600, accuracy: 73.5 },
  { rank: 8, name: 'GameMaker_HN', avatar: '🎮', points: 6200, accuracy: 66.4 },
  { rank: 9, name: 'SatoshiFan', avatar: '₿', points: 5400, accuracy: 68.9 },
  { rank: 10, name: 'AlphaSeeker', avatar: '🔍', points: 4800, accuracy: 64.2 },
];

/* ─── Helpers ─── */

export function getTemplateById(id: string): ArenaTemplate | undefined {
  return ARENA_TEMPLATES.find(t => t.id === id);
}

export function getModeById(id: string): ArenaMode | undefined {
  return ARENA_MODES.find(m => m.id === id);
}

export function getChallengeById(id: string): ArenaChallenge | undefined {
  return ARENA_CHALLENGES.find(ch => ch.id === id);
}

export function getCreatorById(id: string): ArenaCreator | undefined {
  return ARENA_CREATORS.find(cr => cr.id === id);
}

export function getRoomById(id: string): ArenaRoom | undefined {
  return ARENA_ROOMS.find(r => r.id === id);
}

export function fmtPoints(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function roomStatusLabel(s: RoomStatus): { label: string; color: string } {
  switch (s) {
    case 'waiting': return { label: 'Chờ tham gia', color: '#3B82F6' };
    case 'in_progress': return { label: 'Đang diễn ra', color: '#F59E0B' };
    case 'completed': return { label: 'Hoàn tất', color: '#10B981' };
  }
}

export function privacyLabel(p: RoomPrivacy): { label: string; icon: string } {
  switch (p) {
    case 'public': return { label: 'Công khai', icon: '🌐' };
    case 'private': return { label: 'Riêng tư', icon: '🔒' };
    case 'friends_only': return { label: 'Bạn bè', icon: '👥' };
  }
}

/* ─── Chat Messages (per challenge) ─── */

export const ARENA_CHAT_MESSAGES: ArenaChatMessage[] = [
  { id: 'msg001', sender: { name: 'System', avatar: '🤖' }, text: 'Challenge "BTC $70K? — Tuần 9" đã được tạo. Chào mừng mọi người!', time: '28/02 00:00', isSystem: true },
  { id: 'msg002', sender: { name: 'CryptoWhale', avatar: '🐋' }, text: 'BTC đang sideway quanh $68K, tuần này khó đoạn quá 🤔', time: '28/02 08:12' },
  { id: 'msg003', sender: { name: 'HODLer_VN', avatar: '💎' }, text: 'Mình đoán $69,200. Có tin Fed meeting sắp tới nên có thể pump nhẹ.', time: '28/02 09:30' },
  { id: 'msg004', sender: { name: 'TraderX', avatar: '📊' }, text: 'Chart H4 có dạng ascending triangle, breakout lên thì $70K cũng được', time: '28/02 10:15' },
  { id: 'msg005', sender: { name: 'System', avatar: '🤖' }, text: 'SatoshiFan vừa tham gia challenge. 39/50 slots đã đầy.', time: '28/02 11:00', isSystem: true },
  { id: 'msg006', sender: { name: 'SatoshiFan', avatar: '₿' }, text: 'Chào mọi người! Lần đầu chơi Open Arena, hứa hẹn đây 🙏', time: '28/02 11:02' },
  { id: 'msg007', sender: { name: 'CryptoWhale', avatar: '🐋' }, text: 'Welcome bro! Cứ đoạn thử đi, vui lắm haha', time: '28/02 11:05' },
  { id: 'msg008', sender: { name: 'AlphaSeeker', avatar: '🔍' }, text: 'On-chain data cho thấy whale đang accumulate. Mình bet $71K', time: '28/02 14:20' },
  { id: 'msg009', sender: { name: 'System', avatar: '🤖' }, text: 'Còn 6 ngày trước khi challenge kết thúc. Hãy submit dự đoán trước deadline!', time: '28/02 18:00', isSystem: true },
  { id: 'msg010', sender: { name: 'HODLer_VN', avatar: '💎' }, text: 'Pool đã lên 3,900 pts rồi! Ai thắng tuần này ăn to 💰', time: '28/02 20:30' },
  { id: 'msg011', sender: { name: 'TraderX', avatar: '📊' }, text: 'Deadline Chủ nhật 23:59 UTC nhé mọi người, đừng quên!', time: '01/03 08:00' },
  { id: 'msg012', sender: { name: 'CryptoMaster_VN', avatar: '🧑‍💻' }, text: 'Reminder: kết quả lấy từ CoinGecko API. Minh bạch, không ai can thiệp được 🔒', time: '01/03 09:00' },
];

/* ─── Activity Feed ─── */

export const ARENA_ACTIVITY_FEED: ArenaActivityEvent[] = [
  { id: 'act001', type: 'system', text: 'Challenge đã bắt đầu nhận dự đoán', icon: '🎯', time: '28/02 00:00', highlight: true },
  { id: 'act002', type: 'join', text: 'CryptoWhale tham gia challenge', icon: '👤', time: '28/02 01:15' },
  { id: 'act003', type: 'join', text: 'HODLer_VN tham gia challenge', icon: '👤', time: '28/02 02:30' },
  { id: 'act004', type: 'guess', text: 'CryptoWhale đã submit dự đoán', icon: '🔢', time: '28/02 08:14' },
  { id: 'act005', type: 'join', text: 'TraderX tham gia challenge', icon: '👤', time: '28/02 09:00' },
  { id: 'act006', type: 'guess', text: 'HODLer_VN đã submit dự đoán: $69,200', icon: '🔢', time: '28/02 09:32' },
  { id: 'act007', type: 'guess', text: 'TraderX đã submit dự đoán', icon: '🔢', time: '28/02 10:20' },
  { id: 'act008', type: 'join', text: 'SatoshiFan tham gia challenge', icon: '👤', time: '28/02 11:00' },
  { id: 'act009', type: 'points', text: 'Prize pool tăng lên 3,900 pts (+100)', icon: '💰', time: '28/02 11:00', highlight: true },
  { id: 'act010', type: 'join', text: 'AlphaSeeker tham gia challenge', icon: '👤', time: '28/02 14:18' },
  { id: 'act011', type: 'guess', text: 'AlphaSeeker đã submit dự đoán: $71,000', icon: '🔢', time: '28/02 14:22' },
  { id: 'act012', type: 'system', text: 'Còn 6 ngày trước deadline', icon: '⏰', time: '28/02 18:00' },
  { id: 'act013', type: 'join', text: '3 người nữa tham gia challenge', icon: '👥', time: '01/03 06:00' },
  { id: 'act014', type: 'points', text: 'Prize pool đạt 4,100 pts', icon: '💰', time: '01/03 06:00', highlight: true },
  { id: 'act015', type: 'system', text: 'Còn 5 ngày. 42/50 slots đã đầy.', icon: '📊', time: '01/03 12:00' },
];

/* ─── Daily Check-in Schedule ─── */

export const DAILY_CHECKIN: DailyCheckIn[] = [
  { day: 1, points: 10, isClaimed: true, isToday: false, isFuture: false },
  { day: 2, points: 15, isClaimed: true, isToday: false, isFuture: false },
  { day: 3, points: 20, isClaimed: true, isToday: false, isFuture: false },
  { day: 4, points: 25, isClaimed: true, isToday: false, isFuture: false },
  { day: 5, points: 30, isClaimed: false, isToday: true, isFuture: false },
  { day: 6, points: 40, isClaimed: false, isToday: false, isFuture: true },
  { day: 7, points: 100, isClaimed: false, isToday: false, isFuture: true },
];

/* ─── Points Earning Tasks ─── */

export const ARENA_POINTS_TASKS: PointsTask[] = [
  {
    id: 'task001',
    title: 'Check-in hàng ngày',
    description: 'Đăng nhập mỗi ngày để nhận points. 7 ngày liên tiếp nhận bonus x3!',
    icon: '📅',
    pointsReward: 30,
    type: 'daily',
    progress: 100,
    target: 'Mở app hôm nay',
    isCompleted: true,
    isClaimed: false,
  },
  {
    id: 'task002',
    title: 'Giao dịch Spot',
    description: 'Đạt $500 khối lượng giao dịch Spot trong ngày',
    icon: '📈',
    pointsReward: 50,
    type: 'volume',
    progress: 72,
    target: '$360 / $500',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'task003',
    title: 'Giao dịch P2P',
    description: 'Hoàn thành 1 giao dịch P2P trong ngày',
    icon: '🤝',
    pointsReward: 40,
    type: 'daily',
    progress: 0,
    target: '0/1 giao dịch',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'task004',
    title: 'Tham gia challenge',
    description: 'Tham gia ít nhất 1 challenge trong tuần',
    icon: '🎯',
    pointsReward: 80,
    type: 'weekly',
    progress: 100,
    target: '2/1 challenge',
    isCompleted: true,
    isClaimed: true,
  },
  {
    id: 'task005',
    title: 'Tạo mode mới',
    description: 'Tạo 1 mode mới và có ít nhất 5 người clone',
    icon: '🏗️',
    pointsReward: 200,
    type: 'milestone',
    progress: 40,
    target: '2/5 clone',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'task006',
    title: 'Mời bạn bè',
    description: 'Giới thiệu 1 bạn bè tham gia Open Arena',
    icon: '👥',
    pointsReward: 100,
    type: 'weekly',
    progress: 0,
    target: '0/1 bạn bè',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'task007',
    title: 'Khối lượng tuần',
    description: 'Đạt $2,000 tổng khối lượng giao dịch trong tuần',
    icon: '🔥',
    pointsReward: 150,
    type: 'volume',
    progress: 55,
    target: '$1,100 / $2,000',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'task008',
    title: 'Thắng 3 challenge',
    description: 'Thắng 3 challenge bất kỳ',
    icon: '🏆',
    pointsReward: 500,
    type: 'milestone',
    progress: 66,
    target: '2/3 wins',
    isCompleted: false,
    isClaimed: false,
  },
];

/* ─── Points History ─── */

export interface PointsHistoryEntry {
  id: string;
  action: string;
  points: number; // positive = earned, negative = spent
  source: string;
  time: string;
}

export const ARENA_POINTS_HISTORY: PointsHistoryEntry[] = [
  { id: 'ph001', action: 'Check-in ngày 5', points: 30, source: 'Daily check-in', time: '28/02 08:00' },
  { id: 'ph002', action: 'Khối lượng Spot $500', points: 50, source: 'Trading volume', time: '27/02 23:59' },
  { id: 'ph003', action: 'Tham gia BTC $70K?', points: -100, source: 'Challenge entry', time: '27/02 14:00' },
  { id: 'ph004', action: 'Thắng Macro Predict #8', points: 800, source: 'Challenge reward', time: '26/02 00:01' },
  { id: 'ph005', action: 'Check-in ngày 4', points: 25, source: 'Daily check-in', time: '26/02 08:00' },
  { id: 'ph006', action: 'Tham gia Altcoin Battle', points: -200, source: 'Challenge entry', time: '25/02 10:00' },
  { id: 'ph007', action: 'Giao dịch P2P hoàn tất', points: 40, source: 'P2P task', time: '25/02 16:30' },
  { id: 'ph008', action: 'Mời bạn ArenaNewbie', points: 100, source: 'Referral', time: '24/02 12:00' },
  { id: 'ph009', action: 'Check-in ngày 3', points: 20, source: 'Daily check-in', time: '24/02 08:00' },
  { id: 'ph010', action: 'Tạo mode — 5 clone đạt', points: 200, source: 'Mode milestone', time: '23/02 18:00' },
];

/* ─── Leaderboard v2 (06C — Discovery) ─── */

export interface LeaderboardCreatorEntry {
  rank: number;
  creator: ArenaCreator;
  fairPlayScore: number;
  winRate: number;
  completionQuality: number;
  activity: number; // rooms hosted last 30d
}

export interface LeaderboardPlayerEntry {
  rank: number;
  name: string;
  avatar: string;
  trustScore: number;
  winRate: number;
  fairPlayScore: number;
  totalChallenges: number;
  streak: number;
}

export interface LeaderboardTeamEntry {
  rank: number;
  teamName: string;
  avatar: string;
  members: number;
  winRate: number;
  fairPlayScore: number;
  totalWins: number;
}

export const LEADERBOARD_CREATORS: LeaderboardCreatorEntry[] = ARENA_CREATORS.map((cr, i) => ({
  rank: i + 1,
  creator: cr,
  fairPlayScore: cr.trustScore - Math.floor(Math.random() * 5),
  winRate: 60 + Math.floor(Math.random() * 30),
  completionQuality: cr.completionRate || (85 + Math.floor(Math.random() * 10)),
  activity: Math.floor(Math.random() * 15) + 3,
})).sort((a, b) => b.fairPlayScore - a.fairPlayScore).map((e, i) => ({ ...e, rank: i + 1 }));

export const LEADERBOARD_PLAYERS: LeaderboardPlayerEntry[] = [
  { rank: 1, name: 'CryptoWhale', avatar: '🐋', trustScore: 97, winRate: 78, fairPlayScore: 99, totalChallenges: 156, streak: 12 },
  { rank: 2, name: 'HODLer_VN', avatar: '💎', trustScore: 95, winRate: 72, fairPlayScore: 98, totalChallenges: 134, streak: 8 },
  { rank: 3, name: 'TraderX', avatar: '📊', trustScore: 93, winRate: 69, fairPlayScore: 96, totalChallenges: 98, streak: 5 },
  { rank: 4, name: 'SatoshiFan', avatar: '₿', trustScore: 91, winRate: 65, fairPlayScore: 95, totalChallenges: 87, streak: 3 },
  { rank: 5, name: 'AlphaSeeker', avatar: '🔍', trustScore: 90, winRate: 63, fairPlayScore: 94, totalChallenges: 76, streak: 7 },
  { rank: 6, name: 'BlockchainBee', avatar: '🐝', trustScore: 88, winRate: 58, fairPlayScore: 92, totalChallenges: 65, streak: 2 },
  { rank: 7, name: 'DeFiDragon', avatar: '🐉', trustScore: 86, winRate: 55, fairPlayScore: 91, totalChallenges: 54, streak: 4 },
  { rank: 8, name: 'MoonRunner', avatar: '🌙', trustScore: 84, winRate: 52, fairPlayScore: 89, totalChallenges: 48, streak: 1 },
  { rank: 9, name: 'TokenTiger', avatar: '🐯', trustScore: 82, winRate: 50, fairPlayScore: 87, totalChallenges: 42, streak: 6 },
  { rank: 10, name: 'ChainChamp', avatar: '🏅', trustScore: 80, winRate: 48, fairPlayScore: 85, totalChallenges: 38, streak: 0 },
];

export const LEADERBOARD_TEAMS: LeaderboardTeamEntry[] = [
  { rank: 1, teamName: 'VN Predictors', avatar: '🇻🇳', members: 12, winRate: 74, fairPlayScore: 97, totalWins: 45 },
  { rank: 2, teamName: 'Crypto Legends', avatar: '⭐', members: 8, winRate: 70, fairPlayScore: 95, totalWins: 38 },
  { rank: 3, teamName: 'Alpha Squad', avatar: '🔥', members: 10, winRate: 66, fairPlayScore: 93, totalWins: 32 },
  { rank: 4, teamName: 'Diamond Hands', avatar: '💎', members: 6, winRate: 62, fairPlayScore: 90, totalWins: 28 },
  { rank: 5, teamName: 'Bull Market Club', avatar: '🐂', members: 15, winRate: 58, fairPlayScore: 88, totalWins: 24 },
];

/* ─── Dispute Risk Helpers ─── */

export function disputeRiskLabel(level: 'low' | 'medium' | 'high'): { label: string; color: string } {
  switch (level) {
    case 'low': return { label: 'Thấp', color: '#10B981' };
    case 'medium': return { label: 'Trung bình', color: '#F59E0B' };
    case 'high': return { label: 'Cao', color: '#EF4444' };
  }
}

export function badgeColor(badge: string): string {
  switch (badge) {
    case 'Gold': return '#F59E0B';
    case 'Silver': return '#94A3B8';
    case 'Bronze': return '#CD7F32';
    default: return '#6B7280';
  }
}

/* ═══════════════════════════════════════════
   07A — Arena Safety & Governance Data
   ═══════════════════════════════════════════ */

export type ReportCaseStatus = 'submitted' | 'under_review' | 'action_taken' | 'closed' | 'appeal_open';

export interface ArenaReportCase {
  id: string;
  status: ReportCaseStatus;
  reason: string;
  targetName: string;
  targetType: 'user' | 'challenge' | 'mode';
  targetId: string;
  createdAt: string;
  updatedAt: string;
  timeline: { label: string; date: string; done: boolean }[];
  actionTaken?: string;
  systemNote?: string;
  relatedChallenge?: string;
}

export interface ArenaBlockedUser {
  id: string;
  name: string;
  avatar: string;
  reason: string;
  blockedAt: string;
  source: 'manual' | 'report_outcome' | 'system';
}

export interface TrustMetric {
  key: string;
  label: string;
  value: number;
  maxValue: number;
  description: string;
  color: string;
  weight: number;
}

export const ARENA_REPORT_CASES: ArenaReportCase[] = [
  {
    id: 'rpt001',
    status: 'action_taken',
    reason: 'Thao túng kết quả',
    targetName: 'GameMaker_HN',
    targetType: 'user',
    targetId: 'cr004',
    createdAt: '2026-02-20 14:30',
    updatedAt: '2026-02-24 10:00',
    timeline: [
      { label: 'Bạn đã gửi báo cáo', date: '20/02 14:30', done: true },
      { label: 'Hệ thống đã tiếp nhận', date: '20/02 14:31', done: true },
      { label: 'Đang xem xét bằng chứng', date: '21/02 09:00', done: true },
      { label: 'Kết luận: Vi phạm xác nhận', date: '24/02 10:00', done: true },
    ],
    actionTaken: 'Tạm khóa tạo challenge 7 ngày. Cảnh cáo lần 1.',
    systemNote: 'Người dùng đã sử dụng nhiều tài khoản để ảnh hưởng kết quả vote trong challenge ch006.',
    relatedChallenge: 'ch006',
  },
  {
    id: 'rpt002',
    status: 'under_review',
    reason: 'Spam hoặc quảng cáo',
    targetName: 'SpamBot_X',
    targetType: 'user',
    targetId: 'u_spam01',
    createdAt: '2026-02-26 18:00',
    updatedAt: '2026-02-27 09:00',
    timeline: [
      { label: 'Bạn đã gửi báo cáo', date: '26/02 18:00', done: true },
      { label: 'Hệ thống đã tiếp nhận', date: '26/02 18:01', done: true },
      { label: 'Đang xem xét', date: '27/02 09:00', done: true },
      { label: 'Kết luận', date: '', done: false },
    ],
    systemNote: 'Đang chờ đội ngũ xem xét nội dung chat.',
  },
  {
    id: 'rpt003',
    status: 'closed',
    reason: 'Ngôn ngữ xúc phạm',
    targetName: 'ToxicTrader',
    targetType: 'user',
    targetId: 'u_toxic01',
    createdAt: '2026-02-10 11:00',
    updatedAt: '2026-02-15 16:00',
    timeline: [
      { label: 'Bạn đã gửi báo cáo', date: '10/02 11:00', done: true },
      { label: 'Hệ thống đã tiếp nhận', date: '10/02 11:01', done: true },
      { label: 'Đang xem xét', date: '11/02 08:00', done: true },
      { label: 'Kết luận: Cấm vĩnh viễn', date: '15/02 16:00', done: true },
    ],
    actionTaken: 'Tài khoản bị cấm vĩnh viễn khỏi Open Arena.',
    systemNote: 'Ngôn ngữ xúc phạm nghiêm trọng, lặp lại nhiều lần sau cảnh cáo.',
  },
  {
    id: 'rpt004',
    status: 'appeal_open',
    reason: 'Vi phạm luật chơi',
    targetName: 'ArenaKing',
    targetType: 'challenge',
    targetId: 'ch003',
    createdAt: '2026-02-22 09:00',
    updatedAt: '2026-02-27 14:00',
    timeline: [
      { label: 'Bạn đã gửi báo cáo', date: '22/02 09:00', done: true },
      { label: 'Hệ thống đã tiếp nhận', date: '22/02 09:01', done: true },
      { label: 'Đang xem xét', date: '23/02 10:00', done: true },
      { label: 'Kết luận: Không đủ bằng chứng', date: '25/02 11:00', done: true },
    ],
    actionTaken: 'Không có hành động — không đủ bằng chứng.',
    systemNote: 'Bạn đã mở khiếu nại. Đang chờ bổ sung bằng chứng.',
    relatedChallenge: 'ch003',
  },
];

export const ARENA_BLOCKED_USERS: ArenaBlockedUser[] = [
  {
    id: 'blk001',
    name: 'SpamBot_X',
    avatar: '🤖',
    reason: 'Spam tin nhắn quảng cáo trong chat',
    blockedAt: '2026-02-26',
    source: 'manual',
  },
  {
    id: 'blk002',
    name: 'ToxicTrader',
    avatar: '💀',
    reason: 'Ngôn ngữ xúc phạm nghiêm trọng',
    blockedAt: '2026-02-15',
    source: 'report_outcome',
  },
];

export function getTrustMetrics(creator: ArenaCreator): TrustMetric[] {
  return [
    {
      key: 'fair_play',
      label: 'Fair Play',
      value: creator.trustScore,
      maxValue: 100,
      description: 'Mức độ tuân thủ luật chơi và tinh thần thể thao. Được tính từ lịch sử challenges và báo cáo.',
      color: '#10B981',
      weight: 30,
    },
    {
      key: 'completion_rate',
      label: 'Tỷ lệ hoàn thành',
      value: creator.completionRate ?? 0,
      maxValue: 100,
      description: 'Tỷ lệ challenges được hoàn thành đúng hạn so với tổng số challenges đã tạo.',
      color: '#3B82F6',
      weight: 25,
    },
    {
      key: 'report_rate',
      label: 'Tỷ lệ không bị báo cáo',
      value: Math.round(100 - (creator.disputeRate ?? 0) * 1000),
      maxValue: 100,
      description: 'Tỷ lệ không bị báo cáo vi phạm. Càng cao nghĩa là ít bị báo cáo.',
      color: '#F59E0B',
      weight: 20,
    },
    {
      key: 'dispute_rate',
      label: 'Ít tranh chấp',
      value: Math.max(0, Math.round(100 - (creator.disputeRate ?? 0) * 500)),
      maxValue: 100,
      description: 'Mức độ ít xảy ra tranh chấp trong challenges. Cao = ít tranh chấp hơn.',
      color: '#8B5CF6',
      weight: 15,
    },
    {
      key: 'creator_reliability',
      label: 'Độ tin cậy Creator',
      value: Math.min(100, Math.round((creator.communityRating ?? 3) * 20)),
      maxValue: 100,
      description: 'Đánh giá từ cộng đồng về chất lượng mode và challenge do creator tạo ra.',
      color: '#06B6D4',
      weight: 10,
    },
  ];
}

export function getReportCaseById(id: string): ArenaReportCase | undefined {
  return ARENA_REPORT_CASES.find(r => r.id === id);
}

export const REPORT_STATUS_CONFIG: Record<ReportCaseStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Đã gửi', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  under_review: { label: 'Đang xem xét', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  action_taken: { label: 'Đã xử lý', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  closed: { label: 'Đã đóng', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  appeal_open: { label: 'Đang khiếu nại', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

/* ═══════════════════════════════════════════
   07B — Arena Resolution & Ledger Data
   ═══════════════════════════════════════════ */

export type ResolutionMethod = 'auto' | 'mutual_confirm' | 'referee' | 'community_vote';
export type ResolutionStatus = 'pending' | 'evidence_submitted' | 'proposed' | 'confirmed' | 'settled' | 'disputed';

export interface ArenaResolution {
  challengeId: string;
  method: ResolutionMethod;
  status: ResolutionStatus;
  source?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  refereeId?: string;
  refereeName?: string;
  voteDeadline?: string;
  minVotes?: number;
  currentVotes?: number;
  confirmations?: { name: string; avatar: string; confirmed: boolean }[];
  evidence: { type: 'screenshot' | 'link' | 'photo' | 'video'; label: string; submitted: boolean }[];
  resultProposal?: { winner: string; winnerAvatar: string; loser?: string; poolDistribution: string; voidRule: string };
  timeline: { label: string; date: string; done: boolean }[];
}

export const ARENA_RESOLUTIONS: ArenaResolution[] = [
  { challengeId: 'ch001', method: 'auto', status: 'pending', source: 'CoinGecko API — BTC/USDT giá đóng Chủ nhật 23:59 UTC', syncStatus: 'pending', evidence: [{ type: 'link', label: 'Nguồn dữ liệu CoinGecko', submitted: true }], timeline: [{ label: 'Challenge kết thúc', date: '06/03 23:59', done: false }, { label: 'Đồng bộ dữ liệu nguồn', date: '', done: false }, { label: 'Đề xuất kết quả', date: '', done: false }, { label: 'Chốt & phân phối điểm', date: '', done: false }] },
  { challengeId: 'ch003', method: 'mutual_confirm', status: 'proposed', confirmations: [{ name: 'ArenaKing', avatar: '👑', confirmed: true }, { name: 'Bạn', avatar: '😊', confirmed: false }], evidence: [{ type: 'screenshot', label: 'Screenshot kết quả', submitted: true }, { type: 'photo', label: 'Ảnh xác nhận', submitted: false }], resultProposal: { winner: 'Team SOL', winnerAvatar: '💜', loser: 'Team AVAX', poolDistribution: '60% winner, 30% runner-up, 10% creator', voidRule: 'Void nếu 1 trong 2 coin bị delist.' }, timeline: [{ label: 'Challenge kết thúc', date: '02/03 23:59', done: true }, { label: 'Đề xuất kết quả', date: '03/03 08:00', done: true }, { label: 'Bên 1 xác nhận', date: '03/03 09:15', done: true }, { label: 'Bên 2 xác nhận', date: '', done: false }, { label: 'Chốt & phân phối điểm', date: '', done: false }] },
  { challengeId: 'ch004', method: 'referee', status: 'evidence_submitted', refereeId: 'cr003', refereeName: 'PredictorPro', evidence: [{ type: 'link', label: 'FedReserve.gov chính thức', submitted: true }, { type: 'screenshot', label: 'Screenshot kết quả', submitted: true }], resultProposal: { winner: 'Nhóm đoán "Giữ nguyên"', winnerAvatar: '🎯', poolDistribution: 'Chia đều cho người đoán đúng', voidRule: 'Void nếu Fed meeting bị hoãn.' }, timeline: [{ label: 'Challenge kết thúc', date: '19/03 14:00', done: true }, { label: 'Bằng chứng đã gửi', date: '19/03 15:30', done: true }, { label: 'Trọng tài đang xem xét', date: '19/03 16:00', done: false }, { label: 'Kết quả chính thức', date: '', done: false }, { label: 'Chốt & phân phối điểm', date: '', done: false }] },
  { challengeId: 'ch005', method: 'auto', status: 'settled', source: 'Hệ thống chấm điểm tự động — Quiz Engine', syncStatus: 'synced', evidence: [{ type: 'link', label: 'Bảng điểm quiz', submitted: true }], resultProposal: { winner: 'QuizWizard', winnerAvatar: '🧙', loser: 'CryptoWhale', poolDistribution: '60% #1, 30% #2, 10% #3', voidRule: 'N/A — đã hoàn tất.' }, timeline: [{ label: 'Challenge kết thúc', date: '20/02 22:00', done: true }, { label: 'Đồng bộ kết quả', date: '20/02 22:01', done: true }, { label: 'Kết quả đã xác nhận', date: '20/02 22:02', done: true }, { label: 'Chốt & phân phối điểm', date: '20/02 22:05', done: true }] },
  { challengeId: 'ch006', method: 'community_vote', status: 'disputed', voteDeadline: '2026-03-05T23:59:00Z', minVotes: 20, currentVotes: 12, evidence: [{ type: 'screenshot', label: 'Screenshot vote logs', submitted: true }, { type: 'link', label: 'Báo cáo bất thường', submitted: true }], timeline: [{ label: 'Challenge kết thúc', date: '28/02 23:59', done: true }, { label: 'Bỏ phiếu bắt đầu', date: '01/03 00:00', done: true }, { label: 'Phát hiện bất thường', date: '02/03 14:00', done: true }, { label: 'Đang xem xét tranh chấp', date: '02/03 14:30', done: false }, { label: 'Kết luận', date: '', done: false }] },
];

export function getResolutionByChallengeId(id: string): ArenaResolution | undefined { return ARENA_RESOLUTIONS.find(r => r.challengeId === id); }

export const RESOLUTION_METHOD_CONFIG: Record<ResolutionMethod, { label: string; desc: string; color: string; icon: string }> = {
  auto: { label: 'Tự động', desc: 'Kết quả được xác định tự động từ nguồn dữ liệu bên ngoài', color: '#3B82F6', icon: '🤖' },
  mutual_confirm: { label: 'Xác nhận 2 bên', desc: 'Tất cả các bên tham gia phải xác nhận kết quả', color: '#8B5CF6', icon: '🤝' },
  referee: { label: 'Trọng tài', desc: 'Người phân xử được chỉ định sẽ chốt kết quả', color: '#F59E0B', icon: '⚖️' },
  community_vote: { label: 'Bỏ phiếu cộng đồng', desc: 'Cộng đồng bỏ phiếu quyết định kết quả', color: '#10B981', icon: '🗳️' },
};

export const RESOLUTION_STATUS_CONFIG: Record<ResolutionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  evidence_submitted: { label: 'Đã nộp bằng chứng', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  proposed: { label: 'Đề xuất kết quả', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  confirmed: { label: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  settled: { label: 'Đã chốt', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  disputed: { label: 'Tranh chấp', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export type LedgerEntryType = 'earned' | 'spent' | 'entry' | 'settlement' | 'refund' | 'adjustment';
export type LedgerEntryStatus = 'completed' | 'pending' | 'reversed';

export interface LedgerEntry { id: string; type: LedgerEntryType; reasonCode: string; amount: number; balanceBefore: number; balanceAfter: number; status: LedgerEntryStatus; time: string; linkedChallengeId?: string; linkedChallengeName?: string; linkedModeId?: string; linkedModeName?: string; note?: string; refId: string; }

export const LEDGER_TYPE_CONFIG: Record<LedgerEntryType, { label: string; color: string; bg: string }> = {
  earned: { label: 'Nhận', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  spent: { label: 'Chi', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  entry: { label: 'Tham gia', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  settlement: { label: 'Kết toán', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  refund: { label: 'Hoàn điểm', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  adjustment: { label: 'Điều chỉnh', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export const ARENA_LEDGER_ENTRIES: LedgerEntry[] = [
  { id: 'le001', type: 'earned', reasonCode: 'DAILY_CHECKIN', amount: 30, balanceBefore: 2190, balanceAfter: 2220, status: 'completed', time: '28/02 08:00', note: 'Check-in ngày 5', refId: 'REF-D20260228-001' },
  { id: 'le002', type: 'earned', reasonCode: 'TRADE_VOLUME', amount: 50, balanceBefore: 2140, balanceAfter: 2190, status: 'completed', time: '27/02 23:59', note: 'Đạt $500 khối lượng Spot', refId: 'REF-V20260227-001' },
  { id: 'le003', type: 'entry', reasonCode: 'CHALLENGE_ENTRY', amount: -100, balanceBefore: 2240, balanceAfter: 2140, status: 'completed', time: '27/02 14:00', linkedChallengeId: 'ch001', linkedChallengeName: 'BTC $70K? — Tuần 9', refId: 'REF-E20260227-001' },
  { id: 'le004', type: 'settlement', reasonCode: 'CHALLENGE_WIN', amount: 800, balanceBefore: 1440, balanceAfter: 2240, status: 'completed', time: '26/02 00:01', linkedChallengeId: 'ch005', linkedChallengeName: 'Crypto Quiz Night #11', refId: 'REF-S20260226-001' },
  { id: 'le005', type: 'earned', reasonCode: 'DAILY_CHECKIN', amount: 25, balanceBefore: 1415, balanceAfter: 1440, status: 'completed', time: '26/02 08:00', note: 'Check-in ngày 4', refId: 'REF-D20260226-001' },
  { id: 'le006', type: 'entry', reasonCode: 'CHALLENGE_ENTRY', amount: -200, balanceBefore: 1615, balanceAfter: 1415, status: 'completed', time: '25/02 10:00', linkedChallengeId: 'ch003', linkedChallengeName: 'SOL vs AVAX Battle', refId: 'REF-E20260225-001' },
  { id: 'le007', type: 'earned', reasonCode: 'P2P_TASK', amount: 40, balanceBefore: 1575, balanceAfter: 1615, status: 'completed', time: '25/02 16:30', note: 'Giao dịch P2P hoàn tất', refId: 'REF-P20260225-001' },
  { id: 'le008', type: 'earned', reasonCode: 'REFERRAL', amount: 100, balanceBefore: 1475, balanceAfter: 1575, status: 'completed', time: '24/02 12:00', note: 'Mời bạn ArenaNewbie', refId: 'REF-R20260224-001' },
  { id: 'le009', type: 'earned', reasonCode: 'DAILY_CHECKIN', amount: 20, balanceBefore: 1455, balanceAfter: 1475, status: 'completed', time: '24/02 08:00', note: 'Check-in ngày 3', refId: 'REF-D20260224-001' },
  { id: 'le010', type: 'earned', reasonCode: 'MODE_MILESTONE', amount: 200, balanceBefore: 1255, balanceAfter: 1455, status: 'completed', time: '23/02 18:00', note: 'Mode đạt 5 clone', linkedModeId: 'mode001', linkedModeName: 'BTC Weekly Predict', refId: 'REF-M20260223-001' },
  { id: 'le011', type: 'refund', reasonCode: 'CHALLENGE_CANCEL', amount: 80, balanceBefore: 1175, balanceAfter: 1255, status: 'completed', time: '22/02 12:00', linkedChallengeId: 'ch007', linkedChallengeName: 'NFT Floor Price Guess (đã hủy)', note: 'Hoàn 100% — không đủ người tham gia', refId: 'REF-RF20260222-001' },
  { id: 'le012', type: 'entry', reasonCode: 'CHALLENGE_ENTRY', amount: -80, balanceBefore: 1255, balanceAfter: 1175, status: 'completed', time: '20/02 09:00', linkedChallengeId: 'ch007', linkedChallengeName: 'NFT Floor Price Guess', refId: 'REF-E20260220-001' },
  { id: 'le013', type: 'adjustment', reasonCode: 'ADMIN_ADJUST', amount: 50, balanceBefore: 1205, balanceAfter: 1255, status: 'completed', time: '19/02 10:00', note: 'Điều chỉnh hệ thống — bù lỗi kỹ thuật', linkedChallengeId: 'ch002', linkedChallengeName: 'ETH Merge Predict #3', refId: 'REF-A20260219-001' },
  { id: 'le014', type: 'settlement', reasonCode: 'CHALLENGE_LOSS', amount: 0, balanceBefore: 1205, balanceAfter: 1205, status: 'completed', time: '18/02 22:00', linkedChallengeId: 'ch002', linkedChallengeName: 'ETH Merge Predict #3', note: 'Không thắng — entry points đã trừ trước', refId: 'REF-S20260218-001' },
  { id: 'le015', type: 'entry', reasonCode: 'CHALLENGE_ENTRY', amount: -50, balanceBefore: 1255, balanceAfter: 1205, status: 'completed', time: '15/02 14:00', linkedChallengeId: 'ch004', linkedChallengeName: 'Fed Rate Predict — March', refId: 'REF-E20260215-001' },
];

export function getLedgerEntryById(id: string): LedgerEntry | undefined { return ARENA_LEDGER_ENTRIES.find(e => e.id === id); }