import { describe, expect, it } from 'vitest';
import { TOAST } from './toastMessages';

describe('TOAST messages', () => {
  it('formats dynamic copy and market messages', () => {
    expect(TOAST.COPY.withLabel('BTC')).toBe('Đã sao chép BTC');
    expect(TOAST.FAVORITE.added('BTC/USDT')).toBe('Đã thêm BTC/USDT vào yêu thích');
    expect(TOAST.FAVORITE.removed('BTC/USDT')).toBe('Đã bỏ BTC/USDT khỏi yêu thích');
  });

  it('formats trade, P2P, wallet and API messages', () => {
    expect(TOAST.TRADE.ORDER_PLACED('buy')).toBe('Đã đặt lệnh MUA thành công');
    expect(TOAST.TRADE.ORDER_PLACED('sell')).toBe('Đã đặt lệnh BÁN thành công');
    expect(TOAST.TRADE.ORDER_CANCELLED('order-123456')).toBe('Đã hủy lệnh #123456');
    expect(TOAST.TRADE.ORDER_MODIFIED('order-123456')).toBe('Đã sửa lệnh #123456');

    expect(TOAST.P2P.AD_PUBLISHED('buy', 'USDT')).toBe('Quảng cáo MUA USDT đã được đăng!');
    expect(TOAST.P2P.AD_PUBLISHED('sell', 'BTC')).toBe('Quảng cáo BÁN BTC đã được đăng!');
    expect(TOAST.P2P.REPORT_SUBMITTED('merchant')).toBe('Đã gửi báo cáo về merchant');
    expect(TOAST.P2P.FAVORITE_ADDED('merchant')).toBe('Đã thêm merchant vào yêu thích ⭐');
    expect(TOAST.P2P.FAVORITE_REMOVED('merchant')).toBe('Đã bỏ merchant khỏi yêu thích');
    expect(TOAST.P2P.QUICK_BUY_STARTED('USDT', 'merchant')).toBe(
      'Đang tạo đơn mua USDT với merchant...',
    );
    expect(TOAST.P2P.QUICK_SELL_STARTED('BTC', 'merchant')).toBe(
      'Đang tạo đơn bán BTC với merchant...',
    );
    expect(TOAST.P2P.COMPARE_ADDED('merchant')).toBe('Đã thêm offer của merchant vào so sánh');
    expect(TOAST.P2P.DISPUTE_ESCALATED(2)).toBe('Đã chuyển lên cấp 2 xử lý');

    expect(TOAST.WALLET.ADDRESS_SAVED('Cold wallet')).toBe('Đã lưu địa chỉ "Cold wallet"');
    expect(TOAST.API.KEY_CREATED('Trading')).toBe('Đã tạo API key "Trading"');
  });

  it('formats prediction, Arena and rewards messages', () => {
    expect(TOAST.PREDICTIONS.ORDER_FILLED_NOTIFICATION(2.5, '0.64')).toBe(
      '2.5 shares vừa khớp @ $0.64!',
    );
    expect(TOAST.ARENA.TASK_CLAIMED('Daily check-in')).toBe('Đã nhận thưởng: Daily check-in');
    expect(TOAST.REWARDS.TASK_CLAIMED('Daily check-in')).toBe('Đã nhận thưởng: Daily check-in');
    expect(TOAST.REWARDS.SPIN_WIN('50 points')).toBe('🎉 Chúc mừng! Bạn nhận được 50 points');
    expect(TOAST.REWARDS.MYSTERY_OPENED('badge')).toBe('📦 Mở hộp thành công: badge');
    expect(TOAST.REWARDS.COMBO_ACTIVATED('2.5')).toBe('🔥 Combo x2.5 đã kích hoạt!');

    expect(TOAST.REFRESH.SUCCESS).toBe('Đã cập nhật');
    expect(TOAST.WALLET.WITHDRAW_SUBMITTED).toBe('Yêu cầu rút tiền đã được gửi!');
  });
});
