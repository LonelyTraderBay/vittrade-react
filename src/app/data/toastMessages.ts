/**
 * ══════════════════════════════════════════════════════════
 *  toastMessages — Centralized toast message constants
 * ══════════════════════════════════════════════════════════
 *  Single source of truth for all user-facing toast strings.
 *  Grouped by module for easy navigation and future i18n.
 *
 *  Usage:
 *    import { TOAST } from '../../data/toastMessages';
 *    actionToast.success(TOAST.COPY.ADDRESS);
 *
 *  i18n: When adding multi-language support, replace string
 *  values with `t('toast.copy.address')` calls.
 */

export const TOAST = {
  /* ─────────── Global / Shared ─────────── */
  REFRESH: {
    SUCCESS: 'Đã cập nhật',
    ERROR: 'Làm mới thất bại',
  },

  COPY: {
    DEFAULT: 'Đã sao chép!',
    ADDRESS: 'Đã sao chép địa chỉ',
    DEPOSIT_ADDRESS: 'Đã sao chép địa chỉ nạp',
    REFERRAL: 'Đã sao chép mã giới thiệu',
    SECRET_KEY: 'Đã sao chép mã bí mật',
    API_KEY: 'Đã sao chép',
    ALL_PAYMENT: 'Đã sao chép toàn bộ thông tin!',
    /** Dynamic: `Đã sao chép ${label}` */
    withLabel: (label: string) => `Đã sao chép ${label}`,
  },

  /* ─────────── Notification ─────────── */
  NOTIFICATION: {
    READ_ALL: 'Đã đọc tất cả thông báo',
    DELETED: 'Đã xóa thông báo',
  },

  /* ─────────── Market / Favorites ─────────── */
  FAVORITE: {
    /** Dynamic: toggles */
    added: (name: string) => `Đã thêm ${name} vào yêu thích`,
    removed: (name: string) => `Đã bỏ ${name} khỏi yêu thích`,
  },

  /* ─────────── Trade (Spot) ─────────── */
  TRADE: {
    /** Dynamic: side */
    ORDER_PLACED: (side: 'buy' | 'sell') =>
      `Đã đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} thành công`,
    /** Dynamic: orderId (last 6 chars uppercase) */
    ORDER_CANCELLED: (orderId: string) =>
      `Đã hủy lệnh #${orderId.slice(-6).toUpperCase()}`,
    ORDER_MODIFIED: (orderId: string) =>
      `Đã sửa lệnh #${orderId.slice(-6).toUpperCase()}`,
    EXPORT_SUCCESS: 'Đã tạo file xuất dữ liệu',
  },

  /* ─────────── P2P ─────────── */
  P2P: {
    /** Dynamic: ad type + asset */
    AD_PUBLISHED: (type: 'buy' | 'sell', asset: string) =>
      `Quảng cáo ${type === 'buy' ? 'MUA' : 'BÁN'} ${asset} đã được đăng!`,
    AD_PAUSED: 'Đã tạm dừng quảng cáo',
    AD_RESUMED: 'Đã bật quảng cáo',
    AD_DELETED: 'Đã xóa quảng cáo',
    MESSAGE_SENT: 'Đã gửi tin nhắn',
    PROOF_UPLOADED: 'Đã tải lên bằng chứng',
    REPORT_SUBMITTED: (name: string) => `Đã gửi báo cáo về ${name}`,
    /** Favourite toggling */
    FAVORITE_ADDED: (merchant: string) => `Đã thêm ${merchant} vào yêu thích ⭐`,
    FAVORITE_REMOVED: (merchant: string) => `Đã bỏ ${merchant} khỏi yêu thích`,
    /** Quick buy/sell */
    QUICK_BUY_STARTED: (asset: string, merchant: string) =>
      `Đang tạo đơn mua ${asset} với ${merchant}...`,
    QUICK_SELL_STARTED: (asset: string, merchant: string) =>
      `Đang tạo đơn bán ${asset} với ${merchant}...`,
    /** Context menu actions */
    SHARE_COPIED: 'Đã sao chép link offer',
    COMPARE_ADDED: (merchant: string) => `Đã thêm offer của ${merchant} vào so sánh`,
    COMPARE_CLEARED: 'Đã xóa danh sách so sánh',
    /** Optimistic updates */
    PAYMENT_MARKED: 'Đã đánh dấu thanh toán — Chờ xác nhận từ merchant',
    PAYMENT_UNDO: 'Đã hoàn tác — Đơn hàng trở lại trạng thái chờ thanh toán',
    CANCEL_MARKED: 'Đã hủy đơn hàng',
    CANCEL_UNDO: 'Đã hoàn tác — Đơn hàng được khôi phục',
    /** Dispute escalation */
    DISPUTE_ESCALATED: (level: number) => `Đã chuyển lên cấp ${level} xử lý`,
    /** Escrow */
    ESCROW_ADDRESS_COPIED: 'Đã sao chép địa chỉ escrow',
  },

  /* ─────────── Wallet ─────────── */
  WALLET: {
    ADDRESS_SAVED: (label: string) => `Đã lưu địa chỉ "${label}"`,
    ADDRESS_DELETED: 'Đã xóa địa chỉ',
    WITHDRAW_SUBMITTED: 'Yêu cầu rút tiền đã được gửi!',
  },

  /* ─────────── API Management ─────────── */
  API: {
    KEY_CREATED: (name: string) => `Đã tạo API key "${name}"`,
    KEY_DELETED: 'Đã xóa API key',
    KEY_ACTIVATED: 'Đã kích hoạt API key',
    KEY_DEACTIVATED: 'Đã vô hiệu hóa API key',
  },

  /* ─────────── Predictions ─────────── */
  PREDICTIONS: {
    EMAIL_SUBSCRIBED: 'Subscribed to daily updates!',
    EMAIL_INVALID: 'Please enter a valid email',
    FILTERS_CLEARED: 'Filters cleared',
    COMMENT_POSTED: 'Comment posted',
    LINK_SHARED: 'Link copied to clipboard',
    POSITION_OPENED: 'Position opened successfully',
    ORDER_CONFIRMED: 'Lệnh đã được xác nhận',
    ORDER_SUBMITTED: 'Lệnh đã gửi thành công',
    ORDER_CANCELLED: 'Đã hủy lệnh thành công',
    RECEIPT_SHARED: 'Đã sao chép link chi tiết lệnh',
    ORDER_FILLED_NOTIFICATION: (shares: number, price: string) => `${shares} shares vừa khớp @ $${price}!`,
    COMMENT_REPORTED: 'Đã báo cáo bình luận. Chúng tôi sẽ xem xét.',
    USER_BLOCKED: 'Đã chặn người dùng trong mục Predictions',
  },

  /* ─────────── Open Arena ─────────── */
  ARENA: {
    CHECKIN_CLAIMED: 'Đã check-in! Nhận Arena Points thành công',
    TASK_CLAIMED: (task: string) => `Đã nhận thưởng: ${task}`,
    CHALLENGE_JOINED: 'Đã tham gia challenge thành công!',
    CHALLENGE_CREATED: 'Challenge đã được tạo thành công!',
    DRAFT_SAVED: 'Đã lưu bản nháp',
    MESSAGE_SENT: 'Đã gửi tin nhắn',
    LINK_COPIED: 'Đã sao chép link challenge',
    MODE_CLONED: 'Đã clone mode thành công',
    CREATOR_REPORTED: 'Đã tạo case báo cáo creator. Chúng tôi sẽ xem xét trong 24h.',
    EVIDENCE_SUBMITTED: 'Đã gửi bằng chứng thành công',
    RESULT_CONFIRMED: 'Đã xác nhận kết quả',
    USER_BLOCKED: 'Đã chặn người dùng',
    USER_REPORTED: 'Đã tạo case báo cáo. Đội ngũ sẽ xem xét trong 24h.',
    CHALLENGE_DECLINED: 'Đã từ chối lời mời',
    REMATCH_SENT: 'Đã gửi yêu cầu tái đấu',
    USER_UNBLOCKED: 'Đã bỏ chặn người dùng',
    APPEAL_SUBMITTED: 'Đã gửi khiếu nại. Đội ngũ sẽ phản hồi trong 48h.',
    SAFETY_ACKNOWLEDGED: 'Cảm ơn bạn đã đọc quy tắc an toàn',
    RESULT_SUBMITTED: 'Đã gửi kết quả. Đợi xác nhận từ các bên.',
    RESULT_CONFIRMED_V2: 'Đã xác nhận kết quả. Điểm sẽ được phân phối.',
    EVIDENCE_UPLOADED: 'Đã nộp bằng chứng thành công',
    DISPUTE_SUBMITTED: 'Đã gửi tranh chấp. Đội ngũ sẽ xem xét trong 48h. Điểm tạm giữ.',
    CHALLENGE_LEFT: 'Đã rời challenge. Hoàn điểm sẽ được xử lý.',
    CHALLENGE_LEFT_FULL_REFUND: 'Đã rời challenge. Hoàn 100% điểm.',
    CHALLENGE_LEFT_PARTIAL_REFUND: 'Đã rời challenge. Hoàn 50% điểm (sau deadline).',
    EVIDENCE_FILE_ADDED: 'Đã thêm bằng chứng. Chờ xác nhận.',
    CHAT_LINK_WARNING: 'Cẩn thận — không chia sẻ thông tin nhạy cảm qua link.',
    MESSAGE_REPORTED: 'Đã báo cáo tin nhắn. Đội ngũ sẽ xem xét.',
  },

  /* ─────────── Rewards Hub (Unified) ─────────── */
  REWARDS: {
    TASK_CLAIMED: (task: string) => `Đã nhận thưởng: ${task}`,
    CHECKIN_CLAIMED: 'Đã check-in! Nhận Arena Points thành công',
    ALL_CLAIMED: 'Đã nhận tất cả phần thưởng!',
    SPIN_WIN: (prize: string) => `🎉 Chúc mừng! Bạn nhận được ${prize}`,
    SPIN_COOLDOWN: 'Bạn đã quay hôm nay rồi. Quay lại vào ngày mai!',
    MYSTERY_OPENED: (prize: string) => `📦 Mở hộp thành công: ${prize}`,
    COMBO_ACTIVATED: (multiplier: string) => `🔥 Combo x${multiplier} đã kích hoạt!`,
  },
} as const;