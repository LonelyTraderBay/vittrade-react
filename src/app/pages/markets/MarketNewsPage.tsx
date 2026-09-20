/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET NEWS PAGE — P2 Crypto Market News Feed
 * ══════════════════════════════════════════════════════════════════
 *  Market-specific news with category filters, sentiment tags,
 *  related token chips, breaking news section. Route: /markets/news
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Clock, ExternalLink, ChevronRight, Bookmark, BookmarkCheck,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  MARKET_NEWS, NEWS_CATEGORIES, SENTIMENT_BADGE,
  type MarketNewsItem,
} from '../../data/marketP2Data';

export function MarketNewsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [category, setCategory] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    hapticLight();
  };

  const filteredNews = useMemo(() => {
    let items = [...MARKET_NEWS];
    if (category !== 'all') {
      if (category === 'breaking') {
        items = items.filter(n => n.isBreaking);
      } else {
        items = items.filter(n => n.category === category);
      }
    }
    if (sentimentFilter) {
      items = items.filter(n => n.sentiment === sentimentFilter);
    }
    return items;
  }, [category, sentimentFilter]);

  const breakingNews = MARKET_NEWS.filter(n => n.isBreaking);

  return (
    <PageLayout>
      <Header title="Tin thị trường" back />

      <PageContent gap="default">
        {/* Breaking news banner */}
        {breakingNews.length > 0 && category === 'all' && (
          <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#EF4444',
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                🔴 NÓNG
              </span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {breakingNews[0].timeAgo}
              </span>
            </div>
            <p style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              lineHeight: 1.4,
            }}>
              {breakingNews[0].title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {breakingNews[0].relatedTokens.map(token => (
                <span
                  key={token}
                  className="px-2 py-0.5 rounded"
                  style={{ background: c.surface2, color: c.text2, fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}
                >
                  {token}
                </span>
              ))}
            </div>
          </TrCard>
        )}

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
          {NEWS_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); hapticSelection(); }}
              className="shrink-0 px-3 py-1.5 rounded-xl"
              style={{
                background: category === cat.id ? `${cat.color}15` : c.surface2,
                color: category === cat.id ? cat.color : c.text3,
                border: `1px solid ${category === cat.id ? `${cat.color}30` : 'transparent'}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.medium,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sentiment filter */}
        <div className="flex gap-2">
          {(['bullish', 'neutral', 'bearish'] as const).map(s => {
            const cfg = SENTIMENT_BADGE[s];
            const isActive = sentimentFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setSentimentFilter(isActive ? null : s); hapticSelection(); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{
                  background: isActive ? `${cfg.color}12` : 'transparent',
                  border: `1px solid ${isActive ? `${cfg.color}30` : c.borderSolid}`,
                }}
              >
                {s === 'bullish' && <TrendingUp size={12} color={cfg.color} />}
                {s === 'bearish' && <TrendingDown size={12} color={cfg.color} />}
                {s === 'neutral' && <Minus size={12} color={cfg.color} />}
                <span style={{
                  color: isActive ? cfg.color : c.text3,
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.medium,
                }}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* News feed */}
        <div className="flex flex-col" style={{ gap: 4 }}>
          {filteredNews.map(news => (
            <NewsCard
              key={news.id}
              news={news}
              expanded={expandedId === news.id}
              saved={savedIds.has(news.id)}
              onToggleExpand={() => { setExpandedId(expandedId === news.id ? null : news.id); hapticSelection(); }}
              onToggleSave={() => toggleSave(news.id)}
              onTokenTap={(token) => {
                const pairId = `${token.toLowerCase()}usdt`;
                navigate(`${prefix}/pair/${pairId}`);
                hapticLight();
              }}
              c={c}
            />
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span style={{ fontSize: 40, opacity: 0.3 }}>📰</span>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
              Không có tin tức phù hợp
            </p>
            <button
              onClick={() => { setCategory('all'); setSentimentFilter(null); }}
              className="mt-3 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: FONT_SCALE.xs }}
            >
              Xem tất cả
            </button>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function NewsCard({ news, expanded, saved, onToggleExpand, onToggleSave, onTokenTap, c }: {
  news: MarketNewsItem;
  expanded: boolean;
  saved: boolean;
  onToggleExpand: () => void;
  onToggleSave: () => void;
  onTokenTap: (token: string) => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const sentimentCfg = SENTIMENT_BADGE[news.sentiment];
  const categoryCfg = NEWS_CATEGORIES.find(cat => cat.id === news.category);

  return (
    <TrCard
      className="overflow-hidden"
      accentBorder={news.isBreaking ? 'rgba(239,68,68,0.15)' : undefined}
    >
      <button onClick={onToggleExpand} className="w-full text-left px-4 py-3">
        <div className="flex gap-3">
          {/* Emoji icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${categoryCfg?.color ?? '#6B7280'}08` }}
          >
            <span style={{ fontSize: 18 }}>{news.imageEmoji}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags row */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {news.isBreaking && (
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    color: '#EF4444',
                    fontSize: 8,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  NÓNG
                </span>
              )}
              <span
                className="px-1.5 py-0.5 rounded"
                style={{
                  background: `${categoryCfg?.color ?? '#6B7280'}12`,
                  color: categoryCfg?.color ?? '#6B7280',
                  fontSize: 8,
                  fontWeight: FONT_WEIGHT.semibold,
                }}
              >
                {categoryCfg?.label ?? news.category}
              </span>
              <span
                className="px-1.5 py-0.5 rounded flex items-center gap-0.5"
                style={{
                  background: `${sentimentCfg.color}08`,
                  color: sentimentCfg.color,
                  fontSize: 8,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                {news.sentiment === 'bullish' && <TrendingUp size={7} />}
                {news.sentiment === 'bearish' && <TrendingDown size={7} />}
                {news.sentiment === 'neutral' && <Minus size={7} />}
                {sentimentCfg.label}
              </span>
            </div>

            {/* Title */}
            <p style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}>
              {news.title}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {news.source}
              </span>
              <span style={{ color: c.text3, fontSize: 8 }}>•</span>
              <Clock size={9} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {news.timeAgo}
              </span>
              <span style={{ color: c.text3, fontSize: 8 }}>•</span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {news.readTime}
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(); }}
            className="shrink-0 mt-1"
          >
            {saved
              ? <BookmarkCheck size={16} color="#3B82F6" fill="#3B82F6" />
              : <Bookmark size={16} color={c.text3} />
            }
          </button>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
          <p style={{
            color: c.text2,
            fontSize: FONT_SCALE.xs,
            lineHeight: 1.6,
            paddingTop: 12,
            marginBottom: 12,
          }}>
            {news.summary}
          </p>

          {/* Related tokens */}
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Liên quan:</span>
            {news.relatedTokens.map(token => (
              <button
                key={token}
                onClick={() => onTokenTap(token)}
                className="px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                }}
              >
                <span style={{ color: c.text1, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                  {token}
                </span>
                <ChevronRight size={12} color={c.text3} />
              </button>
            ))}
          </div>
        </div>
      )}
    </TrCard>
  );
}