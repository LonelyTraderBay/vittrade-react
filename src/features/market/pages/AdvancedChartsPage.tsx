import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BarChart3, ChevronDown, Info, Layers, TrendingDown, TrendingUp } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  useMarketCandlesQuery,
  useMarketPairQuery,
  useMarketPairsQuery,
  type MarketCandleInterval,
} from '@/features/market';

const timeframes: MarketCandleInterval[] = ['1h', '4h', '1d', '1w'];

export function AdvancedChartsPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { pairId: routePairId } = useParams();
  const prefix = useRoutePrefix();
  const [selectedPairId, setSelectedPairId] = useState('');
  const [timeframe, setTimeframe] = useState<MarketCandleInterval>('1d');
  const pairsQuery = useMarketPairsQuery({ limit: 100 });
  const routePairQuery = useMarketPairQuery(routePairId ?? '');
  const pairs = pairsQuery.data?.items ?? [];
  const selectablePairs = routePairQuery.data
    ? [routePairQuery.data, ...pairs.filter((item) => item.id !== routePairQuery.data.id)]
    : pairs;
  const pair = selectedPairId
    ? (selectablePairs.find((item) => item.id === selectedPairId) ?? selectablePairs[0])
    : (routePairQuery.data ?? pairs[0]);
  const candlesQuery = useMarketCandlesQuery(pair?.id ?? '', { interval: timeframe, limit: 100 });

  if (pairsQuery.isPending || (Boolean(routePairId) && routePairQuery.isPending)) {
    return (
      <PageLayout>
        <Header title="Advanced charts" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu biểu đồ…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (pairsQuery.isError || (Boolean(routePairId) && routePairQuery.isError) || !pair) {
    return (
      <PageLayout>
        <Header title="Advanced charts" back />
        <ErrorState
          onAction={() => {
            void pairsQuery.refetch();
            if (routePairId) void routePairQuery.refetch();
          }}
        />
      </PageLayout>
    );
  }

  const positive = pair.change24h >= 0;
  const candleCloses = candlesQuery.data?.items.map((candle) => candle.close) ?? [];
  return (
    <PageLayout>
      <Header title="Advanced charts" subtitle="Market pair + OHLCV contract" back />
      <PageContent gap="default">
        <div className="flex gap-2">
          <label
            className="flex-1 flex items-center rounded-xl px-3"
            style={{ background: colors.surface2 }}
          >
            <select
              value={pair.id}
              onChange={(event) => setSelectedPairId(event.target.value)}
              className="w-full py-2 bg-transparent"
              style={{ color: colors.text1, fontSize: 12 }}
              aria-label="Chọn cặp cho biểu đồ"
            >
              {selectablePairs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.symbol}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
            className="rounded-xl px-3"
            style={{ background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 700 }}
          >
            Chi tiết
          </button>
        </div>
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</p>
              <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 700 }}>
                {positive ? (
                  <TrendingUp size={12} className="inline" />
                ) : (
                  <TrendingDown size={12} className="inline" />
                )}{' '}
                {positive ? '+' : ''}
                {fmtPct(pair.change24h)}
              </p>
            </div>
            <p
              style={{
                color: colors.text1,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {fmtPrice(pair.price)}
            </p>
          </div>
          <div className="flex items-center justify-center" style={{ minHeight: 190 }}>
            {candlesQuery.isPending ? (
              <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải nến {timeframe}…</p>
            ) : candlesQuery.isError ? (
              <ErrorState
                title="Không tải được dữ liệu nến"
                onAction={() => void candlesQuery.refetch()}
              />
            ) : candleCloses.length === 0 ? (
              <p style={{ color: colors.text3, fontSize: 12 }}>
                Chưa có dữ liệu nến cho khung {timeframe}.
              </p>
            ) : (
              <div role="img" aria-label={`Giá đóng cửa ${pair.symbol}, khung ${timeframe}`}>
                <SparklineChart
                  data={candleCloses}
                  isPositive={positive}
                  width={320}
                  height={180}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
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
          </div>
        </TrCard>
        <PageSection label="Chỉ báo kỹ thuật" accentColor="#8B5CF6">
          <TrCard className="p-4">
            <p style={{ color: colors.text3, fontSize: 12, lineHeight: 1.6 }}>
              SMA, EMA, RSI, MACD, Bollinger Bands và volume overlays chưa khả dụng cho đến khi
              backend cung cấp contract tính toán và dữ liệu có nguồn gốc rõ ràng.
            </p>
          </TrCard>
        </PageSection>
        <TrCard className="p-4">
          <div className="flex items-center gap-2">
            <Info size={15} color="#F59E0B" />
            <span style={{ color: colors.text1, fontSize: 12, fontWeight: 700 }}>
              Technical indicator contract pending
            </span>
          </div>
          <p className="mt-2" style={{ color: colors.text3, fontSize: 11, lineHeight: 1.6 }}>
            Biểu đồ dùng giá đóng cửa từ OHLCV contract theo khung thời gian đã chọn. Chưa có
            candlestick renderer hoặc chỉ báo phía server; route không tự tạo tín hiệu giao dịch.
          </p>
        </TrCard>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction
            icon={Layers}
            label="Market depth"
            onClick={() => navigate(`${prefix}/pair/${pair.id}/depth`)}
          />
          <QuickAction
            icon={BarChart3}
            label="Screener"
            onClick={() => navigate(`${prefix}/markets/screener`)}
          />
        </div>
      </PageContent>
    </PageLayout>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Layers;
  label: string;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard as="button" hover className="p-3 flex items-center gap-2" onClick={onClick}>
      <Icon size={15} color="#3B82F6" />
      <span style={{ color: colors.text1, fontSize: 11, fontWeight: 600 }}>{label}</span>
      <ChevronDown size={12} color={colors.text3} className="ml-auto -rotate-90" />
    </TrCard>
  );
}
