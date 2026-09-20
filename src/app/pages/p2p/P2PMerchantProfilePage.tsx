import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { P2P_MERCHANTS, P2P_ADS, P2P_REVIEWS } from '../../data/mockData';
import { fmtVnd, fmtAmount, fmtCompact } from '../../data/formatNumber';
import { φ, φIcon, φAvatar, φRadius } from '../../utils/golden';
import {
  Star, Shield, Clock, TrendingUp, ChevronRight, Flag, UserPlus, UserMinus,
  CheckCircle, XCircle, Ban, ThumbsUp, ThumbsDown, Zap, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrCard } from '../../components/ui/TrCard';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

export function P2PMerchantProfilePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const { merchantId } = useParams<{ merchantId: string }>();

  const merchant = P2P_MERCHANTS.find(m => m.id === merchantId) ?? P2P_MERCHANTS[0];
  const merchantAds = P2P_ADS.filter(a => a.merchant === merchant.name).slice(0, 3);
  const merchantReviews = P2P_REVIEWS.slice(0, 4);

  const [tab, setTab] = useState<'ads' | 'reviews'>('ads');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);


  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onBlockSheetOpen } = useSheetAnalytics('p2p-merchant-block-confirm');

  return (
    <PageLayout>
      <Header title="Hồ sơ Merchant" subtitle="Merchant · P2P" back />

      <PageContent>
      {/* Profile Header */}
      <div className="pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="rounded-full flex items-center justify-center"
              style={{ width: φAvatar.lg, height: φAvatar.lg, background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
              <span style={{ color: '#fff', fontSize: φ.lg, fontWeight: 700 }}>{merchant.name.charAt(0)}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
              style={{ background: merchant.isOnline ? '#10B981' : '#6B7280', borderColor: c.bg }}>
              {merchant.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{merchant.name}</span>
              {merchant.kycVerified && <Shield size={φIcon.sm} color="#3B82F6" fill="rgba(59,130,246,0.2)" />}
            </div>
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: merchant.level }).map((_, i) => (
                <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />
              ))}
              <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>Lv.{merchant.level}</span>
            </div>
            <p style={{ color: merchant.isOnline ? '#10B981' : c.text3, fontSize: φ.xs }}>
              {merchant.isOnline ? 'Đang hoạt động' : merchant.lastActive}
            </p>
            <p style={{ color: c.text3, fontSize: 10 }}>
              <Calendar size={9} className="inline mr-0.5" />Tham gia: {new Date(merchant.joinDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { setIsFollowing(!isFollowing); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
            style={{
              background: isFollowing ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, #3B82F6, #1d4ed8)',
              color: isFollowing ? '#3B82F6' : '#fff',
              border: isFollowing ? '1px solid rgba(59,130,246,0.3)' : 'none',
            }}>
            {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
          </button>
          <button onClick={() => navigate(`${prefix}/p2p/report/${merchantId}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Flag size={14} /> Báo cáo
          </button>
          <button onClick={() => { setShowBlockConfirm(true); hapticSelection(); }}
            className="w-10 flex items-center justify-center rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <Ban size={14} color={c.text3} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Tỷ lệ hoàn thành', value: `${merchant.completionRate}%`, color: '#10B981', icon: CheckCircle },
          { label: 'Tổng GD', value: merchant.totalTrades.toLocaleString(), color: '#3B82F6', icon: TrendingUp },
          { label: 'KL 30 ngày', value: fmtCompact(merchant.totalVolume30d, { prefix: '$' }), color: '#8B5CF6', icon: Zap },
          { label: 'Thời gian trả', value: merchant.avgReleaseTime, color: '#F59E0B', icon: Clock },
        ].map(s => (
          <TrCard key={s.label} rounded="sm" className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={12} color={s.color} />
              <span style={{ color: c.text3, fontSize: 10 }}>{s.label}</span>
            </div>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{s.value}</p>
          </TrCard>
        ))}
      </div>

      {/* Reputation bar */}
      <div className="mb-4">
        <TrCard rounded="sm" className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Đánh giá tích cực</span>
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>{merchant.positiveRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
            <div className="h-full rounded-full" style={{ width: `${merchant.positiveRate}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ color: c.text3, fontSize: 10 }}>
              <ThumbsUp size={9} className="inline mr-0.5" />{Math.round(merchant.totalTrades * merchant.positiveRate / 100)} tích cực
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>
              <ThumbsDown size={9} className="inline mr-0.5" />{merchant.negativeCount} tiêu cực
            </span>
          </div>
        </TrCard>
      </div>

      {/* Tabs */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'ads', label: `Quảng cáo (${merchantAds.length})` },
          { id: 'reviews', label: `Đánh giá (${merchantReviews.length})` },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />

      {/* Tab Content */}
      <div
        key={tab}
        className="flex flex-col gap-3"
      >
          {tab === 'ads' && merchantAds.map((ad, idx) => (
            <div
              key={ad.id}
            >
              <TrCard rounded="sm" className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: ad.type === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: ad.type === 'sell' ? '#EF4444' : '#10B981' }}>
                      {ad.type === 'sell' ? 'BÁN' : 'MUA'}
                    </span>
                    <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{ad.asset}</span>
                  </div>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtVnd(ad.price)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: c.text3 }}>Khả dụng: {fmtAmount(ad.available)} {ad.asset}</span>
                  <span style={{ color: c.text3 }}>Giới hạn: {fmtVnd(ad.minLimit)} - {fmtVnd(ad.maxLimit)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {ad.paymentMethods.map(pm => (
                    <span key={pm} className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: c.chipBg, color: c.chipText, fontSize: 9 }}>{pm}</span>
                  ))}
                </div>
                <button onClick={() => navigate(`${prefix}/p2p/ad/${ad.id}`)}
                  className="w-full mt-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: ad.type === 'sell' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ad.type === 'sell' ? '#10B981' : '#EF4444', border: `1px solid ${ad.type === 'sell' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  {ad.type === 'sell' ? 'Mua ngay' : 'Bán ngay'}
                  <ChevronRight size={12} className="inline ml-1" />
                </button>
              </TrCard>
            </div>
          ))}

          {tab === 'ads' && merchantAds.length === 0 && (
            <div
              className="flex flex-col items-center py-12 gap-2"
            >
              <XCircle size={32} color={c.text3} />
              <p style={{ color: c.text3, fontSize: φ.sm }}>Chưa có quảng cáo nào</p>
            </div>
          )}

          {tab === 'reviews' && merchantReviews.map((review, idx) => (
            <div
              key={review.id}
            >
              <TrCard rounded="sm" className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
                      <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{review.fromUser.charAt(0)}</span>
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{review.fromUser}</p>
                      <p style={{ color: c.text3, fontSize: 9 }}>{review.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </div>
                </div>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{review.comment}</p>
                {review.type && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: review.type === 'positive' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: review.type === 'positive' ? '#10B981' : '#EF4444', fontSize: 9 }}>
                      {review.type === 'positive' ? '👍 Tích cực' : '👎 Tiêu cực'}
                    </span>
                  </div>
                )}
              </TrCard>
            </div>
          ))}
        </div>
      </PageContent>

      {/* Block Confirmation Dialog */}
      <ConfirmationDialog
        open={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={() => { navigate(`${prefix}/p2p/blacklist/add`); hapticSuccess(); }}
        variant="warning"
        icon={<Ban size={24} color="#F59E0B" />}
        title={`Chặn ${merchant.name}?`}
        description="Bạn sẽ không thể giao dịch với người này. Có thể bỏ chặn trong danh sách chặn."
        confirmText="Chặn"
        onAfterOpen={onBlockSheetOpen}
      />
    </PageLayout>
  );
}