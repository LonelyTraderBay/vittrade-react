/**
 * DCA Dynamic Amount Adjustment Page — Enterprise V3
 *
 * Features:
 * - Hero card with strategy badge + next amount display
 * - Horizontal strategy chips
 * - Volatility chart (volatility strategy)
 * - Performance P/L chart (performance strategy)
 * - Balance gauge with SVG arc (balance strategy)
 * - Target progress (target strategy)
 * - Amount history bar chart
 * - Adjustment history list
 * - Strategy config cards
 * - Strategy selection sheet with preview animations
 * - Floating CTA
 *
 * @module pages/dca/DCADynamicAmount
 * @version 3.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Pause,
  Zap,
  BarChart3,
  Settings,
  ArrowUpRight,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  dynamicAmountService,
  type AdjustmentStrategy,
  type DynamicAmountConfig,
  DEFAULT_VOLATILITY_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_BALANCE_CONFIG,
  DEFAULT_TARGET_CONFIG,
} from '../../services/DCADynamicAmountService';

/* ═══════════════════════════════════════════
   DARK MODE HOOK
   ═══════════════════════════════════════════ */

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ═══════════════════════════════════════════
   STRATEGY UI CONFIG
   ═══════════════════════════════════════════ */

const STRATEGY_UI: Record<AdjustmentStrategy, {
  icon: any;
  color: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}> = {
  fixed:       { icon: Lock,        color: '#6B7280', name: 'Cố định',       shortDesc: 'Cùng số tiền mỗi kỳ', longDesc: 'Mua cùng một số tiền cố định trong mỗi kỳ DCA, không phụ thuộc điều kiện thị trường.' },
  volatility:  { icon: Activity,    color: '#8B5CF6', name: 'Volatility',    shortDesc: 'Mua theo biến động', longDesc: 'Tăng lượng mua khi thị trường biến động mạnh để tận dụng cơ hội DCA, giảm khi ổn định.' },
  performance: { icon: TrendingUp,  color: '#3B82F6', name: 'Hiệu suất',     shortDesc: 'Theo P/L portfolio', longDesc: 'Điều chỉnh số tiền dựa trên hiệu suất portfolio — tăng khi đang lời, giảm/dừng khi lỗ nặng.' },
  balance:     { icon: Wallet,      color: '#10B981', name: 'Số dư',         shortDesc: 'Tự giảm khi ví thấp', longDesc: 'Tự động giảm hoặc tạm dừng mua khi số dư ví xuống dưới ngưỡng an toàn.' },
  target:      { icon: Target,      color: '#F59E0B', name: 'Mục tiêu',      shortDesc: 'Đạt target đúng hạn', longDesc: 'Tính toán số tiền mỗi kỳ để đạt được mục tiêu đầu tư trong thời gian đặt ra.' },
};

/* ═══════════════════════════════════════════
   MOCK DATA — Performance P/L History
   ═══════════════════════════════════════════ */

const PERFORMANCE_HISTORY = [
  { date: '01/01', pnl: -2.3, amount: 400_000, action: 'decreased' },
  { date: '08/01', pnl: -4.1, amount: 400_000, action: 'decreased' },
  { date: '15/01', pnl: -1.5, amount: 400_000, action: 'decreased' },
  { date: '22/01', pnl: 1.2,  amount: 500_000, action: 'normal' },
  { date: '29/01', pnl: 3.8,  amount: 600_000, action: 'increased' },
  { date: '05/02', pnl: 2.1,  amount: 600_000, action: 'increased' },
  { date: '12/02', pnl: 5.5,  amount: 600_000, action: 'increased' },
  { date: '19/02', pnl: 4.2,  amount: 600_000, action: 'increased' },
  { date: '26/02', pnl: 7.1,  amount: 600_000, action: 'increased' },
  { date: '05/03', pnl: 8.5,  amount: 600_000, action: 'increased' },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function fmtVND(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

const ACTION_COLORS: Record<string, string> = {
  normal: '#6B7280',
  increased: '#10B981',
  decreased: '#F59E0B',
  skipped: '#EF4444',
  paused: '#EF4444',
};

const ACTION_LABELS: Record<string, string> = {
  normal: 'Bình thường',
  increased: 'Tăng mua',
  decreased: 'Giảm mua',
  skipped: 'Bỏ qua',
  paused: 'Tạm dừng',
};

const ACTION_ICONS: Record<string, any> = {
  normal: Lock,
  increased: TrendingUp,
  decreased: TrendingDown,
  skipped: Pause,
  paused: Pause,
};

/* ═══════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, color, subtitle, action }: {
  icon: any; title: string; color: string; subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  const c = useThemeColors();
  const isDark = useIsDark();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: isDark ? `${color}20` : `${color}12` }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{title}</p>
          {subtitle && <p style={{ color: c.text3, fontSize: 11 }}>{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1 active:opacity-70">
          <span style={{ color, fontSize: 12, fontWeight: 600 }}>{action.label}</span>
          <ChevronRight size={14} color={color} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BALANCE GAUGE (SVG Arc)
   ═══════════════════════════════════════════ */

function BalanceGauge({ current, pause, reduce, max }: {
  current: number; pause: number; reduce: number; max: number;
}) {
  const c = useThemeColors();
  const isDark = useIsDark();

  // Arc geometry
  const cx = 140, cy = 130, r = 110;
  const startAngle = Math.PI * 0.8; // 144°
  const endAngle = Math.PI * 0.2;   // 36°
  const totalSweep = Math.PI * 1.6; // 288°

  const polarToCart = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  });

  const valueToAngle = (val: number) => {
    const pct = Math.min(1, Math.max(0, val / max));
    return startAngle - pct * totalSweep;
  };

  const arcPath = (from: number, to: number, radius: number) => {
    const s = polarToCart(from, radius);
    const e = polarToCart(to, radius);
    const sweep = from - to;
    const largeArc = sweep > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Zone boundaries
  const pauseAngle = valueToAngle(pause);
  const reduceAngle = valueToAngle(reduce);
  const currentAngle = valueToAngle(current);

  // Zone colors
  const zoneColor = current <= pause ? '#EF4444' : current <= reduce ? '#F59E0B' : '#10B981';

  // Needle position
  const needleEnd = polarToCart(currentAngle, r - 8);
  const needleBase1 = polarToCart(currentAngle + Math.PI / 2, 4);
  const needleBase2 = polarToCart(currentAngle - Math.PI / 2, 4);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 280 165" width="100%" style={{ maxWidth: 280 }}>
        {/* Background track */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Red zone: 0 → pause */}
        <path
          d={arcPath(startAngle, pauseAngle, r)}
          fill="none"
          stroke="rgba(239,68,68,0.3)"
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Yellow zone: pause → reduce */}
        <path
          d={arcPath(pauseAngle, reduceAngle, r)}
          fill="none"
          stroke="rgba(245,158,11,0.3)"
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Green zone: reduce → max */}
        <path
          d={arcPath(reduceAngle, endAngle, r)}
          fill="none"
          stroke="rgba(16,185,129,0.2)"
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Active fill up to current */}
        <motion.path
          d={arcPath(startAngle, currentAngle, r)}
          fill="none"
          stroke={zoneColor}
          strokeWidth={16}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />

        {/* Needle */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <circle cx={cx} cy={cy} r={6} fill={zoneColor} />
          <line
            x1={cx} y1={cy}
            x2={needleEnd.x} y2={needleEnd.y}
            stroke={zoneColor}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={3} fill={isDark ? '#1a1a2e' : '#fff'} />
        </motion.g>

        {/* Zone labels */}
        {(() => {
          const pPause = polarToCart(pauseAngle, r + 18);
          const pReduce = polarToCart(reduceAngle, r + 18);
          return (
            <>
              <text x={pPause.x} y={pPause.y} textAnchor="middle" fill="#EF4444" fontSize={9} fontWeight={600}>
                {fmtVND(pause)}
              </text>
              <text x={pReduce.x} y={pReduce.y} textAnchor="middle" fill="#F59E0B" fontSize={9} fontWeight={600}>
                {fmtVND(reduce)}
              </text>
            </>
          );
        })()}
      </svg>

      {/* Center value display */}
      <div className="flex flex-col items-center -mt-10">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          style={{ color: zoneColor, fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
        >
          {fmtVND(current)}
        </motion.p>
        <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Số dư hiện tại</p>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
          <span style={{ color: c.text3, fontSize: 10 }}>Tạm dừng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
          <span style={{ color: c.text3, fontSize: 10 }}>Giảm mua</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
          <span style={{ color: c.text3, fontSize: 10 }}>Bình thường</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STRATEGY PREVIEW — mini animated visuals
   ═══════════════════════════════════════════ */

function StrategyPreview({ strategy, color, isSelected }: {
  strategy: AdjustmentStrategy; color: string; isSelected: boolean;
}) {
  const isDark = useIsDark();
  const w = 64, h = 32;

  if (strategy === 'fixed') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {[0, 1, 2, 3, 4].map(i => (
          <motion.rect
            key={i}
            x={4 + i * 12}
            width={8}
            rx={2}
            fill={isSelected ? color : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')}
            initial={{ y: h, height: 0 }}
            animate={{ y: h - 18, height: 18 }}
            transition={{ duration: 0.4, delay: 0.05 * i, ease: 'easeOut' }}
          />
        ))}
      </svg>
    );
  }

  if (strategy === 'volatility') {
    const points = [
      [0, 20], [10, 14], [20, 8], [30, 22], [40, 6], [50, 16], [60, 12],
    ];
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0] + 2} ${p[1]}`).join(' ');
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <motion.path
          d={pathD}
          fill="none"
          stroke={isSelected ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
    );
  }

  if (strategy === 'performance') {
    const bars = [12, 10, 14, 18, 16, 22, 24];
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {bars.map((bh, i) => (
          <motion.rect
            key={i}
            x={2 + i * 9}
            width={6}
            rx={2}
            fill={isSelected ? (bh >= 16 ? '#10B981' : '#F59E0B') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')}
            initial={{ y: h, height: 0 }}
            animate={{ y: h - bh, height: bh }}
            transition={{ duration: 0.5, delay: 0.06 * i, ease: 'easeOut' }}
          />
        ))}
      </svg>
    );
  }

  if (strategy === 'balance') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Mini arc gauge */}
        <motion.path
          d={`M 8 ${h - 4} A 24 24 0 0 1 ${w - 8} ${h - 4}`}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <motion.path
          d={`M 8 ${h - 4} A 24 24 0 0 1 ${w - 14} ${h - 10}`}
          fill="none"
          stroke={isSelected ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')}
          strokeWidth={5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        <motion.circle
          cx={w / 2} cy={h - 6} r={3}
          fill={isSelected ? color : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)')}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      </svg>
    );
  }

  if (strategy === 'target') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Progress track */}
        <rect x={4} y={h / 2 - 3} width={w - 8} height={6} rx={3}
          fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
        <motion.rect
          x={4} y={h / 2 - 3} height={6} rx={3}
          fill={isSelected ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')}
          initial={{ width: 0 }}
          animate={{ width: (w - 8) * 0.65 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        {/* Target flag */}
        <motion.g
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <line x1={w - 10} y1={h / 2 - 8} x2={w - 10} y2={h / 2 + 8}
            stroke={isSelected ? color : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)')}
            strokeWidth={1.5} />
          <polygon
            points={`${w - 10},${h / 2 - 8} ${w - 2},${h / 2 - 5} ${w - 10},${h / 2 - 2}`}
            fill={isSelected ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}
          />
        </motion.g>
      </svg>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCADynamicAmount() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();
  const isDark = useIsDark();

  const [selectedStrategy, setSelectedStrategy] = useState<AdjustmentStrategy>('volatility');
  const [showStrategySheet, setShowStrategySheet] = useState(false);
  const [showConfigSheet, setShowConfigSheet] = useState(false);

  // Build config
  const config: DynamicAmountConfig = useMemo(() => ({
    strategy: selectedStrategy,
    volatility: DEFAULT_VOLATILITY_CONFIG,
    performance: DEFAULT_PERFORMANCE_CONFIG,
    balance: DEFAULT_BALANCE_CONFIG,
    target: DEFAULT_TARGET_CONFIG,
  }), [selectedStrategy]);

  // Calculate current adjustment
  const adjustment = useMemo(
    () => dynamicAmountService.calculateAdjustment(config),
    [config]
  );

  // Get data
  const volHistory = dynamicAmountService.getVolatilityHistory();
  const amountHistory = dynamicAmountService.getAmountHistory();
  const strategyUI = STRATEGY_UI[selectedStrategy];
  const StratIcon = strategyUI.icon;
  const actionColor = ACTION_COLORS[adjustment.action];
  const ActionIcon = ACTION_ICONS[adjustment.action];

  // Bar chart data
  const barData = amountHistory.slice(0, 8).reverse().map(h => ({
    date: h.date.substring(0, 5),
    base: h.baseAmount,
    adjusted: h.adjustedAmount,
  }));

  // Balance mock values
  const currentBalance = 5_200_000;
  const maxGaugeValue = 8_000_000;

  const handleApplyStrategy = () => {
    toast.success(`Đã áp dụng chiến lược "${strategyUI.name}"`);
    setShowStrategySheet(false);
  };

  return (
    <PageLayout>
      <Header
        title="Dynamic Amount"
        subtitle="Số tiền · DCA"
        back
        action={{ icon: Settings, onClick: () => setShowConfigSheet(true) }}
      />

      <PageContent gap="default">
        <div className="flex flex-col gap-5" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>

          {/* ═══ HERO CARD — Next Purchase Preview ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <TrCard variant="hero" className="overflow-hidden">
              {/* Strategy badge + title */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <StratIcon size={12} color="rgba(255,255,255,0.8)" />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>
                          {strategyUI.name}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowStrategySheet(true)}
                        className="px-2 py-1 rounded-lg active:opacity-70"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 500 }}>Đổi</span>
                      </button>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>
                      Lần mua tiếp theo
                    </p>
                  </div>
                  {/* Action status pill */}
                  <div className="px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    style={{
                      background: `${actionColor}20`,
                      border: `1px solid ${actionColor}30`,
                    }}>
                    <ActionIcon size={12} color={actionColor} />
                    <span style={{ color: actionColor, fontSize: 11, fontWeight: 700 }}>
                      {ACTION_LABELS[adjustment.action]}
                    </span>
                  </div>
                </div>

                {/* Amount display */}
                <div className="mt-1">
                  {adjustment.action !== 'skipped' && adjustment.action !== 'paused' ? (
                    <div className="flex items-baseline gap-3">
                      <span style={{
                        color: '#FFFFFF',
                        fontSize: 32,
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                        letterSpacing: -0.5,
                      }}>
                        {fmtVND(adjustment.adjustedAmount)}
                      </span>
                      {adjustment.multiplier !== 1 && (
                        <span style={{
                          color: 'rgba(255,255,255,0.35)',
                          fontSize: 16,
                          fontWeight: 500,
                          textDecoration: 'line-through',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {fmtVND(adjustment.originalAmount)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Pause size={22} color="#F87171" />
                      <span style={{ color: '#F87171', fontSize: 20, fontWeight: 700 }}>
                        {adjustment.action === 'skipped' ? 'Bỏ qua lần này' : 'Tạm dừng'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiplier + Reason strip */}
              <div className="mx-5 mb-5 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="p-3.5">
                  {adjustment.multiplier !== 1 && adjustment.action !== 'skipped' && adjustment.action !== 'paused' && (
                    <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-2">
                        <Zap size={13} color={adjustment.multiplier > 1 ? '#34D399' : '#FBBF24'} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Hệ số điều chỉnh</span>
                      </div>
                      <span style={{
                        color: adjustment.multiplier > 1 ? '#34D399' : '#FBBF24',
                        fontSize: 16,
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        ×{adjustment.multiplier.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>
                    {adjustment.reason}
                  </p>
                </div>
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ STRATEGY CHIPS — horizontal scroll ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <p style={{ color: c.text3, fontSize: 11, fontWeight: 500, marginBottom: 8, letterSpacing: 0.3 }}>
              CHIẾN LƯỢC
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {(Object.entries(STRATEGY_UI) as [AdjustmentStrategy, typeof STRATEGY_UI[AdjustmentStrategy]][]).map(([id, ui]) => {
                const Icon = ui.icon;
                const isActive = selectedStrategy === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedStrategy(id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 active:scale-[0.97] transition-all"
                    style={{
                      background: isActive
                        ? (isDark ? `${ui.color}20` : `${ui.color}10`)
                        : (isDark ? 'rgba(255,255,255,0.04)' : c.surface),
                      border: `1.5px solid ${isActive ? `${ui.color}40` : (isDark ? 'rgba(255,255,255,0.06)' : c.cardBorder)}`,
                      boxShadow: isActive ? `0 2px 8px ${ui.color}15` : 'none',
                    }}
                  >
                    <Icon size={14} color={isActive ? ui.color : c.text3} />
                    <span style={{
                      color: isActive ? ui.color : c.text2,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                    }}>
                      {ui.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="strategy-check"
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: ui.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ═══ STRATEGY-SPECIFIC VISUALIZATION ═══ */}
          <AnimatePresence mode="wait">
            {/* ── Volatility Chart ── */}
            {selectedStrategy === 'volatility' && (
              <motion.div
                key="vol-chart"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, delay: 0.06 }}
              >
                <TrCard className="overflow-hidden">
                  <div className="p-5 pb-3">
                    <SectionHeader
                      icon={Activity}
                      title="Biến động & Hệ số"
                      color="#8B5CF6"
                      subtitle="30 ngày gần nhất"
                    />
                  </div>
                  <div className="px-3 pb-2" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={volHistory} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                        <defs key="vol-gradient-defs">
                          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid key="vol-grid" strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis key="vol-x" dataKey="date" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis key="vol-y1" yAxisId="vol" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false}
                          label={{ value: 'Vol%', angle: -90, position: 'insideLeft', fill: c.text3, fontSize: 9 }} />
                        <YAxis key="vol-y2" yAxisId="mult" orientation="right" tick={{ fill: c.text3, fontSize: 10 }} domain={[0, 2]}
                          axisLine={false} tickLine={false}
                          label={{ value: '×', position: 'insideRight', fill: c.text3, fontSize: 9 }} />
                        <RechartsTooltip key="vol-tip" content={({ payload, label }) => {
                          if (!payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <ChartTooltip label={label}>
                              <TooltipRow color="#8B5CF6" label="Vol" value={`${d?.volatility}%`} />
                              <TooltipRow color="#10B981" label="Hệ số" value={`×${d?.suggestedMultiplier}`} />
                              <TooltipRow color="#F59E0B" label="Số tiền" value={fmtVND(d?.amount ?? 0)} />
                            </ChartTooltip>
                          );
                        }} />
                        <ReferenceLine key="vol-ref-high" yAxisId="vol" y={DEFAULT_VOLATILITY_CONFIG.highVolThreshold} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                        <ReferenceLine key="vol-ref-low" yAxisId="vol" y={DEFAULT_VOLATILITY_CONFIG.lowVolThreshold} stroke="#3B82F6" strokeDasharray="4 4" strokeOpacity={0.5} />
                        <Area key="vol-area-vol" yAxisId="vol" type="monotone" dataKey="volatility" stroke="#8B5CF6" fill="url(#volGrad)" strokeWidth={2} />
                        <Area key="vol-area-mult" yAxisId="mult" type="monotone" dataKey="suggestedMultiplier" stroke="#10B981" fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <LegendItem color="#8B5CF6" label="Volatility" />
                      <LegendItem color="#10B981" label="Hệ số" dashed />
                    </div>
                    <div className="flex items-center gap-3">
                      <LegendItem color="#EF4444" label="High" small />
                      <LegendItem color="#3B82F6" label="Low" small />
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}

            {/* ── Performance P/L Chart ── */}
            {selectedStrategy === 'performance' && (
              <motion.div
                key="perf-chart"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, delay: 0.06 }}
              >
                <TrCard className="overflow-hidden">
                  <div className="p-5 pb-3">
                    <SectionHeader
                      icon={TrendingUp}
                      title="P/L Portfolio & Điều chỉnh"
                      color="#3B82F6"
                      subtitle="Biểu đồ hiệu suất 10 kỳ"
                    />
                  </div>

                  {/* Summary strip */}
                  <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-2.5 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <p style={{ color: c.text3, fontSize: 9, fontWeight: 500, marginBottom: 2 }}>P/L hiện tại</p>
                      <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>+8.5%</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <p style={{ color: c.text3, fontSize: 9, fontWeight: 500, marginBottom: 2 }}>Hệ số lời</p>
                      <p style={{ color: '#3B82F6', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>×{DEFAULT_PERFORMANCE_CONFIG.profitMultiplier}</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <p style={{ color: c.text3, fontSize: 9, fontWeight: 500, marginBottom: 2 }}>Dừng khi lỗ</p>
                      <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{DEFAULT_PERFORMANCE_CONFIG.pauseThresholdPercent}%</p>
                    </div>
                  </div>

                  {/* P/L Area Chart */}
                  <div className="px-3 pb-2" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={PERFORMANCE_HISTORY} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                        <defs key="pnl-gradient-defs">
                          <linearGradient id="pnlGradPos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid key="perf-grid" strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis key="perf-x" dataKey="date" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis key="perf-y1" yAxisId="pnl" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={(v: number) => `${v}%`}
                          label={{ value: 'P/L%', angle: -90, position: 'insideLeft', fill: c.text3, fontSize: 9 }} />
                        <YAxis key="perf-y2" yAxisId="amt" orientation="right" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={(v: number) => fmtVND(v)} />
                        <RechartsTooltip key="perf-tip" content={({ payload, label }) => {
                          if (!payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <ChartTooltip label={label}>
                              <TooltipRow color={d?.pnl >= 0 ? '#10B981' : '#EF4444'} label="P/L" value={`${d?.pnl > 0 ? '+' : ''}${d?.pnl}%`} />
                              <TooltipRow color="#3B82F6" label="Số tiền" value={fmtVND(d?.amount ?? 0)} />
                              <TooltipRow color="#6B7280" label="Trạng thái" value={ACTION_LABELS[d?.action] || 'N/A'} />
                            </ChartTooltip>
                          );
                        }} />
                        <ReferenceLine key="perf-ref-zero" yAxisId="pnl" y={0} stroke={c.text3} strokeOpacity={0.3} />
                        <ReferenceLine key="perf-ref-pause" yAxisId="pnl" y={DEFAULT_PERFORMANCE_CONFIG.pauseThresholdPercent}
                          stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5}
                          label={{ value: 'Dừng', fill: '#EF4444', fontSize: 9, position: 'right' }} />
                        <Area key="perf-area-pnl" yAxisId="pnl" type="monotone" dataKey="pnl" stroke="#10B981" fill="url(#pnlGradPos)" strokeWidth={2.5}
                          dot={{ r: 3, fill: '#10B981', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 1.5 }} />
                        <Area key="perf-area-amt" yAxisId="amt" type="monotone" dataKey="amount" stroke="#3B82F6" fill="url(#amtGrad)" strokeWidth={1.5}
                          strokeDasharray="4 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <LegendItem color="#10B981" label="P/L %" />
                      <LegendItem color="#3B82F6" label="Số tiền mua" dashed />
                    </div>
                    <LegendItem color="#EF4444" label="Ngưỡng dừng" small />
                  </div>
                </TrCard>
              </motion.div>
            )}

            {/* ── Balance Gauge ── */}
            {selectedStrategy === 'balance' && (
              <motion.div
                key="bal-gauge"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, delay: 0.06 }}
              >
                <TrCard className="overflow-hidden">
                  <div className="p-5 pb-3">
                    <SectionHeader
                      icon={Shield}
                      title="Trạng thái số dư"
                      color="#10B981"
                      subtitle="An toàn vốn"
                    />
                  </div>
                  <div className="px-5 pb-5">
                    <BalanceGauge
                      current={currentBalance}
                      pause={DEFAULT_BALANCE_CONFIG.pauseThreshold}
                      reduce={DEFAULT_BALANCE_CONFIG.reduceThreshold}
                      max={maxGaugeValue}
                    />

                    {/* Threshold breakdown */}
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <div className="rounded-xl p-3 text-center" style={{
                        background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                        border: '1px solid rgba(239,68,68,0.1)',
                      }}>
                        <Pause size={14} color="#EF4444" className="mx-auto mb-1.5" />
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Tạm dừng</p>
                        <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {'<'}{fmtVND(DEFAULT_BALANCE_CONFIG.pauseThreshold)}
                        </p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{
                        background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)',
                        border: '1px solid rgba(245,158,11,0.1)',
                      }}>
                        <TrendingDown size={14} color="#F59E0B" className="mx-auto mb-1.5" />
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Giảm mua</p>
                        <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {'<'}{fmtVND(DEFAULT_BALANCE_CONFIG.reduceThreshold)}
                        </p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{
                        background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
                        border: '1px solid rgba(16,185,129,0.1)',
                      }}>
                        <CheckCircle size={14} color="#10B981" className="mx-auto mb-1.5" />
                        <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Bình thường</p>
                        <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {'>'}{fmtVND(DEFAULT_BALANCE_CONFIG.reduceThreshold)}
                        </p>
                      </div>
                    </div>

                    {/* Safety status */}
                    <div className="mt-4 p-3.5 rounded-xl flex items-center gap-3" style={{
                      background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
                      border: '1px solid rgba(16,185,129,0.12)',
                    }}>
                      <Shield size={16} color="#10B981" />
                      <div className="flex-1">
                        <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>An toàn — Mua bình thường</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Số dư {fmtVND(currentBalance)} {'>'} ngưỡng giảm {fmtVND(DEFAULT_BALANCE_CONFIG.reduceThreshold)}
                        </p>
                      </div>
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ AMOUNT HISTORY BAR CHART ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
          >
            <TrCard className="overflow-hidden">
              <div className="p-5 pb-3">
                <SectionHeader
                  icon={BarChart3}
                  title="Lịch sử điều chỉnh"
                  color="#3B82F6"
                  subtitle="So sánh gốc vs thực tế"
                />
              </div>
              <div className="px-3 pb-2" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                    <defs key="bar-gradient-defs">
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid key="bar-grid" strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis key="bar-x" dataKey="date" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis key="bar-y" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtVND(v)} />
                    <RechartsTooltip key="bar-tip" content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      return (
                        <ChartTooltip label={label}>
                          {payload.map((p: any) => (
                            <TooltipRow key={p.dataKey} color={p.color} label={p.name} value={fmtVND(p.value)} />
                          ))}
                        </ChartTooltip>
                      );
                    }} />
                    <Bar key="bar-base" dataKey="base" name="Gốc" fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} radius={[6, 6, 0, 0]} />
                    <Bar key="bar-adjusted" dataKey="adjusted" name="Đã điều chỉnh" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="px-5 pb-4 flex items-center gap-5">
                <LegendItem color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} label="Gốc" block />
                <LegendItem color="#3B82F6" label="Đã điều chỉnh" block />
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ ADJUSTMENT HISTORY LIST ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <TrCard className="overflow-hidden">
              <div className="p-5 pb-3">
                <SectionHeader
                  icon={Clock}
                  title="Chi tiết gần đây"
                  color="#6366F1"
                  subtitle={`${amountHistory.length} lần điều chỉnh`}
                />
              </div>
              <div className="px-4 pb-4 flex flex-col gap-2">
                {amountHistory.slice(0, 6).map((entry, i) => {
                  const isUp = entry.adjustedAmount > entry.baseAmount;
                  const isDown = entry.adjustedAmount < entry.baseAmount;
                  const entryColor = isUp ? '#10B981' : isDown ? '#F59E0B' : '#6B7280';
                  const pctChange = entry.baseAmount > 0
                    ? ((entry.adjustedAmount - entry.baseAmount) / entry.baseAmount * 100) : 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.05 + i * 0.04 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${entryColor}12` }}>
                        {isUp ? <TrendingUp size={16} color="#10B981" />
                          : isDown ? <TrendingDown size={16} color="#F59E0B" />
                          : <Lock size={16} color="#6B7280" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>{entry.date}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                              {fmtVND(entry.adjustedAmount)}
                            </span>
                            {pctChange !== 0 && (
                              <span className="px-1.5 py-0.5 rounded-md" style={{
                                fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                background: `${entryColor}15`, color: entryColor,
                              }}>
                                {pctChange > 0 ? '+' : ''}{pctChange.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.3 }} className="truncate">
                          {entry.reason}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ STRATEGY CONFIG CARDS ═══ */}
          <AnimatePresence mode="wait">
            {selectedStrategy === 'volatility' && (
              <motion.div key="cfg-vol" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, delay: 0.24 }}>
                <TrCard className="overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #8B5CF6, #C084FC)' }} />
                  <div className="p-5">
                    <SectionHeader icon={Settings} title="Cấu hình Volatility" color="#8B5CF6"
                      action={{ label: 'Chỉnh sửa', onClick: () => setShowConfigSheet(true) }} />
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <ConfigCard label="Số tiền gốc" value={fmtVND(DEFAULT_VOLATILITY_CONFIG.baseAmount)} icon="💰" />
                      <ConfigCard label="Hệ số vol cao" value={`×${DEFAULT_VOLATILITY_CONFIG.highVolMultiplier}`} icon="📈" accent="#10B981" />
                      <ConfigCard label="Hệ số vol thấp" value={`×${DEFAULT_VOLATILITY_CONFIG.lowVolMultiplier}`} icon="📉" accent="#F59E0B" />
                      <ConfigCard label="Ngưỡng cao" value={`${DEFAULT_VOLATILITY_CONFIG.highVolThreshold}%`} icon="🔴" accent="#EF4444" />
                      <ConfigCard label="Ngưỡng thấp" value={`${DEFAULT_VOLATILITY_CONFIG.lowVolThreshold}%`} icon="🔵" accent="#3B82F6" />
                      <ConfigCard label="Bỏ qua khi" value={`>${DEFAULT_VOLATILITY_CONFIG.skipVolThreshold}%`} icon="⛔" accent="#EF4444" />
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}

            {selectedStrategy === 'performance' && (
              <motion.div key="cfg-perf" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, delay: 0.24 }}>
                <TrCard className="overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #3B82F6, #93C5FD)' }} />
                  <div className="p-5">
                    <SectionHeader icon={Settings} title="Cấu hình Hiệu suất" color="#3B82F6"
                      action={{ label: 'Chỉnh sửa', onClick: () => setShowConfigSheet(true) }} />
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <ConfigCard label="Số tiền gốc" value={fmtVND(DEFAULT_PERFORMANCE_CONFIG.baseAmount)} icon="💰" />
                      <ConfigCard label="Hệ số khi lời" value={`×${DEFAULT_PERFORMANCE_CONFIG.profitMultiplier}`} icon="📈" accent="#10B981" />
                      <ConfigCard label="Hệ số khi lỗ" value={`×${DEFAULT_PERFORMANCE_CONFIG.lossMultiplier}`} icon="📉" accent="#F59E0B" />
                      <ConfigCard label="Dừng khi lỗ" value={`${DEFAULT_PERFORMANCE_CONFIG.pauseThresholdPercent}%`} icon="🛑" accent="#EF4444" />
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}

            {selectedStrategy === 'balance' && (
              <motion.div key="cfg-bal" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, delay: 0.24 }}>
                <TrCard className="overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #10B981, #6EE7B7)' }} />
                  <div className="p-5">
                    <SectionHeader icon={Settings} title="Cấu hình Số dư" color="#10B981"
                      action={{ label: 'Chỉnh sửa', onClick: () => setShowConfigSheet(true) }} />
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <ConfigCard label="Số tiền gốc" value={fmtVND(DEFAULT_BALANCE_CONFIG.baseAmount)} icon="💰" />
                      <ConfigCard label="Giữ tối thiểu" value={fmtVND(DEFAULT_BALANCE_CONFIG.minBalance)} icon="🔒" accent="#6B7280" />
                      <ConfigCard label="Ngưỡng giảm" value={fmtVND(DEFAULT_BALANCE_CONFIG.reduceThreshold)} icon="⚠️" accent="#F59E0B" />
                      <ConfigCard label="Ngưỡng dừng" value={fmtVND(DEFAULT_BALANCE_CONFIG.pauseThreshold)} icon="🛑" accent="#EF4444" />
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}

            {selectedStrategy === 'target' && (
              <motion.div key="cfg-target" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, delay: 0.24 }}>
                <TrCard className="overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />
                  <div className="p-5">
                    <SectionHeader icon={Target} title="Mục tiêu đầu tư" color="#F59E0B"
                      action={{ label: 'Chỉnh sửa', onClick: () => setShowConfigSheet(true) }} />
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <ConfigCard label="Mục tiêu" value={fmtVND(DEFAULT_TARGET_CONFIG.targetValue)} icon="🎯" accent="#F59E0B" />
                      <ConfigCard label="Hạn chót" value="31/12/2026" icon="📅" />
                      <ConfigCard label="Min/lần" value={fmtVND(DEFAULT_TARGET_CONFIG.minAmount)} icon="⬇️" />
                      <ConfigCard label="Max/lần" value={fmtVND(DEFAULT_TARGET_CONFIG.maxAmount)} icon="⬆️" accent="#10B981" />
                    </div>

                    {/* Progress */}
                    <div className="mt-4 p-3.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Tiến độ</span>
                        <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtVND(12_850_000)} / {fmtVND(DEFAULT_TARGET_CONFIG.targetValue)}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(12_850_000 / DEFAULT_TARGET_CONFIG.targetValue * 100).toFixed(0)}%` }}
                          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                          style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />
                      </div>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 6 }}>
                        Đạt {(12_850_000 / DEFAULT_TARGET_CONFIG.targetValue * 100).toFixed(1)}% mục tiêu
                      </p>
                    </div>
                  </div>
                </TrCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ STRATEGY EXPLAINER ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.28 }}
          >
            <TrCard variant="inner" className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${strategyUI.color}12` }}>
                  <Sparkles size={14} color={strategyUI.color} />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    Chiến lược "{strategyUI.name}"
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                    {strategyUI.longDesc}
                  </p>
                </div>
              </div>
            </TrCard>
          </motion.div>

          {/* ═══ DISCLAIMER ═══ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.32 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)',
              border: '1px solid rgba(59,130,246,0.12)',
            }}
          >
            <Info size={15} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
              Dynamic Amount tự điều chỉnh lượng mua dựa trên chiến lược bạn chọn.
              Bạn có thể thay đổi chiến lược hoặc quay về "Cố định" bất cứ lúc nào.
            </p>
          </motion.div>

          <div className="h-[60px]" />
        </div>
      </PageContent>

      {/* ═══ FLOATING CTA ═══ */}
      <div className="fixed left-0 right-0 flex items-center justify-center px-5"
        style={{ bottom: 92, zIndex: 50 }}>
        <div className="flex items-center justify-center gap-2.5 w-[calc(100%-56px)] max-w-[320px]">
          <button
            onClick={() => setShowConfigSheet(true)}
            className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: c.primary }}
          >
            <Settings className="w-5 h-5" color="white" />
          </button>
          <button
            onClick={() => {
              toast.success(`Chiến lược "${strategyUI.name}" đang hoạt động`);
              navigate(`${routePrefix}/dca`);
            }}
            className="flex-1 h-[48px] rounded-[14px] text-white text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ fontWeight: 600, background: c.primary }}
          >
            <ArrowUpRight className="w-5 h-5" />
            Áp dụng chiến lược
          </button>
        </div>
      </div>

      {/* ═══ STRATEGY SELECTION SHEET with preview animations ═══ */}
      <BottomSheetV2
        open={showStrategySheet}
        onClose={() => setShowStrategySheet(false)}
        title="Chọn chiến lược"
      >
        <div className="px-5 pb-8 space-y-2.5">
          {(Object.entries(STRATEGY_UI) as [AdjustmentStrategy, typeof STRATEGY_UI[AdjustmentStrategy]][]).map(([id, ui]) => {
            const Icon = ui.icon;
            const isSelected = selectedStrategy === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setSelectedStrategy(id);
                  handleApplyStrategy();
                }}
                className="w-full flex items-start gap-3 p-4 rounded-2xl active:opacity-70 transition-colors"
                style={{
                  background: isSelected ? `${ui.color}10` : (isDark ? 'rgba(255,255,255,0.03)' : c.surface2),
                  border: isSelected ? `1.5px solid ${ui.color}30` : '1.5px solid transparent',
                }}
              >
                {/* Icon + Preview column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${ui.color}15` }}>
                    <Icon size={20} color={ui.color} />
                  </div>
                  {/* Mini preview animation */}
                  <div className="flex items-center justify-center" style={{ height: 36 }}>
                    <StrategyPreview strategy={id} color={ui.color} isSelected={isSelected} />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 text-left pt-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      {ui.name}
                    </p>
                    {isSelected && <CheckCircle size={20} color={ui.color} />}
                  </div>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                    {ui.longDesc}
                  </p>
                  {/* Quick stat for selected */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                      style={{ background: `${ui.color}15` }}
                    >
                      <Zap size={11} color={ui.color} />
                      <span style={{ color: ui.color, fontSize: 10, fontWeight: 600 }}>Đang hoạt động</span>
                    </motion.div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheetV2>

      {/* ═══ CONFIG SHEET ═══ */}
      <BottomSheetV2
        open={showConfigSheet}
        onClose={() => setShowConfigSheet(false)}
        title="Cấu hình chi tiết"
      >
        <div className="px-5 pb-8 space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
              Đây là bản demo — cấu hình sẽ được lưu khi kết nối backend thực.
            </p>
          </div>

          {selectedStrategy === 'volatility' && (
            <div className="space-y-3">
              <InputRow label="Số tiền gốc (VND)" value="500,000" />
              <InputRow label="Hệ số vol cao" value="1.5" />
              <InputRow label="Hệ số vol thấp" value="0.7" />
              <InputRow label="Ngưỡng vol cao (%)" value="25" />
              <InputRow label="Ngưỡng vol thấp (%)" value="12" />
              <InputRow label="Bỏ qua khi vol > (%)" value="60" />
            </div>
          )}

          {selectedStrategy === 'performance' && (
            <div className="space-y-3">
              <InputRow label="Số tiền gốc (VND)" value="500,000" />
              <InputRow label="Hệ số khi lời" value="1.2" />
              <InputRow label="Hệ số khi lỗ" value="0.8" />
              <InputRow label="Dừng khi lỗ > (%)" value="-20" />
            </div>
          )}

          {selectedStrategy === 'balance' && (
            <div className="space-y-3">
              <InputRow label="Số tiền gốc (VND)" value="500,000" />
              <InputRow label="Giữ tối thiểu (VND)" value="1,000,000" />
              <InputRow label="Giảm khi dưới (VND)" value="3,000,000" />
              <InputRow label="Dừng khi dưới (VND)" value="500,000" />
            </div>
          )}

          {selectedStrategy === 'target' && (
            <div className="space-y-3">
              <InputRow label="Mục tiêu (VND)" value="50,000,000" />
              <InputRow label="Min/lần (VND)" value="200,000" />
              <InputRow label="Max/lần (VND)" value="2,000,000" />
              <InputRow label="Hạn chót" value="31/12/2026" />
            </div>
          )}

          <button
            onClick={() => {
              toast.success('Đã lưu cấu hình');
              setShowConfigSheet(false);
            }}
            className="w-full h-[48px] rounded-[14px] active:scale-[0.98] transition-all hover:opacity-90"
            style={{ background: c.primary }}
          >
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Lưu cấu hình</span>
          </button>
        </div>
      </BottomSheetV2>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function ChartTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useThemeColors();
  const isDark = useIsDark();
  return (
    <div className="rounded-xl p-3 shadow-xl"
      style={{
        background: isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        backdropFilter: 'blur(12px)',
      }}>
      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span style={{ color: c.text2, fontSize: 11 }}>{label}: <b style={{ color }}>{value}</b></span>
    </div>
  );
}

function LegendItem({ color, label, dashed, small, block }: {
  color: string; label: string; dashed?: boolean; small?: boolean; block?: boolean;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-1.5">
      {block ? (
        <div className="w-3 h-2.5 rounded-sm" style={{ background: color }} />
      ) : dashed ? (
        <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <div className={`w-3 ${small ? 'h-0.5' : 'h-1'} rounded-full`} style={{ background: color, opacity: small ? 0.5 : 1 }} />
      )}
      <span style={{ color: c.text3, fontSize: small ? 9 : 10 }}>{label}</span>
    </div>
  );
}

function ConfigCard({ label, value, icon, accent }: {
  label: string; value: string; icon: string; accent?: string;
}) {
  const c = useThemeColors();
  const isDark = useIsDark();
  return (
    <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ color: c.text3, fontSize: 10, fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{
        color: accent || c.text1,
        fontSize: 14,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
    </div>
  );
}

function InputRow({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  const isDark = useIsDark();
  return (
    <div>
      <label style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-4 py-3 rounded-xl"
        style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : c.surface2,
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : c.border}`,
          color: c.text1,
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          outline: 'none',
        }}
      />
    </div>
  );
}
