import type { ElementType } from 'react';
import { CreditCard, UserX, Banknote, Globe, AlertOctagon } from 'lucide-react';

export interface ScamPattern {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  howItWorks: string[];
  redFlags: string[];
  prevention: string[];
  icon: ElementType;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  category: 'before' | 'during' | 'after';
}

/* ─── Data ─── */

export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: 'fake_payment',
    title: 'Bằng chứng thanh toán giả',
    severity: 'critical',
    description: 'Đối tác gửi screenshot chuyển khoản giả để lừa bạn giải phóng coin',
    howItWorks: [
      'Tạo đơn mua coin trên P2P',
      'Gửi ảnh chuyển khoản chỉnh sửa/giả mạo',
      'Yêu cầu bạn giải phóng coin ngay',
      'Coin bị mất, tiền không bao giờ đến',
    ],
    redFlags: [
      'Thúc giục giải phóng coin nhanh bất thường',
      'Screenshot thanh toán mờ hoặc bị crop',
      'Số tiền trên screenshot không khớp',
      'Tên người chuyển không khớp với tài khoản P2P',
    ],
    prevention: [
      'Luôn kiểm tra tài khoản ngân hàng trước khi giải phóng',
      'Chờ tiền "có" trong tài khoản, không chỉ nhìn SMS/screenshot',
      'So sánh tên, số tiền, mã giao dịch chính xác',
      'Bấm "Đã nhận" chỉ khi tiền thực sự đã vào tài khoản',
    ],
    icon: CreditCard,
  },
  {
    id: 'off_platform',
    title: 'Giao dịch ngoài nền tảng',
    severity: 'critical',
    description: 'Đối tác dụ giao dịch ngoài hệ thống để tránh escrow bảo vệ',
    howItWorks: [
      'Liên hệ qua Zalo/Telegram ngoài chat P2P',
      'Đưa ra mức giá "tốt hơn" để dụ giao dịch trực tiếp',
      'Khi chuyển tiền/coin, đối phương biến mất',
      'Không có escrow → không thể dispute/claim bảo hiểm',
    ],
    redFlags: [
      'Yêu cầu liên hệ qua kênh ngoài',
      'Đề nghị giá tốt hơn thị trường',
      'Yêu cầu chuyển coin/tiền trực tiếp',
      'Hứa hẹn nhanh hơn, không cần quy trình',
    ],
    prevention: [
      'KHÔNG BAO GIỜ giao dịch ngoài nền tảng',
      'Mọi thanh toán phải qua flow P2P có escrow',
      'Report ngay nếu bị yêu cầu giao dịch ngoài',
      'Chỉ chat trong hệ thống — tin nhắn ngoài không được bảo vệ',
    ],
    icon: Globe,
  },
  {
    id: 'chargeback',
    title: 'Chargeback sau giao dịch',
    severity: 'high',
    description: 'Buyer chuyển tiền rồi làm chargeback qua ngân hàng sau khi nhận coin',
    howItWorks: [
      'Buyer chuyển khoản thật sự qua ngân hàng',
      'Seller xác nhận nhận tiền và giải phóng coin',
      'Buyer liên hệ ngân hàng yêu cầu hoàn tiền (chargeback)',
      'Seller mất cả coin lẫn tiền',
    ],
    redFlags: [
      'Buyer mới, ít giao dịch nhưng order lớn',
      'Thúc giục giải phóng coin rất nhanh',
      'Completion rate thấp bất thường',
      'Không chịu dùng phương thức thanh toán thông thường',
    ],
    prevention: [
      'Chỉ giao dịch với buyer có rating và lịch sử tốt',
      'Cẩn thận với đơn giá trị lớn từ tài khoản mới',
      'Lưu trữ mọi bằng chứng giao dịch',
      'Nếu bị chargeback, gửi claim bảo hiểm ngay trong 7 ngày',
    ],
    icon: Banknote,
  },
  {
    id: 'impersonation',
    title: 'Mạo danh nhân viên sàn',
    severity: 'high',
    description: 'Kẻ lừa đảo giả danh admin/nhân viên sàn để lừa lấy thông tin',
    howItWorks: [
      'Liên hệ qua Telegram/Zalo giả danh nhân viên hỗ trợ',
      'Thông báo "tài khoản bị khóa" hoặc "cần xác minh"',
      'Yêu cầu cung cấp mật khẩu, mã OTP, seed phrase',
      'Chiếm quyền tài khoản hoặc rút hết coin',
    ],
    redFlags: [
      'Nhân viên liên hệ qua kênh ngoài (Telegram, Zalo, email cá nhân)',
      'Yêu cầu mật khẩu hoặc mã OTP',
      'Tạo cảm giác khẩn cấp "phải làm ngay"',
      'Link lạ yêu cầu đăng nhập',
    ],
    prevention: [
      'Nhân viên sàn KHÔNG BAO GIỜ yêu cầu mật khẩu/OTP',
      'Chỉ liên hệ hỗ trợ qua kênh chính thức trong app',
      'Thiết lập Anti-Phishing Code để nhận diện email thật',
      'Không bấm link lạ, kiểm tra domain chính xác',
    ],
    icon: UserX,
  },
  {
    id: 'triangle_scam',
    title: 'Gian lận tam giác',
    severity: 'medium',
    description: 'Kẻ lừa đảo dùng tiền từ nạn nhân khác để thanh toán đơn P2P của bạn',
    howItWorks: [
      'Kẻ lừa đảo (A) tạo đơn mua coin từ Seller (B)',
      'A dụ nạn nhân (C) chuyển tiền vào tài khoản B',
      'B nhận tiền từ C, tưởng A đã thanh toán, giải phóng coin',
      'C là nạn nhân thật sự — report ngân hàng → B bị đóng tài khoản',
    ],
    redFlags: [
      'Tên người chuyển không khớp với tên tài khoản P2P',
      'Lý do chuyển khoản ghi lạ/không liên quan',
      'Yêu cầu xác nhận bằng mã ngoài hệ thống',
    ],
    prevention: [
      'Kiểm tra tên người chuyển PHẢT khớp với tên P2P',
      'Nếu tên không khớp, KHÔNG giải phóng, mở dispute',
      'Lưu trữ sao kê ngân hàng mọi giao dịch P2P',
    ],
    icon: AlertOctagon,
  },
];

export const SEVERITY_CONFIG: Record<ScamPattern['severity'], { label: string; color: string }> = {
  critical: { label: 'Nguy hiểm', color: '#EF4444' },
  high: { label: 'Cao', color: '#F59E0B' },
  medium: { label: 'Trung bình', color: '#3B82F6' },
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Before
  {
    id: 'ck1',
    label: '2FA đã bật',
    description: 'Bảo vệ tài khoản bằng 2FA',
    checked: true,
    category: 'before',
  },
  {
    id: 'ck2',
    label: 'Anti-Phishing Code đã thiết lập',
    description: 'Nhận diện email thật từ sàn',
    checked: false,
    category: 'before',
  },
  {
    id: 'ck3',
    label: 'Kiểm tra rating đối tác',
    description: 'Chỉ giao dịch với merchant uy tín',
    checked: true,
    category: 'before',
  },
  {
    id: 'ck4',
    label: 'Xác nhận payment method hợp lệ',
    description: 'Phương thức thanh toán được hỗ trợ',
    checked: true,
    category: 'before',
  },
  // During
  {
    id: 'ck5',
    label: 'Kiểm tra tên người chuyển',
    description: 'Tên phải khớp với tên P2P',
    checked: false,
    category: 'during',
  },
  {
    id: 'ck6',
    label: 'Chỉ bấm "Đã nhận" khi tiền thật vào TK',
    description: 'Không tin screenshot',
    checked: true,
    category: 'during',
  },
  {
    id: 'ck7',
    label: 'Không giao dịch ngoài nền tảng',
    description: 'Mọi thao tác trong app',
    checked: true,
    category: 'during',
  },
  {
    id: 'ck8',
    label: 'Lưu bằng chứng giao dịch',
    description: 'Screenshot chat, sao kê ngân hàng',
    checked: false,
    category: 'during',
  },
  // After
  {
    id: 'ck9',
    label: 'Review đối tác sau giao dịch',
    description: 'Giúp cộng đồng nhận diện scam',
    checked: true,
    category: 'after',
  },
  {
    id: 'ck10',
    label: 'Biết cách gửi claim bảo hiểm',
    description: 'Nắm rõ quy trình trong 7 ngày',
    checked: false,
    category: 'after',
  },
];

export const CATEGORY_LABELS: Record<ChecklistItem['category'], string> = {
  before: 'Trước giao dịch',
  during: 'Trong giao dịch',
  after: 'Sau giao dịch',
};

/* ═══════════════════════════════════════════════════════════ */
