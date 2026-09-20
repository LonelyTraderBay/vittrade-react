/**
 * DCA Rebalance Configuration Page — Enterprise Fintech v2.1
 *
 * - Visual donut chart for allocation preview
 * - Motion animations on asset card add/remove
 * - Preview simulation bottom sheet before save
 * - Connected to DCARebalanceDashboard post-save
 *
 * @module pages/dca/DCARebalanceConfig
 * @version 2.1 (Enterprise Fintech Standard)
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Sliders,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Zap,
  Clock,
  Combine,
  ChevronDown,
  Settings2,
  BarChart3,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Eye,
  ExternalLink,
  BarChart2,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import {
  rebalanceService,
  type AllocationTarget,
  type RebalanceStrategy,
  type RebalanceFrequency,
  type PortfolioHolding,
} from '../../services/DCARebalanceService';

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A17B',
  BNB: '#F3BA2F',
  SOL: '#9945FF',
  XRP: '#23292F',
  ADA: '#0033AD',
  AVAX: '#E84142',
  DOT: '#E6007A',
  MATIC: '#8247E5',
  LINK: '#2A5ADA',
  UNI: '#FF007A',
  ATOM: '#2E3148',
  LTC: '#BFBBBB',
  DOGE: '#C2A633',
};

const DEFAULT_COLOR = '#8B95B3';

function getCoinColor(symbol: string): string {
  return COIN_COLORS[symbol.toUpperCase()] || DEFAULT_COLOR;
}

const COIN_OPTIONS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA',
  'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'DOGE',
];

const COIN_PRICES: Record<string, number> = {
  BTC: 45000, ETH: 2500, USDT: 1, BNB: 320, SOL: 105,
  XRP: 0.62, ADA: 0.45, AVAX: 35, DOT: 7.5, MATIC: 0.85,
  LINK: 15, UNI: 6.5, ATOM: 9.8, LTC: 72, DOGE: 0.08,
};

/** Mock current portfolio — same source of truth as Dashboard */
const MOCK_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'BTC', quantity: 0.5, price: 45000, value: 22500, currentPercent: 50 },
  { symbol: 'ETH', quantity: 8, price: 2500, value: 20000, currentPercent: 44.44 },
  { symbol: 'USDT', quantity: 2500, price: 1, value: 2500, currentPercent: 5.56 },
];

const TOTAL_PORTFOLIO_VALUE = MOCK_HOLDINGS.reduce((s, h) => s + h.value, 0);

const STRATEGY_OPTIONS: {
  value: RebalanceStrategy;
  icon: typeof Zap;
  label: string;
  desc: string;
}[] = [
  { value: 'threshold', icon: Zap, label: 'Ngưỡng drift', desc: 'Kích hoạt khi lệch vượt ngưỡng' },
  { value: 'periodic', icon: Clock, label: 'Định kỳ', desc: 'Theo lịch cố định' },
  { value: 'hybrid', icon: Combine, label: 'Kết hợp', desc: 'Drift hoặc định kỳ' },
];

const FREQUENCY_OPTIONS: { value: RebalanceFrequency; label: string; sub: string }[] = [
  { value: 'weekly', label: 'Tuần', sub: '7 ngày' },
  { value: 'biweekly', label: '2 Tuần', sub: '14 ngày' },
  { value: 'monthly', label: 'Tháng', sub: '30 ngày' },
  { value: 'quarterly', label: 'Quý', sub: '90 ngày' },
];

/* ── Motion presets ── */
const cardMotion = {
  initial: { opacity: 0, height: 0, scale: 0.92, y: -8 },
  animate: { opacity: 1, height: 'auto' as const, scale: 1, y: 0 },
  exit: { opacity: 0, height: 0, scale: 0.92, y: 8 },
  transition: { type: 'spring' as const, stiffness: 340, damping: 28, mass: 0.8 },
};

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface FormTarget extends AllocationTarget {
  id: string;
}

interface SimulatedTrade {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  currentPercent: number;
  targetPercent: number;
  currentValue: number;
  targetValue: number;
  tradeAmount: number;
  tradeQty: number;
  price: number;
}

/* ═══════════════════════════════════════════
   DONUT CHART SVG
   ═══════════════════════════════════════════ */

function DonutChart({
  targets,
  size = 160,
  strokeWidth = 20,
}: {
  targets: FormTarget[];
  size?: number;
  strokeWidth?: number;
}) {
  const c = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalPercent = targets.reduce((s, t) => s + (t.targetPercent || 0), 0);

  let cumulativePercent = 0;
  const segments = targets
    .filter(t => t.targetPercent > 0)
    .map((t) => {
      const pct = totalPercent > 0 ? (t.targetPercent / totalPercent) * 100 : 0;
      const offset = circumference * (1 - cumulativePercent / 100);
      const length = circumference * (pct / 100);
      cumulativePercent += pct;
      return { symbol: t.symbol, color: getCoinColor(t.symbol), offset, length, percent: t.targetPercent };
    });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={c.divider} strokeWidth={strokeWidth} opacity={0.4} />
        {segments.map((seg, i) => (
          <circle
            key={seg.symbol || i}
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={seg.offset} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: c.text1, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{totalPercent}%</span>
        <span style={{ color: c.text3, fontSize: 10 }}>Tổng phân bổ</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CUSTOM RANGE SLIDER
   ═══════════════════════════════════════════ */

function RangeSlider({
  value, min, max, step = 1, color = '#8B5CF6', onChange,
}: {
  value: number; min: number; max: number; step?: number; color?: string; onChange: (v: number) => void;
}) {
  const c = useThemeColors();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative w-full h-10 flex items-center">
      <div className="absolute w-full rounded-full" style={{ height: 6, background: c.divider }} />
      <div className="absolute rounded-full" style={{ height: 6, width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.15s ease' }} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute w-full opacity-0 cursor-pointer" style={{ height: 40, zIndex: 2 }} />
      <div className="absolute rounded-full" style={{ width: 20, height: 20, background: '#fff', border: `3px solid ${color}`, boxShadow: `0 2px 8px ${color}40`, left: `calc(${pct}% - 10px)`, transition: 'left 0.15s ease', pointerEvents: 'none', zIndex: 1 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   COIN BADGE
   ═══════════════════════════════════════════ */

function CoinBadge({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const color = getCoinColor(symbol);
  return (
    <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, background: `${color}18`, border: `2px solid ${color}30` }}>
      <span style={{ color, fontSize: size * 0.33, fontWeight: 700 }}>{(symbol || '?').slice(0, 3)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, trailing }: { icon: typeof Target; title: string; trailing?: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
          <Icon size={16} color="#8B5CF6" />
        </div>
        <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{title}</span>
      </div>
      {trailing}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PREVIEW SIMULATION SHEET
   ═══════════════════════════════════════════ */

function PreviewSimulationSheet({
  trades,
  totalFees,
  onConfirm,
  onClose,
  saving,
}: {
  trades: SimulatedTrade[];
  totalFees: number;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const c = useThemeColors();
  const activeTrades = trades.filter(t => t.action !== 'hold');
  const totalBuy = activeTrades.filter(t => t.action === 'buy').reduce((s, t) => s + t.tradeAmount, 0);
  const totalSell = activeTrades.filter(t => t.action === 'sell').reduce((s, t) => s + t.tradeAmount, 0);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{ background: c.bg, maxWidth: 440, maxHeight: '85vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.divider }} />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <Eye size={18} color="#8B5CF6" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Preview Simulation</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Xem trước giao dịch cần thực hiện</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.surface2 }}>
            <X size={16} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Tổng giá trị</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ${TOTAL_PORTFOLIO_VALUE.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <p style={{ color: '#10B981', fontSize: 10, marginBottom: 4 }}>Tổng mua</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ${totalBuy.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <p style={{ color: '#EF4444', fontSize: 10, marginBottom: 4 }}>Tổng bán</p>
              <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ${totalSell.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Trade list */}
          <div className="flex flex-col gap-2 mb-4">
            {trades.map((trade) => {
              const coinColor = getCoinColor(trade.symbol);
              const isBuy = trade.action === 'buy';
              const isSell = trade.action === 'sell';
              const isHold = trade.action === 'hold';
              return (
                <motion.div
                  key={trade.symbol}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.cardBorder}`,
                    boxShadow: c.cardShadow,
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: trades.indexOf(trade) * 0.06 }}
                >
                  {/* Accent bar */}
                  <div style={{ height: 2, background: isHold ? c.divider : (isBuy ? '#10B981' : '#EF4444') }} />
                  <div className="p-3.5">
                    <div className="flex items-center gap-3">
                      <CoinBadge symbol={trade.symbol} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{trade.symbol}</span>
                          <span
                            className="px-2 py-0.5 rounded-md"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: isHold ? c.surface2 : (isBuy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'),
                              color: isHold ? c.text3 : (isBuy ? '#10B981' : '#EF4444'),
                            }}
                          >
                            {isHold ? 'GIỮ' : isBuy ? 'MUA' : 'BÁN'}
                          </span>
                        </div>
                        {/* Percent flow */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span style={{ color: c.text3, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                            {trade.currentPercent.toFixed(1)}%
                          </span>
                          <ArrowRight size={10} color={c.text3} />
                          <span style={{ color: coinColor, fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {trade.targetPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {/* Trade value */}
                      {!isHold && (
                        <div className="text-right">
                          <p style={{
                            color: isBuy ? '#10B981' : '#EF4444',
                            fontSize: 14,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {isBuy ? '+' : '-'}${Math.abs(trade.tradeAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                            {trade.tradeQty.toFixed(trade.price > 100 ? 6 : 2)} {trade.symbol}
                          </p>
                        </div>
                      )}
                      {isHold && (
                        <span style={{ color: c.text3, fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Fee + Warning */}
          <div className="rounded-xl p-3 mb-4" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: c.text3, fontSize: 12 }}>Phí giao dịch ước tính</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ${totalFees.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>Số lệnh dự kiến</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{activeTrades.length}</span>
            </div>
          </div>

          <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <AlertCircle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.5 }}>
              Đây là mô phỏng dựa trên giá hiện tại. Giá thực tế khi thực hiện giao dịch có thể khác do biến động thị trường và slippage.
            </p>
          </div>
        </div>

        {/* Sticky confirm */}
        <div className="px-5 pb-5 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl transition-all active:scale-[0.97]"
              style={{ background: c.surface2, color: c.text2, fontSize: 14, fontWeight: 600 }}
            >
              Chỉnh sửa
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-[2] py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} color="white" />
                  <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Lưu & Xem Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCARebalanceConfig() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  // Form state
  const [strategy, setStrategy] = useState<RebalanceStrategy>('threshold');
  const [driftThreshold, setDriftThreshold] = useState(10);
  const [frequency, setFrequency] = useState<RebalanceFrequency>('monthly');
  const [minTradeAmount, setMinTradeAmount] = useState(50);
  const [autoExecute, setAutoExecute] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState<FormTarget[]>([
    { id: '1', symbol: 'BTC', targetPercent: 40, tolerance: 5 },
    { id: '2', symbol: 'ETH', targetPercent: 30, tolerance: 5 },
    { id: '3', symbol: 'USDT', targetPercent: 30, tolerance: 5 },
  ]);

  // Validation
  const totalPercent = targets.reduce((sum, t) => sum + (t.targetPercent || 0), 0);
  const isValidTotal = Math.abs(totalPercent - 100) < 0.01;

  // Available coins
  const usedSymbols = new Set(targets.map(t => t.symbol));
  const availableCoins = COIN_OPTIONS.filter(s => !usedSymbols.has(s));

  /* ─── Preview simulation calc ─── */
  const simulatedTrades = useMemo((): SimulatedTrade[] => {
    if (!isValidTotal) return [];
    return targets.map(t => {
      const holding = MOCK_HOLDINGS.find(h => h.symbol === t.symbol);
      const currentValue = holding?.value ?? 0;
      const currentPercent = holding?.currentPercent ?? 0;
      const targetValue = (t.targetPercent / 100) * TOTAL_PORTFOLIO_VALUE;
      const diff = targetValue - currentValue;
      const price = COIN_PRICES[t.symbol] || 1;
      const action: 'buy' | 'sell' | 'hold' =
        Math.abs(diff) < minTradeAmount ? 'hold' : diff > 0 ? 'buy' : 'sell';
      return {
        symbol: t.symbol,
        action,
        currentPercent,
        targetPercent: t.targetPercent,
        currentValue,
        targetValue,
        tradeAmount: Math.abs(diff),
        tradeQty: Math.abs(diff) / price,
        price,
      };
    });
  }, [targets, isValidTotal, minTradeAmount]);

  const totalFees = useMemo(() => {
    return simulatedTrades
      .filter(t => t.action !== 'hold')
      .reduce((s, t) => s + t.tradeAmount * 0.001, 0); // 0.1% fee
  }, [simulatedTrades]);

  const handleAddTarget = useCallback(() => {
    const nextSymbol = availableCoins[0] || '';
    setTargets(prev => [...prev, {
      id: Date.now().toString(),
      symbol: nextSymbol,
      targetPercent: 0,
      tolerance: 5,
    }]);
  }, [availableCoins]);

  const handleRemoveTarget = useCallback((id: string) => {
    setTargets(prev => {
      if (prev.length <= 2) return prev;
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const handleUpdateTarget = useCallback((id: string, field: keyof AllocationTarget, value: any) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }, []);

  const handlePreview = () => {
    if (!isValidTotal) return;
    setShowPreview(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    // Simulate save delay
    await new Promise(r => setTimeout(r, 800));

    const validation = rebalanceService.validateTargets(targets);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      setSaving(false);
      return;
    }

    const config = rebalanceService.createConfig({
      userId: 'demo-user',
      strategy,
      targets: targets.map(({ id, ...rest }) => rest),
      driftThreshold,
      frequency,
      nextRebalanceDate: strategy === 'periodic' || strategy === 'hybrid'
        ? rebalanceService.calculateNextRebalanceDate(frequency)
        : undefined,
      minTradeAmount,
      autoExecute,
      enabled: true,
    });

    setSaving(false);
    setShowPreview(false);
    navigate(`${routePrefix}/dca/rebalance/${config.id}`);
  };

  /* ─── Drift label helper ─── */
  const driftLabel = useMemo(() => {
    if (driftThreshold <= 3) return 'Rất chặt';
    if (driftThreshold <= 8) return 'Chặt';
    if (driftThreshold <= 15) return 'Trung bình';
    if (driftThreshold <= 30) return 'Lỏng';
    return 'Rất lỏng';
  }, [driftThreshold]);

  return (
    <PageLayout>
      <Header title="Auto-Rebalance" subtitle="Cân bằng · DCA" back />

      <PageContent gap="relaxed" grow>
        {/* ═══ 1. INFO BANNER ═══ */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <ShieldCheck size={18} color="#3B82F6" />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Tự động cân bằng danh mục
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                Duy trì tỷ lệ phân bổ tài sản theo mục tiêu. Hệ thống tự động mua/bán khi danh mục lệch khỏi ngưỡng.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 2. ALLOCATION CHART + LEGEND ═══ */}
        <TrCard className="p-5">
          <SectionHeader icon={BarChart3} title="Phân bổ mục tiêu" trailing={
            <button
              onClick={handleAddTarget}
              disabled={availableCoins.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', opacity: availableCoins.length === 0 ? 0.4 : 1 }}
            >
              <Plus size={14} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Thêm</span>
            </button>
          } />

          {/* Donut + Legend */}
          <div className="flex items-center gap-5 mt-4">
            <DonutChart targets={targets} size={130} strokeWidth={16} />
            <div className="flex-1 flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {targets.filter(t => t.symbol).map((t) => (
                  <motion.div
                    key={t.id}
                    className="flex items-center gap-2.5"
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: getCoinColor(t.symbol) }} />
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, flex: 1 }}>{t.symbol}</span>
                    <span style={{ color: c.text2, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.targetPercent}%</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Validation bar */}
          <motion.div
            className="flex items-center justify-between mt-4 px-3 py-2.5 rounded-xl"
            animate={{
              backgroundColor: isValidTotal ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            }}
            style={{ border: `1px solid ${isValidTotal ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}
          >
            <div className="flex items-center gap-2">
              {isValidTotal ? <CheckCircle size={15} color="#10B981" /> : <AlertCircle size={15} color="#EF4444" />}
              <span style={{ color: isValidTotal ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                Tổng: {totalPercent.toFixed(0)}%
              </span>
            </div>
            <span style={{ color: isValidTotal ? '#10B981' : c.text3, fontSize: 11 }}>
              {isValidTotal ? 'Hợp lệ — sẵn sàng lưu' : 'Tổng phải bằng 100%'}
            </span>
          </motion.div>
        </TrCard>

        {/* ═══ 3. ASSET ALLOCATION CARDS (Animated) ═══ */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {targets.map((target, idx) => {
              const coinColor = getCoinColor(target.symbol);
              return (
                <motion.div
                  key={target.id}
                  layout
                  {...cardMotion}
                >
                  <TrCard className="overflow-hidden">
                    {/* Accent top bar */}
                    <motion.div
                      style={{ height: 3 }}
                      animate={{ background: `linear-gradient(90deg, ${coinColor}60, ${coinColor})` }}
                      transition={{ duration: 0.3 }}
                    />

                    <div className="p-4">
                      {/* Coin header row */}
                      <div className="flex items-center gap-3 mb-4">
                        <CoinBadge symbol={target.symbol} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <select
                              value={target.symbol}
                              onChange={(e) => handleUpdateTarget(target.id, 'symbol', e.target.value)}
                              className="w-full appearance-none bg-transparent cursor-pointer pr-6"
                              style={{ color: c.text1, fontSize: 15, fontWeight: 700, outline: 'none', border: 'none' }}
                            >
                              <option value="">Chọn coin</option>
                              {COIN_OPTIONS.filter(s => s === target.symbol || !usedSymbols.has(s)).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} color={c.text3} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <span style={{ color: c.text3, fontSize: 11 }}>Tài sản #{idx + 1}</span>
                        </div>

                        {/* Percent display */}
                        <div className="flex items-baseline gap-0.5">
                          <motion.span
                            key={target.targetPercent}
                            initial={{ scale: 1.15 }}
                            animate={{ scale: 1 }}
                            style={{ color: coinColor, fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
                          >
                            {target.targetPercent}
                          </motion.span>
                          <span style={{ color: coinColor, fontSize: 13, fontWeight: 600 }}>%</span>
                        </div>

                        {/* Delete */}
                        {targets.length > 2 && (
                          <motion.button
                            onClick={() => handleRemoveTarget(target.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.08)' }}
                            whileTap={{ scale: 0.85 }}
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </motion.button>
                        )}
                      </div>

                      {/* Target percent slider */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: c.text3, fontSize: 11, fontWeight: 500 }}>Tỷ lệ mục tiêu</span>
                        </div>
                        <RangeSlider value={target.targetPercent} min={0} max={100} color={coinColor} onChange={(v) => handleUpdateTarget(target.id, 'targetPercent', v)} />
                      </div>

                      {/* Tolerance */}
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: c.surface2 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: 11 }}>Dung sai</span>
                          <HelpCircle size={12} color={c.text3} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateTarget(target.id, 'tolerance', Math.max(1, (target.tolerance || 5) - 1))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: c.surface, border: `1px solid ${c.divider}` }}
                          >
                            <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>−</span>
                          </button>
                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                            ±{target.tolerance || 5}%
                          </span>
                          <button
                            onClick={() => handleUpdateTarget(target.id, 'tolerance', Math.min(20, (target.tolerance || 5) + 1))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: c.surface, border: `1px solid ${c.divider}` }}
                          >
                            <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ═══ 4. STRATEGY SELECTOR ═══ */}
        <div>
          <SectionHeader icon={Target} title="Chiến lược" />
          <div className="flex flex-col gap-2">
            {STRATEGY_OPTIONS.map((s) => {
              const isActive = strategy === s.value;
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.value}
                  onClick={() => setStrategy(s.value)}
                  className="flex items-center gap-3.5 w-full p-4 rounded-2xl text-left"
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    backgroundColor: isActive ? 'rgba(139,92,246,0.08)' : c.surface,
                    borderColor: isActive ? 'rgba(139,92,246,0.35)' : c.cardBorder,
                  }}
                  style={{
                    border: isActive ? '2px solid rgba(139,92,246,0.35)' : `1px solid ${c.cardBorder}`,
                    boxShadow: isActive ? '0 2px 12px rgba(139,92,246,0.1)' : c.cardShadow,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isActive ? 'rgba(139,92,246,0.15)' : c.surface2 }}>
                    <Icon size={18} color={isActive ? '#8B5CF6' : c.text3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: isActive ? '#8B5CF6' : c.text1, fontSize: 14, fontWeight: 700 }}>{s.label}</p>
                    <p style={{ color: c.text3, fontSize: 11, marginTop: 2 }}>{s.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: isActive ? '#8B5CF6' : c.divider }}>
                    {isActive && <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5CF6' }} layoutId="strategy-dot" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ═══ 5. THRESHOLD SETTING ═══ */}
        <AnimatePresence>
          {(strategy === 'threshold' || strategy === 'hybrid') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <TrCard className="p-5">
                <SectionHeader icon={Sliders} title="Ngưỡng drift" />
                <div className="flex items-center justify-between mb-1 mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ color: '#8B5CF6', fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{driftThreshold}%</span>
                    <span className="px-2 py-0.5 rounded-md" style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.1)' }}>{driftLabel}</span>
                  </div>
                  <span style={{ color: c.text3, fontSize: 11 }}>Trigger khi drift {'>'} {driftThreshold}%</span>
                </div>
                <RangeSlider value={driftThreshold} min={1} max={50} color="#8B5CF6" onChange={setDriftThreshold} />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: 10 }}>1% Chặt chẽ</span>
                  <span style={{ color: c.text3, fontSize: 10 }}>50% Linh hoạt</span>
                </div>
              </TrCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 6. FREQUENCY SETTING ═══ */}
        <AnimatePresence>
          {(strategy === 'periodic' || strategy === 'hybrid') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <TrCard className="p-5">
                <SectionHeader icon={Calendar} title="Tần suất" />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {FREQUENCY_OPTIONS.map((f) => {
                    const isActive = frequency === f.value;
                    return (
                      <motion.button
                        key={f.value}
                        onClick={() => setFrequency(f.value)}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl"
                        whileTap={{ scale: 0.93 }}
                        animate={{
                          backgroundColor: isActive ? 'rgba(139,92,246,0.1)' : c.surface2,
                        }}
                        style={{ border: isActive ? '2px solid #8B5CF6' : '2px solid transparent' }}
                      >
                        <span style={{ color: isActive ? '#8B5CF6' : c.text1, fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{f.label}</span>
                        <span style={{ color: c.text3, fontSize: 10 }}>{f.sub}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </TrCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 7. ADVANCED SETTINGS ═══ */}
        <div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 w-full py-2">
            <Settings2 size={14} color={c.text3} />
            <span style={{ color: c.text2, fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'left' }}>Cài đặt nâng cao</span>
            <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={16} color={c.text3} />
            </motion.div>
          </button>

          <div style={{ display: 'grid', gridTemplateRows: showAdvanced ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ overflow: 'hidden' }}>
              <div className="pt-3 flex flex-col gap-3">
                {/* Min Trade Amount */}
                <TrCard className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: c.text2, fontSize: 12, fontWeight: 500 }}>Giao dịch tối thiểu</span>
                    <div className="px-3 py-1 rounded-lg" style={{ background: c.surface2 }}>
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${minTradeAmount}</span>
                    </div>
                  </div>
                  <RangeSlider value={minTradeAmount} min={10} max={500} step={10} color="#3B82F6" onChange={setMinTradeAmount} />
                  <div className="flex justify-between mt-1">
                    <span style={{ color: c.text3, fontSize: 10 }}>$10</span>
                    <span style={{ color: c.text3, fontSize: 10 }}>$500</span>
                  </div>
                </TrCard>

                {/* Auto Execute Toggle */}
                <TrCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: autoExecute ? 'rgba(16,185,129,0.1)' : c.surface2 }}>
                        <Zap size={16} color={autoExecute ? '#10B981' : c.text3} />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Tự động thực thi</p>
                        <p style={{ color: c.text3, fontSize: 11, marginTop: 2 }}>Rebalance tự động không cần duyệt</p>
                      </div>
                    </div>
                    <button onClick={() => setAutoExecute(!autoExecute)} className="relative w-[52px] h-[30px] rounded-full transition-all" style={{ background: autoExecute ? 'linear-gradient(135deg, #10B981, #059669)' : c.divider }}>
                      <motion.div
                        className="absolute top-[3px] w-6 h-6 rounded-full bg-white"
                        animate={{ left: autoExecute ? 23 : 3 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {autoExecute && (
                      <motion.div
                        className="flex items-start gap-2 mt-3 p-3 rounded-xl"
                        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      >
                        <AlertCircle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
                        <p style={{ color: '#B45309', fontSize: 11, lineHeight: 1.4 }}>
                          Hệ thống sẽ tự động thực hiện giao dịch khi danh mục lệch. Bạn có thể tắt bất kỳ lúc nào.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TrCard>
              </div>
            </div>
          </div>
        </div>
      </PageContent>

      {/* Spacer for floating buttons clearance */}
      <div className="h-[60px]" />

      {/* ═══ FLOATING BOTTOM ACTIONS ═══ */}
      <div className="fixed left-0 right-0 flex flex-col items-center px-5 z-10" style={{ bottom: 92 }}>
        <div className="flex gap-3">
          {/* Preview button */}
          <button
            onClick={handlePreview}
            disabled={!isValidTotal}
            className="h-[48px] rounded-[14px] flex items-center justify-center gap-2 px-5 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{
              background: c.primary,
              opacity: isValidTotal ? 1 : 0.4,
            }}
          >
            <Eye size={20} color="white" />
            <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
              Xem trước
            </span>
          </button>

          {/* Save button */}
          <button
            onClick={handlePreview}
            disabled={!isValidTotal}
            className="h-[48px] rounded-[14px] flex items-center justify-center gap-2 px-5 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{
              background: c.primary,
              opacity: isValidTotal ? 1 : 0.4,
            }}
          >
            <Save size={20} color="white" />
            <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Lưu cấu hình</span>
          </button>
        </div>
        {!isValidTotal && (
          <p style={{ color: '#EF4444', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            Tổng phân bổ phải bằng 100% để lưu
          </p>
        )}
      </div>

      {/* ═══ PREVIEW SIMULATION SHEET ═══ */}
      <AnimatePresence>
        {showPreview && (
          <PreviewSimulationSheet
            trades={simulatedTrades}
            totalFees={totalFees}
            onConfirm={handleConfirmSave}
            onClose={() => setShowPreview(false)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}