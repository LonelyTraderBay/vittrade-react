import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDownRight, ArrowUpRight, Plus, Scale, X } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketPairsQuery, type MarketPair } from '@/features/market';

const EMPTY_PAIRS: MarketPair[] = [];

export function MarketComparisonPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidate, setCandidate] = useState('');
  const pairsQuery = useMarketPairsQuery({ limit: 100 });
  const pairs = pairsQuery.data?.items ?? EMPTY_PAIRS;
  const selectedPairs = useMemo(
    () =>
      selectedIds
        .map((id) => pairs.find((pair) => pair.id === id))
        .filter((pair): pair is MarketPair => Boolean(pair)),
    [pairs, selectedIds],
  );

  if (pairsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="So sánh tài sản" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu so sánh…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (pairsQuery.isError) {
    return (
      <PageLayout>
        <Header title="So sánh tài sản" back />
        <ErrorState onAction={() => void pairsQuery.refetch()} />
      </PageLayout>
    );
  }

  const available = pairs.filter((pair) => !selectedIds.includes(pair.id));
  const addPair = () => {
    if (candidate && selectedIds.length < 4) {
      setSelectedIds((current) => [...current, candidate]);
      setCandidate('');
    }
  };
  return (
    <PageLayout>
      <Header title="So sánh tài sản" subtitle="Market pair contract" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} color="#3B82F6" />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>Chọn tài sản</span>
            <span className="ml-auto" style={{ color: colors.text3, fontSize: 10 }}>
              {selectedPairs.length}/4
            </span>
          </div>
          <div className="flex gap-2">
            <select
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
              className="flex-1 rounded-lg px-2 py-2"
              style={{ background: colors.surface2, color: colors.text1, fontSize: 11 }}
              aria-label="Chọn tài sản để thêm"
            >
              <option value="">Chọn cặp…</option>
              {available.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.symbol}
                </option>
              ))}
            </select>
            <button
              onClick={addPair}
              disabled={!candidate || selectedIds.length >= 4}
              className="rounded-lg px-3"
              style={{ background: '#3B82F6', color: '#fff' }}
              aria-label="Thêm tài sản"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedPairs.map((pair) => (
              <button
                key={pair.id}
                onClick={() => setSelectedIds((current) => current.filter((id) => id !== pair.id))}
                className="flex items-center gap-1 rounded-lg px-2 py-1"
                style={{
                  background: `${pair.logoColor}20`,
                  color: pair.logoColor,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {pair.symbol}
                <X size={11} />
              </button>
            ))}
          </div>
        </TrCard>

        {selectedPairs.length === 0 ? (
          <TrCard className="p-10 text-center">
            <Scale size={30} color={colors.text3} className="mx-auto mb-2" />
            <p style={{ color: colors.text3, fontSize: 12 }}>
              Chọn ít nhất một cặp để bắt đầu so sánh.
            </p>
          </TrCard>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {selectedPairs.map((pair) => (
              <ComparisonCard
                key={pair.id}
                pair={pair}
                onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
              />
            ))}
          </div>
        )}

        {selectedPairs.length > 1 && (
          <TrCard className="px-4">
            <MetricRow
              label="Giá hiện tại"
              values={selectedPairs.map((pair) => fmtPrice(pair.price))}
            />
            <MetricRow
              label="Thay đổi 24h"
              values={selectedPairs.map(
                (pair) => `${pair.change24h >= 0 ? '+' : ''}${fmtPct(pair.change24h)}`,
              )}
              positiveValues={selectedPairs.map((pair) => pair.change24h >= 0)}
            />
            <MetricRow
              label="Market cap"
              values={selectedPairs.map((pair) => fmtCompact(pair.marketCap, { prefix: '$' }))}
            />
            <MetricRow
              label="Volume 24h"
              values={selectedPairs.map((pair) => fmtCompact(pair.volume24h, { prefix: '$' }))}
            />
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}

function ComparisonCard({ pair, onClick }: { pair: MarketPair; onClick: () => void }) {
  const colors = useThemeColors();
  const positive = pair.change24h >= 0;
  return (
    <TrCard as="button" hover className="p-3 text-left" onClick={onClick}>
      <div className="flex items-center gap-2">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${pair.logoColor}20` }}
        >
          <span style={{ color: pair.logoColor, fontSize: 9, fontWeight: 700 }}>
            {pair.baseAsset.slice(0, 3)}
          </span>
        </span>
        <span className="flex-1" style={{ color: colors.text1, fontSize: 12, fontWeight: 700 }}>
          {pair.symbol}
        </span>
        {positive ? (
          <ArrowUpRight size={13} color="#10B981" />
        ) : (
          <ArrowDownRight size={13} color="#EF4444" />
        )}
      </div>
      <p
        className="mt-3"
        style={{ color: colors.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}
      >
        {fmtPrice(pair.price)}
      </p>
      <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 700 }}>
        {positive ? '+' : ''}
        {fmtPct(pair.change24h)}
      </p>
    </TrCard>
  );
}

function MetricRow({
  label,
  values,
  positiveValues,
}: {
  label: string;
  values: string[];
  positiveValues?: boolean[];
}) {
  const colors = useThemeColors();
  return (
    <div
      className="grid py-3"
      style={{
        gridTemplateColumns: '1fr repeat(auto-fit, minmax(70px, 1fr))',
        borderBottom: `1px solid ${colors.divider}`,
      }}
    >
      <span style={{ color: colors.text3, fontSize: 11 }}>{label}</span>
      {values.map((value, index) => (
        <span
          key={`${label}-${index}`}
          className="text-right"
          style={{
            color: positiveValues ? (positiveValues[index] ? '#10B981' : '#EF4444') : colors.text1,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}
