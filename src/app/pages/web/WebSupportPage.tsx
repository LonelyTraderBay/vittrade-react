/**
 * ══════════════════════════════════════════════════════════
 *  WEB SUPPORT PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/support
 *
 *  Support & Help Center — Customer support hub
 *
 *  Sections:
 *  - Quick actions (Live Chat, Submit Ticket, FAQ)
 *  - Help categories (Trading, Wallet, P2P, Security, Account)
 *  - Common issues & solutions
 *  - Contact options
 *  - Support tickets list
 *
 *  Design:
 *  - 2-column layout: Left sidebar (categories & quick actions) + Right main content (help topics)
 *  - Enterprise tokens: WEB_FONT, WEB_SPACING, WEB_ICON (canonical)
 *  - Card-based UI with hover states
 *  - Category-specific color coding
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  BookOpen,
  TrendingUp,
  Wallet,
  Users,
  Shield,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  ChevronRight,
  Search,
  ExternalLink,
  FileText,
  Video,
  MessageSquare,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { SUPPORT_TICKETS, type SupportTicket } from '../../data/mockData';

/* ═══════════════════════════════════════════════════════════
   TYPES & METADATA
   ═══════════════════════════════════════════════════════════ */

const HELP_CATEGORIES = [
  { id: 'all', label: 'Tất cả chủ đề', icon: BookOpen, color: '#3B82F6' },
  { id: 'trading', label: 'Giao dịch', icon: TrendingUp, color: '#10B981' },
  { id: 'wallet', label: 'Ví & Tài sản', icon: Wallet, color: '#8B5CF6' },
  { id: 'p2p', label: 'P2P Trading', icon: Users, color: '#F59E0B' },
  { id: 'security', label: 'Bảo mật', icon: Shield, color: '#EF4444' },
  { id: 'account', label: 'Tài khoản', icon: User, color: '#3B82F6' },
];

const COMMON_ISSUES = [
  {
    id: 'deposit-pending',
    category: 'wallet',
    title: 'Tại sao nạp tiền chưa về?',
    description: 'Giao dịch nạp tiền đang pending hoặc chưa hiển thị trong tài khoản',
    solution:
      'Kiểm tra TxHash trên blockchain explorer. Nạp tiền thường mất 5-30 phút tùy mạng. Nếu quá 1 giờ, liên hệ support với TxHash.',
    tags: ['Nạp tiền', 'Pending', 'Blockchain'],
  },
  {
    id: 'withdraw-failed',
    category: 'wallet',
    title: 'Rút tiền thất bại',
    description: 'Giao dịch rút tiền bị từ chối hoặc failed',
    solution:
      'Kiểm tra: (1) Số dư khả dụng đủ, (2) Địa chỉ ví đúng định dạng, (3) Mạng rút khớp với mạng ví nhận, (4) Đã xác thực 2FA.',
    tags: ['Rút tiền', 'Failed', 'Address'],
  },
  {
    id: 'kyc-rejected',
    category: 'account',
    title: 'KYC bị từ chối',
    description: 'Hồ sơ KYC không được duyệt',
    solution:
      'Lý do thường gặp: ảnh mờ, thông tin không khớp, giấy tờ hết hạn. Tải lại ảnh rõ nét, đảm bảo thông tin khớp 100% với giấy tờ.',
    tags: ['KYC', 'Verification', 'Identity'],
  },
  {
    id: 'order-not-filled',
    category: 'trading',
    title: 'Lệnh không được khớp',
    description: 'Đặt lệnh limit nhưng không thành công',
    solution:
      'Lệnh limit chỉ khớp khi giá thị trường chạm mức giá đặt. Kiểm tra giá đặt có hợp lý không. Dùng lệnh market để khớp ngay.',
    tags: ['Trading', 'Order', 'Limit'],
  },
  {
    id: 'p2p-dispute',
    category: 'p2p',
    title: 'Tranh chấp P2P',
    description: 'Đối tác không release coin sau khi đã chuyển tiền',
    solution:
      'Mở tranh chấp trong Order Detail → Cung cấp bằng chứng chuyển khoản (screenshot/bill) → Support sẽ xử lý trong 24h.',
    tags: ['P2P', 'Dispute', 'Escrow'],
  },
  {
    id: '2fa-lost',
    category: 'security',
    title: 'Mất mã 2FA',
    description: 'Không truy cập được ứng dụng Google Authenticator',
    solution:
      'Dùng backup code đã lưu khi bật 2FA. Nếu mất backup code, liên hệ support với: (1) Email đăng ký, (2) Ảnh selfie + CMND, (3) Video xác thực.',
    tags: ['Security', '2FA', 'Recovery'],
  },
];

const FAQ_ITEMS = [
  {
    question: 'Phí giao dịch là bao nhiêu?',
    answer:
      'Phí Maker: 0.1%, Phí Taker: 0.1%. VIP level càng cao phí càng thấp. Xem chi tiết tại Tài khoản → VIP Level.',
    category: 'trading',
  },
  {
    question: 'Thời gian xử lý nạp/rút bao lâu?',
    answer: 'Nạp tiền: 5-30 phút tùy mạng. Rút tiền: 5-60 phút, có thể lâu hơn vào giờ cao điểm.',
    category: 'wallet',
  },
  {
    question: 'KYC có bắt buộc không?',
    answer:
      'KYC Level 1 bắt buộc để rút tiền. KYC Level 2 cần cho giao dịch P2P và hạn mức cao hơn.',
    category: 'account',
  },
  {
    question: 'P2P có an toàn không?',
    answer:
      'P2P dùng hệ thống escrow: coin bị khóa cho đến khi 2 bên xác nhận. Chỉ giao dịch với merchant có rating cao.',
    category: 'p2p',
  },
];

const STATUS_CONFIG = {
  open: { label: 'Mở', color: '#3B82F6', icon: Clock },
  in_progress: { label: 'Đang xử lý', color: '#F59E0B', icon: AlertCircle },
  resolved: { label: 'Đã giải quyết', color: '#10B981', icon: CheckCircle },
  closed: { label: 'Đã đóng', color: '#8B95B3', icon: XCircle },
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebSupportPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTickets, setShowTickets] = useState(false);

  const filteredIssues = COMMON_ISSUES.filter((issue) => {
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredFAQs = FAQ_ITEMS.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Trung tâm hỗ trợ"
        subtitle="Tìm câu trả lời nhanh chóng hoặc liên hệ với đội ngũ hỗ trợ"
        back
        right={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowTickets(!showTickets)}
              style={{
                height: WEB_BUTTON.md,
                padding: `0 16px`,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                backgroundColor: showTickets ? `${c.primary}15` : c.surface,
                color: showTickets ? c.primary : c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <FileText size={WEB_ICON.md} />
              Tickets của tôi
            </button>

            <button
              onClick={() => navigate('/support/ticket/new')}
              style={{
                height: WEB_BUTTON.md,
                padding: `0 16px`,
                borderRadius: 8,
                border: 'none',
                backgroundColor: c.primary,
                color: '#FFFFFF',
                fontSize: WEB_FONT.base,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = c.primary;
              }}
            >
              <Plus size={WEB_ICON.md} />
              Tạo ticket mới
            </button>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════
          QUICK ACTIONS BAR
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: c.background, borderBottom: `1px solid ${c.border}` }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: `24px 32px`,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {[
              {
                icon: MessageCircle,
                label: 'Live Chat',
                description: 'Hỗ trợ trực tuyến 24/7',
                color: '#10B981',
                action: () => {},
              },
              {
                icon: Mail,
                label: 'Email Support',
                description: 'support@crypto.com',
                color: '#3B82F6',
                action: () => {},
              },
              {
                icon: BookOpen,
                label: 'Knowledge Base',
                description: 'Tài liệu & hướng dẫn',
                color: '#8B5CF6',
                action: () => navigate('/support/docs'),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: '12px',
                    padding: 20,
                    border: `1px solid ${c.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = c.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '10px',
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={WEB_ICON.lg} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: WEB_FONT.base,
                        fontWeight: 600,
                        color: c.text1,
                        marginBottom: '4px',
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>{item.description}</div>
                  </div>
                  <ChevronRight size={WEB_ICON.md} style={{ color: c.text2 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — 2 COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: `24px 32px`,
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════
              LEFT SIDEBAR — SEARCH & CATEGORIES
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Search */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Search size={WEB_ICON.md} />
                Tìm kiếm
              </div>
              <input
                type="text"
                placeholder="Tìm vấn đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.background,
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  outline: 'none',
                }}
              />
            </div>

            {/* Categories */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Chủ đề
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {HELP_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor:
                          selectedCategory === category.id ? `${category.color}15` : 'transparent',
                        color: selectedCategory === category.id ? category.color : c.text1,
                        fontSize: WEB_FONT.base,
                        fontWeight: selectedCategory === category.id ? 500 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = c.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Icon size={WEB_ICON.md} />
                      <span>{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resources */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Tài nguyên
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Video hướng dẫn', icon: Video },
                  { label: 'Cộng đồng', icon: MessageSquare },
                  { label: 'Blog & Tin tức', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: c.text1,
                        fontSize: WEB_FONT.base,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = c.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon size={WEB_ICON.sm} style={{ color: c.text2 }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT MAIN CONTENT — HELP TOPICS
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tickets Section (conditional) */}
            {showTickets && (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: 20,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: WEB_FONT.lg,
                    fontWeight: 700,
                    color: c.text1,
                    marginBottom: '16px',
                  }}
                >
                  Tickets của tôi
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {SUPPORT_TICKETS.slice(0, 3).map((ticket) => {
                    const status = STATUS_CONFIG[ticket.status];
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => navigate(`/support/ticket/${ticket.id}`)}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          backgroundColor: c.background,
                          border: `1px solid ${c.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = c.primary;
                          e.currentTarget.style.backgroundColor = c.surfaceHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = c.border;
                          e.currentTarget.style.backgroundColor = c.background;
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          <span style={{ fontSize: WEB_FONT.xs, color: c.text2 }}>
                            #{ticket.id}
                          </span>
                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: `${status.color}15`,
                              color: status.color,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <StatusIcon size={12} />
                            {status.label}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: WEB_FONT.base,
                            fontWeight: 600,
                            color: c.text1,
                            marginBottom: '4px',
                          }}
                        >
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>
                          Cập nhật: {ticket.updatedAt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Common Issues */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  color: c.text1,
                  marginBottom: '16px',
                }}
              >
                Vấn đề thường gặp
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      backgroundColor: c.background,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: WEB_FONT.base,
                        fontWeight: 700,
                        color: c.text1,
                        marginBottom: '8px',
                      }}
                    >
                      {issue.title}
                    </div>
                    <div
                      style={{
                        fontSize: WEB_FONT.base,
                        color: c.text2,
                        marginBottom: '12px',
                        lineHeight: '1.5',
                      }}
                    >
                      {issue.description}
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: `${c.primary}08`,
                        borderLeft: `3px solid ${c.primary}`,
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          color: c.primary,
                          marginBottom: '4px',
                        }}
                      >
                        Giải pháp:
                      </div>
                      <div style={{ fontSize: WEB_FONT.sm, color: c.text1, lineHeight: '1.6' }}>
                        {issue.solution}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {issue.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${c.text2}15`,
                            color: c.text2,
                            fontSize: WEB_FONT.xs,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  color: c.text1,
                  marginBottom: '16px',
                }}
              >
                Câu hỏi thường gặp
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: c.background,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: WEB_FONT.base,
                        fontWeight: 600,
                        color: c.text1,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <HelpCircle
                        size={WEB_ICON.md}
                        style={{ color: c.primary, flexShrink: 0, marginTop: '2px' }}
                      />
                      <span>{faq.question}</span>
                    </div>
                    <div
                      style={{
                        fontSize: WEB_FONT.base,
                        color: c.text2,
                        lineHeight: '1.6',
                        paddingLeft: '28px',
                      }}
                    >
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredIssues.length === 0 && filteredFAQs.length === 0 && (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: '60px 20px',
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                }}
              >
                <Search size={48} style={{ color: c.text2, margin: '0 auto 16px' }} />
                <div
                  style={{
                    fontSize: WEB_FONT.base,
                    fontWeight: 500,
                    color: c.text1,
                    marginBottom: '8px',
                  }}
                >
                  Không tìm thấy kết quả
                </div>
                <div style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>
                  Thử thay đổi từ khóa hoặc danh mục tìm kiếm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
