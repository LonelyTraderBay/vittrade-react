import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { P2P_REVIEWS } from '../../data/mockData';
import { φ, φIcon, φRadius } from '../../utils/golden';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, ChevronRight } from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';

export function P2PReviewsPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [tab, setTab] = useState<'received' | 'given'>('received');

  const receivedReviews = P2P_REVIEWS.filter(r => r.toUserId === 'user001');
  const givenReviews = P2P_REVIEWS.filter(r => r.fromUserId === 'user001');
  const currentReviews = tab === 'received' ? receivedReviews : givenReviews;

  const positiveCount = currentReviews.filter(r => r.type === 'positive').length;
  const negativeCount = currentReviews.filter(r => r.type === 'negative').length;
  const avgRating = currentReviews.length > 0
    ? (currentReviews.reduce((s, r) => s + r.rating, 0) / currentReviews.length).toFixed(1)
    : '0.0';

  return (
    <PageLayout>
      <Header title="Đánh giá P2P" subtitle="Đánh giá · P2P" back />

      <PageContent>
      {/* Summary Card */}
      <TrCard className="p-5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span style={{ color: '#F59E0B', fontSize: 36, fontWeight: 700 }}>{avgRating}</span>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={12} fill={i < Math.round(parseFloat(avgRating)) ? '#F59E0B' : c.surface2}
                  color={i < Math.round(parseFloat(avgRating)) ? '#F59E0B' : c.surface2} />
              ))}
            </div>
            <span style={{ color: c.text3, fontSize: φ.xs, marginTop: 4 }}>{currentReviews.length} đánh giá</span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = currentReviews.filter(r => r.rating === star).length;
              const pct = currentReviews.length > 0 ? (count / currentReviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: 10, width: 12 }}>{star}</span>
                  <Star size={8} fill="#F59E0B" color="#F59E0B" />
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#F59E0B' }} />
                  </div>
                  <span style={{ color: c.text3, fontSize: 10, width: 16, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-2">
            <ThumbsUp size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>{positiveCount}</span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>tích cực</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsDown size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>{negativeCount}</span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>tiêu cực</span>
          </div>
        </div>
      </TrCard>

      {/* Tabs */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'received', label: 'Nhận được' },
          { id: 'given', label: 'Đã viết' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />

      {/* Review List */}
      <div className="flex flex-col gap-3">
        {currentReviews.map(review => (
          <TrCard key={review.id} rounded="sm" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
                    {(tab === 'received' ? review.fromUser : review.toUser).charAt(0)}
                  </span>
                </div>
                <div>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    {tab === 'received' ? review.fromUser : review.toUser}
                  </span>
                  <p style={{ color: c.text3, fontSize: 10 }}>Đơn #{review.orderId}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {review.type === 'positive'
                  ? <ThumbsUp size={12} color="#10B981" />
                  : <ThumbsDown size={12} color="#EF4444" />}
                <div className="flex gap-0.5 ml-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={10} fill={i < review.rating ? '#F59E0B' : c.surface2}
                      color={i < review.rating ? '#F59E0B' : c.surface2} />
                  ))}
                </div>
              </div>
            </div>
            <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>{review.comment}</p>
            {review.reply && (
              <div className="mt-2 ml-4 pl-3 py-2" style={{ borderLeft: `2px solid rgba(59,130,246,0.3)` }}>
                <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                  <span style={{ color: '#3B82F6', fontWeight: 600 }}>Phản hồi:</span> {review.reply}
                </p>
              </div>
            )}
            <p style={{ color: c.text3, fontSize: 10, marginTop: 6 }}>{review.createdAt}</p>
          </TrCard>
        ))}

        {currentReviews.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <MessageCircle size={36} color={c.borderSolid} />
            <p style={{ color: c.text3, fontSize: φ.sm }}>Chưa có đánh giá nào</p>
          </div>
        )}
      </div>
      </PageContent>
    </PageLayout>
  );
}