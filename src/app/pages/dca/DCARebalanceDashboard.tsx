/**
 * DCA Rebalance Dashboard
 * 
 * Monitor and execute portfolio rebalancing:
 * - Current drift status
 * - Rebalance preview
 * - Execute rebalance
 * - View history
 * 
 * @module pages/dca/DCARebalanceDashboard
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Play,
  History,
  Settings,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import {
  rebalanceService,
  type PortfolioHolding
} from '../../services/DCARebalanceService';

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const MOCK_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'BTC', quantity: 0.5, price: 45000, value: 22500, currentPercent: 50 },
  { symbol: 'ETH', quantity: 8, price: 2500, value: 20000, currentPercent: 44.44 },
  { symbol: 'USDT', quantity: 2500, price: 1, value: 2500, currentPercent: 5.56 },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCARebalanceDashboard() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Get config
  const config = configId ? rebalanceService.getConfig(configId) : null;

  if (!config) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p style={{ color: c.text2 }}>Configuration not found</p>
      </div>
    );
  }

  // Calculate drift and rebalance plan
  const driftAnalysis = rebalanceService.analyzeDrift(config.targets, MOCK_HOLDINGS);
  const needsRebalance = rebalanceService.needsRebalance(config, MOCK_HOLDINGS);
  const rebalancePlan = rebalanceService.createRebalancePlan(config, MOCK_HOLDINGS);
  const historyStats = rebalanceService.getHistoryStats(config.id);

  // Find max drift
  const maxDrift = Math.max(...driftAnalysis.map(d => d.absDrift));

  // Chart data
  const currentChartData = config.targets.map((target) => {
    const holding = MOCK_HOLDINGS.find(h => h.symbol === target.symbol);
    return {
      name: target.symbol,
      value: holding?.value || 0,
    };
  });

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const handleExecuteRebalance = async () => {
    if (!rebalancePlan.canExecute) {
      alert('Cannot execute: ' + rebalancePlan.warnings.join('\n'));
      return;
    }

    try {
      await rebalanceService.executeRebalancePlan(rebalancePlan, config.id);
      alert('Rebalance executed successfully!');
      setShowExecuteModal(false);
      // In real app, refresh holdings data
    } catch (error) {
      alert('Execution failed: ' + error);
    }
  };

  return (
    <PageLayout>
      <Header
        title="Auto-Rebalance"
        subtitle="Bảng điều khiển · DCA"
        back
        right={
          <button
            onClick={() => navigate(`${routePrefix}/dca/rebalance/${configId}/edit`)}
            className="flex items-center justify-center hover-ghost"
            style={{ width: 36, height: 36, borderRadius: 10, background: c.searchBg, border: `1px solid ${c.border}` }}
            aria-label="Settings"
          >
            <Settings size={18} color={c.text2} />
          </button>
        }
      />

      <div className="px-5 py-4 space-y-4">
        {/* Status Banner */}
        {needsRebalance.needed ? (
          <TrCard
            className="p-4"
            style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Rebalance cần thiết
                </p>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  {needsRebalance.reason}
                </p>
              </div>
            </div>
          </TrCard>
        ) : (
          <TrCard
            className="p-4"
            style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} color="#10B981" />
              <div>
                <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                  Danh mục cân bằng
                </p>
                <p style={{ color: c.text3, fontSize: 11 }}>
                  Drift tối đa: {maxDrift.toFixed(2)}%
                </p>
              </div>
            </div>
          </TrCard>
        )}

        {/* Current vs Target Allocation */}
        <div>
          <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600, marginBottom: 12 }}>
            Phân bổ hiện tại
          </h2>

          {/* Pie Chart */}
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={currentChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${((entry.value / rebalancePlan.portfolioValueBefore) * 100).toFixed(1)}%`}
                  labelStyle={{ fontSize: 11, fontWeight: 600 }}
                >
                  {currentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: c.surface2,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="text-center pt-3 border-t" style={{ borderColor: c.divider }}>
              <p style={{ color: c.text3, fontSize: 11 }}>Tổng giá trị</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                ${rebalancePlan.portfolioValueBefore.toLocaleString()}
              </p>
            </div>
          </TrCard>
        </div>

        {/* Drift Analysis */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Phân tích Drift
            </h2>
          </div>

          <div className="space-y-2">
            {driftAnalysis.map((analysis, idx) => {
              const isOverweight = analysis.drift > 0;
              const isUnderweight = analysis.drift < 0;

              return (
                <TrCard key={analysis.symbol} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: COLORS[idx % COLORS.length] + '20' }}
                      >
                        <span style={{ color: COLORS[idx % COLORS.length], fontSize: 12, fontWeight: 700 }}>
                          {analysis.symbol}
                        </span>
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {analysis.currentPercent.toFixed(1)}% → {analysis.targetPercent.toFixed(1)}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          Current → Target
                        </p>
                      </div>
                    </div>

                    {analysis.isDrifting && (
                      <div
                        className="px-2 py-1 rounded"
                        style={{
                          background: isOverweight ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                        }}
                      >
                        <span
                          style={{
                            color: isOverweight ? '#EF4444' : '#3B82F6',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {isOverweight ? 'OVER' : 'UNDER'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Drift Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 10 }}>Drift</span>
                      <div className="flex items-center gap-1">
                        {isOverweight ? (
                          <TrendingUp size={12} color="#EF4444" />
                        ) : isUnderweight ? (
                          <TrendingDown size={12} color="#3B82F6" />
                        ) : null}
                        <span
                          style={{
                            color: analysis.isDrifting ? (isOverweight ? '#EF4444' : '#3B82F6') : c.text2,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {analysis.drift > 0 ? '+' : ''}{analysis.drift.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${analysis.severity * 100}%`,
                          background: analysis.isDrifting
                            ? (isOverweight ? '#EF4444' : '#3B82F6')
                            : '#10B981',
                        }}
                      />
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </div>

        {/* Rebalance Preview */}
        {needsRebalance.needed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play size={18} color={c.text1} />
              <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
                Preview Rebalance
              </h2>
            </div>

            <div className="space-y-2">
              {rebalancePlan.actions
                .filter(a => a.action !== 'hold')
                .map((action) => (
                  <TrCard key={action.symbol} className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: action.action === 'buy'
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        }}
                      >
                        {action.action === 'buy' ? (
                          <TrendingUp size={20} color="#10B981" />
                        ) : (
                          <TrendingDown size={20} color="#EF4444" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {action.action === 'buy' ? 'Mua' : 'Bán'} {action.symbol}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          ${action.tradeAmount.toLocaleString()} • {action.tradeQuantity.toFixed(6)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          style={{
                            color: action.action === 'buy' ? '#10B981' : '#EF4444',
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {action.currentPercent.toFixed(1)}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          → {action.targetPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}

              {/* Fees */}
              <TrCard className="p-3" style={{ background: c.surface2 }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: 11 }}>Phí dự kiến</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                    ${rebalancePlan.estimatedFees.toFixed(2)}
                  </span>
                </div>
              </TrCard>
            </div>

            {/* Execute Button */}
            <button
              onClick={() => setShowExecuteModal(true)}
              disabled={!rebalancePlan.canExecute}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-3"
              style={{
                background: rebalancePlan.canExecute ? '#8B5CF6' : c.divider,
                opacity: rebalancePlan.canExecute ? 1 : 0.5,
              }}
            >
              <Play size={20} color="white" />
              <span style={{ color: 'white', fontSize: φ.base, fontWeight: 600 }}>
                Thực thi Rebalance
              </span>
            </button>

            {rebalancePlan.warnings.length > 0 && (
              <TrCard className="p-3 mt-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
                  <div>
                    {rebalancePlan.warnings.map((warning, idx) => (
                      <p key={idx} style={{ color: '#EF4444', fontSize: 11 }}>
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </TrCard>
            )}
          </div>
        )}

        {/* History Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History size={18} color={c.text1} />
              <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
                Lịch sử
              </h2>
            </div>
            <button
              onClick={() => navigate(`${routePrefix}/dca/rebalance/${configId}/history`)}
              className="flex items-center gap-1 text-[12px]"
              style={{ color: '#8B5CF6', fontWeight: 600 }}
            >
              Xem tất cả
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Tổng lần rebalance</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                {historyStats.totalRebalances}
              </p>
            </TrCard>

            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Tỷ lệ thành công</p>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                {historyStats.successRate.toFixed(0)}%
              </p>
            </TrCard>

            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Drift đã sửa</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                {historyStats.totalDriftCorrected.toFixed(1)}%
              </p>
            </TrCard>

            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Phí đã trả</p>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                ${historyStats.totalFeesPaid.toFixed(2)}
              </p>
            </TrCard>
          </div>
        </div>
      </div>

      {/* Execute Modal */}
      {showExecuteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowExecuteModal(false)}
        >
          <div
            className="w-full rounded-t-3xl p-6 space-y-4"
            style={{ background: c.surface }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700, textAlign: 'center' }}>
              Xác nhận Rebalance
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: c.surface2 }}>
                <span style={{ color: c.text3, fontSize: 12 }}>Tổng giao dịch</span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  {rebalancePlan.actions.filter(a => a.action !== 'hold').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: c.surface2 }}>
                <span style={{ color: c.text3, fontSize: 12 }}>Phí dự kiến</span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  ${rebalancePlan.estimatedFees.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExecuteModal(false)}
                className="flex-1 py-3 rounded-xl"
                style={{ background: c.surface2, color: c.text2, fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                onClick={handleExecuteRebalance}
                className="flex-1 py-3 rounded-xl"
                style={{ background: '#8B5CF6', color: 'white', fontWeight: 600 }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}