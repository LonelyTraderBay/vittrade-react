import React, { useState } from 'react';
import { Vote, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { toast } from 'sonner';

export function StakingVotingPage() {
  const c = useThemeColors();
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);

  const handleVote = () => {
    if (!vote) return;
    toast.success(`Voted ${vote.toUpperCase()}!`);
  };

  return (
    <PageLayout variant="flush">
      <Header title="Proposal #127" back />

      <PageContent grow padding="relaxed">
        <TrCard className="p-4">
          <span className="px-2 py-1 rounded-md text-xs inline-block mb-3" style={{ background: c.surface2, color: c.text3 }}>
            Fees
          </span>
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Lower ETH Staking Fees from 1.5% to 1%
          </p>
          <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            This proposal aims to reduce platform fees for ETH staking from 1.5% to 1% to remain competitive with other platforms. Revenue impact: -$500K/year, offset by higher volume.
          </p>

          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Proposed By</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>CommunityDAO</p>
          </div>
        </TrCard>

        <PageSection label="Current Results">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Yes (70%)</span>
                  <span style={{ color: c.text3, fontSize: 12 }}>42,000 votes</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#10B981' }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>No (30%)</span>
                  <span style={{ color: c.text3, fontSize: 12 }}>18,000 votes</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#EF4444', width: '30%' }} />
              </div>
            </div>
          </TrCard>
        </PageSection>

        <PageSection label="Cast Your Vote">
          <div className="grid grid-cols-2 gap-3">
            <TrCard
              hover
              className="p-4"
              onClick={() => setVote('yes')}
              style={{ border: vote === 'yes' ? `2px solid #10B981` : undefined }}>
              <ThumbsUp size={24} color={vote === 'yes' ? '#10B981' : c.text3} className="mx-auto mb-2" />
              <p style={{ color: vote === 'yes' ? '#10B981' : c.text1, fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Yes
              </p>
            </TrCard>
            <TrCard
              hover
              className="p-4"
              onClick={() => setVote('no')}
              style={{ border: vote === 'no' ? `2px solid #EF4444` : undefined }}>
              <ThumbsDown size={24} color={vote === 'no' ? '#EF4444' : c.text3} className="mx-auto mb-2" />
              <p style={{ color: vote === 'no' ? '#EF4444' : c.text1, fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                No
              </p>
            </TrCard>
          </div>
        </PageSection>

        <TrCard className="p-3">
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            💡 Your voting power: <strong>12,500 votes</strong> (based on staked tokens). Votes are final and cannot be changed.
          </p>
        </TrCard>
      </PageContent>

      <StickyFooter>
        <button
          onClick={handleVote}
          disabled={!vote}
          className="w-full py-3 rounded-[14px] text-sm font-semibold"
          style={{
            background: vote ? c.primary : c.surface2,
            color: vote ? '#FFF' : c.text3,
            opacity: vote ? 1 : 0.5,
          }}>
          Submit Vote
        </button>
      </StickyFooter>
    </PageLayout>
  );
}
