import { AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import {
  useCopyProviderProfileQuery,
  useCreateCopyRelationshipMutation,
} from '../model/trading-queries';
import type { CopyConfigurationRequest } from '../model/trading-types';
import { copyActivePath } from '../lib/copy-route';

type ConfirmationState = Partial<CopyConfigurationRequest>;
const CONSENTS = [
  'Tôi hiểu copy trading có rủi ro mất vốn.',
  'Tôi đã xem xét phí và cơ chế khớp lệnh.',
  'Tôi chấp nhận provider có thể thay đổi chiến lược.',
  'Tôi đồng ý để hệ thống thực hiện lệnh theo cấu hình này.',
] as const;

export function CopyConfirmationContractPage() {
  const { providerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const canWriteTrading = hasPermission('trading:write') || hasPermission('trade:write');
  const query = useCopyProviderProfileQuery(providerId);
  const mutation = useCreateCopyRelationshipMutation();
  const activationAttempt = useRef<{ signature: string; key: string } | null>(null);
  const state = (location.state ?? {}) as ConfirmationState;
  const [consents, setConsents] = useState<boolean[]>(() => CONSENTS.map(() => false));
  const config: CopyConfigurationRequest = {
    providerId: state.providerId ?? providerId ?? '',
    capital: state.capital ?? 5000,
    copyMode: state.copyMode ?? 'mirror',
    positionSizing: state.positionSizing ?? 'percentage',
    copyRatio: state.copyRatio ?? 50,
    customStopLoss: state.customStopLoss,
  };
  const canSubmit = canWriteTrading && consents.every(Boolean) && !mutation.isPending;
  const submitCopyRelationship = () => {
    if (!canWriteTrading || !consents.every(Boolean) || mutation.isPending) return;
    const signature = JSON.stringify(config);
    if (activationAttempt.current?.signature !== signature) {
      activationAttempt.current = { signature, key: `copy-${crypto.randomUUID()}` };
    }
    mutation.mutate(
      { request: config, idempotencyKey: activationAttempt.current.key },
      {
        onSuccess: () => {
          activationAttempt.current = null;
          navigate(copyActivePath(location.pathname, prefix));
        },
      },
    );
  };

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Xác nhận Copy" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải xác nhận…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }

  const provider = query.data.provider;
  return (
    <PageLayout>
      <Header title="Xác nhận Copy" subtitle={provider.name} back />
      <PageContent gap="default">
        <TrCard className="p-4" style={{ background: colors.warningBg }}>
          <div className="flex gap-2">
            <AlertTriangle size={16} color={colors.warningText} />
            <p style={{ color: colors.warningText, fontSize: 12, lineHeight: 1.5 }}>
              Hiệu suất quá khứ không đảm bảo lợi nhuận. Bạn có thể mất toàn bộ $
              {config.capital.toLocaleString('en-US')}.
            </p>
          </div>
        </TrCard>
        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Tóm tắt cấu hình</h3>
          <Summary label="Provider" value={provider.name} />
          <Summary label="Số vốn copy" value={`$${config.capital.toLocaleString('en-US')}`} />
          <Summary label="Chế độ copy" value={`${config.copyMode} · ${config.copyRatio}%`} />
          <Summary
            label="Stop-loss"
            value={config.customStopLoss ? `-${config.customStopLoss}%` : 'Theo provider'}
          />
        </TrCard>
        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Xác nhận bắt buộc</h3>
          <div className="mt-3 flex flex-col gap-3">
            {CONSENTS.map((label, index) => (
              <label
                key={label}
                className="flex items-start gap-3"
                style={{ color: colors.text2, fontSize: 12 }}
              >
                <input
                  type="checkbox"
                  checked={consents[index]}
                  onChange={(event) =>
                    setConsents((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? event.target.checked : value,
                      ),
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </TrCard>
        {mutation.isError && (
          <p style={{ color: '#EF4444', fontSize: 12 }}>
            Không thể kích hoạt copy. Vui lòng thử lại.
          </p>
        )}
        {!canWriteTrading && (
          <p role="status" style={{ color: colors.text3, fontSize: 12 }}>
            Cần quyền giao dịch để kích hoạt copy.
          </p>
        )}
        <button
          type="button"
          disabled={!canSubmit}
          className="w-full rounded-xl py-3"
          style={{
            background: canSubmit ? colors.primary : colors.surface2,
            color: canSubmit ? '#fff' : colors.text3,
            fontWeight: 700,
          }}
          onClick={submitCopyRelationship}
        >
          {mutation.isPending ? 'Đang kích hoạt…' : 'Xác nhận & Bắt đầu Copy'}
        </button>
      </PageContent>
    </PageLayout>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="mt-3 flex justify-between gap-3" style={{ fontSize: 12 }}>
      <span style={{ color: colors.text2 }}>{label}</span>
      <strong style={{ color: colors.text1 }}>{value}</strong>
    </div>
  );
}
