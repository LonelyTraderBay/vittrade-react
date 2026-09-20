import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Star, ChevronRight, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtSignedUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CopyTradingHeroCard } from '../../components/copy-trading/CopyTradingHeroCard';
import { SORT_OPTIONS, RISK_LEVELS, TIER_THRESHOLDS, COMPLIANCE_MESSAGES } from '../../constants/copyTrading';
import type { SortOption } from '../../constants/copyTrading';

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: RISK_LEVELS.LOW.color, label: RISK_LEVELS.LOW.label },
  medium: { color: RISK_LEVELS.MEDIUM.color, label: RISK_LEVELS.MEDIUM.label },
  high: { color: RISK_LEVELS.HIGH.color, label: RISK_LEVELS.HIGH.label },
};

// ✅ Move TIER_CONFIG outside component to prevent re-creation
interface TierConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

const getTierConfig = (copiers: number): TierConfig => {
  if (copiers > TIER_THRESHOLDS.PRO) return { icon: Star, color: '#F59E0B', label: 'Pro Trader' };
  if (copiers > TIER_THRESHOLDS.VERIFIED) return { icon: CheckCircle, color: '#10B981', label: 'Verified' };
  return { icon: AlertCircle, color: '#6B7280', label: 'Basic' };
};

export function CopyTradingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [sortBy, setSortBy] = useState<SortOption>('Top ROI');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COPY_TRADERS.map(t => [t.id, t.isFollowing]))
  );

  // ✅ Memoize sorted traders to prevent re-sorting on every render
  const traders = useMemo(() => {
    return [...COPY_TRADERS].sort((a, b) => {
      if (sortBy === 'Top ROI') return b.totalPnlPct - a.totalPnlPct;
      if (sortBy === 'Ổn định nhất') return b.sharpeRatio - a.sharpeRatio;
      if (sortBy === 'Nhiều copier') return b.copiers - a.copiers;
      return b.aum - a.aum;
    });
  }, [sortBy]);

  // ✅ Memoize aggregate metrics
  const { totalCopiers, totalAUM } = useMemo(() => ({
    totalCopiers: COPY_TRADERS.reduce((s, t) => s + t.copiers, 0),
    totalAUM: COPY_TRADERS.reduce((s, t) => s + t.aum, 0),
  }), []);

  return (
    <PageLayout>
      <Header title="Copy Trading" subtitle="Sao chép · Trade" back />

      <PageContent gap="relaxed">
        {/* Hero card — HERO METRIC PATTERN (Variant A) with trend */}
        <CopyTradingHeroCard
          tradersCount={COPY_TRADERS.length}
          copiersCount={totalCopiers}
          totalAUM={totalAUM}
          aumTrend={12.3}
          lastUpdated="2 mins ago"
          variant="hero"
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

        {/* Sort chips — CHANGED TO PILL VARIANT */}
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

        {/* Trader list — INCREASED GAP 12px → 20px */}
        <div className="flex flex-col gap-5">
          {traders.map((trader, idx) => {
            const risk = RISK_CONFIG[trader.riskLevel];
            const isExpanded = expandedId === trader.id;
            const isFollowing = followingMap[trader.id];

            // Determine verification tier (mock logic)
            const tierConfig = getTierConfig(trader.copiers);
            const TierIcon = tierConfig.icon;

            return (
              <TrCard key={trader.id} hover className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: c.primary + '22', border: `2px solid ${c.primary}44` }}>
                      <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{trader.avatar}</span>
                    </div>
                    {/* Verification badge */}
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
                      {/* Verification tier badge */}
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
                      <span className="px-2 py-0.5 rounded-md"
                        style={{ background: risk.color + '15', color: risk.color, fontSize: 9, fontWeight: 600 }}>
                        Rủi ro: {risk.label}
                      </span>
                    </div>
                  </div>

                  {/* ROI + Max DD — EQUAL PROMINENCE */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                        +{trader.totalPnlPct.toFixed(1)}%
                      </p>
                      <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 600 }}>
                        {trader.maxDrawdown.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      <p style={{ color: c.text3, fontSize: 9 }}>Tổng ROI</p>
                      <span style={{ color: c.text3, fontSize: 9 }}>•</span>
                      <p style={{ color: c.text3, fontSize: 9 }}>Max DD</p>
                    </div>
                  </div>
                </div>

                {/* Key metrics — INCREASED LABEL SIZE 9px → 11px */}
                <div className="grid grid-cols-4 gap-2.5 mt-3">
                  {[
                    { label: 'Win Rate', value: `${trader.winRate}%`, color: '#10B981' },
                    { label: 'PnL', value: fmtSignedUsd(trader.totalPnl), color: '#10B981' },
                    { label: 'Copiers', value: `${trader.copiers}`, color: c.primary },
                    { label: 'Sharpe', value: trader.sharpeRatio.toFixed(2), color: '#F59E0B' },
                  ].map(m => (
                    <div key={m.label}>
                      <p style={{ color: c.text3, fontSize: 11 }}>{m.label}</p>
                      <p style={{ color: m.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mini weekly chart with CLEAR LABEL */}
                <div className="mt-3">
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>P/L 7 ngày gần nhất</p>
                  <div className="flex items-end gap-1 h-6">
                    {trader.weeklyPnl.map((v, i) => (
                      <div key={i} className="flex-1 rounded-sm"
                        style={{
                          height: `${Math.max(15, Math.abs(v) * 10 + 5)}%`,
                          background: v >= 0 ? '#10B981' : '#EF4444',
                          opacity: 0.7,
                          minHeight: 3,
                        }} />
                    ))}
                  </div>
                </div>

                {/* CTA — "Xem chi tiết" instead of "Copy ngay" */}
                <button
                  onClick={() => navigate(`${prefix}/trade/copy-provider/${trader.id}`)}
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

        {/* Past Performance Disclaimer — REGULATORY REQUIREMENT */}
        <div className="mt-2 mb-4">
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
            Hiệu suất quá khứ không đảm bảo kết quả tương lai. Tất cả chỉ số mang tính tham khảo. Copy Trading có rủi ro cao, chỉ đầu tư với số tiền bạn có thể chấp nhận mất.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}