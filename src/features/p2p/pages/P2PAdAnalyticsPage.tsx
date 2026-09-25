import { BarChart3, CheckCircle, Clock3, Eye, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2PAdAnalyticsQuery, useP2PAdQuery } from '../model/p2p-ad-queries';

const numberFormat = new Intl.NumberFormat('vi-VN');
const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} color={color} />
        <span style={{ color: colors.text3, fontSize: 10 }}>{label}</span>
      </div>
      <p style={{ color: colors.text1, fontSize: 17, fontWeight: 700, marginTop: 6 }}>{value}</p>
    </TrCard>
  );
}

export function P2PAdAnalyticsPage() {
  const colors = useThemeColors();
  const { id } = useParams<{ id: string }>();
  const analyticsQuery = useP2PAdAnalyticsQuery(id);
  const adQuery = useP2PAdQuery(id);
  const analytics = analyticsQuery.data;
  const ad = adQuery.data;

  if (analyticsQuery.isPending || adQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Phân tích quảng cáo" subtitle="Phân tích · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu phân tích…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (analyticsQuery.isError || adQuery.isError || !analytics || !ad) {
    return (
      <PageLayout>
        <Header title="Phân tích quảng cáo" subtitle="Phân tích · P2P" back />
        <ErrorState
          title="Không thể tải phân tích quảng cáo"
          actionLabel="Thử lại"
          onAction={() => {
            void analyticsQuery.refetch();
            void adQuery.refetch();
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Phân tích quảng cáo" subtitle={`${ad.asset}/${ad.currency} · P2P`} back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                {ad.type === 'sell' ? 'Bán' : 'Mua'} {ad.asset}
              </p>
              <p style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>
                ID quảng cáo: {analytics.adId}
              </p>
            </div>
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
              Hạng #{analytics.ranking}
            </span>
          </div>
        </TrCard>

        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Lượt xem"
            value={numberFormat.format(analytics.impressions)}
            icon={Eye}
            color="#3B82F6"
          />
          <Metric
            label="Đơn hoàn tất"
            value={numberFormat.format(analytics.ordersCompleted)}
            icon={CheckCircle}
            color="#10B981"
          />
          <Metric
            label="Tỷ lệ chuyển đổi"
            value={`${analytics.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            color="#8B5CF6"
          />
          <Metric
            label="Đánh giá"
            value={`${analytics.rating.toFixed(1)} / 5`}
            icon={Star}
            color="#F59E0B"
          />
        </div>

        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} color={colors.primary} />
            <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>Hiệu suất 7 ngày</h2>
          </div>
          <div className="flex flex-col gap-2">
            {analytics.dailyPerformance.map((day) => {
              const maxOrders = Math.max(
                ...analytics.dailyPerformance.map((item) => item.orders),
                1,
              );
              return (
                <div key={day.date} className="flex items-center gap-2">
                  <span style={{ color: colors.text3, width: 42, fontSize: 10 }}>{day.date}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: colors.surface2 }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(day.orders / maxOrders) * 100}%`,
                        background: colors.primary,
                      }}
                    />
                  </div>
                  <span
                    style={{ color: colors.text2, width: 42, textAlign: 'right', fontSize: 10 }}
                  >
                    {day.orders} đơn
                  </span>
                </div>
              );
            })}
          </div>
        </TrCard>

        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Doanh thu"
            value={`${moneyFormat.format(analytics.totalRevenue)} VND`}
            icon={TrendingUp}
            color="#10B981"
          />
          <Metric
            label="Giá trị đơn TB"
            value={`${moneyFormat.format(analytics.avgOrderValue)} VND`}
            icon={ShoppingCart}
            color="#3B82F6"
          />
          <Metric
            label="Phản hồi TB"
            value={`${analytics.avgResponseTime}s`}
            icon={Clock3}
            color="#F59E0B"
          />
          <Metric
            label="Hoàn tất"
            value={`${analytics.completionRate.toFixed(1)}%`}
            icon={CheckCircle}
            color="#10B981"
          />
        </div>

        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Kênh thanh toán
          </h2>
          <div className="flex flex-col gap-2">
            {analytics.paymentBreakdown.map((item) => (
              <div
                key={item.method}
                className="flex items-center justify-between"
                style={{ color: colors.text2, fontSize: 11 }}
              >
                <span>
                  {item.method} · {item.count} đơn
                </span>
                <span>{moneyFormat.format(item.volume)} VND</span>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
