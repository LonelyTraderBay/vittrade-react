import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useCopyProviderProfileQuery } from '../model/trading-queries';
import { copyProviderFlowPath } from '../lib/copy-route';

const CHECKS = [
  'Tôi hiểu có thể mất toàn bộ vốn đã cam kết.',
  'Tôi đã xem xét Max Drawdown và khẩu vị rủi ro của mình.',
  'Tôi có thể theo dõi và dừng copy khi điều kiện thay đổi.',
] as const;

export function PreCopyAssessmentContractPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const query = useCopyProviderProfileQuery(providerId);
  const [checked, setChecked] = useState<boolean[]>(() => CHECKS.map(() => false));

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Đánh giá rủi ro" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải assessment…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }

  const provider = query.data.provider;
  const allChecked = checked.every(Boolean);
  return (
    <PageLayout>
      <Header title="Đánh giá rủi ro" subtitle="Bắt buộc trước khi copy" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Bạn đang xem xét copy</h2>
          <p style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>{provider.name}</p>
          <p style={{ color: colors.text2, fontSize: 12, marginTop: 10 }}>
            ROI {provider.totalPnlPct.toFixed(1)}% · Max DD {provider.maxDrawdown.toFixed(1)}% · Rủi
            ro {provider.riskLevel}
          </p>
        </TrCard>
        <TrCard className="p-4" style={{ background: colors.warningBg }}>
          <div className="flex gap-2">
            <AlertTriangle size={16} color={colors.warningText} />
            <p style={{ color: colors.warningText, fontSize: 12, lineHeight: 1.5 }}>
              Đây là xác nhận hiểu rủi ro, không phải cam kết lợi nhuận hay khuyến nghị đầu tư.
            </p>
          </div>
        </TrCard>
        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Xác nhận hiểu rủi ro</h3>
          <div className="mt-3 flex flex-col gap-3">
            {CHECKS.map((label, index) => (
              <label
                key={label}
                className="flex items-start gap-3"
                style={{ color: colors.text2, fontSize: 12 }}
              >
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={(event) =>
                    setChecked((current) =>
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
        <button
          type="button"
          disabled={!allChecked}
          className="w-full rounded-xl py-3"
          style={{
            background: allChecked ? colors.primary : colors.surface2,
            color: allChecked ? '#fff' : colors.text3,
            fontWeight: 700,
          }}
          onClick={() =>
            navigate(copyProviderFlowPath(location.pathname, prefix, provider.id, 'configuration'))
          }
        >
          Tiếp tục cấu hình
        </button>
      </PageContent>
    </PageLayout>
  );
}
