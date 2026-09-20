/**
 * DCA Page (Dollar Cost Averaging)
 * 
 * Redesigned to match new compact layout:
 * - Back button + title header
 * - Breadcrumb navigation
 * - Hero section with icon + title + description
 * - Compact overview card (3-column)
 * - Plans list + history tabs
 * - Bottom CTA button
 * 
 * Integrated with:
 * - Analytics tracking (page views, actions)
 * - Feature flags (DCA enabled check)
 * - Funnel tracking (plan creation journey)
 * - Deep linking analytics
 * 
 * @module pages/dca
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, RefreshCw, TrendingUp, Clock, BarChart3, ArrowUpRight, ArrowDownRight, Target, Activity, Sliders, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { DCAProvider, useDCA } from '../../contexts/DCAContext';
import { DCAOverviewCard } from '../../components/dca/DCAOverviewCard';
import { DCAPlanCard } from '../../components/dca/DCAPlanCard';
import { DCAHistoryChart } from '../../components/dca/DCAHistoryChart';
import { DCACreatePlanSheet } from '../../components/dca/DCACreatePlanSheet';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';

// Analytics & Feature Flags
import { useDCAAnalytics, usePageViewTracking } from '../../hooks/useDCAAnalytics';
import { useDCAEnabled } from '../../hooks/useFeatureFlag';
import { useWalletToCreationFunnel, useAssetToCreationFunnel } from '../../hooks/useFunnelTracking';

type Tab = 'plans' | 'history';

function DCAPageContent() {
  const {
    overview,
    plans,
    portfolioHistory,
    createPlan,
    togglePlanStatus,
    deletePlan,
    isLoading,
    isCreating,
  } = useDCA();

  const c = useThemeColors();
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticSelection } = useHaptic();
  const routePrefix = useRoutePrefix();
  const { isLoading: isRefreshLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 600 });
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);
  const [chartSheetOpen, setChartSheetOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('90d');
  const [preselectedCoin, setPreselectedCoin] = useState<string | null>(null);

  // Feature Flag: Check if DCA is enabled
  const isDCAEnabled = useDCAEnabled();

  // Analytics: Track page view
  usePageViewTracking('dca_page');

  // Analytics: Track events
  const {
    trackEvent,
    trackDeepLink,
    trackPlanCreation,
    trackPlanStatusChange,
    trackPlanDeletion,
  } = useDCAAnalytics();

  // Funnel: Track wallet to creation (if coming from wallet)
  const { trackDCAPageView: trackWalletFunnelPageView, trackCreateSheetOpened: trackWalletFunnelCreateSheet } = useWalletToCreationFunnel();

  // Funnel: Track asset to creation (if coming from asset detail with deep link)
  const {
    trackCreateSheetOpened: trackAssetFunnelCreateSheet,
    trackPreselectedCoinUsed,
  } = useAssetToCreationFunnel();

  // Track page view in funnels
  useEffect(() => {
    trackWalletFunnelPageView();
  }, [trackWalletFunnelPageView]);

  // ═══════════════════════════════════════════════════════════
  // Deep link handling — Enterprise-grade one-time initialization
  // ═══════════════════════════════════════════════════════════
  // Reads preselectedCoin from sessionStorage (set by TradePage chip).
  // sessionStorage approach avoids all history stack pollution:
  //   - No location.state → no phantom entries on back navigation
  //   - No navigate(replace) needed → no race conditions
  //   - Auto-cleanup via removeItem → no re-trigger on back/forward
  // Also supports legacy ?coin=BTC query param for backward compat.
  // ═══════════════════════════════════════════════════════════
  const deepLinkProcessedRef = useRef(false);

  useEffect(() => {
    if (deepLinkProcessedRef.current) return;

    // Priority 1: sessionStorage (new pattern — zero history pollution)
    const sessionPreselect = sessionStorage.getItem('dca_preselect');
    // Priority 2: query param (legacy backward compat)
    const queryPreselect = new URLSearchParams(location.search).get('coin');

    const coin = sessionPreselect || queryPreselect;
    if (!coin) return;

    // Mark as processed
    deepLinkProcessedRef.current = true;

    // Immediately clean up sessionStorage to prevent re-trigger
    if (sessionPreselect) {
      sessionStorage.removeItem('dca_preselect');
    }

    setPreselectedCoin(coin);
    setCreateSheetOpen(true);

    // Track deep link usage
    trackDeepLink(coin, true);
    trackAssetFunnelCreateSheet();
  }, []); // Empty deps — run once on mount only

  const handleCreatePlan = async (request: any) => {
    try {
      await createPlan(request);
      toast.success('Tạo kế hoạch DCA thành công!');
      
      // Track plan creation in analytics
      trackPlanCreation(
        request.id || 'temp',
        request.coinSymbol,
        request.frequency,
        request.amount,
        preselectedCoin ? 'asset_detail' : 'dca_page'
      );
      
      // Track if preselected coin was used
      if (preselectedCoin && request.coinSymbol === preselectedCoin) {
        trackPreselectedCoinUsed();
      }
      
      setCreateSheetOpen(false);
      setPreselectedCoin(null);
    } catch (error) {
      toast.error('Không thể tạo kế hoạch. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      const plan = plans.find((p) => p.id === planId);
      await togglePlanStatus(planId);
      
      // Track status change
      const newStatus = plan?.status === 'active' ? 'paused' : 'active';
      trackPlanStatusChange(planId, newStatus as 'active' | 'paused');
      toast.success(
        plan?.status === 'active' ? 'Đã tạm dừng kế hoạch' : 'Đã kích hoạt kế hoạch'
      );
    } catch (error) {
      toast.error('Không thể cập nhật kế hoạch');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPlanId) return;
    try {
      await deletePlan(deleteConfirmPlanId);
      
      // Track plan deletion
      trackPlanDeletion(deleteConfirmPlanId, 'user_initiated');
      
      toast.success('Đã xóa kế hoạch');
      setDeleteConfirmPlanId(null);
    } catch (error) {
      toast.error('Không thể xóa kế hoạch');
    }
  };

  // Generate sparkline data from portfolio history (sample ~30 points from 90 days)
  const sparklineData = useMemo(() => {
    if (portfolioHistory.length < 2) return undefined;
    // Sample every 3rd point to get ~30 data points for a smooth sparkline
    const step = Math.max(1, Math.floor(portfolioHistory.length / 30));
    const sampled: number[] = [];
    for (let i = 0; i < portfolioHistory.length; i += step) {
      sampled.push(portfolioHistory[i].portfolioValue);
    }
    // Always include the last point
    const lastVal = portfolioHistory[portfolioHistory.length - 1].portfolioValue;
    if (sampled[sampled.length - 1] !== lastVal) {
      sampled.push(lastVal);
    }
    return sampled;
  }, [portfolioHistory]);

  // Filter portfolio history by selected timeframe for expanded chart
  const filteredChartData = useMemo(() => {
    if (portfolioHistory.length === 0) return [];
    if (chartTimeframe === 'all') return portfolioHistory;

    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 } as const;
    const days = daysMap[chartTimeframe];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return portfolioHistory.filter((point) => point.date >= cutoff);
  }, [portfolioHistory, chartTimeframe]);

  // Timeframe label map
  const TIMEFRAME_OPTIONS: { key: '7d' | '30d' | '90d' | 'all'; label: string }[] = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: 'all', label: 'Tất cả' },
  ];

  // Compute P&L for the selected timeframe
  const timeframePnL = useMemo(() => {
    if (filteredChartData.length < 2) return null;

    const first = filteredChartData[0];
    const last = filteredChartData[filteredChartData.length - 1];

    const valueChange = last.portfolioValue - first.portfolioValue;
    const percentChange =
      first.portfolioValue > 0
        ? (valueChange / first.portfolioValue) * 100
        : 0;

    // Also calculate invested change within the period
    const investedChange = last.totalInvested - first.totalInvested;

    return {
      valueChange,
      percentChange,
      investedChange,
      isProfit: valueChange >= 0,
    };
  }, [filteredChartData]);

  // Subtitle for chart based on timeframe
  const TIMEFRAME_SUBTITLE: Record<string, string> = {
    '7d': '7 ngày qua',
    '30d': '30 ngày qua',
    '90d': '90 ngày qua',
    all: 'Toàn bộ',
  };

  // Feature flag gate: Show disabled message if DCA is not enabled
  if (!isDCAEnabled) {
    return (
      <div className="min-h-full flex items-center justify-center p-5">
        <div className="text-center">
          <h2 className="text-[20px] font-semibold mb-2" style={{ color: c.text1 }}>
            Tính năng DCA tạm thời không khả dụng
          </h2>
          <p className="text-[14px] mb-4" style={{ color: c.text2 }}>
            Chúng tôi đang cập nhật tính năng này. Vui lòng quay lại sau.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-white rounded-lg"
            style={{ background: c.primary }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="min-h-full pb-32 flex flex-col">
      <Header
        variant="page"
        title="Mua tự động (DCA)"
        subtitle="Tự động mua crypto định kỳ"
        back
      />

      {/* Content */}
      <PageContent gap="relaxed">
        {/* Overview Card */}
        <DCAOverviewCard
          data={overview}
          sparklineData={sparklineData}
          onSparklineTap={() => setChartSheetOpen(true)}
          isLoading={isLoading || isRefreshLoading}
          actions={{
            onCreatePlan: () => {
              setCreateSheetOpen(true);
              trackEvent('dca_create_sheet_opened', { source: 'overview_card' });
              trackWalletFunnelCreateSheet();
            },
            onPauseAll: () => {
              const activePlan = plans.find((p) => p.status === 'active');
              if (activePlan) {
                handleToggleStatus(activePlan.id);
              } else {
                toast.info('Không có kế hoạch nào đang chạy');
              }
            },
            onViewChart: () => {
              setChartSheetOpen(true);
              trackEvent('dca_chart_opened', { source: 'overview_card' });
            },
            onViewHistory: () => {
              setActiveTab('history');
              trackEvent('dca_tab_switched', { tab: 'history' });
            },
          }}
        />

        {/* Advanced Tools Section */}
        <div className="space-y-3">
          <p
            className="text-[14px]"
            style={{ fontWeight: 600, color: c.text1 }}
          >
            Công cụ nâng cao
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Portfolio Optimizer */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/portfolio-optimizer`);
                trackEvent('dca_tool_opened', { tool: 'portfolio_optimizer' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Target className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </div>
              <span
                className="text-[13px] mb-1"
                style={{ fontWeight: 600, color: c.text1 }}
              >
                Portfolio Optimizer
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Frontier, risk, backtest
              </span>
            </button>

            {/* Dynamic Amount */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/dynamic-amount`);
                trackEvent('dca_tool_opened', { tool: 'dynamic_amount' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(59,130,246,0.12)' }}
              >
                <Activity className="w-5 h-5" style={{ color: '#3B82F6' }} />
              </div>
              <span
                className="text-[13px] mb-1"
                style={{ fontWeight: 600, color: c.text1 }}
              >
                Dynamic Amount
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Điều chỉnh lượng mua thông minh
              </span>
            </button>

            {/* Auto-Rebalance */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/rebalance/config`);
                trackEvent('dca_tool_opened', { tool: 'rebalance' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <Sliders className="w-5 h-5" style={{ color: '#10B981' }} />
              </div>
              <span
                className="text-[13px] mb-1"
                style={{ fontWeight: 600, color: c.text1 }}
              >
                Auto-Rebalance
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Cân bằng danh mục tự động
              </span>
            </button>

            {/* Smart Schedule */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/schedule/config`);
                trackEvent('dca_tool_opened', { tool: 'schedule' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
              </div>
              <span
                className="text-[13px] mb-1"
                style={{ fontWeight: 600, color: c.text1 }}
              >
                Smart Schedule
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Lịch mua theo thị trường
              </span>
            </button>
          </div>
        </div>

        {/* Plans List (if any) */}
        {plans.length > 0 && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: c.surface2 }}>
              <button
                onClick={() => {
                  setActiveTab('plans');
                  trackEvent('dca_tab_switched', { tab: 'plans' });
                }}
                className="flex-1 h-10 rounded-lg text-[14px] transition-all shadow-sm"
                style={{
                  fontWeight: 500,
                  background: activeTab === 'plans' ? c.surface : 'transparent',
                  color: activeTab === 'plans' ? c.text1 : c.text2,
                  boxShadow: activeTab === 'plans' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Kế hoạch ({plans.length})
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  trackEvent('dca_tab_switched', { tab: 'history' });
                }}
                className="flex-1 h-10 rounded-lg text-[14px] transition-all"
                style={{
                  fontWeight: 500,
                  background: activeTab === 'history' ? c.surface : 'transparent',
                  color: activeTab === 'history' ? c.text1 : c.text2,
                  boxShadow: activeTab === 'history' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Lịch sử
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'plans' && (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <DCAPlanCard
                    key={plan.id}
                    plan={plan}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(planId) => toast.info('Chỉnh sửa coming soon')}
                    onDelete={(planId) => setDeleteConfirmPlanId(planId)}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {portfolioHistory.length > 0 ? (
                  <DCAHistoryChart data={portfolioHistory} height={300} />
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.surface2 }}>
                      <BarChart3 className="w-8 h-8" style={{ color: c.text3 }} />
                    </div>
                    <h3
                      className="text-[18px] mb-2"
                      style={{ fontWeight: 500, color: c.text1 }}
                    >
                      Chưa có lịch sử
                    </h3>
                    <p className="text-[14px]" style={{ color: c.text2 }}>
                      Lịch sử sẽ xuất hiện sau khi bạn thực hiện giao dịch đầu tiên
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State (no plans) */}
        {plans.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.surface2 }}>
              <Clock className="w-8 h-8" style={{ color: c.text3 }} />
            </div>
            <h3
              className="text-[18px] mb-2"
              style={{ fontWeight: 500, color: c.text1 }}
            >
              Chưa có kế hoạch DCA
            </h3>
            <p className="text-[14px] mb-6" style={{ color: c.text2 }}>
              Tạo kế hoạch đầu tiên để bắt đầu đầu tư tự động
            </p>
          </div>
        )}
      </PageContent>

      {/* Bottom CTA */}
      <div className="fixed left-0 right-0 flex justify-center px-5 z-10" style={{ bottom: 92 }}>
        <button
          onClick={() => {
            hapticSelection();
            setCreateSheetOpen(true);
            trackEvent('dca_create_sheet_opened', { source: 'bottom_cta' });
            trackWalletFunnelCreateSheet();
          }}
          className="w-[calc(100%-56px)] max-w-[320px] h-[48px] rounded-[14px] text-white text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
          style={{ fontWeight: 600, background: c.primary }}
        >
          <Plus className="w-5 h-5" />
          Tạo kế hoạch mới
        </button>
      </div>

      {/* Create Plan Sheet */}
      <DCACreatePlanSheet
        open={createSheetOpen}
        onClose={() => {
          setCreateSheetOpen(false);
          setPreselectedCoin(null);
        }}
        onCreate={handleCreatePlan}
        isCreating={isCreating}
        preselectedCoin={preselectedCoin}
      />

      {/* Delete Confirmation Sheet */}
      <BottomSheetV2
        open={deleteConfirmPlanId !== null}
        onClose={() => setDeleteConfirmPlanId(null)}
        title="Xác nhận xóa"
        preventClose={isLoading}
      >
        <div className="space-y-6">
          <p className="text-[14px]" style={{ color: c.text2 }}>
            Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmPlanId(null)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl text-[14px] transition-colors disabled:opacity-50"
              style={{ fontWeight: 500, background: c.surface2, color: c.text1 }}
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl text-white text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontWeight: 500, background: c.error }}
            >
              {isLoading ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </BottomSheetV2>

      {/* Expanded Chart Sheet (from sparkline tap) */}
      <BottomSheetV2
        open={chartSheetOpen}
        onClose={() => setChartSheetOpen(false)}
        title="Biểu đồ danh mục"
      >
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px]" style={{ color: c.text3 }}>
                Giá trị hiện tại
              </p>
              <p
                className="text-[23px]"
                style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, color: c.text1 }}
              >
                {new Intl.NumberFormat('vi-VN').format(Math.round(overview.currentValue))} VND
              </p>
            </div>
            <div
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[14px]
                ${
                  overview.profitLoss >= 0
                    ? 'bg-[rgba(16,185,129,0.1)]'
                    : 'bg-[rgba(239,68,68,0.1)]'
                }
              `}
              style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: overview.profitLoss >= 0 ? c.buy : c.sell }}
            >
              {overview.profitLoss >= 0 ? '+' : ''}
              {overview.profitLossPercent.toFixed(1).replace('.', ',')}%
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: c.surface2 }}>
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setChartTimeframe(option.key)}
                className="flex-1 h-9 rounded-lg text-[13px] transition-all"
                style={{
                  fontWeight: chartTimeframe === option.key ? 600 : 400,
                  background: chartTimeframe === option.key ? c.surface : 'transparent',
                  color: chartTimeframe === option.key ? c.text1 : c.text2,
                  boxShadow: chartTimeframe === option.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Timeframe P&L summary */}
          {timeframePnL && (
            <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px]" style={{ color: c.text3 }}>
                  Biến động {TIMEFRAME_SUBTITLE[chartTimeframe]}
                </span>
                <div
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px]
                    ${
                      timeframePnL.isProfit
                        ? 'bg-[rgba(16,185,129,0.1)]'
                        : 'bg-[rgba(239,68,68,0.1)]'
                    }
                  `}
                  style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: timeframePnL.isProfit ? c.buy : c.sell }}
                >
                  {timeframePnL.isProfit ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {timeframePnL.isProfit ? '+' : ''}
                  {timeframePnL.percentChange.toFixed(2).replace('.', ',')}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: c.text3 }}>
                    Thay đổi giá trị
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: timeframePnL.isProfit ? c.buy : c.sell }}
                  >
                    {timeframePnL.isProfit ? '+' : ''}
                    {new Intl.NumberFormat('vi-VN').format(Math.round(timeframePnL.valueChange))} VND
                  </p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: c.text3 }}>
                    Đã nạp thêm
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: c.text1 }}
                  >
                    +{new Intl.NumberFormat('vi-VN').format(Math.round(timeframePnL.investedChange))} VND
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full interactive chart */}
          {portfolioHistory.length > 0 ? (
            <DCAHistoryChart
              data={filteredChartData}
              height={280}
              subtitle={TIMEFRAME_SUBTITLE[chartTimeframe]}
              interactive
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-[14px]" style={{ color: c.text3 }}>
                Chưa có dữ liệu biểu đồ
              </p>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setChartSheetOpen(false)}
            className="w-full h-12 rounded-xl text-[14px] transition-colors"
            style={{ fontWeight: 500, background: c.surface2, color: c.text1 }}
          >
            Đóng
          </button>
        </div>
      </BottomSheetV2>
    </PullToRefresh>
  );
}

export default function DCAPage() {
  return <DCAPageContent />;
}