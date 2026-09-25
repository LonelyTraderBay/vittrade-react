import { useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useAuth } from '@/shared/session/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useCreateSupportTicketMutation, useSupportTicketsQuery } from '../model/support-queries';

export function SupportContractPage() {
  const colors = useThemeColors();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const canCreateTicket = hasPermission('support:write') || hasPermission('support:ticket:write');
  const query = useSupportTicketsQuery();
  const create = useCreateSupportTicketMutation();
  const [form, setForm] = useState({ subject: '', description: '' });
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Hỗ trợ" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải ticket…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Hỗ trợ" subtitle="Support tickets" back />
      <PageContent gap="default">
        {!canCreateTicket && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Support write permission is required to create a ticket.
          </p>
        )}
        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Tạo yêu cầu hỗ trợ</h2>
          <input
            aria-label="Tiêu đề ticket"
            value={form.subject}
            disabled={!canCreateTicket}
            onChange={(event) => {
              setForm((current) => ({ ...current, subject: event.target.value }));
              setIdempotencyKey(crypto.randomUUID());
            }}
            placeholder="Tiêu đề"
            className="mt-3 w-full rounded-lg p-2"
          />
          <textarea
            aria-label="Nội dung ticket"
            value={form.description}
            disabled={!canCreateTicket}
            onChange={(event) => {
              setForm((current) => ({ ...current, description: event.target.value }));
              setIdempotencyKey(crypto.randomUUID());
            }}
            placeholder="Mô tả vấn đề"
            className="mt-2 w-full rounded-lg p-2"
            rows={3}
          />
          <button
            type="button"
            disabled={
              !canCreateTicket ||
              !form.subject.trim() ||
              !form.description.trim() ||
              create.isPending
            }
            className="mt-3 rounded-lg px-4 py-2"
            style={{
              background:
                form.subject.trim() && form.description.trim() ? colors.primary : colors.surface2,
              color: form.subject.trim() && form.description.trim() ? '#fff' : colors.text3,
            }}
            onClick={() => {
              if (!canCreateTicket) return;
              void create
                .mutateAsync({
                  request: {
                    subject: form.subject.trim(),
                    description: form.description.trim(),
                    category: 'other',
                  },
                  idempotencyKey: `support-ticket-${idempotencyKey}`,
                })
                .then(() => {
                  setForm({ subject: '', description: '' });
                  setIdempotencyKey(crypto.randomUUID());
                  actionToast.success('Đã gửi yêu cầu hỗ trợ.');
                })
                .catch((error: unknown) => {
                  actionToast.error(
                    error instanceof Error ? error.message : 'Không thể gửi yêu cầu hỗ trợ.',
                  );
                });
            }}
          >
            Gửi ticket
          </button>
        </TrCard>
        {query.data.items.length === 0 ? (
          <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
            Bạn chưa có yêu cầu hỗ trợ nào.
          </p>
        ) : (
          query.data.items.map((ticket) => (
            <TrCard className="p-4" key={ticket.id}>
              <div className="flex justify-between">
                <h2 style={{ color: colors.text1, fontWeight: 700 }}>{ticket.subject}</h2>
                <span style={{ color: colors.text2, fontSize: 11 }}>{ticket.status}</span>
              </div>
              <p style={{ color: colors.text2, fontSize: 12, marginTop: 5 }}>
                {ticket.description}
              </p>
              <p style={{ color: colors.text3, fontSize: 11, marginTop: 8 }}>
                Cập nhật {ticket.updatedAt}
              </p>
            </TrCard>
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}
