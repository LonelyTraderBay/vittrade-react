/**
 * Onboarding Goals Screen
 * 
 * Step 5: User selects goals/interests.
 * Personalizes the experience and helps route
 * the user to the most relevant first action.
 * 
 * @module pages/onboarding/OnboardingGoals
 * @version 1.0 (Phase 3)
 */

import { useState } from 'react';
import {
  TrendingUp,
  Repeat,
  Users,
  BarChart3,
  Trophy,
  Gift,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import type { UserGoal } from '../../services/OnboardingService';
import { φ, φSpace, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingGoalsProps {
  onNext: (goals: UserGoal[]) => void;
  onBack: () => void;
  initialGoals?: UserGoal[];
}

/* ═══════════════════════════════════════════
   GOAL OPTIONS
   ═══════════════════════════════════════════ */

interface GoalOption {
  id: UserGoal;
  icon: typeof TrendingUp;
  label: string;
  description: string;
  color: string;
  disclosure?: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'trade-crypto',
    icon: TrendingUp,
    label: 'Giao dịch Crypto',
    description: 'Mua/bán, Spot trading',
    color: '#3B82F6',
  },
  {
    id: 'save-regularly',
    icon: Repeat,
    label: 'Tiết kiệm định kỳ',
    description: 'DCA, đầu tư tự động',
    color: '#10B981',
  },
  {
    id: 'p2p-exchange',
    icon: Users,
    label: 'Giao dịch P2P',
    description: 'Mua/bán trực tiếp',
    color: '#F59E0B',
  },
  {
    id: 'predict-events',
    icon: BarChart3,
    label: 'Prediction Markets',
    description: 'Dự đoán sự kiện',
    color: '#8B5CF6',
  },
  {
    id: 'arena-challenges',
    icon: Trophy,
    label: 'Arena Challenges',
    description: 'Thử thách cộng đồng',
    color: '#EC4899',
    disclosure: 'Arena Points only',
  },
  {
    id: 'earn-rewards',
    icon: Gift,
    label: 'Kiếm thưởng',
    description: 'Staking, referral',
    color: '#06B6D4',
  },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingGoals({
  onNext,
  onBack,
  initialGoals = [],
}: OnboardingGoalsProps) {
  const c = useThemeColors();
  const [selected, setSelected] = useState<UserGoal[]>(initialGoals);

  const toggleGoal = (goalId: UserGoal) => {
    setSelected((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    onNext(selected);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Progress */}
      <OnboardingProgress currentStep="goals" />

      {/* Header */}
      <div style={{ padding: `${φSpace[3]}px ${φSpace[5]}px` }}>
        <h1
          className="text-center"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: c.text1,
            marginBottom: φSpace[2],
            lineHeight: 1.2,
          }}
        >
          Bạn muốn làm gì?
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: φ.sm,
            color: c.text2,
            lineHeight: 1.5,
          }}
        >
          Chọn một hoặc nhiều mục tiêu để cá nhân hóa trải nghiệm
        </p>
      </div>

      {/* Goal Grid */}
      <div className="flex-1 px-5" style={{ paddingTop: φSpace[3] }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: φSpace[3],
          }}
        >
          {GOAL_OPTIONS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selected.includes(goal.id);

            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className="text-left transition-all"
                style={{
                  position: 'relative',
                  padding: φSpace[4],
                  background: isSelected ? `${goal.color}10` : c.surface,
                  border: `1.5px solid ${isSelected ? goal.color : c.border}`,
                  borderRadius: φRadius.md,
                  outline: 'none',
                }}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: goal.color,
                    }}
                  >
                    <Check size={12} color="white" />
                  </div>
                )}

                {/* Icon */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: φRadius.xs,
                    background: `${goal.color}18`,
                    marginBottom: φSpace[3],
                  }}
                >
                  <Icon size={20} color={goal.color} />
                </div>

                {/* Label */}
                <p style={{
                  fontSize: φ.sm,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: 2,
                }}>
                  {goal.label}
                </p>

                {/* Description */}
                <p style={{
                  fontSize: 11,
                  color: c.text3,
                  lineHeight: 1.3,
                }}>
                  {goal.description}
                </p>

                {/* Disclosure badge */}
                {goal.disclosure && (
                  <div
                    style={{
                      marginTop: φSpace[2],
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${goal.color}15`,
                      display: 'inline-block',
                    }}
                  >
                    <p style={{ fontSize: 9, color: goal.color, fontWeight: 500 }}>
                      {goal.disclosure}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        <p
          className="text-center"
          style={{
            marginTop: φSpace[4],
            fontSize: 12,
            color: c.text3,
          }}
        >
          {selected.length === 0
            ? 'Bạn có thể bỏ qua bước này'
            : `Đã chọn ${selected.length} mục tiêu`}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ padding: φSpace[5] }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center transition-all"
            style={{
              width: 48,
              height: 48,
              borderRadius: φRadius.sm,
              background: c.surface2,
            }}
          >
            <ChevronLeft size={20} color={c.text2} />
          </button>

          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              height: 48,
              borderRadius: φRadius.sm,
              background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
            }}
          >
            <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
              {selected.length > 0 ? 'Hoàn tất' : 'Bỏ qua'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}