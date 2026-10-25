import { useState, type ReactNode, type RefObject } from 'react';
import {
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  UnlockKeyhole,
  X,
  Zap,
} from 'lucide-react';
import type { EarnPosition, EarnProduct } from '../model/earn-types';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { InputField } from '@/shared/ui/InputField';
import { withAlpha } from '@/shared/theme/colors';
import { ButtonHeights, ButtonRadius } from '@/shared/theme/button';
import { CTAButton } from '@/shared/ui/CTAButton';
import { TrCard } from '@/shared/ui/TrCard';
import { EmptyState } from '@/shared/ui/EmptyState';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { formatAmount, riskColors, riskLabels } from '../lib/formatters';

function formatDate(value?: string) {
  if (!value) return 'Linh hoạt';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

export function ProductCard({
  product,
  onSelect,
  disabled = false,
}: {
  product: EarnProduct;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const c = useThemeColors();
  return (
    <TrCard
      as="button"
      hover={!disabled}
      className="w-full p-4 text-left"
      onClick={onSelect}
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: withAlpha(product.color, '22'),
            border: `1px solid ${withAlpha(product.color, '55')}`,
          }}
        >
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 800 }}>
            {product.asset.slice(0, 4)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, overflowWrap: 'anywhere' }}>
              {product.name}
            </p>
            {product.isHot && (
              <span
                className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold"
                style={{ color: 'var(--tr-error-text)' }}
              >
                HOT
              </span>
            )}
            {product.isNew && (
              <span
                className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold"
                style={{ color: 'var(--tr-info-text)' }}
              >
                MỚI
              </span>
            )}
          </div>
          <div
            className="mt-1 flex flex-wrap items-center gap-2"
            style={{ color: c.text2, fontSize: 12 }}
          >
            {product.type === 'fixed' ? (
              <LockKeyhole size={12} />
            ) : product.type === 'flexible' ? (
              <UnlockKeyhole size={12} />
            ) : (
              <Zap size={12} />
            )}
            <span>{product.lockDays ? `${product.lockDays} ngày` : 'Linh hoạt'}</span>
            <span>•</span>
            <span>{product.participants.toLocaleString('vi-VN')} người</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p style={{ color: c.successText, fontSize: 20, fontWeight: 800 }}>{product.apy}%</p>
          <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
        </div>
      </div>
      <div
        className="mt-3 flex flex-wrap items-center justify-between gap-2"
        style={{ fontSize: 11 }}
      >
        <span style={{ color: c.text3, overflowWrap: 'anywhere' }}>
          Tối thiểu {formatAmount(product.minAmount)} {product.asset}
        </span>
        <span style={{ color: riskColors[product.riskLevel] }}>
          Rủi ro {riskLabels[product.riskLevel]}
        </span>
      </div>
    </TrCard>
  );
}

export function PositionCard({
  position,
  onRedeem,
  canRedeem = true,
  role,
}: {
  position: EarnPosition;
  onRedeem: () => void;
  canRedeem?: boolean;
  role?: string;
}) {
  const c = useThemeColors();
  const daysLeft = position.endDate
    ? Math.max(0, Math.ceil((new Date(position.endDate).getTime() - Date.now()) / 86_400_000))
    : undefined;
  return (
    <TrCard role={role} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: withAlpha(position.color, '22') }}
        >
          <span style={{ color: c.text1, fontSize: 10, fontWeight: 800 }}>
            {position.asset.slice(0, 3)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>
            {position.product}
          </p>
          <p style={{ color: c.text2, fontSize: 11 }}>
            {position.type === 'fixed' ? 'Cố định' : 'Linh hoạt'} · {formatDate(position.startDate)}
          </p>
        </div>
        <p style={{ color: c.successText, fontSize: 15, fontWeight: 700 }}>{position.apy}% APY</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Đang gửi</p>
          <p
            style={{
              color: c.text1,
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 600,
              overflowWrap: 'anywhere',
            }}
          >
            {formatAmount(position.amount)} {position.asset}
          </p>
        </div>
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Đã nhận</p>
          <p
            style={{
              color: c.successText,
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 600,
              overflowWrap: 'anywhere',
            }}
          >
            +{formatAmount(position.earned)} {position.asset}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span style={{ color: c.text3, fontSize: 11 }}>
          {daysLeft === undefined ? 'Có thể rút linh hoạt' : `Còn ${daysLeft} ngày`}
        </span>
        {position.type === 'flexible' && (
          <CTAButton
            variant="secondary"
            density="compact"
            fullWidth={false}
            onClick={onRedeem}
            disabled={!canRedeem}
          >
            Rút vốn
          </CTAButton>
        )}
      </div>
    </TrCard>
  );
}

export function EarnSummaryCard({
  earned,
  active,
  deposited,
  averageApy,
}: {
  earned: number;
  active: number;
  deposited: number;
  averageApy: number;
}) {
  const c = useThemeColors();
  return (
    <TrCard variant="hero" className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p style={{ color: c.text2, fontSize: 12 }}>Tổng lợi nhuận tích lũy</p>
          <p
            style={{
              color: c.successText,
              fontFamily: 'monospace',
              fontSize: 28,
              fontWeight: 800,
              overflowWrap: 'anywhere',
            }}
          >
            +${formatAmount(earned)}
          </p>
        </div>
        <ShieldCheck className="shrink-0" size={26} color={c.successText} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="min-w-0">
          <p style={{ color: c.text3, fontSize: 10 }}>Đang phân bổ</p>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>
            {active}
          </p>
        </div>
        <div className="min-w-0">
          <p style={{ color: c.text3, fontSize: 10 }}>Tổng vốn</p>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>
            ${formatAmount(deposited)}
          </p>
        </div>
        <div className="min-w-0">
          <p style={{ color: c.text3, fontSize: 10 }}>APY bình quân</p>
          <p
            style={{
              color: c.successText,
              fontSize: 14,
              fontWeight: 700,
              overflowWrap: 'anywhere',
            }}
          >
            {formatAmount(averageApy)}%
          </p>
        </div>
      </div>
    </TrCard>
  );
}

export function EarnEmptyPositions({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={Clock3}
      title="Chưa có vị thế"
      subtitle="Chọn một sản phẩm để bắt đầu tích lũy lợi suất."
      ctaLabel="Xem sản phẩm"
      onCta={onBrowse}
    />
  );
}

export function EarnActionSheet({
  product,
  position,
  balance,
  pending,
  error,
  onClose,
  onSubmit,
  fallbackFocusRef,
  submitDisabled = false,
  recovery,
}: {
  product?: EarnProduct;
  position?: EarnPosition;
  balance: number;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  submitDisabled?: boolean;
  recovery?: ReactNode;
}) {
  const c = useThemeColors();
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const isRedeem = Boolean(position);
  const target = product ?? position;
  if (!target) return null;
  const maxAmount = isRedeem ? (position?.amount ?? 0) : balance;
  const parsedAmount = Number(amount);
  const canSubmit = parsedAmount > 0 && parsedAmount <= maxAmount && (isRedeem || agreed);
  const targetName = product?.name ?? position?.product ?? '';
  const amountError = !amount
    ? undefined
    : !Number.isFinite(parsedAmount)
      ? 'Nhập số lượng hợp lệ.'
      : parsedAmount <= 0
        ? 'Số lượng phải lớn hơn 0.'
        : parsedAmount > maxAmount
          ? 'Số lượng vượt quá số khả dụng.'
          : undefined;
  return (
    <BottomSheetV2
      open
      onClose={onClose}
      title={isRedeem ? 'Rút vốn' : 'Đăng ký sản phẩm'}
      preventClose={pending}
      fallbackFocusRef={fallbackFocusRef}
    >
      <div className="flex flex-col gap-4">
        <p style={{ color: c.text2, fontSize: 12, overflowWrap: 'anywhere' }}>
          {targetName} · {target.asset}
        </p>
        <div className="flex flex-col gap-2 rounded-2xl p-3" style={{ background: c.surface2 }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span style={{ color: c.text2, fontSize: 12 }}>Khả dụng</span>
            <span
              style={{
                color: c.text1,
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 600,
                overflowWrap: 'anywhere',
              }}
            >
              {formatAmount(maxAmount)} {target.asset}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span style={{ color: c.text2, fontSize: 12 }}>APY</span>
            <span style={{ color: c.successText, fontWeight: 700 }}>{target.apy}%</span>
          </div>
        </div>
        <InputField
          id="earn-amount"
          label="Số lượng"
          disabled={pending}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          helper={amountError ? undefined : `Tối đa ${formatAmount(maxAmount)} ${target.asset}`}
          error={amountError}
        />
        <CTAButton
          variant="secondary"
          disabled={pending}
          onClick={() => setAmount(String(maxAmount))}
        >
          MAX
        </CTAButton>
        {!isRedeem && (
          <label className="flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
            <input
              type="checkbox"
              disabled={pending}
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5"
            />
            Tôi đã đọc điều khoản, lợi suất và rủi ro của sản phẩm.
          </label>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl p-3 text-xs"
            style={{ background: c.surface2, color: c.errorText }}
          >
            {error}
          </p>
        )}
        {recovery}
        {pending && (
          <p role="status" style={{ color: c.text2, fontSize: 12 }}>
            {isRedeem ? 'Đang gửi yêu cầu rút vốn…' : 'Đang gửi yêu cầu đăng ký…'}
          </p>
        )}
        <CTAButton
          loading={pending}
          disabled={!canSubmit || submitDisabled}
          variant={isRedeem ? 'danger' : 'success'}
          onClick={() => onSubmit(parsedAmount)}
        >
          {isRedeem ? 'Xác nhận rút vốn' : 'Xác nhận đăng ký'}
        </CTAButton>
      </div>
    </BottomSheetV2>
  );
}

export function EarnSuccessMessage({ message, onClose }: { message: string; onClose: () => void }) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-3 text-sm"
      style={{
        color: c.successText,
        borderColor: withAlpha(c.success, '4D'),
        background: withAlpha(c.success, '1A'),
      }}
    >
      <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
      <span role="status" className="min-w-0 flex-1" style={{ overflowWrap: 'anywhere' }}>
        {message}
      </span>
      <button
        type="button"
        className="inline-flex shrink-0 items-center justify-center"
        aria-label="Đóng thông báo"
        onClick={onClose}
        style={{
          width: ButtonHeights.compact,
          height: ButtonHeights.compact,
          borderRadius: ButtonRadius.compact,
        }}
      >
        <X size={16} color={c.text3} aria-hidden="true" />
      </button>
    </div>
  );
}
