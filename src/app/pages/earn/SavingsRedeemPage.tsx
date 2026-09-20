import React, { useState } from 'react';
import {
  ArrowUpFromLine, Lock, Unlock, AlertTriangle, CheckCircle, Info,
  Clock, Shield, ChevronRight, X,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ─── Mock positions (same as SavingsPage) ─── */
const MY_SAVINGS = [
  {
    id: 'ms1', product: 'USDT Linh hoạt', asset: 'USDT', amount: 3500,
    earned: 14.58, apy: 4.5, startDate: '01/02/2026', endDate: null,
    type: 'flexible' as const, color: '#26A17B', lockDays: null,
  },
  {
    id: 'ms2', product: 'BTC Cố định 60D', asset: 'BTC', amount: 0.02,
    earned: 0.000019, apy: 3.5, startDate: '15/01/2026', endDate: '16/03/2026',
    type: 'locked' as const, color: '#F7931A', lockDays: 60,
  },
  {
    id: 'ms3', product: 'SOL Cố định 30D', asset: 'SOL', amount: 25,
    earned: 0.45, apy: 6.5, startDate: '20/02/2026', endDate: '22/03/2026',
    type: 'locked' as const, color: '#9945FF', lockDays: 30,
  },
];

export function SavingsRedeemPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { positionId } = useParams<{ positionId: string }>();
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();

  const position = MY_SAVINGS.find(p => p.id === positionId);

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!position) {
    return (
      <PageLayout>
        <Header title="Rút Tiết kiệm" back />
        <PageContent>
          <div className="flex flex-col items-center py-20 gap-3">
            <AlertTriangle size={ICON_SIZE.xxl} color={c.text3} strokeWidth={ICON_STROKE.standard} />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Không tìm thấy vị thế</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-2xl text-white"
              style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
              Quay lại
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const amountNum = parseFloat(amount || '0');
  const isEarlyRedeem = position.type === 'locked';
  const lostInterest = isEarlyRedeem ? position.earned : 0;
  const fee = 0; // no fee for now
  const netReceived = amountNum - fee;
  const canProceed = amountNum > 0 && amountNum <= position.amount;
  const canSubmit = canProceed && agreed;

  const daysLeft = position.endDate
    ? Math.max(0, Math.ceil((new Date(position.endDate.split('/').reverse().join('-')).getTime() - Date.now()) / 86400000))
    : null;

  const processingTime = position.type === 'flexible' ? 'Tức thì (< 1 phút)' : 'T+1 (1 ngày làm việc)';

  const setQuickAmount = (pct: number) => {
    hapticLight();
    const val = position.amount * pct;
    setAmount(val % 1 === 0 ? val.toString() : val.toFixed(6));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setProcessing(true);
    hapticSuccess();
    setTimeout(() => {
      setProcessing(false);
      navigate(`${prefix}/earn/savings/receipt`, {
        state: {
          type: 'redeem',
          product: position.product,
          asset: position.asset,
          amount: amountNum,
          apy: position.apy,
          isEarlyRedeem,
          lostInterest,
          fee,
          netReceived,
          processingTime,
        },
      });
    }, 1800);
  };

  return (
    <PageLayout variant="flush">
      {/* ─── Destructive Confirm Sheet (for locked) ─── */}
      <BottomSheetV2 open={showConfirm} onClose={() => setShowConfirm(false)} title="⚠️ Xác nhận rút sớm">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 text-center"
            style={{ background: withAlpha(c.error, ALPHA.ghost), border: `1px solid ${withAlpha(c.error, ALPHA.soft)}` }}>
            <AlertTriangle size={ICON_SIZE.xl} color={c.error} strokeWidth={ICON_STROKE.standard} style={{ margin: '0 auto 8px' }} />
            <p style={{ color: c.error, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>Bạn sẽ mất toàn bộ lãi</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, marginTop: 4, lineHeight: 1.5 }}>
              Rút sớm sản phẩm cố định sẽ mất {fmtAmount(lostInterest)} {position.asset} lãi đã tích luỹ.
              Hành động này không thể hoàn tác.
            </p>
          </div>

          <BottomSheetRow label="Rút" value={`${fmtAmount(amountNum)} ${position.asset}`} highlight />
          <BottomSheetRow label="Lãi mất" value={`-${fmtAmount(lostInterest)} ${position.asset}`} valueColor={c.error} highlight />
          <BottomSheetRow label="Thực nhận" value={`${fmtAmount(netReceived)} ${position.asset}`} highlight />
          <BottomSheetRow label="Đáo hạn gốc" value={position.endDate ?? '—'} />
          <BottomSheetRow label="Còn lại" value={daysLeft !== null ? `${daysLeft} ngày` : '—'} />

          <CTAButton variant="danger" onClick={handleSubmit} loading={processing}>
            {processing ? 'Đang xử lý...' : 'Xác nhận rút sớm — Mất toàn bộ lãi'}
          </CTAButton>
          <button onClick={() => setShowConfirm(false)}
            className="w-full py-3 rounded-2xl text-center"
            style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
            Huỷ — Giữ lại tiết kiệm
          </button>
        </div>
      </BottomSheetV2>

      <Header title="Rút Tiết kiệm" back />

      <PageContent gap="relaxed" grow>
        {/* ─── Position summary ─── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: position.color + '22', border: `1.5px solid ${position.color}44` }}>
              <span style={{ color: position.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                {position.asset.slice(0, 3)}
              </span>
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold }}>{position.product}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {position.type === 'flexible'
                  ? <><Unlock size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.standard} /><span style={{ color: c.success, fontSize: FONT_SCALE.xs }}>Linh hoạt</span></>
                  : <><Lock size={ICON_SIZE.sm} color={c.warning} strokeWidth={ICON_STROKE.standard} /><span style={{ color: c.warning, fontSize: FONT_SCALE.xs }}>Cố định · {daysLeft} ngày còn lại</span></>}
              </div>
            </div>
            <div className="text-right">
              <p style={{ color: c.success, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{position.apy}%</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Đang gửi</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                {fmtAmount(position.amount)}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{position.asset}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lãi tích luỹ</p>
              <p style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                +{fmtAmount(position.earned)}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{position.asset}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Ngày gửi</p>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>{position.startDate}</p>
            </div>
          </div>
        </TrCard>

        {/* ─── Early withdrawal warning ─── */}
        {isEarlyRedeem && (
          <div className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: withAlpha(c.error, ALPHA.ghost), border: `1px solid ${withAlpha(c.error, ALPHA.muted)}` }}>
            <AlertTriangle size={ICON_SIZE.base} color={c.error} strokeWidth={ICON_STROKE.standard} className="mt-0.5 shrink-0" />
            <div>
              <p style={{ color: c.error, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Cảnh báo rút sớm</p>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginTop: 4 }}>
                Sản phẩm cố định {position.lockDays} ngày chưa đáo hạn (còn {daysLeft} ngày).
                Rút sớm sẽ <span style={{ color: c.error, fontWeight: FONT_WEIGHT.semibold }}>mất toàn bộ lãi tích luỹ
                ({fmtAmount(position.earned)} {position.asset})</span>.
                Chỉ nhận lại gốc đã gửi.
              </p>
            </div>
          </div>
        )}

        {/* ─── Amount input ─── */}
        {step === 'input' && (
          <TrCard className="p-4">
            <PageSection label={`Số lượng rút (${position.asset})`}>
              <div className="flex items-center gap-3 px-4 mb-2"
                style={{
                  background: c.surface2, height: 56, borderRadius: 14,
                  border: `1.5px solid ${amountNum > position.amount ? c.error : c.borderSolid}`,
                }}>
                <input type="number" inputMode="decimal" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: FONT_SCALE.lg, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.semibold,
                  }}
                />
                <span style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.medium }}>{position.asset}</span>
              </div>

              {/* Validation */}
              {amountNum > position.amount && (
                <p className="mb-2 flex items-center gap-1" style={{ color: c.error, fontSize: FONT_SCALE.xs }}>
                  <AlertTriangle size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.standard} /> Vượt quá số lượng đang gửi ({fmtAmount(position.amount)} {position.asset})
                </p>
              )}

              {/* Helper text */}
              <p className="mb-2" style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                Tối đa: <span style={{ color: c.text1, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                  {fmtAmount(position.amount)} {position.asset}
                </span>
              </p>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[
                  { label: '25%', pct: 0.25 },
                  { label: '50%', pct: 0.5 },
                  { label: '75%', pct: 0.75 },
                  { label: 'Tất cả', pct: 1 },
                ].map(q => (
                  <button key={q.label} onClick={() => setQuickAmount(q.pct)}
                    className="flex-1 py-2 rounded-xl text-xs"
                    style={{
                      background: c.chipBg, color: c.chipText,
                      border: `1px solid ${c.chipBorder}`, fontWeight: FONT_WEIGHT.semibold,
                    }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </PageSection>
          </TrCard>
        )}

        {/* ─── Review summary (shown when amount is valid) ─── */}
        {canProceed && (
          <TrCard className="p-4">
            <PageSection label="Tóm tắt rút">
              <div className="flex flex-col gap-0">
                {[
                  { label: 'Số lượng rút', value: `${fmtAmount(amountNum)} ${position.asset}`, highlight: true },
                  { label: 'Phí rút', value: 'Miễn phí', valueColor: '#10B981' },
                  ...(isEarlyRedeem ? [
                    { label: 'Lãi bị mất', value: `-${fmtAmount(lostInterest)} ${position.asset}`, valueColor: '#EF4444', highlight: true },
                  ] : []),
                  { label: 'Thực nhận', value: `${fmtAmount(netReceived)} ${position.asset}`, highlight: true },
                  { label: 'Thời gian xử lý', value: processingTime },
                  { label: 'Đến', value: `Ví ${position.asset} chính` },
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{row.label}</span>
                    <span style={{
                      color: (row as any).valueColor ?? c.text1,
                      fontSize: (row as any).highlight ? FONT_SCALE.sm : FONT_SCALE.xs,
                      fontWeight: (row as any).highlight ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                      fontFamily: (row as any).highlight ? 'monospace' : 'inherit',
                    }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </PageSection>
          </TrCard>
        )}

        {/* ─── Consent ─── */}
        {canProceed && (
          <button onClick={() => { setAgreed(!agreed); hapticLight(); }}
            className="flex items-start gap-2 px-1">
            <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
              style={{
                borderColor: agreed ? (isEarlyRedeem ? '#EF4444' : '#10B981') : c.borderSolid,
                background: agreed ? (isEarlyRedeem ? '#EF4444' : '#10B981') : 'transparent',
              }}>
              {agreed && <CheckCircle size={ICON_SIZE.sm} color="#fff" />}
            </div>
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, textAlign: 'left' }}>
              {isEarlyRedeem
                ? `Tôi hiểu rằng rút sớm sẽ mất toàn bộ lãi tích luỹ (${fmtAmount(lostInterest)} ${position.asset}) và đồng ý tiếp tục.`
                : 'Tôi xác nhận rút tiết kiệm và đồng ý với điều khoản xử lý.'}
            </span>
          </button>
        )}

        {/* Info note */}
        {position.type === 'flexible' && (
          <div className="flex items-start gap-2 rounded-xl p-3"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
              Sản phẩm linh hoạt cho phép rút bất cứ lúc nào mà không mất lãi.
              Tiền sẽ về ví chính trong vòng vài phút.
            </span>
          </div>
        )}

        <div className="h-4" />
      </PageContent>

      {/* ─── Sticky CTA ─── */}
      <StickyFooter>
        {isEarlyRedeem ? (
          <CTAButton variant="danger" onClick={() => { if (canSubmit) { setShowConfirm(true); hapticSelection(); } }}
            disabled={!canSubmit}>
            {canSubmit ? 'Xem lại trước khi rút sớm' : amountNum > 0 ? 'Vui lòng đồng ý điều khoản' : 'Nhập số lượng rút'}
          </CTAButton>
        ) : (
          <CTAButton variant="primary" onClick={handleSubmit} disabled={!canSubmit} loading={processing}>
            {processing ? 'Đang xử lý...' : canSubmit ? `Xác nhận rút · ${fmtAmount(amountNum)} ${position.asset}` : amountNum > 0 ? 'Vui lòng đồng ý điều khoản' : 'Nhập số lượng rút'}
          </CTAButton>
        )}
      </StickyFooter>
    </PageLayout>
  );
}