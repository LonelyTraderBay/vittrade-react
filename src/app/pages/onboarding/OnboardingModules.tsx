/**
 * Onboarding Modules Screen
 * 
 * Introduces the 5 core modules.
 * Swipeable carousel with module cards.
 * 
 * @module pages/onboarding/OnboardingModules
 * @version 1.0 (Phase 3)
 */

import { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Users,
  BarChart3,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { φ } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingModulesProps {
  onNext: () => void;
  onBack: () => void;
}

/* ═══════════════════════════════════════════
   MODULE DATA
   ═══════════════════════════════════════════ */

const MODULES = [
  {
    id: 'trading',
    icon: TrendingUp,
    name: 'Trading',
    description: 'Giao dịch Crypto Spot',
    features: [
      'Mua/bán crypto nhanh chóng',
      'Biểu đồ giá realtime',
      'DCA tự động',
      'Portfolio tracking',
    ],
    color: '#3B82F6',
  },
  {
    id: 'wallet',
    icon: Wallet,
    name: 'Wallet',
    description: 'Quản lý tài sản',
    features: [
      'Nạp/rút crypto & fiat',
      'Lịch sử giao dịch',
      'Bảo mật đa lớp',
      'Hỗ trợ đa loại tài sản',
    ],
    color: '#10B981',
  },
  {
    id: 'p2p',
    icon: Users,
    name: 'P2P',
    description: 'Giao dịch ngang hàng',
    features: [
      'Mua/bán trực tiếp',
      'Escrow tự động',
      'Nhiều phương thức thanh toán',
      'Rating & review',
    ],
    color: '#F59E0B',
  },
  {
    id: 'prediction',
    icon: BarChart3,
    name: 'Prediction Markets',
    description: 'Dự đoán sự kiện',
    features: [
      'Thị trường dự đoán',
      'Xác suất realtime',
      'Portfolio & P/L',
      'Leaderboard',
    ],
    color: '#8B5CF6',
  },
  {
    id: 'arena',
    icon: Trophy,
    name: 'Open Arena',
    description: 'Thử thách cộng đồng',
    features: [
      'Tạo/tham gia challenges',
      'Arena Points (không phải tiền)',
      'Creator tools',
      'Community-driven',
    ],
    color: '#EC4899',
  },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingModules({
  onNext,
  onBack,
}: OnboardingModulesProps) {
  const c = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentModule = MODULES[currentIndex];
  const Icon = currentModule.icon;
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < MODULES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Progress */}
      <OnboardingProgress currentStep="modules" />
      
      {/* Header */}
      <div className="px-5 py-4">
        <h1
          className="text-center mb-2"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: c.text1,
          }}
        >
          Khám phá 5 modules
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: 13,
            color: c.text2,
          }}
        >
          Mỗi module phục vụ một nhu cầu khác nhau
        </p>
      </div>
      
      {/* Module Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: `linear-gradient(135deg, ${currentModule.color} 0%, ${currentModule.color}CC 100%)`,
            }}
          >
            <Icon size={40} color="white" />
          </div>
          
          {/* Name */}
          <h2
            className="text-center mb-2"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: currentModule.color,
            }}
          >
            {currentModule.name}
          </h2>
          
          {/* Description */}
          <p
            className="text-center mb-6"
            style={{
              fontSize: φ.sm,
              color: c.text2,
            }}
          >
            {currentModule.description}
          </p>
          
          {/* Features */}
          <div className="space-y-3">
            {currentModule.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: currentModule.color }}
                />
                <p style={{ color: c.text1, fontSize: 13 }}>
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="flex items-center justify-center gap-2 py-4">
        {MODULES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="transition-all"
            style={{
              width: idx === currentIndex ? 24 : 6,
              height: 6,
              borderRadius: 3,
              background: idx === currentIndex ? currentModule.color : c.divider,
            }}
          />
        ))}
      </div>
      
      {/* Navigation */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-all"
            style={{ background: c.surface2 }}
          >
            <ChevronLeft size={20} color={c.text2} />
          </button>
          
          {currentIndex < MODULES.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{ background: currentModule.color }}
            >
              <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
                Tiếp theo
              </span>
              <ChevronRight size={20} color="white" />
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 py-4 rounded-xl transition-all"
              style={{
                background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
              }}
            >
              <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
                Đã hiểu
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}