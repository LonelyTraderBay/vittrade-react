import { AlertTriangle, Loader2 } from 'lucide-react';
import { BottomSheetRow, BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtUsd } from '@/shared/lib/formatNumber';
import type { OrderSide } from '../model/trading-types';
import type { TPSLValues } from './TPSLForm';

export interface OrderConfirmationSheetProps {
  open: boolean;
  isPlacing: boolean;
  side: OrderSide;
  pair: { symbol: string; baseAsset: string };
  orderTypeLabel: string;
  isMarket: boolean;
  limitPrice: string;
  amount: string;
  total: number;
  tpsl: TPSLValues;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrderConfirmationSheet({
  open,
  isPlacing,
  side,
  pair,
  orderTypeLabel,
  isMarket,
  limitPrice,
  amount,
  total,
  tpsl,
  onClose,
  onConfirm,
}: OrderConfirmationSheetProps) {
  const colors = useThemeColors();
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Xác nhận lệnh" preventClose={isPlacing}>
      <div className="flex flex-col gap-4">
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: colors.surface2 }}
        >
          <div
            className="flex justify-between items-center pb-3"
            style={{ borderBottom: `1px solid ${colors.divider}` }}
          >
            <div>
              <p style={{ color: colors.text2, fontSize: 12 }}>
                Lệnh {side === 'buy' ? 'Mua' : 'Bán'}
              </p>
              <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</p>
            </div>
            <span
              className="px-3 py-2 rounded-xl text-sm font-bold"
              style={{
                background: side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: sideColor,
              }}
            >
              {side === 'buy' ? 'MUA' : 'BÁN'}
            </span>
          </div>

          <BottomSheetRow label="Loại lệnh" value={orderTypeLabel} />
          <BottomSheetRow
            label="Giá"
            value={isMarket ? 'Giá thị trường' : fmtUsd(parseFloat(limitPrice || '0'))}
          />
          <BottomSheetRow label="Khối lượng" value={`${amount} ${pair.baseAsset}`} />
          <BottomSheetRow label="Thành tiền" value={fmtUsd(total)} highlight />
          <BottomSheetRow label="Phí giao dịch" value="Sẽ được xác nhận từ máy chủ" />

          {tpsl.enabled && (tpsl.tpPrice || tpsl.slPrice) && (
            <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <p style={{ color: colors.text2, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Quản lý rủi ro
              </p>
              {tpsl.tpPrice && (
                <BottomSheetRow label="Take Profit" value={fmtUsd(parseFloat(tpsl.tpPrice))} />
              )}
              {tpsl.slPrice && (
                <BottomSheetRow label="Stop Loss" value={fmtUsd(parseFloat(tpsl.slPrice))} />
              )}
            </div>
          )}
        </div>

        <div
          className="flex items-start gap-2 rounded-xl px-3 py-3"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
          <p style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1.5 }}>
            {isMarket
              ? 'Giá khớp và phí thực tế do máy chủ xác nhận theo thanh khoản tại thời điểm xử lý.'
              : 'Kiểm tra kỹ thông tin trước khi đặt lệnh. Lệnh đã đặt không thể hoàn tác ngay lập tức.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isPlacing}
          data-testid="trade-confirm-submit"
          className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-base ripple"
          style={{
            height: 52,
            borderRadius: 14,
            background: isPlacing
              ? colors.surface2
              : side === 'buy'
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
            boxShadow: isPlacing
              ? 'none'
              : side === 'buy'
                ? '0 4px 16px rgba(16,185,129,0.3)'
                : '0 4px 16px rgba(239,68,68,0.3)',
            color: isPlacing ? colors.text3 : '#fff',
          }}
        >
          {isPlacing ? (
            <div className="contents">
              <Loader2
                size={18}
                className="animate-spin"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
              Đang đặt lệnh...
            </div>
          ) : (
            `Xác nhận ${side === 'buy' ? 'Mua' : 'Bán'}`
          )}
        </button>
      </div>
    </BottomSheetV2>
  );
}
