import { useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useWalletPortfolioAnalyticsQuery } from '../model/wallet-queries';
import type {
  PortfolioAnalyticsPeriod,
  PortfolioAnalyticsResponse,
  PortfolioPerformer,
} from '../model/wallet-types';

const PERIODS: PortfolioAnalyticsPeriod[] = ['1W', '1M', '3M', '1Y', 'ALL'];

export function PortfolioAnalyticsContractPage() {
  const colors = useThemeColors();
  const [period, setPeriod] = useState<PortfolioAnalyticsPeriod>('1M');
  const query = useWalletPortfolioAnalyticsQuery(period);

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Portfolio Analytics" subtitle="Wallet performance contract" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Loading portfolio analytics API…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Portfolio Analytics" subtitle="Server-owned wallet performance" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto" aria-label="Analytics period">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: period === value ? colors.primary : colors.surface2,
                color: period === value ? '#fff' : colors.text2,
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <SummaryCard data={query.data} />
        <HistoryCard data={query.data} />
        <MonthlyPnlCard data={query.data} />
        <PerformersCard
          title="Top performers"
          icon={<TrendingUp size={17} color="#10B981" />}
          performers={query.data.topPerformers}
          positive
        />
        <PerformersCard
          title="Worst performers"
          icon={<TrendingDown size={17} color="#EF4444" />}
          performers={query.data.worstPerformers}
          positive={false}
        />
      </PageContent>
    </PageLayout>
  );
}

function SummaryCard({ data }: { data: PortfolioAnalyticsResponse }) {
  const colors = useThemeColors();
  const latest = data.history[data.history.length - 1];
  const totalPnl = latest?.pnl ?? 0;

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} color={colors.primary} />
        <div>
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Portfolio summary</h2>
          <p style={{ color: colors.text3, fontSize: 11 }}>Period {data.period}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Current value" value={formatUsd(latest?.value ?? 0, false)} />
        <Metric label="Period P/L" value={formatUsd(totalPnl)} positive={totalPnl >= 0} />
        <Metric label="Total trades" value={data.totalTrades.toLocaleString('vi-VN')} />
        <Metric label="Fees" value={formatUsd(data.totalFeesUsd, false)} />
      </div>
    </TrCard>
  );
}

function HistoryCard({ data }: { data: PortfolioAnalyticsResponse }) {
  const colors = useThemeColors();
  const maxValue = Math.max(...data.history.map((point) => point.value), 1);

  return (
    <TrCard className="p-4">
      <h2 style={{ color: colors.text1, fontWeight: 700 }}>Performance history</h2>
      {data.history.length === 0 ? (
        <p className="mt-3" style={{ color: colors.text3, fontSize: 12 }}>
          No portfolio history for this period.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {data.history.map((point) => (
            <div
              key={point.timestamp}
              className="grid grid-cols-[74px_1fr_88px] items-center gap-3 text-xs"
            >
              <span style={{ color: colors.text3 }}>{formatDate(point.timestamp)}</span>
              <div className="h-2 rounded-full" style={{ background: colors.surface2 }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(point.value / maxValue) * 100}%`,
                    background: colors.primary,
                  }}
                />
              </div>
              <span className="text-right" style={{ color: colors.text2 }}>
                {formatUsd(point.value, false)}
              </span>
            </div>
          ))}
        </div>
      )}
    </TrCard>
  );
}

function MonthlyPnlCard({ data }: { data: PortfolioAnalyticsResponse }) {
  const colors = useThemeColors();
  const maxAbsPnl = Math.max(...data.monthlyPnl.map((month) => Math.abs(month.pnl)), 1);

  return (
    <TrCard className="p-4">
      <h2 style={{ color: colors.text1, fontWeight: 700 }}>Monthly P/L</h2>
      <div className="mt-4 grid gap-3">
        {data.monthlyPnl.map((month) => {
          const positive = month.pnl >= 0;
          return (
            <div
              key={month.month}
              className="grid grid-cols-[46px_1fr_84px] items-center gap-3 text-xs"
            >
              <span style={{ color: colors.text3 }}>{month.month}</span>
              <div className="h-2 rounded-full" style={{ background: colors.surface2 }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(Math.abs(month.pnl) / maxAbsPnl) * 100}%`,
                    background: positive ? '#10B981' : '#EF4444',
                  }}
                />
              </div>
              <span className="text-right" style={{ color: positive ? '#10B981' : '#EF4444' }}>
                {formatUsd(month.pnl)}
              </span>
            </div>
          );
        })}
      </div>
    </TrCard>
  );
}

function PerformersCard({
  title,
  icon,
  performers,
  positive,
}: {
  title: string;
  icon: React.ReactNode;
  performers: PortfolioPerformer[];
  positive: boolean;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 style={{ color: colors.text1, fontWeight: 700 }}>{title}</h2>
      </div>
      {performers.length === 0 ? (
        <p className="mt-3" style={{ color: colors.text3, fontSize: 12 }}>
          No assets in this ranking for the selected period.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {performers.map((performer) => (
            <div
              key={performer.symbol}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: colors.surface2 }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: `${performer.color}25`, color: performer.color }}
              >
                {performer.symbol.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <strong style={{ color: colors.text1, fontSize: 12 }}>{performer.symbol}</strong>
                <p style={{ color: colors.text3, fontSize: 10 }}>{performer.name}</p>
              </div>
              <div className="text-right">
                <strong style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 12 }}>
                  {formatPercent(performer.change)}
                </strong>
                <p style={{ color: colors.text3, fontSize: 10 }}>
                  {formatUsd(performer.usd, false)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </TrCard>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2" style={{ background: colors.surface2 }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <strong
        style={{
          color: positive == null ? colors.text1 : positive ? '#10B981' : '#EF4444',
          fontSize: 13,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatUsd(value: number, signed = true) {
  const sign = signed && value >= 0 ? '+' : signed ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}
