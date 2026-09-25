import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useCopyProviderProfileQuery } from '../model/trading-queries';
import type { CopyMode, CopyPositionSizing } from '../model/trading-types';
import { copyProviderFlowPath } from '../lib/copy-route';

export function CopyConfigurationContractPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const query = useCopyProviderProfileQuery(providerId);
  const [capital, setCapital] = useState(5000);
  const [copyMode, setCopyMode] = useState<CopyMode>('mirror');
  const [positionSizing, setPositionSizing] = useState<CopyPositionSizing>('percentage');
  const [copyRatio, setCopyRatio] = useState(50);
  const [customStopLoss, setCustomStopLoss] = useState('');

  const validationError = capital <= 0 ? 'Vốn copy phải lớn hơn 0.' : undefined;
  const preview = useMemo(() => Math.round(capital * (copyRatio / 100)), [capital, copyRatio]);

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Cấu hình Copy" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải cấu hình…</p>
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
      <Header title="Cấu hình Copy" subtitle={provider.name} back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <label className="flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Số vốn copy (USD)
            <input
              type="number"
              min="1"
              value={capital}
              onChange={(event) => setCapital(Number(event.target.value))}
              className="rounded-lg p-2"
            />
          </label>
          <p style={{ color: colors.text2, fontSize: 12, marginTop: 8 }}>
            Ước tính lệnh của bạn: ${preview.toLocaleString('en-US')}
          </p>
        </TrCard>
        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Chế độ copy</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['mirror', 'fixed', 'smart'] as CopyMode[]).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setCopyMode(mode)}
                className="rounded-lg p-2"
                style={{
                  background: copyMode === mode ? colors.primary : colors.surface2,
                  color: copyMode === mode ? '#fff' : colors.text2,
                  fontSize: 11,
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          <label className="mt-4 flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Position sizing
            <select
              value={positionSizing}
              onChange={(event) => setPositionSizing(event.target.value as CopyPositionSizing)}
              className="rounded-lg p-2"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label className="mt-4 flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Tỷ lệ sao chép: {copyRatio}%
            <input
              type="range"
              min="1"
              max="100"
              value={copyRatio}
              onChange={(event) => setCopyRatio(Number(event.target.value))}
            />
          </label>
        </TrCard>
        <TrCard className="p-4">
          <label className="flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            Stop-loss riêng (%)
            <input
              type="number"
              min="1"
              max="100"
              value={customStopLoss}
              onChange={(event) => setCustomStopLoss(event.target.value)}
              className="rounded-lg p-2"
              placeholder="Theo provider"
            />
          </label>
        </TrCard>
        {validationError && <p style={{ color: '#EF4444', fontSize: 12 }}>{validationError}</p>}
        <button
          type="button"
          disabled={Boolean(validationError)}
          className="w-full rounded-xl py-3"
          style={{
            background: validationError ? colors.surface2 : colors.primary,
            color: validationError ? colors.text3 : '#fff',
            fontWeight: 700,
          }}
          onClick={() =>
            navigate(copyProviderFlowPath(location.pathname, prefix, provider.id, 'confirmation'), {
              state: {
                providerId: provider.id,
                capital,
                copyMode,
                positionSizing,
                copyRatio,
                customStopLoss: customStopLoss ? Number(customStopLoss) : undefined,
              },
            })
          }
        >
          Xem xác nhận
        </button>
      </PageContent>
    </PageLayout>
  );
}
