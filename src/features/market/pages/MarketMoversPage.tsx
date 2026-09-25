import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  useMarketMoversQuery,
  type MarketMoverSummary,
  type MarketMoverTimeframe,
  type MarketMoverView,
} from '@/features/market';

const viewOptions: Array<{ value: MarketMoverView; label: string; icon: typeof TrendingUp }> = [
  { value: 'gainers', label: 'Tăng mạnh', icon: TrendingUp },
  { value: 'losers', label: 'Giảm mạnh', icon: TrendingDown },
  { value: 'most-active', label: 'Hoạt động', icon: Activity },
  { value: 'unusual-volume', label: 'KL bất thường', icon: Zap },
  { value: 'new-listings', label: 'Mới niêm yết', icon: Sparkles },
];
const timeframes: MarketMoverTimeframe[] = ['1h', '24h', '7d'];
const categories = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Layer 1', label: 'Layer 1' },
  { value: 'Layer 2', label: 'Layer 2' },
  { value: 'DeFi', label: 'DeFi' },
  { value: 'AI', label: 'AI' },
  { value: 'Payment', label: 'Payment' },
];

export function MarketMoversPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [view, setView] = useState<MarketMoverView>('gainers');
  const [timeframe, setTimeframe] = useState<MarketMoverTimeframe>('24h');
  const [category, setCategory] = useState('all');
  const query = useMarketMoversQuery({
    view,
    timeframe,
    ...(category !== 'all' ? { category } : {}),
  });

  return (
    <PageLayout>
      <Header title="Biến động thị trường" subtitle="Dữ liệu theo contract" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const active = view === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setView(option.value)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 whitespace-nowrap"
                style={{
                  background: active ? colors.chipActiveBg : colors.chipBg,
                  border: `1px solid ${active ? colors.chipActiveBorder : colors.chipBorder}`,
                  color: active ? colors.chipActiveText : colors.chipText,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Icon size={13} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {timeframes.map((item) => (
            <button
              key={item}
              onClick={() => setTimeframe(item)}
              className="rounded-lg px-3 py-1.5"
              style={{
                background: timeframe === item ? '#3B82F6' : colors.chipBg,
                color: timeframe === item ? '#fff' : colors.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          ))}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="ml-auto rounded-lg px-2 py-1.5"
            style={{ background: colors.chipBg, color: colors.chipText, fontSize: 11 }}
            aria-label="Lọc theo ngành"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải danh sách biến động…</p>
          </TrCard>
        ) : query.isError || !query.data ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : (
          <TrCard className="px-4">
            <div
              className="flex items-center justify-between py-3"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <span style={{ color: colors.text3, fontSize: 11 }}>
                {query.data.items.length} tài sản · cập nhật{' '}
                {new Date(query.data.updatedAt).toLocaleTimeString()}
              </span>
              <button
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Làm mới danh sách"
                style={{ color: colors.text2 }}
              >
                <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : undefined} />
              </button>
            </div>
            {query.data.items.length === 0 ? (
              <p className="py-8 text-center" style={{ color: colors.text3, fontSize: 12 }}>
                Không có dữ liệu cho bộ lọc hiện tại.
              </p>
            ) : (
              query.data.items.map((mover, index) => (
                <MoverRow
                  key={mover.id}
                  mover={mover}
                  rank={index + 1}
                  view={view}
                  onClick={() => navigate(`${prefix}/pair/${mover.id}`)}
                />
              ))
            )}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}

function MoverRow({
  mover,
  rank,
  view,
  onClick,
}: {
  mover: MarketMoverSummary;
  rank: number;
  view: MarketMoverView;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  const positive = mover.change24h >= 0;
  const metric =
    view === 'most-active'
      ? fmtCompact(mover.volume24h, { prefix: '$' })
      : view === 'unusual-volume'
        ? `${fmtPct(mover.volumeChange24h)} KL`
        : `${positive ? '+' : ''}${fmtPct(mover.change24h)}`;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 min-h-11 w-full text-left"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: rank <= 3 ? 'rgba(245,158,11,0.12)' : colors.surface2,
          color: rank <= 3 ? '#F59E0B' : colors.text3,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {rank}
      </span>
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${mover.color}1F` }}
      >
        <span style={{ color: mover.color, fontSize: 10, fontWeight: 700 }}>
          {mover.symbol.slice(0, 3)}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span style={{ color: colors.text1, display: 'block', fontSize: 12, fontWeight: 600 }}>
          {mover.symbol}
          {mover.isNew && <span style={{ color: '#8B5CF6', fontSize: 9, marginLeft: 6 }}>NEW</span>}
        </span>
        <span className="truncate block" style={{ color: colors.text3, fontSize: 10 }}>
          {mover.name}
        </span>
      </span>
      <span className="shrink-0" style={{ width: 58, height: 26 }}>
        <SparklineChart data={mover.sparkline} isPositive={positive} />
      </span>
      <span className="text-right shrink-0" style={{ minWidth: 82 }}>
        <span
          style={{
            color: colors.text1,
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}
        >
          {fmtPrice(mover.price)}
        </span>
        <span
          style={{
            color: view === 'losers' ? '#EF4444' : positive ? '#10B981' : '#EF4444',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {metric}
        </span>
      </span>
    </button>
  );
}
