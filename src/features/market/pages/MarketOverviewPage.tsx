import { useNavigate } from 'react-router';
import {
  Activity,
  BarChart3,
  ChevronRight,
  Gauge,
  Globe,
  Layers,
  PieChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketOverviewQuery } from '@/features/market';
import {
  FearGreedGauge,
  MoverRow,
  SectorRow,
  StatCard,
} from '../components/MarketOverviewSections';
import type { MarketMoverSummary } from '@/features/market';

export function MarketOverviewPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const overviewQuery = useMarketOverviewQuery();

  if (overviewQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Tổng quan thị trường" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu thị trường…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageLayout>
        <Header title="Tổng quan thị trường" back />
        <ErrorState onAction={() => void overviewQuery.refetch()} />
      </PageLayout>
    );
  }

  const { stats, breadth, fearGreedHistory, sectors, topGainers, topLosers, updatedAt } =
    overviewQuery.data;
  const topSectors = [...sectors].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const breadthTotal = Math.max(breadth.advancing + breadth.declining, 1);

  return (
    <PageLayout>
      <Header title="Tổng quan thị trường" back />
      <PageContent gap="relaxed">
        <TrCard variant="hero" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} color="#3B82F6" />
            <span style={{ color: colors.text2, fontSize: 12, fontWeight: 600 }}>
              Tổng vốn hóa thị trường
            </span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span
              style={{
                color: colors.text1,
                fontSize: 23,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {fmtCompact(stats.totalMarketCap, { prefix: '$' })}
            </span>
            <span
              style={{
                color: stats.totalMarketCapChange24h >= 0 ? '#10B981' : '#EF4444',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fmtPct(stats.totalMarketCapChange24h)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="BTC Dominance" value={`${stats.btcDominance}%`} color="#F7931A" />
            <Metric label="ETH Dominance" value={`${stats.ethDominance}%`} color="#627EEA" />
            <Metric label="KL 24h" value={fmtCompact(stats.total24hVolume, { prefix: '$' })} />
          </div>
        </TrCard>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="DeFi TVL"
            value={fmtCompact(stats.defiTVL, { prefix: '$' })}
            change={stats.defiTVLChange24h}
            icon={Layers}
            color="#8B5CF6"
          />
          <StatCard
            label="Stablecoin Vol"
            value={fmtCompact(stats.stablecoinVolume24h, { prefix: '$' })}
            icon={Activity}
            color="#3B82F6"
          />
          <StatCard
            label="Tổng coin"
            value={stats.totalCoins.toLocaleString()}
            icon={PieChart}
            color="#10B981"
          />
          <StatCard
            label="Sàn giao dịch"
            value={stats.totalExchanges.toLocaleString()}
            icon={BarChart3}
            color="#F59E0B"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 self-start">
              <Gauge size={14} color="#F59E0B" />
              <span style={{ color: colors.text2, fontSize: 12, fontWeight: 600 }}>
                Fear & Greed
              </span>
            </div>
            <FearGreedGauge value={stats.fearGreedIndex} label={stats.fearGreedLabel} />
          </TrCard>
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} color="#3B82F6" />
              <span style={{ color: colors.text2, fontSize: 12, fontWeight: 600 }}>
                Biến động thị trường
              </span>
            </div>
            <BreadthRow label="Tăng" value={breadth.advancing} color="#10B981" />
            <BreadthRow label="Giảm" value={breadth.declining} color="#EF4444" />
            <div className="flex rounded-full overflow-hidden mt-2" style={{ height: 6 }}>
              <div
                style={{
                  width: `${(breadth.advancing / breadthTotal) * 100}%`,
                  background: '#10B981',
                }}
              />
              <div style={{ flex: 1, background: '#EF4444' }} />
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ color: colors.text3, fontSize: 10 }}>{breadth.newATH} ATH mới</span>
              <span style={{ color: '#EF4444', fontSize: 10 }}>
                {breadth.dropping10Pct} giảm &gt;10%
              </span>
            </div>
          </TrCard>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Biến động', icon: TrendingUp, color: '#10B981', path: 'movers' },
            { label: 'Ngành', icon: Layers, color: '#8B5CF6', path: 'sectors' },
            { label: 'Heatmap', icon: BarChart3, color: '#3B82F6', path: 'heatmap' },
          ].map((item) => (
            <TrCard
              key={item.path}
              as="button"
              hover
              className="p-3 flex flex-col items-center gap-2"
              onClick={() => navigate(`${prefix}/markets/${item.path}`)}
            >
              <item.icon size={18} color={item.color} />
              <span style={{ color: colors.text1, fontSize: 11, fontWeight: 600 }}>
                {item.label}
              </span>
            </TrCard>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MoverCard
            title="Tăng mạnh"
            color="#10B981"
            icon={TrendingUp}
            movers={topGainers}
            onNavigate={() => navigate(`${prefix}/markets/movers`)}
            onPair={(mover) => navigate(`${prefix}/pair/${mover.id}`)}
          />
          <MoverCard
            title="Giảm mạnh"
            color="#EF4444"
            icon={TrendingDown}
            movers={topLosers}
            onNavigate={() => navigate(`${prefix}/markets/movers`)}
            onPair={(mover) => navigate(`${prefix}/pair/${mover.id}`)}
          />
        </div>

        <PageSection label="Hiệu suất ngành" accentColor="#8B5CF6">
          <TrCard className="px-4">
            {topSectors.map((sector) => (
              <SectorRow
                key={sector.id}
                sector={sector}
                onClick={() => navigate(`${prefix}/markets/sectors?id=${sector.id}`)}
              />
            ))}
            <button
              className="flex items-center justify-center gap-2 w-full py-3"
              onClick={() => navigate(`${prefix}/markets/sectors`)}
            >
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                Xem tất cả ngành
              </span>
              <ChevronRight size={12} color="#3B82F6" />
            </button>
          </TrCard>
        </PageSection>

        <PageSection label="Lịch sử Fear & Greed" accentColor="#F59E0B">
          <TrCard className="p-4">
            <div className="flex items-end gap-1" style={{ height: 80 }}>
              {fearGreedHistory.map((point) => (
                <div
                  key={`${point.date}-${point.value}`}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span style={{ color: colors.text3, fontSize: 8, fontFamily: 'monospace' }}>
                    {point.value}
                  </span>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${Math.max((point.value / 100) * 64, 4)}px`,
                      background: point.value > 55 ? '#10B981' : '#F59E0B',
                      minWidth: 4,
                    }}
                  />
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        <div className="flex items-center justify-between">
          <span style={{ color: colors.text3, fontSize: 10 }}>
            Cập nhật {new Date(updatedAt).toLocaleTimeString()}
          </span>
          <button
            className="flex items-center gap-1"
            onClick={() => void overviewQuery.refetch()}
            disabled={overviewQuery.isFetching}
            style={{ color: colors.text2, fontSize: 11 }}
          >
            <RefreshCw
              size={12}
              className={overviewQuery.isFetching ? 'animate-spin' : undefined}
            />
            Làm mới
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2" style={{ background: colors.portfolioBtnGhost }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p
        style={{
          color: color ?? colors.text1,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function BreadthRow({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useThemeColors();
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="flex items-center gap-1" style={{ color: colors.text2, fontSize: 11 }}>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span style={{ color, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function MoverCard({
  title,
  color,
  icon: Icon,
  movers,
  onNavigate,
  onPair,
}: {
  title: string;
  color: string;
  icon: typeof TrendingUp;
  movers: MarketMoverSummary[];
  onNavigate: () => void;
  onPair: (mover: MarketMoverSummary) => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <button className="flex items-center justify-between w-full mb-2" onClick={onNavigate}>
        <span className="flex items-center gap-2" style={{ color, fontSize: 12, fontWeight: 700 }}>
          <Icon size={14} color={color} />
          {title}
        </span>
        <ChevronRight size={12} color={colors.text3} />
      </button>
      {movers.map((mover) => (
        <MoverRow key={mover.id} mover={mover} onClick={() => onPair(mover)} />
      ))}
    </TrCard>
  );
}
