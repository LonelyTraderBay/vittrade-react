import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function TradingFeeNotice() {
  const colors = useThemeColors();

  return (
    <p style={{ color: colors.text3, fontSize: 12 }}>Phí giao dịch sẽ được xác nhận từ máy chủ.</p>
  );
}
