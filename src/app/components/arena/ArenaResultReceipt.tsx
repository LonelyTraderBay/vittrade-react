/**
 * ══════════════════════════════════════════════════════════
 *  ResultReceiptSheet — 07D Arena Resolution & Ledger
 * ══════════════════════════════════════════════════════════
 *  Bottom sheet showing the settlement receipt for a resolved challenge.
 *  Used in: ArenaResolutionCenterPage, ArenaChallengeDetailPage
 *
 *  Content:
 *  - Challenge title
 *  - Result (winner/loser/draw/void)
 *  - Participants
 *  - Points pool + distribution
 *  - Settlement time
 *  - Ledger references
 *
 *  Tone: rõ ràng, chuyên nghiệp, auditability-first.
 *  "Arena Points không phải tài sản tài chính."
 */

import React from 'react';
import {
  X, Trophy, Users, Clock, Shield, ChevronRight,
  CheckCircle2, Copy, Share2, BookOpen, Receipt, AlertTriangle,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../ui/TrCard';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { fmtPoints } from '../../data/arenaData';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface ReceiptParticipant {
  name: string;
  avatar: string;
  result: 'winner' | 'loser' | 'draw' | 'void';
  pointsChange: number;
}

export interface ResultReceiptData {
  challengeId: string;
  challengeTitle: string;
  format: string;
  resultLabel: string;
  winnerName: string;
  winnerAvatar: string;
  participants: ReceiptParticipant[];
  prizePool: number;
  poolDistribution: string;
  settlementTime: string;
  method: string;
  ledgerRefIds: string[];
  receiptId: string;
  /* ─── I4: Fee breakdown auditability ─── */
  feeBreakdown?: {
    grossPool: number;
    platformFeePct: number;
    platformFeeAmt: number;
    creatorCutPct: number;
    creatorCutAmt: number;
    consolationPct: number;
    consolationAmt: number;
    netPool: number;
  };
}

/* ═══════════════════════════════════════════
   ResultReceiptSheet
   ═══════════════════════════════════════════ */

interface ResultReceiptSheetProps {
  open: boolean;
  onClose: () => void;
  data: ResultReceiptData;
  onViewChallenge?: () => void;
  onViewLedger?: () => void;
}

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  winner: { label: 'Thắng', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  loser: { label: 'Thua', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  draw: { label: 'Hoà', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  void: { label: 'Void', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export function ResultReceiptSheet({
  open, onClose, data, onViewChallenge, onViewLedger,
}: ResultReceiptSheetProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const handleCopyReceipt = () => {
    hapticSelection();
    actionToast.success(TOAST.COPY.withLabel('mã biên nhận'));
  };

  const handleShare = () => {
    hapticSelection();
    actionToast.success(TOAST.ARENA.LINK_COPIED);
  };

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Biên nhận kết quả">
          <div className="flex flex-col gap-4">

            {/* ─── Result hero ─── */}
            <div
              className="p-5 rounded-2xl text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0f1a2e 0%, #1a1040 100%)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 65%)' }} />

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: φ.xs, marginBottom: 4 }}>
                Kết quả
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span style={{ fontSize: 24 }}>{data.winnerAvatar}</span>
                <span style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>
                  {data.winnerName}
                </span>
              </div>
              <span
                className="inline-block px-3 py-1 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}
              >
                {data.resultLabel}
              </span>
            </div>

            {/* ─── Challenge info ─── */}
            <TrCard className="p-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 80 }}>Challenge</span>
                  <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                    {data.challengeTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Thể thức</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.format}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Phương thức chốt</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.method}</span>
                </div>
              </div>
            </TrCard>

            {/* ─── Participants ─── */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} color={c.text2} />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Người tham gia</span>
              </div>
              <div className="flex flex-col gap-2">
                {data.participants.map(p => {
                  const rCfg = RESULT_CONFIG[p.result] || RESULT_CONFIG.void;
                  return (
                    <div key={p.name} className="flex items-center gap-3" style={{ minHeight: 40 }}>
                      <span style={{ fontSize: 16 }}>{p.avatar}</span>
                      <span className="flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                        {p.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md"
                        style={{ background: rCfg.bg, color: rCfg.color, fontSize: 10, fontWeight: 600 }}
                      >
                        {rCfg.label}
                      </span>
                      <span style={{
                        color: p.pointsChange > 0 ? '#10B981' : p.pointsChange < 0 ? '#EF4444' : c.text3,
                        fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace', minWidth: 50, textAlign: 'right',
                      }}>
                        {p.pointsChange > 0 ? '+' : ''}{fmtPoints(Math.abs(p.pointsChange))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* ─── Points pool + distribution ─── */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} color="#F59E0B" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Pool & phân phối</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Tổng pool</span>
                  <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtPoints(data.prizePool)} pts
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 80 }}>Phân phối</span>
                  <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.4 }}>
                    {data.poolDistribution}
                  </span>
                </div>
              </div>
            </TrCard>

            {/* ─── I4: Full Fee Breakdown (auditability) ─── */}
            {data.feeBreakdown && (
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt size={14} color={c.accent} />
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Chi tiết phí (audit)</span>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 8, fontWeight: 700 }}>
                    VERIFIED
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Gross Pool', value: fmtPoints(data.feeBreakdown.grossPool), color: c.text1, bold: true },
                    { label: `Phí vận hành (${data.feeBreakdown.platformFeePct}%)`, value: `−${fmtPoints(data.feeBreakdown.platformFeeAmt)}`, color: '#EF4444' },
                    ...(data.feeBreakdown.creatorCutPct > 0 ? [{ label: `Creator cut (${data.feeBreakdown.creatorCutPct}%)`, value: `−${fmtPoints(data.feeBreakdown.creatorCutAmt)}`, color: '#EF4444' }] : []),
                    ...(data.feeBreakdown.consolationPct > 0 ? [{ label: `Thưởng an ủi (${data.feeBreakdown.consolationPct}%)`, value: `−${fmtPoints(data.feeBreakdown.consolationAmt)}`, color: '#8B5CF6' }] : []),
                    { label: 'Net Pool (đã phân bổ)', value: fmtPoints(data.feeBreakdown.netPool), color: '#10B981', bold: true },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between"
                      style={{ paddingLeft: !row.bold ? 8 : 0 }}>
                      <div className="flex items-center gap-1.5">
                        {!row.bold && <div className="w-1 h-1 rounded-full" style={{ background: row.color }} />}
                        <span style={{
                          color: row.bold ? c.text1 : c.text3,
                          fontSize: row.bold ? φ.xs : 11,
                          fontWeight: row.bold ? 700 : 500,
                        }}>{row.label}</span>
                      </div>
                      <span style={{
                        color: row.color,
                        fontSize: row.bold ? φ.sm : φ.xs,
                        fontWeight: row.bold ? 700 : 600,
                        fontFamily: 'monospace',
                      }}>
                        {row.value} pts
                      </span>
                    </div>
                  ))}
                </div>
              </TrCard>
            )}

            {/* ─── Settlement time ─── */}
            <TrCard className="p-4 flex items-center gap-3">
              <Clock size={14} color={c.text3} />
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 10 }}>Thời gian chốt</p>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{data.settlementTime}</p>
              </div>
            </TrCard>

            {/* ─── Ledger references ─── */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} color={c.accent} />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Mã tham chiếu sổ điểm</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {data.ledgerRefIds.map(ref => (
                  <div key={ref} className="flex items-center gap-2">
                    <span style={{ color: c.text1, fontSize: φ.xs, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                      {ref}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: 10 }}>Mã biên nhận</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>
                    {data.receiptId}
                  </span>
                  <button onClick={handleCopyReceipt} className="active:opacity-70" style={{ minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Copy size={10} color={c.text3} />
                  </button>
                </div>
              </div>
            </TrCard>

            {/* ─── N8: Enhanced Audit & Disclaimer notice ─── */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Shield size={12} color={c.accent} />
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>Tuyên bố miễn trừ & Audit</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={10} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Arena Points (pts) chỉ dùng trong hệ thống Open Arena. Pts <span style={{ fontWeight: 700 }}>không phải tài sản tài chính</span>, không có giá trị tiền tệ, không thể quy đổi ra tiền thật.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={10} color="#10B981" className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Biên nhận được tạo tự động, không thể chỉnh sửa, và được ghi nhận vào sổ điểm minh bạch.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={10} color={c.accent} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Nếu bạn cho rằng kết quả không chính xác, hãy sử dụng tính năng "Tranh chấp kết quả" trong vòng 48 giờ.
                  </p>
                </div>
              </div>
            </TrCard>

            {/* ─── Action buttons ─── */}
            <div className="flex gap-2">
              {onViewChallenge && (
                <button
                  onClick={() => { onViewChallenge(); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:opacity-70"
                  style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
                >
                  <Trophy size={12} /> Xem challenge
                </button>
              )}
              {onViewLedger && (
                <button
                  onClick={() => { onViewLedger(); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:opacity-70"
                  style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
                >
                  <BookOpen size={12} /> Sổ điểm
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl active:opacity-70"
                style={{ background: c.chipBg, border: `1.5px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
              >
                <Share2 size={12} />
              </button>
            </div>

          </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════
   Helper: Build receipt data from resolution + challenge
   ═══════════════════════════════════════════ */

export function buildReceiptFromResolution(
  challenge: { id: string; title: string; format: string; prizePool: number; participants?: { name: string; avatar: string }[]; platformFeePct?: number; creatorCutPct?: number; consolationPct?: number; consolationEnabled?: boolean },
  resolution: { method: string; resultProposal?: { winner: string; winnerAvatar: string; loser?: string; poolDistribution: string }; timeline: { label: string; date: string; done: boolean }[] },
  methodLabel: string,
): ResultReceiptData {
  const participants: ReceiptParticipant[] = [];

  if (resolution.resultProposal) {
    participants.push({
      name: resolution.resultProposal.winner,
      avatar: resolution.resultProposal.winnerAvatar,
      result: 'winner',
      pointsChange: Math.round(challenge.prizePool * 0.6),
    });
    if (resolution.resultProposal.loser) {
      participants.push({
        name: resolution.resultProposal.loser,
        avatar: '🎮',
        result: 'loser',
        pointsChange: -Math.round(challenge.prizePool * 0.3),
      });
    }
  } else if (challenge.participants) {
    challenge.participants.forEach((p, i) => {
      participants.push({
        name: p.name,
        avatar: p.avatar,
        result: i === 0 ? 'winner' : 'loser',
        pointsChange: i === 0 ? Math.round(challenge.prizePool * 0.6) : -Math.round(challenge.prizePool * 0.3),
      });
    });
  }

  const lastSettled = resolution.timeline.filter(t => t.done);
  const settlementTime = lastSettled.length > 0
    ? lastSettled[lastSettled.length - 1].date
    : '—';

  return {
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    format: challenge.format,
    resultLabel: resolution.resultProposal?.winner
      ? `${resolution.resultProposal.winner} thắng`
      : 'Đã chốt',
    winnerName: resolution.resultProposal?.winner || 'N/A',
    winnerAvatar: resolution.resultProposal?.winnerAvatar || '🏆',
    participants,
    prizePool: challenge.prizePool,
    poolDistribution: resolution.resultProposal?.poolDistribution || 'Theo quy tắc challenge',
    settlementTime,
    method: methodLabel,
    ledgerRefIds: [
      `LE-${challenge.id.toUpperCase()}-SET-001`,
      `LE-${challenge.id.toUpperCase()}-SET-002`,
    ],
    receiptId: `RCP-${challenge.id.toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    /* I4: fee breakdown */
    feeBreakdown: (() => {
      const feePct = challenge.platformFeePct ?? 10;
      const crPct = challenge.creatorCutPct ?? 0;
      const conPct = (challenge.consolationEnabled && challenge.consolationPct) ? challenge.consolationPct : 0;
      const gross = challenge.prizePool;
      const platformFeeAmt = Math.round(gross * feePct / 100);
      const creatorCutAmt = Math.round(gross * crPct / 100);
      const after = gross - platformFeeAmt - creatorCutAmt;
      const consolationAmt = Math.round(after * conPct / 100);
      const netPool = after - consolationAmt;
      return {
        grossPool: gross,
        platformFeePct: feePct,
        platformFeeAmt,
        creatorCutPct: crPct,
        creatorCutAmt,
        consolationPct: conPct,
        consolationAmt,
        netPool,
      };
    })(),
  };
}