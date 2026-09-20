import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  BarChart3, Clock, Users, TrendingUp, Share2, Heart,
  MessageCircle, ThumbsUp, ChevronDown, ArrowUpRight, ArrowDownRight,
  ChevronRight, Info, AlertTriangle, ExternalLink, Shield, Calendar,
  Zap, ArrowUp, ArrowDown, HelpCircle, BookOpen, Crown, Activity,
  Layers, Gift, Gamepad2, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { CTAButton } from '../../components/ui/CTAButton';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import { TOAST } from '../../data/toastMessages';
import {
  PREDICTION_EVENTS,
  fmtVolume,
  timeRemaining,
  generateProbabilityHistory,
  generateOrderBook,
  getEventComments,
  getEventActivity,
  getTopHolders,
  getEventRules,
  PREDICTION_POSITIONS,
} from '../../data/predictionMockData';
import type { PredictionComment, OrderBookEntry } from '../../data/predictionMockData';
import { φ, φRadius } from '../../utils/golden';
import {
  PredictionTradeReviewSheet,
  PredictionRiskExplainerSheet,
  PredictionsCommentReportDialog,
  type TradeReviewData,
} from '../../components/predictions/PredictionSheets';
import { ArenaRelatedRoomsSection, mapCategoryToTopic } from '../../components/bridges/ArenaPredictionBridges';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const CHART_PERIODS = ['1H', '1D', '7D', '30D', 'All'] as const;
const DETAIL_TABS = ['Rules', 'Comments', 'Top Holders', 'Activity'] as const;
type DetailTab = typeof DETAIL_TABS[number];
type TradeSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

/* ═══════════════════════════════════════════════════════════
   TOOLTIP INFO ICON
   ═══════════════════════════════════════════════════════════ */

function InfoTooltip({ text }: { text: string }) {
  const c = useThemeColors();
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShow(!show); } }}
        className="flex items-center justify-center cursor-pointer"
        style={{ width: 16, height: 16 }}
      >
        <HelpCircle size={12} color={c.text3} />
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 mb-1.5 px-3 py-2 rounded-lg"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              fontSize: 11,
              color: c.text2,
              lineHeight: 1.4,
              width: 200,
              transform: 'translateX(-50%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
            onClick={() => setShow(false)}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════════ */

function DetailSkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 50%, ${c.surface2} 75%)`,
    backgroundSize: '400px 100%',
    animation: 'stateShimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
  };
  return (
    <div className="flex flex-col gap-4">
      <div style={{ ...shimmer, height: 14, width: 120 }} />
      <div style={{ ...shimmer, height: 22, width: '90%' }} />
      <div style={{ ...shimmer, height: 18, width: '70%' }} />
      <div style={{ ...shimmer, height: 80, width: '100%', borderRadius: 16 }} />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ ...shimmer, height: 60, borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ ...shimmer, height: 200, borderRadius: 16 }} />
      <div style={{ ...shimmer, height: 160, borderRadius: 16 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ERROR BANNER
   ═══════════════════════════════════════════════════════════ */

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useThemeColors();
  return (
    <TrCard className="p-4 flex items-center gap-3 mt-4"
      accentBorder="rgba(239,68,68,0.3)">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(239,68,68,0.12)' }}>
        <AlertTriangle size={16} color="#EF4444" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.sell, fontSize: 12, fontWeight: 600 }}>Error</p>
        <p style={{ color: c.text2, fontSize: 11 }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="px-3 py-1.5 rounded-lg"
          style={{ background: c.sellAlpha10, color: c.sell, fontSize: 11, fontWeight: 600 }}>
          Retry
        </button>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════ */

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: c.surface2 }}>
        <Icon size={20} color={c.text3} />
      </div>
      <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</p>
      <p style={{ color: c.text3, fontSize: 11, textAlign: 'center' }}>{subtitle}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OUTCOME CARDS (Yes/No Binary)
   ═══════════════════════════════════════════════════════════ */

function OutcomeCards({ outcomes, onSelect }: {
  outcomes: { label: string; chance: number; color: string }[];
  onSelect: (label: string) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const isYesNo = outcomes.length === 2 && outcomes[0].label === 'Yes';
  const best = outcomes[0];

  if (isYesNo) {
    return (
      <div className="flex gap-3">
        {outcomes.map((o) => {
          const isYes = o.label === 'Yes';
          const bgGradient = isYes
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))';
          return (
            <motion.button
              key={o.label}
              whileTap={{ scale: 0.97 }}
              onClick={() => { hapticSelection(); onSelect(o.label); }}
              className="flex-1 rounded-2xl p-4 text-left"
              style={{
                background: bgGradient,
                border: `1px solid ${isYes ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: o.color }} />
                <span style={{ color: o.color, fontSize: 14, fontWeight: 700 }}>{o.label}</span>
              </div>
              <motion.div
                key={o.chance}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ color: o.color, fontSize: 28, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.1 }}
              >
                {o.chance}%
              </motion.div>
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: c.text3, fontSize: 10 }}>Best {isYes ? 'Bid' : 'Ask'}</span>
                <span style={{ color: c.text2, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                  ${(o.chance / 100).toFixed(2)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* Multi-outcome rows */
  return (
    <div className="flex flex-col gap-2">
      {outcomes.map((o, idx) => (
        <motion.button
          key={o.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.25 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { hapticSelection(); onSelect(o.label); }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl relative overflow-hidden"
          style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
        >
          {/* Depth bar bg */}
          <div className="absolute inset-y-0 left-0 rounded-xl"
            style={{ width: `${o.chance}%`, background: `${o.color}10` }} />
          <div className="w-3 h-3 rounded-full shrink-0 relative z-10" style={{ background: o.color }} />
          <span className="flex-1 text-left relative z-10" style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
            {o.label}
          </span>
          <span className="relative z-10" style={{ color: o.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
            {o.chance}%
          </span>
          <span className="relative z-10 px-2.5 py-1 rounded-lg"
            style={{ background: `${o.color}15`, color: o.color, fontSize: 11, fontWeight: 600 }}>
            Trade
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROBABILITY CHART
   ═══════════════════════════════════════════════════════════ */

function ProbabilityChart({ eventId }: { eventId: string }) {
  const c = useThemeColors();
  const [period, setPeriod] = useState<typeof CHART_PERIODS[number]>('30D');
  const { hapticSelection } = useHaptic();

  const event = PREDICTION_EVENTS.find(e => e.id === eventId);
  // ✅ Hooks MUST be called before any conditional returns (Rules of Hooks)
  const data = useMemo(() => event ? generateProbabilityHistory(event) : [], [event]);

  if (!event) return null;

  const slicedData = period === '1H' ? data.slice(-1) :
    period === '1D' ? data.slice(-2) :
    period === '7D' ? data.slice(-7) :
    period === 'All' ? data : data;

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {CHART_PERIODS.map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); hapticSelection(); }}
            className="flex-1 py-1.5 rounded-lg"
            style={{
              background: period === p ? c.chipActiveBg : 'transparent',
              color: period === p ? c.chipActiveText : c.text3,
              fontSize: 11,
              fontWeight: period === p ? 600 : 400,
              border: `1px solid ${period === p ? c.chipActiveBorder : 'transparent'}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={slicedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs key="defs-gradient">
              <linearGradient id="yesGradDetail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              key="xaxis-date"
              dataKey="date"
              tick={{ fill: 'var(--tr-text-3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              key="yaxis-pct"
              domain={[0, 100]}
              tick={{ fill: 'var(--tr-text-3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              key="tooltip-prob"
              contentStyle={{
                background: 'var(--tr-surface)',
                border: '1px solid var(--tr-border)',
                borderRadius: 10,
                fontSize: 11,
                color: 'var(--tr-text-1)',
              }}
              formatter={(value: number, name: string) => [`${value}%`, name === 'yes' ? 'Yes' : 'No']}
            />
            <Area
              key="area-yes"
              type="monotone"
              dataKey="yes"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#yesGradDetail)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="mt-2">
        <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Volume (24h)</p>
        <ResponsiveContainer width="100%" height={40}>
          <BarChart data={slicedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <Bar key="vol-bar" dataKey="volume" fill="rgba(59,130,246,0.3)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ORDER BOOK (mini depth)
   ═══════════════════════════════════════════════════════════ */

function OrderBookView({ chance }: { chance: number }) {
  const c = useThemeColors();
  const { bids, asks } = useMemo(() => generateOrderBook(chance), [chance]);
  const maxTotal = Math.max(bids[bids.length - 1]?.total ?? 1, asks[asks.length - 1]?.total ?? 1);

  const renderRow = (entry: OrderBookEntry, side: 'bid' | 'ask', idx: number) => {
    const pct = (entry.total / maxTotal) * 100;
    const bgColor = side === 'bid' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
    return (
      <motion.div
        key={`${side}-${idx}`}
        initial={{ opacity: 0, x: side === 'bid' ? -8 : 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.03, duration: 0.2 }}
        className="flex items-center py-1.5 px-2 relative"
      >
        <div
          className="absolute inset-y-0 rounded-sm"
          style={{
            width: `${pct}%`,
            background: bgColor,
            [side === 'bid' ? 'left' : 'right']: 0,
          }}
        />
        <span className="relative z-10 flex-1" style={{
          color: side === 'bid' ? c.buy : c.sell,
          fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
        }}>
          ${entry.price.toFixed(2)}
        </span>
        <span className="relative z-10 w-16 text-right" style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
          {entry.shares.toLocaleString()}
        </span>
        <span className="relative z-10 w-20 text-right" style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
          {entry.total.toLocaleString()}
        </span>
      </motion.div>
    );
  };

  if (bids.length === 0 && asks.length === 0) {
    return <EmptyState icon={Layers} title="No orders yet" subtitle="Be the first to place an order in this market." />;
  }

  return (
    <div>
      <div className="flex items-center py-2 px-2 mb-1" style={{ borderBottom: `1px solid ${c.border}` }}>
        <span className="flex-1" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>PRICE</span>
        <span className="w-16 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SHARES</span>
        <span className="w-20 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>TOTAL</span>
      </div>
      <div className="mb-1">
        {[...asks].reverse().slice(0, 5).map((e, i) => renderRow(e, 'ask', i))}
      </div>
      <div className="flex items-center justify-center py-2 px-2" style={{ background: c.surface2, borderRadius: 6 }}>
        <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
          ${(chance / 100).toFixed(2)}
        </span>
        <span style={{ color: c.text3, fontSize: 10, marginLeft: 8 }}>
          Spread: ${((asks[0]?.price ?? 0) - (bids[0]?.price ?? 0)).toFixed(3)}
        </span>
      </div>
      <div className="mt-1">
        {bids.slice(0, 5).map((e, i) => renderRow(e, 'bid', i))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRADE PANEL
   ═══════════════════════════════════════════════════════════ */

function TradePanel({ event, selectedOutcome, onOutcomeChange }: {
  event: typeof PREDICTION_EVENTS[0];
  selectedOutcome: string;
  onOutcomeChange: (o: string) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const [side, setSide] = useState<TradeSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');

  const outcome = event.outcomes.find(o => o.label === selectedOutcome) ?? event.outcomes[0];
  const price = orderType === 'market' ? outcome.chance / 100 : Number(limitPrice) || outcome.chance / 100;
  const shares = amount ? Math.floor(Number(amount) / price) : 0;
  const fee = amount ? Math.round(Number(amount) * 0.02 * 100) / 100 : 0;
  const potentialPayout = side === 'buy' ? shares * 1.0 : Number(amount);

  const [showReview, setShowReview] = useState(false);

  const handlePlaceOrder = () => {
    if (!amount || Number(amount) <= 0) return;
    hapticSelection();
    setShowReview(true);
  };

  const handleConfirmOrder = () => {
    setShowReview(false);
    actionToast.success(TOAST.PREDICTIONS.ORDER_CONFIRMED);
    setAmount('');
  };

  return (
    <TrCard className="p-4">
      {/* Buy/Sell Toggle */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: c.surface2 }}>
        {(['buy', 'sell'] as TradeSide[]).map(s => (
          <button
            key={s}
            onClick={() => { setSide(s); hapticSelection(); }}
            className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
            style={{
              background: side === s
                ? (s === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)')
                : 'transparent',
              color: side === s
                ? (s === 'buy' ? c.buy : c.sell)
                : c.text3,
              fontSize: 13,
              fontWeight: side === s ? 700 : 400,
              border: side === s
                ? `1px solid ${s === 'buy' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                : '1px solid transparent',
            }}
          >
            {s === 'buy' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {s === 'buy' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>

      {/* Outcome selector (for multi-outcome) */}
      {event.outcomes.length > 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span style={{ color: c.text3, fontSize: 11 }}>Outcome</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {event.outcomes.map(o => (
              <button
                key={o.label}
                onClick={() => { onOutcomeChange(o.label); hapticSelection(); }}
                className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
                style={{
                  background: selectedOutcome === o.label ? `${o.color}15` : c.surface2,
                  color: selectedOutcome === o.label ? o.color : c.text3,
                  fontSize: 11,
                  fontWeight: selectedOutcome === o.label ? 600 : 400,
                  border: `1px solid ${selectedOutcome === o.label ? `${o.color}30` : 'transparent'}`,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Type: Market / Limit */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1.5">
          <span style={{ color: c.text3, fontSize: 11 }}>Order Type</span>
          <InfoTooltip text="Market orders execute immediately at the current best price. Limit orders let you set a specific price." />
        </div>
        <div className="flex gap-1.5">
          {(['market', 'limit'] as OrderType[]).map(t => (
            <button
              key={t}
              onClick={() => { setOrderType(t); hapticSelection(); }}
              className="flex-1 py-2 rounded-lg"
              style={{
                background: orderType === t ? c.chipActiveBg : c.surface2,
                color: orderType === t ? c.chipActiveText : c.text3,
                fontSize: 12,
                fontWeight: orderType === t ? 600 : 400,
                border: `1px solid ${orderType === t ? c.chipActiveBorder : 'transparent'}`,
              }}
            >
              {t === 'market' ? 'Market' : 'Limit'}
            </button>
          ))}
        </div>
        <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
          {orderType === 'market'
            ? 'Execute at current best available price'
            : 'Set your desired entry price'}
        </p>
      </div>

      {/* Limit price input */}
      {orderType === 'limit' && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <span style={{ color: c.text3, fontSize: 11 }}>Limit Price</span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl pr-8"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: c.text3, fontSize: 11 }}>$</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1.5">
          <span style={{ color: c.text3, fontSize: 11 }}>Amount</span>
        </div>
        <div className="relative">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl pr-16"
            style={{
              background: c.surface2,
              border: `1px solid ${c.borderSolid}`,
              color: c.text1,
              fontSize: 16,
              outline: 'none',
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded"
            style={{ background: c.surface3, color: c.text2, fontSize: 11, fontWeight: 600 }}>
            USDT
          </span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {['10', '25', '50', '100'].map(amt => (
            <button
              key={amt}
              onClick={() => { setAmount(amt); hapticSelection(); }}
              className="flex-1 py-1.5 rounded-lg"
              style={{
                background: amount === amt ? c.chipActiveBg : c.surface2,
                color: amount === amt ? c.chipActiveText : c.text3,
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${amount === amt ? c.chipActiveBorder : 'transparent'}`,
              }}
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <AnimatePresence>
        {amount && Number(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 px-3 py-2.5 rounded-xl"
            style={{ background: c.surface2 }}
          >
            <div className="flex justify-between py-1">
              <div className="flex items-center gap-1">
                <span style={{ color: c.text3, fontSize: 11 }}>Est. Shares</span>
                <InfoTooltip text="Each share pays $1.00 if the outcome resolves in your favor, $0.00 otherwise." />
              </div>
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                ~{shares.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: c.text3, fontSize: 11 }}>Avg. Price</span>
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                ${price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: c.text3, fontSize: 11 }}>Fees (2%)</span>
              <span style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
                ${fee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 mt-1"
              style={{ borderTop: `1px solid ${c.border}`, paddingTop: 6 }}>
              <div className="flex items-center gap-1">
                <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Potential Payout</span>
                <InfoTooltip text="If your outcome wins, each share pays $1.00. Payout = shares x $1.00 minus fees." />
              </div>
              <span style={{ color: c.buy, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                ${(potentialPayout - fee).toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline slippage / liquidity note for market orders */}
      {orderType === 'market' && amount && Number(amount) > 0 && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <AlertTriangle size={11} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: '#D97706', fontSize: 10, lineHeight: 1.4 }}>
            Lệnh market khớp ngay — giá thực tế có thể chênh nhẹ do slippage.
            {Number(amount) >= 50 && ' Lệnh lớn có thể chịu trượt giá cao hơn.'}
          </p>
        </div>
      )}

      {/* Inline disclaimer */}
      <p style={{ color: c.text3, fontSize: 9, textAlign: 'center', lineHeight: 1.4, marginBottom: 4 }}>
        Đây không phải lời khuyên đầu tư. Xác suất không phải sự chắc chắn.
      </p>

      {/* CTA */}
      <CTAButton
        variant={side === 'buy' ? 'success' : 'danger'}
        fullWidth
        disabled={!amount || Number(amount) <= 0}
        onClick={handlePlaceOrder}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {selectedOutcome} @ ${price.toFixed(2)}
      </CTAButton>

      {/* Trade Review Sheet */}
      <PredictionTradeReviewSheet
        open={showReview}
        onClose={() => setShowReview(false)}
        onConfirm={handleConfirmOrder}
        data={{
          eventTitle: event.title,
          outcome: selectedOutcome,
          outcomeColor: outcome.color,
          side,
          orderType,
          amount: Number(amount) || 0,
          price,
          shares,
          fee,
          potentialPayout,
        }}
      />
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   RULES TAB
   ═══════════════════════════════════════════════════════════ */

function RulesTab({ eventId }: { eventId: string }) {
  const c = useThemeColors();
  const event = PREDICTION_EVENTS.find(e => e.id === eventId);
  if (!event) return null;
  const rules = getEventRules(event);
  const endDate = new Date(rules.endDate);

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={13} color={c.text2} />
          <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Description</span>
        </div>
        <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>{rules.description}</p>
      </div>

      {/* Resolution source */}
      <div className="px-3 py-3 rounded-xl" style={{ background: c.surface2 }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Shield size={12} color="#3B82F6" />
          <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Resolution Source</span>
          <InfoTooltip text="The data source used to determine the final outcome of this market." />
        </div>
        <p style={{ color: c.primary, fontSize: 12, fontWeight: 500 }}>{rules.resolutionSource}</p>
      </div>

      {/* End date */}
      <div className="px-3 py-3 rounded-xl" style={{ background: c.surface2 }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Calendar size={12} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>End Date</span>
        </div>
        <p style={{ color: c.text2, fontSize: 12 }}>
          {endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at 23:59 UTC
        </p>
      </div>

      {/* Rules list */}
      <div>
        <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Market Rules</span>
        {rules.rules.map((rule, idx) => (
          <div key={idx} className="flex gap-2.5 mb-2.5">
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, minWidth: 16 }}>{idx + 1}.</span>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMMENTS TAB
   ═══════════════════════════════════════════════════════════ */

function CommentsTab({ eventId }: { eventId: string }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const comments = getEventComments(eventId);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [reportTarget, setReportTarget] = useState<{ user: string } | null>(null);

  const handleLike = (commentId: string) => {
    hapticSelection();
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    hapticSelection();
    actionToast.success(TOAST.PREDICTIONS.COMMENT_POSTED);
    setNewComment('');
  };

  return (
    <div>
      {/* Warning banner */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-4"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle size={14} color={c.warn} className="shrink-0" />
        <p style={{ color: c.warn, fontSize: 11, lineHeight: 1.4 }}>
          Beware of external links. Do not share personal or financial information.
        </p>
      </div>

      {comments.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No comments yet" subtitle="Be the first to share your thoughts on this market." />
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment, idx) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: c.surface2, fontSize: 16 }}>
                  {comment.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{comment.user}</span>
                    {comment.position && (
                      <span className="px-1.5 py-0.5 rounded"
                        style={{
                          background: comment.position === 'Yes' ? c.buyAlpha10 : c.sellAlpha10,
                          color: comment.position === 'Yes' ? c.buy : c.sell,
                          fontSize: 9, fontWeight: 600,
                        }}>
                        {comment.position}
                      </span>
                    )}
                    <span style={{ color: c.text3, fontSize: 10 }}>{comment.time}</span>
                  </div>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleLike(comment.id)} className="flex items-center gap-1" style={{ minHeight: 28 }}>
                      <ThumbsUp
                        size={12}
                        color={likedComments.has(comment.id) ? c.primary : c.text3}
                        fill={likedComments.has(comment.id) ? c.primary : 'transparent'}
                      />
                      <span style={{
                        color: likedComments.has(comment.id) ? c.primary : c.text3,
                        fontSize: 11, fontWeight: 500,
                      }}>
                        {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                      </span>
                    </button>
                    <button
                      onClick={() => { setReportTarget({ user: comment.user }); hapticSelection(); }}
                      className="flex items-center gap-1 active:opacity-70"
                      style={{ color: c.text3, fontSize: 10, minHeight: 28 }}
                    >
                      <AlertTriangle size={10} />
                      Báo cáo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          className="flex-1 px-3 py-2.5 rounded-xl"
          style={{
            background: c.surface2,
            border: `1px solid ${c.borderSolid}`,
            color: c.text1,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2.5 rounded-xl"
          style={{
            background: newComment.trim() ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : c.surface2,
            color: newComment.trim() ? '#fff' : c.text3,
            fontSize: 12, fontWeight: 700,
          }}
        >
          Post
        </button>
      </div>

      {/* Comment Report Dialog */}
      <PredictionsCommentReportDialog
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onReport={() => { actionToast.success(TOAST.PREDICTIONS.COMMENT_REPORTED); }}
        onBlock={() => { actionToast.success(TOAST.PREDICTIONS.USER_BLOCKED); }}
        commentUser={reportTarget?.user}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOP HOLDERS TAB
   ═══════════════════════════════════════════════════════════ */

function TopHoldersTab({ eventId }: { eventId: string }) {
  const c = useThemeColors();
  const holders = useMemo(() => getTopHolders(eventId), [eventId]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center py-2 px-1 mb-1" style={{ borderBottom: `1px solid ${c.border}` }}>
        <span className="w-6" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>#</span>
        <span className="flex-1" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>TRADER</span>
        <span className="w-14 text-center" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SIDE</span>
        <span className="w-16 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SHARES</span>
        <span className="w-16 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>PnL</span>
      </div>

      {holders.map((h, idx) => (
        <motion.div
          key={h.rank}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.25 }}
          className="flex items-center py-2.5 px-1"
          style={{ borderBottom: `1px solid ${c.border}` }}
        >
          <span className="w-6" style={{
            color: h.rank <= 3 ? c.warn : c.text3,
            fontSize: 11, fontWeight: h.rank <= 3 ? 700 : 400,
          }}>
            {h.rank <= 3 ? (
              <Crown size={12} color={c.warn} fill={h.rank === 1 ? c.warn : 'transparent'} />
            ) : h.rank}
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span style={{ fontSize: 14 }}>{h.avatar}</span>
            <span className="text-truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
              {h.user}
            </span>
          </div>
          <span className="w-14 text-center px-1.5 py-0.5 rounded"
            style={{
              background: h.outcome === 'Yes' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: h.outcome === 'Yes' ? c.buy : c.sell,
              fontSize: 10, fontWeight: 600,
            }}>
            {h.outcome}
          </span>
          <span className="w-16 text-right" style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
            {h.shares.toLocaleString()}
          </span>
          <span className="w-16 text-right" style={{
            color: h.pnl >= 0 ? c.buy : c.sell,
            fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
          }}>
            {h.pnl >= 0 ? '+' : ''}{h.pnl > 999 ? `$${(h.pnl / 1000).toFixed(1)}K` : `$${h.pnl}`}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY TAB
   ═══════════════════════════════════════════════════════════ */

function ActivityTab({ eventId }: { eventId: string }) {
  const c = useThemeColors();
  const activity = useMemo(() => getEventActivity(eventId), [eventId]);

  if (activity.length === 0) {
    return <EmptyState icon={Activity} title="No activity yet" subtitle="Activity will appear here once trading begins." />;
  }

  return (
    <div className="flex flex-col">
      {activity.map((act, idx) => (
        <motion.div
          key={act.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.03, duration: 0.2 }}
          className="flex items-center gap-3 py-2.5"
          style={{ borderBottom: idx < activity.length - 1 ? `1px solid ${c.border}` : 'none' }}
        >
          <span style={{ fontSize: 14 }}>{act.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{act.user}</span>
              <span style={{
                color: act.action === 'bought' ? c.buy : c.sell,
                fontSize: 11, fontWeight: 600,
              }}>
                {act.action}
              </span>
              <span className="px-1.5 py-0.5 rounded" style={{
                background: act.outcome === 'Yes' ? c.buyAlpha10 : c.sellAlpha10,
                color: act.outcome === 'Yes' ? c.buy : c.sell,
                fontSize: 9, fontWeight: 600,
              }}>
                {act.outcome}
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
              {act.shares.toLocaleString()} shares @ ${act.price.toFixed(2)}
            </p>
          </div>
          <span style={{ color: c.text3, fontSize: 10 }}>{act.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RELATED MARKETS CAROUSEL
   ═══════════════════════════════════════════════════════════ */

function RelatedMarkets({ currentId, category }: { currentId: string; category: string }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const related = PREDICTION_EVENTS
    .filter(e => e.id !== currentId && e.status === 'active')
    .sort((a, b) => (a.category === category ? -1 : 1) - (b.category === category ? -1 : 1))
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Related Markets" accent accentColor="#8B5CF6"
        right={
          <button onClick={() => { navigate(`${prefix}/markets/predictions`); hapticSelection(); }}
            style={{ color: c.primary, fontSize: 11, fontWeight: 600 }}
            className="flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </button>
        }
      />
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {related.map((ev, idx) => {
          const top = ev.outcomes[0];
          return (
            <motion.button
              key={ev.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { navigate(`${prefix}/markets/predictions/event/${ev.id}`); hapticSelection(); }}
              className="shrink-0 rounded-2xl p-3 text-left"
              style={{
                width: 220,
                background: c.surface,
                border: `1px solid ${c.cardBorder}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 9, fontWeight: 600 }}>
                  {ev.category}
                </span>
              </div>
              <p className="text-clamp-2 mb-2" style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                {ev.title}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: top.color }} />
                  <span style={{ color: top.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {top.chance}%
                  </span>
                  <span style={{ color: c.text3, fontSize: 10 }}>{top.label}</span>
                </div>
                <span style={{ color: c.text3, fontSize: 10 }}>{fmtVolume(ev.volume24h)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════��═══════════════════════════════════
   MAIN DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */

export function PredictionEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 600 });

  const event = PREDICTION_EVENTS.find(e => e.id === eventId) ?? PREDICTION_EVENTS[0];
  const topTwo = event.outcomes.slice(0, 2);
  const remaining = timeRemaining(event.endDate);
  const isResolved = event.status === 'resolved';
  const isMultiOutcome = event.outcomes.length > 2;

  const [activeTab, setActiveTab] = useState<DetailTab>('Rules');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(event.outcomes[0].label);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);
  const [showArenaBridgeSheet, setShowArenaBridgeSheet] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  // Find user position for this event
  const userPosition = PREDICTION_POSITIONS.find(p => p.eventId === event.id);

  const handleShare = () => {
    hapticSelection();
    actionToast.success(TOAST.PREDICTIONS.LINK_SHARED);
  };

  const handleFavorite = () => {
    hapticSelection();
    setIsFavorite(!isFavorite);
    actionToast.info(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <PageLayout>
      <Header
        title="Event Detail"
        subtitle="Chi tiết · Prediction"
        back
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFavorite}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.searchBg, border: `1px solid ${c.border}`,
              }}
            >
              <Heart
                size={16}
                color={isFavorite ? c.sell : c.text2}
                fill={isFavorite ? c.sell : 'transparent'}
              />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.searchBg, border: `1px solid ${c.border}`,
              }}
            >
              <Share2 size={16} color={c.text2} />
            </button>
          </div>
        }
        breadcrumb
      />

      <PullToRefresh
        onRefresh={refresh}
        lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount}
        className="flex-1 pb-8"
      >
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải sự kiện"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : isLoading ? (
          <PageContent><DetailSkeleton /></PageContent>
        ) : (
          <PageContent>
            {/* ─── Event Header ─── */}
            <div>
              {/* Tags */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md"
                  style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 10, fontWeight: 600 }}>
                  {event.category}
                </span>
                {event.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md"
                    style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 500 }}>
                    {tag}
                  </span>
                ))}
                {isResolved && (
                  <span className="px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(100,116,139,0.12)', color: '#64748B', fontSize: 10, fontWeight: 600 }}>
                    RESOLVED
                  </span>
                )}
                {event.isNew && (
                  <span className="px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>
                    NEW
                  </span>
                )}
              </div>

              {/* Title (2 lines max) */}
              <h1 className="text-clamp-2" style={{
                color: c.text1, fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 4,
              }}>
                {event.title}
              </h1>

              {/* Meta row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Clock size={11} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 11 }}>{remaining}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={11} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 11 }}>{event.participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 size={11} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 11 }}>{fmtVolume(event.totalVolume)}</span>
                </div>
                {event.change24h !== 0 && (
                  <div className="flex items-center gap-0.5">
                    {event.change24h > 0
                      ? <ArrowUpRight size={12} color="#10B981" strokeWidth={2.5} />
                      : <ArrowDownRight size={12} color="#EF4444" strokeWidth={2.5} />}
                    <span style={{
                      color: event.change24h > 0 ? c.buy : c.sell,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {event.change24h > 0 ? '+' : ''}{event.change24h}%
                    </span>
                  </div>
                )}
              </div>

              {/* ─── Outcomes Section ─── */}
              <OutcomeCards
                outcomes={event.outcomes}
                onSelect={setSelectedOutcome}
              />

              {/* Animated probability bar (binary only) */}
              {!isMultiOutcome && (
                <div className="mt-3">
                  <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
                    <motion.div
                      className="h-full"
                      style={{ background: topTwo[0]?.color, borderRadius: '9999px 0 0 9999px' }}
                      initial={{ width: '50%' }}
                      animate={{ width: `${topTwo[0]?.chance ?? 50}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <motion.div
                      className="h-full"
                      style={{ background: topTwo[1]?.color, borderRadius: '0 9999px 9999px 0' }}
                      initial={{ width: '50%' }}
                      animate={{ width: `${topTwo[1]?.chance ?? 50}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: BarChart3, label: 'Volume 24h', value: fmtVolume(event.volume24h), color: c.primary },
                  { icon: Users, label: 'Participants', value: event.participants.toLocaleString(), color: '#8B5CF6' },
                  { icon: BarChart3, label: 'Total Volume', value: fmtVolume(event.totalVolume), color: c.buy },
                  { icon: Clock, label: 'Ends in', value: remaining, color: c.warn },
                ].map(stat => (
                  <TrCard key={stat.label} variant="inner" className="p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${stat.color}15` }}>
                      <stat.icon size={14} color={stat.color} />
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10 }}>{stat.label}</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{stat.value}</p>
                    </div>
                  </TrCard>
                ))}
            </div>

            {/* ─── User Position Banner ─── */}
            {userPosition && (
              <div>
                <TrCard className="p-3"
                  accentBorder={userPosition.pnl >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} color="#F59E0B" />
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Your Position</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-1.5 py-0.5 rounded mr-2" style={{
                        background: userPosition.outcome === 'Yes' ? c.buyAlpha10 : c.sellAlpha10,
                        color: userPosition.outcome === 'Yes' ? c.buy : c.sell,
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {userPosition.outcome}
                      </span>
                      <span style={{ color: c.text2, fontSize: 11 }}>
                        {userPosition.shares} shares @ ${userPosition.avgPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p style={{
                        color: userPosition.pnl >= 0 ? c.buy : c.sell,
                        fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        {userPosition.pnl >= 0 ? '+' : ''}${userPosition.pnl.toFixed(2)}
                      </p>
                      <p style={{
                        color: userPosition.pnl >= 0 ? c.buy : c.sell,
                        fontSize: 10, fontWeight: 500,
                      }}>
                        {userPosition.pnlPct >= 0 ? '+' : ''}{userPosition.pnlPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </TrCard>
              </div>
            )}

            {/* ─── Chart Section ─── */}
            <div>
              <SectionHeader title="Price / Probability" accent accentColor="#10B981" />
              <TrCard className="p-4">
                <ProbabilityChart eventId={event.id} />
              </TrCard>
            </div>

            {/* ─── Order Book Toggle ─── */}
            <div>
              <button
                onClick={() => { setShowOrderBook(!showOrderBook); hapticSelection(); }}
                className="w-full flex items-center justify-between py-3 px-4 rounded-2xl"
                style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} color="#3B82F6" />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Order Book</span>
                  <InfoTooltip text="Shows all pending buy (bid) and sell (ask) orders. The spread is the gap between the highest bid and lowest ask." />
                </div>
                <motion.div
                  animate={{ rotate: showOrderBook ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} color={c.text3} />
                </motion.div>
              </button>
              <AnimatePresence>
                {showOrderBook && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TrCard className="p-4 mt-2">
                      <OrderBookView chance={topTwo[0]?.chance ?? 50} />
                    </TrCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Trade Panel ─── */}
            {!isResolved && (
              <div>
                <SectionHeader title="Trade" accent accentColor="#3B82F6" />
                <TradePanel
                  event={event}
                  selectedOutcome={selectedOutcome}
                  onOutcomeChange={setSelectedOutcome}
                />
                {/* Hiểu rủi ro link */}
                <button
                  onClick={() => { setShowRiskExplainer(true); hapticSelection(); }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-2 rounded-xl active:opacity-70"
                  style={{ color: c.warn, fontSize: 12, fontWeight: 600, minHeight: 36 }}
                >
                  <Shield size={12} />
                  Hiểu rủi ro trước khi giao dịch
                  <ChevronRight size={10} />
                </button>
              </div>
            )}

            {/* ─── Bottom Tabs ─── */}
            <div>
              <div className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none" style={{ background: c.surface2 }}>
                {DETAIL_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); hapticSelection(); }}
                    className="flex-1 py-2 rounded-lg whitespace-nowrap px-2"
                    style={{
                      background: activeTab === tab ? c.surface : 'transparent',
                      color: activeTab === tab ? c.text1 : c.text3,
                      fontSize: 12,
                      fontWeight: activeTab === tab ? 700 : 400,
                      boxShadow: activeTab === tab ? c.cardShadow : 'none',
                      transition: 'all 0.2s ease',
                      minWidth: 'fit-content',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Tab Content ─── */}
            <TrCard className="p-4">
                {activeTab === 'Rules' && <div><RulesTab eventId={event.id} /></div>}
                {activeTab === 'Comments' && <div><CommentsTab eventId={event.id} /></div>}
                {activeTab === 'Top Holders' && <div><TopHoldersTab eventId={event.id} /></div>}
                {activeTab === 'Activity' && <div><ActivityTab eventId={event.id} /></div>}
            </TrCard>

            {/* ─── Related Markets ─── */}
            <RelatedMarkets currentId={event.id} category={event.category} />

            {/* ─── 07D: Arena Related Rooms Bridge ─── */}
            {(() => {
              const topic = mapCategoryToTopic(event.category);
              if (!topic) return null;
              return (
                <div>
                  <ArenaRelatedRoomsSection topic={topic} />

                  {/* 09C: CTA "Tạo Arena từ event này" */}
                  <div className="mt-3">
                    <button
                      onClick={() => { setShowArenaBridgeSheet(true); hapticSelection(); }}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl w-full active:opacity-70"
                      style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.18)',
                        minHeight: 44,
                      }}
                    >
                      <Sparkles size={14} color="#F59E0B" />
                      <div className="flex-1 text-left">
                        <p style={{ color: c.warn, fontSize: φ.xs, fontWeight: 600 }}>
                          Tạo Arena từ event này
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>
                          Mở Arena Studio với bối cảnh từ prediction event
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: c.warnAlpha10, color: c.warn, fontSize: 8, fontWeight: 700 }}>
                        Arena Points only
                      </span>
                      <ChevronRight size={12} color="#F59E0B" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ─── Quick Links ─── */}
            <div className="flex gap-2">
                <button
                  onClick={() => { navigate(`${prefix}/markets/predictions/rewards`); hapticSelection(); }}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
                >
                  <Gift size={14} color="#F59E0B" />
                  <div className="text-left">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>Daily Rewards</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Earn by providing liquidity</p>
                  </div>
                </button>
                <button
                  onClick={() => { navigate(`${prefix}/markets/predictions/activity`); hapticSelection(); }}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
                >
                  <Activity size={14} color="#8B5CF6" />
                  <div className="text-left">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>Global Activity</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Live trading feed</p>
                  </div>
                </button>
            </div>

          </PageContent>
        )}
      </PullToRefresh>

      {/* ─── Risk Explainer Sheet ─── */}
      <PredictionRiskExplainerSheet
        open={showRiskExplainer}
        onClose={() => setShowRiskExplainer(false)}
      />

      {/* ─── 09D: Arena Bridge Confirmation Sheet ─── */}
      {showArenaBridgeSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-t-2xl p-5 pb-8" style={{ background: c.surface }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: c.surface3 }} />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} color="#F59E0B" />
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>
                Tạo room Arena từ event này?
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mb-5">
              {[
                { icon: '🎮', text: 'Room sẽ dùng Arena Points — không phải tiền thật' },
                { icon: '🔒', text: 'Không ảnh hưởng vị thế Prediction của bạn' },
                { icon: '📌', text: 'Event chỉ là bối cảnh, không liên kết ví hay giao dịch' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <p style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 rounded-lg mb-5"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Info size={10} color={c.primary} />
                <span style={{ color: c.primary, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Nguồn bối cảnh
                </span>
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate">
                {event.title}
              </p>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{event.category}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowArenaBridgeSheet(false); hapticSelection(); }}
                className="flex-1 py-3 rounded-xl active:opacity-70"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, color: c.text2, fontSize: φ.sm, fontWeight: 600, minHeight: 48 }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowArenaBridgeSheet(false);
                  hapticSelection();
                  navigate(`${prefix}/arena/studio`, {
                    state: {
                      fromPrediction: true,
                      eventId: event.id,
                      eventTitle: event.title,
                      category: event.category,
                      topic: mapCategoryToTopic(event.category) || 'crypto',
                    },
                  });
                }}
                className="flex-1 py-3 rounded-xl active:opacity-70"
                style={{ background: c.warn, color: '#fff', fontSize: φ.sm, fontWeight: 700, minHeight: 48 }}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
