/**
 * ══════════════════════════════════════════════════════════════
 *  Convert P2 Components — Enterprise-level enhancements
 * ══════════════════════════════════════════════════════════════
 *
 *  1. FullPriceChart      — Interactive chart with timeframe selectors
 *  2. OrderBookDepth      — Bid/Ask market depth visualization
 *  3. PriceAlertSheet     — Create & manage price alerts
 *  4. TxDetailSheet       — Transaction detail bottom sheet
 *  5. AdvancedSettingsCard — MEV protection, deadline, auto-slip
 *  6. DCAAnalyticsCard    — DCA performance tracking
 *  7. PairInfoCard        — Volume, spread, liquidity stats
 *  8. ExportShareSheet    — Export CSV / Share receipt
 */

import React, { useState, useMemo } from 'react';
import {
  X, Bell, BellPlus, BellOff, Trash2, Download, Share2,
  ShieldCheck, Clock, Gauge, BarChart3, Activity,
  ArrowDownUp, ArrowRight, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Settings, FileText, ExternalLink, Eye, EyeOff,
  ArrowUpDown, Layers, Droplets, Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { fmtAmount, fmtUsd } from '../../../data/formatNumber';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar, Cell,
  ComposedChart, Line,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════
   P0 TYPOGRAPHY — Standardized font sizes
   ═══════════════════════════════════════════════════════════ */
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
   SHARED TYPES & DATA
   ═══════════════════════════════════════════════════════════ */

const PRICES: Record<string, number> = {
  USDT: 1, BTC: 67543.21, ETH: 3521.45, SOL: 178.32,
  BNB: 412.87, ADA: 0.4521, MATIC: 0.8976, AVAX: 38.54,
};

type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';

export interface PriceAlert {
  id: string;
  from: string;
  to: string;
  targetRate: number;
  direction: 'above' | 'below';
  active: boolean;
  created: string;
}

export interface TxRecord {
  id: string;
  from: string;
  to: string;
  fromAmt: number;
  toAmt: number;
  fee: number;
  rate: number;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

/* ─── Deterministic data generation ─── */

function generateChartData(from: string, to: string, tf: Timeframe): { time: string; price: number; vol: number }[] {
  const seed = (from + to + tf).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const base = PRICES[from] / PRICES[to];
  const points = tf === '1H' ? 60 : tf === '4H' ? 48 : tf === '1D' ? 24 : tf === '1W' ? 28 : 30;
  const data: { time: string; price: number; vol: number }[] = [];
  let val = base;

  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed * (i + 1) * 0.47) * 0.008 + Math.cos(seed * (i + 1) * 0.23) * 0.005;
    val = val * (1 + noise);
    const vol = 50000 + Math.abs(Math.sin(seed * (i + 1) * 0.71)) * 200000;

    let label = '';
    if (tf === '1H') label = `${i}m`;
    else if (tf === '4H') label = `${Math.floor(i * 5)}m`;
    else if (tf === '1D') label = `${i}:00`;
    else if (tf === '1W') label = `T${(i % 7) + 2}`;
    else label = `${i + 1}/3`;

    data.push({ time: label, price: val, vol });
  }
  return data;
}

function generateOrderBook(from: string, to: string) {
  const seed = (from + to).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const mid = PRICES[from] / PRICES[to];
  const bids: { price: number; amount: number; total: number }[] = [];
  const asks: { price: number; amount: number; total: number }[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 1; i <= 8; i++) {
    const bAmt = (Math.abs(Math.sin(seed * i * 1.3)) * 5 + 0.5);
    bidTotal += bAmt;
    bids.push({
      price: mid * (1 - i * 0.001),
      amount: bAmt,
      total: bidTotal,
    });

    const aAmt = (Math.abs(Math.cos(seed * i * 1.7)) * 5 + 0.5);
    askTotal += aAmt;
    asks.push({
      price: mid * (1 + i * 0.001),
      amount: aAmt,
      total: askTotal,
    });
  }

  return { bids, asks, mid, spread: mid * 0.002, spreadPct: 0.2 };
}

/* ═══════════════════════════════════════════════════════════
   1. FULL PRICE CHART
   ═══════════════════════════════════════════════════════════ */

interface FullPriceChartProps {
  from: string;
  to: string;
  onClose?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function FullPriceChart({ from, to, expanded = false, onToggleExpand }: FullPriceChartProps) {
  const c = useThemeColors();
  const [tf, setTf] = useState<Timeframe>('1D');
  const [showVolume, setShowVolume] = useState(true);
  const data = useMemo(() => generateChartData(from, to, tf), [from, to, tf]);
  const firstPrice = data[0]?.price ?? 0;
  const lastPrice = data[data.length - 1]?.price ?? 0;
  const change = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const color = change >= 0 ? '#10B981' : '#EF4444';
  const TFS: Timeframe[] = ['1H', '4H', '1D', '1W', '1M'];

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <TrCard className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} color={c.primary} />
            <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>{from}/{to}</span>
            <span style={{ color, fontSize: FS.xs, fontWeight: 600 }}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowVolume(!showVolume)} className="active:scale-95 transition-transform"
              style={{ color: showVolume ? c.primary : c.text3, fontSize: FS.micro }}>
              <Activity size={14} />
            </button>
            {onToggleExpand && (
              <button onClick={onToggleExpand} className="active:scale-95 transition-transform">
                <Maximize2 size={14} color={c.text3} />
              </button>
            )}
          </div>
        </div>

        {/* Price display */}
        <div className="mb-2">
          <span style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700, fontFamily: 'monospace' }}>
            {lastPrice.toFixed(6)}
          </span>
          <span style={{ color: c.text3, fontSize: FS.xs, marginLeft: 6 }}>{to}/{from}</span>
        </div>

        {/* Chart */}
        <div style={{ height: expanded ? 220 : 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs key="gradient-defs">
                <linearGradient id={`fullchart-${from}-${to}-${tf}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key={`fc-grid-${from}-${to}`} strokeDasharray="3 3" stroke={c.divider} opacity={0.5} />
              <XAxis key={`fc-x-${from}-${to}`} dataKey="time" tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis key={`fc-yp-${from}-${to}`} yAxisId="price" domain={['auto', 'auto']} tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} />
              {showVolume && (
                <YAxis key={`fc-yv-${from}-${to}`} yAxisId="vol" orientation="right" domain={[0, 'auto']} tick={false} axisLine={false} hide />
              )}
              <Tooltip
                key={`fc-tip-${from}-${to}`}
                contentStyle={{
                  background: c.surface, border: `1px solid ${c.borderSolid}`,
                  borderRadius: 12, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
                labelStyle={{ color: c.text3, fontSize: 10 }}
                formatter={(val: number, name: string) => [
                  name === 'price' ? val.toFixed(6) : fmtUsd(val, { decimals: 0 }),
                  name === 'price' ? 'Tỷ giá' : 'Volume',
                ]}
              />
              <Area key={`fc-area-${from}-${to}`} yAxisId="price" type="monotone" dataKey="price" stroke={color} strokeWidth={2}
                fill={`url(#fullchart-${from}-${to}-${tf})`} dot={false} isAnimationActive={false} />
              {showVolume && (
                <Bar key={`fc-bar-${from}-${to}`} yAxisId="vol" dataKey="vol" fill={c.primary} opacity={0.15} radius={[2, 2, 0, 0]}
                  isAnimationActive={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-1 mt-3">
          {TFS.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className="flex-1 min-h-9 rounded-lg active:scale-95 transition-all flex items-center justify-center"
              style={{
                background: tf === t ? c.primary : c.surface2,
                color: tf === t ? '#fff' : c.text3,
                fontSize: FS.xs, fontWeight: tf === t ? 700 : 500,
                border: `1px solid ${tf === t ? c.primary : c.borderSolid}`,
              }}>
              {t}
            </button>
          ))}
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. ORDER BOOK / MARKET DEPTH
   ═══════════════════════════════════════════════════════════ */

interface OrderBookProps {
  from: string;
  to: string;
}

export function OrderBookDepth({ from, to }: OrderBookProps) {
  const c = useThemeColors();
  const ob = useMemo(() => generateOrderBook(from, to), [from, to]);
  const maxTotal = Math.max(ob.bids[ob.bids.length - 1]?.total ?? 1, ob.asks[ob.asks.length - 1]?.total ?? 1);

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={14} color={c.primary} />
            <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>Market Depth</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: c.text3, fontSize: FS.micro }}>Spread:</span>
            <span style={{ color: '#F59E0B', fontSize: FS.micro, fontWeight: 600, fontFamily: 'monospace' }}>
              {ob.spreadPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Headers */}
        <div className="flex items-center mb-2">
          <span className="flex-1" style={{ color: c.text3, fontSize: FS.micro }}>PRICE ({to})</span>
          <span className="w-16 text-right" style={{ color: c.text3, fontSize: FS.micro }}>AMOUNT</span>
          <span className="w-16 text-right" style={{ color: c.text3, fontSize: FS.micro }}>TOTAL</span>
        </div>

        {/* Asks (reversed: highest at top) */}
        {[...ob.asks].reverse().map((ask, i) => (
          <div key={`a-${i}`} className="flex items-center py-1 relative">
            <div className="absolute inset-0 right-0 rounded-sm"
              style={{
                background: 'rgba(239,68,68,0.06)',
                width: `${(ask.total / maxTotal) * 100}%`,
                marginLeft: 'auto',
              }} />
            <span className="flex-1 relative z-10" style={{ color: '#EF4444', fontSize: FS.xs, fontFamily: 'monospace' }}>
              {ask.price.toFixed(6)}
            </span>
            <span className="w-16 text-right relative z-10" style={{ color: c.text2, fontSize: FS.xs, fontFamily: 'monospace' }}>
              {ask.amount.toFixed(2)}
            </span>
            <span className="w-16 text-right relative z-10" style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>
              {ask.total.toFixed(2)}
            </span>
          </div>
        ))}

        {/* Mid price */}
        <div className="flex items-center justify-center py-2 my-1 rounded-lg" style={{ background: c.surface2 }}>
          <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700, fontFamily: 'monospace' }}>
            {ob.mid.toFixed(6)}
          </span>
          <ArrowUpDown size={12} color={c.text3} className="ml-2" />
        </div>

        {/* Bids */}
        {ob.bids.map((bid, i) => (
          <div key={`b-${i}`} className="flex items-center py-1 relative">
            <div className="absolute inset-0 right-0 rounded-sm"
              style={{
                background: 'rgba(16,185,129,0.06)',
                width: `${(bid.total / maxTotal) * 100}%`,
                marginLeft: 'auto',
              }} />
            <span className="flex-1 relative z-10" style={{ color: '#10B981', fontSize: FS.xs, fontFamily: 'monospace' }}>
              {bid.price.toFixed(6)}
            </span>
            <span className="w-16 text-right relative z-10" style={{ color: c.text2, fontSize: FS.xs, fontFamily: 'monospace' }}>
              {bid.amount.toFixed(2)}
            </span>
            <span className="w-16 text-right relative z-10" style={{ color: c.text3, fontSize: FS.xs, fontFamily: 'monospace' }}>
              {bid.total.toFixed(2)}
            </span>
          </div>
        ))}
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. PRICE ALERT SHEET
   ═══════════════════════════════════════════════════════════ */

interface PriceAlertSheetProps {
  from: string;
  to: string;
  currentRate: number;
  alerts: PriceAlert[];
  onAddAlert: (alert: PriceAlert) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onClose: () => void;
}

export function PriceAlertSheet({
  from, to, currentRate, alerts, onAddAlert, onRemoveAlert, onToggleAlert, onClose,
}: PriceAlertSheetProps) {
  const c = useThemeColors();
  const [targetRate, setTargetRate] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const handleAdd = () => {
    const val = parseFloat(targetRate);
    if (!val || val <= 0) return;
    onAddAlert({
      id: `alert-${Date.now()}`,
      from, to,
      targetRate: val,
      direction,
      active: true,
      created: new Date().toLocaleString('vi-VN'),
    });
    setTargetRate('');
  };

  const pairAlerts = alerts.filter(a => a.from === from && a.to === to);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellPlus size={18} color="#F59E0B" />
            <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700 }}>Cảnh báo giá</h3>
          </div>
          <button onClick={onClose} className="active:scale-95 transition-transform">
            <X size={20} color={c.text2} />
          </button>
        </div>

        {/* Current rate */}
        <div className="mx-5 mb-3 rounded-xl px-4 py-3" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FS.xs }}>Tỷ giá hiện tại</p>
          <p style={{ color: c.text1, fontSize: FS.base, fontWeight: 700, fontFamily: 'monospace' }}>
            1 {from} = {currentRate.toFixed(6)} {to}
          </p>
        </div>

        {/* Create alert */}
        <div className="px-5 mb-4 flex flex-col gap-3">
          <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600 }}>Tạo cảnh báo mới</p>

          <div className="flex gap-2">
            {(['above', 'below'] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className="flex-1 flex items-center justify-center gap-2 min-h-10 rounded-xl active:scale-95 transition-all"
                style={{
                  background: direction === d ? (d === 'above' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)') : c.surface2,
                  border: `1px solid ${direction === d ? (d === 'above' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : c.borderSolid}`,
                  color: direction === d ? (d === 'above' ? '#10B981' : '#EF4444') : c.text3,
                  fontSize: FS.xs, fontWeight: 600,
                }}>
                {d === 'above' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {d === 'above' ? 'Trên' : 'Dưới'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1 rounded-xl px-3"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 44 }}>
              <span style={{ color: c.text3, fontSize: FS.xs }}>1 {from} =</span>
              <input type="number" inputMode="decimal" placeholder={currentRate.toFixed(6)}
                value={targetRate} onChange={e => setTargetRate(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FS.body, fontWeight: 700, fontFamily: 'monospace', flex: 1, textAlign: 'right' }} />
              <span style={{ color: c.text3, fontSize: FS.xs, marginLeft: 4 }}>{to}</span>
            </div>
            <button onClick={handleAdd}
              disabled={!targetRate || parseFloat(targetRate) <= 0}
              className="h-[44px] px-4 rounded-xl text-white active:scale-95 transition-transform disabled:opacity-40"
              style={{ background: c.primary, fontWeight: 600, fontSize: FS.sm }}>
              Thêm
            </button>
          </div>

          {parseFloat(targetRate) > 0 && (
            <p style={{ color: c.text3, fontSize: FS.xs }}>
              Bạn sẽ nhận thông báo khi tỷ giá {direction === 'above' ? 'vượt trên' : 'xuống dưới'}{' '}
              <span style={{ fontWeight: 600, color: direction === 'above' ? '#10B981' : '#EF4444', fontFamily: 'monospace' }}>
                {parseFloat(targetRate).toFixed(6)}
              </span>
            </p>
          )}
        </div>

        {/* Existing alerts */}
        <div className="flex-1 overflow-y-auto border-t" style={{ borderColor: c.divider }}>
          <div className="px-5 pt-3 pb-1">
            <p style={{ color: c.text2, fontSize: FS.xs, fontWeight: 600 }}>
              Cảnh báo hiện tại ({pairAlerts.length})
            </p>
          </div>

          {pairAlerts.length === 0 && (
            <div className="flex flex-col items-center py-8">
              <BellOff size={28} color={c.text3} style={{ opacity: 0.4 }} />
              <p style={{ color: c.text3, fontSize: FS.xs, marginTop: 8 }}>Chưa có cảnh báo nào</p>
            </div>
          )}

          {pairAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: `1px solid ${c.divider}`, opacity: alert.active ? 1 : 0.5 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: alert.direction === 'above' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                {alert.direction === 'above' ? <TrendingUp size={14} color="#10B981" /> : <TrendingDown size={14} color="#EF4444" />}
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: FS.sm, fontWeight: 600, fontFamily: 'monospace' }}>
                  {alert.direction === 'above' ? '≥' : '≤'} {alert.targetRate.toFixed(6)}
                </p>
                <p style={{ color: c.text3, fontSize: FS.micro }}>{alert.created}</p>
              </div>
              <button onClick={() => onToggleAlert(alert.id)} className="active:scale-95 transition-transform p-1">
                {alert.active ? <Bell size={14} color="#F59E0B" /> : <BellOff size={14} color={c.text3} />}
              </button>
              <button onClick={() => onRemoveAlert(alert.id)} className="active:scale-95 transition-transform p-1">
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>
          ))}
        </div>

        <div className="h-6" />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. TRANSACTION DETAIL SHEET
   ═══════════════════════════════════════════════════════════ */

interface TxDetailSheetProps {
  tx: TxRecord;
  onClose: () => void;
}

export function TxDetailSheet({ tx, onClose }: TxDetailSheetProps) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard?.writeText(tx.id); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const statusColor = tx.status === 'success' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444';
  const statusLabel = tx.status === 'success' ? 'Hoàn tất' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại';

  const rows = [
    { label: 'Từ', value: `${fmtAmount(tx.fromAmt)} ${tx.from}` },
    { label: 'Sang', value: `${fmtAmount(tx.toAmt)} ${tx.to}` },
    { label: 'Tỷ giá', value: `1 ${tx.from} = ${tx.rate.toFixed(6)} ${tx.to}` },
    { label: 'Phí', value: fmtUsd(tx.fee) },
    { label: 'Giá trị USD', value: fmtUsd(tx.fromAmt * (PRICES[tx.from] ?? 1)) },
    { label: 'Thời gian', value: tx.time },
    { label: 'Trạng thái', value: statusLabel, color: statusColor },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700 }}>Chi tiết giao dịch</h3>
          <button onClick={onClose} className="active:scale-95 transition-transform"><X size={20} color={c.text2} /></button>
        </div>

        {/* Amount display */}
        <div className="mx-5 rounded-2xl p-4 flex items-center justify-center gap-4" style={{ background: c.surface2 }}>
          <div className="text-right">
            <p style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(tx.fromAmt)}</p>
            <p style={{ color: c.text3, fontSize: FS.xs }}>{tx.from}</p>
          </div>
          <ArrowRight size={20} color={c.text3} />
          <div className="text-left">
            <p style={{ color: statusColor, fontSize: FS.lg, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(tx.toAmt)}</p>
            <p style={{ color: c.text3, fontSize: FS.xs }}>{tx.to}</p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <span style={{ color: c.text2, fontSize: FS.sm }}>{row.label}</span>
              <span style={{ color: (row as any).color ?? c.text1, fontSize: FS.sm, fontWeight: 600, fontFamily: 'monospace' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* TX ID */}
        <div className="mx-5 rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <FileText size={12} color={c.text3} />
          <span style={{ color: c.text3, fontSize: FS.xs, flex: 1, fontFamily: 'monospace' }}>
            {tx.id}
          </span>
          <button onClick={handleCopy} className="active:scale-95 transition-transform">
            {copied ? <CheckCircle size={14} color="#10B981" /> : <ExternalLink size={14} color={c.text3} />}
          </button>
        </div>

        <div className="h-6" />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. ADVANCED SETTINGS CARD
   ═══════════════════════════════════════════════════════════ */

interface AdvancedSettingsProps {
  mevProtection: boolean;
  onToggleMev: () => void;
  deadline: number; // minutes
  onSetDeadline: (m: number) => void;
  autoSlippage: boolean;
  onToggleAutoSlippage: () => void;
}

export function AdvancedSettingsCard({
  mevProtection, onToggleMev,
  deadline, onSetDeadline,
  autoSlippage, onToggleAutoSlippage,
}: AdvancedSettingsProps) {
  const c = useThemeColors();
  const deadlines = [5, 10, 20, 30];

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={14} color={c.primary} />
          <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>Cài đặt nâng cao</span>
        </div>

        {/* MEV Protection */}
        <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} color={mevProtection ? '#10B981' : c.text3} />
            <div>
              <p style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600 }}>MEV Protection</p>
              <p style={{ color: c.text3, fontSize: FS.micro }}>Chống front-running & sandwich attacks</p>
            </div>
          </div>
          <button onClick={onToggleMev}
            className="w-10 h-5 rounded-full transition-all active:scale-95 flex items-center"
            style={{ background: mevProtection ? '#10B981' : c.surface2, border: `1px solid ${mevProtection ? '#10B981' : c.borderSolid}` }}>
            <motion.div
              animate={{ x: mevProtection ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white shadow"
            />
          </button>
        </div>

        {/* Auto Slippage */}
        <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-2">
            <Gauge size={14}
              color={autoSlippage ? '#3B82F6' : c.text3} />
            <div>
              <p style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600 }}>Auto Slippage</p>
              <p style={{ color: c.text3, fontSize: FS.micro }}>Tự điều chỉnh theo điều kiện thị trường</p>
            </div>
          </div>
          <button onClick={onToggleAutoSlippage}
            className="w-10 h-5 rounded-full transition-all active:scale-95 flex items-center"
            style={{ background: autoSlippage ? '#3B82F6' : c.surface2, border: `1px solid ${autoSlippage ? '#3B82F6' : c.borderSolid}` }}>
            <motion.div
              animate={{ x: autoSlippage ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white shadow"
            />
          </button>
        </div>

        {/* Transaction Deadline */}
        <div className="pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} color={c.text2} />
            <p style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600 }}>Transaction Deadline</p>
          </div>
          <div className="flex gap-2">
            {deadlines.map(d => (
              <button key={d} onClick={() => onSetDeadline(d)}
                className="flex-1 min-h-9 rounded-lg active:scale-95 transition-all flex items-center justify-center"
                style={{
                  background: deadline === d ? c.primary : c.surface2,
                  color: deadline === d ? '#fff' : c.text3,
                  border: `1px solid ${deadline === d ? c.primary : c.borderSolid}`,
                  fontSize: FS.xs, fontWeight: 600,
                }}>
                {d}m
              </button>
            ))}
          </div>
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. DCA ANALYTICS CARD
   ═══════════════════════════════════════════════════════════ */

interface DCAAnalyticsProps {
  from: string;
  to: string;
}

export function DCAAnalyticsCard({ from, to }: DCAAnalyticsProps) {
  const c = useThemeColors();

  // Deterministic DCA performance data
  const seed = (from + to + 'dca').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const dcaData = useMemo(() => {
    const data: { week: string; avgCost: number; marketPrice: number; invested: number }[] = [];
    const basePrice = PRICES[from] / PRICES[to];
    let totalInvested = 0;
    let totalReceived = 0;

    for (let i = 0; i < 12; i++) {
      const weeklyInvest = 100;
      totalInvested += weeklyInvest;
      const priceNoise = 1 + Math.sin(seed * (i + 1) * 0.53) * 0.08;
      const weekPrice = basePrice * priceNoise;
      totalReceived += weeklyInvest / (PRICES[from] * weekPrice);

      data.push({
        week: `T${i + 1}`,
        avgCost: totalInvested / (totalReceived * PRICES[from]),
        marketPrice: weekPrice,
        invested: totalInvested,
      });
    }
    return data;
  }, [from, to, seed]);

  const totalInvested = dcaData[dcaData.length - 1]?.invested ?? 0;
  const avgCost = dcaData[dcaData.length - 1]?.avgCost ?? 0;
  const currentPrice = PRICES[from] / PRICES[to];
  const pnlPct = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>DCA Analytics</span>
          <span className="px-2 py-1 rounded" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: FS.micro, fontWeight: 600 }}>
            {from} → {to}
          </span>
        </div>

        {/* Summary stats */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Đã đầu tư', value: fmtUsd(totalInvested, { decimals: 0 }), color: c.text1 },
            { label: 'Giá TB', value: avgCost.toFixed(6), color: '#3B82F6' },
            { label: 'P&L', value: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, color: pnlPct >= 0 ? '#10B981' : '#EF4444' },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl px-3 py-2" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FS.micro }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: FS.xs, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dcaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid key={`dca-grid-${from}-${to}`} strokeDasharray="3 3" stroke={c.divider} opacity={0.4} />
              <XAxis key={`dca-x-${from}-${to}`} dataKey="week" tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} />
              <YAxis key={`dca-y-${from}-${to}`} domain={['auto', 'auto']} tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} />
              <Tooltip
                key={`dca-tip-${from}-${to}`}
                contentStyle={{
                  background: c.surface, border: `1px solid ${c.borderSolid}`,
                  borderRadius: 8, padding: '6px 10px', fontSize: 10,
                }}
              />
              <Line key={`dca-mp-${from}-${to}`} type="monotone" dataKey="marketPrice" stroke="#8B5CF6" strokeWidth={1.5}
                dot={false} name="Giá thị trường" isAnimationActive={false} />
              <Line key={`dca-ac-${from}-${to}`} type="monotone" dataKey="avgCost" stroke="#F59E0B" strokeWidth={1.5}
                strokeDasharray="4 4" dot={false} name="Giá TB mua" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 rounded" style={{ background: '#8B5CF6' }} />
            <span style={{ color: c.text3, fontSize: FS.micro }}>Giá thị trường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 rounded" style={{ background: '#F59E0B', borderTop: '1px dashed #F59E0B' }} />
            <span style={{ color: c.text3, fontSize: FS.micro }}>Giá TB mua</span>
          </div>
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. PAIR INFO CARD
   ═══════════════════════════════════════════════════════════ */

interface PairInfoProps {
  from: string;
  to: string;
}

export function PairInfoCard({ from, to }: PairInfoProps) {
  const c = useThemeColors();
  const seed = (from + to).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const mid = PRICES[from] / PRICES[to];

  const stats = useMemo(() => ({
    volume24h: 1234567 + seed * 1000,
    high24h: mid * (1 + Math.abs(Math.sin(seed * 0.37)) * 0.03),
    low24h: mid * (1 - Math.abs(Math.cos(seed * 0.53)) * 0.025),
    spread: mid * 0.002,
    spreadPct: 0.20,
    liquidity: 5678900 + seed * 5000,
    trades24h: 1234 + (seed % 5000),
    avgTradeSize: 2456 + (seed % 10000),
  }), [from, to, seed, mid]);

  const rows = [
    { label: 'Volume 24h', value: fmtUsd(stats.volume24h, { decimals: 0 }), icon: <BarChart3 size={12} color="#3B82F6" /> },
    { label: 'High 24h', value: stats.high24h.toFixed(6), icon: <TrendingUp size={12} color="#10B981" /> },
    { label: 'Low 24h', value: stats.low24h.toFixed(6), icon: <TrendingDown size={12} color="#EF4444" /> },
    { label: 'Spread', value: `${stats.spreadPct.toFixed(2)}% (${stats.spread.toFixed(6)})`, icon: <ArrowDownUp size={12} color="#F59E0B" /> },
    { label: 'Liquidity', value: fmtUsd(stats.liquidity, { decimals: 0 }), icon: <Droplets size={12} color="#06B6D4" /> },
    { label: 'Trades 24h', value: stats.trades24h.toLocaleString(), icon: <Activity size={12} color="#8B5CF6" /> },
    { label: 'Avg Trade', value: fmtUsd(stats.avgTradeSize, { decimals: 0 }), icon: <Layers size={12} color={c.text2} /> },
  ];

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} color={c.primary} />
          <span style={{ color: c.text1, fontSize: FS.sm, fontWeight: 700 }}>Thống kê cặp {from}/{to}</span>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {row.icon}
                <span style={{ color: c.text2, fontSize: FS.xs }}>{row.label}</span>
              </div>
              <span style={{ color: c.text1, fontSize: FS.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. EXPORT & SHARE SHEET
   ═══════════════════════════════════════════════════════════ */

interface ExportShareSheetProps {
  history: TxRecord[];
  onClose: () => void;
}

export function ExportShareSheet({ history, onClose }: ExportShareSheetProps) {
  const c = useThemeColors();
  const [exported, setExported] = useState(false);

  const handleExportCSV = () => {
    const csv = [
      'ID,From,To,From Amount,To Amount,Fee,Rate,Time,Status',
      ...history.map(tx =>
        `${tx.id},${tx.from},${tx.to},${tx.fromAmt},${tx.toAmt},${tx.fee},${tx.rate},${tx.time},${tx.status}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convert-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleShare = async () => {
    const text = history.slice(0, 5).map(tx =>
      `${fmtAmount(tx.fromAmt)} ${tx.from} → ${fmtAmount(tx.toAmt)} ${tx.to} (${tx.time})`
    ).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Convert History', text });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>

        <div className="px-5 pt-2 pb-4 flex items-center justify-between">
          <h3 style={{ color: c.text1, fontSize: FS.lg, fontWeight: 700 }}>Xuất & Chia sẻ</h3>
          <button onClick={onClose} className="active:scale-95 transition-transform"><X size={20} color={c.text2} /></button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-3">
          {/* Export CSV */}
          <button onClick={handleExportCSV}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <Download size={18} color="#3B82F6" />
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: FS.body, fontWeight: 600 }}>Xuất CSV</p>
              <p style={{ color: c.text3, fontSize: FS.xs }}>{history.length} giao dịch · .csv file</p>
            </div>
            {exported && <CheckCircle size={18} color="#10B981" />}
          </button>

          {/* Share */}
          <button onClick={handleShare}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Share2 size={18} color="#8B5CF6" />
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: FS.body, fontWeight: 600 }}>Chia sẻ</p>
              <p style={{ color: c.text3, fontSize: FS.xs }}>Chia sẻ 5 giao dịch gần nhất</p>
            </div>
          </button>

          <p style={{ color: c.text3, fontSize: FS.micro, textAlign: 'center', marginTop: 4 }}>
            Dữ liệu xuất chỉ bao gồm lịch sử chuyển đổi, không chứa thông tin nhạy cảm.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. INVERSE RATE TOGGLE
   ═══════════════════════════════════════════════════════════ */

interface InverseRateProps {
  from: string;
  to: string;
  rate: number;
  inversed: boolean;
  onToggle: () => void;
}

export function InverseRateToggle({ from, to, rate, inversed, onToggle }: InverseRateProps) {
  const c = useThemeColors();
  const displayRate = inversed ? (1 / rate) : rate;
  const displayFrom = inversed ? to : from;
  const displayTo = inversed ? from : to;

  return (
    <button onClick={onToggle}
      className="flex items-center gap-2 active:scale-95 transition-transform">
      <ArrowUpDown size={12} color={c.primary} />
      <span style={{ color: c.text2, fontSize: FS.xs }}>
        1 {displayFrom} = <span style={{ fontWeight: 600, color: c.text1, fontFamily: 'monospace' }}>
          {displayRate.toFixed(6)}
        </span> {displayTo}
      </span>
    </button>
  );
}