/**
 * ══════════════════════════════════════════════════════════════
 *  CopyTradingPageV2.tsx — Version with Variant Switcher
 * ══════════════════════════════════════════════════════════════
 * 
 * Route: /trade/copy-trading-v2
 * Cho phép bạn thử 3 variants: Clean / Bold / Glass
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, TrendingUp, Shield, Zap, Star, ChevronRight, Copy, BarChart3, Target, AlertTriangle, AlertCircle, CheckCircle, Palette } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtUsd, fmtPct, fmtCompact, fmtSignedUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CopyTradingHeroCard } from '../../components/copy-trading/CopyTradingHeroCard';

const SORT_OPTIONS = ['Top ROI', 'Ổn định nhất', 'Nhiều copier', 'AUM cao'];
const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#10B981', label: 'Thấp' },
  medium: { color: '#F59E0B', label: 'Trung bình' },
  high: { color: '#EF4444', label: 'Cao' },
};

export function CopyTradingPageV2() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [sortBy, setSortBy] = useState('Top ROI');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(
    Object.fromEntries(COPY_TRADERS.map(t => [t.id, t.isFollowing]))
  );
  const [heroVariant, setHeroVariant] = useState<'clean' | 'bold' | 'glass'>('clean');

  // Verification tier config (moved inside component to access theme colors)
  const TIER_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    verified: { icon: CheckCircle, color: '#10B981', label: 'Verified' },
    pro: { icon: Star, color: '#F59E0B', label: 'Pro' },
    basic: { icon: AlertCircle, color: c.text3, label: 'Basic' },
  };

  const traders = [...COPY_TRADERS].sort((a, b) => {
    if (sortBy === 'Top ROI') return b.totalPnlPct - a.totalPnlPct;
    if (sortBy === 'Ổn định nhất') return b.sharpeRatio - a.sharpeRatio;
    if (sortBy === 'Nhiều copier') return b.copiers - a.copiers;
    return b.aum - a.aum;
  });

  const totalCopiers = COPY_TRADERS.reduce((s, t) => s + t.copiers, 0);
  const totalAUM = COPY_TRADERS.reduce((s, t) => s + t.aum, 0);

  return (
    <PageLayout>
      <Header title="Copy Trading v2" subtitle="With Variant Switcher" back />

      <PageContent gap="relaxed">
        {/* Variant Switcher */}
        <div className="rounded-[14px] p-3 flex items-center gap-3"
          style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
          <Palette size={18} color={c.primary} />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
              Card Style:
            </p>
          </div>
          <div className="flex gap-2">
            {(['clean', 'bold', 'glass'] as const).map(variant => (
              <button
                key={variant}
                onClick={() => setHeroVariant(variant)}
                className="px-3 py-1.5 rounded-lg transition-all capitalize"
                style={{
                  background: heroVariant === variant ? c.primary : 'transparent',
                  color: heroVariant === variant ? '#fff' : c.text2,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${heroVariant === variant ? c.primary : c.border}`,
                }}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>

        {/* Hero card with selected variant */}
        <CopyTradingHeroCard
          tradersCount={COPY_TRADERS.length}
          copiersCount={totalCopiers}
          totalAUM={totalAUM}
          variant={heroVariant}
        />

        {/* ESMA-compliant Risk Warning */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <AlertTriangle size={16} color={c.warningText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Cảnh báo rủi ro
            </p>
            <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              Copy Trading có rủi ro cao. Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai. Bạn có thể mất toàn bộ vốn đầu tư.
            </p>
          </div>
        </div>

        {/* Sort chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setSortBy(opt)}
              className="shrink-0 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all"
              style={{
                background: sortBy === opt ? c.primary : c.surface2,
                color: sortBy === opt ? '#fff' : c.text2,
                fontWeight: sortBy === opt ? 600 : 500,
              }}>{opt}</button>
          ))}
        </div>

        {/* Trader list */}
        <div className="flex flex-col gap-5">
          {traders.slice(0, 3).map((trader) => {
            const risk = RISK_CONFIG[trader.riskLevel];
            const isExpanded = expandedId === trader.id;
            const isFollowing = followingMap[trader.id];

            const verificationTier = trader.copiers > 3000 ? 'pro' : trader.copiers > 1000 ? 'verified' : 'basic';
            const tierConfig = TIER_CONFIG[verificationTier];
            const TierIcon = tierConfig.icon;

            return (
              <TrCard key={trader.id} hover className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: c.primary + '22', border: `2px solid ${c.primary}44` }}>
                      <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{trader.avatar}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: c.surface, border: `1.5px solid ${tierConfig.color}` }}>
                      <TierIcon size={11} color={tierConfig.color} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{trader.name}</span>
                      {isFollowing && <Star size={12} fill="#F59E0B" color="#F59E0B" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{ background: tierConfig.color + '15', color: tierConfig.color, fontSize: 9, fontWeight: 600 }}>
                        {tierConfig.label}
                      </span>
                      {trader.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md"
                          style={{ background: c.surface2, color: c.text2, fontSize: 9, fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                      +{trader.totalPnlPct.toFixed(1)}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Tổng ROI</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`${prefix}/copy-trading/${trader.id}`)}
                  className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: c.surface2,
                    color: c.text1,
                    height: 40,
                    fontWeight: 600,
                    fontSize: 13,
                  }}>
                  <span>Xem chi tiết</span>
                  <ChevronRight size={14} />
                </button>
              </TrCard>
            );
          })}
        </div>
      </PageContent>
    </PageLayout>
  );
}
