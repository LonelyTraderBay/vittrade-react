import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, Info, Lock, Send, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2PChatMessageMutation,
  useP2PChatQuery,
  useP2POrderQuery,
} from '../model/p2p-chat-queries';

export function P2PChatPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { orderId } = useParams<{ orderId: string }>();
  const { hasPermission } = useAuth();
  const chatQuery = useP2PChatQuery(orderId);
  const orderQuery = useP2POrderQuery(orderId);
  const messageMutation = useP2PChatMessageMutation(orderId);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = chatQuery.data;
  const order = orderQuery.data;
  const canWriteChat = hasPermission('p2p:write') || hasPermission('p2p:chat:write');

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chat?.messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!canWriteChat || !text || messageMutation.isPending) return;
    setError(null);
    try {
      await messageMutation.mutateAsync({
        request: { text, type: 'text' },
        idempotencyKey: `p2p-chat-${orderId}-${crypto.randomUUID()}`,
      });
      setInput('');
    } catch {
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  if (chatQuery.isPending || orderQuery.isPending) {
    return (
      <PageLayout>
        <Header title="P2P Chat" subtitle="Tin nhắn giao dịch" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải cuộc trò chuyện…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (chatQuery.isError || !chat || orderQuery.isError || !order) {
    return (
      <PageLayout>
        <Header title="P2P Chat" subtitle="Tin nhắn giao dịch" back />
        <ErrorState
          title="Unable to load P2P chat"
          message="The chat contract is unavailable. Try again without losing the current route."
          actionLabel="Retry"
          onAction={() => {
            void chatQuery.refetch();
            void orderQuery.refetch();
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="flush">
      <Header variant="custom" breadcrumb>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: colors.surface, borderBottom: `1px solid ${colors.divider}` }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: colors.hoverBg }}
          >
            <ArrowLeft size={19} color={colors.text1} />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            <span style={{ color: '#fff', fontWeight: 700 }}>{chat.counterparty.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
              {chat.counterparty}
            </p>
            <p style={{ color: '#10B981', fontSize: 10 }}>Kênh giao dịch được bảo vệ</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/p2p/order/${order.id}`)}
            aria-label="Open P2P order"
            className="rounded-lg px-2.5 py-1.5 text-xs"
            style={{ background: colors.primaryAlpha12, color: colors.primary }}
          >
            Order
          </button>
        </div>
      </Header>

      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          background: 'rgba(16,185,129,0.06)',
          borderBottom: '1px solid rgba(16,185,129,0.12)',
        }}
      >
        <ShieldCheck size={14} color="#10B981" />
        <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
          {chat.e2eEncrypted ? 'Tin nhắn được mã hóa đầu cuối' : 'Kênh chat bảo vệ'}
        </span>
        <Lock size={10} color="#10B981" />
      </div>

      <PageContent gap="default" className="pb-32">
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: colors.surface2, color: colors.text3, fontSize: 10 }}
          >
            <Info size={10} /> Không chia sẻ mật khẩu hoặc mã xác thực
          </span>
        </div>
        {chat.messages.map((message) => {
          if (message.sender === 'system')
            return (
              <div
                key={message.id}
                className="text-center rounded-xl p-2"
                style={{ background: colors.primaryAlpha12 }}
              >
                <p style={{ color: colors.primary, fontSize: 11 }}>{message.text}</p>
                <p style={{ color: colors.text3, fontSize: 9, marginTop: 2 }}>{message.sentAt}</p>
              </div>
            );
          const isUser = message.sender === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[78%]">
                <div
                  className="rounded-2xl px-4 py-2.5"
                  style={{
                    background: isUser ? '#3B82F6' : colors.surface2,
                    color: isUser ? '#fff' : colors.text1,
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{message.text}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : ''}`}>
                  <span style={{ color: colors.text3, fontSize: 9 }}>{message.sentAt}</span>
                  {isUser && (
                    <CheckCheck size={11} color={message.readAt ? '#3B82F6' : colors.text3} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </PageContent>

      <div
        className="sticky bottom-0 z-10 px-4 py-3"
        style={{
          background: colors.surface,
          borderTop: `1px solid ${colors.divider}`,
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        {error && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 11, marginBottom: 8 }}>
            {error}
          </p>
        )}
        {!canWriteChat && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 11, marginBottom: 8 }}>
            P2P chat write permission is required to send messages.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            aria-label="P2P chat message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!canWriteChat || messageMutation.isPending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Nhập tin nhắn…"
            className="flex-1 rounded-2xl px-4 py-3 outline-none resize-none"
            style={{ background: colors.surface2, color: colors.text1, fontSize: 13 }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canWriteChat || !input.trim() || messageMutation.isPending}
            aria-label="Send chat message"
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: input.trim() ? '#3B82F6' : colors.surface2,
              opacity: input.trim() && !messageMutation.isPending ? 1 : 0.6,
            }}
          >
            <Send size={17} color={input.trim() ? '#fff' : colors.text3} />
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
