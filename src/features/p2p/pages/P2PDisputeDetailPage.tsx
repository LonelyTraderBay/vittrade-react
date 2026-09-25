import { useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle,
  Clock,
  FileText,
  Send,
  Shield,
  UserRound,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import type { P2PDisputeStatus } from '../model/p2p-types';
import {
  useP2PDisputeEscalationMutation,
  useP2PDisputeMessageMutation,
  useP2PDisputeQuery,
} from '../model/p2p-dispute-detail-queries';

const STATUS_MAP: Record<P2PDisputeStatus, { label: string; color: string; icon: typeof Clock }> = {
  submitted: { label: 'Đã gửi', color: '#F59E0B', icon: Clock },
  under_review: { label: 'Đang xem xét', color: '#3B82F6', icon: FileText },
  resolved: { label: 'Đã giải quyết', color: '#10B981', icon: CheckCircle },
  rejected: { label: 'Bị từ chối', color: '#EF4444', icon: AlertTriangle },
};

export function P2PDisputeDetailPage() {
  const { id } = useParams();
  const colors = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const { hasPermission } = useAuth();
  const [message, setMessage] = useState('');
  const disputeQuery = useP2PDisputeQuery(id);
  const messageMutation = useP2PDisputeMessageMutation(id);
  const escalationMutation = useP2PDisputeEscalationMutation(id);
  const dispute = disputeQuery.data;

  if (disputeQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Chi tiết tranh chấp" subtitle="Compliance · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải chi tiết…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (disputeQuery.isError || !dispute) {
    return (
      <PageLayout>
        <Header title="Chi tiết tranh chấp" subtitle="Compliance · P2P" back />
        <ErrorState
          title="Unable to load P2P dispute"
          message="The dispute contract is unavailable. Try again without losing the current route."
          actionLabel="Retry"
          onAction={() => void disputeQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const status = STATUS_MAP[dispute.status];
  const StatusIcon = status.icon;
  const canWriteDispute = hasPermission('p2p:write') || hasPermission('p2p:dispute:write');
  const canEscalate =
    canWriteDispute &&
    dispute.escalationLevel < 4 &&
    !['resolved', 'rejected'].includes(dispute.status);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;
    try {
      await messageMutation.mutateAsync({
        request: { text },
        idempotencyKey: `p2p-dispute-message-${crypto.randomUUID()}`,
      });
      setMessage('');
      hapticSuccess();
      toast.success('Đã gửi tin nhắn cho bộ phận hỗ trợ.');
    } catch {
      toast.error('Không thể gửi tin nhắn.');
    }
  };

  const escalate = async () => {
    try {
      await escalationMutation.mutateAsync({
        request: { level: dispute.escalationLevel + 1 },
        idempotencyKey: `p2p-dispute-escalate-${crypto.randomUUID()}`,
      });
      hapticSelection();
      toast.success('Đã chuyển tranh chấp lên cấp xử lý tiếp theo.');
    } catch {
      toast.error('Không thể escalation tranh chấp.');
    }
  };

  return (
    <PageLayout>
      <Header title="Chi tiết tranh chấp" subtitle="Compliance · P2P" back />
      <PageContent gap="default">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${status.color}10`, border: `1px solid ${status.color}25` }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${status.color}15` }}
          >
            <StatusIcon size={24} color={status.color} />
          </div>
          <div className="flex-1">
            <p style={{ color: status.color, fontSize: 15, fontWeight: 700 }}>{status.label}</p>
            <p style={{ color: colors.text2, fontSize: 11 }}>Đơn hàng #{dispute.orderNumber}</p>
          </div>
          <span style={{ color: colors.text3, fontSize: 11 }}>Cấp {dispute.escalationLevel}/4</span>
        </div>

        <TrCard className="p-4">
          <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>{dispute.reason}</p>
          <p style={{ color: colors.text2, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
            {dispute.description}
          </p>
          {canEscalate && (
            <button
              type="button"
              onClick={() => void escalate()}
              aria-label="Escalate dispute"
              disabled={escalationMutation.isPending}
              className="w-full flex items-center justify-between mt-3 px-3 py-3 rounded-xl"
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <span style={{ color: '#D97706', fontSize: 12, fontWeight: 600 }}>
                <ArrowUp size={14} className="inline mr-2" />
                Chuyển lên cấp {dispute.escalationLevel + 1}
              </span>
              <span style={{ color: '#F59E0B', fontSize: 11 }}>
                {escalationMutation.isPending ? 'Đang xử lý…' : 'Escalate'}
              </span>
            </button>
          )}
        </TrCard>

        {!canWriteDispute && (
          <p role="alert" style={{ color: colors.warning, fontSize: 12 }}>
            P2P dispute write permission is required for support actions.
          </p>
        )}

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} color="#3B82F6" />
            <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>Timeline</p>
          </div>
          <div className="flex flex-col gap-3">
            {dispute.timeline.map((event, index) => (
              <div className="flex gap-3" key={`${event.time}-${index}`}>
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{
                    background:
                      index === dispute.timeline.length - 1 ? '#3B82F6' : colors.borderSolid,
                  }}
                />
                <div>
                  <p style={{ color: colors.text2, fontSize: 11 }}>{event.event}</p>
                  <p style={{ color: colors.text3, fontSize: 10 }}>
                    {event.time}
                    {event.detail ? ` · ${event.detail}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} color="#8B5CF6" />
            <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Bằng chứng ({dispute.evidence.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dispute.evidence.map((evidence) => (
              <span
                key={evidence}
                className="rounded-lg px-2.5 py-2"
                style={{ background: colors.surface2, color: colors.text2, fontSize: 11 }}
              >
                {evidence}
              </span>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} color="#10B981" />
            <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>Trao đổi hỗ trợ</p>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {dispute.supportMessages.map((item, index) => (
              <div
                key={`${item.time}-${index}`}
                className="rounded-xl p-3"
                style={{
                  background: item.sender === 'user' ? 'rgba(59,130,246,0.08)' : colors.surface2,
                  alignSelf: item.sender === 'user' ? 'flex-end' : 'stretch',
                  maxWidth: '92%',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <UserRound size={11} color={item.sender === 'user' ? '#3B82F6' : colors.text3} />
                  <span style={{ color: colors.text3, fontSize: 10 }}>
                    {item.sender === 'user' ? 'Bạn' : 'Hỗ trợ'} · {item.time}
                  </span>
                </div>
                <p style={{ color: colors.text2, fontSize: 11, lineHeight: 1.5 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Dispute support message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={!canWriteDispute || messageMutation.isPending}
              maxLength={4000}
              placeholder="Nhập nội dung cần bổ sung…"
              className="flex-1 rounded-xl px-3 py-2"
              style={{ background: colors.surface2, color: colors.text1, fontSize: 11 }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canWriteDispute || !message.trim() || messageMutation.isPending}
              className="w-10 rounded-xl flex items-center justify-center"
              style={{ background: '#3B82F6', color: '#fff' }}
              aria-label="Send dispute message"
            >
              <Send size={14} />
            </button>
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
