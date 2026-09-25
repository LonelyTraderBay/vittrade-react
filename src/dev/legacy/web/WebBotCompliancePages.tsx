/**
 * WebBotCompliancePages — Enterprise Desktop versions of:
 *   - BotTermsOfServicePage
 *   - BotSuitabilityAssessmentPage
 *   - BotEmergencyStopPage
 *   - BotSecuritySettingsPage
 */
import React, { useState } from 'react';
import { browserStorage } from '@/shared/lib/browser-storage';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  AlertOctagon,
  Pause,
  X,
  Key,
  Smartphone,
  MapPin,
  Activity,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON, WEB_SPACING } from '@/shared/theme/webTokens';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

/* ═══════════════════════════════════════════════════
   1. WebBotTermsOfServicePage
   ═══════════════════════════════════════════════════ */

const TOS_SECTIONS = [
  {
    title: '1. Chấp nhận Điều khoản',
    content:
      'Bằng việc truy cập và sử dụng dịch vụ Trading Bot, bạn đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào, bạn không nên sử dụng dịch vụ.',
  },
  {
    title: '2. Mô tả Dịch vụ',
    content:
      'Trading Bot cung cấp các công cụ giao dịch tự động cho thị trường tiền mã hóa. Dịch vụ hoạt động 24/7 dựa trên cấu hình người dùng. Chúng tôi không đảm bảo lợi nhuận hoặc hiệu suất cụ thể nào.',
  },
  {
    title: '3. Điều kiện sử dụng',
    content:
      'Bạn phải đủ 18 tuổi, hoàn thành xác minh KYC, hiểu rủi ro giao dịch tiền mã hóa, và có đủ vốn chấp nhận mất. Bạn không được sử dụng dịch vụ cho mục đích bất hợp pháp.',
  },
  {
    title: '4. Rủi ro và Trách nhiệm',
    content:
      'Giao dịch tiền mã hóa có rủi ro mất toàn bộ vốn. Bot có thể hoạt động không như kỳ vọng do điều kiện thị trường, lỗi kỹ thuật hoặc cấu hình sai. Bạn chịu toàn bộ trách nhiệm cho quyết định giao dịch.',
  },
  {
    title: '5. Bảo mật API Key',
    content:
      'API key được mã hóa AES-256. Chúng tôi chỉ sử dụng quyền giao dịch, không có quyền rút tiền. Bạn có trách nhiệm bảo mật thông tin đăng nhập và bật 2FA.',
  },
  {
    title: '6. Phí Dịch vụ',
    content:
      'Nền tảng không thu phí sử dụng bot. Phí giao dịch sàn (0.1-0.5%) áp dụng cho mỗi lệnh. Phí có thể thay đổi theo thông báo trước 30 ngày.',
  },
  {
    title: '7. Giới hạn Trách nhiệm',
    content:
      'Chúng tôi không chịu trách nhiệm cho lỗ do biến động thị trường, lỗi sàn giao dịch, lỗi mạng, hoặc các yếu tố ngoài tầm kiểm soát. Trách nhiệm tối đa không vượt quá phí dịch vụ đã trả.',
  },
  {
    title: '8. Sửa đổi và Chấm dứt',
    content:
      'Chúng tôi có quyền sửa đổi điều khoản bất kỳ lúc nào với thông báo 14 ngày. Bạn có thể chấm dứt sử dụng bất kỳ lúc nào. Chúng tôi có thể đình chỉ dịch vụ vì vi phạm điều khoản.',
  },
];

export function WebBotTermsOfServicePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [readToEnd, setReadToEnd] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50) setReadToEnd(true);
  };

  return (
    <PageLayout>
      <Header title="Điều khoản Dịch vụ" subtitle="Terms of Service · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1fr 340px', alignItems: 'flex-start' }}
        >
          {/* Left: TOS content */}
          <div
            onScroll={handleScroll}
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '24px 28px',
              maxHeight: 600,
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <FileText size={WEB_ICON.xl} color={c.primary} />
              <h2 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, margin: 0 }}>
                Điều khoản Dịch vụ Trading Bot
              </h2>
            </div>
            <p style={{ color: c.text3, fontSize: WEB_FONT.sm, marginBottom: 20 }}>
              Cập nhật lần cuối: 01/03/2026. Phiên bản: 2.1
            </p>
            <div className="flex flex-col" style={{ gap: 20 }}>
              {TOS_SECTIONS.map((s, i) => (
                <div key={i}>
                  <h3
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}
                  >
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Right: Accept panel */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Shield size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Xác nhận
                </span>
              </div>
              {!readToEnd && (
                <div
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 12,
                  }}
                >
                  <p style={{ color: '#F59E0B', fontSize: WEB_FONT.sm, margin: 0 }}>
                    Vui lòng đọc hết điều khoản trước khi chấp nhận.
                  </p>
                </div>
              )}
              <button
                onClick={() => setAgreed(!agreed)}
                className="flex items-start gap-3 w-full text-left"
                style={{
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginBottom: 16,
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    marginTop: 1,
                    border: `2px solid ${agreed ? c.primary : c.border}`,
                    background: agreed ? c.primary : 'transparent',
                  }}
                >
                  {agreed && <CheckCircle2 size={14} color="#fff" />}
                </div>
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6 }}>
                  Tôi đã đọc, hiểu và đồng ý với toàn bộ Điều khoản Dịch vụ
                </span>
              </button>
              <button
                onClick={() => {
                  if (agreed && readToEnd) {
                    browserStorage.local.setItem('bot_terms_accepted', new Date().toISOString());
                    toast.success('Đã chấp nhận điều khoản');
                    navigate(-1);
                  }
                }}
                disabled={!agreed || !readToEnd}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  border: 'none',
                  cursor: agreed && readToEnd ? 'pointer' : 'not-allowed',
                  background: agreed && readToEnd ? c.primary : c.surface2,
                  color: agreed && readToEnd ? '#fff' : c.text3,
                }}
              >
                Chấp nhận Điều khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebBotSuitabilityAssessmentPage
   ═══════════════════════════════════════════════════ */

interface Question {
  id: string;
  question: string;
  category: string;
  options: { id: string; text: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'experience',
    question: 'Bạn đã giao dịch tiền mã hóa bao lâu?',
    options: [
      { id: 'a', text: 'Chưa bao giờ / Dưới 3 tháng', score: 0 },
      { id: 'b', text: '3-12 tháng', score: 1 },
      { id: 'c', text: '1-3 năm', score: 2 },
      { id: 'd', text: 'Trên 3 năm', score: 3 },
    ],
  },
  {
    id: 'q2',
    category: 'knowledge',
    question: 'Bạn hiểu về các chiến lược bot giao dịch đến mức nào?',
    options: [
      { id: 'a', text: 'Không biết gì', score: 0 },
      { id: 'b', text: 'Biết cơ bản (DCA)', score: 1 },
      { id: 'c', text: 'Hiểu nhiều chiến lược', score: 2 },
      { id: 'd', text: 'Chuyên gia / tự code chiến lược', score: 3 },
    ],
  },
  {
    id: 'q3',
    category: 'risk',
    question: 'Mức lỗ tối đa bạn có thể chấp nhận?',
    options: [
      { id: 'a', text: 'Không muốn mất tiền', score: 0 },
      { id: 'b', text: 'Dưới 10%', score: 1 },
      { id: 'c', text: '10-30%', score: 2 },
      { id: 'd', text: 'Trên 30% (chấp nhận rủi ro cao)', score: 3 },
    ],
  },
  {
    id: 'q4',
    category: 'financial',
    question: 'Số vốn bạn dự định dùng cho bot chiếm bao nhiêu % tổng tài sản?',
    options: [
      { id: 'a', text: 'Trên 50% (phần lớn)', score: 0 },
      { id: 'b', text: '20-50%', score: 1 },
      { id: 'c', text: '5-20%', score: 2 },
      { id: 'd', text: 'Dưới 5% (rất nhỏ)', score: 3 },
    ],
  },
];

export function WebBotSuitabilityAssessmentPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const totalScore = allAnswered
    ? QUESTIONS.reduce((s, q) => {
        const opt = q.options.find((o) => o.id === answers[q.id]);
        return s + (opt?.score || 0);
      }, 0)
    : 0;
  const maxScore = QUESTIONS.length * 3;
  const isEligible = totalScore >= 6;

  return (
    <PageLayout>
      <Header title="Đánh giá phù hợp" subtitle="Suitability Assessment · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1fr 340px', alignItems: 'flex-start' }}
        >
          {/* Questions */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {QUESTIONS.map((q, qi) => (
              <div
                key={q.id}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Câu {qi + 1} / {QUESTIONS.length} — {q.category}
                </p>
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  {q.question}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                        className="text-left transition-all"
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          background: selected ? `${c.primaryAlpha08}` : c.surface2,
                          border: `2px solid ${selected ? c.primary : 'transparent'}`,
                        }}
                      >
                        <span
                          style={{
                            color: selected ? c.primary : c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: selected ? 700 : 500,
                          }}
                        >
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Results sidebar */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}
              >
                Kết quả
              </p>
              {!allAnswered ? (
                <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
                  Trả lời tất cả {QUESTIONS.length} câu hỏi để xem kết quả.
                </p>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <p
                      style={{
                        color: isEligible ? '#10B981' : '#F59E0B',
                        fontSize: WEB_FONT['2xl'],
                        fontWeight: 700,
                      }}
                    >
                      {totalScore}/{maxScore}
                    </p>
                    <p
                      style={{
                        color: isEligible ? '#10B981' : '#F59E0B',
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                      }}
                    >
                      {isEligible ? 'Đủ điều kiện' : 'Cần cân nhắc thêm'}
                    </p>
                  </div>
                  <div
                    style={{
                      background: isEligible ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}
                    >
                      {isEligible
                        ? 'Bạn có kinh nghiệm và kiến thức phù hợp để sử dụng Trading Bot. Tuy nhiên, luôn nhớ quản lý rủi ro.'
                        : 'Khuyến nghị bạn tìm hiểu thêm về giao dịch trước khi sử dụng Trading Bot. Bắt đầu với chiến lược DCA rủi ro thấp.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      browserStorage.local.setItem('bot_suitability_score', totalScore.toString());
                      toast.success('Đã lưu kết quả đánh giá');
                      navigate(-1);
                    }}
                    style={{
                      width: '100%',
                      height: WEB_BUTTON.lg,
                      borderRadius: 12,
                      fontSize: WEB_FONT.md,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: isEligible ? '#10B981' : '#F59E0B',
                      color: '#fff',
                    }}
                  >
                    {isEligible ? 'Tiếp tục sử dụng Bot' : 'Xem hướng dẫn trước'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   3. WebBotEmergencyStopPage
   ═══════════════════════════════════════════════════ */

const ACTIVE_BOTS_ES = [
  { id: 'bot1', name: 'DCA Bot #1', pair: 'BTC/USDT', profit: 84.2, status: 'running' },
  { id: 'bot2', name: 'Grid Bot #1', pair: 'ETH/USDT', profit: 127.4, status: 'running' },
  { id: 'bot3', name: 'Momentum Bot #1', pair: 'SOL/USDT', profit: -12.3, status: 'running' },
];

export function WebBotEmergencyStopPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [closePositions, setClosePositions] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopped, setStopped] = useState(false);

  const handleEmergencyStop = async () => {
    setStopping(true);
    await new Promise((r) => setTimeout(r, 2000));
    setStopping(false);
    setStopped(true);
    toast.success('Tất cả bot đã dừng khẩn cấp');
  };

  return (
    <PageLayout>
      <Header title="Emergency Stop" subtitle="Dừng khẩn cấp · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        {stopped ? (
          <div className="flex flex-col items-center" style={{ padding: '60px 0' }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'rgba(16,185,129,0.1)',
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={40} color="#10B981" />
            </div>
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT['2xl'],
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Tất cả bot đã dừng
            </h2>
            <p style={{ color: c.text3, fontSize: WEB_FONT.md, marginBottom: 24 }}>
              {ACTIVE_BOTS_ES.length} bot đã được dừng an toàn.{' '}
              {closePositions
                ? 'Các vị thế đang mở đã được đóng.'
                : 'Các vị thế đang mở vẫn giữ nguyên.'}
            </p>
            <button
              onClick={() => navigate(-1)}
              style={{
                height: WEB_BUTTON.lg,
                padding: '0 32px',
                borderRadius: 12,
                fontSize: WEB_FONT.md,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: c.primary,
                color: '#fff',
              }}
            >
              Quay lại Trading Bots
            </button>
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: '1fr 380px', alignItems: 'flex-start' }}
          >
            {/* Left: Warning + bots list */}
            <div className="flex flex-col" style={{ gap: 16 }}>
              <div
                className="flex items-start gap-4"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '2px solid rgba(239,68,68,0.25)',
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <AlertOctagon size={WEB_ICON.xl} color="#EF4444" className="shrink-0" />
                <div>
                  <p
                    style={{
                      color: '#EF4444',
                      fontSize: WEB_FONT.lg,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Emergency Stop
                  </p>
                  <p
                    style={{ color: c.text1, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}
                  >
                    Thao tác này sẽ dừng NGAY LẬP TỨC tất cả bot đang chạy. Lệnh mới sẽ không được
                    đặt. Không thể hoàn tác.
                  </p>
                </div>
              </div>
              {/* Bots affected */}
              <div
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  Bot sẽ bị dừng ({ACTIVE_BOTS_ES.length})
                </p>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {ACTIVE_BOTS_ES.map((bot) => (
                    <div
                      key={bot.id}
                      className="flex items-center justify-between"
                      style={{ background: c.surface2, borderRadius: 12, padding: '12px 16px' }}
                    >
                      <div>
                        <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                          {bot.name}
                        </span>
                        <span style={{ color: c.text3, fontSize: WEB_FONT.sm, marginLeft: 8 }}>
                          {bot.pair}
                        </span>
                      </div>
                      <span
                        style={{
                          color: bot.profit >= 0 ? '#10B981' : '#EF4444',
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {bot.profit >= 0 ? '+' : ''}${bot.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Confirm panel */}
            <div
              style={{
                position: 'sticky',
                top: 24,
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}
              >
                Xác nhận dừng khẩn cấp
              </p>
              {/* Reason */}
              <label
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Lý do (tùy chọn)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do dừng khẩn cấp..."
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  padding: '12px 16px',
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  resize: 'none',
                  outline: 'none',
                  marginBottom: 16,
                }}
              />
              {/* Close positions toggle */}
              <button
                onClick={() => setClosePositions(!closePositions)}
                className="flex items-center gap-3 w-full text-left"
                style={{
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    border: `2px solid ${closePositions ? '#EF4444' : c.border}`,
                    background: closePositions ? '#EF4444' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {closePositions && <CheckCircle2 size={14} color="#fff" />}
                </div>
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                  Đóng tất cả vị thế đang mở
                </span>
              </button>
              {/* Confirm checkbox */}
              <button
                onClick={() => setConfirmed(!confirmed)}
                className="flex items-start gap-3 w-full text-left"
                style={{
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    marginTop: 1,
                    border: `2px solid ${confirmed ? '#EF4444' : c.border}`,
                    background: confirmed ? '#EF4444' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {confirmed && <CheckCircle2 size={14} color="#fff" />}
                </div>
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  Tôi hiểu rằng thao tác này không thể hoàn tác và tất cả bot sẽ bị dừng ngay lập
                  tức
                </span>
              </button>
              <button
                onClick={handleEmergencyStop}
                disabled={!confirmed || stopping}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  border: 'none',
                  cursor: confirmed && !stopping ? 'pointer' : 'not-allowed',
                  background: confirmed ? '#EF4444' : c.surface2,
                  color: confirmed ? '#fff' : c.text3,
                }}
              >
                {stopping ? 'Đang dừng...' : 'DỪNG KHẨN CẤP TẤT CẢ BOT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   4. WebBotSecuritySettingsPage
   ═══════════════════════════════════════════════════ */

const API_KEYS_DATA = [
  {
    id: '1',
    name: 'Trading Bot Key #1',
    permissions: 'Trade + Read',
    lastUsed: '2 giờ trước',
    created: '2026-01-15',
  },
  {
    id: '2',
    name: 'Analytics Key',
    permissions: 'Read Only',
    lastUsed: '1 ngày trước',
    created: '2026-02-20',
  },
];
const IP_WHITELIST_DATA = [
  { id: '1', ip: '192.168.1.100', label: 'Home Network', added: '2026-03-01' },
  { id: '2', ip: '203.0.113.42', label: 'VPS Server', added: '2026-03-05' },
];

export function WebBotSecuritySettingsPage() {
  const c = useThemeColors();
  const [showKeys, setShowKeys] = useState(false);

  return (
    <PageLayout>
      <Header title="Bảo mật Bot" subtitle="Security Settings · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
        >
          {/* API Keys */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '20px 24px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <Key size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  API Keys
                </span>
              </div>
              <button
                style={{
                  height: WEB_BUTTON.sm,
                  padding: '0 14px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: c.primary,
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} style={{ marginRight: 4, display: 'inline' }} /> Thêm key
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {API_KEYS_DATA.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between"
                  style={{ background: c.surface2, borderRadius: 12, padding: '14px 16px' }}
                >
                  <div>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {key.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      {key.permissions} · {key.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showKeys ? (
                        <EyeOff size={14} color={c.text3} />
                      ) : (
                        <Eye size={14} color={c.text3} />
                      )}
                    </button>
                    <button
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.08)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IP Whitelist */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '20px 24px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <MapPin size={WEB_ICON.md} color="#10B981" />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  IP Whitelist
                </span>
              </div>
              <button
                style={{
                  height: WEB_BUTTON.sm,
                  padding: '0 14px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} style={{ marginRight: 4, display: 'inline' }} /> Thêm IP
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {IP_WHITELIST_DATA.map((ip) => (
                <div
                  key={ip.id}
                  className="flex items-center justify-between"
                  style={{ background: c.surface2, borderRadius: 12, padding: '14px 16px' }}
                >
                  <div>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        marginBottom: 2,
                      }}
                    >
                      {ip.ip}
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      {ip.label} · {ip.added}
                    </p>
                  </div>
                  <button
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.08)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security features */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}
        >
          {[
            {
              icon: Smartphone,
              title: '2FA',
              desc: 'Đã bật Authenticator App',
              color: '#10B981',
              status: 'Hoạt động',
            },
            {
              icon: Shield,
              title: 'Anti-Phishing',
              desc: 'Mã xác minh: BOT-7X9',
              color: '#3B82F6',
              status: 'Hoạt động',
            },
            {
              icon: Activity,
              title: 'Giám sát',
              desc: 'Cảnh báo bất thường realtime',
              color: '#8B5CF6',
              status: 'Hoạt động',
            },
          ].map((feat) => {
            const FIcon = feat.icon;
            return (
              <div
                key={feat.title}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: feat.color + '12',
                    }}
                  >
                    <FIcon size={WEB_ICON.md} color={feat.color} />
                  </div>
                  <div>
                    <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      {feat.title}
                    </p>
                    <p style={{ color: feat.color, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                      {feat.status}
                    </p>
                  </div>
                </div>
                <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Recent activity */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
            Hoạt động gần đây
          </p>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {[
              { action: 'Bot tạo mới: DCA Bot #1', time: '2 giờ trước', status: 'success' },
              { action: 'API key được tạo', time: '1 ngày trước', status: 'success' },
              { action: 'Đăng nhập thất bại', time: '3 ngày trước', status: 'warning' },
              { action: 'Bot dừng: Grid Bot #2', time: '5 ngày trước', status: 'success' },
            ].map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: '10px 0',
                  borderBottom: i < 3 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: a.status === 'success' ? '#10B981' : '#F59E0B',
                    }}
                  />
                  <span style={{ color: c.text1, fontSize: WEB_FONT.sm }}>{a.action}</span>
                </div>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
