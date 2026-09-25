import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { DCAOverviewCard } from '../components/DCAOverviewCard';
import { DCAPlanCard } from '../components/DCAPlanCard';
import { DCAHistoryChart } from '../components/DCAHistoryChart';
import { DCACreatePlanSheet } from '../components/DCACreatePlanSheet';
import { DCAAdvancedToolsSection } from '../components/DCAAdvancedToolsSection';
import { DCAExpandedChartSheet } from '../components/DCAExpandedChartSheet';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { PullToRefresh } from '@/shared/ui/PullToRefresh';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  useCreateDCAPlanMutation,
  useDCASnapshotQuery,
  useDeleteDCAPlanMutation,
  useUpdateDCAPlanMutation,
} from '../model/dca-queries';
import type {
  CreateDCAPlanRequest,
  DCAFrequency,
  DCAPortfolioHistoryPoint,
} from '../model/dca-types';
import { normalizeCoinSymbol, readDcaPreselectedCoin } from '@/shared/types/route-state';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useAuth } from '@/shared/session/useAuth';

type DCAEventProperties = Record<string, string>;
type DCACreationSource = 'asset_detail' | 'dca_page';
type DCATrackEvent = (eventName: string, properties?: DCAEventProperties) => void;

export interface DCAMainPageProps {
  isEnabled: boolean;
  isDevelopment: boolean;
  analytics: {
    trackEvent: DCATrackEvent;
    trackDeepLink: (coinSymbol: string, converted: boolean) => void;
    trackPlanCreation: (
      planId: string,
      coinSymbol: string,
      frequency: DCAFrequency,
      amount: number,
      source?: DCACreationSource,
    ) => void;
    trackPlanStatusChange: (planId: string, status: 'active' | 'paused') => void;
    trackPlanDeletion: (planId: string, reason?: string) => void;
  };
  funnels: {
    trackWalletPageView: () => void;
    trackWalletCreateSheetOpened: () => void;
    trackAssetCreateSheetOpened: () => void;
    trackPreselectedCoinUsed: () => void;
  };
}
type Tab = 'plans' | 'history';
const EMPTY_PORTFOLIO_HISTORY: DCAPortfolioHistoryPoint[] = [];

function DCAPageContent({ isEnabled, isDevelopment, analytics, funnels }: DCAMainPageProps) {
  const c = useThemeColors();
  const { hasPermission } = useAuth();
  const canManageDCA = hasPermission('dca:write');
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticSelection } = useHaptic();
  const routePrefix = useRoutePrefix();
  const snapshotQuery = useDCASnapshotQuery({ enabled: isEnabled });
  const createPlanMutation = useCreateDCAPlanMutation();
  const updatePlanMutation = useUpdateDCAPlanMutation();
  const deletePlanMutation = useDeleteDCAPlanMutation();
  const overview = snapshotQuery.data?.overview ?? {
    currentValue: 0,
    totalInvested: 0,
    profitLoss: 0,
    profitLossPercent: 0,
    activePlans: 0,
    pausedPlans: 0,
    errorPlans: 0,
    nextExecution: null,
  };
  const plans = snapshotQuery.data?.plans ?? [];
  const portfolioHistory = snapshotQuery.data?.portfolioHistory ?? EMPTY_PORTFOLIO_HISTORY;
  const isLoading =
    snapshotQuery.isPending || updatePlanMutation.isPending || deletePlanMutation.isPending;
  const isCreating = createPlanMutation.isPending;
  const isRefreshLoading = snapshotQuery.isFetching && !snapshotQuery.isPending;
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const lastRefreshedLabel = lastRefreshedAt?.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const refresh = useCallback(async () => {
    await snapshotQuery.refetch();
    setRefreshCount((count) => count + 1);
    setLastRefreshedAt(new Date());
  }, [snapshotQuery]);
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);
  const [chartSheetOpen, setChartSheetOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('90d');
  const [preselectedCoin, setPreselectedCoin] = useState<string | null>(null);

  const isDCAEnabled = isEnabled;
  const { trackEvent, trackDeepLink, trackPlanCreation, trackPlanStatusChange, trackPlanDeletion } =
    analytics;
  const {
    trackWalletPageView: trackWalletFunnelPageView,
    trackWalletCreateSheetOpened: trackWalletFunnelCreateSheet,
    trackAssetCreateSheetOpened: trackAssetFunnelCreateSheet,
    trackPreselectedCoinUsed,
  } = funnels;

  // Track page view in funnels
  useEffect(() => {
    trackWalletFunnelPageView();
  }, [trackWalletFunnelPageView]);
  // ═══════════════════════════════════════════════════════════
  // Deep link handling — Enterprise-grade one-time initialization
  // ═══════════════════════════════════════════════════════════
  // Đọc deep-link state một lần rồi xóa khỏi history entry hiện tại.
  // Không dùng storage phía client cho dữ liệu điều hướng hay dữ liệu giao dịch.
  // Vẫn hỗ trợ ?coin=BTC để tương thích URL cũ.
  // ═══════════════════════════════════════════════════════════
  const deepLinkProcessedRef = useRef(false);
  const createAttemptKey = useRef<{ signature: string; key: string } | null>(null);
  const updateAttemptKeys = useRef(new Map<string, string>());
  const deleteAttemptKeys = useRef(new Map<string, string>());
  const statePreselect = readDcaPreselectedCoin(location.state);
  const queryPreselect = normalizeCoinSymbol(new URLSearchParams(location.search).get('coin'));

  useEffect(() => {
    if (deepLinkProcessedRef.current) return;
    if (!canManageDCA) return;

    const coin = statePreselect || queryPreselect;
    if (!coin) return;

    // Mark as processed
    deepLinkProcessedRef.current = true;

    // Xóa state sau khi tiêu thụ để back/forward không mở lại form ngoài ý muốn.
    if (statePreselect) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }

    setPreselectedCoin(coin);
    setCreateSheetOpen(true);

    // Track deep link usage
    trackDeepLink(coin, true);
    trackAssetFunnelCreateSheet();
  }, [
    location.pathname,
    location.search,
    navigate,
    queryPreselect,
    statePreselect,
    trackAssetFunnelCreateSheet,
    trackDeepLink,
    canManageDCA,
  ]);

  const handleCreatePlan = async (request: CreateDCAPlanRequest) => {
    if (!canManageDCA) {
      toast.error('Bạn không có quyền quản lý kế hoạch DCA.');
      return;
    }
    const signature = JSON.stringify(request);
    if (createAttemptKey.current?.signature !== signature) {
      createAttemptKey.current = { signature, key: crypto.randomUUID() };
    }
    try {
      const createdPlan = await createPlanMutation.mutateAsync({
        request,
        idempotencyKey: createAttemptKey.current.key,
      });
      toast.success('Tạo kế hoạch DCA thành công!');

      // Track plan creation in analytics
      trackPlanCreation(
        createdPlan.id,
        request.coinSymbol,
        request.frequency,
        request.amountPerPurchase,
        preselectedCoin ? 'asset_detail' : 'dca_page',
      );

      // Track if preselected coin was used
      if (preselectedCoin && request.coinSymbol === preselectedCoin) {
        trackPreselectedCoinUsed();
      }

      createAttemptKey.current = null;
      setCreateSheetOpen(false);
      setPreselectedCoin(null);
    } catch {
      toast.error('Không thể tạo kế hoạch. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    if (!canManageDCA) {
      toast.error('Bạn không có quyền quản lý kế hoạch DCA.');
      return;
    }
    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) throw new Error('DCA plan not found');
      const newStatus = plan.status === 'active' ? 'paused' : 'active';
      const signature = JSON.stringify({ planId, status: newStatus });
      const idempotencyKey = updateAttemptKeys.current.get(signature) ?? crypto.randomUUID();
      updateAttemptKeys.current.set(signature, idempotencyKey);
      await updatePlanMutation.mutateAsync({
        planId,
        request: { status: newStatus },
        idempotencyKey,
      });

      // Track status change
      trackPlanStatusChange(planId, newStatus);
      updateAttemptKeys.current.delete(signature);
      toast.success(plan?.status === 'active' ? 'Đã tạm dừng kế hoạch' : 'Đã kích hoạt kế hoạch');
    } catch {
      toast.error('Không thể cập nhật kế hoạch');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPlanId) return;
    if (!canManageDCA) {
      toast.error('Bạn không có quyền quản lý kế hoạch DCA.');
      return;
    }
    const idempotencyKey =
      deleteAttemptKeys.current.get(deleteConfirmPlanId) ?? crypto.randomUUID();
    deleteAttemptKeys.current.set(deleteConfirmPlanId, idempotencyKey);
    try {
      await deletePlanMutation.mutateAsync({
        planId: deleteConfirmPlanId,
        idempotencyKey,
      });

      // Track plan deletion
      trackPlanDeletion(deleteConfirmPlanId, 'user_initiated');

      deleteAttemptKeys.current.delete(deleteConfirmPlanId);
      toast.success('Đã xóa kế hoạch');
      setDeleteConfirmPlanId(null);
    } catch {
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
    const percentChange = first.portfolioValue > 0 ? (valueChange / first.portfolioValue) * 100 : 0;

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

  if (snapshotQuery.isError && !snapshotQuery.data) {
    return <ErrorState onAction={() => void snapshotQuery.refetch()} />;
  }

  return (
    <PullToRefresh
      onRefresh={refresh}
      lastRefreshedLabel={lastRefreshedLabel}
      refreshCount={refreshCount}
      className="min-h-full pb-32 flex flex-col"
    >
      <Header variant="page" title="Mua tự động (DCA)" subtitle="Tự động mua crypto định kỳ" back />

      {/* Content */}
      <PageContent gap="relaxed">
        {/* Overview Card */}
        <DCAOverviewCard
          data={overview}
          sparklineData={sparklineData}
          onSparklineTap={() => setChartSheetOpen(true)}
          isLoading={isLoading || isRefreshLoading}
          actions={{
            onCreatePlan: canManageDCA
              ? () => {
                  setCreateSheetOpen(true);
                  trackEvent('dca_create_sheet_opened', { source: 'overview_card' });
                  trackWalletFunnelCreateSheet();
                }
              : undefined,
            onPauseAll: canManageDCA
              ? () => {
                  const activePlan = plans.find((p) => p.status === 'active');
                  if (activePlan) {
                    handleToggleStatus(activePlan.id);
                  } else {
                    toast.info('Không có kế hoạch nào đang chạy');
                  }
                }
              : undefined,
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

        <DCAAdvancedToolsSection
          isDevelopment={isDevelopment}
          routePrefix={routePrefix}
          trackEvent={trackEvent}
        />

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
                    onToggleStatus={canManageDCA ? handleToggleStatus : undefined}
                    onDelete={canManageDCA ? (planId) => setDeleteConfirmPlanId(planId) : undefined}
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
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: c.surface2 }}
                    >
                      <BarChart3 className="w-8 h-8" style={{ color: c.text3 }} />
                    </div>
                    <h3 className="text-[18px] mb-2" style={{ fontWeight: 500, color: c.text1 }}>
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
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: c.surface2 }}
            >
              <Clock className="w-8 h-8" style={{ color: c.text3 }} />
            </div>
            <h3 className="text-[18px] mb-2" style={{ fontWeight: 500, color: c.text1 }}>
              Chưa có kế hoạch DCA
            </h3>
            <p className="text-[14px] mb-6" style={{ color: c.text2 }}>
              Tạo kế hoạch đầu tiên để bắt đầu đầu tư tự động
            </p>
          </div>
        )}
      </PageContent>

      {/* Bottom CTA */}
      {canManageDCA && (
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
      )}

      {/* Create Plan Sheet */}
      <DCACreatePlanSheet
        open={createSheetOpen && canManageDCA}
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

      <DCAExpandedChartSheet
        isOpen={chartSheetOpen}
        onClose={() => setChartSheetOpen(false)}
        overview={overview}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
        timeframeOptions={TIMEFRAME_OPTIONS}
        timeframeSubtitle={TIMEFRAME_SUBTITLE[chartTimeframe]}
        timeframePnL={timeframePnL}
        portfolioHistory={portfolioHistory}
        filteredChartData={filteredChartData}
      />
    </PullToRefresh>
  );
}

export function DCAMainPage(props: DCAMainPageProps) {
  return <DCAPageContent {...props} />;
}
