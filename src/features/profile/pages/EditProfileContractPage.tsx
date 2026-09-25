import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useProfileQuery, useUpdateProfileMutation } from '../model/profile-queries';

export function EditProfileContractPage() {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const actionToast = useActionToast();
  const { hasPermission } = useAuth();
  const canEditProfile = hasPermission('profile:write') || hasPermission('profile:edit');
  const query = useProfileQuery();
  const mutation = useUpdateProfileMutation();
  const [form, setForm] = useState<{ fullName?: string; phone?: string }>({});
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Chỉnh sửa hồ sơ" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải profile…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const profile = query.data;
  const fullName = form.fullName ?? profile.fullName;
  const phone = form.phone ?? profile.phone;
  return (
    <PageLayout>
      <Header title="Chỉnh sửa hồ sơ" back />
      <PageContent gap="default">
        {!canEditProfile && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Profile edit permission is required to update account details.
          </p>
        )}
        <TrCard className="p-4">
          <label className="flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Họ và tên
            <input
              value={fullName}
              required
              disabled={!canEditProfile}
              onChange={(event) => {
                setForm((current) => ({ ...current, fullName: event.target.value }));
                setIdempotencyKey(crypto.randomUUID());
              }}
              className="rounded-lg p-2"
            />
          </label>
          <label className="mt-4 flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Số điện thoại
            <input
              type="tel"
              value={phone}
              disabled={!canEditProfile}
              onChange={(event) => {
                setForm((current) => ({ ...current, phone: event.target.value }));
                setIdempotencyKey(crypto.randomUUID());
              }}
              className="rounded-lg p-2"
            />
          </label>
          <label className="mt-4 flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Email
            <input value={profile.email} readOnly className="rounded-lg p-2 opacity-60" />
          </label>
        </TrCard>
        {mutation.isError && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
            {mutation.error instanceof Error ? mutation.error.message : 'Không thể lưu profile.'}
          </p>
        )}
        <button
          type="button"
          disabled={!canEditProfile || !fullName.trim() || mutation.isPending}
          className="w-full rounded-xl py-3"
          style={{
            background: fullName.trim() ? colors.primary : colors.surface2,
            color: fullName.trim() ? '#fff' : colors.text3,
            fontWeight: 700,
          }}
          onClick={() => {
            if (!canEditProfile) return;
            void mutation
              .mutateAsync({
                request: { fullName: fullName.trim(), phone: phone.trim() },
                idempotencyKey: `profile-${idempotencyKey}`,
              })
              .then(() => {
                actionToast.success('Đã cập nhật hồ sơ.');
                setIdempotencyKey(crypto.randomUUID());
                navigate(-1);
              })
              .catch((error: unknown) => {
                actionToast.error(
                  error instanceof Error ? error.message : 'Không thể lưu profile.',
                );
              });
          }}
        >
          {mutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </PageContent>
    </PageLayout>
  );
}
