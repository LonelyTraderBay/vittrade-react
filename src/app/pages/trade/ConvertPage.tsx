import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ArrowDownUp, ChevronDown, Info, AlertCircle, CheckCircle,
  Zap, Clock, RefreshCw, X, Star, TrendingUp, TrendingDown,
  Shield, ChevronRight, ArrowRight, Copy,
  Target, Calendar, Repeat, GitBranch,
  Timer, CalendarClock, Percent,
  Bell, Settings, Download, BarChart3, Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtAmount, fmtUsd, fmtFee } from '../../data/formatNumber';
import {
  ResponsiveContainer, AreaChart, Area, YAxis,
} from 'recharts';
import {
  FullPriceChart, OrderBookDepth, PriceAlertSheet,
  TxDetailSheet, AdvancedSettingsCard, DCAAnalyticsCard,
  PairInfoCard, ExportShareSheet, InverseRateToggle,
  type PriceAlert, type TxRecord,
} from './convert/ConvertP2Components';

/* ═══════════════════════════════════════════════════════════
   P0 TYPOGRAPHY — Standardized font sizes (φ golden ratio + FONT_SCALE)
   ═══════════════════════════════════════════════════════════
   micro  = 10  (φ.xs)      — icon labels, fine print, badges
   xs     = 12  (FONT_SCALE) — labels, helper text, captions
   sm     = 13  (φ.sm)      — body text, detail rows
   body   = 14  (φ.body)    — section titles, input labels
   base   = 16  (φ.base)    — primary text, receipt amounts
   lg     = 20  (FONT_SCALE) — sheet/modal titles
   input  = 24               — amount input fields (design override)
*/
const FS = {
  micro: 10,
  xs: 12,
  sm: 13,
  body: 14,
  base: 16,
  lg: 20,
  input: 24,
} as const;

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type ConvertMode = 'market' | 'limit' | 'schedule';

interface RouteHop {
  from: string;
  to: string;
  rate: number;
  fee: number;
}

interface SmartRoute {
  type: 'direct' | 'multi-hop';
  hops: RouteHop[];
  totalRate: number;
  totalFee: number;
  savings: number; // % saved vs naive direct
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const ASSETS = [
  { symbol: 'USDT', name: 'Tether USD', balance: 12450.80, color: '#26A17B' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.23451, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', balance: 3.5210, color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', balance: 45.8, color: '#9945FF' },
  { symbol: 'BNB', name: 'BNB', balance: 12.5, color: '#F3BA2F' },
  { symbol: 'ADA', name: 'Cardano', balance: 5000, color: '#0033AD' },
  { symbol: 'MATIC', name: 'Polygon', balance: 2340, color: '#8247E5' },
  { symbol: 'AVAX', name: 'Avalanche', balance: 18.5, color: '#E84142' },
];

const PRICES: Record<string, number> = {
  USDT: 1, BTC: 67543.21, ETH: 3521.45, SOL: 178.32,
  BNB: 412.87, ADA: 0.4521, MATIC: 0.8976, AVAX: 38.54,
};

// Liquidity depth — pairs with USDT have deepest liquidity
const DEEP_PAIRS = new Set(['USDT', 'BTC', 'ETH']);

const MIN_CONVERT_USD = 10;
const MAX_CONVERT_USD = 500000;
const RATE_EXPIRY_SECONDS = 15;
const FEE_RATE = 0.001;

const DEFAULT_FAVORITE_PAIRS = [
  { from: 'USDT', to: 'BTC' },
  { from: 'USDT', to: 'ETH' },
  { from: 'BTC', to: 'ETH' },
  { from: 'USDT', to: 'SOL' },
];

const MOCK_HISTORY = [
  { id: 'tx-001', from: 'USDT', to: 'BTC', fromAmt: 500, toAmt: 0.007401, fee: 0.50, rate: 67540, time: '2 phút trước', status: 'success' as const },
  { id: 'tx-002', from: 'ETH', to: 'USDT', fromAmt: 1, toAmt: 3518.93, fee: 3.52, rate: 3521.45, time: '1 giờ trước', status: 'success' as const },
  { id: 'tx-003', from: 'USDT', to: 'SOL', fromAmt: 100, toAmt: 0.5604, fee: 0.10, rate: 178.45, time: '3 giờ trước', status: 'success' as const },
  { id: 'tx-004', from: 'BNB', to: 'USDT', fromAmt: 2, toAmt: 824.92, fee: 0.83, rate: 412.87, time: '5 giờ trước', status: 'success' as const },
  { id: 'tx-005', from: 'USDT', to: 'AVAX', fromAmt: 200, toAmt: 5.189, fee: 0.20, rate: 38.54, time: 'Hôm qua', status: 'success' as const },
];

const MOCK_PENDING_LIMITS = [
  { id: 'lm-001', from: 'USDT', to: 'BTC', amount: 1000, targetRate: 0.0000152, expiry: '24h', progress: 68, created: '2 giờ trước' },
  { id: 'lm-002', from: 'USDT', to: 'ETH', amount: 500, targetRate: 0.000290, expiry: '7d', progress: 23, created: '1 ngày trước' },
];

const MOCK_SCHEDULES = [
  { id: 'sc-001', from: 'USDT', to: 'BTC', amount: 100, frequency: 'weekly' as const, next: '08/03/2026', total: 4, totalSpent: 400 },
  { id: 'sc-002', from: 'USDT', to: 'ETH', amount: 50, frequency: 'daily' as const, next: '07/03/2026', total: 30, totalSpent: 1500 },
];

/* ═══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function generateSparkline(from: string, to: string): { v: number }[] {
  const seed = (from + to).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const base = PRICES[from] / PRICES[to];
  const data: { v: number }[] = [];
  let val = base;
  for (let i = 0; i < 24; i++) {
    const noise = Math.sin(seed * (i + 1) * 0.37) * 0.015;
    val = val * (1 + noise);
    data.push({ v: val });
  }
  return data;
}

function get24hChange(from: string, to: string): number {
  const data = generateSparkline(from, to);
  return ((data[data.length - 1].v - data[0].v) / data[0].v) * 100;
}

// Smart routing engine
function computeSmartRoute(from: string, to: string): SmartRoute {
  const directRate = PRICES[from] / PRICES[to];
  const directFee = FEE_RATE;

  // If either side is USDT or both are deep-pool assets, direct is best
  if (from === 'USDT' || to === 'USDT' || (DEEP_PAIRS.has(from) && DEEP_PAIRS.has(to))) {
    return {
      type: 'direct',
      hops: [{ from, to, rate: directRate, fee: directFee }],
      totalRate: directRate * (1 - directFee),
      totalFee: directFee,
      savings: 0,
    };
  }

  // Multi-hop through USDT
  const hop1Rate = PRICES[from] / PRICES['USDT'];
  const hop2Rate = PRICES['USDT'] / PRICES[to];
  const multiFee = FEE_RATE * 0.6; // each hop has reduced fee
  const multiTotalRate = hop1Rate * (1 - multiFee) * hop2Rate * (1 - multiFee);
  const directEffective = directRate * (1 - directFee * 1.5); // direct cross-pair has higher spread

  // Also try via BTC for certain pairs
  let bestRoute: SmartRoute;
  const savings = ((multiTotalRate - directEffective) / directEffective) * 100;

  if (savings > 0) {
    bestRoute = {
      type: 'multi-hop',
      hops: [
        { from, to: 'USDT', rate: hop1Rate, fee: multiFee },
        { from: 'USDT', to, rate: hop2Rate, fee: multiFee },
      ],
      totalRate: multiTotalRate,
      totalFee: multiFee * 2,
      savings: Math.abs(savings),
    };
  } else {
    bestRoute = {
      type: 'direct',
      hops: [{ from, to, rate: directRate, fee: directFee }],
      totalRate: directEffective,
      totalFee: directFee,
      savings: 0,
    };
  }

  // Try BTC intermediate
  if (from !== 'BTC' && to !== 'BTC') {
    const btcHop1 = PRICES[from] / PRICES['BTC'];
    const btcHop2 = PRICES['BTC'] / PRICES[to];
    const btcTotal = btcHop1 * (1 - multiFee) * btcHop2 * (1 - multiFee);
    if (btcTotal > bestRoute.totalRate) {
      const btcSavings = ((btcTotal - directEffective) / directEffective) * 100;
      bestRoute = {
        type: 'multi-hop',
        hops: [
          { from, to: 'BTC', rate: btcHop1, fee: multiFee },
          { from: 'BTC', to, rate: btcHop2, fee: multiFee },
        ],
        totalRate: btcTotal,
        totalFee: multiFee * 2,
        savings: Math.abs(btcSavings),
      };
    }
  }

  return bestRoute;
}

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 28, stiffness: 300 } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

// ─── Asset Picker ───
interface AssetPickerProps {
  selected: string;
  excludeSymbol?: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

function AssetPicker({ selected, excludeSymbol, onSelect, onClose }: AssetPickerProps) {
  const c = useThemeColors();
  const [search, setSearch] = useState('');
  const filtered = ASSETS.filter(a =>
    a.symbol !== excludeSymbol &&
    (a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto', maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700 }}>Chọn tài sản</h3>
          <button onClick={onClose} className="active:scale-95 transition-transform"><X size={20} color={c.text2} /></button>
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-2xl px-4"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 44 }}>
            <Zap size={16} color={c.text3} />
            <input autoFocus placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FS.body, flex: 1 }} />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(asset => (
            <button key={asset.symbol} onClick={() => { onSelect(asset.symbol); onClose(); }}
              className="flex items-center gap-3 px-5 py-3 w-full active:opacity-70"
              style={{ borderBottom: `1px solid ${c.divider}`, background: selected === asset.symbol ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: asset.color + '22', border: `1.5px solid ${asset.color}44` }}>
                <span style={{ color: asset.color, fontSize: FS.micro, fontWeight: 700 }}>{asset.symbol.slice(0, 3)}</span>
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: c.text1, fontSize: FS.body, fontWeight: 600 }}>{asset.symbol}</p>
                <p style={{ color: c.text3, fontSize: FS.xs }}>{asset.name}</p>
              </div>
              <div className="text-right">
                <p style={{ color: c.text2, fontSize: FS.sm, fontFamily: 'monospace' }}>{fmtAmount(asset.balance)}</p>
                <p style={{ color: c.text3, fontSize: FS.xs }}>{fmtUsd(asset.balance * PRICES[asset.symbol], { decimals: 0 })}</p>
              </div>
              {selected === asset.symbol && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center ml-1" style={{ background: '#3B82F6' }}>
                  <CheckCircle size={12} color="#fff" />
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sparkline Mini Chart ───
function PairSparkline({ from, to }: { from: string; to: string }) {
  const data = generateSparkline(from, to);
  const change = get24hChange(from, to);
  const color = change >= 0 ? '#10B981' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 64, height: 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs key="gradient-defs">
              <linearGradient id={`spark-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis key={`sp-y-${from}-${to}`} domain={['dataMin', 'dataMax']} hide />
            <Area key={`sp-a-${from}-${to}`} type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
              fill={`url(#spark-${from}-${to})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span style={{ fontSize: FS.xs, fontWeight: 600, color }}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

// ─── Skeleton Loader ───
function RateSkeleton() {
  const c = useThemeColors();
  return (
    <div className="animate-pulse flex flex-col gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-3 rounded" style={{ width: 90, background: c.surface2 }} />
          <div className="h-3 rounded" style={{ width: 120, background: c.surface2 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Smart Routing Visualization ───
function SmartRouteCard({ route, fromAmount }: { route: SmartRoute; fromAmount: number }) {
  const c = useThemeColors();

  if (route.type === 'direct' && route.savings === 0) return null;

  return (
    <motion.div variants={fadeUp}>
      <TrCard className="p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.12)' }}>
            <GitBranch size={14} color="#8B5CF6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>Smart Routing</p>
            <p style={{ color: c.text3, fontSize: FS.xs }}>Tối ưu tuyến đường giao dịch</p>
          </div>
          {route.savings > 0 && (
            <span className="px-2 py-1 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: FS.xs, fontWeight: 700 }}>
              Tiết kiệm {route.savings.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Route visualization */}
        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between relative">
            {route.hops.map((hop, i) => {
              const fromData = ASSETS.find(a => a.symbol === hop.from);
              const toData = ASSETS.find(a => a.symbol === hop.to);
              const isLast = i === route.hops.length - 1;
              return (
                <React.Fragment key={`${hop.from}-${hop.to}`}>
                  {/* From node */}
                  {i === 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                      className="flex flex-col items-center gap-1 z-10"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: (fromData?.color ?? '#666') + '22', border: `2px solid ${(fromData?.color ?? '#666')}55` }}>
                        <span style={{ color: fromData?.color, fontSize: FS.micro, fontWeight: 700 }}>{hop.from.slice(0, 3)}</span>
                      </div>
                      <span style={{ color: c.text1, fontSize: FS.micro, fontWeight: 600 }}>{hop.from}</span>
                    </motion.div>
                  )}

                  {/* Arrow + rate */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.3 }}
                    className="flex-1 flex flex-col items-center gap-1 mx-1"
                  >
                    <div className="w-full flex items-center">
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${fromData?.color ?? '#666'}44, ${toData?.color ?? '#666'}44)` }} />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                      >
                        <ArrowRight size={12} color={c.text3} />
                      </motion.div>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${fromData?.color ?? '#666'}44, ${toData?.color ?? '#666'}44)` }} />
                    </div>
                    <span style={{ color: c.text3, fontSize: FS.micro, fontFamily: 'monospace' }}>
                      {hop.fee > 0 ? `${(hop.fee * 100).toFixed(2)}% phí` : ''}
                    </span>
                  </motion.div>

                  {/* Intermediate or final node */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.15, type: 'spring', stiffness: 400 }}
                    className="flex flex-col items-center gap-1 z-10"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: (toData?.color ?? '#666') + '22',
                        border: `2px solid ${(toData?.color ?? '#666')}55`,
                        boxShadow: isLast ? `0 0 12px ${(toData?.color ?? '#666')}33` : 'none',
                      }}>
                      <span style={{ color: toData?.color, fontSize: FS.micro, fontWeight: 700 }}>{hop.to.slice(0, 3)}</span>
                    </div>
                    <span style={{ color: isLast ? c.text1 : c.text2, fontSize: FS.micro, fontWeight: isLast ? 700 : 600 }}>
                      {hop.to}
                    </span>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Route comparison */}
        {route.type === 'multi-hop' && (
          <div className="flex gap-2 mt-3">
            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p style={{ color: '#10B981', fontSize: FS.micro, fontWeight: 600 }}>Smart Route ✓</p>
              <p style={{ color: c.text1, fontSize: FS.xs, fontWeight: 700, fontFamily: 'monospace' }}>
                {route.hops.map(h => h.from).concat(route.hops[route.hops.length - 1].to).join(' → ')}
              </p>
              <p style={{ color: '#10B981', fontSize: FS.micro }}>Phí: {(route.totalFee * 100).toFixed(2)}%</p>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: c.surface2, opacity: 0.6 }}>
              <p style={{ color: c.text3, fontSize: FS.micro, fontWeight: 600 }}>Direct</p>
              <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 700, fontFamily: 'monospace' }}>
                {route.hops[0].from} → {route.hops[route.hops.length - 1].to}
              </p>
              <p style={{ color: c.text3, fontSize: FS.micro }}>Spread cao hơn</p>
            </div>
          </div>
        )}
      </TrCard>
    </motion.div>
  );
}

// ─── Review / Confirmation Sheet ───
interface ReviewSheetProps {
  fromAsset: string; toAsset: string; fromAmount: number; toAmount: number;
  rate: number; feeUsd: number; minReceive: number; priceImpact: number;
  slippage: number; countdown: number; route: SmartRoute;
  mode: ConvertMode; limitRate?: number; limitExpiry?: string;
  onConfirm: () => void; onClose: () => void; isConverting: boolean;
}

function ConvertReviewSheet({
  fromAsset, toAsset, fromAmount, toAmount, rate,
  feeUsd, minReceive, priceImpact, slippage, countdown, route, mode,
  limitRate, limitExpiry,
  onConfirm, onClose, isConverting,
}: ReviewSheetProps) {
  const c = useThemeColors();
  const fromData = ASSETS.find(a => a.symbol === fromAsset)!;
  const toData = ASSETS.find(a => a.symbol === toAsset)!;

  const rows = [
    { label: 'Loại lệnh', value: mode === 'market' ? 'Market' : mode === 'limit' ? 'Limit' : 'Scheduled' },
    { label: 'Tỷ giá', value: `1 ${fromAsset} = ${(mode === 'limit' && limitRate ? limitRate : rate).toFixed(6)} ${toAsset}` },
    ...(mode === 'limit' && limitExpiry ? [{ label: 'Hết hạn', value: limitExpiry }] : []),
    { label: `Phí (${(route.totalFee * 100).toFixed(2)}%)`, value: fmtUsd(feeUsd) },
    { label: 'Slippage', value: `${slippage}%` },
    { label: 'Tối thiểu nhận', value: `${fmtAmount(minReceive)} ${toAsset}` },
    { label: 'Price Impact', value: `${priceImpact.toFixed(2)}%`, color: priceImpact > 0.1 ? '#F59E0B' : '#10B981' },
    ...(route.type === 'multi-hop' ? [{
      label: 'Routing',
      value: route.hops.map(h => h.from).concat(route.hops[route.hops.length - 1].to).join(' → '),
      color: '#8B5CF6',
    }] : []),
    ...(route.savings > 0 ? [{ label: 'Tiết kiệm', value: `${route.savings.toFixed(2)}%`, color: '#10B981' }] : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
        <motion.div
          variants={slideUp} initial="hidden" animate="visible" exit="exit"
          className="w-full rounded-t-3xl flex flex-col"
          style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto' }}
          onClick={e => e.stopPropagation()}>

          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
          </div>
          <div className="px-5 pt-2 pb-4 flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700 }}>
              {mode === 'limit' ? 'Xác nhận Limit Convert' : mode === 'schedule' ? 'Xác nhận lịch tự động' : 'Xác nhận chuyển đổi'}
            </h3>
            <button onClick={onClose} className="active:scale-95 transition-transform"><X size={20} color={c.text2} /></button>
          </div>

          {/* Amount summary */}
          <div className="mx-5 rounded-2xl p-4 flex flex-col gap-3" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: fromData.color + '22', border: `1.5px solid ${fromData.color}44` }}>
                  <span style={{ color: fromData.color, fontSize: FS.micro, fontWeight: 700 }}>{fromAsset.slice(0, 3)}</span>
                </div>
                <div>
                  <p style={{ color: c.text2, fontSize: FS.xs }}>Từ</p>
                  <p style={{ color: c.text1, fontSize: FS.base, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtAmount(fromAmount)} {fromAsset}
                  </p>
                </div>
              </div>
              <p style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>≈ {fmtUsd(fromAmount * PRICES[fromAsset])}</p>
            </div>
            <div className="flex justify-center"><ArrowDownUp size={16} color={c.text3} /></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: toData.color + '22', border: `1.5px solid ${toData.color}44` }}>
                  <span style={{ color: toData.color, fontSize: FS.micro, fontWeight: 700 }}>{toAsset.slice(0, 3)}</span>
                </div>
                <div>
                  <p style={{ color: c.text2, fontSize: FS.xs }}>Sang</p>
                  <p style={{ color: '#10B981', fontSize: FS.base, fontWeight: 700, fontFamily: 'monospace' }}>
                    {mode === 'limit' ? '≈ ' : ''}{fmtAmount(toAmount)} {toAsset}
                  </p>
                </div>
              </div>
              <p style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>≈ {fmtUsd(toAmount * PRICES[toAsset])}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
            {rows.map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span style={{ color: c.text2, fontSize: FS.sm }}>{row.label}</span>
                <span style={{ color: (row as any).color ?? c.text1, fontSize: FS.sm, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Rate expiry (market only) */}
          {mode === 'market' && (
            <div className="mx-5 mt-2 rounded-xl px-4 py-3 flex items-center gap-2"
              style={{
                background: countdown <= 5 ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${countdown <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
              }}>
              <Clock size={14} color={countdown <= 5 ? '#EF4444' : '#3B82F6'} />
              <span style={{ color: countdown <= 5 ? '#EF4444' : '#3B82F6', fontSize: FS.xs, fontWeight: 600, flex: 1 }}>
                Tỷ giá có hiệu lực trong {countdown}s
              </span>
            </div>
          )}

          <div className="px-5 pt-4 pb-6">
            <button onClick={onConfirm}
              disabled={isConverting || (mode === 'market' && countdown <= 0)}
              className="w-full h-[48px] rounded-[14px] text-white text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
              style={{ fontWeight: 600, background: c.primary }}>
              {isConverting ? (
                <><span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang xử lý...</>
              ) : mode === 'market' && countdown <= 0 ? (
                <><RefreshCw className="w-5 h-5" /> Tỷ giá hết hạn — Làm mới</>
              ) : (
                <><Shield className="w-5 h-5" /> {mode === 'limit' ? 'Đặt lệnh Limit' : mode === 'schedule' ? 'Tạo lịch tự động' : 'Xác nhận chuyển đổi'}</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Order Receipt ───
interface ReceiptProps {
  txId: string; fromAsset: string; toAsset: string; fromAmount: number;
  toAmount: number; feeUsd: number; rate: number; timestamp: string;
  mode: ConvertMode;
  onClose: () => void; onConvertMore: () => void;
}

function ConvertReceipt({ txId, fromAsset, toAsset, fromAmount, toAmount, feeUsd, rate, timestamp, mode, onClose, onConvertMore }: ReceiptProps) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard?.writeText(txId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const title = mode === 'limit' ? 'Lệnh Limit đã đặt!' : mode === 'schedule' ? 'Lịch đã tạo!' : 'Chuyển đổi thành công!';
  const subtitle = mode === 'limit' ? 'Lệnh sẽ thực hiện khi đạt tỷ giá mục tiêu' : mode === 'schedule' ? 'Hệ thống sẽ tự chuyển đổi theo lịch' : timestamp;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full rounded-3xl flex flex-col overflow-hidden"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 400 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center pt-8 pb-5 px-5"
          style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.12) 0%, transparent 100%)' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={32} color="#10B981" />
          </motion.div>
          <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
          <p style={{ color: c.text2, fontSize: FS.sm }}>{subtitle}</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-center gap-3">
          <div className="text-right">
            <p style={{ color: c.text2, fontSize: FS.xs }}>Từ</p>
            <p style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(fromAmount)}</p>
            <p style={{ color: c.text3, fontSize: FS.xs }}>{fromAsset}</p>
          </div>
          <ArrowRight size={20} color={c.text3} />
          <div className="text-left">
            <p style={{ color: c.text2, fontSize: FS.xs }}>Sang</p>
            <p style={{ color: '#10B981', fontSize: FS.lg, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(toAmount)}</p>
            <p style={{ color: c.text3, fontSize: FS.xs }}>{toAsset}</p>
          </div>
        </div>
        <div className="px-5 py-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
          {[
            { label: 'Tỷ giá', value: `1 ${fromAsset} = ${rate.toFixed(6)} ${toAsset}` },
            { label: 'Phí', value: fmtUsd(feeUsd) },
            { label: 'Giá trị', value: fmtUsd(fromAmount * PRICES[fromAsset]) },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center">
              <span style={{ color: c.text2, fontSize: FS.xs }}>{r.label}</span>
              <span style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="mx-5 rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <span style={{ color: c.text3, fontSize: FS.xs, flex: 1 }}>TX: {txId.slice(0, 8)}...{txId.slice(-6)}</span>
          <button onClick={handleCopy} className="active:scale-95 transition-transform">
            {copied ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} color={c.text3} />}
          </button>
        </div>
        <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
          <button onClick={onConvertMore}
            className="w-full h-[48px] rounded-[14px] text-white text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ fontWeight: 600, background: c.primary }}>
            <RefreshCw className="w-5 h-5" /> Tiếp tục
          </button>
          <button onClick={onClose}
            className="w-full h-[44px] rounded-[14px] text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ fontWeight: 600, color: c.text2, background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function ConvertPage() {
  const c = useThemeColors();

  // ─── State ───
  const [mode, setMode] = useState<ConvertMode>('market');
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('');
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITE_PAIRS);

  // Limit mode state
  const [limitRate, setLimitRate] = useState('');
  const [limitExpiry, setLimitExpiry] = useState('24h');

  // Schedule mode state
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');

  // P2 state
  const [showChart, setShowChart] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPairInfo, setShowPairInfo] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TxRecord | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: 'alert-demo-1', from: 'USDT', to: 'BTC', targetRate: 0.0000155, direction: 'above', active: true, created: '04/03/2026' },
    { id: 'alert-demo-2', from: 'USDT', to: 'ETH', targetRate: 0.0003, direction: 'below', active: true, created: '05/03/2026' },
  ]);
  const [inverseRate, setInverseRate] = useState(false);
  const [mevProtection, setMevProtection] = useState(true);
  const [txDeadline, setTxDeadline] = useState(20);
  const [autoSlippage, setAutoSlippage] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);

  // Receipt state
  const [receipt, setReceipt] = useState<{
    txId: string; fromAsset: string; toAsset: string;
    fromAmount: number; toAmount: number; feeUsd: number;
    rate: number; timestamp: string;
  } | null>(null);

  // Rate countdown
  const [rateCountdown, setRateCountdown] = useState(RATE_EXPIRY_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  // ─── Derived ───
  const fromAssetData = ASSETS.find(a => a.symbol === fromAsset)!;
  const toAssetData = ASSETS.find(a => a.symbol === toAsset)!;
  const fromPrice = PRICES[fromAsset] ?? 1;
  const toPrice = PRICES[toAsset] ?? 1;
  const marketRate = fromPrice / toPrice;
  const effectiveRate = mode === 'limit' && parseFloat(limitRate) > 0 ? parseFloat(limitRate) : marketRate;
  const fromAmountNum = parseFloat(fromAmount || '0');
  const toAmountNum = fromAmountNum * effectiveRate;

  const smartRoute = useMemo(() => computeSmartRoute(fromAsset, toAsset), [fromAsset, toAsset]);
  const feeUsdt = fromAmountNum * fromPrice * smartRoute.totalFee;
  const effectiveSlippage = slippage / 100;
  const minReceive = toAmountNum * (1 - effectiveSlippage);
  const priceImpact = fromAmountNum * fromPrice > 50000 ? 0.12 : fromAmountNum * fromPrice > 10000 ? 0.06 : 0.03;

  const fromAmountUsd = fromAmountNum * fromPrice;
  const isInsufficientBalance = fromAmountNum > fromAssetData.balance;
  const isBelowMin = fromAmountNum > 0 && fromAmountUsd < MIN_CONVERT_USD;
  const isAboveMax = fromAmountUsd > MAX_CONVERT_USD;
  const canConvert = fromAmountNum > 0 && !isInsufficientBalance && !isBelowMin && !isAboveMax
    && (mode !== 'limit' || parseFloat(limitRate) > 0);

  // ─── Countdown ───
  const resetCountdown = useCallback(() => setRateCountdown(RATE_EXPIRY_SECONDS), []);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setRateCountdown(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const refreshRate = useCallback(() => {
    setRateLoading(true);
    setTimeout(() => { setRateLoading(false); resetCountdown(); }, 600);
  }, [resetCountdown]);

  useEffect(() => {
    if (rateCountdown === 0 && !showReview) refreshRate();
  }, [rateCountdown, showReview, refreshRate]);

  useEffect(() => {
    setRateLoading(true);
    const t = setTimeout(() => { setRateLoading(false); resetCountdown(); }, 400);
    return () => clearTimeout(t);
  }, [fromAsset, toAsset, resetCountdown]);

  // ─── Handlers ───
  const handleSwapAssets = () => { setFromAsset(toAsset); setToAsset(fromAsset); setFromAmount(''); };

  const handleOpenReview = () => { if (!canConvert) return; resetCountdown(); setShowReview(true); };

  const handleConvert = async () => {
    if (!canConvert) return;
    setIsConverting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsConverting(false);
    setShowReview(false);
    const txId = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
    setReceipt({
      txId, fromAsset, toAsset, fromAmount: fromAmountNum, toAmount: toAmountNum,
      feeUsd: feeUsdt, rate: effectiveRate, timestamp: new Date().toLocaleString('vi-VN'),
    });
    setFromAmount('');
  };

  const handleSlippageSelect = (val: number) => { setSlippage(val); setShowCustomSlippage(false); setCustomSlippage(''); };
  const handleCustomSlippageApply = () => { const v = parseFloat(customSlippage); if (v > 0 && v <= 50) setSlippage(v); };
  const handleSelectFavorite = (pair: { from: string; to: string }) => { setFromAsset(pair.from); setToAsset(pair.to); setFromAmount(''); };

  const toggleFavorite = () => {
    const exists = favorites.some(f => f.from === fromAsset && f.to === toAsset);
    setFavorites(exists ? favorites.filter(f => !(f.from === fromAsset && f.to === toAsset)) : [...favorites, { from: fromAsset, to: toAsset }]);
  };

  const handleAddAlert = (alert: PriceAlert) => setAlerts(prev => [...prev, alert]);
  const handleRemoveAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const handleToggleAlert = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  const activeAlertCount = alerts.filter(a => a.from === fromAsset && a.to === toAsset && a.active).length;

  const isFavorited = favorites.some(f => f.from === fromAsset && f.to === toAsset);
  const pctButtons = [25, 50, 75, 100];
  const slippageOptions = [0.5, 1, 2];

  const MODES: { key: ConvertMode; label: string; icon: React.ReactNode }[] = [
    { key: 'market', label: 'Market', icon: <Zap size={14} /> },
    { key: 'limit', label: 'Limit', icon: <Target size={14} /> },
    { key: 'schedule', label: 'Tự động', icon: <Calendar size={14} /> },
  ];

  const FREQ_OPTIONS = [
    { key: 'daily' as const, label: 'Hàng ngày' },
    { key: 'weekly' as const, label: 'Hàng tuần' },
    { key: 'biweekly' as const, label: '2 tuần' },
    { key: 'monthly' as const, label: 'Hàng tháng' },
  ];

  const LIMIT_EXPIRY = ['1h', '4h', '12h', '24h', '7d'];

  return (
    <PageLayout>
      {/* ─── Overlays ─── */}
      <AnimatePresence>
        {picker && (
          <AssetPicker key="picker"
            selected={picker === 'from' ? fromAsset : toAsset}
            excludeSymbol={picker === 'from' ? toAsset : fromAsset}
            onSelect={s => picker === 'from' ? setFromAsset(s) : setToAsset(s)}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReview && (
          <ConvertReviewSheet key="review"
            fromAsset={fromAsset} toAsset={toAsset}
            fromAmount={fromAmountNum} toAmount={toAmountNum}
            rate={effectiveRate} feeUsd={feeUsdt} minReceive={minReceive}
            priceImpact={priceImpact} slippage={slippage}
            countdown={rateCountdown} route={smartRoute}
            mode={mode} limitRate={parseFloat(limitRate) || undefined}
            limitExpiry={mode === 'limit' ? limitExpiry : undefined}
            onConfirm={handleConvert} onClose={() => setShowReview(false)} isConverting={isConverting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receipt && (
          <ConvertReceipt key="receipt"
            {...receipt} mode={mode}
            onConvertMore={() => setReceipt(null)} onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAlerts && (
          <PriceAlertSheet key="alerts"
            from={fromAsset} to={toAsset} currentRate={marketRate}
            alerts={alerts} onAddAlert={handleAddAlert}
            onRemoveAlert={handleRemoveAlert} onToggleAlert={handleToggleAlert}
            onClose={() => setShowAlerts(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTx && (
          <TxDetailSheet key="tx-detail"
            tx={selectedTx} onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportShareSheet key="export"
            history={MOCK_HISTORY as TxRecord[]}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>

      <Header title="Convert / Swap" back
        action={{ icon: Bell, onClick: () => setShowAlerts(true) }}
      />

      <PageContent gap="default">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">

          {/* ═══ MODE SWITCHER ═══ */}
          <motion.div variants={fadeUp}>
            <div className="flex rounded-2xl p-1" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
              {MODES.map(m => (
                <button key={m.key}
                  onClick={() => setMode(m.key)}
                  className="flex-1 flex items-center justify-center gap-2 min-h-10 rounded-xl transition-all active:scale-[0.97]"
                  style={{
                    background: mode === m.key ? c.surface : 'transparent',
                    boxShadow: mode === m.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    color: mode === m.key ? c.text1 : c.text3,
                    fontSize: FS.sm, fontWeight: mode === m.key ? 700 : 500,
                  }}>
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ═══ FAVORITE PAIRS ═══ */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600 }}>Cặp thường dùng</p>
              <button onClick={toggleFavorite} className="flex items-center gap-1 active:scale-95 transition-transform">
                <Star size={12} color={isFavorited ? '#F59E0B' : c.text3} fill={isFavorited ? '#F59E0B' : 'none'} />
                <span style={{ color: isFavorited ? '#F59E0B' : c.text3, fontSize: FS.xs }}>
                  {isFavorited ? 'Đã lưu' : 'Lưu cặp'}
                </span>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              {favorites.map(pair => {
                const isActive = pair.from === fromAsset && pair.to === toAsset;
                return (
                  <button key={`${pair.from}-${pair.to}`}
                    onClick={() => handleSelectFavorite(pair)}
                    className="flex items-center gap-2 px-3 min-h-9 rounded-xl shrink-0 active:scale-95 transition-all"
                    style={{
                      background: isActive ? `${c.primary}15` : c.surface2,
                      border: `1px solid ${isActive ? c.primary : c.borderSolid}`,
                    }}>
                    <span style={{ fontSize: FS.xs, fontWeight: 600, color: isActive ? c.primary : c.text1 }}>
                      {pair.from}/{pair.to}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ═══ RATE BANNER + INVERSE TOGGLE ═══ */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{
                background: rateCountdown <= 5 ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${rateCountdown <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
              }}>
              <RefreshCw size={14} color={rateCountdown <= 5 ? '#EF4444' : '#3B82F6'}
                className={rateLoading ? 'animate-spin' : ''} />
              <div className="flex-1">
                {rateLoading ? (
                  <div className="h-3 w-32 rounded animate-pulse" style={{ background: c.surface2 }} />
                ) : (
                  <InverseRateToggle
                    from={fromAsset} to={toAsset} rate={marketRate}
                    inversed={inverseRate} onToggle={() => setInverseRate(!inverseRate)}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: rateCountdown <= 5 ? '#EF4444' : '#3B82F6', fontSize: FS.xs, fontWeight: 700, fontFamily: 'monospace' }}>
                  {rateCountdown}s
                </span>
                <button onClick={refreshRate} className="active:scale-90 transition-transform">
                  <RefreshCw size={12} color={rateCountdown <= 5 ? '#EF4444' : '#3B82F6'} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══ FROM CARD ═══ */}
          <motion.div variants={fadeUp}>
            <TrCard rounded="lg" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: FS.sm }}>Từ</span>
                <span style={{ color: c.text3, fontSize: FS.xs }}>
                  Số dư: <span style={{ color: c.text2, fontFamily: 'monospace' }}>{fmtAmount(fromAssetData.balance)} {fromAsset}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setPicker('from')}
                  className="flex items-center gap-2 px-3 min-h-10 rounded-2xl shrink-0 active:scale-95 transition-transform"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: fromAssetData.color + '22' }}>
                    <span style={{ color: fromAssetData.color, fontSize: FS.micro, fontWeight: 700 }}>{fromAsset.slice(0, 3)}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: FS.body, fontWeight: 700 }}>{fromAsset}</span>
                  <ChevronDown size={14} color={c.text2} />
                </button>
                <input type="number" inputMode="decimal" placeholder="0.00"
                  value={fromAmount} onChange={e => setFromAmount(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FS.input, fontWeight: 700, fontFamily: 'monospace', flex: 1, textAlign: 'right', width: '100%', minWidth: 0 }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {pctButtons.map(pct => (
                    <button key={pct}
                      onClick={() => setFromAmount(((fromAssetData.balance * pct) / 100).toFixed(fromAsset === 'USDT' ? 2 : 6))}
                      className="px-3 min-h-9 rounded-xl active:scale-95 transition-transform"
                      style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: FS.xs, fontWeight: 600 }}>
                      {pct}%
                    </button>
                  ))}
                </div>
                {fromAmountNum > 0 && (
                  <span style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>≈ {fmtUsd(fromAmountUsd)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span style={{ color: c.text3, fontSize: FS.xs }}>Min: {fmtUsd(MIN_CONVERT_USD, { decimals: 0 })}</span>
                <span style={{ color: c.text3, fontSize: FS.xs }}>Max: {fmtUsd(MAX_CONVERT_USD, { decimals: 0 })}</span>
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ SWAP BUTTON ═══ */}
          <motion.div variants={fadeUp} className="flex justify-center -my-4 relative z-10">
            <motion.button
              onClick={handleSwapAssets}
              whileTap={{ rotate: 180, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: c.surface, border: `2px solid ${c.borderSolid}`, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <ArrowDownUp size={18} color="#3B82F6" />
            </motion.button>
          </motion.div>

          {/* ═══ TO CARD ═══ */}
          <motion.div variants={fadeUp}>
            <TrCard rounded="lg" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: FS.sm }}>Sang</span>
                <span style={{ color: c.text3, fontSize: FS.xs }}>
                  Số dư: <span style={{ color: c.text2, fontFamily: 'monospace' }}>{fmtAmount(toAssetData.balance)} {toAsset}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPicker('to')}
                  className="flex items-center gap-2 px-3 min-h-10 rounded-2xl shrink-0 active:scale-95 transition-transform"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: toAssetData.color + '22' }}>
                    <span style={{ color: toAssetData.color, fontSize: FS.micro, fontWeight: 700 }}>{toAsset.slice(0, 3)}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: FS.body, fontWeight: 700 }}>{toAsset}</span>
                  <ChevronDown size={14} color={c.text2} />
                </button>
                <div className="flex-1 text-right">
                  <p style={{ color: fromAmountNum > 0 ? '#10B981' : c.text3, fontSize: FS.input, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fromAmountNum > 0 ? fmtAmount(toAmountNum) : '0.00'}
                  </p>
                </div>
              </div>
              {fromAmountNum > 0 && (
                <div className="flex items-center justify-end mt-2">
                  <span style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>≈ {fmtUsd(toAmountNum * toPrice)}</span>
                </div>
              )}
            </TrCard>
          </motion.div>

          {/* ═══ QUICK ACTIONS (toolbar — toggles for Chart/Depth/Info/Alert/Advanced) ═══ */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setShowChart(!showChart)}
                className="flex items-center gap-2 px-3 min-h-9 rounded-xl active:scale-95 transition-transform shrink-0"
                style={{
                  background: showChart ? `${c.primary}15` : c.surface2,
                  border: `1px solid ${showChart ? c.primary : c.borderSolid}`,
                  color: showChart ? c.primary : c.text3, fontSize: FS.xs, fontWeight: 600,
                }}>
                <BarChart3 size={12} /> Chart
              </button>
              <button onClick={() => setShowOrderBook(!showOrderBook)}
                className="flex items-center gap-2 px-3 min-h-9 rounded-xl active:scale-95 transition-transform shrink-0"
                style={{
                  background: showOrderBook ? `${c.primary}15` : c.surface2,
                  border: `1px solid ${showOrderBook ? c.primary : c.borderSolid}`,
                  color: showOrderBook ? c.primary : c.text3, fontSize: FS.xs, fontWeight: 600,
                }}>
                <Layers size={12} /> Depth
              </button>
              <button onClick={() => setShowPairInfo(!showPairInfo)}
                className="flex items-center gap-2 px-3 min-h-9 rounded-xl active:scale-95 transition-transform shrink-0"
                style={{
                  background: showPairInfo ? `${c.primary}15` : c.surface2,
                  border: `1px solid ${showPairInfo ? c.primary : c.borderSolid}`,
                  color: showPairInfo ? c.primary : c.text3, fontSize: FS.xs, fontWeight: 600,
                }}>
                <Info size={12} /> Info
              </button>
              <button onClick={() => setShowAlerts(true)}
                className="flex items-center gap-2 px-3 min-h-9 rounded-xl active:scale-95 transition-transform relative shrink-0"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, color: c.text3, fontSize: FS.xs, fontWeight: 600 }}>
                <Bell size={12} /> Alert
                {activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                    style={{ background: '#EF4444', fontSize: FS.micro, fontWeight: 700 }}>
                    {activeAlertCount}
                  </span>
                )}
              </button>
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-3 min-h-9 rounded-xl active:scale-95 transition-transform shrink-0"
                style={{
                  background: showAdvanced ? `${c.primary}15` : c.surface2,
                  border: `1px solid ${showAdvanced ? c.primary : c.borderSolid}`,
                  color: showAdvanced ? c.primary : c.text3, fontSize: FS.xs, fontWeight: 600,
                }}>
                <Settings size={12} />
              </button>
            </div>
          </motion.div>

          {/* ═══ P2: FULL PRICE CHART ═══ */}
          <AnimatePresence>
            {showChart && (
              <motion.div key="full-chart" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <FullPriceChart from={fromAsset} to={toAsset}
                  expanded={chartExpanded} onToggleExpand={() => setChartExpanded(!chartExpanded)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ P2: ORDER BOOK ═══ */}
          <AnimatePresence>
            {showOrderBook && (
              <motion.div key="order-book" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <OrderBookDepth from={fromAsset} to={toAsset} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ P2: PAIR INFO ═══ */}
          <AnimatePresence>
            {showPairInfo && (
              <motion.div key="pair-info" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <PairInfoCard from={fromAsset} to={toAsset} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ LIMIT MODE: TARGET RATE + EXPIRY ═══ */}
          <AnimatePresence mode="wait">
            {mode === 'limit' && (
              <motion.div key="limit-controls"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                <TrCard rounded="lg" className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} color="#F59E0B" />
                    <span style={{ color: c.text1, fontSize: FS.body, fontWeight: 700 }}>Tỷ giá mục tiêu</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 flex-1 rounded-xl px-3"
                      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 44 }}>
                      <span style={{ color: c.text3, fontSize: FS.xs }}>1 {fromAsset} =</span>
                      <input type="number" inputMode="decimal" placeholder={marketRate.toFixed(6)}
                        value={limitRate} onChange={e => setLimitRate(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FS.body, fontWeight: 700, fontFamily: 'monospace', flex: 1, textAlign: 'right' }} />
                      <span style={{ color: c.text3, fontSize: FS.xs, marginLeft: 4 }}>{toAsset}</span>
                    </div>
                  </div>

                  {/* Rate difference indicator */}
                  {parseFloat(limitRate) > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Percent size={12} color={parseFloat(limitRate) > marketRate ? '#10B981' : '#F59E0B'} />
                      <span style={{
                        color: parseFloat(limitRate) > marketRate ? '#10B981' : '#F59E0B',
                        fontSize: FS.xs, fontWeight: 600,
                      }}>
                        {parseFloat(limitRate) > marketRate ? '+' : ''}
                        {(((parseFloat(limitRate) - marketRate) / marketRate) * 100).toFixed(2)}% so với market
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={14} color={c.text2} />
                    <span style={{ color: c.text2, fontSize: FS.xs }}>Hết hạn sau</span>
                  </div>
                  <div className="flex gap-2">
                    {LIMIT_EXPIRY.map(exp => (
                      <button key={exp}
                        onClick={() => setLimitExpiry(exp)}
                        className="px-3 min-h-9 rounded-xl active:scale-95 transition-transform"
                        style={{
                          background: limitExpiry === exp ? c.primary : c.surface2,
                          color: limitExpiry === exp ? '#fff' : c.text2,
                          border: `1px solid ${limitExpiry === exp ? c.primary : c.borderSolid}`,
                          fontSize: FS.xs, fontWeight: 600,
                        }}>
                        {exp}
                      </button>
                    ))}
                  </div>
                </TrCard>

                {/* Pending limit orders */}
                {MOCK_PENDING_LIMITS.length > 0 && (
                  <div className="mt-3">
                    <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600, marginBottom: 8, paddingLeft: 2 }}>
                      Lệnh Limit đang chờ ({MOCK_PENDING_LIMITS.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {MOCK_PENDING_LIMITS.map(lm => (
                        <TrCard key={lm.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 600 }}>
                              {fmtUsd(lm.amount)} {lm.from} → {lm.to}
                            </span>
                            <span className="px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: FS.micro, fontWeight: 600 }}>
                              Đang chờ
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span style={{ color: c.text3, fontSize: FS.xs }}>Target: {lm.targetRate}</span>
                            <span style={{ color: c.text3, fontSize: FS.xs }}>Hết hạn: {lm.expiry}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${lm.progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: 'linear-gradient(90deg, #F59E0B, #F97316)' }}
                            />
                          </div>
                          <p style={{ color: c.text3, fontSize: FS.micro, marginTop: 4 }}>
                            Tiến độ tỷ giá: {lm.progress}% · Tạo {lm.created}
                          </p>
                        </TrCard>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ SCHEDULE MODE ═══ */}
          <AnimatePresence mode="wait">
            {mode === 'schedule' && (
              <motion.div key="schedule-controls"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                <TrCard rounded="lg" className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarClock size={16} color="#8B5CF6" />
                    <span style={{ color: c.text1, fontSize: FS.body, fontWeight: 700 }}>Lịch tự động</span>
                  </div>

                  <p style={{ color: c.text2, fontSize: FS.xs, marginBottom: 8 }}>Tần suất chuyển đổi</p>
                  <div className="flex gap-2 mb-3">
                    {FREQ_OPTIONS.map(f => (
                      <button key={f.key}
                        onClick={() => setScheduleFrequency(f.key)}
                        className="flex-1 min-h-10 rounded-xl active:scale-95 transition-all flex items-center justify-center"
                        style={{
                          background: scheduleFrequency === f.key ? c.primary : c.surface2,
                          color: scheduleFrequency === f.key ? '#fff' : c.text2,
                          border: `1px solid ${scheduleFrequency === f.key ? c.primary : c.borderSolid}`,
                          fontSize: FS.xs, fontWeight: 600,
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Schedule preview */}
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat size={14} color="#8B5CF6" />
                      <span style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600 }}>Xem trước lịch</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Số tiền mỗi lần', value: fromAmountNum > 0 ? `${fmtAmount(fromAmountNum)} ${fromAsset}` : '—' },
                        { label: 'Tần suất', value: FREQ_OPTIONS.find(f => f.key === scheduleFrequency)?.label ?? '' },
                        { label: 'Ước tính/tháng', value: fromAmountNum > 0 ? fmtUsd(fromAmountNum * fromPrice * (scheduleFrequency === 'daily' ? 30 : scheduleFrequency === 'weekly' ? 4.3 : scheduleFrequency === 'biweekly' ? 2.15 : 1)) : '—' },
                        { label: 'Lần tiếp theo', value: '08/03/2026' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between">
                          <span style={{ color: c.text3, fontSize: FS.xs }}>{r.label}</span>
                          <span style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TrCard>

                {/* Active schedules */}
                {MOCK_SCHEDULES.length > 0 && (
                  <div className="mt-3">
                    <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600, marginBottom: 8, paddingLeft: 2 }}>
                      Lịch đang hoạt động ({MOCK_SCHEDULES.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {MOCK_SCHEDULES.map(sc => (
                        <TrCard key={sc.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 600 }}>
                              {fmtUsd(sc.amount)} {sc.from} → {sc.to}
                            </span>
                            <span className="px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: FS.micro, fontWeight: 600 }}>
                              {sc.frequency === 'daily' ? 'Hàng ngày' : sc.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span style={{ color: c.text3, fontSize: FS.xs }}>Lần tiếp: {sc.next}</span>
                            <span style={{ color: c.text3, fontSize: FS.xs }}>Đã mua: {sc.total} lần</span>
                            <span style={{ color: '#10B981', fontSize: FS.xs, fontWeight: 600 }}>{fmtUsd(sc.totalSpent)}</span>
                          </div>
                        </TrCard>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ SPARKLINE ═══ */}
          <motion.div variants={fadeUp}>
            <TrCard className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600 }}>{fromAsset}/{toAsset} · 24h</span>
                  {(() => {
                    const ch = get24hChange(fromAsset, toAsset);
                    return ch >= 0 ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />;
                  })()}
                </div>
                <PairSparkline from={fromAsset} to={toAsset} />
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ SMART ROUTING ═══ */}
          <SmartRouteCard route={smartRoute} fromAmount={fromAmountNum} />

          {/* ═══ RATE DETAIL ═══ */}
          <AnimatePresence>
            {fromAmountNum > 0 && (
              <motion.div key="rate-detail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <TrCard className="p-4 flex flex-col gap-3">
                  {rateLoading ? <RateSkeleton /> : (
                    <>
                      {[
                        { label: 'Tỷ giá', value: `1 ${fromAsset} = ${effectiveRate.toFixed(6)} ${toAsset}` },
                        { label: `Phí (${(smartRoute.totalFee * 100).toFixed(2)}%)`, value: fmtFee(feeUsdt) },
                        { label: 'Tối thiểu nhận', value: `${fmtAmount(minReceive)} ${toAsset}` },
                        { label: 'Price Impact', value: `${priceImpact.toFixed(2)}%`, color: priceImpact > 0.1 ? '#F59E0B' : '#10B981' },
                        ...(smartRoute.savings > 0 ? [{ label: 'Smart Route tiết kiệm', value: `${smartRoute.savings.toFixed(2)}%`, color: '#8B5CF6' }] : []),
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span style={{ color: c.text2, fontSize: FS.sm }}>{row.label}</span>
                          <span style={{ color: (row as any).color ?? c.text1, fontSize: FS.sm, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
                        </div>
                      ))}
                    </>
                  )}
                </TrCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ VALIDATION ═══ */}
          <AnimatePresence>
            {isInsufficientBalance && (
              <motion.div key="err-balance" {...fadeIn} className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={16} color="#EF4444" />
                <div>
                  <span style={{ color: '#EF4444', fontSize: FS.sm, fontWeight: 600 }}>Số dư không đủ</span>
                  <p style={{ color: '#EF4444', fontSize: FS.xs, opacity: 0.8 }}>
                    Có: {fmtAmount(fromAssetData.balance)} {fromAsset} · Cần: {fmtAmount(fromAmountNum)} {fromAsset}
                  </p>
                </div>
              </motion.div>
            )}
            {isBelowMin && (
              <motion.div key="err-min" {...fadeIn} className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertCircle size={16} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: FS.sm }}>Tối thiểu: {fmtUsd(MIN_CONVERT_USD, { decimals: 0 })}</span>
              </motion.div>
            )}
            {isAboveMax && (
              <motion.div key="err-max" {...fadeIn} className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: FS.sm }}>Giới hạn: {fmtUsd(MAX_CONVERT_USD, { decimals: 0 })} / lần</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ P2: ADVANCED SETTINGS ═══ */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div key="adv-settings" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <AdvancedSettingsCard
                  mevProtection={mevProtection} onToggleMev={() => setMevProtection(!mevProtection)}
                  deadline={txDeadline} onSetDeadline={setTxDeadline}
                  autoSlippage={autoSlippage} onToggleAutoSlippage={() => setAutoSlippage(!autoSlippage)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ P2: DCA ANALYTICS (schedule mode only) ═══ */}
          <AnimatePresence>
            {mode === 'schedule' && (
              <motion.div key="dca-analytics" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <DCAAnalyticsCard from={fromAsset} to={toAsset} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ SLIPPAGE ═══ */}
          <motion.div variants={fadeUp}>
            <TrCard rounded="lg" className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={14} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: FS.xs }}>Slippage tolerance</span>
                </div>
                <button onClick={() => setShowCustomSlippage(!showCustomSlippage)} className="active:scale-95 transition-transform">
                  <span style={{ color: c.primary, fontSize: FS.xs, fontWeight: 600 }}>{showCustomSlippage ? 'Đóng' : 'Tùy chỉnh'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                {slippageOptions.map(s => (
                  <button key={s} onClick={() => handleSlippageSelect(s)}
                    className="px-3 min-h-9 rounded-xl active:scale-95 transition-transform"
                    style={{
                      background: slippage === s ? c.primary : c.surface2,
                      color: slippage === s ? '#fff' : c.text2,
                      border: `1px solid ${slippage === s ? c.primary : c.borderSolid}`,
                      fontSize: FS.xs, fontWeight: 600,
                    }}>
                    {s}%
                  </button>
                ))}
                {!slippageOptions.includes(slippage) && (
                  <div className="px-3 min-h-9 rounded-xl flex items-center" style={{ background: c.primary, color: '#fff', fontSize: FS.xs, fontWeight: 600 }}>{slippage}%</div>
                )}
              </div>
              <AnimatePresence>
                {showCustomSlippage && (
                  <motion.div key="custom-slip" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
                    className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1 rounded-xl px-3"
                      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 40 }}>
                      <input type="number" inputMode="decimal" placeholder="0.00"
                        value={customSlippage} onChange={e => setCustomSlippage(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FS.sm, flex: 1, fontFamily: 'monospace' }} />
                      <span style={{ color: c.text3, fontSize: FS.xs }}>%</span>
                    </div>
                    <button onClick={handleCustomSlippageApply}
                      disabled={!customSlippage || parseFloat(customSlippage) <= 0 || parseFloat(customSlippage) > 50}
                      className="px-4 h-[40px] rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                      style={{ background: c.primary, color: '#fff', fontSize: FS.sm, fontWeight: 600 }}>
                      Áp dụng
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {slippage > 3 && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontSize: FS.xs }}>Slippage cao có thể dẫn đến giá không thuận lợi</span>
                </div>
              )}
            </TrCard>
          </motion.div>

          {/* ═══ CTA ═══ */}
          <motion.div variants={fadeUp}>
            <button onClick={handleOpenReview} disabled={!canConvert}
              className="w-full h-[48px] rounded-[14px] text-white text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-40"
              style={{ fontWeight: 600, background: canConvert ? c.primary : c.surface2, color: canConvert ? '#fff' : c.text3 }}>
              {canConvert ? (
                <>
                  {mode === 'market' && <><Zap className="w-5 h-5" /> Xem trước & Chuyển đổi</>}
                  {mode === 'limit' && <><Target className="w-5 h-5" /> Đặt lệnh Limit</>}
                  {mode === 'schedule' && <><Calendar className="w-5 h-5" /> Tạo lịch tự động</>}
                </>
              ) : fromAmountNum <= 0 ? 'Nhập số lượng' : mode === 'limit' && !(parseFloat(limitRate) > 0) ? 'Nhập tỷ giá mục tiêu' : 'Không thể chuyển đổi'}
            </button>
          </motion.div>

          {/* ═══ HISTORY ═══ */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p style={{ color: c.text1, fontSize: FS.body, fontWeight: 700 }}>Giao dịch gần đây</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowExport(true)} className="flex items-center gap-1 active:scale-95 transition-transform">
                  <Download size={12} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: FS.xs, fontWeight: 600 }}>Xuất</span>
                </button>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 active:scale-95 transition-transform">
                  <span style={{ color: c.primary, fontSize: FS.xs, fontWeight: 600 }}>{showHistory ? 'Thu gọn' : 'Xem tất cả'}</span>
                  <ChevronRight size={14} color={c.primary} style={{ transform: showHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            </div>
            <TrCard overflow>
              {(showHistory ? MOCK_HISTORY : MOCK_HISTORY.slice(0, 3)).map((tx, i, arr) => (
                <motion.div key={tx.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-3 px-4 py-3 active:opacity-70 cursor-pointer"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${c.divider}` : 'none' }}
                  onClick={() => setSelectedTx(tx as TxRecord)}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <ArrowDownUp size={14} color="#10B981" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FS.sm, fontWeight: 600 }}>
                      {fmtAmount(tx.fromAmt)} {tx.from} → {fmtAmount(tx.toAmt)} {tx.to}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: FS.xs }}>{tx.time}</span>
                      <span style={{ color: c.text3, fontSize: FS.xs }}>·</span>
                      <span style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>Phí: {fmtUsd(tx.fee)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: FS.xs, fontWeight: 600 }}>
                      Hoàn tất
                    </span>
                    <ChevronRight size={12} color={c.text3} />
                  </div>
                </motion.div>
              ))}
              {MOCK_HISTORY.length === 0 && (
                <div className="flex flex-col items-center py-8">
                  <ArrowDownUp size={32} color={c.text3} style={{ opacity: 0.4 }} />
                  <p style={{ color: c.text3, fontSize: FS.sm, marginTop: 8 }}>Chưa có giao dịch nào</p>
                </div>
              )}
            </TrCard>
          </motion.div>
        </motion.div>
      </PageContent>
    </PageLayout>
  );
}

export default ConvertPage;
