/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderLeaderboardPage — Phase 2: Discovery & Ranking
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Multi-dimensional provider ranking
 * - Filters (risk/strategy/verification/timeframe)
 * - Red flag warnings
 * - Survivorship bias disclaimer
 * - Provider quick preview
 * 
 * Compliance:
 * - No "top traders" without context
 * - Survivorship bias notice required
 * - Equal prominence for risk metrics
 * - Past performance disclaimers
 * 
 * Guidelines:
 * - PageLayout + filter chips
 * - Card-based list
 * - Sort by multiple metrics
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  TrendingUp, Shield, Users, Clock, Award, AlertTriangle,
  Filter, ChevronDown, Eye, CheckCircle, XCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';

type SortBy = 'roi' | 'sharpe' | 'followers' | 'recent';
type RiskFilter = 'all' | 'low' | 'medium' | 'high';
type TimeFrame = '7d' | '30d' | '90d' | 'all';

export function ProviderLeaderboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [sortBy, setSortBy] = useState<SortBy>('roi');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Sort & filter providers
  const filteredProviders = useMemo(() => {
    let providers = [...COPY_TRADERS];
    
    // Filter by risk
    if (riskFilter !== 'all') {
      providers = providers.filter(p => p.riskLevel === riskFilter);
    }
    
    // Filter by verified
    if (verifiedOnly) {
      providers = providers.filter(p => p.verified);
    }
    
    // Sort
    providers.sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          return b.totalPnlPct - a.totalPnlPct;
        case 'sharpe':
          return b.sharpeRatio - a.sharpeRatio;
        case 'followers':
          return b.followers - a.followers;
        case 'recent':
          return b.totalPnlPct * 0.3 - a.totalPnlPct * 0.3; // Mock 30d return
        default:
          return 0;
      }
    });
    
    return providers;
  }, [sortBy, riskFilter, verifiedOnly]);

  // Red flags detection
  const getRedFlags = (provider: typeof COPY_TRADERS[0]) => {
    const flags: string[] = [];
    if (provider.maxDrawdown > 20) flags.push('High drawdown');
    if (provider.sharpeRatio < 1) flags.push('Low Sharpe');
    if (provider.totalPnlPct > 100 && provider.totalTrades < 50) flags.push('Low sample size');
    return flags;
  };

  return (
    <PageLayout>
      <Header title="Leaderboard" back />

      <PageContent gap="relaxed">
        {/* Survivorship Bias Warning */}
        <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                Survivorship Bias Warning
              </p>
              <p style={{ color: c.warningText, fontSize: 9, lineHeight: 1.5 }}>
                Leaderboard chỉ hiển thị providers đang active. Nhiều traders đã thua lỗ và dừng 
                không xuất hiện ở đây. Hiệu suất thực tế của ngành có thể thấp hơn nhiều.
              </p>
            </div>
          </div>
        </div>

        {/* Sort Tabs */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'roi', label: 'ROI' },
            { id: 'sharpe', label: 'Sharpe' },
            { id: 'followers', label: 'Followers' },
            { id: 'recent', label: '30D' },
          ]}
          active={sortBy}
          onChange={(id) => setSortBy(id as SortBy)}
        />

        {/* Filters */}
        <div className="space-y-3">
          {/* Risk Filter */}
          <div>
            <p style={{ color: c.text2, fontSize: 11, marginBottom: 6 }}>Risk Level</p>
            <div className="flex gap-2">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'low' as const, label: 'Low' },
                { id: 'medium' as const, label: 'Medium' },
                { id: 'high' as const, label: 'High' },
              ].map(risk => (
                <button
                  key={risk.id}
                  onClick={() => setRiskFilter(risk.id)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: riskFilter === risk.id ? c.primary : c.surface2,
                    color: riskFilter === risk.id ? '#fff' : c.text2,
                    border: `1px solid ${riskFilter === risk.id ? c.primary : c.border}`,
                    fontWeight: riskFilter === risk.id ? 600 : 500,
                  }}
                >
                  {risk.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className="w-full p-3 rounded-xl flex items-center justify-between"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={14} color={verifiedOnly ? c.primary : c.text3} />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                Chỉ hiện Verified providers
              </span>
            </div>
            <div 
              className="w-12 h-6 rounded-full transition-all relative"
              style={{
                background: verifiedOnly ? c.primary : c.border,
              }}
            >
              <div 
                className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
                style={{ left: verifiedOnly ? '24px' : '2px' }}
              />
            </div>
          </button>
        </div>

        {/* Results Count */}
        <p style={{ color: c.text3, fontSize: 11 }}>
          Hiển thị {filteredProviders.length} providers
        </p>

        {/* Provider List */}
        <div className="space-y-3">
          {filteredProviders.map((provider, index) => {
            const redFlags = getRedFlags(provider);
            const rank = index + 1;
            
            return (
              <button
                key={provider.id}
                onClick={() => navigate(`${prefix}/trade/copy-provider/${provider.id}`)}
                className="w-full p-4 rounded-2xl text-left"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex gap-3">
                  {/* Rank Badge */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ 
                      background: rank <= 3 ? '#F59E0B22' : c.surface2,
                      border: rank <= 3 ? '2px solid #F59E0B' : 'none',
                    }}
                  >
                    <span style={{ 
                      color: rank <= 3 ? '#F59E0B' : c.text2,
                      fontSize: 14,
                      fontWeight: 700
                    }}>
                      #{rank}
                    </span>
                  </div>

                  {/* Provider Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{provider.name}</p>
                      {provider.verified && (
                        <CheckCircle size={12} color={c.primary} />
                      )}
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ 
                          background: provider.riskLevel === 'low' ? '#10B98122' : 
                                      provider.riskLevel === 'medium' ? '#F59E0B22' : '#EF444422',
                          color: provider.riskLevel === 'low' ? '#10B981' : 
                                 provider.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
                          fontWeight: 600,
                        }}
                      >
                        {provider.riskLevel.toUpperCase()}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 1 }}>ROI</p>
                        <p style={{ 
                          color: provider.totalPnlPct >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 13,
                          fontWeight: 700
                        }}>
                          {provider.totalPnlPct >= 0 ? '+' : ''}{provider.totalPnlPct.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 1 }}>Sharpe</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {provider.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 1 }}>Max DD</p>
                        <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
                          {provider.maxDrawdown.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Followers */}
                    <div className="flex items-center gap-1 mb-2">
                      <Users size={10} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: 10 }}>
                        {provider.followers.toLocaleString()} followers
                      </span>
                    </div>

                    {/* Red Flags */}
                    {redFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {redFlags.map(flag => (
                          <span 
                            key={flag}
                            className="px-2 py-0.5 rounded text-xs flex items-center gap-1"
                            style={{ 
                              background: c.dangerBg,
                              color: c.dangerText,
                            }}
                          >
                            <AlertTriangle size={9} />
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <Eye size={16} color={c.text3} className="shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5, textAlign: 'center' }}>
            Rankings dựa trên hiệu suất lịch sử và không đảm bảo kết quả tương lai. 
            Provider xếp hạng cao vẫn có thể thua lỗ trong tương lai. 
            Luôn đọc kỹ risk disclosure trước khi copy.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
