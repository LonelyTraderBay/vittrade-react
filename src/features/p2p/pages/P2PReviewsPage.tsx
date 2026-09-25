import { useState } from 'react';
import { MessageCircle, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TabBar } from '@/shared/ui/TabBar';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2PReviewsQuery } from '../model/p2p-trust-queries';
import type { P2PReviewScope } from '../model/p2p-types';

export function P2PReviewsPage() {
  const colors = useThemeColors();
  const [scope, setScope] = useState<P2PReviewScope>('received');
  const query = useP2PReviewsQuery(scope);
  const reviews = query.data?.items ?? [];
  const average = query.data?.averageRating ?? 0;

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Đánh giá P2P" subtitle="Đánh giá · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải đánh giá…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError) {
    return (
      <PageLayout>
        <Header title="Đánh giá P2P" subtitle="Đánh giá · P2P" back />
        <ErrorState
          title="Không thể tải đánh giá P2P"
          actionLabel="Thử lại"
          onAction={() => void query.refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Đánh giá P2P" subtitle="Đánh giá · P2P" back />
      <PageContent gap="default">
        <TrCard className="p-5">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div style={{ color: '#F59E0B', fontSize: 36, fontWeight: 700 }}>
                {average.toFixed(1)}
              </div>
              <div
                className="flex justify-center gap-0.5 mt-1"
                aria-label={`${average} trên 5 sao`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={12}
                    fill={index < Math.round(average) ? '#F59E0B' : colors.surface2}
                    color={index < Math.round(average) ? '#F59E0B' : colors.surface2}
                  />
                ))}
              </div>
              <span style={{ color: colors.text3, fontSize: 11 }}>{reviews.length} đánh giá</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <SummaryLine
                icon={<ThumbsUp size={14} color="#10B981" />}
                label="Tích cực"
                value={query.data?.positiveCount ?? 0}
                color="#10B981"
              />
              <SummaryLine
                icon={<ThumbsDown size={14} color="#EF4444" />}
                label="Tiêu cực"
                value={query.data?.negativeCount ?? 0}
                color="#EF4444"
              />
            </div>
          </div>
        </TrCard>

        <TabBar
          variant="segment"
          tabs={[
            { id: 'received', label: 'Nhận được' },
            { id: 'given', label: 'Đã viết' },
          ]}
          active={scope}
          onChange={(value) => setScope(value as P2PReviewScope)}
        />

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <MessageCircle size={36} color={colors.borderSolid} />
            <p
              role="status"
              aria-label="No P2P reviews"
              style={{ color: colors.text3, fontSize: 13 }}
            >
              Chưa có đánh giá nào
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <TrCard key={review.id} rounded="sm" className="p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p style={{ color: colors.text1, fontSize: 13, fontWeight: 600 }}>
                      {scope === 'received' ? review.fromUser : review.toUser}
                    </p>
                    <p style={{ color: colors.text3, fontSize: 10 }}>Đơn #{review.orderId}</p>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`${review.rating} sao`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={11}
                        fill={index < review.rating ? '#F59E0B' : colors.surface2}
                        color={index < review.rating ? '#F59E0B' : colors.surface2}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ color: colors.text2, fontSize: 13, lineHeight: 1.5 }}>
                  {review.comment}
                </p>
                {review.reply && (
                  <p
                    className="mt-2 pl-3"
                    style={{ color: colors.text3, fontSize: 11, borderLeft: '2px solid #3B82F6' }}
                  >
                    Phản hồi: {review.reply}
                  </p>
                )}
                <p style={{ color: colors.text3, fontSize: 10, marginTop: 8 }}>
                  {review.createdAt}
                </p>
              </TrCard>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function SummaryLine({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span style={{ color, fontSize: 13, fontWeight: 700 }}>{value}</span>
      <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{label}</span>
    </div>
  );
}
