import React, { useState, useMemo, useCallback } from 'react';
import {
  Lock, Unlock, TrendingUp, ChevronRight, ChevronDown, ChevronUp,
  AlertTriangle, Shield, Info, X, Plus, CheckCircle, Sliders,
  PiggyBank, Zap, DollarSign, Calendar, Target, Sparkles,
  ArrowUpRight, Layers, Clock, BarChart3, Trash2, Edit3,
  ArrowRight, GripVertical, Eye,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface LadderRung {
  id: string;
  product: string;
  asset: string;
  color: string;
  lockDays: number;
  apy: number;
  amount: number;
  maturityDate: string;
  startDate: string;
  autoRenew: boolean;
}

type LadderPreset = 'monthly' | 'quarterly' | 'biannual' | 'custom';
type LadderView = 'builder' | 'timeline' | 'analysis';

interface LadderTemplate {
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
  intervals: { lockDays: number; pctAlloc: number; product: string; asset: string; color: string; apy: number }[];
}

/* ═══════════════════════════════════════════════════════════
   Mock Data & Templates
   ═══════════════════════════════════════════════════════════ */

const AVAILABLE_PRODUCTS = [
  { id: 'lp1', product: 'USDT Cố định 30D', asset: 'USDT', color: '#26A17B', lockDays: 30, apy: 5.2 },
  { id: 'lp2', product: 'USDT Cố định 60D', asset: 'USDT', color: '#22C55E', lockDays: 60, apy: 5.8 },
  { id: 'lp3', product: 'USDT Cố định 90D', asset: 'USDT', color: '#10B981', lockDays: 90, apy: 6.5 },
  { id: 'lp4', product: 'BTC Cố định 30D', asset: 'BTC', color: '#F7931A', lockDays: 30, apy: 2.8 },
  { id: 'lp5', product: 'BTC Cố định 60D', asset: 'BTC', color: '#E8A317', lockDays: 60, apy: 3.5 },
  { id: 'lp6', product: 'BTC Cố định 90D', asset: 'BTC', color: '#D4941A', lockDays: 90, apy: 4.0 },
  { id: 'lp7', product: 'ETH Cố định 30D', asset: 'ETH', color: '#627EEA', lockDays: 30, apy: 3.2 },
  { id: 'lp8', product: 'ETH Cố định 60D', asset: 'ETH', color: '#4F6BD6', lockDays: 60, apy: 3.9 },
  { id: 'lp9', product: 'SOL Cố định 30D', asset: 'SOL', color: '#9945FF', lockDays: 30, apy: 6.5 },
  { id: 'lp10', product: 'SOL Cố định 90D', asset: 'SOL', color: '#7C3AED', lockDays: 90, apy: 7.5 },
  { id: 'lp11', product: 'AVAX Cố định 60D', asset: 'AVAX', color: '#E84142', lockDays: 60, apy: 6.8 },
  { id: 'lp12', product: 'AVAX Cố định 90D', asset: 'AVAX', color: '#D63030', lockDays: 90, apy: 7.2 },
];

const LADDER_TEMPLATES: Record<LadderPreset, LadderTemplate> = {
  monthly: {
    label: 'Thang hóa hằng tháng',
    desc: 'Mỗi tháng có 1 rung đáo hạn, đảm bảo thanh khoản liên tục.',
    icon: Calendar, color: '#10B981',
    intervals: [
      { lockDays: 30, pctAlloc: 33, product: 'USDT Cố định 30D', asset: 'USDT', color: '#26A17B', apy: 5.2 },
      { lockDays: 60, pctAlloc: 33, product: 'USDT Cố định 60D', asset: 'USDT', color: '#22C55E', apy: 5.8 },
      { lockDays: 90, pctAlloc: 34, product: 'USDT Cố định 90D', asset: 'USDT', color: '#10B981', apy: 6.5 },
    ],
  },
  quarterly: {
    label: 'Đáo hạn theo quý',
    desc: 'Tối ưu APY với chu kỳ 3 tháng, phù hợp vốn trung hạn.',
    icon: BarChart3, color: '#3B82F6',
    intervals: [
      { lockDays: 90, pctAlloc: 25, product: 'USDT Cố định 90D', asset: 'USDT', color: '#10B981', apy: 6.5 },
      { lockDays: 90, pctAlloc: 25, product: 'BTC Cố định 90D', asset: 'BTC', color: '#D4941A', apy: 4.0 },
      { lockDays: 90, pctAlloc: 25, product: 'SOL Cố định 90D', asset: 'SOL', color: '#7C3AED', apy: 7.5 },
      { lockDays: 90, pctAlloc: 25, product: 'AVAX Cố định 90D', asset: 'AVAX', color: '#D63030', apy: 7.2 },
    ],
  },
  biannual: {
    label: 'Ladder 6 tháng',
    desc: 'Chia đều vốn thành 6 bậc, mỗi tháng 1 bậc đáo hạn.',
    icon: Layers, color: '#8B5CF6',
    intervals: [
      { lockDays: 30, pctAlloc: 17, product: 'USDT Cố định 30D', asset: 'USDT', color: '#26A17B', apy: 5.2 },
      { lockDays: 60, pctAlloc: 17, product: 'USDT Cố định 60D', asset: 'USDT', color: '#22C55E', apy: 5.8 },
      { lockDays: 90, pctAlloc: 17, product: 'USDT Cố định 90D', asset: 'USDT', color: '#10B981', apy: 6.5 },
      { lockDays: 30, pctAlloc: 16, product: 'BTC Cố định 30D', asset: 'BTC', color: '#F7931A', apy: 2.8 },
      { lockDays: 60, pctAlloc: 16, product: 'ETH Cố định 60D', asset: 'ETH', color: '#4F6BD6', apy: 3.9 },
      { lockDays: 90, pctAlloc: 17, product: 'SOL Cố định 90D', asset: 'SOL', color: '#7C3AED', apy: 7.5 },
    ],
  },
  custom: {
    label: 'Tùy chỉnh',
    desc: 'Tự tạo ladder theo ý muốn của bạn.',
    icon: Sliders, color: '#F59E0B',
    intervals: [],
  },
};

function addDays(fromStr: string, days: number): string {
  const parts = fromStr.split('/');
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const TODAY = '09/03/2026';

function generateRungs(template: LadderTemplate, totalAmount: number): LadderRung[] {
  if (template.intervals.length === 0) return [];
  return template.intervals.map((iv, i) => ({
    id: `rung-${i + 1}`,
    product: iv.product,
    asset: iv.asset,
    color: iv.color,
    lockDays: iv.lockDays,
    apy: iv.apy,
    amount: Math.round(totalAmount * iv.pctAlloc / 100 * 100) / 100,
    maturityDate: addDays(TODAY, iv.lockDays + i * 30),
    startDate: TODAY,
    autoRenew: true,
  }));
}

/* ═══════════════════════════════════════════════════════════
   Ladder Timeline Visualization
   ═══════════════════════════════════════════════════════════ */

function LadderTimeline({ rungs }: { rungs: LadderRung[] }) {
  const c = useThemeColors();
  if (rungs.length === 0) return null;

  const allDays = rungs.map(r => r.lockDays);
  const maxDay = Math.max(...allDays, 90);

  const sorted = [...rungs].sort((a, b) => a.lockDays - b.lockDays);

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hôm nay</span>
        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{maxDay}D</span>
      </div>

      {sorted.map((rung, i) => {
        const widthPct = (rung.lockDays / maxDay) * 100;
        return (
          <div key={rung.id} className="flex items-center gap-2 h-8">
            {/* Asset label */}
            <div className="w-14 shrink-0 text-right">
              <span style={{ color: rung.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>{rung.asset}</span>
              <span style={{ color: c.text3, fontSize: 9, marginLeft: 2 }}>{rung.lockDays}D</span>
            </div>
            {/* Bar */}
            <div className="flex-1 relative h-5">
              <div className="absolute inset-y-0 left-0 h-full rounded-r-lg flex items-center px-2"
                style={{
                  width: `${Math.max(widthPct, 15)}%`,
                  background: `linear-gradient(90deg, ${rung.color}25, ${rung.color}50)`,
                  border: `1px solid ${rung.color}40`,
                }}>
                <span style={{ color: rung.color, fontSize: 9, fontWeight: FONT_WEIGHT.bold, whiteSpace: 'nowrap' }}>
                  {fmtUsd(rung.amount)} · {rung.apy}%
                </span>
              </div>
              {/* Maturity marker */}
              <div className="absolute top-0 bottom-0 w-0.5"
                style={{ left: `${widthPct}%`, background: rung.color }} />
            </div>
          </div>
        );
      })}

      {/* Maturity dates */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {sorted.map(rung => (
          <div key={rung.id} className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: rung.color + '10', border: `1px solid ${rung.color}20` }}>
            <Calendar size={9} color={rung.color} />
            <span style={{ color: rung.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>{rung.maturityDate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */

export function SavingsLadderPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess, hapticHeavy } = useHaptic();

  /* State */
  const [tab, setTab] = useState<LadderView>('builder');
  const [preset, setPreset] = useState<LadderPreset>('monthly');
  const [totalAmount, setTotalAmount] = useState(10000);
  const [rungs, setRungs] = useState<LadderRung[]>(() =>
    generateRungs(LADDER_TEMPLATES.monthly, 10000)
  );
  const [showRungDetail, setShowRungDetail] = useState<LadderRung | null>(null);
  const [showAddRung, setShowAddRung] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showToast, setShowToast] = useState<{ msg: string; color: string } | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  /* Computed */
  const totalAllocated = rungs.reduce((s, r) => s + r.amount, 0);
  const unallocated = totalAmount - totalAllocated;
  const weightedAPY = rungs.length > 0
    ? rungs.reduce((s, r) => s + r.apy * r.amount, 0) / totalAllocated
    : 0;
  const estimatedAnnualInterest = rungs.reduce((s, r) => s + r.amount * r.apy / 100, 0);
  const nextMaturity = rungs.length > 0
    ? [...rungs].sort((a, b) => a.lockDays - b.lockDays)[0]
    : null;
  const totalRungs = rungs.length;
  const avgLockDays = rungs.length > 0
    ? Math.round(rungs.reduce((s, r) => s + r.lockDays, 0) / rungs.length)
    : 0;

  /* Liquidity score (0-100): more frequent maturities = higher liquidity */
  const liquidityScore = useMemo(() => {
    if (rungs.length === 0) return 0;
    const uniqueDays = new Set(rungs.map(r => r.lockDays)).size;
    const shortTermPct = rungs.filter(r => r.lockDays <= 30).reduce((s, r) => s + r.amount, 0) / totalAllocated * 100;
    const diversityScore = Math.min(uniqueDays / 3 * 40, 40);
    const shortTermScore = Math.min(shortTermPct / 40 * 30, 30);
    const spreadScore = Math.min(rungs.length / 6 * 30, 30);
    return Math.round(diversityScore + shortTermScore + spreadScore);
  }, [rungs, totalAllocated]);

  const liquidityColor = liquidityScore >= 70 ? '#10B981' : liquidityScore >= 40 ? '#F59E0B' : '#EF4444';
  const liquidityLabel = liquidityScore >= 70 ? 'Cao' : liquidityScore >= 40 ? 'Trung bình' : 'Thấp';

  /* Handlers */
  const handlePresetChange = useCallback((p: LadderPreset) => {
    setPreset(p);
    hapticSelection();
    if (p !== 'custom') {
      setRungs(generateRungs(LADDER_TEMPLATES[p], totalAmount));
    }
  }, [totalAmount, hapticSelection]);

  const handleAmountChange = useCallback((val: number) => {
    setTotalAmount(val);
    if (preset !== 'custom') {
      setRungs(generateRungs(LADDER_TEMPLATES[preset], val));
    }
  }, [preset]);

  const handleRemoveRung = useCallback((id: string) => {
    setRungs(prev => prev.filter(r => r.id !== id));
    hapticHeavy();
  }, [hapticHeavy]);

  const handleToggleAutoRenew = useCallback((id: string) => {
    setRungs(prev => prev.map(r => r.id === id ? { ...r, autoRenew: !r.autoRenew } : r));
    hapticLight();
  }, [hapticLight]);

  const handleAddProduct = useCallback((product: typeof AVAILABLE_PRODUCTS[0]) => {
    const newRung: LadderRung = {
      id: `rung-${Date.now()}`,
      product: product.product,
      asset: product.asset,
      color: product.color,
      lockDays: product.lockDays,
      apy: product.apy,
      amount: Math.round(Math.max(unallocated, 100) * 100) / 100,
      maturityDate: addDays(TODAY, product.lockDays),
      startDate: TODAY,
      autoRenew: true,
    };
    setRungs(prev => [...prev, newRung]);
    setShowAddRung(false);
    setPreset('custom');
    hapticSuccess();
  }, [unallocated, hapticSuccess]);

  const handleConfirmLadder = useCallback(() => {
    setShowConfirmSheet(false);
    hapticSuccess();
    setShowToast({ msg: 'Ladder đã được tạo thành công!', color: '#10B981' });
    setTimeout(() => setShowToast(null), 3000);
  }, [hapticSuccess]);

  const TABS = [
    { id: 'builder' as const, label: 'Xây dựng' },
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'analysis' as const, label: 'Phân tích' },
  ];

  return (
    <PageLayout variant={showConfirmSheet ? 'default' : 'default'}>
      {/* ─── Rung Detail Sheet ─── */}
      <BottomSheetV2 open={!!showRungDetail} onClose={() => setShowRungDetail(null)} title="Chi tiết bậc ladder">
        {showRungDetail && (() => {
          const r = showRungDetail;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: r.color + '22', border: `2px solid ${r.color}44` }}>
                  <span style={{ color: r.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{r.asset}</span>
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{r.product}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Lock size={ICON_SIZE.sm} color="#F59E0B" />
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Cố định {r.lockDays} ngày</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Số tiền" value={fmtUsd(r.amount)} />
                <BottomSheetRow label="APY" value={`${r.apy}%`} valueColor="#10B981" />
                <BottomSheetRow label="Ngày bắt đầu" value={r.startDate} />
                <BottomSheetRow label="Ngày đáo hạn" value={r.maturityDate} valueColor="#F59E0B" />
                <BottomSheetRow label="Dự kiến lãi" value={fmtUsd(r.amount * r.apy / 100 * r.lockDays / 365)} valueColor="#10B981" />
                <BottomSheetRow label="Tự động gia hạn" value={r.autoRenew ? 'Bật' : 'Tắt'}
                  valueColor={r.autoRenew ? '#10B981' : '#EF4444'} />
              </div>

              {r.autoRenew && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
                  <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                    Khi đáo hạn, vốn + lãi sẽ tự động gửi lại cùng sản phẩm với APY tại thời điểm đó.
                    Bạn có thể tắt tự động gia hạn bất kỳ lúc nào trước ngày đáo hạn.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <CTAButton variant="secondary" onClick={() => { handleRemoveRung(r.id); setShowRungDetail(null); }} className="flex-1">
                  <Trash2 size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Xóa bậc
                </CTAButton>
                <CTAButton onClick={() => { handleToggleAutoRenew(r.id); setShowRungDetail(null); }} className="flex-1">
                  {r.autoRenew ? 'Tắt gia hạn' : 'Bật gia hạn'}
                </CTAButton>
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Add Rung Sheet ─── */}
      <BottomSheetV2 open={showAddRung} onClose={() => setShowAddRung(false)} title="Thêm bậc ladder">
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {/* Group by asset */}
          {['USDT', 'BTC', 'ETH', 'SOL', 'AVAX'].map(asset => {
            const products = AVAILABLE_PRODUCTS.filter(p => p.asset === asset);
            if (products.length === 0) return null;
            const isExpanded = expandedProduct === asset;
            return (
              <div key={asset}>
                <button onClick={() => { setExpandedProduct(isExpanded ? null : asset); hapticLight(); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl"
                  style={{ background: c.surface2 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: products[0].color + '22' }}>
                      <span style={{ color: products[0].color, fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>{asset}</span>
                    </div>
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{asset}</span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{products.length} sản phẩm</span>
                  </div>
                  {isExpanded ? <ChevronUp size={ICON_SIZE.sm} color={c.text3} /> : <ChevronDown size={ICON_SIZE.sm} color={c.text3} />}
                </button>
                {isExpanded && (
                  <div className="flex flex-col gap-1.5 mt-1.5 pl-2">
                    {products.map(prod => {
                      const alreadyAdded = rungs.some(r => r.product === prod.product);
                      return (
                        <button key={prod.id}
                          onClick={() => !alreadyAdded && handleAddProduct(prod)}
                          disabled={alreadyAdded}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{
                            background: alreadyAdded ? c.surface2 : prod.color + '08',
                            border: `1px solid ${alreadyAdded ? c.borderSolid : prod.color + '25'}`,
                            opacity: alreadyAdded ? 0.5 : 1,
                          }}>
                          <div className="flex items-center gap-2">
                            <Lock size={ICON_SIZE.sm} color={prod.color} />
                            <div>
                              <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{prod.product}</span>
                              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginLeft: 6 }}>{prod.lockDays}D</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{prod.apy}%</span>
                            {alreadyAdded
                              ? <CheckCircle size={ICON_SIZE.sm} color="#10B981" />
                              : <Plus size={ICON_SIZE.sm} color={prod.color} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </BottomSheetV2>

      {/* ─── Confirm Sheet ─── */}
      <BottomSheetV2 open={showConfirmSheet} onClose={() => setShowConfirmSheet(false)} title="Xác nhận tạo Ladder">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Tổng vốn" value={fmtUsd(totalAllocated)} />
            <BottomSheetRow label="Số bậc" value={`${rungs.length}`} />
            <BottomSheetRow label="APY bình quân" value={`${weightedAPY.toFixed(2)}%`} valueColor="#10B981" />
            <BottomSheetRow label="Lãi dự kiến/năm" value={fmtUsd(estimatedAnnualInterest)} valueColor="#10B981" />
            <BottomSheetRow label="Đáo hạn gần nhất" value={nextMaturity?.maturityDate ?? '-'} valueColor="#F59E0B" />
            <BottomSheetRow label="Thanh khoản" value={`${liquidityScore}/100 (${liquidityLabel})`} valueColor={liquidityColor} />
          </div>

          {/* Rung summary */}
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {rungs.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 py-1.5 px-1"
                style={{ borderBottom: `1px solid ${c.divider}` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: r.color + '22' }}>
                  <span style={{ color: r.color, fontSize: 8, fontWeight: FONT_WEIGHT.bold }}>{i + 1}</span>
                </div>
                <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, flex: 1 }}>{r.product}</span>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{fmtUsd(r.amount)}</span>
                <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro, fontFamily: 'monospace' }}>{r.apy}%</span>
              </div>
            ))}
          </div>

          {unallocated > 1 && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
                Còn {fmtUsd(unallocated)} chưa được phân bổ. Bạn có muốn thêm bậc hoặc điều chỉnh không?
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 p-2.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
              Sản phẩm cố định không thể rút sớm hoặc sẽ mất lãi nếu rút trước hạn.
              APY có thể thay đổi khi gia hạn. Đây không phải lời khuyên đầu tư.
            </p>
          </div>

          <CTAButton onClick={handleConfirmLadder}>
            <CheckCircle size={ICON_SIZE.sm} className="mr-2 inline" />
            Xác nhận tạo {rungs.length} bậc Ladder
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* ─── Toast ─── */}
      {showToast && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${showToast.color}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={ICON_SIZE.md} color={showToast.color} />
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, flex: 1 }}>{showToast.msg}</p>
          <button onClick={() => setShowToast(null)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="Maturity Ladder" back />

      {/* ─── Hero ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={ICON_SIZE.base} color="#8B5CF6" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Staggered Maturity Builder</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Tổng vốn phân bổ</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {fmtUsd(totalAllocated)}
            </p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Dự kiến lãi/năm</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              +{fmtUsd(estimatedAnnualInterest)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Số bậc</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{totalRungs}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY TB</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{weightedAPY.toFixed(1)}%</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Thanh khoản</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: liquidityColor }} />
              <p style={{ color: liquidityColor, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{liquidityScore}</p>
            </div>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as LadderView)} />
      </div>

      {/* ═══ Builder Tab ═══ */}
      {tab === 'builder' && (
        <PageContent padding="compact" gap="default">
          {/* Total amount */}
          <PageSection label="Tổng vốn (USD)">
            <div className="flex items-center gap-3 rounded-2xl px-4"
              style={{ background: c.surface2, border: '1.5px solid rgba(139,92,246,0.3)', height: 52, borderRadius: 14 }}>
              <DollarSign size={ICON_SIZE.base} color="#8B5CF6" />
              <input type="number" inputMode="decimal" value={totalAmount}
                onChange={e => handleAmountChange(Math.max(100, Number(e.target.value) || 0))}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.base, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.bold }} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.sm }}>USD</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[5000, 10000, 25000, 50000].map(v => (
                <button key={v} onClick={() => { handleAmountChange(v); hapticLight(); }}
                  className="flex-1 py-1.5 rounded-xl text-xs"
                  style={{
                    background: totalAmount === v ? 'rgba(139,92,246,0.12)' : c.chipBg,
                    color: totalAmount === v ? '#8B5CF6' : c.chipText,
                    border: `1px solid ${totalAmount === v ? '#8B5CF640' : c.chipBorder}`,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>
                  {v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </PageSection>

          {/* Template presets */}
          <PageSection label="Chiến lược ladder">
            <div className="flex flex-col gap-2">
              {(Object.keys(LADDER_TEMPLATES) as LadderPreset[]).map(key => {
                const t = LADDER_TEMPLATES[key];
                const Icon = t.icon;
                return (
                  <button key={key}
                    onClick={() => handlePresetChange(key)}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left"
                    style={{
                      background: preset === key ? t.color + '10' : c.surface2,
                      border: `1.5px solid ${preset === key ? t.color + '40' : 'transparent'}`,
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: preset === key ? t.color + '22' : c.borderSolid + '66' }}>
                      <Icon size={ICON_SIZE.sm} color={preset === key ? t.color : c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{t.label}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4 }}>{t.desc}</p>
                      {t.intervals.length > 0 && (
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 3 }}>
                          {t.intervals.length} bậc · APY TB: {(t.intervals.reduce((s, iv) => s + iv.apy * iv.pctAlloc / 100, 0)).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
                      style={{ borderColor: preset === key ? t.color : c.borderSolid }}>
                      {preset === key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </PageSection>

          {/* Rungs list */}
          <PageSection label={`Các bậc ladder (${rungs.length})`}>
            {rungs.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Layers size={ICON_SIZE.xl} color={c.text3} />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Chưa có bậc nào. Chọn template hoặc thêm thủ công.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rungs.map((rung, i) => (
                  <button key={rung.id}
                    onClick={() => { setShowRungDetail(rung); hapticSelection(); }}
                    className="flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ background: c.surface2 }}>
                    {/* Number badge */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: rung.color + '22', border: `1.5px solid ${rung.color}40` }}>
                      <span style={{ color: rung.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{rung.product}</span>
                        <span className="px-1 py-0.5 rounded"
                          style={{ background: '#F59E0B15', color: '#F59E0B', fontSize: 8, fontWeight: FONT_WEIGHT.bold }}>
                          {rung.lockDays}D
                        </span>
                        {rung.autoRenew && (
                          <span className="px-1 py-0.5 rounded"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 8, fontWeight: FONT_WEIGHT.bold }}>
                            TỰ GIA HẠN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                          {fmtUsd(rung.amount)}
                        </span>
                        <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{rung.apy}%</span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>→ {rung.maturityDate}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveRung(rung.id); }}
                      className="p-1.5 rounded-lg shrink-0"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <Trash2 size={ICON_SIZE.sm} color="#EF4444" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Add rung button */}
            <button onClick={() => { setShowAddRung(true); hapticSelection(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mt-2"
              style={{ background: c.chipBg, border: `1.5px dashed ${c.borderSolid}`, color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
              <Plus size={ICON_SIZE.sm} />
              Thêm bậc ladder
            </button>
          </PageSection>

          {/* Allocation status */}
          {totalAmount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: unallocated > 1 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
                border: `1px solid ${unallocated > 1 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`,
              }}>
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
                {unallocated > 1 ? `Chưa phân bổ: ${fmtUsd(unallocated)}` : 'Đã phân bổ hết'}
              </span>
              <div className="h-1.5 w-24 rounded-full" style={{ background: c.borderSolid }}>
                <div className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (totalAllocated / totalAmount) * 100)}%`,
                    background: unallocated > 1 ? '#F59E0B' : '#10B981',
                  }} />
              </div>
            </div>
          )}

          {/* Confirm CTA */}
          {rungs.length > 0 && (
            <CTAButton onClick={() => { setShowConfirmSheet(true); hapticSuccess(); }}>
              <Layers size={ICON_SIZE.sm} className="mr-2 inline" />
              Xác nhận Ladder · {rungs.length} bậc
            </CTAButton>
          )}
        </PageContent>
      )}

      {/* ═══ Timeline Tab ═══ */}
      {tab === 'timeline' && (
        <PageContent padding="compact" gap="default">
          {rungs.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Layers size={ICON_SIZE.xl} color={c.text3} />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Chưa có bậc nào</p>
              <button onClick={() => { setTab('builder'); hapticSelection(); }}
                className="px-6 py-2.5 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Bắt đầu xây
              </button>
            </div>
          ) : (
            <>
              {/* Timeline visualization */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={ICON_SIZE.sm} color="#8B5CF6" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Lịch đáo hạn</span>
                </div>
                <LadderTimeline rungs={rungs} />
              </TrCard>

              {/* Maturity calendar */}
              <PageSection label="Lịch trình đáo hạn">
                <div className="flex flex-col gap-2">
                  {[...rungs].sort((a, b) => a.lockDays - b.lockDays).map((rung, i) => (
                    <div key={rung.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: c.surface2 }}>
                      <div className="w-10 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: rung.color + '15', border: `1px solid ${rung.color}30` }}>
                        <span style={{ color: rung.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                          {rung.maturityDate.split('/')[0]}
                        </span>
                        <span style={{ color: rung.color, fontSize: 8, fontWeight: FONT_WEIGHT.semibold }}>
                          T{rung.maturityDate.split('/')[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{rung.product}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>{fmtUsd(rung.amount)}</span>
                          <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro }}>{rung.apy}% APY</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                          +{fmtUsd(rung.amount * rung.apy / 100 * rung.lockDays / 365)}
                        </span>
                        <span style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
                          {rung.autoRenew ? '↻ Tự gia hạn' : '⏹ Dừng'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </PageSection>

              {/* Cash flow projection */}
              <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={ICON_SIZE.sm} color="#10B981" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Dự kiến dòng tiền</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[...rungs].sort((a, b) => a.lockDays - b.lockDays).map(rung => {
                    const interest = rung.amount * rung.apy / 100 * rung.lockDays / 365;
                    return (
                      <div key={rung.id} className="flex items-center justify-between py-1.5"
                        style={{ borderBottom: `1px solid ${c.divider}` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: rung.color }} />
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.xs }}>{rung.maturityDate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontFamily: 'monospace' }}>
                            Vốn: {fmtUsd(rung.amount)}
                          </span>
                          <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                            +{fmtUsd(interest)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div className="flex items-center justify-between pt-2">
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>Tổng</span>
                    <div className="flex items-center gap-3">
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                        {fmtUsd(totalAllocated)}
                      </span>
                      <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                        +{fmtUsd(rungs.reduce((s, r) => s + r.amount * r.apy / 100 * r.lockDays / 365, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </TrCard>
            </>
          )}
        </PageContent>
      )}

      {/* ═══ Analysis Tab ═══ */}
      {tab === 'analysis' && (
        <PageContent padding="compact" gap="default">
          {rungs.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <BarChart3 size={ICON_SIZE.xl} color={c.text3} />
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Tạo ladder để xem phân tích</p>
              <button onClick={() => { setTab('builder'); hapticSelection(); }}
                className="px-6 py-2.5 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Bắt đầu xây
              </button>
            </div>
          ) : (
            <>
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'APY bình quân', value: `${weightedAPY.toFixed(2)}%`, color: '#10B981', icon: TrendingUp },
                  { label: 'Thanh khoản', value: `${liquidityScore}/100`, color: liquidityColor, icon: Zap },
                  { label: 'Lock TB', value: `${avgLockDays} ngày`, color: '#F59E0B', icon: Lock },
                  { label: 'Lãi dự kiến/năm', value: fmtUsd(estimatedAnnualInterest), color: '#10B981', icon: DollarSign },
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <TrCard key={m.label} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={ICON_SIZE.sm} color={m.color} />
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>{m.label}</span>
                      </div>
                      <p style={{ color: m.color, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{m.value}</p>
                    </TrCard>
                  );
                })}
              </div>

              {/* Asset allocation breakdown */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Phân bổ theo tài sản</span>
                </div>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const byAsset: Record<string, { total: number; count: number; color: string; avgApy: number }> = {};
                    rungs.forEach(r => {
                      if (!byAsset[r.asset]) byAsset[r.asset] = { total: 0, count: 0, color: r.color, avgApy: 0 };
                      byAsset[r.asset].total += r.amount;
                      byAsset[r.asset].count += 1;
                      byAsset[r.asset].avgApy += r.apy;
                    });
                    Object.keys(byAsset).forEach(k => { byAsset[k].avgApy /= byAsset[k].count; });
                    return Object.entries(byAsset).sort((a, b) => b[1].total - a[1].total).map(([asset, data]) => {
                      const pct = (data.total / totalAllocated) * 100;
                      return (
                        <div key={asset}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
                              <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{asset}</span>
                              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{data.count} bậc</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                                {fmtUsd(data.total)}
                              </span>
                              <span style={{ color: data.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                            <div className="h-full rounded-full" style={{ background: data.color, width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </TrCard>

              {/* Duration distribution */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={ICON_SIZE.sm} color="#F59E0B" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Phân bổ theo thời hạn</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[30, 60, 90].map(days => {
                    const dayRungs = rungs.filter(r => r.lockDays === days);
                    if (dayRungs.length === 0) return null;
                    const totalDay = dayRungs.reduce((s, r) => s + r.amount, 0);
                    const pct = (totalDay / totalAllocated) * 100;
                    const avgApy = dayRungs.reduce((s, r) => s + r.apy, 0) / dayRungs.length;
                    return (
                      <div key={days} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: days <= 30 ? 'rgba(16,185,129,0.1)' : days <= 60 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)' }}>
                          <span style={{
                            color: days <= 30 ? '#10B981' : days <= 60 ? '#3B82F6' : '#8B5CF6',
                            fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
                          }}>{days}D</span>
                        </div>
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{dayRungs.length} bậc · {pct.toFixed(0)}%</p>
                          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            {fmtUsd(totalDay)} · APY TB: {avgApy.toFixed(1)}%
                          </p>
                        </div>
                        <span style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{avgApy.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </TrCard>

              {/* Liquidity assessment */}
              <TrCard className="p-4" accentBorder={`${liquidityColor}40`}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={ICON_SIZE.sm} color={liquidityColor} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Đánh giá thanh khoản</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(${liquidityColor} ${liquidityScore}%, ${c.borderSolid} ${liquidityScore}%)`,
                    }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: c.surface }}>
                      <span style={{ color: liquidityColor, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{liquidityScore}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                      Thanh khoản {liquidityLabel}
                    </p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginTop: 4 }}>
                      {liquidityScore >= 70
                        ? 'Ladder được phân bổ tốt, đảm bảo dòng tiền liên tục và linh hoạt.'
                        : liquidityScore >= 40
                          ? 'Cần thêm bậc ngắn hạn để tăng tính linh hoạt khi cần rút.'
                          : 'Hầu hết vốn bị khóa dài hạn. Cân nhắc thêm bậc 30D để có thanh khoản khi cần.'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Ngắn hạn (&le;30D)</p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {fmtUsd(rungs.filter(r => r.lockDays <= 30).reduce((s, r) => s + r.amount, 0))}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Trung hạn (60D)</p>
                    <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {fmtUsd(rungs.filter(r => r.lockDays === 60).reduce((s, r) => s + r.amount, 0))}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 9 }}>Dài hạn (90D+)</p>
                    <p style={{ color: '#8B5CF6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {fmtUsd(rungs.filter(r => r.lockDays >= 90).reduce((s, r) => s + r.amount, 0))}
                    </p>
                  </div>
                </div>
              </TrCard>

              {/* Optimization tips */}
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <Sparkles size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>Gợi ý tối ưu</p>
                  <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                    {weightedAPY < 5
                      ? 'Tăng tỷ trọng sản phẩm APY cao (SOL, AVAX) để cải thiện lãi suất bình quân.'
                      : liquidityScore < 50
                        ? 'Thêm bậc 30D để đảm bảo thanh khoản và giảm rủi ro khóa vốn quá lâu.'
                        : 'Ladder hiện tại cân bằng tốt giữa lãi suất và thanh khoản. Bật auto-renew để tối ưu liên tục.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </PageContent>
      )}
    </PageLayout>
  );
}