import { useRef, useState } from 'react';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { textRoleSize } from '@/shared/theme/typography';
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
  const canReadTickets = hasPermission('support:read');
  const canCreateTicket = hasPermission('support:write') || hasPermission('support:ticket:write');
  const query = useSupportTicketsQuery({ enabled: canReadTickets });
  const create = useCreateSupportTicketMutation();
  const inFlight = useRef(false);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  return (
    <PageLayout>
      <Header title="Hỗ trợ" subtitle="Support tickets" back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Dữ liệu hỗ trợ"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {!canReadTickets && (
            <p role="alert" style={{ color: colors.errorText, fontSize: 12 }}>
              Support read permission is required to view ticket history.
            </p>
          )}
          {canReadTickets && query.isPending && !query.data && (
            <p role="progressbar" aria-label="Đang tải ticket…" style={{ color: colors.text2 }}>
              Đang tải ticket…
            </p>
          )}
          {canReadTickets && !query.isPending && !query.data && (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          )}
          {canReadTickets && query.isError && query.data && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3"
              style={{ color: colors.errorText, fontSize: 12 }}
            >
              <p>Không thể cập nhật danh sách ticket; dữ liệu đang hiển thị có thể đã cũ.</p>
              <CTAButton
                variant="secondary"
                density="compact"
                fullWidth={false}
                loading={query.isFetching}
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-busy={query.isFetching}
              >
                Thử lại
              </CTAButton>
            </div>
          )}
          {!canCreateTicket && (
            <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
              Support write permission is required to create a ticket.
            </p>
          )}
          <TrCard className="flex flex-col gap-4 p-4">
            <h2 style={{ color: colors.text1, fontWeight: 700 }}>Tạo yêu cầu hỗ trợ</h2>
            <InputField
              label="Tiêu đề ticket"
              id="support-ticket-subject"
              required
              aria-label="Tiêu đề ticket"
              value={form.subject}
              disabled={!canCreateTicket || create.isPending}
              onChange={(event) => {
                setForm((current) => ({ ...current, subject: event.target.value }));
                setIdempotencyKey(crypto.randomUUID());
              }}
              placeholder="Tiêu đề"
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor="support-ticket-description"
                style={{ color: colors.text2, fontSize: textRoleSize('label') }}
              >
                Nội dung ticket
              </label>
              <textarea
                id="support-ticket-description"
                required
                style={{
                  background: colors.surface2,
                  color: colors.text1,
                  border: '1.5px solid ' + colors.borderSolid,
                  borderRadius: 'var(--input-radius)',
                  fontSize: 15,
                  outlineColor: colors.primary,
                }}
                aria-label="Nội dung ticket"
                value={form.description}
                disabled={!canCreateTicket || create.isPending}
                onChange={(event) => {
                  setForm((current) => ({ ...current, description: event.target.value }));
                  setIdempotencyKey(crypto.randomUUID());
                }}
                placeholder="Mô tả vấn đề"
                className="w-full min-w-0 resize-y p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                rows={3}
              />
            </div>
            <CTAButton
              loading={create.isPending}
              type="button"
              aria-busy={create.isPending}
              disabled={
                !canCreateTicket ||
                !form.subject.trim() ||
                !form.description.trim() ||
                create.isPending
              }
              onClick={() => {
                if (
                  !canCreateTicket ||
                  !form.subject.trim() ||
                  !form.description.trim() ||
                  inFlight.current
                )
                  return;
                inFlight.current = true;
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
                  })
                  .finally(() => {
                    inFlight.current = false;
                  });
              }}
            >
              {create.isPending ? 'Đang gửi…' : 'Gửi ticket'}
            </CTAButton>
          </TrCard>
          {canReadTickets && query.data && query.data.items.length === 0 ? (
            <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
              Bạn chưa có yêu cầu hỗ trợ nào.
            </p>
          ) : canReadTickets && query.data ? (
            query.data.items.map((ticket) => (
              <TrCard
                as="article"
                className="p-4"
                key={ticket.id}
                style={{ overflowWrap: 'anywhere' }}
              >
                <div className="flex flex-wrap justify-between gap-3">
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
          ) : null}
        </div>
      </PageContent>
    </PageLayout>
  );
}
