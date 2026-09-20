/**
 * ══════════════════════════════════════════════════════════════════
 *  SOCIAL SENTIMENT PAGE — P2 Market Sentiment Intelligence
 * ══════════════════════════════════════════════════════════════════
 *  Social sentiment scores, trending mentions, sentiment heatmap,
 *  community buzz tracker. Route: /markets/sentiment
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  MessageCircle, Users, BarChart3, Hash,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtCompact, fmtPct } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  TOKEN_SENTIMENTS, SENTIMENT_GLOBAL, SENTIMENT_TIMELINE,
  type TokenSentiment,
} from '../../data/marketP2Data';

const TABS = ['Tổng quan', 'Theo token', 'Xu hướng'];
const SORT_OPTIONS = ['Sentiment', 'Mentions', 'Trending'];

function getSentimentColor(score: number): string {
  if (score >= 60) return '#10B981';
  if (score >= 30) return '#3B82F6';
  if (score >= -10) return '#6B7280';
  if (score >= -40) return '#F59E0B';
  return '#EF4444';
}

function getSentimentEmoji(score: number): string {
  if (score >= 60) return '🟢';
  if (score >= 30) return '🔵';
  if (score >= -10) return '⚪';
  if (score >= -40) return '🟡';
  return '🔴';
}

export function SocialSentimentPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const [tab, setTab] = useState('Tổng quan');
  const [sortBy, setSortBy] = useState('Sentiment');

  const sortedTokens = useMemo(() => {
    const items = [...TOKEN_SENTIMENTS];
    switch (sortBy) {
      case 'Sentiment': return items.sort((a, b) => b.sentimentScore - a.sentimentScore);
      case 'Mentions': return items.sort((a, b) => b.mentions24h - a.mentions24h);
      case 'Trending': return items.sort((a, b) => (a.trendingRank ?? 999) - (b.trendingRank ?? 999));
      default: return items;
    }
  }, [sortBy]);

  const trendingTokens = TOKEN_SENTIMENTS.filter(t => t.trending).sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99));

  return (
    <PageLayout>
      <Header title="Tâm lý thị trường" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* ═══ Overview tab ═══ */}
        {tab === 'Tổng quan' && (
          <>
            {/* Global sentiment gauge */}
            <TrCard variant="hero" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>
                  Chỉ số tâm lý chung
                </p>
                <span style={{
                  color: getSentimentColor(SENTIMENT_GLOBAL.overallScore),
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>
                  {SENTIMENT_GLOBAL.overallLabel}
                </span>
              </div>

              {/* Gauge visualization */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="flex items-end gap-2 mb-3">
                    <span style={{
                      color: getSentimentColor(SENTIMENT_GLOBAL.overallScore),
                      fontSize: FONT_SCALE.xl,
                      fontWeight: FONT_WEIGHT.bold,
                    }}>
                      {SENTIMENT_GLOBAL.overallScore}
                    </span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, paddingBottom: 3 }}>/ 100</span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: c.surface2 }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, (SENTIMENT_GLOBAL.overallScore + 100) / 2))}%`,
                        background: `linear-gradient(90deg, #EF4444, #F59E0B, #10B981)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ color: '#EF4444', fontSize: 8 }}>Cực sợ</span>
                    <span style={{ color: '#6B7280', fontSize: 8 }}>Trung lập</span>
                    <span style={{ color: '#10B981', fontSize: 8 }}>Cực tham</span>
                  </div>
                </div>
              </div>
            </TrCard>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <TrCard className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageCircle size={12} color="#3B82F6" />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lượt đề cập 24h</span>
                </div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                  {fmtCompact(SENTIMENT_GLOBAL.totalMentions24h)}
                </p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <ArrowUpRight size={10} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro }}>
                    {fmtPct(SENTIMENT_GLOBAL.mentionsChange)}
                  </span>
                </div>
              </TrCard>
              <TrCard className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Hash size={12} color="#8B5CF6" />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Token trending</span>
                </div>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                  {SENTIMENT_GLOBAL.trendingTokens}
                </p>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>trong 24h qua</p>
              </TrCard>
            </div>

            {/* Social dominance */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8 }}>
                Social Dominance
              </p>
              <div className="flex rounded-lg overflow-hidden" style={{ height: 20 }}>
                <div style={{ width: `${SENTIMENT_GLOBAL.socialDominanceBTC}%`, background: '#F7931A' }} />
                <div style={{ width: `${SENTIMENT_GLOBAL.socialDominanceETH}%`, background: '#627EEA' }} />
                <div style={{ width: `${SENTIMENT_GLOBAL.socialDominanceOther}%`, background: c.surface2 }} />
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#F7931A' }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>BTC {SENTIMENT_GLOBAL.socialDominanceBTC}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#627EEA' }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>ETH {SENTIMENT_GLOBAL.socialDominanceETH}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.surface2 }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Khác {SENTIMENT_GLOBAL.socialDominanceOther}%</span>
                </div>
              </div>
            </TrCard>

            {/* Sentiment timeline */}
            <PageSection label="Diễn biến 7 ngày" accentColor="#3B82F6">
              <TrCard className="p-4">
                <div className="flex flex-col gap-2">
                  {SENTIMENT_TIMELINE.map((point, idx) => {
                    const barWidth = ((point.score + 100) / 200) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span style={{
                          color: c.text3, fontSize: FONT_SCALE.micro, width: 56, textAlign: 'right', flexShrink: 0,
                        }}>
                          {point.time}
                        </span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${barWidth}%`, background: getSentimentColor(point.score) }}
                          />
                        </div>
                        <span style={{
                          color: getSentimentColor(point.score),
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.semibold,
                          width: 24, textAlign: 'right',
                        }}>
                          {point.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            </PageSection>

            {/* Top trending tokens */}
            <PageSection label="Top Trending" accentColor="#F59E0B">
              <div className="flex flex-col" style={{ gap: 4 }}>
                {trendingTokens.slice(0, 4).map(token => (
                  <SentimentRow key={token.id} token={token} c={c} />
                ))}
              </div>
            </PageSection>
          </>
        )}

        {/* ═══ By Token tab ═══ */}
        {tab === 'Theo token' && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); hapticSelection(); }}
                  className="shrink-0 px-3 py-1.5 rounded-xl"
                  style={{
                    background: sortBy === opt ? c.chipActiveBg : c.surface2,
                    color: sortBy === opt ? c.chipActiveText : c.text3,
                    border: `1px solid ${sortBy === opt ? c.chipActiveBorder : 'transparent'}`,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex flex-col" style={{ gap: 4 }}>
              {sortedTokens.map(token => (
                <SentimentDetailCard key={token.id} token={token} c={c} />
              ))}
            </div>
          </>
        )}

        {/* ═══ Trends tab ═══ */}
        {tab === 'Xu hướng' && (
          <>
            {/* Trending topics cloud */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
                Chủ đề nổi bật
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(TOKEN_SENTIMENTS.flatMap(t => t.topTopics))).map((topic, idx) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 rounded-xl"
                    style={{
                      background: c.surface2,
                      color: c.text2,
                      fontSize: idx < 3 ? FONT_SCALE.sm : FONT_SCALE.xs,
                      fontWeight: idx < 3 ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                      border: idx < 3 ? `1px solid ${c.chipActiveBorder}` : 'none',
                    }}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </TrCard>

            {/* Sentiment heatmap by token */}
            <PageSection label="Sentiment Heatmap" accentColor="#8B5CF6">
              <div className="grid grid-cols-4 gap-1.5">
                {TOKEN_SENTIMENTS.map(token => (
                  <div
                    key={token.id}
                    className="flex flex-col items-center justify-center rounded-xl py-3"
                    style={{
                      background: `${getSentimentColor(token.sentimentScore)}12`,
                      border: `1px solid ${getSentimentColor(token.sentimentScore)}25`,
                    }}
                  >
                    <span style={{
                      color: token.color,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.bold,
                    }}>
                      {token.symbol}
                    </span>
                    <span style={{
                      color: getSentimentColor(token.sentimentScore),
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      marginTop: 2,
                    }}>
                      {token.sentimentScore}
                    </span>
                    <span style={{ fontSize: 10 }}>
                      {getSentimentEmoji(token.sentimentScore)}
                    </span>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Bullish vs Bearish leaderboard */}
            <div className="grid grid-cols-2 gap-2">
              <PageSection label="Tích cực nhất" accentColor="#10B981">
                <div className="flex flex-col" style={{ gap: 2 }}>
                  {TOKEN_SENTIMENTS
                    .sort((a, b) => b.sentimentScore - a.sentimentScore)
                    .slice(0, 4)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: c.surface }}>
                        <span style={{ color: c.text3, fontSize: 10, width: 12 }}>{idx + 1}</span>
                        <span style={{ color: t.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, flex: 1 }}>
                          {t.symbol}
                        </span>
                        <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                          +{t.sentimentScore}
                        </span>
                      </div>
                    ))}
                </div>
              </PageSection>
              <PageSection label="Tiêu cực nhất" accentColor="#EF4444">
                <div className="flex flex-col" style={{ gap: 2 }}>
                  {TOKEN_SENTIMENTS
                    .sort((a, b) => a.sentimentScore - b.sentimentScore)
                    .slice(0, 4)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: c.surface }}>
                        <span style={{ color: c.text3, fontSize: 10, width: 12 }}>{idx + 1}</span>
                        <span style={{ color: t.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, flex: 1 }}>
                          {t.symbol}
                        </span>
                        <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                          {t.sentimentScore}
                        </span>
                      </div>
                    ))}
                </div>
              </PageSection>
            </div>

            {/* Mentions velocity */}
            <PageSection label="Tốc độ đề cập (24h)" accentColor="#06B6D4">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {TOKEN_SENTIMENTS
                  .sort((a, b) => b.mentionsChange - a.mentionsChange)
                  .slice(0, 5)
                  .map(token => {
                    const maxChange = Math.max(...TOKEN_SENTIMENTS.map(t => Math.abs(t.mentionsChange)));
                    const barWidth = Math.min(100, (Math.abs(token.mentionsChange) / maxChange) * 100);
                    return (
                      <div key={token.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: c.surface }}>
                        <span style={{ color: token.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, width: 40 }}>
                          {token.symbol}
                        </span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: c.surface2 }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barWidth}%`,
                              background: token.mentionsChange >= 0 ? '#10B981' : '#EF4444',
                            }}
                          />
                        </div>
                        <span style={{
                          color: token.mentionsChange >= 0 ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.semibold,
                          width: 48,
                          textAlign: 'right',
                        }}>
                          {fmtPct(token.mentionsChange)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function SentimentRow({ token, c }: {
  token: TokenSentiment;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: c.surface }}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${token.color}18` }}
      >
        <span style={{ color: token.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {token.symbol.slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
          {token.symbol}
          {token.trending && (
            <span style={{ color: '#F59E0B', fontSize: 10, marginLeft: 6 }}>🔥 #{token.trendingRank}</span>
          )}
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
          {fmtCompact(token.mentions24h)} đề cập
        </p>
      </div>
      <div className="text-right shrink-0">
        <p style={{
          color: getSentimentColor(token.sentimentScore),
          fontSize: FONT_SCALE.sm,
          fontWeight: FONT_WEIGHT.bold,
        }}>
          {token.sentimentScore}
        </p>
        <p style={{ color: c.text3, fontSize: 10 }}>{getSentimentEmoji(token.sentimentScore)}</p>
      </div>
    </div>
  );
}

function SentimentDetailCard({ token, c }: {
  token: TokenSentiment;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TrCard className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${token.color}18` }}
        >
          <span style={{ color: token.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
            {token.symbol.slice(0, 2)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {token.symbol}
            </span>
            {token.trending && (
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}
              >
                🔥 Trending #{token.trendingRank}
              </span>
            )}
          </div>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{token.name}</span>
        </div>
        <div className="text-right">
          <p style={{
            color: getSentimentColor(token.sentimentScore),
            fontSize: FONT_SCALE.lg,
            fontWeight: FONT_WEIGHT.bold,
          }}>
            {token.sentimentScore}
          </p>
        </div>
      </div>

      {/* Bullish/Bearish/Neutral bar */}
      <div className="mb-3">
        <div className="flex rounded overflow-hidden" style={{ height: 6 }}>
          <div style={{ width: `${token.bullishPct}%`, background: '#10B981' }} />
          <div style={{ width: `${token.neutralPct}%`, background: '#6B7280' }} />
          <div style={{ width: `${token.bearishPct}%`, background: '#EF4444' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ color: '#10B981', fontSize: 10 }}>Bullish {token.bullishPct}%</span>
          <span style={{ color: '#6B7280', fontSize: 10 }}>Neutral {token.neutralPct}%</span>
          <span style={{ color: '#EF4444', fontSize: 10 }}>Bearish {token.bearishPct}%</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Đề cập 24h</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtCompact(token.mentions24h)}
          </p>
          <span style={{
            color: token.mentionsChange >= 0 ? '#10B981' : '#EF4444',
            fontSize: 9,
          }}>
            {fmtPct(token.mentionsChange)}
          </span>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Twitter</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtCompact(token.twitterFollowers)}
          </p>
        </div>
        <div>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Telegram</p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
            {fmtCompact(token.telegramMembers)}
          </p>
        </div>
      </div>

      {/* Top topics */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-2" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
        {token.topTopics.map(topic => (
          <span
            key={topic}
            className="px-2 py-1 rounded-lg"
            style={{ background: c.surface2, color: c.text3, fontSize: 10 }}
          >
            #{topic}
          </span>
        ))}
      </div>
    </TrCard>
  );
}