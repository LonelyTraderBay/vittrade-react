import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, FileText, AlertTriangle,
  ChevronRight, ChevronLeft, X, CheckCircle,
  Target, Zap, Star, TrendingUp,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φSpace } from '../../utils/golden';
import { useHaptic } from '../../hooks/useHaptic';
import { CTAButton } from '../ui/CTAButton';
import { useABTest } from '../../hooks/useABTest';
import { useTourProgress } from '../../hooks/useTourProgress';

/* ═══════════════════════════════════════════════════════════
   InsuranceOnboardingTour — Guided walkthrough with personalized tips
   + TIER 7.2: A/B Testing for personalized tips
   + TIER 7.3: Persistent progress with resume capability
   ═══════════════════════════════════════════════════════════ */

type UserTier = 'basic' | 'verified' | 'pro' | 'elite';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  tips: string[];
  personalizedTips?: string[];
}

interface UserProfile {
  tier: UserTier;
  tradingVolume30d: number;
  totalTrades: number;
  kycLevel: number;
  has2FA: boolean;
  claimCount: number;
  accountAgeDays: number;
}

const DEFAULT_USER: UserProfile = {
  tier: 'pro',
  tradingVolume30d: 125_000_000,
  totalTrades: 47,
  kycLevel: 2,
  has2FA: true,
  claimCount: 2,
  accountAgeDays: 180,
};

/* ─── Personalization engine ─── */

function getPersonalizedTips(stepId: string, user: UserProfile, variant: 'A' | 'B'): string[] {
  const tips: string[] = [];

  switch (stepId) {
    case 'welcome': {
      if (user.totalTrades > 30) {
        tips.push(`Bạn đã hoàn thành ${user.totalTrades} giao dịch — mọi GD đều được bảo vệ tự động`);
      }
      if (user.tradingVolume30d > 100_000_000) {
        tips.push('Với khối lượng GD cao, bảo hiểm là lớp phòng vệ quan trọng');
      }
      if (user.tier === 'basic') {
        tips.push('Hoàn tất KYC để bắt đầu được bảo hiểm — tier Thường chưa có bảo hiểm');
      }
      if (user.accountAgeDays < 30) {
        tips.push('Bạn là thành viên mới — hãy đọc kỹ các bước để bảo vệ tài khoản');
      } else if (user.accountAgeDays > 90) {
        tips.push(`${user.accountAgeDays} ngày thành viên — cảm ơn bạn đã tin tưởng sử dụng`);
      }
      break;
    }
    case 'tiers': {
      const tierProgress: Record<UserTier, string> = {
        basic: 'Hoàn tất KYC Level 1 để lên tier Xác minh và được bảo hiểm 70%',
        verified: 'Bật 2FA và nâng KYC Level 2 để lên tier Pro với bảo hiểm 85%',
        pro: 'Bạn đang ở tier Pro (85%) — duy trì trading để hướng tiêu chí nâng Elite',
        elite: 'Bạn đã đạt tier cao nhất — bảo hiểm 100% + 10% bonus!',
      };
      tips.push(tierProgress[user.tier]);

      if (user.tier !== 'elite' && user.tradingVolume30d > 50_000_000) {
        tips.push('Khối lượng GD của bạn đang tốt — tiếp tục để có cơ hội nâng tier');
      }
      if (!user.has2FA && user.tier !== 'basic') {
        tips.push('Bật 2FA ngay để tăng bảo mật và tiêu chí nâng tier');
      }
      if (user.kycLevel < 2) {
        tips.push(`KYC hiện tại: Level ${user.kycLevel} — nâng lên Level 2 để mở khóa tier Pro`);
      }
      break;
    }
    case 'claims': {
      if (user.claimCount > 0) {
        tips.push(`Bạn đã gửi ${user.claimCount} yêu cầu trước đó — có thể tham khảo lịch sử để gửi nhanh hơn`);
      } else {
        tips.push('Đây là lần đầu — đừng lo, quy trình gửi yêu cầu rất đơn giản');
      }
      if (user.tier === 'pro' || user.tier === 'elite') {
        tips.push('Tier của bạn được ưu tiên xử lý nhanh hơn (SLA 48h thay vì 72h)');
      }
      if (user.tradingVolume30d > 50_000_000) {
        tips.push('Trader hoạt động tích cực như bạn thường có tỷ lệ duyệt cao hơn');
      }
      break;
    }
    case 'safety': {
      if (!user.has2FA) {
        tips.push('QUAN TRỌNG: Bật 2FA ngay để tăng bảo mật và tỷ lệ bồi thường');
      }
      if (user.totalTrades > 20) {
        tips.push('Với kinh nghiệm của bạn, hãy chú ý kiểm tra merchant rating trước GD');
      }
      if (user.tradingVolume30d > 100_000_000) {
        tips.push('GD khối lượng lớn — chia nhỏ GD để giảm rủi ro');
      }
      if (user.accountAgeDays < 60) {
        tips.push('Thành viên mới thường là mục tiêu của scam — luôn cảnh giác');
      }
      break;
    }
    case 'features': {
      if (user.tier === 'pro' || user.tier === 'elite') {
        tips.push('Điểm bảo vệ của bạn đang cao — xem chi tiết trong mục Protection Score');
      }
      if (user.claimCount > 0) {
        tips.push('Sử dụng Benchmarks để so sánh claim mới với các claim trước của bạn');
      }
      if (user.tradingVolume30d > 0) {
        tips.push('Tải Chứng nhận bảo hiểm để có bằng chứng bảo vệ cho đối tác');
      }
      tips.push('SLA Tracker giúp bạn theo dõi chính xác thời gian xử lý còn lại');
      break;
    }
  }

  // TIER 7.2: Variant B gets enhanced tips with actionable CTAs
  if (variant === 'B' && tips.length > 0) {
    // Add actionable suffix to first tip of each step
    switch (stepId) {
      case 'welcome':
        if (user.tier === 'basic') {
          tips[0] += ' → Bắt đầu KYC ngay';
        }
        break;
      case 'tiers':
        if (!user.has2FA) {
          tips.push('→ Cài đặt 2FA mất 2 phút, tăng bảo mật 200%');
        }
        break;
      case 'claims':
        tips.push('→ Lưu số hotline support: 1900-xxxx để hỗ trợ 24/7');
        break;
      case 'safety':
        tips.push('→ Tải checklist an toàn P2P ngay bây giờ');
        break;
      case 'features':
        tips.push('→ Khởi động Protection Score ngay để xem điểm cá nhân');
        break;
    }
  }

  return tips;
}

function buildTourSteps(user: UserProfile, variant: 'A' | 'B'): TourStep[] {
  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Chào mừng đến Quỹ Bảo Hiểm P2P',
      description: 'Quỹ bảo hiểm P2P bảo vệ bạn khi giao dịch P2P gặp sự cố. Mỗi giao dịch của bạn đều được trích một phần nhỏ vào quỹ để đảm bảo an toàn cho cộng đồng.',
      icon: Shield,
      iconColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.1)',
      tips: [
        'Quỹ được trích từ 0.1% mỗi giao dịch',
        'Hoàn toàn tự động — không cần đăng ký',
        'Bảo vệ cả buyer và seller',
      ],
    },
    {
      id: 'tiers',
      title: 'Hệ thống Tier bảo hiểm',
      description: 'Mức bảo hiểm phụ thuộc vào tier của bạn. Tier càng cao, tỷ lệ bồi thường càng lớn. Hoàn thành KYC và bật 2FA để nâng tier.',
      icon: Target,
      iconColor: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.1)',
      tips: [
        'Thường: Không có bảo hiểm',
        'Xác minh (KYC Level 1): Bảo hiểm 70%',
        'Pro (KYC Level 2 + 2FA): Bảo hiểm 85%',
        'Elite (VIP): Bảo hiểm 100% + 10% bonus',
      ],
    },
    {
      id: 'claims',
      title: 'Cách gửi yêu cầu bồi thường',
      description: 'Khi gặp sự cố trong giao dịch P2P, bạn có thể gửi yêu cầu bồi thường trong vòng 7 ngày. Hệ thống sẽ xem xét và phản hồi trong 48-72 giờ.',
      icon: FileText,
      iconColor: '#10B981',
      iconBg: 'rgba(16,185,129,0.1)',
      tips: [
        'Gửi yêu cầu trong tab "Yêu cầu của tôi"',
        'Đính kèm bằng chứng rõ ràng (ảnh chụp màn hình, biên lai)',
        'Mô tả chi tiết sự cố để xử lý nhanh hơn',
        'Theo dõi tiến độ qua SLA Tracker thực thời',
      ],
    },
    {
      id: 'safety',
      title: 'Phòng chống gian lận',
      description: 'An toàn là ưu tiên hàng đầu. Hiểu các dấu hiệu scam phổ biến và làm theo checklist an toàn trước mỗi giao dịch.',
      icon: AlertTriangle,
      iconColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.1)',
      tips: [
        'Không bao giờ giao dịch ngoài nền tảng',
        'Kiểm tra kỹ thông tin merchant trước khi giao dịch',
        'Chỉ bấm \"Đã thanh toán\" khi đã chuyển tiền thật',
        'Báo cáo ngay khi phát hiện dấu hiệu bất thường',
      ],
    },
    {
      id: 'features',
      title: 'Các tính năng nâng cao',
      description: 'Khám phá thêm các công cụ giúp bạn quản lý bảo hiểm tốt hơn: Điểm bảo vệ, Chứng nhận bảo hiểm, Lịch sử đóng góp, và So sánh benchmark.',
      icon: Zap,
      iconColor: '#6366F1',
      iconBg: 'rgba(99,102,241,0.1)',
      tips: [
        'Điểm bảo vệ: Xem điểm cá nhân và lộ trình nâng tier',
        'Chứng nhận: Tải và chia sẻ chứng nhận bảo hiểm',
        'Benchmarks: So sánh claim với trung bình nền tảng',
        'SLA Tracker: Theo dõi countdown xử lý thực thời',
      ],
    },
  ];

  return steps.map(step => ({
    ...step,
    personalizedTips: getPersonalizedTips(step.id, user, variant),
  }));
}

interface InsuranceOnboardingTourProps {
  /** Whether to show the tour */
  open: boolean;
  /** Called when tour is completed or dismissed */
  onClose: () => void;
  /** User profile for personalized tips */
  userProfile?: UserProfile;
}

export function InsuranceOnboardingTour({ open, onClose, userProfile }: InsuranceOnboardingTourProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [sheetVisible, setSheetVisible] = useState(false);

  const user = userProfile || DEFAULT_USER;
  
  // TIER 7.2: A/B test for personalized tips variant
  const { variant: abVariant, trackConversion } = useABTest(
    'insurance_tour_personalization',
    { userId: `user_${user.tier}_${user.accountAgeDays}` }
  );
  // Map to expected interface
  const variant = { id: abVariant || 'A' };
  const trackCTAClick = () => trackConversion('cta_click');
  const markCompleted = () => trackConversion('completed');
  const markSkipped = () => trackConversion('skipped');

  // TIER 7.3: Persistent tour progress
  const {
    progress,
    goToNextStep: advanceTourProgress,
    goToPreviousStep: retreatTourProgress,
    markCompleted: completeTour,
    markSkipped: skipTour,
    shouldShowResumePrompt,
  } = useTourProgress({
    tourId: 'p2p_insurance_onboarding',
    totalSteps: 5,
    resumeWindowHours: 24,
    variant: variant.id,
  });

  // Use tour progress currentStep instead of local state
  const currentStep = progress.currentStep;

  const tourSteps = useMemo(() => buildTourSteps(user, variant.id), [
    user.tier, user.tradingVolume30d, user.totalTrades,
    user.kycLevel, user.has2FA, user.claimCount, user.accountAgeDays,
    variant.id,
  ]);

  // Step duration tracking for A/B test
  const stepStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) {
      stepStartTimeRef.current = Date.now();
    }
  }, [currentStep, open]);

  // Animate sheet entrance
  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setSheetVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setSheetVisible(false);
    }
  }, [open]);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const goNext = () => {
    // Track step duration for A/B test
    const stepDuration = Date.now() - stepStartTimeRef.current;
    trackCTAClick(); // Track CTA engagement
    
    if (isLast) {
      hapticSuccess();
      completeTour(); // Mark tour as completed in progress
      markCompleted(); // Mark A/B test as completed
      setSheetVisible(false);
      setTimeout(onClose, 300);
      return;
    }
    
    hapticSelection();
    setSlideDir(1);
    setAnimating(true);
    setTimeout(() => {
      advanceTourProgress(); // Advance tour progress (persisted)
      setAnimating(false);
      stepStartTimeRef.current = Date.now(); // Reset timer for next step
    }, 200);
  };

  const goPrev = () => {
    if (isFirst) return;
    hapticSelection();
    setSlideDir(-1);
    setAnimating(true);
    setTimeout(() => {
      retreatTourProgress(); // Go back in tour progress
      setAnimating(false);
      stepStartTimeRef.current = Date.now();
    }, 200);
  };

  const handleSkip = () => {
    hapticSelection();
    skipTour(); // Mark as skipped in progress
    markSkipped(); // Mark A/B test as skipped
    setSheetVisible(false);
    setTimeout(onClose, 300);
  };

  if (!open) return null;

  const StepIcon = step.icon;
  const hasPersonalized = step.personalizedTips && step.personalizedTips.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        background: sheetVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{
          background: c.bg,
          maxHeight: '85vh',
          transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Top bar: progress + close */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-2 flex-1">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-full"
                style={{
                  height: 3,
                  background: idx <= currentStep ? '#3B82F6' : c.surface2,
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="ml-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: c.surface2 }}
            aria-label="Đóng tour"
          >
            <X size={16} color={c.text3} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 mb-1">
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
            {currentStep + 1} / {tourSteps.length}
          </span>
        </div>

        {/* Content — CSS animated transitions */}
        <div
          className="flex-1 px-5 pb-6 overflow-y-auto"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? `translateX(${slideDir * 30}px)` : 'translateX(0)',
            transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Icon */}
          <div className="flex justify-center my-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: step.iconBg }}
            >
              <StepIcon size={36} color={step.iconColor} strokeWidth={1.5} />
            </div>
          </div>

          {/* Title + Description */}
          <h2 style={{
            color: c.text1,
            fontSize: φ.md,
            fontWeight: 800,
            lineHeight: 1.3,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {step.title}
          </h2>
          <p style={{
            color: c.text2,
            fontSize: φ.body,
            lineHeight: 1.6,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            {step.description}
          </p>

          {/* Personalized Tips — shown first if available */}
          {hasPersonalized && (
            <div
              className="rounded-2xl p-4 flex flex-col mb-3"
              style={{
                background: 'rgba(59,130,246,0.04)',
                border: '1px solid rgba(59,130,246,0.12)',
                gap: φSpace[3],
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Star size={13} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                  Danh cho bạn
                </span>
              </div>
              {step.personalizedTips!.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <TrendingUp size={11} color="#3B82F6" />
                  </div>
                  <span style={{
                    color: c.text1,
                    fontSize: φ.sm,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Standard Tips */}
          <div
            className="rounded-2xl p-4 flex flex-col"
            style={{ background: c.surface2, gap: φSpace[3] }}
          >
            {hasPersonalized && (
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={13} color={step.iconColor} />
                <span style={{ color: step.iconColor, fontSize: 11, fontWeight: 700 }}>
                  Thông tin chung
                </span>
              </div>
            )}
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: step.iconBg }}
                >
                  <CheckCircle size={13} color={step.iconColor} />
                </div>
                <span style={{
                  color: c.text1,
                  fontSize: φ.sm,
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div
          className="px-5 pb-8 pt-3 flex items-center gap-3"
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${c.divider}`,
          }}
        >
          {!isFirst ? (
            <button
              onClick={goPrev}
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 52,
                height: 52,
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                borderRadius: 14,
              }}
              aria-label="Quay lại"
            >
              <ChevronLeft size={20} color={c.text2} />
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-4 py-3 rounded-2xl"
              style={{
                background: 'transparent',
                color: c.text3,
                fontSize: φ.body,
                fontWeight: 600,
              }}
            >
              Bỏ qua
            </button>
          )}

          <div className="flex-1">
            <CTAButton onClick={goNext}>
              <div className="flex items-center justify-center gap-2">
                <span>{isLast ? 'Bắt đầu sử dụng' : 'Tiếp tục'}</span>
                {!isLast && <ChevronRight size={18} strokeWidth={2.5} />}
              </div>
            </CTAButton>
          </div>
        </div>
      </div>
    </div>
  );
}