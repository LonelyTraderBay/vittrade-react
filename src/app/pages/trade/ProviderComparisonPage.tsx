/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderComparisonPage — Phase 2: Provider Side-by-Side
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Compare up to 5 providers side-by-side
 * - Metrics comparison table
 * - Fee impact comparison
 * - Execution quality comparison
 * - Risk-adjusted performance
 * 
 * Compliance:
 * - Equal prominence for all providers
 * - No ranking without context
 * - Past performance disclaimers
 * 
 * Guidelines:
 * - Horizontal scroll table on mobile
 * - Sticky first column (provider names)
 * - Color-coded best/worst values
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { 
  TrendingUp, TrendingDown, Shield, DollarSign, Activity,
  Clock, Target, Eye, Plus, X, ChevronRight, AlertTriangle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';

interface ComparisonMetric {
  label: string;
  key: string;
  format: (value: any) => string;
  higherIsBetter: boolean;
  category: 'performance' | 'risk' | 'execution' | 'cost';
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  // Performance
  { label: 'Total ROI', key: 'totalPnlPct', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, higherIsBetter: true, category: 'performance' },
  { label: '30D Return', key: 'monthlyReturn', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, higherIsBetter: true, category: 'performance' },
  { label: 'Win Rate', key: 'winRate', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true, category: 'performance' },
  { label: 'Avg Trade', key: 'avgTrade', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, higherIsBetter: true, category: 'performance' },
  
  // Risk
  { label: 'Sharpe Ratio', key: 'sharpeRatio', format: (v) => v.toFixed(2), higherIsBetter: true, category: 'risk' },
  { label: 'Max Drawdown', key: 'maxDrawdown', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: false, category: 'risk' },
  { label: 'Volatility', key: 'volatility', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: false, category: 'risk' },
  { label: 'Risk Score', key: 'riskScore', format: (v) => v.toFixed(0), higherIsBetter: false, category: 'risk' },
  
  // Execution
  { label: 'Avg Slippage', key: 'avgSlippage', format: (v) => `${v.toFixed(2)}%`, higherIsBetter: false, category: 'execution' },
  { label: 'Avg Delay', key: 'avgDelay', format: (v) => `${v.toFixed(1)}s`, higherIsBetter: false, category: 'execution' },
  { label: 'Fill Rate', key: 'fillRate', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true, category: 'execution' },
  
  // Cost
  { label: 'Performance Fee', key: 'performanceFee', format: (v) => `${v}%`, higherIsBetter: false, category: 'cost' },
  { label: 'Est. Monthly Cost', key: 'monthlyCost', format: (v) => `$${v.toFixed(0)}`, higherIsBetter: false, category: 'cost' },
];

export function ProviderComparisonPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [searchParams] = useSearchParams();
  
  // Get provider IDs from URL params
  const initialIds = searchParams.get('ids')?.split(',') || ['trader-1', 'trader-2', 'trader-3'];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.slice(0, 5));
  
  const selectedProviders = selectedIds
    .map(id => COPY_TRADERS.find(t => t.id === id))
    .filter(Boolean) as typeof COPY_TRADERS;

  // Add mock data for comparison
  const providersWithData = selectedProviders.map(p => ({
    ...p,
    monthlyReturn: p.totalPnlPct * 0.3,
    avgTrade: p.totalPnlPct / p.totalTrades,
    volatility: 12.5 + Math.random() * 5,
    riskScore: p.riskLevel === 'low' ? 35 : p.riskLevel === 'medium' ? 60 : 85,
    avgSlippage: 0.4 + Math.random() * 0.4,
    avgDelay: 1.5 + Math.random() * 2,
    fillRate: 96 + Math.random() * 3,
    performanceFee: 10 + Math.floor(Math.random() * 20),
    monthlyCost: 50 + Math.random() * 150,
  }));

  const getBestValue = (metric: ComparisonMetric) => {
    const values = providersWithData.map(p => (p as any)[metric.key]);
    return metric.higherIsBetter 
      ? Math.max(...values)
      : Math.min(...values);
  };

  const isbestValue = (metric: ComparisonMetric, value: any) => {
    const best = getBestValue(metric);
    return Math.abs(value - best) < 0.01;
  };

  const removeProvider = (id: string) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    }
  };

  return (
    <PageLayout>
      <Header 
        title="So sánh Providers" 
        back
        action={{
          icon: Plus,
          onClick: () => navigate(`${prefix}/trade/copy-trading`),
        }}
      />

      <PageContent gap="relaxed">
        {/* Warning Banner */}
        <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
            <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5 }}>
              So sánh dựa trên hiệu suất lịch sử. Hiệu suất quá khứ không đảm bảo kết quả tương lai.
            </p>
          </div>
        </div>

        {/* Provider Count */}
        <div className="flex items-center justify-between">
          <p style={{ color: c.text2, fontSize: 12 }}>
            Đang so sánh {selectedIds.length}/5 providers
          </p>
          {selectedIds.length < 5 && (
            <button
              onClick={() => navigate(`${prefix}/trade/copy-trading`)}
              className="text-xs"
              style={{ color: c.primary, fontWeight: 600 }}
            >
              + Thêm provider
            </button>
          )}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 p-3 text-left" style={{ background: c.bg, minWidth: 120 }}>
                  <span style={{ color: c.text3, fontSize: 10 }}>Metric</span>
                </th>
                {providersWithData.map(provider => (
                  <th key={provider.id} className="p-3 text-center relative" style={{ minWidth: 100 }}>
                    <button
                      onClick={() => removeProvider(provider.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: c.dangerBg }}
                    >
                      <X size={10} color={c.dangerText} />
                    </button>
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}
                      >
                        <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>{provider.avatar}</span>
                      </div>
                      <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{provider.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Performance Section */}
              <tr>
                <td colSpan={selectedIds.length + 1} className="p-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={12} color={c.primary} />
                    <span style={{ color: c.primary, fontSize: 11, fontWeight: 700 }}>Performance</span>
                  </div>
                </td>
              </tr>
              {COMPARISON_METRICS.filter(m => m.category === 'performance').map(metric => (
                <tr key={metric.key}>
                  <td className="sticky left-0 z-10 p-3" style={{ background: c.bg }}>
                    <span style={{ color: c.text2, fontSize: 11 }}>{metric.label}</span>
                  </td>
                  {providersWithData.map(provider => {
                    const value = (provider as any)[metric.key];
                    const isBest = isbestValue(metric, value);
                    return (
                      <td key={provider.id} className="p-3 text-center">
                        <span style={{ 
                          color: isBest ? '#10B981' : c.text1,
                          fontSize: 12,
                          fontWeight: isBest ? 700 : 600
                        }}>
                          {metric.format(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Risk Section */}
              <tr>
                <td colSpan={selectedIds.length + 1} className="p-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700 }}>Risk</span>
                  </div>
                </td>
              </tr>
              {COMPARISON_METRICS.filter(m => m.category === 'risk').map(metric => (
                <tr key={metric.key}>
                  <td className="sticky left-0 z-10 p-3" style={{ background: c.bg }}>
                    <span style={{ color: c.text2, fontSize: 11 }}>{metric.label}</span>
                  </td>
                  {providersWithData.map(provider => {
                    const value = (provider as any)[metric.key];
                    const isBest = isbestValue(metric, value);
                    return (
                      <td key={provider.id} className="p-3 text-center">
                        <span style={{ 
                          color: isBest ? '#10B981' : c.text1,
                          fontSize: 12,
                          fontWeight: isBest ? 700 : 600
                        }}>
                          {metric.format(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Execution Section */}
              <tr>
                <td colSpan={selectedIds.length + 1} className="p-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Activity size={12} color="#3B82F6" />
                    <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>Execution</span>
                  </div>
                </td>
              </tr>
              {COMPARISON_METRICS.filter(m => m.category === 'execution').map(metric => (
                <tr key={metric.key}>
                  <td className="sticky left-0 z-10 p-3" style={{ background: c.bg }}>
                    <span style={{ color: c.text2, fontSize: 11 }}>{metric.label}</span>
                  </td>
                  {providersWithData.map(provider => {
                    const value = (provider as any)[metric.key];
                    const isBest = isbestValue(metric, value);
                    return (
                      <td key={provider.id} className="p-3 text-center">
                        <span style={{ 
                          color: isBest ? '#10B981' : c.text1,
                          fontSize: 12,
                          fontWeight: isBest ? 700 : 600
                        }}>
                          {metric.format(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Cost Section */}
              <tr>
                <td colSpan={selectedIds.length + 1} className="p-2 pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={12} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>Cost</span>
                  </div>
                </td>
              </tr>
              {COMPARISON_METRICS.filter(m => m.category === 'cost').map(metric => (
                <tr key={metric.key}>
                  <td className="sticky left-0 z-10 p-3" style={{ background: c.bg }}>
                    <span style={{ color: c.text2, fontSize: 11 }}>{metric.label}</span>
                  </td>
                  {providersWithData.map(provider => {
                    const value = (provider as any)[metric.key];
                    const isBest = isbestValue(metric, value);
                    return (
                      <td key={provider.id} className="p-3 text-center">
                        <span style={{ 
                          color: isBest ? '#10B981' : c.text1,
                          fontSize: 12,
                          fontWeight: isBest ? 700 : 600
                        }}>
                          {metric.format(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
            <span style={{ color: c.text3, fontSize: 10 }}>= Giá trị tốt nhất trong nhóm</span>
          </div>
          <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
            "Tốt nhất" không có nghĩa là "phù hợp nhất". Xem xét risk tolerance và mục tiêu đầu tư của bạn.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-2">
          {providersWithData.map(provider => (
            <button
              key={provider.id}
              onClick={() => navigate(`${prefix}/trade/copy-provider/${provider.id}`)}
              className="w-full p-3 rounded-xl flex items-center justify-between"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}
                >
                  <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>{provider.avatar}</span>
                </div>
                <div className="text-left">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    {provider.name}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Xem chi tiết & bắt đầu copy
                  </p>
                </div>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>
          ))}
        </div>
      </PageContent>
    </PageLayout>
  );
}
