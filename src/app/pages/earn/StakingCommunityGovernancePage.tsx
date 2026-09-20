import React from 'react';
import { Vote, Users, TrendingUp, Shield, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useNavigate } from 'react-router';

const GOVERNANCE_STATS = {
  totalHolders: 125000,
  activeVoters: 45000,
  participationRate: 36,
  totalProposals: 127,
  passedProposals: 89,
};

const RECENT_DECISIONS = [
  { proposal: 'Reduce ETH staking fees from 2% to 1.5%', status: 'passed', votes: 89234, date: '2026-02-15' },
  { proposal: 'Add Polygon validator support', status: 'passed', votes: 67821, date: '2026-01-20' },
  { proposal: 'Increase insurance fund contribution to 3%', status: 'passed', votes: 54123, date: '2025-12-10' },
];

export function StakingCommunityGovernancePage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header title="Governance" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Vote size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Community-Driven Decisions
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Stakers vote on fee structures, new asset support, insurance fund policies, and platform improvements. Your stake = your voting power.
              </p>
            </div>
          </div>
        </div>

        {/* Governance Stats */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Governance Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <Users size={20} color={c.text3} className="mb-2" />
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                {GOVERNANCE_STATS.totalHolders.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Token Holders</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <Vote size={20} color="#8B5CF6" className="mb-2" />
              <p style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 700 }}>
                {GOVERNANCE_STATS.activeVoters.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Active Voters</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <TrendingUp size={20} color={c.text3} className="mb-2" />
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                {GOVERNANCE_STATS.participationRate}%
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Participation Rate</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <CheckCircle2 size={20} color="#10B981" className="mb-2" />
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                {GOVERNANCE_STATS.passedProposals}/{GOVERNANCE_STATS.totalProposals}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Proposals Passed</p>
            </div>
          </div>
        </TrCard>

        {/* Active Proposals */}
        <PageSection label="Active Proposals">
          <TrCard hover className="p-4" onClick={() => navigate('/earn/proposals')}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                View All Active Proposals
              </p>
              <span className="px-2 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                3 Active
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 12 }}>
              Vote on platform fees, new features, and policy changes
            </p>
          </TrCard>
        </PageSection>

        {/* Recent Decisions */}
        <PageSection label="Recent Decisions">
          <div className="flex flex-col gap-2">
            {RECENT_DECISIONS.map((decision, idx) => (
              <TrCard key={idx} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {decision.proposal}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      {decision.votes.toLocaleString()} votes • {new Date(decision.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-xs font-bold shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    Passed
                  </span>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* How It Works */}
        <PageSection label="How Governance Works">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { step: 1, title: 'Proposal Creation', desc: 'Community members with ≥10,000 tokens can create proposals' },
                { step: 2, title: 'Discussion Period', desc: '7-day discussion on forum before voting opens' },
                { step: 3, title: 'Voting Period', desc: '14-day voting window. 1 token = 1 vote' },
                { step: 4, title: 'Execution', desc: 'Passed proposals (>50% approval, >10% quorum) executed within 7 days' },
              ].map(item => (
                <div key={item.step} className="flex gap-3 pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#8B5CF6', color: '#FFF', fontSize: 14, fontWeight: 700 }}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {item.title}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Your Voting Power */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Shield size={24} color="#8B5CF6" />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                Your Voting Power
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Based on your staked tokens. Stake more to increase influence.
              </p>
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <div className="flex items-baseline gap-2">
              <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
                12,500
              </p>
              <p style={{ color: c.text3, fontSize: 12 }}>votes (1.25% of total)</p>
            </div>
          </div>
        </TrCard>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/earn/proposals')}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            View Active Proposals
          </button>
          <button
            onClick={() => navigate('/earn/forum')}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.surface2, color: c.text1 }}>
            Join Governance Forum
          </button>
        </div>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Governance is on-chain and transparent. All votes are recorded on Ethereum. Proposal outcomes are binding and executed via smart contracts.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
