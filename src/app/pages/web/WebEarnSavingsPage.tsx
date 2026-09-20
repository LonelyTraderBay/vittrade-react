/**
 * ══════════════════════════════════════════════════════════
 *  WEB EARN SAVINGS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/earn/savings
 *
 *  Savings & Earn module — Passive income products
 *
 *  Sections:
 *  - Portfolio overview (Total Savings, APY, Earnings)
 *  - Featured products (High APY, Flexible, Locked)
 *  - Product categories (Flexible/Locked/DeFi)
 *  - My Active Savings preview
 *  - Quick access to History/Analytics/FAQ
 *
 *  Safety (per Guidelines §1, §5):
 *  - APY shown as range/estimate (not guaranteed)
 *  - Risk disclosure for locked/DeFi products
 *  - Clear maturity dates and withdrawal rules
 *  - No dark patterns or hidden fees
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Lock,
  Unlock,
  Clock,
  DollarSign,
  Award,
  Activity,
  Search,
  ChevronRight,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  Wallet,
  Calendar,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface SavingsProduct {
  id: string;
  name: string;
  symbol: string;
  type: 'flexible' | 'locked' | 'defi';
  apyMin: number;
  apyMax: number;
  minAmount: number;
  maxAmount?: number;
  lockDays?: number;
  features: string[];
  totalLocked: number;
  participants: number;
  risk: 'low' | 'medium' | 'high';
  isFeatured?: boolean;
  myPosition?: {
    amount: number;
    startDate: string;
    maturityDate?: string;
    currentEarnings: number;
    currentAPY: number;
  };
}

const FEATURED_PRODUCTS: SavingsProduct[] = [
  {
    id: 'usdt-flexible',
    name: 'USDT Flexible Savings',
    symbol: 'USDT',
    type: 'flexible',
    apyMin: 5.2,
    apyMax: 8.5,
    minAmount: 10,
    features: ['Rút bất kỳ lúc nào', 'Lãi suất linh hoạt', 'Không phí rút'],
    totalLocked: 12500000,
    participants: 15230,
    risk: 'low',
    isFeatured: true,
  },
  {
    id: 'btc-locked-90',
    name: 'BTC Locked 90 Days',
    symbol: 'BTC',
    type: 'locked',
    apyMin: 12.0,
    apyMax: 12.0,
    minAmount: 0.01,
    lockDays: 90,
    features: ['APY cố định 12%', 'Kỳ hạn 90 ngày', 'Lãi trả hàng ngày'],
    totalLocked: 8420000,
    participants: 3240,
    risk: 'low',
    isFeatured: true,
  },
  {
    id: 'eth-defi-staking',
    name: 'ETH DeFi Staking',
    symbol: 'ETH',
    type: 'defi',
    apyMin: 15.0,
    apyMax: 22.5,
    minAmount: 0.1,
    lockDays: 180,
    features: ['APY cao nhất', 'DeFi protocol', 'Rủi ro cao hơn'],
    totalLocked: 5600000,
    participants: 1820,
    risk: 'high',
    isFeatured: true,
  },
];

const ALL_PRODUCTS: SavingsProduct[] = [
  ...FEATURED_PRODUCTS,
  {
    id: 'usdc-flexible',
    name: 'USDC Flexible Savings',
    symbol: 'USDC',
    type: 'flexible',
    apyMin: 4.8,
    apyMax: 7.2,
    minAmount: 10,
    features: ['Rút linh hoạt', 'Stablecoin an toàn'],
    totalLocked: 9800000,
    participants: 12400,
    risk: 'low',
  },
  {
    id: 'bnb-locked-30',
    name: 'BNB Locked 30 Days',
    symbol: 'BNB',
    type: 'locked',
    apyMin: 8.5,
    apyMax: 8.5,
    minAmount: 0.5,
    lockDays: 30,
    features: ['Kỳ hạn ngắn', 'APY 8.5%'],
    totalLocked: 4200000,
    participants: 2100,
    risk: 'medium',
  },
  {
    id: 'ada-defi',
    name: 'ADA DeFi Staking',
    symbol: 'ADA',
    type: 'defi',
    apyMin: 18.0,
    apyMax: 25.0,
    minAmount: 100,
    lockDays: 365,
    features: ['APY cao', 'Kỳ hạn dài'],
    totalLocked: 3100000,
    participants: 950,
    risk: 'high',
  },
];

const MY_ACTIVE_SAVINGS = [
  {
    id: 'my-usdt-1',
    productId: 'usdt-flexible',
    name: 'USDT Flexible Savings',
    symbol: 'USDT',
    amount: 5000,
    startDate: '2026-01-15',
    currentEarnings: 42.5,
    currentAPY: 6.8,
    type: 'flexible' as const,
  },
  {
    id: 'my-btc-1',
    productId: 'btc-locked-90',
    name: 'BTC Locked 90 Days',
    symbol: 'BTC',
    amount: 0.15,
    startDate: '2026-02-01',
    maturityDate: '2026-05-02',
    currentEarnings: 0.0048,
    currentAPY: 12.0,
    type: 'locked' as const,
  },
];

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'Tất cả sản phẩm', count: ALL_PRODUCTS.length },
  { id: 'flexible', label: 'Tiết kiệm linh hoạt', count: ALL_PRODUCTS.filter(p => p.type === 'flexible').length },
  { id: 'locked', label: 'Tiết kiệm có kỳ hạn', count: ALL_PRODUCTS.filter(p => p.type === 'locked').length },
  { id: 'defi', label: 'DeFi Staking', count: ALL_PRODUCTS.filter(p => p.type === 'defi').length },
  { id: 'my-active', label: 'Sản phẩm của tôi', count: MY_ACTIVE_SAVINGS.length },
];

const STATS_OVERVIEW = [
  { label: 'Tổng tiết kiệm', value: '$5,127.50', change: '+12.5%', icon: Wallet, color: '#3B82F6' },
  { label: 'Sản phẩm đang hoạt động', value: '2', change: '', icon: Activity, color: '#10B981' },
  { label: 'APY trung bình', value: '8.4%', change: '+0.8%', icon: TrendingUp, color: '#F59E0B' },
  { label: 'Tổng lãi kiếm được', value: '$127.50', change: '+$42.50 (7 ngày)', icon: Award, color: '#8B5CF6' },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebEarnSavingsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = ALL_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'my-active' ? MY_ACTIVE_SAVINGS.some(s => s.productId === product.id) : product.type === selectedCategory);
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      default:
        return c.text2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'flexible':
        return 'Linh hoạt';
      case 'locked':
        return 'Có kỳ hạn';
      case 'defi':
        return 'DeFi Staking';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flexible':
        return Unlock;
      case 'locked':
        return Lock;
      case 'defi':
        return Zap;
      default:
        return DollarSign;
    }
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Tiết kiệm & Sinh lời"
        subtitle="Đầu tư an toàn với lãi suất hấp dẫn"
        back
        right={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/w/earn/history')}
              style={{
                height: WEB_BUTTON.md,
                padding: `0 16px`,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                backgroundColor: c.surface,
                color: c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.hoverBg;
                e.currentTarget.style.borderColor = c.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = c.surface;
                e.currentTarget.style.borderColor = c.border;
              }}
            >
              <Activity size={WEB_ICON.md} />
              Lịch sử
            </button>

            <button
              onClick={() => navigate('/w/earn/analytics')}
              style={{
                height: WEB_BUTTON.md,
                padding: `0 16px`,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                backgroundColor: c.surface,
                color: c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.hoverBg;
                e.currentTarget.style.borderColor = c.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = c.surface;
                e.currentTarget.style.borderColor = c.border;
              }}
            >
              <BarChart3 size={WEB_ICON.md} />
              Phân tích
            </button>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════
          STATS OVERVIEW
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: c.bg, borderBottom: `1px solid ${c.border}` }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: `24px 32px`,
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: WEB_SPACING.CARD_GAP,
            }}
          >
            {STATS_OVERVIEW.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: '12px',
                    padding: 20,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: `${stat.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={WEB_ICON.lg} style={{ color: stat.color }} />
                    </div>
                    <span style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
                      {stat.label}
                    </span>
                  </div>
                  <div style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1 }}>
                    {stat.value}
                  </div>
                  {stat.change && (
                    <div
                      style={{
                        fontSize: WEB_FONT.xs,
                        color: stat.change.startsWith('+') ? '#10B981' : c.text3,
                        marginTop: '4px',
                      }}
                    >
                      {stat.change}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — 2 COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: `${WEB_SPACING.SECTION_VERTICAL}px ${WEB_SPACING.PAGE_HORIZONTAL}px`,
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: WEB_SPACING.CARD_GAP,
            alignItems: 'start',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════
              LEFT SIDEBAR — FILTERS & CATEGORIES
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Search */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Search size={WEB_ICON.md} />
                Tìm kiếm
              </div>
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.bg,
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  outline: 'none',
                }}
              />
            </div>

            {/* Categories */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Danh mục
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {PRODUCT_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: selectedCategory === category.id ? `${c.primary}15` : 'transparent',
                      color: selectedCategory === category.id ? c.primary : c.text1,
                      fontSize: WEB_FONT.base,
                      fontWeight: selectedCategory === category.id ? 500 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.backgroundColor = c.hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{category.label}</span>
                    <span
                      style={{
                        fontSize: WEB_FONT.xs,
                        color: c.text3,
                        fontWeight: 500,
                      }}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Disclosure */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Shield size={WEB_ICON.md} style={{ color: c.primary, flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div
                    style={{
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      color: c.text1,
                      marginBottom: '4px',
                    }}
                  >
                    Thông tin rủi ro
                  </div>
                  <div style={{ fontSize: WEB_FONT.xs, color: c.text3, lineHeight: '1.5' }}>
                    APY hiển thị là ước tính và có thể thay đổi. Sản phẩm DeFi có rủi ro cao hơn. Đọc kỹ điều khoản trước khi đầu tư.
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Truy cập nhanh
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'FAQ', icon: Info, path: '/earn/savings/faq' },
                  { label: 'Hướng dẫn', icon: AlertCircle, path: '/earn/savings/guide' },
                  { label: 'So sánh sản phẩm', icon: BarChart3, path: '/earn/savings/comparison' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: c.text1,
                        fontSize: WEB_FONT.base,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = c.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon size={WEB_ICON.sm} style={{ color: c.text3 }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT MAIN CONTENT — PRODUCTS LIST
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: WEB_SPACING.CARD_GAP }}>
            {/* Featured Products Banner */}
            {selectedCategory === 'all' && (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: 20,
                  border: `1px solid ${c.border}`,
                  background: `linear-gradient(135deg, ${c.primary}15 0%, ${c.surface} 100%)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2
                      style={{
                        fontSize: WEB_FONT.lg,
                        fontWeight: 700,
                        color: c.text1,
                        margin: '0 0 4px 0',
                      }}
                    >
                      Sản phẩm nổi bật
                    </h2>
                    <p style={{ fontSize: WEB_FONT.base, color: c.text3, margin: 0 }}>
                      APY cao, thanh khoản tốt, rủi ro được kiểm soát
                    </p>
                  </div>
                  <Award size={WEB_ICON.xl} style={{ color: c.primary, opacity: 0.3 }} />
                </div>
              </div>
            )}

            {/* My Active Savings Preview */}
            {selectedCategory === 'my-active' && MY_ACTIVE_SAVINGS.length > 0 && (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: 20,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: WEB_FONT.lg,
                    fontWeight: 700,
                    color: c.text1,
                    marginBottom: '16px',
                  }}
                >
                  Sản phẩm đang hoạt động
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {MY_ACTIVE_SAVINGS.map((saving) => (
                    <div
                      key={saving.id}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: c.background,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: WEB_FONT.base, fontWeight: 600, color: c.text1 }}>
                            {saving.name}
                          </div>
                          <div style={{ fontSize: WEB_FONT.sm, color: c.text3, marginTop: '2px' }}>
                            {saving.type === 'flexible' ? 'Linh hoạt' : `Kỳ hạn ${saving.maturityDate}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: WEB_FONT.base, fontWeight: 700, color: c.text1 }}>
                            {saving.amount} {saving.symbol}
                          </div>
                          <div style={{ fontSize: WEB_FONT.sm, color: '#10B981', marginTop: '2px' }}>
                            APY {saving.currentAPY}%
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px',
                          borderTop: `1px solid ${c.border}`,
                        }}
                      >
                        <div style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
                          Lãi đã kiếm: <span style={{ color: '#10B981', fontWeight: 500 }}>+{saving.currentEarnings} {saving.symbol}</span>
                        </div>
                        <button
                          onClick={() => navigate(`/earn/savings/receipt/${saving.id}`)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${c.border}`,
                            backgroundColor: c.surface,
                            color: c.primary,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Chi tiết
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: WEB_SPACING.CARD_GAP,
              }}
            >
              {filteredProducts.map((product) => {
                const TypeIcon = getTypeIcon(product.type);
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/earn/savings/${product.id}`)}
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: '12px',
                      padding: 20,
                      border: `1px solid ${c.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = c.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${c.primary}20`,
                          color: c.primary,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Award size={12} />
                        Nổi bật
                      </div>
                    )}

                    {/* Product Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: WEB_ICON.CONTAINER.XLARGE,
                          height: WEB_ICON.CONTAINER.XLARGE,
                          borderRadius: '10px',
                          backgroundColor: `${c.primary}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TypeIcon size={WEB_ICON.lg} style={{ color: c.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: WEB_FONT.base, fontWeight: 700, color: c.text1 }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: WEB_FONT.sm, color: c.text3, marginTop: '2px' }}>
                          {getTypeLabel(product.type)}
                          {product.lockDays && ` • ${product.lockDays} ngày`}
                        </div>
                      </div>
                    </div>

                    {/* APY Display */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: `${c.primary}10`,
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ fontSize: WEB_FONT.xs, color: c.text3, marginBottom: '4px' }}>
                        Lãi suất ước tính (APY)
                      </div>
                      <div style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: '#10B981' }}>
                        {product.apyMin === product.apyMax ? `${product.apyMax}%` : `${product.apyMin}% - ${product.apyMax}%`}
                      </div>
                    </div>

                    {/* Features */}
                    <div style={{ marginBottom: '16px' }}>
                      {product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: WEB_FONT.sm,
                            color: c.text3,
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <div
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: c.primary,
                              flexShrink: 0,
                            }}
                          />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Stats & Risk */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '16px',
                        borderTop: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>TVL</div>
                          <div style={{ fontSize: WEB_FONT.sm, fontWeight: 500, color: c.text1 }}>
                            ${(product.totalLocked / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>Người dùng</div>
                          <div style={{ fontSize: WEB_FONT.sm, fontWeight: 500, color: c.text1 }}>
                            {product.participants.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: `${getRiskColor(product.risk)}15`,
                          color: getRiskColor(product.risk),
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                        }}
                      >
                        {product.risk === 'low' ? 'Rủi ro thấp' : product.risk === 'medium' ? 'Rủi ro trung bình' : 'Rủi ro cao'}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/earn/savings/${product.id}`);
                      }}
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        height: WEB_BUTTON.md,
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: c.primary,
                        color: '#FFFFFF',
                        fontSize: WEB_FONT.base,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = c.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = c.primary;
                      }}
                    >
                      Xem chi tiết
                      <ArrowRight size={WEB_ICON.md} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: '60px 20px',
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                }}
              >
                <Search size={48} style={{ color: c.text3, margin: '0 auto 16px' }} />
                <div style={{ fontSize: WEB_FONT.base, fontWeight: 500, color: c.text1, marginBottom: '8px' }}>
                  Không tìm thấy sản phẩm
                </div>
                <div style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}