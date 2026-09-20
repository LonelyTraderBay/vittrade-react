import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, ChevronRight, ChevronDown, ChevronUp,
  AlertTriangle, Shield, Info, X, CheckCircle, Sliders,
  Zap, DollarSign, Calendar, Target, Sparkles, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Eye, Play, RotateCcw,
  Flame, Snowflake, CloudLightning, Waves, Layers,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { ChartGradientDefs } from '../../components/charts/ChartGradientDefs';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type ScenarioId = 'apy_crash' | 'apy_spike' | 'rate_cut' | 'market_stress' | 'bull_run' | 'custom';
type TabId = 'scenarios' | 'results' | 'stress';

interface ScenarioConfig {
  id: ScenarioId;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
  apyMultiplier: number;
  volatility: number;
  durationMonths: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface PortfolioPosition {
  asset: string;
  product: string;
  color: string;
  amount: number;
  currentAPY: number;
  type: 'flexible' | 'locked';
  lockDays: number | null;
}

interface ScenarioResult {
  scenarioId: ScenarioId;
  baselineValue: number;
  scenarioValue: number;
  difference: number;
  differencePct: number;
  baselineInterest: number;
  scenarioInterest: number;
  interestDiff: number;
  maxDrawdown: number;
  recoveryMonths: number;
  monthlyData: { month: string; baseline: number; scenario: number; apyBaseline: number; apyScenario: number }[];
  assetImpact: { asset: string; color: string; baseInterest: number; scenarioInterest: number; diff: number }[];
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const MOCK_PORTFOLIO: PortfolioPosition[] = [
  { asset: 'USDT', product: 'USDT Linh hoạt', color: '#26A17B', amount: 3500, currentAPY: 4.5, type: 'flexible', lockDays: null },
  { asset: 'BTC', product: 'BTC Cố định 60D', color: '#F7931A', amount: 1350, currentAPY: 3.5, type: 'locked', lockDays: 60 },
  { asset: 'SOL', product: 'SOL Cố định 30D', color: '#9945FF', amount: 3250, currentAPY: 6.5, type: 'locked', lockDays: 30 },
  { asset: 'ETH', product: 'ETH Linh hoạt', color: '#627EEA', amount: 1400, currentAPY: 3.9, type: 'flexible', lockDays: null },
  { asset: 'AVAX', product: 'AVAX Cố định 90D', color: '#E84142', amount: 500, currentAPY: 7.2, type: 'locked', lockDays: 90 },
];

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'apy_crash', label: 'APY sụt giảm', desc: 'APY toàn bộ sản phẩm giảm 40-60% do thị trường lạnh',
    icon: TrendingDown, color: '#EF4444', apyMultiplier: 0.45, volatility: 0.15, durationMonths: 12,
    riskLevel: 'high',
  },
  {
    id: 'apy_spike', label: 'APY tăng vọt', desc: 'APY tăng 50-80% do nhu cầu vay tăng mạnh',
    icon: TrendingUp, color: '#10B981', apyMultiplier: 1.65, volatility: 0.2, durationMonths: 12,
    riskLevel: 'low',
  },
  {
    id: 'rate_cut', label: 'Cắt giảm lãi suất', desc: 'Ngân hàng trung ương cắt giảm lãi suất, APY on-chain giảm từ từ',
    icon: Snowflake, color: '#3B82F6', apyMultiplier: 0.7, volatility: 0.05, durationMonths: 12,
    riskLevel: 'medium',
  },
  {
    id: 'market_stress', label: 'Stress test', desc: 'Khủng hoảng thanh khoản — APY giảm mạnh, biến động cao, rủi ro phá sản',
    icon: CloudLightning, color: '#F59E0B', apyMultiplier: 0.25, volatility: 0.35, durationMonths: 6,
    riskLevel: 'extreme',
  },
  {
    id: 'bull_run', label: 'Bull market', desc: 'Thị trường tăng mạnh, APY tăng đều, thanh khoản dồi dào',
    icon: Flame, color: '#F97316', apyMultiplier: 2.0, volatility: 0.1, durationMonths: 12,
    riskLevel: 'low',
  },
  {
    id: 'custom', label: 'Tùy chỉnh', desc: 'Tự chỉnh APY multiplier và volatility theo ý bạn',
    icon: Sliders, color: '#8B5CF6', apyMultiplier: 1.0, volatility: 0.1, durationMonths: 12,
    riskLevel: 'medium',
  },
];

const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444', extreme: '#DC2626' };
const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', extreme: 'Cực cao' };

/* Deterministic scenario simulation */
function simulateScenario(portfolio: PortfolioPosition[], scenario: ScenarioConfig, customMultiplier?: number, customVol?: number): ScenarioResult {
  const totalValue = portfolio.reduce((s, p) => s + p.amount, 0);
  const mult = customMultiplier ?? scenario.apyMultiplier;
  const vol = customVol ?? scenario.volatility;
  const months = scenario.durationMonths;

  // Deterministic variance sequences
  const baseVariance = [0.02, -0.01, 0.03, -0.02, 0.01, -0.01, 0.02, -0.015, 0.025, -0.01, 0.015, -0.02];
  const scenarioVariance = [-0.05, 0.08, -0.12, 0.06, -0.03, 0.1, -0.08, 0.04, -0.06, 0.07, -0.04, 0.05];

  let baseValue = totalValue;
  let scenValue = totalValue;
  let baseCumInterest = 0;
  let scenCumInterest = 0;
  let maxValue = totalValue;
  let maxDrawdown = 0;
  let recoveryMonths = 0;
  let hasRecovered = true;

  const monthlyData: ScenarioResult['monthlyData'] = [];
  const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  // Weighted baseline APY
  const baselineAPY = portfolio.reduce((s, p) => s + p.currentAPY * p.amount / totalValue, 0);
  const scenarioAPY = baselineAPY * mult;

  for (let i = 0; i < months; i++) {
    const bVar = baseVariance[i % 12];
    const sVar = scenarioVariance[i % 12] * vol;

    const baseMonthlyRate = (baselineAPY / 100 / 12) * (1 + bVar);
    const scenMonthlyRate = (scenarioAPY / 100 / 12) * (1 + sVar);

    const baseInterest = baseValue * baseMonthlyRate;
    const scenInterest = scenValue * scenMonthlyRate;

    baseValue += baseInterest;
    scenValue += Math.max(scenInterest, -scenValue * 0.02); // floor: max 2% loss per month
    baseCumInterest += baseInterest;
    scenCumInterest += Math.max(scenInterest, 0);

    if (scenValue > maxValue) maxValue = scenValue;
    const dd = ((maxValue - scenValue) / maxValue) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (scenValue < totalValue && hasRecovered) { hasRecovered = false; recoveryMonths = 0; }
    if (!hasRecovered && scenValue >= totalValue) { hasRecovered = true; }
    if (!hasRecovered) recoveryMonths++;

    const monthStr = monthNames[i % 12] + '/' + (2026 + Math.floor(i / 12));
    monthlyData.push({
      month: monthStr,
      baseline: Math.round(baseValue * 100) / 100,
      scenario: Math.round(scenValue * 100) / 100,
      apyBaseline: Math.round((baselineAPY * (1 + bVar)) * 100) / 100,
      apyScenario: Math.round((scenarioAPY * (1 + sVar)) * 100) / 100,
    });
  }

  // Per-asset impact
  const assetImpact = portfolio.map(p => {
    const baseInt = p.amount * p.currentAPY / 100 * months / 12;
    const scenInt = p.amount * p.currentAPY * mult / 100 * months / 12;
    return {
      asset: p.asset, color: p.color,
      baseInterest: Math.round(baseInt * 100) / 100,
      scenarioInterest: Math.round(Math.max(scenInt, 0) * 100) / 100,
      diff: Math.round((scenInt - baseInt) * 100) / 100,
    };
  });

  return {
    scenarioId: scenario.id,
    baselineValue: Math.round(baseValue * 100) / 100,
    scenarioValue: Math.round(scenValue * 100) / 100,
    difference: Math.round((scenValue - baseValue) * 100) / 100,
    differencePct: Math.round(((scenValue - baseValue) / baseValue) * 10000) / 100,
    baselineInterest: Math.round(baseCumInterest * 100) / 100,
    scenarioInterest: Math.round(scenCumInterest * 100) / 100,
    interestDiff: Math.round((scenCumInterest - baseCumInterest) * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    recoveryMonths: hasRecovered ? 0 : recoveryMonths,
    monthlyData,
    assetImpact,
  };
}

/* ═══════════════════════════════════════════════════════════
   Impact Badge Component
   ═══════════════════════════════════════════════════════════ */

function ImpactBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
      style={{
        background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      }}>
      {isPositive ? <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" /> : <ArrowDownRight size={ICON_SIZE.sm} color="#EF4444" />}
      <span style={{
        color: isPositive ? '#10B981' : '#EF4444',
        fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
      }}>
        {isPositive ? '+' : ''}{value}{suffix}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */

export function SavingsWhatIfPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();

  /* State */
  const [tab, setTab] = useState<TabId>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('apy_crash');
  const [customMultiplier, setCustomMultiplier] = useState(1.0);
  const [customVolatility, setCustomVolatility] = useState(0.1);
  const [hasRun, setHasRun] = useState(false);
  const [showScenarioDetail, setShowScenarioDetail] = useState<ScenarioConfig | null>(null);
  const [showAssetImpact, setShowAssetImpact] = useState(false);

  /* Current portfolio */
  const totalPortfolioValue = MOCK_PORTFOLIO.reduce((s, p) => s + p.amount, 0);
  const weightedAPY = MOCK_PORTFOLIO.reduce((s, p) => s + p.currentAPY * p.amount / totalPortfolioValue, 0);

  /* Scenario config */
  const currentScenario = SCENARIOS.find(s => s.id === selectedScenario)!;
  const isCustom = selectedScenario === 'custom';

  /* Run simulation */
  const result = useMemo(() => {
    if (!hasRun) return null;
    return simulateScenario(
      MOCK_PORTFOLIO,
      currentScenario,
      isCustom ? customMultiplier : undefined,
      isCustom ? customVolatility : undefined,
    );
  }, [hasRun, selectedScenario, customMultiplier, customVolatility, currentScenario, isCustom]);

  /* Stress test: run all scenarios */
  const stressResults = useMemo(() => {
    if (tab !== 'stress') return [];
    return SCENARIOS.filter(s => s.id !== 'custom').map(s => ({
      scenario: s,
      result: simulateScenario(MOCK_PORTFOLIO, s),
    }));
  }, [tab]);

  const handleRun = useCallback(() => {
    hapticSuccess();
    setHasRun(true);
    setTab('results');
  }, [hapticSuccess]);

  const handleReset = useCallback(() => {
    hapticLight();
    setHasRun(false);
    setTab('scenarios');
  }, [hapticLight]);

  const TABS = [
    { id: 'scenarios' as const, label: 'Kịch bản' },
    { id: 'results' as const, label: 'Kết quả' },
    { id: 'stress' as const, label: 'Stress Test' },
  ];

  return (
    <PageLayout>
      {/* ─── Scenario Detail Sheet ─── */}
      <BottomSheetV2 open={!!showScenarioDetail} onClose={() => setShowScenarioDetail(null)} title="Chi tiết kịch bản">
        {showScenarioDetail && (() => {
          const s = showScenarioDetail;
          const Icon = s.icon;
          const effMult = s.id === 'custom' ? customMultiplier : s.apyMultiplier;
          const effVol = s.id === 'custom' ? customVolatility : s.volatility;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: s.color + '15', border: `2px solid ${s.color}30` }}>
                  <Icon size={ICON_SIZE.xl} color={s.color} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{s.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded"
                      style={{ background: RISK_COLORS[s.riskLevel] + '15', color: RISK_COLORS[s.riskLevel], fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                      Rủi ro: {RISK_LABELS[s.riskLevel]}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>{s.desc}</p>

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="APY thay đổi" value={`×${effMult.toFixed(2)} (${effMult >= 1 ? '+' : ''}${((effMult - 1) * 100).toFixed(0)}%)`}
                  valueColor={effMult >= 1 ? '#10B981' : '#EF4444'} />
                <BottomSheetRow label="Biến động" value={`${(effVol * 100).toFixed(0)}%`}
                  valueColor={effVol > 0.2 ? '#EF4444' : '#F59E0B'} />
                <BottomSheetRow label="Thời gian" value={`${s.durationMonths} tháng`} />
                <BottomSheetRow label="APY hiện tại" value={`${weightedAPY.toFixed(2)}%`} valueColor="#10B981" />
                <BottomSheetRow label="APY mô phỏng" value={`${(weightedAPY * effMult).toFixed(2)}%`}
                  valueColor={effMult >= 1 ? '#10B981' : '#EF4444'} />
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Asset Impact Sheet ─── */}
      <BottomSheetV2 open={showAssetImpact} onClose={() => setShowAssetImpact(false)} title="Ảnh hưởng theo tài sản">
        {result && (
          <div className="flex flex-col gap-3">
            {result.assetImpact.map(ai => (
              <div key={ai.asset} className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: ai.color + '22' }}>
                    <span style={{ color: ai.color, fontSize: 8, fontWeight: FONT_WEIGHT.bold }}>{ai.asset}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{ai.asset}</span>
                  <ImpactBadge value={ai.diff} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p style={{ color: c.text3, fontSize: 9 }}>Lãi cơ bản</p>
                    <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{fmtUsd(ai.baseInterest)}</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 9 }}>Lãi kịch bản</p>
                    <p style={{ color: ai.diff >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                      {fmtUsd(ai.scenarioInterest)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 9 }}>Chênh lệch</p>
                    <p style={{ color: ai.diff >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {ai.diff >= 0 ? '+' : ''}{fmtUsd(ai.diff)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheetV2>

      {/* ─── Header ─── */}
      <Header title="What-If Analysis" back />

      {/* ─── Hero ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={ICON_SIZE.base} color="#F59E0B" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Scenario Planner</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Danh mục hiện tại</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {fmtUsd(totalPortfolioValue)}
            </p>
          </div>
          {hasRun && result && (
            <div className="text-right">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Giá trị kịch bản</p>
              <p style={{
                color: result.difference >= 0 ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace',
              }}>
                {fmtUsd(result.scenarioValue)}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY hiện tại</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{weightedAPY.toFixed(1)}%</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tài sản</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{MOCK_PORTFOLIO.length}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Kịch bản</p>
            <p style={{ color: currentScenario.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{currentScenario.label}</p>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as TabId)} />
      </div>

      {/* ═══ Scenarios Tab ═══ */}
      {tab === 'scenarios' && (
        <PageContent padding="compact" gap="default">
          {/* Scenario selection */}
          <PageSection label="Chọn kịch bản">
            <div className="flex flex-col gap-2">
              {SCENARIOS.map(s => {
                const Icon = s.icon;
                return (
                  <button key={s.id}
                    onClick={() => { setSelectedScenario(s.id); hapticSelection(); }}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left"
                    style={{
                      background: selectedScenario === s.id ? s.color + '10' : c.surface2,
                      border: `1.5px solid ${selectedScenario === s.id ? s.color + '40' : 'transparent'}`,
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: selectedScenario === s.id ? s.color + '22' : c.borderSolid + '66' }}>
                      <Icon size={ICON_SIZE.sm} color={selectedScenario === s.id ? s.color : c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{s.label}</span>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: RISK_COLORS[s.riskLevel] + '15', color: RISK_COLORS[s.riskLevel], fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {RISK_LABELS[s.riskLevel]}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4 }}>{s.desc}</p>
                      {s.id !== 'custom' && (
                        <div className="flex items-center gap-3 mt-2">
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            APY: {s.apyMultiplier >= 1 ? '+' : ''}{((s.apyMultiplier - 1) * 100).toFixed(0)}%
                          </span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Vol: {(s.volatility * 100).toFixed(0)}%</span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{s.durationMonths}M</span>
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowScenarioDetail(s); hapticLight(); }}
                      className="p-1.5 rounded-lg shrink-0 mt-1"
                      style={{ background: c.borderSolid + '44' }}>
                      <Eye size={ICON_SIZE.sm} color={c.text3} />
                    </button>
                  </button>
                );
              })}
            </div>
          </PageSection>

          {/* Custom parameters */}
          {isCustom && (
            <PageSection label="Tham số tùy chỉnh">
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>APY multiplier</span>
                    <span style={{ color: customMultiplier >= 1 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      ×{customMultiplier.toFixed(2)} ({customMultiplier >= 1 ? '+' : ''}{((customMultiplier - 1) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <input type="range" min={0.1} max={3.0} step={0.05} value={customMultiplier}
                    onChange={e => setCustomMultiplier(Number(e.target.value))}
                    className="w-full" style={{ height: 4, accentColor: '#8B5CF6' }} />
                  <div className="flex justify-between mt-1">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>×0.1 (giảm 90%)</span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>×3.0 (tăng 200%)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Biến động</span>
                    <span style={{ color: customVolatility > 0.2 ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {(customVolatility * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input type="range" min={0} max={0.5} step={0.01} value={customVolatility}
                    onChange={e => setCustomVolatility(Number(e.target.value))}
                    className="w-full" style={{ height: 4, accentColor: '#F59E0B' }} />
                  <div className="flex justify-between mt-1">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>0% (ổn định)</span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>50% (cực kỳ biến động)</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY hiện tại</p>
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{weightedAPY.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY mô phỏng</p>
                      <p style={{ color: customMultiplier >= 1 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                        {(weightedAPY * customMultiplier).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>
          )}

          {/* Current portfolio summary */}
          <PageSection label="Danh mục hiện tại">
            <TrCard className="p-4">
              <div className="flex flex-col gap-2">
                {MOCK_PORTFOLIO.map(p => (
                  <div key={p.asset} className="flex items-center gap-3 py-1.5"
                    style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: p.color + '22' }}>
                      <span style={{ color: p.color, fontSize: 8, fontWeight: FONT_WEIGHT.bold }}>{p.asset}</span>
                    </div>
                    <div className="flex-1">
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{p.product}</span>
                    </div>
                    <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>{fmtUsd(p.amount)}</span>
                    <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{p.currentAPY}%</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Đây là mô phỏng giả định. Kết quả thực tế phụ thuộc vào nhiều yếu tố không thể dự đoán.
              Không phải lời khuyên đầu tư.
            </p>
          </div>

          {/* Run CTA */}
          <CTAButton onClick={handleRun}>
            <Play size={ICON_SIZE.sm} className="mr-2 inline" />
            Chạy mô phỏng · {currentScenario.label}
          </CTAButton>
        </PageContent>
      )}

      {/* ═══ Results Tab ═══ */}
      {tab === 'results' && (
        <PageContent padding="compact" gap="default">
          {!result ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Activity size={ICON_SIZE.xl} color={c.text3} />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa chạy mô phỏng</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Chọn kịch bản và bấm "Chạy mô phỏng" để xem kết quả.
              </p>
              <button onClick={() => { setTab('scenarios'); hapticSelection(); }}
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Chọn kịch bản
              </button>
            </div>
          ) : (
            <>
              {/* Impact summary */}
              <TrCard className="p-4" accentBorder={result.difference >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}>
                <div className="flex items-center gap-2 mb-3">
                  {React.createElement(currentScenario.icon, { size: ICON_SIZE.sm, color: currentScenario.color })}
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Kịch bản: {currentScenario.label}</span>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ background: RISK_COLORS[currentScenario.riskLevel] + '15', color: RISK_COLORS[currentScenario.riskLevel], fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                    {RISK_LABELS[currentScenario.riskLevel]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá trị cơ bản</p>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {fmtUsd(result.baselineValue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl"
                    style={{ background: result.difference >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá trị kịch bản</p>
                    <p style={{ color: result.difference >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {fmtUsd(result.scenarioValue)}
                    </p>
                    <ImpactBadge value={result.differencePct} suffix="%" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Chênh lệch lãi</p>
                    <p style={{ color: result.interestDiff >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {result.interestDiff >= 0 ? '+' : ''}{fmtUsd(result.interestDiff)}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Max Drawdown</p>
                    <p style={{ color: result.maxDrawdown > 1 ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {result.maxDrawdown.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hồi phục</p>
                    <p style={{ color: result.recoveryMonths === 0 ? '#10B981' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {result.recoveryMonths === 0 ? 'Không mất' : `${result.recoveryMonths}M`}
                    </p>
                  </div>
                </div>
              </TrCard>

              {/* Value comparison chart */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>So sánh tăng trưởng</span>
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <ChartGradientDefs key="gradient-defs" gradients={[
                        { id: 'fillBaseline', color: '#6B7280', opacityFrom: 0.1 },
                        { id: 'fillScenario', color: currentScenario.color, opacityFrom: 0.2 },
                      ]} />
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                      <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`,
                          name === 'baseline' ? 'Cơ bản' : 'Kịch bản'
                        ]} />
                      <ReferenceLine key="ref" y={totalPortfolioValue} stroke="#9CA3AF" strokeDasharray="4 4" />
                      <Area key="area-baseline" type="monotone" dataKey="baseline" stroke="#6B7280" strokeWidth={1.5}
                        fill="url(#fillBaseline)" name="baseline" strokeDasharray="4 4" />
                      <Area key="area-scenario" type="monotone" dataKey="scenario" stroke={currentScenario.color}
                        strokeWidth={2} fill="url(#fillScenario)" name="scenario" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5" style={{ background: '#6B7280', borderBottom: '1px dashed #6B7280' }} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Cơ bản</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5" style={{ background: currentScenario.color }} />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{currentScenario.label}</span>
                  </div>
                </div>
              </TrCard>

              {/* APY comparison chart */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={ICON_SIZE.sm} color="#10B981" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>APY hiệu quả theo tháng</span>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                      <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name === 'apyBaseline' ? 'APY cơ bản' : 'APY kịch bản']} />
                      <Line key="line-base" type="monotone" dataKey="apyBaseline" stroke="#6B7280"
                        strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="apyBaseline" />
                      <Line key="line-scen" type="monotone" dataKey="apyScenario" stroke={currentScenario.color}
                        strokeWidth={2} dot={false} name="apyScenario" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TrCard>

              {/* Interest comparison */}
              <div className="grid grid-cols-2 gap-3">
                <TrCard className="p-3">
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lãi cơ bản</p>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                    +{fmtUsd(result.baselineInterest)}
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 4 }}>{currentScenario.durationMonths} tháng</p>
                </TrCard>
                <TrCard className="p-3">
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lãi kịch bản</p>
                  <p style={{ color: result.scenarioInterest >= result.baselineInterest ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                    {result.scenarioInterest >= 0 ? '+' : ''}{fmtUsd(result.scenarioInterest)}
                  </p>
                  <ImpactBadge value={result.interestDiff} />
                </TrCard>
              </div>

              {/* Asset impact link */}
              <button onClick={() => { setShowAssetImpact(true); hapticSelection(); }}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <div className="flex items-center gap-2">
                  <Layers size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Ảnh hưởng theo từng tài sản</span>
                </div>
                <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
              </button>

              {/* Actions */}
              <div className="flex gap-2">
                <CTAButton variant="secondary" onClick={handleReset} className="flex-1">
                  <RotateCcw size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Đổi kịch bản
                </CTAButton>
                <CTAButton onClick={() => { setTab('stress'); hapticSelection(); }} className="flex-1">
                  <CloudLightning size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Stress Test
                </CTAButton>
              </div>
            </>
          )}
        </PageContent>
      )}

      {/* ═══ Stress Test Tab ═══ */}
      {tab === 'stress' && (
        <PageContent padding="compact" gap="default">
          {/* Stress overview */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CloudLightning size={ICON_SIZE.sm} color="#F59E0B" />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Stress Test tổng hợp</span>
            </div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 12 }}>
              Chạy tất cả kịch bản đồng thời để so sánh ảnh hưởng lên danh mục hiện tại ({fmtUsd(totalPortfolioValue)}).
            </p>

            {/* Comparison chart */}
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                    type="category" allowDuplicatedCategory={false} />
                  <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                  <ReferenceLine key="ref" y={totalPortfolioValue} stroke="#9CA3AF" strokeDasharray="4 4" />
                  {stressResults.map(sr => (
                    <Line key={sr.scenario.id} data={sr.result.monthlyData} type="monotone" dataKey="scenario"
                      name={sr.scenario.label} stroke={sr.scenario.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {stressResults.map(sr => (
                <div key={sr.scenario.id} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: sr.scenario.color }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{sr.scenario.label}</span>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Ranked results */}
          <PageSection label="Xếp hạng theo ảnh hưởng">
            <div className="flex flex-col gap-3">
              {[...stressResults].sort((a, b) => b.result.difference - a.result.difference).map((sr, idx) => {
                const Icon = sr.scenario.icon;
                const r = sr.result;
                const isPositive = r.difference >= 0;
                return (
                  <TrCard key={sr.scenario.id} className="p-4"
                    accentBorder={idx === 0 ? 'rgba(16,185,129,0.3)' : idx === stressResults.length - 1 ? 'rgba(239,68,68,0.3)' : undefined}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: sr.scenario.color + '15' }}>
                        <Icon size={ICON_SIZE.base} color={sr.scenario.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{sr.scenario.label}</span>
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: RISK_COLORS[sr.scenario.riskLevel] + '15', color: RISK_COLORS[sr.scenario.riskLevel], fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {RISK_LABELS[sr.scenario.riskLevel]}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.3 }}>{sr.scenario.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                          {isPositive ? '+' : ''}{r.differencePct}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 8 }}>Giá trị cuối</p>
                        <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                          {fmtUsd(r.scenarioValue)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 8 }}>Chênh lệch</p>
                        <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                          {isPositive ? '+' : ''}{fmtUsd(r.difference)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 8 }}>Drawdown</p>
                        <p style={{ color: r.maxDrawdown > 1 ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {r.maxDrawdown.toFixed(2)}%
                        </p>
                      </div>
                      <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 8 }}>Hồi phục</p>
                        <p style={{ color: r.recoveryMonths === 0 ? '#10B981' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {r.recoveryMonths === 0 ? '—' : `${r.recoveryMonths}M`}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>

          {/* Resilience score */}
          {(() => {
            const worstCase = [...stressResults].sort((a, b) => a.result.difference - b.result.difference)[0];
            const bestCase = [...stressResults].sort((a, b) => b.result.difference - a.result.difference)[0];
            const avgDiff = stressResults.reduce((s, sr) => s + sr.result.differencePct, 0) / stressResults.length;
            const resilienceScore = Math.max(0, Math.min(100, 50 + avgDiff * 5));
            const resColor = resilienceScore >= 60 ? '#10B981' : resilienceScore >= 40 ? '#F59E0B' : '#EF4444';

            return (
              <TrCard className="p-4" accentBorder={`${resColor}40`}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={ICON_SIZE.sm} color={resColor} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Đánh giá chống chịu</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: `conic-gradient(${resColor} ${resilienceScore}%, ${c.borderSolid} ${resilienceScore}%)` }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: c.surface }}>
                      <span style={{ color: resColor, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{Math.round(resilienceScore)}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                      {resilienceScore >= 60 ? 'Danh mục chống chịu tốt' : resilienceScore >= 40 ? 'Cần cải thiện' : 'Rủi ro cao'}
                    </p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginTop: 4 }}>
                      Trường hợp xấu nhất ({worstCase.scenario.label}): {worstCase.result.differencePct.toFixed(1)}%.
                      Trường hợp tốt nhất ({bestCase.scenario.label}): +{bestCase.result.differencePct.toFixed(1)}%.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>TB ảnh hưởng</p>
                    <p style={{ color: avgDiff >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {avgDiff >= 0 ? '+' : ''}{avgDiff.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Xấu nhất</p>
                    <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {worstCase.result.differencePct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tốt nhất</p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      +{bestCase.result.differencePct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </TrCard>
            );
          })()}

          {/* Recommendations */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Sparkles size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>Gợi ý tăng kháng chịu</p>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                Đa dạng hóa tài sản và pha trộn sản phẩm linh hoạt với cố định giúp giảm rủi ro trong kịch bản bất lợi.
                Cần nhắc tăng tỷ trọng trong stablecoin để đảm bảo ổn định.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Stress test chỉ là mô phỏng giả định. Thị trường thực tế có thể biến động hoàn toàn khác biệt.
              Không sử dụng kết quả này làm cơ sở duy nhất cho quyết định tài chính.
            </p>
          </div>
        </PageContent>
      )}
    </PageLayout>
  );
}