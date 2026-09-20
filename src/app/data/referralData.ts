// ============================================================
// MOCK DATA — Referral Program
// ============================================================

export interface ReferralTier {
  name: string;       // Vietnamese display name
  nameEn: string;     // English name for reference
  friends: number;
  commission: number;
  color: string;
  icon: string;
  kycBonus: number; // Fixed bonus in USDT when friend completes KYC
}

export interface ReferralFriend {
  id: string;
  name: string;
  avatar: string; // first letter
  joinedDate: string;
  kycCompleted: boolean;
  kycDate: string | null;
  firstTradeDate: string | null;
  totalVolume: number;
  totalCommission: number;
  isActive: boolean;
  status: 'pending_kyc' | 'kyc_done' | 'active_trader' | 'inactive';
  lastActiveDate?: string;
  tradeCount?: number;
  avgTradeSize?: number;
  topPair?: string;
  phone?: string;
}

export interface CommissionRecord {
  id: string;
  friendName: string;
  friendAvatar: string;
  type: 'kyc_bonus' | 'trade_commission';
  amount: number;
  currency: string;
  action: string;
  date: string;
  status: 'completed' | 'pending';
}

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

// ─── Tier Config ───
export const REFERRAL_TIERS: ReferralTier[] = [
  { name: 'Đồng', nameEn: 'Bronze', friends: 0, commission: 20, color: '#CD7F32', icon: '🥉', kycBonus: 5 },
  { name: 'Bạc', nameEn: 'Silver', friends: 5, commission: 25, color: '#94A3B8', icon: '🥈', kycBonus: 8 },
  { name: 'Vàng', nameEn: 'Gold', friends: 20, commission: 30, color: '#F3BA2F', icon: '🥇', kycBonus: 12 },
  { name: 'Kim Cương', nameEn: 'Diamond', friends: 50, commission: 35, color: '#06B6D4', icon: '💎', kycBonus: 18 },
  { name: 'Tinh Hoa', nameEn: 'Elite', friends: 100, commission: 40, color: '#9945FF', icon: '👑', kycBonus: 25 },
];

// ─── Friends List ───
export const REFERRAL_FRIENDS: ReferralFriend[] = [
  {
    id: 'rf-001', name: 'Nguyễn Thanh T.', avatar: 'N',
    joinedDate: '15/01/2026', kycCompleted: true, kycDate: '16/01/2026',
    firstTradeDate: '17/01/2026', totalVolume: 23450,
    totalCommission: 46.9, isActive: true, status: 'active_trader',
    lastActiveDate: '01/03/2026', tradeCount: 87, avgTradeSize: 269, topPair: 'BTC/USDT', phone: '0912***456',
  },
  {
    id: 'rf-002', name: 'Trần Văn H.', avatar: 'T',
    joinedDate: '20/01/2026', kycCompleted: true, kycDate: '21/01/2026',
    firstTradeDate: '23/01/2026', totalVolume: 12380,
    totalCommission: 24.8, isActive: true, status: 'active_trader',
    lastActiveDate: '28/02/2026', tradeCount: 42, avgTradeSize: 295, topPair: 'ETH/USDT', phone: '0987***321',
  },
  {
    id: 'rf-003', name: 'Lê Minh D.', avatar: 'L',
    joinedDate: '02/02/2026', kycCompleted: true, kycDate: '03/02/2026',
    firstTradeDate: '05/02/2026', totalVolume: 8920,
    totalCommission: 17.8, isActive: true, status: 'active_trader',
    lastActiveDate: '01/03/2026', tradeCount: 31, avgTradeSize: 288, topPair: 'SOL/USDT', phone: '0933***789',
  },
  {
    id: 'rf-004', name: 'Phạm Hải Y.', avatar: 'P',
    joinedDate: '10/02/2026', kycCompleted: true, kycDate: '12/02/2026',
    firstTradeDate: null, totalVolume: 0,
    totalCommission: 0, isActive: false, status: 'kyc_done',
    lastActiveDate: '12/02/2026', tradeCount: 0, avgTradeSize: 0, topPair: '—', phone: '0908***654',
  },
  {
    id: 'rf-005', name: 'Hoàng Đạt V.', avatar: 'H',
    joinedDate: '14/02/2026', kycCompleted: true, kycDate: '15/02/2026',
    firstTradeDate: '16/02/2026', totalVolume: 18760,
    totalCommission: 37.5, isActive: true, status: 'active_trader',
    lastActiveDate: '01/03/2026', tradeCount: 64, avgTradeSize: 293, topPair: 'BNB/USDT', phone: '0977***123',
  },
  {
    id: 'rf-006', name: 'Võ Thị L.', avatar: 'V',
    joinedDate: '18/02/2026', kycCompleted: true, kycDate: '19/02/2026',
    firstTradeDate: '20/02/2026', totalVolume: 5640,
    totalCommission: 11.3, isActive: true, status: 'active_trader',
    lastActiveDate: '27/02/2026', tradeCount: 18, avgTradeSize: 313, topPair: 'BTC/USDT', phone: '0965***987',
  },
  {
    id: 'rf-007', name: 'Đỗ Quốc B.', avatar: 'Đ',
    joinedDate: '22/02/2026', kycCompleted: false, kycDate: null,
    firstTradeDate: null, totalVolume: 0,
    totalCommission: 0, isActive: false, status: 'pending_kyc',
    lastActiveDate: '22/02/2026', tradeCount: 0, avgTradeSize: 0, topPair: '—', phone: '0918***246',
  },
  {
    id: 'rf-008', name: 'Bùi Anh K.', avatar: 'B',
    joinedDate: '25/02/2026', kycCompleted: false, kycDate: null,
    firstTradeDate: null, totalVolume: 0,
    totalCommission: 0, isActive: false, status: 'pending_kyc',
    lastActiveDate: '25/02/2026', tradeCount: 0, avgTradeSize: 0, topPair: '—', phone: '0945***135',
  },
];

// ─── Commission History ───
export const COMMISSION_RECORDS: CommissionRecord[] = [
  { id: 'cr-01', friendName: 'Hoàng Đạt V.', friendAvatar: 'H', type: 'trade_commission', amount: 22.30, currency: 'USDT', action: 'Giao dịch Spot BTC/USDT', date: '28/02/2026', status: 'completed' },
  { id: 'cr-02', friendName: 'Nguyễn Thanh T.', friendAvatar: 'N', type: 'trade_commission', amount: 12.40, currency: 'USDT', action: 'Giao dịch Spot ETH/USDT', date: '27/02/2026', status: 'completed' },
  { id: 'cr-03', friendName: 'Võ Thị L.', friendAvatar: 'V', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Thưởng KYC hoàn tất', date: '27/02/2026', status: 'completed' },
  { id: 'cr-04', friendName: 'Trần Văn H.', friendAvatar: 'T', type: 'trade_commission', amount: 8.20, currency: 'USDT', action: 'Giao dịch P2P', date: '26/02/2026', status: 'completed' },
  { id: 'cr-05', friendName: 'Lê Minh D.', friendAvatar: 'L', type: 'trade_commission', amount: 15.60, currency: 'USDT', action: 'Giao dịch Spot SOL/USDT', date: '25/02/2026', status: 'completed' },
  { id: 'cr-06', friendName: 'Hoàng Đạt V.', friendAvatar: 'H', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Thưởng KYC hoàn tất', date: '24/02/2026', status: 'completed' },
  { id: 'cr-07', friendName: 'Nguyễn Thanh T.', friendAvatar: 'N', type: 'trade_commission', amount: 9.80, currency: 'USDT', action: 'Giao dịch P2P', date: '23/02/2026', status: 'completed' },
  { id: 'cr-08', friendName: 'Trần Văn H.', friendAvatar: 'T', type: 'trade_commission', amount: 7.50, currency: 'USDT', action: 'Giao dịch Spot', date: '22/02/2026', status: 'completed' },
  { id: 'cr-09', friendName: 'Lê Minh D.', friendAvatar: 'L', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Thưởng KYC hoàn tất', date: '21/02/2026', status: 'completed' },
  { id: 'cr-10', friendName: 'Phạm Hải Y.', friendAvatar: 'P', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Thưởng KYC hoàn tất', date: '20/02/2026', status: 'completed' },
  { id: 'cr-11', friendName: 'Hoàng Đạt V.', friendAvatar: 'H', type: 'trade_commission', amount: 18.90, currency: 'USDT', action: 'Giao dịch Spot BNB/USDT', date: '19/02/2026', status: 'completed' },
  { id: 'cr-12', friendName: 'Nguyễn Thanh T.', friendAvatar: 'N', type: 'trade_commission', amount: 14.20, currency: 'USDT', action: 'Giao dịch Convert', date: '18/02/2026', status: 'completed' },
  // Pending records — chưa được xử lý
  { id: 'cr-13', friendName: 'Đỗ Quốc B.', friendAvatar: 'Đ', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Chờ hoàn tất KYC', date: '01/03/2026', status: 'pending' },
  { id: 'cr-14', friendName: 'Bùi Anh K.', friendAvatar: 'B', type: 'kyc_bonus', amount: 5.00, currency: 'USDT', action: 'Chờ hoàn tất KYC', date: '01/03/2026', status: 'pending' },
];

// ─── Monthly Chart Data ───
export const REFERRAL_CHART_DATA = [
  { month: 'T9', commission: 124, friends: 1 },
  { month: 'T10', commission: 187, friends: 1 },
  { month: 'T11', commission: 234, friends: 2 },
  { month: 'T12', commission: 198, friends: 1 },
  { month: 'T1', commission: 312, friends: 2 },
  { month: 'T2', commission: 421, friends: 1 },
];

// ─── Computed Stats ───
export function getReferralStats(): ReferralStats {
  const friends = REFERRAL_FRIENDS;
  const totalCommission = COMMISSION_RECORDS
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + r.amount, 0);
  const pendingCommission = COMMISSION_RECORDS
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.amount, 0);

  return {
    totalFriends: friends.length,
    activeFriends: friends.filter(f => f.isActive).length,
    kycCompleted: friends.filter(f => f.kycCompleted).length,
    totalCommission,
    pendingCommission,
    totalVolume: friends.reduce((s, f) => s + f.totalVolume, 0),
    thisMonthCommission: 421,
    thisMonthFriends: 2,
  };
}

// ─── Get Current Tier ───
export function getCurrentTier(totalFriends: number) {
  let currentIdx = 0;
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (totalFriends >= REFERRAL_TIERS[i].friends) {
      currentIdx = i;
      break;
    }
  }
  return {
    current: REFERRAL_TIERS[currentIdx],
    next: REFERRAL_TIERS[currentIdx + 1] ?? null,
    currentIdx,
  };
}

// ─── FAQ Data ───
export const REFERRAL_FAQ = [
  {
    q: 'Làm sao để nhận thưởng giới thiệu?',
    a: 'Chia sẻ mã hoặc link giới thiệu cho bạn bè. Khi họ đăng ký và hoàn tất KYC, cả hai sẽ nhận thưởng cố định bằng USDT. Ngoài ra, bạn còn nhận hoa hồng từ phí giao dịch của họ.',
  },
  {
    q: 'Thưởng KYC cố định là gì?',
    a: 'Khi bạn bè hoàn tất xác minh danh tính (KYC), cả bạn và bạn bè đều nhận một khoản thưởng cố định (tùy hạng của bạn). Thưởng được cộng vào ví trong 24h.',
  },
  {
    q: 'Hoa hồng giao dịch được tính như thế nào?',
    a: 'Bạn nhận % phí giao dịch (Spot, P2P, Convert) của bạn bè được giới thiệu. Tỷ lệ % tùy theo hạng của bạn (20% – 40%). Hoa hồng được cộng real-time.',
  },
  {
    q: 'Làm sao để lên hạng?',
    a: 'Mời càng nhiều bạn bè → hạng càng cao → % hoa hồng càng lớn. Ví dụ: 5 người → Bạc (25%), 20 người → Vàng (30%), 50 người → Kim Cương (35%).',
  },
  {
    q: 'Hoa hồng có thời hạn không?',
    a: 'Không! Hoa hồng là vĩnh viễn. Miễn là bạn bè của bạn còn giao dịch, bạn vẫn nhận hoa hồng.',
  },
  {
    q: 'Tôi có thể rút hoa hồng không?',
    a: 'Có, hoa hồng được cộng trực tiếp vào số dư USDT trong ví của bạn. Bạn có thể rút hoặc giao dịch bình thường.',
  },
];

// ─── Referral Leaderboard ───
export interface ReferralLeaderEntry {
  rank: number;
  name: string;
  avatar: string;
  friends: number;
  totalEarned: number;
  tier: string;
  tierIcon: string;
}

export const REFERRAL_LEADERBOARD: ReferralLeaderEntry[] = [
  { rank: 1, name: 'CryptoKing_VN', avatar: '👑', friends: 247, totalEarned: 12840, tier: 'Tinh Hoa', tierIcon: '👑' },
  { rank: 2, name: 'TraderPro88', avatar: '🚀', friends: 189, totalEarned: 9450, tier: 'Tinh Hoa', tierIcon: '👑' },
  { rank: 3, name: 'MinhDev', avatar: '💎', friends: 156, totalEarned: 7820, tier: 'Tinh Hoa', tierIcon: '👑' },
  { rank: 4, name: 'HanoiTrader', avatar: '🔥', friends: 98, totalEarned: 5640, tier: 'Kim Cương', tierIcon: '💎' },
  { rank: 5, name: 'SaiGon_Finance', avatar: '⭐', friends: 72, totalEarned: 3950, tier: 'Kim Cương', tierIcon: '💎' },
  { rank: 6, name: 'BlockchainVN', avatar: '🎯', friends: 54, totalEarned: 2780, tier: 'Kim Cương', tierIcon: '💎' },
  { rank: 7, name: 'CoinMaster_HCM', avatar: '🌟', friends: 45, totalEarned: 2150, tier: 'Vàng', tierIcon: '🥇' },
  { rank: 8, name: 'TradingAce', avatar: '💰', friends: 38, totalEarned: 1820, tier: 'Vàng', tierIcon: '🥇' },
];

// ─── Milestone Rewards ───
export interface ReferralMilestone {
  id: string;
  friends: number;
  reward: string;
  rewardValue: number;
  icon: string;
  claimed: boolean;
  description: string;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  { id: 'ms-1', friends: 1, reward: '5 USDT', rewardValue: 5, icon: '🎉', claimed: true, description: 'Lời mời đầu tiên' },
  { id: 'ms-3', friends: 3, reward: '10 USDT', rewardValue: 10, icon: '🌱', claimed: true, description: 'Người kết nối' },
  { id: 'ms-5', friends: 5, reward: '20 USDT + Hạng Bạc', rewardValue: 20, icon: '🥈', claimed: true, description: 'Cộng đồng nhỏ' },
  { id: 'ms-10', friends: 10, reward: '50 USDT', rewardValue: 50, icon: '🔥', claimed: false, description: 'Nhà vô địch giới thiệu' },
  { id: 'ms-20', friends: 20, reward: '100 USDT + Hạng Vàng', rewardValue: 100, icon: '🥇', claimed: false, description: 'Super Referrer' },
  { id: 'ms-50', friends: 50, reward: '300 USDT + Hạng Kim Cương', rewardValue: 300, icon: '💎', claimed: false, description: 'Ambassador' },
  { id: 'ms-100', friends: 100, reward: '1000 USDT + Hạng Tinh Hoa', rewardValue: 1000, icon: '👑', claimed: false, description: 'Legend' },
];

// ─── Active Campaign ───
export interface ReferralCampaign {
  id: string;
  title: string;
  description: string;
  bonusMultiplier: number;
  bonusLabel: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  totalParticipants: number;
  condition: string;
  extraReward: string;
}

export const ACTIVE_CAMPAIGN: ReferralCampaign = {
  id: 'camp-march-2026',
  title: 'Tháng 3 Bùng Nổ',
  description: 'Mời bạn bè trong tháng 3 nhận thưởng x2 KYC bonus!',
  bonusMultiplier: 2,
  bonusLabel: 'x2 Thưởng KYC',
  startDate: '01/03/2026',
  endDate: '31/03/2026',
  daysLeft: 29,
  totalParticipants: 1247,
  condition: 'Bạn bè đăng ký & KYC trong tháng 3/2026',
  extraReward: 'Top 10 người mời nhiều nhất nhận thêm 500 USDT',
};

// ─── Campaign History ───
export interface CampaignHistoryEntry {
  id: string;
  title: string;
  description: string;
  bonusLabel: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended' | 'upcoming';
  totalParticipants: number;
  yourResult?: {
    friendsReferred: number;
    bonusEarned: number;
    rank?: number;
    specialReward?: string;
  };
  highlights?: string;
}

export const CAMPAIGN_HISTORY: CampaignHistoryEntry[] = [
  {
    id: 'camp-march-2026',
    title: 'Tháng 3 Bùng Nổ',
    description: 'Mời bạn bè nhận thưởng x2 KYC bonus suốt tháng 3!',
    bonusLabel: 'x2 Thưởng KYC',
    startDate: '01/03/2026',
    endDate: '31/03/2026',
    status: 'active',
    totalParticipants: 1247,
    yourResult: {
      friendsReferred: 3,
      bonusEarned: 30,
    },
    highlights: 'Đang diễn ra — mời thêm bạn bè để nhận x2!',
  },
  {
    id: 'camp-feb-2026',
    title: 'Tết Nguyên Đán 2026',
    description: 'Mừng xuân mới, mời bạn nhận lì xì crypto! x3 bonus KYC trong 2 tuần.',
    bonusLabel: 'x3 Thưởng KYC',
    startDate: '25/01/2026',
    endDate: '08/02/2026',
    status: 'ended',
    totalParticipants: 3_842,
    yourResult: {
      friendsReferred: 5,
      bonusEarned: 75,
      rank: 156,
    },
    highlights: 'Bạn đã mời 5 người, Top 200 bảng xếp hạng',
  },
  {
    id: 'camp-jan-2026',
    title: 'Khởi Động 2026',
    description: 'Năm mới, ví mới! x1.5 hoa hồng giao dịch cho tất cả referral trong tháng 1.',
    bonusLabel: 'x1.5 Hoa hồng',
    startDate: '01/01/2026',
    endDate: '31/01/2026',
    status: 'ended',
    totalParticipants: 2_156,
    yourResult: {
      friendsReferred: 2,
      bonusEarned: 18.5,
    },
  },
  {
    id: 'camp-dec-2025',
    title: 'Christmas Airdrop',
    description: 'Giáng sinh an lành! Mời bạn nhận hộp quà ngẫu nhiên 5–50 USDT.',
    bonusLabel: 'Hộp quà ngẫu nhiên',
    startDate: '15/12/2025',
    endDate: '31/12/2025',
    status: 'ended',
    totalParticipants: 5_621,
    yourResult: {
      friendsReferred: 1,
      bonusEarned: 15,
      specialReward: 'Hộp quà 15 USDT',
    },
    highlights: 'Bạn nhận hộp quà 15 USDT!',
  },
];

// ─── Share Templates ───
export interface ShareTemplate {
  id: string;
  name: string;
  emoji: string;
  preview: string;
  generateMessage: (code: string, link: string) => string;
  category: 'casual' | 'professional' | 'festive';
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: 'tpl-casual-1',
    name: 'Thân thiện',
    emoji: '👋',
    preview: 'Hé, mình đang dùng VitTrade...',
    category: 'casual',
    generateMessage: (code, link) =>
      `👋 Hé! Mình đang dùng VitTrade để giao dịch crypto, rất tiện và an toàn. Đăng ký qua link của mình, cả hai đều nhận 5 USDT miễn phí!\n\n🔗 ${link}\n📋 Mã: ${code}`,
  },
  {
    id: 'tpl-casual-2',
    name: 'Ngắn gọn',
    emoji: '⚡',
    preview: 'Nhận 5 USDT miễn phí...',
    category: 'casual',
    generateMessage: (code, link) =>
      `⚡ Nhận 5 USDT miễn phí khi đăng ký VitTrade!\nMã: ${code}\nLink: ${link}`,
  },
  {
    id: 'tpl-pro-1',
    name: 'Chuyên nghiệp',
    emoji: '📊',
    preview: 'Nền tảng giao dịch crypto...',
    category: 'professional',
    generateMessage: (code, link) =>
      `📊 VitTrade — Nền tảng giao dịch crypto hàng đầu với phí thấp nhất thị trường.\n\n✅ Spot Trading, P2P, Prediction Markets\n✅ Phí chỉ từ 0.1%\n✅ Bảo mật chuẩn enterprise\n\n🎁 Đăng ký ngay nhận 5 USDT + giảm 10% phí 30 ngày\n🔗 ${link}\n📋 Mã giới thiệu: ${code}`,
  },
  {
    id: 'tpl-festive-1',
    name: 'Sự kiện tháng 3',
    emoji: '🎉',
    preview: 'x2 thưởng KYC tháng 3...',
    category: 'festive',
    generateMessage: (code, link) =>
      `🎉 THÁNG 3 BÙNG NỔ — x2 thưởng KYC trên VitTrade!\n\n💰 Đăng ký = nhận 5 USDT\n🔥 Hoàn tất KYC = thêm 10 USDT (x2 bonus!)\n📈 Bắt đầu trade = mình nhận hoa hồng, bạn nhận giảm phí!\n\nNhanh tay, chỉ trong tháng 3!\n🔗 ${link}\n📋 Mã: ${code}`,
  },
  {
    id: 'tpl-zalo-1',
    name: 'Zalo / Nhóm chat',
    emoji: '💬',
    preview: 'Ae ơi, ai muốn nhận 5$...',
    category: 'casual',
    generateMessage: (code, link) =>
      `💬 Ae ơi, ai muốn nhận 5$ free thì đăng ký VitTrade qua link mình nha. App trade crypto ngon, phí rẻ, rút nhanh. Mình dùng mấy tháng rồi, OK lắm 👍\n\nLink: ${link}\nMã: ${code}`,
  },
];

// ─── QR Code realistic pattern ───
// 21×21 QR code Version 1 Module pattern (realistic)
// 1 = dark module, 0 = light module
export const QR_CODE_MATRIX: number[][] = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,0,1,1,1,1,0,0,1,0,1,1,1,0,0,1,0,1,1],
  [0,1,0,1,0,0,0,1,1,0,1,1,0,0,1,1,0,0,1,0,0],
  [1,1,0,0,1,1,1,0,0,1,0,1,1,0,0,1,1,0,1,1,0],
  [0,0,1,1,0,0,0,1,0,1,1,0,0,1,1,0,1,1,0,0,1],
  [0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,1,0],
  [0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,0,1,0,0,1],
  [1,1,1,1,1,1,1,0,0,1,0,0,1,1,0,0,1,0,1,0,0],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,1,0,1,1,0,1,1,0,1,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,0,1,0,0,1,0,0],
  [1,0,0,0,0,0,1,0,1,1,1,0,0,1,0,1,1,0,1,1,1],
  [1,1,1,1,1,1,1,0,0,0,1,1,0,0,1,0,0,1,0,1,0],
];

// ─── Social Proof Stats ───
export const REFERRAL_SOCIAL_PROOF = {
  totalReferrers: 14_852,
  totalEarnedAll: 2_340_000,
  successRate: 78,
  avgMonthlyEarning: 127,
};

// ─── Pending Commission Details ───
export interface PendingCommissionDetail {
  id: string;
  friendName: string;
  friendAvatar: string;
  amount: number;
  currency: string;
  reason: string;
  reasonDetail: string;
  eta: string;
  progress: number;
}

export const PENDING_COMMISSION_DETAILS: PendingCommissionDetail[] = [
  {
    id: 'pd-01',
    friendName: 'Đỗ Quốc B.',
    friendAvatar: 'Đ',
    amount: 5.00,
    currency: 'USDT',
    reason: 'Chờ KYC',
    reasonDetail: 'Bạn bè đã đăng ký nhưng chưa hoàn tất xác minh danh tính (KYC). Thưởng sẽ được cộng ngay khi KYC hoàn tất.',
    eta: 'Phụ thuộc bạn bè',
    progress: 40,
  },
  {
    id: 'pd-02',
    friendName: 'Bùi Anh K.',
    friendAvatar: 'B',
    amount: 5.00,
    currency: 'USDT',
    reason: 'Chờ KYC',
    reasonDetail: 'Bạn bè mới đăng ký, đang chờ hoàn tất KYC. Nhắc họ để nhận thưởng nhanh hơn!',
    eta: 'Phụ thuộc bạn bè',
    progress: 20,
  },
];

// ─── Friend Detail Helpers ───
export interface FriendTimelineEvent {
  id: string;
  type: 'joined' | 'kyc' | 'first_trade' | 'commission' | 'milestone';
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

export function getFriendById(friendId: string): ReferralFriend | undefined {
  return REFERRAL_FRIENDS.find(f => f.id === friendId);
}

export function getFriendCommissions(friendId: string): CommissionRecord[] {
  const friend = getFriendById(friendId);
  if (!friend) return [];
  return COMMISSION_RECORDS.filter(r => r.friendName === friend.name);
}

export function getFriendTimeline(friendId: string): FriendTimelineEvent[] {
  const friend = getFriendById(friendId);
  if (!friend) return [];
  const events: FriendTimelineEvent[] = [];
  events.push({
    id: 'ev-join', type: 'joined', title: 'Đã đăng ký',
    description: 'Đăng ký qua link giới thiệu của bạn',
    date: friend.joinedDate, icon: '🎉', color: '#3B82F6',
  });
  if (friend.kycDate) {
    events.push({
      id: 'ev-kyc', type: 'kyc', title: 'Hoàn tất KYC',
      description: 'Xác minh danh tính thành công',
      date: friend.kycDate, icon: '✅', color: '#10B981',
    });
  }
  if (friend.firstTradeDate) {
    events.push({
      id: 'ev-trade', type: 'first_trade', title: 'Giao dịch đầu tiên',
      description: 'Bắt đầu trade trên VitTrade',
      date: friend.firstTradeDate, icon: '📊', color: '#8B5CF6',
    });
  }
  const commissions = getFriendCommissions(friendId);
  commissions.slice(0, 3).forEach((c, i) => {
    events.push({
      id: 'ev-comm-' + i, type: 'commission', title: 'Hoa hồng +' + c.amount.toFixed(2) + ' USDT',
      description: c.action,
      date: c.date, icon: '💰', color: '#F59E0B',
    });
  });
  return events;
}

export function getFriendChartData(friendId: string) {
  const commissions = getFriendCommissions(friendId);
  const months = ['T9', 'T10', 'T11', 'T12', 'T1', 'T2'];
  return months.map(m => ({
    month: m,
    commission: commissions.length > 0
      ? Math.round(commissions.reduce((s, c) => s + c.amount, 0) / months.length * (0.5 + Math.random()))
      : 0,
  }));
}

// ─── Commission Dispute ───
export interface CommissionDispute {
  id: string;
  recordId: string;
  type: 'missing_commission' | 'wrong_amount' | 'delayed' | 'other';
  description: string;
  status: 'submitted' | 'reviewing' | 'resolved' | 'rejected';
  createdDate: string;
  resolvedDate?: string;
  resolution?: string;
}

export const DISPUTE_TYPES = [
  { id: 'missing_commission' as const, label: 'Thiếu hoa hồng', desc: 'Bạn bè giao dịch nhưng không nhận được hoa hồng' },
  { id: 'wrong_amount' as const, label: 'Sai số tiền', desc: 'Số tiền hoa hồng không khớp với tỷ lệ % hạng hiện tại' },
  { id: 'delayed' as const, label: 'Chậm trễ', desc: 'Hoa hồng chưa được cộng sau 24h' },
  { id: 'other' as const, label: 'Vấn đề khác', desc: 'Vấn đề không thuộc các loại trên' },
];

export const MOCK_DISPUTES: CommissionDispute[] = [
  {
    id: 'disp-001',
    recordId: 'cr-07',
    type: 'delayed',
    description: 'Hoa hồng P2P ngày 23/02 chưa nhận được sau 48h.',
    status: 'resolved',
    createdDate: '25/02/2026',
    resolvedDate: '26/02/2026',
    resolution: 'Đã cộng bổ sung 9.80 USDT vào ví. Lỗi hệ thống, chân thành xin lỗi.',
  },
];

// ─── Export Helpers ───
export type ExportDateRange = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'custom';

export const EXPORT_DATE_RANGES: { id: ExportDateRange; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'last_month', label: 'Tháng trước' },
  { id: 'last_3_months', label: '3 tháng gần nhất' },
];

export function generateCommissionCSV(records: CommissionRecord[]): string {
  const header = 'ID,Bạn bè,Loại,Số tiền,Tiền tệ,Mô tả,Ngày,Trạng thái';
  const rows = records.map(r =>
    `${r.id},"${r.friendName}",${r.type === 'kyc_bonus' ? 'Thưởng KYC' : 'Hoa hồng GD'},${r.amount.toFixed(2)},${r.currency},"${r.action}",${r.date},${r.status === 'completed' ? 'Hoàn tất' : 'Đang chờ'}`
  );
  return [header, ...rows].join('\n');
}