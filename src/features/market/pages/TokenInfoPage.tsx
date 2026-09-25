import { useNavigate, useParams } from 'react-router';
import { ArrowDownRight, ArrowUpRight, BarChart3, ExternalLink, Globe, Shield } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketPairQuery } from '@/features/market';

export function TokenInfoPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { pairId = '' } = useParams();
  const pairQuery = useMarketPairQuery(pairId);

  if (pairQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Token info" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu tài sản…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (pairQuery.isError || !pairQuery.data) {
    return (
      <PageLayout>
        <Header title="Token info" back />
        <ErrorState onAction={() => void pairQuery.refetch()} />
      </PageLayout>
    );
  }

  const pair = pairQuery.data;
  const positive = pair.change24h >= 0;
  return (
    <PageLayout>
      <Header title={`${pair.baseAsset} info`} subtitle="Market pair contract" back />
      <PageContent gap="default">
        <TrCard variant="hero" className="p-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${pair.logoColor}22` }}
            >
              <span style={{ color: pair.logoColor, fontSize: 16, fontWeight: 700 }}>
                {pair.baseAsset.slice(0, 3)}
              </span>
            </span>
            <div className="flex-1">
              <p style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>{pair.symbol}</p>
              <p style={{ color: colors.text3, fontSize: 11 }}>
                {pair.category} · {pair.quoteAsset} market
              </p>
            </div>
            <div className="text-right">
              <p
                style={{
                  color: colors.text1,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {fmtPrice(pair.price)}
              </p>
              <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 700 }}>
                {positive ? (
                  <ArrowUpRight size={12} className="inline" />
                ) : (
                  <ArrowDownRight size={12} className="inline" />
                )}{' '}
                {fmtPct(Math.abs(pair.change24h))}
              </p>
            </div>
          </div>
          <div className="mt-4" style={{ height: 100 }}>
            <SparklineChart data={pair.sparklineData} isPositive={positive} />
          </div>
          <button
            onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
            className="w-full mt-3 rounded-xl py-3"
            style={{ background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 700 }}
          >
            Giao dịch {pair.symbol}
          </button>
        </TrCard>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Market cap"
            value={fmtCompact(pair.marketCap, { prefix: '$' })}
            icon={BarChart3}
          />
          <Metric
            label="Volume 24h"
            value={fmtCompact(pair.volume24h, { prefix: '$' })}
            icon={Shield}
          />
          <Metric
            label="Cao nhất 24h"
            value={fmtPrice(pair.high24h)}
            icon={ArrowUpRight}
            color="#10B981"
          />
          <Metric
            label="Thấp nhất 24h"
            value={fmtPrice(pair.low24h)}
            icon={ArrowDownRight}
            color="#EF4444"
          />
        </div>

        <PageSection label="Thông tin thị trường" accentColor="#3B82F6">
          <TrCard className="px-4">
            <InfoRow label="Base asset" value={pair.baseAsset} />
            <InfoRow label="Quote asset" value={pair.quoteAsset} />
            <InfoRow label="Category" value={pair.category} />
            <InfoRow
              label="Mức thay đổi 24h"
              value={`${positive ? '+' : ''}${fmtPct(pair.change24h)}`}
              color={positive ? '#10B981' : '#EF4444'}
            />
          </TrCard>
        </PageSection>

        <TrCard className="p-4">
          <div className="flex items-center gap-2">
            <Globe size={16} color="#3B82F6" />
            <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
              Nguồn dữ liệu
            </span>
          </div>
          <p className="mt-2" style={{ color: colors.text3, fontSize: 11, lineHeight: 1.6 }}>
            Dữ liệu hiển thị được lấy từ market API contract và được runtime-validate trước khi
            render.
          </p>
          <a
            href={`${prefix}/markets`}
            className="mt-3 inline-flex items-center gap-1"
            style={{ color: '#3B82F6', fontSize: 11 }}
          >
            Xem toàn bộ thị trường <ExternalLink size={12} />
          </a>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  color?: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <Icon size={15} color={color ?? colors.text3} />
      <p className="mt-2" style={{ color: colors.text3, fontSize: 10 }}>
        {label}
      </p>
      <p
        style={{
          color: color ?? colors.text1,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </p>
    </TrCard>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useThemeColors();
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
    >
      <span style={{ color: colors.text3, fontSize: 11 }}>{label}</span>
      <span
        style={{
          color: color ?? colors.text1,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}
