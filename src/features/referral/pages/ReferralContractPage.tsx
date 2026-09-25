import { useState } from 'react';
import { CheckCircle2, Copy, Gift, Users } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { ErrorState } from '@/shared/ui/ErrorState';
import { TrCard } from '@/shared/ui/TrCard';
import { useReferralOverviewQuery } from '../model/referral-queries';

export function ReferralContractPage() {
  const colors = useThemeColors();
  const query = useReferralOverviewQuery();
  const [copied, setCopied] = useState(false);
  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Referral" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu Referral API…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const overview = query.data;
  const referralLink = `https://vittrade.app/ref/${overview.referralCode}`;
  const copyLink = async () => {
    await navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };
  return (
    <PageLayout>
      <Header title="Referral" subtitle="Invite friends and earn commission" back />
      <PageContent gap="default">
        <TrCard className="p-4" style={{ borderColor: `${overview.currentTier.color}40` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: `${overview.currentTier.color}20` }}
            >
              <Gift size={21} color={overview.currentTier.color} />
            </div>
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Current tier</p>
              <h1 style={{ color: overview.currentTier.color, fontSize: 18, fontWeight: 700 }}>
                {overview.currentTier.icon} {overview.currentTier.name}
              </h1>
            </div>
          </div>
          <div
            className="mt-4 flex items-center gap-2 rounded-xl px-3"
            style={{ background: colors.surface2 }}
          >
            <span
              className="min-w-0 flex-1 truncate py-3"
              style={{ color: colors.text2, fontSize: 12 }}
            >
              {referralLink}
            </span>
            <button type="button" onClick={() => void copyLink()} style={{ color: colors.primary }}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </TrCard>
        <TrCard className="p-4" style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C)' }}>
          <p style={{ color: '#FED7AA', fontSize: 11 }}>{overview.campaign.bonusLabel}</p>
          <h2 className="mt-1" style={{ color: '#FFF7ED', fontSize: 17, fontWeight: 700 }}>
            {overview.campaign.title}
          </h2>
          <p className="mt-2" style={{ color: '#FED7AA', fontSize: 12 }}>
            {overview.campaign.description}
          </p>
          <p className="mt-3" style={{ color: '#FB923C', fontSize: 11 }}>
            {overview.campaign.daysLeft} days left ·{' '}
            {overview.campaign.totalParticipants.toLocaleString()} participants
          </p>
        </TrCard>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Friends" value={overview.stats.totalFriends} />
          <Stat label="Active" value={overview.stats.activeFriends} />
          <Stat label="Commission" value={`$${overview.stats.totalCommission.toFixed(2)}`} />
          <Stat label="Volume" value={`$${overview.stats.totalVolume.toLocaleString()}`} />
        </div>
        <section className="grid gap-2">
          <div className="flex items-center justify-between">
            <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>Friends</h2>
            <span style={{ color: colors.text3, fontSize: 11 }}>{overview.friends.length}</span>
          </div>
          {overview.friends.map((friend) => (
            <TrCard key={friend.id} className="p-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: colors.surface2 }}
                >
                  {friend.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p style={{ color: colors.text1, fontSize: 12, fontWeight: 600 }}>
                    {friend.name}
                  </p>
                  <p style={{ color: colors.text3, fontSize: 10 }}>
                    {friend.joinedDate} · {friend.status}
                  </p>
                </div>
                <span style={{ color: colors.buy, fontSize: 11 }}>
                  ${friend.totalCommission.toFixed(2)}
                </span>
              </div>
            </TrCard>
          ))}
        </section>
      </PageContent>
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <Users size={14} color={colors.primary} />
      <strong className="mt-1 block" style={{ color: colors.text1 }}>
        {value}
      </strong>
      <span style={{ color: colors.text3, fontSize: 10 }}>{label}</span>
    </TrCard>
  );
}
