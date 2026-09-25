import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtVnd } from '@/shared/lib/formatNumber';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2PDashboardQuery } from '../model/p2p-overview-queries';

export function P2PDashboardPage() {
  const colors = useThemeColors();
  const dashboardQuery = useP2PDashboardQuery();
  const dashboard = dashboardQuery.data;

  if (dashboardQuery.isPending) {
    return (
      <PageLayout>
        <Header title="P2P Dashboard" subtitle="Tổng quan · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu dashboard…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (dashboardQuery.isError || !dashboard) {
    return (
      <PageLayout>
        <Header title="P2P Dashboard" subtitle="Tổng quan · P2P" back />
        <ErrorState
          title="Không thể tải dữ liệu P2P dashboard"
          actionLabel="Thử lại"
          onAction={() => void dashboardQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const { stats } = dashboard;
  const maxVolume = Math.max(...dashboard.volumeByWeek.map((item) => item.volume), 1);

  return (
    <PageLayout>
      <Header title="P2P Dashboard" subtitle="Tổng quan · P2P" back />
      <PageContent gap="default">
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.2)">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} color="#3B82F6" />
            <span style={{ color: colors.text2, fontSize: 13, fontWeight: 600 }}>
              Tổng Volume (30 ngày)
            </span>
            <span className="ml-auto" style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
              +12.5%
            </span>
          </div>
          <p
            style={{ color: colors.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}
          >
            {fmtCompact(stats.totalVolume30d, { prefix: '₫' })}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span style={{ color: colors.text3, fontSize: 10 }}>
              Mua: {fmtCompact(stats.buyVolume30d, { prefix: '₫' })}
            </span>
            <span style={{ color: colors.text3, fontSize: 10 }}>
              Bán: {fmtCompact(stats.sellVolume30d, { prefix: '₫' })}
            </span>
          </div>
        </TrCard>

        <div className="grid grid-cols-2 gap-2.5">
          <Metric
            icon={<CheckCircle size={15} color="#10B981" />}
            label="Đơn hoàn thành"
            value={String(stats.completedOrders)}
            sub={`/ ${stats.totalOrders} tổng`}
            color="#10B981"
            colors={colors}
          />
          <Metric
            icon={<TrendingUp size={15} color="#3B82F6" />}
            label="Tỷ lệ hoàn thành"
            value={`${fmtPct(stats.completionRate, 1)}%`}
            sub={`Platform ${fmtPct(stats.platformAvgCompletionRate, 1)}%`}
            color="#3B82F6"
            colors={colors}
          />
          <Metric
            icon={<DollarSign size={15} color="#F59E0B" />}
            label="Lợi nhuận spread"
            value={fmtCompact(stats.spreadRevenue30d, { prefix: '₫' })}
            sub="30 ngày"
            color="#F59E0B"
            colors={colors}
          />
          <Metric
            icon={<Clock size={15} color="#8B5CF6" />}
            label="Thời gian trung bình"
            value={stats.avgCompletionTime}
            sub={`Phản hồi ${stats.responseTimeAvg}`}
            color="#8B5CF6"
            colors={colors}
          />
        </div>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} color={colors.text2} />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Volume theo tuần
            </span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {dashboard.volumeByWeek.map((item) => (
              <div className="flex-1 flex flex-col items-center gap-1" key={item.week}>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${Math.max((item.volume / maxVolume) * 100, 4)}%`,
                    background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)',
                  }}
                  title={`${item.week}: ${fmtVnd(item.volume)} đ`}
                />
                <span style={{ color: colors.text3, fontSize: 9 }}>{item.week}</span>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={14} color={colors.text2} />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Phân bổ tài sản
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {dashboard.assetDistribution.map((item) => (
              <div key={item.asset}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: colors.text2, fontSize: 11 }}>{item.asset}</span>
                  <span style={{ color: colors.text3, fontSize: 10 }}>
                    {item.percentage}% · {fmtCompact(item.volume, { prefix: '₫' })}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: colors.surface2 }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, background: assetColor(item.asset) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Merchant nổi bật
            </span>
            <span style={{ color: colors.text3, fontSize: 10 }}>Theo volume</span>
          </div>
          <div className="flex flex-col gap-2">
            {dashboard.topMerchants.slice(0, 5).map((merchant) => (
              <div className="flex items-center gap-2" key={merchant.id}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: '#3B82F6',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {merchant.name.slice(0, 1)}
                </div>
                <span className="flex-1" style={{ color: colors.text2, fontSize: 11 }}>
                  {merchant.name}
                </span>
                <span style={{ color: colors.text3, fontSize: 10 }}>
                  {merchant.trades} giao dịch · {fmtCompact(merchant.volume, { prefix: '₫' })}
                </span>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  color,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TrCard className="p-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ background: `${color}15` }}
      >
        {icon}
      </div>
      <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
        {value}
      </p>
      <p style={{ color: colors.text3, fontSize: 9, marginTop: 2 }}>{label}</p>
      <p style={{ color: colors.text3, fontSize: 9 }}>{sub}</p>
    </TrCard>
  );
}

function assetColor(asset: string) {
  return (
    { USDT: '#26A17B', BTC: '#F7931A', ETH: '#627EEA', BNB: '#F3BA2F', SOL: '#9945FF' }[asset] ??
    '#3B82F6'
  );
}
