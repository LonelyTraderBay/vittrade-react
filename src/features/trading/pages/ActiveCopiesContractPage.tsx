import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useCopyRelationshipsQuery,
  useStopCopyRelationshipMutation,
} from '../model/trading-queries';
import { copyProviderPath } from '../lib/copy-route';

export function ActiveCopiesContractPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canWriteTrading = hasPermission('trading:write') || hasPermission('trade:write');
  const query = useCopyRelationshipsQuery();
  const stopMutation = useStopCopyRelationshipMutation();
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const stopAttempts = useRef(new Map<string, { signature: string; key: string }>());

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Copy đang chạy" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải quan hệ copy…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }
  const stopRelationship = (copyId: string, reason: string) => {
    if (!canWriteTrading || !reason.trim() || stopMutation.isPending) return;
    const request = { reason: reason.trim(), closeOpenPositions: true };
    const signature = JSON.stringify(request);
    let attempt = stopAttempts.current.get(copyId);
    if (attempt?.signature !== signature) {
      attempt = { signature, key: `stop-${copyId}-${crypto.randomUUID()}` };
      stopAttempts.current.set(copyId, attempt);
    }
    stopMutation.mutate(
      {
        copyId,
        request,
        idempotencyKey: attempt.key,
      },
      { onSuccess: () => stopAttempts.current.delete(copyId) },
    );
  };
  const relationships = query.data.items.filter((item) => item.status !== 'stopped');
  return (
    <PageLayout>
      <Header title="Copy đang chạy" subtitle={`${relationships.length} relationship`} back />
      <PageContent gap="default">
        {relationships.length === 0 && (
          <TrCard className="p-4">
            <p style={{ color: colors.text2 }}>Chưa có copy relationship nào.</p>
          </TrCard>
        )}
        {relationships.map((relationship) => {
          const reason = reasonById[relationship.id] ?? '';
          return (
            <TrCard key={relationship.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 style={{ color: colors.text1, fontWeight: 700 }}>
                    {relationship.provider.name}
                  </h2>
                  <p style={{ color: colors.text2, fontSize: 12 }}>
                    {relationship.copyMode} · {relationship.positionSizing} · {relationship.status}
                  </p>
                </div>
                <strong style={{ color: relationship.pnl >= 0 ? '#10B981' : '#EF4444' }}>
                  {relationship.pnlPct.toFixed(2)}%
                </strong>
              </div>
              <div
                className="mt-3 grid grid-cols-3 gap-2"
                style={{ color: colors.text2, fontSize: 11 }}
              >
                <span>Vốn ${relationship.capital.toLocaleString('en-US')}</span>
                <span>Giá trị ${relationship.currentValue.toLocaleString('en-US')}</span>
                <span>{relationship.trades} trades</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg px-3 py-2"
                  style={{ background: colors.surface2, color: colors.text1, fontSize: 12 }}
                  onClick={() =>
                    navigate(copyProviderPath(location.pathname, prefix, relationship.provider.id))
                  }
                >
                  Chi tiết
                </button>
                <input
                  aria-label={`Lý do dừng ${relationship.provider.name}`}
                  value={reason}
                  onChange={(event) =>
                    setReasonById((current) => ({
                      ...current,
                      [relationship.id]: event.target.value,
                    }))
                  }
                  placeholder="Lý do dừng"
                  className="min-w-0 flex-1 rounded-lg px-2"
                />
                <button
                  type="button"
                  disabled={!canWriteTrading || !reason.trim() || stopMutation.isPending}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: canWriteTrading && reason.trim() ? '#EF4444' : colors.surface2,
                    color: canWriteTrading && reason.trim() ? '#fff' : colors.text3,
                    fontSize: 12,
                  }}
                  onClick={() => stopRelationship(relationship.id, reason)}
                >
                  Dừng
                </button>
              </div>
              {!canWriteTrading && (
                <p role="status" className="mt-2 text-xs" style={{ color: colors.text3 }}>
                  Cần quyền giao dịch để dừng relationship.
                </p>
              )}
            </TrCard>
          );
        })}
      </PageContent>
    </PageLayout>
  );
}
