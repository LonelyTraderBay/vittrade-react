/**
 * ══════════════════════════════════════════════════════════
 *  Topic Hub Page — §11.8 / §12.3
 * ══════════════════════════════════════════════════════════
 *
 *  Where Prediction Markets and Open Arena meet safely.
 *  Organized by shared topic taxonomy (§11.2):
 *  - Crypto, Macro, Politics, Sports, Tech, AI, Culture, Community
 *
 *  Shows per topic:
 *  - Active prediction events
 *  - Live arena rooms
 *  - Featured modes
 *  - Top creators
 *
 *  §12.3: Results segmented by module with disclosure.
 *  §12.4: Discovery-only — CTAs are discovery verbs.
 *  §11.6: Bridge cards always have boundary disclosure.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  TrendingUp, Zap, Trophy, User, Target, Star, Shield,
  ArrowRight, Search, Users, Flame, ChevronRight,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/states/EmptyState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  SHARED_TOPICS,
  mapCategoryToTopic,
} from '../../components/bridges/ArenaPredictionBridges';
import type { SharedTopicId } from '../../components/bridges/ArenaPredictionBridges';
import { PREDICTION_EVENTS, fmtVolume } from '../../data/predictionMockData';
import type { PredictionEvent } from '../../data/predictionMockData';
import { ARENA_MODES, ARENA_ROOMS, ARENA_CREATORS } from '../../data/arenaData';
import type { ArenaMode, ArenaRoom, ArenaCreator } from '../../data/arenaData';
import { φ } from '../../utils/golden';

/* ═══════════════════════════════════════════
   Data mapping — group real data by topic
   ═══════════════════════════════════════════ */

function getPredictionsByTopic(topicId: string): PredictionEvent[] {
  return PREDICTION_EVENTS.filter(e => {
    const mapped = mapCategoryToTopic(e.category);
    return mapped === topicId;
  });
}

function getArenaRoomsByTopic(topicId: string): ArenaRoom[] {
  // Match rooms by their mode's tags
  return ARENA_ROOMS.filter(r => {
    const mode = ARENA_MODES.find(m => m.id === r.modeId);
    if (!mode) return false;
    return mode.tags.some(t => t.toLowerCase().includes(topicId));
  });
}

function getArenaModesByTopic(topicId: string): ArenaMode[] {
  return ARENA_MODES.filter(m =>
    m.tags.some(t => t.toLowerCase().includes(topicId))
  );
}

function getCreatorsByTopic(topicId: string): ArenaCreator[] {
  // Creators who have modes in this topic
  const topicModes = getArenaModesByTopic(topicId);
  const creatorIds = new Set(topicModes.map(m => m.creator.id));
  return ARENA_CREATORS.filter(c => creatorIds.has(c.id));
}

/* ═══════════════════════════════════════════
   Topic overview stats
   ═══════════════════════════════════════════ */

function TopicHero({ topicId }: { topicId: string }) {
  const c = useThemeColors();
  const topic = SHARED_TOPICS.find(t => t.id === topicId);
  if (!topic) return null;

  const predictions = getPredictionsByTopic(topicId);
  const rooms = getArenaRoomsByTopic(topicId);
  const modes = getArenaModesByTopic(topicId);
  const creators = getCreatorsByTopic(topicId);

  const stats = [
    { label: 'Events', value: predictions.length, color: '#8B5CF6' },
    { label: 'Rooms', value: rooms.length, color: '#F59E0B' },
    { label: 'Modes', value: modes.length, color: '#10B981' },
    { label: 'Creators', value: creators.length, color: '#3B82F6' },
  ];

  return (
    <div className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${topic.color}12, ${topic.color}04)`, border: `1px solid ${topic.color}20` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${topic.color}18` }}>
          <Flame size={22} color={topic.color} />
        </div>
        <div>
          <h2 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{topic.label}</h2>
          <p style={{ color: c.text2, fontSize: φ.xs }}>
            {topicId === 'crypto' && 'Bitcoin, Ethereum, altcoins, DeFi'}
            {topicId === 'macro' && 'Kinh tế vĩ mô, lãi suất, GDP, CPI'}
            {topicId === 'politics' && 'Chính trị, bầu cử, chính sách'}
            {topicId === 'sports' && 'Thể thao, giải đấu, kết quả'}
            {topicId === 'tech' && 'Công nghệ, sản phẩm, startup'}
            {topicId === 'ai' && 'AI, machine learning, AGI'}
            {topicId === 'culture' && 'Văn hoá, giải trí, meme'}
            {topicId === 'community' && 'Cộng đồng, social, creator'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ background: c.surface2 }}>
            <p style={{ color: s.color, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
              {s.value}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Section Cards
   ═══════════════════════════════════════════ */

function PredictionEventRow({ event }: { event: PredictionEvent }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const top = event.outcomes[0];

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/markets/predictions/event/${event.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontSize: 9, fontWeight: 700 }}>
          <Target size={8} /> Prediction Market
        </span>
        {event.isTrending && (
          <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>Trending</span>
        )}
      </div>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>
        {event.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ color: top.color, fontSize: φ.xs, fontWeight: 700 }}>
            {top.label} {top.chance}%
          </span>
          <span style={{ color: c.text3, fontSize: 10 }}>
            Vol {fmtVolume(event.volume24h)}
          </span>
        </div>
        <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>
          Xem thị trường →
        </span>
      </div>
    </TrCard>
  );
}

function ArenaRoomRow({ room }: { room: ArenaRoom }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const fillPct = Math.round((room.slotsFilled / room.slotsTotal) * 100);
  const statusColor = room.status === 'in_progress' ? '#10B981' : room.status === 'waiting' ? '#F59E0B' : c.text3;
  const statusLabel = room.status === 'in_progress' ? 'Live' : room.status === 'waiting' ? 'Chờ' : 'Xong';

  return (
    <TrCard className="p-3.5 active:opacity-70"
      onClick={() => { navigate(`${prefix}/arena/challenge/${room.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
          <Star size={8} /> Arena Points only
        </span>
        <span className="px-1.5 py-0.5 rounded"
          style={{ background: `${statusColor}15`, color: statusColor, fontSize: 9, fontWeight: 600 }}>
          {statusLabel}
        </span>
      </div>
      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
        {room.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700 }}>
            {room.entryPoints} pts
          </span>
          <span style={{ color: c.text3, fontSize: 10 }}>
            {room.slotsFilled}/{room.slotsTotal} ({fillPct}%)
          </span>
          <span style={{ fontSize: 10 }}>{room.creator.avatar} {room.creator.name}</span>
        </div>
        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
          Xem room →
        </span>
      </div>
    </TrCard>
  );
}

function ArenaModeRow({ mode }: { mode: ArenaMode }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <TrCard className="p-3 active:opacity-70"
      onClick={() => { navigate(`${prefix}/arena/mode/${mode.id}`); hapticSelection(); }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Zap size={16} color="#F59E0B" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{mode.title}</p>
            {mode.fairPlay && <Shield size={10} color="#10B981" />}
          </div>
          <p style={{ color: c.text3, fontSize: 10 }}>
            {mode.activeChallenges} challenges · {mode.cloneCount} clones
          </p>
        </div>
        <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>Xem mode →</span>
      </div>
    </TrCard>
  );
}

function CreatorChip({ creator }: { creator: ArenaCreator }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <button
      onClick={() => { navigate(`${prefix}/arena/creator/${creator.id}`); hapticSelection(); }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl active:opacity-70"
      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
      <span style={{ fontSize: 14 }}>{creator.avatar}</span>
      <div className="text-left">
        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{creator.name}</p>
        <p style={{ color: c.text3, fontSize: 9 }}>Trust {creator.trustScore}%</p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export function TopicHubPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { topicId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState<string>(topicId || 'crypto');

  // Get data for selected topic
  const predictions = useMemo(() => getPredictionsByTopic(selectedTopic), [selectedTopic]);
  const rooms = useMemo(() => getArenaRoomsByTopic(selectedTopic), [selectedTopic]);
  const modes = useMemo(() => getArenaModesByTopic(selectedTopic), [selectedTopic]);
  const creators = useMemo(() => getCreatorsByTopic(selectedTopic), [selectedTopic]);
  const hasContent = predictions.length > 0 || rooms.length > 0 || modes.length > 0;

  return (
    <PageLayout>
      <Header
        title="Topic Hub"
        back
        action={{ icon: Search, onClick: () => navigate(`${prefix}/search`) }}
      />

      {/* Topic selector — horizontal scroll */}
      <div className="overflow-x-auto scrollbar-none" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex gap-1.5 px-5 py-3">
          {SHARED_TOPICS.map(topic => {
            const isActive = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => { setSelectedTopic(topic.id); hapticSelection(); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0 active:opacity-70 transition-all"
                style={{
                  background: isActive ? `${topic.color}15` : c.surface2,
                  border: `1.5px solid ${isActive ? `${topic.color}40` : 'transparent'}`,
                  color: isActive ? topic.color : c.text2,
                  fontSize: φ.sm,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      <OfflineBanner showStaleHint />

      <PageContent gap="relaxed">
        {/* Topic hero */}
        <TopicHero topicId={selectedTopic} />

        {!hasContent ? (
          <EmptyState
            icon={Search}
            title={`Chưa có nội dung cho ${SHARED_TOPICS.find(t => t.id === selectedTopic)?.label}`}
            subtitle="Hãy quay lại sau hoặc chọn chủ đề khác"
          />
        ) : (
          <>
            {/* ─── Prediction Events ─── */}
            {predictions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.12)' }}>
                      <Target size={12} color="#8B5CF6" />
                    </div>
                    <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                      Prediction Events
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-md"
                      style={{ background: c.surface2, color: c.text3, fontSize: 9, fontWeight: 600 }}>
                      {predictions.length}
                    </span>
                  </div>
                  <button
                    onClick={() => { navigate(`${prefix}/markets/predictions`); hapticSelection(); }}
                    style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {predictions.slice(0, 4).map(e => (
                    <PredictionEventRow key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── Arena Rooms ─── */}
            {rooms.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.12)' }}>
                      <Trophy size={12} color="#F59E0B" />
                    </div>
                    <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                      Live Arena Rooms
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-md"
                      style={{ background: c.surface2, color: c.text3, fontSize: 9, fontWeight: 600 }}>
                      {rooms.length}
                    </span>
                  </div>
                  <button
                    onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
                    style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {rooms.slice(0, 4).map(r => (
                    <ArenaRoomRow key={r.id} room={r} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── Featured Modes ─── */}
            {modes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <Zap size={12} color="#10B981" />
                  </div>
                  <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    Featured Modes
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md"
                    style={{ background: c.surface2, color: c.text3, fontSize: 9, fontWeight: 600 }}>
                    {modes.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {modes.slice(0, 4).map(m => (
                    <ArenaModeRow key={m.id} mode={m} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── Top Creators ─── */}
            {creators.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Users size={12} color="#3B82F6" />
                  </div>
                  <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    Top Creators
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {creators.slice(0, 6).map(cr => (
                    <CreatorChip key={cr.id} creator={cr} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── Create Arena from Topic (§11.7) ─── */}
            <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <Zap size={18} color="#F59E0B" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    Tạo room Arena theo chủ đề
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Tạo thách đấu Arena Points liên quan đến {SHARED_TOPICS.find(t => t.id === selectedTopic)?.label}
                  </p>
                </div>
                <button
                  onClick={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
                  className="px-3 py-2 rounded-xl"
                  style={{ background: '#F59E0B', color: '#fff', fontSize: φ.xs, fontWeight: 700 }}
                >
                  Tạo room
                </button>
              </div>
              {/* §11.7 boundary statement */}
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 8, paddingLeft: 52 }}>
                Chủ đề chỉ là bối cảnh. Room Arena không ảnh hưởng vị thế Prediction Markets.
              </p>
            </TrCard>

            {/* ─── Module boundary disclosure (§12.3) ─── */}
            <div className="rounded-xl p-3.5 text-center"
              style={{ background: c.surface2, border: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.6 }}>
                <strong style={{ color: c.text2 }}>Lưu ý:</strong> Prediction Markets sử dụng USDT thật (vị thế thực).
                Arena Challenges chỉ dùng Arena Points (không phải tài sản tài chính).
                Topic Hub là trang khám phá — 2 module hoàn toàn riêng biệt.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}