/**
 * Onboarding Welcome Screen
 * 
 * First screen in onboarding flow.
 * Welcomes user and sets expectations.
 * 
 * @module pages/onboarding/OnboardingWelcome
 * @version 1.0 (Phase 3)
 */

import { Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingWelcomeProps {
  onNext: () => void;
  onSkip: () => void;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingWelcome({
  onNext,
  onSkip,
}: OnboardingWelcomeProps) {
  const c = useThemeColors();
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onSkip}
          style={{ color: c.text3, fontSize: 13 }}
        >
          Bỏ qua
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        {/* Logo/Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
          }}
        >
          <Sparkles size={40} color="white" />
        </div>
        
        {/* Title */}
        <h1
          className="text-center mb-3"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: c.text1,
            lineHeight: 1.2,
          }}
        >
          Chào mừng đến với<br />Trading App
        </h1>
        
        {/* Subtitle */}
        <p
          className="text-center mb-10"
          style={{
            fontSize: φ.base,
            color: c.text2,
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          Nền tảng toàn diện cho Trading, P2P, Prediction Markets và Arena Challenges
        </p>
        
        {/* Features */}
        <div className="space-y-4 w-full max-w-sm mb-10">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)' }}
            >
              <TrendingUp size={20} color="#3B82F6" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                Giao dịch đa dạng
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                Spot, P2P, Prediction Markets - tất cả trong một
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)' }}
            >
              <Shield size={20} color="#10B981" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                An toàn & Minh bạch
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                Bảo mật tối đa, rõ ràng từng giao dịch
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)' }}
            >
              <Zap size={20} color="#8B5CF6" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                Tính năng thông minh
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                DCA tự động, Rebalance, Smart Scheduling
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="p-5">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl transition-all"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
          }}
        >
          <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
            Bắt đầu
          </span>
        </button>
        
        <p
          className="text-center mt-3"
          style={{ color: c.text3, fontSize: 11 }}
        >
          Chỉ mất 1 phút để hoàn thành
        </p>
      </div>
    </div>
  );
}