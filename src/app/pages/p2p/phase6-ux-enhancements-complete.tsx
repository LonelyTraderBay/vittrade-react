/**
 * Phase 6 - UX Enhancements - FINAL (10 pages)
 * Simulator, Education, News, Social, Referral, Loyalty, Gamification, Personalization, Multi-language, Accessibility
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, BookOpen, Newspaper, Share2, Gift, Award,
  Sparkles, Settings, Globe, Eye
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

// FINAL 10 pages

export function P2PTradingSimulatorPage() {
  const c = useThemeColors();
  const [paper, setPaper] = useState({ balance: 100000000, pnl: 12500000, trades: 45, winRate: 68 });

  return (
    <PageLayout>
      <Header title="Trading Simulator" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Play size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Paper Trading</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Practice without risk</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Virtual Balance</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(paper.balance / 1000000)}M</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>P&L</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>+{fmtVnd(paper.pnl / 1000000)}M</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Trades</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{paper.trades}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Win Rate</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{paper.winRate}%</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PEducationalContentPage() {
  const c = useThemeColors();
  const courses = [
    { title: 'P2P Basics', progress: 100, lessons: 5 },
    { title: 'Risk Management', progress: 60, lessons: 8 },
    { title: 'Advanced Trading', progress: 0, lessons: 10 },
  ];

  return (
    <PageLayout>
      <Header title="Learning Center" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <BookOpen size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Educational Hub</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{courses.length} courses available</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {courses.map(course => (
          <TrCard key={course.title} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{course.title}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{course.lessons} lessons</p>
              </div>
              <p style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 700 }}>{course.progress}%</p>
            </div>
            <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
              <div className="h-2 rounded-full" style={{ width: `${course.progress}%`, background: '#8B5CF6' }} />
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PMarketNewsPage() {
  const c = useThemeColors();
  const news = [
    { title: 'BTC reaches new high', time: '2h ago', sentiment: 'bullish' },
    { title: 'Regulation update', time: '5h ago', sentiment: 'neutral' },
  ];

  return (
    <PageLayout>
      <Header title="Market News" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Newspaper size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Crypto News</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time updates</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {news.map((item, idx) => (
          <TrCard key={idx} rounded="md" className="p-4 mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>{item.title}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(item.sentiment === 'bullish' ? '#10B981' : '#3B82F6', 15), color: item.sentiment === 'bullish' ? '#10B981' : '#3B82F6' }}>
                {item.sentiment}
              </span>
              <p style={{ color: c.text3, fontSize: 10 }}>{item.time}</p>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PSocialTradingPage() {
  const c = useThemeColors();
  const traders = [
    { name: 'Top Trader', roi: 156, followers: 2340, trades: 450 },
    { name: 'Pro Trader', roi: 98, followers: 1200, trades: 320 },
  ];

  return (
    <PageLayout>
      <Header title="Social Trading" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Share2 size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Copy Trading</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Follow top performers</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {traders.map(trader => (
          <TrCard key={trader.name} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{trader.name}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{trader.followers} followers</p>
              </div>
              <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>+{trader.roi}%</p>
            </div>
            <button onClick={() => toast.success(`Following ${trader.name}`)} className="w-full py-2 rounded-lg" style={{ background: '#10B981', color: '#FFFFFF', fontSize: φ.sm, fontWeight: 600 }}>
              Copy Trade
            </button>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PReferralProgramAdvancedPage() {
  const c = useThemeColors();
  const referral = { code: 'VITT2026', referrals: 45, tier: 'Gold', commission: 25, earned: 12500000 };

  return (
    <PageLayout>
      <Header title="Referral Program" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Gift size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{referral.tier} Tier</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>{referral.commission}% commission</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Referrals</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{referral.referrals}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Earned</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(referral.earned / 1000000)}M</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Your Code</p>
          <p style={{ color: c.text1, fontSize: φ.xl, fontWeight: 700, marginBottom: 8 }}>{referral.code}</p>
          <CTAButton label="Share Code" onClick={() => toast.success('Copied to clipboard!')} />
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PLoyaltyRewardsPage() {
  const c = useThemeColors();
  const loyalty = { points: 12450, tier: 'Platinum', benefits: 5, nextTier: 'Diamond', needed: 2550 };

  return (
    <PageLayout>
      <Header title="Loyalty Rewards" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <Award size={32} color="#FFFFFF" className="mx-auto mb-3" />
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs, marginBottom: 4 }}>{loyalty.tier} Member</p>
          <p style={{ color: '#FFFFFF', fontSize: φ.xl, fontWeight: 700, marginBottom: 8 }}>{loyalty.points.toLocaleString()} Points</p>
          <div className="h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-2 rounded-full" style={{ width: `${(loyalty.points / (loyalty.points + loyalty.needed)) * 100}%`, background: '#FFFFFF' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10 }}>{loyalty.needed} points to {loyalty.nextTier}</p>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="View Rewards Catalog" onClick={() => toast.success('Opening catalog')} />
      </div>
    </PageLayout>
  );
}

export function P2PGamificationPage() {
  const c = useThemeColors();
  const achievements = [
    { title: 'First Trade', unlocked: true, progress: 100 },
    { title: '100 Trades', unlocked: true, progress: 100 },
    { title: 'Trading Master', unlocked: false, progress: 45 },
  ];

  return (
    <PageLayout>
      <Header title="Achievements" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Sparkles size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Your Progress</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>2/3 unlocked</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {achievements.map(ach => (
          <TrCard key={ach.title} rounded="md" className="p-4 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(ach.unlocked ? '#10B981' : c.text3, 15) }}>
                <Award size={18} color={ach.unlocked ? '#10B981' : c.text3} />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{ach.title}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{ach.progress}%</p>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
              <div className="h-2 rounded-full" style={{ width: `${ach.progress}%`, background: ach.unlocked ? '#10B981' : c.text3 }} />
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PPersonalizationPage() {
  const c = useThemeColors();
  const [settings, setSettings] = useState({
    theme: 'auto',
    layout: 'compact',
    charts: 'candlestick',
    notifications: 'all',
  });

  return (
    <PageLayout>
      <Header title="Personalization" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Settings size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>UI Preferences</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Customize your experience</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {Object.entries(settings).map(([key, value]) => (
          <TrCard key={key} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, textTransform: 'capitalize' }}>{key}</p>
                <p style={{ color: c.text3, fontSize: 10, textTransform: 'capitalize' }}>{value}</p>
              </div>
              <button onClick={() => toast.success(`Changed ${key}`)} className="px-3 py-1.5 rounded-lg" style={{ background: '#3B82F6', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}>
                Change
              </button>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PMultiLanguagePage() {
  const c = useThemeColors();
  const languages = [
    { code: 'vi', name: 'Tiếng Việt', active: true },
    { code: 'en', name: 'English', active: false },
    { code: 'zh', name: '中文', active: false },
    { code: 'ja', name: '日本語', active: false },
    { code: 'ko', name: '한국어', active: false },
  ];

  return (
    <PageLayout>
      <Header title="Language" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Globe size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Multi-Language</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{languages.length} languages</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {languages.map(lang => (
          <TrCard key={lang.code} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{lang.name}</p>
              {lang.active && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#10B981' }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PAccessibilitySettingsPage() {
  const c = useThemeColors();
  const [settings, setSettings] = useState({
    screenReader: true,
    highContrast: false,
    fontSize: 'medium',
    reduceMotion: false,
  });

  return (
    <PageLayout>
      <Header title="Accessibility" subtitle="Trải nghiệm · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Eye size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Accessibility</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>WCAG 2.2 AAA compliant</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {Object.entries(settings).map(([key, value]) => (
          <TrCard key={key} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : value}</p>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${typeof value === 'boolean' && value ? 'justify-end' : 'justify-start'}`} style={{ background: typeof value === 'boolean' && value ? '#10B981' : c.surface2 }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}