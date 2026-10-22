import { CheckCircle, Clock3 } from 'lucide-react';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { CTAButton } from '@/shared/ui/CTAButton';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ALPHA, withAlpha } from '@/shared/theme/colors';
import { fmtAmount, fmtUsd } from '@/shared/lib/formatNumber';
import { φ } from '@/shared/lib/golden';
import type { DustConversionReceipt } from '../model/wallet-types';
import type { RefObject } from 'react';

export interface DustConversionResult {
  receipt: DustConversionReceipt;
  sourceCount: number;
}

/** A known receipt remains visible independently of subsequent balance/quote reads. */
export function DustConversionReceiptSheet({
  result,
  onClose,
  fallbackFocusRef,
}: {
  result: DustConversionResult | null;
  onClose: () => void;
  fallbackFocusRef: RefObject<HTMLElement | null>;
}) {
  const c = useThemeColors();
  const pending = result?.receipt.status === 'pending';
  return (
    <BottomSheetV2
      open={result !== null}
      onClose={onClose}
      fallbackFocusRef={fallbackFocusRef}
      title={pending ? 'Yêu cầu chuyển đổi đang xử lý' : 'Chuyển đổi thành công!'}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: pending ? withAlpha(c.warn, ALPHA.soft) : 'rgba(16,185,129,0.15)',
            border: `2px solid ${pending ? c.warn : 'rgba(16,185,129,0.4)'}`,
          }}
        >
          {pending ? (
            <Clock3 size={36} color={c.warn} />
          ) : (
            <CheckCircle size={36} color={c.successText} />
          )}
        </div>
        <div className="text-center">
          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            {pending
              ? 'Yêu cầu đang chờ backend xác nhận.'
              : `Đã chuyển ${result?.sourceCount ?? 0} tài sản nhỏ`}
          </p>
          <p
            style={{
              color: pending ? c.text2 : c.successText,
              fontSize: 22,
              fontWeight: 700,
              marginTop: 8,
              fontFamily: 'monospace',
            }}
          >
            {pending ? 'Dự kiến ' : '+'}
            {fmtAmount(result?.receipt.targetAmount ?? 0)} {result?.receipt.targetAsset}
          </p>
          <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 4 }}>
            ≈ {fmtUsd(result?.receipt.receivedUsd ?? 0)}
          </p>
        </div>
        <CTAButton onClick={onClose}>{pending ? 'Đóng biên nhận' : 'Hoàn tất'}</CTAButton>
      </div>
    </BottomSheetV2>
  );
}
