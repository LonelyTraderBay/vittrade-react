import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Ban, Clock, Info, Plus, Shield, Trash2, UserX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { CTAButton } from '@/shared/ui/CTAButton';
import { SearchBar } from '@/shared/ui/SearchBar';
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
  scam: 'var(--tr-error-text)',
  unresponsive: 'var(--tr-warning-text)',
  fake_payment: 'var(--tr-error-text)',
  harassment: 'var(--tr-accent-text)',
  other: 'var(--tr-text-3)',
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
  const workspaceRef = useRef<HTMLDivElement>(null);
  const removalInFlight = useRef(false);
  const removalKeys = useRef(new Map<string, string>());
  const query = useP2PBlacklistQuery({
    search: search.trim() || undefined,
    reason: reason === 'all' ? undefined : reason,
  });
  const removeMutation = useP2PBlacklistRemoveMutation();
  const entries = query.data?.items ?? [];
  const reasonOptions = useMemo(() => Object.keys(reasonLabels) as P2PBlacklistReason[], []);
  const currentRowsReady = query.isSuccess && !query.isPlaceholderData;

  const remove = async () => {
    if (!canManageBlacklist || !removeTarget || !currentRowsReady || removalInFlight.current)
      return;
    removalInFlight.current = true;
    try {
      const key = removalKeys.current.get(removeTarget.id) ?? requestKey(removeTarget.id);
      removalKeys.current.set(removeTarget.id, key);
      await removeMutation.mutateAsync({
        entryId: removeTarget.id,
        idempotencyKey: key,
      });
      removalKeys.current.delete(removeTarget.id);
      setRemoveTarget(null);
    } catch {
      // React Query owns the error state; keep the dialog open for a retry.
    } finally {
      removalInFlight.current = false;
    }
  };

  const closeRemove = () => {
    if (!removalInFlight.current) setRemoveTarget(null);
  };

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
            disabled={
              !canManageBlacklist || query.isPending || query.isError || removeMutation.isPending
            }
            aria-label="Thêm người dùng vào danh sách chặn"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--tr-error-text)' }}
          >
            <Plus size={16} />
          </button>
        }
      />
      <PageContent gap="default">
        <div
          ref={workspaceRef}
          role="region"
          aria-label="Danh sách người dùng đã chặn"
          tabIndex={-1}
          className="flex flex-col gap-4"
        >
          <div className="flex gap-2">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm người dùng đã chặn…"
              ariaLabel="Tìm người dùng đã chặn"
              variant="compact"
              className="flex-1 min-w-0"
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

          {removeMutation.isSuccess && (
            <p role="status" style={{ color: colors.successText }}>
              Đã bỏ chặn người dùng.
            </p>
          )}
          {!canManageBlacklist && query.isSuccess && (
            <p role="alert" style={{ color: 'var(--tr-error-text)', fontSize: 12 }}>
              P2P blacklist write permission is required to manage blocked users.
            </p>
          )}
          {query.isFetching && query.data && (
            <p
              role="status"
              aria-label="Đang cập nhật danh sách chặn"
              style={{ color: colors.text2 }}
            >
              {query.isPlaceholderData
                ? 'Đang cập nhật danh sách. Kết quả trước chưa áp dụng bộ lọc mới.'
                : 'Đang cập nhật danh sách…'}
            </p>
          )}
          {query.isPending ? (
            <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
              Đang tải danh sách…
            </p>
          ) : query.isError ? (
            <div role="alert">
              <ErrorState
                title="Không thể tải danh sách chặn"
                actionLabel="Thử lại"
                onAction={() => void query.refetch()}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4" aria-busy={query.isFetching}>
              <TrCard className="p-4">
                <div className="flex items-center gap-3">
                  <UserX size={18} color="var(--tr-error-text)" />
                  <div>
                    <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                      {query.data?.total ?? entries.length} người dùng
                    </p>
                    <p style={{ color: colors.text3, fontSize: 11 }}>
                      Không thể giao dịch P2P với bạn
                    </p>
                  </div>
                </div>
              </TrCard>

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
                      canWrite={canManageBlacklist && currentRowsReady && !removeMutation.isPending}
                      onRemove={() => {
                        if (removalInFlight.current) return;
                        removeMutation.reset();
                        setRemoveTarget(entry);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PageContent>

      <BottomSheetV2
        open={Boolean(removeTarget)}
        onClose={closeRemove}
        variant="center"
        ariaLabel="Bỏ chặn người dùng?"
        showHandle={false}
        showCloseButton={false}
        preventClose={removeMutation.isPending}
        fallbackFocusRef={workspaceRef}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: colors.warnAlpha10 }}
        >
          <Trash2 size={24} color="var(--tr-warning-text)" aria-hidden="true" />
        </div>
        <h3
          className="text-center"
          style={{ color: colors.text1, fontSize: 17, fontWeight: 700, marginBottom: 8 }}
        >
          Bỏ chặn người dùng?
        </h3>
        <p
          className="text-center"
          style={{ color: colors.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}
        >
          Bạn sẽ cho phép {removeTarget?.username ?? 'người dùng'} giao dịch P2P trở lại.
        </p>
        {removeMutation.isError && (
          <p role="alert" className="mb-4" style={{ color: colors.errorText }}>
            Không thể bỏ chặn người dùng. Vui lòng thử lại hoặc đóng để kiểm tra danh sách.
          </p>
        )}
        {query.isError && (
          <p role="alert" className="mb-4" style={{ color: colors.errorText }}>
            Không thể cập nhật danh sách. Hãy đóng hộp thoại và thử lại danh sách trước khi bỏ chặn.
          </p>
        )}
        <div className="flex gap-3">
          <CTAButton
            variant="secondary"
            onClick={closeRemove}
            disabled={removeMutation.isPending}
            className="flex-1"
          >
            Huỷ
          </CTAButton>
          <CTAButton
            variant="warning"
            onClick={() => void remove()}
            loading={removeMutation.isPending}
            disabled={!canManageBlacklist || !currentRowsReady}
            className="flex-1"
          >
            {removeMutation.isPending ? 'Đang xử lý…' : 'Bỏ chặn'}
          </CTAButton>
        </div>
      </BottomSheetV2>
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
              <span style={{ color: 'var(--tr-success-text)', fontSize: 10 }}>Đã xác minh</span>
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
          style={{ color: 'var(--tr-warning-text)', background: 'rgba(245,158,11,0.1)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </TrCard>
  );
}
