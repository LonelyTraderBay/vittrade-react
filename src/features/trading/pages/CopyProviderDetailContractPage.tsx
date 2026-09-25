import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
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

export function CopyProviderDetailContractPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const query = useCopyProviderProfileQuery(providerId);

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Provider" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu provider…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageLayout>
        <Header title="Provider" back />
        <ErrorState onAction={() => void query.refetch()} />
      </PageLayout>
    );
  }

  const { provider, pnlHistory, recentTrades } = query.data;
  return (
    <PageLayout>
      <Header title={provider.name} back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: `${colors.primary}22`, color: colors.primary }}
            >
              <span className="text-lg font-bold">{provider.avatar}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>
                  {provider.name}
                </h2>
                {provider.verified && <CheckCircle size={14} color={colors.primary} />}
              </div>
              <p style={{ color: colors.text2, fontSize: 12 }}>
                Rủi ro {provider.riskLevel} · {provider.avgHoldingTime}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <Metric label="ROI" value={`${provider.totalPnlPct.toFixed(1)}%`} />
            <Metric label="Max DD" value={`${provider.maxDrawdown.toFixed(1)}%`} />
            <Metric label="Sharpe" value={provider.sharpeRatio.toFixed(2)} />
            <Metric label="Win rate" value={`${provider.winRate}%`} />
          </div>
        </TrCard>

        <TrCard className="p-3" style={{ background: colors.warningBg }}>
          <div className="flex gap-2">
            <AlertTriangle size={16} color={colors.warningText} />
            <p style={{ color: colors.warningText, fontSize: 11, lineHeight: 1.5 }}>
              Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai. Bạn có thể mất toàn bộ vốn.
            </p>
          </div>
        </TrCard>

        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Dữ liệu từ API contract</h3>
          <p style={{ color: colors.text2, fontSize: 12, marginTop: 6 }}>
            {pnlHistory.length} điểm hiệu suất · {recentTrades.length} giao dịch gần đây ·{' '}
            {provider.tags.join(', ')}
          </p>
        </TrCard>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3"
          style={{ background: colors.primary, color: '#fff', fontWeight: 700 }}
          onClick={() =>
            navigate(copyProviderFlowPath(location.pathname, prefix, provider.id, 'assessment'))
          }
        >
          Đánh giá trước khi copy <ChevronRight size={16} />
        </button>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
