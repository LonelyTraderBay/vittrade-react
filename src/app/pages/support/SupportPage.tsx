import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, AlertCircle, CheckCircle, XCircle, MessageCircle, Mail, Phone, Plus, BookOpen, Bell, HelpCircle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { SUPPORT_TICKETS } from '../../data/mockData';
import type { SupportTicket } from '../../data/mockData';

const STATUS_CONFIG = {
  open: { label: 'Mở', color: '#3B82F6', icon: Clock },
  in_progress: { label: 'Đang xử lý', color: '#F59E0B', icon: AlertCircle },
  resolved: { label: 'Đã giải quyết', color: '#10B981', icon: CheckCircle },
  closed: { label: 'Đã đóng', color: '#8B95B3', icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Thấp', color: '#8B95B3' },
  medium: { label: 'Trung bình', color: '#3B82F6' },
  high: { label: 'Cao', color: '#F59E0B' },
  urgent: { label: 'Khẩn cấp', color: '#EF4444' },
};

const CATEGORY_LABELS = {
  technical: 'Kỹ thuật',
  trading: 'Giao dịch',
  deposit: 'Nạp tiền',
  withdraw: 'Rút tiền',
  kyc: 'KYC',
  other: 'Khác',
};

const FAQ_ITEMS = [
  {
    question: 'Làm sao để nạp tiền vào tài khoản?',
    answer: 'Vào mục Ví → Nạp tiền → Chọn loại coin và mạng → Copy địa chỉ ví → Chuyển coin vào địa chỉ đó',
  },
  {
    question: 'Phí giao dịch là bao nhiêu?',
    answer: 'Phí Maker: 0.1%, Phí Taker: 0.1%. VIP level càng cao phí càng thấp.',
  },
  {
    question: 'Tại sao rút tiền bị pending?',
    answer: 'Rút tiền cần thời gian xử lý từ 5-30 phút tùy mạng. Kiểm tra TxHash để theo dõi.',
  },
  {
    question: 'Làm sao để xác minh KYC?',
    answer: 'Vào Tài khoản → KYC → Tải lên CMND/CCCD và ảnh selfie → Chờ duyệt 1-3 ngày làm việc.',
  },
];

export function SupportPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tickets] = useState(SUPPORT_TICKETS);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');

  const renderTicket = (ticket: SupportTicket) => {
    const status = STATUS_CONFIG[ticket.status];
    const priority = PRIORITY_CONFIG[ticket.priority];
    const StatusIcon = status.icon;
    const lastMessage = ticket.messages[ticket.messages.length - 1];

    return (
      <TrCard key={ticket.id} as="button" hover className="w-full p-4 mb-3 text-left"
        onClick={() => alert(`Chi tiết ticket #${ticket.id} - Tính năng sẽ được bổ sung`)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: status.color + '22', color: status.color }}>
                #{ticket.id.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: priority.color + '22', color: priority.color }}>
                {priority.label}
              </span>
            </div>
            <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
              {ticket.subject}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <StatusIcon size={14} color={status.color} />
            <span style={{ color: status.color, fontSize: 11, fontWeight: 600 }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-lg text-xs"
            style={{ background: c.surface3, color: c.text2 }}>
            {CATEGORY_LABELS[ticket.category]}
          </span>
          <span style={{ color: c.text3, fontSize: 11 }}>
            Tạo lúc {ticket.createdAt}
          </span>
        </div>

        {/* Last message */}
        <div className="rounded-lg p-3"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={12} color={c.text2} />
            <span style={{ color: c.text2, fontSize: 11 }}>
              {lastMessage.sender === 'user' ? 'Bạn' : 'Hỗ trợ'}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>• {lastMessage.time}</span>
          </div>
          <p style={{ color: c.text1, fontSize: 12, lineHeight: 1.4 }}>
            {lastMessage.text}
          </p>
        </div>
      </TrCard>
    );
  };

  return (
    <PageLayout>
      <Header title="Hỗ trợ" subtitle="Liên hệ · Hỗ trợ" back />

      <PageContent gap="default" padding="none">
        {/* Quick Contact */}
        <div className="px-5 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}`, boxShadow: c.cardShadow }}>
          {/* Quick links to Help Center & Announcements */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => navigate(`${prefix}/support/help`)}
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <BookOpen size={16} color="#8B5CF6" />
              <div className="text-left">
                <p style={{ color: '#8B5CF6', fontSize: 11 }}>Trung tâm</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Trợ giúp</p>
              </div>
            </button>
            <button onClick={() => navigate(`${prefix}/support/announcements`)}
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Bell size={16} color="#F59E0B" />
              <div className="text-left">
                <p style={{ color: '#F59E0B', fontSize: 11 }}>Thông báo</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Hệ thống</p>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href="mailto:support@vittrade.vn"
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Mail size={16} color="#3B82F6" />
              <div>
                <p style={{ color: '#3B82F6', fontSize: 11 }}>Email</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>support@...</p>
              </div>
            </a>
            <a href="tel:1900xxxx"
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Phone size={16} color="#10B981" />
              <div>
                <p style={{ color: '#10B981', fontSize: 11 }}>Hotline</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>1900 xxxx</p>
              </div>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 py-3">
          <button
            onClick={() => setShowFAQ(false)}
            className="flex-1 h-10 rounded-xl font-semibold"
            style={{
              background: !showFAQ ? '#3B82F6' : c.hoverBg,
              color: !showFAQ ? '#fff' : c.text2,
              fontSize: 14,
            }}>
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setShowFAQ(true)}
            className="flex-1 h-10 rounded-xl font-semibold"
            style={{
              background: showFAQ ? '#3B82F6' : c.hoverBg,
              color: showFAQ ? '#fff' : c.text2,
              fontSize: 14,
            }}>
            FAQ
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {!showFAQ ? (
            <div className="contents">
              {/* Create Ticket Button */}
              <button
                onClick={() => alert('Tính năng tạo ticket sẽ được bổ sung')}
                className="w-full h-12 rounded-xl font-semibold mb-4 flex items-center justify-center gap-2"
                style={{ background: '#3B82F6', color: '#fff', fontSize: 14 }}>
                <Plus size={18} />
                Tạo ticket mới
              </button>

              {/* Tickets List */}
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <MessageCircle size={48} color={c.borderSolid} />
                  <p style={{ color: c.text3, fontSize: 14 }}>
                    Chưa có ticket nào
                  </p>
                </div>
              ) : (
                <div className="contents">
                  {activeTickets.length > 0 && (
                    <div className="mb-4">
                      <h2 style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>
                        Đang xử lý ({activeTickets.length})
                      </h2>
                      {activeTickets.map(renderTicket)}
                    </div>
                  )}
                  
                  {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length > 0 && (
                    <div>
                      <h2 style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>
                        Đã hoàn thành
                      </h2>
                      {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').map(renderTicket)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* FAQ */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={18} color="#3B82F6" />
                <h2 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                  Câu hỏi thường gặp
                </h2>
              </div>

              {FAQ_ITEMS.map((item, index) => (
                <TrCard key={index} as="button" hover className="w-full text-left p-4 mb-3"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 600, flex: 1 }}>
                      {item.question}
                    </h3>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
                      style={{ background: 'rgba(59,130,246,0.1)' }}>
                      <span style={{ color: '#3B82F6', fontSize: 12 }}>▼</span>
                    </div>
                  </div>
                  {expandedFAQ === index && (
                    <p style={{ color: c.text2, fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
                      {item.answer}
                    </p>
                  )}
                </TrCard>
              ))}

              <div className="mt-6 rounded-xl p-4"
                style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                  Không tìm thấy câu trả lời? Hãy tạo ticket hoặc liên hệ support qua email/hotline.
                </p>
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}