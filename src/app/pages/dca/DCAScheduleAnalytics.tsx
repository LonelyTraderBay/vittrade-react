/**
 * DCA Smart Schedule Analytics
 * 
 * Monitor and analyze scheduling decisions:
 * - Recent decisions
 * - Execution timeline
 * - Savings metrics
 * - Pattern insights
 * 
 * @module pages/dca/DCAScheduleAnalytics
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import { smartSchedulingService } from '../../services/DCASmartSchedulingService';

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
  });
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCAScheduleAnalytics() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  // Get config and stats
  const config = configId ? smartSchedulingService.getConfig(configId) : null;
  const stats = smartSchedulingService.getStats(configId);
  const recentDecisions = smartSchedulingService.getRecentDecisions(10);

  // Generate mock decisions if empty (for demo)
  const mockDecisions = useMemo(() => {
    if (recentDecisions.length > 0) return recentDecisions;

    if (!config) return [];

    // Generate 5 mock decisions
    const now = Date.now();
    const decisions = [];
    for (let i = 0; i < 5; i++) {
      const scheduledTime = now + (i * 24 * 60 * 60 * 1000); // Daily
      const decision = smartSchedulingService.makeDecision(config, scheduledTime);
      decisions.push(decision);
    }
    return decisions;
  }, [config, recentDecisions]);

  if (!config) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p style={{ color: c.text2 }}>Configuration not found</p>
      </div>
    );
  }

  // Chart data - hourly pattern
  const hourlyPatternData = Array.from({ length: 24 }, (_, hour) => {
    const patterns = smartSchedulingService['patterns'].filter(p => p.hour === hour);
    const avgVolatility = patterns.reduce((sum, p) => sum + p.avgVolatility, 0) / patterns.length;
    const avgGasPrice = patterns.reduce((sum, p) => sum + p.avgGasPrice, 0) / patterns.length;

    return {
      hour: `${hour}:00`,
      volatility: avgVolatility,
      gas: avgGasPrice,
    };
  });

  return (
    <PageLayout>
      <Header
        title="Smart Scheduling"
        subtitle="Phân tích · DCA"
        back
      />

      <PageContent gap="default">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 11 }}>Tổng quyết định</p>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
              {stats.totalDecisions || mockDecisions.length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color="#10B981" />
              <p style={{ color: c.text3, fontSize: 11 }}>Đã điều chỉnh</p>
            </div>
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
              {stats.adjustmentsMade || mockDecisions.filter(d => d.shouldAdjust).length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} color="#8B5CF6" />
              <p style={{ color: c.text3, fontSize: 11 }}>Vol tiết kiệm</p>
            </div>
            <p style={{ color: '#8B5CF6', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
              {stats.volatilitySavings.toFixed(1)}%
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} color="#F59E0B" />
              <p style={{ color: c.text3, fontSize: 11 }}>Gas tiết kiệm</p>
            </div>
            <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
              {stats.gasSavings.toFixed(0)} gwei
            </p>
          </TrCard>
        </div>

        {/* Hourly Pattern Chart */}
        {config.strategy !== 'fixed' && (
          <div>
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600, marginBottom: 12 }}>
              Pattern theo giờ
            </h2>

            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={hourlyPatternData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis
                    key="xaxis"
                    dataKey="hour"
                    stroke={c.text3}
                    style={{ fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis key="yaxis" stroke={c.text3} style={{ fontSize: 10 }} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
                  {(config.strategy === 'volatility' || config.strategy === 'hybrid') && (
                    <Line
                      key="line-volatility"
                      type="monotone"
                      dataKey="volatility"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                      name="Volatility (%)"
                      isAnimationActive={false}
                    />
                  )}
                  {(config.strategy === 'gas-optimized' || config.strategy === 'hybrid') && (
                    <Line
                      key="line-gas"
                      type="monotone"
                      dataKey="gas"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                      name="Gas (gwei)"
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>

              <p style={{ color: c.text3, fontSize: 10, marginTop: 8, textAlign: 'center' }}>
                Giờ tốt nhất: 2am-8am (volatility & gas thấp)
              </p>
            </TrCard>
          </div>
        )}

        {/* Recent Decisions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Quyết định gần đây
            </h2>
            <button className="flex items-center gap-1" style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>
              Xem tất cả
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {mockDecisions.slice(0, 5).map((decision, idx) => {
              const isAdjusted = decision.shouldAdjust;
              const isDelayed = decision.adjustmentHours > 0;

              return (
                <TrCard key={decision.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isAdjusted
                          ? (isDelayed ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)')
                          : 'rgba(16,185,129,0.15)',
                      }}
                    >
                      {isAdjusted ? (
                        isDelayed ? (
                          <TrendingUp size={20} color="#F59E0B" />
                        ) : (
                          <TrendingDown size={20} color="#3B82F6" />
                        )
                      ) : (
                        <CheckCircle size={20} color="#10B981" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {formatDate(decision.scheduledTime)}
                        </p>
                        {isAdjusted && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: isDelayed ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                              color: isDelayed ? '#F59E0B' : '#3B82F6',
                            }}
                          >
                            {isDelayed ? 'DELAYED' : 'ADVANCED'}
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={12} color={c.text3} />
                        <span style={{ color: c.text2, fontSize: 11 }}>
                          {formatTime(decision.scheduledTime)}
                          {isAdjusted && (
                            <>
                              {' → '}
                              <span style={{ color: isDelayed ? '#F59E0B' : '#3B82F6', fontWeight: 600 }}>
                                {formatTime(decision.recommendedTime)}
                              </span>
                              <span style={{ color: c.text3 }}>
                                {' '}({isDelayed ? '+' : ''}{decision.adjustmentHours.toFixed(1)}h)
                              </span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Reasoning */}
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        {decision.reasoning[0]}
                      </p>

                      {/* Metrics */}
                      {isAdjusted && (
                        <div className="flex items-center gap-3 mt-2">
                          {(config.strategy === 'volatility' || config.strategy === 'hybrid') && (
                            <div className="flex items-center gap-1">
                              <TrendingDown size={10} color="#8B5CF6" />
                              <span style={{ color: c.text3, fontSize: 9 }}>
                                Vol: {decision.scheduledCondition.volatility.toFixed(1)}%
                                {' → '}
                                {decision.recommendedCondition.volatility.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {(config.strategy === 'gas-optimized' || config.strategy === 'hybrid') && (
                            <div className="flex items-center gap-1">
                              <Zap size={10} color="#F59E0B" />
                              <span style={{ color: c.text3, fontSize: 9 }}>
                                Gas: {decision.scheduledCondition.gasPrice.toFixed(0)}
                                {' → '}
                                {decision.recommendedCondition.gasPrice.toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </div>

        {/* Config Summary */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 12 }}>
            Cấu hình hiện tại
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: c.divider }}>
              <span style={{ color: c.text3, fontSize: 11 }}>Chiến lược</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                {config.strategy.charAt(0).toUpperCase() + config.strategy.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: c.divider }}>
              <span style={{ color: c.text3, fontSize: 11 }}>Khung giờ</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                {config.timePreference.charAt(0).toUpperCase() + config.timePreference.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: c.divider }}>
              <span style={{ color: c.text3, fontSize: 11 }}>Điều chỉnh</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                -{config.maxAdvanceHours}h / +{config.maxDelayHours}h
              </span>
            </div>

            {config.volatilityThreshold && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: c.divider }}>
                <span style={{ color: c.text3, fontSize: 11 }}>Ngưỡng volatility</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                  {'<'} {config.volatilityThreshold}%
                </span>
              </div>
            )}

            {config.gasPriceThreshold && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: c.divider }}>
                <span style={{ color: c.text3, fontSize: 11 }}>Ngưỡng gas</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                  {'<'} {config.gasPriceThreshold} gwei
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span style={{ color: c.text3, fontSize: 11 }}>Trạng thái</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  background: config.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                  color: config.enabled ? '#10B981' : '#6B7280',
                }}
              >
                {config.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </TrCard>

        {/* Performance Insights */}
        {stats.totalDecisions > 0 && (
          <TrCard className="p-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-start gap-3">
              <TrendingUp size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#8B5CF6', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Performance Insight
                </p>
                <p style={{ color: c.text2, fontSize: 11 }}>
                  Smart Scheduling đã điều chỉnh {stats.adjustmentsMade} lần,
                  tiết kiệm trung bình {stats.volatilitySavings.toFixed(1)}% volatility và{' '}
                  {stats.gasSavings.toFixed(0)} gwei gas fees mỗi lần thực thi.
                </p>
              </div>
            </div>
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}