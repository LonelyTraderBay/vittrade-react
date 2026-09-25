import { AlertTriangle, CheckCircle, Eye, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TabBar } from '@/shared/ui/TabBar';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  useCopyProvidersQuery,
  type CopyProviderSort,
  type CopyTraderRisk,
} from '@/features/trading';

const riskOptions: Array<{ id: CopyTraderRisk | 'all'; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'low', label: 'Thấp' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'high', label: 'Cao' },
];

export function ProviderLeaderboardPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [sort, setSort] = useState<CopyProviderSort>('roi');
  const [risk, setRisk] = useState<CopyTraderRisk | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const query = useCopyProvidersQuery({
    sort,
    risk: risk === 'all' ? undefined : risk,
    verified: verifiedOnly || undefined,
  });

  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Leaderboard" subtitle="Copy Trading" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải provider…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError)
    return (
      <PageLayout>
        <Header title="Leaderboard" subtitle="Copy Trading" back />
        <ErrorState onAction={() => void query.refetch()} />
      </PageLayout>
    );

  return (
    <PageLayout>
      <Header title="Leaderboard" subtitle="Copy Trading" back />
      <PageContent gap="default">
        <TrCard
          className="p-3"
          style={
            {
              background: colors.warningBg,
              border: `1px solid ${colors.warningBorder}`,
            } as React.CSSProperties
          }
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color={colors.warningText} />
            <p style={{ color: colors.warningText, fontSize: 11, lineHeight: 1.5 }}>
              Xếp hạng chỉ phản ánh hiệu suất lịch sử. Hãy đọc risk disclosure trước khi copy.
            </p>
          </div>
        </TrCard>

        <TabBar
          variant="segment"
          tabs={[
            { id: 'roi', label: 'ROI' },
            { id: 'sharpe', label: 'Sharpe' },
            { id: 'followers', label: 'Followers' },
            { id: 'recent', label: '30D' },
          ]}
          active={sort}
          onChange={(id) => setSort(id as CopyProviderSort)}
        />
        <div className="flex flex-wrap gap-2">
          {riskOptions.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setRisk(item.id)}
              className="rounded-lg px-3 py-1.5"
              style={{
                background: risk === item.id ? colors.primary : colors.surface2,
                color: risk === item.id ? '#fff' : colors.text2,
                fontSize: 11,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVerifiedOnly((value) => !value)}
          className="flex items-center justify-between rounded-xl p-3"
          style={{ background: colors.surface2, border: `1px solid ${colors.borderSolid}` }}
        >
          <span className="flex items-center gap-2" style={{ color: colors.text1, fontSize: 12 }}>
            <CheckCircle size={14} color={verifiedOnly ? colors.primary : colors.text3} /> Chỉ hiện
            provider đã xác minh
          </span>
          <span style={{ color: verifiedOnly ? colors.primary : colors.text3, fontSize: 11 }}>
            {verifiedOnly ? 'Bật' : 'Tắt'}
          </span>
        </button>

        <p style={{ color: colors.text3, fontSize: 11 }}>
          {query.data.items.length} provider phù hợp
        </p>
        <div className="flex flex-col gap-3">
          {query.data.items.map((provider, index) => (
            <button
              type="button"
              key={provider.id}
              onClick={() => navigate(`${prefix}/trade/copy-provider/${provider.id}`)}
              className="w-full text-left"
            >
              <TrCard className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: index < 3 ? 'rgba(245,158,11,0.15)' : colors.surface2 }}
                  >
                    <span style={{ color: index < 3 ? '#F59E0B' : colors.text2, fontWeight: 700 }}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                        {provider.name}
                      </p>
                      {provider.verified && <CheckCircle size={12} color={colors.primary} />}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Metric
                        label="ROI"
                        value={`${provider.totalPnlPct >= 0 ? '+' : ''}${provider.totalPnlPct.toFixed(1)}%`}
                        color="#10B981"
                      />
                      <Metric
                        label="Sharpe"
                        value={provider.sharpeRatio.toFixed(2)}
                        color="#F59E0B"
                      />
                      <Metric
                        label="Max DD"
                        value={`${provider.maxDrawdown.toFixed(1)}%`}
                        color="#EF4444"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className="flex items-center gap-1"
                        style={{ color: colors.text3, fontSize: 10 }}
                      >
                        <Users size={10} /> {provider.copiers.toLocaleString('vi-VN')} copiers
                      </span>
                      <span
                        className="flex items-center gap-1"
                        style={{ color: colors.text3, fontSize: 10 }}
                      >
                        <Shield size={10} /> Rủi ro {provider.riskLevel}
                      </span>
                    </div>
                  </div>
                  <Eye size={16} color={colors.text3} />
                </div>
              </TrCard>
            </button>
          ))}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
      <p style={{ color, fontSize: 13, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
