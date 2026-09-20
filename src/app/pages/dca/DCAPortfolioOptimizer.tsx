/**
 * DCA Portfolio Optimizer — Enterprise Fintech v3.0
 *
 * v3.0 additions:
 * - Real PDF export via html2canvas + jspdf
 * - Multi-select frontier comparison (compare mode)
 * - Portfolio drift monitoring with threshold notifications
 *
 * @module pages/dca/DCAPortfolioOptimizer
 * @version 3.0 (Enterprise Fintech Standard)
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Activity,
  AlertTriangle,
  ArrowRight,
  Info,
  ChevronDown,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  Sparkles,
  Share2,
  Copy,
  Mail,
  FileText,
  CheckCircle,
  X,
  Link2,
  GitCompareArrows,
  Bell,
  BellOff,
  Settings2,
  Check,
  Loader2,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { toast } from 'sonner';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  portfolioOptimizerService,
  type AssetAllocation,
  type FrontierPoint,
} from '../../services/DCAPortfolioOptimizerService';

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

type TabId = 'frontier' | 'correlation' | 'backtest' | 'risk';

const TABS: { id: TabId; label: string; icon: typeof Target }[] = [
  { id: 'frontier', label: 'Frontier', icon: Target },
  { id: 'correlation', label: 'Tương quan', icon: Activity },
  { id: 'backtest', label: 'Backtest', icon: BarChart3 },
  { id: 'risk', label: 'Rủi ro', icon: Shield },
];

const CURRENT_PORTFOLIO: AssetAllocation[] = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 55 },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 30 },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B', weight: 15 },
];

const CORR_ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];

const COMPARE_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DRIFT_THRESHOLDS = [
  { value: 3, label: '3%' },
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
  { value: 15, label: '15%' },
];

function fmtVND(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

/* ═══════════════════════════════════════════
   DRIFT CALCULATION
   ═══════════════════════════════════════════ */

function computeDrift(current: AssetAllocation[], target: AssetAllocation[]): { total: number; perAsset: { symbol: string; current: number; target: number; diff: number; color: string }[] } {
  const allSymbols = Array.from(new Set([...current.map(a => a.symbol), ...target.map(a => a.symbol)]));
  let totalDrift = 0;
  const perAsset = allSymbols.map(symbol => {
    const cur = current.find(a => a.symbol === symbol);
    const tgt = target.find(a => a.symbol === symbol);
    const curW = cur?.weight ?? 0;
    const tgtW = tgt?.weight ?? 0;
    const diff = curW - tgtW;
    totalDrift += Math.abs(diff);
    return { symbol, current: curW, target: tgtW, diff, color: cur?.color ?? tgt?.color ?? '#8B95B3' };
  });
  return { total: totalDrift / 2, perAsset }; // divide by 2 because sum of abs diffs double-counts
}

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

function useChartTheme() {
  const c = useThemeColors();
  const isDark = useIsDark();
  return useMemo(() => ({
    grid: c.divider,
    axis: c.text3,
    tooltipBg: c.surface,
    tooltipBorder: c.cardBorder,
    areaGreenFill: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.06)',
    areaYellowFill: isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.06)',
    areaPurpleFill: isDark ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.06)',
    scatterActive: '#8B5CF6',
    scatterInactive: isDark ? 'rgba(139,92,246,0.55)' : 'rgba(139,92,246,0.4)',
    scatterStroke: isDark ? '#1E1E2E' : '#fff',
    gridOpacity: isDark ? 0.15 : 0.6,
    radarFill: isDark ? 0.25 : 0.15,
  }), [c, isDark]);
}

/* ═══════════════════════════════════════════
   HEALTH DONUT
   ═══════════════════════════════════════════ */

function HealthDonut({ score, size = 80 }: { score: number; size?: number }) {
  const c = useThemeColors();
  const sw = 8, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 50 ? '#10B981' : score >= 30 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.divider} strokeWidth={sw} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${progress} ${circ - progress}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color, fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{score}</span>
        <span style={{ color: c.text3, fontSize: 8 }}>/ 100</span>
      </div>
    </div>
  );
}

/** Asset allocation comparison row — dual bar + diff badge, white text for hero dark bg */
function AllocationComparisonRow({ symbol, currentWeight, optimalWeight, color, index = 0 }: { symbol: string; currentWeight: number; optimalWeight: number; color: string; index?: number }) {
  const diff = optimalWeight - currentWeight;
  const maxW = Math.max(currentWeight, optimalWeight, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 + index * 0.055, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl p-3"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {/* Row 1: Symbol + diff badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
          <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>{symbol}</span>
        </div>
        <span className="px-2 py-0.5 rounded-md" style={{
          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          background: diff > 0 ? 'rgba(16,185,129,0.2)' : diff < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
          color: diff > 0 ? '#34D399' : diff < 0 ? '#F87171' : 'rgba(255,255,255,0.5)',
        }}>
          {diff > 0 ? '+' : ''}{diff}%
        </span>
      </div>
      {/* Row 2: Dual bars */}
      <div className="flex flex-col gap-1.5">
        {/* Current */}
        <div className="flex items-center gap-2">
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, width: 42, flexShrink: 0 }}>Hiện tại</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentWeight / maxW) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.06, ease: 'easeOut' }}
              style={{ background: color, opacity: 0.45 }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>{currentWeight}%</span>
        </div>
        {/* Optimal */}
        <div className="flex items-center gap-2">
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, width: 42, flexShrink: 0 }}>Tối ưu</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(optimalWeight / maxW) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
              style={{ background: color }}
            />
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>{optimalWeight}%</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SEGMENT TAB BAR
   ═══════════════════════════════════════════ */

function SegmentTabBar({ tabs, active, onChange }: { tabs: typeof TABS; active: TabId; onChange: (id: TabId) => void }) {
  const c = useThemeColors();
  return (
    <div className="flex gap-1.5 p-1.5 rounded-2xl" style={{ background: c.surface2 }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
            style={{
              background: isActive ? c.surface : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}>
            <Icon size={14} color={isActive ? '#8B5CF6' : c.text3} />
            <span style={{ color: isActive ? c.text1 : c.text3, fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, subtitle, color = '#8B5CF6', trailing }: { icon: typeof Target; title: string; subtitle?: string; color?: string; trailing?: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
          <Icon size={17} color={color} />
        </div>
        <div>
          <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, lineHeight: 1.2, display: 'block' }}>{title}</span>
          {subtitle && <span style={{ color: c.text3, fontSize: 11, lineHeight: 1.3 }}>{subtitle}</span>}
        </div>
      </div>
      {trailing}
    </div>
  );
}

/* ═══════════════════════════════════════════
   RISK METRIC CARD
   ═══════════════════════════════════════════ */

function RiskMetricCard({ label, value, color, description, delay = 0 }: { label: string; value: string; color: string; description?: string; delay?: number }) {
  const c = useThemeColors();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: c.surface2 }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
        </div>
        <p style={{ color: c.text1, fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</p>
        {description && <p style={{ color: c.text3, fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>{description}</p>}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MULTI-FRONTIER COMPARISON CARD
   ═══════════════════════════════════════════ */

function FrontierComparisonCard({ indices, frontier }: { indices: number[]; frontier: FrontierPoint[] }) {
  const c = useThemeColors();
  const ct = useChartTheme();

  const selected = indices.map((idx, i) => ({ ...frontier[idx], color: COMPARE_COLORS[i % COMPARE_COLORS.length], idx }));

  // Build radar data
  const maxReturn = Math.max(...selected.map(s => s.return_));
  const maxRisk = Math.max(...selected.map(s => s.risk));
  const maxSharpe = Math.max(...selected.map(s => s.sharpe));
  const radarMetrics = ['Return', 'Sharpe', 'Diversity', 'Low Risk', 'Stability'];

  const radarData = radarMetrics.map(metric => {
    const row: any = { metric };
    selected.forEach((s) => {
      const risk = portfolioOptimizerService.getRiskMetrics(s.allocations);
      switch (metric) {
        case 'Return': row[`p${s.idx}`] = (s.return_ / maxReturn) * 100; break;
        case 'Sharpe': row[`p${s.idx}`] = (s.sharpe / maxSharpe) * 100; break;
        case 'Diversity': row[`p${s.idx}`] = portfolioOptimizerService.getDiversificationScore(s.allocations); break;
        case 'Low Risk': row[`p${s.idx}`] = Math.max(0, 100 - (s.risk / maxRisk) * 100 + 30); break;
        case 'Stability': row[`p${s.idx}`] = Math.max(0, 100 + risk.maxDrawdown * 1.5); break;
      }
    });
    return row;
  });

  return (
    <TrCard className="overflow-hidden">
      <div className="p-5 pb-0">
        <SectionHeader icon={GitCompareArrows} title={`So sánh ${selected.length} chiến lược`} subtitle="Radar 5 trục + bảng chi tiết" color="#3B82F6" />
      </div>

      {/* Radar chart */}
      <div style={{ height: 240 }} className="px-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid key="polar-grid" stroke={ct.grid} opacity={ct.gridOpacity} />
            <PolarAngleAxis key="polar-angle" dataKey="metric" tick={{ fill: ct.axis, fontSize: 10, fontWeight: 600 }} />
            {selected.map((s, i) => (
              <Radar key={`radar-${s.idx}-${i}`} name={`${s.label ?? 'Portfolio'} #${s.idx + 1}`} dataKey={`p${s.idx}`}
                stroke={s.color} fill={s.color} fillOpacity={ct.radarFill} strokeWidth={2} isAnimationActive={false} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-5 py-3 justify-center">
        {selected.map((s, i) => (
          <div key={`legend-${s.idx}-${i}`} className="flex items-center gap-2 px-2.5 py-1 rounded-lg" style={{ background: `${s.color}0A` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="px-5 pb-5">
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.divider}33` }}>
          <table className="w-full" style={{ minWidth: 280 }}>
            <thead>
              <tr style={{ background: c.surface2 }}>
                <th className="text-left py-2.5 px-3" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>Chỉ số</th>
                {selected.map((s, i) => (
                  <th key={`th-${s.idx}-${i}`} className="text-right py-2.5 px-3" style={{ color: s.color, fontSize: 10, fontWeight: 700 }}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Return/năm', get: (s: typeof selected[0]) => `+${s.return_}%` },
                { label: 'Biến động', get: (s: typeof selected[0]) => `${s.risk}%` },
                { label: 'Sharpe', get: (s: typeof selected[0]) => s.sharpe.toFixed(2) },
                { label: 'Số coin', get: (s: typeof selected[0]) => `${s.allocations.length}` },
                { label: 'Max Drawdown', get: (s: typeof selected[0]) => `${portfolioOptimizerService.getRiskMetrics(s.allocations).maxDrawdown.toFixed(1)}%` },
              ].map((row, rowIdx) => (
                <tr key={`row-${row.label}`} style={{ borderTop: `1px solid ${c.divider}22`, background: rowIdx % 2 === 0 ? 'transparent' : `${c.surface2}44` }}>
                  <td className="py-3 px-3" style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>{row.label}</td>
                  {selected.map((s, i) => (
                    <td key={`td-${s.idx}-${row.label}`} className="text-right py-3 px-3" style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {row.get(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   DRIFT NOTIFICATION BANNER
   ═══════════════════════════════════════════ */

function DriftBanner({
  drift,
  threshold,
  onDismiss,
  onSettings,
}: {
  drift: number;
  threshold: number;
  onDismiss: () => void;
  onSettings: () => void;
}) {
  const c = useThemeColors();
  const isHigh = drift >= threshold * 1.5;
  const color = isHigh ? '#EF4444' : '#F59E0B';

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="p-4 rounded-2xl"
      style={{ background: `${color}0D`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
          <AlertTriangle size={18} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Portfolio Drift Cao</span>
            <span className="px-2 py-0.5 rounded-lg" style={{ background: `${color}18`, color, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {drift.toFixed(1)}%
            </span>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>
            Danh mục đã lệch {drift.toFixed(1)}% so với phân bổ mục tiêu (ngưỡng: {threshold}%). Xem xét tái cân bằng.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onSettings}
              className="px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: `${color}18`, color, fontSize: 11, fontWeight: 600 }}
            >
              <span className="flex items-center gap-1"><Settings2 size={12} /> Cài đặt</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: c.surface2, color: c.text2, fontSize: 11, fontWeight: 600 }}
            >
              Tạm ẩn
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="shrink-0 mt-0.5">
          <X size={14} color={c.text3} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   DRIFT SETTINGS SHEET
   ═══════════════════════════════════════════ */

function DriftSettingsSheet({
  onClose,
  threshold,
  setThreshold,
  enabled,
  setEnabled,
}: {
  onClose: () => void;
  threshold: number;
  setThreshold: (v: number) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}) {
  const c = useThemeColors();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{ background: c.bg, maxWidth: 440 }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.divider }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Bell size={18} color="#F59E0B" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Cài đặt Drift Alert</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Thông báo khi danh mục lệch quá ngưỡng</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity active:scale-[0.98]" style={{ background: c.surface2 }}>
            <X size={16} color={c.text3} />
          </button>
        </div>

        <div className="px-5 pb-6">
          {/* Toggle */}
          <button
            onClick={() => { setEnabled(!enabled); toast.success(enabled ? 'Đã tắt drift alert' : 'Đã bật drift alert'); }}
            className="flex items-center justify-between w-full p-4 rounded-[14px] mb-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}
          >
            <div className="flex items-center gap-3">
              {enabled ? <Bell size={18} color="#F59E0B" /> : <BellOff size={18} color={c.text3} />}
              <div className="text-left">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Drift Notification</p>
                <p style={{ color: c.text3, fontSize: 11 }}>{enabled ? 'Đang bật' : 'Đang tắt'}</p>
              </div>
            </div>
            <div className="w-11 h-6 rounded-full p-0.5 transition-all" style={{ background: enabled ? '#F59E0B' : c.surface2 }}>
              <motion.div className="w-5 h-5 rounded-full bg-white shadow-sm" animate={{ x: enabled ? 20 : 0 }} transition={{ duration: 0.2 }} />
            </div>
          </button>

          {/* Threshold selector */}
          <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Ngưỡng cảnh báo</p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {DRIFT_THRESHOLDS.map(t => (
              <button
                key={t.value}
                onClick={() => { setThreshold(t.value); toast.success(`Ngưỡng drift: ${t.label}`); }}
                className="py-3 rounded-[14px] text-center hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{
                  background: threshold === t.value ? 'rgba(245,158,11,0.12)' : c.surface,
                  border: threshold === t.value ? '2px solid rgba(245,158,11,0.35)' : `1px solid ${c.cardBorder}`,
                }}
              >
                <span style={{ color: threshold === t.value ? '#F59E0B' : c.text1, fontSize: 14, fontWeight: 700 }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: c.surface2 }}>
            <Info size={14} color={c.text3} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Khi tổng drift vượt ngưỡng, bạn sẽ nhận cảnh báo và gợi ý tái cân bằng. Drift được tính theo chênh lệch tuyệt đối giữa phân bổ hiện tại và mục tiêu.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   EXPORT / SHARE SHEET (with real PDF)
   ═══════════════════════════════════════════ */

function ExportShareSheet({
  onClose,
  portfolioLabel,
  sharpe,
  diversScore,
  contentRef,
}: {
  onClose: () => void;
  portfolioLabel: string;
  sharpe: number;
  diversScore: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const c = useThemeColors();
  const [copiedLink, setCopiedLink] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true);
      toast.success('Đã sao chép link');
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => toast.error('Không thể sao chép'));
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) {
      toast.error('Không tìm thấy nội dung');
      return;
    }

    setExporting(true);
    toast.info('Đang tạo báo cáo PDF...', { duration: 4000 });

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const el = contentRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      // A4 portrait
      const pdfW = 210;
      const pdfH = 297;
      const margin = 10;
      const contentW = pdfW - margin * 2;
      const contentH = (imgH * contentW) / imgW;

      const pdf = new jsPDF('p', 'mm', 'a4');

      // Header text
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Portfolio Optimizer Report', margin, margin + 8);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${portfolioLabel} | Sharpe: ${sharpe.toFixed(2)} | Diversification: ${diversScore}/100`, margin, margin + 14);
      pdf.text(`Generated: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, margin, margin + 19);
      pdf.setDrawColor(200);
      pdf.line(margin, margin + 22, pdfW - margin, margin + 22);

      const startY = margin + 26;
      const availableH = pdfH - startY - margin;

      // If content is taller than one page, scale to fit or multi-page
      if (contentH <= availableH) {
        pdf.addImage(imgData, 'PNG', margin, startY, contentW, contentH);
      } else {
        // Multi-page
        let yOffset = 0;
        let page = 0;
        const pageContentH = availableH;
        const scale = contentW / imgW;

        while (yOffset < imgH) {
          if (page > 0) {
            pdf.addPage();
          }
          const sourceY = yOffset;
          const sourceH = Math.min(pageContentH / scale, imgH - yOffset);
          const destH = sourceH * scale;

          // Create clip canvas for this page
          const clipCanvas = document.createElement('canvas');
          clipCanvas.width = imgW;
          clipCanvas.height = sourceH;
          const ctx = clipCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, imgW, sourceH, 0, 0, imgW, sourceH);
            const clipData = clipCanvas.toDataURL('image/png');
            pdf.addImage(clipData, 'PNG', margin, page === 0 ? startY : margin, contentW, destH);
          }

          yOffset += sourceH;
          page++;
          if (page > 10) break; // safety
        }
      }

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Page ${i}/${pageCount} — Portfolio Optimizer Report`, margin, pdfH - 5);
      }

      const fileName = `Portfolio_Optimizer_${portfolioLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      toast.success('Báo cáo PDF đã tải xuống', { description: fileName });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Lỗi khi tạo PDF', { description: 'Vui lòng thử lại' });
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const handleShareAdvisor = () => {
    const subject = encodeURIComponent(`Báo cáo Portfolio Optimizer — ${portfolioLabel}`);
    const body = encodeURIComponent(
      `Xin chào,\n\nTôi muốn chia sẻ kết quả phân tích portfolio:\n\n` +
      `- Phân bổ: ${portfolioLabel}\n- Sharpe Ratio: ${sharpe.toFixed(2)}\n` +
      `- Diversification Score: ${diversScore}/100\n- Link: ${window.location.href}\n\n` +
      `Xin vui lòng xem xét và tư vấn.\n\nTrân trọng.`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success('Đã mở email');
    onClose();
  };

  const handleCopySummary = () => {
    const text = `Portfolio Optimizer Report\n========================\nPhân bổ: ${portfolioLabel}\nSharpe: ${sharpe.toFixed(2)}\nDiversification: ${diversScore}/100\nNgày: ${new Date().toLocaleDateString('vi-VN')}\nLink: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Đã sao chép tóm tắt')).catch(() => toast.error('Lỗi'));
    onClose();
  };

  const actions = [
    { icon: Link2, label: 'Sao chép link', desc: 'Chia sẻ link phân tích', onClick: handleCopyLink, color: '#3B82F6', done: copiedLink, loading: false },
    { icon: Copy, label: 'Sao chép tóm tắt', desc: 'Copy text báo cáo ngắn', onClick: handleCopySummary, color: '#8B5CF6', done: false, loading: false },
    { icon: Mail, label: 'Gửi email advisor', desc: 'Mở email với nội dung sẵn', onClick: handleShareAdvisor, color: '#10B981', done: false, loading: false },
    { icon: FileText, label: 'Xuất báo cáo PDF', desc: exporting ? 'Đang xuất...' : 'Tải file phân tích đầy đủ', onClick: handleExportPDF, color: '#F59E0B', done: false, loading: exporting },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{ background: c.bg, maxWidth: 440 }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.divider }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <Share2 size={18} color="#8B5CF6" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Chia sẻ & Xuất báo cáo</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Gửi cho advisor hoặc lưu trữ</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity active:scale-[0.98]" style={{ background: c.surface2 }}>
            <X size={16} color={c.text3} />
          </button>
        </div>
        <div className="mx-5 mb-4 p-4 rounded-[14px]" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{portfolioLabel}</span>
            <span className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 11, fontWeight: 700 }}>Sharpe {sharpe.toFixed(2)}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Diversification</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>{diversScore}/100</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Ngày phân tích</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-6 flex flex-col gap-2">
          {actions.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.onClick} disabled={a.loading}
                className="flex items-center gap-3.5 w-full p-4 rounded-[14px] text-left hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60"
                style={{ background: c.surface, border: `1px solid ${c.cardBorder}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                  {a.loading ? <Loader2 size={18} color={a.color} className="animate-spin" /> : a.done ? <CheckCircle size={18} color={a.color} /> : <Icon size={18} color={a.color} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{a.label}</p>
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 1 }}>{a.desc}</p>
                </div>
                <ArrowRight size={14} color={c.text3} />
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function DCAPortfolioOptimizer() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();
  const ct = useChartTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabId>('frontier');
  const [selectedFrontierIdx, setSelectedFrontierIdx] = useState(2);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showExportSheet, setShowExportSheet] = useState(false);

  // Multi-compare
  const [compareMode, setCompareMode] = useState(false);
  const [comparedIndices, setComparedIndices] = useState<number[]>([2]);

  // Drift monitoring
  const [driftThreshold, setDriftThreshold] = useState(5);
  const [driftEnabled, setDriftEnabled] = useState(true);
  const [driftDismissed, setDriftDismissed] = useState(false);
  const [showDriftSettings, setShowDriftSettings] = useState(false);

  const frontier = portfolioOptimizerService.getFrontierPoints();
  const optimal = portfolioOptimizerService.getOptimalPortfolio();
  const suggestions = portfolioOptimizerService.getSuggestions(CURRENT_PORTFOLIO);
  const diversScore = portfolioOptimizerService.getDiversificationScore(CURRENT_PORTFOLIO);
  const backtestData = portfolioOptimizerService.getBacktestResults();

  const selectedFrontier = frontier[selectedFrontierIdx];
  const riskMetrics = useMemo(
    () => portfolioOptimizerService.getRiskMetrics(selectedFrontier.allocations),
    [selectedFrontierIdx],
  );

  // Drift computation
  const drift = useMemo(
    () => computeDrift(CURRENT_PORTFOLIO, optimal.allocations),
    [],
  );
  const showDriftBanner = driftEnabled && !driftDismissed && drift.total >= driftThreshold;

  const frontierScatter = frontier.map((p, i) => ({
    key: `frontier-${i}`, x: p.risk, y: p.return_, label: p.label, sharpe: p.sharpe, idx: i,
  }));

  const lastBacktest = backtestData[backtestData.length - 1];
  const dcaVsHodl = lastBacktest
    ? ((lastBacktest.dcaValue - lastBacktest.hodlValue) / lastBacktest.hodlValue * 100) : 0;

  // Compare mode handlers
  const toggleCompare = (idx: number) => {
    setComparedIndices(prev => {
      if (prev.includes(idx)) {
        return prev.length > 1 ? prev.filter(i => i !== idx) : prev;
      }
      if (prev.length >= 5) { toast.error('Tối đa 5 chiến lược'); return prev; }
      return [...prev, idx];
    });
  };

  const handleFrontierClick = (idx: number) => {
    if (compareMode) {
      toggleCompare(idx);
    } else {
      setSelectedFrontierIdx(idx);
    }
  };

  return (
    <PageLayout>
      <Header title="Portfolio Optimizer" subtitle="Tối ưu · DCA" back
        action={{ icon: Share2, onClick: () => setShowExportSheet(true) }} />

      <div ref={contentRef} className="w-full" style={{ maxWidth: 640, margin: '0 auto' }}>
        <PageContent gap="relaxed" grow>
          {/* ═══ DRIFT BANNER ═══ */}
          <AnimatePresence>
            {showDriftBanner && (
              <DriftBanner
                drift={drift.total}
                threshold={driftThreshold}
                onDismiss={() => setDriftDismissed(true)}
                onSettings={() => setShowDriftSettings(true)}
              />
            )}
          </AnimatePresence>

          {/* ═══ HERO CARD — Portfolio Comparison ═══ */}
          <TrCard variant="hero" className="overflow-hidden">
            {/* ── Header + Score Badge ── */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 0.2, marginBottom: 4 }}>Portfolio Comparison</p>
                  <p style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>Hiện tại vs Tối ưu</p>
                </div>
                {/* Score badge — compact pill */}
                <div className="flex flex-col items-end gap-1">
                  <div className="px-3 py-1.5 rounded-xl flex items-center gap-2" style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500 }}>Score</span>
                    <span style={{
                      color: diversScore >= 50 ? '#34D399' : diversScore >= 30 ? '#FBBF24' : '#F87171',
                      fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                    }}>{diversScore}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Key Metrics Strip ── */}
            <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-3">
                <div className="py-3 px-3 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginBottom: 4, fontWeight: 500 }}>Sharpe tối ưu</p>
                  <p style={{ color: '#C4B5FD', fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{optimal.sharpe.toFixed(2)}</p>
                </div>
                <div className="py-3 px-3 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginBottom: 4, fontWeight: 500 }}>Return/năm</p>
                  <p style={{ color: '#34D399', fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>+{optimal.return_}%</p>
                </div>
                <div className="py-3 px-3 text-center">
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginBottom: 4, fontWeight: 500 }}>Drift hiện tại</p>
                  <p style={{
                    color: drift.total >= driftThreshold ? '#F87171' : drift.total >= driftThreshold * 0.6 ? '#FBBF24' : '#34D399',
                    fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                  }}>
                    {drift.total.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* ── Asset Allocation Breakdown — dual bars ── */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              {(() => {
                const allSymbols = Array.from(new Set([
                  ...CURRENT_PORTFOLIO.map(a => a.symbol),
                  ...selectedFrontier.allocations.map(a => a.symbol),
                ]));
                return allSymbols.map((symbol, idx) => {
                  const cur = CURRENT_PORTFOLIO.find(a => a.symbol === symbol);
                  const opt = selectedFrontier.allocations.find(a => a.symbol === symbol);
                  return (
                    <AllocationComparisonRow
                      key={symbol}
                      symbol={symbol}
                      currentWeight={cur?.weight ?? 0}
                      optimalWeight={opt?.weight ?? 0}
                      color={cur?.color || opt?.color || '#8B95B3'}
                      index={idx}
                    />
                  );
                });
              })()}
            </div>
          </TrCard>

          {/* ═══ TAB BAR ═══ */}
          <SegmentTabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {/* ═══ TAB CONTENT ═══ */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* ─── FRONTIER TAB ─── */}
              {activeTab === 'frontier' && (
                <div className="flex flex-col gap-4">
                  {/* Compare mode toggle */}
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={Target} title="Efficient Frontier" color="#8B5CF6" />
                    <button
                      onClick={() => { setCompareMode(!compareMode); if (!compareMode) setComparedIndices([selectedFrontierIdx]); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity active:scale-[0.98]"
                      style={{
                        background: compareMode ? 'rgba(59,130,246,0.1)' : c.surface2,
                        border: compareMode ? '1px solid rgba(59,130,246,0.3)' : `1px solid transparent`,
                      }}
                    >
                      <GitCompareArrows size={13} color={compareMode ? '#3B82F6' : c.text3} />
                      <span style={{ color: compareMode ? '#3B82F6' : c.text3, fontSize: 11, fontWeight: 600 }}>
                        {compareMode ? `So sánh (${comparedIndices.length})` : 'So sánh'}
                      </span>
                    </button>
                  </div>

                  {/* Scatter */}
                  <TrCard className="overflow-hidden">
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
                        <span style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Risk-Return Scatter</span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                        {compareMode ? 'Bấm vào các điểm để chọn/bỏ chọn so sánh (tối đa 5).' : 'Mỗi điểm đại diện một phân bổ tối ưu. Điểm càng cao = lợi nhuận lớn hơn.'}
                      </p>
                    </div>
                    <div className="px-2" style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                          <CartesianGrid key="sc-grid" strokeDasharray="3 3" stroke={ct.grid} opacity={ct.gridOpacity} />
                          <XAxis key="sc-x" type="number" dataKey="x" name="Risk" unit="%" tick={{ fill: ct.axis, fontSize: 10 }}
                            axisLine={{ stroke: ct.grid }} tickLine={{ stroke: ct.grid }}
                            label={{ value: 'Rủi ro (%)', position: 'bottom', fill: ct.axis, fontSize: 10, offset: -4 }} />
                          <YAxis key="sc-y" type="number" dataKey="y" name="Return" unit="%" tick={{ fill: ct.axis, fontSize: 10 }}
                            axisLine={{ stroke: ct.grid }} tickLine={{ stroke: ct.grid }}
                            label={{ value: 'Lợi nhuận (%)', angle: -90, position: 'insideLeft', fill: ct.axis, fontSize: 10 }} />
                          <RechartsTooltip key="sc-tip" content={({ payload }) => {
                            if (!payload?.[0]) return null;
                            const d = payload[0].payload;
                            const isCompared = compareMode && comparedIndices.includes(d.idx);
                            return (
                              <div className="rounded-xl p-3 shadow-lg" style={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}` }}>
                                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{d.label} {isCompared ? '(selected)' : ''}</p>
                                <p style={{ color: c.text2, fontSize: 11 }}>Risk: {d.x}% · Return: {d.y}%</p>
                                <p style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>Sharpe: {d.sharpe}</p>
                              </div>
                            );
                          }} />
                          <Scatter key="sc-scatter" data={frontierScatter} fill="#8B5CF6" onClick={(data: any) => handleFrontierClick(data.idx)}
                            isAnimationActive={false}
                            shape={(props: any) => {
                              const { cx, cy, payload, index } = props;
                              const ptIdx = payload?.idx ?? 0;
                              const isActive = compareMode ? comparedIndices.includes(ptIdx) : ptIdx === selectedFrontierIdx;
                              const compIdx = compareMode ? comparedIndices.indexOf(ptIdx) : -1;
                              const fillColor = compareMode && compIdx >= 0 ? COMPARE_COLORS[compIdx % COMPARE_COLORS.length] : isActive ? ct.scatterActive : ct.scatterInactive;
                              const r = isActive ? 8 : 5;
                              return (
                                <circle key={`scatter-pt-${ptIdx}-${index}`} cx={cx} cy={cy} r={r} fill={fillColor}
                                  stroke={isActive ? ct.scatterStroke : 'none'} strokeWidth={isActive ? 3 : 0}
                                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} />
                              );
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-3" />
                  </TrCard>

                  {/* Frontier picker chips */}
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {frontier.map((p, i) => {
                      const isSelected = compareMode ? comparedIndices.includes(i) : i === selectedFrontierIdx;
                      const compIdx = compareMode ? comparedIndices.indexOf(i) : -1;
                      const accentColor = compareMode && compIdx >= 0 ? COMPARE_COLORS[compIdx % COMPARE_COLORS.length] : '#8B5CF6';
                      return (
                        <motion.button
                          key={i}
                          onClick={() => handleFrontierClick(i)}
                          className="shrink-0 px-4 py-3.5 rounded-2xl hover:opacity-90 transition-all active:scale-[0.97] relative"
                          style={{
                            background: isSelected ? `${accentColor}10` : c.surface,
                            border: isSelected ? `2px solid ${accentColor}44` : `1px solid ${c.cardBorder}`,
                            minWidth: 115,
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                        >
                          {compareMode && isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ background: accentColor }}>
                              <Check size={10} color="white" strokeWidth={3} />
                            </div>
                          )}
                          <p style={{ color: isSelected ? accentColor : c.text1, fontSize: 12, fontWeight: 700 }}>{p.label}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+{p.return_}%</span>
                            <span style={{ color: c.text3, fontSize: 8 }}>·</span>
                            <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.risk}%</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Compare mode: Radar + table */}
                  {compareMode && comparedIndices.length >= 2 && (
                    <FrontierComparisonCard indices={comparedIndices} frontier={frontier} />
                  )}

                  {/* Normal mode: Selected portfolio detail */}
                  {!compareMode && (
                    <>
                      <TrCard className="overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                              <PieChartIcon size={18} color="#8B5CF6" />
                            </div>
                            <div>
                              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{selectedFrontier.label}</p>
                              <p style={{ color: c.text3, fontSize: 11, marginTop: 1 }}>Phân bổ đề xuất</p>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                            <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>Sharpe {selectedFrontier.sharpe.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Stats strip */}
                        <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ background: c.surface2 }}>
                          <div className="grid grid-cols-2">
                            <div className="p-3 text-center" style={{ borderRight: `1px solid ${c.divider}33` }}>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Lợi nhuận/năm</p>
                              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>+{selectedFrontier.return_}%</p>
                            </div>
                            <div className="p-3 text-center">
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Biến động (Vol)</p>
                              <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{selectedFrontier.risk}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Allocation bars */}
                        <div className="px-5 pb-5 flex flex-col gap-3">
                          {selectedFrontier.allocations.map((a, idx) => (
                            <motion.div
                              key={a.symbol}
                              className="flex items-center gap-3"
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 + idx * 0.06, ease: [0.4, 0, 0.2, 1] }}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}12` }}>
                                <span style={{ color: a.color, fontSize: 10, fontWeight: 700 }}>{a.symbol}</span>
                              </div>
                              <div className="flex-1">
                                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${a.weight}%` }}
                                    transition={{ duration: 0.6, delay: 0.1 + idx * 0.08, ease: 'easeOut' }} style={{ background: `linear-gradient(90deg, ${a.color}88, ${a.color})` }} />
                                </div>
                              </div>
                              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{a.weight}%</span>
                            </motion.div>
                          ))}
                        </div>
                      </TrCard>

                      {suggestions.length > 0 && (
                        <TrCard className="overflow-hidden">
                          <button className="flex items-center justify-between w-full px-5 pt-5 pb-0" onClick={() => setShowSuggestions(!showSuggestions)}>
                            <SectionHeader icon={Sparkles} title={`Gợi ý tối ưu (${suggestions.length})`} color="#F59E0B" />
                            <motion.div animate={{ rotate: showSuggestions ? 180 : 0 }} transition={{ duration: 0.25 }}>
                              <ChevronDown size={16} color={c.text3} />
                            </motion.div>
                          </button>
                          <div className="px-5 pb-5" style={{ display: 'grid', gridTemplateRows: showSuggestions ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
                            <div style={{ overflow: 'hidden' }}>
                              <div className="flex flex-col gap-2.5 mt-3">
                                {suggestions.map((s, i) => {
                                  const isPositive = s.type === 'increase' || s.type === 'add';
                                  return (
                                    <motion.div
                                      key={i}
                                      className="flex items-start gap-3 p-3.5 rounded-2xl"
                                      style={{ background: c.surface2 }}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                        {isPositive ? <TrendingUp size={15} color="#10B981" /> : <TrendingDown size={15} color="#EF4444" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{s.symbol}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span style={{ color: c.text3, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{s.currentWeight}%</span>
                                            <ArrowRight size={10} color={c.text3} style={{ opacity: 0.5 }} />
                                            <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.suggestedWeight}%</span>
                                          </div>
                                        </div>
                                        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{s.reason}</p>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </TrCard>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── CORRELATION TAB ─── */}
              {activeTab === 'correlation' && (
                <div className="flex flex-col gap-4">
                  <TrCard className="overflow-hidden">
                    <div className="p-5 pb-0">
                      <SectionHeader icon={Activity} title="Ma trận tương quan" subtitle="Hệ số tương quan giữa các tài sản" color="#3B82F6" />
                    </div>
                    <div className="px-5 pt-2 pb-4">
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>
                        Tương quan càng thấp (xanh) = diversification tốt. Càng cao (đỏ) = di chuyển cùng hướng.
                      </p>
                      <div className="overflow-x-auto -mx-1">
                        <div style={{ minWidth: 300 }}>
                          {/* Column headers */}
                          <div className="flex items-center mb-1.5">
                            <div style={{ width: 44 }} />
                            {CORR_ASSETS.map(a => (
                              <div key={a} className="flex-1 text-center">
                                <span style={{ color: c.text2, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{a}</span>
                              </div>
                            ))}
                          </div>
                          {/* Rows */}
                          {CORR_ASSETS.map((row, rowIdx) => (
                            <motion.div
                              key={row}
                              className="flex items-center gap-1.5 mb-1.5"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: rowIdx * 0.06, ease: [0.4, 0, 0.2, 1] }}
                            >
                              <div style={{ width: 40 }}>
                                <span style={{ color: c.text2, fontSize: 10, fontWeight: 700 }}>{row}</span>
                              </div>
                              {CORR_ASSETS.map(col => {
                                const isDiag = row === col;
                                const corr = isDiag ? 1 : portfolioOptimizerService.getCorrelation(row, col);
                                const bg = isDiag
                                  ? c.surface2
                                  : corr >= 0.7 ? `rgba(239,68,68,${0.08 + corr * 0.18})`
                                  : corr >= 0.4 ? `rgba(245,158,11,${0.06 + corr * 0.14})`
                                  : `rgba(16,185,129,${0.06 + corr * 0.14})`;
                                const tc = isDiag ? c.text3 : corr >= 0.7 ? '#DC2626' : corr >= 0.4 ? '#D97706' : '#059669';
                                return (
                                  <div key={col} className="flex-1 flex items-center justify-center rounded-xl" style={{ background: bg, height: 44 }}>
                                    <span style={{ color: tc, fontSize: 12, fontWeight: isDiag ? 800 : 600, fontVariantNumeric: 'tabular-nums' }}>{corr.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-5 px-5 py-3" style={{ borderTop: `1px solid ${c.divider}22` }}>
                      {[{ label: 'Thấp (<0.4)', color: 'rgba(16,185,129,0.3)' }, { label: 'TB (0.4–0.7)', color: 'rgba(245,158,11,0.3)' }, { label: 'Cao (>0.7)', color: 'rgba(239,68,68,0.3)' }].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-md" style={{ background: l.color }} />
                          <span style={{ color: c.text3, fontSize: 10, fontWeight: 500 }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </TrCard>

                  <TrCard className="overflow-hidden">
                    <div className="p-5">
                      <SectionHeader icon={Layers} title="Diversification Score" subtitle="Đánh giá mức đa dạng hóa" color="#10B981" />
                      <div className="flex items-center gap-4 mb-5">
                        <HealthDonut score={diversScore} size={76} />
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                            {diversScore >= 50 ? 'Phân tán tốt' : diversScore >= 30 ? 'Trung bình' : 'Cần cải thiện'}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>
                            {diversScore >= 50 ? 'Tài sản có tương quan thấp, giảm rủi ro tổng thể.' : diversScore >= 30 ? 'Xem xét thêm tài sản tương quan thấp.' : 'Tập trung vào tài sản tương quan cao — rủi ro lớn.'}
                          </p>
                        </div>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${diversScore}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ background: diversScore >= 50 ? 'linear-gradient(90deg, #10B981, #34D399)' : diversScore >= 30 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : 'linear-gradient(90deg, #EF4444, #F87171)' }} />
                      </div>
                    </div>
                  </TrCard>
                </div>
              )}

              {/* ─── BACKTEST TAB ─── */}
              {activeTab === 'backtest' && (
                <div className="flex flex-col gap-4">
                  <TrCard className="overflow-hidden">
                    <div className="px-5 pt-5 pb-2">
                      <SectionHeader icon={BarChart3} title="DCA vs HODL (12 tháng)" subtitle="So sánh chiến lược đầu tư định kỳ" color="#10B981" />
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>So sánh chiến lược DCA với mua một lần dựa trên dữ liệu lịch sử.</p>
                    </div>
                    <div className="px-2" style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={backtestData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid key="ac-grid" strokeDasharray="3 3" stroke={ct.grid} opacity={ct.gridOpacity} />
                          <XAxis key="ac-x" dataKey="month" tick={{ fill: ct.axis, fontSize: 10 }} axisLine={{ stroke: ct.grid }} tickLine={{ stroke: ct.grid }} />
                          <YAxis key="ac-y" tick={{ fill: ct.axis, fontSize: 10 }} tickFormatter={(v: number) => fmtVND(v)} axisLine={{ stroke: ct.grid }} tickLine={{ stroke: ct.grid }} />
                          <RechartsTooltip key="ac-tip" content={({ payload, label }) => {
                            if (!payload?.length) return null;
                            return (
                              <div className="rounded-xl p-3 shadow-lg" style={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}` }}>
                                <p style={{ color: c.text1, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                                {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color, fontSize: 11 }}>{p.name}: {fmtVND(p.value)}</p>)}
                              </div>
                            );
                          }} />
                          <Area key="ac-invested" type="monotone" dataKey="invested" name="Đã đầu tư" stroke={ct.axis} fill="none" strokeDasharray="5 5" strokeWidth={1.5} isAnimationActive={false} />
                          <Area key="ac-hodl" type="monotone" dataKey="hodlValue" name="HODL" stroke="#F59E0B" fill={ct.areaYellowFill} strokeWidth={2} isAnimationActive={false} />
                          <Area key="ac-dca" type="monotone" dataKey="dcaValue" name="DCA" stroke="#10B981" fill={ct.areaGreenFill} strokeWidth={2.5} isAnimationActive={false} />
                          <Legend key="ac-legend" wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-3" />
                  </TrCard>

                  {/* Summary stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'DCA Final', value: fmtVND(lastBacktest.dcaValue), color: '#10B981' },
                      { label: 'HODL Final', value: fmtVND(lastBacktest.hodlValue), color: '#F59E0B' },
                      { label: 'DCA trội hơn', value: `${dcaVsHodl >= 0 ? '+' : ''}${dcaVsHodl.toFixed(1)}%`, color: dcaVsHodl >= 0 ? '#8B5CF6' : '#EF4444' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <TrCard className="overflow-hidden">
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${stat.color}55, ${stat.color})` }} />
                          <div className="p-4 text-center">
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 6, fontWeight: 500 }}>{stat.label}</p>
                            <p style={{ color: stat.color, fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{stat.value}</p>
                          </div>
                        </TrCard>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <AlertTriangle size={15} color="#F59E0B" />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Disclaimer</p>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>Kết quả dựa trên dữ liệu lịch sử, không đảm bảo hiệu suất tương lai.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── RISK TAB ─── */}
              {activeTab === 'risk' && (
                <div className="flex flex-col gap-4">
                  <TrCard className="overflow-hidden">
                    <div className="p-5 pb-0">
                      <SectionHeader icon={Shield} title={`Đánh giá rủi ro`} subtitle={selectedFrontier.label} color="#EF4444" />
                    </div>
                    <div className="px-5 pb-5">
                    <div className="grid grid-cols-2 gap-3">
                      <RiskMetricCard label="Biến động/năm" value={`${riskMetrics.annualizedVolatility.toFixed(1)}%`} color="#F59E0B" description="Dao động giá hàng năm" delay={0} />
                      <RiskMetricCard label="Max Drawdown" value={`${riskMetrics.maxDrawdown.toFixed(1)}%`} color="#EF4444" description="Sụt giảm tối đa từ đỉnh" delay={0.05} />
                      <RiskMetricCard label="Sharpe Ratio" value={riskMetrics.sharpeRatio.toFixed(2)} color="#8B5CF6" description="Return/Risk hiệu chỉnh" delay={0.1} />
                      <RiskMetricCard label="Sortino Ratio" value={riskMetrics.sortinoRatio.toFixed(2)} color="#3B82F6" description="Chỉ tính downside risk" delay={0.15} />
                      <RiskMetricCard label="VaR 95%" value={`${riskMetrics.valueAtRisk95.toFixed(1)}%`} color="#EC4899" description="Thua lỗ tối đa 95% thời gian" delay={0.2} />
                      <RiskMetricCard label="VaR 99%" value={`${riskMetrics.valueAtRisk99.toFixed(1)}%`} color="#EF4444" description="Thua lỗ tối đa 99% thời gian" delay={0.25} />
                      <RiskMetricCard label="Beta" value={riskMetrics.beta.toFixed(2)} color="#10B981" description="Biến động so với thị trường" delay={0.3} />
                      <RiskMetricCard label="Calmar Ratio" value={riskMetrics.calmarRatio.toFixed(2)} color="#F59E0B" description="Return/Drawdown" delay={0.35} />
                    </div>
                    </div>
                  </TrCard>

                  <TrCard className="overflow-hidden">
                    <div className="p-5">
                    <SectionHeader icon={Info} title="Value at Risk (VaR)" subtitle="Phân tích rủi ro giá trị" color="#3B82F6" />
                    <div className="flex flex-col gap-3">
                      {[{ pct: 95, color: '#EC4899', val: riskMetrics.valueAtRisk95 }, { pct: 99, color: '#EF4444', val: riskMetrics.valueAtRisk99 }].map((item, idx) => (
                        <motion.div
                          key={item.pct}
                          className="flex items-center gap-3 p-4 rounded-2xl"
                          style={{ background: `${item.color}08`, border: `1px solid ${item.color}12` }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}12` }}>
                            <span style={{ color: item.color, fontSize: 15, fontWeight: 800 }}>{item.pct}</span>
                          </div>
                          <div className="flex-1">
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{item.pct}% Confidence</p>
                            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginTop: 3 }}>Trong {item.pct}% trường hợp, thua lỗ hàng ngày không vượt quá {Math.abs(item.val).toFixed(1)}%</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    </div>
                  </TrCard>

                  <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <AlertTriangle size={15} color="#F59E0B" />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Disclaimer</p>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>Các chỉ số dựa trên dữ liệu lịch sử. Hãy luôn đa dạng hóa và chỉ đầu tư số tiền bạn chấp nhận mất.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </PageContent>
      </div>

      {/* Spacer for floating buttons clearance */}
      <div className="h-[60px]" />

      {/* ═══ FLOATING BOTTOM ACTIONS ═══ */}
      <div className="fixed left-0 right-0 flex justify-center px-5 z-10" style={{ bottom: 92 }}>
        <div className="flex gap-3">
          <button onClick={() => setShowExportSheet(true)}
            className="w-12 h-[48px] rounded-[14px] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: c.primary }}>
            <Share2 size={20} color="white" />
          </button>
          <button onClick={() => setShowDriftSettings(true)}
            className="w-12 h-[48px] rounded-[14px] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: c.primary }}>
            <Bell size={20} color={driftEnabled ? '#F59E0B' : 'white'} />
          </button>
          <button onClick={() => navigate(`${routePrefix}/dca/rebalance/config`)}
            className="h-[48px] rounded-[14px] flex items-center justify-center gap-2 px-5 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: c.primary }}>
            <ArrowUpRight size={20} color="white" />
            <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Áp dụng phân bổ</span>
          </button>
        </div>
      </div>

      {/* ═══ SHEETS ═══ */}
      <AnimatePresence>
        {showExportSheet && (
          <ExportShareSheet onClose={() => setShowExportSheet(false)} portfolioLabel={selectedFrontier.label ?? 'Optimal'}
            sharpe={selectedFrontier.sharpe} diversScore={diversScore} contentRef={contentRef} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDriftSettings && (
          <DriftSettingsSheet onClose={() => setShowDriftSettings(false)} threshold={driftThreshold}
            setThreshold={setDriftThreshold} enabled={driftEnabled} setEnabled={setDriftEnabled} />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
