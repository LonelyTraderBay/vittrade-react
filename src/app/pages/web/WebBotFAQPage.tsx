/**
 * WebBotFAQPage — Enterprise Desktop Bot FAQ
 * 2-column layout: category sidebar + FAQ accordion
 */
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Mail } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_SPACING } from '../../components/layout/webConstants';

const FAQ_CATEGORIES = {
  general: {
    label: 'Tổng quan',
    icon: '💡',
    items: [
      {
        q: 'Trading Bot là gì?',
        a: 'Trading Bot là chương trình tự động thực hiện lệnh mua/bán dựa trên quy tắc và chiến lược đã thiết lập sẵn. Bot giao dịch 24/7 mà không cần can thiệp thủ công, tuân theo các thông số bạn đã cấu hình.',
      },
      {
        q: 'Bot giao dịch có sinh lời không?',
        a: 'Lợi nhuận phụ thuộc vào điều kiện thị trường, chiến lược và thông số. Bot CÓ THỂ sinh lời nhưng KHÔNG đảm bảo kiếm tiền. Hiệu suất quá khứ không dự đoán được kết quả tương lai. Bạn có thể mất một phần hoặc toàn bộ vốn.',
      },
      {
        q: 'Cần bao nhiêu tiền để bắt đầu?',
        a: 'Bạn có thể bắt đầu với $50-100 để thử nghiệm. Để giao dịch nghiêm túc, khuyến nghị tối thiểu $500-1,000 để chịu được biến động thị trường và phí giao dịch. Grid Bot cần nhiều vốn hơn (chia ra nhiều lệnh).',
      },
      {
        q: 'Có cần biết lập trình không?',
        a: 'Không cần lập trình! Bot sử dụng giao diện cấu hình đơn giản. Chỉ cần chọn chiến lược, thiết lập thông số (số tiền, khoảng giá, v.v.) và bắt đầu. Người dùng nâng cao có thể sử dụng API cho chiến lược tùy chỉnh.',
      },
      {
        q: 'Có thể mất nhiều hơn số đầu tư không?',
        a: 'Không. Bot chỉ giao dịch với số dư khả dụng. Bạn không thể mất nhiều hơn số tiền đã nạp. Tuy nhiên, bạn có thể mất toàn bộ khoản đầu tư nếu thị trường đi ngược. Luôn sử dụng stop-loss.',
      },
    ],
  },
  safety: {
    label: 'An toàn',
    icon: '🛡️',
    items: [
      {
        q: 'Sàn giao dịch sập thì sao?',
        a: 'Nếu API sàn lỗi, bot ngừng thực hiện lệnh mới cho đến khi kết nối được phục hồi. Các lệnh đang mở vẫn nằm trên sổ lệnh của sàn. Khuyến nghị sử dụng sàn có uptime 99.9%+.',
      },
      {
        q: 'Hacker có thể đánh cắp tiền không?',
        a: 'Chúng tôi không bao giờ nắm giữ tiền của bạn - tiền luôn nằm trên sàn. Chúng tôi chỉ sử dụng API key với quyền giao dịch (không có quyền rút tiền). Bật IP whitelist và 2FA để bảo mật tối đa.',
      },
      {
        q: 'Dừng khẩn cấp bot như thế nào?',
        a: 'Vào Risk Dashboard → Emergency Stop, hoặc nhấn nút dừng trên trang chi tiết bot. Thao tác này lập tức dừng lệnh mới và tùy chọn đóng vị thế đang mở. Bạn cũng có thể xóa API key để vô hiệu hóa tất cả bot ngay lập tức.',
      },
      {
        q: 'API key được lưu trữ an toàn không?',
        a: 'Có. API key được mã hóa bằng AES-256 và lưu trong vault bảo mật. Chúng tôi sử dụng khóa mã hóa riêng cho từng người dùng. Key không bao giờ được log hoặc hiển thị dạng text thuần sau khi tạo.',
      },
    ],
  },
  technical: {
    label: 'Kỹ thuật',
    icon: '⚙️',
    items: [
      {
        q: 'Backtest chính xác đến mức nào?',
        a: 'Backtest sử dụng dữ liệu lịch sử nhưng không thể dự đoán hiệu suất tương lai. Kỳ vọng kết quả thực tế sẽ kém hơn 10-20% do: slippage (1-2%), phí giao dịch (0.1-0.5%), độ trễ mạng, fill một phần.',
      },
      {
        q: 'Phí giao dịch bot bao nhiêu?',
        a: 'Phí giao dịch sàn (0.1-0.5% mỗi lệnh) áp dụng cho mọi lệnh. Nền tảng không thu thêm phí sử dụng bot (Free: 1 bot, Pro: unlimited). Chiến lược giao dịch nhiều có thể tích lũy phí - nhắm lợi nhuận > 2x phí.',
      },
      {
        q: 'Có thể sửa bot đang chạy không?',
        a: 'Không. Phải dừng bot, sửa thông số, rồi khởi động lại. Điều này ngăn ngừa lỗi logic chiến lược giữa chừng. Thay đổi có hiệu lực ở lần chạy tiếp theo. Với Grid Bot, sửa sẽ reset tất cả mức giá lưới.',
      },
      {
        q: 'Slippage là gì và cách giảm?',
        a: 'Slippage = chênh lệch giữa giá kỳ vọng và giá thực tế. Giảm bằng cách: 1) Giao dịch cặp thanh khoản cao (BTC/USDT), 2) Dùng limit order, 3) Chia lệnh lớn thành nhiều lệnh nhỏ.',
      },
    ],
  },
  strategies: {
    label: 'Chiến lược',
    icon: '📊',
    items: [
      {
        q: 'Chiến lược nào tốt nhất cho người mới?',
        a: 'DCA (Dollar Cost Averaging) là đơn giản và an toàn nhất cho người mới. Loại bỏ cảm xúc, giảm rủi ro timing, hiệu quả dài hạn. Bắt đầu với $100/tuần mua BTC hoặc ETH. Tránh Martingale cho đến khi có kinh nghiệm.',
      },
      {
        q: 'Khi nào nên dùng Grid Bot?',
        a: 'Dùng Grid Bot trong thị trường đi ngang/dao động (giá bật trong kênh). Tốt nhất cho cặp biến động cao nhưng không có xu hướng rõ. Không khuyến nghị trong bull/bear mạnh (giá breakout khỏi range).',
      },
      {
        q: 'Rủi ro Martingale là gì?',
        a: 'Martingale tăng gấp đôi vị thế sau mỗi lần thua, đòi hỏi vốn theo cấp số nhân. Sau 5 lần thua, cần 32x vốn ban đầu. Có thể xóa sạch tài khoản nếu xu hướng tiếp tục. Max drawdown có thể vượt -30%. Chỉ dành cho chuyên gia.',
      },
      {
        q: 'Chọn thông số đúng như thế nào?',
        a: 'Bắt đầu với mặc định khuyến nghị, sau đó điều chỉnh dựa trên: 1) Kết quả backtest, 2) Mức chấp nhận rủi ro, 3) Điều kiện thị trường. Dùng tool Optimization để tìm thông số tốt nhất. Tránh over-optimizing.',
      },
      {
        q: 'Có thể chạy nhiều bot cùng lúc không?',
        a: 'Có! Free: 1 bot, Pro: 5 bot, Enterprise: không giới hạn. Đa dạng hóa giữa chiến lược và cặp để giảm rủi ro. Dùng Portfolio Dashboard để theo dõi tương quan và tránh over-exposure.',
      },
    ],
  },
  troubleshooting: {
    label: 'Xử lý sự cố',
    icon: '🔧',
    items: [
      {
        q: 'Bot đang lỗ - phải làm gì?',
        a: 'Trước tiên, kiểm tra nếu lỗ nằm trong drawdown kỳ vọng (-10 đến -20% là bình thường). Nếu vượt giới hạn: 1) Dừng bot, 2) Xem lại backtest, 3) Kiểm tra điều kiện thị trường có thay đổi không, 4) Điều chỉnh thông số hoặc đổi chiến lược.',
      },
      {
        q: 'Bot ngừng hoạt động sau khi thay đổi cài đặt',
        a: 'Có thể bạn không đủ số dư cho thông số mới. Kiểm tra: 1) Số dư ví, 2) Vốn bị khóa trong bot khác, 3) Kích thước lệnh min/max. Giảm số tiền đầu tư hoặc nạp thêm.',
      },
      {
        q: 'Grid Bot không thực hiện giao dịch?',
        a: 'Grid Bot chỉ giao dịch khi giá cắt qua mức lưới. Nếu giá ổn định, không có giao dịch (điều này bình thường). Kiểm tra: 1) Giá nằm trong range lưới, 2) Khoảng cách lưới không quá rộng, 3) Thanh khoản đủ.',
      },
      {
        q: 'Nên chạy bot bao lâu trước khi dừng?',
        a: 'Tối thiểu 7 ngày cho DCA, 30 ngày cho Grid/Momentum. Bot cần thời gian để hoàn thành chu kỳ. Dừng quá sớm ngăn phục hồi từ drawdown tạm thời. Xem Equity Curve để biết xu hướng có cải thiện không.',
      },
    ],
  },
};

type CategoryKey = keyof typeof FAQ_CATEGORIES;

export function WebBotFAQPage() {
  const c = useThemeColors();
  const [category, setCategory] = useState<CategoryKey>('general');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCat = FAQ_CATEGORIES[category];
  const filteredFAQs = searchQuery
    ? currentCat.items.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : currentCat.items;

  const totalFAQs = Object.values(FAQ_CATEGORIES).reduce((s, cat) => s + cat.items.length, 0);

  return (
    <PageLayout>
      <Header title="Trading Bots FAQ" subtitle="Câu hỏi thường gặp" back />

      <div style={{ padding: '24px 0 40px' }}>
        {/* Search bar */}
        <div className="relative" style={{ marginBottom: 24 }}>
          <Search
            size={WEB_ICON.md}
            color={c.text3}
            className="absolute left-4 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            style={{
              paddingLeft: 44,
              paddingRight: 16,
              height: WEB_SPACING.rowDefault,
              borderRadius: 14,
              fontSize: WEB_FONT.md,
              background: c.surface,
              color: c.text1,
              border: `1.5px solid ${c.border}`,
              outline: 'none',
            }}
          />
        </div>

        {/* 2-column: sidebar + content */}
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
          {/* Category sidebar */}
          <div className="shrink-0" style={{ width: 220 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.divider}` }}>
                <p
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Danh mục ({Object.keys(FAQ_CATEGORIES).length})
                </p>
              </div>
              {(Object.keys(FAQ_CATEGORIES) as CategoryKey[]).map((key) => {
                const cat = FAQ_CATEGORIES[key];
                const active = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCategory(key);
                      setExpandedQ(null);
                    }}
                    className="w-full flex items-center gap-3 transition-colors"
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      border: 'none',
                      background: active ? `${c.primary}10` : 'transparent',
                      borderLeft: active ? `3px solid ${c.primary}` : '3px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div className="flex-1 text-left">
                      <span
                        style={{
                          color: active ? c.primary : c.text1,
                          fontSize: WEB_FONT.sm,
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {cat.label}
                      </span>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 6 }}>
                        ({cat.items.length})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stats card */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Tổng FAQ</p>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700 }}>
                    {totalFAQs}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Danh mục</p>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700 }}>
                    {Object.keys(FAQ_CATEGORIES).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ content */}
          <div className="flex-1 min-w-0">
            {/* Category header */}
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{currentCat.icon}</span>
              <div>
                <h2 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0 }}>
                  {currentCat.label}
                </h2>
                <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>
                  {filteredFAQs.length} câu hỏi
                  {searchQuery && ` (đang lọc)`}
                </p>
              </div>
            </div>

            {/* FAQ list */}
            {filteredFAQs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '48px 24px',
                }}
              >
                <HelpCircle size={48} color={c.text3} style={{ marginBottom: 12 }} />
                <p style={{ color: c.text3, fontSize: WEB_FONT.md }}>
                  Không tìm thấy câu hỏi phù hợp
                </p>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 8 }}>
                {filteredFAQs.map((faq, idx) => {
                  const isExpanded = expandedQ === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: c.surface,
                        border: `1px solid ${isExpanded ? c.primary + '40' : c.border}`,
                        borderRadius: 14,
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <button
                        onClick={() => setExpandedQ(isExpanded ? null : idx)}
                        className="w-full flex items-start gap-3 text-left"
                        style={{
                          padding: '16px 20px',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                        }}
                      >
                        <HelpCircle
                          size={WEB_ICON.md}
                          color={isExpanded ? c.primary : c.text3}
                          className="shrink-0 mt-0.5"
                        />
                        <p
                          className="flex-1"
                          style={{
                            color: c.text1,
                            fontSize: WEB_FONT.md,
                            fontWeight: 600,
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {faq.q}
                        </p>
                        {isExpanded ? (
                          <ChevronUp size={WEB_ICON.md} color={c.text3} className="shrink-0" />
                        ) : (
                          <ChevronDown size={WEB_ICON.md} color={c.text3} className="shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '0 20px 16px', paddingLeft: 50 }}>
                          <div
                            style={{
                              background: c.surface2,
                              borderRadius: 12,
                              padding: '14px 16px',
                            }}
                          >
                            <p
                              style={{
                                color: c.text2,
                                fontSize: WEB_FONT.base,
                                lineHeight: 1.7,
                                margin: 0,
                              }}
                            >
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Support CTA */}
            <div
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 16,
                padding: '20px 24px',
                marginTop: 24,
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 6 }}
              >
                Vẫn cần trợ giúp?
              </p>
              <p
                style={{ color: c.text3, fontSize: WEB_FONT.sm, lineHeight: 1.6, marginBottom: 14 }}
              >
                Không tìm thấy câu trả lời? Đội ngũ hỗ trợ luôn sẵn sàng 24/7.
              </p>
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-2"
                  style={{
                    height: 40,
                    padding: '0 20px',
                    borderRadius: 10,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                  }}
                >
                  <MessageCircle size={WEB_ICON.sm} /> Live Chat
                </button>
                <button
                  className="flex items-center gap-2"
                  style={{
                    height: 40,
                    padding: '0 20px',
                    borderRadius: 10,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: c.primary,
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  <Mail size={WEB_ICON.sm} /> Liên hệ hỗ trợ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
