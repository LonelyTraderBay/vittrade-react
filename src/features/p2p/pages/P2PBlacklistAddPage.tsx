import { useState } from 'react';
import { AlertTriangle, Ban, Clock, Info, MessageSquare, UserX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useP2PBlacklistCreateMutation } from '../model/p2p-blacklist-queries';
import type { P2PBlacklistReason } from '../model/p2p-types';

const reasons: Array<{
  id: P2PBlacklistReason;
  label: string;
  icon: typeof AlertTriangle;
  color: string;
}> = [
  { id: 'scam', label: 'Lừa đảo', icon: AlertTriangle, color: '#EF4444' },
  { id: 'unresponsive', label: 'Không phản hồi', icon: Clock, color: '#F59E0B' },
  { id: 'fake_payment', label: 'Thanh toán giả', icon: Ban, color: '#EF4444' },
  { id: 'harassment', label: 'Quấy rối', icon: MessageSquare, color: '#8B5CF6' },
  { id: 'other', label: 'Lý do khác', icon: Info, color: '#6B7280' },
];

export function P2PBlacklistAddPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const canManageBlacklist = hasPermission('p2p:write') || hasPermission('p2p:blacklist:write');
  const mutation = useP2PBlacklistCreateMutation();
  const [username, setUsername] = useState('');
  const [reason, setReason] = useState<P2PBlacklistReason>('scam');
  const [note, setNote] = useState('');

  const submit = async () => {
    if (!canManageBlacklist || !username.trim()) return;
    try {
      await mutation.mutateAsync({
        request: { username: username.trim(), reason, note: note.trim() || undefined },
        idempotencyKey: `p2p-blacklist-create-${crypto.randomUUID()}`,
      });
      navigate(`${prefix}/p2p/blacklist`, { replace: true });
    } catch {
      // React Query exposes the failure through mutation.isError below.
    }
  };

  return (
    <PageLayout>
      <Header title="Thêm vào blacklist" subtitle="An toàn · P2P" back />
      <PageContent gap="default">
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <UserX size={28} color="#EF4444" />
          </div>
          <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>Chặn người dùng</p>
          <p style={{ color: colors.text3, fontSize: 11, textAlign: 'center' }}>
            Người dùng bị chặn sẽ không thể giao dịch P2P với bạn.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span style={{ color: colors.text2, fontSize: 11, fontWeight: 600 }}>
            Tên người dùng *
          </span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={!canManageBlacklist}
            placeholder="Nhập username…"
            aria-label="P2P username"
            className="rounded-xl px-3 py-3 outline-none"
            style={{ background: colors.surface2, color: colors.text1, fontSize: 13 }}
          />
        </label>

        <div>
          <p style={{ color: colors.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            Lý do chặn *
          </p>
          <div className="flex flex-col gap-2">
            {reasons.map((item) => {
              const Icon = item.icon;
              const selected = reason === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReason(item.id)}
                  disabled={!canManageBlacklist}
                  aria-label={`Blacklist reason: ${item.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{
                    background: selected ? `${item.color}0C` : colors.surface2,
                    border: `1px solid ${selected ? `${item.color}66` : colors.borderSolid}`,
                  }}
                >
                  <Icon size={15} color={item.color} />
                  <span
                    style={{
                      color: selected ? item.color : colors.text2,
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span style={{ color: colors.text2, fontSize: 11, fontWeight: 600 }}>
            Ghi chú (tùy chọn)
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={!canManageBlacklist}
            rows={4}
            placeholder="Mô tả chi tiết lý do…"
            className="rounded-xl px-3 py-3 outline-none resize-none"
            style={{ background: colors.surface2, color: colors.text1, fontSize: 13 }}
          />
        </label>

        {mutation.isError && (
          <ErrorState
            title="Không thể chặn người dùng"
            actionLabel="Đóng thông báo"
            onAction={() => mutation.reset()}
          />
        )}
        <TrCard className="p-3">
          <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.6 }}>
            Người bị chặn sẽ không thể giao dịch, nhắn tin hoặc xem quảng cáo của bạn. Bạn có thể bỏ
            chặn bất kỳ lúc nào.
          </p>
        </TrCard>
        {!canManageBlacklist && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            P2P blacklist write permission is required to block a user.
          </p>
        )}
        <button
          type="button"
          disabled={!canManageBlacklist || !username.trim() || mutation.isPending}
          onClick={() => void submit()}
          aria-label="Block P2P user"
          className="w-full rounded-xl py-3 font-semibold"
          style={{
            background: '#EF4444',
            color: '#fff',
            opacity: !canManageBlacklist || !username.trim() || mutation.isPending ? 0.6 : 1,
          }}
        >
          {mutation.isPending ? 'Đang xử lý…' : 'Chặn người dùng'}
        </button>
      </PageContent>
    </PageLayout>
  );
}
