/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionSocialPage — Prediction Markets Advanced Feature 1/4
 * ══════════════════════════════════════════════════════════════
 *  Social features: Comments with threading, Share predictions,
 *  User sentiment analysis, Top commenters, Discussion threads
 *  Pattern B — Page with Tabs (Comments/Sentiment/Share)
 *  Compliance: §9.6 No hype, moderation controls
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  MessageCircle, Share2, ThumbsUp, ThumbsDown, TrendingUp,
  Send, Link2, Twitter, Facebook, MoreHorizontal, Flag,
  User, Clock, Award, BarChart3, Copy, Check, Info,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TABS = ['Binh luan', 'Phan tich', 'Chia se'] as const;
type Tab = typeof TABS[number];

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  content: string;
  stance: 'bullish' | 'bearish' | 'neutral';
  upvotes: number;
  downvotes: number;
  replies: Comment[];
  createdAt: Date;
  isPinned?: boolean;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    userId: 'u1',
    userName: 'CryptoAnalyst',
    userTier: 'platinum',
    content: 'Looking at on-chain metrics, BTC accumulation by whales increased 15% this month. Strong bullish signal for $100K target.',
    stance: 'bullish',
    upvotes: 124,
    downvotes: 8,
    replies: [
      {
        id: 'c1_r1',
        userId: 'u2',
        userName: 'ChartMaster',
        userTier: 'gold',
        content: 'Agree, also RSI showing oversold conditions. Good entry point.',
        stance: 'bullish',
        upvotes: 45,
        downvotes: 2,
        replies: [],
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 3600000),
    isPinned: true,
  },
  {
    id: 'c2',
    userId: 'u3',
    userName: 'MacroTrader',
    userTier: 'silver',
    content: 'Fed policy still uncertain. I think we need to see Q4 data before making bold predictions.',
    stance: 'neutral',
    upvotes: 67,
    downvotes: 15,
    replies: [],
    createdAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    id: 'c3',
    userId: 'u4',
    userName: 'BearMarketSurvivor',
    userTier: 'bronze',
    content: 'Too much optimism in the market. History shows corrections after such rallies.',
    stance: 'bearish',
    upvotes: 34,
    downvotes: 56,
    replies: [],
    createdAt: new Date(Date.now() - 12 * 3600000),
  },
];

const SENTIMENT_DATA = [
  { name: 'Bullish', value: 58, color: '#10B981' },
  { name: 'Bearish', value: 22, color: '#EF4444' },
  { name: 'Neutral', value: 20, color: '#6B7280' },
];

export function PredictionSocialPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [tab, setTab] = useState<Tab>('Binh luan');
  const [newComment, setNewComment] = useState('');
  const [selectedStance, setSelectedStance] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const eventTitle = 'BTC > $100K by Dec 2026?';
  const shareUrl = `https://app.example.com/predictions/event/${eventId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Check out this prediction: ${eventTitle}`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };
    if (platform in urls) {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E7EB';
      case 'gold': return '#F59E0B';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#D97706';
      default: return c.text3;
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'bullish': return c.buy;
      case 'bearish': return c.sell;
      case 'neutral': return '#6B7280';
      default: return c.text3;
    }
  };

  const totalComments = MOCK_COMMENTS.reduce(
    (sum, c) => sum + 1 + c.replies.length,
    0
  );

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div
      key={comment.id}
      className={`rounded-2xl p-4 ${isReply ? 'ml-8 mt-2' : ''}`}
      style={{
        background: comment.isPinned ? 'rgba(59,130,246,0.06)' : c.surface,
        border: `1px solid ${comment.isPinned ? 'rgba(59,130,246,0.15)' : c.border}`,
      }}
    >
      {/* User Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${getTierColor(comment.userTier)}, ${getTierColor(comment.userTier)}AA)`,
            }}
          >
            <User size={16} color="#fff" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                {comment.userName}
              </p>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
                style={{
                  background: `${getTierColor(comment.userTier)}20`,
                  color: getTierColor(comment.userTier),
                }}
              >
                {comment.userTier}
              </span>
              {comment.isPinned && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                  style={{ background: c.primaryAlpha12, color: c.primary }}
                >
                  PINNED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={10} color={c.text3} />
              <p style={{ color: c.text3, fontSize: 10 }}>
                {comment.createdAt.toLocaleString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold ml-1"
                style={{
                  background: `${getStanceColor(comment.stance)}20`,
                  color: getStanceColor(comment.stance),
                }}
              >
                {comment.stance.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <button className="hover:opacity-70">
          <MoreHorizontal size={16} color={c.text3} />
        </button>
      </div>

      {/* Content */}
      <p style={{ color: c.text1, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ background: c.bg }}
        >
          <ThumbsUp size={13} color={c.buy} />
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
            {comment.upvotes}
          </span>
        </button>
        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ background: c.bg }}
        >
          <ThumbsDown size={13} color={c.sell} />
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
            {comment.downvotes}
          </span>
        </button>
        {!isReply && (
          <button
            onClick={() => setReplyTo(comment.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: c.bg }}
          >
            <MessageCircle size={13} color={c.text3} />
            <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
              Tra loi
            </span>
          </button>
        )}
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:opacity-70 transition-opacity">
          <Flag size={13} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>Bao cao</span>
        </button>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <PageLayout>
      <Header title="Social & Discussion" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Binh luan' && (
          <>
            {/* Event Info */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {eventTitle}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={14} color={c.text3} />
                  <p style={{ color: c.text2, fontSize: 12 }}>{totalComments} comments</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} color={c.buy} />
                  <p style={{ color: c.buy, fontSize: 12, fontWeight: 600 }}>
                    {SENTIMENT_DATA[0].value}% Bullish
                  </p>
                </div>
              </div>
            </div>

            {/* New Comment */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Them binh luan
              </p>

              {/* Stance selector */}
              <div className="flex gap-2 mb-3">
                {(['bullish', 'bearish', 'neutral'] as const).map((stance) => (
                  <button
                    key={stance}
                    onClick={() => setSelectedStance(stance)}
                    className="flex-1 py-1.5 rounded-lg transition-all text-[11px] font-semibold"
                    style={{
                      background: selectedStance === stance ? getStanceColor(stance) : c.bg,
                      color: selectedStance === stance ? '#fff' : c.text2,
                      border: `1px solid ${selectedStance === stance ? 'transparent' : c.border}`,
                    }}
                  >
                    {stance.toUpperCase()}
                  </button>
                ))}
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Chia se y kien cua ban..."
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 13,
                  minHeight: 80,
                }}
              />

              <button
                onClick={() => {
                  alert(`Posting comment with stance: ${selectedStance}`);
                  setNewComment('');
                }}
                disabled={!newComment.trim()}
                className="w-full rounded-xl mt-3 py-2.5 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: c.primary,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Send size={14} />
                Dang binh luan
              </button>
            </div>

            {/* Comments List */}
            <PageSection label={`${totalComments} binh luan`}>
              <div className="space-y-3">
                {MOCK_COMMENTS.map((comment) => renderComment(comment))}
              </div>
            </PageSection>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color={c.primary} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Y kien nguoi dung chi mang tinh tham khao. Khong phai loi khuyen dau tu. Tu chiu trach nhiem quyet dinh.
              </p>
            </div>
          </>
        )}

        {tab === 'Phan tich' && (
          <>
            {/* Sentiment Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Community Sentiment
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    key="pie-sentiment"
                    data={SENTIMENT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.value}%`}
                  >
                    {SENTIMENT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {SENTIMENT_DATA.map((item) => (
                  <div key={item.name} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: item.color,
                        }}
                      />
                      <p style={{ color: c.text2, fontSize: 11 }}>{item.name}</p>
                    </div>
                    <p style={{ color: item.color, fontSize: 16, fontWeight: 700 }}>
                      {item.value}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <PageSection label="Nguoi dong gop hang dau">
              {[
                { name: 'CryptoAnalyst', tier: 'platinum', comments: 45, upvotes: 892 },
                { name: 'ChartMaster', tier: 'gold', comments: 38, upvotes: 654 },
                { name: 'MacroTrader', tier: 'silver', comments: 31, upvotes: 478 },
              ].map((user, idx) => (
                <div
                  key={user.name}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center" style={{ width: 24 }}>
                      {idx === 0 && <Award size={20} color="#F59E0B" fill="#F59E0B" />}
                      {idx === 1 && <Award size={18} color="#9CA3AF" fill="#9CA3AF" />}
                      {idx === 2 && <Award size={16} color="#D97706" fill="#D97706" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {user.name}
                        </p>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
                          style={{
                            background: `${getTierColor(user.tier)}20`,
                            color: getTierColor(user.tier),
                          }}
                        >
                          {user.tier}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {user.comments} comments · {user.upvotes} upvotes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Sentiment Over Time */}
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Sentiment Trend
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Bullish sentiment tang 12% trong 24h qua. Cho thay su lac quan tang len.
              </p>
            </div>
          </>
        )}

        {tab === 'Chia se' && (
          <>
            {/* Share Links */}
            <PageSection label="Chia se qua mang xa hoi">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
                  style={{ background: '#1DA1F2', color: '#fff' }}
                >
                  <Twitter size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Twitter</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
                  style={{ background: '#1877F2', color: '#fff' }}
                >
                  <Facebook size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Facebook</span>
                </button>
              </div>
            </PageSection>

            {/* Copy Link */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Sao chep lien ket
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 12 }}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
                  style={{
                    background: copied ? c.buy : c.primary,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Stats */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Thong ke chia se
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Shares</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>1,247</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Views from Shares</p>
                  <p style={{ color: c.buy, fontSize: 18, fontWeight: 700 }}>4,892</p>
                </div>
              </div>
            </div>

            {/* Share Preview */}
            <PageSection label="Preview">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 60,
                      height: 60,
                      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    }}
                  >
                    <BarChart3 size={28} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {eventTitle}
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                      Join the prediction market and share your insights with the community.
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, marginTop: 6 }}>
                      app.example.com
                    </p>
                  </div>
                </div>
              </div>
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}