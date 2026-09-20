/**
 * ══════════════════════════════════════════════════════════
 *  WEB EARN STAKING PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/earn/staking
 *
 *  Staking products & active positions
 *  - Flexible vs Locked staking
 *  - APY/APR display
 *  - Staking calculator
 *  - Active positions management
 *  - Rewards tracking
 *  - Risk disclosure
 *
 *  Guidelines compliance:
 *  - §8.4: Wallet patterns
 *  - §14.3: High-risk actions require confirm
 *  - §15.1: Clear, factual copy (no hype)
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Lock,
  Unlock,
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Award,
  BarChart3,
  ArrowRight,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Zap,
  Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type StakingType = 'flexible' | 'locked';

interface StakingProduct {
  id: string;
  asset: string;
  type: StakingType;
  apy: number;
  minAmount: number;
  lockPeriod?: number; // days
  totalStaked: number;
  available: boolean;
  risk: 'low' | 'medium' | 'high';
}

interface StakingPosition {
  id: string;
  asset: string;
  type: StakingType;
  amount: number;
  apy: number;
  startDate: string;
  endDate?: string;
  lockPeriod?: number;
  earnedRewards: number;
  estimatedRewards: number;
  status: 'active' | 'pending' | 'completed';
}

const STAKING_PRODUCTS: StakingProduct[] = [
  {
    id: 'eth-flex',
    asset: 'ETH',
    type: 'flexible',
    apy: 4.5,
    minAmount: 0.1,
    totalStaked: 12450.5,
    available: true,
    risk: 'low',
  },
  {
    id: 'eth-30',
    asset: 'ETH',
    type: 'locked',
    apy: 6.2,
    minAmount: 0.5,
    lockPeriod: 30,
    totalStaked: 8920.3,
    available: true,
    risk: 'low',
  },
  {
    id: 'btc-flex',
    asset: 'BTC',
    type: 'flexible',
    apy: 3.8,
    minAmount: 0.01,
    totalStaked: 890.2,
    available: true,
    risk: 'low',
  },
  {
    id: 'usdt-90',
    asset: 'USDT',
    type: 'locked',
    apy: 12.5,
    minAmount: 100,
    lockPeriod: 90,
    totalStaked: 2450000,
    available: true,
    risk: 'medium',
  },
  {
    id: 'sol-60',
    asset: 'SOL',
    type: 'locked',
    apy: 15.8,
    minAmount: 10,
    lockPeriod: 60,
    totalStaked: 45600,
    available: false,
    risk: 'high',
  },
];

const ACTIVE_POSITIONS: StakingPosition[] = [
  {
    id: 'pos1',
    asset: 'ETH',
    type: 'locked',
    amount: 2.5,
    apy: 6.2,
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    lockPeriod: 90,
    earnedRewards: 0.0245,
    estimatedRewards: 0.0387,
    status: 'active',
  },
  {
    id: 'pos2',
    asset: 'USDT',
    type: 'flexible',
    amount: 5000,
    apy: 4.5,
    startDate: '2025-12-01',
    earnedRewards: 45.2,
    estimatedRewards: 225,
    status: 'active',
  },
  {
    id: 'pos3',
    asset: 'BTC',
    type: 'locked',
    amount: 0.5,
    apy: 5.0,
    startDate: '2025-11-20',
    endDate: '2026-02-20',
    lockPeriod: 90,
    earnedRewards: 0.00125,
    estimatedRewards: 0.00208,
    status: 'active',
  },
];

const RISK_CONFIG = {
  low: { label: 'Rủi ro thấp', color: '#10B981' },
  medium: { label: 'Rủi ro trung bình', color: '#F59E0B' },
  high: { label: 'Rủi ro cao', color: '#EF4444' },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StakingProductCard({ product }: { product: StakingProduct }) {
  const c = useThemeColors();
  const navigate = useNavigate();

  const TypeIcon = product.type === 'flexible' ? Unlock : Lock;
  const riskConfig = RISK_CONFIG[product.risk];

  return (
    <div
      className="p-5 rounded-xl transition-all cursor-pointer"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        opacity: product.available ? 1 : 0.6,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              background: '#3B82F615',
            }}
          >
            <TypeIcon size={24} color="#3B82F6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.H4, fontWeight: 800 }}>
                {product.asset}
              </span>
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: product.type === 'flexible' ? '#10B98115' : '#3B82F615',
                  color: product.type === 'flexible' ? '#10B981' : '#3B82F6',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {product.type === 'flexible' ? 'Linh hoạt' : `Khóa ${product.lockPeriod} ngày`}
              </span>
            </div>
            <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
              Tối thiểu: {product.minAmount} {product.asset}
            </div>
          </div>
        </div>

        {!product.available && (
          <span
            className="px-2 py-1 rounded-md"
            style={{
              background: `${c.text3}15`,
              color: c.text3,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Hết slot
          </span>
        )}
      </div>

      {/* APY Display */}
      <div
        className="p-4 rounded-lg mb-4"
        style={{
          background: '#10B98115',
          border: `1px solid #10B98140`,
        }}
      >
        <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
          APY ước tính
        </div>
        <div className="flex items-baseline gap-2">
          <span style={{ color: '#10B981', fontSize: 28, fontWeight: 800 }}>
            {product.apy}%
          </span>
          <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            /năm
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Tổng staked
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {product.totalStaked.toLocaleString()} {product.asset}
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Rủi ro
          </div>
          <div style={{ color: riskConfig.color, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {riskConfig.label}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        disabled={!product.available}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
        style={{
          background: product.available ? '#3B82F6' : c.bg,
          color: product.available ? '#fff' : c.text3,
          fontSize: WEB_FONT.SIZE.BODY,
          fontWeight: 600,
          border: product.available ? 'none' : `1px solid ${c.border}`,
          cursor: product.available ? 'pointer' : 'not-allowed',
        }}
      >
        {product.available ? (
          <>
            Stake ngay
            <ArrowRight size={16} />
          </>
        ) : (
          'Không khả dụng'
        )}
      </button>
    </div>
  );
}

function PositionCard({ position }: { position: StakingPosition }) {
  const c = useThemeColors();

  const daysRemaining = position.endDate
    ? Math.max(0, Math.ceil((new Date(position.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const progress = position.endDate
    ? Math.min(
        100,
        ((Date.now() - new Date(position.startDate).getTime()) /
          (new Date(position.endDate).getTime() - new Date(position.startDate).getTime())) *
          100
      )
    : null;

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.H4, fontWeight: 800 }}>
              {position.asset}
            </span>
            <span
              className="px-2 py-0.5 rounded-md"
              style={{
                background: position.type === 'flexible' ? '#10B98115' : '#3B82F615',
                color: position.type === 'flexible' ? '#10B981' : '#3B82F6',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {position.type === 'flexible' ? 'Linh hoạt' : `Khóa ${position.lockPeriod} ngày`}
            </span>
          </div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            APY: {position.apy}%
          </div>
        </div>

        <div className="text-right">
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Đã stake
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {position.amount.toLocaleString()} {position.asset}
          </div>
        </div>
      </div>

      {/* Progress Bar (for locked) */}
      {position.type === 'locked' && progress !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600 }}>
              Tiến độ
            </span>
            <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
              {daysRemaining} ngày còn lại
            </span>
          </div>
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              height: 8,
              background: c.bg,
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      <div
        className="grid grid-cols-2 gap-3 p-3 rounded-lg mb-4"
        style={{
          background: c.bg,
        }}
      >
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Đã nhận
          </div>
          <div style={{ color: '#10B981', fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            +{position.earnedRewards} {position.asset}
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Ước tính (tổng)
          </div>
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            ~{position.estimatedRewards} {position.asset}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {position.type === 'flexible' && (
          <button
            className="flex-1 px-4 py-2 rounded-lg transition-colors"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.text2,
              fontSize: WEB_FONT.SIZE.CAPTION,
              fontWeight: 600,
            }}
          >
            Rút
          </button>
        )}
        <button
          className="flex-1 px-4 py-2 rounded-lg transition-colors"
          style={{
            background: '#3B82F6',
            color: '#fff',
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            border: 'none',
          }}
        >
          Chi tiết
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebEarnStakingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'all' | StakingType>('all');

  const filteredProducts = STAKING_PRODUCTS.filter(
    (p) => selectedType === 'all' || p.type === selectedType
  );

  const totalStaked = ACTIVE_POSITIONS.reduce((sum, p) => sum + p.amount, 0);
  const totalEarned = ACTIVE_POSITIONS.reduce((sum, p) => sum + p.earnedRewards, 0);

  return (
    <PageLayout>
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* ═══ LEFT SIDEBAR (300px) ═══ */}
      <div
        className="flex flex-col"
        style={{
          width: 300,
          background: c.surface,
          borderRight: `1px solid ${c.divider}`,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: 60,
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <h2
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.H2,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Staking
          </h2>
        </div>

        {/* My Positions Summary */}
        <div className="p-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Vị thế của tôi
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Tổng đã stake
              </div>
              <div style={{ color: c.text1, fontSize: 20, fontWeight: 800 }}>
                {ACTIVE_POSITIONS.length}
                <span style={{ fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, color: c.text3 }}>
                  {' '}vị thế
                </span>
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#10B98115',
                border: `1px solid #10B98140`,
              }}
            >
              <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
                Đã nhận rewards
              </div>
              <div style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>
                ${totalEarned.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Lọc sản phẩm
          </div>
          <div className="flex flex-col gap-1">
            {[
              { value: 'all' as const, label: 'Tất cả', icon: TrendingUp },
              { value: 'flexible' as const, label: 'Linh hoạt', icon: Unlock },
              { value: 'locked' as const, label: 'Khóa', icon: Lock },
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedType === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedType(filter.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: isActive ? '#3B82F615' : 'transparent',
                    color: isActive ? '#3B82F6' : c.text2,
                    fontSize: WEB_FONT.SIZE.CAPTION,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <Icon size={14} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk Disclosure */}
        <div className="px-4 pb-4 mt-auto">
          <div
            className="p-3 rounded-lg"
            style={{
              background: '#EF444415',
              border: `1px solid #EF444440`,
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} color="#EF4444" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ color: '#EF4444', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 4 }}>
                  Cảnh báo rủi ro
                </div>
                <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Staking có rủi ro mất vốn. APY không đảm bảo. Đọc điều khoản trước khi tham gia.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-8">
          {/* Active Positions */}
          {ACTIVE_POSITIONS.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.H3,
                    fontWeight: 700,
                  }}
                >
                  Vị thế đang hoạt động
                </h3>
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    color: c.text2,
                    fontSize: WEB_FONT.SIZE.CAPTION,
                    fontWeight: 600,
                  }}
                >
                  Xem tất cả
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {ACTIVE_POSITIONS.slice(0, 2).map((position) => (
                  <PositionCard key={position.id} position={position} />
                ))}
              </div>
            </div>
          )}

          {/* Available Products */}
          <div>
            <div className="mb-4">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.H3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Sản phẩm staking
              </h3>
              <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                {filteredProducts.length} sản phẩm khả dụng
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <StakingProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}