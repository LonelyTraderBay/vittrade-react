import React, { useState, useMemo } from 'react';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, BarChart3, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock,
  ChevronRight, Briefcase, PieChart, X, HelpCircle, ShoppingCart,
  DollarSign, AlertCircle, AlertTriangle, FileText,
  Gamepad2, Star, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { SkeletonRow } from '../../components/states/SkeletonBlock';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  PREDICTION_EVENTS,
  PREDICTION_POSITIONS,
  PREDICTION_OPEN_ORDERS,
  PREDICTION_ORDER_RECEIPTS,
  PREDICTION_ORDER_STATUS_CONFIG,
  fmtVolume,
} from '../../data/predictionMockData';
import type { PredictionPosition, PredictionOpenOrder, PredictionOrderReceipt } from '../../data/predictionMockData';
import { φ, φRadius } from '../../utils/golden';

const STATUS_TABS = [
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' },
  { id: 'history', label: 'History' },
] as const;

type StatusTab = typeof STATUS_TABS[number]['id'];

/* ─── InfoBubble ─── */
function InfoBubble({ text }: { text: string }) {
  const c = useThemeColors();
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShow(!show); } }}
        style={{ width: 16, height: 16, cursor: 'pointer' }} className="flex items-center justify-center">
        <HelpCircle size={12} color={c.text3} />
      </span>
      {show && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 bottom-full left-1/2 mb-1.5 px-3 py-2 rounded-lg"
          style={{
            background: c.surface2, border: `1px solid ${c.borderSolid}`,
            fontSize: 11, color: c.text2, lineHeight: 1.4, width: 200,
            transform: 'translateX(-50%)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }} onClick={() => setShow(false)}>
          {text}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Summary Cards ─── */
function SummaryCards({ positions, openOrders }: { positions: PredictionPosition[]; openOrders: PredictionOpenOrder[] }) {
  const c = useThemeColors();
  const [hidden, setHidden] = useState(false);

  const openPositions = positions.filter(p => p.status === 'open');
  const totalInvested = positions.reduce((s, p) => s + p.investedAmount, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const winCount = positions.filter(p => p.status === 'won').length;
  const lossCount = positions.filter(p => p.status === 'lost').length;
  const winRate = winCount + lossCount > 0 ? Math.round((winCount / (winCount + lossCount)) * 100) : 0;
  const openOrdersTotal = openOrders.reduce((s, o) => s + o.total, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <TrCard variant="hero" className="p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)' }} />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <span style={{ color: c.portfolioTextDim, fontSize: 12 }}>Portfolio Value</span>
          <button onClick={() => setHidden(!hidden)} className="p-1 rounded-lg hover-ghost">
            {hidden ? <EyeOff size={16} color={c.portfolioTextMuted} /> : <Eye size={16} color={c.portfolioTextDim} />}
          </button>
        </div>

        <p className="relative z-10" style={{
          color: '#fff', fontSize: 32, fontWeight: 700,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
          letterSpacing: -1, lineHeight: 1.1,
        }}>
          {hidden ? '••••••' : `$${totalCurrent.toFixed(2)}`}
        </p>

        {!hidden && (
          <motion.div className="flex items-center gap-2.5 mt-2 mb-4 relative z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{
                background: totalPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${totalPnl >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
              {totalPnl >= 0 ? <TrendingUp size={12} color="#34D399" strokeWidth={2.5} /> : <TrendingDown size={12} color="#EF4444" strokeWidth={2.5} />}
              <span style={{ color: totalPnl >= 0 ? c.buy : c.sell, fontSize: 12, fontWeight: 600 }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPnlPct.toFixed(1)}%)
              </span>
            </div>
            <span style={{ color: c.portfolioTextMuted, fontSize: 10 }}>all time</span>
          </motion.div>
        )}

        {/* Summary cards row */}
        <div className="flex gap-2 relative z-10">
          {[
            { label: 'Positions', value: hidden ? '••' : `${openPositions.length}`, icon: PieChart },
            { label: 'P/L', value: hidden ? '••' : `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, icon: TrendingUp },
            { label: 'Open Orders', value: hidden ? '••' : `${openOrders.length}`, icon: ShoppingCart },
          ].map(stat => (
            <TrCardStat key={stat.label} className="flex-1 text-center">
              <p style={{ color: c.portfolioTextMuted, fontSize: 9 }}>
                {stat.label}
                {stat.label === 'P/L' && ' '}
              </p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {stat.value}
              </p>
            </TrCardStat>
          ))}
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ─── Position Card ─── */
function PositionCard({ position, idx }: { position: PredictionPosition; idx: number }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const event = PREDICTION_EVENTS.find(e => e.id === position.eventId);
  if (!event) return null;

  const isOpen = position.status === 'open';
  const isWon = position.status === 'won';
  const isLost = position.status === 'lost';
  const isProfitable = position.pnl >= 0;

  const statusIcon = isWon ? CheckCircle2 : isLost ? XCircle : Clock;
  const statusColor = isWon ? c.buy : isLost ? c.sell : c.warn;
  const statusLabel = isWon ? 'Won' : isLost ? 'Lost' : 'Open';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.3 }}>
      <TrCard hover as="button"
        onClick={() => { hapticSelection(); navigate(`${prefix}/markets/predictions/event/${position.eventId}`); }}
        className="p-4 w-full text-left">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${statusColor}15` }}>
            {React.createElement(statusIcon, { size: 18, color: statusColor })}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}
              className="text-clamp-2">
              {event.title}
            </p>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded"
                style={{
                  background: position.outcome === 'Yes' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: position.outcome === 'Yes' ? c.buy : c.sell,
                  fontSize: 9, fontWeight: 600,
                }}>
                {position.outcome}
              </span>
              <span style={{ color: c.text3, fontSize: 10 }}>
                {position.shares} shares @ ${position.avgPrice.toFixed(2)}
              </span>
              <span className="px-1.5 py-0.5 rounded"
                style={{ background: `${statusColor}12`, color: statusColor, fontSize: 9, fontWeight: 600 }}>
                {statusLabel}
              </span>
            </div>

            {/* Price row */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1">
                <span style={{ color: c.text3, fontSize: 10 }}>Avg:</span>
                <InfoBubble text="Average price is the mean cost you paid per share. Lower avg price = better entry point." />
                <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>${position.avgPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: c.text3, fontSize: 10 }}>Current:</span>
                <span style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>${position.currentPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: c.text3, fontSize: 10 }}>Value:</span>
                <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                  ${position.currentValue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isProfitable
                  ? <ArrowUpRight size={12} color="#10B981" strokeWidth={2.5} />
                  : <ArrowDownRight size={12} color="#EF4444" strokeWidth={2.5} />}
                <span style={{
                  color: isProfitable ? c.buy : c.sell,
                  fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                }}>
                  {isProfitable ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={14} color={c.text3} className="shrink-0 mt-3" />
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ─── Open Order Card ─── */
function OpenOrderCard({ order, idx, onCancel }: { order: PredictionOpenOrder; idx: number; onCancel: (id: string) => void }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const event = PREDICTION_EVENTS.find(e => e.id === order.eventId);
  if (!event) return null;

  const isBuy = order.side === 'buy';
  const fillPct = order.shares > 0 ? Math.round((order.filled / order.shares) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.25 }}>
      <TrCard className="p-3">
        <div
          onClick={() => { navigate(`${prefix}/markets/predictions/receipt/${order.id.replace('oo-', 'po-')}`); hapticSelection(); }}
          className="flex items-start gap-3 w-full text-left active:opacity-70 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: isBuy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            <DollarSign size={14} color={isBuy ? c.buy : c.sell} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
              {event.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-1.5 py-0.5 rounded" style={{
                background: isBuy ? c.buyAlpha10 : c.sellAlpha10,
                color: isBuy ? c.buy : c.sell,
                fontSize: 9, fontWeight: 600,
              }}>
                {order.side.toUpperCase()} {order.outcome}
              </span>
              <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                {order.shares} @ ${order.price.toFixed(2)}
              </span>
              <span style={{ color: c.text3, fontSize: 10 }}>
                Filled: {fillPct}%
              </span>
            </div>
            {/* Fill progress */}
            <div className="w-full h-1.5 rounded-full mt-2" style={{ background: c.surface2 }}>
              <div className="h-full rounded-full" style={{
                width: `${fillPct}%`,
                background: isBuy ? c.buy : c.sell,
              }} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
            <ChevronRight size={12} color={c.text3} />
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCancel(order.id); hapticSelection(); }}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: c.sellAlpha10, border: `1px solid ${c.sellAlpha15}`, minHeight: 32 }}>
              <X size={10} color={c.sell} />
              <span style={{ color: c.sell, fontSize: 10, fontWeight: 600 }}>Cancel</span>
            </button>
          </div>
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ─── Order History Card (filled/canceled receipts) ─── */
function OrderHistoryCard({ receipt, idx }: { receipt: PredictionOrderReceipt; idx: number }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const statusCfg = PREDICTION_ORDER_STATUS_CONFIG[receipt.status];
  const isBuy = receipt.side === 'buy';
  const isFilled = receipt.status === 'filled';
  const isCanceled = receipt.status === 'canceled';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.25 }}>
      <TrCard hover as="button"
        onClick={() => { navigate(`${prefix}/markets/predictions/receipt/${receipt.id}`); hapticSelection(); }}
        className="p-3.5 w-full text-left">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isFilled ? 'rgba(16,185,129,0.1)' : isCanceled ? 'rgba(107,114,128,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {isFilled ? <CheckCircle2 size={16} color="#10B981" /> : isCanceled ? <XCircle size={16} color="#6B7280" /> : <AlertTriangle size={16} color="#EF4444" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
              {receipt.eventTitle}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-1.5 py-0.5 rounded"
                style={{
                  background: isBuy ? c.buyAlpha10 : c.sellAlpha10,
                  color: isBuy ? c.buy : c.sell,
                  fontSize: 9, fontWeight: 600,
                }}>
                {isBuy ? '↑ Buy' : '↓ Sell'} {receipt.outcome}
              </span>
              <span className="px-1.5 py-0.5 rounded"
                style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: 9, fontWeight: 600 }}>
                {statusCfg.label}
              </span>
              <span style={{ color: c.text3, fontSize: 9 }}>
                {receipt.orderType === 'market' ? 'Market' : 'Limit'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                {receipt.filledShares}/{receipt.shares} shares
              </span>
              <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                ${receipt.total.toFixed(2)}
              </span>
              <span style={{ color: c.text3, fontSize: 9 }}>
                {receipt.createdAt}
              </span>
            </div>
          </div>
          <ChevronRight size={12} color={c.text3} className="shrink-0 mt-3" />
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PORTFOLIO PAGE
   ═══════════════════════════════════════════════════════════ */

const HISTORY_ORDERS = PREDICTION_ORDER_RECEIPTS.filter(
  r => r.status === 'filled' || r.status === 'canceled'
);

export function PredictionsPortfolioPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [activeTab, setActiveTab] = useState<StatusTab>('active');
  const [openOrders, setOpenOrders] = useState(PREDICTION_OPEN_ORDERS);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const filteredPositions = useMemo(() => {
    if (activeTab === 'active') return PREDICTION_POSITIONS.filter(p => p.status === 'open');
    return PREDICTION_POSITIONS.filter(p => p.status === 'won' || p.status === 'lost');
  }, [activeTab]);

  const handleCancelOrder = (id: string) => {
    setCancelOrderId(id);
  };

  const confirmCancel = () => {
    if (cancelOrderId) {
      setOpenOrders(prev => prev.filter(o => o.id !== cancelOrderId));
      actionToast.success('Order cancelled successfully');
      setCancelOrderId(null);
    }
  };

  return (
    <PageLayout>
      <Header title="Prediction Portfolio" subtitle="Danh mục · Prediction" back />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount} className="flex-1 pb-8">
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải portfolio"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : (
        <PageContent>
        {/* Summary */}
        <SummaryCards positions={PREDICTION_POSITIONS} openOrders={openOrders} />

        {/* Microcopy for beginners */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <AlertCircle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            <strong style={{ color: c.text1 }}>Shares</strong> represent your stake in a market outcome. Each share pays <strong>$1.00</strong> if correct, <strong>$0.00</strong> if wrong. <strong>P/L</strong> = current value minus amount invested.
          </p>
        </div>

        {/* Tabs: Active / Closed */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: c.surface2 }}>
          {STATUS_TABS.map(tab => {
            const count = tab.id === 'active'
              ? PREDICTION_POSITIONS.filter(p => p.status === 'open').length
              : tab.id === 'history'
              ? HISTORY_ORDERS.length
              : PREDICTION_POSITIONS.filter(p => p.status === 'won' || p.status === 'lost').length;
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); hapticSelection(); }}
                className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1"
                style={{
                  background: activeTab === tab.id ? c.surface : 'transparent',
                  color: activeTab === tab.id ? c.text1 : c.text3,
                  fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                  boxShadow: activeTab === tab.id ? c.cardShadow : 'none',
                }}>
                {tab.label}
                <span style={{
                  background: activeTab === tab.id ? c.primaryAlpha12 : c.surface3,
                  color: activeTab === tab.id ? c.primary : c.text3,
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Positions list (Active / Closed tabs) */}
        {activeTab !== 'history' && (
          isLoading ? (
            <TrCard overflow>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </TrCard>
          ) : filteredPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Briefcase size={40} color={c.text3} style={{ opacity: 0.4 }} />
              <p style={{ color: c.text2, fontSize: 14, fontWeight: 600, marginTop: 12 }}>
                {activeTab === 'active' ? 'No active positions' : 'No closed positions'}
              </p>
              <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
                {activeTab === 'active' ? 'Start trading to build your portfolio' : 'Closed positions will appear here'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredPositions.map((pos, i) => (
                <PositionCard key={pos.id} position={pos} idx={i} />
              ))}
            </div>
          )
        )}

        {/* Order History (History tab) */}
        {activeTab === 'history' && (
          isLoading ? (
            <TrCard overflow>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </TrCard>
          ) : (
            <div>
              <SectionHeader title="Lịch sử lệnh" accent accentColor="#8B5CF6"
                subtitle="Các lệnh đã khớp và đã hủy"
                right={
                  <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 700 }}>{HISTORY_ORDERS.length}</span>
                }
              />
              {HISTORY_ORDERS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText size={40} color={c.text3} style={{ opacity: 0.4 }} />
                  <p style={{ color: c.text2, fontSize: 14, fontWeight: 600, marginTop: 12 }}>
                    Chưa có lịch sử lệnh
                  </p>
                  <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
                    Các lệnh đã khớp hoặc đã hủy sẽ hiển thị ở đây
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {HISTORY_ORDERS.map((receipt, idx) => (
                    <OrderHistoryCard key={receipt.id} receipt={receipt} idx={idx} />
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Open Orders Section */}
        {activeTab === 'active' && openOrders.length > 0 && (
          <div>
            <SectionHeader title="Open Orders" accent accentColor="#F59E0B"
              subtitle="Pending limit orders awaiting fill"
              right={
                <div className="flex items-center gap-1">
                  <span style={{ color: c.warn, fontSize: 11, fontWeight: 700 }}>{openOrders.length}</span>
                  <InfoBubble text="Open orders are limit orders you've placed that haven't been fully filled yet. You can cancel them anytime." />
                </div>
              }
            />
            <div className="flex flex-col gap-2">
              {openOrders.map((order, idx) => (
                <OpenOrderCard key={order.id} order={order} idx={idx} onCancel={handleCancelOrder} />
              ))}
            </div>
          </div>
        )}

        {/* ─── 09C: Arena Bridge CTA ─── */}
        <button
          onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl active:opacity-70"
          style={{
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.15)',
            minHeight: 48,
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.10)' }}>
            <Gamepad2 size={15} color="#F59E0B" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Khám phá Arena cùng chủ đề
            </p>
            <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>
              Social points-only · Không liên quan ví hay vị thế Prediction
            </p>
          </div>
          <span className="px-1.5 py-0.5 rounded shrink-0"
            style={{ background: c.warnAlpha10, color: c.warn, fontSize: 8, fontWeight: 700 }}>
            Arena Points
          </span>
          <ChevronRight size={12} color="#F59E0B" className="shrink-0" />
        </button>

        </PageContent>
        )}
      </PullToRefresh>

      {/* Cancel confirmation */}
      <ConfirmationDialog
        open={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={confirmCancel}
        variant="danger"
        icon={<AlertTriangle size={24} color="#EF4444" />}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? Any filled portion will remain in your position."
        confirmText="Cancel Order"
        cancelText="Keep Order"
      />
    </PageLayout>
  );
}