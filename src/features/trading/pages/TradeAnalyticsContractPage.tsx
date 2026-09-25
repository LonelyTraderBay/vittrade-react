import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingUp } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useTradingAnalyticsQuery } from '../model/analytics-queries';
import type {
  TradingAnalyticsPeriod,
  TradingAnalyticsResponse,
  TradingAnalyticsTrade,
} from '../model/analytics-types';

const PERIODS: TradingAnalyticsPeriod[] = ['7D', '1M', '3M', '1Y'];
const TABS = ['overview', 'trades', 'assets'] as const;
type AnalyticsTab = (typeof TABS)[number];

export function TradeAnalyticsContractPage() {
  const colors = useThemeColors();
  const [period, setPeriod] = useState<TradingAnalyticsPeriod>('1M');
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const query = useTradingAnalyticsQuery({ period });

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Trade Analytics" subtitle="Trading analytics contract" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu analytics API…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Trade Analytics" subtitle="Server-owned trading performance" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto">
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

        <div className="grid grid-cols-3 gap-2">
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className="rounded-xl px-3 py-2 text-xs font-semibold capitalize"
              style={{
                background: tab === value ? `${colors.primary}20` : colors.surface2,
                color: tab === value ? colors.primary : colors.text3,
              }}
            >
              {value}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview data={query.data} />}
        {tab === 'trades' && <Trades data={query.data} />}
        {tab === 'assets' && <Assets data={query.data} />}
      </PageContent>
    </PageLayout>
  );
}

function SummaryCard({ data }: { data: TradingAnalyticsResponse }) {
  const colors = useThemeColors();
  const summary = data.summary;
  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} color={colors.primary} />
        <div>
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Performance summary</h2>
          <p style={{ color: colors.text3, fontSize: 11 }}>Period {data.period}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Total P/L"
          value={formatUsd(summary.totalPnl)}
          positive={summary.totalPnl >= 0}
        />
        <Metric label="Win rate" value={`${summary.winRate.toFixed(1)}%`} />
        <Metric label="Profit factor" value={summary.profitFactor.toFixed(2)} />
        <Metric label="Max drawdown" value={formatUsd(-summary.maxDrawdown)} positive={false} />
      </div>
    </TrCard>
  );
}

function Overview({ data }: { data: TradingAnalyticsResponse }) {
  const colors = useThemeColors();
  const maxAbsPnl = Math.max(...data.dailyPnl.map((day) => Math.abs(day.pnl)), 1);
  return (
    <>
      <TrCard className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={17} color="#10B981" />
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Daily P/L</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {data.dailyPnl.map((day) => {
            const positive = day.pnl >= 0;
            return (
              <div
                key={day.date}
                className="grid grid-cols-[48px_1fr_76px] items-center gap-3 text-xs"
              >
                <span style={{ color: colors.text3 }}>{day.date}</span>
                <div className="h-2 rounded-full" style={{ background: colors.surface2 }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(Math.abs(day.pnl) / maxAbsPnl) * 100}%`,
                      background: positive ? '#10B981' : '#EF4444',
                    }}
                  />
                </div>
                <span className="text-right" style={{ color: positive ? '#10B981' : '#EF4444' }}>
                  {formatUsd(day.pnl)}
                </span>
              </div>
            );
          })}
        </div>
      </TrCard>
      <TrCard className="p-4">
        <h2 style={{ color: colors.text1, fontWeight: 700 }}>Trading quality</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Metric label="Total trades" value={data.summary.totalTrades.toLocaleString('vi-VN')} />
          <Metric label="Average / trade" value={formatUsd(data.summary.averageTradePnl)} />
          <Metric label="Best day" value={formatUsd(data.summary.bestDay)} positive />
          <Metric label="Worst day" value={formatUsd(data.summary.worstDay)} positive={false} />
        </div>
      </TrCard>
    </>
  );
}

function Trades({ data }: { data: TradingAnalyticsResponse }) {
  return (
    <>
      <TradeGroup title="Best trades" trades={data.bestTrades} positive />
      <TradeGroup title="Worst trades" trades={data.worstTrades} positive={false} />
    </>
  );
}

function TradeGroup({
  title,
  trades,
  positive,
}: {
  title: string;
  trades: TradingAnalyticsTrade[];
  positive: boolean;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <h2 style={{ color: colors.text1, fontWeight: 700 }}>{title}</h2>
      <div className="mt-3 grid gap-2">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: colors.surface2 }}
          >
            {positive ? (
              <ArrowUpRight size={15} color="#10B981" />
            ) : (
              <ArrowDownRight size={15} color="#EF4444" />
            )}
            <div className="min-w-0 flex-1">
              <strong style={{ color: colors.text1, fontSize: 12 }}>{trade.pair}</strong>
              <p style={{ color: colors.text3, fontSize: 10 }}>
                {trade.side.toUpperCase()} · {trade.date} · {trade.roi.toFixed(2)}% ROI
              </p>
            </div>
            <strong style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 12 }}>
              {formatUsd(trade.pnl)}
            </strong>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

function Assets({ data }: { data: TradingAnalyticsResponse }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <h2 style={{ color: colors.text1, fontWeight: 700 }}>Asset breakdown</h2>
      <div className="mt-3 grid gap-2">
        {data.assetBreakdown.map((asset) => (
          <div
            key={asset.asset}
            className="grid grid-cols-[1fr_64px_64px] items-center gap-2 text-xs"
          >
            <span className="flex items-center gap-2" style={{ color: colors.text2 }}>
              <span className="h-2 w-2 rounded-full" style={{ background: asset.color }} />
              {asset.asset}
            </span>
            <span className="text-right" style={{ color: asset.pnl >= 0 ? '#10B981' : '#EF4444' }}>
              {formatUsd(asset.pnl)}
            </span>
            <span className="text-right" style={{ color: colors.text3 }}>
              {asset.winRate.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
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

function formatUsd(value: number) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
