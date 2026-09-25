import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, PieChart } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  useMarketOverviewQuery,
  useMarketPairsQuery,
  type MarketSectorSummary,
} from '@/features/market';

type SectorTimeframe = '24h' | '7d' | '30d';
type SectorSort = 'performance' | 'marketCap' | 'coins';

export function MarketSectorsPage() {
  const colors = useThemeColors();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeframe, setTimeframe] = useState<SectorTimeframe>('24h');
  const [sort, setSort] = useState<SectorSort>('performance');
  const selectedId = searchParams.get('id');
  const overviewQuery = useMarketOverviewQuery();
  const selectedSector = overviewQuery.data?.sectors.find((sector) => sector.id === selectedId);
  const pairsQuery = useMarketPairsQuery({
    category: selectedSector?.name,
    limit: 100,
  });

  if (overviewQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Ngành thị trường" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu ngành…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageLayout>
        <Header title="Ngành thị trường" back />
        <ErrorState onAction={() => void overviewQuery.refetch()} />
      </PageLayout>
    );
  }

  if (selectedSector) {
    return (
      <SectorDetail
        sector={selectedSector}
        pairs={pairsQuery.data?.items ?? []}
        isLoading={pairsQuery.isPending}
        onBack={() => setSearchParams({})}
      />
    );
  }

  const sectors = [...overviewQuery.data.sectors].sort((a, b) => {
    if (sort === 'marketCap') return b.totalMarketCap - a.totalMarketCap;
    if (sort === 'coins') return b.coinCount - a.coinCount;
    return getSectorChange(b, timeframe) - getSectorChange(a, timeframe);
  });
  const totalMarketCap = Math.max(
    overviewQuery.data.sectors.reduce((sum, sector) => sum + sector.totalMarketCap, 0),
    1,
  );

  return (
    <PageLayout>
      <Header title="Ngành thị trường" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={14} color="#8B5CF6" />
            <span style={{ color: colors.text2, fontSize: 12, fontWeight: 600 }}>
              Phân bổ vốn hóa theo ngành
            </span>
          </div>
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ height: 20 }}>
            {overviewQuery.data.sectors.map((sector) => (
              <div
                key={sector.id}
                title={`${sector.nameVi}: ${((sector.totalMarketCap / totalMarketCap) * 100).toFixed(1)}%`}
                style={{
                  width: `${(sector.totalMarketCap / totalMarketCap) * 100}%`,
                  background: sector.color,
                  opacity: 0.75,
                  minWidth: 2,
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {overviewQuery.data.sectors.map((sector) => (
              <span
                key={sector.id}
                className="flex items-center gap-1"
                style={{ color: colors.text3, fontSize: 10 }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: sector.color }} />
                {sector.name} {((sector.totalMarketCap / totalMarketCap) * 100).toFixed(1)}%
              </span>
            ))}
          </div>
        </TrCard>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as SectorTimeframe[]).map((item) => (
              <button
                key={item}
                onClick={() => setTimeframe(item)}
                className="rounded-xl px-3 py-2"
                style={{
                  background: timeframe === item ? colors.chipActiveBg : colors.chipBg,
                  border: `1px solid ${timeframe === item ? colors.chipActiveBorder : colors.chipBorder}`,
                  color: timeframe === item ? colors.chipActiveText : colors.chipText,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SectorSort)}
            aria-label="Sắp xếp ngành"
            className="rounded-lg px-2 py-1.5"
            style={{ background: colors.chipBg, color: colors.chipText, fontSize: 10 }}
          >
            <option value="performance">Hiệu suất</option>
            <option value="marketCap">Vốn hóa</option>
            <option value="coins">Số coin</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              timeframe={timeframe}
              onClick={() => setSearchParams({ id: sector.id })}
            />
          ))}
        </div>

        <PageSection label="So sánh nhanh" accentColor="#3B82F6">
          <TrCard className="px-3">
            {sectors.map((sector) => (
              <button
                key={sector.id}
                onClick={() => setSearchParams({ id: sector.id })}
                className="flex items-center py-2.5 w-full"
                style={{ borderBottom: `1px solid ${colors.divider}` }}
              >
                <span className="flex items-center gap-2 flex-1 text-left">
                  <span style={{ fontSize: 14 }}>{sector.icon}</span>
                  <span style={{ color: colors.text1, fontSize: 11, fontWeight: 600 }}>
                    {sector.name}
                  </span>
                </span>
                {[sector.change24h, sector.change7d, sector.change30d].map((value, index) => (
                  <span
                    key={index}
                    style={{
                      color: value >= 0 ? '#10B981' : '#EF4444',
                      width: 52,
                      textAlign: 'right',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {value >= 0 ? '+' : ''}
                    {fmtPct(value)}
                  </span>
                ))}
              </button>
            ))}
          </TrCard>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}

function SectorCard({
  sector,
  timeframe,
  onClick,
}: {
  sector: MarketSectorSummary;
  timeframe: SectorTimeframe;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  const change = getSectorChange(sector, timeframe);
  const positive = change >= 0;
  return (
    <TrCard as="button" hover className="p-3 text-left" onClick={onClick}>
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${sector.color}15` }}
        >
          <span>{sector.icon}</span>
        </span>
        <span className="flex-1">
          <span style={{ color: colors.text1, display: 'block', fontSize: 13, fontWeight: 700 }}>
            {sector.nameVi}
          </span>
          <span style={{ color: colors.text3, display: 'block', fontSize: 10 }}>
            {sector.coinCount} coins · {fmtCompact(sector.totalMarketCap, { prefix: '$' })}
          </span>
        </span>
        <span className="text-right">
          <span
            style={{
              color: positive ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {positive ? '+' : ''}
            {fmtPct(change)}
          </span>
          <span style={{ color: colors.text3, fontSize: 10 }}>
            {sector.dominance.toFixed(2)}% dominance
          </span>
        </span>
      </div>
    </TrCard>
  );
}

function SectorDetail({
  sector,
  pairs,
  isLoading,
  onBack,
}: {
  sector: MarketSectorSummary;
  pairs: Array<{
    id: string;
    symbol: string;
    baseAsset: string;
    price: number;
    change24h: number;
    marketCap: number;
    logoColor: string;
  }>;
  isLoading: boolean;
  onBack: () => void;
}) {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const topPairs = useMemo(
    () => [...pairs].sort((a, b) => b.marketCap - a.marketCap).slice(0, 10),
    [pairs],
  );
  return (
    <PageLayout>
      <Header title={sector.nameVi} back />
      <PageContent gap="default">
        <button
          onClick={onBack}
          className="flex items-center gap-1"
          style={{ color: '#3B82F6', fontSize: 12 }}
        >
          <ArrowLeft size={14} /> Quay lại ngành
        </button>
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${sector.color}20`, fontSize: 22 }}
            >
              {sector.icon}
            </span>
            <div>
              <p style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>{sector.nameVi}</p>
              <p style={{ color: colors.text3, fontSize: 11 }}>
                {sector.coinCount} coins · {sector.dominance.toFixed(2)}% market dominance
              </p>
            </div>
          </div>
        </TrCard>
        {isLoading ? (
          <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải tài sản trong ngành…</p>
        ) : (
          <TrCard className="px-4">
            {topPairs.map((pair) => (
              <button
                key={pair.id}
                onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                className="flex items-center gap-2 py-3 w-full"
                style={{ borderBottom: `1px solid ${colors.divider}` }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${pair.logoColor}20` }}
                >
                  <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: 700 }}>
                    {pair.baseAsset.slice(0, 3)}
                  </span>
                </span>
                <span
                  className="flex-1 text-left"
                  style={{ color: colors.text1, fontSize: 12, fontWeight: 600 }}
                >
                  {pair.symbol}
                </span>
                <span className="text-right">
                  <span
                    style={{
                      color: colors.text1,
                      display: 'block',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                  >
                    {fmtPrice(pair.price)}
                  </span>
                  <span
                    style={{
                      color: pair.change24h >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {pair.change24h >= 0 ? '+' : ''}
                    {fmtPct(pair.change24h)}
                  </span>
                </span>
              </button>
            ))}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}

function getSectorChange(sector: MarketSectorSummary, timeframe: SectorTimeframe) {
  return timeframe === '7d'
    ? sector.change7d
    : timeframe === '30d'
      ? sector.change30d
      : sector.change24h;
}
