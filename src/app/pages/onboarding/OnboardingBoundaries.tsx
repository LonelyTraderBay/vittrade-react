/**
 * Onboarding Boundaries Screen
 * 
 * Step 3: Teaches module boundaries.
 * Trading/P2P = value-based vs Arena = points-only.
 * Critical per Guidelines.md §6 — Module boundaries.
 * 
 * @module pages/onboarding/OnboardingBoundaries
 * @version 1.0 (Phase 3)
 */

import { useState } from 'react';
import {
  TrendingUp,
  Trophy,
  Shield,
  AlertTriangle,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { φ, φSpace, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingBoundariesProps {
  onNext: () => void;
  onBack: () => void;
}

/* ═══════════════════════════════════════════
   BOUNDARY DATA
   ═══════════════════════════════════════════ */

interface BoundaryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
  color: string;
  nature: string;
  examples: string[];
}

const BOUNDARIES: BoundaryItem[] = [
  {
    id: 'value',
    title: 'Trading & P2P',
    subtitle: 'Giá trị thực — Wallet liên kết',
    icon: TrendingUp,
    color: '#3B82F6',
    nature: 'Market / Value-based',
    examples: [
      'Giao dịch Spot, P2P — dùng crypto/fiat thật',
      'Prediction Markets — positions có giá trị',
      'Wallet balance, PnL, lịch sử giao dịch',
    ],
  },
  {
    id: 'points',
    title: 'Open Arena',
    subtitle: 'Arena Points — Không liên quan wallet',
    icon: Trophy,
    color: '#EC4899',
    nature: 'Social / Points-only',
    examples: [
      'Thử thách cộng đồng dùng Arena Points',
      'Không ảnh hưởng số dư wallet',
      'Không phải tài sản tài chính',
    ],
  },
];

const SEPARATION_RULES = [
  'Wallet và Arena Points tách biệt hoàn toàn',
  'PnL Trading không gộp với điểm Arena',
  'Leaderboard Trading và Arena riêng biệt',
  'Không có chuyển đổi điểm ↔ tiền',
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingBoundaries({
  onNext,
  onBack,
}: OnboardingBoundariesProps) {
  const c = useThemeColors();
  const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Progress */}
      <OnboardingProgress currentStep="boundaries" />

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
          Ranh giới rõ ràng
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: φ.sm,
            color: c.text2,
            lineHeight: 1.5,
          }}
        >
          Hiểu sự khác biệt giữa các module để sử dụng an toàn
        </p>
      </div>

      {/* Boundary Cards */}
      <div className="flex-1 px-5" style={{ paddingTop: φSpace[4] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[4] }}>
          {BOUNDARIES.map((boundary) => {
            const Icon = boundary.icon;
            const isSelected = selectedBoundary === boundary.id;

            return (
              <button
                key={boundary.id}
                onClick={() => setSelectedBoundary(isSelected ? null : boundary.id)}
                className="w-full text-left transition-all"
                style={{
                  background: c.surface,
                  border: `1px solid ${isSelected ? boundary.color : c.border}`,
                  borderRadius: φRadius.md,
                  padding: φSpace[4],
                  outline: 'none',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3" style={{ marginBottom: φSpace[3] }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: φRadius.sm,
                      background: `${boundary.color}20`,
                    }}
                  >
                    <Icon size={22} color={boundary.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: φ.base, fontWeight: 600, color: c.text1, marginBottom: 2 }}>
                      {boundary.title}
                    </p>
                    <p style={{ fontSize: 11, color: boundary.color, fontWeight: 500 }}>
                      {boundary.nature}
                    </p>
                  </div>
                </div>

                {/* Subtitle */}
                <p style={{ fontSize: φ.sm, color: c.text2, marginBottom: φSpace[3], lineHeight: 1.4 }}>
                  {boundary.subtitle}
                </p>

                {/* Examples (expanded) */}
                {isSelected && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[2] }}>
                    {boundary.examples.map((example, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check
                          size={14}
                          color={boundary.color}
                          className="shrink-0"
                          style={{ marginTop: 2 }}
                        />
                        <p style={{ fontSize: 12, color: c.text2, lineHeight: 1.4 }}>
                          {example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tap hint */}
                {!isSelected && (
                  <p style={{ fontSize: 11, color: c.text3 }}>
                    Chạm để xem chi tiết
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Separation Rules */}
        <div
          style={{
            marginTop: φSpace[5],
            padding: φSpace[4],
            background: 'rgba(245,158,11,0.08)',
            borderRadius: φRadius.sm,
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: φSpace[3] }}>
            <AlertTriangle size={16} color="#F59E0B" />
            <p style={{ fontSize: φ.sm, fontWeight: 600, color: '#F59E0B' }}>
              Quy tắc tách biệt
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: φSpace[2] }}>
            {SEPARATION_RULES.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Shield size={12} color="#F59E0B" className="shrink-0" style={{ marginTop: 2 }} />
                <p style={{ fontSize: 12, color: c.text2, lineHeight: 1.4 }}>
                  {rule}
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
              Đã hiểu
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}