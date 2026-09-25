import { useState } from 'react';
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
import { CTAButton } from '@/shared/ui/CTAButton';
import { TrCard } from '@/shared/ui/TrCard';
import { EmptyState } from '@/shared/ui/EmptyState';
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
          style={{ background: `${product.color}22`, border: `1px solid ${product.color}55` }}
        >
          <span style={{ color: product.color, fontSize: 11, fontWeight: 800 }}>
            {product.asset.slice(0, 4)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{product.name}</p>
            {product.isHot && (
              <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                HOT
              </span>
            )}
            {product.isNew && (
              <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                MỚI
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2" style={{ color: c.text2, fontSize: 12 }}>
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
          <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>{product.apy}%</p>
          <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between" style={{ fontSize: 11 }}>
        <span style={{ color: c.text3 }}>
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
}: {
  position: EarnPosition;
  onRedeem: () => void;
  canRedeem?: boolean;
}) {
  const c = useThemeColors();
  const daysLeft = position.endDate
    ? Math.max(0, Math.ceil((new Date(position.endDate).getTime() - Date.now()) / 86_400_000))
    : undefined;
  return (
    <TrCard className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: `${position.color}22` }}
        >
          <span style={{ color: position.color, fontSize: 10, fontWeight: 800 }}>
            {position.asset.slice(0, 3)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{position.product}</p>
          <p style={{ color: c.text2, fontSize: 11 }}>
            {position.type === 'fixed' ? 'Cố định' : 'Linh hoạt'} · {formatDate(position.startDate)}
          </p>
        </div>
        <p style={{ color: '#10B981', fontSize: 15, fontWeight: 700 }}>{position.apy}% APY</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Đang gửi</p>
          <p style={{ color: c.text1, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
            {formatAmount(position.amount)} {position.asset}
          </p>
        </div>
        <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 10 }}>Đã nhận</p>
          <p style={{ color: '#10B981', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
            +{formatAmount(position.earned)} {position.asset}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span style={{ color: c.text3, fontSize: 11 }}>
          {daysLeft === undefined ? 'Có thể rút linh hoạt' : `Còn ${daysLeft} ngày`}
        </span>
        {position.type === 'flexible' && (
          <button
            className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500"
            onClick={onRedeem}
            disabled={!canRedeem}
          >
            Rút vốn
          </button>
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
        <div>
          <p style={{ color: c.text2, fontSize: 12 }}>Tổng lợi nhuận tích lũy</p>
          <p style={{ color: '#34D399', fontFamily: 'monospace', fontSize: 28, fontWeight: 800 }}>
            +${formatAmount(earned)}
          </p>
        </div>
        <ShieldCheck size={26} color="#34D399" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Đang phân bổ</p>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{active}</p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>Tổng vốn</p>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
            ${formatAmount(deposited)}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: 10 }}>APY bình quân</p>
          <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
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
}: {
  product?: EarnProduct;
  position?: EarnPosition;
  balance: number;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isRedeem ? 'Rút vốn' : 'Đăng ký sản phẩm'}
    >
      <div className="w-full max-w-lg rounded-3xl p-5" style={{ background: c.surface }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
              {isRedeem ? 'Rút vốn' : 'Đăng ký sản phẩm'}
            </p>
            <p style={{ color: c.text2, fontSize: 12 }}>
              {targetName} · {target.asset}
            </p>
          </div>
          <button aria-label="Đóng" onClick={onClose}>
            <X size={20} color={c.text3} />
          </button>
        </div>
        <div className="mb-4 rounded-2xl p-3" style={{ background: c.surface2 }}>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: 12 }}>Khả dụng</span>
            <span
              style={{ color: c.text1, fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}
            >
              {formatAmount(maxAmount)} {target.asset}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: 12 }}>APY</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>{target.apy}%</span>
          </div>
        </div>
        <label
          className="mb-2 block"
          htmlFor="earn-amount"
          style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}
        >
          Số lượng
        </label>
        <div
          className="mb-4 flex items-center gap-2 rounded-2xl p-3"
          style={{ background: c.surface2, border: `1px solid ${c.border}` }}
        >
          <input
            id="earn-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-lg outline-none"
            placeholder="0.00"
          />
          <button
            className="text-xs font-semibold text-blue-500"
            onClick={() => setAmount(String(maxAmount))}
          >
            MAX
          </button>
        </div>
        {!isRedeem && (
          <label className="mb-4 flex items-start gap-2 text-xs" style={{ color: c.text2 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5"
            />
            Tôi đã đọc điều khoản, lợi suất và rủi ro của sản phẩm.
          </label>
        )}
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-500">
            {error}
          </p>
        )}
        <CTAButton
          loading={pending}
          disabled={!canSubmit}
          variant={isRedeem ? 'danger' : 'success'}
          onClick={() => onSubmit(parsedAmount)}
        >
          {isRedeem ? 'Xác nhận rút vốn' : 'Xác nhận đăng ký'}
        </CTAButton>
      </div>
    </div>
  );
}

export function EarnSuccessMessage({ message, onClose }: { message: string; onClose: () => void }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
      <CheckCircle2 size={18} />
      <span className="flex-1">{message}</span>
      <button aria-label="Đóng thông báo" onClick={onClose}>
        <X size={16} color={c.text3} />
      </button>
    </div>
  );
}
