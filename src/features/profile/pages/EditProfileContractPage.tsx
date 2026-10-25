import { useRef, useState } from 'react';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
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
  const profile = query.data;
  const readUnavailable = query.isPending || query.isError || !profile;
  const inFlight = useRef(false);
  const fullName = form.fullName ?? profile?.fullName ?? '';
  const phone = form.phone ?? profile?.phone ?? '';
  return (
    <PageLayout>
      <Header title="Chỉnh sửa hồ sơ" back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Dữ liệu chỉnh sửa hồ sơ"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending && !profile && (
            <p role="progressbar" aria-label="Đang tải profile…" style={{ color: colors.text2 }}>
              Đang tải profile…
            </p>
          )}
          {!query.isPending && (query.isError || !profile) && (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          )}
          {profile && (
            <>
              {!canEditProfile && (
                <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
                  Profile edit permission is required to update account details.
                </p>
              )}
              <TrCard className="flex flex-col gap-4 p-4">
                <InputField
                  label="Họ và tên"
                  id="profile-full-name"
                  autoComplete="name"
                  error={!fullName.trim() ? 'Vui lòng nhập họ và tên.' : undefined}
                  value={fullName}
                  required
                  disabled={!canEditProfile || mutation.isPending || readUnavailable}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, fullName: event.target.value }));
                    setIdempotencyKey(crypto.randomUUID());
                  }}
                />
                <InputField
                  label="Số điện thoại"
                  id="profile-phone"
                  autoComplete="tel"
                  type="tel"
                  value={phone}
                  disabled={!canEditProfile || mutation.isPending || readUnavailable}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, phone: event.target.value }));
                    setIdempotencyKey(crypto.randomUUID());
                  }}
                />
                <InputField label="Email" id="profile-email" value={profile.email} readOnly />
              </TrCard>
              {mutation.isError && (
                <p role="alert" style={{ color: colors.errorText, fontSize: 12 }}>
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'Không thể lưu profile.'}
                </p>
              )}
              <CTAButton
                type="button"
                disabled={
                  !canEditProfile || !fullName.trim() || mutation.isPending || readUnavailable
                }
                loading={mutation.isPending}
                onClick={() => {
                  if (!canEditProfile || !fullName.trim() || readUnavailable || inFlight.current)
                    return;
                  inFlight.current = true;
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
                    })
                    .finally(() => {
                      inFlight.current = false;
                    });
                }}
              >
                {mutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </CTAButton>
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
