import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Check, X, Info, Clock, ArrowDown, ArrowUp } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  TradeConfirmModal — Safety-by-design order confirmation
 * ══════════════════════════════════════════════════════════
 *
 *  Shows before every trade execution:
 *  ● Full order summary (side, type, pair, price, amount, total)
 *  ● Fee breakdown with explanation
 *  ● Slippage estimate for market orders
 *  ● Risk warning for large orders
 *  ● Confirm countdown + destructive-style confirm button
 */

export interface OrderDetails {
  side: 'buy' | 'sell';
  type: string; // 'Giới hạn' | 'Thị trường' | 'Dừng lỗ'
  pair: string; // 'BTC/USDT'
  baseAsset: string;
  price: number;
  amount: number;
  total: number;
  fee: number;
  available: number;
  availableAsset: string;
  livePrice: number;
}

interface TradeConfirmModalProps {
  open: boolean;
  order: OrderDetails | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TradeConfirmModal({ open, order, onConfirm, onCancel }: TradeConfirmModalProps) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [executing, setExecuting] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setConfirmed(false);
      setCountdown(3);
      setExecuting(false);
    }
  }, [open]);

  // Countdown
  useEffect(() => {
    if (!open || confirmed) return;
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [open, confirmed, countdown]);

  const handleConfirm = () => {
    setExecuting(true);
    // Simulate 800ms execution
    setTimeout(() => {
      setConfirmed(true);
      setTimeout(onConfirm, 1200);
    }, 800);
  };

  if (!open || !order) return null;

  const sideColor = order.side === 'buy' ? '#10B981' : '#EF4444';
  const sideLabel = order.side === 'buy' ? 'MUA' : 'BÁN';
  const isMarket = order.type === 'Thị trường';
  const priceDiff = isMarket ? 0 : ((order.price - order.livePrice) / order.livePrice) * 100;
  const isLargeOrder = order.total > 10000;
  const slippageEst = isMarket ? 0.05 : 0;
  const panelBg = isDark ? '#13151D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const SummaryRow = ({
    label,
    value,
    valueColor,
    sub,
  }: {
    label: string;
    value: string;
    valueColor?: string;
    sub?: string;
  }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-1" style={{ color: c.text3, fontSize: 11 }}>
        {label}
      </span>
      <div className="text-right">
        <span
          style={{
            color: valueColor || c.text1,
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {sub && <span style={{ color: c.text3, fontSize: 9, display: 'block' }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !executing) onCancel();
      }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          width: 400,
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.6)' : '0 12px 48px rgba(0,0,0,0.15)',
        }}
      >
        {/* Confirmed state */}
        {confirmed ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: sideColor + '15' }}
            >
              <Check size={28} color={sideColor} />
            </div>
            <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Lệnh đã đặt thành công
            </span>
            <span style={{ color: c.text3, fontSize: 12 }}>
              {sideLabel} {order.amount.toFixed(6)} {order.baseAsset} @ $
              {order.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 mt-1" style={{ color: c.text3, fontSize: 10 }}>
              <Clock size={10} />
              <span>Đang xử lý...</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${panelBorder}`, background: sideColor + '08' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: sideColor + '15' }}
                >
                  {order.side === 'buy' ? (
                    <ArrowUp size={14} color={sideColor} />
                  ) : (
                    <ArrowDown size={14} color={sideColor} />
                  )}
                </div>
                <div>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                    Xác nhận {sideLabel} {order.baseAsset}
                  </span>
                  <span style={{ color: c.text3, fontSize: 10, display: 'block' }}>
                    {order.type} · {order.pair}
                  </span>
                </div>
              </div>
              <button
                onClick={onCancel}
                disabled={executing}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: inputBg }}
              >
                <X size={13} color={c.text3} />
              </button>
            </div>

            {/* Order summary */}
            <div className="px-4 py-2" style={{ borderBottom: `1px solid ${panelBorder}` }}>
              <SummaryRow label="Loại lệnh" value={order.type} />
              <SummaryRow
                label={isMarket ? 'Giá thị trường' : 'Giá giới hạn'}
                value={`$${order.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                valueColor={sideColor}
                sub={
                  !isMarket && priceDiff !== 0
                    ? `${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(2)}% so với thị trường`
                    : undefined
                }
              />
              <SummaryRow
                label="Khối lượng"
                value={`${order.amount.toFixed(6)} ${order.baseAsset}`}
              />

              <div className="mt-1 pt-1" style={{ borderTop: `1px dashed ${panelBorder}` }}>
                <SummaryRow
                  label="Thành tiền"
                  value={`$${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="px-4 py-2 rounded-lg mx-3 my-2" style={{ background: inputBg }}>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1" style={{ color: c.text3, fontSize: 10 }}>
                  <Info size={9} /> Phí giao dịch (0.1%)
                </span>
                <span style={{ color: c.text2, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                  ≈ ${order.fee.toFixed(4)}
                </span>
              </div>
              {isMarket && (
                <div className="flex items-center justify-between py-1">
                  <span
                    className="flex items-center gap-1"
                    style={{ color: c.text3, fontSize: 10 }}
                  >
                    <Info size={9} /> Slippage ước tính
                  </span>
                  <span
                    style={{ color: '#F59E0B', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}
                  >
                    ≈ {slippageEst}%
                  </span>
                </div>
              )}
              <div
                className="flex items-center justify-between py-1"
                style={{ borderTop: `1px dashed ${panelBorder}` }}
              >
                <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>Tổng chi phí</span>
                <span
                  style={{
                    color: c.text1,
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ${(order.total + order.fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Risk warnings */}
            {isLargeOrder && (
              <div
                className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.15)',
                }}
              >
                <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <span
                    style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600, display: 'block' }}
                  >
                    Lệnh lớn
                  </span>
                  <span style={{ color: c.text3, fontSize: 9 }}>
                    Lệnh trên $10,000 có thể chịu slippage cao hơn. Cân nhắc chia nhỏ lệnh.
                  </span>
                </div>
              </div>
            )}

            {isMarket && (
              <div
                className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(59,130,246,0.04)',
                  border: '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
                <span style={{ color: c.text3, fontSize: 9 }}>
                  Lệnh thị trường sẽ khớp ngay lập tức ở giá tốt nhất hiện có. Giá thực tế có thể
                  khác giá hiển thị.
                </span>
              </div>
            )}

            {/* Balance check */}
            <div
              className="mx-3 mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg"
              style={{ background: inputBg }}
            >
              <span style={{ color: c.text3, fontSize: 10 }}>Số dư khả dụng</span>
              <span
                style={{
                  color: c.text1,
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {order.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                {order.availableAsset}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-3 pb-3 pt-1">
              <button
                onClick={onCancel}
                disabled={executing}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: inputBg,
                  border: `1px solid ${panelBorder}`,
                  color: c.text2,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={countdown > 0 || executing}
                className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background:
                    countdown > 0
                      ? inputBg
                      : executing
                        ? sideColor + '80'
                        : order.side === 'buy'
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
                  color: countdown > 0 ? c.text3 : '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: countdown <= 0 && !executing ? `0 4px 12px ${sideColor}40` : 'none',
                  border: countdown > 0 ? `1px solid ${panelBorder}` : 'none',
                }}
              >
                {executing ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />
                    Đang xử lý...
                  </span>
                ) : countdown > 0 ? (
                  <span className="flex items-center gap-1">
                    <Shield size={11} /> Xác nhận ({countdown})
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check size={12} /> Xác nhận {sideLabel}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
