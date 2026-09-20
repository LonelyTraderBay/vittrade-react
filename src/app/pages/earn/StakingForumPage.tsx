import React from 'react';
import { MessageCircle, TrendingUp, Pin, Clock } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const CATEGORIES = [
  { name: 'General Discussion', threads: 1234, posts: 8901 },
  { name: 'Proposals & Voting', threads: 89, posts: 567 },
  { name: 'Technical Support', threads: 456, posts: 2340 },
  { name: 'Strategy & Tips', threads: 678, posts: 4521 },
];

const TRENDING_THREADS = [
  { title: 'Best validators for ETH staking in 2026?', replies: 234, views: 5678, pinned: true, author: 'CryptoGuru' },
  { title: 'Proposal #127 discussion: Lower fees', replies: 156, views: 3421, pinned: false, author: 'StakeMax' },
  { title: 'How to maximize rewards with auto-compound', replies: 89, views: 2103, pinned: false, author: 'YieldHunter' },
];

export function StakingForumPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Forum" back />

      <PageContent>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Community Forum
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            Discuss strategies, proposals, and get support from fellow stakers.
          </p>
        </div>

        <PageSection label="Categories">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, idx) => (
              <TrCard key={idx} hover className="p-3">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {cat.name}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>
                  {cat.threads} threads • {cat.posts} posts
                </p>
              </TrCard>
            ))}
          </div>
        </PageSection>

        <PageSection label="Trending Threads">
          <div className="flex flex-col gap-2">
            {TRENDING_THREADS.map((thread, idx) => (
              <TrCard key={idx} hover className="p-3">
                <div className="flex items-start gap-2 mb-2">
                  {thread.pinned && <Pin size={14} color="#F59E0B" className="shrink-0 mt-0.5" />}
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, flex: 1 }}>
                    {thread.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: c.text3 }}>
                  <span>{thread.author}</span>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    <span>{thread.replies}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>{thread.views}</span>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        <button className="w-full py-3 rounded-[14px] text-sm font-semibold" style={{ background: c.primary, color: '#FFF' }}>
          Create New Thread
        </button>
      </PageContent>
    </PageLayout>
  );
}
