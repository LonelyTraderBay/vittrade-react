import React, { useMemo } from 'react';
import {
  CheckCircle, ArrowDownToLine, ArrowUpFromLine, Copy, Share2,
  ExternalLink, Calendar, Clock, Shield, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate, useLocation } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ─── Generate deterministic reference ID ─── */
function genRefId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [4, 4, 4];
  return segments.map(len =>
    Array.from({ length: len }).map((_, i) => chars[(i * 7 + 3) % chars.length]).join('')
  ).join('-');
}

interface ReceiptData {
  type: 'subscribe' | 'redeem';
  product: string;
  asset: string;
  amount: number;
  apy?: number;
  lockDays?: number | null;
  estimatedEarning?: number;
  isEarlyRedeem?: boolean;
  lostInterest?: number;
  fee?: number;
  netReceived?: number;
  processingTime?: string;
}

export function SavingsReceiptPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const location = useLocation();
  const { hapticSelection, hapticSuccess } = useHaptic();

  const data = (location.state as ReceiptData) ?? null;
  const refId = useMemo(() => genRefId(), []);
  const timestamp = useMemo(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }, []);

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(refId).catch(() => {});
    setCopied(true);
    hapticSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  /* Fallback if no data */
  if (!data) {
    return (
      <PageLayout>
        <Header title="Biên nhận" back />
        <PageContent>
          <div className="flex flex-col items-center py-20 gap-3">
            <AlertTriangle size={ICON_SIZE.xxl} color={c.text3} strokeWidth={ICON_STROKE.standard} />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.sm }}>Không có dữ liệu biên nhận</p>
            <button onClick={() => navigate(`${prefix}/earn/savings`)}
              className="px-6 py-3 rounded-2xl text-white"
              style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
              Về Tiết kiệm
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const isSubscribe = data.type === 'subscribe';
  const statusColor = isSubscribe ? c.success : (data.isEarlyRedeem ? c.warning : c.primary);
  const statusText = isSubscribe
    ? 'Đăng ký thành công'
    : data.isEarlyRedeem
      ? 'Rút sớm đã xử lý'
      : 'Rút thành công';
  const StatusIcon = isSubscribe ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <PageLayout variant="flush">
      <Header title="Biên nhận" back />

      <PageContent gap="relaxed" grow>
        {/* ─── Success hero ─── */}
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: statusColor + ALPHA.muted }}>
            <CheckCircle size={ICON_SIZE.xl} color={statusColor} strokeWidth={ICON_STROKE.standard} />
          </div>
          <p style={{ color: statusColor, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{statusText}</p>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 4 }}>{data.product}</p>

          {/* Amount display */}
          <div className="mt-4 text-center">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {isSubscribe ? '' : ''}{fmtAmount(data.amount)} {data.asset}
            </p>
            {isSubscribe && data.apy && (
              <p style={{ color: c.success, fontSize: FONT_SCALE.sm, marginTop: 4 }}>
                APY {data.apy}% · {data.lockDays ? `Cố định ${data.lockDays} ngày` : 'Linh hoạt'}
              </p>
            )}
          </div>
        </div>

        {/* ─── Transaction details ─── */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>Chi tiết giao dịch</p>
          <div className="flex flex-col gap-0">
            {[
              { label: 'Loại', value: isSubscribe ? 'Đăng ký Tiết kiệm' : 'Rút Tiết kiệm' },
              { label: 'Sản phẩm', value: data.product },
              { label: 'Tài sản', value: data.asset },
              { label: 'Số lượng', value: `${fmtAmount(data.amount)} ${data.asset}`, highlight: true },
              ...(isSubscribe
                ? [
                    { label: 'APY', value: `${data.apy}%`, valueColor: c.success },
                    { label: 'Thời hạn', value: data.lockDays ? `${data.lockDays} ngày` : 'Linh hoạt' },
                    { label: 'Dự kiến lãi', value: data.estimatedEarning ? `+${data.estimatedEarning.toFixed(6)} ${data.asset}` : '—', valueColor: c.success },
                    { label: 'Lãi bắt đầu', value: 'T+0 (hôm nay)' },
                  ]
                : [
                    ...(data.isEarlyRedeem
                      ? [
                          { label: 'Rút sớm', value: 'Có', valueColor: c.error },
                          { label: 'Lãi mất', value: `-${fmtAmount(data.lostInterest ?? 0)} ${data.asset}`, valueColor: c.error, highlight: true },
                        ]
                      : []),
                    { label: 'Phí rút', value: `${data.fee ?? 0} ${data.asset}`, valueColor: c.success },
                    { label: 'Thực nhận', value: `${fmtAmount(data.netReceived ?? data.amount)} ${data.asset}`, highlight: true },
                    { label: 'Thời gian xử lý', value: data.processingTime ?? 'Tức thì' },
                    { label: 'Đến', value: `Ví ${data.asset} chính` },
                  ]
              ),
              { label: 'Phí giao dịch', value: 'Miễn phí', valueColor: c.success },
              { label: 'Thời gian', value: timestamp },
            ].map((row, i) => (
              <div key={row.label + i} className="flex items-center justify-between py-2.5"
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
        </TrCard>

        {/* ─── Reference ID ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Mã tham chiếu</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace', letterSpacing: 1 }}>
                {refId}
              </p>
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{
                background: copied ? withAlpha(c.success, ALPHA.muted) : c.chipBg,
                color: copied ? c.success : c.chipText,
                border: `1px solid ${copied ? withAlpha(c.success, ALPHA.border) : c.chipBorder}`,
                fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold,
              }}>
              {copied ? <><CheckCircle size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.standard} /> Đã sao chép</> : <><Copy size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.standard} /> Sao chép</>}
            </button>
          </div>
        </TrCard>

        {/* ─── Status timeline ─── */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>Trạng thái</p>
          <div className="flex flex-col gap-0">
            {[
              {
                label: isSubscribe ? 'Yêu cầu đăng ký' : 'Yêu cầu rút',
                time: timestamp,
                done: true,
              },
              {
                label: isSubscribe ? 'Xác nhận & Khoá tài sản' : 'Xác nhận & Xử lý',
                time: timestamp,
                done: true,
              },
              {
                label: isSubscribe ? 'Bắt đầu tính lãi' : 'Chuyển về ví',
                time: isSubscribe ? 'Hôm nay' : (data.processingTime ?? 'Tức thì'),
                done: isSubscribe || data.type === 'redeem' && !data.isEarlyRedeem,
                active: !isSubscribe && data.isEarlyRedeem,
              },
            ].map((step, i) => (
              <div key={step.label} className="flex gap-3">
                {/* Timeline dot & line */}
                <div className="flex flex-col items-center" style={{ width: 20 }}>
                  <div className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      background: step.done ? statusColor : step.active ? c.warning : c.borderSolid,
                      border: `2px solid ${step.done ? statusColor : step.active ? c.warning : c.borderSolid}`,
                    }} />
                  {i < 2 && (
                    <div className="w-0.5 flex-1 min-h-[24px]"
                      style={{ background: step.done ? statusColor + ALPHA.border : c.borderSolid }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4">
                  <p style={{ color: step.done ? c.text1 : c.text3, fontSize: FONT_SCALE.sm, fontWeight: step.done ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular }}>
                    {step.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 2 }}>{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* ─── Info banner ─── */}
        <div className="flex items-start gap-2 rounded-xl p-3"
          style={{ background: withAlpha(c.primary, ALPHA.ghost), border: `1px solid ${withAlpha(c.primary, ALPHA.muted)}` }}>
          <Shield size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.standard} className="mt-0.5 shrink-0" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
            {isSubscribe
              ? 'Lãi suất được tính hàng ngày và cộng dồn tự động vào số dư tiết kiệm. Bạn có thể theo dõi lãi tích luỹ trong mục "Đang ký".'
              : 'Nếu giao dịch chưa hoàn tất sau thời gian xử lý, vui lòng liên hệ Hỗ trợ với mã tham chiếu ở trên.'}
          </span>
        </div>

        <div className="h-4" />
      </PageContent>

      {/* ─── Footer actions ─── */}
      <StickyFooter>
        <div className="flex gap-3">
          <button onClick={() => navigate(`${prefix}/earn/savings`)}
            className="flex-1 py-3.5 rounded-2xl text-center"
            style={{
              background: c.chipBg, color: c.text1,
              border: `1px solid ${c.chipBorder}`,
              fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, borderRadius: 14,
            }}>
            Về Tiết kiệm
          </button>
          <CTAButton onClick={() => navigate(`${prefix}/earn`)} fullWidth={false}
            style={{ flex: 1 } as any}>
            Trang Earn
          </CTAButton>
        </div>
      </StickyFooter>
    </PageLayout>
  );
}