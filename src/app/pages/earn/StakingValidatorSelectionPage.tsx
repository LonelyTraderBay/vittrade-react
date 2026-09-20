import React, { useState } from 'react';
import { Shield, TrendingUp, Clock, Users, AlertTriangle, CheckCircle2, Star, Filter, Search } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface Validator {
  id: string;
  name: string;
  logo: string;
  address: string;
  commission: number;
  apy: number;
  uptime: number;
  totalStaked: number;
  delegators: number;
  slashingHistory: number;
  verified: boolean;
  tier: 'top' | 'recommended' | 'standard';
  description: string;
  website?: string;
  features: string[];
}

const VALIDATORS: Validator[] = [
  {
    id: 'v1',
    name: 'Coinbase Cloud',
    logo: '🔷',
    address: '0x1234...5678',
    commission: 8,
    apy: 5.92,
    uptime: 99.98,
    totalStaked: 125000,
    delegators: 45230,
    slashingHistory: 0,
    verified: true,
    tier: 'top',
    description: 'Institutional-grade validator with 24/7 monitoring',
    website: 'coinbase.com/cloud',
    features: ['24/7 Support', 'MEV Protection', 'Auto-compound'],
  },
  {
    id: 'v2',
    name: 'Kraken Staking',
    logo: '🐙',
    address: '0xabcd...ef12',
    commission: 10,
    apy: 5.80,
    uptime: 99.95,
    totalStaked: 98500,
    delegators: 32150,
    slashingHistory: 0,
    verified: true,
    tier: 'top',
    description: 'Regulated validator with insurance coverage',
    website: 'kraken.com/staking',
    features: ['Insurance', 'Regulated', 'Low Commission'],
  },
  {
    id: 'v3',
    name: 'Figment',
    logo: '⚡',
    address: '0x9876...5432',
    commission: 5,
    apy: 6.15,
    uptime: 99.99,
    totalStaked: 210000,
    delegators: 68900,
    slashingHistory: 0,
    verified: true,
    tier: 'top',
    description: 'Highest APY with excellent track record',
    website: 'figment.io',
    features: ['Highest APY', 'Open Source', 'Multi-chain'],
  },
  {
    id: 'v4',
    name: 'Chorus One',
    logo: '🎵',
    address: '0xdef0...9abc',
    commission: 7,
    apy: 6.03,
    uptime: 99.97,
    totalStaked: 150000,
    delegators: 52000,
    slashingHistory: 0,
    verified: true,
    tier: 'recommended',
    description: 'Community-focused validator with transparent operations',
    features: ['Community Driven', 'Educational', 'Governance Active'],
  },
  {
    id: 'v5',
    name: 'P2P Validator',
    logo: '🔗',
    address: '0x1111...2222',
    commission: 6,
    apy: 6.08,
    uptime: 99.96,
    totalStaked: 88000,
    delegators: 28500,
    slashingHistory: 0,
    verified: true,
    tier: 'recommended',
    description: 'Non-custodial staking with full control',
    features: ['Non-custodial', 'API Access', 'Custom Reports'],
  },
  {
    id: 'v6',
    name: 'Everstake',
    logo: '🌟',
    address: '0x3333...4444',
    commission: 9,
    apy: 5.85,
    uptime: 99.94,
    totalStaked: 72000,
    delegators: 21000,
    slashingHistory: 0,
    verified: false,
    tier: 'standard',
    description: 'Reliable validator with global infrastructure',
    features: ['Global Nodes', 'Backup Validators', 'Analytics'],
  },
  {
    id: 'v7',
    name: 'Staked.us',
    logo: '🇺🇸',
    address: '0x5555...6666',
    commission: 12,
    apy: 5.68,
    uptime: 99.92,
    totalStaked: 45000,
    delegators: 15000,
    slashingHistory: 1,
    verified: false,
    tier: 'standard',
    description: 'US-based validator with compliance focus',
    features: ['US Regulated', 'Tax Reporting', 'Compliance'],
  },
];

const TIER_CONFIG = {
  top: { label: 'Top Tier', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  recommended: { label: 'Recommended', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  standard: { label: 'Standard', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export function StakingValidatorSelectionPage() {
  const c = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [sortBy, setSortBy] = useState<'apy' | 'uptime' | 'commission' | 'staked'>('apy');
  const [filterTier, setFilterTier] = useState<'all' | 'top' | 'recommended' | 'standard'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = VALIDATORS
    .filter(v => {
      const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTier = filterTier === 'all' || v.tier === filterTier;
      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'apy': return b.apy - a.apy;
        case 'uptime': return b.uptime - a.uptime;
        case 'commission': return a.commission - b.commission;
        case 'staked': return b.totalStaked - a.totalStaked;
        default: return 0;
      }
    });

  const topValidator = VALIDATORS.reduce((best, v) => v.apy > best.apy ? v : best);
  const avgCommission = VALIDATORS.reduce((sum, v) => sum + v.commission, 0) / VALIDATORS.length;
  const avgUptime = VALIDATORS.reduce((sum, v) => sum + v.uptime, 0) / VALIDATORS.length;

  return (
    <PageLayout>
      <Header title="Chọn Validator" back />

      {/* Filter Bottom Sheet */}
      <BottomSheetV2
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Bộ lọc & Sắp xếp">
        <div className="flex flex-col gap-4">
          <div>
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Sắp xếp theo</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'apy' as const, label: 'APY cao nhất' },
                { id: 'uptime' as const, label: 'Uptime cao nhất' },
                { id: 'commission' as const, label: 'Phí thấp nhất' },
                { id: 'staked' as const, label: 'Stake nhiều nhất' },
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: sortBy === sort.id ? c.chipActiveBg : c.chipBg,
                    color: sortBy === sort.id ? c.chipActiveText : c.chipText,
                    border: `1px solid ${sortBy === sort.id ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Tier</p>
            <div className="flex gap-2">
              {[
                { id: 'all' as const, label: 'Tất cả' },
                { id: 'top' as const, label: 'Top Tier' },
                { id: 'recommended' as const, label: 'Recommended' },
                { id: 'standard' as const, label: 'Standard' },
              ].map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setFilterTier(tier.id)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: filterTier === tier.id ? c.chipActiveBg : c.chipBg,
                    color: filterTier === tier.id ? c.chipActiveText : c.chipText,
                    border: `1px solid ${filterTier === tier.id ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheetV2>

      {/* Validator Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedValidator}
        onClose={() => setSelectedValidator(null)}
        title="Chi tiết Validator">
        {selectedValidator && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: c.surface2 }}>
                {selectedValidator.logo}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {selectedValidator.name}
                  </p>
                  {selectedValidator.verified && (
                    <CheckCircle2 size={16} color="#10B981" />
                  )}
                </div>
                <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                  {selectedValidator.address}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <BottomSheetRow label="APY" value={`${selectedValidator.apy}%`} valueColor="#10B981" />
              <BottomSheetRow label="Commission" value={`${selectedValidator.commission}%`} />
              <BottomSheetRow label="Uptime" value={`${selectedValidator.uptime}%`} valueColor="#3B82F6" />
              <BottomSheetRow label="Total Staked" value={`${fmtAmount(selectedValidator.totalStaked)} ETH`} />
              <BottomSheetRow label="Delegators" value={selectedValidator.delegators.toLocaleString()} />
              <BottomSheetRow
                label="Slashing Events"
                value={selectedValidator.slashingHistory === 0 ? 'None' : selectedValidator.slashingHistory.toString()}
                valueColor={selectedValidator.slashingHistory === 0 ? '#10B981' : '#EF4444'}
              />
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Mô tả</p>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
                {selectedValidator.description}
              </p>
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Tính năng đặc biệt</p>
              <div className="flex flex-wrap gap-2">
                {selectedValidator.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: c.surface2, color: c.text1 }}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {selectedValidator.website && (
              <a
                href={`https://${selectedValidator.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl text-center text-sm font-semibold"
                style={{ background: c.surface2, color: '#3B82F6' }}>
                Xem website →
              </a>
            )}

            <button
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Chọn Validator này
            </button>

            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                ⚠️ Khi chọn validator riêng, bạn chịu hoàn toàn rủi ro slashing nếu validator vi phạm. Chúng tôi khuyến nghị chọn validator Top Tier hoặc Recommended.
              </p>
            </div>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Tính năng Nâng cao
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Chọn validator riêng để tối ưu APY và kiểm soát rủi ro. Mặc định, chúng tôi tự động phân phối qua nhiều validator uy tín.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={14} color="#10B981" />
                <p style={{ color: c.text3, fontSize: 11 }}>APY tốt nhất</p>
              </div>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                {topValidator.apy}%
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>{topValidator.name}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Clock size={14} color="#3B82F6" />
                <p style={{ color: c.text3, fontSize: 11 }}>Uptime TB</p>
              </div>
              <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700 }}>
                {avgUptime.toFixed(2)}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Users size={14} color="#F59E0B" />
                <p style={{ color: c.text3, fontSize: 11 }}>Commission TB</p>
              </div>
              <p style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>
                {avgCommission.toFixed(1)}%
              </p>
            </div>
          </div>
        </TrCard>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 rounded-xl" style={{ background: c.surface2, height: 44 }}>
            <Search size={18} color={c.text3} />
            <input
              type="text"
              placeholder="Tìm validator..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 14 }}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: (sortBy !== 'apy' || filterTier !== 'all') ? c.primary : c.surface2,
              color: (sortBy !== 'apy' || filterTier !== 'all') ? '#FFF' : c.text1,
            }}>
            <Filter size={18} />
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p style={{ color: c.text2, fontSize: 13 }}>
            {filtered.length} validators
            {(searchQuery || filterTier !== 'all') && ` (đã lọc từ ${VALIDATORS.length})`}
          </p>
          <p style={{ color: c.text3, fontSize: 11 }}>
            Sắp xếp: {sortBy === 'apy' ? 'APY cao' : sortBy === 'uptime' ? 'Uptime cao' : sortBy === 'commission' ? 'Phí thấp' : 'Stake nhiều'}
          </p>
        </div>

        {/* Validator List */}
        <PageSection label="">
          <div className="flex flex-col gap-3">
            {filtered.map(validator => {
              const tierConfig = TIER_CONFIG[validator.tier];
              return (
                <TrCard
                  key={validator.id}
                  hover
                  className="p-4"
                  onClick={() => setSelectedValidator(validator)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: c.surface2 }}>
                      {validator.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }} className="text-truncate">
                          {validator.name}
                        </p>
                        {validator.verified && (
                          <CheckCircle2 size={14} color="#10B981" className="shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: tierConfig.bg, color: tierConfig.color }}>
                          {tierConfig.label}
                        </span>
                        {validator.slashingHistory === 0 && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                            No Slashing
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                        {validator.apy}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Commission</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {validator.commission}%
                      </p>
                    </div>
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Uptime</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {validator.uptime}%
                      </p>
                    </div>
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Delegators</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {(validator.delegators / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>

                  {validator.slashingHistory > 0 && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <AlertTriangle size={14} color="#EF4444" />
                      <p style={{ color: '#EF4444', fontSize: 11 }}>
                        {validator.slashingHistory} slashing event(s) in history
                      </p>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Bottom Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Thông tin validator được cập nhật theo thời gian thực từ blockchain. APY có thể thay đổi dựa trên hiệu suất validator và điều kiện mạng. Chúng tôi khuyến nghị chọn validator có uptime &gt;99.9% và không có lịch sử slashing.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}