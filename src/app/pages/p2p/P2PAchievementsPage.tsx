import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_USER_LEVEL } from '../../data/mockData';
import { φ } from '../../utils/golden';
import {
  Trophy, Star, Shield, Zap, Target, Medal,
  TrendingUp, Users, CheckCircle, Lock, ChevronRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   P2P Achievements — Trading Milestones & Badges
   ═══════════════════════════════════════════════════════════ */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  gradient: string;
  progress: number; // 0-100
  currentValue: number;
  targetValue: number;
  unit: string;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: string;
  category: 'volume' | 'trades' | 'trust' | 'special';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach001', title: 'Giao dịch đầu tiên', description: 'Hoàn thành giao dịch P2P đầu tiên',
    icon: Zap, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    progress: 100, currentValue: 1, targetValue: 1, unit: 'giao dịch',
    unlocked: true, unlockedAt: '2024-01-15', reward: '+5 điểm uy tín', category: 'trades',
  },
  {
    id: 'ach002', title: 'Trader bền bỉ', description: 'Hoàn thành 50 giao dịch thành công',
    icon: Target, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    progress: 100, currentValue: 50, targetValue: 50, unit: 'giao dịch',
    unlocked: true, unlockedAt: '2024-02-10', reward: '+15 điểm uy tín', category: 'trades',
  },
  {
    id: 'ach003', title: 'Bách chiến bách thắng', description: 'Hoàn thành 100 giao dịch thành công',
    icon: Medal, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    progress: 78, currentValue: 78, targetValue: 100, unit: 'giao dịch',
    unlocked: false, reward: '+30 điểm uy tín', category: 'trades',
  },
  {
    id: 'ach004', title: 'Volume 100M', description: 'Tổng khối lượng giao dịch đạt 100M VND',
    icon: TrendingUp, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    progress: 100, currentValue: 100, targetValue: 100, unit: 'triệu VND',
    unlocked: true, unlockedAt: '2024-02-15', reward: 'Giảm phí 0.05%', category: 'volume',
  },
  {
    id: 'ach005', title: 'Volume 500M', description: 'Tổng khối lượng giao dịch đạt 500M VND',
    icon: TrendingUp, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    progress: 42, currentValue: 210, targetValue: 500, unit: 'triệu VND',
    unlocked: false, reward: 'Giảm phí 0.10%', category: 'volume',
  },
  {
    id: 'ach006', title: 'Tỷ lệ hoàn tất 98%+', description: 'Duy trì tỷ lệ hoàn tất trên 98% với ≥20 giao dịch',
    icon: Shield, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #6EE7B7)',
    progress: 100, currentValue: 98.5, targetValue: 98, unit: '%',
    unlocked: true, unlockedAt: '2024-02-20', reward: 'Huy hiệu "Tin cậy"', category: 'trust',
  },
  {
    id: 'ach007', title: 'Không tranh chấp', description: '50 giao dịch liên tiếp không có tranh chấp',
    icon: Star, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A)',
    progress: 86, currentValue: 43, targetValue: 50, unit: 'giao dịch',
    unlocked: false, reward: 'Huy hiệu "An toàn"', category: 'trust',
  },
  {
    id: 'ach008', title: 'Cộng đồng', description: 'Được 20 đánh giá 5 sao từ đối tác giao dịch',
    icon: Users, color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
    progress: 65, currentValue: 13, targetValue: 20, unit: 'đánh giá',
    unlocked: false, reward: '+20 điểm uy tín', category: 'special',
  },
  {
    id: 'ach009', title: 'Tốc độ thanh toán', description: 'Trung bình thanh toán dưới 3 phút (≥10 giao dịch)',
    icon: Zap, color: '#F97316', gradient: 'linear-gradient(135deg, #F97316, #FB923C)',
    progress: 100, currentValue: 2.5, targetValue: 3, unit: 'phút',
    unlocked: true, unlockedAt: '2024-03-01', reward: 'Huy hiệu "Nhanh nhẹn"', category: 'special',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  trades: 'Giao dịch',
  volume: 'Khối lượng',
  trust: 'Uy tín',
  special: 'Đặc biệt',
};

export function P2PAchievementsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = ACHIEVEMENTS.filter(a => a.unlocked && a.reward?.includes('điểm'))
    .reduce((sum, a) => {
      const match = a.reward?.match(/\+(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);

  const categories = ['trades', 'volume', 'trust', 'special'] as const;

  return (
    <PageLayout>
      <Header title="Thành tích P2P" subtitle="Thành tích · P2P" back />

      <div className="flex-1 px-5 py-5 flex flex-col gap-5" style={{ paddingBottom: 40 }}>
        {/* Hero Summary */}
        <TrCard variant="hero" className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.25)' }}
            >
              <Trophy size={28} color="#FBBF24" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Thành tích đạt được</p>
              <p style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {unlockedCount}/{ACHIEVEMENTS.length}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Tiến trình tổng</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`,
                  background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl py-2 px-3 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#FBBF24', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>+{totalPoints}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Điểm uy tín</span>
            </div>
            <div className="flex-1 rounded-xl py-2 px-3 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#34D399', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {ACHIEVEMENTS.filter(a => a.unlocked && a.reward?.includes('Huy hiệu')).length}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Huy hiệu</span>
            </div>
            <div className="flex-1 rounded-xl py-2 px-3 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#60A5FA', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                Lv.{P2P_USER_LEVEL.currentLevel}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Cấp hiện tại</span>
            </div>
          </div>
        </TrCard>

        {/* Achievements by category */}
        {categories.map(cat => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
          if (catAchievements.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
                  {CATEGORY_LABELS[cat]}
                </p>
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 600 }}
                >
                  {catAchievements.filter(a => a.unlocked).length}/{catAchievements.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {catAchievements.map(ach => {
                  const AchIcon = ach.icon;
                  return (
                    <TrCard key={ach.id} className="p-3.5">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="relative shrink-0">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{
                              background: ach.unlocked ? ach.gradient : c.surface2,
                              opacity: ach.unlocked ? 1 : 0.5,
                            }}
                          >
                            {ach.unlocked
                              ? <AchIcon size={20} color="#fff" />
                              : <Lock size={16} color={c.text3} />
                            }
                          </div>
                          {ach.unlocked && (
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: '#10B981', border: `2px solid ${c.surface}` }}
                            >
                              <CheckCircle size={10} color="#fff" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p style={{ color: ach.unlocked ? c.text1 : c.text3, fontSize: 13, fontWeight: 600 }}>
                              {ach.title}
                            </p>
                            {ach.unlocked && ach.unlockedAt && (
                              <span style={{ color: c.text3, fontSize: 10 }}>{ach.unlockedAt}</span>
                            )}
                          </div>
                          <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>{ach.description}</p>

                          {/* Progress bar */}
                          {!ach.unlocked && (
                            <div className="mb-1.5">
                              <div className="flex items-center justify-between mb-1">
                                <span style={{ color: c.text3, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                                  {ach.currentValue}/{ach.targetValue} {ach.unit}
                                </span>
                                <span style={{ color: ach.color, fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                  {ach.progress}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full" style={{ background: c.surface2 }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${ach.progress}%`, background: ach.color, transition: 'width 0.5s ease' }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Reward */}
                          {ach.reward && (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                              style={{
                                background: ach.unlocked ? 'rgba(16,185,129,0.10)' : c.surface2,
                                color: ach.unlocked ? '#10B981' : c.text3,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              <Star size={10} />
                              {ach.reward}
                            </div>
                          )}
                        </div>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Link to Trading Level */}
        <TrCard
          as="button"
          hover
          className="p-4 w-full"
          onClick={() => { hapticSelection(); navigate(`${prefix}/p2p/trading-level`); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <TrendingUp size={18} color="#3B82F6" />
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Xem cấp bậc giao dịch</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Nâng cấp để mở thêm quyền lợi</p>
              </div>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}