import React, { useState, useMemo } from 'react';
import {
  Wallet, Lock, Unlock, TrendingUp, Info, ChevronRight, CheckCircle,
  Clock, Zap, PiggyBank, ArrowDownToLine, ArrowUpFromLine, Calculator,
  AlertTriangle, Shield, X, Sparkles, ArrowLeftRight, RefreshCw,
  Target, BarChart3, Bell, Repeat, Lightbulb, Download, Activity, Brain,
  Layers, CloudLightning, Wrench, Users, Check, type LucideIcon,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { SAVINGS_PRODUCTS, type SavingsProduct } from '../../data/mockData';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { φ, φRadius } from '../../utils/golden';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Mock: User's active savings positions
   ═══════════════════════════════════════════════════════════ */
const MY_SAVINGS = [
  {
    id: 'ms1', product: 'USDT Linh hoạt', asset: 'USDT', amount: 3500,
    earned: 14.58, apy: 4.5, startDate: '01/02/2026', endDate: null,
    type: 'flexible' as const, color: '#26A17B', riskLevel: 'low' as const,
  },
  {
    id: 'ms2', product: 'BTC Cố định 60D', asset: 'BTC', amount: 0.02,
    earned: 0.000019, apy: 3.5, startDate: '15/01/2026', endDate: '16/03/2026',
    type: 'locked' as const, color: '#F7931A', riskLevel: 'low' as const,
    lockDays: 60,
  },
  {
    id: 'ms3', product: 'SOL Cố định 30D', asset: 'SOL', amount: 25,
    earned: 0.45, apy: 6.5, startDate: '20/02/2026', endDate: '22/03/2026',
    type: 'locked' as const, color: '#9945FF', riskLevel: 'medium' as const,
    lockDays: 30,
  },
];

/* Simulated balances for quick-amount buttons */
const MOCK_BALANCES: Record<string, number> = {
  USDT: 12500, BTC: 0.15, ETH: 3.2, SOL: 120,
};

const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

/* Stable capacity percentages */
const CAPACITY_PCT: Record<string, number> = {
  sav001: 62, sav002: 90, sav003: 93, sav004: 48,
  sav005: 82, sav006: 55, sav007: 35,
};

const PARTICIPANTS: Record<string, number> = {
  sav001: 45230, sav002: 12480, sav003: 6720, sav004: 18340,
  sav005: 9120, sav006: 15670, sav007: 4890,
};

/* ─── Skeleton ─── */
function SkeletonList({ rows }: { rows: number }) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full" style={{ background: c.borderSolid }} />
            <div className="flex-1">
              <div className="h-3 rounded mb-1.5" style={{ background: c.borderSolid, width: '55%' }} />
              <div className="h-2.5 rounded" style={{ background: c.borderSolid, width: '35%' }} />
            </div>
            <div className="h-5 w-14 rounded" style={{ background: c.borderSolid }} />
          </div>
          <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Risk badge ─── */
function getRiskLevel(product: SavingsProduct): 'low' | 'medium' | 'high' {
  if (product.type === 'flexible') return 'low';
  if (product.lockDays && product.lockDays >= 90) return 'medium';
  return 'low';
}

/* ─── Toolbox helper components ─── */
function ToolboxGroup({ label, color, c, children }: {
  label: string; color: string; c: ReturnType<typeof useThemeColors>; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1 h-4 rounded-full" style={{ background: color }} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{label}</span>
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ToolboxItem({ icon: Icon, label, desc, color, c, onClick }: {
  icon: LucideIcon; label: string; desc: string; color: string;
  c: ReturnType<typeof useThemeColors>; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-left"
      style={{ background: 'transparent' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '14' }}>
        <Icon size={ICON_SIZE.sm} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{label}</p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{desc}</p>
      </div>
      <ChevronRight size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} className="shrink-0" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 600 });

  const [tab, setTab] = useState<'products' | 'my'>('products');
  const [typeFilter, setTypeFilter] = useState<'all' | 'flexible' | 'locked'>('all');
  const [showToolbox, setShowToolbox] = useState(false);

  /* Subscribe flow state */
  const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* Redeem flow state */
  const [redeemPosition, setRedeemPosition] = useState<typeof MY_SAVINGS[0] | null>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemAgreed, setRedeemAgreed] = useState(false);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);

  /* Reset on product change */
  React.useEffect(() => { setAmount(''); setAgreed(false); }, [selectedProduct]);
  React.useEffect(() => { setRedeemAmount(''); setRedeemAgreed(false); }, [redeemPosition]);

  /* Computed */
  const filtered = typeFilter === 'all'
    ? SAVINGS_PRODUCTS
    : SAVINGS_PRODUCTS.filter(p => p.type === typeFilter);

  const totalDeposited = MY_SAVINGS.reduce((s, p) =>
    s + (p.asset === 'USDT' ? p.amount : p.asset === 'BTC' ? p.amount * 67543 : p.asset === 'SOL' ? p.amount * 130 : p.amount * 2800), 0);
  const totalEarned = MY_SAVINGS.reduce((s, p) =>
    s + (p.asset === 'USDT' ? p.earned : p.asset === 'BTC' ? p.earned * 67543 : p.asset === 'SOL' ? p.earned * 130 : p.earned * 2800), 0);
  const avgApy = MY_SAVINGS.length > 0 ? MY_SAVINGS.reduce((s, p) => s + p.apy, 0) / MY_SAVINGS.length : 0;

  const amountNum = parseFloat(amount || '0');
  const balance = selectedProduct ? (MOCK_BALANCES[selectedProduct.asset] ?? 0) : 0;
  const estimatedEarning = selectedProduct
    ? amountNum * (selectedProduct.apy / 100) * ((selectedProduct.lockDays ?? 365) / 365)
    : 0;
  const canSubscribe = selectedProduct
    ? amountNum >= selectedProduct.minAmount && amountNum <= balance && agreed
    : false;

  const redeemNum = parseFloat(redeemAmount || '0');
  const canRedeem = redeemPosition ? redeemNum > 0 && redeemNum <= redeemPosition.amount && redeemAgreed : false;

  /* Handlers */
  const handleSubscribe = () => {
    if (!canSubscribe) return;
    hapticSuccess();
    setSelectedProduct(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRedeem = () => {
    if (!canRedeem) return;
    hapticSuccess();
    setRedeemPosition(null);
    setShowRedeemSuccess(true);
    setTimeout(() => setShowRedeemSuccess(false), 3000);
  };

  const setQuickAmount = (pct: number) => {
    if (!selectedProduct) return;
    hapticLight();
    const val = balance * pct;
    setAmount(val % 1 === 0 ? val.toString() : val.toFixed(6));
  };

  const setQuickRedeemAmount = (pct: number) => {
    if (!redeemPosition) return;
    hapticLight();
    const val = redeemPosition.amount * pct;
    setRedeemAmount(val % 1 === 0 ? val.toString() : val.toFixed(6));
  };

  return (
    <PageLayout>
      {/* ─── Subscribe BottomSheet ─── */}
      <BottomSheetV2 open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Đăng ký Tiết kiệm">
        {selectedProduct && (() => {
          const risk = getRiskLevel(selectedProduct);
          return (
            <div className="flex flex-col gap-5">
              {/* ─── Hero: Product + APY ─── */}
              <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(145deg, ${selectedProduct.color}${ALPHA.muted} 0%, ${selectedProduct.color}${ALPHA.ghost} 100%)`, border: `1px solid ${selectedProduct.color}${ALPHA.soft}` }}>
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: selectedProduct.color + ALPHA.soft, border: `2px solid ${selectedProduct.color}${ALPHA.border}`, boxShadow: `0 0 16px ${selectedProduct.color}${ALPHA.muted}` }}>
                    <span style={{ color: selectedProduct.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: LETTER_SPACING.wide }}>
                      {selectedProduct.asset.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{selectedProduct.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded-md" style={{ background: c.surface2, fontSize: 9, fontWeight: FONT_WEIGHT.semibold, color: c.text3 }}>
                        {selectedProduct.type === 'flexible' ? 'Linh hoạt' : `Cố định ${selectedProduct.lockDays}D`}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md" style={{ background: `${RISK_COLORS[risk]}${ALPHA.muted}`, fontSize: 9, fontWeight: FONT_WEIGHT.semibold, color: RISK_COLORS[risk] }}>
                        Rủi ro {RISK_LABELS[risk]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center px-4 pb-4 pt-1">
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, letterSpacing: LETTER_SPACING.wide, textTransform: 'uppercase' as const }}>APY hiện tại</p>
                  <p style={{ color: c.success, fontSize: 36, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{selectedProduct.apy}%</p>
                  {selectedProduct.apyBonus && (
                    <p className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: withAlpha(c.warning, ALPHA.muted), color: c.warning, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                      <TrendingUp size={10} strokeWidth={ICON_STROKE.emphasis} /> Tối đa {selectedProduct.apyBonus}% cho VIP
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Key info compact grid ─── */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Tối thiểu', value: `${fmtAmount(selectedProduct.minAmount)} ${selectedProduct.asset}`, icon: BarChart3, color: selectedProduct.color },
                  { label: 'Còn lại', value: selectedProduct.remainingQuota, icon: Users, color: '#3B82F6' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}${ALPHA.muted}` }}>
                      <item.icon size={ICON_SIZE.sm} color={item.color} strokeWidth={ICON_STROKE.standard} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: c.text3, fontSize: 9 }}>{item.label}</p>
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Amount input ─── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.medium }}>Số lượng</label>
                  <button onClick={() => setQuickAmount(1)} className="flex items-center gap-1">
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Khả dụng:</span>
                    <span style={{ color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {fmtAmount(balance)} {selectedProduct.asset}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 px-4"
                  style={{
                    background: c.surface2, height: 56, borderRadius: 16,
                    border: `1.5px solid ${amountNum > balance ? c.error : amountNum > 0 && amountNum < selectedProduct.minAmount ? c.error : amountNum >= selectedProduct.minAmount ? c.success + ALPHA.border : c.border}`,
                    transition: 'border-color 0.2s ease',
                  }}>
                  <input type="number" inputMode="decimal"
                    placeholder={`Tối thiểu ${fmtAmount(selectedProduct.minAmount)}`}
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.lg, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.semibold }}
                  />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
                    style={{ background: `${selectedProduct.color}${ALPHA.muted}`, border: `1px solid ${selectedProduct.color}${ALPHA.soft}` }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: selectedProduct.color + ALPHA.border }}>
                      <span style={{ color: selectedProduct.color, fontSize: 7, fontWeight: FONT_WEIGHT.bold }}>{selectedProduct.asset[0]}</span>
                    </div>
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{selectedProduct.asset}</span>
                  </div>
                </div>
                {amountNum > 0 && amountNum < selectedProduct.minAmount && (
                  <p className="mt-1.5 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                    <AlertTriangle size={12} strokeWidth={ICON_STROKE.emphasis} /> Tối thiểu {fmtAmount(selectedProduct.minAmount)} {selectedProduct.asset}
                  </p>
                )}
                {amountNum > balance && (
                  <p className="mt-1.5 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                    <AlertTriangle size={12} strokeWidth={ICON_STROKE.emphasis} /> Vượt quá số dư khả dụng
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {[{ label: '25%', pct: 0.25 }, { label: '50%', pct: 0.5 }, { label: '75%', pct: 0.75 }, { label: 'Max', pct: 1 }].map(q => {
                    const isActive = amount !== '' && Math.abs(parseFloat(amount) - balance * q.pct) < 0.000001;
                    return (
                      <button key={q.label} onClick={() => setQuickAmount(q.pct)}
                        className="flex-1 py-2 rounded-xl"
                        style={{
                          background: isActive ? withAlpha(c.primary, ALPHA.muted) : c.surface2,
                          color: isActive ? c.primary : c.text2,
                          border: `1px solid ${isActive ? withAlpha(c.primary, ALPHA.border) : c.border}`,
                          fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
                          transition: 'all 0.2s ease',
                        }}>
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Earnings Preview ─── */}
              {amountNum >= selectedProduct.minAmount && amountNum <= balance && (
                <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${withAlpha(c.success, ALPHA.ghost)} 0%, transparent 100%)`, border: `1px solid ${withAlpha(c.success, ALPHA.soft)}` }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${withAlpha(c.success, ALPHA.ghost)}` }}>
                    <TrendingUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.standard} />
                    <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Dự kiến lợi nhuận</span>
                  </div>
                  <div className="px-4 py-2">
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Dự kiến nhận về</span>
                      <span style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                        +{estimatedEarning.toFixed(6)} {selectedProduct.asset}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Thời gian</span>
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, fontFamily: 'monospace' }}>
                        {selectedProduct.lockDays ? `${selectedProduct.lockDays} ngày` : '365 ngày (linh hoạt)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Phí đăng ký</span>
                      <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Miễn phí</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Locked product warning ─── */}
              {selectedProduct.type === 'locked' && (
                <div className="flex items-start gap-2.5 rounded-xl p-3"
                  style={{ background: withAlpha(c.warning, ALPHA.ghost), border: `1px solid ${withAlpha(c.warning, ALPHA.soft)}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: withAlpha(c.warning, ALPHA.muted) }}>
                    <AlertTriangle size={ICON_SIZE.sm} color={c.warning} strokeWidth={ICON_STROKE.emphasis} />
                  </div>
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    Sản phẩm cố định <span style={{ fontWeight: FONT_WEIGHT.semibold, color: c.warning }}>không thể rút sớm</span> hoặc sẽ mất lãi nếu rút trước hạn. Vui lòng đảm bảo bạn không cần sử dụng khoản tiền này trong <span style={{ fontWeight: FONT_WEIGHT.semibold }}>{selectedProduct.lockDays} ngày</span>.
                  </span>
                </div>
              )}

              {/* ─── Consent ─── */}
              <button onClick={() => { setAgreed(!agreed); hapticLight(); }} className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: agreed ? withAlpha(c.success, ALPHA.ghost) : c.surface2, border: `1px solid ${agreed ? withAlpha(c.success, ALPHA.soft) : c.border}`, transition: 'all 0.2s ease' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    borderWidth: 2, borderStyle: 'solid',
                    borderColor: agreed ? c.success : c.text3,
                    background: agreed ? c.success : 'transparent',
                    transition: 'all 0.2s ease',
                    boxShadow: agreed ? `0 0 8px ${c.success}40` : 'none',
                  }}>
                  {agreed && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, textAlign: 'left' as const }}>
                  Tôi đã đọc và đồng ý với <span style={{ color: c.primary, fontWeight: FONT_WEIGHT.medium }}>điều khoản Tiết kiệm</span> và{' '}
                  <span style={{ color: c.primary, fontWeight: FONT_WEIGHT.medium }}>chính sách rủi ro</span>. APY có thể thay đổi.
                </span>
              </button>

              {/* ─── CTA ─── */}
              <CTAButton variant="success" onClick={handleSubscribe} disabled={!canSubscribe}>
                {canSubscribe
                  ? `Xác nhận · ${fmtAmount(amountNum)} ${selectedProduct.asset}`
                  : amountNum > 0 && amountNum < selectedProduct.minAmount
                    ? `Tối thiểu ${fmtAmount(selectedProduct.minAmount)} ${selectedProduct.asset}`
                    : !agreed && amountNum >= selectedProduct.minAmount && amountNum <= balance
                      ? 'Vui lòng đồng ý điều khoản'
                      : 'Nhập số lượng'}
              </CTAButton>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Redeem BottomSheet ─── */}
      <BottomSheetV2 open={!!redeemPosition} onClose={() => setRedeemPosition(null)} title="Rút Tiết kiệm">
        {redeemPosition && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3" style={{ marginTop: -4 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: redeemPosition.color + '22', border: `1.5px solid ${redeemPosition.color}44` }}>
                <span style={{ color: redeemPosition.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                  {redeemPosition.asset.slice(0, 3)}
                </span>
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{redeemPosition.product}</p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  Đang gửi: {fmtAmount(redeemPosition.amount)} {redeemPosition.asset}
                </p>
              </div>
            </div>

            <BottomSheetRow label="Lãi tích luỹ" value={`+${fmtAmount(redeemPosition.earned)} ${redeemPosition.asset}`} valueColor="#10B981" />
            <BottomSheetRow label="APY hiện tại" value={`${redeemPosition.apy}%`} valueColor="#10B981" />

            {/* Early withdrawal warning for locked */}
            {redeemPosition.type === 'locked' && redeemPosition.endDate && (
              <div className="flex items-start gap-2 rounded-xl p-3"
                style={{ background: withAlpha(c.error, ALPHA.ghost), border: `1px solid ${withAlpha(c.error, ALPHA.soft)}` }}>
                <AlertTriangle size={ICON_SIZE.sm} color={c.error} strokeWidth={ICON_STROKE.standard} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: c.error, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Rút sớm — Mất toàn bộ lãi</p>
                  <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginTop: 2 }}>
                    Sản phẩm cố định đáo hạn ngày {redeemPosition.endDate}. Rút trước hạn sẽ mất toàn bộ lãi tích luỹ
                    ({fmtAmount(redeemPosition.earned)} {redeemPosition.asset}).
                  </p>
                </div>
              </div>
            )}

            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Số lượng rút ({redeemPosition.asset})</label>
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                  Tối đa: <span style={{ color: c.text1, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                    {fmtAmount(redeemPosition.amount)} {redeemPosition.asset}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4"
                style={{
                  background: c.surface2,
                  border: `1.5px solid ${redeemNum > redeemPosition.amount ? '#EF4444' : c.borderSolid}`,
                  height: 52, borderRadius: 14,
                }}>
                <input
                  type="number" inputMode="decimal"
                  placeholder="0.00"
                  value={redeemAmount}
                  onChange={e => setRedeemAmount(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: FONT_SCALE.base, flex: 1, fontFamily: 'monospace',
                  }}
                />
                <span style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>{redeemPosition.asset}</span>
              </div>
              {redeemNum > redeemPosition.amount && (
                <p className="mt-1 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                  <AlertTriangle size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.standard} /> Vượt quá số lượng đang gửi
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {[{ label: '25%', pct: 0.25 }, { label: '50%', pct: 0.5 }, { label: '75%', pct: 0.75 }, { label: 'Tất cả', pct: 1 }].map(q => (
                  <button key={q.label} onClick={() => setQuickRedeemAmount(q.pct)}
                    className="flex-1 py-1.5 rounded-xl text-xs"
                    style={{
                      background: c.chipBg, color: c.chipText,
                      border: `1px solid ${c.chipBorder}`, fontWeight: FONT_WEIGHT.semibold,
                    }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Redeem summary */}
            {redeemNum > 0 && redeemNum <= redeemPosition.amount && (
              <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Số lượng rút" value={`${fmtAmount(redeemNum)} ${redeemPosition.asset}`} highlight />
                <BottomSheetRow label="Phí rút" value="0 (miễn phí)" valueColor="#10B981" />
                <BottomSheetRow label="Thời gian xử lý"
                  value={redeemPosition.type === 'flexible' ? 'Tức thì' : 'T+1 (1 ngày làm việc)'} />
                {redeemPosition.type === 'locked' && (
                  <BottomSheetRow label="Lãi mất" value={`-${fmtAmount(redeemPosition.earned)} ${redeemPosition.asset}`} valueColor="#EF4444" highlight />
                )}
              </div>
            )}

            {/* Consent */}
            <button onClick={() => { setRedeemAgreed(!redeemAgreed); hapticLight(); }} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  borderColor: redeemAgreed ? (redeemPosition.type === 'locked' ? '#EF4444' : '#10B981') : c.borderSolid,
                  background: redeemAgreed ? (redeemPosition.type === 'locked' ? '#EF4444' : '#10B981') : 'transparent',
                }}>
                {redeemAgreed && <CheckCircle size={ICON_SIZE.sm} color="#fff" />}
              </div>
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, textAlign: 'left' }}>
                {redeemPosition.type === 'locked'
                  ? 'Tôi hiểu rằng rút sớm sẽ mất toàn bộ lãi tích luỹ và đồng ý tiếp tục.'
                  : 'Tôi xác nhận rút tiết kiệm và đồng ý với điều khoản xử lý.'}
              </span>
            </button>

            {/* Confirm */}
            <CTAButton
              variant={redeemPosition.type === 'locked' ? 'danger' : 'primary'}
              onClick={handleRedeem}
              disabled={!canRedeem}
            >
              {canRedeem
                ? redeemPosition.type === 'locked'
                  ? `Xác nhận rút sớm · Mất lãi`
                  : `Xác nhận rút · ${fmtAmount(redeemNum)} ${redeemPosition.asset}`
                : 'Nhập số lượng rút'}
            </CTAButton>
          </div>
        )}
      </BottomSheetV2>

      {/* ─── Success Toasts ─── */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #10B981',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={ICON_SIZE.md} color={c.success} strokeWidth={ICON_STROKE.standard} />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Đăng ký thành công!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Lãi bắt đầu tính từ hôm nay.</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={ICON_SIZE.base} color={c.text3} strokeWidth={ICON_STROKE.standard} /></button>
        </div>
      )}
      {showRedeemSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: c.surface, border: '1px solid #3B82F6',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto',
          }}>
          <CheckCircle size={ICON_SIZE.md} color={c.primary} strokeWidth={ICON_STROKE.standard} />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Yêu cầu rút đã gửi!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Tiền sẽ về ví trong thời gian xử lý.</p>
          </div>
          <button onClick={() => setShowRedeemSuccess(false)}><X size={ICON_SIZE.base} color={c.text3} strokeWidth={ICON_STROKE.standard} /></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="Tiết kiệm" subtitle="Earn · Tài chính" back />

      {/* ─── Summary Card (matched to Home PortfolioCard) ─── */}
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
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span style={{ color: c.portfolioTextDim, fontSize: FONT_SCALE.sm }}>Tổng tiền gửi (USD)</span>
          <PiggyBank size={ICON_SIZE.base} color={c.portfolioTextDim} strokeWidth={ICON_STROKE.standard} />
        </div>

        {/* Balance */}
        <p
          className="relative z-10"
          style={{
            color: '#FFFFFF',
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          {fmtUsd(totalDeposited)}
        </p>

        {/* PnL */}
        <div className="flex items-center gap-2.5 mt-2 mb-5 relative z-10">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <TrendingUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.emphasis} />
            <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              +{fmtUsd(totalEarned)} ({avgApy.toFixed(1)}%)
            </span>
          </div>
          <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>lãi tích luỹ</span>
        </div>

        {/* Action buttons — 3 equal columns */}
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={() => { navigate(`${prefix}/earn/savings/portfolio`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
              color: '#fff',
              fontSize: φ.sm,
              fontWeight: FONT_WEIGHT.semibold,
              boxShadow: '0 4px 14px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Wallet size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Danh mục
          </button>
          <button
            onClick={() => { setTab('products'); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: φ.sm,
              fontWeight: FONT_WEIGHT.semibold,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowDownToLine size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Gửi
          </button>
          <button
            onClick={() => { setTab('my'); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5 ripple"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: φ.sm,
              fontWeight: FONT_WEIGHT.semibold,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowUpFromLine size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Rút
          </button>
        </div>
      </div>

      {/* ═══ LAYER 2 — Smart Contextual Cards ═══ */}
      <div className="flex flex-col gap-2 mx-5 mt-4">
        {/* Card 1: APY optimization suggestion */}
        <button
          onClick={() => { navigate(`${prefix}/earn/savings/recommendations`); hapticSelection(); }}
          className="flex items-center gap-3 rounded-2xl p-3 w-full text-left"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)' }}>
            <Sparkles size={ICON_SIZE.base} color="#8B5CF6" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>APY có thể cao hơn 1.2%</p>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>3 gợi ý tối ưu danh mục cho bạn</p>
          </div>
          <ChevronRight size={ICON_SIZE.sm} color={c.text3} className="shrink-0" />
        </button>

        {/* Card 2: Upcoming maturity */}
        {MY_SAVINGS.some(p => p.type === 'locked') && (
          <button
            onClick={() => { navigate(`${prefix}/earn/savings/portfolio`); hapticSelection(); }}
            className="flex items-center gap-3 rounded-2xl p-3 w-full text-left"
            style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Clock size={ICON_SIZE.base} color="#F59E0B" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>BTC sắp đáo hạn 7 ngày nữa</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Xem chi tiết và lên kế hoạch tái đầu tư</p>
            </div>
            <ChevronRight size={ICON_SIZE.sm} color={c.text3} className="shrink-0" />
          </button>
        )}

        {/* Card 3: DCA setup prompt */}
        <button
          onClick={() => { navigate(`${prefix}/earn/savings/dca`); hapticSelection(); }}
          className="flex items-center gap-3 rounded-2xl p-3 w-full text-left"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Repeat size={ICON_SIZE.base} color="#10B981" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tiết kiệm tự động mỗi tuần</p>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Thiết lập DCA để tích luỹ đều đặn</p>
          </div>
          <ChevronRight size={ICON_SIZE.sm} color={c.text3} className="shrink-0" />
        </button>
      </div>

      {/* ═══ LAYER 3 — Advanced Toolbox Toggle ═══ */}
      <div className="mx-5 mt-3">
        <button
          onClick={() => { setShowToolbox(true); hapticLight(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <Wrench size={ICON_SIZE.sm} color={c.text3} />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            Công cụ nâng cao
          </span>
          <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
        </button>
      </div>

      {/* ═══ Toolbox BottomSheet ═══ */}
      <BottomSheetV2
        open={showToolbox}
        onClose={() => setShowToolbox(false)}
        title="Công cụ nâng cao"
      >
        <div className="flex flex-col gap-5">
          {/* Group: Quản lý */}
          <ToolboxGroup label="Quản lý" color="#3B82F6" c={c}>
            <ToolboxItem icon={Wallet} label="Danh mục" desc="Tổng quan vị thế" color="#3B82F6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/portfolio`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Clock} label="Lịch sử GD" desc="Giao dịch gần đây" color="#8B5CF6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/history`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Download} label="Xuất báo cáo" desc="Tải file PDF/CSV" color="#3B82F6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/export`); setShowToolbox(false); hapticSelection(); }} />
          </ToolboxGroup>

          {/* Group: Tối ưu */}
          <ToolboxGroup label="Tối ưu hoá" color="#10B981" c={c}>
            <ToolboxItem icon={Sparkles} label="Gợi ý cho bạn" desc="Chiến lược phù hợp" color="#8B5CF6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/recommendations`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={ArrowLeftRight} label="So sánh SP" desc="So sánh sản phẩm" color="#10B981" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/comparison`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={RefreshCw} label="Lãi kép" desc="Tự động tái đầu tư" color="#3B82F6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/auto-compound`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Repeat} label="DCA tự động" desc="Tiết kiệm định kỳ" color="#10B981" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/dca`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={RefreshCw} label="Tái cân bằng" desc="Cân lại danh mục" color="#8B5CF6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/rebalance`); setShowToolbox(false); hapticSelection(); }} />
          </ToolboxGroup>

          {/* Group: Phân tích */}
          <ToolboxGroup label="Phân tích" color="#F59E0B" c={c}>
            <ToolboxItem icon={BarChart3} label="Phân tích" desc="Biểu đồ & xu hướng" color="#10B981" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/analytics`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Lightbulb} label="Gợi ý AI" desc="Tín hiệu & xu hướng APY" color="#F59E0B" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/smart-suggestions`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Activity} label="Mô phỏng" desc="Backtest chiến lược" color="#8B5CF6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/backtest`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Layers} label="Ladder" desc="Bậc thang đáo hạn" color="#F59E0B" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/ladder`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={CloudLightning} label="What-If" desc="Kịch bản stress test" color="#EF4444" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/whatif`); setShowToolbox(false); hapticSelection(); }} />
          </ToolboxGroup>

          {/* Group: Cài đặt */}
          <ToolboxGroup label="Cài đặt & An toàn" color="#8B5CF6" c={c}>
            <ToolboxItem icon={Target} label="Mục tiêu" desc="Đặt mục tiêu tài chính" color="#F59E0B" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/goals`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Brain} label="AutoPilot" desc="Quản lý tự động" color="#10B981" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/autopilot`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Shield} label="Đánh giá rủi ro" desc="Quiz hồ sơ rủi ro" color="#F59E0B" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/risk-assessment`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Bell} label="Cài đặt TB" desc="Tuỳ chỉnh thông báo" color="#EF4444" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/notification-preferences`); setShowToolbox(false); hapticSelection(); }} />
          </ToolboxGroup>

          {/* Group: Hỗ trợ */}
          <ToolboxGroup label="Hỗ trợ" color="#6B7280" c={c}>
            <ToolboxItem icon={Info} label="Hướng dẫn" desc="Cách sử dụng Tiết kiệm" color="#10B981" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/guide`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={AlertTriangle} label="FAQ" desc="Câu hỏi thường gặp" color="#F59E0B" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/faq`); setShowToolbox(false); hapticSelection(); }} />
            <ToolboxItem icon={Bell} label="Thông báo" desc="Lịch sử thông báo" color="#3B82F6" c={c}
              onClick={() => { navigate(`${prefix}/earn/savings/notifications`); setShowToolbox(false); hapticSelection(); }} />
          </ToolboxGroup>
        </div>
      </BottomSheetV2>

      {/* ─── TabBar (segment variant) ─── */}
      <div className="px-5 mt-4">
        <TabBar
          variant="segment"
          tabs={[
            { id: 'products', label: 'Sản phẩm' },
            { id: 'my', label: `Đang ký (${MY_SAVINGS.length})` },
          ] as const}
          active={tab}
          onChange={(t) => setTab(t as 'products' | 'my')}
        />
      </div>

      {/* ═══ Products Tab ═══ */}
      {tab === 'products' && (
        <PageContent padding="compact" gap="default">
          {/* Type filter chips */}
          <div className="flex gap-2">
            {[
              { id: 'all' as const, label: 'Tất cả', icon: Zap },
              { id: 'flexible' as const, label: 'Linh hoạt', icon: Unlock },
              { id: 'locked' as const, label: 'Cố định', icon: Lock },
            ].map(f => (
              <button key={f.id}
                onClick={() => { setTypeFilter(f.id); hapticSelection(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: typeFilter === f.id ? c.chipActiveBg : c.chipBg,
                  color: typeFilter === f.id ? c.chipActiveText : c.chipText,
                  border: `1px solid ${typeFilter === f.id ? c.chipActiveBorder : c.chipBorder}`,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                <f.icon size={ICON_SIZE.sm} />
                {f.label}
              </button>
            ))}
          </div>

          {/* Product list */}
          {isLoading ? <SkeletonList rows={4} /> : (
            <div className="flex flex-col gap-3">
              {filtered.map(product => {
                const risk = getRiskLevel(product);
                const capacity = CAPACITY_PCT[product.id] ?? 50;
                const participants = PARTICIPANTS[product.id] ?? 0;
                return (
                  <TrCard key={product.id} hover className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: product.color + '22', border: `1.5px solid ${product.color}44` }}>
                        <span style={{ color: product.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {product.asset.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{product.name}</span>
                          {product.isHot && (
                            <span className="px-1.5 py-0.5 rounded-md shrink-0"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>
                              HOT
                            </span>
                          )}
                          {product.isNew && (
                            <span className="px-1.5 py-0.5 rounded-md shrink-0"
                              style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>
                              MỚI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1">
                            {product.type === 'flexible'
                              ? <Unlock size={ICON_SIZE.sm} color="#10B981" />
                              : <Lock size={ICON_SIZE.sm} color="#F59E0B" />}
                            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                              {product.type === 'flexible' ? 'Linh hoạt' : `${product.lockDays} ngày`}
                            </span>
                          </div>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                            {participants.toLocaleString()} người
                          </span>
                          <span className="px-1.5 py-0.5 rounded"
                            style={{
                              background: RISK_COLORS[risk] + '15',
                              color: RISK_COLORS[risk],
                              fontSize: 9, fontWeight: FONT_WEIGHT.semibold,
                            }}>
                            {RISK_LABELS[risk]}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ color: '#10B981', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{product.apy}%</p>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY</p>
                        {product.apyBonus && (
                          <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                            Tối đa {product.apyBonus}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                          Đã ký: {product.totalSubscribed}
                        </span>
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                          Còn: {product.remainingQuota}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            background: capacity > 85 ? '#EF4444' : product.color,
                            width: `${capacity}%`,
                          }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3"
                      style={{ borderTop: `1px solid ${c.divider}` }}>
                      <button
                        onClick={() => navigate(`${prefix}/earn/savings/product/${product.id}`)}
                        className="flex items-center gap-1"
                        style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        Chi tiết <ChevronRight size={ICON_SIZE.sm} />
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(product); hapticSelection(); }}
                        className="px-4 py-2 rounded-xl"
                        style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        Đăng ký
                      </button>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}
        </PageContent>
      )}

      {/* ═══ My Savings Tab ═══ */}
      {tab === 'my' && (
        <PageContent padding="compact" gap="default">
          {MY_SAVINGS.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: c.surface2 }}>
                <PiggyBank size={ICON_SIZE.xl} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa có sản phẩm nào</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Bắt đầu gửi tiết kiệm để nhận lãi hàng ngày một cách an toàn.
              </p>
              <button onClick={() => { setTab('products'); hapticSelection(); }}
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {MY_SAVINGS.map(pos => {
                const daysLeft = pos.endDate
                  ? Math.max(0, Math.ceil(
                      (new Date(pos.endDate.split('/').reverse().join('-')).getTime() - Date.now()) / 86400000
                    ))
                  : null;
                const totalLockDays = (pos as any).lockDays ?? 60;
                const progress = daysLeft != null
                  ? Math.max(0, Math.min(100, ((totalLockDays - daysLeft) / totalLockDays) * 100))
                  : null;

                return (
                  <TrCard key={pos.id} className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: pos.color + '22', border: `1.5px solid ${pos.color}44` }}>
                          <span style={{ color: pos.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {pos.asset.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{pos.product}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {pos.type === 'flexible'
                              ? <Unlock size={ICON_SIZE.sm} color="#10B981" />
                              : <Lock size={ICON_SIZE.sm} color="#F59E0B" />}
                            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                              {pos.type === 'flexible' ? 'Linh hoạt' : `Đến ${pos.endDate}`}
                            </span>
                            <span className="px-1.5 py-0.5 rounded"
                              style={{
                                background: RISK_COLORS[pos.riskLevel] + '15',
                                color: RISK_COLORS[pos.riskLevel],
                                fontSize: 9, fontWeight: FONT_WEIGHT.semibold,
                              }}>
                              {RISK_LABELS[pos.riskLevel]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{pos.apy}% APY</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Số lượng</p>
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                          {fmtAmount(pos.amount)} {pos.asset}
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lãi tích luỹ</p>
                        <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                          +{fmtAmount(pos.earned)} {pos.asset}
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Từ ngày</p>
                        <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{pos.startDate}</p>
                      </div>
                    </div>

                    {/* Progress bar for locked */}
                    {progress !== null && daysLeft !== null && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Tiến trình</span>
                          <span style={{ color: daysLeft <= 3 ? '#F59E0B' : c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                            {daysLeft === 0 ? 'Đáo hạn hôm nay!' : `Còn ${daysLeft} ngày`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                          <div className="h-full rounded-full" style={{ background: pos.color, width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {pos.type === 'flexible' && (
                        <button
                          onClick={() => { navigate(`${prefix}/earn/savings/redeem/${pos.id}`); hapticSelection(); }}
                          className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          style={{
                            background: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                            border: '1px solid rgba(59,130,246,0.2)', fontWeight: FONT_WEIGHT.semibold,
                          }}>
                          <ArrowUpFromLine size={ICON_SIZE.sm} />
                          Rút
                        </button>
                      )}
                      {pos.type === 'locked' && (
                        <button
                          onClick={() => { navigate(`${prefix}/earn/savings/redeem/${pos.id}`); hapticSelection(); }}
                          className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          style={{
                            background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                            border: '1px solid rgba(239,68,68,0.2)', fontWeight: FONT_WEIGHT.semibold,
                          }}>
                          <AlertTriangle size={ICON_SIZE.sm} />
                          Rút sớm
                        </button>
                      )}
                      <button
                        className="flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                        style={{
                          background: c.chipBg, color: c.chipText,
                          border: `1px solid ${c.chipBorder}`, fontWeight: FONT_WEIGHT.semibold,
                        }}>
                        <Info size={ICON_SIZE.sm} />
                        Chi tiết
                      </button>
                    </div>
                  </TrCard>
                );
              })}

              {/* Daily earning summary */}
              <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={ICON_SIZE.sm} color="#10B981" />
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Thu nhập ước tính</p>
                </div>
                <div className="flex justify-between">
                  {[
                    { l: 'Hàng ngày', v: fmtUsd(totalEarned / 60) },
                    { l: 'Hàng tháng', v: fmtUsd(totalEarned / 2) },
                    { l: 'Hàng năm', v: fmtUsd(totalEarned * 6) },
                  ].map(r => (
                    <div key={r.l}>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{r.l}</p>
                      <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>+{r.v}</p>
                    </div>
                  ))}
                </div>
              </TrCard>
            </div>
          )}
        </PageContent>
      )}
    </PageLayout>
  );
}