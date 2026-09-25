import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Users,
  FileText,
  Search,
  CreditCard,
  MessageSquare,
  Wallet,
  Eye,
} from 'lucide-react';

export const TABS = ['Hướng dẫn', 'An toàn', 'FAQ', 'Video'] as const;
export type TabKey = (typeof TABS)[number];

/* ─── How it works steps ─── */
export const STEPS_BUY = [
  {
    step: 1,
    icon: Search,
    title: 'Tìm quảng cáo',
    desc: 'Chọn quảng cáo BÁN phù hợp với giá, phương thức thanh toán và giới hạn mong muốn.',
    color: '#3B82F6',
  },
  {
    step: 2,
    icon: CreditCard,
    title: 'Đặt đơn & Thanh toán',
    desc: 'Nhập số lượng, xác nhận đơn. Chuyển tiền đúng thông tin và thời hạn quy định.',
    color: '#8B5CF6',
  },
  {
    step: 3,
    icon: MessageSquare,
    title: 'Chat & Xác nhận',
    desc: 'Liên hệ người bán qua chat mã hóa E2E. Gửi bằng chứng chuyển khoản.',
    color: '#10B981',
  },
  {
    step: 4,
    icon: Wallet,
    title: 'Nhận crypto',
    desc: 'Sau khi người bán xác nhận, crypto tự động chuyển vào ví của bạn.',
    color: '#F59E0B',
  },
];

export const STEPS_SELL = [
  {
    step: 1,
    icon: FileText,
    title: 'Đăng quảng cáo',
    desc: 'Tạo quảng cáo BÁN với giá, số lượng, phương thức thanh toán và điều kiện.',
    color: '#EF4444',
  },
  {
    step: 2,
    icon: Lock,
    title: 'Escrow tự động',
    desc: 'Khi có đơn, crypto tự động bị khóa trong Escrow để bảo vệ người mua.',
    color: '#8B5CF6',
  },
  {
    step: 3,
    icon: Eye,
    title: 'Kiểm tra thanh toán',
    desc: 'Kiểm tra tài khoản ngân hàng. Xác nhận khi đã nhận đủ tiền.',
    color: '#3B82F6',
  },
  {
    step: 4,
    icon: CheckCircle,
    title: 'Giải phóng crypto',
    desc: 'Nhấn xác nhận, crypto tự động chuyển cho người mua. Hoàn tất!',
    color: '#10B981',
  },
];

/* ─── Safety Tips ─── */
export const SAFETY_TIPS = [
  {
    icon: Shield,
    title: 'Chỉ giao dịch trên nền tảng',
    desc: 'Không chuyển tiền hoặc crypto ra ngoài hệ thống VitTrade.',
    color: '#3B82F6',
  },
  {
    icon: Lock,
    title: 'Không chia sẻ thông tin nhạy cảm',
    desc: 'Mật khẩu, OTP, seed phrase — không bao giờ chia sẻ trong chat.',
    color: '#EF4444',
  },
  {
    icon: AlertTriangle,
    title: 'Cảnh giác lừa đảo',
    desc: 'Kiểm tra kỹ số tiền, tên người nhận. Không tin "đã chuyển" nếu chưa thấy tiền.',
    color: '#F59E0B',
  },
  {
    icon: Eye,
    title: 'Xác nhận thực tế',
    desc: 'Chỉ nhấn "Đã nhận tiền" khi tiền ĐÃ VÀO tài khoản, không chỉ "đang xử lý".',
    color: '#8B5CF6',
  },
  {
    icon: Users,
    title: 'Kiểm tra đối tác',
    desc: 'Ưu tiên merchant có huy hiệu, tỷ lệ HT cao, nhiều đơn hoàn thành.',
    color: '#10B981',
  },
  {
    icon: FileText,
    title: 'Lưu bằng chứng',
    desc: 'Luôn chụp/lưu biên lai chuyển khoản. Cần thiết khi mở tranh chấp.',
    color: '#3B82F6',
  },
];

/* ─── FAQ ─── */
export const FAQ_DATA = [
  {
    q: 'P2P Trading là gì?',
    a: 'P2P (Peer-to-Peer) là hình thức mua bán crypto trực tiếp giữa người dùng với nhau, thông qua nền tảng trung gian. VitTrade cung cấp hệ thống Escrow để bảo vệ cả hai bên.',
  },
  {
    q: 'Phí giao dịch P2P là bao nhiêu?',
    a: 'Người tạo quảng cáo (Maker) miễn phí. Người đặt đơn (Taker) chịu phí 0.1%. Merchant được ưu đãi giảm 50% phí.',
  },
  {
    q: 'Escrow hoạt động như thế nào?',
    a: 'Khi có đơn, crypto của người bán bị khóa trong hợp đồng thông minh. Chỉ khi người bán xác nhận đã nhận tiền, crypto mới được giải phóng cho người mua.',
  },
  {
    q: 'Nếu có tranh chấp thì sao?',
    a: 'Bạn có thể mở tranh chấp trong vòng 72 giờ. Đội ngũ VitTrade sẽ xem xét bằng chứng từ cả hai bên và đưa ra phán quyết trong 24-48 giờ.',
  },
  {
    q: 'Thời gian thanh toán tối đa?',
    a: 'Tùy quảng cáo: 15, 30 hoặc 60 phút. Nếu quá thời hạn, đơn hàng tự động hủy và crypto trả về ví người bán.',
  },
  {
    q: 'Tôi có thể trở thành Merchant?',
    a: 'Có! Cần: tài khoản >= 30 ngày, >= 100 đơn hoàn thành, tỷ lệ HT >= 95%, KYC cấp 2+. Đăng ký tại mục "Đăng ký Merchant".',
  },
  {
    q: 'VitTrade có an toàn không?',
    a: 'VitTrade sử dụng mã hóa E2E cho tin nhắn, hệ thống Escrow smart contract, KYC đa cấp, và đội ngũ giám sát 24/7.',
  },
];

/* ─── Mock Video Tutorials ─── */
export const VIDEOS = [
  {
    title: 'Bắt đầu giao dịch P2P',
    duration: '5:32',
    views: '12.5K',
    thumb: 'P2P',
    level: 'Cơ bản' as const,
  },
  {
    title: 'Cách tạo quảng cáo hiệu quả',
    duration: '8:15',
    views: '8.3K',
    thumb: 'ADS',
    level: 'Trung bình' as const,
  },
  {
    title: 'Bảo mật tài khoản P2P',
    duration: '6:48',
    views: '15.2K',
    thumb: 'SEC',
    level: 'Cơ bản' as const,
  },
  {
    title: 'Xử lý tranh chấp',
    duration: '7:20',
    views: '6.1K',
    thumb: 'DSP',
    level: 'Nâng cao' as const,
  },
  {
    title: 'Trở thành Merchant Pro',
    duration: '10:45',
    views: '4.8K',
    thumb: 'PRO',
    level: 'Nâng cao' as const,
  },
  {
    title: 'Mẹo giao dịch an toàn',
    duration: '4:55',
    views: '21.3K',
    thumb: 'TIP',
    level: 'Cơ bản' as const,
  },
];

export const LEVEL_COLORS = {
  'Cơ bản': { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  'Trung bình': { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  'Nâng cao': { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
} as const;
