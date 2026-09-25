import { Calendar, CheckCircle, Clock3, Flag, Shield, Star, TrendingUp, UserX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useP2PBlacklistCreateMutation } from '../model/p2p-blacklist-queries';
import { useP2PMerchantProfileQuery } from '../model/p2p-trust-queries';

export function P2PMerchantProfilePage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { merchantId } = useParams<{ merchantId: string }>();
  const { hasPermission } = useAuth();
  const canManageBlacklist = hasPermission('p2p:write') || hasPermission('p2p:blacklist:write');
  const query = useP2PMerchantProfileQuery(merchantId);
  const blockMutation = useP2PBlacklistCreateMutation();
  const [tab, setTab] = useState<'ads' | 'reviews'>('ads');
  const profile = query.data;

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Hồ sơ Merchant" subtitle="Merchant · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải hồ sơ…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !profile) {
    return (
      <PageLayout>
        <Header title="Hồ sơ Merchant" subtitle="Merchant · P2P" back />
        <ErrorState
          title="Không thể tải hồ sơ merchant"
          actionLabel="Thử lại"
          onAction={() => void query.refetch()}
        />
      </PageLayout>
    );
  }

  const { merchant, ads, reviews } = profile;
  const block = async () => {
    if (!canManageBlacklist || blockMutation.isPending) return;
    await blockMutation.mutateAsync({
      request: {
        username: merchant.name,
        reason: 'other',
        note: `Blocked merchant ${merchant.id}`,
      },
      idempotencyKey: `p2p-block-${merchant.id}-${Date.now()}`,
    });
  };

  return (
    <PageLayout>
      <Header title="Hồ sơ Merchant" subtitle="Merchant · P2P" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
                {merchant.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p style={{ color: colors.text1, fontSize: 15, fontWeight: 700 }}>
                  {merchant.name}
                </p>
                {merchant.kycVerified && <Shield size={14} color="#3B82F6" />}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: merchant.level }).map((_, index) => (
                  <Star key={index} size={11} color="#F59E0B" fill="#F59E0B" />
                ))}
                <span style={{ color: colors.text3, fontSize: 10 }}>Lv.{merchant.level}</span>
              </div>
              <p
                style={{
                  color: merchant.isOnline ? '#10B981' : colors.text3,
                  fontSize: 10,
                  marginTop: 4,
                }}
              >
                {merchant.isOnline ? 'Đang hoạt động' : merchant.lastActive}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => navigate(`${prefix}/p2p/report/${merchant.id}`)}
              aria-label="Report P2P merchant"
              className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2"
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#EF4444',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Flag size={14} /> Báo cáo
            </button>
            <button
              type="button"
              onClick={() => void block()}
              aria-label="Block P2P merchant"
              disabled={!canManageBlacklist || blockMutation.isPending}
              className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2"
              style={{
                background: colors.surface2,
                color: colors.text2,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <UserX size={14} /> {blockMutation.isPending ? 'Đang chặn…' : 'Chặn'}
            </button>
          </div>
          {blockMutation.isError && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 11, marginTop: 8 }}>
              Không thể chặn merchant. Vui lòng thử lại.
            </p>
          )}
          {!canManageBlacklist && (
            <p role="alert" style={{ color: '#EF4444', fontSize: 11, marginTop: 8 }}>
              P2P blacklist write permission is required to block a merchant.
            </p>
          )}
          {blockMutation.isSuccess && (
            <p role="status" style={{ color: '#10B981', fontSize: 11, marginTop: 8 }}>
              Đã chặn merchant khỏi giao dịch mới.
            </p>
          )}
        </TrCard>

        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Tỷ lệ hoàn tất"
            value={`${merchant.completionRate}%`}
            icon={CheckCircle}
            color="#10B981"
          />
          <Stat
            label="Tổng giao dịch"
            value={merchant.totalTrades.toLocaleString('vi-VN')}
            icon={TrendingUp}
            color="#3B82F6"
          />
          <Stat
            label="Thời gian release"
            value={merchant.avgReleaseTime}
            icon={Clock3}
            color="#F59E0B"
          />
          <Stat
            label="Tham gia"
            value={new Date(merchant.joinDate).toLocaleDateString('vi-VN')}
            icon={Calendar}
            color="#8B5CF6"
          />
        </div>

        <div className="flex gap-2 p-1 rounded-xl" style={{ background: colors.surface2 }}>
          {(['ads', 'reviews'] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setTab(value)}
              className="flex-1 rounded-lg py-2"
              style={{
                background: tab === value ? colors.surface : 'transparent',
                color: tab === value ? colors.text1 : colors.text3,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {value === 'ads' ? `Quảng cáo (${ads.length})` : `Đánh giá (${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'ads'
          ? ads.map((ad) => (
              <TrCard key={ad.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: ad.type === 'sell' ? '#EF4444' : '#10B981',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {ad.type === 'sell' ? 'BÁN' : 'MUA'} {ad.asset}
                  </span>
                  <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                    {ad.price.toLocaleString('vi-VN')} {ad.currency}
                  </span>
                </div>
                <p style={{ color: colors.text3, fontSize: 10, marginTop: 6 }}>
                  {ad.paymentMethods.join(' · ')} · {ad.minLimit.toLocaleString('vi-VN')}–
                  {ad.maxLimit.toLocaleString('vi-VN')} {ad.currency}
                </p>
              </TrCard>
            ))
          : reviews.map((review) => (
              <TrCard key={review.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.text1, fontSize: 12, fontWeight: 700 }}>
                    {review.fromUser}
                  </span>
                  <span style={{ color: '#F59E0B', fontSize: 12 }}>
                    {'★'.repeat(review.rating)}
                  </span>
                </div>
                <p style={{ color: colors.text2, fontSize: 11, marginTop: 6 }}>{review.comment}</p>
                <p style={{ color: colors.text3, fontSize: 10, marginTop: 5 }}>
                  {review.createdAt}
                </p>
              </TrCard>
            ))}
      </PageContent>
    </PageLayout>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof CheckCircle;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <div className="flex items-center gap-2">
        <Icon size={13} color={color} />
        <span style={{ color: colors.text3, fontSize: 10 }}>{label}</span>
      </div>
      <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700, marginTop: 6 }}>{value}</p>
    </TrCard>
  );
}
