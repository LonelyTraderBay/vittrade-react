import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Clock, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useP2PAdsQuery, useP2POverviewQuery } from '../model/p2p-queries';
import type { P2PAd } from '../model/p2p-types';
import { ErrorState } from '@/shared/ui/ErrorState';
import { OfflineBanner } from '@/shared/ui/OfflineBanner';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useRefresh } from '@/shared/hooks/useRefresh';
import { TOAST } from '@/shared/constants/toastMessages';
import { PullToRefresh } from '@/shared/ui/PullToRefresh';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { ContextMenuSheet, P2PQuickActionsSheet } from '../components/P2PHomeActionSheets';
import { CompareBar } from '../components/P2PHomeCards';
import { P2PMarketplaceSections } from '../components/P2PMarketplaceSections';
import { filterMarketplaceAds } from '../lib/filter-marketplace-ads';

const EMPTY_P2P_ADS: P2PAd[] = [];
export interface P2PMarketplacePageProps {
  onQuickActionsOpen?: () => void;
  onContextMenuOpen?: () => void;
}

export function P2PMarketplacePage({
  onQuickActionsOpen,
  onContextMenuOpen,
}: P2PMarketplacePageProps = {}) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const prefix = useRoutePrefix();

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('USDT');
  const [fiatCurrency, setFiatCurrency] = useState('VND');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'completion' | 'orders'>('price');
  const [filterPayment, setFilterPayment] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [merchantType, setMerchantType] = useState<'all' | 'elite' | 'pro' | 'verified'>('all');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const p2pAdsQuery = useP2PAdsQuery({ asset, currency: fiatCurrency });
  const p2pOverviewQuery = useP2POverviewQuery();
  const p2pAds = p2pAdsQuery.data?.items ?? EMPTY_P2P_ADS;
  const overview = p2pOverviewQuery.data;

  /* ─── Context Menu and Compare states ─── */
  const [contextMenuAd, setContextMenuAd] = useState<P2PAd | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [compareList, setCompareList] = useState<P2PAd[]>([]);

  /* ─── Quick buy/sell action ─── */
  const handleQuickAction = useCallback(
    (ad: P2PAd, type: 'buy' | 'sell') => {
      actionToast.info(`Mở offer để xác nhận ${type === 'buy' ? 'mua' : 'bán'} ${ad.asset}.`);
      navigate(`${prefix}/p2p/ad/${encodeURIComponent(ad.id)}`);
    },
    [actionToast, navigate, prefix],
  );

  /* ─── Context menu actions ─── */
  const handleContextMenu = useCallback((ad: P2PAd) => {
    setContextMenuAd(ad);
    setShowContextMenu(true);
  }, []);

  const handleShareOffer = useCallback(async () => {
    if (!contextMenuAd) return;

    try {
      const shareUrl = `${window.location.origin}${prefix}/p2p/ad/${encodeURIComponent(contextMenuAd.id)}`;
      await navigator.clipboard.writeText(shareUrl);
      actionToast.success(TOAST.P2P.SHARE_COPIED);
    } catch {
      actionToast.error('Không thể sao chép liên kết offer.');
    }
  }, [contextMenuAd, prefix, actionToast]);

  const handleCompare = useCallback(() => {
    if (!contextMenuAd) return;
    setCompareList((prev) => {
      if (prev.find((ad) => ad.id === contextMenuAd.id)) return prev;
      if (prev.length >= 3) {
        toast.warning('Tối đa 3 offer so sánh cùng lúc', { duration: 1500 });
        return prev;
      }
      return [...prev, contextMenuAd];
    });
    actionToast.info(TOAST.P2P.COMPARE_ADDED(contextMenuAd.merchant));
  }, [contextMenuAd, actionToast]);

  const handleClearCompare = useCallback(() => {
    setCompareList([]);
    actionToast.info(TOAST.P2P.COMPARE_CLEARED);
  }, [actionToast]);

  const handleViewMerchant = useCallback(() => {
    if (!contextMenuAd) return;
    navigate(`${prefix}/p2p/merchant/${contextMenuAd.merchantId}`);
  }, [contextMenuAd, navigate, prefix]);

  const userLevel = overview?.userLevel;
  const currentLevelData = overview?.tradingLevels.find(
    (level) => level.id === userLevel?.currentLevel,
  );

  const allPaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    p2pAds.forEach((ad) => ad.paymentMethods.forEach((method) => methods.add(method)));
    return Array.from(methods);
  }, [p2pAds]);

  const ads = useMemo(
    () =>
      filterMarketplaceAds({
        ads: p2pAds,
        tab,
        asset,
        searchText,
        filterPayment,
        merchantType,
        amountInput,
        sortBy,
      }),
    [p2pAds, tab, asset, searchText, filterPayment, merchantType, amountInput, sortBy],
  );

  const activeFilterCount = [
    filterPayment,
    merchantType !== 'all',
    amountInput,
    sortBy !== 'price',
  ].filter(Boolean).length;

  const handleTabSwitch = useCallback(
    (newTab: 'buy' | 'sell') => {
      setTab(newTab);
      hapticSelection();
    },
    [hapticSelection],
  );
  const { refresh, lastRefreshedLabel, refreshCount } = useRefresh();
  const hasError = p2pAdsQuery.isError || p2pOverviewQuery.isError;
  const handleRefresh = async () => {
    await Promise.all([p2pAdsQuery.refetch(), p2pOverviewQuery.refetch()]);
    refresh();
  };

  if (hasError) {
    return (
      <PageContent padding="compact">
        <ErrorState
          title="Không thể tải P2P"
          message="Dữ liệu marketplace chưa sẵn sàng. Vui lòng thử lại."
          onAction={() => void handleRefresh()}
        />
      </PageContent>
    );
  }

  if (p2pAdsQuery.isPending || p2pOverviewQuery.isPending || !userLevel || !currentLevelData) {
    return (
      <PageContent padding="compact">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <RefreshCw size={28} color={c.primary} className="animate-spin" />
          <p style={{ color: c.text2, fontSize: 13 }}>Đang tải dữ liệu P2P…</p>
        </div>
      </PageContent>
    );
  }

  const platformStats = overview.platformStats;

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      lastRefreshedLabel={lastRefreshedLabel}
      refreshCount={refreshCount}
      className="min-h-full pb-4"
    >
      {/* Offline / Error states (§18.1) */}
      <OfflineBanner showStaleHint />
      {hasError && (
        <div className="px-5 py-8">
          <ErrorState title="Không thể tải P2P" onAction={() => void handleRefresh()} />
        </div>
      )}
      {/* Header — variant="page" module index (§21.4) */}
      <Header
        variant="page"
        title="P2P"
        subtitle={`Lv.${userLevel.currentLevel} · P2P Trading`}
        back
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center justify-center hover-ghost"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: c.searchBg,
                border: `1px solid ${c.border}`,
              }}
              aria-label="Tuỳ chọn P2P"
            >
              <Plus size={18} color={c.text1} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => navigate(`${prefix}/p2p/my-orders`)}
              className="flex items-center justify-center hover-ghost"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: c.searchBg,
                border: `1px solid ${c.border}`,
              }}
              aria-label="Lịch sử lệnh"
            >
              <Clock size={18} color={c.text1} strokeWidth={1.8} />
            </button>
          </div>
        }
      />

      <P2PQuickActionsSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        userLevel={userLevel}
        currentLevelData={currentLevelData}
        onAfterOpen={onQuickActionsOpen}
      />
      <P2PMarketplaceSections
        platformStats={platformStats}
        tab={tab}
        handleTabSwitch={handleTabSwitch}
        asset={asset}
        setAsset={setAsset}
        fiatCurrency={fiatCurrency}
        setFiatCurrency={setFiatCurrency}
        searchText={searchText}
        setSearchText={setSearchText}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        merchantType={merchantType}
        setMerchantType={setMerchantType}
        filterPayment={filterPayment}
        setFilterPayment={setFilterPayment}
        amountInput={amountInput}
        setAmountInput={setAmountInput}
        activeFilterCount={activeFilterCount}
        allPaymentMethods={allPaymentMethods}
        ads={ads}
        onContextMenu={handleContextMenu}
        onQuickAction={handleQuickAction}
        prefix={prefix}
      />

      {/* Context Menu Sheet */}
      <ContextMenuSheet
        ad={contextMenuAd}
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        tradeType={tab}
        onShare={handleShareOffer}
        onCompare={handleCompare}
        onQuickAction={() => {
          if (contextMenuAd) handleQuickAction(contextMenuAd, tab);
        }}
        onViewMerchant={handleViewMerchant}
        prefix={prefix}
        onAfterOpen={onContextMenuOpen}
      />

      {/* Compare Bar */}
      <CompareBar
        items={compareList}
        onClear={handleClearCompare}
        onView={() => toast.info('So sánh chi tiết — Sắp ra mắt!')}
      />
    </PullToRefresh>
  );
}
