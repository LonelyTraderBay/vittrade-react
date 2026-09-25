import { AlertTriangle, BarChart3, Clock3, Copy, Shield, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TabBar } from '@/shared/ui/TabBar';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useCopyProviderProfileQuery, type CopyProviderTrade } from '@/features/trading';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function TraderProfilePage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { traderId } = useParams<{ traderId: string }>();
  const query = useCopyProviderProfileQuery(traderId);
  const [tab, setTab] = useState<'overview' | 'trades' | 'stats'>('overview');
  const profile = query.data;

  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Trader Profile" subtitle="Hồ sơ · Trade" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải hồ sơ…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !profile)
    return (
      <PageLayout>
        <Header title="Trader Profile" subtitle="Hồ sơ · Trade" back />
        <ErrorState onAction={() => void query.refetch()} />
      </PageLayout>
    );

  const { provider, pnlHistory, recentTrades } = profile;
  const maxPnl = Math.max(...pnlHistory.map((item) => Math.abs(item.pnl)), 1);
  return (
    <PageLayout>
      <Header title="Trader Profile" subtitle="Hồ sơ · Trade" back />
      <PageContent gap="default">
        <TrCard variant="hero" className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: colors.primary + '22' }}
            >
              <span style={{ color: colors.primary, fontSize: 22, fontWeight: 700 }}>
                {provider.avatar}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p style={{ color: colors.text1, fontSize: 17, fontWeight: 700 }}>
                  {provider.name}
                </p>
                {provider.verified && <Shield size={14} color={colors.primary} />}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {provider.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-2 py-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: colors.text2,
                      fontSize: 10,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: 'ROI', value: `${provider.totalPnlPct.toFixed(1)}%`, color: '#10B981' },
              { label: 'Win rate', value: `${provider.winRate}%`, color: '#10B981' },
              { label: 'Sharpe', value: provider.sharpeRatio.toFixed(2), color: '#F59E0B' },
              { label: 'Max DD', value: `${provider.maxDrawdown}%`, color: '#EF4444' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-2"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <p style={{ color: colors.text3, fontSize: 9 }}>{item.label}</p>
                <p style={{ color: item.color, fontSize: 13, fontWeight: 700 }}>{item.value}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/trade/copy-provider/${provider.id}/configuration`)}
            className="w-full rounded-xl py-3 mt-4 flex items-center justify-center gap-2"
            style={{ background: colors.primary, color: '#fff', fontSize: 13, fontWeight: 700 }}
          >
            <Copy size={15} /> Xem cấu hình copy
          </button>
        </TrCard>

        <TabBar
          variant="segment"
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'trades', label: 'Giao dịch' },
            { id: 'stats', label: 'Thống kê' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
        {tab === 'overview' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                  PnL 7 ngày
                </span>
                <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                  {usd.format(provider.totalPnl)}
                </span>
              </div>
              <div className="flex items-end gap-1 h-28">
                {pnlHistory.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      title={`${item.day}: ${item.pnl}`}
                      style={{
                        height: `${Math.max((Math.abs(item.pnl) / maxPnl) * 80, 4)}%`,
                        background: item.pnl >= 0 ? '#10B981' : '#EF4444',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                ))}
              </div>
            </TrCard>
            <TrCard className="p-4">
              <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Thông tin vận hành
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Detail
                  icon={BarChart3}
                  label="Tổng lệnh"
                  value={provider.totalTrades.toLocaleString('vi-VN')}
                />
                <Detail icon={Clock3} label="Thời gian giữ TB" value={provider.avgHoldingTime} />
                <Detail
                  icon={Users}
                  label="Copiers"
                  value={`${provider.copiers.toLocaleString('vi-VN')} / ${provider.maxCopiers.toLocaleString('vi-VN')}`}
                />
                <Detail icon={Shield} label="AUM" value={usd.format(provider.aum)} />
              </div>
            </TrCard>
          </>
        )}
        {tab === 'trades' && (
          <div className="flex flex-col gap-2">
            {recentTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} colors={colors} />
            ))}
          </div>
        )}
        {tab === 'stats' && (
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} color={colors.primary} />
              <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                Phân tích rủi ro
              </h2>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden flex"
              style={{ background: colors.surface2 }}
            >
              <div style={{ width: `${provider.winRate}%`, background: '#10B981' }} />
              <div style={{ width: `${100 - provider.winRate}%`, background: '#EF4444' }} />
            </div>
            <div
              className="flex justify-between mt-2"
              style={{ color: colors.text3, fontSize: 10 }}
            >
              <span>Thắng: {provider.winRate}%</span>
              <span>Thua: {(100 - provider.winRate).toFixed(1)}%</span>
            </div>
            <div className="flex items-start gap-2 mt-4">
              <AlertTriangle size={13} color="#F59E0B" />
              <p style={{ color: colors.text3, fontSize: 10, lineHeight: 1.5 }}>
                Hiệu suất quá khứ không đảm bảo kết quả tương lai. Kiểm tra drawdown và risk
                disclosure trước khi copy.
              </p>
            </div>
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color={colors.text3} />
      <div>
        <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
        <p style={{ color: colors.text1, fontSize: 12, fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}
function TradeCard({
  trade,
  colors,
}: {
  trade: CopyProviderTrade;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const positive = trade.pnl >= 0;
  return (
    <TrCard className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>{trade.pair}</span>
          <span
            style={{
              color: trade.side === 'long' ? '#10B981' : '#EF4444',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {trade.side.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 700 }}>
            {positive ? '+' : ''}
            {usd.format(trade.pnl)}
          </p>
          <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 10 }}>
            {trade.pnlPct.toFixed(2)}%
          </p>
        </div>
      </div>
      <p style={{ color: colors.text3, fontSize: 10, marginTop: 6 }}>
        Entry {trade.entry.toLocaleString()}{' '}
        {trade.exit ? `· Exit ${trade.exit.toLocaleString()}` : '· Đang mở'} · {trade.time}
      </p>
    </TrCard>
  );
}
