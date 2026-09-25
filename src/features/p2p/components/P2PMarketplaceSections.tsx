import React from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleDot,
  Filter,
  Plus,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { SearchBar } from '@/shared/ui/SearchBar';
import { TabBar } from '@/shared/ui/TabBar';
import { TrCard } from '@/shared/ui/TrCard';
import { TrInput } from '@/shared/ui/TrInput';
import { fmtCompact, fmtPct } from '@/shared/lib/formatNumber';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import type { P2PAd, P2PPlatformStats } from '../model/p2p-types';
import { SwipeableAdCard } from './P2PHomeCards';
export interface P2PMarketplaceSectionsProps {
  platformStats: P2PPlatformStats;
  tab: 'buy' | 'sell';
  handleTabSwitch: (tab: 'buy' | 'sell') => void;
  asset: string;
  setAsset: (asset: string) => void;
  fiatCurrency: string;
  setFiatCurrency: (currency: string) => void;
  searchText: string;
  setSearchText: (search: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  sortBy: 'price' | 'completion' | 'orders';
  setSortBy: (sortBy: 'price' | 'completion' | 'orders') => void;
  merchantType: 'all' | 'elite' | 'pro' | 'verified';
  setMerchantType: (type: 'all' | 'elite' | 'pro' | 'verified') => void;
  filterPayment: string;
  setFilterPayment: (payment: string) => void;
  amountInput: string;
  setAmountInput: (amount: string) => void;
  activeFilterCount: number;
  allPaymentMethods: string[];
  ads: P2PAd[];
  onContextMenu: (ad: P2PAd) => void;
  onQuickAction: (ad: P2PAd, type: 'buy' | 'sell') => void;
  prefix: string;
}

const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'] as const;
const FIAT_CURRENCIES = ['VND', 'USD'] as const;
const SORT_OPTIONS = [
  { id: 'price' as const, label: 'Giá tốt nhất' },
  { id: 'completion' as const, label: 'Tỷ lệ hoàn thành' },
  { id: 'orders' as const, label: 'Số đơn nhiều nhất' },
];
export function P2PMarketplaceSections({
  platformStats,
  tab,
  handleTabSwitch,
  asset,
  setAsset,
  fiatCurrency,
  setFiatCurrency,
  searchText,
  setSearchText,
  showFilters,
  setShowFilters,
  sortBy,
  setSortBy,
  merchantType,
  setMerchantType,
  filterPayment,
  setFilterPayment,
  amountInput,
  setAmountInput,
  activeFilterCount,
  allPaymentMethods,
  ads,
  onContextMenu,
  onQuickAction,
  prefix,
}: P2PMarketplaceSectionsProps) {
  const { hapticSelection } = useHaptic();
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageContent padding="compact">
      {/* ═══ P2P Hub Card — Enterprise Fintech ═══ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)`,
        }}
      >
        {/* ─── Hero Section: Gradient Header ─── */}
        <div
          className="relative px-4 pt-4 pb-3"
          style={{
            background:
              'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.06) 50%, rgba(139,92,246,0.04) 100%)',
          }}
        >
          {/* Decorative dots */}
          <div className="absolute top-2 right-3 flex items-center gap-1 opacity-30">
            <CircleDot size={8} color={c.text3} />
            <CircleDot size={6} color={c.text3} />
            <CircleDot size={4} color={c.text3} />
          </div>

          {/* Title row */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              }}
            >
              <Sparkles size={12} color="#fff" />
            </div>
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Thao tác nhanh</span>
            <div
              className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Live</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`${prefix}/p2p/express`)}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.08) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                }}
              >
                <Zap size={18} color="#fff" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Express Trade</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 1, lineHeight: 1.3 }}>
                  Auto match · 1 chạm
                </p>
              </div>
              <ArrowRight size={14} color="#10B981" className="shrink-0" />
            </button>

            <button
              onClick={() => {
                navigate(`${prefix}/p2p/create`);
                hapticSelection();
              }}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)',
                border: '1px solid rgba(59,130,246,0.18)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                }}
              >
                <Plus size={18} color="#fff" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Đăng offer</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 1, lineHeight: 1.3 }}>
                  Tạo quảng cáo P2P
                </p>
              </div>
              <ArrowRight size={14} color="#3B82F6" className="shrink-0" />
            </button>
          </div>
        </div>

        {/* ─── Stats Section ─── */}
        <div
          className="px-4 py-3"
          style={{
            borderTop: `1px solid ${c.divider}`,
            background: c.surface2,
          }}
        >
          {/* Stats Grid — 3 columns */}
          <div className="grid grid-cols-3 gap-0">
            <div
              className="flex flex-col items-center py-1.5"
              style={{ borderRight: `1px solid ${c.divider}` }}
            >
              <div className="flex items-center gap-1 mb-1">
                <Activity size={10} color="#3B82F6" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Volume 24h</span>
              </div>
              <span
                style={{
                  color: c.text1,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: -0.5,
                }}
              >
                {fmtCompact(platformStats.volume24h, { prefix: '₫' })}
              </span>
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700, marginTop: 1 }}>
                +{fmtPct(platformStats.volume24hChange)}
              </span>
            </div>

            <div
              className="flex flex-col items-center py-1.5"
              style={{ borderRight: `1px solid ${c.divider}` }}
            >
              <div className="flex items-center gap-1 mb-1">
                <Users size={10} color="#10B981" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Online</span>
              </div>
              <span
                style={{
                  color: c.text1,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: -0.5,
                }}
              >
                {platformStats.onlineTraders.toLocaleString()}
              </span>
              <span style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>traders</span>
            </div>

            <div className="flex flex-col items-center py-1.5">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} color="#F59E0B" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Completion</span>
              </div>
              <span
                style={{
                  color: c.text1,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: -0.5,
                }}
              >
                {platformStats.avgCompletionRate}%
              </span>
              <span style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                avg {platformStats.avgCompletionTime}
              </span>
            </div>
          </div>

          {/* Bottom row: secondary stats */}
          <div
            className="flex items-center justify-between mt-2.5 pt-2.5"
            style={{ borderTop: `1px solid ${c.divider}` }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.1)' }}
              >
                <BarChart3 size={10} color="#8B5CF6" />
              </div>
              <span style={{ color: c.text2, fontSize: 11 }}>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: c.text1 }}>
                  {platformStats.totalTrades24h.toLocaleString()}
                </span>{' '}
                trades · {platformStats.activeMerchants} merchants
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.1)',
              }}
            >
              <Shield size={10} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                {fmtCompact(platformStats.escrowProtected, { prefix: '₫' })} Escrow
              </span>
            </div>
          </div>
        </div>
      </div>
      <TabBar
        variant="segment"
        tabs={[
          { id: 'buy', label: 'MUA' },
          { id: 'sell', label: 'BÁN' },
        ]}
        active={tab}
        onChange={(t) => handleTabSwitch(t as 'buy' | 'sell')}
        colors={{ buy: '#10B981', sell: '#EF4444' }}
      />

      {/* Asset + Fiat Row */}
      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center gap-1 flex-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {ASSETS.map((a) => (
            <button
              key={a}
              onClick={() => {
                setAsset(a);
                hapticSelection();
              }}
              className="px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: asset === a ? c.chipActiveBg : 'transparent',
                color: asset === a ? c.chipActiveText : c.text3,
                border: `1px solid ${asset === a ? c.chipActiveBorder : 'transparent'}`,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="w-px h-4" style={{ background: c.border }} />
        {FIAT_CURRENCIES.map((cur) => (
          <button
            key={cur}
            onClick={() => {
              setFiatCurrency(cur);
              hapticSelection();
            }}
            className="px-2 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: fiatCurrency === cur ? c.primaryAlpha12 : 'transparent',
              color: fiatCurrency === cur ? c.primary : c.text3,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {cur}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Tìm merchant..."
        variant="compact"
        filterActive={showFilters}
        onFilterToggle={() => {
          setShowFilters(!showFilters);
          hapticSelection();
        }}
        filterIcon={Filter}
      />

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden mb-3"
          >
            <TrCard className="p-4">
              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                  Sắp xếp
                </p>
                <div className="flex gap-1.5">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSortBy(s.id);
                        hapticSelection();
                      }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: sortBy === s.id ? c.chipActiveBg : c.chipBg,
                        color: sortBy === s.id ? c.chipActiveText : c.chipText,
                        border: `1px solid ${sortBy === s.id ? c.chipActiveBorder : c.chipBorder}`,
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                  Loại merchant
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: 'Tất cả' },
                    { id: 'elite' as const, label: 'Elite', color: '#F59E0B' },
                    { id: 'pro' as const, label: 'Pro', color: '#8B5CF6' },
                    { id: 'verified' as const, label: 'Xác minh', color: '#3B82F6' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setMerchantType(t.id);
                        hapticSelection();
                      }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background:
                          merchantType === t.id
                            ? t.color
                              ? `${t.color}15`
                              : c.chipActiveBg
                            : c.chipBg,
                        color: merchantType === t.id ? t.color || c.chipActiveText : c.chipText,
                        border: `1px solid ${merchantType === t.id ? (t.color ? `${t.color}40` : c.chipActiveBorder) : c.chipBorder}`,
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                  Thanh toán
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setFilterPayment('');
                      hapticSelection();
                    }}
                    className="px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: !filterPayment ? c.chipActiveBg : c.chipBg,
                      color: !filterPayment ? c.chipActiveText : c.chipText,
                      border: `1px solid ${!filterPayment ? c.chipActiveBorder : c.chipBorder}`,
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    Tất cả
                  </button>
                  {allPaymentMethods.map((pm) => (
                    <button
                      key={pm}
                      onClick={() => {
                        setFilterPayment(filterPayment === pm ? '' : pm);
                        hapticSelection();
                      }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: filterPayment === pm ? c.primaryAlpha12 : c.chipBg,
                        color: filterPayment === pm ? c.primary : c.chipText,
                        border: `1px solid ${filterPayment === pm ? c.primaryAlpha30 : c.chipBorder}`,
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <TrInput
                label="Số tiền"
                placeholder={`Nhập số tiền ${fiatCurrency}...`}
                value={amountInput}
                onChange={setAmountInput}
                suffix={fiatCurrency}
                numeric
                size="compact"
                inputMode="decimal"
              />

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSortBy('price');
                    setMerchantType('all');
                    setFilterPayment('');
                    setAmountInput('');
                    hapticSelection();
                  }}
                  className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-1"
                  style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}
                >
                  <X size={11} /> Xóa bộ lọc
                </button>
              )}
            </TrCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <span style={{ color: c.text2, fontSize: 11 }}>
          {`${ads.length} offer`}
          {sortBy !== 'price' && (
            <span style={{ color: c.text3 }}>
              {' · '}
              {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
            </span>
          )}
        </span>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md"
          style={{ background: c.surface2 }}
        >
          <Shield size={9} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Escrow</span>
        </div>
      </div>

      {/* Ads List */}
      <div className="flex flex-col gap-2.5">
        {ads.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy offer"
            subtitle="Thử thay đổi bộ lọc hoặc tài sản"
          />
        ) : (
          ads.map((ad, i) => (
            <SwipeableAdCard
              key={ad.id}
              ad={ad}
              tradeType={tab}
              prefix={prefix}
              index={i}
              onContextMenu={onContextMenu}
              onQuickAction={onQuickAction}
            />
          ))
        )}
      </div>
    </PageContent>
  );
}
