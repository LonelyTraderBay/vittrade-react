/**
 * ══════════════════════════════════════════════════════════
 *  09A — Arena × Predictions Bridge Foundation Page
 * ══════════════════════════════════════════════════════════
 *  QA/Design review page — 5 sections:
 *  1. Cross-Module Principles Board
 *  2. Shared Topic Taxonomy
 *  3. Module Boundary Components
 *  4. Bridge Components
 *  5. Example Usage Frames (do/don't)
 *
 *  Route: /arena/bridge-foundation (QA/dev only)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Info, Check, X, Target, Gamepad2,
  ChevronRight, AlertTriangle, BookOpen, Layers, Eye,
  Zap, Link2, Package,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { SHARED_TOPICS, type SharedTopicId, PredictionContextCard } from '../../components/bridges/ArenaPredictionBridges';
import {
  UnifiedTopicChip, type TopicChipState,
  ModuleBoundaryBanner, type BannerVariant,
  ModuleLabelBadge, type BadgeVariant,
  BoundaryInfoRow,
  ArenaRelatedRoomCard,
  DualModuleStatCard,
  BridgeSourceBar,
} from '../../components/bridges/ArenaPredictionFoundation';

/* ═══════════════════════════════════════════
   Data
   ═══════════════════════════════════════════ */

type SectionId = '1' | '2' | '3' | '4' | '5';

const PRINCIPLES = [
  {
    num: 1,
    title: 'Connect by content, not by value',
    desc: 'Bridge chỉ qua topic/category/event title. Không bao giờ qua tiền, wallet, hoặc số dư.',
    icon: Link2,
    color: '#3B82F6',
  },
  {
    num: 2,
    title: 'Arena Points không phải tài sản tài chính',
    desc: 'Points chỉ là điểm xã hội. Không quy đổi, không rút, không trade.',
    icon: Gamepad2,
    color: '#F59E0B',
  },
  {
    num: 3,
    title: 'Prediction Markets không chia sẻ wallet/số dư với Arena',
    desc: 'Wallet, balance, P/L của Prediction hoàn toàn tách biệt. Không hiển thị chéo.',
    icon: Shield,
    color: '#8B5CF6',
  },
  {
    num: 4,
    title: 'Mọi bridge đều phải có disclosure',
    desc: 'ModuleBoundaryBanner hoặc BoundaryInfoRow bắt buộc khi hiển thị content cross-module.',
    icon: Info,
    color: '#10B981',
  },
  {
    num: 5,
    title: 'Không gộp leaderboard metrics',
    desc: 'Leaderboard Prediction ≠ Leaderboard Arena. Không tổng hợp, không so sánh.',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    num: 6,
    title: 'Không gộp settlement / receipts / ledger',
    desc: 'ResultReceipt, Points Ledger, Order Receipt là 3 hệ thống riêng. Không merge.',
    icon: X,
    color: '#EF4444',
  },
];

const ALLOWED_ITEMS = [
  { label: 'Topic', desc: 'Chủ đề chung: Crypto, Macro, Sports...', ok: true },
  { label: 'Category', desc: 'Phân loại event/mode', ok: true },
  { label: 'Event title', desc: 'Tên sự kiện prediction làm bối cảnh', ok: true },
  { label: 'Source label', desc: 'Label "Nguồn bối cảnh"', ok: true },
  { label: 'EventId context', desc: 'Link đến event detail (read-only)', ok: true },
  { label: 'Trust/Safety summary', desc: 'Trust score, Fair Play badge', ok: true },
];

const NOT_ALLOWED_ITEMS = [
  { label: 'Wallet balance', desc: 'Không hiển thị số dư ví ở module khác', ok: false },
  { label: 'PnL', desc: 'Không hiển thị lãi/lỗ prediction ở Arena', ok: false },
  { label: 'Open orders', desc: 'Không hiển thị lệnh đang mở chéo module', ok: false },
  { label: 'Payout value', desc: 'Không hiển thị tiền thật ở Arena', ok: false },
  { label: 'Order receipt', desc: 'Không gộp receipt prediction + arena', ok: false },
  { label: 'Points conversion', desc: 'Không quy đổi Arena Points → tiền', ok: false },
  { label: 'Shared settlement', desc: 'Không kết hợp settlement 2 module', ok: false },
];

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export function ArenaPredictionBridgeFoundationPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [activeSection, setActiveSection] = useState<SectionId>('1');
  const [selectedTopic, setSelectedTopic] = useState<SharedTopicId | null>(null);
  const [bridgeSourceVisible, setBridgeSourceVisible] = useState(true);

  const sections: { id: SectionId; label: string; icon: typeof Layers }[] = [
    { id: '1', label: 'Principles', icon: BookOpen },
    { id: '2', label: 'Topics', icon: Layers },
    { id: '3', label: 'Boundary', icon: Shield },
    { id: '4', label: 'Bridge', icon: Link2 },
    { id: '5', label: 'Examples', icon: Eye },
  ];

  return (
    <PageLayout>
      <Header title="Bridge Foundation" subtitle="Kết nối · Prediction ↔ Arena" back />

      <PageContent padding="compact">
      {/* ─── Dev banner ─── */}
      <div>
        <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(99,102,241,0.3)">
          <Link2 size={14} color="#6366F1" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#6366F1', fontSize: φ.sm, fontWeight: 700 }}>
              09A – Arena × Predictions Bridge Foundation
            </p>
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
              Nền tảng kết nối an toàn giữa Open Arena và Prediction Markets. Khóa boundary trước khi nối flow.
            </p>
          </div>
        </TrCard>
      </div>

      {/* ─── Section tabs ─── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-5 px-5 no-scrollbar">
        {sections.map(s => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); hapticSelection(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
              style={{
                background: active ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                color: active ? c.chipActiveText : c.chipText,
                fontSize: φ.xs, fontWeight: 600, minHeight: 44,
              }}
            >
              <s.icon size={13} /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {/* ══════════════════════════════════════
           SECTION 1 — Cross-Module Principles
           ══════════════════════════════════════ */}
        {activeSection === '1' && (
          <div className="contents">
            <SectionHeader title="1 — Cross-Module Principles" accent accentColor="#6366F1" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              6 nguyên tắc bắt buộc khi kết nối Arena ↔ Prediction Markets. Vi phạm = reject trong code review.
            </p>

            {/* Principles cards */}
            {PRINCIPLES.map(p => {
              const Icon = p.icon;
              return (
                <TrCard key={p.num} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba(p.color, 12), border: `1px solid ${hexToRgba(p.color, 20)}` }}
                    >
                      <Icon size={14} color={p.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: p.color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                          #{p.num}
                        </span>
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.3 }}>
                          {p.title}
                        </p>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}

            {/* Allowed vs Not Allowed board */}
            <div className="mt-2">
              <SectionHeader title="Allowed vs Not Allowed" accent accentColor="#10B981" mb={8} />
            </div>

            {/* Allowed */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <Check size={14} color="#10B981" />
                <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Allowed</p>
              </div>
              <div className="flex flex-col gap-2">
                {ALLOWED_ITEMS.map(item => (
                  <div key={item.label} className="flex items-start gap-2" style={{ minHeight: 24 }}>
                    <Check size={10} color="#10B981" className="shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: c.text3, fontSize: 9, marginLeft: 4 }}>— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Not Allowed */}
            <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <X size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>Not Allowed</p>
              </div>
              <div className="flex flex-col gap-2">
                {NOT_ALLOWED_ITEMS.map(item => (
                  <div key={item.label} className="flex items-start gap-2" style={{ minHeight: 24 }}>
                    <X size={10} color="#EF4444" className="shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: c.text3, fontSize: 9, marginLeft: 4 }}>— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION 2 — Shared Topic Taxonomy
           ══════════════════════════════════════ */}
        {activeSection === '2' && (
          <div className="contents">
            <SectionHeader title="2 — Shared Topic Taxonomy" accent accentColor="#F59E0B" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              8 topics dùng chung cho cả Arena và Prediction Markets. Bridge chỉ qua topic — không qua value.
            </p>

            {/* All topics grid */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>Topic chips</p>
              <div className="flex flex-wrap gap-2">
                {SHARED_TOPICS.map(t => (
                  <UnifiedTopicChip
                    key={t.id}
                    topicId={t.id}
                    state={selectedTopic === t.id ? 'selected' : 'default'}
                    onPress={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
                  />
                ))}
              </div>
              {selectedTopic && (
                <p style={{ color: c.text2, fontSize: φ.xs, marginTop: 8 }}>
                  Selected: <strong>{SHARED_TOPICS.find(t => t.id === selectedTopic)?.label}</strong>
                </p>
              )}
            </TrCard>

            {/* UnifiedTopicChip — All 4 states */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                UnifiedTopicChip — 4 states
              </p>
              {(['default', 'selected', 'compact', 'disabled'] as TopicChipState[]).map(state => (
                <div key={state} className="flex items-center gap-3 mb-2">
                  <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace', width: 60 }}>{state}</span>
                  <div className="flex gap-1.5">
                    <UnifiedTopicChip topicId="crypto" state={state} />
                    <UnifiedTopicChip topicId="macro" state={state} />
                    <UnifiedTopicChip topicId="ai" state={state} />
                  </div>
                </div>
              ))}
            </TrCard>

            {/* Module usage mapping */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                Topic usage mapping
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ModuleLabelBadge variant="prediction_markets" size="md" />
                  <span style={{ color: c.text3, fontSize: 9 }}>→ category filter, event tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <ModuleLabelBadge variant="open_arena" size="md" />
                  <span style={{ color: c.text3, fontSize: 9 }}>→ mode tags, room filter</span>
                </div>
                <div className="flex items-center gap-2">
                  <ModuleLabelBadge variant="linked_context" size="md" />
                  <span style={{ color: c.text3, fontSize: 9 }}>→ bridge matching key</span>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION 3 — Module Boundary Components
           ══════════════════════════════════════ */}
        {activeSection === '3' && (
          <div className="contents">
            <SectionHeader title="3 — Module Boundary Components" accent accentColor="#EF4444" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              3 component types: Banner (6 variants), Badge (6 variants), InfoRow. Bắt buộc khi cross-module.
            </p>

            {/* ModuleBoundaryBanner — 6 variants */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                ModuleBoundaryBanner — 6 variants
              </p>
              <div className="flex flex-col gap-2.5">
                {(['arena_points_only', 'prediction_market', 'market_context_only', 'no_wallet_link', 'verified_future', 'risk_disclosure'] as BannerVariant[]).map(v => (
                  <div key={v}>
                    <p style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace', marginBottom: 4 }}>{v}</p>
                    <ModuleBoundaryBanner variant={v} />
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Compact variants */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                ModuleBoundaryBanner — compact mode
              </p>
              <div className="flex flex-col gap-2">
                <ModuleBoundaryBanner variant="arena_points_only" compact />
                <ModuleBoundaryBanner variant="prediction_market" compact />
                <ModuleBoundaryBanner variant="market_context_only" compact />
              </div>
            </TrCard>

            {/* ModuleLabelBadge — 6 variants */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                ModuleLabelBadge — 6 variants × 2 sizes
              </p>
              <div className="flex flex-col gap-3">
                {(['open_arena', 'prediction_markets', 'linked_context', 'future', 'creator_mode', 'event_context'] as BadgeVariant[]).map(v => (
                  <div key={v} className="flex items-center gap-3">
                    <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace', width: 100, flexShrink: 0 }}>{v}</span>
                    <ModuleLabelBadge variant={v} size="sm" />
                    <ModuleLabelBadge variant={v} size="md" />
                  </div>
                ))}
              </div>
            </TrCard>

            {/* BoundaryInfoRow */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 8 }}>
                BoundaryInfoRow — Disclosure rows
              </p>
              <div className="flex flex-col gap-1">
                <BoundaryInfoRow text="Arena Points không phải tài sản tài chính." color="#F59E0B" icon={Gamepad2} />
                <BoundaryInfoRow text="Prediction Markets tách biệt hoàn toàn." color="#8B5CF6" icon={Target} />
                <BoundaryInfoRow text="Module này không liên quan ví của bạn." color="#6B7280" icon={Shield} />
                <BoundaryInfoRow text="Chỉ dùng làm bối cảnh tham khảo." color="#3B82F6" />
              </div>
            </TrCard>
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION 4 — Bridge Components
           ══════════════════════════════════════ */}
        {activeSection === '4' && (
          <div className="contents">
            <SectionHeader title="4 — Bridge Components" accent accentColor="#3B82F6" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              4 reusable bridge components. Mỗi component đều có mandatory disclosure badge.
            </p>

            {/* 1. PredictionContextCard */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>1. PredictionContextCard</span>
                <ModuleLabelBadge variant="event_context" size="sm" />
              </div>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Dùng trong Arena pages. Hiển thị bối cảnh thị trường prediction — không phải trading UI.
              </p>
              <PredictionContextCard
                eventTitle="BTC vượt $100,000 trước 31/03/2026?"
                probability={72}
                outcomeName="Yes"
                eventId="pred-1"
              />
            </TrCard>

            {/* 2. ArenaRelatedRoomCard */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>2. ArenaRelatedRoomCard</span>
                <ModuleLabelBadge variant="open_arena" size="sm" />
              </div>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Dùng trong Prediction pages. Room card đầy đủ: trust badge, resolution, privacy.
              </p>
              <ArenaRelatedRoomCard
                roomId="room001"
                title="BTC $70K? — Tuần 9"
                format="Closest Guess"
                entryPoints={100}
                slotsFilled={38}
                slotsTotal={50}
                creatorName="CryptoMaster_VN"
                creatorAvatar="🧑‍💻"
                trustScore={92}
                resolutionType="Xác nhận 2 bên"
                privacy="public"
              />
            </TrCard>

            {/* 3. DualModuleStatCard */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>3. DualModuleStatCard</span>
                <ModuleLabelBadge variant="linked_context" size="sm" />
              </div>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Dùng trên Profile. 2 khối stats tách biệt — KHÔNG gộp số liệu.
              </p>
              <DualModuleStatCard
                prediction={{ positions: 5, pnlLabel: '+$127.50', pnlPositive: true }}
                arena={{ pointsLabel: '2,450 pts', rooms: 3 }}
                onPredictionTap={() => navigate(`${prefix}/profile/predictions`)}
                onArenaTap={() => navigate(`${prefix}/profile/arena`)}
              />
            </TrCard>

            {/* 4. BridgeSourceBar */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>4. BridgeSourceBar</span>
                <ModuleLabelBadge variant="linked_context" size="sm" />
              </div>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Dùng trong Arena Studio khi user đến từ Prediction event. Có remove action.
              </p>
              {bridgeSourceVisible ? (
                <BridgeSourceBar
                  eventTitle="BTC vượt $100,000 trước 31/03/2026?"
                  topic="crypto"
                  eventId="pred-1"
                  onRemove={() => setBridgeSourceVisible(false)}
                />
              ) : (
                <button
                  onClick={() => setBridgeSourceVisible(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg active:opacity-70"
                  style={{ background: c.surface2, fontSize: φ.xs, color: c.text2, minHeight: 36 }}
                >
                  Reset demo
                </button>
              )}
            </TrCard>
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION 5 — Example Usage Frames
           ══════════════════════════════════════ */}
        {activeSection === '5' && (
          <div className="contents">
            <SectionHeader title="5 — Example Usage Frames" accent accentColor="#10B981" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              4 frame demo: A–C là đúng cách, D là sai cách (do not use).
            </p>

            {/* Example A: PredictionContextCard in Arena */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <Check size={12} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Example A — Correct</span>
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>
                PredictionContextCard trong Arena Challenge
              </p>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Hiển thị bối cảnh thị trường prediction bên trong challenge detail. Có badge "Market context only" và microcopy disclaimer rõ ràng.
              </p>

              {/* Mini demo */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.divider}` }}>
                <div className="px-3 py-2" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 9 }}>ArenaChallengeDetailPage</p>
                </div>
                <div className="p-3">
                  <PredictionContextCard
                    eventTitle="BTC vượt $100,000 trước 31/03/2026?"
                    probability={72}
                    outcomeName="Yes"
                    eventId="pred-1"
                  />
                </div>
              </div>

              <BoundaryInfoRow
                text="Disclosure badge + microcopy bắt buộc. Không hiển thị order/PnL."
                color="#10B981"
                icon={Check}
              />
            </TrCard>

            {/* Example B: ArenaRelatedRoomCard in Prediction */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <Check size={12} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Example B — Correct</span>
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>
                ArenaRelatedRoomCard trong Prediction Event
              </p>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Hiển thị room Arena liên quan cùng topic. Có badge "Arena Points only" và microcopy "không liên quan wallet".
              </p>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.divider}` }}>
                <div className="px-3 py-2" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 9 }}>PredictionEventDetailPage</p>
                </div>
                <div className="p-3">
                  <ArenaRelatedRoomCard
                    roomId="room003"
                    title="Fed Rate Predict — March 2026"
                    format="Prediction"
                    entryPoints={50}
                    slotsFilled={67}
                    slotsTotal={100}
                    creatorName="PredictorPro"
                    creatorAvatar="🎯"
                    trustScore={88}
                    resolutionType="Cộng đồng bình chọn"
                    privacy="public"
                  />
                </div>
              </div>

              <BoundaryInfoRow
                text="Trust badge + Points-only badge bắt buộc. Không hiển thị wallet balance."
                color="#10B981"
                icon={Check}
              />
            </TrCard>

            {/* Example C: DualModuleStatCard on Profile */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <Check size={12} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>Example C — Correct</span>
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>
                DualModuleStatCard trên Profile
              </p>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                2 block tách biệt với boundary separator. Số liệu KHÔNG gộp. Mỗi block có badge riêng.
              </p>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.divider}` }}>
                <div className="px-3 py-2" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 9 }}>ProfilePage</p>
                </div>
                <div className="p-3">
                  <DualModuleStatCard
                    prediction={{ positions: 3, pnlLabel: '-$42.00', pnlPositive: false }}
                    arena={{ pointsLabel: '1,200 pts', rooms: 1 }}
                  />
                </div>
              </div>
            </TrCard>

            {/* Example D: WRONG way — Do not use */}
            <TrCard className="p-4" accentBorder="rgba(239,68,68,0.3)">
              <div className="flex items-center gap-2 mb-3">
                <X size={12} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>Example D — DO NOT USE</span>
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>
                Gộp Points + PnL (vi phạm Principle #1, #5, #6)
              </p>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
                Anti-pattern: gộp Arena Points và Prediction PnL vào 1 card tổng hợp. Tạo nhầm lẫn giữa tiền thật và điểm xã hội.
              </p>

              {/* Wrong example with strikethough overlay */}
              <div className="rounded-xl overflow-hidden relative" style={{ border: `2px solid rgba(239,68,68,0.4)` }}>
                <div className="px-3 py-2" style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <p style={{ color: '#EF4444', fontSize: 9, fontWeight: 700 }}>WRONG — MergedStatsCard</p>
                </div>
                <div className="p-3" style={{ opacity: 0.5 }}>
                  <TrCard className="p-4">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>
                      Tổng tài sản
                    </p>
                    <div className="flex gap-4 mb-2">
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Prediction P/L</p>
                        <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>+$127.50</p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Arena Points</p>
                        <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>2,450</p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Tổng</p>
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>$127.50 + 2,450pts</p>
                      </div>
                    </div>
                  </TrCard>
                </div>

                {/* Strikethrough overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-red-500 opacity-60" style={{ transform: 'rotate(-8deg)' }} />
                  <div className="absolute px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.9)', transform: 'rotate(-6deg)' }}>
                    <p style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>DO NOT USE</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <BoundaryInfoRow text="Không gộp Points + PnL vào cùng 1 card." color="#EF4444" icon={X} />
                <BoundaryInfoRow text="Không hiển thị 'Tổng tài sản' gộp 2 module." color="#EF4444" icon={X} />
                <BoundaryInfoRow text="Không so sánh Points = tiền thật." color="#EF4444" icon={X} />
              </div>
            </TrCard>
          </div>
        )}

        {/* ─── Footer ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Shield size={12} color="#6B7280" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Foundation layer — boundary phải khóa trước khi nối flow. Open Arena = Points only. Prediction Markets = Real positions. Không bao giờ gộp.
          </p>
        </TrCard>
      </div>
      </PageContent>
    </PageLayout>
  );
}