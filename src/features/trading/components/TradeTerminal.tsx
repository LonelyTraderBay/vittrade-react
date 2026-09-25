import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { TabBar } from '@/shared/ui/TabBar';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useAuth } from '@/shared/session/useAuth';
import { TOAST } from '@/shared/constants/toastMessages';
import { φ, φIcon } from '@/shared/lib/golden';
import type { TPSLValues } from './TPSLForm';
import { QuickPairSwitcher } from './QuickPairSwitcher';
import type { OCOOrderParams } from './OCOOrderForm';
import { TradingOrderEntryPanel } from './TradingOrderEntryPanel';
import { getOrderTypeLabel } from './trading-order-config';
import { useTradeSettings } from '../model/useTradeSettings';
import {
  useCancelOrderMutation,
  useModifyOrderMutation,
  useOpenOrdersQuery,
  useOrderHistoryQuery,
  usePlaceOrderMutation,
} from '../model/trading-queries';
import { useMarketPairQuery } from '@/features/market';
import { useWalletAssetsQuery } from '@/features/wallet';
import { OrderModifySheet, type OrderModifyValues } from './OrderModifySheet';
import { OrderConfirmationSheet } from './OrderConfirmationSheet';
import { OpenOrdersPanel } from './OpenOrdersPanel';
import { OrderHistoryPanel } from './OrderHistoryPanel';
import { TradingMarketPanel } from './TradingMarketPanel';
import type { TradingOrder } from '../model/trading-types';

/* ═══════════════════════════════════════════════════════════
   Market price presentation hook
   ═══════════════════════════════════════════════════════════ */
function useRealtimePrice(basePrice: number) {
  const [price, setPrice] = useState(basePrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(basePrice);

  useEffect(() => {
    if (basePrice <= 0) return undefined;

    const previousPrice = prevRef.current;
    setPrice(basePrice);
    prevRef.current = basePrice;

    if (previousPrice > 0 && previousPrice !== basePrice) {
      setFlash(basePrice > previousPrice ? 'up' : 'down');
      const timeout = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(timeout);
    }

    setFlash(null);
    return undefined;
  }, [basePrice]);

  return { price, flash };
}

/* ═══════════════════════════════════════════════════════════
   Success Toast
   ═══════════════════════════════════════════════════════════ */
function SuccessToast({
  side,
  symbol,
  onClose,
}: {
  side: string;
  symbol: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);
  const c = useThemeColors();
  return (
    <div
      className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in-up"
      style={{
        background: c.surface,
        border: `1px solid ${side === 'buy' ? '#10B981' : '#EF4444'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth: 440,
        margin: '0 auto',
      }}
    >
      <CheckCircle size={φIcon.md} color={side === 'buy' ? '#10B981' : '#EF4444'} />
      <div className="flex-1">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Đặt lệnh thành công!</p>
        <p style={{ color: c.text2, fontSize: φ.xs }}>
          Lệnh {side === 'buy' ? 'mua' : 'bán'} {symbol} đang được xử lý
        </p>
      </div>
      <button onClick={onClose}>
        <X size={φIcon.sm} color={c.text3} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main TradePage — All Sprints Integrated
   ═══════════════════════════════════════════════════════════ */
export function TradeTerminal() {
  const navigate = useNavigate();
  const { pairId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedSide = searchParams.get('side');
  const initialSide: 'buy' | 'sell' = requestedSide === 'sell' ? 'sell' : 'buy';
  const { hapticSuccess, hapticMedium, hapticSelection } = useHaptic();
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const selectedPairId = pairId ?? 'btcusdt';
  const marketPairQuery = useMarketPairQuery(selectedPairId);
  const walletQuery = useWalletAssetsQuery();
  const openOrdersQuery = useOpenOrdersQuery();
  const orderHistoryQuery = useOrderHistoryQuery();
  const placeOrderMutation = usePlaceOrderMutation();
  const modifyOrderMutation = useModifyOrderMutation();
  const cancelOrderMutation = useCancelOrderMutation();

  const pair = marketPairQuery.data;
  const assets = walletQuery.data?.items ?? [];
  const usdtAsset = assets.find((a) => a.symbol === 'USDT');
  const baseAsset = pair ? assets.find((a) => a.symbol === pair.baseAsset) : undefined;
  const openOrders = openOrdersQuery.data?.items ?? [];
  const orderHistory = orderHistoryQuery.data?.items ?? [];

  /* ─── Core state ─── */
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderTypeId, setOrderTypeId] = useState('limit');
  const [limitPrice, setLimitPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'open' | 'history'>('order');
  const [activePct, setActivePct] = useState<number | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  /* ─── Sprint 1B: TP/SL ─── */
  const [tpsl, setTpsl] = useState<TPSLValues>({
    enabled: false,
    tpPrice: '',
    slPrice: '',
    tpTriggerType: 'last',
    slTriggerType: 'last',
  });

  /* ─── Sprint 2A: Data view tabs ─── */
  const [dataTab, setDataTab] = useState<'chart' | 'orderbook' | 'trades'>('chart');

  /* ─── Sprint 2A: Slippage for market orders ─── */

  /* ─── Sprint 2A: Order modify ─── */
  const [modifyOrderId, setModifyOrderId] = useState<string | null>(null);
  const orderAttemptKey = useRef<{ signature: string; key: string } | null>(null);
  const modifyAttemptKeys = useRef(new Map<string, string>());
  const cancelAttemptKeys = useRef(new Map<string, string>());

  /* ─── Sprint 2B: Quick pair switcher ─── */
  const [showPairSwitcher, setShowPairSwitcher] = useState(false);

  /* ─── Sprint 3: Real-time price ─── */
  const { price: livePrice, flash } = useRealtimePrice(pair?.price ?? 0);

  /* ─── Trade Settings persistence ─── */
  const { settings: tradeSettings } = useTradeSettings();

  // Apply persisted settings on mount
  useEffect(() => {
    setOrderTypeId(tradeSettings.defaultOrderType);
    if (tradeSettings.showTpsl) {
      setTpsl((prev) => ({ ...prev, enabled: true, bracketMode: tradeSettings.bracketMode }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pair?.price !== undefined) setLimitPrice(pair.price.toFixed(2));
  }, [pair?.price]);

  /* ─── Computed ─── */
  const orderTypeLabel = getOrderTypeLabel(orderTypeId);
  const isMarket = orderTypeId === 'market';
  const available = side === 'buy' ? (usdtAsset?.available ?? 0) : (baseAsset?.available ?? 0);
  const availableLabel = side === 'buy' ? 'USDT' : (pair?.baseAsset ?? '');
  const effectivePrice = isMarket ? livePrice : parseFloat(limitPrice || '0');
  const amountNum = parseFloat(amount || '0');
  const total = effectivePrice * amountNum;
  const isPositive = (pair?.change24h ?? 0) >= 0;
  const canWriteTrading = hasPermission('trading:write') || hasPermission('trade:write');
  if (marketPairQuery.isError) {
    return (
      <PageLayout>
        <PageContent>
          <ErrorState
            title="Không thể tải cặp giao dịch"
            message="Dữ liệu thị trường chưa sẵn sàng. Vui lòng thử lại."
            onAction={() => void marketPairQuery.refetch()}
          />
        </PageContent>
      </PageLayout>
    );
  }

  if (marketPairQuery.isPending || !pair) {
    return (
      <PageLayout>
        <PageContent>
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 size={28} className="animate-spin" color={c.primary} />
            <p style={{ color: c.text2, fontSize: 13 }}>Đang tải dữ liệu thị trường…</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const handlePct = (pct: number) => {
    setActivePct(pct);
    hapticSelection();
    if (side === 'buy') {
      const maxAmount = (available * pct) / 100 / effectivePrice;
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount(((available * pct) / 100).toFixed(6));
    }
  };

  const withinAvailableBalance =
    Number.isFinite(available) &&
    available >= 0 &&
    (side === 'buy' ? total <= available : amountNum <= available);
  const canPlace =
    canWriteTrading &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    Number.isFinite(effectivePrice) &&
    effectivePrice > 0 &&
    withinAvailableBalance;

  const handleConfirmOrder = async () => {
    if (!canWriteTrading) {
      actionToast.error('Tài khoản không có quyền đặt lệnh.');
      return;
    }
    if (!canPlace) {
      setShowConfirm(false);
      actionToast.error('Thông tin lệnh không hợp lệ hoặc số dư khả dụng đã thay đổi.');
      return;
    }
    const orderSignature = JSON.stringify({
      symbol: pair.symbol,
      side,
      type: orderTypeId,
      amount: amountNum,
      price: isMarket ? undefined : effectivePrice,
      tpPrice: tpsl.enabled && tpsl.tpPrice ? Number(tpsl.tpPrice) : undefined,
      slPrice: tpsl.enabled && tpsl.slPrice ? Number(tpsl.slPrice) : undefined,
    });
    if (orderAttemptKey.current?.signature !== orderSignature) {
      orderAttemptKey.current = { signature: orderSignature, key: crypto.randomUUID() };
    }
    setIsPlacing(true);
    hapticMedium();
    let createdOrder;
    try {
      createdOrder = await placeOrderMutation.mutateAsync({
        symbol: pair.symbol,
        side,
        type: orderTypeId as 'market' | 'limit' | 'stop' | 'stop-limit' | 'trailing' | 'bracket',
        amount: amountNum,
        price: isMarket ? undefined : effectivePrice,
        tpPrice: tpsl.enabled && tpsl.tpPrice ? parseFloat(tpsl.tpPrice) : undefined,
        slPrice: tpsl.enabled && tpsl.slPrice ? parseFloat(tpsl.slPrice) : undefined,
        idempotencyKey: orderAttemptKey.current.key,
      });
    } catch (error) {
      setIsPlacing(false);
      actionToast.error(error instanceof Error ? error.message : 'Không thể đặt lệnh.');
      return;
    }
    setIsPlacing(false);
    orderAttemptKey.current = null;
    setShowConfirm(false);
    hapticSuccess();
    actionToast.success(TOAST.TRADE.ORDER_PLACED(side), { haptic: 'success' });

    // Navigate to receipt page (Sprint 2A)
    const receiptData = {
      orderId: createdOrder.id,
      symbol: createdOrder.symbol,
      baseAsset: createdOrder.symbol.split('/')[0],
      side: createdOrder.side,
      orderType: orderTypeLabel,
      price: createdOrder.price,
      amount: createdOrder.amount,
      total: createdOrder.price * createdOrder.amount,
      fee: createdOrder.fee,
      timestamp: createdOrder.createdAt,
      status: createdOrder.status,
      tpPrice: createdOrder.tpPrice,
      slPrice: createdOrder.slPrice,
    };
    navigate(`${routePrefix}/trade/order-receipt`, { state: { order: receiptData } });

    // Reset form
    setAmount('');
    setActivePct(null);
    setTpsl({
      enabled: false,
      tpPrice: '',
      slPrice: '',
      tpTriggerType: 'last',
      slTriggerType: 'last',
    });
  };

  const handleSubmitOco = async (params: OCOOrderParams) => {
    if (!canWriteTrading) {
      actionToast.error('Tài khoản không có quyền đặt lệnh.');
      return;
    }
    const takeProfitAmount = parseFloat(params.takeProfitAmount);
    const stopLossAmount = parseFloat(params.stopLossAmount);
    const ocoSignature = JSON.stringify(params);
    if (orderAttemptKey.current?.signature !== ocoSignature) {
      orderAttemptKey.current = { signature: ocoSignature, key: crypto.randomUUID() };
    }
    let createdOrder;
    try {
      createdOrder = await placeOrderMutation.mutateAsync({
        symbol: params.symbol,
        side: params.side,
        type: 'oco',
        amount: takeProfitAmount,
        price: params.currentPrice,
        tpPrice: parseFloat(params.takeProfitPrice),
        slPrice: parseFloat(params.stopLossPrice),
        tpAmount: takeProfitAmount,
        slAmount: stopLossAmount,
        amountType: params.amountType,
        idempotencyKey: orderAttemptKey.current.key,
      });
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể đặt lệnh OCO.');
      throw error;
    }
    orderAttemptKey.current = null;

    actionToast.success(TOAST.TRADE.ORDER_PLACED(side), { haptic: 'success' });
    const receiptData = {
      orderId: createdOrder.id,
      symbol: createdOrder.symbol,
      baseAsset: createdOrder.symbol.split('/')[0],
      side: createdOrder.side,
      orderType: 'OCO',
      price: createdOrder.price,
      amount: createdOrder.amount,
      total: createdOrder.price * createdOrder.amount,
      fee: createdOrder.fee,
      timestamp: createdOrder.createdAt,
      status: createdOrder.status,
      tpPrice: createdOrder.tpPrice,
      slPrice: createdOrder.slPrice,
    };
    navigate(`${routePrefix}/trade/order-receipt`, { state: { order: receiptData } });
  };

  const handleCancelOco = () => {
    setOrderTypeId('limit');
    hapticSelection();
  };

  const handlePairSwitch = (newPairId: string) => {
    navigate(`${routePrefix}/trade/${newPairId}`, { replace: true });
  };

  const handleModifyOrder = (orderId: string) => {
    const order = openOrders.find((o) => o.id === orderId);
    if (order) setModifyOrderId(orderId);
  };

  const handleSaveModify = async ({ orderId, price, amount }: OrderModifyValues) => {
    if (!canWriteTrading) {
      actionToast.error('Trading permission is required to modify an order.');
      return;
    }
    const signature = JSON.stringify({ orderId, price, amount });
    const idempotencyKey = modifyAttemptKeys.current.get(signature) ?? crypto.randomUUID();
    modifyAttemptKeys.current.set(signature, idempotencyKey);
    try {
      await modifyOrderMutation.mutateAsync({
        orderId,
        request: { price, amount, idempotencyKey },
      });
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể sửa lệnh.');
      return;
    }
    modifyAttemptKeys.current.delete(signature);
    actionToast.success(`Đã sửa lệnh #${orderId.slice(-6).toUpperCase()}`);
    setModifyOrderId(null);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!canWriteTrading) {
      actionToast.error('Trading permission is required to cancel an order.');
      return;
    }
    const idempotencyKey = cancelAttemptKeys.current.get(orderId) ?? crypto.randomUUID();
    cancelAttemptKeys.current.set(orderId, idempotencyKey);
    try {
      await cancelOrderMutation.mutateAsync({ orderId, idempotencyKey });
      cancelAttemptKeys.current.delete(orderId);
      actionToast.success(`Đã hủy lệnh #${orderId.slice(-6).toUpperCase()}`);
    } catch (error) {
      actionToast.error(error instanceof Error ? error.message : 'Không thể hủy lệnh.');
    }
  };

  const handleSelectHistoryOrder = (order: TradingOrder) => {
    navigate(`${routePrefix}/trade/order-receipt`, {
      state: {
        order: {
          orderId: order.id,
          symbol: order.symbol,
          baseAsset: order.symbol.split('/')[0],
          side: order.side,
          orderType: order.type,
          price: order.price,
          amount: order.amount,
          total: order.price * order.amount,
          fee: order.fee,
          timestamp: order.createdAt,
          status: order.status,
        },
      },
    });
  };

  return (
    <PageLayout>
      {showSuccess && (
        <SuccessToast side={side} symbol={pair.symbol} onClose={() => setShowSuccess(false)} />
      )}

      {/* ═══ Quick Pair Switcher (Sprint 2B) ═══ */}
      <QuickPairSwitcher
        open={showPairSwitcher}
        onClose={() => setShowPairSwitcher(false)}
        currentPairId={pair.id}
        onSelect={handlePairSwitch}
      />

      <OrderConfirmationSheet
        open={showConfirm}
        isPlacing={isPlacing}
        side={side}
        pair={pair}
        orderTypeLabel={orderTypeLabel}
        isMarket={isMarket}
        limitPrice={limitPrice}
        amount={amount}
        total={total}
        tpsl={tpsl}
        onClose={() => {
          if (!isPlacing) setShowConfirm(false);
        }}
        onConfirm={handleConfirmOrder}
      />

      <OrderModifySheet
        open={Boolean(modifyOrderId)}
        order={openOrders.find((order) => order.id === modifyOrderId) ?? null}
        canWrite={canWriteTrading}
        isPending={modifyOrderMutation.isPending}
        onClose={() => setModifyOrderId(null)}
        onSave={handleSaveModify}
      />

      <TradingMarketPanel
        pair={pair}
        livePrice={livePrice}
        flash={flash}
        isPositive={isPositive}
        dataTab={dataTab}
        onDataTabChange={setDataTab}
        onOpenPairSwitcher={() => setShowPairSwitcher(true)}
      />
      {/* ═══ Main Tab Bar (Segmented) ═══ */}
      <div className="px-5 pb-2">
        <TabBar
          variant="segment"
          tabs={[
            { id: 'order', label: 'Đặt lệnh' },
            { id: 'open', label: `Đang mở (${openOrders.length})` },
            { id: 'history', label: 'Lịch sử' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'order' && (
        <TradingOrderEntryPanel
          pair={pair}
          available={available}
          availableLabel={availableLabel}
          side={side}
          setSide={setSide}
          orderTypeId={orderTypeId}
          setOrderTypeId={setOrderTypeId}
          isMarket={isMarket}
          limitPrice={limitPrice}
          setLimitPrice={setLimitPrice}
          amount={amount}
          amountNum={amountNum}
          setAmount={setAmount}
          activePct={activePct}
          setActivePct={setActivePct}
          handlePct={handlePct}
          tpsl={tpsl}
          setTpsl={setTpsl}
          livePrice={livePrice}
          effectivePrice={effectivePrice}
          defaultBracketMode={tradeSettings.bracketMode}
          total={total}
          canPlace={canPlace}
          canWriteTrading={canWriteTrading}
          onRequestConfirmation={() => {
            setShowConfirm(true);
            hapticMedium();
          }}
          onSubmitOco={handleSubmitOco}
          onCancelOco={handleCancelOco}
        />
      )}
      {activeTab === 'open' && (
        <OpenOrdersPanel
          orders={openOrders}
          canWrite={canWriteTrading}
          cancelPending={cancelOrderMutation.isPending}
          onModifyOrder={handleModifyOrder}
          onCancelOrder={(orderId) => void handleCancelOrder(orderId)}
          onExportHistory={() => navigate(`${routePrefix}/trade/export`)}
        />
      )}

      {activeTab === 'history' && (
        <OrderHistoryPanel
          orders={orderHistory}
          onSelectOrder={handleSelectHistoryOrder}
          onExportHistory={() => navigate(`${routePrefix}/trade/export`)}
        />
      )}
    </PageLayout>
  );
}
