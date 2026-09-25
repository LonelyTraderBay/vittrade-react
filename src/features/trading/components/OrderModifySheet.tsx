import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtUsd } from '@/shared/lib/formatNumber';
import type { TradingOrder } from '../model/trading-types';

export interface OrderModifyValues {
  orderId: string;
  price: number;
  amount: number;
}

interface OrderModifySheetProps {
  open: boolean;
  order: TradingOrder | null;
  canWrite: boolean;
  isPending: boolean;
  onClose: () => void;
  onSave: (values: OrderModifyValues) => void | Promise<void>;
}

function sanitizeDecimal(value: string) {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integer, ...fraction] = normalized.split('.');
  return fraction.length > 0 ? `${integer}.${fraction.join('')}` : integer;
}

export function OrderModifySheet({
  open,
  order,
  canWrite,
  isPending,
  onClose,
  onSave,
}: OrderModifySheetProps) {
  const colors = useThemeColors();
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const orderId = order?.id;
  const orderPrice = order?.price;
  const orderAmount = order?.amount;

  useEffect(() => {
    if (!open || orderId === undefined || orderPrice === undefined || orderAmount === undefined) {
      return;
    }
    setPrice(String(orderPrice));
    setAmount(String(orderAmount));
  }, [open, orderAmount, orderId, orderPrice]);

  const parsedPrice = Number(price);
  const parsedAmount = Number(amount);
  const canSave =
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleSave = () => {
    if (!order || !canWrite || !canSave) return;
    void onSave({ orderId: order.id, price: parsedPrice, amount: parsedAmount });
  };

  return (
    <BottomSheetV2 open={open && order !== null} onClose={onClose} title="Sửa lệnh">
      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-1 rounded-md text-xs font-bold"
              style={{
                background: order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: order.side === 'buy' ? '#10B981' : '#EF4444',
              }}
            >
              {order.side === 'buy' ? 'MUA' : 'BÁN'}
            </span>
            <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
              {order.symbol}
            </span>
            <span style={{ color: colors.text3, fontSize: 12 }}>#{order.id.slice(-6)}</span>
          </div>

          <div>
            <label
              htmlFor="trade-modify-price"
              style={{ color: colors.text2, fontSize: 12, marginBottom: 4, display: 'block' }}
            >
              Giá mới (USDT)
            </label>
            <div
              className="flex items-center rounded-xl px-3"
              style={{
                background: colors.surface2,
                border: `1px solid ${colors.borderSolid}`,
                height: 48,
              }}
            >
              <input
                id="trade-modify-price"
                data-testid="trade-modify-price"
                aria-label="Giá mới (USDT)"
                aria-invalid={!Number.isFinite(parsedPrice) || parsedPrice <= 0}
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(sanitizeDecimal(event.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: colors.text1,
                  fontSize: 18,
                  flex: 1,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              />
              <span style={{ color: colors.text3, fontSize: 12 }}>USDT</span>
            </div>
            {order.price > 0 && price !== String(order.price) && (
              <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 2 }}>
                Thay đổi: {fmtUsd((Number.isFinite(parsedPrice) ? parsedPrice : 0) - order.price)} (
                {(
                  (((Number.isFinite(parsedPrice) ? parsedPrice : 0) - order.price) / order.price) *
                  100
                ).toFixed(2)}
                %)
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trade-modify-amount"
              style={{ color: colors.text2, fontSize: 12, marginBottom: 4, display: 'block' }}
            >
              Khối lượng mới
            </label>
            <div
              className="flex items-center rounded-xl px-3"
              style={{
                background: colors.surface2,
                border: `1px solid ${colors.borderSolid}`,
                height: 48,
              }}
            >
              <input
                id="trade-modify-amount"
                data-testid="trade-modify-amount"
                aria-label="Khối lượng mới"
                aria-invalid={!Number.isFinite(parsedAmount) || parsedAmount <= 0}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(sanitizeDecimal(event.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: colors.text1,
                  fontSize: 18,
                  flex: 1,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              />
              <span style={{ color: colors.text3, fontSize: 12 }}>
                {order.symbol.split('/')[0]}
              </span>
            </div>
          </div>

          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(59,130,246,0.06)' }}
          >
            <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.4 }}>
              Sửa giá sẽ mất vị trí trong hàng đợi sổ lệnh. Sửa khối lượng giữ nguyên vị trí.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-semibold"
              style={{
                background: colors.surface2,
                color: colors.text2,
                border: `1px solid ${colors.borderSolid}`,
                fontSize: 14,
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              data-testid="trade-modify-submit"
              onClick={handleSave}
              disabled={!canWrite || !canSave || isPending}
              className="flex-[2] h-12 rounded-xl font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                fontSize: 14,
              }}
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}
    </BottomSheetV2>
  );
}
