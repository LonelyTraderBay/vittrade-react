import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { Star, CheckCircle, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_ORDER, P2P_ORDERS } from '../../data/mockData';
import { fmtVnd, fmtAmount } from '../../data/formatNumber';
import { φ } from '../../utils/golden';

const QUICK_TAGS = [
  { label: 'Giao dịch nhanh', icon: '⚡' },
  { label: 'Thân thiện', icon: '😊' },
  { label: 'Đáng tin cậy', icon: '🛡️' },
  { label: 'Giá tốt', icon: '💰' },
  { label: 'Phản hồi chậm', icon: '🐌' },
  { label: 'Cần cải thiện', icon: '📝' },
];

export function P2POrderRatePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const { orderId } = useParams();
  const order = (orderId ? P2P_ORDERS.find(o => o.id === orderId) : null) || P2P_ORDER;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    hapticSelection();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <PageLayout>
        <Header title="Đánh giá" subtitle="Đánh giá · P2P" back />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle size={40} color="#10B981" />
          </div>
          <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Cảm ơn bạn!</p>
          <p style={{ color: c.text2, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
            Đánh giá của bạn giúp cộng đồng giao dịch an toàn hơn.
          </p>
          <CTAButton onClick={() => navigate(`${prefix}/p2p`, { replace: true })} variant="success">
            Quay lại P2P
          </CTAButton>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Đánh giá giao dịch" subtitle="Đánh giá · P2P" back />

      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {/* Merchant Avatar */}
        <div className="flex flex-col items-center gap-3 py-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{order.merchant.charAt(0)}</span>
          </div>
          <div className="text-center">
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{order.merchant}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>
              {order.type === 'buy' ? 'Mua' : 'Bán'} {fmtAmount(order.amount)} {order.asset} · {fmtVnd(order.total)}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <TrCard className="p-5">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
            Bạn đánh giá merchant này thế nào?
          </p>
          <div className="flex justify-center gap-4 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => { setRating(s); hapticSelection(); }}
                className="transition-transform"
                style={{ transform: s <= rating ? 'scale(1.15)' : 'scale(1)' }}>
                <Star size={40} fill={s <= rating ? '#F59E0B' : 'transparent'} color={s <= rating ? '#F59E0B' : c.borderSolid} strokeWidth={1.5} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
              {rating === 5 ? 'Xuất sắc!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Tốt' : rating === 2 ? 'Tạm được' : 'Không hài lòng'}
            </p>
          )}
        </TrCard>

        {/* Quick Tags */}
        {rating > 0 && (
          <div>
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Nhận xét nhanh</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => {
                const selected = selectedTags.includes(tag.label);
                return (
                  <button key={tag.label} onClick={() => toggleTag(tag.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{
                      background: selected ? 'rgba(245,158,11,0.12)' : c.surface2,
                      border: `1.5px solid ${selected ? 'rgba(245,158,11,0.4)' : c.borderSolid}`,
                      color: selected ? '#D97706' : c.text2,
                      fontSize: 12, fontWeight: selected ? 700 : 500,
                    }}>
                    <span>{tag.icon}</span> {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Review Text */}
        {rating > 0 && (
          <div>
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Nhận xét chi tiết (tùy chọn)</p>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Chia sẻ trải nghiệm giao dịch..."
              rows={4}
              className="w-full rounded-2xl px-4 py-3"
              style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 }}
            />
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-3">
          <CTAButton onClick={() => navigate(-1)} variant="ghost" bg={c.surface2} textColor={c.text2}
            fullWidth={false} className="flex-1" style={{ border: `1px solid ${c.borderSolid}`, boxShadow: 'none' }}>
            Bỏ qua
          </CTAButton>
          <CTAButton onClick={handleSubmit} disabled={rating === 0} loading={isSubmitting}
            fullWidth={false} className="flex-1"
            style={{ background: rating > 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : undefined }}>
            <div className="flex items-center gap-2">
              <Send size={14} />
              Gửi đánh giá
            </div>
          </CTAButton>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </PageLayout>
  );
}