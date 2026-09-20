import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Send, Image, AlertTriangle, ChevronRight, Upload, CheckCheck, Camera, X, Shield, Lock, Info, ShieldCheck, KeyRound, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { P2P_CHAT_MESSAGES, ChatMessage, P2P_ORDER, P2P_ORDERS } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { φ, φIcon } from '../../utils/golden';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { useGoBack } from '../../hooks/useGoBack';

export function P2PChatPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const { orderId } = useParams<{ orderId: string }>();
  const order = (orderId ? P2P_ORDERS.find(o => o.id === orderId) : null) || P2P_ORDER;
  const [messages, setMessages] = useState<ChatMessage[]>(P2P_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [showOrderInfo, setShowOrderInfo] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showE2EBanner, setShowE2EBanner] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ─── Scroll lock now handled by BottomSheetV2 internally ─── */

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onImageUploadSheetOpen } = useSheetAnalytics('p2p-chat-image-upload');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `cm${Date.now()}`, sender: 'me', text, time, type: 'text',
      isRead: false,
    };
    setMessages(m => [...m, newMsg]);
    setInput('');
    hapticSelection();

    // Simulate read receipt
    setTimeout(() => {
      setMessages(m => m.map(msg => msg.id === newMsg.id ? { ...msg, isRead: true, readAt: time } : msg));
    }, 1500);

    // Simulate typing + reply
    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      const replyTime = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' });
      setMessages(m => [...m, {
        id: `cm${Date.now() + 1}`, sender: 'other',
        text: 'Cảm ơn bạn! Tôi sẽ xác nhận ngay khi nhận được tiền.',
        time: replyTime, type: 'text', isRead: true,
      }]);
    }, 3500);
  };

  const handleSendImage = () => {
    const time = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, {
      id: `cm${Date.now()}`, sender: 'me', text: 'Ảnh chụp giao dịch',
      time, type: 'image', imageUrl: 'payment_proof.jpg', isRead: false,
    }]);
    setShowImageUpload(false);
    hapticSuccess();

    setTimeout(() => {
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, isRead: true } : msg));
    }, 2000);
  };

  const handleShareProof = () => {
    const time = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, {
      id: `cm${Date.now()}`, sender: 'me',
      text: `Tôi đã chuyển khoản ${fmtVnd(order.total)} VND qua ${order.paymentMethod}. Nội dung: VITTA ${order.id.toUpperCase()}`,
      time, type: 'text', isRead: false,
    }]);
    hapticSuccess();
  };

  return (
    <PageLayout variant="flush">
      {/* Header + Breadcrumb */}
      <Header variant="custom" breadcrumb>
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}` }}>
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: c.hoverBg }}>
            <ArrowLeft size={20} color={c.text1} />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{order.merchant.charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#10B981', borderColor: c.surface }} />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{order.merchant}</p>
            <p style={{ color: '#10B981', fontSize: 11 }}>
              {isTyping ? 'Đang nhập...' : 'Đang hoạt động'}
            </p>
          </div>
          <button onClick={() => setShowOrderInfo(!showOrderInfo)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
            Chi tiết <ChevronRight size={12} />
          </button>
          <button
            onClick={() => { navigate(`${prefix}/p2p/e2e-info`); hapticSelection(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl relative"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <Lock size={14} color="#10B981" />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.4, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: '#10B981' }}
            />
          </button>
        </div>
      </Header>

      {/* Order Info Panel */}
      {showOrderInfo && (
        <div className="px-4 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>#{order.orderNumber}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Chờ thanh toán</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Số lượng</p>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>{fmtAmount(order.amount)} {order.asset}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Tổng tiền</p>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>{fmtVnd(order.total)}</p>
            </div>
            <div className="text-right">
              <button onClick={() => navigate(`${prefix}/p2p/order/${order.id}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                Xem đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <AlertTriangle size={12} color="#EF4444" />
        <p style={{ color: '#EF4444', fontSize: 11 }}>Không chia sẻ thông tin cá nhân hay mật khẩu trong chat.</p>
      </div>

      {/* E2E Encryption Banner */}
      <AnimatePresence>
        {showE2EBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => { navigate(`${prefix}/p2p/e2e-info`); hapticSelection(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5"
              style={{ background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid rgba(16,185,129,0.12)' }}
            >
              <div className="relative shrink-0">
                <ShieldCheck size={14} color="#10B981" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                  Mã hóa đầu cuối (E2E)
                </p>
                <p style={{ color: c.text3, fontSize: 9 }}>
                  Tin nhắn được bảo vệ. Nhấn để tìm hiểu thêm.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Lock size={9} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>AES-256</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowE2EBanner(false); hapticSelection(); }}
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <X size={9} color="#10B981" />
              </button>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 px-5 py-4 pb-36 flex flex-col gap-3">
        {/* E2E Encryption Notice — system message */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => { navigate(`${prefix}/p2p/e2e-info`); hapticSelection(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <Lock size={9} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
              Tin nhắn được mã hóa đầu cuối
            </span>
            <Info size={9} color="#10B981" />
          </button>
        </div>

        {/* Date separator */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: c.divider }} />
          <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>Hôm nay</span>
          <div className="flex-1 h-px" style={{ background: c.divider }} />
        </div>

        {messages.map(msg => {
          if (msg.sender === 'system') return (
            <div key={msg.id} className="flex justify-center">
              <div className="px-3 py-1.5 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', maxWidth: '85%' }}>
                <p style={{ color: '#3B82F6', fontSize: 12 }}>{msg.text}</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{msg.time}</p>
              </div>
            </div>
          );

          const isMe = msg.sender === 'me';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 self-end"
                  style={{ background: '#3B82F6' }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>C</span>
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                {msg.type === 'image' ? (
                  <div className="rounded-2xl overflow-hidden"
                    style={{ borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px' }}>
                    <div className="w-48 h-32 flex items-center justify-center"
                      style={{ background: isMe ? 'linear-gradient(135deg, #3B82F6, #1d4ed8)' : c.surface2 }}>
                      <div className="flex flex-col items-center gap-1">
                        <Camera size={24} color={isMe ? '#fff' : c.text3} />
                        <span style={{ color: isMe ? 'rgba(255,255,255,0.8)' : c.text3, fontSize: 11 }}>Ảnh giao dịch</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl px-4 py-2.5"
                    style={{
                      background: isMe ? 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)' : c.surface2,
                      borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    }}>
                    <p style={{ color: isMe ? '#FFFFFF' : c.text1, fontSize: 14, lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-0.5" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <span style={{ color: c.text3, fontSize: 10 }}>{msg.time}</span>
                  {isMe && (
                    <CheckCheck size={12} color={msg.isRead ? '#3B82F6' : c.text3} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#3B82F6' }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>C</span>
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: c.surface2, borderRadius: '20px 20px 20px 4px' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: c.text3, animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky bottom: Quick Actions + Input */}
      <div className="sticky bottom-0 z-10" style={{ background: c.bg }}>
        {/* Quick Actions */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none" style={{ borderTop: `1px solid ${c.divider}` }}>
          <button onClick={handleShareProof}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'nowrap' }}>
            <Shield size={10} /> Chia sẻ bằng chứng
          </button>
          {['Tôi đã chuyển khoản xong', 'Bạn đã nhận tiền chưa?', 'Cảm ơn bạn!', 'Tôi cần hỗ trợ'].map(reply => (
            <button key={reply} onClick={() => setInput(reply)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, whiteSpace: 'nowrap' }}>
              {reply}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-end gap-3 px-4 py-3"
          style={{ background: c.surface, borderTop: `1px solid ${c.divider}`, paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
          <button onClick={() => setShowImageUpload(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
            style={{ background: c.hoverBg }}>
            <Image size={18} color={c.text2} />
          </button>
          <div className="flex-1 flex flex-col gap-0">
            {/* E2E indicator above input */}
            <div className="flex items-center gap-1 px-3 mb-0.5">
              <Lock size={7} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 8, fontWeight: 600, opacity: 0.8 }}>
                E2E Encrypted
              </span>
            </div>
            <div className="flex items-end rounded-2xl px-4 py-2 min-h-[44px]"
              style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}` }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Nhập tin nhắn..." rows={1}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, flex: 1, resize: 'none', lineHeight: 1.5, maxHeight: 100 }} />
            </div>
          </div>
          <button onClick={handleSend} disabled={!input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
            style={{ background: input.trim() ? '#3B82F6' : c.surface2, transition: 'all 0.2s' }}
            aria-label="Gửi tin nhắn">
            <Send size={18} color={input.trim() ? '#fff' : c.text3} />
          </button>
        </div>
      </div>

      {/* Image Upload Modal → BottomSheetV2 center */}
      <BottomSheetV2
        open={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        variant="center"
        title="Gửi hình ảnh"
        ariaLabel="Chọn hình ảnh để gửi"
        onAfterOpen={onImageUploadSheetOpen}
      >
        <div className="rounded-2xl p-8 flex flex-col items-center gap-3 mb-4"
          style={{ background: c.surface2, border: `2px dashed ${c.borderSolid}` }}>
          <Upload size={32} color={c.text3} />
          <p style={{ color: c.text2, fontSize: φ.sm }}>Chọn ảnh để gửi</p>
          <p style={{ color: c.text3, fontSize: φ.xs }}>JPG, PNG tối đa 5MB</p>
        </div>
        <button onClick={handleSendImage}
          className="w-full h-12 rounded-xl flex items-center justify-center font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)' }}>
          Gửi ảnh (Demo)
        </button>
      </BottomSheetV2>
    </PageLayout>
  );
}