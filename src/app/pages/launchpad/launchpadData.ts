/**
 * ══════════════════════════════════════════════════════════════
 *  Launchpad — Shared Types, Mock Data & Utilities
 * ══════════════════════════════════════════════════════════════
 */

/* ─── Types ─── */

export interface TokenAllocation {
  label: string;
  percent: number;
  color: string;
}

export interface VestingStep {
  label: string;
  percent: number;
  date: string;
  status: 'locked' | 'claimable' | 'claimed';
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  verified: boolean;
}

export interface AuditInfo {
  auditor: string;
  status: 'passed' | 'pending' | 'issues';
  critical: number;
  high: number;
  medium: number;
  reportUrl: string;
}

export interface LaunchProject {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  logoColor: string;
  description: string;
  longDescription: string;
  type: 'ido' | 'ieo' | 'launchpool';
  status: 'upcoming' | 'active' | 'ended';
  totalRaise: string;
  hardCap: string;
  price: number;
  priceUnit: string;
  minBuy: number;
  maxBuy: number;
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
  contractAddress: string;
  website: string;
  twitter: string;
  telegram: string;
  tokenomics: TokenAllocation[];
  vesting: VestingStep[];
  team: TeamMember[];
  audit: AuditInfo;
  platformFee: number; // percentage
  restrictions: string[];
}

export interface Subscription {
  id: string;
  projectId: string;
  projectName: string;
  projectSymbol: string;
  projectLogo: string;
  projectLogoColor: string;
  amount: number;
  tokensExpected: number;
  tokensAllocated: number;
  status: 'pending' | 'allocated' | 'partially_allocated' | 'claimed' | 'refunded';
  allocationRatio: number;
  timestamp: string;
  refundAmount: number;
  vestingProgress: number;
  tokensClaimed: number;
  nextUnlockDate: string;
  txHash: string;
}

/* ─── Config Maps ─── */

export const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ieo: { label: 'IEO', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  ido: { label: 'IDO', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  launchpool: { label: 'Launchpool', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Sắp diễn ra', color: '#F59E0B' },
  active: { label: 'Đang diễn ra', color: '#10B981' },
  ended: { label: 'Đã kết thúc', color: '#8B95B3' },
};

export const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ phân bổ', color: '#F59E0B' },
  allocated: { label: 'Đã phân bổ', color: '#10B981' },
  partially_allocated: { label: 'Phân bổ 1 phần', color: '#3B82F6' },
  claimed: { label: 'Đã nhận', color: '#10B981' },
  refunded: { label: 'Đã hoàn tiền', color: '#8B95B3' },
};

/* ─── Mock Projects ─── */

export const PROJECTS: LaunchProject[] = [
  {
    id: 'proj1',
    name: 'NexaAI Protocol',
    symbol: 'NEXA',
    logo: 'NA',
    logoColor: '#6366F1',
    description: 'AI-powered DeFi protocol tối ưu lợi suất tự động với Machine Learning trên-chain.',
    longDescription: 'NexaAI Protocol là nền tảng DeFi thế hệ mới, sử dụng các mô hình AI/ML để tối ưu hóa yield farming, quản lý rủi ro và tự động hóa portfolio. Protocol hoạt động trên BSC với TVL mục tiêu $50M trong 6 tháng đầu. Smart contracts đã được audit bởi CertiK và PeckShield. Team có 5 năm kinh nghiệm trong AI và blockchain.',
    type: 'ieo',
    status: 'active',
    totalRaise: '$2,500,000',
    hardCap: '$3,000,000',
    price: 0.05,
    priceUnit: 'USDT',
    minBuy: 50,
    maxBuy: 5000,
    startDate: '05/03/2026 10:00',
    endDate: '08/03/2026 10:00',
    listingDate: '10/03/2026 12:00',
    progress: 67,
    participants: 12843,
    subscribed: 2010000,
    allocation: 0,
    tags: ['AI', 'DeFi', 'Yield'],
    kyc: true,
    kycLevel: 2,
    whitelist: false,
    chain: 'BSC',
    contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    website: 'https://nexaai.io',
    twitter: '@NexaAI_Protocol',
    telegram: 't.me/NexaAI',
    platformFee: 0,
    restrictions: ['Không hỗ trợ: US, CN, KP'],
    tokenomics: [
      { label: 'Public Sale', percent: 10, color: '#6366F1' },
      { label: 'Private Sale', percent: 15, color: '#818CF8' },
      { label: 'Team', percent: 15, color: '#A78BFA' },
      { label: 'Ecosystem', percent: 25, color: '#10B981' },
      { label: 'Liquidity', percent: 15, color: '#3B82F6' },
      { label: 'Reserve', percent: 10, color: '#F59E0B' },
      { label: 'Advisors', percent: 5, color: '#EF4444' },
      { label: 'Community', percent: 5, color: '#EC4899' },
    ],
    vesting: [
      { label: 'TGE Unlock', percent: 20, date: '10/03/2026', status: 'locked' },
      { label: 'Tháng 1', percent: 0, date: '10/04/2026', status: 'locked' },
      { label: 'Tháng 2', percent: 0, date: '10/05/2026', status: 'locked' },
      { label: 'Tháng 3', percent: 13.3, date: '10/06/2026', status: 'locked' },
      { label: 'Tháng 4', percent: 13.3, date: '10/07/2026', status: 'locked' },
      { label: 'Tháng 5', percent: 13.3, date: '10/08/2026', status: 'locked' },
      { label: 'Tháng 6', percent: 13.4, date: '10/09/2026', status: 'locked' },
      { label: 'Tháng 7', percent: 13.3, date: '10/10/2026', status: 'locked' },
      { label: 'Tháng 8', percent: 13.4, date: '10/11/2026', status: 'locked' },
    ],
    team: [
      { name: 'Dr. Alex Nguyen', role: 'CEO & Co-founder', avatar: 'AN', verified: true },
      { name: 'Sarah Chen', role: 'CTO', avatar: 'SC', verified: true },
      { name: 'Michael Park', role: 'Head of AI', avatar: 'MP', verified: false },
    ],
    audit: {
      auditor: 'CertiK',
      status: 'passed',
      critical: 0,
      high: 0,
      medium: 2,
      reportUrl: '#',
    },
  },
  {
    id: 'proj2',
    name: 'MetaVerse Land',
    symbol: 'MVL',
    logo: 'MV',
    logoColor: '#8B5CF6',
    description: 'Nền tảng metaverse đất ảo kết hợp NFT và gaming với cộng đồng 5M người dùng.',
    longDescription: 'MetaVerse Land xây dựng thế giới ảo 3D nơi người dùng có thể mua, bán, xây dựng trên đất số. Tích hợp NFT marketplace, play-to-earn gaming, và social features. Đã có 5 triệu người dùng đăng ký và 200+ đối tác game studio.',
    type: 'ido',
    status: 'active',
    totalRaise: '$800,000',
    hardCap: '$1,000,000',
    price: 0.008,
    priceUnit: 'USDT',
    minBuy: 20,
    maxBuy: 2000,
    startDate: '04/03/2026 14:00',
    endDate: '07/03/2026 14:00',
    listingDate: '09/03/2026 12:00',
    progress: 89,
    participants: 8420,
    subscribed: 890000,
    allocation: 150,
    tags: ['Metaverse', 'NFT', 'Gaming'],
    kyc: true,
    kycLevel: 2,
    whitelist: true,
    chain: 'ETH',
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    website: 'https://metaverseland.io',
    twitter: '@MetaVerseLand',
    telegram: 't.me/MetaVerseLand',
    platformFee: 0,
    restrictions: ['Không hỗ trợ: US'],
    tokenomics: [
      { label: 'Public Sale', percent: 12, color: '#8B5CF6' },
      { label: 'Private Sale', percent: 18, color: '#A78BFA' },
      { label: 'Team', percent: 12, color: '#C4B5FD' },
      { label: 'Ecosystem', percent: 30, color: '#10B981' },
      { label: 'Liquidity', percent: 10, color: '#3B82F6' },
      { label: 'Marketing', percent: 8, color: '#F59E0B' },
      { label: 'Advisors', percent: 5, color: '#EF4444' },
      { label: 'Reserve', percent: 5, color: '#EC4899' },
    ],
    vesting: [
      { label: 'TGE Unlock', percent: 25, date: '09/03/2026', status: 'locked' },
      { label: 'Tháng 1', percent: 0, date: '09/04/2026', status: 'locked' },
      { label: 'Tháng 2', percent: 25, date: '09/05/2026', status: 'locked' },
      { label: 'Tháng 3', percent: 25, date: '09/06/2026', status: 'locked' },
      { label: 'Tháng 4', percent: 25, date: '09/07/2026', status: 'locked' },
    ],
    team: [
      { name: 'Jason Lee', role: 'Founder & CEO', avatar: 'JL', verified: true },
      { name: 'Emma Wong', role: 'Creative Director', avatar: 'EW', verified: true },
    ],
    audit: {
      auditor: 'PeckShield',
      status: 'passed',
      critical: 0,
      high: 1,
      medium: 3,
      reportUrl: '#',
    },
  },
  {
    id: 'proj3',
    name: 'GreenChain Eco',
    symbol: 'GCE',
    logo: 'GC',
    logoColor: '#10B981',
    description: 'Blockchain carbon credit trading platform giúp các doanh nghiệp offset khí thải CO2.',
    longDescription: 'GreenChain Eco là nền tảng giao dịch carbon credit trên blockchain, giúp các doanh nghiệp và cá nhân mua bán, theo dõi và xác minh tín chỉ carbon một cách minh bạch. Hợp tác với 50+ tổ chức môi trường quốc tế.',
    type: 'launchpool',
    status: 'upcoming',
    totalRaise: '$1,200,000',
    hardCap: '$1,500,000',
    price: 0.12,
    priceUnit: 'USDT',
    minBuy: 100,
    maxBuy: 10000,
    startDate: '15/03/2026 10:00',
    endDate: '21/03/2026 10:00',
    listingDate: '25/03/2026 12:00',
    progress: 0,
    participants: 0,
    subscribed: 0,
    allocation: 0,
    tags: ['RWA', 'ESG', 'Carbon'],
    kyc: false,
    kycLevel: 1,
    whitelist: false,
    chain: 'Polygon',
    contractAddress: '0x9876543210abcdef9876543210abcdef98765432',
    website: 'https://greenchain.eco',
    twitter: '@GreenChainEco',
    telegram: 't.me/GreenChainEco',
    platformFee: 0,
    restrictions: [],
    tokenomics: [
      { label: 'Public Sale', percent: 15, color: '#10B981' },
      { label: 'Ecosystem', percent: 30, color: '#059669' },
      { label: 'Team', percent: 10, color: '#34D399' },
      { label: 'Liquidity', percent: 20, color: '#3B82F6' },
      { label: 'Reserve', percent: 15, color: '#F59E0B' },
      { label: 'Community', percent: 10, color: '#EC4899' },
    ],
    vesting: [
      { label: 'TGE Unlock', percent: 30, date: '25/03/2026', status: 'locked' },
      { label: 'Tháng 1', percent: 0, date: '25/04/2026', status: 'locked' },
      { label: 'Tháng 2', percent: 0, date: '25/05/2026', status: 'locked' },
      { label: 'Tháng 3', percent: 23.3, date: '25/06/2026', status: 'locked' },
      { label: 'Tháng 4', percent: 23.3, date: '25/07/2026', status: 'locked' },
      { label: 'Tháng 5', percent: 23.4, date: '25/08/2026', status: 'locked' },
    ],
    team: [
      { name: 'Dr. Linh Tran', role: 'CEO', avatar: 'LT', verified: true },
      { name: 'Mark Green', role: 'CSO', avatar: 'MG', verified: true },
      { name: 'Yuki Tanaka', role: 'CTO', avatar: 'YT', verified: false },
    ],
    audit: {
      auditor: 'SlowMist',
      status: 'pending',
      critical: 0,
      high: 0,
      medium: 0,
      reportUrl: '#',
    },
  },
  {
    id: 'proj4',
    name: 'ZetaPay Finance',
    symbol: 'ZPF',
    logo: 'ZP',
    logoColor: '#F59E0B',
    description: 'Layer 2 payment protocol cho phép giao dịch USDT tức thì với phí gần bằng 0.',
    longDescription: 'ZetaPay Finance phát triển giải pháp thanh toán Layer 2 trên Ethereum, cho phép giao dịch stablecoin tức thì với phí dưới $0.01. Đã xử lý hơn 10 triệu giao dịch trong testnet và hợp tác với 30+ đối tác thanh toán.',
    type: 'ieo',
    status: 'ended',
    totalRaise: '$5,000,000',
    hardCap: '$5,000,000',
    price: 0.02,
    priceUnit: 'USDT',
    minBuy: 50,
    maxBuy: 5000,
    startDate: '15/01/2026 10:00',
    endDate: '17/01/2026 10:00',
    listingDate: '20/01/2026 12:00',
    progress: 100,
    participants: 45230,
    subscribed: 5000000,
    allocation: 0,
    roi: 340,
    tags: ['L2', 'Payment', 'DeFi'],
    kyc: true,
    kycLevel: 2,
    whitelist: false,
    chain: 'ETH',
    contractAddress: '0xdef1234567890abcdef1234567890abcdef123456',
    website: 'https://zetapay.finance',
    twitter: '@ZetaPay_Finance',
    telegram: 't.me/ZetaPay',
    platformFee: 0,
    restrictions: ['Không hỗ trợ: US, CN, KP'],
    tokenomics: [
      { label: 'Public Sale', percent: 8, color: '#F59E0B' },
      { label: 'Private Sale', percent: 20, color: '#D97706' },
      { label: 'Team', percent: 15, color: '#FCD34D' },
      { label: 'Ecosystem', percent: 25, color: '#10B981' },
      { label: 'Liquidity', percent: 12, color: '#3B82F6' },
      { label: 'Reserve', percent: 10, color: '#EF4444' },
      { label: 'Marketing', percent: 5, color: '#EC4899' },
      { label: 'Advisors', percent: 5, color: '#8B5CF6' },
    ],
    vesting: [
      { label: 'TGE Unlock', percent: 15, date: '20/01/2026', status: 'claimed' },
      { label: 'Tháng 1', percent: 0, date: '20/02/2026', status: 'claimed' },
      { label: 'Tháng 2', percent: 0, date: '20/03/2026', status: 'locked' },
      { label: 'Tháng 3', percent: 14.2, date: '20/04/2026', status: 'locked' },
      { label: 'Tháng 4', percent: 14.2, date: '20/05/2026', status: 'locked' },
      { label: 'Tháng 5', percent: 14.2, date: '20/06/2026', status: 'locked' },
      { label: 'Tháng 6', percent: 14.2, date: '20/07/2026', status: 'locked' },
      { label: 'Tháng 7', percent: 14.2, date: '20/08/2026', status: 'locked' },
      { label: 'Tháng 8', percent: 14, date: '20/09/2026', status: 'locked' },
    ],
    team: [
      { name: 'David Kim', role: 'Founder', avatar: 'DK', verified: true },
      { name: 'Anna Rodriguez', role: 'CTO', avatar: 'AR', verified: true },
      { name: 'Tom Zhang', role: 'Head of BD', avatar: 'TZ', verified: true },
    ],
    audit: {
      auditor: 'CertiK',
      status: 'passed',
      critical: 0,
      high: 0,
      medium: 1,
      reportUrl: '#',
    },
  },
  {
    id: 'proj5',
    name: 'OmniDEX',
    symbol: 'OMX',
    logo: 'OM',
    logoColor: '#06B6D4',
    description: 'Cross-chain DEX aggregator kết nối tất cả blockchain với routing thông minh nhất.',
    longDescription: 'OmniDEX là DEX aggregator đa chuỗi, sử dụng AI routing để tìm giá tốt nhất trên 15+ blockchain. Giao diện đơn giản, hỗ trợ swap cross-chain trong 1 giao dịch. Đã tích hợp 50+ DEX và xử lý $100M+ volume trong beta.',
    type: 'ido',
    status: 'ended',
    totalRaise: '$3,200,000',
    hardCap: '$3,200,000',
    price: 0.15,
    priceUnit: 'USDT',
    minBuy: 100,
    maxBuy: 8000,
    startDate: '05/01/2026 10:00',
    endDate: '08/01/2026 10:00',
    listingDate: '12/01/2026 12:00',
    progress: 100,
    participants: 31200,
    subscribed: 3200000,
    allocation: 0,
    roi: 185,
    tags: ['DEX', 'Cross-chain', 'DeFi'],
    kyc: true,
    kycLevel: 1,
    whitelist: false,
    chain: 'Multi',
    contractAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
    website: 'https://omnidex.exchange',
    twitter: '@OmniDEX_io',
    telegram: 't.me/OmniDEX',
    platformFee: 0,
    restrictions: ['Không hỗ trợ: US'],
    tokenomics: [
      { label: 'Public Sale', percent: 10, color: '#06B6D4' },
      { label: 'Private Sale', percent: 15, color: '#0891B2' },
      { label: 'Team', percent: 18, color: '#67E8F9' },
      { label: 'Ecosystem', percent: 22, color: '#10B981' },
      { label: 'Liquidity', percent: 15, color: '#3B82F6' },
      { label: 'Treasury', percent: 10, color: '#F59E0B' },
      { label: 'Advisors', percent: 5, color: '#EF4444' },
      { label: 'Community', percent: 5, color: '#EC4899' },
    ],
    vesting: [
      { label: 'TGE Unlock', percent: 20, date: '12/01/2026', status: 'claimed' },
      { label: 'Tháng 1', percent: 0, date: '12/02/2026', status: 'claimed' },
      { label: 'Tháng 2', percent: 20, date: '12/03/2026', status: 'claimable' },
      { label: 'Tháng 3', percent: 20, date: '12/04/2026', status: 'locked' },
      { label: 'Tháng 4', percent: 20, date: '12/05/2026', status: 'locked' },
      { label: 'Tháng 5', percent: 20, date: '12/06/2026', status: 'locked' },
    ],
    team: [
      { name: 'Chris Lam', role: 'CEO', avatar: 'CL', verified: true },
      { name: 'Nina Patel', role: 'CTO', avatar: 'NP', verified: true },
    ],
    audit: {
      auditor: 'Hacken',
      status: 'passed',
      critical: 0,
      high: 0,
      medium: 2,
      reportUrl: '#',
    },
  },
];

/* ─── Mock Subscriptions ─── */

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub1',
    projectId: 'proj1',
    projectName: 'NexaAI Protocol',
    projectSymbol: 'NEXA',
    projectLogo: 'NA',
    projectLogoColor: '#6366F1',
    amount: 500,
    tokensExpected: 10000,
    tokensAllocated: 7500,
    status: 'partially_allocated',
    allocationRatio: 0.75,
    timestamp: '06/03/2026 10:32',
    refundAmount: 125,
    vestingProgress: 0,
    tokensClaimed: 0,
    nextUnlockDate: '10/03/2026',
    txHash: '0xabc...def123',
  },
  {
    id: 'sub2',
    projectId: 'proj4',
    projectName: 'ZetaPay Finance',
    projectSymbol: 'ZPF',
    projectLogo: 'ZP',
    projectLogoColor: '#F59E0B',
    amount: 1000,
    tokensExpected: 50000,
    tokensAllocated: 50000,
    status: 'claimed',
    allocationRatio: 1.0,
    timestamp: '15/01/2026 11:45',
    refundAmount: 0,
    vestingProgress: 15,
    tokensClaimed: 7500,
    nextUnlockDate: '20/04/2026',
    txHash: '0xdef...ghi456',
  },
  {
    id: 'sub3',
    projectId: 'proj5',
    projectName: 'OmniDEX',
    projectSymbol: 'OMX',
    projectLogo: 'OM',
    projectLogoColor: '#06B6D4',
    amount: 2000,
    tokensExpected: 13333,
    tokensAllocated: 13333,
    status: 'allocated',
    allocationRatio: 1.0,
    timestamp: '06/01/2026 09:20',
    refundAmount: 0,
    vestingProgress: 40,
    tokensClaimed: 5333,
    nextUnlockDate: '12/04/2026',
    txHash: '0xghi...jkl789',
  },
];

/* ─── Utilities ─── */

export function getProject(id: string): LaunchProject | undefined {
  return PROJECTS.find(p => p.id === id);
}

export function formatCountdown(targetDateStr: string): string {
  // Parse dd/mm/yyyy hh:mm format
  const parts = targetDateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!parts) return '--';
  const target = new Date(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5]);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Đã kết thúc';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ═══════════════════════════════════════════════════════════
   Phase 2 — VIP Tier System
   ═══════════════════════════════════════════════════════════ */

export interface VipTier {
  level: number;
  name: string;
  color: string;
  allocationMultiplier: number;
  maxBuyMultiplier: number;
  priorityAccess: boolean;
  feeDiscount: number; // percent
  minHolding: number;  // USDT equivalent
  badge: string;
}

export const VIP_TIERS: VipTier[] = [
  { level: 0, name: 'Standard', color: '#8B95B3', allocationMultiplier: 1.0, maxBuyMultiplier: 1.0, priorityAccess: false, feeDiscount: 0, minHolding: 0, badge: '' },
  { level: 1, name: 'VIP 1', color: '#3B82F6', allocationMultiplier: 1.2, maxBuyMultiplier: 1.2, priorityAccess: false, feeDiscount: 10, minHolding: 1000, badge: '🥉' },
  { level: 2, name: 'VIP 2', color: '#8B5CF6', allocationMultiplier: 1.5, maxBuyMultiplier: 1.5, priorityAccess: false, feeDiscount: 25, minHolding: 5000, badge: '🥈' },
  { level: 3, name: 'VIP 3', color: '#F59E0B', allocationMultiplier: 2.0, maxBuyMultiplier: 2.0, priorityAccess: true, feeDiscount: 50, minHolding: 25000, badge: '🥇' },
  { level: 4, name: 'VIP 4', color: '#EF4444', allocationMultiplier: 3.0, maxBuyMultiplier: 2.5, priorityAccess: true, feeDiscount: 75, minHolding: 100000, badge: '💎' },
  { level: 5, name: 'VIP 5', color: '#EC4899', allocationMultiplier: 5.0, maxBuyMultiplier: 3.0, priorityAccess: true, feeDiscount: 100, minHolding: 500000, badge: '👑' },
];

export function getVipTier(level: number): VipTier {
  return VIP_TIERS[Math.min(level, VIP_TIERS.length - 1)];
}

/* ═══════════════════════════════════════════════════════════
   Phase 2 — Mock User State
   ═══════════════════════════════════════════════════════════ */

export interface UserLaunchpadState {
  kycLevel: number;       // 0=none, 1=basic, 2=full
  kycStatus: 'unverified' | 'pending' | 'verified';
  vipLevel: number;       // 0-5
  usdtBalance: number;
  whitelistedProjects: string[]; // project IDs
  totalInvested: number;
  totalProjects: number;
  totalClaimed: number;
  totalRefunded: number;
}

export const MOCK_USER: UserLaunchpadState = {
  kycLevel: 2,
  kycStatus: 'verified',
  vipLevel: 2,
  usdtBalance: 12500,
  whitelistedProjects: ['proj2'],
  totalInvested: 3500,
  totalProjects: 3,
  totalClaimed: 12833,
  totalRefunded: 125,
};

/* ═══════════════════════════════════════════════════════════
   Phase 2 — Historical Performance Data
   ═══════════════════════════════════════════════════════════ */

export interface HistoricalProject {
  id: string;
  name: string;
  symbol: string;
  logoColor: string;
  type: string;
  launchDate: string;
  launchPrice: number;
  athPrice: number;
  currentPrice: number;
  roiATH: number;
  roiCurrent: number;
  participants: number;
  totalRaised: string;
  status: 'trading' | 'delisted';
}

export const HISTORICAL_PROJECTS: HistoricalProject[] = [
  { id: 'hp1', name: 'ZetaPay Finance', symbol: 'ZPF', logoColor: '#F59E0B', type: 'IEO', launchDate: '01/2026', launchPrice: 0.02, athPrice: 0.088, currentPrice: 0.072, roiATH: 340, roiCurrent: 260, participants: 45230, totalRaised: '$5,000,000', status: 'trading' },
  { id: 'hp2', name: 'OmniDEX', symbol: 'OMX', logoColor: '#06B6D4', type: 'IDO', launchDate: '01/2026', launchPrice: 0.15, athPrice: 0.4275, currentPrice: 0.352, roiATH: 185, roiCurrent: 135, participants: 31200, totalRaised: '$3,200,000', status: 'trading' },
  { id: 'hp3', name: 'ShieldVault', symbol: 'SVT', logoColor: '#10B981', type: 'IEO', launchDate: '11/2025', launchPrice: 0.05, athPrice: 0.21, currentPrice: 0.165, roiATH: 320, roiCurrent: 230, participants: 28900, totalRaised: '$2,000,000', status: 'trading' },
  { id: 'hp4', name: 'DataMesh AI', symbol: 'DMA', logoColor: '#8B5CF6', type: 'IDO', launchDate: '10/2025', launchPrice: 0.08, athPrice: 0.312, currentPrice: 0.096, roiATH: 290, roiCurrent: 20, participants: 19500, totalRaised: '$1,500,000', status: 'trading' },
  { id: 'hp5', name: 'SolarChain', symbol: 'SLC', logoColor: '#EF4444', type: 'Launchpool', launchDate: '09/2025', launchPrice: 0.25, athPrice: 0.75, currentPrice: 0.42, roiATH: 200, roiCurrent: 68, participants: 22100, totalRaised: '$4,000,000', status: 'trading' },
  { id: 'hp6', name: 'MetaPay', symbol: 'MTP', logoColor: '#EC4899', type: 'IEO', launchDate: '08/2025', launchPrice: 0.03, athPrice: 0.141, currentPrice: 0.087, roiATH: 370, roiCurrent: 190, participants: 51000, totalRaised: '$6,000,000', status: 'trading' },
  { id: 'hp7', name: 'HashBridge', symbol: 'HBG', logoColor: '#3B82F6', type: 'IDO', launchDate: '07/2025', launchPrice: 0.1, athPrice: 0.38, currentPrice: 0.22, roiATH: 280, roiCurrent: 120, participants: 15800, totalRaised: '$2,500,000', status: 'trading' },
  { id: 'hp8', name: 'CryptoLens', symbol: 'CLN', logoColor: '#F97316', type: 'IEO', launchDate: '06/2025', launchPrice: 0.04, athPrice: 0.06, currentPrice: 0.018, roiATH: 50, roiCurrent: -55, participants: 8900, totalRaised: '$800,000', status: 'trading' },
];

export interface PerformanceChartPoint {
  month: string;
  avgROI: number;
  projects: number;
  volume: number;
}

export const PERFORMANCE_CHART_DATA: PerformanceChartPoint[] = [
  { month: 'Jun 25', avgROI: 50, projects: 1, volume: 800 },
  { month: 'Jul 25', avgROI: 280, projects: 1, volume: 2500 },
  { month: 'Aug 25', avgROI: 370, projects: 1, volume: 6000 },
  { month: 'Sep 25', avgROI: 200, projects: 1, volume: 4000 },
  { month: 'Oct 25', avgROI: 290, projects: 1, volume: 1500 },
  { month: 'Nov 25', avgROI: 320, projects: 1, volume: 2000 },
  { month: 'Dec 25', avgROI: 0, projects: 0, volume: 0 },
  { month: 'Jan 26', avgROI: 262, projects: 2, volume: 8200 },
  { month: 'Feb 26', avgROI: 0, projects: 0, volume: 0 },
  { month: 'Mar 26', avgROI: 0, projects: 3, volume: 4300 },
];

export const PERFORMANCE_SUMMARY = {
  totalProjects: 8,
  avgROI: 193,
  medianROI: 232,
  positiveRate: 87.5,
  totalRaised: '$25,800,000',
  totalParticipants: '222K+',
  bestProject: { name: 'MetaPay', roi: 370 },
  worstProject: { name: 'CryptoLens', roi: -55 },
};

/* ═══════════════════════════════════════════════════════════
   Phase 3 — Whitelist Application
   ═══════════════════════════════════════════════════════════ */

export interface WhitelistApplication {
  id: string;
  projectId: string;
  twitter: string;
  telegram: string;
  walletAddress: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export const MOCK_WHITELIST_APPS: WhitelistApplication[] = [
  {
    id: 'wl1',
    projectId: 'proj2',
    twitter: '@user_crypto',
    telegram: 't.me/user_crypto',
    walletAddress: '0x1234...abcd',
    reason: 'Early supporter of MetaVerse ecosystem',
    status: 'approved',
    submittedAt: '01/03/2026 08:30',
    reviewedAt: '02/03/2026 14:00',
  },
];

/* ═══════════════════════════════════════════════════════════
   Phase 3 — Notification Preferences
   ═══════════════════════════════════════════════════════════ */

export type NotifType =
  | 'sale_start'
  | 'sale_end'
  | 'allocation_result'
  | 'vesting_unlock'
  | 'project_update'
  | 'price_listing';

export interface NotifPreference {
  type: NotifType;
  label: string;
  description: string;
  enabled: boolean;
  icon: string; // lucide icon name reference
}

export const DEFAULT_NOTIF_PREFS: NotifPreference[] = [
  { type: 'sale_start', label: 'Bắt đầu mở bán', description: 'Thông báo khi vòng mở bán bắt đầu', enabled: true, icon: 'rocket' },
  { type: 'sale_end', label: 'Kết thúc mở bán', description: 'Thông báo 1h trước khi kết thúc', enabled: true, icon: 'clock' },
  { type: 'allocation_result', label: 'Kết quả phân bổ', description: 'Thông báo khi token được phân bổ', enabled: true, icon: 'check-circle' },
  { type: 'vesting_unlock', label: 'Mở khóa vesting', description: 'Thông báo khi có token sẵn sàng nhận', enabled: true, icon: 'unlock' },
  { type: 'project_update', label: 'Cập nhật dự án', description: 'Tin tức và thông báo từ dự án', enabled: false, icon: 'bell' },
  { type: 'price_listing', label: 'Listing & giá', description: 'Thông báo khi token được niêm yết', enabled: true, icon: 'trending-up' },
];

/* ═══════════════════════════════════════════════════════════
   Phase 3 — Advanced Search/Filter
   ═══════════════════════════════════════════════════════════ */

export interface FilterCriteria {
  types: string[];        // ieo, ido, launchpool
  statuses: string[];     // upcoming, active, ended
  chains: string[];       // BSC, ETH, Polygon, Multi
  kycLevelMax: number;    // 0-2
  hasWhitelist: boolean | null; // true/false/null(any)
  auditPassed: boolean | null;
  sortBy: 'newest' | 'ending_soon' | 'most_raised' | 'most_participants' | 'highest_roi';
  searchQuery: string;
}

export const DEFAULT_FILTER: FilterCriteria = {
  types: [],
  statuses: [],
  chains: [],
  kycLevelMax: 2,
  hasWhitelist: null,
  auditPassed: null,
  sortBy: 'newest',
  searchQuery: '',
};

export const AVAILABLE_CHAINS = ['BSC', 'ETH', 'Polygon', 'Multi'];

export const SORT_OPTIONS: { key: FilterCriteria['sortBy']; label: string }[] = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'ending_soon', label: 'Sắp kết thúc' },
  { key: 'most_raised', label: 'Huy động cao nhất' },
  { key: 'most_participants', label: 'Nhiều người nhất' },
  { key: 'highest_roi', label: 'ROI cao nhat' },
];

export function applyFilters(projects: LaunchProject[], filter: FilterCriteria): LaunchProject[] {
  let result = [...projects];

  // Search
  if (filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Type filter
  if (filter.types.length > 0) {
    result = result.filter(p => filter.types.includes(p.type));
  }

  // Status filter
  if (filter.statuses.length > 0) {
    result = result.filter(p => filter.statuses.includes(p.status));
  }

  // Chain filter
  if (filter.chains.length > 0) {
    result = result.filter(p => filter.chains.includes(p.chain));
  }

  // KYC level
  result = result.filter(p => p.kycLevel <= filter.kycLevelMax);

  // Whitelist
  if (filter.hasWhitelist === true) result = result.filter(p => p.whitelist);
  if (filter.hasWhitelist === false) result = result.filter(p => !p.whitelist);

  // Audit
  if (filter.auditPassed === true) result = result.filter(p => p.audit.status === 'passed');

  // Sort
  switch (filter.sortBy) {
    case 'ending_soon':
      result.sort((a, b) => (a.status === 'active' ? -1 : 1));
      break;
    case 'most_raised':
      result.sort((a, b) => b.subscribed - a.subscribed);
      break;
    case 'most_participants':
      result.sort((a, b) => b.participants - a.participants);
      break;
    case 'highest_roi':
      result.sort((a, b) => (b.roi || 0) - (a.roi || 0));
      break;
    default: // newest — keep original order
      break;
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════
   Phase 4 — Launchpool Staking
   ═══════════════════════════════════════════════════════════ */

export interface LaunchpoolPool {
  id: string;
  projectId: string;
  projectName: string;
  projectSymbol: string;
  projectLogo: string;
  projectLogoColor: string;
  stakeToken: string;
  rewardToken: string;
  apy: number;
  apyRange: [number, number];
  totalStaked: number;
  totalStakedDisplay: string;
  poolCap: number;
  userStaked: number;
  userRewards: number;
  rewardTokenPrice: number;
  minStake: number;
  maxStake: number;
  lockPeriod: number;
  cooldownDays: number;
  earlyExitPenalty: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  chain: string;
  contractAddress: string;
  stakingTiers: StakingTier[];
}

export interface StakingTier {
  minStake: number;
  label: string;
  apyBonus: number;
  color: string;
}

export interface StakePosition {
  id: string;
  poolId: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  stakeToken: string;
  rewardToken: string;
  stakedAmount: number;
  stakedAt: string;
  lockUntil: string;
  pendingRewards: number;
  claimedRewards: number;
  apy: number;
  status: 'active' | 'cooldown' | 'unlocked' | 'withdrawn';
  cooldownEnds?: string;
}

export const LAUNCHPOOL_POOLS: LaunchpoolPool[] = [
  {
    id: 'pool1',
    projectId: 'proj3',
    projectName: 'GreenChain Eco',
    projectSymbol: 'GCE',
    projectLogo: 'GC',
    projectLogoColor: '#10B981',
    stakeToken: 'USDT',
    rewardToken: 'GCE',
    apy: 42.5,
    apyRange: [25, 65],
    totalStaked: 850000,
    totalStakedDisplay: '$850,000',
    poolCap: 1500000,
    userStaked: 0,
    userRewards: 0,
    rewardTokenPrice: 0.12,
    minStake: 50,
    maxStake: 25000,
    lockPeriod: 30,
    cooldownDays: 3,
    earlyExitPenalty: 5,
    startDate: '15/03/2026 10:00',
    endDate: '15/04/2026 10:00',
    status: 'upcoming',
    chain: 'Polygon',
    contractAddress: '0x9876543210abcdef9876543210abcdef98765432',
    stakingTiers: [
      { minStake: 50, label: 'Bronze', apyBonus: 0, color: '#CD7F32' },
      { minStake: 500, label: 'Silver', apyBonus: 5, color: '#C0C0C0' },
      { minStake: 2000, label: 'Gold', apyBonus: 12, color: '#FFD700' },
      { minStake: 10000, label: 'Platinum', apyBonus: 22.5, color: '#E5E4E2' },
    ],
  },
  {
    id: 'pool2',
    projectId: 'proj1',
    projectName: 'NexaAI Protocol',
    projectSymbol: 'NEXA',
    projectLogo: 'NA',
    projectLogoColor: '#6366F1',
    stakeToken: 'BNB',
    rewardToken: 'NEXA',
    apy: 38.0,
    apyRange: [20, 55],
    totalStaked: 1200000,
    totalStakedDisplay: '$1,200,000',
    poolCap: 2000000,
    userStaked: 2500,
    userRewards: 1250,
    rewardTokenPrice: 0.05,
    minStake: 100,
    maxStake: 50000,
    lockPeriod: 14,
    cooldownDays: 2,
    earlyExitPenalty: 3,
    startDate: '05/03/2026 10:00',
    endDate: '05/04/2026 10:00',
    status: 'active',
    chain: 'BSC',
    contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    stakingTiers: [
      { minStake: 100, label: 'Bronze', apyBonus: 0, color: '#CD7F32' },
      { minStake: 1000, label: 'Silver', apyBonus: 4, color: '#C0C0C0' },
      { minStake: 5000, label: 'Gold', apyBonus: 10, color: '#FFD700' },
      { minStake: 20000, label: 'Platinum', apyBonus: 17, color: '#E5E4E2' },
    ],
  },
  {
    id: 'pool3',
    projectId: 'proj5',
    projectName: 'OmniDEX',
    projectSymbol: 'OMX',
    projectLogo: 'OM',
    projectLogoColor: '#06B6D4',
    stakeToken: 'USDT',
    rewardToken: 'OMX',
    apy: 28.0,
    apyRange: [15, 40],
    totalStaked: 2800000,
    totalStakedDisplay: '$2,800,000',
    poolCap: 3200000,
    userStaked: 5000,
    userRewards: 890,
    rewardTokenPrice: 0.352,
    minStake: 50,
    maxStake: 30000,
    lockPeriod: 7,
    cooldownDays: 1,
    earlyExitPenalty: 2,
    startDate: '01/01/2026 10:00',
    endDate: '01/04/2026 10:00',
    status: 'active',
    chain: 'Multi',
    contractAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
    stakingTiers: [
      { minStake: 50, label: 'Bronze', apyBonus: 0, color: '#CD7F32' },
      { minStake: 500, label: 'Silver', apyBonus: 3, color: '#C0C0C0' },
      { minStake: 3000, label: 'Gold', apyBonus: 7, color: '#FFD700' },
      { minStake: 15000, label: 'Platinum', apyBonus: 12, color: '#E5E4E2' },
    ],
  },
];

export const MOCK_STAKE_POSITIONS: StakePosition[] = [
  {
    id: 'sp1',
    poolId: 'pool2',
    projectName: 'NexaAI Protocol',
    projectSymbol: 'NEXA',
    projectLogoColor: '#6366F1',
    stakeToken: 'BNB',
    rewardToken: 'NEXA',
    stakedAmount: 2500,
    stakedAt: '06/03/2026 10:00',
    lockUntil: '20/03/2026 10:00',
    pendingRewards: 1250,
    claimedRewards: 0,
    apy: 48.0,
    status: 'active',
  },
  {
    id: 'sp2',
    poolId: 'pool3',
    projectName: 'OmniDEX',
    projectSymbol: 'OMX',
    projectLogoColor: '#06B6D4',
    stakeToken: 'USDT',
    rewardToken: 'OMX',
    stakedAmount: 5000,
    stakedAt: '15/01/2026 10:00',
    lockUntil: '22/01/2026 10:00',
    pendingRewards: 890,
    claimedRewards: 2340,
    apy: 35.0,
    status: 'active',
  },
];

/* ═══════════════════════════════════════════════════════════
   Phase 4 — IDO DEX Bridge
   ═══════════════════════════════════════════════════════════ */

export interface BridgeNetwork {
  id: string;
  name: string;
  symbol: string;
  color: string;
  icon: string;
  nativeCoin: string;
  gasEstimate: string;
  confirmations: number;
  avgTime: string;
}

export interface SwapRoute {
  id: string;
  path: SwapHop[];
  estimatedOutput: number;
  priceImpact: number;
  gasCost: string;
  totalFee: string;
  estimatedTime: string;
  provider: string;
  savingsVsBest: number;
  recommended: boolean;
}

export interface SwapHop {
  fromToken: string;
  toToken: string;
  dex: string;
  chain: string;
  rate: number;
}

export interface DEXBridgeOrder {
  id: string;
  sourceChain: string;
  targetChain: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  route: SwapRoute;
  status: 'pending' | 'bridging' | 'swapping' | 'completed' | 'failed';
  txHash: string;
  createdAt: string;
  completedAt?: string;
  slippage: number;
}

export const BRIDGE_NETWORKS: BridgeNetwork[] = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'ET', nativeCoin: 'ETH', gasEstimate: '$2.50', confirmations: 12, avgTime: '~3 min' },
  { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC', color: '#F0B90B', icon: 'BS', nativeCoin: 'BNB', gasEstimate: '$0.15', confirmations: 15, avgTime: '~45 sec' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', icon: 'PG', nativeCoin: 'MATIC', gasEstimate: '$0.01', confirmations: 128, avgTime: '~2 min' },
  { id: 'arb', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', icon: 'AR', nativeCoin: 'ETH', gasEstimate: '$0.08', confirmations: 1, avgTime: '~1 min' },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', color: '#E84142', icon: 'AV', nativeCoin: 'AVAX', gasEstimate: '$0.05', confirmations: 1, avgTime: '~2 sec' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', color: '#9945FF', icon: 'SO', nativeCoin: 'SOL', gasEstimate: '$0.001', confirmations: 1, avgTime: '~400 ms' },
];

export const MOCK_SWAP_ROUTES: SwapRoute[] = [
  {
    id: 'route1',
    path: [
      { fromToken: 'USDT', toToken: 'ETH', dex: 'Uniswap V3', chain: 'Ethereum', rate: 0.000385 },
      { fromToken: 'ETH', toToken: 'USDT', dex: 'Bridge', chain: 'Polygon', rate: 2597.0 },
      { fromToken: 'USDT', toToken: 'GCE', dex: 'QuickSwap', chain: 'Polygon', rate: 8.33 },
    ],
    estimatedOutput: 8290,
    priceImpact: 0.12,
    gasCost: '$2.85',
    totalFee: '$3.50',
    estimatedTime: '~5 min',
    provider: 'VitBridge Aggregator',
    savingsVsBest: 0,
    recommended: true,
  },
  {
    id: 'route2',
    path: [
      { fromToken: 'USDT', toToken: 'USDT', dex: 'Bridge', chain: 'Polygon', rate: 1.0 },
      { fromToken: 'USDT', toToken: 'GCE', dex: 'QuickSwap', chain: 'Polygon', rate: 8.28 },
    ],
    estimatedOutput: 8240,
    priceImpact: 0.18,
    gasCost: '$0.35',
    totalFee: '$1.20',
    estimatedTime: '~3 min',
    provider: 'Direct Bridge',
    savingsVsBest: -0.6,
    recommended: false,
  },
  {
    id: 'route3',
    path: [
      { fromToken: 'USDT', toToken: 'MATIC', dex: 'Uniswap V3', chain: 'Ethereum', rate: 1.82 },
      { fromToken: 'MATIC', toToken: 'MATIC', dex: 'Bridge', chain: 'Polygon', rate: 1.0 },
      { fromToken: 'MATIC', toToken: 'GCE', dex: 'SushiSwap', chain: 'Polygon', rate: 4.55 },
    ],
    estimatedOutput: 8180,
    priceImpact: 0.35,
    gasCost: '$3.20',
    totalFee: '$4.80',
    estimatedTime: '~7 min',
    provider: 'Multi-hop Route',
    savingsVsBest: -1.3,
    recommended: false,
  },
];

/* ═══════════════════════════════════════════════════════════
   Phase 4 — Multi-chain Contract Interaction
   ═══════════════════════════════════════════════════════════ */

export interface ContractFunction {
  name: string;
  description: string;
  type: 'read' | 'write';
  params: ContractParam[];
  estimatedGas?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ContractParam {
  name: string;
  type: 'uint256' | 'address' | 'bool' | 'string';
  label: string;
  placeholder: string;
  required: boolean;
}

export interface TxSimulation {
  id: string;
  functionName: string;
  chain: string;
  contractAddress: string;
  params: Record<string, string>;
  status: 'simulating' | 'success' | 'warning' | 'failed';
  gasEstimate: string;
  gasPrice: string;
  totalCost: string;
  expectedOutput?: string;
  warnings: string[];
  errors: string[];
  stateChanges: StateChange[];
}

export interface StateChange {
  description: string;
  before: string;
  after: string;
  type: 'balance' | 'allowance' | 'state';
}

export const CONTRACT_FUNCTIONS: Record<string, ContractFunction[]> = {
  launchpool: [
    {
      name: 'approve', description: 'Cho phép contract sử dụng token của bạn', type: 'write', riskLevel: 'medium', estimatedGas: '46,000',
      params: [
        { name: 'spender', type: 'address', label: 'Contract address', placeholder: '0x...', required: true },
        { name: 'amount', type: 'uint256', label: 'Số lượng approve', placeholder: 'Max: unlimited', required: true },
      ],
    },
    {
      name: 'stake', description: 'Stake token vào pool để nhận phần thưởng', type: 'write', riskLevel: 'medium', estimatedGas: '120,000',
      params: [
        { name: 'amount', type: 'uint256', label: 'Số lượng stake', placeholder: '0.00', required: true },
        { name: 'lockPeriod', type: 'uint256', label: 'Thời gian khóa (ngày)', placeholder: '14', required: true },
      ],
    },
    {
      name: 'unstake', description: 'Rút token đã stake. Có thể mất phí nếu rút sớm', type: 'write', riskLevel: 'high', estimatedGas: '95,000',
      params: [
        { name: 'amount', type: 'uint256', label: 'Số lượng rút', placeholder: '0.00', required: true },
      ],
    },
    {
      name: 'claimRewards', description: 'Nhận phần thưởng token đã tích lũy', type: 'write', riskLevel: 'low', estimatedGas: '85,000',
      params: [],
    },
    {
      name: 'getStakeInfo', description: 'Xem thông tin stake hiện tại của bạn', type: 'read', riskLevel: 'low',
      params: [{ name: 'account', type: 'address', label: 'Địa chỉ ví', placeholder: '0x...', required: true }],
    },
    {
      name: 'pendingRewards', description: 'Xem số phần thưởng đang chờ nhận', type: 'read', riskLevel: 'low',
      params: [{ name: 'account', type: 'address', label: 'Địa chỉ ví', placeholder: '0x...', required: true }],
    },
  ],
  ido: [
    {
      name: 'approve', description: 'Cho phép contract sử dụng token của bạn', type: 'write', riskLevel: 'medium', estimatedGas: '46,000',
      params: [
        { name: 'spender', type: 'address', label: 'Contract address', placeholder: '0x...', required: true },
        { name: 'amount', type: 'uint256', label: 'Số lượng approve', placeholder: 'Max: unlimited', required: true },
      ],
    },
    {
      name: 'participate', description: 'Tham gia IDO với số tiền chỉ định', type: 'write', riskLevel: 'high', estimatedGas: '150,000',
      params: [{ name: 'amount', type: 'uint256', label: 'Số tiền tham gia (USDT)', placeholder: '0.00', required: true }],
    },
    {
      name: 'claim', description: 'Nhận token sau khi IDO kết thúc', type: 'write', riskLevel: 'low', estimatedGas: '80,000',
      params: [],
    },
    {
      name: 'refund', description: 'Yêu cầu hoàn tiền nếu chưa được phân bổ', type: 'write', riskLevel: 'medium', estimatedGas: '90,000',
      params: [],
    },
    {
      name: 'getUserAllocation', description: 'Xem phân bổ token của bạn', type: 'read', riskLevel: 'low',
      params: [{ name: 'account', type: 'address', label: 'Địa chỉ ví', placeholder: '0x...', required: true }],
    },
  ],
};

export const MOCK_TX_SIMULATIONS: TxSimulation[] = [
  {
    id: 'sim1', functionName: 'stake', chain: 'BSC',
    contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    params: { amount: '2500', lockPeriod: '14' },
    status: 'success', gasEstimate: '120,000', gasPrice: '5 Gwei', totalCost: '$0.18',
    expectedOutput: 'Stake 2,500 BNB for 14 days at 48% APY',
    warnings: [], errors: [],
    stateChanges: [
      { description: 'Số dư BNB', before: '5,000.00', after: '2,500.00', type: 'balance' },
      { description: 'Staked amount', before: '0.00', after: '2,500.00', type: 'state' },
      { description: 'Lock until', before: '—', after: '20/03/2026', type: 'state' },
    ],
  },
  {
    id: 'sim2', functionName: 'approve', chain: 'Polygon',
    contractAddress: '0x9876543210abcdef9876543210abcdef98765432',
    params: { spender: '0x9876...5432', amount: 'unlimited' },
    status: 'warning', gasEstimate: '46,000', gasPrice: '30 Gwei', totalCost: '$0.01',
    expectedOutput: 'Approve unlimited USDT spending',
    warnings: ['Bạn đang approve không giới hạn. Nên chỉ approve số lượng cần thiết.'],
    errors: [],
    stateChanges: [
      { description: 'USDT allowance', before: '0', after: 'Unlimited', type: 'allowance' },
    ],
  },
];

export function getPool(id: string): LaunchpoolPool | undefined {
  return LAUNCHPOOL_POOLS.find(p => p.id === id);
}

export function calculateAPY(baseAPY: number, stakedAmount: number, tiers: StakingTier[]): number {
  let bonus = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (stakedAmount >= tiers[i].minStake) { bonus = tiers[i].apyBonus; break; }
  }
  return baseAPY + bonus;
}

export function estimateRewards(amount: number, apy: number, days: number, tokenPrice: number): {
  tokenRewards: number; usdValue: number; dailyRate: number;
} {
  const dailyRate = apy / 365 / 100;
  const tokenRewards = (amount / tokenPrice) * dailyRate * days;
  const usdValue = tokenRewards * tokenPrice;
  return { tokenRewards: Math.round(tokenRewards * 100) / 100, usdValue: Math.round(usdValue * 100) / 100, dailyRate: Math.round(dailyRate * 10000) / 10000 };
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.5 — Bridge Transaction History (persisted)
   ═══════════════════════════════════════════════════════════ */

export interface BridgeTxRecord {
  id: string;
  projectId: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  sourceChain: string;
  targetChain: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  routeProvider: string;
  routeHops: number;
  gasCost: string;
  totalFee: string;
  slippage: number;
  priceImpact: number;
  status: 'pending' | 'bridging' | 'swapping' | 'completed' | 'failed';
  txHash: string;
  createdAt: string;
  completedAt?: string;
  failReason?: string;
}

const BRIDGE_HISTORY_KEY = 'vit_bridge_tx_history';

export function loadBridgeHistory(): BridgeTxRecord[] {
  try {
    const raw = localStorage.getItem(BRIDGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : SEED_BRIDGE_HISTORY;
  } catch {
    return SEED_BRIDGE_HISTORY;
  }
}

export function saveBridgeHistory(records: BridgeTxRecord[]): void {
  try {
    localStorage.setItem(BRIDGE_HISTORY_KEY, JSON.stringify(records));
  } catch { /* quota exceeded */ }
}

export function addBridgeTx(record: BridgeTxRecord): BridgeTxRecord[] {
  const list = loadBridgeHistory();
  list.unshift(record);
  if (list.length > 50) list.length = 50;
  saveBridgeHistory(list);
  return list;
}

export function updateBridgeTxStatus(id: string, status: BridgeTxRecord['status'], completedAt?: string): BridgeTxRecord[] {
  const list = loadBridgeHistory();
  const idx = list.findIndex(t => t.id === id);
  if (idx >= 0) {
    list[idx].status = status;
    if (completedAt) list[idx].completedAt = completedAt;
    saveBridgeHistory(list);
  }
  return list;
}

export const SEED_BRIDGE_HISTORY: BridgeTxRecord[] = [
  {
    id: 'btx1', projectId: 'proj2', projectName: 'MetaVerse Land', projectSymbol: 'MVL',
    projectLogoColor: '#8B5CF6', sourceChain: 'Ethereum', targetChain: 'Polygon',
    inputToken: 'USDT', outputToken: 'MVL', inputAmount: 500, outputAmount: 62500,
    routeProvider: 'VitBridge Aggregator', routeHops: 3, gasCost: '$2.85', totalFee: '$3.50',
    slippage: 0.5, priceImpact: 0.15,
    status: 'completed', txHash: '0x4a7b...e2f1',
    createdAt: '04/03/2026 15:30', completedAt: '04/03/2026 15:35',
  },
  {
    id: 'btx2', projectId: 'proj5', projectName: 'OmniDEX', projectSymbol: 'OMX',
    projectLogoColor: '#06B6D4', sourceChain: 'BNB Smart Chain', targetChain: 'Arbitrum',
    inputToken: 'USDT', outputToken: 'OMX', inputAmount: 1000, outputAmount: 6666,
    routeProvider: 'Direct Bridge', routeHops: 2, gasCost: '$0.35', totalFee: '$1.20',
    slippage: 0.5, priceImpact: 0.22,
    status: 'completed', txHash: '0x8c3d...a9b5',
    createdAt: '01/03/2026 10:15', completedAt: '01/03/2026 10:18',
  },
  {
    id: 'btx3', projectId: 'proj2', projectName: 'MetaVerse Land', projectSymbol: 'MVL',
    projectLogoColor: '#8B5CF6', sourceChain: 'Avalanche', targetChain: 'Polygon',
    inputToken: 'USDT', outputToken: 'MVL', inputAmount: 250, outputAmount: 30750,
    routeProvider: 'Multi-hop Route', routeHops: 3, gasCost: '$0.12', totalFee: '$0.85',
    slippage: 1.0, priceImpact: 0.42,
    status: 'failed', txHash: '0xf1e2...b3c4',
    createdAt: '28/02/2026 09:00',
    failReason: 'Slippage vượt quá mức cho phép. Giá thay đổi quá lớn trong quá trình bridge.',
  },
];

/* ═══════════════════════════════════════════════════════════
   Phase 4.5 — ABI Auto-Detection Simulation
   ═══════════════════════════════════════════════════════════ */

export interface ABIDetectionResult {
  address: string;
  chain: string;
  verified: boolean;
  contractName: string;
  compiler: string;
  optimization: boolean;
  license: string;
  proxyType: 'none' | 'transparent' | 'uups' | 'beacon';
  implementationAddress?: string;
  detectedStandards: string[];
  readFunctions: DetectedFunction[];
  writeFunctions: DetectedFunction[];
  events: string[];
  securityFlags: SecurityFlag[];
  detectionTime: number;
}

export interface DetectedFunction {
  name: string;
  selector: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
  confidence: number;
}

export interface SecurityFlag {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  code: string;
  message: string;
  recommendation: string;
}

export function simulateABIDetection(address: string, chain: string): ABIDetectionResult {
  const isLP = address.startsWith('0x1a') || address.startsWith('0x98');
  return {
    address, chain, verified: true,
    contractName: isLP ? 'LaunchpoolStaking' : 'IDOSaleV2',
    compiler: 'solc 0.8.20', optimization: true, license: 'MIT',
    proxyType: isLP ? 'transparent' : 'none',
    implementationAddress: isLP ? '0xImpl...4567' : undefined,
    detectedStandards: isLP ? ['ERC20','Ownable','ReentrancyGuard','Pausable'] : ['ERC20','Ownable','ReentrancyGuard'],
    readFunctions: isLP ? [
      { name:'totalStaked', selector:'0x817b1cd2', inputs:[], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:99 },
      { name:'stakingToken', selector:'0x72f702f3', inputs:[], outputs:[{name:'',type:'address'}], stateMutability:'view', confidence:99 },
      { name:'rewardRate', selector:'0x7b0a47ee', inputs:[], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:98 },
      { name:'earned', selector:'0x008cc262', inputs:[{name:'account',type:'address'}], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:97 },
      { name:'balanceOf', selector:'0x70a08231', inputs:[{name:'account',type:'address'}], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:99 },
      { name:'getStakeInfo', selector:'0x5e0d443f', inputs:[{name:'account',type:'address'}], outputs:[{name:'amount',type:'uint256'},{name:'lockEnd',type:'uint256'}], stateMutability:'view', confidence:95 },
    ] : [
      { name:'totalRaised', selector:'0x3f2a5540', inputs:[], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:99 },
      { name:'saleActive', selector:'0x68428a1b', inputs:[], outputs:[{name:'',type:'bool'}], stateMutability:'view', confidence:98 },
      { name:'getUserAllocation', selector:'0x2c7ba564', inputs:[{name:'user',type:'address'}], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:96 },
      { name:'tokenPrice', selector:'0x7ff9b596', inputs:[], outputs:[{name:'',type:'uint256'}], stateMutability:'view', confidence:99 },
    ],
    writeFunctions: isLP ? [
      { name:'stake', selector:'0xa694fc3a', inputs:[{name:'amount',type:'uint256'}], outputs:[], stateMutability:'nonpayable', confidence:99 },
      { name:'withdraw', selector:'0x2e1a7d4d', inputs:[{name:'amount',type:'uint256'}], outputs:[], stateMutability:'nonpayable', confidence:99 },
      { name:'claimReward', selector:'0xb88a802f', inputs:[], outputs:[], stateMutability:'nonpayable', confidence:98 },
      { name:'exit', selector:'0xe9fad8ee', inputs:[], outputs:[], stateMutability:'nonpayable', confidence:97 },
    ] : [
      { name:'participate', selector:'0x1c6e5a2e', inputs:[{name:'amount',type:'uint256'}], outputs:[], stateMutability:'payable', confidence:98 },
      { name:'claim', selector:'0x4e71d92d', inputs:[], outputs:[], stateMutability:'nonpayable', confidence:99 },
      { name:'refund', selector:'0x590e1ae3', inputs:[], outputs:[], stateMutability:'nonpayable', confidence:97 },
    ],
    events: isLP
      ? ['Staked(address,uint256)','Withdrawn(address,uint256)','RewardPaid(address,uint256)','RewardAdded(uint256)']
      : ['Participated(address,uint256)','Claimed(address,uint256)','Refunded(address,uint256)','SaleStarted(uint256)'],
    securityFlags: [
      ...(isLP ? [
        { severity:'info' as const, code:'PROXY', message:'Contract sử dụng Transparent Proxy pattern', recommendation:'Kiểm tra implementation address và admin key' },
        { severity:'low' as const, code:'CENTRALIZED', message:'Owner có thể pause contract', recommendation:'Xem xét timelocked admin hoặc multi-sig' },
      ] : []),
      { severity:'info' as const, code:'VERIFIED', message:'Source code đã được verify trên block explorer', recommendation:'Đọc source code để hiểu logic contract' },
      { severity:'medium' as const, code:'APPROVE', message:'Yêu cầu approve trước khi tương tác', recommendation:'Chỉ approve số lượng cần thiết, tránh unlimited approve' },
    ],
    detectionTime: 1200 + Math.random() * 800,
  };
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.5 — Reward Accrual Calculation (per-second)
   ═══════════════════════════════════════════════════════════ */

export function getRewardPerSecond(stakedAmount: number, apy: number, tokenPrice: number): number {
  const annualRate = apy / 100;
  const annualTokenRewards = (stakedAmount / tokenPrice) * annualRate;
  return annualTokenRewards / (365 * 24 * 3600);
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.6 — Reward Claim Receipt + Vesting Schedule
   ═══════════════════════════════════════════════════════════ */

export interface RewardVestingEntry {
  id: string;
  label: string;
  percent: number;
  amount: number;
  token: string;
  unlockDate: string;
  status: 'locked' | 'unlocking' | 'claimable' | 'claimed';
  claimedAt?: string;
  txHash?: string;
}

export interface RewardClaimReceipt {
  id: string;
  positionId: string;
  poolId: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  rewardToken: string;
  rewardTokenPrice: number;
  totalEarned: number;
  totalClaimed: number;
  totalPending: number;
  totalVested: number;
  vestingSchedule: RewardVestingEntry[];
  claimHistory: ClaimHistoryEntry[];
  poolAPY: number;
  stakedAmount: number;
  stakeToken: string;
  chain: string;
  contractAddress: string;
  nextUnlockDate: string;
  nextUnlockAmount: number;
}

export interface ClaimHistoryEntry {
  id: string;
  amount: number;
  token: string;
  usdValue: number;
  claimedAt: string;
  txHash: string;
  vestingEntryId: string;
  status: 'confirmed' | 'pending';
  gasUsed: string;
}

export function getClaimReceiptForPosition(positionId: string): RewardClaimReceipt {
  return MOCK_CLAIM_RECEIPTS.find(r => r.positionId === positionId) || MOCK_CLAIM_RECEIPTS[0];
}

export const MOCK_CLAIM_RECEIPTS: RewardClaimReceipt[] = [
  {
    id: 'cr1', positionId: 'sp1', poolId: 'pool2',
    projectName: 'NexaAI Protocol', projectSymbol: 'NEXA', projectLogoColor: '#6366F1',
    rewardToken: 'NEXA', rewardTokenPrice: 0.05,
    totalEarned: 3850, totalClaimed: 2340, totalPending: 1510, totalVested: 3080,
    stakedAmount: 2500, stakeToken: 'BNB', poolAPY: 48.0,
    chain: 'BSC', contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    nextUnlockDate: '14/03/2026 10:00', nextUnlockAmount: 462.5,
    vestingSchedule: [
      { id: 'v1', label: 'TGE Instant', percent: 20, amount: 770, token: 'NEXA', unlockDate: '06/03/2026', status: 'claimed', claimedAt: '06/03/2026 10:15', txHash: '0xa1b2...c3d4' },
      { id: 'v2', label: 'Week 1', percent: 20, amount: 770, token: 'NEXA', unlockDate: '06/03/2026', status: 'claimed', claimedAt: '06/03/2026 18:00', txHash: '0xe5f6...7890' },
      { id: 'v3', label: 'Week 2', percent: 20, amount: 770, token: 'NEXA', unlockDate: '07/03/2026', status: 'claimed', claimedAt: '07/03/2026 11:30', txHash: '0x1234...5678' },
      { id: 'v4', label: 'Week 3', percent: 12, amount: 462.5, token: 'NEXA', unlockDate: '14/03/2026', status: 'unlocking' },
      { id: 'v5', label: 'Week 4', percent: 12, amount: 462.5, token: 'NEXA', unlockDate: '21/03/2026', status: 'locked' },
      { id: 'v6', label: 'Week 5 (Final)', percent: 16, amount: 615, token: 'NEXA', unlockDate: '28/03/2026', status: 'locked' },
    ],
    claimHistory: [
      { id: 'ch1', amount: 770, token: 'NEXA', usdValue: 38.5, claimedAt: '06/03/2026 10:15', txHash: '0xa1b2...c3d4', vestingEntryId: 'v1', status: 'confirmed', gasUsed: '52,000' },
      { id: 'ch2', amount: 770, token: 'NEXA', usdValue: 38.5, claimedAt: '06/03/2026 18:00', txHash: '0xe5f6...7890', vestingEntryId: 'v2', status: 'confirmed', gasUsed: '48,000' },
      { id: 'ch3', amount: 800, token: 'NEXA', usdValue: 40.0, claimedAt: '07/03/2026 11:30', txHash: '0x1234...5678', vestingEntryId: 'v3', status: 'confirmed', gasUsed: '51,000' },
    ],
  },
  {
    id: 'cr2', positionId: 'sp2', poolId: 'pool3',
    projectName: 'OmniDEX', projectSymbol: 'OMX', projectLogoColor: '#06B6D4',
    rewardToken: 'OMX', rewardTokenPrice: 0.352,
    totalEarned: 3230, totalClaimed: 2340, totalPending: 890, totalVested: 2900,
    stakedAmount: 5000, stakeToken: 'USDT', poolAPY: 35.0,
    chain: 'Multi', contractAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
    nextUnlockDate: '10/03/2026 10:00', nextUnlockAmount: 320,
    vestingSchedule: [
      { id: 'v1', label: 'Instant', percent: 30, amount: 969, token: 'OMX', unlockDate: '15/01/2026', status: 'claimed', claimedAt: '15/01/2026 10:20', txHash: '0xaa11...bb22' },
      { id: 'v2', label: 'Month 1', percent: 20, amount: 646, token: 'OMX', unlockDate: '15/02/2026', status: 'claimed', claimedAt: '15/02/2026 12:00', txHash: '0xcc33...dd44' },
      { id: 'v3', label: 'Month 2', percent: 20, amount: 646, token: 'OMX', unlockDate: '15/03/2026', status: 'unlocking' },
      { id: 'v4', label: 'Month 3', percent: 15, amount: 484.5, token: 'OMX', unlockDate: '15/04/2026', status: 'locked' },
      { id: 'v5', label: 'Month 4 (Final)', percent: 15, amount: 484.5, token: 'OMX', unlockDate: '15/05/2026', status: 'locked' },
    ],
    claimHistory: [
      { id: 'ch1', amount: 969, token: 'OMX', usdValue: 341.1, claimedAt: '15/01/2026 10:20', txHash: '0xaa11...bb22', vestingEntryId: 'v1', status: 'confirmed', gasUsed: '44,000' },
      { id: 'ch2', amount: 646, token: 'OMX', usdValue: 227.4, claimedAt: '15/02/2026 12:00', txHash: '0xcc33...dd44', vestingEntryId: 'v2', status: 'confirmed', gasUsed: '46,000' },
      { id: 'ch3', amount: 725, token: 'OMX', usdValue: 255.2, claimedAt: '05/03/2026 14:30', txHash: '0xee55...ff66', vestingEntryId: 'v3', status: 'confirmed', gasUsed: '49,000' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   Phase 4.6 — Bridge Order Status Polling
   ═══════════════════════════════════════════════════════════ */

export type BridgePollingStatus = 'initiated' | 'approved' | 'bridging' | 'confirming' | 'swapping' | 'finalizing' | 'completed' | 'failed';

export interface BridgePollingStep {
  status: BridgePollingStatus;
  label: string;
  detail: string;
  timestamp?: string;
  txHash?: string;
  confirmations?: { current: number; required: number };
}

export interface BridgeOrderDetail {
  id: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  sourceChain: string;
  targetChain: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  expectedOutput: number;
  actualOutput?: number;
  routeProvider: string;
  routeHops: number;
  slippage: number;
  gasCost: string;
  totalFee: string;
  priceImpact: number;
  status: BridgePollingStatus;
  steps: BridgePollingStep[];
  createdAt: string;
  estimatedDuration: number;
  sourceTxHash: string;
  targetTxHash?: string;
  failReason?: string;
  retryCount: number;
}

export function createBridgeOrderDetail(tx: BridgeTxRecord, scenario: 'success' | 'slow' | 'fail' = 'success'): BridgeOrderDetail {
  const now = new Date();
  const ts = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  const baseSteps: BridgePollingStep[] = [
    { status: 'initiated', label: 'Giao dịch được tạo', detail: 'Đơn bridge đã gửi thành công', timestamp: ts(now) },
    { status: 'approved', label: 'Token approved', detail: `${tx.inputToken} đã được approve cho bridge contract` },
    { status: 'bridging', label: 'Đang bridge cross-chain', detail: `${tx.sourceChain} → ${tx.targetChain}`, confirmations: { current: 0, required: 12 } },
    { status: 'confirming', label: 'Chờ xác nhận', detail: 'Chờ block confirmations trên chuỗi đích', confirmations: { current: 0, required: 6 } },
    { status: 'swapping', label: 'Swap on-chain', detail: `Swap sang ${tx.outputToken} trên ${tx.targetChain}` },
    { status: 'finalizing', label: 'Hoàn tất', detail: 'Kiểm tra số dư và ghi nhận giao dịch' },
    { status: 'completed', label: 'Hoàn tất', detail: `Đã nhận ${tx.outputAmount.toLocaleString()} ${tx.outputToken}` },
  ];
  if (scenario === 'fail') {
    baseSteps.push({ status: 'failed', label: 'Thất bại', detail: tx.failReason || 'Bridge timeout — vui lòng thử lại' });
  }
  return {
    id: tx.id, projectName: tx.projectName, projectSymbol: tx.projectSymbol, projectLogoColor: tx.projectLogoColor,
    sourceChain: tx.sourceChain, targetChain: tx.targetChain, inputToken: tx.inputToken, outputToken: tx.outputToken,
    inputAmount: tx.inputAmount, expectedOutput: tx.outputAmount, routeProvider: tx.routeProvider, routeHops: tx.routeHops,
    slippage: tx.slippage, gasCost: tx.gasCost, totalFee: tx.totalFee, priceImpact: tx.priceImpact,
    status: 'initiated', steps: baseSteps, createdAt: tx.createdAt || ts(now),
    estimatedDuration: scenario === 'slow' ? 45 : 20, sourceTxHash: tx.txHash, retryCount: 0,
    failReason: scenario === 'fail' ? (tx.failReason || 'Bridge timeout') : undefined,
  };
}

export function getBridgePollingSequence(scenario: 'success' | 'slow' | 'fail'): [BridgePollingStatus, number][] {
  if (scenario === 'fail') return [['initiated',0],['approved',1500],['bridging',2000],['confirming',3000],['failed',2500]];
  if (scenario === 'slow') return [['initiated',0],['approved',2000],['bridging',3500],['confirming',4000],['swapping',3000],['finalizing',2500],['completed',1500]];
  return [['initiated',0],['approved',1200],['bridging',1800],['confirming',2200],['swapping',1500],['finalizing',1000],['completed',800]];
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.7 — Vesting Notification System
   ═══════════════════════════════════════════════════════════ */

export type VestingNotifType = 'unlock_soon' | 'unlocked' | 'claimable' | 'claimed' | 'vesting_complete' | 'reward_milestone';

export interface VestingNotification {
  id: string;
  type: VestingNotifType;
  title: string;
  message: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  rewardToken: string;
  amount?: number;
  vestingEntryId?: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionPath?: string;
}

export interface VestingNotifPreferences {
  unlockReminder: boolean;
  claimReady: boolean;
  milestones: boolean;
  vestingComplete: boolean;
  reminderLeadMinutes: number;
}

const VESTING_NOTIF_KEY = 'vit_vesting_notifs';
const VESTING_NOTIF_PREFS_KEY = 'vit_vesting_notif_prefs';

export const DEFAULT_VESTING_NOTIF_PREFS: VestingNotifPreferences = {
  unlockReminder: true,
  claimReady: true,
  milestones: true,
  vestingComplete: true,
  reminderLeadMinutes: 30,
};

export function loadVestingNotifPrefs(): VestingNotifPreferences {
  try {
    const raw = localStorage.getItem(VESTING_NOTIF_PREFS_KEY);
    return raw ? { ...DEFAULT_VESTING_NOTIF_PREFS, ...JSON.parse(raw) } : DEFAULT_VESTING_NOTIF_PREFS;
  } catch { return DEFAULT_VESTING_NOTIF_PREFS; }
}

export function saveVestingNotifPrefs(prefs: VestingNotifPreferences): void {
  try { localStorage.setItem(VESTING_NOTIF_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

export function loadVestingNotifs(): VestingNotification[] {
  try {
    const raw = localStorage.getItem(VESTING_NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveVestingNotifs(notifs: VestingNotification[]): void {
  try {
    const limited = notifs.slice(0, 50);
    localStorage.setItem(VESTING_NOTIF_KEY, JSON.stringify(limited));
  } catch {}
}

export function markVestingNotifRead(id: string): VestingNotification[] {
  const notifs = loadVestingNotifs();
  const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
  saveVestingNotifs(updated);
  return updated;
}

export function markAllVestingNotifsRead(): VestingNotification[] {
  const notifs = loadVestingNotifs();
  const updated = notifs.map(n => ({ ...n, read: true }));
  saveVestingNotifs(updated);
  return updated;
}

const tsNow = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export function generateVestingNotifSequence(receipt: RewardClaimReceipt): { notif: VestingNotification; delayMs: number }[] {
  const seq: { notif: VestingNotification; delayMs: number }[] = [];
  const base = { projectName: receipt.projectName, projectSymbol: receipt.projectSymbol, projectLogoColor: receipt.projectLogoColor, rewardToken: receipt.rewardToken };

  const unlocking = receipt.vestingSchedule.find(v => v.status === 'unlocking');
  if (unlocking) {
    seq.push({
      delayMs: 3000,
      notif: { ...base, id: `vn_${Date.now()}_1`, type: 'unlock_soon', title: 'Sắp mở khóa',
        message: `${unlocking.amount.toLocaleString()} ${receipt.rewardToken} (${unlocking.label}) sẽ được mở khóa.`,
        amount: unlocking.amount, vestingEntryId: unlocking.id, timestamp: tsNow(), read: false,
        actionLabel: 'Xem chi tiết', actionPath: 'vesting',
      },
    });
    seq.push({
      delayMs: 8000,
      notif: { ...base, id: `vn_${Date.now()}_2`, type: 'claimable', title: 'Có thể nhận thưởng!',
        message: `${unlocking.amount.toLocaleString()} ${receipt.rewardToken} đã mở khóa và sẵn sàng để nhận.`,
        amount: unlocking.amount, vestingEntryId: unlocking.id, timestamp: tsNow(), read: false,
        actionLabel: 'Nhận ngay', actionPath: 'claim',
      },
    });
  }

  const milestoneAmount = Math.round(receipt.totalEarned * 0.75);
  if (receipt.totalClaimed < milestoneAmount) {
    seq.push({
      delayMs: 14000,
      notif: { ...base, id: `vn_${Date.now()}_3`, type: 'reward_milestone', title: 'Milestone đạt được!',
        message: `Bạn đã đạt 75% tổng phần thưởng (${milestoneAmount.toLocaleString()} ${receipt.rewardToken}).`,
        amount: milestoneAmount, timestamp: tsNow(), read: false,
      },
    });
  }

  const nextLocked = receipt.vestingSchedule.find(v => v.status === 'locked');
  if (nextLocked) {
    seq.push({
      delayMs: 20000,
      notif: { ...base, id: `vn_${Date.now()}_4`, type: 'unlock_soon', title: 'Đợt tiếp theo',
        message: `${nextLocked.amount.toLocaleString()} ${receipt.rewardToken} (${nextLocked.label}) sẽ mở khóa vào ${nextLocked.unlockDate}.`,
        amount: nextLocked.amount, vestingEntryId: nextLocked.id, timestamp: tsNow(), read: false,
      },
    });
  }

  return seq;
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.7 — Bridge WebSocket Event Log
   ═══════════════════════════════════════════════════════════ */

export type WsEventLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'system';

export interface BridgeWsEvent {
  id: string;
  timestamp: string;
  level: WsEventLevel;
  source: string;
  message: string;
  data?: Record<string, string | number>;
  txHash?: string;
}

export type WsConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function generateBridgeEventLog(order: BridgeOrderDetail, scenario: 'success' | 'slow' | 'fail'): { event: BridgeWsEvent; delayMs: number }[] {
  const events: { event: BridgeWsEvent; delayMs: number }[] = [];
  let seq = 0;
  const ts = () => {
    const d = new Date(Date.now() + seq * 100);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
  };
  const evt = (delay: number, level: WsEventLevel, source: string, message: string, data?: Record<string, string | number>, txHash?: string): void => {
    seq++;
    events.push({ delayMs: delay, event: { id: `ws_${seq}`, timestamp: ts(), level, source, message, data, txHash } });
  };

  evt(200, 'system', 'ws', 'WebSocket connecting to wss://bridge-relay.vitrading.io/v2/stream...', undefined);
  evt(800, 'system', 'ws', 'Connection established. Protocol: bridge-v2. Compression: permessage-deflate', undefined);
  evt(1000, 'info', 'auth', `Authenticated. Session: ${order.id.slice(0, 8)}...`, { channel: 'bridge-orders' });
  evt(1400, 'debug', 'sub', `Subscribed to order:${order.id}`, { orderId: order.id });
  evt(1800, 'info', 'order', `Order created. ${order.inputAmount} ${order.inputToken} → ${order.outputToken}`, { source: order.sourceChain, target: order.targetChain }, order.sourceTxHash);
  evt(2800, 'info', 'erc20', `Approval request sent for ${order.inputToken}`, { spender: 'BridgeRouter', amount: order.inputAmount });
  evt(3400, 'success', 'erc20', `Token approved. Allowance: ${order.inputAmount} ${order.inputToken}`, undefined, '0x9a8b...1234');
  evt(4200, 'info', 'bridge', `Initiating cross-chain transfer: ${order.sourceChain} → ${order.targetChain}`, { provider: order.routeProvider, hops: order.routeHops });
  evt(5000, 'debug', 'bridge', 'Source tx broadcast. Waiting for confirmations...', undefined, order.sourceTxHash);

  for (let i = 1; i <= 6; i++) {
    evt(5000 + i * 400, 'debug', 'confirm', `Block confirmation ${i}/12 on ${order.sourceChain}`, { block: 18234000 + i, gasUsed: 52000 + Math.floor(Math.random() * 5000) });
  }
  evt(7600, 'info', 'bridge', '6/12 confirmations reached. Bridge relay activated.', undefined);
  for (let i = 7; i <= 12; i++) {
    evt(7600 + (i - 6) * 300, 'debug', 'confirm', `Block confirmation ${i}/12 on ${order.sourceChain}`, { block: 18234006 + (i - 6) });
  }
  evt(9600, 'success', 'bridge', 'All 12 confirmations received. Cross-chain message sent.', undefined);
  evt(10200, 'info', 'dest', `Waiting for relay on ${order.targetChain}...`, undefined);
  for (let i = 1; i <= 6; i++) {
    evt(10200 + i * 350, 'debug', 'confirm', `Destination confirmation ${i}/6 on ${order.targetChain}`, { block: 42100000 + i });
  }
  evt(12500, 'success', 'dest', 'Destination confirmations complete.', undefined, '0xdef0...5678');

  if (scenario === 'fail') {
    evt(13500, 'warning', 'swap', 'Swap execution delayed. Retrying...', { attempt: 1 });
    evt(15000, 'warning', 'swap', 'Swap retry failed. Insufficient liquidity on target DEX.', { attempt: 2, slippage: order.slippage });
    evt(16500, 'error', 'order', `Order failed: ${order.failReason || 'Bridge timeout'}. Funds safe on source chain.`, undefined);
    evt(17000, 'system', 'ws', 'Order stream ended. Channel: closed.', undefined);
    return events;
  }

  evt(13200, 'info', 'swap', `Executing swap on ${order.targetChain} DEX...`, { dex: order.routeProvider, pair: `${order.inputToken}/${order.outputToken}` });
  evt(14000, 'debug', 'swap', `Price quote: 1 ${order.inputToken} = ${(order.expectedOutput / order.inputAmount).toFixed(4)} ${order.outputToken}`, { impact: order.priceImpact });

  if (scenario === 'slow') {
    evt(14800, 'warning', 'swap', 'Swap taking longer than expected. MEV protection active.', { protection: 'flashbots' });
    evt(16000, 'info', 'swap', 'Swap routed through backup path. Executing...', undefined);
    evt(17500, 'success', 'swap', `Swap complete. Received: ${order.expectedOutput.toLocaleString()} ${order.outputToken}`, { actualSlippage: 0.3 }, '0xabc0...9999');
  } else {
    evt(15200, 'success', 'swap', `Swap complete. Received: ${order.expectedOutput.toLocaleString()} ${order.outputToken}`, { actualSlippage: 0.1 }, '0xabc0...9999');
  }

  const finalDelay = scenario === 'slow' ? 18500 : 16000;
  evt(finalDelay, 'info', 'settle', 'Verifying final balance...', undefined);
  evt(finalDelay + 800, 'success', 'settle', `Balance verified: +${order.expectedOutput.toLocaleString()} ${order.outputToken}`, { wallet: '0x...user' });
  evt(finalDelay + 1200, 'success', 'order', `Order ${order.id} completed successfully.`, { duration: `${order.estimatedDuration}s`, totalFee: order.totalFee });
  evt(finalDelay + 1600, 'info', 'notif', 'Push notification sent: "Bridge completed"', undefined);
  evt(finalDelay + 2000, 'system', 'ws', 'Order stream ended. Channel: closed gracefully.', undefined);

  return events;
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.8 — Multi-Position Batch Claim
   ═══════════════════════════════════════════════════════════ */

export interface BatchClaimPosition {
  positionId: string;
  poolId: string;
  projectName: string;
  projectSymbol: string;
  projectLogoColor: string;
  rewardToken: string;
  rewardTokenPrice: number;
  claimableAmount: number;
  claimableUSD: number;
  vestingEntries: RewardVestingEntry[];
  chain: string;
  contractAddress: string;
  stakedAmount: number;
  stakeToken: string;
  apy: number;
}

export interface BatchClaimSummary {
  positions: BatchClaimPosition[];
  totalClaimable: Record<string, number>;
  totalClaimableUSD: number;
  estimatedGasIndividual: string;
  estimatedGasBatch: string;
  gasSavingsPercent: number;
  gasSavingsUSD: number;
  chains: string[];
}

export function getAllClaimablePositions(): BatchClaimPosition[] {
  return MOCK_CLAIM_RECEIPTS.filter(r => {
    const claimable = r.vestingSchedule.filter(v => v.status === 'claimable' || v.status === 'unlocking');
    return claimable.length > 0;
  }).map(r => {
    const entries = r.vestingSchedule.filter(v => v.status === 'claimable' || v.status === 'unlocking');
    const amount = entries.reduce((s, e) => s + e.amount, 0);
    return {
      positionId: r.positionId,
      poolId: r.poolId,
      projectName: r.projectName,
      projectSymbol: r.projectSymbol,
      projectLogoColor: r.projectLogoColor,
      rewardToken: r.rewardToken,
      rewardTokenPrice: r.rewardTokenPrice,
      claimableAmount: amount,
      claimableUSD: Math.round(amount * r.rewardTokenPrice * 100) / 100,
      vestingEntries: entries,
      chain: r.chain,
      contractAddress: r.contractAddress,
      stakedAmount: r.stakedAmount,
      stakeToken: r.stakeToken,
      apy: r.poolAPY,
    };
  });
}

export function calculateBatchClaimSummary(selected: BatchClaimPosition[]): BatchClaimSummary {
  const totalByToken: Record<string, number> = {};
  let totalUSD = 0;
  const chainsSet = new Set<string>();

  selected.forEach(p => {
    totalByToken[p.rewardToken] = (totalByToken[p.rewardToken] || 0) + p.claimableAmount;
    totalUSD += p.claimableUSD;
    chainsSet.add(p.chain);
  });

  const individualGas = selected.length * 0.18;
  const batchGas = 0.18 + (selected.length - 1) * 0.06;
  const savings = individualGas - batchGas;

  return {
    positions: selected,
    totalClaimable: totalByToken,
    totalClaimableUSD: Math.round(totalUSD * 100) / 100,
    estimatedGasIndividual: `$${individualGas.toFixed(2)}`,
    estimatedGasBatch: `$${batchGas.toFixed(2)}`,
    gasSavingsPercent: Math.round((savings / individualGas) * 100),
    gasSavingsUSD: Math.round(savings * 100) / 100,
    chains: Array.from(chainsSet),
  };
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.8 — Bridge Route Comparison
   ═══════════════════════════════════════════════════════════ */

export interface BridgeRouteOption {
  id: string;
  provider: string;
  providerIcon: string;
  providerColor: string;
  sourceChain: string;
  targetChain: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  gasCost: number;
  bridgeFee: number;
  totalFee: number;
  totalFeeUSD: string;
  estimatedTime: string;
  estimatedSeconds: number;
  hops: number;
  path: SwapHop[];
  securityScore: number;
  liquidityDepth: string;
  slippage: number;
  recommended: boolean;
  tags: string[];
  warnings: string[];
}

export interface RouteComparisonResult {
  id: string;
  timestamp: string;
  sourceChain: string;
  targetChain: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  routes: BridgeRouteOption[];
  bestOutput: string;
  bestFee: string;
  bestSpeed: string;
  bestSecurity: string;
}

export function generateRouteComparison(
  sourceChain: string, targetChain: string,
  inputToken: string, outputToken: string, inputAmount: number,
): RouteComparisonResult {
  const routes: BridgeRouteOption[] = [
    {
      id: 'rc_1', provider: 'VitBridge Aggregator', providerIcon: 'VB', providerColor: '#6366F1',
      sourceChain, targetChain, inputToken, outputToken, inputAmount,
      outputAmount: Math.round(inputAmount * 8.29 * 100) / 100,
      priceImpact: 0.12, gasCost: 2.85, bridgeFee: 0.65, totalFee: 3.50,
      totalFeeUSD: '$3.50', estimatedTime: '~5 min', estimatedSeconds: 300,
      hops: 3, securityScore: 95, liquidityDepth: '$12.4M', slippage: 0.3,
      recommended: true, tags: ['Best output', 'Audited'], warnings: [],
      path: [
        { fromToken: inputToken, toToken: 'ETH', dex: 'Uniswap V3', chain: sourceChain, rate: 0.000385 },
        { fromToken: 'ETH', toToken: 'USDT', dex: 'Bridge', chain: targetChain, rate: 2597.0 },
        { fromToken: 'USDT', toToken: outputToken, dex: 'QuickSwap', chain: targetChain, rate: 8.33 },
      ],
    },
    {
      id: 'rc_2', provider: 'Direct Bridge', providerIcon: 'DB', providerColor: '#10B981',
      sourceChain, targetChain, inputToken, outputToken, inputAmount,
      outputAmount: Math.round(inputAmount * 8.24 * 100) / 100,
      priceImpact: 0.18, gasCost: 0.35, bridgeFee: 0.85, totalFee: 1.20,
      totalFeeUSD: '$1.20', estimatedTime: '~3 min', estimatedSeconds: 180,
      hops: 2, securityScore: 88, liquidityDepth: '$8.1M', slippage: 0.5,
      recommended: false, tags: ['Lowest fee', 'Fastest'], warnings: [],
      path: [
        { fromToken: inputToken, toToken: inputToken, dex: 'Bridge', chain: targetChain, rate: 1.0 },
        { fromToken: inputToken, toToken: outputToken, dex: 'QuickSwap', chain: targetChain, rate: 8.28 },
      ],
    },
    {
      id: 'rc_3', provider: 'Multi-hop Route', providerIcon: 'MH', providerColor: '#F59E0B',
      sourceChain, targetChain, inputToken, outputToken, inputAmount,
      outputAmount: Math.round(inputAmount * 8.18 * 100) / 100,
      priceImpact: 0.35, gasCost: 3.20, bridgeFee: 1.60, totalFee: 4.80,
      totalFeeUSD: '$4.80', estimatedTime: '~7 min', estimatedSeconds: 420,
      hops: 3, securityScore: 82, liquidityDepth: '$5.6M', slippage: 0.8,
      recommended: false, tags: [], warnings: ['Higher price impact'],
      path: [
        { fromToken: inputToken, toToken: 'MATIC', dex: 'Uniswap V3', chain: sourceChain, rate: 1.82 },
        { fromToken: 'MATIC', toToken: 'MATIC', dex: 'Bridge', chain: targetChain, rate: 1.0 },
        { fromToken: 'MATIC', toToken: outputToken, dex: 'SushiSwap', chain: targetChain, rate: 4.55 },
      ],
    },
    {
      id: 'rc_4', provider: 'LayerZero', providerIcon: 'LZ', providerColor: '#3B82F6',
      sourceChain, targetChain, inputToken, outputToken, inputAmount,
      outputAmount: Math.round(inputAmount * 8.26 * 100) / 100,
      priceImpact: 0.15, gasCost: 1.80, bridgeFee: 1.20, totalFee: 3.00,
      totalFeeUSD: '$3.00', estimatedTime: '~4 min', estimatedSeconds: 240,
      hops: 2, securityScore: 92, liquidityDepth: '$18.2M', slippage: 0.4,
      recommended: false, tags: ['High security', 'Deep liquidity'], warnings: [],
      path: [
        { fromToken: inputToken, toToken: inputToken, dex: 'LayerZero OFT', chain: targetChain, rate: 0.998 },
        { fromToken: inputToken, toToken: outputToken, dex: 'Balancer', chain: targetChain, rate: 8.28 },
      ],
    },
    {
      id: 'rc_5', provider: 'Wormhole', providerIcon: 'WH', providerColor: '#8B5CF6',
      sourceChain, targetChain, inputToken, outputToken, inputAmount,
      outputAmount: Math.round(inputAmount * 8.21 * 100) / 100,
      priceImpact: 0.22, gasCost: 2.10, bridgeFee: 0.90, totalFee: 3.00,
      totalFeeUSD: '$3.00', estimatedTime: '~6 min', estimatedSeconds: 360,
      hops: 2, securityScore: 90, liquidityDepth: '$15.7M', slippage: 0.5,
      recommended: false, tags: ['Trusted bridge'], warnings: [],
      path: [
        { fromToken: inputToken, toToken: inputToken, dex: 'Wormhole', chain: targetChain, rate: 0.997 },
        { fromToken: inputToken, toToken: outputToken, dex: 'Curve', chain: targetChain, rate: 8.24 },
      ],
    },
  ];

  const bestOutput = routes.reduce((b, r) => r.outputAmount > b.outputAmount ? r : b, routes[0]);
  const bestFee = routes.reduce((b, r) => r.totalFee < b.totalFee ? r : b, routes[0]);
  const bestSpeed = routes.reduce((b, r) => r.estimatedSeconds < b.estimatedSeconds ? r : b, routes[0]);
  const bestSecurity = routes.reduce((b, r) => r.securityScore > b.securityScore ? r : b, routes[0]);

  return {
    id: `comp_${Date.now()}`, timestamp: new Date().toLocaleString(),
    sourceChain, targetChain, inputToken, outputToken, inputAmount,
    routes,
    bestOutput: bestOutput.id, bestFee: bestFee.id,
    bestSpeed: bestSpeed.id, bestSecurity: bestSecurity.id,
  };
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.9 — Notification Settings, Event Log Export,
   ABI Diff, Multi-wallet Address Book
   ═══════════════════════════════════════════════════════════ */

/* ─── Notification Sound Settings ─── */

export interface NotifSoundCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  soundType: 'default' | 'chime' | 'bell' | 'ping' | 'none';
  volume: number;
}

export const NOTIF_SOUND_CATEGORIES: NotifSoundCategory[] = [
  { id: 'price_alert', label: 'Cảnh báo giá', description: 'Âm thanh khi giá đến ngưỡng đã đặt', icon: '📊', color: '#3B82F6', enabled: true, soundType: 'chime', volume: 80 },
  { id: 'order_fill', label: 'Lệnh khớp', description: 'Âm thanh khi lệnh được thực thi', icon: '✅', color: '#10B981', enabled: true, soundType: 'bell', volume: 90 },
  { id: 'vesting_unlock', label: 'Mở khóa vesting', description: 'Âm thanh khi token được mở khóa', icon: '🔓', color: '#8B5CF6', enabled: true, soundType: 'default', volume: 70 },
  { id: 'bridge_complete', label: 'Bridge hoàn thành', description: 'Âm thanh khi bridge tx xong', icon: '🌉', color: '#F59E0B', enabled: true, soundType: 'ping', volume: 75 },
  { id: 'staking_reward', label: 'Phần thưởng staking', description: 'Âm thanh khi nhận reward từ pool', icon: '🎁', color: '#EC4899', enabled: false, soundType: 'chime', volume: 60 },
  { id: 'security_alert', label: 'Cảnh báo bảo mật', description: 'Âm thanh cho thông báo bảo mật', icon: '🛡️', color: '#EF4444', enabled: true, soundType: 'bell', volume: 100 },
  { id: 'p2p_message', label: 'Tin nhắn P2P', description: 'Âm thanh khi có tin nhắn mới trong order room', icon: '💬', color: '#06B6D4', enabled: true, soundType: 'default', volume: 70 },
  { id: 'system', label: 'Hệ thống', description: 'Thông báo chung và cập nhật hệ thống', icon: '⚙️', color: '#8B95B3', enabled: false, soundType: 'none', volume: 50 },
];

export const SOUND_TYPES = [
  { value: 'default', label: 'Mặc định' },
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Chuông' },
  { value: 'ping', label: 'Ping' },
  { value: 'none', label: 'Không âm' },
] as const;

export interface NotifSoundSettings {
  masterEnabled: boolean;
  masterVolume: number;
  vibrate: boolean;
  doNotDisturb: boolean;
  dndStartHour: number;
  dndEndHour: number;
  categories: NotifSoundCategory[];
}

export const DEFAULT_NOTIF_SOUND_SETTINGS: NotifSoundSettings = {
  masterEnabled: true,
  masterVolume: 80,
  vibrate: true,
  doNotDisturb: false,
  dndStartHour: 22,
  dndEndHour: 7,
  categories: NOTIF_SOUND_CATEGORIES,
};

export function loadNotifSoundSettings(): NotifSoundSettings {
  const stored = localStorage.getItem('launchpad_notif_sound_settings');
  return stored ? JSON.parse(stored) : { ...DEFAULT_NOTIF_SOUND_SETTINGS, categories: [...NOTIF_SOUND_CATEGORIES] };
}

export function saveNotifSoundSettings(settings: NotifSoundSettings): void {
  localStorage.setItem('launchpad_notif_sound_settings', JSON.stringify(settings));
}

/* ─── Event Log Export ─── */

export type EventLogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'tx';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  level: EventLogLevel;
  source: string;
  message: string;
  details?: string;
  txHash?: string;
  chain?: string;
  contractAddress?: string;
  gasUsed?: string;
  blockNumber?: number;
  tags: string[];
}

export function generateMockEventLog(): EventLogEntry[] {
  const now = Date.now();
  return [
    { id: 'ev01', timestamp: new Date(now - 120000).toISOString(), level: 'info', source: 'Bridge', message: 'Bridge transaction initiated', details: 'USDT → GCE via VitBridge on Polygon', txHash: '0x7a3f...8d2c', chain: 'Polygon', gasUsed: '124,500', blockNumber: 58234102, tags: ['bridge', 'initiate'] },
    { id: 'ev02', timestamp: new Date(now - 115000).toISOString(), level: 'success', source: 'Bridge', message: 'Token approval confirmed', details: 'Approved 1,000 USDT for VitBridge router', txHash: '0x9b1e...f4a8', chain: 'Ethereum', gasUsed: '46,200', blockNumber: 19284531, tags: ['approval', 'bridge'] },
    { id: 'ev03', timestamp: new Date(now - 100000).toISOString(), level: 'tx', source: 'Contract', message: 'stake() executed on NexaAI Pool', details: 'Staked 500 NEXA tokens for 90-day lock', txHash: '0x2c8d...1a7f', chain: 'BSC', contractAddress: '0x1234...abcd', gasUsed: '89,340', blockNumber: 38291042, tags: ['staking', 'contract'] },
    { id: 'ev04', timestamp: new Date(now - 80000).toISOString(), level: 'warning', source: 'ABI Scanner', message: 'Proxy upgrade detected', details: 'Contract 0x1234...abcd has been upgraded. New implementation: 0x5678...efgh', chain: 'BSC', contractAddress: '0x1234...abcd', blockNumber: 38291100, tags: ['proxy', 'upgrade', 'security'] },
    { id: 'ev05', timestamp: new Date(now - 75000).toISOString(), level: 'info', source: 'Staking', message: 'Reward accrual checkpoint', details: 'Earned 12.5 NEXA rewards since last checkpoint', chain: 'BSC', tags: ['staking', 'reward'] },
    { id: 'ev06', timestamp: new Date(now - 60000).toISOString(), level: 'success', source: 'Claim', message: 'Batch claim executed successfully', details: '3 positions claimed: 45.2 NEXA + 120 GCE + 8.5 SOLAR', txHash: '0xf3e1...6b9d', chain: 'BSC', gasUsed: '245,800', blockNumber: 38291200, tags: ['claim', 'batch'] },
    { id: 'ev07', timestamp: new Date(now - 45000).toISOString(), level: 'error', source: 'Bridge', message: 'Bridge transaction failed', details: 'Insufficient liquidity on target chain. Refund initiated.', txHash: '0xd4a2...3c5e', chain: 'Polygon', gasUsed: '78,100', blockNumber: 58234300, tags: ['bridge', 'error', 'refund'] },
    { id: 'ev08', timestamp: new Date(now - 30000).toISOString(), level: 'debug', source: 'WebSocket', message: 'Connection state: reconnecting', details: 'WS endpoint wss://events.launchpad.io — retry attempt 2/5', tags: ['ws', 'connection'] },
    { id: 'ev09', timestamp: new Date(now - 20000).toISOString(), level: 'success', source: 'WebSocket', message: 'Connection restored', details: 'WS reconnected successfully after 8.2s downtime', tags: ['ws', 'connection'] },
    { id: 'ev10', timestamp: new Date(now - 15000).toISOString(), level: 'tx', source: 'Contract', message: 'claimRewards() called', details: 'Claimed 25.8 NEXA from Launchpool #1', txHash: '0xa1b2...c3d4', chain: 'BSC', contractAddress: '0x1234...abcd', gasUsed: '67,200', blockNumber: 38291350, tags: ['claim', 'contract'] },
    { id: 'ev11', timestamp: new Date(now - 10000).toISOString(), level: 'info', source: 'Price', message: 'Price alert triggered: NEXA > $0.12', details: 'NEXA price reached $0.124 (+8.7% in 1h)', tags: ['price', 'alert'] },
    { id: 'ev12', timestamp: new Date(now - 5000).toISOString(), level: 'warning', source: 'Security', message: 'New login detected from unfamiliar device', details: 'IP: 103.xxx.xxx.xx — Chrome/MacOS. Verify if this was you.', tags: ['security', 'login'] },
  ];
}

export function formatEventLogForClipboard(entries: EventLogEntry[]): string {
  const header = `=== Launchpad Event Log ===\nExported: ${new Date().toLocaleString()}\nEntries: ${entries.length}\n${'='.repeat(40)}\n\n`;
  const body = entries.map(e => {
    const lines = [
      `[${e.timestamp}] [${e.level.toUpperCase()}] ${e.source}`,
      `  ${e.message}`,
    ];
    if (e.details) lines.push(`  Details: ${e.details}`);
    if (e.txHash) lines.push(`  TxHash: ${e.txHash}`);
    if (e.chain) lines.push(`  Chain: ${e.chain}`);
    if (e.contractAddress) lines.push(`  Contract: ${e.contractAddress}`);
    if (e.gasUsed) lines.push(`  Gas: ${e.gasUsed}`);
    if (e.blockNumber) lines.push(`  Block: ${e.blockNumber}`);
    if (e.tags.length) lines.push(`  Tags: ${e.tags.join(', ')}`);
    return lines.join('\n');
  }).join('\n\n');
  return header + body;
}

export function formatEventLogAsJSON(entries: EventLogEntry[]): string {
  return JSON.stringify({ exported: new Date().toISOString(), count: entries.length, entries }, null, 2);
}

export function formatEventLogAsCSV(entries: EventLogEntry[]): string {
  const header = 'timestamp,level,source,message,details,txHash,chain,contract,gasUsed,blockNumber,tags\n';
  const rows = entries.map(e =>
    [e.timestamp, e.level, e.source, `"${e.message}"`, `"${e.details || ''}"`, e.txHash || '', e.chain || '', e.contractAddress || '', e.gasUsed || '', e.blockNumber || '', `"${e.tags.join(';')}"`].join(',')
  ).join('\n');
  return header + rows;
}

/* ─── ABI Diff for Proxy Upgrades ─── */

export type ABIDiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ABIDiffEntry {
  name: string;
  type: 'function' | 'event' | 'error' | 'constructor' | 'fallback' | 'receive';
  changeType: ABIDiffChangeType;
  oldSignature?: string;
  newSignature?: string;
  oldVisibility?: string;
  newVisibility?: string;
  oldStateMutability?: string;
  newStateMutability?: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskNote?: string;
}

export interface ABIDiffResult {
  contractAddress: string;
  chain: string;
  oldImpl: string;
  newImpl: string;
  oldImplLabel: string;
  newImplLabel: string;
  upgradeBlock: number;
  upgradeTimestamp: string;
  upgradeTxHash: string;
  totalFunctions: { old: number; new: number };
  totalEvents: { old: number; new: number };
  summary: { added: number; removed: number; modified: number; unchanged: number };
  riskScore: number;
  entries: ABIDiffEntry[];
}

export function generateMockABIDiff(_contractId: string): ABIDiffResult {
  const entries: ABIDiffEntry[] = [
    { name: 'stake', type: 'function', changeType: 'unchanged', oldSignature: 'stake(uint256 amount) → bool', newSignature: 'stake(uint256 amount) → bool', riskLevel: 'none' },
    { name: 'unstake', type: 'function', changeType: 'modified', oldSignature: 'unstake(uint256 amount) → bool', newSignature: 'unstake(uint256 amount, bool emergency) → bool', oldStateMutability: 'nonpayable', newStateMutability: 'nonpayable', riskLevel: 'medium', riskNote: 'Parameter added — emergency unstake bypass may skip cooldown' },
    { name: 'claimRewards', type: 'function', changeType: 'unchanged', oldSignature: 'claimRewards() → uint256', newSignature: 'claimRewards() → uint256', riskLevel: 'none' },
    { name: 'batchClaim', type: 'function', changeType: 'added', newSignature: 'batchClaim(uint256[] positionIds) → uint256[]', newVisibility: 'external', newStateMutability: 'nonpayable', riskLevel: 'low', riskNote: 'New batch claim — reduces gas for multi-position users' },
    { name: 'setEmergencyAdmin', type: 'function', changeType: 'added', newSignature: 'setEmergencyAdmin(address admin) → void', newVisibility: 'external', newStateMutability: 'nonpayable', riskLevel: 'critical', riskNote: 'New admin function — can set emergency admin who may bypass governance' },
    { name: 'pause', type: 'function', changeType: 'modified', oldSignature: 'pause() → void', newSignature: 'pause(string reason) → void', oldVisibility: 'external', newVisibility: 'external', riskLevel: 'low', riskNote: 'Added reason parameter for audit trail' },
    { name: 'getRewardRate', type: 'function', changeType: 'unchanged', oldSignature: 'getRewardRate() → uint256', newSignature: 'getRewardRate() → uint256', oldStateMutability: 'view', newStateMutability: 'view', riskLevel: 'none' },
    { name: 'getPoolInfo', type: 'function', changeType: 'unchanged', oldSignature: 'getPoolInfo(uint256 pid) → PoolInfo', newSignature: 'getPoolInfo(uint256 pid) → PoolInfo', riskLevel: 'none' },
    { name: 'migratePositions', type: 'function', changeType: 'added', newSignature: 'migratePositions(address from, address to) → bool', newVisibility: 'external', newStateMutability: 'nonpayable', riskLevel: 'high', riskNote: 'Position migration — could transfer positions without consent if admin compromised' },
    { name: 'withdrawFees', type: 'function', changeType: 'removed', oldSignature: 'withdrawFees(address token, uint256 amount) → bool', oldVisibility: 'external', riskLevel: 'medium', riskNote: 'Fee withdrawal removed — fees may now be handled differently' },
    { name: 'Staked', type: 'event', changeType: 'unchanged', oldSignature: 'Staked(address indexed user, uint256 amount)', newSignature: 'Staked(address indexed user, uint256 amount)', riskLevel: 'none' },
    { name: 'EmergencyUnstake', type: 'event', changeType: 'added', newSignature: 'EmergencyUnstake(address indexed user, uint256 amount, bool penalized)', riskLevel: 'low', riskNote: 'New event for emergency unstake tracking' },
    { name: 'AdminChanged', type: 'event', changeType: 'added', newSignature: 'AdminChanged(address indexed oldAdmin, address indexed newAdmin)', riskLevel: 'medium', riskNote: 'Tracks admin changes — important for governance monitoring' },
    { name: 'FeeWithdrawn', type: 'event', changeType: 'removed', oldSignature: 'FeeWithdrawn(address indexed token, uint256 amount, address indexed to)', riskLevel: 'low' },
  ];

  return {
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'BSC',
    oldImpl: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    newImpl: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    oldImplLabel: 'v1.2.0 (14/02/2026)',
    newImplLabel: 'v1.3.0 (05/03/2026)',
    upgradeBlock: 38291100,
    upgradeTimestamp: '05/03/2026 14:32 UTC',
    upgradeTxHash: '0xf9e8d7c6b5a493827160...c1b0',
    totalFunctions: { old: 12, new: 14 },
    totalEvents: { old: 8, new: 10 },
    summary: {
      added: entries.filter(e => e.changeType === 'added').length,
      removed: entries.filter(e => e.changeType === 'removed').length,
      modified: entries.filter(e => e.changeType === 'modified').length,
      unchanged: entries.filter(e => e.changeType === 'unchanged').length,
    },
    riskScore: 72,
    entries,
  };
}

/* ─── Multi-wallet Address Book ─── */

export interface WalletAddress {
  id: string;
  label: string;
  address: string;
  chain: string;
  chainColor: string;
  chainIcon: string;
  isDefault: boolean;
  isFavorite: boolean;
  lastUsed?: string;
  usageCount: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  verified: boolean;
}

export const MOCK_WALLET_ADDRESSES: WalletAddress[] = [
  { id: 'w1', label: 'Ví chính', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68', chain: 'Ethereum', chainColor: '#627EEA', chainIcon: 'Ξ', isDefault: true, isFavorite: true, lastUsed: '07/03/2026 08:15', usageCount: 47, notes: 'Ví MetaMask chính, dùng cho mua IDO', tags: ['main', 'ido'], createdAt: '01/01/2026', verified: true },
  { id: 'w2', label: 'Ví BSC', address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72', chain: 'BSC', chainColor: '#F0B90B', chainIcon: 'B', isDefault: false, isFavorite: true, lastUsed: '06/03/2026 14:30', usageCount: 32, notes: 'Ví BNB cho staking và launchpool', tags: ['staking', 'launchpool'], createdAt: '15/01/2026', verified: true },
  { id: 'w3', label: 'Ví Polygon', address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', chain: 'Polygon', chainColor: '#8247E5', chainIcon: 'P', isDefault: false, isFavorite: false, lastUsed: '05/03/2026 09:45', usageCount: 15, notes: 'Cho bridge và DEX trades', tags: ['bridge', 'dex'], createdAt: '01/02/2026', verified: true },
  { id: 'w4', label: 'Hardware Wallet', address: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', chain: 'Ethereum', chainColor: '#627EEA', chainIcon: 'Ξ', isDefault: false, isFavorite: true, lastUsed: '04/03/2026 11:20', usageCount: 8, notes: 'Ledger Nano X — chỉ dùng cho giao dịch lớn', tags: ['hardware', 'cold'], createdAt: '10/01/2026', verified: true },
  { id: 'w5', label: 'Ví Arbitrum', address: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71', chain: 'Arbitrum', chainColor: '#28A0F0', chainIcon: 'A', isDefault: false, isFavorite: false, usageCount: 3, tags: ['l2'], createdAt: '20/02/2026', verified: false },
  { id: 'w6', label: 'Ví test DeFi', address: '0xDf3B3a3b8E6b12c04e81eb5f4C85e8E8A58796d1', chain: 'BSC', chainColor: '#F0B90B', chainIcon: 'B', isDefault: false, isFavorite: false, lastUsed: '01/03/2026 16:00', usageCount: 22, notes: 'Chỉ dùng cho test smart contract', tags: ['test', 'defi'], createdAt: '05/02/2026', verified: true },
];

export function loadWalletAddresses(): WalletAddress[] {
  const stored = localStorage.getItem('launchpad_wallet_addresses');
  return stored ? JSON.parse(stored) : [...MOCK_WALLET_ADDRESSES];
}

export function saveWalletAddresses(addresses: WalletAddress[]): void {
  localStorage.setItem('launchpad_wallet_addresses', JSON.stringify(addresses));
}

/* ═══════════════════════════════════════════════════════════
   Phase 4.10 — Webhooks, Gas Tracker, Rebalancing, Multi-sig
   ═══════════════════════════════════════════════════════════ */

/* ─── Contract Event Webhooks ─── */

export type WebhookEventType = 'Transfer' | 'Approval' | 'Staked' | 'Withdrawn' | 'RewardPaid' | 'OwnershipTransferred' | 'Paused' | 'Unpaused' | 'ProxyUpgraded';

export interface WebhookSubscription {
  id: string;
  label: string;
  contractAddress: string;
  chain: string;
  chainColor: string;
  eventTypes: WebhookEventType[];
  webhookUrl: string;
  secret?: string;
  status: 'active' | 'paused' | 'error' | 'pending';
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
  errorCount: number;
  lastError?: string;
  filters: { field: string; operator: 'eq' | 'gt' | 'lt' | 'contains'; value: string }[];
  retryPolicy: 'none' | 'linear' | 'exponential';
  maxRetries: number;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventType: WebhookEventType;
  timestamp: string;
  status: 'delivered' | 'failed' | 'retrying' | 'pending';
  statusCode?: number;
  responseTime?: number;
  payload: string;
  txHash?: string;
  blockNumber?: number;
  retryCount: number;
}

export const ALL_WEBHOOK_EVENTS: { type: WebhookEventType; label: string; desc: string; color: string }[] = [
  { type: 'Transfer', label: 'Transfer', desc: 'Token transfers (ERC20/721)', color: '#3B82F6' },
  { type: 'Approval', label: 'Approval', desc: 'Token approval changes', color: '#F59E0B' },
  { type: 'Staked', label: 'Staked', desc: 'Staking deposits', color: '#10B981' },
  { type: 'Withdrawn', label: 'Withdrawn', desc: 'Staking withdrawals', color: '#EF4444' },
  { type: 'RewardPaid', label: 'RewardPaid', desc: 'Reward distributions', color: '#8B5CF6' },
  { type: 'OwnershipTransferred', label: 'OwnershipTransferred', desc: 'Ownership changes', color: '#EC4899' },
  { type: 'Paused', label: 'Paused', desc: 'Contract paused', color: '#F97316' },
  { type: 'Unpaused', label: 'Unpaused', desc: 'Contract unpaused', color: '#06B6D4' },
  { type: 'ProxyUpgraded', label: 'ProxyUpgraded', desc: 'Implementation changed', color: '#DC2626' },
];

export const MOCK_WEBHOOK_SUBS: WebhookSubscription[] = [
  {
    id: 'wh1', label: 'NexaAI Staking Events', contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    chain: 'BSC', chainColor: '#F0B90B', eventTypes: ['Staked', 'Withdrawn', 'RewardPaid'],
    webhookUrl: 'https://api.myapp.io/webhooks/nexa-staking', secret: 'whsec_xxx...xxx',
    status: 'active', createdAt: '01/03/2026', lastTriggered: '07/03/2026 09:15',
    triggerCount: 142, errorCount: 2, filters: [], retryPolicy: 'exponential', maxRetries: 3,
  },
  {
    id: 'wh2', label: 'GCE Token Transfers', contractAddress: '0x9876543210abcdef9876543210abcdef98765432',
    chain: 'Polygon', chainColor: '#8247E5', eventTypes: ['Transfer', 'Approval'],
    webhookUrl: 'https://api.myapp.io/webhooks/gce-transfers',
    status: 'active', createdAt: '03/03/2026', lastTriggered: '07/03/2026 08:45',
    triggerCount: 89, errorCount: 0, filters: [{ field: 'value', operator: 'gt', value: '1000' }],
    retryPolicy: 'linear', maxRetries: 5,
  },
  {
    id: 'wh3', label: 'Security Monitor', contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    chain: 'BSC', chainColor: '#F0B90B', eventTypes: ['OwnershipTransferred', 'Paused', 'ProxyUpgraded'],
    webhookUrl: 'https://alerts.myapp.io/security',
    status: 'error', createdAt: '28/02/2026', lastTriggered: '05/03/2026 14:32',
    triggerCount: 5, errorCount: 3, lastError: 'Connection refused: target server unreachable',
    filters: [], retryPolicy: 'exponential', maxRetries: 3,
  },
  {
    id: 'wh4', label: 'IDO Participation Tracker', contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    chain: 'Ethereum', chainColor: '#627EEA', eventTypes: ['Transfer'],
    webhookUrl: 'https://api.myapp.io/webhooks/ido-track',
    status: 'paused', createdAt: '15/02/2026',
    triggerCount: 234, errorCount: 1, filters: [], retryPolicy: 'none', maxRetries: 0,
  },
];

export const MOCK_WEBHOOK_DELIVERIES: WebhookDelivery[] = [
  { id: 'wd1', subscriptionId: 'wh1', eventType: 'Staked', timestamp: '07/03/2026 09:15:32', status: 'delivered', statusCode: 200, responseTime: 145, payload: '{"event":"Staked","user":"0x742d...bD68","amount":"500"}', txHash: '0xab12...cd34', blockNumber: 38291500, retryCount: 0 },
  { id: 'wd2', subscriptionId: 'wh1', eventType: 'RewardPaid', timestamp: '07/03/2026 08:30:12', status: 'delivered', statusCode: 200, responseTime: 98, payload: '{"event":"RewardPaid","user":"0x742d...bD68","amount":"12.5"}', txHash: '0xef56...gh78', blockNumber: 38291480, retryCount: 0 },
  { id: 'wd3', subscriptionId: 'wh2', eventType: 'Transfer', timestamp: '07/03/2026 08:45:55', status: 'delivered', statusCode: 200, responseTime: 212, payload: '{"event":"Transfer","from":"0x0000...0000","to":"0x8Ba1...BA72","value":"5000"}', txHash: '0xij90...kl12', blockNumber: 58234500, retryCount: 0 },
  { id: 'wd4', subscriptionId: 'wh3', eventType: 'ProxyUpgraded', timestamp: '05/03/2026 14:32:08', status: 'failed', statusCode: 502, responseTime: 5000, payload: '{"event":"ProxyUpgraded","implementation":"0xBBBB...BBBB"}', txHash: '0xmn34...op56', blockNumber: 38291100, retryCount: 3 },
  { id: 'wd5', subscriptionId: 'wh1', eventType: 'Withdrawn', timestamp: '06/03/2026 16:22:41', status: 'delivered', statusCode: 200, responseTime: 167, payload: '{"event":"Withdrawn","user":"0xcd3B...ce71","amount":"1000"}', txHash: '0xqr78...st90', blockNumber: 38291450, retryCount: 0 },
  { id: 'wd6', subscriptionId: 'wh3', eventType: 'Paused', timestamp: '04/03/2026 22:10:05', status: 'failed', statusCode: 0, responseTime: 30000, payload: '{"event":"Paused","reason":"scheduled-maintenance"}', blockNumber: 38291000, retryCount: 3 },
];

export function loadWebhookSubs(): WebhookSubscription[] {
  const stored = localStorage.getItem('launchpad_webhooks');
  return stored ? JSON.parse(stored) : [...MOCK_WEBHOOK_SUBS];
}

export function saveWebhookSubs(subs: WebhookSubscription[]): void {
  localStorage.setItem('launchpad_webhooks', JSON.stringify(subs));
}

/* ─── Gas Price Tracker ─── */

export interface GasPrice {
  chain: string;
  chainColor: string;
  chainIcon: string;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  unit: string;
  baseFee?: number;
  priorityFee?: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  change24h: number;
}

export interface GasEstimate {
  operation: string;
  gasUnits: number;
  costs: { chain: string; slow: string; standard: string; fast: string }[];
}

export interface GasAlert {
  id: string;
  chain: string;
  chainColor: string;
  threshold: number;
  direction: 'above' | 'below';
  unit: string;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

export interface GasHistoryPoint {
  time: string;
  slow: number;
  standard: number;
  fast: number;
}

export const MOCK_GAS_PRICES: GasPrice[] = [
  { chain: 'Ethereum', chainColor: '#627EEA', chainIcon: 'ET', slow: 12, standard: 18, fast: 25, instant: 35, unit: 'Gwei', baseFee: 15, priorityFee: 3, lastUpdated: '07/03/2026 10:30', trend: 'down', change24h: -12.5 },
  { chain: 'BSC', chainColor: '#F0B90B', chainIcon: 'BS', slow: 3, standard: 5, fast: 7, instant: 10, unit: 'Gwei', lastUpdated: '07/03/2026 10:30', trend: 'stable', change24h: 2.1 },
  { chain: 'Polygon', chainColor: '#8247E5', chainIcon: 'PG', slow: 30, standard: 45, fast: 80, instant: 120, unit: 'Gwei', lastUpdated: '07/03/2026 10:30', trend: 'up', change24h: 18.3 },
  { chain: 'Arbitrum', chainColor: '#28A0F0', chainIcon: 'AR', slow: 0.1, standard: 0.15, fast: 0.25, instant: 0.4, unit: 'Gwei', lastUpdated: '07/03/2026 10:30', trend: 'down', change24h: -5.2 },
  { chain: 'Avalanche', chainColor: '#E84142', chainIcon: 'AV', slow: 25, standard: 30, fast: 40, instant: 55, unit: 'nAVAX', lastUpdated: '07/03/2026 10:30', trend: 'stable', change24h: 0.8 },
];

export const MOCK_GAS_ESTIMATES: GasEstimate[] = [
  { operation: 'ERC20 Transfer', gasUnits: 65000, costs: [
    { chain: 'Ethereum', slow: '$0.94', standard: '$1.40', fast: '$1.95' },
    { chain: 'BSC', slow: '$0.04', standard: '$0.06', fast: '$0.09' },
    { chain: 'Polygon', slow: '<$0.01', standard: '<$0.01', fast: '$0.01' },
  ]},
  { operation: 'ERC20 Approve', gasUnits: 46000, costs: [
    { chain: 'Ethereum', slow: '$0.66', standard: '$0.99', fast: '$1.38' },
    { chain: 'BSC', slow: '$0.03', standard: '$0.04', fast: '$0.06' },
    { chain: 'Polygon', slow: '<$0.01', standard: '<$0.01', fast: '<$0.01' },
  ]},
  { operation: 'Stake', gasUnits: 120000, costs: [
    { chain: 'Ethereum', slow: '$1.73', standard: '$2.59', fast: '$3.60' },
    { chain: 'BSC', slow: '$0.07', standard: '$0.11', fast: '$0.16' },
    { chain: 'Polygon', slow: '<$0.01', standard: '$0.01', fast: '$0.02' },
  ]},
  { operation: 'Claim Rewards', gasUnits: 85000, costs: [
    { chain: 'Ethereum', slow: '$1.22', standard: '$1.84', fast: '$2.55' },
    { chain: 'BSC', slow: '$0.05', standard: '$0.08', fast: '$0.11' },
    { chain: 'Polygon', slow: '<$0.01', standard: '<$0.01', fast: '$0.01' },
  ]},
  { operation: 'Bridge (cross-chain)', gasUnits: 250000, costs: [
    { chain: 'Ethereum', slow: '$3.60', standard: '$5.40', fast: '$7.50' },
    { chain: 'BSC', slow: '$0.14', standard: '$0.24', fast: '$0.33' },
    { chain: 'Polygon', slow: '$0.02', standard: '$0.03', fast: '$0.05' },
  ]},
];

export function generateGasHistory(chain: string): GasHistoryPoint[] {
  const points: GasHistoryPoint[] = [];
  const baseValues: Record<string, number> = { 'Ethereum': 18, 'BSC': 5, 'Polygon': 45, 'Arbitrum': 0.15, 'Avalanche': 30 };
  const base = baseValues[chain] || 18;
  for (let i = 24; i >= 0; i--) {
    const h = new Date(Date.now() - i * 3600000);
    const variance = 0.3;
    const noise = () => base * (1 + (Math.sin(i * 0.5) + Math.cos(i * 0.3)) * variance * 0.5 + (Math.random() - 0.5) * variance * 0.3);
    points.push({
      time: `${String(h.getHours()).padStart(2, '0')}:00`,
      slow: Math.max(0.01, noise() * 0.7),
      standard: Math.max(0.01, noise()),
      fast: Math.max(0.01, noise() * 1.4),
    });
  }
  return points;
}

export const MOCK_GAS_ALERTS: GasAlert[] = [
  { id: 'ga1', chain: 'Ethereum', chainColor: '#627EEA', threshold: 15, direction: 'below', unit: 'Gwei', enabled: true, lastTriggered: '07/03/2026 03:15', triggerCount: 3 },
  { id: 'ga2', chain: 'Ethereum', chainColor: '#627EEA', threshold: 50, direction: 'above', unit: 'Gwei', enabled: true, triggerCount: 0 },
  { id: 'ga3', chain: 'Polygon', chainColor: '#8247E5', threshold: 100, direction: 'above', unit: 'Gwei', enabled: false, lastTriggered: '06/03/2026 18:45', triggerCount: 7 },
];

export function loadGasAlerts(): GasAlert[] {
  const stored = localStorage.getItem('launchpad_gas_alerts');
  return stored ? JSON.parse(stored) : [...MOCK_GAS_ALERTS];
}

export function saveGasAlerts(alerts: GasAlert[]): void {
  localStorage.setItem('launchpad_gas_alerts', JSON.stringify(alerts));
}

/* ─── Portfolio Rebalancing ─── */

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  color: string;
  currentAmount: number;
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  price: number;
  change24h: number;
  chain: string;
}

export interface RebalanceSuggestion {
  assetId: string;
  symbol: string;
  name: string;
  color: string;
  action: 'buy' | 'sell' | 'hold';
  currentPercent: number;
  targetPercent: number;
  deviation: number;
  suggestedAmount: number;
  suggestedValue: number;
  estimatedGas: string;
  chain: string;
}

export interface RebalanceStrategy {
  id: string;
  name: string;
  description: string;
  targets: { symbol: string; percent: number }[];
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  color: string;
}

export const REBALANCE_STRATEGIES: RebalanceStrategy[] = [
  { id: 'conservative', name: 'An toàn', description: 'Stablecoin + Blue chip, rủi ro thấp', riskLevel: 'conservative', color: '#10B981',
    targets: [{ symbol: 'USDT', percent: 40 }, { symbol: 'BTC', percent: 25 }, { symbol: 'ETH', percent: 20 }, { symbol: 'BNB', percent: 10 }, { symbol: 'Other', percent: 5 }] },
  { id: 'moderate', name: 'Cân bằng', description: 'Pha trộn blue chip và altcoin triển vọng', riskLevel: 'moderate', color: '#3B82F6',
    targets: [{ symbol: 'USDT', percent: 20 }, { symbol: 'BTC', percent: 25 }, { symbol: 'ETH', percent: 25 }, { symbol: 'BNB', percent: 15 }, { symbol: 'Other', percent: 15 }] },
  { id: 'aggressive', name: 'Tăng trưởng', description: 'Tập trung altcoin và launchpad tokens', riskLevel: 'aggressive', color: '#F59E0B',
    targets: [{ symbol: 'USDT', percent: 10 }, { symbol: 'BTC', percent: 15 }, { symbol: 'ETH', percent: 20 }, { symbol: 'BNB', percent: 20 }, { symbol: 'Other', percent: 35 }] },
];

export const MOCK_PORTFOLIO_ASSETS: PortfolioAsset[] = [
  { id: 'pa1', symbol: 'USDT', name: 'Tether', color: '#26A17B', currentAmount: 8500, currentValue: 8500, currentPercent: 34, targetPercent: 20, price: 1.0, change24h: 0, chain: 'Multi' },
  { id: 'pa2', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', currentAmount: 0.082, currentValue: 7134, currentPercent: 28.5, targetPercent: 25, price: 87000, change24h: 2.3, chain: 'Multi' },
  { id: 'pa3', symbol: 'ETH', name: 'Ethereum', color: '#627EEA', currentAmount: 1.85, currentValue: 4810, currentPercent: 19.2, targetPercent: 25, price: 2600, change24h: -1.2, chain: 'Ethereum' },
  { id: 'pa4', symbol: 'BNB', name: 'BNB', color: '#F0B90B', currentAmount: 5.2, currentValue: 2860, currentPercent: 11.4, targetPercent: 15, price: 550, change24h: 0.8, chain: 'BSC' },
  { id: 'pa5', symbol: 'NEXA', name: 'NexaAI', color: '#6366F1', currentAmount: 12500, currentValue: 625, currentPercent: 2.5, targetPercent: 5, price: 0.05, change24h: 8.7, chain: 'BSC' },
  { id: 'pa6', symbol: 'GCE', name: 'GreenChain', color: '#10B981', currentAmount: 4200, currentValue: 504, currentPercent: 2.0, targetPercent: 5, price: 0.12, change24h: -3.1, chain: 'Polygon' },
  { id: 'pa7', symbol: 'OMX', name: 'OmniDEX', color: '#06B6D4', currentAmount: 1700, currentValue: 598.4, currentPercent: 2.4, targetPercent: 5, price: 0.352, change24h: 1.5, chain: 'Multi' },
];

export function generateRebalanceSuggestions(assets: PortfolioAsset[]): RebalanceSuggestion[] {
  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
  return assets.map(a => {
    const deviation = a.currentPercent - a.targetPercent;
    const targetValue = totalValue * a.targetPercent / 100;
    const diffValue = a.currentValue - targetValue;
    const action: 'buy' | 'sell' | 'hold' = Math.abs(deviation) < 1 ? 'hold' : deviation > 0 ? 'sell' : 'buy';
    return {
      assetId: a.id, symbol: a.symbol, name: a.name, color: a.color,
      action, currentPercent: a.currentPercent, targetPercent: a.targetPercent,
      deviation, suggestedAmount: Math.abs(diffValue / a.price),
      suggestedValue: Math.abs(diffValue),
      estimatedGas: a.chain === 'Ethereum' ? '$1.40' : a.chain === 'BSC' ? '$0.06' : '$0.01',
      chain: a.chain,
    };
  }).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}

/* ─── Multi-sig Transaction Builder ─── */

export type MultisigTxStatus = 'draft' | 'pending_signatures' | 'ready' | 'executing' | 'executed' | 'expired' | 'cancelled';

export interface MultisigSigner {
  address: string;
  label: string;
  signed: boolean;
  signedAt?: string;
  role: 'owner' | 'signer' | 'observer';
}

export interface MultisigTransaction {
  id: string;
  label: string;
  description: string;
  contractAddress: string;
  chain: string;
  chainColor: string;
  functionName: string;
  params: Record<string, string>;
  value: string;
  estimatedGas: string;
  status: MultisigTxStatus;
  threshold: number;
  signers: MultisigSigner[];
  signedCount: number;
  createdAt: string;
  expiresAt: string;
  executedAt?: string;
  executeTxHash?: string;
  nonce: number;
  safeAddress: string;
}

export interface MultisigSafe {
  address: string;
  label: string;
  chain: string;
  chainColor: string;
  threshold: number;
  owners: MultisigSigner[];
  balance: string;
  txCount: number;
  pendingCount: number;
}

export const MOCK_MULTISIG_SAFES: MultisigSafe[] = [
  {
    address: '0xSafe1111...aaaa', label: 'Team Treasury', chain: 'BSC', chainColor: '#F0B90B',
    threshold: 2, balance: '$125,400', txCount: 34, pendingCount: 2,
    owners: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: false, role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: false, role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: false, role: 'signer' },
    ],
  },
  {
    address: '0xSafe2222...bbbb', label: 'Operations Fund', chain: 'Ethereum', chainColor: '#627EEA',
    threshold: 3, balance: '$48,200', txCount: 12, pendingCount: 1,
    owners: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: false, role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: false, role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: false, role: 'signer' },
      { address: '0xbDA5...97E', label: 'CFO', signed: false, role: 'signer' },
    ],
  },
];

export const MOCK_MULTISIG_TXS: MultisigTransaction[] = [
  {
    id: 'mtx1', label: 'Withdraw staking rewards', description: 'Rút 500 NEXA rewards từ pool NexaAI',
    contractAddress: '0x1a2b...ef12', chain: 'BSC', chainColor: '#F0B90B',
    functionName: 'claimRewards', params: {}, value: '0',
    estimatedGas: '$0.18', status: 'pending_signatures', threshold: 2,
    signers: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: true, signedAt: '07/03/2026 09:00', role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: false, role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: false, role: 'signer' },
    ],
    signedCount: 1, createdAt: '07/03/2026 08:45', expiresAt: '14/03/2026 08:45',
    nonce: 35, safeAddress: '0xSafe1111...aaaa',
  },
  {
    id: 'mtx2', label: 'Approve bridge router', description: 'Approve 10,000 USDT cho VitBridge router',
    contractAddress: '0x9876...5432', chain: 'BSC', chainColor: '#F0B90B',
    functionName: 'approve', params: { spender: '0xBridge...Router', amount: '10000' }, value: '0',
    estimatedGas: '$0.04', status: 'ready', threshold: 2,
    signers: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: true, signedAt: '06/03/2026 15:00', role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: true, signedAt: '06/03/2026 16:30', role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: false, role: 'signer' },
    ],
    signedCount: 2, createdAt: '06/03/2026 14:30', expiresAt: '13/03/2026 14:30',
    nonce: 34, safeAddress: '0xSafe1111...aaaa',
  },
  {
    id: 'mtx3', label: 'Emergency pause contract', description: 'Pause contract NexaAI Staking do nghi vấn bảo mật',
    contractAddress: '0x1a2b...ef12', chain: 'BSC', chainColor: '#F0B90B',
    functionName: 'pause', params: { reason: 'security-review' }, value: '0',
    estimatedGas: '$0.06', status: 'executed', threshold: 2,
    signers: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: true, signedAt: '05/03/2026 14:00', role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: true, signedAt: '05/03/2026 14:05', role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: true, signedAt: '05/03/2026 14:02', role: 'signer' },
    ],
    signedCount: 3, createdAt: '05/03/2026 13:50', expiresAt: '12/03/2026 13:50',
    executedAt: '05/03/2026 14:06', executeTxHash: '0xExec...1234',
    nonce: 33, safeAddress: '0xSafe1111...aaaa',
  },
  {
    id: 'mtx4', label: 'Fund transfer to operations', description: 'Chuyển 5 ETH sang Operations Fund',
    contractAddress: '0x0000...0000', chain: 'Ethereum', chainColor: '#627EEA',
    functionName: 'transfer', params: { to: '0xSafe2222...bbbb', amount: '5' }, value: '5 ETH',
    estimatedGas: '$2.50', status: 'pending_signatures', threshold: 3,
    signers: [
      { address: '0x742d...bD68', label: 'Admin 1', signed: true, signedAt: '07/03/2026 07:00', role: 'owner' },
      { address: '0x8Ba1...BA72', label: 'Admin 2', signed: false, role: 'owner' },
      { address: '0x2546...EC30', label: 'CTO', signed: true, signedAt: '07/03/2026 07:30', role: 'signer' },
      { address: '0xbDA5...97E', label: 'CFO', signed: false, role: 'signer' },
    ],
    signedCount: 2, createdAt: '07/03/2026 06:45', expiresAt: '14/03/2026 06:45',
    nonce: 13, safeAddress: '0xSafe2222...bbbb',
  },
];

export function loadMultisigTxs(): MultisigTransaction[] {
  const stored = localStorage.getItem('launchpad_multisig_txs');
  return stored ? JSON.parse(stored) : [...MOCK_MULTISIG_TXS];
}

export function saveMultisigTxs(txs: MultisigTransaction[]): void {
  localStorage.setItem('launchpad_multisig_txs', JSON.stringify(txs));
}