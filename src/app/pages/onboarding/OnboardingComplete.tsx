/**
 * Onboarding Complete Screen
 * 
 * Step 6: Completion with personalized recommendations.
 * Shows summary of selected goals and suggests first action.
 * 
 * @module pages/onboarding/OnboardingComplete
 * @version 1.0 (Phase 3)
 */

import {
  CheckCircle2,
  TrendingUp,
  Repeat,
  Users,
  BarChart3,
  Trophy,
  Gift,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { UserGoal } from '../../services/OnboardingService';
import { φ, φSpace, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingCompleteProps {
  selectedGoals: UserGoal[];
  onFinish: () => void;
  onGoToRoute: (route: string) => void;
}

/* ═══════════════════════════════════════════
   RECOMMENDATION DATA
   ═══════════════════════════════════════════ */

interface Recommendation {
  title: string;
  description: string;
  route: string;
  color: string;
  icon: typeof TrendingUp;
}

const GOAL_RECOMMENDATIONS: Record<UserGoal, Recommendation> = {
  'trade-crypto': {
    title: 'Giao dịch đầu tiên',
    description: 'Mua hoặc bán crypto nhanh chóng',
    route: '/trade/BTCUSDT',
    color: '#3B82F6',
    icon: TrendingUp,
  },
  'save-regularly': {
    title: 'Tạo kế hoạch DCA',
    description: 'Thiết lập đầu tư định kỳ tự động',
    route: '/dca',
    color: '#10B981',
    icon: Repeat,
  },
  'p2p-exchange': {
    title: 'Khám phá P2P',
    description: 'Tìm offer tốt nhất từ cộng đồng',
    route: '/p2p',
    color: '#F59E0B',
    icon: Users,
  },
  'predict-events': {
    title: 'Xem Prediction Markets',
    description: 'Khám phá các sự kiện dự đoán',
    route: '/markets',
    color: '#8B5CF6',
    icon: BarChart3,
  },
  'arena-challenges': {
    title: 'Tham gia Arena',
    description: 'Khám phá thử thách cộng đồng',
    route: '/home',
    color: '#EC4899',
    icon: Trophy,
  },
  'earn-rewards': {
    title: 'Kiếm thưởng ngay',
    description: 'Staking và referral programs',
    route: '/home',
    color: '#06B6D4',
    icon: Gift,
  },
};

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingComplete({
  selectedGoals,
  onFinish,
  onGoToRoute,
}: OnboardingCompleteProps) {
  const c = useThemeColors();

  // Get recommendations based on selected goals
  const recommendations = selectedGoals
    .map((goal) => GOAL_RECOMMENDATIONS[goal])
    .filter(Boolean)
    .slice(0, 3);

  const primaryAction = recommendations[0] || {
    title: 'Khám phá trang chủ',
    description: 'Bắt đầu hành trình của bạn',
    route: '/home',
    color: '#8B5CF6',
    icon: Sparkles,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Success Animation Area */}
      <div
        className="flex flex-col items-center justify-center"
        style={{ paddingTop: 60, paddingBottom: φSpace[5] }}
      >
        {/* Success Icon */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            marginBottom: φSpace[5],
          }}
        >
          <CheckCircle2 size={44} color="white" />
        </div>

        {/* Title */}
        <h1
          className="text-center"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: c.text1,
            marginBottom: φSpace[2],
            lineHeight: 1.2,
          }}
        >
          Sẵn sàng!
        </h1>

        {/* Subtitle */}
        <p
          className="text-center"
          style={{
            fontSize: φ.sm,
            color: c.text2,
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          {selectedGoals.length > 0
            ? 'Trải nghiệm đã được cá nhân hóa theo mục tiêu của bạn'
            : 'Bạn đã sẵn sàng khám phá toàn bộ nền tảng'}
        </p>
      </div>

      {/* Recommendations */}
      <div className="flex-1 px-5">
        {recommendations.length > 0 && (
          <div>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: c.text3,
              textTransform: 'uppercase' as const,
              letterSpacing: 0.5,
              marginBottom: φSpace[3],
            }}>
              Đề xuất cho bạn
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[3] }}>
              {recommendations.map((rec, idx) => {
                const Icon = rec.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onFinish();
                      onGoToRoute(rec.route);
                    }}
                    className="w-full text-left flex items-center gap-3 transition-all"
                    style={{
                      padding: φSpace[4],
                      background: c.surface,
                      borderRadius: φRadius.sm,
                      border: `1px solid ${idx === 0 ? rec.color + '40' : c.border}`,
                      outline: 'none',
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: φRadius.xs,
                        background: `${rec.color}15`,
                      }}
                    >
                      <Icon size={22} color={rec.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontSize: φ.sm,
                        fontWeight: 600,
                        color: c.text1,
                        marginBottom: 2,
                      }}>
                        {rec.title}
                      </p>
                      <p style={{ fontSize: 12, color: c.text2 }}>
                        {rec.description}
                      </p>
                    </div>
                    <ArrowRight size={16} color={c.text3} className="shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security reminder */}
        <div
          style={{
            marginTop: φSpace[5],
            padding: φSpace[4],
            background: 'rgba(59,130,246,0.06)',
            borderRadius: φRadius.sm,
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <p style={{ fontSize: 12, color: c.text2, lineHeight: 1.5 }}>
            Bạn có thể thiết lập bảo mật nâng cao (2FA, biometrics) bất kỳ lúc nào trong{' '}
            <span style={{ color: c.primary, fontWeight: 500 }}>Cài đặt bảo mật</span>.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: φSpace[5] }}>
        <button
          onClick={() => {
            onFinish();
            onGoToRoute(primaryAction.route);
          }}
          className="w-full flex items-center justify-center gap-2 transition-all"
          style={{
            height: 52,
            borderRadius: φRadius.sm,
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
          }}
        >
          <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
            Bắt đầu sử dụng
          </span>
          <ArrowRight size={18} color="white" />
        </button>

        <button
          onClick={() => {
            onFinish();
            onGoToRoute('/home');
          }}
          className="w-full flex items-center justify-center transition-all"
          style={{
            marginTop: φSpace[3],
            height: 44,
            borderRadius: φRadius.sm,
          }}
        >
          <span style={{ color: c.text3, fontSize: φ.sm }}>
            Về trang chủ
          </span>
        </button>
      </div>
    </div>
  );
}