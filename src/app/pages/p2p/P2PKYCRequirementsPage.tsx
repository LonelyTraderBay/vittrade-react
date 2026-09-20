/**
 * ══════════════════════════════════════════════════════════
 *  P2PKYCRequirementsPage — /p2p/kyc/requirements
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: P2P KYC Requirements & Tier Comparison
 *  Hiển thị yêu cầu KYC riêng cho P2P (khác với KYC chính)
 *  User chọn tier phù hợp → navigate to verification flow
 *  Tone: Clear, trust-building, regulatory compliance
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, CheckCircle, Lock, Clock, FileText, Camera,
  Video, BadgeCheck, AlertTriangle, ChevronRight, Info,
  TrendingUp, DollarSign, Users, Zap, Star, ArrowRight,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   KYC Tier Configuration
   ═══════════════════════════════════════════════════════════ */
interface KYCTier {
  id: number;
  name: string;
  badge: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  requirements: {
    label: string;
    icon: React.ElementType;
  }[];
  limits: {
    dailyBuy: number;
    dailySell: number;
    monthlyVolume: number;
  };
  benefits: string[];
  verificationTime: string;
  status: 'locked' | 'available' | 'current' | 'pending';
}

const KYC_TIERS: KYCTier[] = [
  {
    id: 1,
    name: 'Basic',
    badge: 'Cơ bản',
    color: '#10B981',
    bgColor: hexToRgba('#10B981', 12),
    icon: Shield,
    requirements: [
      { label: 'CMND/CCCD/Passport', icon: FileText },
      { label: 'OCR + Face Match', icon: Camera },
    ],
    limits: {
      dailyBuy: 50_000_000,
      dailySell: 50_000_000,
      monthlyVolume: 500_000_000,
    },
    benefits: [
      'Giao dịch P2P cơ bản',
      'Tạo tối đa 3 quảng cáo',
      'Rút tối đa 20M VND/ngày',
    ],
    verificationTime: '10 phút',
    status: 'current',
  },
  {
    id: 2,
    name: 'Intermediate',
    badge: 'Trung cấp',
    color: '#3B82F6',
    bgColor: hexToRgba('#3B82F6', 12),
    icon: BadgeCheck,
    requirements: [
      { label: 'KYC Basic', icon: CheckCircle },
      { label: 'Proof of Address', icon: FileText },
      { label: 'Selfie với ID', icon: Camera },
    ],
    limits: {
      dailyBuy: 200_000_000,
      dailySell: 200_000_000,
      monthlyVolume: 2_000_000_000,
    },
    benefits: [
      'Tất cả quyền Basic',
      'Tạo không giới hạn quảng cáo',
      'Rút tối đa 100M VND/ngày',
      'Ưu tiên hỗ trợ',
    ],
    verificationTime: '24 giờ',
    status: 'available',
  },
  {
    id: 3,
    name: 'Advanced',
    badge: 'Nâng cao',
    color: '#F59E0B',
    bgColor: hexToRgba('#F59E0B', 12),
    icon: Star,
    requirements: [
      { label: 'KYC Intermediate', icon: CheckCircle },
      { label: 'Video Call Verification', icon: Video },
      { label: 'Source of Funds', icon: FileText },
      { label: 'Enhanced Due Diligence', icon: BadgeCheck },
    ],
    limits: {
      dailyBuy: 1_000_000_000,
      dailySell: 1_000_000_000,
      monthlyVolume: 10_000_000_000,
    },
    benefits: [
      'Tất cả quyền Intermediate',
      'Merchant Badge',
      'API Trading Access',
      'Dedicated Support 24/7',
      'Phí ưu đãi đặc biệt',
    ],
    verificationTime: '3-5 ngày làm việc',
    status: 'available',
  },
];

/* ═══════════════════════════════════════════════════════════
   Mock User Current Status
   ═══════════════════════════════════════════════════════════ */
const USER_CURRENT_TIER = 1;
const USER_PENDING_TIER: number | null = null;

/* ═══════════════════════════════════════════════════════════
   Tier Card Component
   ═══════════════════════════════════════════════════════════ */
function TierCard({ tier, onUpgrade }: { tier: KYCTier; onUpgrade: () => void }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const StatusBadge = () => {
    if (tier.status === 'current') {
      return (
        <div
          className="px-2 py-1 rounded-md flex items-center gap-1"
          style={{ background: hexToRgba('#10B981', 15), border: `1px solid ${hexToRgba('#10B981', 30)}` }}
        >
          <CheckCircle size={12} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Đang dùng</span>
        </div>
      );
    }
    if (tier.status === 'pending') {
      return (
        <div
          className="px-2 py-1 rounded-md flex items-center gap-1"
          style={{ background: hexToRgba('#F59E0B', 15), border: `1px solid ${hexToRgba('#F59E0B', 30)}` }}
        >
          <Clock size={12} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700 }}>Đang xét duyệt</span>
        </div>
      );
    }
    if (tier.status === 'locked') {
      return (
        <div
          className="px-2 py-1 rounded-md flex items-center gap-1"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <Lock size={12} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 10, fontWeight: 700 }}>Chưa mở</span>
        </div>
      );
    }
    return null;
  };

  return (
    <TrCard
      rounded="md"
      className="overflow-hidden"
      accentBorder={tier.status === 'current' ? tier.color : undefined}
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between" style={{ background: tier.bgColor }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: tier.color }}
          >
            <tier.icon size={24} color="#FFFFFF" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 style={{ color: tier.color, fontSize: φ.lg, fontWeight: 700 }}>
                Tier {tier.id}
              </h3>
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: tier.color, color: '#FFFFFF', fontSize: 10, fontWeight: 700 }}
              >
                {tier.badge}
              </span>
            </div>
            <p style={{ color: c.text2, fontSize: φ.xs }}>
              <Clock size={10} className="inline mr-1" />
              Xác minh trong {tier.verificationTime}
            </p>
          </div>
        </div>
        <StatusBadge />
      </div>

      {/* Requirements */}
      <div className="p-4 border-b" style={{ borderColor: c.borderSolid }}>
        <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 8 }}>
          Yêu cầu xác minh:
        </p>
        <div className="flex flex-col gap-2">
          {tier.requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: c.surface2 }}
              >
                <req.icon size={12} color={c.text2} />
              </div>
              <span style={{ color: c.text1, fontSize: φ.xs }}>{req.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Limits */}
      <div className="p-4 border-b" style={{ borderColor: c.borderSolid }}>
        <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 8 }}>
          Giới hạn giao dịch:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ color: c.text3, fontSize: 10 }}>Mua/ngày</p>
            <p style={{ color: tier.color, fontSize: φ.sm, fontWeight: 700 }}>
              {fmtAmount(tier.limits.dailyBuy, 0)} VND
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 10 }}>Bán/ngày</p>
            <p style={{ color: tier.color, fontSize: φ.sm, fontWeight: 700 }}>
              {fmtAmount(tier.limits.dailySell, 0)} VND
            </p>
          </div>
          <div className="col-span-2">
            <p style={{ color: c.text3, fontSize: 10 }}>Tổng/tháng</p>
            <p style={{ color: tier.color, fontSize: φ.sm, fontWeight: 700 }}>
              {fmtAmount(tier.limits.monthlyVolume, 0)} VND
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="p-4">
        <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 8 }}>
          Quyền lợi:
        </p>
        <div className="flex flex-col gap-1.5">
          {tier.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle size={14} color={tier.color} className="shrink-0 mt-0.5" />
              <span style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5 }}>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      {tier.status === 'available' && (
        <div className="p-4 pt-0">
          <button
            onClick={() => {
              hapticSelection();
              onUpgrade();
            }}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{
              background: tier.color,
              color: '#FFFFFF',
              fontSize: φ.sm,
            }}
          >
            Nâng cấp lên Tier {tier.id}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {tier.status === 'pending' && (
        <div className="p-4 pt-0">
          <div
            className="w-full py-3 rounded-xl text-center"
            style={{
              background: hexToRgba('#F59E0B', 10),
              border: `1px solid ${hexToRgba('#F59E0B', 30)}`,
            }}
          >
            <Clock size={16} color="#F59E0B" className="inline mr-2" />
            <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 600 }}>
              Đang xử lý...
            </span>
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PKYCRequirementsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const handleUpgrade = (tierId: number) => {
    hapticSelection();
    // Navigate to verification flow
    navigate(`${prefix}/p2p/kyc/verify?tier=${tierId}`);
  };

  return (
    <PageLayout>
      <Header
        title="P2P KYC Requirements"
        subtitle="KYC · P2P"
        back
      />

      {/* Hero Banner */}
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#3B82F6' }}
            >
              <Shield size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                P2P KYC Verification
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                P2P yêu cầu xác minh riêng để đảm bảo an toàn giao dịch. Chọn tier phù hợp với nhu cầu của bạn.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Warning Notice */}
      <div className="px-5 mb-4">
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#F59E0B', 10), border: `1px solid ${hexToRgba('#F59E0B', 30)}` }}
        >
          <Info size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, marginBottom: 2 }}>
              Lưu ý quan trọng
            </p>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              KYC P2P độc lập với KYC nền tảng chính. Bạn cần hoàn thành xác minh riêng để sử dụng P2P Trading.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="px-5 flex flex-col gap-4">
        {KYC_TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            onUpgrade={() => handleUpgrade(tier.id)}
          />
        ))}
      </div>

      {/* Bottom Help */}
      <div className="px-5 mt-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} color={c.text3} className="shrink-0" />
            <div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                Cần hỗ trợ?
              </p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6, marginBottom: 8 }}>
                Nếu bạn gặp khó khăn trong quá trình xác minh, vui lòng liên hệ bộ phận hỗ trợ.
              </p>
              <button
                onClick={() => {
                  hapticSelection();
                  navigate(`${prefix}/support`);
                }}
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color: '#3B82F6' }}
              >
                Liên hệ Support
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}