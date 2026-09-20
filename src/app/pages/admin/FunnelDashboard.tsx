/**
 * Funnel Dashboard - Conversion Funnel Visualization
 * 
 * Comprehensive funnel dashboard showing:
 * - Funnel waterfall visualization
 * - Dropout rate analysis
 * - Step-by-step metrics
 * - Time-to-completion analysis
 * 
 * @module pages/admin/FunnelDashboard
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ChevronLeft, 
  Filter, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import { funnelTracker } from '../../services/ConversionFunnelTracker';
import { CONVERSION_FUNNELS } from '../../config/dcaFunnels';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface FunnelStep {
  step: string;
  label: string;
  reached: number;
  completed: number;
  completionRate: number;
  dropoutRate: number;
  avgTimeMs: number;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function FunnelDashboard() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [selectedFunnel, setSelectedFunnel] = useState<string>(CONVERSION_FUNNELS[0].id);

  // Get funnel analytics
  const funnelAnalytics = useMemo(() => {
    const funnel = CONVERSION_FUNNELS.find(f => f.id === selectedFunnel);
    if (!funnel) return null;

    const analytics = funnelTracker.getFunnelAnalytics(selectedFunnel);
    
    // Build step data
    const steps: FunnelStep[] = funnel.steps.map((step, idx) => {
      const stepAnalytics = analytics.stepAnalytics.find(s => s.step === step.eventName);
      
      return {
        step: step.eventName,
        label: step.name,
        reached: stepAnalytics?.reached || 0,
        completed: stepAnalytics?.completed || 0,
        completionRate: stepAnalytics?.completionRate || 0,
        dropoutRate: stepAnalytics?.dropoutRate || 0,
        avgTimeMs: stepAnalytics?.avgTimeToComplete || 0,
      };
    });

    return {
      funnel,
      analytics,
      steps,
    };
  }, [selectedFunnel]);

  if (!funnelAnalytics) {
    return null;
  }

  const { funnel, analytics, steps } = funnelAnalytics;

  // Calculate overall metrics
  const totalSessions = analytics.totalSessions;
  const completedSessions = analytics.completedSessions;
  const overallCompletionRate = analytics.completionRate;
  const avgCompletionTime = analytics.avgCompletionTime;

  // Find bottleneck (biggest dropout)
  const bottleneck = steps.reduce((max, step) => 
    step.dropoutRate > (max?.dropoutRate || 0) ? step : max
  , steps[0]);

  // Funnel chart data
  const funnelChartData = steps.map((step, idx) => ({
    name: step.label,
    value: step.reached,
    completed: step.completed,
    dropoutRate: step.dropoutRate,
  }));

  // Dropout chart data
  const dropoutChartData = steps.map((step) => ({
    name: step.label,
    dropout: step.dropoutRate * 100,
  }));

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Funnel Analytics"
        subtitle="Conversion Funnel Tracking"
        back
        breadcrumb
      />

      <PageContent gap="default">
        {/* Funnel Selector */}
        <div>
          <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>
            Chọn funnel
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CONVERSION_FUNNELS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFunnel(f.id)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: selectedFunnel === f.id ? c.surface1 : c.surface2,
                  border: selectedFunnel === f.id ? `2px solid #8B5CF6` : `2px solid transparent`,
                }}
              >
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {f.name}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>
                  {f.steps.length} bước
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Filter size={20} color="#8B5CF6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Phiên</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  {totalSessions}
                </p>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              {completedSessions} hoàn thành
            </p>
          </TrCard>

          <TrCard className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <CheckCircle size={20} color="#10B981" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Tỷ lệ hoàn thành</p>
                <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  {(overallCompletionRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              Trung bình {(avgCompletionTime / 1000).toFixed(0)}s
            </p>
          </TrCard>
        </div>

        {/* Bottleneck Alert */}
        {bottleneck && bottleneck.dropoutRate > 0.3 && (
          <TrCard className="p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Bottleneck phát hiện
                </p>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{bottleneck.label}</span> có tỷ lệ rời bỏ cao nhất ({(bottleneck.dropoutRate * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          </TrCard>
        )}

        {/* Funnel Waterfall */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Funnel Waterfall
            </h2>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const widthPercent = totalSessions > 0 ? (step.reached / totalSessions) * 100 : 0;
              const isBottleneck = step === bottleneck && step.dropoutRate > 0.3;
              
              return (
                <div key={step.step}>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{
                          background: isBottleneck ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)',
                          color: isBottleneck ? '#F59E0B' : '#8B5CF6',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {step.label}
                      </span>
                      {isBottleneck && (
                        <AlertTriangle size={14} color="#F59E0B" />
                      )}
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {step.reached}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        {(widthPercent).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-8 rounded-lg overflow-hidden mb-1" style={{ background: c.surface2 }}>
                    <div
                      className="h-full flex items-center px-3 transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        background: isBottleneck
                          ? 'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(245,158,11,0.15))'
                          : idx === 0
                          ? 'linear-gradient(90deg, rgba(139,92,246,0.3), rgba(139,92,246,0.15))'
                          : idx === steps.length - 1
                          ? 'linear-gradient(90deg, rgba(16,185,129,0.3), rgba(16,185,129,0.15))'
                          : 'linear-gradient(90deg, rgba(59,130,246,0.3), rgba(59,130,246,0.15))',
                      }}
                    >
                      <span style={{ 
                        color: c.text1, 
                        fontSize: 11, 
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}>
                        {step.completed} hoàn thành
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} color="#10B981" />
                      <span style={{ color: c.text3, fontSize: 10 }}>
                        {(step.completionRate * 100).toFixed(1)}% hoàn thành
                      </span>
                    </div>
                    {step.dropoutRate > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingDown size={12} color="#EF4444" />
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          {(step.dropoutRate * 100).toFixed(1)}% rời bỏ
                        </span>
                      </div>
                    )}
                    {step.avgTimeMs > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          ~{(step.avgTimeMs / 1000).toFixed(0)}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* Dropout Rate Chart */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Tỷ lệ rời bỏ theo bước
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dropoutChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
              <XAxis 
                key="x-axis"
                dataKey="name" 
                stroke={c.text3} 
                style={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                key="y-axis"
                stroke={c.text3} 
                style={{ fontSize: 11 }}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: c.text3 } }}
              />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                itemStyle={{ color: c.text1 }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar key="bar-dropout" dataKey="dropout" name="Tỷ lệ rời bỏ" radius={[4, 4, 0, 0]}>
                {dropoutChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.dropout > 30 ? '#F59E0B' : entry.dropout > 20 ? '#3B82F6' : '#10B981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TrCard>

        {/* Step Details */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Chi tiết từng bước
            </h2>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={step.step}
                className="p-3 rounded-lg"
                style={{ background: c.surface2 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{
                        background: 'rgba(139,92,246,0.2)',
                        color: '#8B5CF6',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      {step.label}
                    </p>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Tiếp cận</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {step.reached}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Hoàn thành</p>
                    <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {step.completed}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Tỷ lệ</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {(step.completionRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Thời gian</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {(step.avgTimeMs / 1000).toFixed(0)}s
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* No Data State */}
        {totalSessions === 0 && (
          <TrCard className="p-8">
            <div className="text-center">
              <Filter size={48} color={c.text3} className="mx-auto mb-3" />
              <p style={{ color: c.text2, fontSize: φ.base, fontWeight: 600, marginBottom: 8 }}>
                Chưa có dữ liệu funnel
              </p>
              <p style={{ color: c.text3, fontSize: φ.sm }}>
                Dữ liệu sẽ xuất hiện khi có người dùng đi qua funnel
              </p>
            </div>
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}