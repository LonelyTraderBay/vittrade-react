import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { RISK_LEVELS, SORT_OPTIONS } from '@/features/trading/constants/copyTrading';
import { useCopyProvidersQuery, type CopyProviderSort } from '@/features/trading';
import { copyProviderPath } from '../lib/copy-route';

const sortValues: CopyProviderSort[] = ['roi', 'sharpe', 'followers', 'aum'];

export function CopyTradingPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const [sortIndex, setSortIndex] = useState(0);
  const query = useCopyProvidersQuery({ sort: sortValues[sortIndex] });
  const providers = query.data?.items ?? [];
  const totalCopiers = providers.reduce((sum, provider) => sum + provider.copiers, 0);
  const totalAum = providers.reduce((sum, provider) => sum + provider.aum, 0);

  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Copy Trading" subtitle="Sao chép · Trade" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải provider…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError)
    return (
      <PageLayout>
        <Header title="Copy Trading" subtitle="Sao chép · Trade" back />
        <ErrorState onAction={() => void query.refetch()} />
      </PageLayout>
    );

  return (
    <PageLayout>
      <Header title="Copy Trading" subtitle="Sao chép · Trade" back />
      <PageContent gap="default">
        <TrCard variant="hero" className="p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Providers" value={String(providers.length)} />
            <Stat label="Copiers" value={totalCopiers.toLocaleString('vi-VN')} />
            <Stat label="AUM" value={`$${Math.round(totalAum / 1_000_000)}M`} />
          </div>
        </TrCard>
        <TrCard
          className="p-3"
          style={{ background: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}
        >
          <div className="flex gap-2">
            <AlertTriangle size={15} color={colors.warningText} />
            <p style={{ color: colors.warningText, fontSize: 11, lineHeight: 1.5 }}>
              Copy Trading có rủi ro cao. Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai; bạn
              có thể mất toàn bộ vốn đầu tư.
            </p>
          </div>
        </TrCard>
        <div className="flex gap-2 overflow-x-auto">
          {SORT_OPTIONS.map((label, index) => (
            <button
              type="button"
              key={label}
              onClick={() => setSortIndex(index)}
              className="shrink-0 rounded-full px-4 py-2"
              style={{
                background: sortIndex === index ? colors.primary : colors.surface2,
                color: sortIndex === index ? '#fff' : colors.text2,
                fontSize: 11,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {providers.map((provider) => {
            const risk = RISK_LEVELS[provider.riskLevel.toUpperCase() as keyof typeof RISK_LEVELS];
            return (
              <TrCard key={provider.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: colors.primary + '22' }}
                  >
                    <span style={{ color: colors.primary, fontSize: 16, fontWeight: 700 }}>
                      {provider.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                        {provider.name}
                      </p>
                      {provider.verified && <CheckCircle size={12} color={colors.primary} />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md px-2 py-0.5"
                          style={{ background: colors.surface2, color: colors.text2, fontSize: 9 }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className="rounded-md px-2 py-0.5"
                        style={{ background: `${risk.color}15`, color: risk.color, fontSize: 9 }}
                      >
                        Rủi ro: {risk.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                      +{provider.totalPnlPct.toFixed(1)}%
                    </p>
                    <p style={{ color: '#EF4444', fontSize: 11 }}>
                      DD {provider.maxDrawdown.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    ['Win rate', `${provider.winRate}%`],
                    ['PnL', `$${Math.round(provider.totalPnl).toLocaleString('en-US')}`],
                    ['Copiers', provider.copiers.toLocaleString('vi-VN')],
                    ['Sharpe', provider.sharpeRatio.toFixed(2)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
                      <p style={{ color: colors.text1, fontSize: 12, fontWeight: 700 }}>{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(copyProviderPath(location.pathname, prefix, provider.id))}
                  className="w-full mt-3 rounded-xl py-2.5 flex items-center justify-center gap-2"
                  style={{
                    background: colors.surface2,
                    color: colors.text1,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Xem chi tiết <ChevronRight size={14} />
                </button>
              </TrCard>
            );
          })}
        </div>
        <p style={{ color: colors.text3, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
          Hiệu suất quá khứ không đảm bảo kết quả tương lai. Tất cả chỉ số mang tính tham khảo và
          cần được đánh giá cùng risk disclosure.
        </p>
      </PageContent>
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
      <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{value}</p>
    </div>
  );
}
