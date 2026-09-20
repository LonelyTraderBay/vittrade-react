import React from 'react';
import { Vote, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useNavigate } from 'react-router';

const PROPOSALS = [
  { id: 'p1', title: 'Lower ETH staking fees to 1%', status: 'active', yesVotes: 42000, noVotes: 18000, quorum: 65, endsIn: '5 days', category: 'Fees' },
  { id: 'p2', title: 'Add support for Avalanche staking', status: 'active', yesVotes: 38000, noVotes: 22000, quorum: 58, endsIn: '12 days', category: 'Product' },
  { id: 'p3', title: 'Increase insurance fund to 200% coverage', status: 'active', yesVotes: 28000, noVotes: 15000, quorum: 42, endsIn: '3 days', category: 'Risk' },
];

export function StakingProposalsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header title="Proposals" back />

      <PageContent>
        <PageSection label="Active Proposals">
          <div className="flex flex-col gap-3">
            {PROPOSALS.map(proposal => {
              const totalVotes = proposal.yesVotes + proposal.noVotes;
              const yesPercent = (proposal.yesVotes / totalVotes) * 100;
              return (
                <TrCard key={proposal.id} hover className="p-4" onClick={() => navigate(`/earn/voting/${proposal.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {proposal.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: c.surface2, color: c.text3 }}>
                          {proposal.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} color={c.text3} />
                          <p style={{ color: c.text3, fontSize: 11 }}>{proposal.endsIn} left</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: '#10B981', fontWeight: 600 }}>Yes {yesPercent.toFixed(1)}%</span>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>No {(100 - yesPercent).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div className="h-full" style={{ background: '#10B981', width: `${yesPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      {totalVotes.toLocaleString()} votes • {proposal.quorum}% quorum
                    </p>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: c.primary, color: '#FFF' }}>
                      Vote Now
                    </button>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        <button className="w-full py-3 rounded-[14px] text-sm font-semibold" style={{ background: c.surface2, color: c.text1 }}>
          Create New Proposal (Requires 10K tokens)
        </button>
      </PageContent>
    </PageLayout>
  );
}
