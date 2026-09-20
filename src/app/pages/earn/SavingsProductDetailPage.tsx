import React, { useState, useMemo } from 'react';
import {
  Lock, Unlock, TrendingUp, Shield, Users, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Check, Info, Calendar, BarChart3, X,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate, useParams } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { SAVINGS_PRODUCTS, type SavingsProduct } from '../../data/mockData';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useIsDark } from '../../hooks/useIsDark';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ─── Mock: Historical APY data ─── */
const APY_HISTORY = [
  { date: '09/2025', apy: 3.8 },
  { date: '10/2025', apy: 4.2 },
  { date: '11/2025', apy: 4.0 },
  { date: '12/2025', apy: 4.5 },
  { date: '01/2026', apy: 4.3 },
  { date: '02/2026', apy: 4.5 },
  { date: '03/2026', apy: 4.5 },
];

/* ─── Mock balances ─── */
const MOCK_BALANCES: Record<string, number> = {
  USDT: 12500, BTC: 0.15, ETH: 3.2, SOL: 120,
};

const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

const CAPACITY_PCT: Record<string, number> = {
  sav001: 62, sav002: 90, sav003: 93, sav004: 48,
  sav005: 82, sav006: 55, sav007: 35,
};

const PARTICIPANTS: Record<string, number> = {
  sav001: 45230, sav002: 12480, sav003: 6720, sav004: 18340,
  sav005: 9120, sav006: 15670, sav007: 4890,
};

function getRiskLevel(product: SavingsProduct): 'low' | 'medium' | 'high' {
  if (product.type === 'flexible') return 'low';
  if (product.lockDays && product.lockDays >= 90) return 'medium';
  return 'low';
}

export function SavingsProductDetailPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { productId } = useParams<{ productId: string }>();
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();

  const product = SAVINGS_PRODUCTS.find(p => p.id === productId);

  /* Subscribe bottom sheet */
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* Calculator state */
  const [calcAmount, setCalcAmount] = useState('1000');

  /* Reset on sheet toggle */
  React.useEffect(() => { setAmount(''); setAgreed(false); }, [showSubscribe]);

  if (!product) {
    return (
      <PageLayout>
        <Header title="Sản phẩm" back />
        <PageContent>
          <div className="flex flex-col items-center py-20 gap-3">
            <AlertTriangle size={ICON_SIZE.xxl} color={c.text3} strokeWidth={ICON_STROKE.standard} />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Không tìm thấy sản phẩm</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-2xl text-white"
              style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
              Quay lại
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const risk = getRiskLevel(product);
  const capacity = CAPACITY_PCT[product.id] ?? 50;
  const participants = PARTICIPANTS[product.id] ?? 0;
  const balance = MOCK_BALANCES[product.asset] ?? 0;
  const amountNum = parseFloat(amount || '0');
  const estimatedEarning = amountNum * (product.apy / 100) * ((product.lockDays ?? 365) / 365);
  const canSubscribe = amountNum >= product.minAmount && amountNum <= balance && agreed;

  const calcNum = parseFloat(calcAmount || '0');
  const calcDaily = calcNum * (product.apy / 100) / 365;
  const calcMonthly = calcDaily * 30;
  const calcYearly = calcNum * (product.apy / 100);

  const handleSubscribe = () => {
    if (!canSubscribe) return;
    hapticSuccess();
    setShowSubscribe(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate(`${prefix}/earn/savings/receipt`, {
        state: {
          type: 'subscribe',
          product: product.name,
          asset: product.asset,
          amount: amountNum,
          apy: product.apy,
          lockDays: product.lockDays,
          estimatedEarning,
        },
      });
    }, 1500);
  };

  const setQuickAmount = (pct: number) => {
    hapticLight();
    const val = balance * pct;
    setAmount(val % 1 === 0 ? val.toString() : val.toFixed(6));
  };

  return (
    <PageLayout variant="flush">
      {/* ─── Subscribe BottomSheet ─── */}
      <BottomSheetV2 open={showSubscribe} onClose={() => setShowSubscribe(false)} title="Đăng ký Tiết kiệm">
        <div className="flex flex-col gap-5">
          {/* ─── Hero: Product + APY ─── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(145deg, ${product.color}${ALPHA.muted} 0%, ${product.color}${ALPHA.ghost} 100%)`, border: `1px solid ${product.color}${ALPHA.soft}` }}>
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: product.color + ALPHA.soft, border: `2px solid ${product.color}${ALPHA.border}`, boxShadow: `0 0 16px ${product.color}${ALPHA.muted}` }}>
                <span style={{ color: product.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: LETTER_SPACING.wide }}>
                  {product.asset.slice(0, 3)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{product.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-md" style={{ background: c.surface2, fontSize: 9, fontWeight: FONT_WEIGHT.semibold, color: c.text3 }}>
                    {product.type === 'flexible' ? 'Linh hoạt' : `Cố định ${product.lockDays}D`}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md" style={{ background: `${RISK_COLORS[risk]}${ALPHA.muted}`, fontSize: 9, fontWeight: FONT_WEIGHT.semibold, color: RISK_COLORS[risk] }}>
                    Rủi ro {RISK_LABELS[risk]}
                  </span>
                </div>
              </div>
            </div>
            {/* APY display */}
            <div className="text-center px-4 pb-4 pt-1">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, letterSpacing: LETTER_SPACING.wide, textTransform: 'uppercase' as const }}>APY hiện tại</p>
              <p style={{ color: c.success, fontSize: 36, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{product.apy}%</p>
              {product.apyBonus && (
                <p className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: withAlpha(c.warning, ALPHA.muted), color: c.warning, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                  <TrendingUp size={10} strokeWidth={ICON_STROKE.emphasis} /> Tối đa {product.apyBonus}% cho VIP
                </p>
              )}
            </div>
          </div>

          {/* ─── Key info compact grid ─── */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Tối thiểu', value: `${fmtAmount(product.minAmount)} ${product.asset}`, icon: BarChart3, color: product.color },
              { label: 'Còn lại', value: product.remainingQuota, icon: Users, color: '#3B82F6' },
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
                  {fmtAmount(balance)} {product.asset}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 px-4"
              style={{
                background: c.surface2, height: 56, borderRadius: 16,
                border: `1.5px solid ${amountNum > balance ? c.error : amountNum > 0 && amountNum < product.minAmount ? c.error : amountNum >= product.minAmount ? c.success + ALPHA.border : c.border}`,
                transition: 'border-color 0.2s ease',
              }}>
              <input type="number" inputMode="decimal"
                placeholder={`Tối thiểu ${fmtAmount(product.minAmount)}`}
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.lg, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.semibold }}
              />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
                style={{ background: `${product.color}${ALPHA.muted}`, border: `1px solid ${product.color}${ALPHA.soft}` }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: product.color + ALPHA.border }}>
                  <span style={{ color: product.color, fontSize: 7, fontWeight: FONT_WEIGHT.bold }}>{product.asset[0]}</span>
                </div>
                <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{product.asset}</span>
              </div>
            </div>
            {/* Validation messages */}
            {amountNum > 0 && amountNum < product.minAmount && (
              <p className="mt-1.5 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                <AlertTriangle size={12} strokeWidth={ICON_STROKE.emphasis} /> Tối thiểu {fmtAmount(product.minAmount)} {product.asset}
              </p>
            )}
            {amountNum > balance && (
              <p className="mt-1.5 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                <AlertTriangle size={12} strokeWidth={ICON_STROKE.emphasis} /> Vượt quá số dư khả dụng
              </p>
            )}
            {/* Quick amount chips */}
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
          {amountNum >= product.minAmount && amountNum <= balance && (
            <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${withAlpha(c.success, ALPHA.ghost)} 0%, transparent 100%)`, border: `1px solid ${withAlpha(c.success, ALPHA.soft)}` }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${withAlpha(c.success, ALPHA.ghost)}` }}>
                <TrendingUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Dự kiến lợi nhuận</span>
              </div>
              <div className="px-4 py-2">
                <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Dự kiến nhận về</span>
                  <span style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                    +{estimatedEarning.toFixed(6)} {product.asset}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Thời gian</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, fontFamily: 'monospace' }}>
                    {product.lockDays ? `${product.lockDays} ngày` : '365 ngày (linh hoạt)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Phí đăng ký</span>
                  <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Miễn phí</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Lãi bắt đầu</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>T+0 (từ hôm nay)</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Locked product warning ─── */}
          {product.type === 'locked' && (
            <div className="flex items-start gap-2.5 rounded-xl p-3"
              style={{ background: withAlpha(c.warning, ALPHA.ghost), border: `1px solid ${withAlpha(c.warning, ALPHA.soft)}` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: withAlpha(c.warning, ALPHA.muted) }}>
                <AlertTriangle size={ICON_SIZE.sm} color={c.warning} strokeWidth={ICON_STROKE.emphasis} />
              </div>
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                Sản phẩm cố định <span style={{ fontWeight: FONT_WEIGHT.semibold, color: c.warning }}>không thể rút sớm</span> hoặc sẽ mất lãi nếu rút trước hạn. Vui lòng đảm bảo bạn không cần sử dụng khoản tiền này trong <span style={{ fontWeight: FONT_WEIGHT.semibold }}>{product.lockDays} ngày</span>.
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
              ? `Xác nhận · ${fmtAmount(amountNum)} ${product.asset}`
              : amountNum > 0 && amountNum < product.minAmount
                ? `Tối thiểu ${fmtAmount(product.minAmount)} ${product.asset}`
                : !agreed && amountNum >= product.minAmount && amountNum <= balance
                  ? 'Vui lòng đồng ý điều khoản'
                  : 'Nhập số lượng'}
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${c.success}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={ICON_SIZE.md} color={c.success} strokeWidth={ICON_STROKE.standard} />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Đăng ký thành công!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Đang chuyển tới biên nhận...</p>
          </div>
        </div>
      )}

      <Header title={product.name} back />

      <PageContent gap="relaxed" grow>
        {/* ─── Hero: APY & core info ─── */}
        <div className="rounded-3xl p-5 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${product.color}18 0%, ${product.color}08 100%)`, border: `1px solid ${product.color}22` }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: product.color + '22', border: `1.5px solid ${product.color}44` }}>
              <span style={{ color: product.color, fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>{product.asset.slice(0, 3)}</span>
            </div>
            <span style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold }}>{product.name}</span>
            {product.isHot && (
              <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>HOT</span>
            )}
            {product.isNew && (
              <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>MỚI</span>
            )}
          </div>
          <p style={{ color: '#10B981', fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{product.apy}%</p>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>APY hiện tại</p>
          {product.apyBonus && (
            <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginTop: 4 }}>
              VIP tối đa {product.apyBonus}%
            </p>
          )}
        </div>

        {/* ─── Key info grid ─── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: product.type === 'flexible' ? Unlock : Lock,
              iconColor: product.type === 'flexible' ? '#10B981' : '#F59E0B',
              label: 'Loại',
              value: product.type === 'flexible' ? 'Linh hoạt' : `Cố định ${product.lockDays}D`,
            },
            { icon: Shield, iconColor: RISK_COLORS[risk], label: 'Rủi ro', value: RISK_LABELS[risk] },
            { icon: Users, iconColor: '#3B82F6', label: 'Người tham gia', value: participants.toLocaleString() },
            {
              icon: BarChart3, iconColor: product.color,
              label: 'Tối thiểu',
              value: `${fmtAmount(product.minAmount)} ${product.asset}`,
            },
          ].map(item => (
            <TrCard key={item.label} className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.iconColor + '15' }}>
                <item.icon size={ICON_SIZE.sm} color={item.iconColor} />
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{item.label}</p>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{item.value}</p>
              </div>
            </TrCard>
          ))}
        </div>

        {/* ─── Capacity ─── */}
        <TrCard className="p-4">
          <PageSection label="Dung lượng sản phẩm">
            <div className="flex justify-between mb-2">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Đã đăng ký: {product.totalSubscribed}</span>
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{capacity}%</span>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: c.borderSolid }}>
              <div className="h-full rounded-full transition-all"
                style={{ background: capacity > 85 ? '#EF4444' : product.color, width: `${capacity}%` }} />
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Còn lại: {product.remainingQuota}</span>
              {capacity > 85 && (
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Sắp hết</span>
              )}
            </div>
          </PageSection>
        </TrCard>

        {/* ─── APY History Chart ─── */}
        <TrCard className="p-4">
          <PageSection label="Lịch sử APY (6 tháng)">
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={APY_HISTORY} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="x" dataKey="date" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis key="y" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={v => `${v}%`} />
                  <Tooltip key="tooltip"
                    contentStyle={{
                      background: isDark ? '#1E293B' : '#fff',
                      border: `1px solid ${c.divider}`,
                      borderRadius: 12, fontSize: FONT_SCALE.xs,
                    }}
                    formatter={(value: number) => [`${value}%`, 'APY']}
                  />
                  <Line key="apy-line" type="monotone" dataKey="apy" stroke="#10B981" strokeWidth={2}
                    dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center" style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
              APY có thể thay đổi theo điều kiện thị trường
            </p>
          </PageSection>
        </TrCard>

        {/* ─── Calculator ─── */}
        <TrCard className="p-4">
          <PageSection label="Máy tính lãi suất">
            <div className="flex items-center gap-3 px-4 mb-3"
              style={{ background: c.surface2, height: 48, borderRadius: 12, border: `1px solid ${c.borderSolid}` }}>
              <input type="number" inputMode="decimal" value={calcAmount}
                onChange={e => setCalcAmount(e.target.value)}
                placeholder="Nhập số lượng"
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.sm, flex: 1, fontFamily: 'monospace' }}
              />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>{product.asset}</span>
            </div>
            {calcNum > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Hàng ngày', value: calcDaily },
                  { label: 'Hàng tháng', value: calcMonthly },
                  { label: 'Hàng năm', value: calcYearly },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{item.label}</p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      +{item.value < 0.001 ? item.value.toFixed(6) : fmtAmount(item.value)}
                    </p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{product.asset}</p>
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </TrCard>

        {/* ─── Terms & Risk ─── */}
        <TrCard className="p-4">
          <PageSection label="Điều khoản & Rủi ro">
            <div className="flex flex-col gap-2">
              {[
                { label: 'Phí đăng ký', value: 'Miễn phí' },
                { label: 'Phí rút', value: product.type === 'flexible' ? 'Miễn phí' : 'Mất lãi nếu rút sớm' },
                { label: 'Thời gian xử lý rút', value: product.type === 'flexible' ? 'Tức thì' : 'T+1 (1 ngày làm việc)' },
                { label: 'Lãi bắt đầu', value: 'T+0 (ngày đăng ký)' },
                { label: 'Trả lãi', value: 'Hàng ngày, tự động cộng dồn' },
                { label: 'Bảo hiểm', value: 'Quỹ bảo hiểm nền tảng' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{row.label}</span>
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>{row.value}</span>
                </div>
              ))}
            </div>
          </PageSection>
        </TrCard>

        {/* Risk disclaimer */}
        <div className="flex items-start gap-2 rounded-xl p-3 mx-0"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
            APY được tính dựa trên lãi suất hiện tại và có thể thay đổi. Sản phẩm tiết kiệm không phải là khoản đầu tư.
            Tài sản được bảo vệ bởi quỹ bảo hiểm nền tảng nhưng không được đảm bảo bởi chính phủ.
          </span>
        </div>

        {/* Spacer for sticky footer */}
        <div className="h-4" />
      </PageContent>

      {/* ─── Sticky CTA ─── */}
      <StickyFooter>
        <CTAButton variant="success" onClick={() => { setShowSubscribe(true); hapticSelection(); }}>
          Đăng ký ngay · {product.apy}% APY
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}