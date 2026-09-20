/**
 * Rewards Hub — Data, Types, Constants & Helpers
 */

/* ═══════════════════════════════════════════
   Unified Task Interface + Mock Data
   ═══════════════════════════════════════════ */

export interface UnifiedTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  usdtReward?: string;
  pointsReward?: number;
  progress: number;
  maxProgress: number;
  status: 'active' | 'completed' | 'claimed' | 'expired';
  category: 'daily' | 'weekly' | 'achievement' | 'arena' | 'flash' | 'learn';
  expiresAt?: string;
  multiplier?: number;
}

export const UNIFIED_TASKS: UnifiedTask[] = [
  // ─── Hàng ngày ───
  { id: 'u001', title: 'Đăng nhập hàng ngày', description: 'Đăng nhập mỗi ngày để nhận thưởng kép', icon: '📅', usdtReward: '0.5 USDT', pointsReward: 30, progress: 1, maxProgress: 1, status: 'completed', category: 'daily' },
  { id: 'u002', title: 'Giao dịch 5 lệnh Spot', description: 'Hoàn thành 5 lệnh giao dịch Spot trong ngày', icon: '📊', usdtReward: '2 USDT', pointsReward: 50, progress: 3, maxProgress: 5, status: 'active', category: 'daily', expiresAt: '2026-03-02' },
  { id: 'u003', title: 'Giao dịch P2P', description: 'Hoàn thành 1 giao dịch P2P trong ngày', icon: '🤝', usdtReward: '3 USDT', pointsReward: 40, progress: 1, maxProgress: 1, status: 'completed', category: 'daily' },

  // ─── Hàng tuần ───
  { id: 'u004', title: 'Mời bạn bè', description: 'Mời 3 bạn bè đăng ký VitTrade tuần này', icon: '👥', usdtReward: '15 USDT', pointsReward: 100, progress: 1, maxProgress: 3, status: 'active', category: 'weekly', expiresAt: '2026-03-04' },
  { id: 'u005', title: 'Volume tuần $10K', description: 'Đạt khối lượng giao dịch $10,000 trong tuần', icon: '🔥', usdtReward: 'Giảm 50% phí 7 ngày', pointsReward: 150, progress: 6420, maxProgress: 10000, status: 'active', category: 'weekly', expiresAt: '2026-03-05' },
  { id: 'u006', title: 'Streak 7 ngày', description: 'Đăng nhập 7 ngày liên tiếp để nhận bonus', icon: '⚡', usdtReward: '5 USDT', pointsReward: 100, progress: 5, maxProgress: 7, status: 'active', category: 'weekly', expiresAt: '2026-03-03' },

  // ─── Thành tựu ───
  { id: 'u007', title: 'Giao dịch lần đầu', description: 'Thực hiện giao dịch đầu tiên trên VitTrade', icon: '🎯', usdtReward: '5 USDT', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement' },
  { id: 'u008', title: 'Nạp tiền lần đầu', description: 'Nạp tối thiểu $100 vào tài khoản', icon: '💰', usdtReward: '10 USDT', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement' },
  { id: 'u009', title: 'Bật 2FA', description: 'Kích hoạt xác thực 2 lớp cho tài khoản', icon: '🔐', usdtReward: 'Badge Bảo mật', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement' },
  { id: 'u010', title: 'KYC Level 2', description: 'Hoàn tất xác minh danh tính cấp 2', icon: '✅', usdtReward: '20 USDT', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement' },

  // ─── Arena ───
  { id: 'u011', title: 'Tham gia challenge', description: 'Tham gia ít nhất 1 challenge trong tuần', icon: '🎯', pointsReward: 80, progress: 2, maxProgress: 1, status: 'claimed', category: 'arena' },
  { id: 'u012', title: 'Tạo mode mới', description: 'Tạo 1 mode mới và có ít nhất 5 người clone', icon: '🏗️', pointsReward: 200, progress: 2, maxProgress: 5, status: 'active', category: 'arena' },
  { id: 'u013', title: 'Thắng 3 challenge', description: 'Thắng 3 challenge bất kỳ', icon: '🏆', pointsReward: 500, progress: 2, maxProgress: 3, status: 'active', category: 'arena' },

  // ─── Flash ⚡ ───
  { id: 'u014', title: 'Flash: Mua BTC hôm nay', description: 'Mua tối thiểu $50 BTC trong 4 giờ tới', icon: '⚡', usdtReward: '8 USDT', pointsReward: 120, progress: 0, maxProgress: 1, status: 'active', category: 'flash', expiresAt: '2026-03-02', multiplier: 2 },
  { id: 'u015', title: 'Flash: 3 lệnh P2P liên tiếp', description: 'Hoàn thành 3 lệnh P2P trong 6 giờ', icon: '💥', usdtReward: '12 USDT', pointsReward: 200, progress: 1, maxProgress: 3, status: 'active', category: 'flash', expiresAt: '2026-03-02', multiplier: 2 },
  { id: 'u016', title: 'Flash: Volume $5K nhanh', description: 'Đạt $5,000 volume trong 8 giờ tới', icon: '🚀', usdtReward: 'Giảm 70% phí 3 ngày', pointsReward: 180, progress: 2100, maxProgress: 5000, status: 'active', category: 'flash', expiresAt: '2026-03-02', multiplier: 1.5 },

  // ─── Học & Nhận thưởng ───
  { id: 'u017', title: 'Quiz: Blockchain cơ bản', description: 'Trả lời đúng 5 câu hỏi về blockchain', icon: '📚', usdtReward: '2 USDT', pointsReward: 60, progress: 5, maxProgress: 5, status: 'completed', category: 'learn' },
  { id: 'u018', title: 'Bài học: DeFi là gì?', description: 'Xem video 3 phút và trả lời quiz', icon: '🎓', usdtReward: '3 USDT', pointsReward: 80, progress: 0, maxProgress: 1, status: 'active', category: 'learn' },
  { id: 'u019', title: 'Quiz: An toàn P2P', description: 'Hoàn thành bài kiểm tra an toàn P2P', icon: '🛡️', usdtReward: '1.5 USDT', pointsReward: 50, progress: 3, maxProgress: 5, status: 'active', category: 'learn' },
  { id: 'u020', title: 'Bài học: Staking & Yield', description: 'Tìm hiểu cách kiếm lợi nhuận thụ động', icon: '📖', usdtReward: '2.5 USDT', pointsReward: 70, progress: 0, maxProgress: 1, status: 'active', category: 'learn' },

  // ─── Thêm daily/weekly bonuses ───
  { id: 'u021', title: 'Chia sẻ kết quả giao dịch', description: 'Share 1 kết quả giao dịch lên mạng xã hội', icon: '📱', usdtReward: '1 USDT', pointsReward: 25, progress: 0, maxProgress: 1, status: 'active', category: 'daily' },
  { id: 'u022', title: 'Đánh giá người bán P2P', description: 'Để lại đánh giá cho 3 người bán P2P', icon: '⭐', usdtReward: '1.5 USDT', pointsReward: 35, progress: 2, maxProgress: 3, status: 'active', category: 'daily' },
  { id: 'u023', title: 'Giữ $500 trong Wallet', description: 'Duy trì số dư ≥ $500 trong 7 ngày', icon: '💎', usdtReward: '10 USDT', pointsReward: 200, progress: 5, maxProgress: 7, status: 'active', category: 'weekly', expiresAt: '2026-03-06' },
  { id: 'u024', title: 'Giao dịch 10 cặp khác nhau', description: 'Giao dịch ít nhất 10 cặp coin khác nhau', icon: '🌐', usdtReward: '8 USDT', pointsReward: 150, progress: 6, maxProgress: 10, status: 'active', category: 'weekly', expiresAt: '2026-03-05' },
];

/* ─── Filter config ─── */

export const FILTER_TABS = ['Tất cả', 'Flash ⚡', 'Học', 'Hàng ngày', 'Hàng tuần', 'Thành tựu', 'Arena'] as const;
export const FILTER_MAP: Record<string, string | null> = {
  'Tất cả': null, 'Flash ⚡': 'flash', 'Học': 'learn',
  'Hàng ngày': 'daily', 'Hàng tuần': 'weekly',
  'Thành tựu': 'achievement', 'Arena': 'arena',
};

export const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  daily:       { color: '#3B82F6', label: 'Hàng ngày' },
  weekly:      { color: '#8B5CF6', label: 'Hàng tuần' },
  achievement: { color: '#F59E0B', label: 'Thành tựu' },
  arena:       { color: '#10B981', label: 'Arena' },
  flash:       { color: '#EF4444', label: 'Flash ⚡' },
  learn:       { color: '#06B6D4', label: 'Học' },
};

/* Confetti colors */
export const CONFETTI_COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6'];

/* ─── Tier System ─── */
export const TIER_CONFIG = [
  { id: 'bronze',   label: 'Đồng',       emoji: '🥉', color: '#CD7F32', minPoints: 0,     perks: 'Phí giao dịch chuẩn' },
  { id: 'silver',   label: 'Bạc',        emoji: '🥈', color: '#94A3B8', minPoints: 1000,  perks: 'Giảm 5% phí, ưu tiên hỗ trợ' },
  { id: 'gold',     label: 'Vàng',       emoji: '🥇', color: '#F59E0B', minPoints: 5000,  perks: 'Giảm 15% phí, VIP support' },
  { id: 'diamond',  label: 'Kim cương',  emoji: '💎', color: '#8B5CF6', minPoints: 15000, perks: 'Giảm 30% phí, P2P ưu tiên' },
] as const;

export function getCurrentTier(totalPoints: number) {
  const reversed = [...TIER_CONFIG].reverse();
  const current = reversed.find(t => totalPoints >= t.minPoints) ?? TIER_CONFIG[0];
  const currentIdx = TIER_CONFIG.findIndex(t => t.id === current.id);
  const next = currentIdx < TIER_CONFIG.length - 1 ? TIER_CONFIG[currentIdx + 1] : null;
  const progressToNext = next
    ? Math.min(100, Math.round(((totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100;
  const pointsToNext = next ? next.minPoints - totalPoints : 0;
  return { current, next, progressToNext, pointsToNext };
}

/* ─── Redemption Catalog ─── */
export const REDEMPTION_ITEMS = [
  { id: 'rd1', title: 'Giảm phí giao dịch 50%', desc: '7 ngày áp dụng', cost: 500, icon: '💸', color: '#10B981', tag: 'Phổ biến' },
  { id: 'rd2', title: 'Voucher 5 USDT', desc: 'Áp dụng cho giao dịch tiếp theo', cost: 1200, icon: '🎫', color: '#F59E0B', tag: null },
  { id: 'rd3', title: 'Huy hiệu VIP', desc: 'Hiển thị trên hồ sơ P2P', cost: 2000, icon: '🏆', color: '#8B5CF6', tag: 'Mới' },
  { id: 'rd4', title: 'Ưu tiên hỗ trợ 30 ngày', desc: 'Chat trực tiếp với chuyên gia', cost: 800, icon: '🛡️', color: '#3B82F6', tag: null },
  { id: 'rd5', title: 'Giảm phí rút coin 25%', desc: '3 lần rút tiếp theo', cost: 600, icon: '💰', color: '#EC4899', tag: null },
] as const;

/* ─── Expiry helpers ─── */
const TODAY_STR = '2026-03-02';

export function getDaysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const now = new Date(TODAY_STR);
  const exp = new Date(expiresAt);
  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function isExpiringSoon(expiresAt?: string): boolean {
  const days = getDaysUntilExpiry(expiresAt);
  return days !== null && days >= 0 && days <= 3;
}

/* ─── Spin Wheel Data ─── */
export const SPIN_PRIZES = [
  { label: '0.5 USDT', color: '#D97706', bg: '#FEF3C7', weight: 25 },
  { label: '50 pts', color: '#7C3AED', bg: '#EDE9FE', weight: 25 },
  { label: '2 USDT', color: '#059669', bg: '#D1FAE5', weight: 10 },
  { label: '100 pts', color: '#2563EB', bg: '#DBEAFE', weight: 15 },
  { label: '5 USDT', color: '#DB2777', bg: '#FCE7F3', weight: 5 },
  { label: '-30% phí', color: '#0891B2', bg: '#CFFAFE', weight: 10 },
  { label: '200 pts', color: '#DC2626', bg: '#FEE2E2', weight: 5 },
  { label: '1 USDT', color: '#0D9488', bg: '#CCFBF1', weight: 5 },
] as const;

export const PRIZE_EMOJI = ['💰', '⚡', '💵', '⚡', '💎', '🎁', '⚡', '💰'] as const;

/* SVG geometry */
export const W_SIZE = 240;
export const W_CX = W_SIZE / 2;
export const W_CY = W_SIZE / 2;
export const W_R = 104;
export const W_INNER = 28;
export const N_SEG = SPIN_PRIZES.length;
export const SEG_DEG = 360 / N_SEG;
const D2R = Math.PI / 180;

export function pol(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * D2R;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function segPath(i: number): string {
  const a1 = i * SEG_DEG;
  const a2 = a1 + SEG_DEG;
  const s = pol(W_CX, W_CY, W_R, a1);
  const e = pol(W_CX, W_CY, W_R, a2);
  return `M ${W_CX},${W_CY} L ${s.x},${s.y} A ${W_R},${W_R} 0 0,1 ${e.x},${e.y} Z`;
}

/* ─── Mystery Box Data ─── */
export const MYSTERY_BOXES = [
  { id: 'mb1', label: 'Hộp Đồng', emoji: '📦', color: '#CD7F32', requiredTasks: 3, prizes: ['1 USDT', '50 pts', 'Giảm 20% phí'], unlocked: true },
  { id: 'mb2', label: 'Hộp Bạc', emoji: '🎁', color: '#94A3B8', requiredTasks: 7, prizes: ['3 USDT', '150 pts', 'Giảm 40% phí'], unlocked: true },
  { id: 'mb3', label: 'Hộp Vàng', emoji: '✨', color: '#F59E0B', requiredTasks: 12, prizes: ['8 USDT', '300 pts', 'VIP 7 ngày'], unlocked: false },
  { id: 'mb4', label: 'Hộp Kim Cương', emoji: '💎', color: '#8B5CF6', requiredTasks: 20, prizes: ['20 USDT', '500 pts', 'VIP 30 ngày'], unlocked: false },
] as const;
