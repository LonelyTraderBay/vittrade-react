import { useMemo, useState } from 'react';
import { AlertTriangle, Ban, Clock, Info, Plus, Shield, Trash2, UserX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useP2PBlacklistQuery,
  useP2PBlacklistRemoveMutation,
} from '../model/p2p-blacklist-queries';
import type { P2PBlacklistEntry, P2PBlacklistReason } from '../model/p2p-types';

const reasonLabels: Record<P2PBlacklistReason, string> = {
  scam: 'Lừa đảo',
  unresponsive: 'Không phản hồi',
  fake_payment: 'Thanh toán giả',
  harassment: 'Quấy rối',
  other: 'Lý do khác',
};

const reasonColors: Record<P2PBlacklistReason, string> = {
  scam: '#EF4444',
  unresponsive: '#F59E0B',
  fake_payment: '#EF4444',
  harassment: '#8B5CF6',
  other: '#6B7280',
};

const reasonIcons: Record<P2PBlacklistReason, typeof AlertTriangle> = {
  scam: AlertTriangle,
  unresponsive: Clock,
  fake_payment: Ban,
  harassment: Info,
  other: Info,
};

const requestKey = (entryId: string) => `p2p-blacklist-remove-${entryId}-${crypto.randomUUID()}`;

export function P2PBlacklistPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission } = useAuth();
  const canManageBlacklist = hasPermission('p2p:write') || hasPermission('p2p:blacklist:write');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState<P2PBlacklistReason | 'all'>('all');
  const [removeTarget, setRemoveTarget] = useState<P2PBlacklistEntry | null>(null);
  const query = useP2PBlacklistQuery({
    search: search.trim() || undefined,
    reason: reason === 'all' ? undefined : reason,
  });
  const removeMutation = useP2PBlacklistRemoveMutation();
  const entries = query.data?.items ?? [];
  const reasonOptions = useMemo(() => Object.keys(reasonLabels) as P2PBlacklistReason[], []);

  const remove = async () => {
    if (!canManageBlacklist || !removeTarget) return;
    try {
      await removeMutation.mutateAsync({
        entryId: removeTarget.id,
        idempotencyKey: requestKey(removeTarget.id),
      });
      setRemoveTarget(null);
    } catch {
      // React Query owns the error state; keep the dialog open for a retry.
    }
  };

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Danh sách chặn" subtitle="An toàn · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải danh sách…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError) {
    return (
      <PageLayout>
        <Header title="Danh sách chặn" subtitle="An toàn · P2P" back />
        <ErrorState
          title="Không thể tải danh sách chặn"
          actionLabel="Thử lại"
          onAction={() => void query.refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Danh sách chặn"
        subtitle="An toàn · P2P"
        back
        right={
          <button
            type="button"
            onClick={() => navigate(`${prefix}/p2p/blacklist/add`)}
            disabled={!canManageBlacklist}
            aria-label="Thêm người dùng vào danh sách chặn"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
          >
            <Plus size={16} />
          </button>
        }
      />
      <PageContent gap="default">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm người dùng đã chặn…"
            aria-label="Tìm người dùng đã chặn"
            className="flex-1 rounded-xl px-3 py-2.5 outline-none"
            style={{ background: colors.surface2, color: colors.text1, fontSize: 12 }}
          />
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value as P2PBlacklistReason | 'all')}
            aria-label="Lọc lý do chặn"
            className="rounded-xl px-2"
            style={{ background: colors.chipBg, color: colors.chipText, fontSize: 11 }}
          >
            <option value="all">Tất cả</option>
            {reasonOptions.map((item) => (
              <option key={item} value={item}>
                {reasonLabels[item]}
              </option>
            ))}
          </select>
        </div>

        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <UserX size={18} color="#EF4444" />
            <div>
              <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                {query.data?.total ?? entries.length} người dùng
              </p>
              <p style={{ color: colors.text3, fontSize: 11 }}>Không thể giao dịch P2P với bạn</p>
            </div>
          </div>
        </TrCard>

        {!canManageBlacklist && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            P2P blacklist write permission is required to manage blocked users.
          </p>
        )}

        {entries.length === 0 ? (
          <TrCard className="p-10 text-center">
            <Shield size={36} color={colors.borderSolid} className="mx-auto mb-3" />
            <p
              role="status"
              aria-label="No P2P blacklist entries"
              style={{ color: colors.text2, fontSize: 13 }}
            >
              Không có kết quả
            </p>
          </TrCard>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <BlacklistCard
                key={entry.id}
                entry={entry}
                colors={colors}
                canWrite={canManageBlacklist}
                onRemove={() => setRemoveTarget(entry)}
              />
            ))}
          </div>
        )}
      </PageContent>

      <ConfirmationDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void remove()}
        variant="warning"
        icon={<Trash2 size={24} color="#F59E0B" />}
        title="Bỏ chặn người dùng?"
        description={`Bạn sẽ cho phép ${removeTarget?.username ?? 'người dùng'} giao dịch P2P trở lại.`}
        confirmText={removeMutation.isPending ? 'Đang xử lý…' : 'Bỏ chặn'}
      />
    </PageLayout>
  );
}

function BlacklistCard({
  entry,
  colors,
  canWrite,
  onRemove,
}: {
  entry: P2PBlacklistEntry;
  colors: ReturnType<typeof useThemeColors>;
  canWrite: boolean;
  onRemove: () => void;
}) {
  const Icon = reasonIcons[entry.reason];
  const color = reasonColors[entry.reason];
  return (
    <TrCard rounded="sm" className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={16} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>{entry.username}</p>
            {entry.isVerified && (
              <span style={{ color: '#10B981', fontSize: 10 }}>Đã xác minh</span>
            )}
          </div>
          <p style={{ color, fontSize: 11, marginTop: 2 }}>{reasonLabels[entry.reason]}</p>
          {entry.reasonText && (
            <p style={{ color: colors.text3, fontSize: 11, marginTop: 6 }}>{entry.reasonText}</p>
          )}
          <p style={{ color: colors.text3, fontSize: 10, marginTop: 6 }}>
            {entry.tradesBefore} giao dịch · {entry.completionRate}% hoàn tất
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canWrite}
          aria-label={`Remove ${entry.username} from P2P blacklist`}
          className="p-2 rounded-lg"
          style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </TrCard>
  );
}
