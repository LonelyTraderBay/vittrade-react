import React, { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw, Plus, Play, Pause, Trash2, TrendingUp, Calendar,
  ChevronRight, CheckCircle, Clock, Zap, PiggyBank, AlertTriangle,
  Shield, Settings, Info, X, ArrowUpRight, ArrowDownRight,
  Target, DollarSign, BarChart3, Edit3, Repeat, Lock, Unlock,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import { SAVINGS_PRODUCTS } from '../../data/mockData';
import { φ, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type DCAFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DCAStatus = 'active' | 'paused' | 'completed' | 'cancelled';

interface DCAExecution {
  id: string;
  date: string;
  amount: number;
  asset: string;
  status: 'success' | 'failed' | 'pending';
  apy: number;
}

interface DCAPlan {
  id: string;
  productId: string;
  productName: string;
  asset: string;
  color: string;
  type: 'flexible' | 'locked';
  amountPerPeriod: number;
  frequency: DCAFrequency;
  status: DCAStatus;
  startDate: string;
  endDate: string | null;
  totalInvested: number;
  totalExecutions: number;
  successfulExecutions: number;
  nextExecution: string;
  currentValue: number;
  currentAPY: number;
  executions: DCAExecution[];
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const MOCK_DCA_PLANS: DCAPlan[] = [
  {
    id: 'dca1',
    productId: 'sav001',
    productName: 'USDT Linh hoạt',
    asset: 'USDT',
    color: '#26A17B',
    type: 'flexible',
    amountPerPeriod: 100,
    frequency: 'weekly',
    status: 'active',
    startDate: '01/01/2026',
    endDate: null,
    totalInvested: 1000,
    totalExecutions: 10,
    successfulExecutions: 10,
    nextExecution: '16/03/2026',
    currentValue: 1018.50,
    currentAPY: 4.5,
    executions: [
      { id: 'e1', date: '09/03/2026', amount: 100, asset: 'USDT', status: 'success', apy: 4.5 },
      { id: 'e2', date: '02/03/2026', amount: 100, asset: 'USDT', status: 'success', apy: 4.5 },
      { id: 'e3', date: '23/02/2026', amount: 100, asset: 'USDT', status: 'success', apy: 4.3 },
      { id: 'e4', date: '16/02/2026', amount: 100, asset: 'USDT', status: 'success', apy: 4.3 },
      { id: 'e5', date: '09/02/2026', amount: 100, asset: 'USDT', status: 'failed', apy: 4.2 },
    ],
  },
  {
    id: 'dca2',
    productId: 'sav004',
    productName: 'ETH Linh hoạt',
    asset: 'ETH',
    color: '#627EEA',
    type: 'flexible',
    amountPerPeriod: 0.05,
    frequency: 'monthly',
    status: 'active',
    startDate: '15/12/2025',
    endDate: null,
    totalInvested: 0.15,
    totalExecutions: 3,
    successfulExecutions: 3,
    nextExecution: '15/03/2026',
    currentValue: 0.1528,
    currentAPY: 3.8,
    executions: [
      { id: 'e6', date: '15/02/2026', amount: 0.05, asset: 'ETH', status: 'success', apy: 3.8 },
      { id: 'e7', date: '15/01/2026', amount: 0.05, asset: 'ETH', status: 'success', apy: 3.7 },
      { id: 'e8', date: '15/12/2025', amount: 0.05, asset: 'ETH', status: 'success', apy: 3.5 },
    ],
  },
  {
    id: 'dca3',
    productId: 'sav003',
    productName: 'SOL Linh hoạt',
    asset: 'SOL',
    color: '#9945FF',
    type: 'flexible',
    amountPerPeriod: 5,
    frequency: 'biweekly',
    status: 'paused',
    startDate: '01/11/2025',
    endDate: null,
    totalInvested: 40,
    totalExecutions: 8,
    successfulExecutions: 7,
    nextExecution: '—',
    currentValue: 41.20,
    currentAPY: 6.5,
    executions: [
      { id: 'e9', date: '01/02/2026', amount: 5, asset: 'SOL', status: 'success', apy: 6.5 },
      { id: 'e10', date: '15/01/2026', amount: 5, asset: 'SOL', status: 'success', apy: 6.2 },
    ],
  },
];

const FREQUENCY_LABELS: Record<DCAFrequency, string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  biweekly: 'Mỗi 2 tuần',
  monthly: 'Hằng tháng',
};

const STATUS_CONFIG: Record<DCAStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Đang chạy', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  paused: { label: 'Tạm dừng', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  completed: { label: 'Hoàn tất', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  cancelled: { label: 'Đã hủy', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

const MOCK_BALANCES: Record<string, number> = {
  USDT: 12500, BTC: 0.15, ETH: 3.2, SOL: 120,
};

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsDCAPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 400 });

  /* State */
  const [tab, setTab] = useState<'plans' | 'history'>('plans');
  const [plans, setPlans] = useState(MOCK_DCA_PLANS);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<DCAPlan | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /* Create form state */
  const [createProduct, setCreateProduct] = useState<string | null>(null);
  const [createAmount, setCreateAmount] = useState('');
  const [createFrequency, setCreateFrequency] = useState<DCAFrequency>('weekly');
  const [createEndDate, setCreateEndDate] = useState<'none' | '3m' | '6m' | '1y'>('none');
  const [createAgreed, setCreateAgreed] = useState(false);

  /* Reset on open create */
  const openCreate = useCallback(() => {
    setCreateProduct(null);
    setCreateAmount('');
    setCreateFrequency('weekly');
    setCreateEndDate('none');
    setCreateAgreed(false);
    setShowCreate(true);
    hapticSelection();
  }, [hapticSelection]);

  /* Computed */
  const totalInvested = plans.filter(p => p.status === 'active').reduce((s, p) => {
    const price = p.asset === 'USDT' ? 1 : p.asset === 'BTC' ? 67543 : p.asset === 'ETH' ? 2800 : 130;
    return s + p.totalInvested * price;
  }, 0);

  const totalValue = plans.filter(p => p.status === 'active').reduce((s, p) => {
    const price = p.asset === 'USDT' ? 1 : p.asset === 'BTC' ? 67543 : p.asset === 'ETH' ? 2800 : 130;
    return s + p.currentValue * price;
  }, 0);

  const totalGain = totalValue - totalInvested;
  const activePlans = plans.filter(p => p.status === 'active').length;

  const selectedProduct = createProduct
    ? SAVINGS_PRODUCTS.find(p => p.id === createProduct)
    : null;

  const createAmountNum = parseFloat(createAmount || '0');
  const createBalance = selectedProduct ? (MOCK_BALANCES[selectedProduct.asset] ?? 0) : 0;
  const canCreate = selectedProduct && createAmountNum > 0 && createAmountNum <= createBalance && createAgreed;

  /* Frequency estimates */
  const frequencyMultiplier: Record<DCAFrequency, number> = { daily: 365, weekly: 52, biweekly: 26, monthly: 12 };
  const yearlyAmount = createAmountNum * (frequencyMultiplier[createFrequency] || 52);
  const estimatedEarning = selectedProduct ? yearlyAmount * (selectedProduct.apy / 100) : 0;

  /* Handlers */
  const handleTogglePlan = useCallback((planId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return { ...p, status: p.status === 'active' ? 'paused' as const : 'active' as const };
    }));
    hapticSelection();
  }, [hapticSelection]);

  const handleCancelPlan = useCallback((planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: 'cancelled' as const } : p));
    setShowConfirmCancel(null);
    hapticSuccess();
  }, [hapticSuccess]);

  const handleCreate = useCallback(() => {
    if (!canCreate || !selectedProduct) return;
    const newPlan: DCAPlan = {
      id: `dca${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      asset: selectedProduct.asset,
      color: selectedProduct.color,
      type: selectedProduct.type,
      amountPerPeriod: createAmountNum,
      frequency: createFrequency,
      status: 'active',
      startDate: '09/03/2026',
      endDate: createEndDate === 'none' ? null : createEndDate === '3m' ? '09/06/2026' : createEndDate === '6m' ? '09/09/2026' : '09/03/2027',
      totalInvested: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      nextExecution: '16/03/2026',
      currentValue: 0,
      currentAPY: selectedProduct.apy,
      executions: [],
    };
    setPlans(prev => [newPlan, ...prev]);
    setShowCreate(false);
    setShowSuccess(true);
    hapticSuccess();
    setTimeout(() => setShowSuccess(false), 3000);
  }, [canCreate, selectedProduct, createAmountNum, createFrequency, createEndDate, hapticSuccess]);

  /* All executions for history tab */
  const allExecutions = useMemo(() => {
    return plans
      .flatMap(p => p.executions.map(e => ({ ...e, planName: p.productName, planColor: p.color })))
      .sort((a, b) => {
        const da = a.date.split('/').reverse().join('-');
        const db = b.date.split('/').reverse().join('-');
        return db.localeCompare(da);
      });
  }, [plans]);

  const TABS = [
    { id: 'plans' as const, label: `Kế hoạch (${plans.filter(p => p.status !== 'cancelled').length})` },
    { id: 'history' as const, label: 'Lịch sử' },
  ];

  /* Eligible products for DCA (flexible only) */
  const eligibleProducts = SAVINGS_PRODUCTS.filter(p => p.type === 'flexible');

  return (
    <PageLayout>
      {/* ─── Create DCA Sheet ─── */}
      <BottomSheetV2 open={showCreate} onClose={() => setShowCreate(false)} title="Tạo kế hoạch DCA">
        <div className="flex flex-col gap-4">
          {/* Step 1: Product selection */}
          <div>
            <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, marginBottom: 8, display: 'block' }}>
              Chọn sản phẩm
            </label>
            <div className="flex flex-col gap-2">
              {eligibleProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => { setCreateProduct(product.id); hapticLight(); }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: createProduct === product.id ? 'rgba(16,185,129,0.08)' : c.surface2,
                    border: `1.5px solid ${createProduct === product.id ? '#10B981' : 'transparent'}`,
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: product.color + '22', border: `1px solid ${product.color}44` }}>
                    <span style={{ color: product.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                      {product.asset.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{product.name}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>APY: {product.apy}%</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: createProduct === product.id ? '#10B981' : c.borderSolid }}>
                    {createProduct === product.id && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <>
              {/* Step 2: Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Số lượng mỗi lần ({selectedProduct.asset})</label>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    Khả dụng: <span style={{ color: c.text1, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                      {fmtAmount(createBalance)} {selectedProduct.asset}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4"
                  style={{
                    background: c.surface2,
                    border: `1.5px solid ${createAmountNum > createBalance ? '#EF4444' : 'rgba(16,185,129,0.3)'}`,
                    height: 52, borderRadius: 14,
                  }}>
                  <input
                    type="number" inputMode="decimal"
                    placeholder={`Ví dụ: ${selectedProduct.asset === 'USDT' ? '100' : '0.05'}`}
                    value={createAmount}
                    onChange={e => setCreateAmount(e.target.value)}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: c.text1, fontSize: FONT_SCALE.base, flex: 1, fontFamily: 'monospace',
                    }}
                  />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{selectedProduct.asset}</span>
                </div>
                {createAmountNum > createBalance && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF4444', fontSize: FONT_SCALE.xs }}>
                    <AlertTriangle size={ICON_SIZE.sm} /> Vượt quá số dư khả dụng
                  </p>
                )}
              </div>

              {/* Step 3: Frequency */}
              <div>
                <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, marginBottom: 8, display: 'block' }}>Tần suất</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(FREQUENCY_LABELS) as DCAFrequency[]).map(freq => (
                    <button
                      key={freq}
                      onClick={() => { setCreateFrequency(freq); hapticLight(); }}
                      className="px-3 py-2 rounded-xl text-xs"
                      style={{
                        background: createFrequency === freq ? 'rgba(16,185,129,0.12)' : c.chipBg,
                        color: createFrequency === freq ? '#10B981' : c.chipText,
                        border: `1px solid ${createFrequency === freq ? '#10B981' : c.chipBorder}`,
                        fontWeight: FONT_WEIGHT.semibold,
                      }}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Duration */}
              <div>
                <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, marginBottom: 8, display: 'block' }}>Thời gian</label>
                <div className="flex gap-2">
                  {[
                    { id: 'none' as const, label: 'Vô hạn' },
                    { id: '3m' as const, label: '3 tháng' },
                    { id: '6m' as const, label: '6 tháng' },
                    { id: '1y' as const, label: '1 năm' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setCreateEndDate(opt.id); hapticLight(); }}
                      className="flex-1 py-2 rounded-xl text-xs"
                      style={{
                        background: createEndDate === opt.id ? 'rgba(59,130,246,0.12)' : c.chipBg,
                        color: createEndDate === opt.id ? '#3B82F6' : c.chipText,
                        border: `1px solid ${createEndDate === opt.id ? '#3B82F6' : c.chipBorder}`,
                        fontWeight: FONT_WEIGHT.semibold,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projection */}
              {createAmountNum > 0 && createAmountNum <= createBalance && (
                <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                  <BottomSheetRow label="Mỗi lần gửi" highlight
                    value={`${fmtAmount(createAmountNum)} ${selectedProduct.asset}`} />
                  <BottomSheetRow label="Tần suất" value={FREQUENCY_LABELS[createFrequency]} />
                   <BottomSheetRow label="Dự kiến gửi/năm"
                     value={`~${fmtAmount(yearlyAmount)} ${selectedProduct.asset}`} />
                   <BottomSheetRow label="Dự kiến lãi/năm" valueColor="#10B981"
                     value={`+~${fmtAmount(estimatedEarning)} ${selectedProduct.asset}`} />
                   <BottomSheetRow label="APY hiện tại" valueColor="#10B981"
                    value={`${selectedProduct.apy}%`} />
                </div>
              )}

              {/* Info banner */}
              <div className="flex items-start gap-2 rounded-xl p-3"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                  DCA sẽ tự động gửi tiết kiệm theo lịch. Nếu số dư không đủ, lệnh sẽ được báo lại và bạn sẽ nhận thông báo.
                  APY có thể thay đổi theo thị trường.
                </p>
              </div>

              {/* Terms */}
              <button onClick={() => { setCreateAgreed(!createAgreed); hapticLight(); }} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    borderColor: createAgreed ? '#10B981' : c.borderSolid,
                    background: createAgreed ? '#10B981' : 'transparent',
                  }}>
                  {createAgreed && <CheckCircle size={ICON_SIZE.sm} color="#fff" />}
                </div>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, textAlign: 'left' }}>
                  Tôi đồng ý với{' '}
                  <span style={{ color: '#3B82F6' }}>điều khoản DCA</span> và hiểu rằng số tiền sẽ được tự động trừ từ ví Spot theo lịch đã chọn.
                </span>
              </button>

              {/* CTA */}
              <CTAButton variant="success" onClick={handleCreate} disabled={!canCreate}>
                {canCreate
                  ? `Tạo kế hoạch · ${fmtAmount(createAmountNum)} ${selectedProduct.asset}/${FREQUENCY_LABELS[createFrequency].toLowerCase()}`
                  : createAmountNum > 0 && createAmountNum > createBalance
                    ? 'Số dư không đủ'
                    : !createAgreed && createAmountNum > 0
                      ? 'Đồng ý điều khoản'
                      : 'Nhập số lượng'}
              </CTAButton>
            </>
          )}
        </div>
      </BottomSheetV2>

      {/* ─── Plan Detail Sheet ─── */}
      <BottomSheetV2 open={!!showDetail} onClose={() => setShowDetail(null)} title="Chi tiết kế hoạch DCA">
        {showDetail && (() => {
          const plan = showDetail;
          const st = STATUS_CONFIG[plan.status];
          const price = plan.asset === 'USDT' ? 1 : plan.asset === 'BTC' ? 67543 : plan.asset === 'ETH' ? 2800 : 130;
          const investedUsd = plan.totalInvested * price;
          const valueUsd = plan.currentValue * price;
          const gainUsd = valueUsd - investedUsd;
          return (
            <div className="flex flex-col gap-4">
              {/* Product info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: plan.color + '22', border: `1.5px solid ${plan.color}44` }}>
                  <span style={{ color: plan.color, fontSize: 10, fontWeight: 700 }}>
                    {plan.asset.slice(0, 3)}
                  </span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{plan.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded" style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 700 }}>
                      {st.label}
                    </span>
                    <span style={{ color: c.text3, fontSize: 11 }}>{FREQUENCY_LABELS[plan.frequency]}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Tổng đã gửi</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtAmount(plan.totalInvested)} {plan.asset}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10 }}>~{fmtUsd(investedUsd)}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Giá trị hiện tại</p>
                  <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtAmount(plan.currentValue)} {plan.asset}
                  </p>
                  <p style={{ color: gainUsd >= 0 ? '#10B981' : '#EF4444', fontSize: 10 }}>
                    {gainUsd >= 0 ? '+' : ''}{fmtUsd(gainUsd)}
                  </p>
                </div>
              </div>

              <BottomSheetRow label="Số lượng mỗi lần" value={`${fmtAmount(plan.amountPerPeriod)} ${plan.asset}`} />
              <BottomSheetRow label="Tần suất" value={FREQUENCY_LABELS[plan.frequency]} />
              <BottomSheetRow label="APY hiện tại" value={`${plan.currentAPY}%`} valueColor="#10B981" />
              <BottomSheetRow label="Lần thực hiện" value={`${plan.successfulExecutions}/${plan.totalExecutions}`} />
              <BottomSheetRow label="Bắt đầu từ" value={plan.startDate} />
              <BottomSheetRow label="Lần tiếp theo" value={plan.nextExecution}
                valueColor={plan.status === 'active' ? '#3B82F6' : c.text3} />

              {/* Recent executions */}
              {plan.executions.length > 0 && (
                <div>
                  <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    Lịch sử thực hiện gần đây
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {plan.executions.slice(0, 5).map(exec => (
                      <div key={exec.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                        style={{ background: c.surface2 }}>
                        <div className="flex items-center gap-2">
                          {exec.status === 'success'
                            ? <CheckCircle size={12} color="#10B981" />
                            : exec.status === 'failed'
                              ? <AlertTriangle size={12} color="#EF4444" />
                              : <Clock size={12} color="#F59E0B" />}
                          <span style={{ color: c.text2, fontSize: 12 }}>{exec.date}</span>
                        </div>
                        <span style={{
                          color: exec.status === 'failed' ? '#EF4444' : c.text1,
                          fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
                          textDecoration: exec.status === 'failed' ? 'line-through' : 'none',
                        }}>
                          {fmtAmount(exec.amount)} {exec.asset}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {plan.status !== 'cancelled' && plan.status !== 'completed' && (
                  <CTAButton
                    variant={plan.status === 'active' ? 'secondary' : 'primary'}
                    onClick={() => { handleTogglePlan(plan.id); setShowDetail({ ...plan, status: plan.status === 'active' ? 'paused' : 'active' }); }}
                    className="flex-1"
                  >
                    {plan.status === 'active' ? 'Tạm dừng' : 'Tiếp tục'}
                  </CTAButton>
                )}
                {plan.status !== 'cancelled' && plan.status !== 'completed' && (
                  <CTAButton variant="danger" onClick={() => { setShowDetail(null); setShowConfirmCancel(plan.id); }}
                    className="flex-1">
                    Hủy kế hoạch
                  </CTAButton>
                )}
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Cancel Confirm Sheet ─── */}
      <BottomSheetV2 open={!!showConfirmCancel} onClose={() => setShowConfirmCancel(null)} title="Xác nhận hủy">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={14} color="#EF4444" className="mt-0.5 shrink-0" />
            <p style={{ color: '#EF4444', fontSize: 12, lineHeight: 1.5 }}>
              Hủy kế hoạch DCA sẽ dừng tất cả lệnh gửi tự động trong tương lai.
              Số tiền đã gửi sẽ vẫn được giữ và tiếp tục nhận lãi theo sản phẩm tiết kiệm.
            </p>
          </div>
          <div className="flex gap-2">
            <CTAButton variant="secondary" onClick={() => setShowConfirmCancel(null)} className="flex-1">
              Quay lại
            </CTAButton>
            <CTAButton variant="danger" onClick={() => showConfirmCancel && handleCancelPlan(showConfirmCancel)} className="flex-1">
              Xác nhận hủy
            </CTAButton>
          </div>
        </div>
      </BottomSheetV2>

      {/* ─── Success Toast ─── */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #10B981',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={20} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Tạo kế hoạch thành công!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>DCA sẽ bắt đầu theo lịch đã chọn.</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="DCA Tiết kiệm" back />

      {/* ─── Summary Card ─── */}
      <div
        className="mx-5 mt-4 relative overflow-hidden"
        style={{
          padding: '22px 20px 20px',
          borderRadius: φRadius.lg,
          background: c.portfolioBg,
          border: `1px solid ${c.portfolioBorder}`,
          boxShadow: c.portfolioShadow,
        }}
      >
        {/* Decorative glows */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
        />

        {/* Header row */}
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <Repeat size={ICON_SIZE.sm} color="#34D399" strokeWidth={ICON_STROKE.emphasis} />
          <span style={{ color: c.portfolioTextDim, fontSize: φ.sm }}>Dollar Cost Averaging</span>
        </div>

        {/* Label */}
        <p className="relative z-10" style={{ color: c.portfolioTextMuted, fontSize: φ.xs, marginBottom: 2 }}>
          Tổng đã gửi (USD)
        </p>

        {/* Balance */}
        <p
          className="relative z-10"
          style={{
            color: '#FFFFFF',
            fontSize: 34,
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          {fmtUsd(totalInvested)}
        </p>

        {/* PnL pill */}
        <div className="flex items-center gap-2.5 mt-2 mb-5 relative z-10">
          <div className="flex items-center justify-between w-full">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{ background: totalGain >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${totalGain >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}
            >
              <TrendingUp size={ICON_SIZE.sm} color={totalGain >= 0 ? '#34D399' : '#EF4444'} strokeWidth={ICON_STROKE.bold} />
              <span style={{ color: totalGain >= 0 ? '#34D399' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {totalGain >= 0 ? '+' : ''}{fmtUsd(totalGain)}
              </span>
            </div>
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Lãi DCA</span>
          </div>
        </div>

        {/* Stat pills — 3 columns */}
        <div className="flex gap-2.5 relative z-10 mb-4">
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Kế hoạch đang chạy</span>
            <span style={{ color: '#FFFFFF', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{activePlans}</span>
          </div>
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Giá trị hiện tại</span>
            <span style={{ color: '#34D399', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtUsd(totalValue)}</span>
          </div>
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Chiến lược</span>
            <div className="flex items-center gap-1">
              <Shield size={ICON_SIZE.sm} color="#60A5FA" />
              <span style={{ color: '#60A5FA', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>An toàn</span>
            </div>
          </div>
        </div>

        {/* Action buttons — 3 equal columns */}
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={openCreate}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
              color: '#fff',
              fontSize: φ.sm,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Plus size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Tạo DCA
          </button>
          <button
            onClick={() => setTab('plans')}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: φ.sm,
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}
          >
            <BarChart3 size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Danh mục
          </button>
          <button
            onClick={() => setTab('history')}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: φ.sm,
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Clock size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* ─── Info Banner ─── */}
      <div className="flex items-start gap-2 mx-5 mt-3 p-3 rounded-xl"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
        <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
          DCA giúp bạn gửi tiết kiệm đều đặn theo lịch, giảm rủi ro timing và xây dựng thói quen tích lũy hiệu quả.
        </p>
      </div>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar variant="segment" tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Plans Tab ═══ */}
      {tab === 'plans' && (
        <PageContent padding="compact" gap="default">
          {plans.filter(p => p.status !== 'cancelled').length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: c.surface2 }}>
                <Repeat size={ICON_SIZE.xl} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa có kế hoạch DCA</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Tạo kế hoạch DCA để tự động gửi tiết kiệm theo lịch định kỳ.
              </p>
              <button onClick={openCreate}
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Tạo kế hoạch đầu tiên
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.filter(p => p.status !== 'cancelled').map(plan => {
                const st = STATUS_CONFIG[plan.status];
                const price = plan.asset === 'USDT' ? 1 : plan.asset === 'BTC' ? 67543 : plan.asset === 'ETH' ? 2800 : 130;
                const gainPct = plan.totalInvested > 0
                  ? ((plan.currentValue - plan.totalInvested) / plan.totalInvested) * 100
                  : 0;

                return (
                  <TrCard key={plan.id} hover className="p-4"
                    onClick={() => { setShowDetail(plan); hapticSelection(); }}>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: plan.color + '22', border: `1.5px solid ${plan.color}44` }}>
                        <span style={{ color: plan.color, fontSize: 10, fontWeight: 700 }}>
                          {plan.asset.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{plan.productName}</span>
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 700 }}>
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Repeat size={11} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 11 }}>
                            {fmtAmount(plan.amountPerPeriod)} {plan.asset} / {FREQUENCY_LABELS[plan.frequency].toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>{plan.currentAPY}%</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10 }}>Đã gửi</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                          {fmtAmount(plan.totalInvested)} {plan.asset}
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10 }}>Giá trị</p>
                        <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                          {fmtAmount(plan.currentValue)} {plan.asset}
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10 }}>Lợi nhuận</p>
                        <p style={{ color: gainPct >= 0 ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                          {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3"
                      style={{ borderTop: `1px solid ${c.divider}` }}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: 11 }}>
                          Tiếp theo: {plan.nextExecution}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.status !== 'completed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTogglePlan(plan.id); }}
                            className="p-1.5 rounded-lg"
                            style={{ background: plan.status === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>
                            {plan.status === 'active'
                              ? <Pause size={14} color="#F59E0B" />
                              : <Play size={14} color="#10B981" />}
                          </button>
                        )}
                        <ChevronRight size={14} color={c.text3} />
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}
        </PageContent>
      )}

      {/* ═══ History Tab ═══ */}
      {tab === 'history' && (
        <PageContent padding="compact" gap="default">
          {allExecutions.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: c.surface2 }}>
                <Clock size={32} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: 15, fontWeight: 600 }}>Chưa có lịch sử</p>
              <p style={{ color: c.text3, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                Lịch sử thực hiện DCA sẽ hiển thị tại đây sau lần gửi đầu tiên.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allExecutions.map(exec => (
                <TrCard key={exec.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: exec.status === 'success' ? 'rgba(16,185,129,0.1)'
                          : exec.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      }}>
                      {exec.status === 'success'
                        ? <CheckCircle size={16} color="#10B981" />
                        : exec.status === 'failed'
                          ? <AlertTriangle size={16} color="#EF4444" />
                          : <Clock size={16} color="#F59E0B" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {(exec as any).planName}
                        </p>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{
                            background: exec.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: exec.status === 'success' ? '#10B981' : '#EF4444',
                            fontSize: 9, fontWeight: 600,
                          }}>
                          {exec.status === 'success' ? 'Thành công' : exec.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>{exec.date} · APY {exec.apy}%</p>
                    </div>
                    <div className="text-right">
                      <p style={{
                        color: exec.status === 'failed' ? '#EF4444' : c.text1,
                        fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                        textDecoration: exec.status === 'failed' ? 'line-through' : 'none',
                      }}>
                        {fmtAmount(exec.amount)} {exec.asset}
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          )}
        </PageContent>
      )}
    </PageLayout>
  );
}