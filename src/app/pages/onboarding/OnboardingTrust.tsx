/**
 * Onboarding Trust Screen
 * 
 * Step 4: Trust & safety principles.
 * Builds confidence in the platform's safety-by-design approach.
 * Per Guidelines.md §1 — North Star Principles.
 * 
 * @module pages/onboarding/OnboardingTrust
 * @version 1.0 (Phase 3)
 */

import {
  Shield,
  Eye,
  Lock,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { φ, φSpace, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingTrustProps {
  onNext: () => void;
  onBack: () => void;
}

/* ═══════════════════════════════════════════
   TRUST PILLARS
   ═══════════════════════════════════════════ */

const TRUST_PILLARS = [
  {
    icon: Shield,
    title: 'An toàn theo thiết kế',
    description: 'Mọi giao dịch có preview, confirm, và trạng thái rõ ràng trước khi thực hiện.',
    color: '#10B981',
  },
  {
    icon: Eye,
    title: 'Minh bạch tuyệt đối',
    description: 'Phí, slippage, network — tất cả hiển thị đầy đủ trước khi bạn xác nhận.',
    color: '#3B82F6',
  },
  {
    icon: Lock,
    title: 'Bảo mật đa lớp',
    description: '2FA, biometrics, anti-phishing code, quản lý thiết bị & phiên đăng nhập.',
    color: '#8B5CF6',
  },
  {
    icon: AlertCircle,
    title: 'Không dark patterns',
    description: 'Không FOMO, không hype, không che giấu rủi ro. Thông tin trung thực, rõ ràng.',
    color: '#F59E0B',
  },
];

const COMMITMENTS = [
  'Preview đầy đủ trước mọi giao dịch',
  'Escrow tự động bảo vệ P2P',
  'Dispute resolution rõ quy trình',
  'Arena có governance & moderation',
  'Không hứa hẹn lợi nhuận',
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingTrust({
  onNext,
  onBack,
}: OnboardingTrustProps) {
  const c = useThemeColors();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Progress */}
      <OnboardingProgress currentStep="trust" />

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
          An toàn là ưu tiên số 1
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: φ.sm,
            color: c.text2,
            lineHeight: 1.5,
          }}
        >
          Nền tảng được xây dựng với nguyên tắc Trust-first
        </p>
      </div>

      {/* Trust Pillars */}
      <div className="flex-1 px-5" style={{ paddingTop: φSpace[3] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[3] }}>
          {TRUST_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3"
                style={{
                  padding: φSpace[4],
                  background: c.surface,
                  borderRadius: φRadius.sm,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: φRadius.xs,
                    background: `${pillar.color}15`,
                  }}
                >
                  <Icon size={20} color={pillar.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{
                    fontSize: φ.sm,
                    fontWeight: 600,
                    color: c.text1,
                    marginBottom: 3,
                  }}>
                    {pillar.title}
                  </p>
                  <p style={{
                    fontSize: 12,
                    color: c.text2,
                    lineHeight: 1.5,
                  }}>
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commitments */}
        <div
          style={{
            marginTop: φSpace[5],
            padding: φSpace[4],
            background: 'rgba(16,185,129,0.06)',
            borderRadius: φRadius.sm,
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <p style={{
            fontSize: φ.sm,
            fontWeight: 600,
            color: '#10B981',
            marginBottom: φSpace[3],
          }}>
            Cam kết của chúng tôi
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[2] }}>
            {COMMITMENTS.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#10B981" className="shrink-0" />
                <p style={{ fontSize: 12, color: c.text2, lineHeight: 1.4 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
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
            onClick={onNext}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              height: 48,
              borderRadius: φRadius.sm,
              background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
            }}
          >
            <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
              Tiếp theo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}