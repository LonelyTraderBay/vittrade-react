import React, { useState } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, Share2, Award, Clock } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

interface Post {
  id: string;
  author: { name: string; avatar: string; badge?: string };
  timestamp: string;
  content: string;
  type: 'achievement' | 'discussion' | 'tip' | 'milestone';
  likes: number;
  comments: number;
  asset?: string;
  apy?: number;
}

const POSTS: Post[] = [
  {
    id: 'p1',
    author: { name: 'CryptoWhale', avatar: '🐋', badge: 'VIP' },
    timestamp: '2 hours ago',
    content: 'Just hit 1000 ETH staked! 🎉 The auto-compound feature is a game changer. Earned 12% more vs manual claiming.',
    type: 'milestone',
    likes: 234,
    comments: 45,
    asset: 'ETH',
  },
  {
    id: 'p2',
    author: { name: 'YieldMaximizer', avatar: '📈' },
    timestamp: '5 hours ago',
    content: '💡 Pro tip: Stake during validator rotation windows for better APY. I switched from Validator #3 to #1 and got +0.5% APY boost.',
    type: 'tip',
    likes: 156,
    comments: 28,
    asset: 'ETH',
    apy: 4.5,
  },
  {
    id: 'p3',
    author: { name: 'DeFiBuilder', avatar: '🛠️', badge: 'Expert' },
    timestamp: '1 day ago',
    content: 'Comparison: Flexible vs Fixed 90D staking. Fixed gave me 1.2% higher APY, but liquidity risk during market dips. What is your strategy?',
    type: 'discussion',
    likes: 89,
    comments: 67,
  },
  {
    id: 'p4',
    author: { name: 'SafeStaker', avatar: '🛡️' },
    timestamp: '1 day ago',
    content: '🏆 Achievement unlocked: 365 days uninterrupted staking! Total rewards: 125 ETH. Insurance fund saved me twice during slashing events.',
    type: 'achievement',
    likes: 312,
    comments: 52,
    asset: 'ETH',
  },
];

export function StakingSocialFeedPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'trending' | 'following' | 'my-posts'>('trending');

  const getTypeIcon = (type: Post['type']) => {
    if (type === 'achievement') return <Award size={16} color="#F59E0B" />;
    if (type === 'tip') return <TrendingUp size={16} color="#3B82F6" />;
    return <MessageCircle size={16} color="#10B981" />;
  };

  const getTypeLabel = (type: Post['type']) => {
    if (type === 'achievement') return 'Achievement';
    if (type === 'milestone') return 'Milestone';
    if (type === 'tip') return 'Pro Tip';
    return 'Discussion';
  };

  return (
    <PageLayout>
      <Header title="Community Feed" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <MessageCircle size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Share Your Staking Journey
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Connect with fellow stakers, share strategies, and celebrate milestones. Learn from the community's experience.
              </p>
            </div>
          </div>
        </div>

        {/* Create Post */}
        <TrCard hover className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: c.surface2 }}>
              👤
            </div>
            <p style={{ color: c.text3, fontSize: 14 }}>
              Share your staking wins, tips, or questions...
            </p>
          </div>
        </TrCard>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'trending', label: 'Trending' },
            { id: 'following', label: 'Following' },
            { id: 'my-posts', label: 'My Posts' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Feed */}
        <PageSection label={tab === 'trending' ? 'Trending Posts' : tab === 'following' ? 'From People You Follow' : 'Your Posts'}>
          <div className="flex flex-col gap-3">
            {POSTS.map(post => (
              <TrCard key={post.id} className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{ background: c.surface2 }}>
                      {post.author.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {post.author.name}
                        </p>
                        {post.author.badge && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                            {post.author.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 11 }}>{post.timestamp}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: c.surface2 }}>
                    {getTypeIcon(post.type)}
                    <p style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
                      {getTypeLabel(post.type)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p style={{ color: c.text1, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                  {post.content}
                </p>

                {/* Meta (if asset/apy) */}
                {(post.asset || post.apy) && (
                  <div className="flex gap-2 mb-3">
                    {post.asset && (
                      <span className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                        {post.asset}
                      </span>
                    )}
                    {post.apy && (
                      <span className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                        {post.apy}% APY
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: c.borderSolid }}>
                  <button className="flex items-center gap-1.5">
                    <ThumbsUp size={16} color={c.text3} />
                    <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>{post.likes}</p>
                  </button>
                  <button className="flex items-center gap-1.5">
                    <MessageCircle size={16} color={c.text3} />
                    <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>{post.comments}</p>
                  </button>
                  <button className="flex items-center gap-1.5 ml-auto">
                    <Share2 size={16} color={c.text3} />
                  </button>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Community Stats */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Community Stats
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>12.5K</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Members</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>3.2K</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Posts Today</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>89%</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Active Rate</p>
            </div>
          </div>
        </TrCard>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Community guidelines apply. Be respectful, share knowledge, and support fellow stakers. Spam, financial advice, and referral links are prohibited.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}