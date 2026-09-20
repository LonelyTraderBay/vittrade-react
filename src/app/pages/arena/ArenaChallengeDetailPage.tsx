import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronRight, Shield, Users, Clock, Trophy, Info,
  Share2, Send, MessageCircle, Activity, AlertTriangle,
  Flag, Ban, FileText, Camera, StickyNote, CheckCircle2,
  Eye, RefreshCw, XCircle, Wifi, WifiOff, ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/states/EmptyState';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { SkeletonCard, SkeletonRow } from '../../components/states/SkeletonBlock';
import { StatusChip, FormatChip, TrustBadge } from '../../components/arena/ArenaChips';
import { ReportDialog, BlockUserDialog } from '../../components/arena/ArenaModeration';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import {
  DisputeSheet, LeaveChallengeSheet, EvidenceUploadSheet,
  ChatLinkWarningInline, MessageReportSheet,
  detectLinksInText,
} from '../../components/arena/ArenaInteractions';
import {
  LiveCountdown, HostActionsPanel, CancelRoomSheet,
  YourTurnIndicator, StepUpAuthSheet,
} from '../../components/arena/ArenaEnhancements';
import { ShareInviteSheet } from '../../components/arena/ArenaNiceToHave';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import {
  getChallengeById, getRoomById,
  fmtPoints, roomStatusLabel, privacyLabel,
  ARENA_CHAT_MESSAGES, ARENA_ACTIVITY_FEED,
  type ArenaChatMessage, type ArenaActivityEvent,
  type ChallengeState, type ChallengeParticipant, type ChallengeTeam,
  type ParticipantLayout, type ArenaChallenge,
} from '../../data/arenaData';
import { getModeById } from '../../data/arenaData';
import { PredictionContextCard, mapArenaTagToTopic } from '../../components/bridges/ArenaPredictionBridges';
import { PREDICTION_EVENTS } from '../../data/predictionMockData';
import { ModuleBoundaryBanner, BoundaryInfoRow } from '../../components/bridges/ArenaPredictionFoundation';
import { ParticipantGovernanceCard, RuleClarityCard, computeClarityScore } from '../../components/arena/ArenaStudioGovernance';
import { SafetySnapshotCard, TrustBreakdownSheet, buildTrustBreakdownFromCreator } from '../../components/arena/ArenaSafetyTrust';
import { ResultReceiptSheet, buildReceiptFromResolution } from '../../components/arena/ArenaResultReceipt';
import { getResolutionByChallengeId, RESOLUTION_METHOD_CONFIG } from '../../data/arenaData';
import {
  PoolBreakdownCard, DistributionInfoCard, JoinPreviewSheet, RefundPolicyBanner,
} from '../../components/arena/ArenaRewardComponents';

/* ═══════════════════════════════════════════
   Participant Layouts
   ═══════════════════════════════════════════ */

function ParticipantCard({ p, size = 'md' }: { p: ChallengeParticipant; size?: 'sm' | 'md' }) {
  const c = useThemeColors();
  const sz = size === 'md' ? 40 : 32;
  const fs = size === 'md' ? 18 : 14;
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: sz, height: sz, background: c.surface2, fontSize: fs }}>
        {p.avatar}
      </div>
      <div className="min-w-0">
        <p style={{ color: c.text1, fontSize: size === 'md' ? φ.sm : φ.xs, fontWeight: 600 }} className="truncate">{p.name}</p>
        <p style={{ color: c.text3, fontSize: 10 }}>
          {p.role === 'host' ? 'Host' : p.role === 'captain' ? 'Captain' : p.status === 'joined' ? 'Đã vào' : p.status === 'invited' ? 'Đã mời' : 'Đang chờ'}
        </p>
      </div>
    </div>
  );
}

function Layout1v1({ participants }: { participants: ChallengeParticipant[] }) {
  const c = useThemeColors();
  const [a, b] = participants;
  return (
    <div className="flex items-center gap-3">
      <TrCard className="flex-1 p-3">
        <ParticipantCard p={a || { id: '?', name: 'Đang chờ...', avatar: '❓', role: 'player', status: 'waiting' }} />
      </TrCard>
      <span style={{ color: c.text3, fontSize: φ.sm, fontWeight: 700 }}>VS</span>
      <TrCard className="flex-1 p-3">
        <ParticipantCard p={b || { id: '?', name: 'Đang chờ...', avatar: '❓', role: 'player', status: 'waiting' }} />
      </TrCard>
    </div>
  );
}

function Layout1vN({ participants }: { participants: ChallengeParticipant[] }) {
  const c = useThemeColors();
  const host = participants.find(p => p.role === 'host') || participants[0];
  const others = participants.filter(p => p.id !== host?.id).slice(0, 5);
  return (
    <div className="flex items-center gap-3">
      <TrCard className="shrink-0 p-3 w-28">
        <ParticipantCard p={host || { id: '?', name: 'Host', avatar: '❓', role: 'host', status: 'waiting' }} />
      </TrCard>
      <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 700 }}>VS</span>
      <div className="flex-1 flex -space-x-2">
        {others.map(p => (
          <div key={p.id} className="w-9 h-9 rounded-xl flex items-center justify-center border-2 shrink-0"
            style={{ background: c.surface2, borderColor: c.surface, fontSize: 16 }}
            title={p.name}>
            {p.avatar}
          </div>
        ))}
        {participants.length > 6 && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border-2 shrink-0"
            style={{ background: c.surface2, borderColor: c.surface, fontSize: 10, color: c.text3, fontWeight: 600 }}>
            +{participants.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutNvN({ teams, participants }: { teams: ChallengeTeam[]; participants: ChallengeParticipant[] }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  if (teams.length < 2) return null;
  return (
    <div className="flex gap-3">
      {teams.slice(0, 2).map(team => {
        const members = participants.filter(p => p.teamId === team.id);
        const captain = members.find(m => m.role === 'captain') || members[0];
        return (
          <button
            key={team.id}
            onClick={() => hapticSelection()}
            className="flex-1 text-left active:opacity-70"
            aria-label={`Xem ${team.name}`}
          >
            <TrCard className="p-3 h-full"
              accentBorder={hexToRgba(team.color, 30)}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>{team.name}</span>
              </div>
              {captain && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span style={{ fontSize: 14 }}>{captain.avatar}</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{captain.name}</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: hexToRgba(team.color, 15), color: team.color, fontSize: 8, fontWeight: 600 }}>
                    C
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {members.filter(m => m.id !== captain?.id).map(m => (
                  <span key={m.id} className="px-2 py-0.5 rounded-md"
                    style={{ background: c.surface2, color: c.text2, fontSize: 10 }}>
                    {m.avatar} {m.name}
                  </span>
                ))}
              </div>
            </TrCard>
          </button>
        );
      })}
    </div>
  );
}

function LayoutOpenLobby({ participants, slotsTotal, slotsFilled }: { participants: ChallengeParticipant[]; slotsTotal: number; slotsFilled: number }) {
  const c = useThemeColors();
  const joined = participants.filter(p => p.status === 'joined');
  const waiting = participants.filter(p => p.status === 'waiting' || p.status === 'invited');
  const openSlots = slotsTotal - slotsFilled;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span style={{ color: c.text2, fontSize: φ.xs }}>{slotsFilled}/{slotsTotal} đã vào</span>
        <span style={{ color: openSlots > 0 ? '#3B82F6' : '#EF4444', fontSize: φ.xs, fontWeight: 600 }}>
          {openSlots > 0 ? `${openSlots} slot trống` : 'Đã đầy'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {joined.slice(0, 10).map(p => (
          <div key={p.id} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: c.surface2, fontSize: 16 }} title={p.name}>
            {p.avatar}
          </div>
        ))}
        {waiting.slice(0, 3).map(p => (
          <div key={p.id} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: c.surface2, fontSize: 16, opacity: 0.5, border: `1px dashed ${c.borderSolid}` }} title={`${p.name} (đang chờ)`}>
            {p.avatar}
          </div>
        ))}
        {slotsFilled > 10 && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: c.surface2, fontSize: 10, color: c.text3, fontWeight: 600 }}>
            +{slotsFilled - 10}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Chat Message Bubble
   ═══════════════════════════════════════════ */

function ChatBubble({ msg, isMe, onReport }: { msg: ArenaChatMessage; isMe?: boolean; onReport?: (msg: ArenaChatMessage) => void }) {
  const c = useThemeColors();
  const linkInfo = detectLinksInText(msg.text);
  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)' }}>
          <p style={{ color: '#3B82F6', fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex gap-2 mb-3 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: c.surface2, fontSize: 14 }}>
        {msg.sender.avatar}
      </div>
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>{msg.sender.name}</span>
          <span style={{ color: c.text3, fontSize: 9 }}>{msg.time}</span>
          {/* Per-message report (Critical #5) */}
          {!isMe && onReport && (
            <button
              onClick={() => onReport(msg)}
              className="active:opacity-70 ml-1"
              style={{ minWidth: 20, minHeight: 20 }}
              aria-label="Báo cáo tin nhắn"
            >
              <Flag size={8} color={c.text3} />
            </button>
          )}
        </div>
        {/* Link warning inline (Critical #5) */}
        {linkInfo.isRisky && <ChatLinkWarningInline />}
        <div className="rounded-xl px-3 py-2"
          style={{
            background: isMe ? 'rgba(139,92,246,0.15)' : c.surface2,
            borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          }}>
          <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5 }}>{msg.text}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Activity Event Row
   ═══════════════════════════════════════════ */

function ActivityRow({ event }: { event: ArenaActivityEvent }) {
  const c = useThemeColors();
  const typeColors: Record<ArenaActivityEvent['type'], string> = {
    join: '#3B82F6', leave: '#94A3B8', guess: '#8B5CF6',
    result: '#F59E0B', points: '#10B981', system: '#3B82F6',
  };
  return (
    <div className="flex items-start gap-3 px-4 py-2.5"
      style={{ background: event.highlight ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: hexToRgba(typeColors[event.type], 12), fontSize: 14 }}>
        {event.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.4 }}>{event.text}</p>
        <p style={{ color: c.text3, fontSize: 9 }}>{event.time}</p>
      </div>
      {event.highlight && (
        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: '#F59E0B' }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Warning Banner
   ═══════════════════════════════════════════ */

function WarningBanner({ text, type = 'info' }: { text: string; type?: 'info' | 'warning' | 'danger' }) {
  const colors = { info: '#3B82F6', warning: '#F59E0B', danger: '#EF4444' };
  const icons = { info: Info, warning: AlertTriangle, danger: Flag };
  const Icon = icons[type];
  const clr = colors[type];
  return (
    <TrCard className="p-3 flex items-start gap-2" accentBorder={hexToRgba(clr, 25)}>
      <Icon size={14} color={clr} className="shrink-0 mt-0.5" />
      <p style={{ color: clr, fontSize: φ.xs, lineHeight: 1.5 }}>{text}</p>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Skeleton Loader
   ══════════════════════════════════════════ */

function ChallengeSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonRow /><SkeletonRow /><SkeletonRow />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab content types
   ═══════════════════════════════════════════ */

type DetailTab = 'participants' | 'rules' | 'activity' | 'evidence' | 'notes';

const DETAIL_TABS: { id: DetailTab; label: string; icon: typeof Users }[] = [
  { id: 'rules', label: 'Luật chơi', icon: FileText },
  { id: 'evidence', label: 'Bằng chứng', icon: Camera },
  { id: 'participants', label: 'Thành viên', icon: Users },
  { id: 'activity', label: 'Hoạt động', icon: Activity },
  { id: 'notes', label: 'Ghi chú', icon: StickyNote },
];

/* ═══════════════════════════════════════════
   ArenaChallengeDetailPage
   ═══════════════════════════════════════════ */

export function ArenaChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [activeTab, setActiveTab] = useState<DetailTab>('rules');
  const [messages, setMessages] = useState(ARENA_CHAT_MESSAGES);
  const [newMsg, setNewMsg] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [trustSheetOpen, setTrustSheetOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [boundarySheetOpen, setBoundarySheetOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [evidenceUploadOpen, setEvidenceUploadOpen] = useState(false);
  const [msgReportOpen, setMsgReportOpen] = useState<{ text: string; sender: string } | null>(null);
  const [cancelSheetOpen, setCancelSheetOpen] = useState<'cancel' | 'void' | null>(null);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [pendingResolutionNav, setPendingResolutionNav] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [joinPreviewOpen, setJoinPreviewOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Try challenge first, then room
  const challenge = getChallengeById(challengeId || '');
  const room = !challenge ? getRoomById(challengeId || '') : null;

  if (!challenge && !room) {
    return (
      <PageLayout>
        <Header title="Challenge" subtitle="Chi tiết · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Challenge này không tồn tại hoặc đã bị xoá" />
      </PageLayout>
    );
  }

  // Unified view data
  const data: ArenaChallenge = challenge || {
    id: room!.id,
    title: room!.title,
    description: '',
    modeId: room!.modeId,
    modeName: room!.format,
    creator: { ...room!.creator, id: 'cr001', modesCreated: 0, trustScore: 0, fairPlayBadge: false, followers: 0, totalChallenges: 0 },
    entryPoints: room!.entryPoints,
    prizePool: room!.entryPoints * room!.slotsFilled,
    slotsTotal: room!.slotsTotal,
    slotsFilled: room!.slotsFilled,
    status: room!.status,
    privacy: room!.privacy,
    format: room!.format,
    rules: ['Luật do người tạo quy định', 'Entry points bị trừ khi tham gia'],
    startAt: '',
    endAt: room!.endsAt,
    leaderboard: [],
    challengeState: room!.status === 'waiting' ? 'open' : room!.status === 'in_progress' ? 'live' : 'resolved',
    participantLayout: 'open_lobby',
  };

  const cState = data.challengeState || 'open';
  const st = roomStatusLabel(data.status);
  const pr = privacyLabel(data.privacy);
  const fillPct = Math.round((data.slotsFilled / data.slotsTotal) * 100);
  const canJoin = (cState === 'open') && data.slotsFilled < data.slotsTotal;
  const isLive = cState === 'live';
  const isPendingResult = cState === 'pending_result';
  const isResolved = cState === 'resolved';
  const participants = data.participants || [];
  const teams = data.teams || [];
  const layout: ParticipantLayout = data.participantLayout || 'open_lobby';

  // Reward distribution computed
  const rdFeePct = data.platformFeePct ?? 10;
  const rdCreatorPct = data.creatorCutPct ?? 0;
  const rdConsolation = data.consolationEnabled ?? false;
  const rdConsolationPct = data.consolationPct ?? 0;
  const rdBonus = data.bonusPool ?? 0;
  const rdGross = data.prizePool + rdBonus;
  const rdPlatformFee = Math.round(rdGross * rdFeePct / 100);
  const rdCreatorAmt = Math.round(rdGross * rdCreatorPct / 100);
  const rdAfter = rdGross - rdPlatformFee - rdCreatorAmt;
  const rdConsolationAmt = rdConsolation ? Math.round(rdAfter * rdConsolationPct / 100) : 0;
  const rdNetPool = rdAfter - rdConsolationAmt;
  const rdTiers = data.rewardTiers || [{ rank: '🏆 Winner', pct: 100 }];
  const rdDistLabel = data.rewardDistLabel || 'Theo luật challenge';

  // Time left
  const endDate = data.endAt ? new Date(data.endAt) : null;
  const now = new Date();
  const msLeft = endDate ? endDate.getTime() - now.getTime() : 0;
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  const handleSend = () => {
    if (!newMsg.trim()) return;
    hapticSelection();
    const msg: ArenaChatMessage = {
      id: `msg_me_${Date.now()}`,
      sender: { name: 'Bạn', avatar: '😊' },
      text: newMsg.trim(),
      time: 'Vừa xong',
    };
    setMessages(prev => [...prev, msg]);
    setNewMsg('');
    actionToast.success(TOAST.ARENA.MESSAGE_SENT);
  };

  return (
    <PageLayout>
      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
        <Header title="Chi tiết challenge" subtitle="Thử thách · Open Arena" back />

        {isLoading ? <ChallengeSkeleton /> : (
          <PageContent gap="default">

          {/* ─── Top Section: Title + Chips ─── */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <StatusChip status={cState} size="md" />
              {layout && <FormatChip format={layout} size="md" />}
              <span className="px-2.5 py-1 rounded-lg"
                style={{ background: c.chipBg, color: c.chipText, fontSize: 10, border: `1px solid ${c.chipBorder}` }}>
                {pr.icon} {pr.label}
              </span>
              <TrustBadge type="points_only" size="md" />
            </div>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
              {data.title}
            </p>
            {data.modeName && (
              <button
                onClick={() => { navigate(`${prefix}/arena/mode/${data.modeId}`); hapticSelection(); }}
                className="flex items-center gap-1 active:opacity-70"
                style={{ minHeight: 28 }}
              >
                <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 600 }}>{data.modeName}</span>
                <ChevronRight size={12} color="#8B5CF6" />
              </button>
            )}
            {data.description && (
              <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginTop: 4 }}>{data.description}</p>
            )}

            {/* 09D: Linked Source Card — when room was created from Prediction event */}
            {(() => {
              const mode = getModeById(data.modeId);
              const isFromPrediction = mode?.templateId === 'prediction' || mode?.templateId === 'closest_guess';
              if (!isFromPrediction) return null;
              const linkedEvent = PREDICTION_EVENTS[0]; // mock: first prediction event as source
              return (
                <div className="mt-3">
                  <TrCard className="p-3.5" accentBorder="rgba(59,130,246,0.3)">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                        Linked Source
                      </span>
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: 8, fontWeight: 700 }}>
                        Market context only
                      </span>
                    </div>
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }} className="line-clamp-2">
                      {linkedEvent.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { navigate(`${prefix}/markets/predictions/event/${linkedEvent.id}`); hapticSelection(); }}
                        className="flex items-center gap-1 active:opacity-70"
                        style={{ minHeight: 28 }}
                      >
                        <ExternalLink size={10} color="#8B5CF6" />
                        <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Xem event gốc</span>
                      </button>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>
                      Kết quả room Arena không phải kết quả trade. Room này chỉ dùng Arena Points.
                    </p>
                  </TrCard>
                </div>
              );
            })()}
          </div>

          {/* ─── Score / Live Status Card ─── */}
          <div>
            <TrCard className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <p style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtPoints(data.entryPoints)}
                  </p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Entry Points</p>
                </div>
                <div className="text-center">
                  <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtPoints(data.prizePool)}
                  </p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Prize Pool</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} color={c.text3} />
                    <span style={{ color: c.text2, fontSize: φ.xs }}>
                      {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã kết thúc'}
                    </span>
                  </div>
                  {isLive && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                      <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Live</span>
                    </div>
                  )}
                </div>

                {/* Important #7: Live Countdown Timer */}
                {(isLive || isPendingResult) && endDate && (
                  <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl" style={{ background: c.surface2 }}>
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Đếm ngược</span>
                    <LiveCountdown endTime={endDate} size="md" />
                  </div>
                )}

                {/* Important #9: "Your Turn" indicator */}
                {isPendingResult && (
                  <div className="mb-2">
                    <YourTurnIndicator show label="Đến lượt bạn — chốt kết quả" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Người tham gia</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    {data.slotsFilled} / {data.slotsTotal}
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: fillPct >= 90 ? '#EF4444' : fillPct >= 60 ? '#F59E0B' : '#3B82F6',
                    }}
                  />
                </div>
                {fillPct >= 80 && cState === 'open' && (
                  <p style={{ color: '#EF4444', fontSize: φ.xs, marginTop: 4 }}>
                    Sắp đầy — hãy tham gia sớm
                  </p>
                )}
              </div>
            </TrCard>
          </div>

          {/* ─── C1: Pool & Fee Breakdown ─── */}
          <div>
            <PoolBreakdownCard
              grossPool={rdGross}
              entryPoints={data.entryPoints}
              slotsFilled={data.slotsFilled}
              slotsTotal={data.slotsTotal}
              platformFeePct={rdFeePct}
              creatorCutPct={rdCreatorPct}
              consolationEnabled={rdConsolation}
              consolationPct={rdConsolationPct}
              bonusPool={rdBonus}
              dynamicPool={data.dynamicPool}
              dynamicPoolMin={data.dynamicPoolMin}
            />
          </div>

          {/* ─── C3: Distribution Type Info ─── */}
          <div>
            <DistributionInfoCard
              distLabel={rdDistLabel}
              distType={data.rewardDistType || 'top3'}
              tiers={rdTiers}
              netPool={rdNetPool}
              consolationEnabled={rdConsolation}
              consolationPct={rdConsolationPct}
            />
          </div>

          {/* ─── I5: Refund Policy ─── */}
          {data.refundPolicy && (
            <div>
              <RefundPolicyBanner policy={data.refundPolicy} />
            </div>
          )}

          {/* ─── Participant Layout ─── */}
          {participants.length > 0 && (
            <div>
              <SectionHeader title="Thành viên" accent accentColor="#8B5CF6" mb={8} />
              {layout === '1v1' && <Layout1v1 participants={participants} />}
              {layout === '1vN' && <Layout1vN participants={participants} />}
              {layout === 'NvN' && <LayoutNvN teams={teams} participants={participants} />}
              {layout === 'open_lobby' && <LayoutOpenLobby participants={participants} slotsTotal={data.slotsTotal} slotsFilled={data.slotsFilled} />}
            </div>
          )}

          {/* ─── Rules Summary Card ─── */}
          <div>
            <SectionHeader title="Tóm tắt luật chơi" accent accentColor="#10B981" mb={8} />
            <TrCard className="p-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Điều kiện thắng', value: data.winCondition || 'Theo luật mode' },
                  { label: 'Chốt kết quả', value: data.resolutionMethod || 'Tự động' },
                  { label: 'Bằng chứng', value: data.evidenceRequirement || 'Không yêu cầu' },
                  { label: 'Hủy / Void', value: data.voidRule || 'Theo chính sách chung' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 90 }}>{row.label}</span>
                    <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>

          {/* ─── 07A Governance & Trust (participant view) ─── */}
          <div>
            <ParticipantGovernanceCard
              resolutionMethod={data.resolutionMethod}
              evidenceRequired={data.evidenceRequirement}
              voidRule={data.voidRule}
              privacy={privacyLabel(data.privacy).label}
            />
          </div>

          {/* ─── Rule Clarity Score (participant trust signal) ─── */}
          <div>
            <RuleClarityCard
              score={computeClarityScore({
                title: data.title,
                description: data.description || '',
                winCondition: data.winCondition || '',
                tieRule: '',
                voidRule: data.voidRule || '',
                resultDeadline: data.endAt || '',
                evidenceRequired: (data.evidenceRequirement || '').toLowerCase() !== 'không yêu cầu' && (data.evidenceRequirement || '').toLowerCase() !== 'không cần',
                joinStyle: data.privacy === 'public' ? 'public' : data.privacy === 'private' ? 'invite_only' : 'unlisted',
              })}
            />
          </div>

          {/* ─── Creator ─── */}
          <div>
            <TrCard hover as="button"
              onClick={() => { navigate(`${prefix}/arena/creator/${data.creator.id}`); hapticSelection(); }}
              className="flex items-center gap-3 p-4 w-full active:opacity-70">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: c.surface2, fontSize: 20 }}>
                {data.creator.avatar}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{data.creator.name}</p>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Người tạo</span>
                  {data.creator.fairPlayBadge && (
                    <span className="flex items-center gap-0.5" style={{ color: '#10B981', fontSize: 10 }}>
                      <Shield size={8} /> Fair Play
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </TrCard>
          </div>

          {/* ─── Safety & Report Link ─── */}
          <div>
            <TrCard hover as="button"
              onClick={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
              className="flex items-center gap-3 p-3.5 w-full active:opacity-70"
              style={{ minHeight: 48 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <Shield size={16} color="#10B981" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>An toàn & báo cáo</p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Quy tắc, report vi phạm</p>
              </div>
              <ChevronRight size={14} color={c.text3} />
            </TrCard>
          </div>

          {/* ─── Important #8: Host Actions Panel ─── */}
          <div>
            <HostActionsPanel
              isHost={data.creator.id === 'cr001'}
              challengeState={cState}
              challengeId={data.id}
              onEdit={() => { navigate(`${prefix}/arena/studio`); hapticSelection(); }}
              onCancel={() => { setCancelSheetOpen('cancel'); hapticSelection(); }}
              onVoid={() => { setCancelSheetOpen('void'); hapticSelection(); }}
            />
          </div>

          {/* ─── 5-Tab Navigation ─── */}
          <div className="flex gap-1.5 overflow-x-auto px-5 mb-4 no-scrollbar">
            {DETAIL_TABS.map(t => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); hapticSelection(); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    color: active ? c.chipActiveText : c.chipText,
                    fontSize: φ.xs,
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ─── Tab Content ─── */}
          <div className="px-5 mb-4">

            {/* Participants tab */}
            {activeTab === 'participants' && (
              <TrCard overflow>
                {participants.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users size={24} color={c.text3} className="mx-auto mb-2" />
                    <p style={{ color: c.text3, fontSize: φ.sm }}>Chưa có người tham gia</p>
                  </div>
                ) : (
                  <div className="contents">
                    {participants.map((p, i) => (
                      <div key={p.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: i < participants.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 52 }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: c.surface2, fontSize: 16 }}>
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{p.name}</p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {p.role === 'host' ? 'Host' : p.role === 'captain' ? 'Captain' : 'Player'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md"
                          style={{
                            background: p.status === 'joined' ? 'rgba(16,185,129,0.12)' : p.status === 'invited' ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.12)',
                            color: p.status === 'joined' ? '#10B981' : p.status === 'invited' ? '#3B82F6' : '#94A3B8',
                            fontSize: 10, fontWeight: 600,
                          }}>
                          {p.status === 'joined' ? 'Đã vào' : p.status === 'invited' ? 'Đã mời' : 'Đang chờ'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TrCard>
            )}

            {/* Rules tab */}
            {activeTab === 'rules' && (
              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  {data.rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.6 }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </TrCard>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <TrCard className="overflow-hidden">
                {/* Live indicator */}
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                  <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Live feed</span>
                  <span style={{ color: c.text3, fontSize: 10 }}>· Cập nhật tự động</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {ARENA_ACTIVITY_FEED.slice().reverse().map((event, i) => (
                    <div key={event.id}
                      style={{ borderBottom: i < ARENA_ACTIVITY_FEED.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                      <ActivityRow event={event} />
                    </div>
                  ))}
                </div>
              </TrCard>
            )}

            {/* Evidence tab */}
            {activeTab === 'evidence' && (
              <TrCard className="p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <Camera size={28} color={c.text3} />
                  <p style={{ color: c.text2, fontSize: φ.sm }}>
                    {data.evidenceRequirement === 'Không cần'
                      ? 'Challenge này không yêu cầu bằng chứng.'
                      : 'Chưa có bằng chứng nào được gửi. Gửi bằng chứng khi challenge đang diễn ra.'}
                  </p>
                  {isLive && data.evidenceRequirement !== 'Không cần' && (
                    <button
                      onClick={() => { setEvidenceUploadOpen(true); hapticSelection(); }}
                      className="px-4 py-2.5 rounded-xl active:opacity-70"
                      style={{
                        background: c.chipActiveBg, border: `1.5px solid ${c.chipActiveBorder}`,
                        color: c.chipActiveText, fontSize: φ.sm, fontWeight: 600, minHeight: 44,
                      }}>
                      Gửi bằng chứng
                    </button>
                  )}
                </div>
              </TrCard>
            )}

            {/* Notes tab (chat) */}
            {activeTab === 'notes' && (
              <TrCard className="overflow-hidden">
                <div className="p-3 max-h-80 overflow-y-auto" style={{ minHeight: 200 }}>
                  {messages.map(msg => (
                    <ChatBubble key={msg.id} msg={msg} isMe={msg.sender.name === 'Bạn'} onReport={(m) => setMsgReportOpen({ text: m.text, sender: m.sender.name })} />
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5"
                  style={{ borderTop: `1px solid ${c.divider}` }}>
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 py-2.5 px-3 rounded-xl"
                    style={{
                      background: c.searchBg, border: `1px solid ${c.searchBorder}`,
                      color: c.text1, fontSize: φ.xs, outline: 'none', minHeight: 44,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim()}
                    className="rounded-xl flex items-center justify-center shrink-0 active:opacity-70"
                    aria-label="Gửi tin nhắn"
                    style={{
                      width: 44, height: 44,
                      background: newMsg.trim() ? '#8B5CF6' : c.surface2,
                      opacity: newMsg.trim() ? 1 : 0.5,
                    }}
                  >
                    <Send size={16} color={newMsg.trim() ? '#fff' : c.text3} />
                  </button>
                </div>
              </TrCard>
            )}
          </div>

          {/* ─── Leaderboard preview ─── */}
          {data.leaderboard.length > 0 && (
            <div className="px-5 mb-4">
              <SectionHeader title="Bảng xếp hạng" accent accentColor="#F59E0B" />
              <TrCard overflow>
                {data.leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={entry.rank}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < Math.min(5, data.leaderboard.length) - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 48 }}>
                    <span style={{
                      color: entry.rank <= 3 ? ['#F59E0B', '#94A3B8', '#CD7F32'][entry.rank - 1] : c.text3,
                      fontSize: φ.body, fontWeight: 700, width: 24, textAlign: 'center', fontFamily: 'monospace',
                    }}>
                      {entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: c.surface2, fontSize: 16 }}>
                      {entry.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{entry.name}</p>
                      {entry.accuracy !== undefined && (
                        <p style={{ color: c.text3, fontSize: 10 }}>{entry.accuracy}% accuracy</p>
                      )}
                    </div>
                    <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtPoints(entry.points)} pts
                    </span>
                  </div>
                ))}
              </TrCard>
            </div>
          )}

          {/* ─── Warning Banners ─── */}
          <div className="px-5 flex flex-col gap-2 mb-4">
            <WarningBanner text="Arena Points chỉ dùng trong Open Arena, không phải tài sản tài chính." type="info" />
            <WarningBanner text="Không thỏa thuận giao dịch ngoài nền tảng." type="warning" />
            {cState === 'under_review' && (
              <WarningBanner text="Challenge này đang được xem xét bởi đội ngũ kiểm duyệt." type="warning" />
            )}
            {cState === 'reported' && (
              <WarningBanner text="Nội dung đã bị báo cáo. Kết quả có thể bị tạm giữ." type="danger" />
            )}
            {data.warningBanners?.map((b, i) => (
              <WarningBanner key={i} text={b} type="info" />
            ))}
          </div>

          {/* ─── Actions by State + Always-available ─── */}
          <div className="px-5 flex flex-col gap-3">

            {/* 07D: Prediction Context Bridge */}
            {(() => {
              const mode = getModeById(data.modeId);
              if (!mode) return null;
              // Show context card if mode has prediction-related tags
              const hasPredictionTopic = mode.tags.some(t => mapArenaTagToTopic(t) !== null);
              if (!hasPredictionTopic && mode.templateId !== 'prediction') return null;
              const modeTags = mode.tags.map(t => t.toLowerCase());
              const matchedEvent = PREDICTION_EVENTS.find(ev =>
                modeTags.some(tag =>
                  ev.category.toLowerCase().includes(tag) ||
                  ev.tags?.some(et => et.toLowerCase().includes(tag))
                )
              ) || PREDICTION_EVENTS[0];
              const yesOutcome = matchedEvent.outcomes.find(o => o.label === 'Yes');
              return (
                <div className="mb-1">
                  <PredictionContextCard
                    eventTitle={matchedEvent.title}
                    probability={yesOutcome?.chance ?? 50}
                    outcomeName="Yes"
                    eventId={matchedEvent.id}
                  />
                  {/* 09C: "Hiểu ranh giới" link */}
                  <button
                    onClick={() => { setBoundarySheetOpen(true); hapticSelection(); }}
                    className="flex items-center gap-1.5 mt-2 active:opacity-70"
                    style={{ minHeight: 28 }}
                  >
                    <Info size={10} color="#6B7280" />
                    <span style={{ color: '#6B7280', fontSize: φ.xs, fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'rgba(107,114,128,0.3)', textUnderlineOffset: 2 }}>
                      Hiểu ranh giới giữa Arena và Prediction
                    </span>
                  </button>
                </div>
              );
            })()}

            {/* 07B: Safety Snapshot */}
            <SafetySnapshotCard
              data={{
                resolutionMethod: data.resolutionMethod || 'Bình chọn',
                evidenceRequired: data.evidenceRequirement || 'Ảnh chụp màn hình',
                privacy: privacyLabel(data.privacy).label,
                voidRule: data.voidRule,
                creatorTrustScore: data.creator.trustScore,
                creatorName: data.creator.name,
              }}
              onTrustTap={() => { setTrustSheetOpen(true); hapticSelection(); }}
              onSafetyTap={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
              onResolutionTap={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
              className="mb-1"
            />

            {/* State-based primary CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShareOpen(true); hapticSelection(); }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 active:opacity-70"
                aria-label="Chia sẻ"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
              >
                <Share2 size={18} color={c.text2} />
              </button>
              <div className="flex-1">
                {canJoin && (
                  <CTAButton onClick={() => { setJoinPreviewOpen(true); hapticSelection(); }}>
                    Tham gia · {fmtPoints(data.entryPoints)} pts
                  </CTAButton>
                )}
                {cState === 'full' && (
                  <CTAButton disabled>Đã đầy</CTAButton>
                )}
                {isLive && (
                  <CTAButton onClick={() => { setEvidenceUploadOpen(true); hapticSelection(); }}>
                    Gửi bằng chứng
                  </CTAButton>
                )}
                {isPendingResult && (
                  <CTAButton onClick={() => { setPendingResolutionNav(true); setStepUpOpen(true); hapticSelection(); }}>
                    Chốt kết quả
                  </CTAButton>
                )}
                {isResolved && (
                  <div className="flex flex-col gap-2">
                    <CTAButton onClick={() => { setReceiptOpen(true); hapticSelection(); }}>
                      Xem biên nhận
                    </CTAButton>
                    <button
                      onClick={() => { setDisputeOpen(true); hapticSelection(); }}
                      className="w-full py-3 rounded-2xl active:opacity-70"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.12)', color: '#EF4444', fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}
                    >
                      Tranh chấp kết quả
                    </button>
                    <button
                      onClick={() => { actionToast.success(TOAST.ARENA.REMATCH_SENT); hapticSelection(); }}
                      className="w-full py-3 rounded-2xl active:opacity-70"
                      style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44 }}
                    >
                      Tái đấu
                    </button>
                  </div>
                )}
                {(cState === 'canceled' || cState === 'hidden' || cState === 'error') && (
                  <CTAButton disabled>
                    {cState === 'canceled' ? 'Đã hủy' : cState === 'hidden' ? 'Đã ẩn' : 'Lỗi'}
                  </CTAButton>
                )}
                {cState === 'under_review' && (
                  <CTAButton disabled>Đang xem xét</CTAButton>
                )}
                {cState === 'reported' && (
                  <CTAButton disabled>Đã bị báo cáo</CTAButton>
                )}
                {cState === 'offline' && (
                  <CTAButton disabled>Ngoại tuyến</CTAButton>
                )}
              </div>
            </div>

            {/* Always-available actions */}
            <div className="flex gap-2">
              {/* Leave button — only for open/live states (Critical #2) */}
              {(cState === 'open' || isLive) && (
                <button
                  onClick={() => { setLeaveOpen(true); hapticSelection(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:opacity-70"
                  style={{
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
                    color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                  }}
                >
                  <XCircle size={13} /> Rời
                </button>
              )}
              <button
                onClick={() => { setReportOpen(true); hapticSelection(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:opacity-70"
                style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                  color: '#EF4444', fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                }}
              >
                <Flag size={13} /> Báo cáo
              </button>
              <button
                onClick={() => { setBlockOpen(true); hapticSelection(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:opacity-70"
                style={{
                  background: c.chipBg, border: `1px solid ${c.chipBorder}`,
                  color: c.chipText, fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                }}
              >
                <Ban size={13} /> Chặn
              </button>
            </div>
          </div>

      {/* ─── Moderation Dialogs ─── */}
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetName={data.title}
        targetType="challenge"
      />
      <BlockUserDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        userName={data.creator.name}
        userAvatar={data.creator.avatar}
      />
      <ArenaPageFooter />

      {/* 09C: Module Boundary Info Sheet */}
      <BottomSheetV2 open={boundarySheetOpen} onClose={() => setBoundarySheetOpen(false)} title="Ranh giới Arena & Prediction" maxHeight="70vh">
        <div className="flex flex-col gap-3">
          <ModuleBoundaryBanner variant="arena_points_only" />
          <ModuleBoundaryBanner variant="prediction_market" />
          <ModuleBoundaryBanner variant="market_context_only" />
          <ModuleBoundaryBanner variant="no_wallet_link" />
          <div className="mt-1">
            <BoundaryInfoRow icon={Shield} text="Arena Points không phải tài sản tài chính." color="#F59E0B" />
            <BoundaryInfoRow icon={Shield} text="Prediction Markets tách biệt hoàn toàn về ví và số dư." color="#8B5CF6" />
            <BoundaryInfoRow icon={Info} text="Chỉ chia sẻ bối cảnh (topic, event title). Không bao giờ chia sẻ giá trị." color="#6B7280" />
          </div>
        </div>
      </BottomSheetV2>

      {/* Trust Breakdown Sheet */}
      <TrustBreakdownSheet
        open={trustSheetOpen}
        onClose={() => setTrustSheetOpen(false)}
        data={buildTrustBreakdownFromCreator(data.creator)}
      />

      {/* Result Receipt Sheet (07D) */}
      {isResolved && (() => {
        const resolution = getResolutionByChallengeId(data.id);
        if (!resolution) return null;
        const methodCfg = RESOLUTION_METHOD_CONFIG[resolution.method];
        const receiptData = buildReceiptFromResolution(data, resolution, methodCfg?.label || 'Tự động');
        return (
          <ResultReceiptSheet
            open={receiptOpen}
            onClose={() => setReceiptOpen(false)}
            data={receiptData}
            onViewChallenge={() => navigate(`${prefix}/arena/resolution`)}
            onViewLedger={() => navigate(`${prefix}/arena/ledger`)}
          />
        );
      })()}

      {/* ─── Dispute Sheet (Critical #1) ─── */}
      <DisputeSheet
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        challengeTitle={data.title}
        challengeId={data.id}
        prizePool={data.prizePool}
        currentResult={data.leaderboard[0]?.name}
      />

      {/* ─── Leave Challenge Sheet (Critical #2) ─── */}
      <LeaveChallengeSheet
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        challengeTitle={data.title}
        entryPoints={data.entryPoints}
        isBeforeDeadline={daysLeft > 0}
        deadline={data.endAt ? new Date(data.endAt).toLocaleDateString('vi-VN') : undefined}
      />

      {/* ─── Evidence Upload Sheet (Critical #3) ─── */}
      <EvidenceUploadSheet
        open={evidenceUploadOpen}
        onClose={() => setEvidenceUploadOpen(false)}
        challengeTitle={data.title}
      />

      {/* ─── Message Report Sheet (Critical #5) ─── */}
      <MessageReportSheet
        open={!!msgReportOpen}
        onClose={() => setMsgReportOpen(null)}
        messageText={msgReportOpen?.text || ''}
        senderName={msgReportOpen?.sender || ''}
      />

      {/* ─── Cancel/Void Room Sheet (Important #8) ─── */}
      <CancelRoomSheet
        open={!!cancelSheetOpen}
        onClose={() => setCancelSheetOpen(null)}
        challengeTitle={data.title}
        slotsFilled={data.slotsFilled}
        entryPoints={data.entryPoints}
        type={cancelSheetOpen || 'cancel'}
      />

      {/* ─── Share/Invite Sheet (Nice-to-have #11) ─── */}
      <ShareInviteSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        challengeTitle={data.title}
        challengeId={data.id}
        entryPoints={data.entryPoints}
        slotsFilled={data.slotsFilled}
        slotsTotal={data.slotsTotal}
      />

      {/* ─── Step-up Auth Sheet (Important #10) ─── */}
      <StepUpAuthSheet
        open={stepUpOpen}
        onClose={() => { setStepUpOpen(false); setPendingResolutionNav(false); }}
        onSuccess={() => {
          if (pendingResolutionNav) {
            navigate(`${prefix}/arena/resolution`);
          }
        }}
        actionLabel="Chốt kết quả challenge"
        riskLevel="high"
      />

      {/* ─── C2: Join Preview Sheet ─── */}
      <JoinPreviewSheet
        open={joinPreviewOpen}
        onClose={() => setJoinPreviewOpen(false)}
        onConfirmJoin={() => {
          setJoinPreviewOpen(false);
          navigate(`${prefix}/arena/join/${data.id}`);
        }}
        challengeTitle={data.title}
        entryPoints={data.entryPoints}
        grossPool={rdGross}
        distLabel={rdDistLabel}
        tiers={rdTiers}
        platformFeePct={rdFeePct}
        creatorCutPct={rdCreatorPct}
        consolationEnabled={rdConsolation}
        consolationPct={rdConsolationPct}
        slotsFilled={data.slotsFilled}
        slotsTotal={data.slotsTotal}
        refundPolicy={data.refundPolicy}
      />
          </PageContent>
        )}
      </PullToRefresh>
    </PageLayout>
  );
}